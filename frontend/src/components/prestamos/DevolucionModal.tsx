import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { X, Search, Undo2, AlertTriangle, Clock, Ban, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { GET_ALL_PRESTAMOS_ACTIVOS_PAGINATED } from '../../lib/queries';

interface Props {
  onClose: () => void;
  onDevolver: (selected: Set<string>, observaciones: string) => Promise<string>;
  onBloquear: (personaId: string, personaNombre: string) => void;
  formatDate: (d: string) => string;
  isOverdue: (d: string) => boolean;
  hasPerm: (p: string) => boolean;
}

interface GrupoItem {
  pcId: string; carpetaId: string; carpetaDesc: string;
}

interface GrupoPrestamo {
  prestamoId: string; fechaPrest: string; fechaLimite: string;
  personaId: string; personaNombre: string;
  items: GrupoItem[];
}

const ITEMS_PER_PAGE = 5;
const ITEMS_PER_GROUP = 5;

export default function DevolucionModal({ onClose, onDevolver, onBloquear, formatDate, isOverdue, hasPerm }: Props) {
  const [page, setPage] = useState(0);
  const { data, loading } = useQuery(GET_ALL_PRESTAMOS_ACTIVOS_PAGINATED, {
    variables: { page: page + 1, pageSize: ITEMS_PER_PAGE },
    fetchPolicy: 'network-only',
  });

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [obs, setObs] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const rawPrestamos = data?.allPrestamosActivosPaginated?.items ?? [];
  const totalCount = data?.allPrestamosActivosPaginated?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  const grupos: GrupoPrestamo[] = rawPrestamos.map((p: any) => ({
    prestamoId: p.id,
    fechaPrest: p.fechaPrest,
    fechaLimite: p.fechaLimite,
    personaId: p.persona?.id ?? '',
    personaNombre: `${p.persona?.nombre ?? ''} ${p.persona?.apellido ?? ''}`.trim(),
    items: (p.prestamoCarpetas ?? [])
      .filter((pc: { estado: string }) => pc.estado === 'prestado')
      .map((pc: { id: string; carpeta: { id: string; descripcion: string } }) => ({
        pcId: pc.id,
        carpetaId: pc.carpeta.id,
        carpetaDesc: pc.carpeta.descripcion,
      })),
  })).filter((g: GrupoPrestamo) => g.items.length > 0);

  const totalActiveItems = grupos.reduce((acc, g) => acc + g.items.length, 0);

  const toggleExpandGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const q = search.toLowerCase();
  const filteredGrupos = q
    ? grupos.filter((g) =>
        g.personaNombre.toLowerCase().includes(q) ||
        g.items.some((i) => i.carpetaDesc.toLowerCase().includes(q))
      )
    : grupos;

  const toggleItem = (pcId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pcId)) next.delete(pcId); else next.add(pcId);
      return next;
    });
  };

  const toggleGroup = (groupItems: GrupoItem[]) => {
    const allSelected = groupItems.every((i) => selected.has(i.pcId));
    setSelected((prev) => {
      const next = new Set(prev);
      for (const i of groupItems) {
        if (allSelected) next.delete(i.pcId);
        else next.add(i.pcId);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    setMsg('');
    if (selected.size === 0) { setMsg('Selecciona al menos una carpeta para devolver'); return; }
    setSaving(true);
    const res = await onDevolver(selected, obs);
    setMsg(res);
    setSaving(false);
    if (res.startsWith('✅')) {
      setSelected(new Set()); setObs('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 dark:bg-black/70 backdrop-blur-sm p-4 pt-8">
      <div className="glass-panel rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-surface-800 dark:text-sepia-200">Registrar Devolución</h3>
            <p className="text-xs text-surface-600 dark:text-sepia-500 mt-0.5">{totalActiveItems} carpeta(s) en préstamo en esta página</p>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-400 transition-colors"
          ><X size={20} /></button>
        </div>

        {msg && (
          <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-medium ${
            msg.startsWith('✅')
              ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
              : msg.startsWith('⚠️')
                ? 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}>{msg}</div>
        )}

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 dark:text-sepia-500" size={16} />
          <input type="text" placeholder="Buscar por persona o carpeta..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 placeholder:text-surface-600 dark:placeholder:text-sepia-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 transition-all text-sm"
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs text-surface-600 dark:text-sepia-500 mb-1">Observaciones (opcional, aplica a todas)</label>
          <textarea value={obs} onChange={(e) => setObs(e.target.value)}
            rows={2} placeholder="Ej: devuelto en buen estado..."
            className="w-full px-4 py-2 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 placeholder:text-surface-600 dark:placeholder:text-sepia-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 transition-all resize-none"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-brand-600" />
          </div>
        ) : (
          <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1">
            {filteredGrupos.length === 0 ? (
              <p className="text-sm text-surface-500 dark:text-sepia-500 text-center py-8">
                {search ? 'Sin resultados' : 'No hay carpetas en préstamo'}
              </p>
            ) : filteredGrupos.map((grupo) => {
              const overdue = isOverdue(grupo.fechaLimite);
              const allSelected = grupo.items.every((i) => selected.has(i.pcId));
              return (
                <div key={grupo.prestamoId} className={`rounded-xl border overflow-hidden ${
                  overdue ? 'border-red-200 dark:border-red-800' : 'border-white/30 dark:border-sepia-700/30'
                }`}>
                  <div className={`px-4 py-3 flex items-center justify-between ${
                    overdue ? 'bg-red-50/80 dark:bg-red-900/20' : 'bg-surface-50 dark:bg-sepia-800'
                  }`}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-surface-800 dark:text-sepia-200 text-sm truncate">{grupo.personaNombre}</p>
                        {overdue ? (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                            <AlertTriangle size={12} /> Vencido
                          </span>
                        ) : (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                            <Clock size={12} /> Al día
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-surface-600 dark:text-sepia-400">
                        <span>Préstamo: {formatDate(grupo.fechaPrest)}</span>
                        <span>Límite: {formatDate(grupo.fechaLimite)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {overdue && hasPerm('gestionar_prestamos') && (
                        <button onClick={() => onBloquear(grupo.personaId, grupo.personaNombre)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors text-xs font-medium"
                          title="Bloquear persona"
                        ><Ban size={13} /> Bloquear</button>
                      )}
                      <button onClick={() => toggleGroup(grupo.items)}
                        className="text-xs text-brand-600 dark:text-brand-dark-400 hover:text-brand-700 font-medium"
                      >{allSelected ? 'Quitar' : `${grupo.items.length} carp(s)`}</button>
                    </div>
                  </div>
                  <div className="divide-y divide-white/10 dark:divide-sepia-700/20">
                    {grupo.items.slice(0, expandedGroups.has(grupo.prestamoId) ? grupo.items.length : ITEMS_PER_GROUP).map((item) => (
                      <label key={item.pcId}
                        className={`flex items-center gap-3 px-4 py-2.5 transition-all text-sm cursor-pointer ${
                          selected.has(item.pcId)
                            ? 'bg-brand-50/50 dark:bg-brand-dark-600/10'
                            : 'hover:bg-white/30 dark:hover:bg-sepia-800/50'
                        }`}
                      >
                        <input type="checkbox" checked={selected.has(item.pcId)}
                          onChange={() => toggleItem(item.pcId)}
                          className="w-4 h-4 rounded border-surface-300 text-brand-600 dark:text-brand-dark-400 focus:ring-brand-400 dark:focus:ring-brand-dark-500"
                        />
                        <span className="font-medium text-surface-800 dark:text-sepia-200 flex-1">{item.carpetaDesc}</span>
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">En préstamo</span>
                      </label>
                    ))}
                  </div>
                  {grupo.items.length > ITEMS_PER_GROUP && (
                    <button
                      onClick={() => toggleExpandGroup(grupo.prestamoId)}
                      className="w-full py-2 text-xs font-medium text-brand-600 dark:text-brand-dark-400 hover:text-brand-700 dark:hover:text-brand-dark-300 hover:bg-white/20 dark:hover:bg-sepia-800/50 transition-colors"
                    >
                      {expandedGroups.has(grupo.prestamoId)
                        ? 'Mostrar menos'
                        : `Ver +${grupo.items.length - ITEMS_PER_GROUP} más`
                      }
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10 dark:border-sepia-700/20">
            <p className="text-xs text-surface-500 dark:text-sepia-500">
              Página {page + 1} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
                className="p-1.5 rounded-lg text-surface-500 dark:text-sepia-500 hover:bg-white/30 dark:hover:bg-sepia-800/50 hover:text-surface-800 dark:hover:text-sepia-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-medium text-surface-600 dark:text-sepia-400">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg text-surface-500 dark:text-sepia-500 hover:bg-white/30 dark:hover:bg-sepia-800/50 hover:text-surface-800 dark:hover:text-sepia-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/20 dark:border-sepia-700/30">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-surface-600 dark:text-sepia-400 bg-white/60 dark:bg-sepia-800/60 border border-white/80 dark:border-sepia-700/60 hover:bg-white dark:hover:bg-sepia-800 transition-colors text-sm font-medium"
          >Cancelar</button>
          <button onClick={handleSubmit} disabled={saving || selected.size === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-green-500 dark:from-green-500 dark:to-green-600 text-white font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
          ><Undo2 size={16} /> {saving ? 'Devolviendo...' : `Devolver (${selected.size})`}</button>
        </div>
      </div>
    </div>
  );
}
