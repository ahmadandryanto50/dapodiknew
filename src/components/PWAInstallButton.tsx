import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, Sparkles } from 'lucide-react';
import { APKDownloadModal } from './APKDownloadModal';

interface PWAInstallButtonProps {
  variant?: 'header' | 'hero' | 'floating' | 'compact';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header', className = '' }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // If already installed in standalone mode, still allow opening modal if clicked, or render subtle badge
  if (isInstalled && variant !== 'floating') {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 transition-all ${className}`}
          title="Aplikasi Dapodik Terpasang"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>Aplikasi Terpasang</span>
        </button>
        <APKDownloadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  const handleClick = async () => {
    if (isInstallable) {
      const res = await install();
      if (!res) {
        setIsModalOpen(true);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  if (variant === 'hero') {
    return (
      <>
        <button
          onClick={handleClick}
          className={`relative group inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-extrabold text-xs sm:text-sm text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600 hover:from-emerald-400 hover:to-sky-500 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all duration-200 border border-emerald-400/30 ${className}`}
        >
          <div className="p-1 bg-white/20 rounded-lg">
            <Download className="w-4 h-4 text-white animate-bounce" />
          </div>
          <span>Download & Instal APK HP</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 text-white">
            PWA
          </span>
        </button>

        <APKDownloadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  if (variant === 'floating') {
    if (isInstalled) return null;
    return (
      <>
        <div className="fixed bottom-20 left-4 right-4 z-[90] md:hidden animate-slideUp">
          <div className="p-3 bg-slate-900/95 border border-sky-500/40 rounded-2xl shadow-2xl backdrop-blur-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo_smpn11palu.jpg"
                alt="Logo Dapodik"
                className="w-10 h-10 rounded-xl object-cover border border-sky-400/30 flex-shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-extrabold text-white truncate">Instal Aplikasi Dapodik</p>
                <p className="text-[10px] text-sky-300 truncate">Pasang di HP tanpa Play Store</p>
              </div>
            </div>

            <button
              onClick={handleClick}
              className="flex-shrink-0 px-3.5 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instal APK</span>
            </button>
          </div>
        </div>

        <APKDownloadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  // Header default variant
  return (
    <>
      <button
        onClick={handleClick}
        className={`relative shrink-0 flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold text-white bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-sm shadow-sky-500/20 active:scale-95 transition-all border border-sky-400/30 whitespace-nowrap cursor-pointer ${className}`}
        title="Download & Instal Aplikasi di HP (APK)"
      >
        <div className="relative shrink-0 flex items-center justify-center">
          <Download className="w-3.5 h-3.5 text-sky-100" />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />
        </div>
        <span className="hidden sm:inline">Instal APK HP</span>
        <span className="sm:hidden">Instal APK</span>
      </button>

      <APKDownloadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
