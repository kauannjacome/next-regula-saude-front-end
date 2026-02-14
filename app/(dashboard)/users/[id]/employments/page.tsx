'use client';

import { useState, useEffect, use } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Briefcase, Building2, Trash2, Plus, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Employment {
  id: number;
  subscriberId: number;
  userId: string;
  roleId: string;
  unit_id: number | null;
  isActive: boolean;
  isPrimary: boolean;
  subscriber: {
    id: number;
    name: string;
    municipalityName: string;
  };
  unit: {
    id: number;
    name: string;
  } | null;
  tenantRole: {
    id: string;
    name: string;
    displayName: string;
  } | null;
}

interface Subscriber {
  id: number;
  name: string;
  municipalityName: string;
}

interface TenantRole {
  id: string;
  name: string;
  displayName: string;
}

export default function UserEmploymentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: userId } = use(params);
  const [employments, setEmployments] = useState<Employment[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [roles, setRoles] = useState<TenantRole[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form states
  const [selectedSubscriber, setSelectedSubscriber] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isPrimary, setIsPrimary] = useState(false);

  const fetchEmployments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}/employments`);
      const data = await response.json();
      if (response.ok) {
        setEmployments(data);
      } else {
        toast.error('Erro ao carregar vínculos');
      }
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      // Fetch Subscribers (simplified - might need pagination/search in real app)
      const subResponse = await fetch('/api/admin/subscribers?limit=100');
      const subData = await subResponse.json();
      if (subData.subscribers) setSubscribers(subData.subscribers);

      // Fetch Roles
      const roleResponse = await fetch('/api/tenant/roles');
      const roleData = await roleResponse.json();
      if (roleData && roleData.roles) setRoles(roleData.roles);

    } catch {
      console.error('Error fetching dependencies');
    }
  };
  useEffect(() => {
    fetchEmployments();
    fetchDependencies();
  }, [userId]);

  const handleCreateEmployment = async () => {
    if (!selectedSubscriber || !selectedRole) {
      toast.warning('Selecione Assinante e Cargo');
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}/employments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriberId: selectedSubscriber,
          roleId: selectedRole, // Sending ID string (uuid)
          isPrimary
        }),
      });

      if (response.ok) {
        toast.success('Vínculo criado com sucesso');
        setIsDialogOpen(false);
        fetchEmployments();
        // Reset form
        setSelectedSubscriber('');
        setSelectedRole('');
        setIsPrimary(false);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao criar vínculo');
      }
    } catch {
      toast.error('Erro ao criar vínculo');
    }
  };

  const handleDeleteEmployment = async (employmentId: number) => {
    if (!confirm('Tem certeza que deseja remover este vínculo?')) return;

    try {
      const response = await fetch(`/api/users/${userId}/employments/${employmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Vínculo removido');
        setEmployments(prev => prev.filter(e => e.id !== employmentId));
      } else {
        toast.error('Erro ao remover vínculo');
      }
    } catch {
      toast.error('Erro ao remover vínculo');
    }
  };

  const handleToggleActive = async (employmentId: number, currentStatus: boolean) => {
    try {
        const response = await fetch(`/api/users/${userId}/employments/${employmentId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: !currentStatus })
        });

        if (response.ok) {
            setEmployments(prev => prev.map(e => 
                e.id === employmentId ? { ...e, isActive: !currentStatus } : e
            ));
            toast.success('Status atualizado');
        }
    } catch {
        toast.error('Erro ao atualizar status');
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Gestão de Vínculos"
        description="Gerencie os vínculos do usuário com assinantes e unidades"
        icon={Briefcase}
        backHref={`/users/${userId}`}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Vínculo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Vínculo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Assinante</Label>
                  <Select value={selectedSubscriber} onValueChange={setSelectedSubscriber}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o assinante" />
                    </SelectTrigger>
                    <SelectContent>
                      {subscribers.map(sub => (
                        <SelectItem key={sub.id} value={sub.id.toString()}>
                          {sub.name} ({sub.municipalityName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Cargo</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch 
                    id="primary" 
                    checked={isPrimary} 
                    onCheckedChange={setIsPrimary} 
                  />
                  <Label htmlFor="primary">Vínculo Principal?</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateEmployment}>Salvar Vínculo</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Vínculos Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : employments.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
                <Briefcase className="mx-auto h-10 w-10 mb-4 opacity-20" />
                <p>Nenhum vínculo encontrado para este usuário.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assinante</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employments.map((employment) => (
                  <TableRow key={employment.id}>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="font-medium">{employment.subscriber.name}</span>
                            <span className="text-xs text-muted-foreground">{employment.subscriber.municipalityName}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline" className="flex w-fit items-center gap-1">
                            <Shield className="h-3 w-3" />
                            {employment.tenantRole?.displayName || 'Sem Cargo'}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        {employment.unit ? (
                            <div className="flex items-center gap-1">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span>{employment.unit.name}</span>
                            </div>
                        ) : (
                            <span className="text-muted-foreground italic">Todas</span>
                        )}
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <Switch 
                                checked={employment.isActive} 
                                onCheckedChange={() => handleToggleActive(employment.id, employment.isActive)}
                            />
                            <span className="text-sm">{employment.isActive ? 'Ativo' : 'Inativo'}</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteEmployment(employment.id)}
                            title="Remover Vínculo"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

