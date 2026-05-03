import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  GET_ALL_USERS,
  GET_ALL_GROUPS,
  GET_ALL_PERMISSIONS,
  CREATE_USER,
  UPDATE_USER,
  DELETE_USER,
} from '../lib/queries';
import { Pencil, Trash2, X, Check, UserPlus, Eye, EyeOff, Search } from 'lucide-react';

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
  const { data: usersData, loading: loadingUsers, refetch } = useQuery(GET_ALL_USERS);
  const { data: groupsData } = useQuery(GET_ALL_GROUPS);
  const { data: permsData } = useQuery(GET_ALL_PERMISSIONS);

  const [createUser] = useMutation(CREATE_USER);
  const [updateUser] = useMutation(UPDATE_USER);
  const [deleteUser] = useMutation(DELETE_USER);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');
  const [expandedPerms, setExpandedPerms] = useState<string | null>(null);

  const groupedPerms = permsData?.allPermissions.reduce((acc: Record<string, typeof permsData.allPermissions>, p) => {
    const model = p.contentTypeModel;
    if (!acc[model]) acc[model] = [];
    acc[model].push(p);
    return acc;
  }, {}) ?? {};

  const filteredUsers = (usersData?.allUsers ?? []).filter((u: { username: string; firstName: string; lastName: string; email: string }) => {
    const q = search.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setFormError('');
  };

  const openEdit = (user: {
    id: string; username: string; firstName: string; lastName: string; email: string;
    groups: { id: string }[]; permissionsList: string[];
  }) => {
    setForm({
      username: user.username,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      groupId: user.groups[0]?.id ?? '',
      permissionIds: [],
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
            permissionIds: form.permissionIds.length > 0 ? form.permissionIds : null,
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
            permissionIds: form.permissionIds.length > 0 ? form.permissionIds : null,
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

  const toggleAllPermsForModel = (model: string) => {
    const modelPerms = groupedPerms[model] ?? [];
    const allSelected = modelPerms.every((p) => form.permissionIds.includes(p.id));
    if (allSelected) {
      setForm((prev) => ({
        ...prev,
        permissionIds: prev.permissionIds.filter((id) => !modelPerms.some((p) => p.id === id)),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        permissionIds: [...new Set([...prev.permissionIds, ...modelPerms.map((p) => p.id)])],
      }));
    }
  };

  const roleColors: Record<string, string> = {
    Administrador: 'bg-brand-100 text-brand-700',
    Administrativo: 'bg-amber-100 text-amber-700',
    Operador: 'bg-indigo-100 text-indigo-700',
  };

  const humanPermLabel = (perm: string) => {
    const action = perm.split('_')[0];
    const model = perm.split('_').slice(1).join(' ');
    const labels: Record<string, string> = { add: 'Crear', change: 'Editar', delete: 'Eliminar', view: 'Ver' };
    return `${labels[action] ?? action} ${model}`;
  };

  if (loadingUsers) {
    return <div className="glass-panel rounded-2xl p-8 text-center text-surface-500">Cargando usuarios...</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-surface-800">Gestión de Usuarios</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-medium shadow-md shadow-brand-500/30 hover:shadow-lg transition-all text-sm"
        >
          <UserPlus size={16} />
          Nuevo Usuario
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por nombre, usuario o correo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl glass-panel bg-white/60 text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-all"
        />
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/20">
              <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Usuario</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Rol</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Estado</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Permisos</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredUsers.map((user: {
              id: string; username: string; firstName: string; lastName: string;
              email: string; groups: { id: string; name: string }[];
              isActive: boolean; permissionsList: string[];
            }) => (
              <tr key={user.id} className="hover:bg-white/30 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold text-surface-800 text-sm">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-surface-500">@{user.username}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {user.groups[0] ? (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${roleColors[user.groups[0].name] ?? 'bg-surface-100 text-surface-600'}`}>
                      {user.groups[0].name}
                    </span>
                  ) : (
                    <span className="text-xs text-surface-400">Sin rol</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.isActive ? 'text-green-600' : 'text-red-500'}`}>
                    <span className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                    {user.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => setExpandedPerms(expandedPerms === user.id ? null : user.id)}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                  >
                    <Eye size={12} />
                    {user.permissionsList.length} permisos
                  </button>
                  {expandedPerms === user.id && (
                    <div className="mt-2 p-3 rounded-lg bg-surface-50 text-xs text-surface-600 space-y-1 max-w-xs">
                      {user.permissionsList.length === 0 ? (
                        <span className="text-surface-400">Sin permisos</span>
                      ) : (
                        [...(user.permissionsList ?? [])].sort().map((p) => (
                          <div key={p} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                            {humanPermLabel(p)}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(user)}
                      className="p-2 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="p-2 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-surface-400">
            <p className="text-lg font-medium">No se encontraron usuarios</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-surface-800">
                {editingId ? 'Editar Usuario' : 'Crear Usuario'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2.5">{formError}</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Field label="Usuario *" value={form.username} onChange={(v) => setForm({ ...form, username: v })} disabled={!!editingId} />
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Contraseña *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full px-4 py-2.5 pr-11 rounded-xl bg-white/60 border border-white/40 text-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-all"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}
              <Field label="Nombre *" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
              <Field label="Apellido *" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
              <Field label="Correo" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Rol</label>
                <select
                  value={form.groupId}
                  onChange={(e) => setForm({ ...form, groupId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/40 text-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-all"
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
                <h4 className="text-sm font-semibold text-surface-700">Permisos individuales (opcional)</h4>
                <span className="text-xs text-surface-400">{form.permissionIds.length} seleccionados</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {Object.entries(groupedPerms).map(([model, perms]) => {
                  const allSelected = perms.every((p) => form.permissionIds.includes(p.id));
                  return (
                    <div key={model} className="rounded-lg border border-white/10 overflow-hidden">
                      <button
                        onClick={() => {
                          if (expandedPerms === model) setExpandedPerms(null);
                          else setExpandedPerms(model);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 bg-surface-50 text-xs font-medium text-surface-700 hover:bg-surface-100 transition-colors"
                      >
                        <span className="capitalize">{model}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleAllPermsForModel(model); }}
                            className="text-brand-600 hover:text-brand-700"
                          >
                            {allSelected ? <X size={14} /> : <Check size={14} />}
                          </button>
                        </div>
                      </button>
                      {expandedPerms === model && (
                        <div className="p-2 grid grid-cols-2 gap-1">
                          {perms.map((p) => (
                            <label key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-50 cursor-pointer text-xs">
                              <input
                                type="checkbox"
                                checked={form.permissionIds.includes(p.id)}
                                onChange={() => togglePerm(p.id)}
                                className="rounded border-surface-300 text-brand-600 focus:ring-brand-400"
                              />
                              <span className="text-surface-600">{humanPermLabel(p.codename)}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl text-surface-600 bg-white/60 border border-white/80 hover:bg-white transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-medium shadow-md shadow-brand-500/30 hover:shadow-lg transition-all text-sm"
              >
                {editingId ? 'Guardar Cambios' : 'Crear Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, value, onChange, disabled = false }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-surface-700 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/40 text-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}
