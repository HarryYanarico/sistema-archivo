import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  GET_ALL_USERS,
  GET_ALL_USERS_PAGINATED,
  GET_ALL_GROUPS,
  GET_ALL_PERMISSIONS,
  CREATE_USER,
  UPDATE_USER,
  DELETE_USER,
  RESET_USER_2FA,
  GET_ALL_AMBIENTES,
  ASIGNAR_AMBIENTES,
  GENERATE_RESET_CODE,
  FORZAR_CIERRE_SESION,
} from '../lib/queries';
import { useAuth } from '../context/AuthContext';
import { Pencil, Trash2, X, Check, UserPlus, Eye, EyeOff, Search, Building2, Loader2, QrCode, Info, AlertTriangle, Key, LogOut } from 'lucide-react';
import Pagination from '../components/Pagination';

interface FormData {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  groupId: string;
  permissionIds: string[];
}

const emptyForm: FormData = {
  username: '', password: '', firstName: '', lastName: '', email: '', groupId: '', permissionIds: [],
};

export default function UsersPage() {
  const { data: groupsData, loading: loadingGroups } = useQuery(GET_ALL_GROUPS);
  const { data: permsData, loading: loadingPerms } = useQuery(GET_ALL_PERMISSIONS);

  const [createUser] = useMutation(CREATE_USER);
  const [updateUser] = useMutation(UPDATE_USER);
  const [deleteUser] = useMutation(DELETE_USER);
  const { data: ambData } = useQuery(GET_ALL_AMBIENTES);
  const [asignarAmb] = useMutation(ASIGNAR_AMBIENTES);
  const [resetUser2fa] = useMutation(RESET_USER_2FA);
  const [generateResetCode] = useMutation(GENERATE_RESET_CODE);
  const [forzarCierreSesion] = useMutation(FORZAR_CIERRE_SESION);
  const { user: currentUser } = useAuth();

  const [detailMsg, setDetailMsg] = useState('');
  const [resetting2FA, setResetting2FA] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [showResetCode, setShowResetCode] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [forzandoCierre, setForzandoCierre] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [groupPermCodenames, setGroupPermCodenames] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { data: usersData, loading: loadingUsers, refetch } = useQuery(GET_ALL_USERS_PAGINATED, {
    variables: { page: currentPage, pageSize: itemsPerPage, search: search || undefined },
    fetchPolicy: 'network-only',
  });

  const [ambModalUser, setAmbModalUser] = useState<string | null>(null);
  const [ambSelected, setAmbSelected] = useState<string[]>([]);
  const [ambMsg, setAmbMsg] = useState('');
  const [ambSaving, setAmbSaving] = useState(false);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);

  const filteredUsers = (usersData?.allUsersPaginated?.items ?? []) as {
    id: string; username: string; firstName: string; lastName: string;
    email: string; groups: { id: string; name: string }[];
    isActive: boolean; permissionsList: string[]; ambientesAsignados: string[];
  }[];
  const totalCount = usersData?.allUsersPaginated?.totalCount ?? 0;

  const detailUser = detailUserId
    ? filteredUsers.find((u: { id: string }) => u.id === detailUserId) ?? null
    : null;

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setGroupPermCodenames([]);
    setShowForm(true);
    setFormError('');
  };

  const openEdit = (user: {
    id: string; username: string; firstName: string; lastName: string; email: string;
    groups: { id: string }[]; permissionsList: string[]; directPermissionIds: string[];
  }) => {
    const userGroupId = user.groups[0]?.id ?? '';
    const userGroup = groupsData?.allGroups?.find((g: { id: string }) => g.id === userGroupId);
    setGroupPermCodenames(userGroup?.permissions?.map((p: { codename: string }) => p.codename) ?? []);
    setForm({
      username: user.username,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      groupId: userGroupId,
      permissionIds: user.directPermissionIds ?? [],
    });
    setEditingId(user.id);
    setShowForm(true);
    setFormError('');
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.username || !form.firstName || !form.lastName) {
      setFormError('Usuario, nombre y apellido son obligatorios');
      return;
    }
    if (!editingId && !form.password) {
      setFormError('La contraseña es obligatoria para nuevos usuarios');
      return;
    }
    try {
      if (editingId) {
        const { data } = await updateUser({
          variables: {
            userId: editingId,
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            groupId: form.groupId || null,
            permissionIds: form.permissionIds,
          },
        });
        if (data?.updateUser?.error) throw new Error(data.updateUser.error);
      } else {
        const { data } = await createUser({
          variables: {
            username: form.username,
            password: form.password,
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            groupId: form.groupId || null,
            permissionIds: form.permissionIds,
          },
        });
        if (data?.createUser?.error) throw new Error(data.createUser.error);
      }
      setShowForm(false);
      refetch();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    try {
      const { data } = await deleteUser({ variables: { userId } });
      if (data?.deleteUser?.error) throw new Error(data.deleteUser.error);
      refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const togglePerm = (permId: string) => {
    setForm((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permId)
        ? prev.permissionIds.filter((id) => id !== permId)
        : [...prev.permissionIds, permId],
    }));
  };

  const roleColors: Record<string, string> = {
    Administrador: 'bg-brand-100 text-brand-700 dark:bg-brand-dark-600/20 dark:text-brand-dark-400',
    Archivista: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    Operador: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    Consultor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  };

  const permMeta: Record<string, { name: string; desc: string }> = {
    gestionar_carpetas: { name: 'Gestionar Carpetas', desc: 'CRUD carpetas, incidentes' },
    gestionar_documentos: { name: 'Gestionar Documentos', desc: 'Subir/ver documentos' },
    gestionar_prestamos: { name: 'Gestionar Préstamos', desc: 'Registrar préstamos' },
    gestionar_devoluciones: { name: 'Gestionar Devoluciones', desc: 'Registrar devoluciones' },
    gestionar_traspasos: { name: 'Gestionar Traspasos', desc: 'Transferir carpetas' },
    gestionar_ubicaciones: { name: 'Gestionar Ubicaciones', desc: 'CRUD ambientes, estantes, pisos' },
    gestionar_personas: { name: 'Gestionar Personas', desc: 'CRUD de personas' },
    gestionar_bloqueos: { name: 'Gestionar Bloqueos', desc: 'Bloquear/desbloquear personas' },
    gestionar_prorrogas: { name: 'Gestionar Prórrogas', desc: 'Aprobar/rechazar prórrogas' },
    gestionar_usuarios: { name: 'Gestionar Usuarios', desc: 'CRUD usuarios y grupos (solo admin)' },
    ver_dashboard: { name: 'Ver Dashboard', desc: 'Reportes y estadísticas' },
  };

  const permName = (perm: string) => {
    const clean = perm.replace('api.', '');
    return permMeta[clean]?.name ?? clean;
  };

  const permDesc = (perm: string) => {
    const clean = perm.replace('api.', '');
    return permMeta[clean]?.desc ?? '';
  };

   if (loadingUsers || loadingPerms) {
     return <div className="glass-panel rounded-2xl p-8 text-center text-surface-600 dark:text-sepia-500">Cargando...</div>;
   }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-surface-800 dark:text-sepia-200">Gestión de Usuarios</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 dark:from-brand-dark-500 dark:to-brand-dark-600 text-white font-medium shadow-md shadow-brand-500/30 dark:shadow-brand-dark-600/20 hover:shadow-lg transition-all text-sm"
        >
          <UserPlus size={16} />
          Nuevo Usuario
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500 dark:text-sepia-500" size={18} />
        <input
          type="text"
          placeholder="Buscar por nombre, usuario o correo..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="w-full pl-11 pr-4 py-3 rounded-xl glass-panel bg-white/60 dark:bg-sepia-800/60 text-surface-800 dark:text-sepia-200 placeholder:text-surface-500 dark:placeholder:text-sepia-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 transition-all"
        />
      </div>

      <div className="glass-panel rounded-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/20 dark:border-sepia-700/30">
          <h3 className="text-lg font-bold text-surface-800 dark:text-sepia-200">Usuarios</h3>
          <span className="text-sm text-surface-600 dark:text-sepia-500">{totalCount} resultado(s)</span>
        </div>
        <div className="overflow-auto">
          <table className="w-full">
          <thead className="sticky top-0 bg-white/70 dark:bg-sepia-900/90 backdrop-blur-md z-10">
            <tr className="border-b border-white/20 dark:border-sepia-700/30">
              <th className="text-left px-6 py-4 text-xs font-semibold text-surface-600 dark:text-sepia-500 uppercase tracking-wider">Usuario</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-surface-600 dark:text-sepia-500 uppercase tracking-wider">Rol</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-surface-600 dark:text-sepia-500 uppercase tracking-wider">Estado</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-surface-600 dark:text-sepia-500 uppercase tracking-wider">Ambientes</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-surface-600 dark:text-sepia-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 dark:divide-sepia-700/20">
            {filteredUsers.map((user: {
              id: string; username: string; firstName: string; lastName: string;
              email: string; groups: { id: string; name: string }[];
              isActive: boolean; permissionsList: string[];
            }) => (
              <tr key={user.id} className="hover:bg-white/30 dark:hover:bg-sepia-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold text-surface-800 dark:text-sepia-200 text-sm">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-surface-600 dark:text-sepia-500">@{user.username}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {user.groups[0] ? (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${roleColors[user.groups[0].name] ?? 'bg-surface-100 text-surface-600 dark:bg-sepia-800 dark:text-sepia-400'}`}>
                      {user.groups[0].name}
                    </span>
                  ) : (
                    <span className="text-xs text-surface-500 dark:text-sepia-500">Sin rol</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500 dark:bg-green-400' : 'bg-red-400 dark:bg-red-400'}`} />
                    {user.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => {
                    setAmbModalUser(user.id);
                    setAmbSelected(user.ambientesAsignados?.map(String) ?? []);
                    setAmbMsg('');
                  }}
                    className="text-xs text-brand-600 dark:text-brand-dark-400 hover:text-brand-700 dark:hover:text-brand-dark-400 font-medium flex items-center gap-1"
                  >
                    <Building2 size={12} />
                    {(user.ambientesAsignados?.length ?? 0)} ambientes
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                     <button
                       onClick={() => setDetailUserId(user.id)}
                       className="p-2 rounded-lg text-surface-500 dark:text-sepia-500 hover:text-brand-600 dark:hover:text-brand-dark-400 hover:bg-brand-50 dark:hover:bg-brand-dark-600/20 transition-colors"
                       title="Ver detalle"
                     >
                       <Info size={16} />
                     </button>
                    <button
                      onClick={() => openEdit(user)}
                      className="p-2 rounded-lg text-surface-500 dark:text-sepia-500 hover:text-brand-600 dark:hover:text-brand-dark-400 hover:bg-brand-50 dark:hover:bg-brand-dark-600/20 transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="p-2 rounded-lg text-surface-500 dark:text-sepia-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalCount === 0 && (
          <div className="text-center py-12 text-surface-500 dark:text-sepia-500">
            <p className="text-lg font-medium">No se encontraron usuarios</p>
          </div>
        )}
        </div>
        <Pagination currentPage={currentPage} totalItems={totalCount} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-surface-800 dark:text-sepia-200">
                {editingId ? 'Editar Usuario' : 'Crear Usuario'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-700 dark:hover:text-red-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-2.5">{formError}</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Field label="Usuario *" value={form.username} onChange={(v) => setForm({ ...form, username: v })} disabled={!!editingId} />
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-sepia-300 mb-1.5">Contraseña *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full px-4 py-2.5 pr-11 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 transition-all"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 dark:text-sepia-500">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}
              <Field label="Nombre *" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
              <Field label="Apellido *" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
              <Field label="Correo" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-sepia-300 mb-1.5">Rol</label>
                <select
                  value={form.groupId}
                  onChange={(e) => {
                    const newGroupId = e.target.value;
                    const newGroup = groupsData?.allGroups?.find((g: { id: string }) => g.id === newGroupId);
                    setGroupPermCodenames(newGroup?.permissions?.map((p: { codename: string }) => p.codename) ?? []);
                    setForm({ ...form, groupId: newGroupId });
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 transition-all"
                >
                  <option value="">Sin rol</option>
                  {groupsData?.allGroups.map((g: { id: string; name: string }) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-surface-700 dark:text-sepia-300">Permisos por característica</h4>
                <span className="text-xs text-surface-500 dark:text-sepia-500">{form.permissionIds.length} directos seleccionados</span>
              </div>
              {form.groupId && groupPermCodenames.length > 0 && (
                <p className="text-xs text-surface-500 dark:text-sepia-500 mb-3">
                  Los permisos marcados como <span className="text-amber-600 dark:text-amber-400 font-medium">(del grupo)</span> son heredados del rol y no se pueden desmarcar individualmente.
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(permsData?.allPermissions ?? []).map((p: { id: string; codename: string }) => {
                  const isDirect = form.permissionIds.includes(p.id);
                  const isGroupDerived = !isDirect && groupPermCodenames.includes(p.codename);

                  return (
                    <label
                      key={p.id}
                      className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border border-white/10 dark:border-sepia-700/20 transition-colors ${
                        isGroupDerived
                          ? 'bg-amber-50/50 dark:bg-amber-900/10 cursor-default'
                          : 'hover:bg-white/30 dark:hover:bg-sepia-800/50 cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isDirect || isGroupDerived}
                        disabled={isGroupDerived}
                        onChange={() => { if (!isGroupDerived) togglePerm(p.id); }}
                        className="mt-0.5 w-4 h-4 rounded border-surface-300 text-brand-600 dark:text-brand-dark-400 focus:ring-brand-400 dark:focus:ring-brand-dark-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-surface-700 dark:text-sepia-300">
                          {permName(p.codename)}
                          {isGroupDerived && (
                            <span className="ml-1.5 text-xs text-amber-600 dark:text-amber-400 font-normal">
                              (del grupo)
                            </span>
                          )}
                        </p>
                        {permDesc(p.codename) && <p className="text-[10px] text-surface-500 dark:text-sepia-500">{permDesc(p.codename)}</p>}
                      </div>
                    </label>
                  );
                })}
              </div>
              {(!permsData?.allPermissions || permsData.allPermissions.length === 0) && (
                <p className="text-sm text-surface-500 dark:text-sepia-500 mt-2">No hay permisos disponibles. Ejecuta las migraciones del backend.</p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl text-surface-600 dark:text-sepia-400 bg-white/60 dark:bg-sepia-800/60 border border-white/80 dark:border-sepia-700/60 hover:bg-white dark:hover:bg-sepia-800 transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 dark:from-brand-dark-500 dark:to-brand-dark-600 text-white font-medium shadow-md shadow-brand-500/30 dark:shadow-brand-dark-600/20 hover:shadow-lg transition-all text-sm"
              >
                {editingId ? 'Guardar Cambios' : 'Crear Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailUser && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-surface-800 dark:text-sepia-200">Detalle del Usuario</h3>
               <button onClick={() => { setDetailUserId(null); setDetailMsg(''); setResetCode(''); setShowResetCode(false); }} className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-700 dark:hover:text-red-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            {detailMsg && (
              <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-medium ${
                detailMsg.startsWith('✅') ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
              }`}>{detailMsg}</div>
            )}

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-4 pb-4 border-b border-white/10 dark:border-sepia-700/20">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-brand-300 dark:from-brand-dark-500 dark:to-brand-dark-400 flex items-center justify-center text-white text-xl font-bold shadow-md">
                  {detailUser.firstName?.[0]?.toUpperCase()}{detailUser.lastName?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-bold text-surface-800 dark:text-sepia-200">{detailUser.firstName} {detailUser.lastName}</p>
                  <p className="text-sm text-surface-600 dark:text-sepia-500">@{detailUser.username}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-surface-500 dark:text-sepia-500 uppercase tracking-wider">Email</label>
                  <p className="text-sm text-surface-800 dark:text-sepia-200 mt-0.5">{detailUser.email || '—'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-surface-500 dark:text-sepia-500 uppercase tracking-wider">Rol</label>
                  <p className="mt-0.5">
                    {detailUser.groups[0] ? (
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${roleColors[detailUser.groups[0].name] ?? 'bg-surface-100 text-surface-600 dark:bg-sepia-800 dark:text-sepia-400'}`}>
                        {detailUser.groups[0].name}
                      </span>
                    ) : (
                      <span className="text-sm text-surface-500 dark:text-sepia-500">Sin rol</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-surface-500 dark:text-sepia-500 uppercase tracking-wider">ID</label>
                  <p className="text-sm text-surface-800 dark:text-sepia-200 mt-0.5">{detailUser.id}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-surface-500 dark:text-sepia-500 uppercase tracking-wider">Estado</label>
                  <p className="mt-0.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${detailUser.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                      <span className={`w-2 h-2 rounded-full ${detailUser.isActive ? 'bg-green-500 dark:bg-green-400' : 'bg-red-400 dark:bg-red-400'}`} />
                      {detailUser.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 dark:border-sepia-700/20">
                <label className="text-xs font-semibold text-surface-500 dark:text-sepia-500 uppercase tracking-wider mb-2 block">Permisos ({detailUser.permissionsList?.length ?? 0})</label>
                {detailUser.permissionsList?.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {[...(detailUser.permissionsList ?? [])].sort().map((p) => (
                      <div key={p} className="px-3 py-2 rounded-lg bg-surface-50 dark:bg-sepia-800 border border-white/10 dark:border-sepia-700/20">
                        <p className="text-xs font-medium text-surface-700 dark:text-sepia-300">{permName(p)}</p>
                        {permDesc(p) && <p className="text-[10px] text-surface-500 dark:text-sepia-500">{permDesc(p)}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-surface-500 dark:text-sepia-500">Sin permisos</p>
                )}
              </div>
            </div>

            {currentUser && detailUser?.id === currentUser.id && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 mb-2">
                <AlertTriangle size={20} className="text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                    Este es tu propio usuario
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Si restableces el QR, perderás acceso a tu cuenta. Pide a otro administrador que lo haga por ti.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  if (!confirm('¿Estás seguro? Al restablecer el QR, el usuario deberá escanear un nuevo código en su próximo inicio de sesión.')) return;
                  setResetting2FA(true);
                  setDetailMsg('');
                  try {
                    const { data } = await resetUser2fa({ variables: { userId: detailUser.id } });
                    if (data?.resetUser2fa?.success) {
                      setDetailMsg('✅ QR restablecido. El usuario verá el código en su próximo inicio de sesión.');
                    } else {
                      setDetailMsg(data?.resetUser2fa?.error || 'Error al restablecer QR.');
                    }
                  } catch {
                    setDetailMsg('Error de conexión.');
                  }
                  setResetting2FA(false);
                }}
                disabled={resetting2FA}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 dark:from-amber-500 dark:to-amber-600 text-white font-semibold shadow-md shadow-amber-500/30 dark:shadow-amber-800/30 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
              >
                {resetting2FA ? <Loader2 size={18} className="animate-spin" /> : <QrCode size={18} />}
                Restablecer QR de 2FA
              </button>

               <button
                 onClick={async () => {
                   setGeneratingCode(true);
                   setResetCode('');
                   setShowResetCode(false);
                   try {
                     const { data } = await generateResetCode({ variables: { userId: detailUser.id } });
                     if (data?.generateResetCode?.success) {
                       setResetCode(data.generateResetCode.code);
                       setShowResetCode(true);
                     } else {
                       setDetailMsg(data?.generateResetCode?.error || 'Error al generar código.');
                     }
                   } catch {
                     setDetailMsg('Error de conexión.');
                   }
                   setGeneratingCode(false);
                 }}
                 disabled={generatingCode}
                 className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-600 text-white font-semibold shadow-md shadow-blue-500/30 dark:shadow-blue-800/30 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
               >
                 {generatingCode ? <Loader2 size={18} className="animate-spin" /> : <Key size={18} />}
                 Generar código de restablecimiento
               </button>

               {detailUser.id !== currentUser?.id && (
                 <button
                   onClick={async () => {
                     if (!confirm('¿Estás seguro? Esta acción cerrará la sesión de este usuario en todos los dispositivos y invalidará sus permisos inmediatamente.')) return;
                     setForzandoCierre(true);
                     setDetailMsg('');
                     try {
                       const { data } = await forzarCierreSesion({ variables: { userId: detailUser.id } });
                       if (data?.forzarCierreSesion?.success) {
                         setDetailMsg('✅ Sesión cerrada exitosamente. El usuario perderá acceso en el próximo refresco.');
                       } else {
                         setDetailMsg(data?.forzarCierreSesion?.error || 'Error al forzar cierre.');
                       }
                     } catch {
                       setDetailMsg('Error de conexión.');
                     }
                     setForzandoCierre(false);
                   }}
                   disabled={forzandoCierre}
                   className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 dark:from-red-500 dark:to-red-600 text-white font-semibold shadow-md shadow-red-500/30 dark:shadow-red-800/30 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                 >
                   {forzandoCierre ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
                   Forzar cierre de sesión
                 </button>
               )}

              {showResetCode && resetCode && (
                <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-dark-600/10 border border-brand-200 dark:border-brand-dark-600/30 text-center space-y-2">
                  <p className="text-xs font-semibold text-surface-500 dark:text-sepia-500 uppercase tracking-wider">Código de restablecimiento (expira en 15 min)</p>
                  <p className="text-2xl font-mono font-bold text-brand-700 dark:text-brand-dark-400 tracking-widest select-all">{resetCode}</p>
                  <p className="text-[10px] text-surface-500 dark:text-sepia-500">Comparte este código solo con el usuario. Al usarlo, podrá elegir una nueva contraseña.</p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {ambModalUser && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-surface-800 dark:text-sepia-200">Asignar Ambientes</h3>
              <button onClick={() => setAmbModalUser(null)} className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-700 dark:hover:text-red-400 transition-colors">
                <X size={20} />
              </button>
            </div>
              {ambMsg && (
              <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-medium ${
                ambMsg.startsWith('✅') ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
              }`}>{ambMsg}</div>
            )}
            <div className="space-y-2 max-h-60 overflow-y-auto mb-6">
              {(ambData?.allAmbientes ?? []).map((a: { id: string; nombre: string }) => (
                <label key={a.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/30 dark:hover:bg-sepia-800/50 cursor-pointer border border-white/10 dark:border-sepia-700/20">
                  <input type="checkbox" checked={ambSelected.includes(a.id)} onChange={() => {
                    setAmbSelected((prev) => prev.includes(a.id) ? prev.filter((id) => id !== a.id) : [...prev, a.id]);
                  }} className="w-4 h-4 rounded border-surface-300 text-brand-600 dark:text-brand-dark-400 focus:ring-brand-400 dark:focus:ring-brand-dark-500" />
                  <span className="text-sm text-surface-700 dark:text-sepia-300">{a.nombre}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setAmbModalUser(null)}
                className="px-5 py-2.5 rounded-xl text-surface-600 dark:text-sepia-400 bg-white/60 dark:bg-sepia-800/60 border border-white/80 dark:border-sepia-700/60 hover:bg-white dark:hover:bg-sepia-800 transition-colors text-sm font-medium"
              >Cancelar</button>
              <button onClick={async () => {
                setAmbSaving(true); setAmbMsg('');
                try {
                  const { data } = await asignarAmb({ variables: { usuarioId: ambModalUser, idsAmbientes: ambSelected } });
                  if (data?.asignarAmbientes?.success) {
                    setAmbMsg('✅ Ambientes asignados correctamente.');
                    refetch();
                  } else {
                    setAmbMsg(data?.asignarAmbientes?.error || 'Error al asignar.');
                  }
                } catch { setAmbMsg('Error de conexión.'); }
                setAmbSaving(false);
              }} disabled={ambSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 dark:from-brand-dark-500 dark:to-brand-dark-600 text-white font-medium shadow-md dark:shadow-brand-dark-600/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {ambSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Guardar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function Field({ label, value, onChange, disabled = false }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-surface-700 dark:text-sepia-300 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}

