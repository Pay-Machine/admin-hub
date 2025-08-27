import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle,
  Loader2
} from 'lucide-react';
import { useUserManagement, UserProfile } from '@/hooks/useUserManagement';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function UserManagement() {
  const { users, loading, approveUser, rejectUser, changeUserRole } = useUserManagement();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'changeRole' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('admin');
  const [isProcessing, setIsProcessing] = useState(false);

  const getStatusBadge = (status: UserProfile['approval_status']) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const getRoleBadge = (role: UserProfile['user_role']) => {
    switch (role) {
      case 'superadmin':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Superadmin</Badge>;
      case 'admin':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Admin</Badge>;
      default:
        return <Badge variant="outline">Usuário</Badge>;
    }
  };

  const handleAction = async () => {
    if (!selectedUser || !actionType) return;

    setIsProcessing(true);
    try {
      switch (actionType) {
        case 'approve':
          await approveUser(selectedUser.user_id);
          break;
        case 'reject':
          await rejectUser(selectedUser.user_id, rejectReason);
          break;
        case 'changeRole':
          await changeUserRole(selectedUser.user_id, newRole);
          break;
      }
      closeDialog();
    } finally {
      setIsProcessing(false);
    }
  };

  const closeDialog = () => {
    setSelectedUser(null);
    setActionType(null);
    setRejectReason('');
    setNewRole('admin');
  };

  const openDialog = (user: UserProfile, type: 'approve' | 'reject' | 'changeRole') => {
    setSelectedUser(user);
    setActionType(type);
    setNewRole(user.user_role === 'superadmin' ? 'admin' : user.user_role as 'admin' | 'user');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  const pendingUsers = users.filter(u => u.approval_status === 'pending');
  const approvedUsers = users.filter(u => u.approval_status === 'approved');
  const rejectedUsers = users.filter(u => u.approval_status === 'rejected');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Gerenciamento de Usuários</h2>
          <p className="text-muted-foreground">
            Gerencie aprovações e permissões dos usuários do sistema
          </p>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-foreground">{pendingUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aprovados</p>
                <p className="text-2xl font-bold text-foreground">{approvedUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rejeitados</p>
                <p className="text-2xl font-bold text-foreground">{rejectedUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de usuários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastrado</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.cpf_masked}</TableCell>
                    <TableCell>{getRoleBadge(user.user_role)}</TableCell>
                    <TableCell>{getStatusBadge(user.approval_status)}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(user.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {user.approval_status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => openDialog(user, 'approve')}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openDialog(user, 'reject')}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {user.user_role !== 'superadmin' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDialog(user, 'changeRole')}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhum usuário encontrado
              </h3>
              <p className="text-muted-foreground">
                Os usuários aparecerão aqui quando se cadastrarem
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para ações */}
      <Dialog open={!!selectedUser} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Aprovar Usuário'}
              {actionType === 'reject' && 'Rejeitar Usuário'}
              {actionType === 'changeRole' && 'Alterar Role'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' && 
                `Tem certeza que deseja aprovar ${selectedUser?.full_name}? O usuário poderá acessar o sistema.`
              }
              {actionType === 'reject' && 
                `Tem certeza que deseja rejeitar ${selectedUser?.full_name}? O usuário não poderá acessar o sistema.`
              }
              {actionType === 'changeRole' && 
                `Alterar a role de ${selectedUser?.full_name}.`
              }
            </DialogDescription>
          </DialogHeader>

          {actionType === 'reject' && (
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da rejeição (opcional)</Label>
              <Textarea
                id="reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explique o motivo da rejeição..."
                rows={3}
              />
            </div>
          )}

          {actionType === 'changeRole' && (
            <div className="space-y-2">
              <Label htmlFor="role">Nova Role</Label>
              <Select value={newRole} onValueChange={(value: 'admin' | 'user') => setNewRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="user">Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button
              onClick={handleAction}
              disabled={isProcessing}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
              className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : undefined}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {actionType === 'approve' && 'Aprovar'}
              {actionType === 'reject' && 'Rejeitar'}
              {actionType === 'changeRole' && 'Alterar Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}