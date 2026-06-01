import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  GET_ALL_DEVOLUCIONES_PAGINATED, GET_ALL_PRESTAMOS, REGISTRAR_DEVOLUCION, CREAR_BLOQUEO,
} from '../lib/queries';
import { Undo2, Search } from 'lucide-react';
import { usePermission } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import DevolucionModal from '../components/prestamos/DevolucionModal';
import BloqueoModal from '../components/prestamos/BloqueoModal';
import DetalleDevolucionModal from '../components/prestamos/DetalleDevolucionModal';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function isOverdue(dateStr: string) {
  return new Date(dateStr) < new Date(new Date().toDateString());
}

export default function DevolucionesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const itemsPerPage = 10;

  const { data: devolucionesPaginated, refetch: refetchDevoluciones } = useQuery(GET_ALL_DEVOLUCIONES_PAGINATED, {
    variables: { page: currentPage, pageSize: itemsPerPage },
  });
  const { data: prestamosData } = useQuery(GET_ALL_PRESTAMOS, { fetchPolicy: 'network-only' });
  const [devolver] = useMutation(REGISTRAR_DEVOLUCION);
  const [crearBloqueo] = useMutation(CREAR_BLOQUEO);

  const { hasPerm } = usePermission();

  const [showDevolucion, setShowDevolucion] = useState(false);
  const [showBloqueo, setShowBloqueo] = useState<{ personaId: string; personaNombre: string } | null>(null);
  const [selectedDevolucion, setSelectedDevolucion] = useState<any | null>(null);

  const prestamosActivosConCarpetas = useMemo(() => {
    if (!prestamosData?.allPrestamos) return [];
    const result: {
      prestamoId: string; fechaPrest: string; fechaLimite: string;
      personaId: string; personaNombre: string;
      items: { pcId: string; carpetaId: string; carpetaDesc: string }[];
    }[] = [];
    for (const p of prestamosData.allPrestamos) {
      const activas = (p.prestamoCarpetas ?? []).filter((pc: { estado: string }) => pc.estado === 'prestado');
      if (activas.length === 0) continue;
      result.push({
        prestamoId: p.id,
        fechaPrest: p.fechaPrest,
        fechaLimite: p.fechaLimite,
        personaId: p.persona?.id ?? '',
        personaNombre: `${p.persona?.nombre ?? ''} ${p.persona?.apellido ?? ''}`,
        items: activas.map((pc: { id: string; carpeta: { id: string; descripcion: string } }) => ({
          pcId: pc.id,
          carpetaId: pc.carpeta.id,
          carpetaDesc: pc.carpeta.descripcion,
        })),
      });
    }
    return result;
  }, [prestamosData]);

  const totalActiveItems = useMemo(
    () => prestamosActivosConCarpetas.reduce((acc, g) => acc + g.items.length, 0),
    [prestamosActivosConCarpetas]
  );

  const paginatedResult = devolucionesPaginated?.allDevolucionesPaginated;
  const items = paginatedResult?.items ?? [];
  const totalCount = paginatedResult?.totalCount ?? 0;

  const filteredItems = useMemo(() => {
    let list = items;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d: any) =>
        (d.prestamoCarpeta?.carpeta?.descripcion ?? '').toLowerCase().includes(q) ||
        (d.usuario?.firstName ?? '').toLowerCase().includes(q) ||
        (d.usuario?.lastName ?? '').toLowerCase().includes(q) ||
        (d.observaciones ?? '').toLowerCase().includes(q)
      );
    }
    if (filterEstado) {
      list = list.filter((d: any) => d.estadoDevolucion === filterEstado);
    }
    return list;
  }, [items, search, filterEstado]);

  const refetchAll = useCallback(() => {
    refetchDevoluciones();
  }, [refetchDevoluciones]);

  const handleDevolverMultiple = useCallback(async (selected: Set<string>, observaciones: string): Promise<string> => {
    let ok = 0; let err = 0;
    for (const pcId of selected) {
      try {
        const vars: Record<string, unknown> = { idPrestamoCarpeta: pcId };
        if (observaciones) vars.observaciones = observaciones;
        const { data } = await devolver({ variables: vars as any });
        if (data?.registrarDevolucion?.error) err++;
        else ok++;
      } catch { err++; }
    }
    if (err === 0) {
      refetchAll();
      return `✅ ${ok} carpeta(s) devuelta(s) correctamente.`;
    }
    return `⚠️ ${ok} devuelta(s), ${err} con error.`;
  }, [devolver, refetchAll]);

  const handleBloquear = useCallback(async (personaId: string, motivo: string): Promise<string> => {
    try {
      const { data } = await crearBloqueo({ variables: { personaId, motivo } });
      if (data?.crearBloqueo?.error) throw new Error(data.crearBloqueo.error);
      return '✅ Persona bloqueada correctamente.';
    } catch (err: unknown) {
      return err instanceof Error ? err.message : 'Error al bloquear';
    }
  }, [crearBloqueo]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-surface-800 dark:text-sepia-200">Devoluciones</h2>
        <div className="flex gap-3">
          {hasPerm('gestionar_devoluciones') && (
            <button onClick={() => setShowDevolucion(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-green-500 dark:from-green-500 dark:to-green-600 text-white font-medium shadow-md shadow-green-500/30 dark:shadow-green-800/30 hover:shadow-lg transition-all text-sm"
            >
              <Undo2 size={16} />
              Registrar Devolución
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/20 dark:border-sepia-700/30">
          <h3 className="text-lg font-bold text-surface-800 dark:text-sepia-200">Historial</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 dark:text-sepia-500" size={16} />
              <input type="text" placeholder="Buscar..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 pl-9 pr-4 py-2 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 placeholder:text-surface-600 dark:placeholder:text-sepia-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-all text-sm"
              />
            </div>
            <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-all text-sm"
            >
              <option value="">Todos</option>
              <option value="buen_estado">Buen estado</option>
              <option value="mal_estado">Mal estado</option>
              <option value="danado">Dañado</option>
            </select>
            <span className="text-sm text-surface-600 dark:text-sepia-500">{totalCount} resultado(s)</span>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20 dark:border-sepia-700/30">
                <th className="text-left px-6 py-4 text-xs font-semibold text-surface-600 dark:text-sepia-500 uppercase">Fecha</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-surface-600 dark:text-sepia-500 uppercase">Carpeta</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-surface-600 dark:text-sepia-500 uppercase">Estado</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-surface-600 dark:text-sepia-500 uppercase">Observaciones</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-surface-600 dark:text-sepia-500 uppercase">Registró</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 dark:divide-sepia-700/20">
              {filteredItems.map((d: any) => (
                <tr key={d.id} onClick={() => setSelectedDevolucion(d)}
                  className="cursor-pointer hover:bg-white/30 dark:hover:bg-sepia-800/50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-surface-700 dark:text-sepia-300 whitespace-nowrap">{formatDate(d.fechaDevol)}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-surface-800 dark:text-sepia-200">
                    {d.prestamoCarpeta?.carpeta?.descripcion ?? '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      d.estadoDevolucion === 'buen_estado'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                        : d.estadoDevolucion === 'mal_estado'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                    }`}>
                      {d.estadoDevolucion === 'buen_estado' ? 'Buen estado' : d.estadoDevolucion === 'mal_estado' ? 'Mal estado' : 'Dañado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-surface-600 dark:text-sepia-400 max-w-[200px] truncate">
                    {d.observaciones || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-surface-600 dark:text-sepia-400">
                    {d.usuario ? `${d.usuario.firstName} ${d.usuario.lastName}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-surface-500 dark:text-sepia-500">
              <p className="text-lg font-medium">{search || filterEstado ? 'Sin resultados' : 'No hay devoluciones registradas'}</p>
            </div>
          )}
        </div>
        <Pagination currentPage={currentPage} totalItems={totalCount} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
      </div>

      {showDevolucion && (
        <DevolucionModal
          grupos={prestamosActivosConCarpetas}
          totalActiveItems={totalActiveItems}
          onClose={() => setShowDevolucion(false)}
          onDevolver={handleDevolverMultiple}
          onBloquear={(id, nombre) => setShowBloqueo({ personaId: id, personaNombre: nombre })}
          formatDate={formatDate}
          isOverdue={isOverdue}
          hasPerm={hasPerm}
        />
      )}

      {showBloqueo && (
        <BloqueoModal
          personaNombre={showBloqueo.personaNombre}
          onClose={() => setShowBloqueo(null)}
          onBloquear={async (motivo) => {
            const res = await handleBloquear(showBloqueo.personaId, motivo);
            if (res.startsWith('✅')) setShowBloqueo(null);
            return res;
          }}
        />
      )}

      {selectedDevolucion && (
        <DetalleDevolucionModal
          devolucion={selectedDevolucion}
          onClose={() => setSelectedDevolucion(null)}
        />
      )}
    </>
  );
}
