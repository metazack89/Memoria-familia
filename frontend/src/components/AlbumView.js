import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import PhotoUpload from './PhotoUpload';

const AlbumView = () => {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { api } = useContext(AuthContext);
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadData, setUploadData] = useState({
    descripcion: '',
    lugar_nombre: ''
  });
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    loadAlbum();
  }, [albumId]);

  const loadAlbum = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/albumes/${albumId}`);
      setAlbum(response.data);
    } catch (error) {
      console.error('Error cargando álbum:', error);
      setError('Error al cargar el álbum');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setError('Selecciona al menos una foto');
      return;
    }

    try {
      setUploadLoading(true);
      setError('');

      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      formData.append('album_id', albumId);
      if (uploadData.descripcion) formData.append('descripcion', uploadData.descripcion);
      if (uploadData.lugar_nombre) formData.append('lugar_nombre', uploadData.lugar_nombre);

      const response = await api.post('/fotos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Recargar el álbum
      await loadAlbum();
      
      // Limpiar formulario
      setSelectedFiles([]);
      setUploadData({ descripcion: '', lugar_nombre: '' });
      setShowUploadDialog(false);
      
      // Reset file input
      const fileInput = document.getElementById('photo-upload');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Error subiendo fotos:', error);
      setError(error.response?.data?.detail || 'Error al subir las fotos');
    } finally {
      setUploadLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha desconocida';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openPhotoModal = (foto) => {
    setSelectedPhoto(foto);
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
          <p className="text-amber-700 font-medium">Cargando álbum...</p>
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-amber-800 mb-2">Álbum no encontrado</h3>
          <p className="text-amber-600 mb-4">El álbum que buscas no existe o no tienes acceso a él</p>
          <Button onClick={() => navigate('/')} className="btn-primary">
            Volver a Álbumes
          </Button>
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
            <div className="flex items-center space-x-4 mb-4">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="btn-secondary"
                data-testid="back-to-albums-button"
              >
                ← Volver a Álbumes
              </Button>
            </div>
            
            <h2 className="text-3xl font-bold text-amber-900 mb-2 font-heading">
              📸 {album.titulo}
            </h2>
            
            {album.descripcion && (
              <p className="text-amber-700 mb-2">{album.descripcion}</p>
            )}
            
            <div className="flex items-center space-x-4 text-sm text-amber-600">
              <span>📅 Creado el {formatDate(album.fecha_creacion)}</span>
              {album.fotos && (
                <span>📷 {album.fotos.length} foto{album.fotos.length !== 1 ? 's' : ''}</span>
              )}
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                {album.privacidad === 'familia' ? '👨‍👩‍👧‍👦 Familiar' : '🔒 Privado'}
              </Badge>
            </div>
          </div>

          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button className="btn-primary" data-testid="upload-photos-button">
                📤 Subir Fotos
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-amber-900 font-heading">
                  Subir Fotos al Álbum
                </DialogTitle>
                <DialogDescription>
                  Selecciona las fotos que quieres agregar a "{album.titulo}"
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleUpload} className="space-y-4">
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="photo-upload">Seleccionar fotos</Label>
                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="input-warm"
                    required
                    data-testid="photo-upload-input"
                  />
                  {selectedFiles.length > 0 && (
                    <p className="text-sm text-amber-600">
                      {selectedFiles.length} archivo{selectedFiles.length !== 1 ? 's' : ''} seleccionado{selectedFiles.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="upload-descripcion">Descripción (opcional)</Label>
                  <Textarea
                    id="upload-descripcion"
                    placeholder="Describe estas fotos..."
                    value={uploadData.descripcion}
                    onChange={(e) => setUploadData({ ...uploadData, descripcion: e.target.value })}
                    className="input-warm min-h-[60px]"
                    data-testid="upload-descripcion-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="upload-lugar">Lugar (opcional)</Label>
                  <Input
                    id="upload-lugar"
                    type="text"
                    placeholder="¿Dónde se tomaron estas fotos?"
                    value={uploadData.lugar_nombre}
                    onChange={(e) => setUploadData({ ...uploadData, lugar_nombre: e.target.value })}
                    className="input-warm"
                    data-testid="upload-lugar-input"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowUploadDialog(false)}
                    disabled={uploadLoading}
                    className="btn-secondary"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={uploadLoading}
                    className="btn-primary"
                    data-testid="upload-submit-button"
                  >
                    {uploadLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Subiendo...
                      </>
                    ) : (
                      'Subir Fotos'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Photos Grid */}
        {!album.fotos || album.fotos.length === 0 ? (
          <div className="text-center py-16" data-testid="no-photos-message">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-200 to-orange-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-amber-800 text-4xl">📷</span>
            </div>
            <h3 className="text-2xl font-semibold text-amber-800 mb-3 font-heading">
              ¡Agrega tus primeras fotos!
            </h3>
            <p className="text-amber-600 mb-6 max-w-md mx-auto">
              Este álbum está esperando tus recuerdos. Sube fotos para comenzar a llenar
              este espacio con momentos especiales.
            </p>
            <Button
              onClick={() => setShowUploadDialog(true)}
              className="btn-primary"
              data-testid="upload-first-photos-button"
            >
              ✨ Subir Mis Primeras Fotos
            </Button>
          </div>
        ) : (
          <div className="photo-grid" data-testid="photos-grid">
            {album.fotos.map((foto, index) => (
              <div
                key={foto.id}
                className="photo-card animate-fade-in-scale cursor-pointer"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => openPhotoModal(foto)}
                data-testid={`photo-card-${foto.id}`}
              >
                <img
                  src={`${process.env.REACT_APP_BACKEND_URL}${foto.archivo_url}`}
                  alt={foto.nombre_archivo}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                
                {/* Overlay with info */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <div className="text-white">
                    <h4 className="font-medium text-sm mb-1 truncate">{foto.nombre_archivo}</h4>
                    {foto.lugar_nombre && (
                      <p className="text-xs opacity-90 mb-1">📍 {foto.lugar_nombre}</p>
                    )}
                    <p className="text-xs opacity-75">
                      {formatDate(foto.fecha_captura || foto.fecha_subida)}
                    </p>
                  </div>
                </div>
                
                {/* Location indicator */}
                {foto.ubicacion && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-xs">📍</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Photo Modal */}
        {selectedPhoto && (
          <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && closePhotoModal()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
              <div className="relative">
                <img
                  src={`${process.env.REACT_APP_BACKEND_URL}${selectedPhoto.archivo_url}`}
                  alt={selectedPhoto.nombre_archivo}
                  className="w-full h-auto max-h-[70vh] object-contain bg-black"
                />
                
                <Button
                  onClick={closePhotoModal}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white hover:bg-black/70 p-0"
                  data-testid="close-photo-modal"
                >
                  ✕
                </Button>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-amber-900 mb-3 font-heading">
                  {selectedPhoto.nombre_archivo}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-amber-600 mb-2">
                      <span className="font-medium">📅 Fecha de captura:</span><br/>
                      {formatDate(selectedPhoto.fecha_captura || selectedPhoto.fecha_subida)}
                    </p>
                    
                    {selectedPhoto.lugar_nombre && (
                      <p className="text-amber-600 mb-2">
                        <span className="font-medium">📍 Lugar:</span><br/>
                        {selectedPhoto.lugar_nombre}
                      </p>
                    )}
                    
                    {selectedPhoto.ubicacion && (
                      <p className="text-amber-600 mb-2">
                        <span className="font-medium">🗺️ Coordenadas:</span><br/>
                        {selectedPhoto.ubicacion.lat.toFixed(6)}, {selectedPhoto.ubicacion.lng.toFixed(6)}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    {selectedPhoto.descripcion && (
                      <p className="text-amber-600 mb-2">
                        <span className="font-medium">📝 Descripción:</span><br/>
                        {selectedPhoto.descripcion}
                      </p>
                    )}
                    
                    {selectedPhoto.metadata?.camera_make && (
                      <p className="text-amber-600 mb-2">
                        <span className="font-medium">📷 Cámara:</span><br/>
                        {selectedPhoto.metadata.camera_make} {selectedPhoto.metadata.camera_model || ''}
                      </p>
                    )}
                    
                    {selectedPhoto.metadata?.ancho && selectedPhoto.metadata?.alto && (
                      <p className="text-amber-600 mb-2">
                        <span className="font-medium">📐 Dimensiones:</span><br/>
                        {selectedPhoto.metadata.ancho} × {selectedPhoto.metadata.alto} px
                      </p>
                    )}
                  </div>
                </div>
                
                {selectedPhoto.anecdota && (
                  <div className="mt-4 pt-4 border-t border-amber-200">
                    <p className="text-amber-600">
                      <span className="font-medium">💭 Anécdota:</span><br/>
                      {selectedPhoto.anecdota}
                    </p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default AlbumView;