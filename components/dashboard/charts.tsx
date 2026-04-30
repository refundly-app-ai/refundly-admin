'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import type { TimeSeriesData, ChartData } from '@/lib/types';

interface MRRChartProps {
  data: TimeSeriesData[];
}

export function MRRChart({ data }: MRRChartProps) {
  const formatValue = (value: number) => {
    return `$${(value / 1000).toFixed(0)}K`;
  };

  return (
    <Card className="col-span-2 bg-card border-border">
      <CardHeader>
        <CardTitle className="text-base font-medium">Receita Recorrente Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-75">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.65 0.18 250)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.65 0.18 250)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0 0)" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="oklch(0.6 0 0)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="oklch(0.6 0 0)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatValue}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(0.12 0 0)',
                  border: '1px solid oklch(0.22 0 0)',
                  borderRadius: '8px',
                  color: 'oklch(0.95 0 0)',
                }}
                formatter={(value: number) => [formatValue(value), 'MRR']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="oklch(0.65 0.18 250)"
                strokeWidth={2}
                fill="url(#mrrGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface SignupsChartProps {
  data: TimeSeriesData[];
}

export function SignupsChart({ data }: SignupsChartProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-base font-medium">Novos Cadastros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-75">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0 0)" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="oklch(0.6 0 0)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="oklch(0.6 0 0)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(0.12 0 0)',
                  border: '1px solid oklch(0.22 0 0)',
                  borderRadius: '8px',
                  color: 'oklch(0.95 0 0)',
                }}
                formatter={(value: number) => [value, 'Cadastros']}
              />
              <Bar
                dataKey="value"
                fill="oklch(0.7 0.15 175)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface TierDistributionChartProps {
  data: ChartData[];
}

export function TierDistributionChart({ data }: TierDistributionChartProps) {
  const COLORS = ['oklch(0.65 0.18 250)', 'oklch(0.7 0.15 175)', 'oklch(0.75 0.15 85)'];

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-base font-medium">Distribuição por Plano</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-75">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(0.12 0 0)',
                  border: '1px solid oklch(0.22 0 0)',
                  borderRadius: '8px',
                  color: 'oklch(0.95 0 0)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex justify-center gap-6">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: COLORS[index] }}
              />
              <span className="text-sm text-muted-foreground">
                {item.name}: {item.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface RequestsChartProps {
  data: TimeSeriesData[];
}

export function RequestsChart({ data }: RequestsChartProps) {
  return (
    <Card className="col-span-2 bg-card border-border">
      <CardHeader>
        <CardTitle className="text-base font-medium">Requisições de API (Últimas 24h)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-50">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0 0)" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="oklch(0.6 0 0)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                interval={3}
              />
              <YAxis
                stroke="oklch(0.6 0 0)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(0.12 0 0)',
                  border: '1px solid oklch(0.22 0 0)',
                  borderRadius: '8px',
                  color: 'oklch(0.95 0 0)',
                }}
                formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Requisições']}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="oklch(0.75 0.15 85)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
