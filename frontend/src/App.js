import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import '@/App.css';

// Componentes
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import AlbumView from './components/AlbumView';
import Timeline from './components/Timeline';
import MapaRecuerdos from './components/MapaRecuerdos';
import FamiliaSettings from './components/FamiliaSettings';

// Configuración de API
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

// Interceptor para incluir token en todas las requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Context para autenticación
const AuthContext = React.createContext();

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data);
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Error al iniciar sesión'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { access_token, user: newUser } = response.data;
      
      localStorage.setItem('token', access_token);
      setUser(newUser);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Error al registrarse'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCurrentView('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
          <p className="text-amber-800 font-medium">Cargando Memoria Viva...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthContext.Provider value={{ login, register }}>
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
          <AuthForm />
        </div>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ user, logout, api }}>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <Router>
          <MainApp currentView={currentView} setCurrentView={setCurrentView} />
        </Router>
      </div>
    </AuthContext.Provider>
  );
}

function MainApp({ currentView, setCurrentView }) {
  const { user, logout } = React.useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-amber-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">📸</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-amber-900">Memoria Viva</h1>
              <p className="text-sm text-amber-700">Álbum digital familiar</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                currentView === 'dashboard'
                  ? 'bg-amber-200 text-amber-800'
                  : 'text-amber-700 hover:bg-amber-100'
              }`}
            >
              📚 Álbumes
            </button>
            <button
              onClick={() => setCurrentView('timeline')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                currentView === 'timeline'
                  ? 'bg-amber-200 text-amber-800'
                  : 'text-amber-700 hover:bg-amber-100'
              }`}
            >
              ⏰ Línea de Tiempo
            </button>
            <button
              onClick={() => setCurrentView('mapa')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                currentView === 'mapa'
                  ? 'bg-amber-200 text-amber-800'
                  : 'text-amber-700 hover:bg-amber-100'
              }`}
            >
              🗺️ Mapa de Recuerdos
            </button>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-amber-900">{user.nombre} {user.apellido}</p>
              <p className="text-xs text-amber-600 capitalize">{user.rol}</p>
            </div>
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {user.nombre.charAt(0).toUpperCase()}
              </span>
            </div>
            <button
              onClick={() => setCurrentView('familia')}
              className="p-2 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
              title="Configuración de familia"
            >
              ⚙️
            </button>
            <button
              onClick={logout}
              className="p-2 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              🚪
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/mapa" element={<MapaRecuerdos />} />
          <Route path="/familia" element={<FamiliaSettings />} />
          <Route path="/album/:albumId" element={<AlbumView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export { AuthContext };
export default App;