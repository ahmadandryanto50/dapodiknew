import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { 
  Smartphone, 
  Download, 
  X, 
  CheckCircle2, 
  Share2, 
  MoreVertical, 
  ExternalLink, 
  Sparkles, 
  Info, 
  ArrowRight,
  ShieldCheck,
  Globe
} from 'lucide-react';

interface APKDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const APKDownloadModal: React.FC<APKDownloadModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'inapp'>('android');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownloadShortcut = () => {
    // Create an offline launcher HTML file that user can save to phone storage
    const launcherHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dapodik SMPN 11 Palu - Launcher</title>
  <link rel="manifest" href="${window.location.origin}/manifest.webmanifest">
  <meta name="theme-color" content="#0284c7">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 40px 20px; background: #0f172a; color: #f8fafc; }
    .card { background: #1e293b; padding: 30px; border-radius: 20px; max-width: 400px; margin: 0 auto; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #334155; }
    .btn { display: inline-block; background: linear-gradient(135deg, #0284c7, #2563eb); color: white; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: bold; margin-top: 20px; box-shadow: 0 4px 14px rgba(2,132,199,0.4); }
    img { width: 100px; height: 100px; border-radius: 20px; margin-bottom: 15px; box-shadow: 0 8px 16px rgba(0,0,0,0.3); }
  </style>
</head>
<body>
  <div class="card">
    <img src="${window.location.origin}/pwa-512x512.png" alt="Dapodik Logo">
    <h2>Dapodik SMPN 11 Palu</h2>
    <p>Aplikasi Data Pokok Pendidikan Terintegrasi</p>
    <a href="${window.location.href}" class="btn">Buka Aplikasi Utama</a>
  </div>
  <script>
    window.location.href = "${window.location.href}";
  </script>
</body>
</html>`;

    const blob = new Blob([launcherHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Dapodik_SMPN11_Palu_App.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        {/* Header with App Logo */}
        <div className="relative bg-gradient-to-r from-sky-900/60 via-indigo-900/40 to-slate-900 p-6 border-b border-slate-800 flex items-center gap-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-full transition-colors"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative group flex-shrink-0">
            <div className="absolute -inset-1 bg-gradient-to-r from-sky-400 to-amber-400 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <img
              src="/logo_smpn11palu.jpg"
              alt="Logo 3D Dapodik SMPN 11 Palu"
              className="relative w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-lg"
              referrerPolicy="no-referrer"
            />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 mb-1">
              <Sparkles className="w-3 h-3" /> Mobile PWA / WebAPK
            </div>
            <h2 className="text-lg font-extrabold text-white leading-tight">
              Instal Aplikasi Dapodik di HP
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              SMP Negeri 11 Palu • Versi Mobile Native
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {/* Status / Direct Install Banner */}
          {isInstalled ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-300">Aplikasi Sudah Terpasang di HP Ini!</p>
                <p className="text-[11px] text-emerald-200/80">
                  Anda sedang menjalankan Dapodik dalam mode aplikasi mandiri.
                </p>
              </div>
            </div>
          ) : isInstallable ? (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="space-y-0.5 text-center sm:text-left">
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  Instalasi Otomatis Didukung
                </span>
                <p className="text-sm font-extrabold">HP Anda Siap Memasang APK!</p>
              </div>
              <button
                onClick={async () => {
                  const res = await install();
                  if (res) onClose();
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-white text-sky-900 hover:bg-sky-50 font-extrabold text-xs rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4 text-sky-600" />
                <span>Instal Sekarang</span>
              </button>
            </div>
          ) : null}

          {/* Explanation Notice */}
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
            <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Kenapa tidak ada tombol download `.apk` biasa?</strong> Aplikasi ini menggunakan teknologi <strong>PWA (Progressive Web App)</strong> modern. PWA dipasang langsung melalui browser tanpa memerlukan download file APK yang berbahaya atau izin tambahan!
            </p>
          </div>

          {/* Quick Launcher File Download Option */}
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-amber-400" /> Option: Download File Shortcut HP
              </span>
              {downloadSuccess && (
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Berhasil Diunduh
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Unduh file launcher ringan yang dapat disimpan di folder Download HP Anda untuk akses instan kapan saja.
            </p>
            <button
              onClick={handleDownloadShortcut}
              className="w-full py-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-sky-300 font-bold text-xs border border-slate-600 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File Launcher (`Dapodik_App.html`)</span>
            </button>
          </div>

          {/* Interactive Step-by-Step Installation Guides */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Panduan Pasang di Layar Utama HP
              </h3>
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab('android')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    activeTab === 'android' 
                      ? 'bg-sky-500 text-white shadow-sm' 
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Android
                </button>
                <button
                  onClick={() => setActiveTab('ios')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    activeTab === 'ios' 
                      ? 'bg-sky-500 text-white shadow-sm' 
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  iPhone (iOS)
                </button>
                <button
                  onClick={() => setActiveTab('inapp')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    activeTab === 'inapp' 
                      ? 'bg-sky-500 text-white shadow-sm' 
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  In-App Browser
                </button>
              </div>
            </div>

            {/* TAB CONTENT: ANDROID */}
            {activeTab === 'android' && (
              <div className="space-y-2.5 text-xs text-slate-300 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-white">Buka Menu Chrome (Titik Tiga)</p>
                    <p className="text-[11px] text-slate-400">
                      Ketuk tombol menu titik tiga <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-800 rounded font-mono text-white"><MoreVertical className="w-3 h-3" /></span> di sudut kanan atas browser Chrome HP Anda.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-white">Pilih "Tambahkan ke Layar Utama" / "Install Aplikasi"</p>
                    <p className="text-[11px] text-slate-400">
                      Cari opsi bernamanya <strong>"Tambahkan ke Layar Utama"</strong> (Add to Home screen) atau <strong>"Install Aplikasi"</strong> (Install App).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-white">Konfirmasi & Selesai!</p>
                    <p className="text-[11px] text-slate-400">
                      Ketuk tombol <strong>"Install"</strong>. Logo 3D Dapodik SMPN 11 Palu akan langsung terpasang di layar menu HP Anda layaknya APK Play Store!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: IOS */}
            {activeTab === 'ios' && (
              <div className="space-y-2.5 text-xs text-slate-300 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-white">Ketuk Tombol Bagikan (Share)</p>
                    <p className="text-[11px] text-slate-400">
                      Di Safari iPhone/iPad, ketuk ikon <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-800 rounded text-sky-300"><Share2 className="w-3 h-3" /></span> di bagian bawah layar.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-white">Pilih "Tambah ke Layar Utama"</p>
                    <p className="text-[11px] text-slate-400">
                      Gulir menu ke bawah lalu pilih opsi <strong>"Tambahkan ke Layar Utama"</strong> (Add to Home Screen).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-white">Ketuk "Tambah" di Kanan Atas</p>
                    <p className="text-[11px] text-slate-400">
                      Aplikasi siap digunakan dari layar utama iPhone Anda secara offline & independen.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: IN-APP BROWSER */}
            {activeTab === 'inapp' && (
              <div className="space-y-2.5 text-xs text-slate-300 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <p className="text-[11px] text-amber-300/90 font-medium">
                  Jika Anda membuka tautan ini dari dalam WhatsApp, Facebook, Instagram, atau TikTok:
                </p>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    !
                  </div>
                  <div>
                    <p className="font-semibold text-white">Buka di Browser Asli (Chrome / Safari)</p>
                    <p className="text-[11px] text-slate-400">
                      Ketuk titik tiga di pojok kanan atas layar internal aplikasi sosial media Anda, lalu pilih <strong>"Buka di Browser / Open in Chrome"</strong>. Setelah terbuka di Chrome/Safari, Anda bisa langsung menginstall aplikasi!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Aman, Bebas Virus, Terverifikasi SSL</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
