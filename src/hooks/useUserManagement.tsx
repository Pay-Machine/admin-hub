import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserProfile {
  id: string;
  user_id: string;
  cpf_masked: string; // Agora sempre mascarado por segurança
  full_name: string;
  user_role: 'superadmin' | 'admin' | 'user';
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  rejected_reason?: string;
  created_at: string;
  updated_at: string;
  // Dados do auth.users via join
  email?: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      // Usar função segura que mascara CPF e registra acesso
      const { data, error } = await supabase.rpc('admin_list_profiles');

      if (error) throw error;

      // Adicionar email placeholder - idealmente seria armazenado no perfil
      const usersWithAuthData = (data || []).map((profile) => ({
        ...profile,
        email: `user-${profile.user_id.slice(0, 8)}`, // Placeholder seguro
      }));

      setUsers(usersWithAuthData);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar usuários',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const approveUser = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('approve_user', {
        target_user_id: userId,
      });

      if (error) throw error;

      toast({
        title: 'Usuário aprovado',
        description: 'O usuário foi aprovado com sucesso',
      });

      await fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Erro ao aprovar usuário',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const rejectUser = async (userId: string, reason?: string) => {
    try {
      const { error } = await supabase.rpc('reject_user', {
        target_user_id: userId,
        reason: reason || null,
      });

      if (error) throw error;

      toast({
        title: 'Usuário rejeitado',
        description: 'O usuário foi rejeitado',
      });

      await fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Erro ao rejeitar usuário',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const changeUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      const { error } = await supabase.rpc('admin_change_user_role', {
        target_user_id: userId,
        new_role: newRole,
      });

      if (error) throw error;

      toast({
        title: 'Role atualizada',
        description: `Role do usuário alterada para ${newRole}`,
      });

      await fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Erro ao alterar role',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return {
    users,
    loading,
    approveUser,
    rejectUser,
    changeUserRole,
    refetch: fetchUsers,
  };
};