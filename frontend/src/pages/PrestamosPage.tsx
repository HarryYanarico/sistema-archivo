import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  GET_ALL_PERSONAS, GET_ALL_CARPETAS, REGISTRAR_PRESTAMO,
  GET_ALL_PRESTAMOS_PAGINATED, GET_ALL_PRESTAMOS_VENCIDOS_PAGINATED,
  REGISTRAR_DEVOLUCION, CREAR_BLOQUEO,
} from '../lib/queries';
import {
  BookOpenCheck, AlertTriangle, RotateCcw,
} from 'lucide-react';
import { usePermission } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import PrestamosVencidosModal from '../components/prestamos/PrestamosVencidosModal';
import DetallePrestamoModal from '../components/prestamos/DetallePrestamoModal';
import DevolucionModal from '../components/prestamos/DevolucionModal';
import DevolucionForm from '../components/prestamos/DevolucionForm';
import BloqueoModal from '../components/prestamos/BloqueoModal';
import NuevaPersonaModal from '../components/prestamos/NuevaPersonaModal';
import RegistrarPrestamoModal from '../components/prestamos/RegistrarPrestamoModal';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function isOverdue(dateStr: string) {
  return new Date(dateStr) < new Date(new Date().toDateString());
}

export default function PrestamosPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: prestamosPaginated, loading: loadingPrest, refetch: refetchPrestamosPaginated } = useQuery(GET_ALL_PRESTAMOS_PAGINATED, {
    variables: { page: currentPage, pageSize: itemsPerPage },
  });
  const { data: vencidosCountData } = useQuery(GET_ALL_PRESTAMOS_VENCIDOS_PAGINATED, {
    variables: { page: 1, pageSize: 1 },
  });
  const vencidosCount = vencidosCountData?.allPrestamosVencidosPaginated?.totalCount ?? 0;
  const { data: personasData } = useQuery(GET_ALL_PERSONAS);
  const { data: carpetasData } = useQuery(GET_ALL_CARPETAS);
  const [registrar] = useMutation(REGISTRAR_PRESTAMO);
  const [devolver] = useMutation(REGISTRAR_DEVOLUCION);
  const [crearBloqueo] = useMutation(CREAR_BLOQUEO);

  const { hasPerm } = usePermission();

  const personas = personasData?.allPersonas ?? [];
  const carpetasDisponibles = (carpetasData?.allCarpetas ?? []).filter((c: { estado: string }) => c.estado === 'disponible');
  const personasConCargo = personas.filter((p: { cargo?: string }) => p.cargo);

  // ---- Modal visibility ----
  const [showForm, setShowForm] = useState(false);
  const [showVencidos, setShowVencidos] = useState(false);
  const [showDevolucion, setShowDevolucion] = useState(false);
  const [showNewPersona, setShowNewPersona] = useState(false);

  // ---- Detail / devolucion individual / bloqueo state ----
  const [selectedPrestamo, setSelectedPrestamo] = useState<any>(null);
  const [devolucionForm, setDevolucionForm] = useState<{
    pcId: string; carpetaDesc: string; personaNombre: string; personaId: string;
  } | null>(null);
  const [showBloqueo, setShowBloqueo] = useState<{ personaId: string; personaNombre: string } | null>(null);

  const paginatedResult = prestamosPaginated?.allPrestamosPaginated;
  const paginadosPrestamos = paginatedResult?.items ?? [];
  const totalPrestamos = paginatedResult?.totalCount ?? 0;

  // ---- Handlers ----
  const handleRegistrar = useCallback(async (vars: Record<string, unknown>): Promise<string> => {
    try {
      const { data: res } = await registrar({ variables: vars as any });
      if (res?.registrarPrestamo?.error) throw new Error(res.registrarPrestamo.error);
      setShowForm(false);
      refetchPrestamosPaginated();
      return '';
    } catch (err: unknown) {
      return err instanceof Error ? err.message : 'Error al registrar';
    }
  }, [registrar, refetchPrestamosPaginated]);

  const refetchAll = useCallback(() => {
    refetchPrestamosPaginated();
  }, [refetchPrestamosPaginated]);

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

  const handleDevolverIndividual = useCallback(async (vars: Record<string, unknown>): Promise<string> => {
    try {
      const { data } = await devolver({ variables: vars as any });
      if (data?.registrarDevolucion?.error) throw new Error(data.registrarDevolucion.error);
      refetchAll();
      return '✅ Devolución registrada correctamente.';
    } catch (err: unknown) {
      return err instanceof Error ? err.message : 'Error al registrar devolución';
    }
  }, [devolver, refetchAll]);

  const handleBloquear = useCallback(async (personaId: string, motivo: string): Promise<string> => {
    try {
      const { data } = await crearBloqueo({
        variables: { personaId, motivo },
      });
      if (data?.crearBloqueo?.error) throw new Error(data.crearBloqueo.error);
      return '✅ Persona bloqueada correctamente.';
    } catch (err: unknown) {
      return err instanceof Error ? err.message : 'Error al bloquear';
    }
  }, [crearBloqueo]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-surface-800 dark:text-sepia-200">Préstamos</h2>
        <div className="flex gap-3">
          {vencidosCount > 0 && (
            <button onClick={() => setShowVencidos(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 dark:from-red-500 dark:to-red-600 text-white font-medium shadow-md shadow-red-500/30 dark:shadow-red-800/30 hover:shadow-lg transition-all text-sm"
            >
              <AlertTriangle size={16} />
              Préstamos Vencidos
              <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-xs font-bold">{vencidosCount}</span>
            </button>
          )}
          {hasPerm('gestionar_devoluciones') && (
            <button onClick={() => setShowDevolucion(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-green-500 dark:from-green-500 dark:to-green-600 text-white font-medium shadow-md shadow-green-500/30 dark:shadow-green-800/30 hover:shadow-lg transition-all text-sm"
            >
              <RotateCcw size={16} />
              Registrar Devolución
            </button>
          )}
          {hasPerm('gestionar_prestamos') && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 dark:from-brand-dark-500 dark:to-brand-dark-600 text-white font-medium shadow-md shadow-brand-500/30 dark:shadow-brand-dark-600/20 hover:shadow-lg transition-all text-sm"
            >
              <BookOpenCheck size={16} />
              Registrar Préstamo
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel rounded-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/20 dark:border-sepia-700/30">
          <h3 className="text-lg font-bold text-surface-800 dark:text-sepia-200">Préstamos</h3>
          <span className="text-sm text-surface-600 dark:text-sepia-500">{totalPrestamos} resultado(s)</span>
        </div>
        <div className="overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20 dark:border-sepia-700/30">
                <th className="text-left px-6 py-4 text-xs font-semibold text-surface-600 dark:text-sepia-500 uppercase">Fecha</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-surface-600 dark:text-sepia-500 uppercase">Persona</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-surface-600 dark:text-sepia-500 uppercase">Carpetas</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-surface-600 dark:text-sepia-500 uppercase">Límite</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-surface-600 dark:text-sepia-500 uppercase">Registró</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-surface-600 dark:text-sepia-500 uppercase">Autorizó</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 dark:divide-sepia-700/20">
              {paginadosPrestamos.map((p: {
                  id: string; fechaPrest: string; fechaLimite: string;
                  persona: { id: string; ci: string; nombre: string; apellido: string };
                  usuario?: { username: string; firstName: string; lastName: string };
                  autorizadoPor?: { nombre: string; apellido: string; cargo: string };
                  carpetas: { id: string; descripcion: string; estado: boolean }[];
                }) => (
                  <tr key={p.id} onClick={() => setSelectedPrestamo(p)}
                    className="hover:bg-white/30 dark:hover:bg-sepia-800/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 text-sm text-surface-700 dark:text-sepia-300">{p.fechaPrest}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-surface-800 dark:text-sepia-200">{p.persona.nombre} {p.persona.apellido}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {p.carpetas.map((c) => (
                          <span key={c.id} className="px-2 py-0.5 rounded-md text-xs bg-surface-100 dark:bg-sepia-800 text-surface-600 dark:text-sepia-400">{c.descripcion}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-600 dark:text-sepia-400">{p.fechaLimite}</td>
                    <td className="px-6 py-4 text-sm text-surface-600 dark:text-sepia-400">{p.usuario ? `${p.usuario.firstName} ${p.usuario.lastName}` : '—'}</td>
                    <td className="px-6 py-4 text-sm text-surface-600 dark:text-sepia-400">
                      {p.autorizadoPor ? (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-brand-100 dark:bg-brand-dark-600/20 text-brand-700 dark:text-brand-dark-400">
                          {p.autorizadoPor.nombre} {p.autorizadoPor.apellido} ({p.autorizadoPor.cargo})
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {totalPrestamos === 0 && (
            <div className="text-center py-12 text-surface-500 dark:text-sepia-500">
              <p className="text-lg font-medium">No hay préstamos registrados</p>
            </div>
          )}
          </div>
          <Pagination currentPage={currentPage} totalItems={totalPrestamos} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
      </div>

      {showVencidos && (
        <PrestamosVencidosModal
          onClose={() => setShowVencidos(false)}
          onSelect={(p) => setSelectedPrestamo(p)}
          formatDate={formatDate}
        />
      )}

      {selectedPrestamo && (
        <DetallePrestamoModal
          prestamo={selectedPrestamo}
          onClose={() => setSelectedPrestamo(null)}
          onDevolverIndividual={(data) => { setSelectedPrestamo(null); setDevolucionForm(data); }}
          onBloquear={(id, nombre) => setShowBloqueo({ personaId: id, personaNombre: nombre })}
          isOverdue={isOverdue}
          hasPerm={hasPerm}
        />
      )}

      {showDevolucion && (
        <DevolucionModal
          onClose={() => setShowDevolucion(false)}
          onDevolver={handleDevolverMultiple}
          onBloquear={(id, nombre) => setShowBloqueo({ personaId: id, personaNombre: nombre })}
          formatDate={formatDate}
          isOverdue={isOverdue}
          hasPerm={hasPerm}
        />
      )}

      {devolucionForm && (
        <DevolucionForm
          carpetaDesc={devolucionForm.carpetaDesc}
          personaNombre={devolucionForm.personaNombre}
          pcId={devolucionForm.pcId}
          personaId={devolucionForm.personaId}
          onClose={() => setDevolucionForm(null)}
          onDevolver={async (vars) => {
            const res = await handleDevolverIndividual(vars as any);
            if (res.startsWith('✅')) setDevolucionForm(null);
            return res;
          }}
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

      <NuevaPersonaModal
        show={showNewPersona}
        onClose={() => setShowNewPersona(false)}
        onCreated={(id) => {
          const input = document.querySelector<HTMLInputElement>('[data-search-persona]');
          if (input) input.value = '';
        }}
      />

      <RegistrarPrestamoModal
        show={showForm}
        onClose={() => setShowForm(false)}
        personas={personas}
        carpetasDisponibles={carpetasDisponibles}
        personasConCargo={personasConCargo}
        hasPerm={hasPerm}
        onRegistrar={handleRegistrar}
        onShowNewPersona={() => setShowNewPersona(true)}
      />
    </>
  );
}
