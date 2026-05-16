import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  GET_ALL_AMBIENTES, CREAR_AMBIENTE,
  GET_ALL_ESTANTES, CREAR_ESTANTE,
  GET_ALL_PISOS, CREAR_PISO,
  GET_ALL_CARPETAS, CREAR_CARPETA,
} from '../lib/queries';
import { Plus, X, Building2, Archive, Layers, FolderOpen } from 'lucide-react';

const tabs = [
  { key: 'ambientes', label: 'Ambientes', icon: Building2 },
  { key: 'estantes', label: 'Estantes', icon: Archive },
  { key: 'pisos', label: 'Pisos', icon: Layers },
  { key: 'carpetas', label: 'Carpetas', icon: FolderOpen },
];

export default function UbicacionesPage() {
  const [activeTab, setActiveTab] = useState('ambientes');

  return (
    <>
      <h2 className="text-2xl font-bold text-surface-800 mb-6">Gestión de Ubicaciones</h2>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === t.key
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
                : 'bg-white/60 text-surface-600 hover:bg-white/80 border border-white/40'
            }`}
          >
            <t.icon size={18} />
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'ambientes' && <AmbientesSection />}
      {activeTab === 'estantes' && <EstantesSection />}
      {activeTab === 'pisos' && <PisosSection />}
      {activeTab === 'carpetas' && <CarpetasSection />}
    </>
  );
}

function AmbientesSection() {
  const { data, loading, refetch } = useQuery(GET_ALL_AMBIENTES);
  const [crear] = useMutation(CREAR_AMBIENTE);
  const [show, setShow] = useState(false);
  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setError('');
    if (!nombre) { setError('Nombre es obligatorio'); return; }
    try {
      const vars: Record<string, unknown> = { nombre };
      if (ubicacion) vars.ubicacion = ubicacion;
      if (descripcion) vars.descripcion = descripcion;
      const { data: res } = await crear({ variables: vars });
      if (res?.crearAmbiente?.error) throw new Error(res.crearAmbiente.error);
      setShow(false); setNombre(''); setUbicacion(''); setDescripcion('');
      refetch();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  };

  if (loading) return <div className="glass-panel rounded-2xl p-8 text-center text-surface-500">Cargando...</div>;

  return (
    <SectionShell title="Ambientes" onAdd={() => setShow(true)}>
      <table className="w-full">
        <thead><tr className="border-b border-white/20">
          <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase">Nombre</th>
          <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase">Ubicación</th>
          <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase">Descripción</th>
        </tr></thead>
        <tbody className="divide-y divide-white/10">
          {(data?.allAmbientes ?? []).map((a: { id: string; nombre: string; ubicacion?: string; descripcion?: string }) => (
            <tr key={a.id} className="hover:bg-white/30 transition-colors">
              <td className="px-6 py-4 text-sm font-semibold text-surface-800">{a.nombre}</td>
              <td className="px-6 py-4 text-sm text-surface-600">{a.ubicacion || '—'}</td>
              <td className="px-6 py-4 text-sm text-surface-600">{a.descripcion || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {(data?.allAmbientes ?? []).length === 0 && <EmptyState />}
      <Modal show={show} title="Nuevo Ambiente" onClose={() => setShow(false)} error={error} onSave={handleCreate}>
        <Field label="Nombre *" value={nombre} onChange={setNombre} />
        <Field label="Ubicación" value={ubicacion} onChange={setUbicacion} />
        <Field label="Descripción" value={descripcion} onChange={setDescripcion} />
      </Modal>
    </SectionShell>
  );
}

function EstantesSection() {
  const { data, loading, refetch } = useQuery(GET_ALL_ESTANTES);
  const { data: ambData } = useQuery(GET_ALL_AMBIENTES);
  const [crear] = useMutation(CREAR_ESTANTE);
  const [show, setShow] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [numero, setNumero] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [estado, setEstado] = useState('');
  const [idAmbiente, setIdAmbiente] = useState('');
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setError('');
    if (!codigo || !idAmbiente) { setError('Código y Ambiente son obligatorios'); return; }
    try {
      const vars: Record<string, unknown> = { codigo, idAmbiente };
      if (numero) vars.numero = parseInt(numero);
      if (descripcion) vars.descripcion = descripcion;
      if (estado) vars.estado = estado;
      const { data: res } = await crear({ variables: vars });
      if (res?.crearEstante?.error) throw new Error(res.crearEstante.error);
      setShow(false); setCodigo(''); setNumero(''); setDescripcion(''); setEstado(''); setIdAmbiente('');
      refetch();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  };

  if (loading) return <div className="glass-panel rounded-2xl p-8 text-center text-surface-500">Cargando...</div>;

  return (
    <SectionShell title="Estantes" onAdd={() => setShow(true)}>
      <table className="w-full">
        <thead><tr className="border-b border-white/20">
          <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase">Código</th>
          <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase">Número</th>
          <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase">Ambiente</th>
          <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase">Estado</th>
          <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase">Descripción</th>
        </tr></thead>
        <tbody className="divide-y divide-white/10">
          {(data?.allEstantes ?? []).map((e: { id: string; codigo: string; numero?: number; descripcion?: string; estado?: string; ambiente: { nombre: string } }) => (
            <tr key={e.id} className="hover:bg-white/30 transition-colors">
              <td className="px-6 py-4 text-sm font-semibold text-surface-800">{e.codigo}</td>
              <td className="px-6 py-4 text-sm text-surface-600">{e.numero ?? '—'}</td>
              <td className="px-6 py-4 text-sm text-surface-600">{e.ambiente.nombre}</td>
              <td className="px-6 py-4 text-sm text-surface-600">{e.estado || '—'}</td>
              <td className="px-6 py-4 text-sm text-surface-600">{e.descripcion || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {(data?.allEstantes ?? []).length === 0 && <EmptyState />}
      <Modal show={show} title="Nuevo Estante" onClose={() => setShow(false)} error={error} onSave={handleCreate}>
        <Field label="Código *" value={codigo} onChange={setCodigo} />
        <Field label="Número" value={numero} onChange={setNumero} type="number" />
        <Field label="Descripción" value={descripcion} onChange={setDescripcion} />
        <Field label="Estado" value={estado} onChange={setEstado} />
        <Select label="Ambiente *" value={idAmbiente} onChange={setIdAmbiente}
          options={(ambData?.allAmbientes ?? []).map((a: { id: string; nombre: string }) => ({ value: a.id, label: a.nombre }))}
        />
      </Modal>
    </SectionShell>
  );
}

function PisosSection() {
  const { data, loading, refetch } = useQuery(GET_ALL_PISOS);
  const { data: estData } = useQuery(GET_ALL_ESTANTES);
  const [crear] = useMutation(CREAR_PISO);
  const [show, setShow] = useState(false);
  const [nroFila, setNroFila] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [capacidadMax, setCapacidadMax] = useState('');
  const [idEstante, setIdEstante] = useState('');
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setError('');
    if (!nroFila || !idEstante) { setError('N° de fila y Estante son obligatorios'); return; }
    try {
      const vars: Record<string, unknown> = { nroFila: parseInt(nroFila), idEstante };
      if (descripcion) vars.descripcion = descripcion;
      if (capacidadMax) vars.capacidadMax = parseInt(capacidadMax);
      const { data: res } = await crear({ variables: vars });
      if (res?.crearPiso?.error) throw new Error(res.crearPiso.error);
      setShow(false); setNroFila(''); setDescripcion(''); setCapacidadMax(''); setIdEstante('');
      refetch();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  };

  if (loading) return <div className="glass-panel rounded-2xl p-8 text-center text-surface-500">Cargando...</div>;

  return (
    <SectionShell title="Pisos" onAdd={() => setShow(true)}>
      <table className="w-full">
        <thead><tr className="border-b border-white/20">
          <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase">N° Fila</th>
          <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase">Estante</th>
          <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase">Capacidad Máx</th>
          <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase">Descripción</th>
        </tr></thead>
        <tbody className="divide-y divide-white/10">
          {(data?.allPisos ?? []).map((p: { id: string; nroFila: number; descripcion?: string; capacidadMax?: number; estante: { codigo: string } }) => (
            <tr key={p.id} className="hover:bg-white/30 transition-colors">
              <td className="px-6 py-4 text-sm font-semibold text-surface-800">{p.nroFila}</td>
              <td className="px-6 py-4 text-sm text-surface-600">{p.estante.codigo}</td>
              <td className="px-6 py-4 text-sm text-surface-600">{p.capacidadMax ?? '—'}</td>
              <td className="px-6 py-4 text-sm text-surface-600">{p.descripcion || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {(data?.allPisos ?? []).length === 0 && <EmptyState />}
      <Modal show={show} title="Nuevo Piso" onClose={() => setShow(false)} error={error} onSave={handleCreate}>
        <Field label="N° Fila *" value={nroFila} onChange={setNroFila} type="number" />
        <Field label="Descripción" value={descripcion} onChange={setDescripcion} />
        <Field label="Capacidad Máxima" value={capacidadMax} onChange={setCapacidadMax} type="number" />
        <Select label="Estante *" value={idEstante} onChange={setIdEstante}
          options={(estData?.allEstantes ?? []).map((e: { id: string; codigo: string }) => ({ value: e.id, label: e.codigo }))}
        />
      </Modal>
    </SectionShell>
  );
}

function CarpetasSection() {
  const { data, loading, refetch } = useQuery(GET_ALL_CARPETAS);
  const { data: pisoData } = useQuery(GET_ALL_PISOS);
  const [crear] = useMutation(CREAR_CARPETA);
  const [show, setShow] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [idPiso, setIdPiso] = useState('');
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setError('');
    if (!descripcion || !idPiso) { setError('Descripción y Piso son obligatorios'); return; }
    try {
      const { data: res } = await crear({ variables: { descripcion, idPiso } });
      if (res?.crearCarpeta?.error) throw new Error(res.crearCarpeta.error);
      setShow(false); setDescripcion(''); setIdPiso('');
      refetch();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  };

  if (loading) return <div className="glass-panel rounded-2xl p-8 text-center text-surface-500">Cargando...</div>;

  return (
    <SectionShell title="Carpetas" onAdd={() => setShow(true)}>
      <table className="w-full">
        <thead><tr className="border-b border-white/20">
          <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase">Descripción</th>
          <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase">Piso</th>
          <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase">Estante</th>
          <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase">Ambiente</th>
          <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase">Estado</th>
        </tr></thead>
        <tbody className="divide-y divide-white/10">
          {(data?.allCarpetas ?? []).map((c: {
            id: string; descripcion: string; estado: string;
            piso: { nroFila: number; estante: { codigo: string; ambiente: { nombre: string } } }
          }) => (
            <tr key={c.id} className="hover:bg-white/30 transition-colors">
              <td className="px-6 py-4 text-sm font-semibold text-surface-800">{c.descripcion}</td>
              <td className="px-6 py-4 text-sm text-surface-600">{c.piso.nroFila}</td>
              <td className="px-6 py-4 text-sm text-surface-600">{c.piso.estante.codigo}</td>
              <td className="px-6 py-4 text-sm text-surface-600">{c.piso.estante.ambiente.nombre}</td>
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  c.estado === 'disponible' ? 'bg-green-100 text-green-700' :
                  c.estado === 'traspaso' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {c.estado === 'disponible' ? 'Disponible' :
                   c.estado === 'traspaso' ? 'En Traspaso' : 'Prestado'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {(data?.allCarpetas ?? []).length === 0 && <EmptyState />}
      <Modal show={show} title="Nueva Carpeta" onClose={() => setShow(false)} error={error} onSave={handleCreate}>
        <Field label="Descripción *" value={descripcion} onChange={setDescripcion} />
        <Select label="Piso *" value={idPiso} onChange={setIdPiso}
          options={(pisoData?.allPisos ?? []).map((p: { id: string; nroFila: number }) => ({ value: p.id, label: `Fila ${p.nroFila}` }))}
        />
      </Modal>
    </SectionShell>
  );
}

function SectionShell({ title, onAdd, children }: { title: string; onAdd: () => void; children: React.ReactNode }) {
  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/20">
        <h3 className="text-lg font-bold text-surface-800">{title}</h3>
        <button onClick={onAdd} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-medium shadow-md shadow-brand-500/30 hover:shadow-lg transition-all text-xs">
          <Plus size={14} /> Nuevo
        </button>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-10 text-surface-400">
      <p className="text-sm font-medium">No hay registros</p>
    </div>
  );
}

function Modal({ show, title, onClose, error, onSave, children }: {
  show: boolean; title: string; onClose: () => void; error: string; onSave: () => void; children: React.ReactNode;
}) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="glass-panel rounded-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-surface-800">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2.5">{error}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">{children}</div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-surface-600 bg-white/60 border border-white/80 hover:bg-white transition-colors text-sm font-medium">Cancelar</button>
          <button onClick={onSave} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-medium shadow-md shadow-brand-500/30 hover:shadow-lg transition-all text-sm">Guardar</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-surface-700 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/40 text-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-all"
      />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="block text-sm font-medium text-surface-700 mb-1.5">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/40 text-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-all"
      >
        <option value="">Seleccionar...</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
