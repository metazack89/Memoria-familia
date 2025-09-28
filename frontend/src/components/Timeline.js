import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

const Timeline = () => {
  const { api } = useContext(AuthContext);
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [filtros, setFiltros] = useState({
    año: '',
    mes: '',
    busqueda: ''
  });
  const [años, setAños] = useState([]);

  useEffect(() => {
    loadTimeline();
  }, []);

  useEffect(() => {
    // Extraer años únicos de las fotos
    const añosUnicos = [...new Set(
      fotos.map(foto => {
        const fecha = foto.fecha_captura || foto.fecha_subida;
        return fecha ? new Date(fecha).getFullYear() : null;
      }).filter(año => año !== null)
    )].sort((a, b) => b - a);
    setAños(añosUnicos);
  }, [fotos]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const response = await api.get('/timeline');
      setFotos(response.data);
    } catch (error) {
      console.error('Error cargando timeline:', error);
      setError('Error al cargar la línea de tiempo');
    } finally {
      setLoading(false);
    }
  };

  const formatFecha = (fechaString) => {
    if (!fechaString) return 'Fecha desconocida';
    return new Date(fechaString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFechaCorta = (fechaString) => {
    if (!fechaString) return 'Sin fecha';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const obtenerMesAño = (fechaString) => {
    if (!fechaString) return 'Sin fecha';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric'
    });
  };

  const filtrarFotos = () => {
    return fotos.filter(foto => {
      const fecha = foto.fecha_captura || foto.fecha_subida;
      const fechaObj = fecha ? new Date(fecha) : null;
      
      // Filtro por año
      if (filtros.año && fechaObj) {
        if (fechaObj.getFullYear() !== parseInt(filtros.año)) {
          return false;
        }
      }
      
      // Filtro por mes
      if (filtros.mes && fechaObj) {
        if (fechaObj.getMonth() !== parseInt(filtros.mes) - 1) {
          return false;
        }
      }
      
      // Filtro por búsqueda
      if (filtros.busqueda) {
        const busqueda = filtros.busqueda.toLowerCase();
        const coincide = 
          foto.nombre_archivo?.toLowerCase().includes(busqueda) ||
          foto.descripcion?.toLowerCase().includes(busqueda) ||
          foto.lugar_nombre?.toLowerCase().includes(busqueda) ||
          foto.anecdota?.toLowerCase().includes(busqueda);
        
        if (!coincide) return false;
      }
      
      return true;
    });
  };

  const agruparFotosPorFecha = (fotosArray) => {
    const grupos = {};
    
    fotosArray.forEach(foto => {
      const fecha = foto.fecha_captura || foto.fecha_subida;
      const mesAño = obtenerMesAño(fecha);
      
      if (!grupos[mesAño]) {
        grupos[mesAño] = [];
      }
      grupos[mesAño].push(foto);
    });
    
    return grupos;
  };

  const limpiarFiltros = () => {
    setFiltros({ año: '', mes: '', busqueda: '' });
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
          <p className="text-amber-700 font-medium">Cargando línea de tiempo...</p>
        </div>
      </div>
    );
  }

  const fotosFiltradas = filtrarFotos();
  const gruposFotos = agruparFotosPorFecha(fotosFiltradas);

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-amber-900 mb-2 font-heading">
            ⏰ Línea de Tiempo Familiar
          </h2>
          <p className="text-amber-700 mb-6">
            Revive tus recuerdos familiares organizados cronológicamente
          </p>

          {/* Filtros */}
          <div className="glass-warm rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-amber-800 mb-4 font-heading">🔍 Filtrar Recuerdos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-2">Buscar</label>
                <Input
                  type="text"
                  placeholder="Buscar en fotos..."
                  value={filtros.busqueda}
                  onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                  className="input-warm"
                  data-testid="search-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-2">Año</label>
                <Select value={filtros.año} onValueChange={(value) => setFiltros({ ...filtros, año: value === "all" ? "" : value })}>
                  <SelectTrigger className="input-warm" data-testid="year-filter">
                    <SelectValue placeholder="Todos los años" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los años</SelectItem>
                    {años.map(año => (
                      <SelectItem key={año} value={año.toString()}>{año}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-2">Mes</label>
                <Select value={filtros.mes} onValueChange={(value) => setFiltros({ ...filtros, mes: value === "all" ? "" : value })}>
                  <SelectTrigger className="input-warm" data-testid="month-filter">
                    <SelectValue placeholder="Todos los meses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los meses</SelectItem>
                    <SelectItem value="1">Enero</SelectItem>
                    <SelectItem value="2">Febrero</SelectItem>
                    <SelectItem value="3">Marzo</SelectItem>
                    <SelectItem value="4">Abril</SelectItem>
                    <SelectItem value="5">Mayo</SelectItem>
                    <SelectItem value="6">Junio</SelectItem>
                    <SelectItem value="7">Julio</SelectItem>
                    <SelectItem value="8">Agosto</SelectItem>
                    <SelectItem value="9">Septiembre</SelectItem>
                    <SelectItem value="10">Octubre</SelectItem>
                    <SelectItem value="11">Noviembre</SelectItem>
                    <SelectItem value="12">Diciembre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button
                  onClick={limpiarFiltros}
                  variant="outline"
                  className="btn-secondary w-full"
                  data-testid="clear-filters-button"
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
            
            <div className="mt-4 flex items-center space-x-4 text-sm text-amber-600">
              <span>📷 {fotosFiltradas.length} foto{fotosFiltradas.length !== 1 ? 's' : ''} encontrada{fotosFiltradas.length !== 1 ? 's' : ''}</span>
              {Object.keys(gruposFotos).length > 0 && (
                <span>📅 {Object.keys(gruposFotos).length} período{Object.keys(gruposFotos).length !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        {fotosFiltradas.length === 0 ? (
          <div className="text-center py-16" data-testid="no-photos-message">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-200 to-orange-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-amber-800 text-4xl">⏰</span>
            </div>
            <h3 className="text-2xl font-semibold text-amber-800 mb-3 font-heading">
              {fotos.length === 0 ? '¡Comienza tu historia!' : 'No se encontraron fotos'}
            </h3>
            <p className="text-amber-600 mb-6 max-w-md mx-auto">
              {fotos.length === 0 
                ? 'Sube tus primeras fotos para comenzar a crear tu línea de tiempo familiar.'
                : 'Intenta ajustar los filtros para encontrar las fotos que buscas.'
              }
            </p>
            {fotos.length === 0 && (
              <Button className="btn-primary">
                ✨ Subir Primeras Fotos
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-8" data-testid="timeline-content">
            {Object.entries(gruposFotos).map(([periodo, fotosPeriodo], index) => (
              <div key={periodo} className="timeline-item animate-fade-in-up" style={{ animationDelay: `${index * 0.2}s` }}>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-amber-800 mb-2 font-heading capitalize">
                    📅 {periodo}
                  </h3>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    {fotosPeriodo.length} foto{fotosPeriodo.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {fotosPeriodo.map((foto, fotoIndex) => (
                    <Card
                      key={foto.id}
                      className="card-nostalgic hover-lift cursor-pointer group overflow-hidden"
                      onClick={() => openPhotoModal(foto)}
                      style={{ animationDelay: `${(index * 0.2) + (fotoIndex * 0.1)}s` }}
                      data-testid={`timeline-photo-${foto.id}`}
                    >
                      <div className="aspect-[4/3] relative overflow-hidden">
                        <img
                          src={`${process.env.REACT_APP_BACKEND_URL}${foto.archivo_url}`}
                          alt={foto.nombre_archivo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        
                        {/* Location indicator */}
                        {foto.ubicacion && (
                          <div className="absolute top-3 right-3 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white text-xs">📍</span>
                          </div>
                        )}
                        
                        {/* Date overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                          <p className="text-white text-sm font-medium">
                            {formatFechaCorta(foto.fecha_captura || foto.fecha_subida)}
                          </p>
                        </div>
                      </div>
                      
                      <CardContent className="p-4">
                        <h4 className="font-medium text-amber-900 mb-2 truncate group-hover:text-amber-800 transition-colors">
                          {foto.nombre_archivo}
                        </h4>
                        
                        {foto.lugar_nombre && (
                          <p className="text-sm text-amber-600 mb-2 flex items-center space-x-1">
                            <span>📍</span>
                            <span className="truncate">{foto.lugar_nombre}</span>
                          </p>
                        )}
                        
                        {foto.descripcion && (
                          <p className="text-sm text-amber-600 line-clamp-2 mb-2">
                            {foto.descripcion}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-amber-500">
                          <span>Clic para ver</span>
                          <span className="group-hover:text-amber-600 transition-colors">→</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
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

export default Timeline;