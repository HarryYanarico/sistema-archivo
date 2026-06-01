import { useState } from 'react';
import { Undo2, X } from 'lucide-react';

interface Props {
  carpetaDesc: string;
  personaNombre: string;
  pcId: string;
  personaId: string;
  onClose: () => void;
  onDevolver: (vars: {
    idPrestamoCarpeta: string;
    estadoDevolucion: string;
    observaciones: string;
    bloquearPersona?: boolean;
  }) => Promise<string>;
}

export default function DevolucionForm({ carpetaDesc, personaNombre, pcId, personaId, onClose, onDevolver }: Props) {
  const [estado, setEstado] = useState('buen_estado');
  const [obs, setObs] = useState('');
  const [bloquear, setBloquear] = useState(false);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setMsg('');
    setSaving(true);
    const vars: Record<string, unknown> = { idPrestamoCarpeta: pcId, estadoDevolucion: estado, observaciones: obs };
    if (bloquear) vars.bloquearPersona = true;
    const res = await onDevolver(vars as any);
    setMsg(res);
    setSaving(false);
    if (res.startsWith('✅')) {
      setTimeout(onClose, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-panel rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-surface-800 dark:text-sepia-200 flex items-center gap-2">
            <Undo2 size={20} className="text-brand-600" />
            Registrar Devolución
          </h3>
          <button onClick={onClose}
            className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-400 transition-colors"
          ><X size={20} /></button>
        </div>

        <p className="text-sm text-surface-700 dark:text-sepia-300 mb-4">
          Devolviendo carpeta: <strong>{carpetaDesc}</strong>
          <br />
          Persona: <strong>{personaNombre}</strong>
        </p>

        {msg && (
          <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-medium ${
            msg.startsWith('✅')
              ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}>{msg}</div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-surface-700 dark:text-sepia-300 mb-1.5">Estado de devolución</label>
          <select value={estado} onChange={(e) => {
            setEstado(e.target.value);
            if (e.target.value === 'buen_estado') setBloquear(false);
          }}
            className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 transition-all"
          >
            <option value="buen_estado">Buen estado</option>
            <option value="mal_estado">Mal estado</option>
            <option value="dañado">Dañado</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-surface-700 dark:text-sepia-300 mb-1.5">Observaciones</label>
          <textarea value={obs} onChange={(e) => setObs(e.target.value)}
            rows={3} placeholder="Ej: carpeta con esquinas dobladas..."
            className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 placeholder:text-surface-600 dark:placeholder:text-sepia-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 transition-all resize-none"
          />
        </div>

        {(estado === 'mal_estado' || estado === 'dañado') && (
          <label className="flex items-start gap-3 p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 cursor-pointer">
            <input type="checkbox" checked={bloquear} onChange={(e) => setBloquear(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-surface-300 text-red-600 focus:ring-red-400"
            />
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">Bloquear a {personaNombre}</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">No podrá recibir nuevos préstamos hasta que un administrador lo desbloquee.</p>
            </div>
          </label>
        )}

        <div className="flex justify-end gap-1">
          <button onClick={onClose}
            className="px-5 py-2 rounded-xl text-surface-600 dark:text-sepia-400 bg-white/60 dark:bg-sepia-800/60 border border-white/80 dark:border-sepia-700/60 hover:bg-white dark:hover:bg-sepia-800 transition-colors text-sm font-medium"
          >Cancelar</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 dark:from-brand-dark-500 dark:to-brand-dark-600 text-white font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
          ><Undo2 size={16} /> {saving ? 'Devolviendo...' : 'Confirmar Devolución'}</button>
        </div>
      </div>
    </div>
  );
}
