import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  GET_ALL_INCIDENTES_PAGINATED, REGISTRAR_INCIDENTE, RESOLVER_INCIDENTE,
} from '../lib/queries';
import { AlertTriangle, CheckCircle, Search, Plus } from 'lucide-react';
import { usePermission } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import RegistrarIncidenteModal from '../components/incidentes/RegistrarIncidenteModal';
import DetalleIncidenteModal from '../components/incidentes/DetalleIncidenteModal';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function IncidentesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('');
  const itemsPerPage = 10;

  const { data: incidentesPaginated, refetch } = useQuery(GET_ALL_INCIDENTES_PAGINATED, {
    variables: { page: currentPage, pageSize: itemsPerPage },
  });
  const [crearIncidente] = useMutation(REGISTRAR_INCIDENTE);
  const [resolverIncidente] = useMutation(RESOLVER_INCIDENTE);

  const { hasPerm } = usePermission();

  const [showCrear, setShowCrear] = useState(false);
  const [detalleIncidente, setDetalleIncidente] = useState<any>(null);

  const paginatedResult = incidentesPaginated?.allIncidentesPaginated;
  const items = paginatedResult?.items ?? [];
  const totalCount = paginatedResult?.totalCount ?? 0;

  const filteredItems = useMemo(() => {
    let list = items;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((i: any) =>
        i.tipoInci.toLowerCase().includes(q) ||
        (i.usuario?.firstName ?? '').toLowerCase().includes(q) ||
        (i.usuario?.lastName ?? '').toLowerCase().includes(q)
      );
    }
    if (filterEstado !== '') {
      list = list.filter((i: any) => String(i.estado) === filterEstado);
    }
    return list;
  }, [items, search, filterEstado]);

  const handleCrear = useCallback(async (vars: { tipoInci: string; carpetaIds: string[]; descripcion?: string }) => {
    try {
      const { data } = await crearIncidente({
        variables: { tipoInci: vars.tipoInci, carpetaIds: vars.carpetaIds, descripcion: vars.descripcion },
      });
      if (data?.crearIncidente?.error) throw new Error(data.crearIncidente.error);
      refetch();
      return '✅ Incidente registrado correctamente.';
    } catch (err: unknown) {
      return err instanceof Error ? err.message : 'Error al registrar incidente';
    }
  }, [crearIncidente, refetch]);

  const handleResolver = useCallback(async (id: string) => {
    try {
      const { data } = await resolverIncidente({ variables: { incidenteId: id } });
      if (data?.resolverIncidente?.error) throw new Error(data.resolverIncidente.error);
      refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al resolver incidente');
    }
  }, [resolverIncidente, refetch]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-surface-800 dark:text-sepia-200">Incidentes</h2>
        <div className="flex gap-3">
          {hasPerm('gestionar_carpetas') && (
            <button onClick={() => setShowCrear(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 dark:from-amber-500 dark:to-amber-600 text-white font-medium shadow-md shadow-amber-500/30 dark:shadow-amber-800/30 hover:shadow-lg transition-all text-sm"
            >
              <Plus size={16} />
              Registrar Incidente
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/20 dark:border-sepia-700/30">
          <h3 className="text-lg font-bold text-surface-800 dark:text-sepia-200">Listado de Incidentes</h3>
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
              <option value="true">Activos</option>
              <option value="false">Resueltos</option>
            </select>
            <span className="text-sm text-surface-600 dark:text-sepia-500">{totalCount} resultado(s)</span>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20 dark:border-sepia-700/30">
                <th className="text-left px-6 py-4 text-xs font-semibold text-surface-600 dark:text-sepia-500 uppercase">Tipo</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-surface-600 dark:text-sepia-500 uppercase">Fecha</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-surface-600 dark:text-sepia-500 uppercase">Estado</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-surface-600 dark:text-sepia-500 uppercase">Carpetas</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-surface-600 dark:text-sepia-500 uppercase">Registró</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-surface-600 dark:text-sepia-500 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 dark:divide-sepia-700/20">
              {filteredItems.map((inc: any) => (
                <tr key={inc.id}
                  className="hover:bg-white/30 dark:hover:bg-sepia-800/50 transition-colors cursor-pointer"
                  onClick={() => setDetalleIncidente(inc)}
                >
                  <td className="px-6 py-4 text-sm font-semibold text-surface-800 dark:text-sepia-200">{inc.tipoInci}</td>
                  <td className="px-6 py-4 text-sm text-surface-700 dark:text-sepia-300 whitespace-nowrap">{formatDate(inc.fechaReporte)}</td>
                  <td className="px-6 py-4">
                    {inc.estado ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                        <AlertTriangle size={12} /> Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                        <CheckCircle size={12} /> Resuelto
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-surface-600 dark:text-sepia-400">
                    {inc.detalles?.length ?? 0} carpeta(s)
                  </td>
                  <td className="px-6 py-4 text-sm text-surface-600 dark:text-sepia-400">
                    {inc.usuario ? `${inc.usuario.firstName} ${inc.usuario.lastName}` : '—'}
                  </td>
                  <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                    {inc.estado && hasPerm('gestionar_carpetas') && (
                      <button onClick={() => handleResolver(inc.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors text-xs font-medium"
                      >
                        <CheckCircle size={13} /> Resolver
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-surface-500 dark:text-sepia-500">
              <p className="text-lg font-medium">{search || filterEstado !== '' ? 'Sin resultados' : 'No hay incidentes registrados'}</p>
            </div>
          )}
        </div>
        <Pagination currentPage={currentPage} totalItems={totalCount} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
      </div>

      {showCrear && (
        <RegistrarIncidenteModal
          onClose={() => setShowCrear(false)}
          onRegistrar={handleCrear}
        />
      )}

      {detalleIncidente && (
        <DetalleIncidenteModal
          incidente={detalleIncidente}
          onClose={() => setDetalleIncidente(null)}
        />
      )}
    </>
  );
}
