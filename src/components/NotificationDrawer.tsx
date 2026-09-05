import React from 'react';
import { Bell, X, CheckCircle2, AlertTriangle, Info, Check, Trash2 } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onMarkRead?: (id: string) => void;
  onClearAllNotif?: () => void;
  onDeleteNotif?: (id: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onMarkRead,
  onClearAllNotif,
  onDeleteNotif
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border-l border-slate-200/90 w-full max-w-md h-full shadow-2xl p-5 flex flex-col justify-between text-xs">
        
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 relative">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white font-black text-[9px] rounded-full flex items-center justify-center border border-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-sm">Pusat Notifikasi & Validasi</h3>
                  {notifications.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                      {notifications.length} Pesan
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">Aktivitas update data & peringatan sistem</p>
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

          {/* Action Row */}
          {notifications.length > 0 && (
            <div className="pt-3 pb-1 flex items-center justify-between gap-2 border-b border-slate-100">
              <button
                onClick={onMarkAllRead}
                className="text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1.5 text-[11px] cursor-pointer transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Tandai Semua Dibaca</span>
              </button>

              {onClearAllNotif && (
                <button
                  onClick={() => {
                    if (confirm('Apakah Anda yakin ingin menghapus semua notifikasi? Pesan yang dihapus tidak akan muncul kembali.')) {
                      onClearAllNotif();
                    }
                  }}
                  className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1.5 text-[11px] cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Semua</span>
                </button>
              )}
            </div>
          )}

          {/* List */}
          <div className="py-4 space-y-2.5 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-medium text-slate-600">Tidak ada notifikasi.</p>
                <p className="text-[10px] text-slate-400 mt-1">Notifikasi baru akan muncul otomatis saat ada update data.</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.read && onMarkRead) {
                      onMarkRead(notif.id);
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition-all relative group cursor-pointer active:scale-[0.99] ${
                    notif.read 
                      ? 'bg-slate-50/70 border-slate-200/60 text-slate-500 hover:bg-slate-50' 
                      : 'bg-white border-sky-300 shadow-xs text-slate-800 hover:border-sky-400 hover:bg-sky-50/30'
                  }`}
                  title={notif.read ? "Notifikasi sudah dibaca" : "Klik untuk membaca & hilangkan tanda notifikasi"}
                >
                  <div className="flex items-start gap-2.5 pr-6">
                    {notif.type === 'success' ? (
                      <div className={`p-1 rounded-lg shrink-0 mt-0.5 ${notif.read ? 'bg-slate-100 text-slate-400 border border-slate-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    ) : notif.type === 'warning' ? (
                      <div className={`p-1 rounded-lg shrink-0 mt-0.5 ${notif.read ? 'bg-slate-100 text-slate-400 border border-slate-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className={`p-1 rounded-lg shrink-0 mt-0.5 ${notif.read ? 'bg-slate-100 text-slate-400 border border-slate-200' : 'bg-sky-50 text-sky-600 border border-sky-200'}`}>
                        <Info className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 text-xs flex items-center justify-between gap-2">
                        <span className={notif.read ? 'text-slate-600 font-semibold' : 'text-slate-900 font-bold'}>{notif.title}</span>
                        {!notif.read ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            Baru
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-normal">Dibaca</span>
                        )}
                      </div>
                      <p className={`text-[11px] mt-0.5 leading-relaxed ${notif.read ? 'text-slate-500' : 'text-slate-700'}`}>{notif.message}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-slate-400 font-medium">{notif.time}</span>
                        {!notif.read && (
                          <span className="text-[9px] font-semibold text-sky-600 bg-sky-50 border border-sky-100 px-1.5 py-0.5 rounded-md">
                            Klik untuk tandai dibaca
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Individual delete button */}
                  {onDeleteNotif && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNotif(notif.id);
                      }}
                      className="absolute top-3 right-3 p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                      title="Hapus notifikasi ini"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end items-center">
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
