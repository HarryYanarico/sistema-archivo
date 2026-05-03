import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FolderSearch,
  BookOpenCheck,
  Users,
  LayoutDashboard,
  Settings,
  Bell,
  Search,
  FileText,
  MapPin,
  UserCircle,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const primaryRole = user?.groups[0]?.name ?? 'Sin rol';
  const isAdmin = user?.groups.some((g) => g.name === 'Administrador') ?? false;

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
    { icon: FileText, label: 'Expedientes', to: '/expedientes' },
    { icon: BookOpenCheck, label: 'Préstamos', to: '/prestamos' },
    { icon: MapPin, label: 'Ubicaciones', to: '/ubicaciones' },
    ...(isAdmin ? [{ icon: Users, label: 'Usuarios', to: '/usuarios' }] : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-100 via-brand-50 to-surface-200 flex overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-300/30 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-500/20 blur-[120px] pointer-events-none" />

      <aside className="w-64 m-4 mr-0 rounded-2xl glass-panel flex flex-col z-10 hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
            <FolderSearch size={24} />
          </div>
          <h1 className="font-bold text-xl text-surface-900 tracking-tight">
            Archivo<span className="text-brand-600">Sys</span>
          </h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                location.pathname === item.to
                  ? 'bg-brand-50 text-brand-700 font-medium shadow-sm border border-brand-100/50'
                  : 'text-surface-600 hover:bg-white/50 hover:text-surface-900'
              }`}
            >
              <div className={location.pathname === item.to ? 'text-brand-600' : 'text-surface-400'}>
                <item.icon size={20} />
              </div>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 mt-auto space-y-2">
          <Link
            to="/perfil"
            className="glass-card rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-brand-200 hover:bg-white/80 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-surface-200 flex items-center justify-center text-surface-500">
              <UserCircle size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-surface-800 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-surface-500">{primaryRole}</p>
            </div>
          </Link>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 z-10 flex flex-col h-screen overflow-y-auto">
        <header className="flex justify-between items-center mb-8 glass-panel px-6 py-4 rounded-2xl">
          <div>
            <h2 className="text-2xl font-bold text-surface-800">
              Hola, {user?.firstName ?? 'Usuario'} 👋
            </h2>
            <p className="text-surface-500 text-sm mt-1">Resumen del sistema de archivos hoy.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
              <input
                type="text"
                placeholder="Buscar expediente..."
                className="pl-10 pr-4 py-2 rounded-xl bg-white/50 border border-white/40 focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:bg-white w-64 transition-all"
              />
            </div>
            <button className="w-10 h-10 rounded-xl bg-white/50 border border-white/40 flex items-center justify-center text-surface-600 hover:text-brand-600 hover:bg-white transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500"></span>
            </button>
            <Link
              to="/perfil"
              className="w-10 h-10 rounded-xl bg-white/50 border border-white/40 flex items-center justify-center text-surface-600 hover:text-brand-600 hover:bg-white transition-colors"
            >
              <Settings size={20} />
            </Link>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
