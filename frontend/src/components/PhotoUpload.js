import React, { useState, useContext } from 'react';
import { AuthContext } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';

const PhotoUpload = ({ albumId, onUploadComplete, triggerButton }) => {
  const { api } = useContext(AuthContext);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploadData, setUploadData] = useState({
    descripcion: '',
    lugar_nombre: ''
  });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [showDialog, setShowDialog] = useState(false);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length !== files.length) {
      setError('Solo se permiten archivos de imagen');
    } else {
      setError('');
    }

    setSelectedFiles(validFiles);
    
    // Crear previews
    const newPreviews = [];
    validFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews[index] = {
          file,
          url: e.target.result,
          name: file.name,
          size: (file.size / 1024 / 1024).toFixed(2) // MB
        };
        
        if (newPreviews.length === validFiles.length) {
          setPreviews(newPreviews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (indexToRemove) => {
    const newFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
    const newPreviews = previews.filter((_, index) => index !== indexToRemove);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
    
    // Reset file input if no files left
    if (newFiles.length === 0) {
      const fileInput = document.getElementById('photo-upload-input');
      if (fileInput) fileInput.value = '';
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setError('Selecciona al menos una foto');
      return;
    }

    try {
      setUploadLoading(true);
      setUploadProgress(0);
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
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      // Limpiar formulario
      setSelectedFiles([]);
      setPreviews([]);
      setUploadData({ descripcion: '', lugar_nombre: '' });
      setShowDialog(false);
      
      // Reset file input
      const fileInput = document.getElementById('photo-upload-input');
      if (fileInput) fileInput.value = '';

      // Callback para actualizar la vista padre
      if (onUploadComplete) {
        onUploadComplete(response.data);
      }
      
    } catch (error) {
      console.error('Error subiendo fotos:', error);
      setError(error.response?.data?.detail || 'Error al subir las fotos');
    } finally {
      setUploadLoading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setSelectedFiles([]);
    setPreviews([]);
    setUploadData({ descripcion: '', lugar_nombre: '' });
    setError('');
    setUploadProgress(0);
    
    const fileInput = document.getElementById('photo-upload-input');
    if (fileInput) fileInput.value = '';
  };

  return (
    <Dialog open={showDialog} onOpenChange={(open) => {
      setShowDialog(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button className="btn-primary" data-testid="upload-photos-button">
            📤 Subir Fotos
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-amber-900 font-heading">
            📷 Subir Fotos al Álbum
          </DialogTitle>
          <DialogDescription>
            Selecciona las fotos que quieres agregar y compártelas con tu familia
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto px-1">
          <form onSubmit={handleUpload} className="space-y-6">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            {/* File Selection */}
            <div className="space-y-3">
              <Label htmlFor="photo-upload-input" className="text-amber-700 font-medium">
                Seleccionar fotos
              </Label>
              <div className="relative">
                <Input
                  id="photo-upload-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="input-warm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                  data-testid="photo-upload-input"
                />
              </div>
              
              {selectedFiles.length > 0 && (
                <p className="text-sm text-amber-600">
                  ✅ {selectedFiles.length} archivo{selectedFiles.length !== 1 ? 's' : ''} seleccionado{selectedFiles.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Photo Previews */}
            {previews.length > 0 && (
              <div className="space-y-3">
                <Label className="text-amber-700 font-medium">Vista previa de fotos</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
                  {previews.map((preview, index) => (
                    <Card key={index} className="relative group overflow-hidden">
                      <div className="aspect-square relative">
                        <img
                          src={preview.url}
                          alt={preview.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white hover:bg-red-600 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`remove-photo-${index}`}
                        >
                          ×
                        </Button>
                      </div>
                      <div className="p-2">
                        <p className="text-xs text-gray-600 truncate font-medium">{preview.name}</p>
                        <p className="text-xs text-gray-500">{preview.size} MB</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="upload-descripcion" className="text-amber-700 font-medium">
                  Descripción (opcional)
                </Label>
                <Textarea
                  id="upload-descripcion"
                  placeholder="Describe estas fotos o el momento especial..."
                  value={uploadData.descripcion}
                  onChange={(e) => setUploadData({ ...uploadData, descripcion: e.target.value })}
                  className="input-warm min-h-[80px] resize-none"
                  data-testid="upload-descripcion-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="upload-lugar" className="text-amber-700 font-medium">
                  Lugar (opcional)
                </Label>
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
            </div>

            {/* Progress Bar */}
            {uploadLoading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-amber-700">
                  <span>Subiendo fotos...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-amber-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={uploadLoading}
                className="btn-secondary"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={uploadLoading || selectedFiles.length === 0}
                className="btn-primary"
                data-testid="upload-submit-button"
              >
                {uploadLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Subiendo... ({uploadProgress}%)
                  </>
                ) : (
                  <>🚀 Subir {selectedFiles.length} Foto{selectedFiles.length !== 1 ? 's' : ''}</>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoUpload;