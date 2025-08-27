import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Verificar se há tokens válidos na URL
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    
    if (accessToken && refreshToken) {
      // Definir a sessão com os tokens da URL
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ error }) => {
        if (error) {
          console.error('Erro ao definir sessão:', error);
          setIsValidToken(false);
        } else {
          setIsValidToken(true);
        }
      });
    } else {
      setIsValidToken(false);
    }
  }, [searchParams]);

  const validatePassword = (pwd: string) => {
    return pwd.length >= 6;
  };

  const passwordsMatch = password === confirmPassword && confirmPassword !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword(password)) {
      toast({
        title: "Senha inválida",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        title: "Senhas não coincidem",
        description: "As senhas digitadas não são iguais",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso",
      });

      // Redirecionar para a página de login após 2 segundos
      setTimeout(() => {
        navigate('/auth');
      }, 2000);

    } catch (error: any) {
      toast({
        title: "Erro ao alterar senha",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card shadow-card">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verificando link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card shadow-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <XCircle className="h-6 w-6 text-destructive" />
              Link Inválido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Este link para redefinição de senha é inválido ou expirou. 
                Solicite um novo link de recuperação.
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => navigate('/auth')}
              className="w-full mt-4 bg-gradient-amber text-primary-foreground shadow-amber hover:shadow-lg transition-all"
            >
              Voltar ao Login
            </Button>
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
            <KeyRound className="h-6 w-6 text-primary" />
            Nova Senha
          </CardTitle>
          <p className="text-muted-foreground">
            Digite sua nova senha
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  minLength={6}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {password && !validatePassword(password) && (
                <p className="text-sm text-destructive">
                  A senha deve ter pelo menos 6 caracteres
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-sm text-destructive">
                  As senhas não coincidem
                </p>
              )}
              {passwordsMatch && confirmPassword && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Senhas coincidem
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-amber text-primary-foreground shadow-amber hover:shadow-lg transition-all"
              disabled={isLoading || !passwordsMatch || !validatePassword(password)}
            >
              <KeyRound className="h-4 w-4 mr-2" />
              {isLoading ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}