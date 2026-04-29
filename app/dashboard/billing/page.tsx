'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/dashboard/data-table';
import { subscriptions, invoices } from '@/lib/mock-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Subscription, Invoice, SubscriptionStatus } from '@/lib/types';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Download,
  ExternalLink,
  MoreHorizontal,
  Eye,
  Edit,
  RefreshCw,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

const subscriptionStatusColors: Record<SubscriptionStatus, string> = {
  active: 'bg-success/20 text-success border-success/30',
  past_due: 'bg-destructive/20 text-destructive border-destructive/30',
  canceled: 'bg-muted text-muted-foreground',
  trialing: 'bg-info/20 text-info border-info/30',
};

const invoiceStatusColors: Record<string, string> = {
  paid: 'bg-success/20 text-success border-success/30',
  open: 'bg-warning/20 text-warning border-warning/30',
  draft: 'bg-muted text-muted-foreground',
  void: 'bg-muted text-muted-foreground',
  uncollectible: 'bg-destructive/20 text-destructive border-destructive/30',
};

export default function BillingPage() {
  // Stats
  const totalMRR = subscriptions.reduce((sum, s) => sum + s.mrr, 0);
  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active').length;
  const pastDue = subscriptions.filter((s) => s.status === 'past_due').length;
  const unpaidInvoices = invoices.filter((i) => i.status === 'open').length;

  const subscriptionColumns = [
    {
      key: 'organization',
      header: 'Organization',
      cell: (sub: Subscription) => (
        <span className="font-medium text-foreground">{sub.organizationName}</span>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      cell: (sub: Subscription) => (
        <Badge variant="secondary">{sub.plan}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (sub: Subscription) => (
        <Badge className={subscriptionStatusColors[sub.status]}>
          {sub.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'mrr',
      header: 'MRR',
      cell: (sub: Subscription) => (
        <span className="font-mono text-foreground">
          ${sub.mrr.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'period',
      header: 'Current Period',
      cell: (sub: Subscription) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(sub.currentPeriodStart), 'MMM d')} - {format(new Date(sub.currentPeriodEnd), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (sub: Subscription) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Change Plan
            </DropdownMenuItem>
            <DropdownMenuItem>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync with Stripe
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Cancel Subscription
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const invoiceColumns = [
    {
      key: 'organization',
      header: 'Organization',
      cell: (inv: Invoice) => (
        <span className="font-medium text-foreground">{inv.organizationName}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      cell: (inv: Invoice) => (
        <span className="font-mono text-foreground">
          ${inv.amount.toLocaleString()} {inv.currency.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (inv: Invoice) => (
        <Badge className={invoiceStatusColors[inv.status]}>{inv.status}</Badge>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      cell: (inv: Invoice) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(inv.dueDate), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      key: 'paidAt',
      header: 'Paid At',
      cell: (inv: Invoice) => (
        <span className="text-sm text-muted-foreground">
          {inv.paidAt ? format(new Date(inv.paidAt), 'MMM d, yyyy') : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: () => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
          <p className="text-sm text-muted-foreground">
            Manage subscriptions and invoices
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <ExternalLink className="mr-2 h-4 w-4" />
            Stripe Dashboard
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total MRR
            </CardTitle>
            <DollarSign className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMRR.toLocaleString()}</div>
            <div className="mt-1 flex items-center gap-1 text-xs text-success">
              <TrendingUp className="h-3 w-3" />
              +12.5% vs last month
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Subscriptions
            </CardTitle>
            <CreditCard className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Past Due
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{pastDue}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unpaid Invoices
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{unpaidInvoices}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <DataTable
                data={subscriptions}
                columns={subscriptionColumns}
                searchPlaceholder="Search subscriptions..."
                searchKey="organizationName"
                filters={[
                  {
                    key: 'status',
                    label: 'Status',
                    options: [
                      { value: 'active', label: 'Active' },
                      { value: 'past_due', label: 'Past Due' },
                      { value: 'canceled', label: 'Canceled' },
                      { value: 'trialing', label: 'Trialing' },
                    ],
                  },
                  {
                    key: 'plan',
                    label: 'Plan',
                    options: [
                      { value: 'Pro', label: 'Pro' },
                      { value: 'Enterprise', label: 'Enterprise' },
                    ],
                  },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <DataTable
                data={invoices}
                columns={invoiceColumns}
                searchPlaceholder="Search invoices..."
                searchKey="organizationName"
                filters={[
                  {
                    key: 'status',
                    label: 'Status',
                    options: [
                      { value: 'paid', label: 'Paid' },
                      { value: 'open', label: 'Open' },
                      { value: 'draft', label: 'Draft' },
                      { value: 'void', label: 'Void' },
                    ],
                  },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
