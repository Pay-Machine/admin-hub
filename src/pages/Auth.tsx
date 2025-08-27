import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { LogIn, UserPlus, KeyRound } from 'lucide-react';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [activeTab, setActiveTab] = useState('login');
  
  const { signIn, signUp, resetPassword, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    return formatted;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (!error) {
      navigate('/');
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signUp(email, password, fullName, cpf.replace(/\D/g, ''));
    
    if (!error) {
      setActiveTab('login');
      setEmail('');
      setPassword('');
      setFullName('');
      setCpf('');
    }
    
    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    await resetPassword(resetEmail);
    setResetEmail('');
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card shadow-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">
            Sistema Administrativo
          </CardTitle>
          <p className="text-muted-foreground">
            Acesso restrito a administradores
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Cadastro</TabsTrigger>
              <TabsTrigger value="reset">Recuperar</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Importante:</strong> Após criar sua conta, confirme seu email antes de tentar fazer login.
                </p>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="seu@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-amber text-primary-foreground shadow-amber hover:shadow-lg transition-all"
                  disabled={isLoading}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="João da Silva"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-cpf">CPF</Label>
                  <Input
                    id="signup-cpf"
                    type="text"
                    value={cpf}
                    onChange={handleCPFChange}
                    required
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="seu@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-amber text-primary-foreground shadow-amber hover:shadow-lg transition-all"
                  disabled={isLoading}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {isLoading ? 'Cadastrando...' : 'Cadastrar'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="reset" className="space-y-4">
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    placeholder="seu@email.com"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-amber text-primary-foreground shadow-amber hover:shadow-lg transition-all"
                  disabled={isLoading}
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  {isLoading ? 'Enviando...' : 'Recuperar Senha'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}