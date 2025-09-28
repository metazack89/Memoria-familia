import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

const FamiliaSettings = () => {
  const { api, user } = useContext(AuthContext);
  const [familia, setFamilia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [codigoInvitacion, setCodigoInvitacion] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    loadFamiliaInfo();
    if (user?.rol === 'admin') {
      loadCodigoInvitacion();
    }
  }, [user]);

  const loadFamiliaInfo = async () => {
    try {
      setLoading(true);
      const response = await api.get('/familia');
      setFamilia(response.data);
    } catch (error) {
      console.error('Error cargando información de familia:', error);
      setError('Error al cargar la información de la familia');
    } finally {
      setLoading(false);
    }
  };

  const loadCodigoInvitacion = async () => {
    try {
      const response = await api.get('/familia/codigo-invitacion');
      setCodigoInvitacion(response.data.codigo_invitacion);
    } catch (error) {
      console.error('Error cargando código de invitación:', error);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(codigoInvitacion);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Error copiando al portapapeles:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleBadgeColor = (rol) => {
    return rol === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800';
  };

  const getRoleIcon = (rol) => {
    return rol === 'admin' ? '👑' : '👨‍👩‍👧‍👦';
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
          <p className="text-amber-700 font-medium">Cargando información familiar...</p>
        </div>
      </div>
    );
  }

  if (!familia) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-amber-800 mb-2">Error al cargar información</h3>
          <p className="text-amber-600 mb-4">No se pudo cargar la información de la familia</p>
          <Button onClick={loadFamiliaInfo} className="btn-primary">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-amber-900 mb-2 font-heading">
            ⚙️ Configuración Familiar
          </h2>
          <p className="text-amber-700">
            Gestiona tu familia y sus miembros en Memoria Viva
          </p>
        </div>

        {/* Messages */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información de la Familia */}
          <Card className="card-nostalgic" data-testid="family-info-card">
            <CardHeader>
              <CardTitle className="text-amber-900 font-heading flex items-center space-x-2">
                <span>👨‍👩‍👧‍👦</span>
                <span>Información de la Familia</span>
              </CardTitle>
              <CardDescription>
                Detalles básicos de tu familia en Memoria Viva
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-amber-700 font-medium">Nombre de la Familia</Label>
                <p className="text-lg text-amber-900 font-semibold mt-1">{familia.nombre}</p>
              </div>
              
              {familia.descripcion && (
                <div>
                  <Label className="text-amber-700 font-medium">Descripción</Label>
                  <p className="text-amber-800 mt-1">{familia.descripcion}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-amber-200">
                <div>
                  <Label className="text-amber-700 font-medium">Fecha de Creación</Label>
                  <p className="text-amber-800 mt-1">{formatDate(familia.fecha_creacion)}</p>
                </div>
                
                <div>
                  <Label className="text-amber-700 font-medium">Total de Miembros</Label>
                  <p className="text-amber-800 mt-1 font-semibold">{familia.miembros?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Código de Invitación (Solo Admin) */}
          {user?.rol === 'admin' && (
            <Card className="card-nostalgic" data-testid="invitation-code-card">
              <CardHeader>
                <CardTitle className="text-amber-900 font-heading flex items-center space-x-2">
                  <span>🔗</span>
                  <span>Código de Invitación</span>
                </CardTitle>
                <CardDescription>
                  Comparte este código para invitar familiares
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <Label className="text-amber-700 font-medium mb-2 block">Código de la Familia</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={codigoInvitacion}
                      readOnly
                      className="input-warm font-mono text-lg font-bold text-center"
                      data-testid="invitation-code-input"
                    />
                    <Button
                      onClick={copyToClipboard}
                      className="btn-secondary"
                      data-testid="copy-code-button"
                    >
                      {copySuccess ? '✅' : '📋'}
                    </Button>
                  </div>
                  {copySuccess && (
                    <p className="text-green-600 text-sm mt-2">¡Código copiado al portapapeles!</p>
                  )}
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">💡 Cómo invitar familiares:</h4>
                  <ol className="text-sm text-blue-700 space-y-1">
                    <li>1. Comparte el código de arriba con tu familiar</li>
                    <li>2. Diles que se registren en Memoria Viva</li>
                    <li>3. Al registrarse, deben ingresar este código</li>
                    <li>4. ¡Automáticamente se unirán a tu familia!</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mi Perfil */}
          <Card className="card-nostalgic" data-testid="user-profile-card">
            <CardHeader>
              <CardTitle className="text-amber-900 font-heading flex items-center space-x-2">
                <span>👤</span>
                <span>Mi Perfil</span>
              </CardTitle>
              <CardDescription>
                Tu información personal en la familia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {user.nombre.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-amber-900">
                    {user.nombre} {user.apellido}
                  </h3>
                  <p className="text-amber-600">{user.email}</p>
                  <Badge className={`mt-1 ${getRoleBadgeColor(user.rol)}`}>
                    {getRoleIcon(user.rol)} {user.rol === 'admin' ? 'Administrador' : 'Miembro'}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 pt-4 border-t border-amber-200">
                <div>
                  <Label className="text-amber-700 font-medium">Miembro desde</Label>
                  <p className="text-amber-800 mt-1">{formatDate(user.fecha_registro)}</p>
                </div>
                
                {user.ultimo_acceso && (
                  <div>
                    <Label className="text-amber-700 font-medium">Último acceso</Label>
                    <p className="text-amber-800 mt-1">{formatDate(user.ultimo_acceso)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Miembros de la Familia */}
          <Card className="card-nostalgic" data-testid="family-members-card">
            <CardHeader>
              <CardTitle className="text-amber-900 font-heading flex items-center space-x-2">
                <span>👥</span>
                <span>Miembros de la Familia</span>
              </CardTitle>
              <CardDescription>
                Todos los miembros registrados en tu familia
              </CardDescription>
            </CardHeader>
            <CardContent>
              {familia.miembros && familia.miembros.length > 0 ? (
                <div className="space-y-3" data-testid="family-members-list">
                  {familia.miembros.map((miembro, index) => (
                    <div
                      key={miembro.id}
                      className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200"
                      data-testid={`family-member-${index}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {miembro.nombre.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-amber-900">
                            {miembro.nombre} {miembro.apellido}
                            {miembro.id === user.id && <span className="text-amber-600 text-sm ml-2">(Tú)</span>}
                          </p>
                          <p className="text-sm text-amber-600">{miembro.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={getRoleBadgeColor(miembro.rol)}>
                          {getRoleIcon(miembro.rol)} {miembro.rol === 'admin' ? 'Admin' : 'Miembro'}
                        </Badge>
                        
                        {miembro.activo ? (
                          <Badge className="bg-green-100 text-green-800">
                            ✅ Activo
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">
                            ⏸️ Inactivo
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-amber-600">No se encontraron miembros</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-amber-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={loadFamiliaInfo}
              variant="outline"
              className="btn-secondary"
              data-testid="refresh-button"
            >
              🔄 Actualizar Información
            </Button>
            
            {user?.rol === 'admin' && (
              <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogTrigger asChild>
                  <Button className="btn-primary" data-testid="invite-family-button">
                    👥 Invitar Familiar
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-amber-900 font-heading">
                      Invitar Nuevo Familiar
                    </DialogTitle>
                    <DialogDescription>
                      Comparte el código de invitación para que un familiar se una a Memoria Viva
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                      <Label className="text-amber-700 font-medium mb-2 block">Código de Invitación</Label>
                      <div className="text-2xl font-mono font-bold text-amber-900 mb-2">
                        {codigoInvitacion}
                      </div>
                      <Button
                        onClick={copyToClipboard}
                        className="btn-secondary"
                        size="sm"
                      >
                        {copySuccess ? '✅ Copiado!' : '📋 Copiar Código'}
                      </Button>
                    </div>
                    
                    <div className="text-sm text-amber-600 space-y-2">
                      <p><strong>📱 Instrucciones para tu familiar:</strong></p>
                      <ol className="list-decimal list-inside space-y-1 ml-4">
                        <li>Acceder a Memoria Viva</li>
                        <li>Hacer clic en "Registrarse"</li>
                        <li>Llenar sus datos personales</li>
                        <li>Ingresar el código: <code className="bg-amber-100 px-1 rounded">{codigoInvitacion}</code></li>
                        <li>Completar el registro</li>
                      </ol>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamiliaSettings;