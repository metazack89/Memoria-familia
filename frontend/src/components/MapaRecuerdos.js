import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

const MapaRecuerdos = () => {
  const { api } = useContext(AuthContext);
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    loadFotosConUbicacion();
    loadGoogleMapsScript();
  }, []);

  const loadFotosConUbicacion = async () => {
    try {
      setLoading(true);
      const response = await api.get('/mapa/fotos');
      setFotos(response.data);
    } catch (error) {
      console.error('Error cargando fotos con ubicación:', error);
      setError('Error al cargar las fotos con ubicación');
    } finally {
      setLoading(false);
    }
  };

  const loadGoogleMapsScript = () => {
    // Por ahora, vamos a mostrar un mapa simulado sin la API real de Google Maps
    // En una implementación completa, aquí cargaríamos el script de Google Maps
    setTimeout(() => {
      setMapLoaded(true);
      initializeMap();
    }, 1000);
  };

  const initializeMap = () => {
    // Simulación de inicialización del mapa
    // En una implementación real, aquí configuraríamos Google Maps
    console.log('Mapa inicializado (simulado)');
  };

  const formatFecha = (fechaString) => {
    if (!fechaString) return 'Fecha desconocida';
    return new Date(fechaString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const openPhotoModal = (foto) => {
    setSelectedPhoto(foto);
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
  };

  const agruparFotosPorUbicacion = () => {
    const grupos = {};
    
    fotos.forEach(foto => {
      if (foto.ubicacion) {
        const lat = foto.ubicacion.lat.toFixed(3);
        const lng = foto.ubicacion.lng.toFixed(3);
        const key = `${lat},${lng}`;
        
        if (!grupos[key]) {
          grupos[key] = {
            lat: foto.ubicacion.lat,
            lng: foto.ubicacion.lng,
            lugar_nombre: foto.lugar_nombre,
            fotos: []
          };
        }
        grupos[key].fotos.push(foto);
      }
    });
    
    return Object.values(grupos);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
          <p className="text-amber-700 font-medium">Cargando mapa de recuerdos...</p>
        </div>
      </div>
    );
  }

  const gruposUbicacion = agruparFotosPorUbicacion();

  return (
    <div className="h-full overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 p-6 bg-white/80 backdrop-blur-md border-b border-amber-200">
          <h2 className="text-3xl font-bold text-amber-900 mb-2 font-heading">
            🗺️ Mapa de Recuerdos Familiares
          </h2>
          <p className="text-amber-700 mb-4">
            Explora tus recuerdos a través de los lugares donde fueron capturados
          </p>
          
          <div className="flex items-center space-x-4 text-sm">
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              📷 {fotos.length} foto{fotos.length !== 1 ? 's' : ''} con ubicación
            </Badge>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              📍 {gruposUbicacion.length} ubicación{gruposUbicacion.length !== 1 ? 'es' : ''}
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Map Area */}
          <div className="flex-1 relative">
            {!mapLoaded ? (
              <div className="h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-4 mx-auto"></div>
                  <p className="text-amber-700 font-medium">Cargando mapa interactivo...</p>
                </div>
              </div>
            ) : fotos.length === 0 ? (
              <div className="h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
                <div className="text-center max-w-md mx-auto p-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-amber-200 to-orange-300 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-amber-800 text-4xl">🗺️</span>
                  </div>
                  <h3 className="text-2xl font-semibold text-amber-800 mb-3 font-heading">
                    ¡Agrega fotos con ubicación!
                  </h3>
                  <p className="text-amber-600 mb-6">
                    Las fotos con información de GPS aparecerán aquí en el mapa.
                    Sube fotos tomadas con tu teléfono o cámara con GPS activado.
                  </p>
                  <Button className="btn-primary">
                    📤 Subir Fotos
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-full bg-gradient-to-br from-amber-50 to-orange-100 relative" data-testid="map-container">
                {/* Mapa simulado - En implementación real aquí iría Google Maps */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg max-w-md">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-2xl">🗺️</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2 font-heading">
                      Mapa Interactivo
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Aquí se mostraría el mapa interactivo de Google Maps con marcadores para cada ubicación de foto.
                    </p>
                    <div className="text-sm text-gray-500">
                      💡 Funcionalidad disponible con integración completa de Google Maps API
                    </div>
                  </div>
                </div>
                
                {/* Marcadores simulados */}
                <div className="absolute top-20 left-20 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                  {gruposUbicacion[0]?.fotos.length || 0}
                </div>
                <div className="absolute top-40 right-32 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                  {gruposUbicacion[1]?.fotos.length || 0}
                </div>
                {gruposUbicacion.length > 2 && (
                  <div className="absolute bottom-32 left-1/3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                    {gruposUbicacion[2]?.fotos.length || 0}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar con ubicaciones */}
          {fotos.length > 0 && (
            <div className="w-80 bg-white/90 backdrop-blur-md border-l border-amber-200 overflow-y-auto" data-testid="locations-sidebar">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-amber-800 mb-4 font-heading">
                  📍 Ubicaciones de Recuerdos
                </h3>
                
                <div className="space-y-4">
                  {gruposUbicacion.map((grupo, index) => (
                    <Card key={index} className="card-nostalgic hover-lift" data-testid={`location-group-${index}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-amber-900 mb-1">
                              {grupo.lugar_nombre || 'Ubicación sin nombre'}
                            </h4>
                            <p className="text-xs text-amber-600">
                              {grupo.lat.toFixed(4)}, {grupo.lng.toFixed(4)}
                            </p>
                          </div>
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                            {grupo.fotos.length}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {grupo.fotos.slice(0, 3).map((foto, fotoIndex) => (
                            <div
                              key={foto.id}
                              className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => openPhotoModal(foto)}
                            >
                              <img
                                src={`${process.env.REACT_APP_BACKEND_URL}${foto.archivo_url}`}
                                alt={foto.nombre_archivo}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          ))}
                        </div>
                        
                        {grupo.fotos.length > 3 && (
                          <p className="text-xs text-amber-600 text-center">
                            +{grupo.fotos.length - 3} foto{grupo.fotos.length - 3 !== 1 ? 's' : ''} más
                          </p>
                        )}
                        
                        <div className="mt-3 pt-3 border-t border-amber-100">
                          <p className="text-xs text-amber-500">
                            📅 {formatFecha(grupo.fotos[0]?.fecha_captura || grupo.fotos[0]?.fecha_subida)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

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
                      <span className="font-medium">📅 Fecha:</span><br/>
                      {formatFecha(selectedPhoto.fecha_captura || selectedPhoto.fecha_subida)}
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

export default MapaRecuerdos;