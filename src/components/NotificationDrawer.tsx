import React from 'react';
import { Bell, X, CheckCircle2, AlertTriangle, Info, Check } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border-l border-slate-200/90 w-full max-w-md h-full shadow-2xl p-5 flex flex-col justify-between text-xs">
        
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Pusat Notifikasi & Validasi</h3>
                <p className="text-[11px] text-slate-500">Status sinkronisasi & peringatan sistem</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List */}
          <div className="py-4 space-y-2.5 max-h-[calc(100vh-10rem)] overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-medium">Tidak ada notifikasi baru.</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    notif.read 
                      ? 'bg-slate-50/70 border-slate-200/60 text-slate-500' 
                      : 'bg-white border-sky-200/90 shadow-xs text-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {notif.type === 'success' ? (
                      <div className="p-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    ) : notif.type === 'warning' ? (
                      <div className="p-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 shrink-0 mt-0.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="p-1 rounded-lg bg-sky-50 text-sky-600 border border-sky-200 shrink-0 mt-0.5">
                        <Info className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 text-xs">{notif.title}</div>
                      <p className="text-[11px] mt-0.5 text-slate-600 leading-relaxed">{notif.message}</p>
                      <div className="text-[10px] text-slate-400 mt-1 font-medium">{notif.time}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
          <button
            onClick={onMarkAllRead}
            className="text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1.5 text-[11px] cursor-pointer transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Tandai Semua Dibaca</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
