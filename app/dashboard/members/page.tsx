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
import { members, organizations } from '@/lib/mock-data';
import type { Member, MemberRole, MemberStatus } from '@/lib/types';
import {
  MoreHorizontal,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  Users,
  Shield,
  Key,
  UserCog,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const statusColors: Record<MemberStatus, string> = {
  active: 'bg-success/20 text-success border-success/30',
  invited: 'bg-info/20 text-info border-info/30',
  suspended: 'bg-warning/20 text-warning border-warning/30',
  deactivated: 'bg-muted text-muted-foreground',
};

const roleColors: Record<MemberRole, string> = {
  owner: 'bg-chart-3/20 text-chart-3 border-chart-3/30',
  admin: 'bg-chart-1/20 text-chart-1 border-chart-1/30',
  member: 'bg-muted text-muted-foreground',
  viewer: 'bg-muted text-muted-foreground',
};

export default function MembersPage() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [impersonateDialogOpen, setImpersonateDialogOpen] = useState(false);

  const columns = [
    {
      key: 'name',
      header: 'Member',
      cell: (member: Member) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {member.name.split(' ').map((n) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground">{member.name}</p>
            <p className="text-xs text-muted-foreground">{member.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'organization',
      header: 'Organization',
      cell: (member: Member) => (
        <span className="text-muted-foreground">{member.organizationName}</span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      cell: (member: Member) => (
        <Badge className={roleColors[member.role]}>{member.role}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (member: Member) => (
        <Badge className={statusColors[member.status]}>{member.status}</Badge>
      ),
    },
    {
      key: 'mfa',
      header: 'MFA',
      cell: (member: Member) =>
        member.mfaEnabled ? (
          <Badge className="bg-success/20 text-success border-success/30">
            <Shield className="mr-1 h-3 w-3" />
            Enabled
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Disabled
          </Badge>
        ),
    },
    {
      key: 'sessions',
      header: 'Sessions',
      cell: (member: Member) => (
        <span className="text-muted-foreground">{member.sessionsCount}</span>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      cell: (member: Member) => (
        <span className="text-muted-foreground text-sm">
          {member.lastLoginAt
            ? formatDistanceToNow(new Date(member.lastLoginAt), { addSuffix: true })
            : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (member: Member) => (
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
                setSelectedMember(member);
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
            <DropdownMenuItem
              onClick={() => {
                setSelectedMember(member);
                setImpersonateDialogOpen(true);
              }}
            >
              <UserCog className="mr-2 h-4 w-4" />
              Impersonate
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Key className="mr-2 h-4 w-4" />
              Reset Password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {member.status === 'active' ? (
              <DropdownMenuItem className="text-warning">
                <Ban className="mr-2 h-4 w-4" />
                Suspend
              </DropdownMenuItem>
            ) : member.status === 'suspended' ? (
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
        { value: 'invited', label: 'Invited' },
        { value: 'suspended', label: 'Suspended' },
        { value: 'deactivated', label: 'Deactivated' },
      ],
    },
    {
      key: 'role',
      label: 'Role',
      options: [
        { value: 'owner', label: 'Owner' },
        { value: 'admin', label: 'Admin' },
        { value: 'member', label: 'Member' },
        { value: 'viewer', label: 'Viewer' },
      ],
    },
  ];

  // Stats
  const stats = {
    total: members.length,
    active: members.filter((m) => m.status === 'active').length,
    mfaEnabled: members.filter((m) => m.mfaEnabled).length,
    admins: members.filter((m) => m.role === 'admin' || m.role === 'owner').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Members</h1>
          <p className="text-sm text-muted-foreground">
            Manage all platform members across organizations
          </p>
        </div>
        <Button onClick={() => setInviteDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Members
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
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
              MFA Enabled
            </CardTitle>
            <Shield className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mfaEnabled}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.mfaEnabled / stats.total) * 100)}% adoption
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Admins & Owners
            </CardTitle>
            <UserCog className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <DataTable
            data={members}
            columns={columns}
            searchPlaceholder="Search members..."
            searchKey="name"
            filters={filters}
          />
        </CardContent>
      </Card>

      {/* Invite Member Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>
              Send an invitation to a new member.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="email@example.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="organization">Organization</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setInviteDialogOpen(false)}>Send Invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedMember?.name}</DialogTitle>
            <DialogDescription>{selectedMember?.email}</DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={statusColors[selectedMember.status]}>
                    {selectedMember.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <Badge className={roleColors[selectedMember.role]}>
                    {selectedMember.role}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Organization</p>
                  <p className="font-medium">{selectedMember.organizationName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">MFA</p>
                  <p className="font-medium">
                    {selectedMember.mfaEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Sessions</p>
                  <p className="font-medium">{selectedMember.sessionsCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Login</p>
                  <p className="font-medium">
                    {selectedMember.lastLoginAt
                      ? formatDistanceToNow(new Date(selectedMember.lastLoginAt), {
                          addSuffix: true,
                        })
                      : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
            <Button>Edit Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Impersonation Dialog */}
      <Dialog open={impersonateDialogOpen} onOpenChange={setImpersonateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Impersonate User</DialogTitle>
            <DialogDescription>
              You are about to impersonate {selectedMember?.name}. This action will be logged.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason for impersonation</Label>
              <Input id="reason" placeholder="Support ticket #1234" />
            </div>
            <div className="rounded-lg border border-warning/50 bg-warning/10 p-3">
              <p className="text-sm text-warning">
                Impersonation sessions are logged and audited. Only use this feature for legitimate support purposes.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImpersonateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-warning text-warning-foreground hover:bg-warning/90"
              onClick={() => setImpersonateDialogOpen(false)}
            >
              Start Impersonation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
