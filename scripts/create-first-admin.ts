import { createClient } from '@supabase/supabase-js';
import { hash } from 'argon2';
import * as readline from 'readline';
import { config } from 'dotenv';

config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => { rl.close(); resolve(answer.trim()); });
  });
}

function generatePassword(length = 42): string {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function main() {
  console.log('\n=== Criar Primeiro Super-Admin ===\n');

  const args = process.argv.slice(2);
  let email = args.find(a => a.startsWith('--email='))?.split('=')[1] ?? '';
  let name = args.find(a => a.startsWith('--name='))?.split('=')[1] ?? '';

  if (!email) email = await prompt('E-mail do admin: ');
  if (!name) name = await prompt('Nome completo: ');

  if (!email || !name) {
    console.error('E-mail e nome são obrigatórios.');
    process.exit(1);
  }

  const { data: existing } = await supabase
    .from('platform_admins')
    .select('id, email')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (existing) {
    console.log(`\n⚠️  Admin com e-mail ${email} já existe (id: ${existing.id}).`);
    process.exit(0);
  }

  const tempPassword = generatePassword();
  const passwordHash = await hash(tempPassword);

  const { data: admin, error } = await supabase
    .from('platform_admins')
    .insert({
      email: email.toLowerCase(),
      full_name: name,
      password_hash: passwordHash,
      totp_enabled: false,
      totp_recovery_codes: [],
      is_active: true,
      failed_login_attempts: 0,
    })
    .select('id, email, full_name')
    .single();

  if (error) {
    console.error('\n❌ Erro ao criar admin:', error.message);
    process.exit(1);
  }

  console.log('\n✅ Admin criado com sucesso!\n');
  console.log(`   ID:    ${admin.id}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Nome:  ${admin.full_name}`);
  console.log(`\n🔑 Senha temporária:\n\n   ${tempPassword}\n`);
  console.log('⚠️  No primeiro login será solicitado a configurar o 2FA (Google Authenticator).');
  console.log('   Guarde a senha acima — ela NÃO será exibida novamente.\n');
}

main().catch(err => { console.error('Erro:', err); process.exit(1); });
