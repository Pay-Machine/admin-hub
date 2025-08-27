import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Clock, Shield, RefreshCw } from 'lucide-react';

interface ApprovalGateProps {
  children: ReactNode;
}

export const ApprovalGate = ({ children }: ApprovalGateProps) => {
  const { user, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error: any) {
      console.error('Erro ao buscar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
        <Card className="bg-card shadow-card">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verificando permissões...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se for superadmin, sempre permitir acesso
  if (userProfile?.user_role === 'superadmin') {
    return <>{children}</>;
  }

  // Se não foi aprovado ainda
  if (userProfile?.approval_status !== 'approved') {
    const handleLogout = async () => {
      await signOut();
    };

    const getStatusMessage = () => {
      switch (userProfile?.approval_status) {
        case 'pending':
          return {
            title: 'Aguardando Aprovação',
            description: 'Sua conta foi criada com sucesso, mas ainda precisa ser aprovada por um administrador. Você receberá um email quando sua conta for aprovada.',
            icon: <Clock className="h-12 w-12 text-orange-500 mx-auto mb-4" />,
            variant: 'default' as const,
          };
        case 'rejected':
          return {
            title: 'Conta Rejeitada',
            description: userProfile.rejected_reason || 'Sua conta foi rejeitada por um administrador. Entre em contato para mais informações.',
            icon: <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />,
            variant: 'destructive' as const,
          };
        default:
          return {
            title: 'Acesso Negado',
            description: 'Você não tem permissão para acessar este sistema.',
            icon: <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />,
            variant: 'destructive' as const,
          };
      }
    };

    const status = getStatusMessage();

    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card shadow-card">
          <CardHeader className="text-center">
            {status.icon}
            <CardTitle className="text-2xl font-bold text-foreground">
              {status.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant={status.variant}>
              <AlertDescription>
                {status.description}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {userProfile?.approval_status === 'pending' && (
                <Button
                  onClick={fetchUserProfile}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Verificar Status
                </Button>
              )}

              <Button
                onClick={handleLogout}
                className="w-full bg-gradient-amber text-primary-foreground shadow-amber hover:shadow-lg transition-all"
              >
                Sair da Conta
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Usuário: <strong>{userProfile?.full_name}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Email: <strong>{user?.email}</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se foi aprovado, permitir acesso
  return <>{children}</>;
};