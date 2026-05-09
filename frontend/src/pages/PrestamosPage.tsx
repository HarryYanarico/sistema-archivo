import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_ALL_PERSONAS, GET_ALL_CARPETAS, REGISTRAR_PRESTAMO, GET_ALL_PRESTAMOS, CREAR_PERSONA } from '../lib/queries';
import { BookOpenCheck, X, Search, UserPlus, Eye } from 'lucide-react';

export default function PrestamosPage() {
  const { data: prestamosData, loading: loadingPrest, refetch: refetchPrestamos } = useQuery(GET_ALL_PRESTAMOS);
  const { data: personasData } = useQuery(GET_ALL_PERSONAS);
  const { data: carpetasData } = useQuery(GET_ALL_CARPETAS);
  const [registrar] = useMutation(REGISTRAR_PRESTAMO);

  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(1);
  const [idPersona, setIdPersona] = useState('');
  const [idAutorizadoPor, setIdAutorizadoPor] = useState('');
  const [idsCarpetas, setIdsCarpetas] = useState<string[]>([]);
  const [fechaLimite, setFechaLimite] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState('');
  const [searchPersona, setSearchPersona] = useState('');
  const [searchCarpeta, setSearchCarpeta] = useState('');
  const [searchAutoriza, setSearchAutoriza] = useState('');

  const [showNewPersona, setShowNewPersona] = useState(false);
  const [newPerCi, setNewPerCi] = useState('');
  const [newPerNombre, setNewPerNombre] = useState('');
  const [newPerApellido, setNewPerApellido] = useState('');
  const [newPerTelefono, setNewPerTelefono] = useState('');
  const [newPerEmail, setNewPerEmail] = useState('');
  const [newPerDireccion, setNewPerDireccion] = useState('');
  const [newPerFechaNaci, setNewPerFechaNaci] = useState('');
  const [newPerError, setNewPerError] = useState('');
  const [crearPersona] = useMutation(CREAR_PERSONA, { refetchQueries: [{ query: GET_ALL_PERSONAS }] });
  const [selectedPrestamo, setSelectedPrestamo] = useState<typeof prestamosData.allPrestamos[0] | null>(null);

  const personas = personasData?.allPersonas ?? [];
  const carpetasDisponibles = (carpetasData?.allCarpetas ?? []).filter((c: { estado: boolean }) => c.estado);
  const personasConCargo = personas.filter((p: { cargo?: string }) => p.cargo);

  const openForm = () => {
    setStep(1);
    setIdPersona('');
    setIdAutorizadoPor('');
    setIdsCarpetas([]);
    setFechaLimite('');
    setObservaciones('');
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async () => {
    setError('');
    if (!idPersona) { setError('Selecciona una persona'); return; }
    if (!idAutorizadoPor) { setError('Selecciona quién autoriza el préstamo'); return; }
    if (idsCarpetas.length === 0) { setError('Selecciona al menos una carpeta'); return; }
    if (!fechaLimite) { setError('Ingresa la fecha límite'); return; }

    try {
      const vars: Record<string, unknown> = {
        idsCarpetas,
        idPersona,
        fechaLimite,
      };
      vars.idAutorizadoPor = idAutorizadoPor;
      if (observaciones) vars.observaciones = observaciones;

      const { data: res } = await registrar({ variables: vars });
      if (res?.registrarPrestamo?.error) throw new Error(res.registrarPrestamo.error);
      setShowForm(false);
      refetchPrestamos();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar');
    }
  };

  const toggleCarpeta = (id: string) => {
    setIdsCarpetas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-surface-800">Préstamos</h2>
        <button
          onClick={openForm}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-medium shadow-md shadow-brand-500/30 hover:shadow-lg transition-all text-sm"
        >
          <BookOpenCheck size={16} />
          Registrar Préstamo
        </button>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/20">
              <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase">Fecha</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase">Persona</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase">Carpetas</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase">Límite</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase">Registró</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-surface-500 uppercase">Autorizó</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {(prestamosData?.allPrestamos ?? []).map((p: {
              id: string; fechaPrest: string; fechaLimite: string; observaciones?: string;
              persona: { ci: string; nombre: string; apellido: string };
              usuario?: { username: string; firstName: string; lastName: string };
              autorizadoPor?: { nombre: string; apellido: string; cargo: string };
              carpetas: { id: string; descripcion: string; estado: boolean }[];
            }) => (
              <tr key={p.id} onClick={() => setSelectedPrestamo(p)} className="hover:bg-white/30 transition-colors cursor-pointer">
                <td className="px-6 py-4 text-sm text-surface-700">{p.fechaPrest}</td>
                <td className="px-6 py-4 text-sm font-semibold text-surface-800">{p.persona.nombre} {p.persona.apellido}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {p.carpetas.map((c) => (
                      <span key={c.id} className="px-2 py-0.5 rounded-md text-xs bg-surface-100 text-surface-600">
                        {c.descripcion}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-surface-600">{p.fechaLimite}</td>
                <td className="px-6 py-4 text-sm text-surface-600">{p.usuario ? `${p.usuario.firstName} ${p.usuario.lastName}` : '—'}</td>
                <td className="px-6 py-4 text-sm text-surface-600">
                  {p.autorizadoPor ? (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-brand-100 text-brand-700">
                      {p.autorizadoPor.nombre} {p.autorizadoPor.apellido} ({p.autorizadoPor.cargo})
                    </span>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(prestamosData?.allPrestamos ?? []).length === 0 && (
          <div className="text-center py-12 text-surface-400">
            <p className="text-lg font-medium">No hay préstamos registrados</p>
          </div>
        )}
      </div>

      {selectedPrestamo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-surface-800">Detalle del Préstamo</h3>
              <button onClick={() => setSelectedPrestamo(null)} className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="glass-card rounded-xl p-4">
                <p className="text-xs text-surface-500 mb-1">Fecha de préstamo</p>
                <p className="font-semibold text-surface-800">{selectedPrestamo.fechaPrest}</p>
              </div>
              <div className="glass-card rounded-xl p-4">
                <p className="text-xs text-surface-500 mb-1">Fecha límite</p>
                <p className="font-semibold text-surface-800">{selectedPrestamo.fechaLimite}</p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-4 mb-4">
              <p className="text-xs text-surface-500 mb-2">Persona que recibe</p>
              <p className="font-semibold text-surface-800 text-lg">{selectedPrestamo.persona.nombre} {selectedPrestamo.persona.apellido}</p>
              <div className="text-sm text-surface-500 space-y-0.5 mt-1">
                <p>CI: {selectedPrestamo.persona.ci}</p>
                <p>Tel: {selectedPrestamo.persona.telefono || '—'}</p>
                <p>Email: {selectedPrestamo.persona.email || '—'}</p>
                <p>Dirección: {selectedPrestamo.persona.direccion || '—'}</p>
              </div>
            </div>

            {selectedPrestamo.autorizadoPor && (
              <div className="glass-card rounded-xl p-4 mb-4 border border-amber-100">
                <p className="text-xs text-surface-500 mb-2">Autorizado por</p>
                <p className="font-semibold text-surface-800">{selectedPrestamo.autorizadoPor.nombre} {selectedPrestamo.autorizadoPor.apellido}</p>
                <span className="mt-1 inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                  {selectedPrestamo.autorizadoPor.cargo}
                </span>
              </div>
            )}

            <div className="glass-card rounded-xl p-4 mb-4">
              <p className="text-xs text-surface-500 mb-2">Registrado por</p>
              <p className="font-semibold text-surface-800">
                {selectedPrestamo.usuario ? `${selectedPrestamo.usuario.firstName} ${selectedPrestamo.usuario.lastName} (@${selectedPrestamo.usuario.username})` : '—'}
              </p>
            </div>

            {selectedPrestamo.observaciones && (
              <div className="glass-card rounded-xl p-4 mb-4">
                <p className="text-xs text-surface-500 mb-2">Observaciones</p>
                <p className="text-surface-700">{selectedPrestamo.observaciones}</p>
              </div>
            )}

            <div className="glass-card rounded-xl p-4">
              <p className="text-xs text-surface-500 mb-3">Carpetas ({selectedPrestamo.carpetas.length})</p>
              <div className="space-y-2">
                {selectedPrestamo.carpetas.map((c: {
                  id: string; descripcion: string; estado: boolean;
                  piso?: { nroFila: number; descripcion: string; estante: { codigo: string; ambiente: { nombre: string } } };
                }) => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-white/50 border border-white/40">
                    <div>
                      <p className="font-semibold text-surface-800 text-sm">{c.descripcion}</p>
                      {c.piso && (
                        <p className="text-xs text-surface-400 mt-0.5">
                          {c.piso.estante.ambiente.nombre} / {c.piso.estante.codigo} / Fila {c.piso.nroFila}
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.estado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {c.estado ? 'Disponible' : 'Prestado'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showNewPersona && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-surface-800">Nueva Persona</h3>
              <button onClick={() => setShowNewPersona(false)} className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            {newPerError && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2.5">{newPerError}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">CI *</label>
                <input type="text" value={newPerCi} onChange={(e) => setNewPerCi(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/40 text-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Nombre *</label>
                <input type="text" value={newPerNombre} onChange={(e) => setNewPerNombre(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/40 text-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Apellido *</label>
                <input type="text" value={newPerApellido} onChange={(e) => setNewPerApellido(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/40 text-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Teléfono</label>
                <input type="text" value={newPerTelefono} onChange={(e) => setNewPerTelefono(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/40 text-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Email</label>
                <input type="text" value={newPerEmail} onChange={(e) => setNewPerEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/40 text-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Dirección</label>
                <input type="text" value={newPerDireccion} onChange={(e) => setNewPerDireccion(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/40 text-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Fecha de Nacimiento</label>
                <input type="date" value={newPerFechaNaci} onChange={(e) => setNewPerFechaNaci(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/40 text-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-all"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowNewPersona(false)} className="px-5 py-2.5 rounded-xl text-surface-600 bg-white/60 border border-white/80 hover:bg-white transition-colors text-sm font-medium">Cancelar</button>
              <button onClick={async () => {
                setNewPerError('');
                if (!newPerCi || !newPerNombre || !newPerApellido) { setNewPerError('CI, nombre y apellido son obligatorios'); return; }
                try {
                  const vars: Record<string, unknown> = { ci: newPerCi, nombre: newPerNombre, apellido: newPerApellido };
                  if (newPerTelefono) vars.telefono = newPerTelefono;
                  if (newPerEmail) vars.email = newPerEmail;
                  if (newPerDireccion) vars.direccion = newPerDireccion;
                  if (newPerFechaNaci) vars.fechaNaci = newPerFechaNaci;
                  const { data } = await crearPersona({ variables: vars });
                  if (data?.crearPersona?.error) throw new Error(data.crearPersona.error);
                  setIdPersona(data.crearPersona.persona.id);
                  setShowNewPersona(false);
                  setNewPerCi(''); setNewPerNombre(''); setNewPerApellido('');
                  setNewPerTelefono(''); setNewPerEmail(''); setNewPerDireccion(''); setNewPerFechaNaci('');
                } catch (err: unknown) {
                  setNewPerError(err instanceof Error ? err.message : 'Error');
                }
              }} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-medium shadow-md shadow-brand-500/30 hover:shadow-lg transition-all text-sm">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-surface-800">Registrar Préstamo</h3>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-2 mb-6">
              {[1, 2, 3].map((s) => (
                <button
                  key={s}
                  onClick={() => setStep(s)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    step === s
                      ? 'bg-brand-600 text-white shadow-md'
                      : s < step
                        ? 'bg-green-100 text-green-700'
                        : 'bg-surface-100 text-surface-400'
                  }`}
                >
                  {s === 1 ? '1. Persona' : s === 2 ? '2. Carpetas' : '3. Confirmar'}
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2.5">{error}</div>
            )}

            {step === 1 && (
              <div>
                <h4 className="text-sm font-semibold text-surface-700 mb-3">Seleccionar persona que recibe el préstamo</h4>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={16} />
                  <input type="text" placeholder="Buscar por CI, nombre o apellido..." value={searchPersona}
                    onChange={(e) => setSearchPersona(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/60 border border-white/40 text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-all text-sm"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {personas
                    .filter((p: { ci: string; nombre: string; apellido: string }) => {
                      const q = searchPersona.toLowerCase();
                      return p.ci.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q) || p.apellido.toLowerCase().includes(q);
                    })
                    .map((p: { id: string; ci: string; nombre: string; apellido: string }) => (
                      <button
                        key={p.id}
                        onClick={() => setIdPersona(p.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all text-sm ${
                          idPersona === p.id
                            ? 'bg-brand-50 border border-brand-200 text-brand-700'
                            : 'bg-white/40 border border-transparent hover:bg-white/60 text-surface-700'
                        }`}
                      >
                        <span className="font-semibold">{p.nombre} {p.apellido}</span>
                        <span className="text-surface-400 ml-2">CI: {p.ci}</span>
                      </button>
                    ))}
                  {personas.length === 0 && <p className="text-sm text-surface-400 text-center py-4">No hay personas registradas</p>}
                </div>
                <button onClick={() => setShowNewPersona(true)} className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-brand-300 text-brand-600 hover:bg-brand-50 transition-all text-sm font-medium">
                  <UserPlus size={16} /> Registrar nueva persona
                </button>

                <div className="mt-6 border-t border-white/20 pt-4">
                  <h4 className="text-sm font-semibold text-surface-700 mb-3">Autorizado por (persona con cargo)</h4>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={16} />
                    <input type="text" placeholder="Buscar personas con cargo..." value={searchAutoriza}
                      onChange={(e) => setSearchAutoriza(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/60 border border-white/40 text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-all text-sm"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                    {personasConCargo
                      .filter((p: { nombre: string; apellido: string; cargo: string }) => {
                        const q = searchAutoriza.toLowerCase();
                        return p.nombre.toLowerCase().includes(q) || p.apellido.toLowerCase().includes(q) || p.cargo.toLowerCase().includes(q);
                      })
                      .map((p: { id: string; nombre: string; apellido: string; cargo: string }) => (
                        <button
                          key={p.id}
                          onClick={() => setIdAutorizadoPor(p.id)}
                          className={`w-full text-left px-4 py-2.5 rounded-xl transition-all text-sm ${
                            idAutorizadoPor === p.id
                              ? 'bg-brand-50 border border-brand-200 text-brand-700'
                              : 'bg-white/40 border border-transparent hover:bg-white/60 text-surface-700'
                          }`}
                        >
                          <span className="font-semibold">{p.nombre} {p.apellido}</span>
                          <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">{p.cargo}</span>
                        </button>
                      ))}
                    {personasConCargo.length === 0 && <p className="text-sm text-surface-400 text-center py-4">No hay personas con cargo registradas</p>}
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button onClick={() => setStep(2)} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-medium shadow-md text-sm">
                    Siguiente
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h4 className="text-sm font-semibold text-surface-700 mb-3">Seleccionar carpetas a prestar</h4>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={16} />
                  <input type="text" placeholder="Buscar carpeta..." value={searchCarpeta}
                    onChange={(e) => setSearchCarpeta(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/60 border border-white/40 text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-all text-sm"
                  />
                </div>
                <div className="mb-2 text-xs text-surface-500">{idsCarpetas.length} seleccionadas</div>
                <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                  {carpetasDisponibles
                    .filter((c: { descripcion: string; piso: { estante: { codigo: string; ambiente: { nombre: string } } } }) => {
                      const q = searchCarpeta.toLowerCase();
                      return c.descripcion.toLowerCase().includes(q) || c.piso.estante.codigo.toLowerCase().includes(q) || c.piso.estante.ambiente.nombre.toLowerCase().includes(q);
                    })
                    .map((c: { id: string; descripcion: string; piso: { nroFila: number; estante: { codigo: string; ambiente: { nombre: string } } } }) => (
                      <label
                        key={c.id}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm cursor-pointer ${
                          idsCarpetas.includes(c.id)
                            ? 'bg-brand-50 border border-brand-200'
                            : 'bg-white/40 border border-transparent hover:bg-white/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={idsCarpetas.includes(c.id)}
                          onChange={() => toggleCarpeta(c.id)}
                          className="rounded border-surface-300 text-brand-600 focus:ring-brand-400"
                        />
                        <div className="flex-1">
                          <span className="font-semibold text-surface-800">{c.descripcion}</span>
                          <span className="text-surface-400 ml-2 text-xs">
                            {c.piso.estante.ambiente.nombre} / {c.piso.estante.codigo} / Fila {c.piso.nroFila}
                          </span>
                        </div>
                      </label>
                    ))}
                  {carpetasDisponibles.length === 0 && <p className="text-sm text-surface-400 text-center py-4">No hay carpetas disponibles</p>}
                </div>

                <div className="flex justify-between mt-6">
                  <button onClick={() => setStep(1)} className="px-6 py-2.5 rounded-xl text-surface-600 bg-white/60 border border-white/80 hover:bg-white transition-colors text-sm font-medium">
                    Atrás
                  </button>
                  <button onClick={() => setStep(3)} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-medium shadow-md text-sm">
                    Siguiente
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h4 className="text-sm font-semibold text-surface-700 mb-4">Confirmar préstamo</h4>

                <div className="space-y-3 mb-6">
                  <div className="glass-card rounded-xl p-4">
                    <p className="text-xs text-surface-500 mb-1">Persona</p>
                    <p className="font-semibold text-surface-800">
                      {personas.find((p: { id: string }) => p.id === idPersona)?.nombre}{' '}
                      {personas.find((p: { id: string }) => p.id === idPersona)?.apellido}
                      <span className="text-surface-400 font-normal ml-2">
                        CI: {personas.find((p: { id: string }) => p.id === idPersona)?.ci}
                      </span>
                    </p>
                  </div>

                  {idAutorizadoPor && (
                    <div className="glass-card rounded-xl p-4">
                      <p className="text-xs text-surface-500 mb-1">Autorizado por</p>
                      <p className="font-semibold text-surface-800">
                        {personasConCargo.find((p: { id: string }) => p.id === idAutorizadoPor)?.nombre}{' '}
                        {personasConCargo.find((p: { id: string }) => p.id === idAutorizadoPor)?.apellido}
                        <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">
                          {personasConCargo.find((p: { id: string }) => p.id === idAutorizadoPor)?.cargo}
                        </span>
                      </p>
                    </div>
                  )}

                  <div className="glass-card rounded-xl p-4">
                    <p className="text-xs text-surface-500 mb-1">Carpetas ({idsCarpetas.length})</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {carpetasDisponibles
                        .filter((c: { id: string }) => idsCarpetas.includes(c.id))
                        .map((c: { id: string; descripcion: string }) => (
                          <span key={c.id} className="px-2 py-0.5 rounded-md text-xs bg-surface-100 text-surface-600">
                            {c.descripcion}
                          </span>
                        ))}
                    </div>
                  </div>

                  <div className="glass-card rounded-xl p-4">
                    <label className="block text-xs text-surface-500 mb-1">Fecha límite</label>
                    <input type="date" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-white/60 border border-white/40 text-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-all"
                    />
                  </div>

                  <div className="glass-card rounded-xl p-4">
                    <label className="block text-xs text-surface-500 mb-1">Observaciones</label>
                    <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)}
                      rows={2} placeholder="Opcional..."
                      className="w-full px-4 py-2 rounded-xl bg-white/60 border border-white/40 text-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <button onClick={() => setStep(2)} className="px-6 py-2.5 rounded-xl text-surface-600 bg-white/60 border border-white/80 hover:bg-white transition-colors text-sm font-medium">
                    Atrás
                  </button>
                  <button onClick={handleSubmit} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-medium shadow-md shadow-brand-500/30 hover:shadow-lg transition-all text-sm">
                    Confirmar Préstamo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
