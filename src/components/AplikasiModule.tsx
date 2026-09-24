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
  Sparkles,
  Loader2,
  X,
  Link2
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
  onSaveLinks?: (newLinks: AplikasiLink[]) => void | Promise<any>;
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

export const defaultAplikasiLinks: AplikasiLink[] = [
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
  setAplikasiLinks,
  onSaveLinks
}) => {
  const [links, setLinks] = useState<AplikasiLink[]>(() => {
    if (Array.isArray(aplikasiLinks)) {
      return aplikasiLinks.map(l => ({ ...l, category: l.category || 'main' }));
    }
    const saved = localStorage.getItem('dapodik_aplikasi_links');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((l: any) => ({ ...l, category: l.category || 'main' }));
        }
      } catch (e) {
        // Fallback
      }
    }
    return [...defaultAplikasiLinks, ...defaultOtherAplikasiLinks];
  });

  // Watch for external updates (e.g., loaded from database on startup)
  React.useEffect(() => {
    if (Array.isArray(aplikasiLinks)) {
      setLinks(aplikasiLinks.map(l => ({ ...l, category: l.category || 'main' })));
    }
  }, [aplikasiLinks]);

  const [isSettingsMode, setIsSettingsMode] = useState(false);
  const [editLinks, setEditLinks] = useState<AplikasiLink[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalError, setModalError] = useState('');
  const [newShortcutForm, setNewShortcutForm] = useState<Partial<AplikasiLink>>({
    label: '',
    url: 'https://',
    icon: 'Laptop',
    color: 'from-indigo-500 to-indigo-600',
    category: 'main',
    desc: '',
    tag: ''
  });

  // Open Quick Add Modal
  const handleOpenAddModal = (cat: 'main' | 'other' = 'main') => {
    setNewShortcutForm({
      label: '',
      url: 'https://',
      icon: cat === 'other' ? 'Globe' : 'Laptop',
      color: cat === 'other' ? 'bg-sky-500/20 text-sky-300 border-sky-500/30 hover:bg-sky-500/30' : 'from-indigo-500 to-indigo-600',
      category: cat,
      desc: '',
      tag: cat === 'other' ? 'Umum' : ''
    });
    setModalError('');
    setShowAddModal(true);
  };

  // Submit Quick Add Modal (directly saves and syncs to Spreadsheet)
  const handleSaveQuickAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newShortcutForm.label || !newShortcutForm.label.trim()) {
      setModalError('Nama tautan / pintasan wajib diisi.');
      return;
    }
    let rawUrl = (newShortcutForm.url || '').trim();
    if (!rawUrl || rawUrl === 'https://' || rawUrl === 'http://') {
      setModalError('Alamat URL website wajib diisi.');
      return;
    }
    if (!/^https?:\/\//i.test(rawUrl)) {
      rawUrl = `https://${rawUrl}`;
    }

    setIsSaving(true);
    setModalError('');

    const newLink: AplikasiLink = {
      id: String(Date.now()),
      label: newShortcutForm.label.trim(),
      url: rawUrl,
      icon: newShortcutForm.icon || 'Laptop',
      color: newShortcutForm.color || 'from-indigo-500 to-indigo-600',
      category: newShortcutForm.category || 'main',
      desc: newShortcutForm.desc?.trim() || '',
      tag: newShortcutForm.tag?.trim() || ''
    };

    const updatedLinks = [...links, newLink];
    setLinks(updatedLinks);
    localStorage.setItem('dapodik_aplikasi_links', JSON.stringify(updatedLinks));
    if (setAplikasiLinks) {
      setAplikasiLinks(updatedLinks);
    }

    try {
      if (onSaveLinks) {
        await onSaveLinks(updatedLinks);
      } else {
        onSync();
      }
      setShowAddModal(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Error saving new shortcut to spreadsheet:', err);
    } finally {
      setIsSaving(false);
    }
  };

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

  // Add Link Shortcut in Settings Mode
  const handleAddLink = (category: 'main' | 'other' = 'main') => {
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
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setLinks(editLinks);
    localStorage.setItem('dapodik_aplikasi_links', JSON.stringify(editLinks));
    if (setAplikasiLinks) {
      setAplikasiLinks(editLinks);
    }

    try {
      if (onSaveLinks) {
        await onSaveLinks(editLinks);
      } else {
        onSync();
      }
      setIsSettingsMode(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Error saving shortcut links to spreadsheet:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to Default Link Config
  const handleResetToDefault = () => {
    if (window.confirm('Apakah Anda yakin ingin menyetel ulang semua tautan pintasan ke bawaan?')) {
      setEditLinks(JSON.parse(JSON.stringify(defaultAplikasiLinks)));
    }
  };

  const mainLinks = links;

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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenAddModal('main')}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                title="Tambah Pintasan Utama ke Spreadsheet"
              >
                <Plus className="w-4 h-4 stroke-[3px]" />
                <span>Tambah Pintasan Utama</span>
              </button>
              <button
                type="button"
                onClick={handleOpenSettings}
                className="px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-black border border-sky-200 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Settings className="w-4 h-4 animate-spin-slow" />
                <span>Pengaturan Link</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleOpenAddModal('main')}
                className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                <span className="hidden sm:inline">Tambah Pintasan</span>
              </button>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="p-2 sm:px-3 sm:py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Reset Bawaan"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset Bawaan</span>
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan ke Spreadsheet...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Link</span>
                  </>
                )}
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
                    <p className="text-xs text-slate-500 mt-1">Tambahkan tautan cepat Anda ke Google Spreadsheet melalui tombol di bawah.</p>
                    <button
                      type="button"
                      onClick={() => handleOpenAddModal('main')}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                      <span>Tambah Pintasan Sekarang</span>
                    </button>
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
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Konfigurasi Pintasan Tautan</h2>
              <p className="text-xs text-slate-500 mt-0.5">Ubah nama, URL tautan, deskripsi, tag, warna, atau ikon setiap aplikasi.</p>
            </div>

            {/* Category Header Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <div className="px-3 py-1.5 rounded-lg text-xs font-black bg-white text-sky-700 shadow-sm border border-slate-200/80 flex items-center gap-2">
                  <Laptop className="w-3.5 h-3.5 text-sky-600" />
                  <span>Pintasan Utama ({editLinks.length})</span>
                </div>
              </div>
            </div>

            {/* Settings Cards List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
              {editLinks
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

              {editLinks.length === 0 && (
                <div className="col-span-full py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-500 font-bold">Belum ada item pintasan.</p>
                  <button
                    type="button"
                    onClick={() => handleAddLink('main')}
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
                disabled={isSaving}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan ke Spreadsheet...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Seluruh Tautan</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QUICK ADD MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Tambah Pintasan Utama Dapodik
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Data otomatis tersimpan langsung ke Google Spreadsheet & aplikasi.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleSaveQuickAdd} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    Nama Tautan / Aplikasi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newShortcutForm.label || ''}
                    onChange={(e) => setNewShortcutForm(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="Contoh: Login Dapodik, Info GTK, SimPKB"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    Alamat URL Website <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={newShortcutForm.url || ''}
                      onChange={(e) => setNewShortcutForm(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://sp.datadik.kemdikbud.go.id"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                      Ikon Tautan
                    </label>
                    <select
                      value={newShortcutForm.icon || 'Laptop'}
                      onChange={(e) => setNewShortcutForm(prev => ({ ...prev, icon: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="Laptop">Laptop / Komputer</option>
                      <option value="Database">Database / Data</option>
                      <option value="School">Sekolah / Gedung</option>
                      <option value="Globe">Web Global</option>
                      <option value="Users">Pengguna / PD</option>
                      <option value="UserCheck">Verifikasi PTK</option>
                      <option value="FileText">Dokumen / Berkas</option>
                      <option value="Archive">Buku / Prefill</option>
                      <option value="Wallet">BOSP / Keuangan</option>
                      <option value="ShieldCheck">SDM / Keamanan</option>
                      <option value="Info">Informasi / Bantuan</option>
                      <option value="Box">Modul / Kotak</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                      Tema Warna Card
                    </label>
                    <select
                      value={newShortcutForm.color || 'from-indigo-500 to-indigo-600'}
                      onChange={(e) => setNewShortcutForm(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="from-indigo-500 to-indigo-600">Nila (Indigo)</option>
                      <option value="from-sky-500 to-blue-600">Biru Langit</option>
                      <option value="from-blue-600 to-indigo-700">Biru Tua</option>
                      <option value="from-teal-500 to-emerald-600">Hijau Zamrud</option>
                      <option value="from-pink-500 to-rose-600">Merah Rose</option>
                      <option value="from-orange-500 to-amber-600">Oranye Hangat</option>
                      <option value="from-indigo-600 to-purple-600">Ungu Gelap</option>
                      <option value="from-cyan-500 to-blue-600">Sian ke Biru</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white text-xs font-black rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyimpan ke Spreadsheet...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Simpan & Sinkron ke Spreadsheet</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
