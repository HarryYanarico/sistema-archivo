import { X, Calendar } from 'lucide-react';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

interface Props {
  prorroga: any;
  onClose: () => void;
}

export default function DetalleProrrogaModal({ prorroga, onClose }: Props) {
  const prestamo = prorroga.prestamo;
  const persona = prestamo?.persona;
  const personaSolicita = prorroga.personaSolicita;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-panel rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-surface-800 dark:text-sepia-200 flex items-center gap-2">
            <Calendar size={20} className="text-brand-600" />
            Detalle de la Prórroga
          </h3>
          <button onClick={onClose}
            className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100 transition-colors"
          ><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card rounded-xl p-4">
              <p className="text-xs text-surface-600 dark:text-sepia-500 mb-1">Fecha de registro</p>
              <p className="font-semibold text-surface-800 dark:text-sepia-200">{formatDate(prorroga.fechaRegistro)}</p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <p className="text-xs text-surface-600 dark:text-sepia-500 mb-1">Días otorgados</p>
              <p className="font-semibold text-surface-800 dark:text-sepia-200 text-lg">{prorroga.diasOtorgados} día(s)</p>
            </div>
          </div>

          {personaSolicita && (
            <div className="glass-card rounded-xl p-4">
              <p className="text-xs text-surface-600 dark:text-sepia-500 mb-1">Solicitada por</p>
              <p className="font-semibold text-surface-800 dark:text-sepia-200">{personaSolicita.nombre} {personaSolicita.apellido}</p>
              <p className="text-sm text-surface-500 dark:text-sepia-500 mt-0.5">CI: {personaSolicita.ci}</p>
            </div>
          )}

          {persona && (
            <div className="glass-card rounded-xl p-4">
              <p className="text-xs text-surface-600 dark:text-sepia-500 mb-1">Persona que tiene el préstamo</p>
              <p className="font-semibold text-surface-800 dark:text-sepia-200">{persona.nombre} {persona.apellido}</p>
              <p className="text-sm text-surface-500 dark:text-sepia-500 mt-0.5">CI: {persona.ci}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card rounded-xl p-4">
              <p className="text-xs text-surface-600 dark:text-sepia-500 mb-1">Fecha de préstamo</p>
              <p className="font-semibold text-surface-800 dark:text-sepia-200">{prestamo ? formatDate(prestamo.fechaPrest) : '—'}</p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <p className="text-xs text-surface-600 dark:text-sepia-500 mb-1">Nueva fecha límite</p>
              <p className="font-semibold text-surface-800 dark:text-sepia-200">{prestamo ? formatDate(prestamo.fechaLimite) : '—'}</p>
            </div>
          </div>

          {prorroga.usuario && (
            <div className="glass-card rounded-xl p-4">
              <p className="text-xs text-surface-600 dark:text-sepia-500 mb-1">Registrado por</p>
              <p className="font-semibold text-surface-800 dark:text-sepia-200">
                {prorroga.usuario.firstName} {prorroga.usuario.lastName} (@{prorroga.usuario.username})
              </p>
            </div>
          )}

          {prorroga.motivo && (
            <div className="glass-card rounded-xl p-4">
              <p className="text-xs text-surface-600 dark:text-sepia-500 mb-1">Motivo</p>
              <p className="text-surface-700 dark:text-sepia-300">{prorroga.motivo}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t border-white/20 dark:border-sepia-700/30">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 dark:from-brand-dark-500 dark:to-brand-dark-600 text-white font-medium shadow-md text-sm"
          >Cerrar</button>
        </div>
      </div>
    </div>
  );
}
