'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SystemHealth } from '@/lib/types';

interface SystemHealthCardProps {
  services: SystemHealth[];
}

export function SystemHealthCard({ services }: SystemHealthCardProps) {
  const getStatusColor = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-success';
      case 'degraded':
        return 'bg-warning';
      case 'down':
        return 'bg-destructive';
    }
  };

  const getStatusBadge = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-success/20 text-success border-success/30">Saudável</Badge>;
      case 'degraded':
        return <Badge className="bg-warning/20 text-warning border-warning/30">Degradado</Badge>;
      case 'down':
        return <Badge variant="destructive">Fora</Badge>;
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-base font-medium">Status dos Serviços</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {services.map((service) => (
            <div
              key={service.service}
              className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3"
            >
              <div className="flex items-center gap-3">
                <div className={cn('h-2 w-2 rounded-full', getStatusColor(service.status))} />
                <div>
                  <p className="text-sm font-medium text-foreground">{service.service}</p>
                  <p className="text-xs text-muted-foreground">
                    {service.latency}ms latência | {service.uptime}% uptime
                  </p>
                </div>
              </div>
              {getStatusBadge(service.status)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
