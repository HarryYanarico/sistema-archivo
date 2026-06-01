import { useState } from 'react';
import { X, Search, UserPlus } from 'lucide-react';

interface Persona {
  id: string; ci: string; nombre: string; apellido: string; cargo?: string;
}

interface CarpetaDisponible {
  id: string; descripcion: string;
  piso: { nroFila: number; estante: { codigo: string; ambiente: { nombre: string } } };
}

interface Props {
  show: boolean;
  onClose: () => void;
  personas: Persona[];
  carpetasDisponibles: CarpetaDisponible[];
  personasConCargo: Persona[];
  onRegistrar: (vars: {
    idsCarpetas: string[]; idPersona: string; fechaLimite: string;
    idAutorizadoPor?: string; observaciones?: string;
  }) => Promise<string>;
  hasPerm: (p: string) => boolean;
  onShowNewPersona: () => void;
}

export default function RegistrarPrestamoModal({ show, onClose, personas, carpetasDisponibles, personasConCargo, onRegistrar, hasPerm, onShowNewPersona }: Props) {
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

  if (!show) return null;

  const handleSubmit = async () => {
    setError('');
    if (!idPersona) { setError('Selecciona una persona'); return; }
    if (!idAutorizadoPor) { setError('Selecciona quién autoriza el préstamo'); return; }
    if (idsCarpetas.length === 0) { setError('Selecciona al menos una carpeta'); return; }
    if (!fechaLimite) { setError('Ingresa la fecha límite'); return; }
    const res = await onRegistrar({ idsCarpetas, idPersona, fechaLimite, idAutorizadoPor, observaciones: observaciones || undefined });
    if (res) setError(res);
  };

  const toggleCarpeta = (id: string) => {
    setIdsCarpetas((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const reset = () => {
    setStep(1); setIdPersona(''); setIdAutorizadoPor('');
    setIdsCarpetas([]); setFechaLimite(''); setObservaciones(''); setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-panel rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-surface-800 dark:text-sepia-200">Registrar Préstamo</h3>
          <button onClick={reset}
            className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-400 transition-colors"
          ><X size={20} /></button>
        </div>

        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <button key={s} onClick={() => setStep(s)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                step === s
                  ? 'bg-brand-600 dark:bg-brand-dark-500 text-white shadow-md'
                  : s < step
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                    : 'bg-surface-100 dark:bg-sepia-800 text-surface-500 dark:text-sepia-500'
              }`}
            >{s === 1 ? '1. Persona' : s === 2 ? '2. Carpetas' : '3. Confirmar'}</button>
          ))}
        </div>

        {error && <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-2.5">{error}</div>}

        {step === 1 && (
          <div>
            <h4 className="text-sm font-semibold text-surface-700 dark:text-sepia-300 mb-3">Seleccionar persona que recibe el préstamo</h4>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 dark:text-sepia-500" size={16} />
              <input type="text" placeholder="Buscar por CI, nombre o apellido..." value={searchPersona}
                onChange={(e) => setSearchPersona(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 placeholder:text-surface-600 dark:placeholder:text-sepia-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 transition-all text-sm" />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {personas.filter((p) => {
                const q = searchPersona.toLowerCase();
                return p.ci.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q) || p.apellido.toLowerCase().includes(q);
              }).map((p) => (
                <button key={p.id} onClick={() => setIdPersona(p.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all text-sm ${
                    idPersona === p.id
                      ? 'bg-brand-50 dark:bg-brand-dark-600/20 border border-brand-200 dark:border-brand-dark-600/30 text-brand-700 dark:text-brand-dark-400'
                      : 'bg-white/40 dark:bg-sepia-800/40 border border-transparent hover:bg-white/60 dark:hover:bg-sepia-800/60 text-surface-700 dark:text-sepia-300'
                  }`}>
                  <span className="font-semibold">{p.nombre} {p.apellido}</span>
                  <span className="text-surface-500 dark:text-sepia-500 ml-2">CI: {p.ci}</span>
                </button>
              ))}
               {personas.length === 0 && <p className="text-sm text-surface-500 dark:text-sepia-500 text-center py-4">No hay personas registradas</p>}
             </div>
             {hasPerm('gestionar_personas') && (
              <button onClick={onShowNewPersona}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-brand-300 text-brand-600 dark:text-brand-dark-400 hover:bg-brand-50 dark:hover:bg-brand-dark-600/20 transition-all text-sm font-medium"
              ><UserPlus size={16} /> Registrar nueva persona</button>
            )}

            <div className="mt-6 border-t border-white/20 dark:border-sepia-700/30 pt-4">
              <h4 className="text-sm font-semibold text-surface-700 dark:text-sepia-300 mb-3">Autorizado por (persona con cargo)</h4>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 dark:text-sepia-500" size={16} />
                <input type="text" placeholder="Buscar personas con cargo..." value={searchAutoriza}
                  onChange={(e) => setSearchAutoriza(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 placeholder:text-surface-600 dark:placeholder:text-sepia-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 transition-all text-sm" />
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                {personasConCargo.filter((p) => {
                  const q = searchAutoriza.toLowerCase();
                  return p.nombre.toLowerCase().includes(q) || p.apellido.toLowerCase().includes(q) || (p.cargo || '').toLowerCase().includes(q);
                }).map((p) => (
                  <button key={p.id} onClick={() => setIdAutorizadoPor(p.id)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl transition-all text-sm ${
                      idAutorizadoPor === p.id
                        ? 'bg-brand-50 dark:bg-brand-dark-600/20 border border-brand-200 dark:border-brand-dark-600/30 text-brand-700 dark:text-brand-dark-400'
                        : 'bg-white/40 dark:bg-sepia-800/40 border border-transparent hover:bg-white/60 dark:hover:bg-sepia-800/60 text-surface-700 dark:text-sepia-300'
                    }`}>
                    <span className="font-semibold">{p.nombre} {p.apellido}</span>
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">{p.cargo}</span>
                  </button>
                ))}
                {personasConCargo.length === 0 && <p className="text-sm text-surface-500 dark:text-sepia-500 text-center py-4">No hay personas con cargo registradas</p>}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 dark:from-brand-dark-500 dark:to-brand-dark-600 text-white font-medium shadow-md text-sm"
              >Siguiente</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h4 className="text-sm font-semibold text-surface-700 dark:text-sepia-300 mb-3">Seleccionar carpetas a prestar</h4>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 dark:text-sepia-500" size={16} />
              <input type="text" placeholder="Buscar carpeta..." value={searchCarpeta}
                onChange={(e) => setSearchCarpeta(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 placeholder:text-surface-600 dark:placeholder:text-sepia-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 transition-all text-sm" />
            </div>
            <div className="mb-2 text-xs text-surface-600 dark:text-sepia-500">{idsCarpetas.length} seleccionadas</div>
            <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
              {carpetasDisponibles.filter((c) => {
                const q = searchCarpeta.toLowerCase();
                return c.descripcion.toLowerCase().includes(q) || c.piso.estante.codigo.toLowerCase().includes(q) || c.piso.estante.ambiente.nombre.toLowerCase().includes(q);
              }).map((c) => (
                <label key={c.id}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm cursor-pointer ${
                    idsCarpetas.includes(c.id)
                      ? 'bg-brand-50 dark:bg-brand-dark-600/20 border border-brand-200 dark:border-brand-dark-600/30'
                      : 'bg-white/40 dark:bg-sepia-800/40 border border-transparent hover:bg-white/60 dark:hover:bg-sepia-800/60'
                  }`}>
                  <input type="checkbox" checked={idsCarpetas.includes(c.id)} onChange={() => toggleCarpeta(c.id)}
                    className="rounded border-surface-300 text-brand-600 focus:ring-brand-400 dark:focus:ring-brand-dark-500" />
                  <div className="flex-1">
                    <span className="font-semibold text-surface-800 dark:text-sepia-200">{c.descripcion}</span>
                    <span className="text-surface-500 dark:text-sepia-500 ml-2 text-xs">{c.piso.estante.ambiente.nombre} / {c.piso.estante.codigo} / Fila {c.piso.nroFila}</span>
                  </div>
                </label>
              ))}
              {carpetasDisponibles.length === 0 && <p className="text-sm text-surface-500 dark:text-sepia-500 text-center py-4">No hay carpetas disponibles</p>}
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(1)}
                className="px-6 py-2.5 rounded-xl text-surface-600 dark:text-sepia-400 bg-white/60 dark:bg-sepia-800/60 border border-white/80 dark:border-sepia-700/60 hover:bg-white dark:hover:bg-sepia-800 transition-colors text-sm font-medium"
              >Atrás</button>
              <button onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 dark:from-brand-dark-500 dark:to-brand-dark-600 text-white font-medium shadow-md text-sm"
              >Siguiente</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h4 className="text-sm font-semibold text-surface-700 dark:text-sepia-300 mb-4">Confirmar préstamo</h4>
            <div className="space-y-3 mb-6">
              <div className="glass-card rounded-xl p-4">
                <p className="text-xs text-surface-600 dark:text-sepia-500 mb-1">Persona</p>
                <p className="font-semibold text-surface-800 dark:text-sepia-200">
                  {personas.find((p) => p.id === idPersona)?.nombre} {personas.find((p) => p.id === idPersona)?.apellido}
                  <span className="text-surface-500 dark:text-sepia-500 font-normal ml-2">CI: {personas.find((p) => p.id === idPersona)?.ci}</span>
                </p>
              </div>
              {idAutorizadoPor && (
                <div className="glass-card rounded-xl p-4">
                  <p className="text-xs text-surface-600 dark:text-sepia-500 mb-1">Autorizado por</p>
                  <p className="font-semibold text-surface-800 dark:text-sepia-200">
                    {personasConCargo.find((p) => p.id === idAutorizadoPor)?.nombre} {personasConCargo.find((p) => p.id === idAutorizadoPor)?.apellido}
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">{personasConCargo.find((p) => p.id === idAutorizadoPor)?.cargo}</span>
                  </p>
                </div>
              )}
              <div className="glass-card rounded-xl p-4">
                <p className="text-xs text-surface-600 dark:text-sepia-500 mb-1">Carpetas ({idsCarpetas.length})</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {carpetasDisponibles.filter((c) => idsCarpetas.includes(c.id)).map((c) => (
                    <span key={c.id} className="px-2 py-0.5 rounded-md text-xs bg-surface-100 dark:bg-sepia-800 text-surface-600 dark:text-sepia-400">{c.descripcion}</span>
                  ))}
                </div>
              </div>
              <div className="glass-card rounded-xl p-4">
                <label className="block text-xs text-surface-600 dark:text-sepia-500 mb-1">Fecha límite</label>
                <input type="date" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 transition-all" />
              </div>
              <div className="glass-card rounded-xl p-4">
                <label className="block text-xs text-surface-600 dark:text-sepia-500 mb-1">Observaciones</label>
                <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)}
                  rows={2} placeholder="Opcional..."
                  className="w-full px-4 py-2 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 transition-all resize-none" />
              </div>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-xl text-surface-600 dark:text-sepia-400 bg-white/60 dark:bg-sepia-800/60 border border-white/80 dark:border-sepia-700/60 hover:bg-white dark:hover:bg-sepia-800 transition-colors text-sm font-medium"
              >Atrás</button>
              <button onClick={handleSubmit}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 dark:from-brand-dark-500 dark:to-brand-dark-600 text-white font-medium shadow-md shadow-brand-500/30 dark:shadow-brand-dark-600/20 hover:shadow-lg transition-all text-sm"
              >Confirmar Préstamo</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
