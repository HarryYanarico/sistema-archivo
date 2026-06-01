import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@apollo/client/react';
import { Bell, AlertTriangle, Clock, ArrowLeftRight, RotateCcw, Ban, FileText, Info } from 'lucide-react';
import { GET_NOTIFICATIONS } from '../lib/queries';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'opencode_read_notifications';

function getReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function saveReadIds(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

const iconMap: Record<string, typeof AlertTriangle> = {
  VENCIMIENTO: Clock,
  PROXIMO_VENCER: Clock,
  TRASPASO: ArrowLeftRight,
  INCIDENTE: AlertTriangle,
  DEVOLUCION_ESTADO: RotateCcw,
  BLOQUEO: Ban,
};

const colorMap: Record<string, string> = {
  VENCIMIENTO: 'text-red-500 dark:text-red-400',
  PROXIMO_VENCER: 'text-amber-500 dark:text-amber-400',
  TRASPASO: 'text-blue-500 dark:text-blue-400',
  INCIDENTE: 'text-orange-500 dark:text-orange-400',
  DEVOLUCION_ESTADO: 'text-purple-500 dark:text-purple-400',
  BLOQUEO: 'text-rose-500 dark:text-rose-400',
};

export default function NotificationBell() {
  const { data } = useQuery(GET_NOTIFICATIONS, { pollInterval: 30000 });
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const notifications = data?.notifications ?? [];
  const readIds = getReadIds();
  const unread = notifications.filter((n: { id: string }) => !readIds.has(n.id));

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('click', handleClick);
    }
    return () => document.removeEventListener('click', handleClick);
  }, [open]);

  const handleToggle = () => {
    if (!open) {
      const ids = new Set(notifications.map((n: { id: string }) => n.id));
      const existing = getReadIds();
      ids.forEach((id) => existing.add(id));
      saveReadIds(existing);

      if (btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
      }
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const handleLink = (link: string) => {
    setOpen(false);
    navigate(link);
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="w-10 h-10 rounded-xl bg-white/50 dark:bg-sepia-800/50 border border-white/40 dark:border-sepia-700/40 flex items-center justify-center text-surface-600 dark:text-sepia-400 hover:text-brand-600 dark:hover:text-brand-dark-400 hover:bg-white dark:hover:bg-sepia-800 transition-colors relative"
        title="Notificaciones"
      >
        <Bell size={20} />
        {unread.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-lg shadow-red-500/30">
            {unread.length > 99 ? '99+' : unread.length}
          </span>
        )}
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          className="fixed w-80 sm:w-96 max-h-[70vh] flex flex-col rounded-2xl bg-white/95 dark:bg-sepia-900/95 backdrop-blur-xl border border-white/50 dark:border-sepia-700/50 shadow-2xl z-[100] overflow-hidden"
          style={{ top: pos.top, right: pos.right }}
        >
          <div className="p-4 border-b border-white/20 dark:border-sepia-700/20">
            <h3 className="font-bold text-surface-800 dark:text-sepia-200 text-sm flex items-center gap-2">
              <Bell size={16} />
              Notificaciones
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-surface-500 dark:text-sepia-500">
                <Info size={24} />
                <p className="text-sm">Sin notificaciones</p>
              </div>
            ) : (
              notifications.map((n: { id: string; tipo: string; mensaje: string; link: string; fecha: string }) => {
                const Icon = iconMap[n.tipo] ?? AlertTriangle;
                const color = colorMap[n.tipo] ?? 'text-surface-500';
                const isRead = readIds.has(n.id);
                return (
                  <button
                    key={n.id}
                    onClick={() => handleLink(n.link)}
                    className={`w-full text-left flex items-start gap-3 p-3 rounded-xl transition-colors ${
                      isRead
                        ? 'opacity-60 hover:opacity-100'
                        : 'bg-brand-50/50 dark:bg-brand-dark-600/10'
                    } hover:bg-white/50 dark:hover:bg-sepia-800/50 cursor-pointer`}
                  >
                    <div className={`mt-0.5 ${color}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-surface-700 dark:text-sepia-300 leading-snug">{n.mensaje}</p>
                      <p className="text-[10px] text-surface-500 dark:text-sepia-500 mt-0.5">{n.fecha}</p>
                    </div>
                    {!isRead && <span className="w-2 h-2 rounded-full bg-brand-500 dark:bg-brand-dark-400 flex-shrink-0 mt-1.5" />}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}