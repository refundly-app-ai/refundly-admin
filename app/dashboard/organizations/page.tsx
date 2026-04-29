'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/dashboard/data-table';
import { organizations } from '@/lib/mock-data';
import type { Organization, OrganizationStatus, OrganizationTier } from '@/lib/types';
import {
  MoreHorizontal,
  Plus,
  Eye,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  Building2,
  Users,
  DollarSign,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const statusColors: Record<OrganizationStatus, string> = {
  active: 'bg-success/20 text-success border-success/30',
  suspended: 'bg-warning/20 text-warning border-warning/30',
  churned: 'bg-destructive/20 text-destructive border-destructive/30',
  trial: 'bg-info/20 text-info border-info/30',
};

const tierColors: Record<OrganizationTier, string> = {
  free: 'bg-muted text-muted-foreground',
  pro: 'bg-chart-1/20 text-chart-1 border-chart-1/30',
  enterprise: 'bg-chart-3/20 text-chart-3 border-chart-3/30',
};

export default function OrganizationsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const columns = [
    {
      key: 'name',
      header: 'Organization',
      cell: (org: Organization) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {org.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground">{org.name}</p>
            <p className="text-xs text-muted-foreground">{org.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (org: Organization) => (
        <Badge className={statusColors[org.status]}>{org.status}</Badge>
      ),
    },
    {
      key: 'tier',
      header: 'Tier',
      cell: (org: Organization) => (
        <Badge className={tierColors[org.tier]}>{org.tier}</Badge>
      ),
    },
    {
      key: 'members',
      header: 'Members',
      cell: (org: Organization) => (
        <span className="text-muted-foreground">{org.memberCount}</span>
      ),
    },
    {
      key: 'mrr',
      header: 'MRR',
      cell: (org: Organization) => (
        <span className="font-mono text-foreground">
          ${org.mrr.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'healthScore',
      header: 'Health',
      cell: (org: Organization) => {
        const color =
          org.healthScore >= 80
            ? 'text-success'
            : org.healthScore >= 50
              ? 'text-warning'
              : 'text-destructive';
        return <span className={`font-mono ${color}`}>{org.healthScore}%</span>;
      },
    },
    {
      key: 'lastActive',
      header: 'Last Active',
      cell: (org: Organization) => (
        <span className="text-muted-foreground text-sm">
          {formatDistanceToNow(new Date(org.lastActiveAt), { addSuffix: true })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (org: Organization) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setSelectedOrg(org);
                setDetailsDialogOpen(true);
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {org.status === 'active' ? (
              <DropdownMenuItem className="text-warning">
                <Ban className="mr-2 h-4 w-4" />
                Suspend
              </DropdownMenuItem>
            ) : org.status === 'suspended' ? (
              <DropdownMenuItem className="text-success">
                <CheckCircle className="mr-2 h-4 w-4" />
                Reactivate
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filters = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'suspended', label: 'Suspended' },
        { value: 'churned', label: 'Churned' },
        { value: 'trial', label: 'Trial' },
      ],
    },
    {
      key: 'tier',
      label: 'Tier',
      options: [
        { value: 'free', label: 'Free' },
        { value: 'pro', label: 'Pro' },
        { value: 'enterprise', label: 'Enterprise' },
      ],
    },
  ];

  // Stats
  const stats = {
    total: organizations.length,
    active: organizations.filter((o) => o.status === 'active').length,
    totalMRR: organizations.reduce((sum, o) => sum + o.mrr, 0),
    totalMembers: organizations.reduce((sum, o) => sum + o.memberCount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Organizations</h1>
          <p className="text-sm text-muted-foreground">
            Manage all organizations on the platform
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Organization
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Organizations
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total MRR
            </CardTitle>
            <DollarSign className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalMRR.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Members
            </CardTitle>
            <Users className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <DataTable
            data={organizations}
            columns={columns}
            searchPlaceholder="Search organizations..."
            searchKey="name"
            filters={filters}
          />
        </CardContent>
      </Card>

      {/* Create Organization Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Add a new organization to the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Organization name" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" placeholder="organization-slug" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tier">Tier</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="domain">Domain</Label>
              <Input id="domain" placeholder="example.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setCreateDialogOpen(false)}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Organization Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedOrg?.name}</DialogTitle>
            <DialogDescription>{selectedOrg?.domain}</DialogDescription>
          </DialogHeader>
          {selectedOrg && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={statusColors[selectedOrg.status]}>
                    {selectedOrg.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tier</p>
                  <Badge className={tierColors[selectedOrg.tier]}>
                    {selectedOrg.tier}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Members</p>
                  <p className="font-medium">{selectedOrg.memberCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">MRR</p>
                  <p className="font-mono font-medium">
                    ${selectedOrg.mrr.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Health Score</p>
                  <p className="font-medium">{selectedOrg.healthScore}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Compliance Score</p>
                  <p className="font-medium">{selectedOrg.complianceScore}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Industry</p>
                  <p className="font-medium">{selectedOrg.industry}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Country</p>
                  <p className="font-medium">{selectedOrg.country}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Feature Flags</p>
                <div className="flex flex-wrap gap-2">
                  {selectedOrg.featureFlags.length > 0 ? (
                    selectedOrg.featureFlags.map((flag) => (
                      <Badge key={flag} variant="secondary">
                        {flag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No flags enabled</span>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
            <Button>Edit Organization</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
