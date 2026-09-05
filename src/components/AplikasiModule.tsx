import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PWAInstallButton } from './PWAInstallButton';
import { 
  Laptop, 
  Database, 
  Globe, 
  School, 
  Info, 
  Archive, 
  Users, 
  FileText, 
  UserCheck, 
  Wallet, 
  ShieldCheck, 
  Box, 
  Settings, 
  Save, 
  RotateCcw, 
  ExternalLink,
  ChevronLeft,
  Plus,
  Trash2,
  CheckCircle2
} from 'lucide-react';

interface AplikasiLink {
  id: string;
  label: string;
  url: string;
  icon: string;
  color: string;
}

interface AplikasiModuleProps {
  onBackToHome: () => void;
  onSync: () => void;
  isSyncing?: boolean;
  aplikasiLinks?: any[];
  setAplikasiLinks?: React.Dispatch<React.SetStateAction<any[]>>;
}

// Map string icon name to Lucide Icon component
const iconMap: Record<string, React.ComponentType<any>> = {
  Laptop,
  Database,
  Globe,
  School,
  Info,
  Archive,
  Users,
  FileText,
  UserCheck,
  Wallet,
  ShieldCheck,
  Box,
  Settings
};

const defaultAplikasiLinks: AplikasiLink[] = [
  { id: '1', label: 'Login Dapodik', url: 'https://sp.datadik.kemdikbud.go.id/', icon: 'Laptop', color: 'from-indigo-500 to-indigo-600' },
  { id: '2', label: 'PTK Datadik', url: 'https://ptk.datadik.kemdikbud.go.id/', icon: 'Database', color: 'from-pink-500 to-pink-600' },
  { id: '3', label: 'Area Member', url: 'https://daftarpemberi.kemdikbud.go.id/', icon: 'Globe', color: 'from-indigo-600 to-purple-600' },
  { id: '4', label: 'SP Datadik', url: 'https://sp.datadik.kemdikbud.go.id/', icon: 'School', color: 'from-blue-500 to-blue-600' },
  { id: '5', label: 'Info GTK', url: 'https://info.gtk.kemdikbud.go.id/', icon: 'Info', color: 'from-cyan-400 to-cyan-500' },
  { id: '6', label: 'Prefill 1', url: 'https://dapo.kemdikbud.go.id/unduh', icon: 'Archive', color: 'from-blue-600 to-blue-700' },
  { id: '7', label: 'Verval PD', url: 'https://vervalpd.data.kemdikbud.go.id/', icon: 'Users', color: 'from-pink-600 to-rose-600' },
  { id: '8', label: 'NISN', url: 'https://nisn.data.kemdikbud.go.id/', icon: 'FileText', color: 'from-orange-500 to-orange-600' },
  { id: '9', label: 'Prefill 2', url: 'https://dapo.kemdikbud.go.id/unduh', icon: 'Archive', color: 'from-blue-500 to-sky-600' },
  { id: '10', label: 'Verval PTK', url: 'https://vervalptk.data.kemdikbud.go.id/', icon: 'UserCheck', color: 'from-amber-500 to-amber-600' },
  { id: '11', label: 'BOSP Salur', url: 'https://bos.kemdikbud.go.id/', icon: 'Wallet', color: 'from-teal-500 to-emerald-600' },
  { id: '12', label: 'Login SDM', url: 'https://sdm.data.kemdikbud.go.id/', icon: 'ShieldCheck', color: 'from-cyan-500 to-blue-500' },
  { id: '13', label: 'Verval SP', url: 'https://vervalsp.data.kemdikbud.go.id/', icon: 'ShieldCheck', color: 'from-indigo-500 to-blue-600' },
  { id: '14', label: 'RSDM', url: 'https://sdm.data.kemdikbud.go.id/', icon: 'Box', color: 'from-orange-600 to-amber-700' },
  { id: '15', label: 'Web Dapodik', url: 'https://dapo.kemdikbud.go.id/', icon: 'Laptop', color: 'from-red-500 to-red-600' }
];

export const AplikasiModule: React.FC<AplikasiModuleProps> = ({
  onBackToHome,
  onSync,
  isSyncing = false,
  aplikasiLinks,
  setAplikasiLinks
}) => {
  const [links, setLinks] = useState<AplikasiLink[]>(() => {
    if (aplikasiLinks && aplikasiLinks.length > 0) {
      return aplikasiLinks;
    }
    const saved = localStorage.getItem('dapodik_aplikasi_links');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // Fallback
      }
    }
    return defaultAplikasiLinks;
  });

  // Watch for external updates (e.g., loaded from database on startup)
  React.useEffect(() => {
    if (aplikasiLinks && aplikasiLinks.length > 0) {
      setLinks(aplikasiLinks);
    }
  }, [aplikasiLinks]);

  const [isSettingsMode, setIsSettingsMode] = useState(false);
  const [editLinks, setEditLinks] = useState<AplikasiLink[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Enter Settings Mode and backup links
  const handleOpenSettings = () => {
    setEditLinks(JSON.parse(JSON.stringify(links))); // Deep copy
    setIsSettingsMode(true);
    setSaveSuccess(false);
  };

  // Handle Input Changes
  const handleInputChange = (id: string, field: 'label' | 'url' | 'icon' | 'color', value: string) => {
    setEditLinks(prev => prev.map(lnk => lnk.id === id ? { ...lnk, [field]: value } : lnk));
  };

  // Add Link Shortcut
  const handleAddLink = () => {
    const newId = String(Date.now());
    const newLink: AplikasiLink = {
      id: newId,
      label: 'Tautan Baru',
      url: 'https://',
      icon: 'Laptop',
      color: 'from-sky-500 to-blue-600'
    };
    setEditLinks(prev => [...prev, newLink]);
  };

  // Delete Link Shortcut
  const handleDeleteLink = (id: string) => {
    setEditLinks(prev => prev.filter(lnk => lnk.id !== id));
  };

  // Save Settings
  const handleSaveSettings = () => {
    setLinks(editLinks);
    localStorage.setItem('dapodik_aplikasi_links', JSON.stringify(editLinks));
    if (setAplikasiLinks) {
      setAplikasiLinks(editLinks);
    }
    
    // Auto sync logic
    setIsSettingsMode(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    
    // Instantly trigger sync
    setTimeout(() => {
      onSync();
    }, 500);
  };

  // Reset to Default Link Config
  const handleResetToDefault = () => {
    if (window.confirm('Apakah Anda yakin ingin menyetel ulang semua tautan pintasan ke bawaan Dapodik?')) {
      setEditLinks(JSON.parse(JSON.stringify(defaultAplikasiLinks)));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR */}
      <div className="sticky top-[57px] z-30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-md transition-all">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBackToHome}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all border border-slate-200/60"
            title="Kembali ke Beranda"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Laptop className="w-6 h-6 text-sky-600" />
              <span>Portal Pintasan Dapodik</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5 max-w-2xl leading-relaxed">
              Kumpulan tautan cepat ke berbagai layanan Data Pokok Pendidikan dan aplikasi terkait.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isSettingsMode ? (
            <button
              onClick={handleOpenSettings}
              className="px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-black border border-sky-200 shadow-sm transition-all flex items-center gap-2"
            >
              <Settings className="w-4 h-4 animate-spin-slow" />
              <span>Pengaturan Link</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleResetToDefault}
                className="p-2 sm:px-3 sm:py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-all flex items-center gap-1.5"
                title="Reset Bawaan"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset Bawaan</span>
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Link</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SAVE TOAST BANNER */}
      {saveSuccess && (
        <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold shadow-sm animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Pengaturan tautan berhasil disimpan ke lokal dan dikirim ke database cloud secara otomatis!</span>
        </div>
      )}

      {/* PWA / APK INSTALLATION HERO BANNER */}
      {!isSettingsMode && (
        <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 p-5 sm:p-6 rounded-3xl border border-sky-500/30 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-4 z-10">
            <img
              src="/logo_smpn11palu.jpg"
              alt="Logo 3D Dapodik SMPN 11 Palu"
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-lg shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <span className="inline-block text-[10px] uppercase font-black tracking-widest text-sky-300 bg-sky-500/20 px-2.5 py-0.5 rounded-full border border-sky-500/30 mb-1">
                Aplikasi HP Android & iOS
              </span>
              <h2 className="text-base sm:text-lg font-black text-white">Instal Dapodik SMPN 11 Palu di HP</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Gunakan sebagai aplikasi native HP tanpa perlu download file APK dari sumber tidak dikenal.
              </p>
            </div>
          </div>

          <div className="z-10 w-full sm:w-auto shrink-0 flex items-center justify-center">
            <PWAInstallButton variant="hero" />
          </div>
        </div>
      )}

      {/* VIEW PANEL */}
      <AnimatePresence mode="wait">
        {!isSettingsMode ? (
          <motion.div
            key="links-grid"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
          >
            {links.map((lnk) => {
              const IconComp = iconMap[lnk.icon] || Laptop;
              return (
                <a
                  key={lnk.id}
                  href={lnk.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative overflow-hidden p-4 rounded-2xl bg-gradient-to-r ${lnk.color} border border-white/30 shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg flex items-center justify-between text-white`}
                >
                  {/* Glass sheen reflection */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-white/20 opacity-60 pointer-events-none" />
                  
                  <div className="flex items-center gap-3.5 z-10">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner shrink-0 group-hover:rotate-6 transition-transform">
                      <IconComp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm tracking-wide text-white transition-colors">{lnk.label}</h3>
                      <p className="text-[10px] text-white/80 font-medium truncate max-w-[180px] mt-0.5">{lnk.url.replace(/^https?:\/\//i, '')}</p>
                    </div>
                  </div>

                  <div className="w-7 h-7 rounded-lg bg-white/15 group-hover:bg-white/25 flex items-center justify-center border border-white/20 opacity-80 group-hover:opacity-100 transition-all z-10 shrink-0">
                    <ExternalLink className="w-3.5 h-3.5 text-white" />
                  </div>
                </a>
              );
            })}

            {links.length === 0 && (
              <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border border-slate-200">
                <Laptop className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-sm font-black text-slate-700">Belum ada Tautan</h3>
                <p className="text-xs text-slate-500 mt-1">Tambahkan tautan cepat Anda melalui tombol Pengaturan Link di atas.</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="links-settings"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Konfigurasi Pintasan Tautan</h2>
                <p className="text-xs text-slate-500 mt-0.5">Ubah label, URL tautan, warna, atau ikon setiap pintasan.</p>
              </div>
              <button
                onClick={handleAddLink}
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                <span>Tambah Link</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
              {editLinks.map((lnk, idx) => {
                const IconComp = iconMap[lnk.icon] || Laptop;
                return (
                  <div 
                    key={lnk.id} 
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-3 relative group shadow-sm"
                  >
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-slate-400 font-mono">#{idx + 1}</span>
                      <button
                        onClick={() => handleDeleteLink(lnk.id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition-all opacity-60 group-hover:opacity-100"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex gap-3 items-start mt-2">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${lnk.color} flex items-center justify-center border border-white/40 shrink-0 shadow-md`}>
                        <IconComp className="w-5 h-5 text-white" />
                      </div>
                      
                      <div className="flex-1 space-y-2.5">
                        {/* Name Input */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">Nama Tautan</label>
                          <input
                            type="text"
                            value={lnk.label}
                            onChange={(e) => handleInputChange(lnk.id, 'label', e.target.value)}
                            className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-bold"
                            placeholder="Contoh: Login Dapodik"
                          />
                        </div>

                        {/* URL Input */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">Alamat URL</label>
                          <input
                            type="text"
                            value={lnk.url}
                            onChange={(e) => handleInputChange(lnk.id, 'url', e.target.value)}
                            className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
                            placeholder="https://..."
                          />
                        </div>

                        {/* Selector Theme Colors & Icons */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {/* Icon Selector */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">Ikon</label>
                            <select
                              value={lnk.icon}
                              onChange={(e) => handleInputChange(lnk.id, 'icon', e.target.value)}
                              className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-[11px] text-slate-800 font-bold focus:outline-none focus:border-sky-500"
                            >
                              <option value="Laptop">Laptop / Web</option>
                              <option value="Database">Database</option>
                              <option value="Globe">Web Global</option>
                              <option value="School">Sekolah</option>
                              <option value="Info">Informasi</option>
                              <option value="Archive">Prefill / Arsip</option>
                              <option value="Users">Siswa / Verval PD</option>
                              <option value="FileText">NISN / Surat</option>
                              <option value="UserCheck">Verifikasi PTK</option>
                              <option value="Wallet">Keuangan / BOSP</option>
                              <option value="ShieldCheck">SDM / Keamanan</option>
                              <option value="Box">Modul RSDM</option>
                            </select>
                          </div>

                          {/* Gradient Preset Selector */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">Gradasi Tema</label>
                            <select
                              value={lnk.color}
                              onChange={(e) => handleInputChange(lnk.id, 'color', e.target.value)}
                              className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-[11px] text-slate-800 font-bold focus:outline-none focus:border-sky-500"
                            >
                              <option value="from-indigo-500 to-indigo-600">Nila (Indigo)</option>
                              <option value="from-pink-500 to-pink-600">Pink (Merah Muda)</option>
                              <option value="from-indigo-600 to-purple-600">Ungu Gelap</option>
                              <option value="from-blue-500 to-blue-600">Biru Terang</option>
                              <option value="from-cyan-400 to-cyan-500">Sian (Cyan)</option>
                              <option value="from-blue-600 to-blue-700">Biru Tua</option>
                              <option value="from-pink-600 to-rose-600">Merah Rose</option>
                              <option value="from-orange-500 to-orange-600">Oranye Terang</option>
                              <option value="from-blue-500 to-sky-600">Biru Langit</option>
                              <option value="from-amber-500 to-amber-600">Kuning Amber</option>
                              <option value="from-teal-500 to-emerald-600">Hijau Zamrud</option>
                              <option value="from-cyan-500 to-blue-500">Sian ke Biru</option>
                              <option value="from-indigo-500 to-blue-600">Nila ke Biru</option>
                              <option value="from-orange-600 to-amber-700">Oranye Bumi</option>
                              <option value="from-red-500 to-red-600">Merah Berani</option>
                            </select>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setIsSettingsMode(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Seluruh Tautan</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
