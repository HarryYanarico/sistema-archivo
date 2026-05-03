import { FileText, BookOpenCheck, Users, TrendingUp, FolderSearch } from 'lucide-react';

export default function Dashboard() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Expedientes"
          value="12,458"
          trend="+125 esta semana"
          icon={<FileText className="text-brand-600" size={24} />}
          color="bg-brand-100"
        />
        <StatCard
          title="Préstamos Activos"
          value="342"
          trend="-12 esta semana"
          icon={<BookOpenCheck className="text-amber-600" size={24} />}
          color="bg-amber-100"
        />
        <StatCard
          title="Usuarios Registrados"
          value="89"
          trend="+15% vs mes anterior"
          icon={<Users className="text-indigo-600" size={24} />}
          color="bg-indigo-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-surface-800">Préstamos Recientes</h3>
            <button className="text-sm text-brand-600 font-medium hover:text-brand-700 transition-colors">Ver todos</button>
          </div>

          <div className="space-y-4 overflow-y-auto pr-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card rounded-xl p-4 flex items-center justify-between group cursor-pointer hover:border-brand-200 hover:bg-white/80">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center text-surface-500 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                    <FolderSearch size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-surface-800 text-sm">EXP-{2024000 + i}</p>
                    <p className="text-xs text-surface-500">Juan Pérez - Ingeniería Civil</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    En Préstamo
                  </span>
                  <p className="text-xs text-surface-400 mt-1">Vence: 12 May 2026</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
          <h3 className="text-lg font-bold text-surface-800 mb-2">Acciones Rápidas</h3>

          <button className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-medium shadow-md shadow-brand-500/30 hover:shadow-lg hover:shadow-brand-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
            <BookOpenCheck size={18} />
            Registrar Préstamo
          </button>

          <button className="w-full py-3 px-4 rounded-xl bg-white/60 border border-white/80 text-surface-700 font-medium shadow-sm hover:bg-white transition-all flex items-center justify-center gap-2">
            <FileText size={18} />
            Nuevo Expediente
          </button>

          <button className="w-full py-3 px-4 rounded-xl bg-white/60 border border-white/80 text-surface-700 font-medium shadow-sm hover:bg-white transition-all flex items-center justify-center gap-2">
            <Users size={18} />
            Agregar Usuario
          </button>

          <div className="mt-auto pt-6 border-t border-white/30">
            <div className="glass-card rounded-xl p-4 bg-brand-50/50 border-brand-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-brand-100 text-brand-600">
                  <TrendingUp size={16} />
                </div>
                <h4 className="font-semibold text-sm text-surface-800">Capacidad</h4>
              </div>
              <p className="text-xs text-surface-500 mb-2">Estante A (85% lleno)</p>
              <div className="w-full bg-surface-200 rounded-full h-1.5">
                <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ title, value, trend, icon, color }: { title: string; value: string; trend: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${color} opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out`} />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl ${color} shadow-sm`}>
            {icon}
          </div>
        </div>
        <h3 className="text-surface-500 text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-bold text-surface-800 mb-2">{value}</p>
        <p className="text-xs font-medium text-surface-500">{trend}</p>
      </div>
    </div>
  );
}
