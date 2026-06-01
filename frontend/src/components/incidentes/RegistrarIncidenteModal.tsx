import { useState, useCallback } from 'react';
import { useQuery } from '@apollo/client/react';
import { X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { GET_ALL_CARPETAS_PAGINATED } from '../../lib/queries';

interface Props {
  onClose: () => void;
  onRegistrar: (vars: { tipoInci: string; carpetaIds: string[]; descripcion?: string }) => Promise<string>;
}

export default function RegistrarIncidenteModal({ onClose, onRegistrar }: Props) {
  const [formTipo, setFormTipo] = useState('');
  const [formCarpetaIds, setFormCarpetaIds] = useState<string[]>([]);
  const [formDesc, setFormDesc] = useState('');
  const [formSearchCarp, setFormSearchCarp] = useState('');
  const [carpPage, setCarpPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const carpPageSize = 10;

  const { data: carpData, loading: carpLoading } = useQuery(GET_ALL_CARPETAS_PAGINATED, {
    variables: { page: carpPage, pageSize: carpPageSize, search: formSearchCarp || undefined },
    fetchPolicy: 'network-only',
  });

  const carpetas = carpData?.allCarpetasPaginated?.items ?? [];
  const carpTotal = carpData?.allCarpetasPaginated?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(carpTotal / carpPageSize));

  const toggleCarpeta = useCallback((id: string) => {
    setFormCarpetaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleSearchChange = useCallback((val: string) => {
    setFormSearchCarp(val);
    setCarpPage(1);
  }, []);

  const handleSubmit = async () => {
    if (!formTipo.trim()) { setMsg('El tipo de incidente es requerido'); return; }
    if (formCarpetaIds.length === 0) { setMsg('Selecciona al menos una carpeta'); return; }
    setSaving(true);
    const res = await onRegistrar({
      tipoInci: formTipo.trim(),
      carpetaIds: formCarpetaIds,
      descripcion: formDesc || undefined,
    });
    setMsg(res);
    setSaving(false);
    if (res.startsWith('✅')) {
      setFormTipo(''); setFormCarpetaIds([]); setFormDesc('');
      setTimeout(() => onClose(), 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 dark:bg-black/70 backdrop-blur-sm p-4 pt-8">
      <div className="glass-panel rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-surface-800 dark:text-sepia-200">Registrar Incidente</h3>
          <button onClick={onClose}
            className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100 transition-colors"
          ><X size={20} /></button>
        </div>

        {msg && (
          <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-medium ${
            msg.startsWith('✅')
              ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/30 border border-red-200 text-red-700 dark:text-red-300'
          }`}>{msg}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-surface-600 dark:text-sepia-500 mb-1">Tipo de Incidente</label>
            <select value={formTipo} onChange={(e) => setFormTipo(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-all text-sm"
            >
              <option value="">Seleccionar...</option>
              <option value="Perdida">Pérdida</option>
              <option value="Dano">Daño</option>
              <option value="Extravió">Extravió</option>
              <option value="Robo">Robo</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-600 dark:text-sepia-500 mb-1">Carpetas afectadas</label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 dark:text-sepia-500" size={16} />
              <input type="text" placeholder="Buscar carpeta..." value={formSearchCarp}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 placeholder:text-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-all text-sm"
              />
            </div>
            <div className="max-h-40 overflow-y-auto border border-white/20 dark:border-sepia-700/30 rounded-xl">
              {carpLoading ? (
                <div className="flex items-center justify-center py-8 text-sm text-surface-500">
                  <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mr-2" />
                  Cargando...
                </div>
              ) : carpetas.length === 0 ? (
                <p className="text-sm text-surface-500 dark:text-sepia-500 text-center py-8">Sin carpetas</p>
              ) : (
                <div className="divide-y divide-white/10 dark:divide-sepia-700/20">
                  {carpetas.map((c: any) => (
                    <label key={c.id}
                      className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer text-sm transition-colors ${
                        formCarpetaIds.includes(c.id)
                          ? 'bg-brand-50 dark:bg-brand-dark-600/20'
                          : 'hover:bg-white/30 dark:hover:bg-sepia-800/50'
                      }`}
                    >
                      <input type="checkbox" checked={formCarpetaIds.includes(c.id)}
                        onChange={() => toggleCarpeta(c.id)}
                        className="w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-400"
                      />
                      <span className="text-surface-800 dark:text-sepia-200">{c.descripcion}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-2 text-xs text-surface-500 dark:text-sepia-500">
                <button disabled={carpPage <= 1} onClick={() => setCarpPage((p) => p - 1)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/30 dark:hover:bg-sepia-800/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                ><ChevronLeft size={14} /> Anterior</button>
                <span>Pág. {carpPage} de {totalPages} ({carpTotal} carpeta(s))</span>
                <button disabled={carpPage >= totalPages} onClick={() => setCarpPage((p) => p + 1)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/30 dark:hover:bg-sepia-800/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >Siguiente <ChevronRight size={14} /></button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-600 dark:text-sepia-500 mb-1">Descripción (opcional)</label>
            <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
              rows={3} placeholder="Detalles del incidente..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 placeholder:text-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-all resize-none text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/20 dark:border-sepia-700/30">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-surface-600 dark:text-sepia-400 bg-white/60 dark:bg-sepia-800/60 border border-white/80 dark:border-sepia-700/60 hover:bg-white dark:hover:bg-sepia-800 transition-colors text-sm font-medium"
          >Cancelar</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 dark:from-amber-500 dark:to-amber-600 text-white font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
          >{saving ? 'Registrando...' : 'Registrar Incidente'}</button>
        </div>
      </div>
    </div>
  );
}
