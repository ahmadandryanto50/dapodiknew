import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export interface AplikasiLink {
  id: string;
  label: string;
  url: string;
  icon: string;
  color: string;
  category?: 'main' | 'other';
  desc?: string;
  tag?: string;
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
  { id: '1', label: 'Login Dapodik', url: 'https://sp.datadik.kemdikbud.go.id/', icon: 'Laptop', color: 'from-indigo-500 to-indigo-600', category: 'main' },
  { id: '2', label: 'PTK Datadik', url: 'https://ptk.datadik.kemdikbud.go.id/', icon: 'Database', color: 'from-pink-500 to-pink-600', category: 'main' },
  { id: '3', label: 'Area Member', url: 'https://daftarpemberi.kemdikbud.go.id/', icon: 'Globe', color: 'from-indigo-600 to-purple-600', category: 'main' },
  { id: '4', label: 'SP Datadik', url: 'https://sp.datadik.kemdikbud.go.id/', icon: 'School', color: 'from-blue-500 to-blue-600', category: 'main' },
  { id: '5', label: 'Info GTK', url: 'https://info.gtk.kemdikbud.go.id/', icon: 'Info', color: 'from-cyan-400 to-cyan-500', category: 'main' },
  { id: '6', label: 'Prefill 1', url: 'https://dapo.kemdikbud.go.id/unduh', icon: 'Archive', color: 'from-blue-600 to-blue-700', category: 'main' },
  { id: '7', label: 'Verval PD', url: 'https://vervalpd.data.kemdikbud.go.id/', icon: 'Users', color: 'from-pink-600 to-rose-600', category: 'main' },
  { id: '8', label: 'NISN', url: 'https://nisn.data.kemdikbud.go.id/', icon: 'FileText', color: 'from-orange-500 to-orange-600', category: 'main' },
  { id: '9', label: 'Prefill 2', url: 'https://dapo.kemdikbud.go.id/unduh', icon: 'Archive', color: 'from-blue-500 to-sky-600', category: 'main' },
  { id: '10', label: 'Verval PTK', url: 'https://vervalptk.data.kemdikbud.go.id/', icon: 'UserCheck', color: 'from-amber-500 to-amber-600', category: 'main' },
  { id: '11', label: 'BOSP Salur', url: 'https://bos.kemdikbud.go.id/', icon: 'Wallet', color: 'from-teal-500 to-emerald-600', category: 'main' },
  { id: '12', label: 'Login SDM', url: 'https://sdm.data.kemdikbud.go.id/', icon: 'ShieldCheck', color: 'from-cyan-500 to-blue-500', category: 'main' },
  { id: '13', label: 'Verval SP', url: 'https://vervalsp.data.kemdikbud.go.id/', icon: 'ShieldCheck', color: 'from-indigo-500 to-blue-600', category: 'main' },
  { id: '14', label: 'RSDM', url: 'https://sdm.data.kemdikbud.go.id/', icon: 'Box', color: 'from-orange-600 to-amber-700', category: 'main' },
  { id: '15', label: 'Web Dapodik', url: 'https://dapo.kemdikbud.go.id/', icon: 'Laptop', color: 'from-red-500 to-red-600', category: 'main' }
];

export const defaultOtherAplikasiLinks: AplikasiLink[] = [
  {
    id: 'other-1',
    label: 'Rapor Pendidikan',
    desc: 'Evaluasi Mutu & Satuan Pendidikan',
    url: 'https://raporpendidikan.kemdikbud.go.id/',
    tag: 'Evaluasi',
    icon: 'FileText',
    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30',
    category: 'other'
  },
  {
    id: 'other-2',
    label: 'Merdeka Mengajar (PMM)',
    desc: 'Platform Perangkat Ajar & Guru',
    url: 'https://guru.kemdikbud.go.id/',
    tag: 'Pelatihan',
    icon: 'School',
    color: 'bg-sky-500/20 text-sky-300 border-sky-500/30 hover:bg-sky-500/30',
    category: 'other'
  },
  {
    id: 'other-3',
    label: 'Canva Pendidikan',
    desc: 'Desain Grafis Media Pembelajaran',
    url: 'https://www.canva.com/education/',
    tag: 'Kreatif',
    icon: 'Laptop',
    color: 'bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30',
    category: 'other'
  },
  {
    id: 'other-4',
    label: 'Sistem Perbukuan (SIBI)',
    desc: 'Katalog Buku Teks & Kurikulum',
    url: 'https://buku.kemdikbud.go.id/',
    tag: 'Buku Ajar',
    icon: 'Archive',
    color: 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30',
    category: 'other'
  }
];

export const AplikasiModule: React.FC<AplikasiModuleProps> = ({
  onBackToHome,
  onSync,
  isSyncing = false,
  aplikasiLinks,
  setAplikasiLinks
}) => {
  const [links, setLinks] = useState<AplikasiLink[]>(() => {
    let list: AplikasiLink[] = [];
    if (aplikasiLinks && aplikasiLinks.length > 0) {
      list = aplikasiLinks;
    } else {
      const saved = localStorage.getItem('dapodik_aplikasi_links');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            list = parsed;
          }
        } catch (e) {
          // Fallback
        }
      }
    }

    if (list.length === 0) {
      return [...defaultAplikasiLinks, ...defaultOtherAplikasiLinks];
    }
    const filteredList = list.filter(l => l.category !== ('embedded' as any));
    const hasOther = filteredList.some(l => l.category === 'other');
    if (!hasOther) {
      return [...filteredList, ...defaultOtherAplikasiLinks];
    }
    return filteredList;
  });

  // Watch for external updates (e.g., loaded from database on startup)
  React.useEffect(() => {
    if (aplikasiLinks && aplikasiLinks.length > 0) {
      const cleanList = aplikasiLinks.filter(l => l.category !== ('embedded' as any));
      const hasOther = cleanList.some(l => l.category === 'other');
      if (!hasOther) {
        setLinks([...cleanList, ...defaultOtherAplikasiLinks]);
      } else {
        setLinks(cleanList);
      }
    }
  }, [aplikasiLinks]);

  const [isSettingsMode, setIsSettingsMode] = useState(false);
  const [settingsCategoryTab, setSettingsCategoryTab] = useState<'main' | 'other'>('main');
  const [editLinks, setEditLinks] = useState<AplikasiLink[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Enter Settings Mode and backup links
  const handleOpenSettings = () => {
    setEditLinks(JSON.parse(JSON.stringify(links))); // Deep copy
    setIsSettingsMode(true);
    setSaveSuccess(false);
  };

  // Handle Input Changes
  const handleInputChange = (id: string, field: keyof AplikasiLink, value: string) => {
    setEditLinks(prev => prev.map(lnk => lnk.id === id ? { ...lnk, [field]: value } : lnk));
  };

  // Add Link Shortcut
  const handleAddLink = (category: 'main' | 'other' = settingsCategoryTab) => {
    const newId = String(Date.now());
    if (category === 'other') {
      const newLink: AplikasiLink = {
        id: newId,
        label: 'Aplikasi Baru',
        desc: 'Deskripsi singkat layanan',
        url: 'https://',
        tag: 'Umum',
        icon: 'Globe',
        color: 'bg-sky-500/20 text-sky-300 border-sky-500/30 hover:bg-sky-500/30',
        category: 'other'
      };
      setEditLinks(prev => [...prev, newLink]);
    } else {
      const newLink: AplikasiLink = {
        id: newId,
        label: 'Tautan Baru',
        url: 'https://',
        icon: 'Laptop',
        color: 'from-sky-500 to-blue-600',
        category: 'main'
      };
      setEditLinks(prev => [...prev, newLink]);
    }
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
    if (window.confirm('Apakah Anda yakin ingin menyetel ulang semua tautan pintasan ke bawaan?')) {
      setEditLinks(JSON.parse(JSON.stringify([...defaultAplikasiLinks, ...defaultOtherAplikasiLinks])));
    }
  };

  const mainLinks = links.filter(l => l.category !== 'other');
  const otherLinks = links.filter(l => l.category === 'other');

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

      {/* MAIN VIEW / SETTINGS VIEW */}
      <AnimatePresence mode="wait">
        {!isSettingsMode ? (
          <motion.div
            key="portal-main-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* SECTION PINTASAN UTAMA DAPODIK */}
            <div>
              <div className="mb-3 px-1">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-sky-600" />
                  <span>Pintasan Utama Dapodik</span>
                </h2>
                <p className="text-xs sm:text-sm font-bold text-slate-800 mt-1">
                  Tautan resmi layanan pokok Dapodik, Verval, dan sistem SDM.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {mainLinks.map((lnk) => {
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

                {mainLinks.length === 0 && (
                  <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border border-slate-200">
                    <Laptop className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <h3 className="text-sm font-black text-slate-700">Belum ada Tautan Utama</h3>
                    <p className="text-xs text-slate-500 mt-1">Tambahkan tautan cepat Anda melalui tombol Pengaturan Link di atas.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          /* SETTINGS CONFIGURATION MODE */
          <motion.div
            key="links-settings"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Konfigurasi Pintasan Tautan</h2>
                <p className="text-xs text-slate-500 mt-0.5">Ubah nama, URL tautan, deskripsi, tag, warna, atau ikon setiap aplikasi.</p>
              </div>
              <button
                type="button"
                onClick={() => handleAddLink('main')}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm shrink-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                <span>Tambah Pintasan Utama</span>
              </button>
            </div>

            {/* Category Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold flex items-center gap-2">
                <Laptop className="w-4 h-4 text-sky-600" />
                <span>Daftar Pintasan Utama Dapodik ({editLinks.filter(l => l.category !== 'other').length})</span>
              </div>
            </div>

            {/* Settings Cards List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
              {editLinks
                .filter(lnk => lnk.category !== 'other')
                .map((lnk, idx) => {
                  const IconComp = iconMap[lnk.icon] || Laptop;
                  const isOther = lnk.category === 'other';

                  return (
                    <div 
                      key={lnk.id} 
                      className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-3 relative group shadow-sm"
                    >
                      <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                        <span className="text-[10px] font-black text-slate-400 font-mono">#{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteLink(lnk.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition-all opacity-60 group-hover:opacity-100"
                          title="Hapus Tautan Ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex gap-3 items-start mt-2">
                        <div className={`w-10 h-10 rounded-xl ${isOther ? 'bg-slate-900' : `bg-gradient-to-r ${lnk.color}`} flex items-center justify-center border border-white/40 shrink-0 shadow-md`}>
                          <IconComp className="w-5 h-5 text-amber-300" />
                        </div>
                        
                        <div className="flex-1 space-y-2.5">
                          {/* Name Input */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                              {isOther ? 'Nama Aplikasi' : 'Nama Tautan'}
                            </label>
                            <input
                              type="text"
                              value={lnk.label}
                              onChange={(e) => handleInputChange(lnk.id, 'label', e.target.value)}
                              className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-bold"
                              placeholder={isOther ? "Contoh: Rapor Pendidikan" : "Contoh: Login Dapodik"}
                            />
                          </div>

                          {/* Description Input for Other Apps */}
                          {isOther && (
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">Deskripsi Singkat</label>
                              <input
                                type="text"
                                value={lnk.desc || ''}
                                onChange={(e) => handleInputChange(lnk.id, 'desc', e.target.value)}
                                className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                placeholder="Contoh: Evaluasi Mutu & Satuan Pendidikan"
                              />
                            </div>
                          )}

                          {/* Tag Input for Other Apps */}
                          {isOther && (
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">Label Tag / Kategori</label>
                              <input
                                type="text"
                                value={lnk.tag || ''}
                                onChange={(e) => handleInputChange(lnk.id, 'tag', e.target.value)}
                                className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-semibold"
                                placeholder="Contoh: Evaluasi / Pelatihan / Buku Ajar"
                              />
                            </div>
                          )}

                          {/* URL Input */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">Alamat URL Tautan</label>
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
                                <option value="FileText">Dokumen / FileText</option>
                                <option value="School">Sekolah / School</option>
                                <option value="Laptop">Laptop / Web</option>
                                <option value="Archive">Buku / Archive</option>
                                <option value="Globe">Web Global / Globe</option>
                                <option value="Database">Database</option>
                                <option value="Info">Informasi</option>
                                <option value="Users">Pengguna / Users</option>
                                <option value="UserCheck">Verifikasi PTK</option>
                                <option value="Wallet">Keuangan / BOSP</option>
                                <option value="ShieldCheck">SDM / Keamanan</option>
                                <option value="Box">Modul / Box</option>
                              </select>
                            </div>

                            {/* Preset Color Selector */}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">Warna Tema</label>
                              <select
                                value={lnk.color}
                                onChange={(e) => handleInputChange(lnk.id, 'color', e.target.value)}
                                className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-[11px] text-slate-800 font-bold focus:outline-none focus:border-sky-500"
                              >
                                {isOther ? (
                                  <>
                                    <option value="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30">Hijau Zamrud (Evaluasi)</option>
                                    <option value="bg-sky-500/20 text-sky-300 border-sky-500/30 hover:bg-sky-500/30">Biru Langit (Pelatihan)</option>
                                    <option value="bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30">Ungu Kreatif (Canva)</option>
                                    <option value="bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30">Kuning Amber (Buku Ajar)</option>
                                    <option value="bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30">Merah Rose (Spesial)</option>
                                    <option value="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30">Nila Indigo (Sistem)</option>
                                  </>
                                ) : (
                                  <>
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
                                  </>
                                )}
                              </select>
                            </div>
                          </div>

                        </div>
                      </div>

                    </div>
                  );
                })}

              {editLinks.filter(lnk => settingsCategoryTab === 'other' ? lnk.category === 'other' : lnk.category !== 'other').length === 0 && (
                <div className="col-span-full py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-500 font-bold">Belum ada item di kategori ini.</p>
                  <button
                    type="button"
                    onClick={() => handleAddLink(settingsCategoryTab)}
                    className="mt-2 text-xs text-sky-600 hover:text-sky-700 font-black underline"
                  >
                    + Tambah Sekarang
                  </button>
                </div>
              )}
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
