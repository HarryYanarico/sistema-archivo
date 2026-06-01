import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_ALL_BLOQUEOS, DESBLOQUEAR_PERSONA } from '../lib/queries';
import { Ban, CheckCircle2, X, AlertTriangle, Search } from 'lucide-react';

export default function BloqueosPage() {
  const { data, loading, refetch } = useQuery(GET_ALL_BLOQUEOS);
  const [desbloquear] = useMutation(DESBLOQUEAR_PERSONA, { refetchQueries: [{ query: GET_ALL_BLOQUEOS }] });
  const [search, setSearch] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const bloqueos = (data?.allBloqueos ?? [])
    .filter((b: { persona: { nombre: string; apellido: string } }) => {
      const q = search.toLowerCase();
      return !q || `${b.persona?.nombre} ${b.persona?.apellido}`.toLowerCase().includes(q);
    });

  const handleDesbloquear = async (id: string) => {
    try {
      const { data: res } = await desbloquear({ variables: { bloqueoId: id } });
      if (res?.desbloquearPersona?.error) throw new Error(res.desbloquearPersona.error);
      setConfirmId(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al desbloquear');
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-surface-800 dark:text-sepia-200">Bloqueos</h2>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 dark:text-sepia-500" size={16} />
        <input type="text" placeholder="Buscar persona..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 placeholder:text-surface-600 dark:placeholder:text-sepia-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 transition-all text-sm"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-surface-500 dark:text-sepia-500">Cargando...</div>
      ) : bloqueos.length === 0 ? (
        <div className="text-center py-12 text-surface-500 dark:text-sepia-500">
          <Ban size={48} className="mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">No hay bloqueos registrados</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bloqueos.map((b: {
            id: string; fechaBloq: string; motivoBloq: string; fechaDesbloq: string | null;
            persona: { id: string; nombre: string; apellido: string; ci: string };
            usuario: { username: string; firstName: string; lastName: string };
          }) => {
            const activo = !b.fechaDesbloq;
            return (
              <div key={b.id} className={`glass-card rounded-2xl p-5 border ${
                activo
                  ? 'border-red-200 dark:border-red-800'
                  : 'border-green-200 dark:border-green-800'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {activo
                      ? <Ban size={18} className="text-red-500 shrink-0" />
                      : <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                    }
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      activo
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                    }`}>{activo ? 'Activo' : 'Desbloqueado'}</span>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="font-semibold text-surface-800 dark:text-sepia-200 text-lg">
                    {b.persona?.nombre} {b.persona?.apellido}
                  </p>
                  {b.persona?.ci && (
                    <p className="text-xs text-surface-500 dark:text-sepia-500">CI: {b.persona.ci}</p>
                  )}
                </div>

                <div className="text-sm text-surface-600 dark:text-sepia-400 mb-3 p-3 rounded-xl bg-white/40 dark:bg-sepia-800/40">
                  <p className="font-medium text-surface-700 dark:text-sepia-300 mb-1">Motivo:</p>
                  <p className="text-xs leading-relaxed">{b.motivoBloq}</p>
                </div>

                <p className="text-xs text-surface-500 dark:text-sepia-500 mb-1">
                  Bloqueado: {new Date(b.fechaBloq).toLocaleDateString('es-ES')} por @{b.usuario?.username}
                </p>
                {b.fechaDesbloq && (
                  <p className="text-xs text-surface-500 dark:text-sepia-500">
                    Desbloqueado: {new Date(b.fechaDesbloq).toLocaleDateString('es-ES')}
                  </p>
                )}

                {activo && (
                  <div className="mt-4">
                    {confirmId === b.id ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleDesbloquear(b.id)}
                          className="flex-1 px-3 py-2 rounded-xl bg-green-600 dark:bg-green-500 text-white text-xs font-semibold hover:bg-green-500 transition-colors"
                        >Confirmar</button>
                        <button onClick={() => setConfirmId(null)}
                          className="px-3 py-2 rounded-xl bg-surface-200 dark:bg-sepia-800 text-surface-600 dark:text-sepia-400 text-xs font-semibold hover:bg-surface-300 dark:hover:bg-sepia-700 transition-colors"
                        >Cancelar</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmId(b.id)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-green-600 to-green-500 dark:from-green-500 dark:to-green-600 text-white text-xs font-semibold hover:shadow-lg transition-all"
                      ><CheckCircle2 size={14} /> Desbloquear</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
