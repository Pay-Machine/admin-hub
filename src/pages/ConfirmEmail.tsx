import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Mail, Loader2 } from 'lucide-react';

export default function ConfirmEmail() {
  const [isLoading, setIsLoading] = useState(true);
  const [confirmationStatus, setConfirmationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        
        if (!token || type !== 'signup') {
          setConfirmationStatus('error');
          setErrorMessage('Link de confirmação inválido');
          setIsLoading(false);
          return;
        }

        // Verificar a sessão atual e confirmar o email
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email'
        });

        if (error) {
          console.error('Erro na confirmação:', error);
          setConfirmationStatus('error');
          setErrorMessage(error.message || 'Erro ao confirmar email');
        } else {
          setConfirmationStatus('success');
          toast({
            title: "Email confirmado",
            description: "Sua conta foi ativada com sucesso",
          });
          
          // Redirecionar para login após 3 segundos
          setTimeout(() => {
            navigate('/auth');
          }, 3000);
        }
      } catch (error: any) {
        console.error('Erro inesperado:', error);
        setConfirmationStatus('error');
        setErrorMessage('Erro inesperado ao confirmar email');
      } finally {
        setIsLoading(false);
      }
    };

    confirmEmail();
  }, [searchParams, navigate, toast]);

  if (isLoading || confirmationStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card shadow-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <Mail className="h-6 w-6 text-primary" />
              Confirmando Email
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">
              Verificando sua confirmação de email...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (confirmationStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card shadow-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Email Confirmado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Seu email foi confirmado com sucesso! Sua conta agora está ativa e você pode fazer login.
              </AlertDescription>
            </Alert>
            
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Você será redirecionado para a tela de login em alguns segundos...
              </p>
              
              <Button
                onClick={() => navigate('/auth')}
                className="w-full bg-gradient-amber text-primary-foreground shadow-amber hover:shadow-lg transition-all"
              >
                Ir para Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card shadow-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
            <XCircle className="h-6 w-6 text-destructive" />
            Erro na Confirmação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {errorMessage || 'Não foi possível confirmar seu email. O link pode estar expirado ou inválido.'}
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/auth')}
              className="w-full bg-gradient-amber text-primary-foreground shadow-amber hover:shadow-lg transition-all"
            >
              Voltar ao Login
            </Button>
            
            <p className="text-sm text-muted-foreground text-center">
              Se você continuar tendo problemas, tente criar uma nova conta ou entre em contato com o suporte.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}