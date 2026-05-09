import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_ALL_PERSONAS, CREAR_PERSONA } from '../lib/queries';
import { UserPlus, X, Search } from 'lucide-react';

interface FormData {
  ci: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  direccion: string;
  fechaNaci: string;
  cargo: string;
}

const emptyForm: FormData = {
  ci: '', nombre: '', apellido: '', telefono: '', email: '', direccion: '', fechaNaci: '', cargo: '',
};

export default function PersonasPage() {
  const { data, loading, refetch } = useQuery(GET_ALL_PERSONAS);
  const [crearPersona] = useMutation(CREAR_PERSONA);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');

  const filtered = (data?.allPersonas ?? []).filter((p: { ci: string; nombre: string; apellido: string }) => {
    const q = search.toLowerCase();
    return p.ci.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q) || p.apellido.toLowerCase().includes(q);
  });

  const openCreate = () => {
    setForm(emptyForm);
    setShowForm(true);
    setFormError('');
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.ci || !form.nombre || !form.apellido) {
      setFormError('CI, nombre y apellido son obligatorios');
      return;
    }
    try {
      const vars: Record<string, unknown> = {
        ci: form.ci,
        nombre: form.nombre,
        apellido: form.apellido,
      };
      if (form.telefono) vars.telefono = form.telefono;
      if (form.email) vars.email = form.email;
      if (form.direccion) vars.direccion = form.direccion;
      if (form.fechaNaci) vars.fechaNaci = form.fechaNaci;
      if (form.cargo) vars.cargo = form.cargo;

      const { data: res } = await crearPersona({ variables: vars });
      if (res?.crearPersona?.error) throw new Error(res.crearPersona.error);
      setShowForm(false);
      refetch();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  if (loading) {
    return <div className="glass-panel rounded-2xl p-8 text-center text-surface-500">Cargando personas...</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-surface-800">Registro de Personas</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-medium shadow-md shadow-brand-500/30 hover:shadow-lg transition-all text-sm"
        >
          <UserPlus size={16} />
          Registrar Persona
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por CI, nombre o apellido..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl glass-panel bg-white/60 text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-all"
        />
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/20">
              <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">CI</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Nombre</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Teléfono</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Email</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Cargo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filtered.map((p: {
              id: string; ci: string; nombre: string; apellido: string;
              telefono?: string; email?: string; cargo?: string;
            }) => (
              <tr key={p.id} className="hover:bg-white/30 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-surface-800">{p.ci}</td>
                <td className="px-6 py-4 text-sm text-surface-700">{p.nombre} {p.apellido}</td>
                <td className="px-6 py-4 text-sm text-surface-600">{p.telefono || '—'}</td>
                <td className="px-6 py-4 text-sm text-surface-600">{p.email || '—'}</td>
                <td className="px-6 py-4">
                  {p.cargo ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-100 text-brand-700">
                      {p.cargo}
                    </span>
                  ) : (
                    <span className="text-xs text-surface-400">Sin cargo</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-surface-400">
            <p className="text-lg font-medium">No se encontraron personas</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-surface-800">Registrar Persona</h3>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2.5">{formError}</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <Field label="CI *" value={form.ci} onChange={(v) => setForm({ ...form, ci: v })} />
              <Field label="Nombre *" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} />
              <Field label="Apellido *" value={form.apellido} onChange={(v) => setForm({ ...form, apellido: v })} />
              <Field label="Teléfono" value={form.telefono} onChange={(v) => setForm({ ...form, telefono: v })} />
              <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <Field label="Dirección" value={form.direccion} onChange={(v) => setForm({ ...form, direccion: v })} />
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Fecha de Nacimiento</label>
                <input
                  type="date"
                  value={form.fechaNaci}
                  onChange={(e) => setForm({ ...form, fechaNaci: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/40 text-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-all"
                />
              </div>
              <Field label="Cargo" value={form.cargo} onChange={(v) => setForm({ ...form, cargo: v })} />
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
                Registrar Persona
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-surface-700 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/40 text-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-all"
      />
    </div>
  );
}
