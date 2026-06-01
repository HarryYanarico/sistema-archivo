import { useState } from 'react';
import { Ban, X } from 'lucide-react';

interface Props {
  personaNombre: string;
  onClose: () => void;
  onBloquear: (motivo: string) => Promise<string>;
}

export default function BloqueoModal({ personaNombre, onClose, onBloquear }: Props) {
  const [motivo, setMotivo] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setMsg('');
    if (!motivo.trim()) { setMsg('El motivo es obligatorio'); return; }
    setSaving(true);
    const res = await onBloquear(motivo.trim());
    setMsg(res);
    setSaving(false);
    if (res.startsWith('✅')) {
      setTimeout(onClose, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-panel rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-surface-800 dark:text-sepia-200 flex items-center gap-2">
            <Ban size={20} className="text-red-500" />
            Bloquear Persona
          </h3>
          <button onClick={onClose}
            className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-400 transition-colors"
          ><X size={20} /></button>
        </div>
        <p className="text-sm text-surface-700 dark:text-sepia-300 mb-4">
          Vas a bloquear a <strong>{personaNombre}</strong> por no devolver los préstamos a tiempo.
        </p>
        {msg && (
          <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-medium ${
            msg.startsWith('✅')
              ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}>{msg}</div>
        )}
        <div className="mb-4">
          <label className="block text-sm font-medium text-surface-700 dark:text-sepia-300 mb-1.5">Motivo del bloqueo *</label>
          <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)}
            rows={3} placeholder="Ej: Préstamo vencido desde el 15/01/2024 - no ha devuelto las carpetas..."
            className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 placeholder:text-surface-600 dark:placeholder:text-sepia-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 transition-all resize-none"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-surface-600 dark:text-sepia-400 bg-white/60 dark:bg-sepia-800/60 border border-white/80 dark:border-sepia-700/60 hover:bg-white dark:hover:bg-sepia-800 transition-colors text-sm font-medium"
          >Cancelar</button>
          <button onClick={handleSubmit} disabled={saving || !motivo.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 dark:from-red-500 dark:to-red-600 text-white font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
          ><Ban size={16} /> {saving ? 'Bloqueando...' : 'Bloquear Persona'}</button>
        </div>
      </div>
    </div>
  );
}
