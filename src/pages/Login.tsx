import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: "Błąd logowania",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/dashboard");
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Validate name (1-100 characters, no control characters)
    const trimmedName = name.trim();
    if (trimmedName.length === 0 || trimmedName.length > 100) {
      toast({
        title: "Błąd rejestracji",
        description: "Imię musi mieć od 1 do 100 znaków",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    
    // Check for control characters
    const controlCharRegex = /[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/;
    if (controlCharRegex.test(trimmedName)) {
      toast({
        title: "Błąd rejestracji",
        description: "Imię zawiera niedozwolone znaki",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: "Błąd rejestracji",
        description: "Hasło musi mieć co najmniej 6 znaków",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    
    const { error } = await signUp(email, password, name);
    
    if (error) {
      toast({
        title: "Błąd rejestracji",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sukces!",
        description: "Konto zostało utworzone. Możesz się teraz zalogować.",
      });
      navigate("/dashboard");
    }
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-800 mb-2">
            Centrum e-Learningu
          </h1>
          <p className="text-orange-600">Platforma Wikamp - Panel logowania</p>
        </div>

        <Card className="border-orange-200 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-orange-800">Witaj!</CardTitle>
            <CardDescription>Zaloguj się lub utwórz konto</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Logowanie</TabsTrigger>
                <TabsTrigger value="register">Rejestracja</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="twoj@email.pl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="border-orange-200 focus:border-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Hasło</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="border-orange-200 focus:border-orange-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    disabled={loading || !email || !password}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Logowanie...
                      </>
                    ) : (
                      "Zaloguj się"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Imię</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Jan Kowalski"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="border-orange-200 focus:border-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="twoj@email.pl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="border-orange-200 focus:border-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Hasło</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Min. 6 znaków"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="border-orange-200 focus:border-orange-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    disabled={loading || !email || !password || !name}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Rejestracja...
                      </>
                    ) : (
                      "Utwórz konto"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-orange-600 mt-4">
          © 2024 Centrum e-Learningu Politechniki Łódzkiej
        </p>
      </div>
    </div>
  );
};

export default Login;
