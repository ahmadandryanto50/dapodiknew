import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, X, HelpCircle, ArrowUpRight } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);

  // If already running as an installed PWA / Standalone, do not display installation option
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <div className="relative flex items-center">
        <button
          onClick={install}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 active:scale-95 transition-all focus:outline-none"
          title="Instal Aplikasi di HP / Desktop"
        >
          <Smartphone className="w-3.5 h-3.5 animate-bounce" />
          <span>Pasang Aplikasi</span>
        </button>
        
        {showTooltip && (
          <div className="absolute top-full mt-2 right-0 z-50 w-64 p-3 bg-slate-800 border border-slate-700 rounded-xl shadow-xl text-slate-200 text-[11px] leading-relaxed">
            <div className="flex items-start justify-between gap-1.5">
              <span className="font-bold text-sky-400">Instal Aplikasi di HP (APK)!</span>
              <button onClick={() => setShowTooltip(false)} className="text-slate-400 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="mt-1">
              Klik tombol ini untuk memasang Dapodik langsung di HP Anda. Aplikasi otomatis terupdate saat web diperbarui!
            </p>
          </div>
        )}
      </div>
    );
  }

  // iOS Safari flow (since iOS does not support beforeinstallprompt)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-sky-200 transition-all focus:outline-none"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Pasang di iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Instal di iPhone / iPad</h3>
                  <p className="text-[11px] text-slate-400">Ikuti langkah mudah di bawah ini</p>
                </div>
              </div>

              <div className="space-y-4 text-xs text-slate-300 bg-slate-950/40 p-4 rounded-xl border border-slate-950">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-slate-800 rounded-full font-bold text-[10px] text-sky-400">1</span>
                  <p className="leading-relaxed">
                    Ketuk tombol <strong>Bagikan (Share)</strong> <span className="inline-flex items-center justify-center bg-slate-800 p-1 rounded"><ArrowUpRight className="w-3 h-3 text-sky-300" /></span> di bilah navigasi bawah Safari.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-slate-800 rounded-full font-bold text-[10px] text-sky-400">2</span>
                  <p className="leading-relaxed">
                    Gulir ke bawah lalu ketuk pilihan <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-slate-800 rounded-full font-bold text-[10px] text-sky-400">3</span>
                  <p className="leading-relaxed">
                    Buka aplikasi dari layar utama HP Anda. Aplikasi akan terupdate otomatis saat ada pembaruan!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors"
              >
                Selesai
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback banner for generic desktop / unsupported browsers to show custom install instructions
  return (
    <div className="relative group">
      <button
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 transition-all focus:outline-none"
        title="Petunjuk Pasang Aplikasi"
      >
        <Smartphone className="w-3.5 h-3.5 text-slate-400" />
        <span>Instal Aplikasi</span>
      </button>
      
      <div className="absolute top-full mt-2 right-0 z-50 w-64 p-3 bg-slate-800 border border-slate-700 rounded-xl shadow-xl text-slate-200 text-[11px] leading-relaxed hidden group-hover:block">
        <span className="font-bold text-sky-400">Cara Instal Aplikasi:</span>
        <p className="mt-1">
          Buka situs ini melalui browser <strong>Chrome</strong> di Android atau <strong>Safari</strong> di iOS, lalu pilih opsi <strong>Instal Aplikasi</strong> atau <strong>Add to Home Screen</strong> untuk mendapatkan versi aplikasi HP!
        </p>
      </div>
    </div>
  );
};
