import React, { useState, useContext } from 'react';
import { AuthContext } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';

const AuthForm = () => {
  const { login, register } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados para login
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  // Estados para registro
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nombre: '',
    apellido: '',
    codigo_familia: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(loginData.email, loginData.password);
      if (!result.success) {
        setError(result.error);
      }
    } catch (err) {
      setError('Error inesperado al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validaciones
    if (registerData.password !== registerData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...dataToSend } = registerData;
      const result = await register(dataToSend);
      
      if (!result.success) {
        setError(result.error);
      } else {
        setSuccess('¡Registro exitoso! Bienvenido a Memoria Viva.');
      }
    } catch (err) {
      setError('Error inesperado al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-warm-lg">
            <span className="text-white text-3xl font-bold">📸</span>
          </div>
          <h1 className="text-4xl font-bold text-amber-900 mb-2 font-heading">Memoria Viva</h1>
          <p className="text-amber-700 text-lg">Tu álbum digital familiar</p>
        </div>

        {/* Auth Form */}
        <Card className="card-nostalgic animate-fade-in-scale">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800">
                Iniciar Sesión
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800">
                Registrarse
              </TabsTrigger>
            </TabsList>

            {/* Mensajes de error/éxito */}
            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}

            {/* Login Tab */}
            <TabsContent value="login">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-amber-900 font-heading">
                  Bienvenido de vuelta
                </CardTitle>
                <CardDescription className="text-center text-amber-600">
                  Ingresa tus credenciales para acceder a tus recuerdos familiares
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Correo electrónico</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      className="input-warm"
                      required
                      data-testid="login-email-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Tu contraseña"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="input-warm"
                      required
                      data-testid="login-password-input"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full btn-primary"
                    disabled={loading}
                    data-testid="login-submit-button"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Iniciando sesión...
                      </>
                    ) : (
                      '🏠 Ingresar a mis recuerdos'
                    )}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-amber-900 font-heading">
                  Crear cuenta familiar
                </CardTitle>
                <CardDescription className="text-center text-amber-600">
                  Únete o crea una nueva familia para compartir recuerdos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-nombre">Nombre</Label>
                      <Input
                        id="register-nombre"
                        type="text"
                        placeholder="Tu nombre"
                        value={registerData.nombre}
                        onChange={(e) => setRegisterData({ ...registerData, nombre: e.target.value })}
                        className="input-warm"
                        required
                        data-testid="register-nombre-input"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-apellido">Apellido</Label>
                      <Input
                        id="register-apellido"
                        type="text"
                        placeholder="Tu apellido"
                        value={registerData.apellido}
                        onChange={(e) => setRegisterData({ ...registerData, apellido: e.target.value })}
                        className="input-warm"
                        required
                        data-testid="register-apellido-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Correo electrónico</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      className="input-warm"
                      required
                      data-testid="register-email-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Contraseña</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        className="input-warm"
                        required
                        data-testid="register-password-input"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-confirm-password">Confirmar</Label>
                      <Input
                        id="register-confirm-password"
                        type="password"
                        placeholder="Repite la contraseña"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        className="input-warm"
                        required
                        data-testid="register-confirm-password-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-codigo-familia">Código de familia (opcional)</Label>
                    <Input
                      id="register-codigo-familia"
                      type="text"
                      placeholder="Déjalo vacío para crear nueva familia"
                      value={registerData.codigo_familia}
                      onChange={(e) => setRegisterData({ ...registerData, codigo_familia: e.target.value })}
                      className="input-warm"
                      data-testid="register-codigo-familia-input"
                    />
                    <p className="text-xs text-amber-600">
                      Si tienes un código de familia, ingrésalo aquí. Si no, se creará una nueva familia.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full btn-primary"
                    disabled={loading}
                    data-testid="register-submit-button"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Registrando...
                      </>
                    ) : (
                      '✨ Crear mi cuenta familiar'
                    )}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-amber-700 text-sm">
          <p>Comparte y preserva los momentos más preciados con tu familia</p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;