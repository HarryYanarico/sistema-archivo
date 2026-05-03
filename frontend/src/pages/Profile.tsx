import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, UserCircle, LogOut } from 'lucide-react';

const roleColors: Record<string, string> = {
  Administrador: 'bg-brand-100 text-brand-700 border-brand-200',
  Administrativo: 'bg-amber-100 text-amber-700 border-amber-200',
  Operador: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

const roleIcons: Record<string, string> = {
  Administrador: 'bg-gradient-to-tr from-brand-600 to-brand-400',
  Administrativo: 'bg-gradient-to-tr from-amber-500 to-amber-400',
  Operador: 'bg-gradient-to-tr from-indigo-600 to-indigo-400',
};

export default function Profile() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const primaryRole = user.groups[0]?.name ?? 'Sin rol asignado';
  const gradient = roleIcons[primaryRole] ?? 'bg-gradient-to-tr from-surface-500 to-surface-400';
  const badgeClass = roleColors[primaryRole] ?? 'bg-surface-100 text-surface-700 border-surface-200';

  const humanPermLabel = (perm: string) => {
    const parts = perm.split('.');
    const action = parts[1]?.split('_')[0] ?? '';
    const model = parts[1]?.split('_').slice(1).join(' ') ?? perm;
    const labels: Record<string, string> = { add: 'Crear', change: 'Editar', delete: 'Eliminar', view: 'Ver' };
    return `${labels[action] ?? action} ${model.charAt(0).toUpperCase() + model.slice(1)}`;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-surface-800">Mi Perfil</h2>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors text-sm font-medium"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>

      <div className="glass-panel rounded-2xl p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
          <div className={`w-24 h-24 rounded-2xl ${gradient} flex items-center justify-center text-white shadow-lg`}>
            <UserCircle size={48} />
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-bold text-surface-800">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-surface-500 text-sm mt-0.5">@{user.username}</p>
            <span className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-sm font-semibold border ${badgeClass}`}>
              <Shield size={14} />
              {primaryRole}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoCard icon={<User size={18} />} label="Usuario" value={user.username} />
          <InfoCard icon={<Mail size={18} />} label="Correo" value={user.email || 'No registrado'} />
          <InfoCard icon={<Shield size={18} />} label="Estado" value={user.isActive ? 'Activo' : 'Inactivo'} />
          <InfoCard
            icon={<Shield size={18} />}
            label="Roles"
            value={user.groups.map((g) => g.name).join(', ') || 'Ninguno'}
          />
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-8">
        <h3 className="text-lg font-bold text-surface-800 mb-4 flex items-center gap-2">
          <Shield size={20} />
          Permisos asignados ({user.permissionsList.length})
        </h3>
        {(user.permissionsList ?? []).length === 0 ? (
          <p className="text-surface-400 text-sm">Sin permisos específicos asignados.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[...(user.permissionsList ?? [])].sort().map((perm) => (
              <div key={perm} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-50 text-sm text-surface-700">
                <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                {humanPermLabel(perm)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center gap-2 text-surface-400 mb-1">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-surface-800 font-semibold text-sm truncate">{value}</p>
    </div>
  );
}
