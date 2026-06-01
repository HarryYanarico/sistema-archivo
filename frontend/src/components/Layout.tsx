import { ReactNode, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FolderSearch,
  BookOpenCheck,
  Users,
  LayoutDashboard,
  Settings,
  Search,
  FileText,
  MapPin,
  UserCircle,
  LogOut,
  ArrowLeftRight,
  Calendar,
  Ban,
  Sun,
  Moon,
  Home,
  ChevronLeft,
  ChevronRight,
  Undo2,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePermission } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  to: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { isAdmin, hasPerm } = usePermission();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [headerSearch, setHeaderSearch] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const primaryRole = user?.groups[0]?.name ?? 'Sin rol';

  const canViewDashboard = hasPerm('ver_dashboard');
  const canGestionarCarpetas = hasPerm('gestionar_carpetas');
  const canGestionarPrestamos = hasPerm('gestionar_prestamos');
  const canGestionarDevoluciones = hasPerm('gestionar_devoluciones');
  const canGestionarUbicaciones = hasPerm('gestionar_ubicaciones');
  const canGestionarTraspasos = hasPerm('gestionar_traspasos');
  const canGestionarProrrogas = hasPerm('gestionar_prorrogas');

  const pageTitle = useMemo(() => {
    const map: Record<string, string> = {
      '/': 'Inicio',
      '/dashboard': 'Dashboard',
      '/carpetas': 'Carpetas',
      '/incidentes': 'Incidentes',
      '/prestamos': 'Préstamos',
      '/devoluciones': 'Devoluciones',
      '/ubicaciones': 'Ubicaciones',
      '/traspasos': 'Traspasos',
      '/prorrogas': 'Prórrogas',
      '/reportes': 'Reportes',
      '/usuarios': 'Usuarios',
      '/personas': 'Personas',
      '/bloqueos': 'Bloqueos',
      '/perfil': 'Perfil',
    };
    return map[location.pathname] ?? 'Inicio';
  }, [location.pathname]);

  const navSections = useMemo<NavSection[]>(() => {
    const sections: NavSection[] = [];

    const mainItems: NavItem[] = [
      { icon: Home, label: 'Inicio', to: '/' },
    ];

    if (canViewDashboard) {
      mainItems.push({ icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' });
    }

    if (mainItems.length > 0) {
      sections.push({ label: 'Principal', items: mainItems });
    }

    const gestionItems: NavItem[] = [];

    if (canGestionarCarpetas) {
      gestionItems.push({ icon: FileText, label: 'Carpetas', to: '/carpetas' });
    }

    if (canGestionarCarpetas) {
      gestionItems.push({ icon: AlertTriangle, label: 'Incidentes', to: '/incidentes' });
    }

    if (canGestionarPrestamos || canGestionarDevoluciones) {
      gestionItems.push({ icon: BookOpenCheck, label: 'Préstamos', to: '/prestamos' });
    }

    if (canGestionarDevoluciones || canGestionarPrestamos) {
      gestionItems.push({ icon: Undo2, label: 'Devoluciones', to: '/devoluciones' });
    }

    if (canGestionarUbicaciones) {
      gestionItems.push({ icon: MapPin, label: 'Ubicaciones', to: '/ubicaciones' });
    }

    if (canGestionarTraspasos) {
      gestionItems.push({ icon: ArrowLeftRight, label: 'Traspasos', to: '/traspasos' });
    }

    if (canGestionarProrrogas) {
      gestionItems.push({ icon: Calendar, label: 'Prórrogas', to: '/prorrogas' });
    }

    gestionItems.push({ icon: BarChart3, label: 'Reportes', to: '/reportes' });

    if (gestionItems.length > 0) {
      sections.push({ label: 'Gestión', items: gestionItems });
    }

    if (isAdmin) {
      sections.push({
        label: 'Administración',
        items: [
          { icon: Users, label: 'Usuarios', to: '/usuarios' },
          { icon: UserCircle, label: 'Personas', to: '/personas' },
          { icon: Ban, label: 'Bloqueos', to: '/bloqueos' },
        ],
      });
    }

    return sections;
  }, [
    canViewDashboard,
    canGestionarCarpetas,
    canGestionarPrestamos,
    canGestionarDevoluciones,
    canGestionarUbicaciones,
    canGestionarTraspasos,
    isAdmin,
  ]);

  return (
    <div className="h-screen bg-gradient-to-br from-surface-100 via-brand-50 to-surface-200 dark:from-sepia-950 dark:to-sepia-900 flex overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-300/30 dark:bg-brand-dark-400/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-500/20 dark:bg-brand-dark-500/10 blur-[120px] pointer-events-none" />

      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} m-4 mr-0 rounded-2xl glass-panel flex flex-col z-10 hidden md:flex transition-all duration-300`}>
        <div className={`p-4 flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 dark:from-brand-dark-500 dark:to-brand-dark-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/30 flex-shrink-0">
            <FolderSearch size={20} />
          </div>
          {!sidebarCollapsed && (
            <h1 className="font-bold text-xl text-surface-900 dark:text-sepia-100 tracking-tight">
              Archivo<span className="text-brand-600 dark:text-brand-dark-400">Sys</span>
            </h1>
          )}
        </div>

        <nav className="flex-1 px-3 py-2 space-y-3 overflow-y-auto min-h-0">
          {navSections.map((section) => (
            <div key={section.label}>
              {!sidebarCollapsed && (
                <p className="text-xs font-semibold text-surface-400 dark:text-sepia-500 uppercase tracking-wider px-3 mb-2">
                  {section.label}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                      sidebarCollapsed ? 'justify-center' : ''
                    } ${
                      location.pathname === item.to
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-dark-600/20 dark:text-brand-dark-400 font-medium shadow-sm border border-brand-100/50 dark:border-brand-dark-600/30'
                        : 'text-surface-600 dark:text-sepia-400 hover:bg-white/50 dark:hover:bg-sepia-800/50 hover:text-surface-900 dark:hover:text-sepia-200'
                    }`}
                  >
                    <div className={location.pathname === item.to ? 'text-brand-600 dark:text-brand-dark-400' : 'text-surface-400 dark:text-sepia-500'}>
                      <item.icon size={18} />
                    </div>
                    {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className={`p-3 mt-auto space-y-2 border-t border-white/30 dark:border-sepia-700/30`}>
          {!sidebarCollapsed ? (
            <Link
              to="/perfil"
              className="glass-card rounded-xl p-3 flex items-center gap-3 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-surface-200 dark:bg-sepia-700 flex items-center justify-center text-surface-500 dark:text-sepia-400 flex-shrink-0">
                <UserCircle size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-surface-800 dark:text-sepia-200 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-surface-500 dark:text-sepia-500">{primaryRole}</p>
              </div>
            </Link>
          ) : (
            <Link
              to="/perfil"
              title="Perfil"
              className="w-full flex items-center justify-center py-2 rounded-xl text-surface-600 dark:text-sepia-400 hover:bg-white/50 dark:hover:bg-sepia-800/50 transition-colors"
            >
              <UserCircle size={18} />
            </Link>
          )}

            <div className="flex items-center gap-1">
              <button
               onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
               title={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
               className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-surface-500 dark:text-sepia-500 hover:bg-white/50 dark:hover:bg-sepia-800/50 transition-colors"
             >
               {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
               {!sidebarCollapsed && <span className="text-sm">Colapsar</span>}
             </button>
           </div>

          <button
            onClick={logout}
            title={sidebarCollapsed ? 'Cerrar sesión' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-sm font-medium ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={18} />
            {!sidebarCollapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 z-10 flex flex-col h-screen overflow-y-auto">
        <header className="flex justify-between items-center mb-8 glass-panel px-6 py-4 rounded-2xl">
          <div>
            <h2 className="text-2xl font-bold text-surface-800 dark:text-sepia-200">
              Hola, {user?.firstName ?? 'Usuario'}
            </h2>
            <p className="text-surface-500 dark:text-sepia-400 text-sm mt-1"> Rol: {primaryRole}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 dark:text-sepia-500" size={18} />
              <input
                type="text"
                placeholder="Buscar expediente..."
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && headerSearch.trim()) {
                    navigate(`/carpetas?q=${encodeURIComponent(headerSearch.trim())}`);
                    setHeaderSearch('');
                  }
                }}
                className="pl-10 pr-4 py-2 rounded-xl bg-white/50 dark:bg-sepia-800/50 border border-white/40 dark:border-sepia-700/40 focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:bg-white dark:focus:bg-sepia-800 w-64 transition-all"
              />
            </div>
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl bg-white/50 dark:bg-sepia-800/50 border border-white/40 dark:border-sepia-700/40 flex items-center justify-center text-surface-600 dark:text-sepia-400 hover:text-brand-600 dark:hover:text-brand-dark-400 hover:bg-white dark:hover:bg-sepia-800 transition-colors"
              title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <NotificationBell />
            <Link
              to="/perfil"
              className="w-10 h-10 rounded-xl bg-white/50 dark:bg-sepia-800/50 border border-white/40 dark:border-sepia-700/40 flex items-center justify-center text-surface-600 dark:text-sepia-400 hover:text-brand-600 dark:hover:text-brand-dark-400 hover:bg-white dark:hover:bg-sepia-800 transition-colors"
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
