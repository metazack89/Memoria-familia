import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { api } = useContext(AuthContext);
  const navigate = useNavigate();
  const [albumes, setAlbumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAlbum, setNewAlbum] = useState({
    titulo: '',
    descripcion: '',
    privacidad: 'familia'
  });

  useEffect(() => {
    loadAlbumes();
  }, []);

  const loadAlbumes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/albumes');
      setAlbumes(response.data);
    } catch (error) {
      console.error('Error cargando álbumes:', error);
      setError('Error al cargar los álbumes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    if (!newAlbum.titulo.trim()) {
      setError('El título del álbum es requerido');
      return;
    }

    try {
      setCreateLoading(true);
      setError('');
      
      const response = await api.post('/albumes', newAlbum);
      setAlbumes([response.data, ...albumes]);
      setNewAlbum({ titulo: '', descripcion: '', privacidad: 'familia' });
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error creando álbum:', error);
      setError(error.response?.data?.detail || 'Error al crear el álbum');
    } finally {
      setCreateLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
          <p className="text-amber-700 font-medium">Cargando álbumes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="mb-4 md:mb-0">
            <h2 className="text-3xl font-bold text-amber-900 mb-2 font-heading">
              📚 Mis Álbumes Familiares
            </h2>
            <p className="text-amber-700">
              Organiza y comparte tus recuerdos más preciados
            </p>
          </div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="btn-primary" data-testid="create-album-button">
                ➕ Crear Nuevo Álbum
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-amber-900 font-heading">
                  Crear Nuevo Álbum
                </DialogTitle>
                <DialogDescription>
                  Crea un nuevo álbum para organizar tus fotos familiares
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateAlbum} className="space-y-4">
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="album-titulo">Título del álbum</Label>
                  <Input
                    id="album-titulo"
                    type="text"
                    placeholder="Ej: Vacaciones 2024, Cumpleaños de María..."
                    value={newAlbum.titulo}
                    onChange={(e) => setNewAlbum({ ...newAlbum, titulo: e.target.value })}
                    className="input-warm"
                    required
                    data-testid="album-titulo-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="album-descripcion">Descripción (opcional)</Label>
                  <Textarea
                    id="album-descripcion"
                    placeholder="Describe este álbum y los momentos especiales que contiene..."
                    value={newAlbum.descripcion}
                    onChange={(e) => setNewAlbum({ ...newAlbum, descripcion: e.target.value })}
                    className="input-warm min-h-[80px]"
                    data-testid="album-descripcion-input"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                    disabled={createLoading}
                    className="btn-secondary"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createLoading}
                    className="btn-primary"
                    data-testid="create-album-submit-button"
                  >
                    {createLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Creando...
                      </>
                    ) : (
                      'Crear Álbum'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Álbumes Grid */}
        {albumes.length === 0 ? (
          <div className="text-center py-16" data-testid="no-albums-message">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-200 to-orange-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-amber-800 text-4xl">📚</span>
            </div>
            <h3 className="text-2xl font-semibold text-amber-800 mb-3 font-heading">
              ¡Crea tu primer álbum!
            </h3>
            <p className="text-amber-600 mb-6 max-w-md mx-auto">
              Los álbumes te ayudan a organizar y compartir tus fotos familiares de manera especial.
              Comienza creando tu primer álbum de recuerdos.
            </p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="btn-primary"
              data-testid="create-first-album-button"
            >
              ✨ Crear Mi Primer Álbum
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="albums-grid">
            {albumes.map((album, index) => (
              <Card
                key={album.id}
                className="card-nostalgic hover-lift cursor-pointer group"
                onClick={() => navigate(`/album/${album.id}`)}
                style={{ animationDelay: `${index * 0.1}s` }}
                data-testid={`album-card-${album.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                      <span className="text-white text-xl font-bold">📸</span>
                    </div>
                    
                    {album.privacidad === 'privado' && (
                      <div className="w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center" title="Álbum privado">
                        <span className="text-amber-700 text-xs">🔒</span>
                      </div>
                    )}
                  </div>
                  
                  <CardTitle className="text-lg text-amber-900 group-hover:text-amber-800 transition-colors font-heading">
                    {album.titulo}
                  </CardTitle>
                  
                  {album.descripcion && (
                    <CardDescription className="text-amber-600 text-sm line-clamp-2">
                      {album.descripcion}
                    </CardDescription>
                  )}
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-amber-600">
                    <span className="flex items-center space-x-1">
                      <span>📅</span>
                      <span>{formatDate(album.fecha_creacion)}</span>
                    </span>
                    
                    <span className="flex items-center space-x-1">
                      <span>👨‍👩‍👧‍👦</span>
                      <span>Familia</span>
                    </span>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-amber-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-amber-500 uppercase tracking-wide font-medium">
                        Clic para abrir
                      </span>
                      <span className="text-amber-400 group-hover:text-amber-600 transition-colors">
                        →
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats Section */}
        {albumes.length > 0 && (
          <div className="mt-12 pt-8 border-t border-amber-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 glass-warm rounded-xl">
                <div className="text-3xl font-bold text-amber-800 mb-2">{albumes.length}</div>
                <div className="text-amber-600 font-medium">Álbumes Creados</div>
              </div>
              
              <div className="text-center p-6 glass-warm rounded-xl">
                <div className="text-3xl font-bold text-amber-800 mb-2">🎯</div>
                <div className="text-amber-600 font-medium">Organizando Recuerdos</div>
              </div>
              
              <div className="text-center p-6 glass-warm rounded-xl">
                <div className="text-3xl font-bold text-amber-800 mb-2">💝</div>
                <div className="text-amber-600 font-medium">Momentos Especiales</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;