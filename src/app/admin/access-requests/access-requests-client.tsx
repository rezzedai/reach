'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { approveRequest, denyRequest } from './actions';
import { toast } from 'sonner';

interface AccessRequest {
  id: string;
  name: string;
  email: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
  reviewedAt: string | null;
}

interface Props {
  requests: AccessRequest[];
}

export function AccessRequestsClient({ requests }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [localRequests, setLocalRequests] = useState(requests);

  async function handleApprove(req: AccessRequest) {
    setLoading(req.id);
    const result = await approveRequest(req.id, req.email, req.name);
    setLoading(null);
    if (result.success) {
      toast.success(`Approved ${req.name}`);
      setLocalRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: 'approved' as const } : r))
      );
    } else {
      toast.error(result.error ?? 'Failed');
    }
  }

  async function handleDeny(req: AccessRequest) {
    setLoading(req.id);
    const result = await denyRequest(req.id, req.email, req.name);
    setLoading(null);
    if (result.success) {
      toast.success(`Denied ${req.name}`);
      setLocalRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: 'denied' as const } : r))
      );
    } else {
      toast.error(result.error ?? 'Failed');
    }
  }

  const statusBadge = (status: AccessRequest['status']) => {
    if (status === 'approved') return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
    if (status === 'denied') return <Badge className="bg-red-100 text-red-800">Denied</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  if (localRequests.length === 0) {
    return (
      <div className="rounded-md border py-12 text-center text-sm text-muted-foreground">
        No access requests yet.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {localRequests.map((req) => (
          <TableRow key={req.id}>
            <TableCell className="font-medium">{req.name}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{req.email}</TableCell>
            <TableCell className="max-w-xs">
              <p className="line-clamp-2 text-sm">{req.reason}</p>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {new Date(req.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell>{statusBadge(req.status)}</TableCell>
            <TableCell className="text-right">
              {req.status === 'pending' && (
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(req)}
                    disabled={loading === req.id}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeny(req)}
                    disabled={loading === req.id}
                  >
                    Deny
                  </Button>
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
