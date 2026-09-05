import React, { useState, useEffect } from 'react';
import { formatDateIndonesian } from '../utils/dateUtils';
import { compressImage } from '../utils/imageCompressor';
import { getNormalizedMisi } from '../utils/misiUtils';
import { SafeImage } from './SafeImage';
import { 
  Settings, 
  ArrowLeft, 
  School, 
  Landmark,
  Star,
  Database, 
  Github, 
  Globe, 
  Save, 
  CheckCircle2, 
  Type, 
  LayoutTemplate, 
  RefreshCw, 
  Server, 
  Sparkles, 
  RotateCcw,
  GraduationCap,
  Award,
  BookOpen,
  ShieldCheck,
  Image as ImageIcon,
  Upload,
  User,
  ExternalLink,
  Layers,
  Key,
  Lock,
  Plus,
  Trash2,
  Edit2,
  LogOut,
  UserCheck,
  Shield,
  UserPlus,
  MapPin,
  Phone,
  Mail,
  Zap,
  Wifi,
  FileText,
  Building2,
  Eye,
  EyeOff
} from 'lucide-react';
import { SyncConfig, AppDisplayConfig, SchoolProfile, AdminUser } from '../types';

interface SettingsModuleProps {
  syncConfig: SyncConfig;
  displayConfig: AppDisplayConfig;
  schoolProfile: SchoolProfile;
  onSaveDisplayConfig: (newConfig: AppDisplayConfig) => void;
  onSaveSchoolProfile: (newProfile: SchoolProfile) => void;
  onSaveSettings?: (newConfig: AppDisplayConfig, newProfile: SchoolProfile) => void;
  onOpenSheets: () => void;
  onBackToHome: () => void;
  initialComponentFilter?: 'all' | '1' | '2' | '3' | '4' | '5';
  administrators?: AdminUser[];
  onSaveAdministrators?: (admins: AdminUser[]) => void;
  currentUser?: AdminUser | null;
  onLogout?: () => void;
  isSyncing?: boolean;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  syncConfig,
  displayConfig,
  schoolProfile,
  onSaveDisplayConfig,
  onSaveSchoolProfile,
  onSaveSettings,
  onOpenSheets,
  onBackToHome,
  initialComponentFilter = 'all',
  administrators = [],
  onSaveAdministrators,
  currentUser,
  onLogout,
  isSyncing = false
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'display' | 'admins' | 'school' | 'sync'>('display');
  const [activeComponentFilter, setActiveComponentFilter] = useState<'all' | '1' | '2' | '3' | '4' | '5'>(initialComponentFilter);

  // Admin management states
  const [adminList, setAdminList] = useState<AdminUser[]>(administrators);

  useEffect(() => {
    if (Array.isArray(administrators)) {
      setAdminList(administrators);
    }
  }, [administrators]);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [adminFormData, setAdminFormData] = useState<Partial<AdminUser>>({
    username: '',
    password: '',
    nama: '',
    role: 'Operator',
    email: '',
    noHp: '',
    status: 'Aktif'
  });

  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // Form states initialized from props
  const [formData, setFormData] = useState<AppDisplayConfig>({
    appName: displayConfig.appName ?? 'DAPODIK',
    appVersion: displayConfig.appVersion ?? '2026.b',
    appSubtitle: displayConfig.appSubtitle ?? '',
    logoCustomUrl: displayConfig.logoCustomUrl ?? '',
    welcomeGreeting: displayConfig.welcomeGreeting ?? 'SELAMAT DATANG',
    welcomeTitle: displayConfig.welcomeTitle ?? 'DI DAPODIK',
    welcomeSubtitle: displayConfig.welcomeSubtitle ?? 'DATA POKOK PENDIDIKAN',
    welcomeIconType: displayConfig.welcomeIconType ?? 'school',
    welcomeCustomIconUrl: displayConfig.welcomeCustomIconUrl ?? '',
    curriculumBadge: displayConfig.curriculumBadge ?? 'Kurikulum Merdeka Ready',
    curriculumBadgeIcon: displayConfig.curriculumBadgeIcon ?? 'check',
    footerVersionText: displayConfig.footerVersionText ?? 'Dapodik Cloud 2026.a (Next.js & Vercel Ready)',
    operatorTitle: displayConfig.operatorTitle ?? 'Operator Sekolah',
    operatorName: displayConfig.operatorName ?? schoolProfile.namaSekolah ?? 'SMP NEGERI 11 PALU',
    operatorAvatarUrl: displayConfig.operatorAvatarUrl ?? ''
  });

  const [schoolData, setSchoolData] = useState<SchoolProfile>({ ...schoolProfile });
  const [schoolSectionTab, setSchoolSectionTab] = useState<'identitas' | 'lokasi' | 'pimpinan' | 'visimisi' | 'rekap'>('identitas');
  const [newMisiInput, setNewMisiInput] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Sync state when props change
  useEffect(() => {
    setFormData({
      appName: displayConfig.appName ?? 'DAPODIK',
      appVersion: displayConfig.appVersion ?? '2026.b',
      appSubtitle: displayConfig.appSubtitle ?? '',
      logoCustomUrl: displayConfig.logoCustomUrl ?? '',
      welcomeGreeting: displayConfig.welcomeGreeting ?? 'SELAMAT DATANG',
      welcomeTitle: displayConfig.welcomeTitle ?? 'DI DAPODIK',
      welcomeSubtitle: displayConfig.welcomeSubtitle ?? 'DATA POKOK PENDIDIKAN',
      welcomeIconType: displayConfig.welcomeIconType ?? 'school',
      welcomeCustomIconUrl: displayConfig.welcomeCustomIconUrl ?? '',
      curriculumBadge: displayConfig.curriculumBadge ?? 'Kurikulum Merdeka Ready',
      curriculumBadgeIcon: displayConfig.curriculumBadgeIcon ?? 'check',
      footerVersionText: displayConfig.footerVersionText ?? 'Dapodik Cloud 2026.a (Next.js & Vercel Ready)',
      operatorTitle: displayConfig.operatorTitle ?? 'Operator Sekolah',
      operatorName: displayConfig.operatorName ?? schoolProfile.namaSekolah ?? 'SMP NEGERI 11 PALU',
      operatorAvatarUrl: displayConfig.operatorAvatarUrl ?? ''
    });
  }, [displayConfig, schoolProfile.namaSekolah]);

  useEffect(() => {
    setSchoolData({ ...schoolProfile });
  }, [schoolProfile]);

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedSchoolData = {
      ...schoolData,
      tmtMenjabat: schoolData.tmtMenjabat ? formatDateIndonesian(schoolData.tmtMenjabat) : '',
      tanggalSkPendirian: schoolData.tanggalSkPendirian ? formatDateIndonesian(schoolData.tanggalSkPendirian) : '',
      tanggalSkIzinOperasional: schoolData.tanggalSkIzinOperasional ? formatDateIndonesian(schoolData.tanggalSkIzinOperasional) : ''
    };
    if (onSaveSettings) {
      onSaveSettings(formData, cleanedSchoolData);
    } else {
      onSaveDisplayConfig(formData);
      onSaveSchoolProfile(cleanedSchoolData);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3500);
  };

  const handleResetDefaults = () => {
    const defaultConfig: AppDisplayConfig = {
        appName: 'DAPODIK',
        appVersion: '2026.b',
        appSubtitle: '',
        logoCustomUrl: '/logo_smpn11palu.jpg',
        welcomeGreeting: 'SELAMAT DATANG',
        welcomeTitle: 'DI DAPODIK',
        welcomeSubtitle: 'DATA POKOK PENDIDIKAN',
        welcomeIconType: 'school',
        welcomeCustomIconUrl: '',
        curriculumBadge: 'Kurikulum Merdeka Ready',
        curriculumBadgeIcon: 'check',
        footerVersionText: 'Dapodik Cloud 2026.a (Next.js & Vercel Ready)',
        operatorTitle: 'Operator Sekolah',
        operatorName: schoolProfile.namaSekolah || 'SMP NEGERI 11 PALU',
        operatorAvatarUrl: ''
      };
      setFormData(defaultConfig);
      onSaveDisplayConfig(defaultConfig);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
  };

  // Helper for image file upload -> Base64 with compression
  const handleFileUpload = async (field: 'logoCustomUrl' | 'welcomeCustomIconUrl' | 'operatorAvatarUrl', file: File | null) => {
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setFormData(prev => ({ ...prev, [field]: compressed }));
    } catch (e) {
      console.error('Failed to compress image, using fallback:', e);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setFormData(prev => ({ ...prev, [field]: e.target?.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="sticky top-[57px] z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/95 backdrop-blur-xl border border-slate-200/80 p-5 rounded-2xl shadow-md transition-all">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200/60"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Pengaturan & Kustomisasi 5 Komponen</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                NPSN: {schoolData.npsn}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Edit 5 komponen tampilan beranda (Logo Header, Banner Sambutan, Badge Kurikulum, Footer, & Kartu Operator) + Sinkronisasi Database
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSheets}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            <span>Koneksi Database Cloud</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('display')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'display'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
          }`}
        >
          <LayoutTemplate className="w-4 h-4" />
          <span>🎨 Edit 5 Komponen Gambar & Tampilan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('admins')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'admins'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>👥 Kelola Administrator</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('school')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'school'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
          }`}
        >
          <School className="w-4 h-4" />
          <span>Profil Satuan Pendidikan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('sync')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'sync'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Integrasi Database Cloud</span>
        </button>
      </div>

      {/* Main Content Area */}
      <form onSubmit={handleSaveAll}>
        {activeSubTab === 'display' && (
          <div className="space-y-4">
            
            {/* Quick Filter Pill Buttons to focus on specific component */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-2.5 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-600 font-semibold flex items-center gap-1.5 pl-1">
                <Layers className="w-3.5 h-3.5 text-sky-600" />
                Pilih Komponen:
              </span>
              <button
                type="button"
                onClick={() => setActiveComponentFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeComponentFilter === 'all' ? 'bg-sky-600 text-white font-bold shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                Semua (1 s/d 5)
              </button>
              <button
                type="button"
                onClick={() => setActiveComponentFilter('1')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeComponentFilter === '1' ? 'bg-sky-600 text-white font-bold shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                1. Logo & Brand
              </button>
              <button
                type="button"
                onClick={() => setActiveComponentFilter('2')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeComponentFilter === '2' ? 'bg-sky-600 text-white font-bold shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                2. Banner Sambutan
              </button>
              <button
                type="button"
                onClick={() => setActiveComponentFilter('3')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeComponentFilter === '3' ? 'bg-sky-600 text-white font-bold shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                3. Badge Kurikulum
              </button>
              <button
                type="button"
                onClick={() => setActiveComponentFilter('4')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeComponentFilter === '4' ? 'bg-sky-600 text-white font-bold shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                4. Teks Footer
              </button>
              <button
                type="button"
                onClick={() => setActiveComponentFilter('5')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeComponentFilter === '5' ? 'bg-sky-600 text-white font-bold shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                5. Kartu Operator
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Form Editing for 5 Components */}
              <div className="lg:col-span-7 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
                
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <LayoutTemplate className="w-4 h-4 text-sky-600" />
                    <span>Form Kustomisasi 5 Komponen Tampilan</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    className="text-xs text-slate-500 hover:text-amber-600 flex items-center gap-1 transition-colors"
                    title="Kembalikan ke Teks Bawaan"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Default</span>
                  </button>
                </div>

                {/* Section 1: Gambar 1 - Logo & Header Brand */}
                {(activeComponentFilter === 'all' || activeComponentFilter === '1') && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sky-700 flex items-center gap-1.5 uppercase tracking-wider">
                        <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[11px] font-mono font-bold">1</span>
                        Komponen 1: Header Brand & Logo Aplikasi
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">Pojok Kiri Atas</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-700 font-medium mb-1">Nama Aplikasi (Teks Utama)</label>
                        <input
                          type="text"
                          value={formData.appName}
                          onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                          placeholder="Contoh: DAPODIK"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold tracking-wide focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none shadow-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-medium mb-1">Label Versi (Badge Kuning)</label>
                        <input
                          type="text"
                          value={formData.appVersion}
                          onChange={(e) => setFormData({ ...formData, appVersion: e.target.value })}
                          placeholder="Contoh: 2026.b"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none shadow-xs"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-slate-700 font-medium mb-1">Sub-label Lembaga / Instansi</label>
                        <input
                          type="text"
                          value={formData.appSubtitle}
                          onChange={(e) => setFormData({ ...formData, appSubtitle: e.target.value })}
                          placeholder="Contoh: KEMENDIKBUDRISTEK"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 tracking-wider focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none shadow-xs"
                        />
                      </div>

                      {/* Custom Logo Image Option */}
                      <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                        <label className="block text-slate-700 font-medium mb-1 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                            Gambar Logo Kustom (Opsional)
                          </span>
                          {formData.logoCustomUrl && (
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, logoCustomUrl: '' })}
                              className="text-[10px] text-rose-600 hover:underline font-semibold"
                            >
                              Hapus Logo Kustom (Gunakan Logo Bawaan)
                            </button>
                          )}
                        </label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={formData.logoCustomUrl || ''}
                            onChange={(e) => setFormData({ ...formData, logoCustomUrl: e.target.value })}
                            placeholder="URL Gambar Logo (https://... atau upload file)"
                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none shadow-xs"
                          />
                          <label className="cursor-pointer px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-xs flex items-center gap-1.5 shrink-0 transition-colors border border-slate-200 font-medium">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload File</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload('logoCustomUrl', e.target.files?.[0] || null)}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 2: Gambar 2 - Welcome Banner Center Display */}
                {(activeComponentFilter === 'all' || activeComponentFilter === '2') && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sky-700 flex items-center gap-1.5 uppercase tracking-wider">
                        <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[11px] font-mono font-bold">2</span>
                        Komponen 2: Banner Sambutan (Center Display)
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">Tengah Beranda</span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-700 font-medium mb-1">Teks Sapaan Atas</label>
                        <input
                          type="text"
                          value={formData.welcomeGreeting}
                          onChange={(e) => setFormData({ ...formData, welcomeGreeting: e.target.value })}
                          placeholder="Contoh: SELAMAT DATANG"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold tracking-wider focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none shadow-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-700 font-medium mb-1">Judul Utama (Ukuran Besar)</label>
                          <input
                            type="text"
                            value={formData.welcomeTitle}
                            onChange={(e) => setFormData({ ...formData, welcomeTitle: e.target.value })}
                            placeholder="Contoh: DI DAPODIK"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-black tracking-wide focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none shadow-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-medium mb-1">Subjudul Utama Bawah</label>
                          <input
                            type="text"
                            value={formData.welcomeSubtitle}
                            onChange={(e) => setFormData({ ...formData, welcomeSubtitle: e.target.value })}
                            placeholder="Contoh: DATA POKOK PENDIDIKAN"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold tracking-wider focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none shadow-xs"
                          />
                        </div>
                      </div>

                      {/* Icon / Illustration type selector for Center Banner */}
                      <div className="pt-2 border-t border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-slate-700 font-medium">Pilihan Ikon/Ilustrasi Banner Tengah</label>
                          <span className="text-[11px] text-sky-700 font-semibold">Tersimpan ke Database</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, welcomeIconType: 'school', welcomeCustomIconUrl: '' })}
                            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-xs transition-all ${
                              (formData.welcomeIconType === 'school' || !formData.welcomeIconType) && !formData.welcomeCustomIconUrl
                                ? 'bg-sky-50 border-sky-500 text-sky-700 font-bold shadow-xs ring-1 ring-sky-500'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <School className="w-5 h-5 text-sky-600" />
                            <span>Gedung Sekolah</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, welcomeIconType: 'graduation', welcomeCustomIconUrl: '' })}
                            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-xs transition-all ${
                              formData.welcomeIconType === 'graduation' && !formData.welcomeCustomIconUrl
                                ? 'bg-sky-50 border-sky-500 text-sky-700 font-bold shadow-xs ring-1 ring-sky-500'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <GraduationCap className="w-5 h-5 text-amber-500" />
                            <span>Topi Toga</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, welcomeIconType: 'award', welcomeCustomIconUrl: '' })}
                            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-xs transition-all ${
                              formData.welcomeIconType === 'award' && !formData.welcomeCustomIconUrl
                                ? 'bg-sky-50 border-sky-500 text-sky-700 font-bold shadow-xs ring-1 ring-sky-500'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <Award className="w-5 h-5 text-emerald-600" />
                            <span>Piala Prestasi</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, welcomeIconType: 'book', welcomeCustomIconUrl: '' })}
                            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-xs transition-all ${
                              formData.welcomeIconType === 'book' && !formData.welcomeCustomIconUrl
                                ? 'bg-sky-50 border-sky-500 text-sky-700 font-bold shadow-xs ring-1 ring-sky-500'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <BookOpen className="w-5 h-5 text-sky-600" />
                            <span>Buku Belajar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, welcomeIconType: 'star', welcomeCustomIconUrl: '' })}
                            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-xs transition-all ${
                              formData.welcomeIconType === 'star' && !formData.welcomeCustomIconUrl
                                ? 'bg-sky-50 border-sky-500 text-sky-700 font-bold shadow-xs ring-1 ring-sky-500'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <Star className="w-5 h-5 text-amber-500" />
                            <span>Bintang Prestasi</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, welcomeIconType: 'shield', welcomeCustomIconUrl: '' })}
                            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-xs transition-all ${
                              formData.welcomeIconType === 'shield' && !formData.welcomeCustomIconUrl
                                ? 'bg-sky-50 border-sky-500 text-sky-700 font-bold shadow-xs ring-1 ring-sky-500'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <ShieldCheck className="w-5 h-5 text-sky-600" />
                            <span>Perisai Mutu</span>
                          </button>
                        </div>

                        {/* Or custom banner illustration image */}
                        <div className="pt-2 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-slate-500 text-[11px] font-medium">
                              <span>Atau gunakan Gambar Ilustrasi / Logo Kustom:</span>
                            </label>
                            <div className="flex items-center gap-2">
                              {(schoolProfile.logoSekolah || formData.logoCustomUrl) && (
                                <button
                                  type="button"
                                  onClick={() => setFormData({ ...formData, welcomeCustomIconUrl: schoolProfile.logoSekolah || formData.logoCustomUrl || '', welcomeIconType: 'custom' })}
                                  className="text-[10px] text-sky-600 hover:text-sky-700 underline font-semibold"
                                >
                                  Gunakan Logo Sekolah
                                </button>
                              )}
                              {formData.welcomeCustomIconUrl && (
                                <button
                                  type="button"
                                  onClick={() => setFormData({ ...formData, welcomeCustomIconUrl: '', welcomeIconType: 'school' })}
                                  className="text-[10px] text-rose-600 hover:underline font-semibold"
                                >
                                  Hapus Kustom
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={formData.welcomeCustomIconUrl || ''}
                              onChange={(e) => setFormData({ ...formData, welcomeCustomIconUrl: e.target.value })}
                              placeholder="URL Gambar Ilustrasi (https://... atau upload file)"
                              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none shadow-xs"
                            />
                            <label className="cursor-pointer px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-xs flex items-center gap-1.5 shrink-0 transition-colors border border-slate-200 font-medium">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload File</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload('welcomeCustomIconUrl', e.target.files?.[0] || null)}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 3: Gambar 3 - Badge Status Kurikulum */}
                {(activeComponentFilter === 'all' || activeComponentFilter === '3') && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 uppercase tracking-wider">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px] font-mono font-bold">3</span>
                        Komponen 3: Badge Status Fitur / Kurikulum
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">Pill Bawah Banner</span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-700 font-medium mb-1">Teks Badge Fitur / Kurikulum</label>
                        <input
                          type="text"
                          value={formData.curriculumBadge}
                          onChange={(e) => setFormData({ ...formData, curriculumBadge: e.target.value })}
                          placeholder="Contoh: Kurikulum Merdeka Ready"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none shadow-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-medium mb-1">Pilihan Ikon Badge</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, curriculumBadgeIcon: 'check' })}
                            className={`p-2 rounded-lg border flex items-center justify-center gap-1.5 text-xs transition-all ${
                              formData.curriculumBadgeIcon === 'check' || !formData.curriculumBadgeIcon
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold ring-1 ring-emerald-500 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Centang</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, curriculumBadgeIcon: 'sparkles' })}
                            className={`p-2 rounded-lg border flex items-center justify-center gap-1.5 text-xs transition-all ${
                              formData.curriculumBadgeIcon === 'sparkles'
                                ? 'bg-amber-50 border-amber-500 text-amber-700 font-bold ring-1 ring-amber-500 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span>Sparkles</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, curriculumBadgeIcon: 'award' })}
                            className={`p-2 rounded-lg border flex items-center justify-center gap-1.5 text-xs transition-all ${
                              formData.curriculumBadgeIcon === 'award'
                                ? 'bg-sky-50 border-sky-500 text-sky-700 font-bold ring-1 ring-sky-500 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <Award className="w-4 h-4 text-sky-600" />
                            <span>Piala</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, curriculumBadgeIcon: 'shield' })}
                            className={`p-2 rounded-lg border flex items-center justify-center gap-1.5 text-xs transition-all ${
                              formData.curriculumBadgeIcon === 'shield'
                                ? 'bg-sky-50 border-sky-500 text-sky-700 font-bold ring-1 ring-sky-500 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <ShieldCheck className="w-4 h-4 text-sky-600" />
                            <span>Perisai</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 4: Gambar 4 - Footer App Version */}
                {(activeComponentFilter === 'all' || activeComponentFilter === '4') && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5 uppercase tracking-wider">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[11px] font-mono font-bold">4</span>
                        Komponen 4: Teks Versi Aplikasi di Footer
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">Bilah Bawah</span>
                    </div>

                    <div className="text-xs">
                      <label className="block text-slate-700 font-medium mb-1">Teks Deskripsi Versi Footer</label>
                      <input
                        type="text"
                        value={formData.footerVersionText}
                        onChange={(e) => setFormData({ ...formData, footerVersionText: e.target.value })}
                        placeholder="Contoh: Dapodik Cloud 2026.a (Next.js & Vercel Ready)"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none shadow-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Section 5: Gambar 5 - Operator Card & Profil Singkat */}
                {(activeComponentFilter === 'all' || activeComponentFilter === '5') && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-orange-700 flex items-center gap-1.5 uppercase tracking-wider">
                        <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[11px] font-mono font-bold">5</span>
                        Komponen 5: Kartu Operator & Informasi Satuan Pendidikan
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">Kanan Bawah Beranda</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-700 font-medium mb-1">Jabatan / Peran Operator</label>
                        <input
                          type="text"
                          value={formData.operatorTitle || ''}
                          onChange={(e) => setFormData({ ...formData, operatorTitle: e.target.value })}
                          placeholder="Contoh: Operator Sekolah"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none shadow-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-medium mb-1">Nama Satuan Pendidikan / User</label>
                        <input
                          type="text"
                          value={formData.operatorName || ''}
                          onChange={(e) => setFormData({ ...formData, operatorName: e.target.value })}
                          placeholder="Contoh: SMP Negeri Unggulan 1"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none shadow-xs"
                        />
                      </div>

                      <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                        <label className="block text-slate-700 font-medium mb-1 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-amber-600" />
                            Foto / Avatar Operator Kustom
                          </span>
                          {formData.operatorAvatarUrl && (
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, operatorAvatarUrl: '' })}
                              className="text-[10px] text-rose-600 hover:underline font-semibold"
                            >
                              Hapus Avatar (Gunakan Inisial Bawaan)
                            </button>
                          )}
                        </label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={formData.operatorAvatarUrl || ''}
                            onChange={(e) => setFormData({ ...formData, operatorAvatarUrl: e.target.value })}
                            placeholder="URL Foto Avatar (https://... atau upload file)"
                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none shadow-xs"
                          />
                          <label className="cursor-pointer px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-xs flex items-center gap-1.5 shrink-0 transition-colors border border-slate-200 font-medium">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Foto</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload('operatorAvatarUrl', e.target.files?.[0] || null)}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  {isSyncing ? (
                    <span className="text-sky-600 text-xs font-semibold flex items-center gap-1.5 animate-pulse">
                      <span className="w-3.5 h-3.5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                      Menyimpan dan menyinkronkan 5 komponen langsung ke Database...
                    </span>
                  ) : isSaved ? (
                    <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1.5 animate-pulse">
                      <CheckCircle2 className="w-4 h-4" /> 5 Komponen tampilan berhasil disimpan & disinkronkan langsung ke Database!
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-sky-600" /> Menyimpan langsung ke database secara real-time.
                    </span>
                  )}

                  <button
                    type="submit"
                    disabled={isSyncing}
                    className={`px-6 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all ${
                      isSyncing
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                        : 'bg-sky-600 hover:bg-sky-700 active:scale-95'
                    }`}
                  >
                    {isSyncing ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{isSyncing ? 'Menyinkronkan...' : 'Simpan Semua Komponen'}</span>
                  </button>
                </div>

              </div>

              {/* Right Column: Live Interactive Preview of 5 Components */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Live Preview Hasil 5 Komponen</span>
                    </div>
                    <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 font-mono px-2 py-0.5 rounded-full font-bold">
                      Real-Time
                    </span>
                  </div>

                  {/* Preview Box mimicking the actual Dapodik Blue Hero */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0c4a6e] via-[#0284c7] to-[#0369a1] text-white shadow-lg space-y-4 border border-sky-400/30">
                    
                    {/* Live Header Logo Preview (Gambar 1) */}
                    <div className="flex items-center gap-3 pb-3 border-b border-white/15">
                      <div className="w-11 h-11 rounded-xl bg-white p-1.5 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
                        {formData.logoCustomUrl ? (
                          <SafeImage 
                            src={formData.logoCustomUrl} 
                            fallbackSrc="/logo_smpn11palu.jpg"
                            alt="Logo Preview" 
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full border-[3px] border-blue-600 border-t-amber-500 border-r-amber-500 flex items-center justify-center transform -rotate-45">
                            <div className="w-2 h-2 bg-amber-500 rounded-sm" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-base font-extrabold tracking-wider text-white">
                            {formData.appName || 'DAPODIK'}
                          </span>
                          <span className="text-[10px] bg-amber-400 text-slate-900 font-bold px-1.5 py-0.2 rounded-full">
                            {formData.appVersion || '2026.b'}
                          </span>
                        </div>
                        <p className="text-[10px] font-medium tracking-wide text-sky-100 uppercase">
                          {formData.appSubtitle || 'KEMENDIKBUDRISTEK'}
                        </p>
                      </div>
                    </div>

                    {/* Live Welcome Banner Center Preview (Gambar 2 & 3) */}
                    <div className="text-center space-y-2 py-3 bg-white/10 rounded-xl p-3 border border-white/15 backdrop-blur-md">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-white to-sky-100 p-2.5 shadow-lg flex items-center justify-center text-[#0284c7] overflow-hidden border border-white/60">
                        {formData.welcomeCustomIconUrl ? (
                          <SafeImage 
                            src={formData.welcomeCustomIconUrl} 
                            fallbackSrc="/logo_smpn11palu.jpg"
                            fallbackNode={
                              formData.welcomeIconType === 'graduation' ? <GraduationCap className="w-7 h-7" /> :
                              formData.welcomeIconType === 'award' ? <Award className="w-7 h-7" /> :
                              formData.welcomeIconType === 'book' ? <BookOpen className="w-7 h-7" /> :
                              formData.welcomeIconType === 'star' ? <Star className="w-7 h-7 text-amber-500" /> :
                              formData.welcomeIconType === 'shield' ? <ShieldCheck className="w-7 h-7 text-[#0284c7]" /> :
                              formData.welcomeIconType === 'landmark' ? <Landmark className="w-7 h-7 text-[#0284c7]" /> :
                              <School className="w-8 h-8 text-[#0284c7]" />
                            }
                            alt="Banner Icon" 
                            className="w-full h-full object-contain"
                          />
                        ) : formData.welcomeIconType === 'graduation' ? (
                          <GraduationCap className="w-7 h-7" />
                        ) : formData.welcomeIconType === 'award' ? (
                          <Award className="w-7 h-7" />
                        ) : formData.welcomeIconType === 'book' ? (
                          <BookOpen className="w-7 h-7" />
                        ) : formData.welcomeIconType === 'star' ? (
                          <Star className="w-7 h-7 text-amber-500" />
                        ) : formData.welcomeIconType === 'shield' ? (
                          <ShieldCheck className="w-7 h-7 text-[#0284c7]" />
                        ) : formData.welcomeIconType === 'landmark' ? (
                          <Landmark className="w-7 h-7 text-[#0284c7]" />
                        ) : (
                          <School className="w-8 h-8 text-[#0284c7]" />
                        )}
                      </div>
                      <div>
                        <div className="text-[11px] font-bold tracking-[0.2em] text-cyan-200 uppercase">
                          {formData.welcomeGreeting || 'SELAMAT DATANG'}
                        </div>
                        <div className="text-xl font-black tracking-tight text-white drop-shadow-sm">
                          {formData.welcomeTitle || 'DI DAPODIK'}
                        </div>
                        <div className="text-xs font-bold tracking-widest text-sky-100 uppercase">
                          {formData.welcomeSubtitle || 'DATA POKOK PENDIDIKAN'}
                        </div>
                      </div>

                      {/* Badge Preview (Gambar 3) */}
                      <div className="pt-2 flex justify-center">
                        <div className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full text-[10px] font-medium border border-white/20">
                          {formData.curriculumBadgeIcon === 'sparkles' ? (
                            <Sparkles className="w-3 h-3 text-amber-300" />
                          ) : formData.curriculumBadgeIcon === 'award' ? (
                            <Award className="w-3 h-3 text-cyan-300" />
                          ) : formData.curriculumBadgeIcon === 'shield' ? (
                            <ShieldCheck className="w-3 h-3 text-sky-300" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                          )}
                          <span>{formData.curriculumBadge || 'Kurikulum Merdeka Ready'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Live Operator Card Preview (Gambar 5) */}
                    <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-xs flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center font-bold text-slate-900 shadow-md overflow-hidden shrink-0">
                        {formData.operatorAvatarUrl ? (
                          <SafeImage 
                            src={formData.operatorAvatarUrl} 
                            fallbackNode={
                              <span className="text-[11px] font-black">
                                {(formData.operatorTitle || 'OP').replace(/[^a-zA-Z0-9]/g, '').substring(0, 2).toUpperCase() || 'OP'}
                              </span>
                            }
                            alt="Operator" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[11px] font-black">
                            {(formData.operatorTitle || 'OP').replace(/[^a-zA-Z0-9]/g, '').substring(0, 2).toUpperCase() || 'OP'}
                          </span>
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-bold text-white text-[11px] truncate">
                          {formData.operatorTitle || 'Operator Sekolah'}
                        </div>
                        <div className="text-[10px] text-sky-200 truncate">
                          {formData.operatorName || schoolData.namaSekolah || 'SMP NEGERI 11 PALU'}
                        </div>
                      </div>
                    </div>

                    {/* Live Footer Preview (Gambar 4) */}
                    <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[10px] text-sky-100/80">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <span className="truncate">Versi: <strong>{formData.footerVersionText || 'Dapodik Cloud 2026.a'}</strong></span>
                      </div>
                      <span className="shrink-0">NPSN: <strong>{schoolData.npsn}</strong></span>
                    </div>

                  </div>

                  <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs flex items-start gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Semua perubahan teks dan gambar pada kelima komponen langsung disinkronkan ke database saat disimpan.</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {activeSubTab === 'admins' && (
          <div className="space-y-4">
            {/* Header & Actions */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-sky-600" />
                    <span>Daftar Akun Administrator & Operator</span>
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                    Administrator
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Akun yang terdaftar di sini digunakan untuk login ke sistem Dapodik dan tersimpan langsung ke Database.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditingAdmin(null);
                    setAdminFormData({
                      username: '',
                      password: '',
                      nama: '',
                      role: 'Operator',
                      email: '',
                      noHp: '',
                      status: 'Aktif'
                    });
                    setIsAddAdminOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Tambah Akun Admin</span>
                </button>
              </div>
            </div>

            {/* Current Active User Status Card */}
            {currentUser && (
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-600 text-white font-black flex items-center justify-center text-sm shadow-sm">
                    {currentUser.nama.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs text-sky-700 font-bold flex items-center gap-2">
                      <span>Sedang Login Sebagai:</span>
                      <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold border border-sky-300">
                        {currentUser.role}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-900">{currentUser.nama} ({currentUser.username})</div>
                  </div>
                </div>

                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar (Logout)</span>
                  </button>
                )}
              </div>
            )}

            {/* Administrators Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">PENGGUNA / NAMA</th>
                      <th className="px-4 py-3">USERNAME</th>
                      <th className="px-4 py-3">KATA SANDI</th>
                      <th className="px-4 py-3">ROLE</th>
                      <th className="px-4 py-3">EMAIL & KONTAK</th>
                      <th className="px-4 py-3">STATUS</th>
                      <th className="px-4 py-3 text-right">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {adminList.map((admin) => (
                      <tr key={admin.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center font-bold text-sky-700">
                              {admin.nama ? admin.nama.substring(0, 1).toUpperCase() : 'A'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{admin.nama}</div>
                              <div className="text-[10px] text-slate-500">ID: {admin.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-sky-700 font-bold">
                          {admin.username}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <span>••••••••</span>
                            <span className="text-[10px] text-slate-500">
                              ({revealedPasswords[admin.id] ? admin.password : '••••••'})
                            </span>
                            <button
                              type="button"
                              onClick={() => setRevealedPasswords(prev => ({ ...prev, [admin.id]: !prev[admin.id] }))}
                              className="p-1 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
                              title={revealedPasswords[admin.id] ? "Sembunyikan Kata Sandi" : "Tampilkan Kata Sandi"}
                            >
                              {revealedPasswords[admin.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            admin.role === 'Administrator'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : admin.role === 'Operator'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : admin.role === 'Kepala Sekolah'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : admin.role === 'Guru'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : admin.role === 'Siswa'
                              ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            {admin.role}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="text-slate-800">{admin.email}</div>
                          {admin.noHp && <div className="text-[10px] text-slate-500">{admin.noHp}</div>}
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = adminList.map((a) =>
                                a.id === admin.id ? { ...a, status: (a.status === 'Aktif' ? 'Nonaktif' : 'Aktif') as 'Aktif' | 'Nonaktif' } : a
                              );
                              setAdminList(updated);
                              if (onSaveAdministrators) onSaveAdministrators(updated);
                            }}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                              admin.status === 'Aktif'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            {admin.status}
                          </button>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAdmin(admin);
                                setAdminFormData({ ...admin });
                                setIsAddAdminOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-sky-600 hover:text-white text-slate-700 transition-all border border-slate-200"
                              title="Edit Akun"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {adminList.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Apakah Anda yakin ingin menghapus akun "${admin.nama}" (${admin.username})? Data di aplikasi dan Database Cloud akan dihapus.`)) {
                                    const updated = adminList.filter((a) => a.id !== admin.id && a.username.toLowerCase() !== admin.username.toLowerCase());
                                    setAdminList(updated);

                                    try {
                                      const delStr = localStorage.getItem('dapodik_deleted_admins') || '[]';
                                      const delList: string[] = JSON.parse(delStr);
                                      if (!delList.includes(admin.username.toLowerCase())) {
                                        delList.push(admin.username.toLowerCase());
                                        localStorage.setItem('dapodik_deleted_admins', JSON.stringify(delList));
                                      }
                                    } catch (e) {
                                      console.error(e);
                                    }

                                    if (onSaveAdministrators) onSaveAdministrators(updated);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-700 transition-all border border-slate-200"
                                title="Hapus Akun"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Info */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>
                    Seluruh data akun ini disinkronkan ke tabel <strong>`Administrator`</strong> di Database.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onOpenSheets}
                  className="text-sky-600 hover:underline font-semibold flex items-center gap-1"
                >
                  <span>Lihat Kode Script</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Modal Add/Edit Admin */}
            {isAddAdminOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 text-xs text-slate-700 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Shield className="w-4 h-4 text-sky-600" />
                      <span>{editingAdmin ? 'Edit Akun Administrator' : 'Tambah Akun Baru'}</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddAdminOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 font-medium mb-1">Nama Lengkap & Gelar</label>
                      <input
                        type="text"
                        value={adminFormData.nama || ''}
                        onChange={(e) => setAdminFormData({ ...adminFormData, nama: e.target.value })}
                        placeholder="Contoh: Ahmad Andryanto, S.Pd."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none shadow-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-600 font-medium mb-1">Username Login</label>
                        <input
                          type="text"
                          value={adminFormData.username || ''}
                          onChange={(e) => setAdminFormData({ ...adminFormData, username: e.target.value.toLowerCase() })}
                          placeholder="username"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none shadow-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600 font-medium mb-1">Kata Sandi (Password)</label>
                        <input
                          type="text"
                          value={adminFormData.password || ''}
                          onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                          placeholder="Kata Sandi"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none shadow-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-600 font-medium mb-1">Peran (Role)</label>
                        <select
                          value={adminFormData.role || 'Operator'}
                          onChange={(e) => setAdminFormData({ ...adminFormData, role: e.target.value as any })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none shadow-xs"
                        >
                          <option value="Administrator">Administrator</option>
                          <option value="Operator">Operator</option>
                          <option value="Kepala Sekolah">Kepala Sekolah</option>
                          <option value="Guru">Guru</option>
                          <option value="Siswa">Siswa</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600 font-medium mb-1">Status</label>
                        <select
                          value={adminFormData.status || 'Aktif'}
                          onChange={(e) => setAdminFormData({ ...adminFormData, status: e.target.value as any })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none shadow-xs"
                        >
                          <option value="Aktif">Aktif</option>
                          <option value="Nonaktif">Nonaktif</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-600 font-medium mb-1">Email</label>
                      <input
                        type="email"
                        value={adminFormData.email || ''}
                        onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                        placeholder="admin@smp.belajar.id"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-600 font-medium mb-1">No. WhatsApp / HP (Opsional)</label>
                      <input
                        type="text"
                        value={adminFormData.noHp || ''}
                        onChange={(e) => setAdminFormData({ ...adminFormData, noHp: e.target.value })}
                        placeholder="0812xxxxxxxx"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddAdminOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!adminFormData.username || !adminFormData.password || !adminFormData.nama) {
                          alert('Nama, Username, dan Kata Sandi wajib diisi!');
                          return;
                        }

                        let updatedList: AdminUser[];
                        if (editingAdmin) {
                          updatedList = adminList.map((a) =>
                            a.id === editingAdmin.id ? ({ ...a, ...adminFormData } as AdminUser) : a
                          );
                        } else {
                          const newAdmin: AdminUser = {
                            id: `adm-${Date.now().toString().slice(-4)}`,
                            username: adminFormData.username.trim().toLowerCase(),
                            password: adminFormData.password,
                            nama: adminFormData.nama.trim(),
                            role: adminFormData.role as any || 'Operator',
                            email: adminFormData.email || '',
                            noHp: adminFormData.noHp || '',
                            status: adminFormData.status as any || 'Aktif',
                            lastLogin: '-'
                          };
                          updatedList = [...adminList, newAdmin];
                        }

                        setAdminList(updatedList);
                        if (onSaveAdministrators) onSaveAdministrators(updatedList);
                        setIsAddAdminOpen(false);
                      }}
                      className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-sm"
                    >
                      {editingAdmin ? 'Simpan Perubahan' : 'Tambahkan Akun'}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {activeSubTab === 'school' && (
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold border border-sky-200">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Profil Satuan Pendidikan</span>
                  </h3>
                  <p className="text-xs text-slate-500">Kelola 5 komponen data pokok profil sekolah & sinkronisasi otomatis ke Database</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-3 py-1 rounded-full font-bold">
                  Akreditasi: {schoolData.akreditasi || 'A (Unggul)'}
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold">
                  NPSN: {schoolData.npsn || '10804567'}
                </span>
              </div>
            </div>

            {/* 5 Sub-Section Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
              <button
                type="button"
                onClick={() => setSchoolSectionTab('identitas')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                  schoolSectionTab === 'identitas'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                }`}
              >
                <School className="w-3.5 h-3.5" />
                <span>1. Identitas & Legalitas</span>
              </button>

              <button
                type="button"
                onClick={() => setSchoolSectionTab('lokasi')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                  schoolSectionTab === 'lokasi'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>2. Lokasi & Kontak</span>
              </button>

              <button
                type="button"
                onClick={() => setSchoolSectionTab('pimpinan')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                  schoolSectionTab === 'pimpinan'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>3. Pimpinan & Manajemen</span>
              </button>

              <button
                type="button"
                onClick={() => setSchoolSectionTab('visimisi')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                  schoolSectionTab === 'visimisi'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>4. Visi & Misi</span>
              </button>

              <button
                type="button"
                onClick={() => setSchoolSectionTab('rekap')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                  schoolSectionTab === 'rekap'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>5. Rekapitulasi Satuan Pendidikan</span>
              </button>
            </div>

            {/* TAB 1: IDENTITAS & LEGALITAS */}
            {schoolSectionTab === 'identitas' && (
              <div className="space-y-4">
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 text-xs text-sky-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Komponen 1: Mengatur identitas resmi, NPSN, SK Pendirian, Izin Operasional, dan Akreditasi.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div className="sm:col-span-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-900 font-semibold text-xs flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-sky-600" />
                        <span>Logo Resmi Satuan Pendidikan / Sekolah</span>
                      </label>
                      {schoolData.logoSekolah && (
                        <button
                          type="button"
                          onClick={() => setSchoolData({ ...schoolData, logoSekolah: '' })}
                          className="text-[11px] text-rose-600 hover:text-rose-700 font-medium transition-colors"
                        >
                          Hapus Logo
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                      <div className="w-16 h-16 rounded-2xl bg-white p-1.5 shadow-sm flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                        {schoolData.logoSekolah ? (
                          <img
                            src={schoolData.logoSekolah}
                            alt="Logo Satuan Pendidikan"
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full border-2 border-blue-600 border-t-amber-500 border-r-amber-500 flex items-center justify-center transform -rotate-45">
                            <div className="w-3 h-3 bg-amber-500 rounded-sm" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 w-full space-y-2">
                        <input
                          type="url"
                          value={schoolData.logoSekolah || ''}
                          onChange={(e) => setSchoolData({ ...schoolData, logoSekolah: e.target.value })}
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none shadow-xs"
                          placeholder="https://contoh.com/logo-sekolah.png atau direct URL gambar"
                        />
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-sky-700 border border-slate-200 text-[11px] font-semibold flex items-center gap-1.5 transition-colors shadow-xs">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Unggah Logo dari Perangkat</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const compressed = await compressImage(file);
                                    setSchoolData({ ...schoolData, logoSekolah: compressed });
                                  } catch (err) {
                                    console.error('Failed to compress, using fallback:', err);
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setSchoolData({ ...schoolData, logoSekolah: reader.result as string });
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }
                              }}
                            />
                          </label>
                          <span className="text-[10px] text-slate-500">Logo otomatis diperbarui di navbar atas, beranda, login, dan Database</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">NPSN (8 Digit) *</label>
                    <input
                      type="text"
                      maxLength={8}
                      value={schoolData.npsn}
                      onChange={(e) => setSchoolData({ ...schoolData, npsn: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono shadow-xs focus:border-sky-500 outline-none"
                      placeholder="Contoh: 10804567"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-medium mb-1">Nama Satuan Pendidikan *</label>
                    <input
                      type="text"
                      value={schoolData.namaSekolah}
                      onChange={(e) => setSchoolData({ ...schoolData, namaSekolah: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold shadow-xs focus:border-sky-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Bentuk Pendidikan</label>
                    <select
                      value={schoolData.bentukPendidikan}
                      onChange={(e) => setSchoolData({ ...schoolData, bentukPendidikan: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 shadow-xs focus:border-sky-500 outline-none"
                    >
                      <option value="Sekolah Dasar (SD)">Sekolah Dasar (SD)</option>
                      <option value="Sekolah Menengah Pertama (SMP)">Sekolah Menengah Pertama (SMP)</option>
                      <option value="Sekolah Menengah Atas (SMA)">Sekolah Menengah Atas (SMA)</option>
                      <option value="Sekolah Menengah Kejuruan (SMK)">Sekolah Menengah Kejuruan (SMK)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Status Sekolah</label>
                    <select
                      value={schoolData.statusSekolah}
                      onChange={(e) => setSchoolData({ ...schoolData, statusSekolah: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 shadow-xs focus:border-sky-500 outline-none"
                    >
                      <option value="Negeri">Negeri</option>
                      <option value="Swasta">Swasta</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Akreditasi</label>
                    <select
                      value={schoolData.akreditasi}
                      onChange={(e) => setSchoolData({ ...schoolData, akreditasi: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 shadow-xs focus:border-sky-500 outline-none"
                    >
                      <option value="A (Unggul)">A (Unggul)</option>
                      <option value="B (Baik)">B (Baik)</option>
                      <option value="C (Cukup)">C (Cukup)</option>
                      <option value="Belum Terakreditasi">Belum Terakreditasi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Kurikulum Operasional</label>
                    <input
                      type="text"
                      value={schoolData.kurikulum}
                      onChange={(e) => setSchoolData({ ...schoolData, kurikulum: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 shadow-xs focus:border-sky-500 outline-none"
                      placeholder="Kurikulum Merdeka"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Status Kepemilikan</label>
                    <input
                      type="text"
                      value={schoolData.statusKepemilikan || ''}
                      onChange={(e) => setSchoolData({ ...schoolData, statusKepemilikan: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 shadow-xs focus:border-sky-500 outline-none"
                      placeholder="Pemerintah Daerah / Yayasan"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Nama Yayasan (Jika Swasta)</label>
                    <input
                      type="text"
                      value={schoolData.namaYayasan || ''}
                      onChange={(e) => setSchoolData({ ...schoolData, namaYayasan: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 shadow-xs focus:border-sky-500 outline-none"
                      placeholder="Kosongkan jika sekolah negeri"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">SK Pendirian Sekolah</label>
                    <input
                      type="text"
                      value={schoolData.skPendirian || ''}
                      onChange={(e) => setSchoolData({ ...schoolData, skPendirian: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono shadow-xs focus:border-sky-500 outline-none"
                      placeholder="421.3/089/Disdik/2004"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Tanggal SK Pendirian</label>
                    <input
                      type="text"
                      value={schoolData.tanggalSkPendirian || ''}
                      onChange={(e) => setSchoolData({ ...schoolData, tanggalSkPendirian: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 shadow-xs focus:border-sky-500 outline-none"
                      placeholder="14 Juli 2004"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">SK Izin Operasional</label>
                    <input
                      type="text"
                      value={schoolData.skIzinOperasional || ''}
                      onChange={(e) => setSchoolData({ ...schoolData, skIzinOperasional: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono shadow-xs focus:border-sky-500 outline-none"
                      placeholder="188.4/552/KPTS/2005"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Tanggal SK Izin Operasional</label>
                    <input
                      type="text"
                      value={schoolData.tanggalSkIzinOperasional || ''}
                      onChange={(e) => setSchoolData({ ...schoolData, tanggalSkIzinOperasional: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 shadow-xs focus:border-sky-500 outline-none"
                      placeholder="02 Mei 2005"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: LOKASI & KONTAK */}
            {schoolSectionTab === 'lokasi' && (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-800 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Komponen 2: Alamat fisik, RT/RW/Dusun, Desa, Kecamatan, Kabupaten, Kontak & Akses Internet.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-medium mb-1">Alamat Jalan / Gedung Satuan Pendidikan *</label>
                    <textarea
                      rows={2}
                      value={schoolData.alamat}
                      onChange={(e) => setSchoolData({ ...schoolData, alamat: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 shadow-xs focus:border-sky-500 outline-none"
                      placeholder="Jl. Pendidikan No. 45, Kompleks Pendidikan Terpadu"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">RT / RW / Dusun</label>
                    <input
                      type="text"
                      value={schoolData.rtRwDusun || ''}
                      onChange={(e) => setSchoolData({ ...schoolData, rtRwDusun: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 shadow-xs focus:border-sky-500 outline-none"
                      placeholder="RT 03 / RW 05 Dusun Krajan"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Desa / Kelurahan</label>
                    <input
                      type="text"
                      value={schoolData.desaKelurahan}
                      onChange={(e) => setSchoolData({ ...schoolData, desaKelurahan: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 shadow-xs focus:border-sky-500 outline-none"
                      placeholder="Sukamaju"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Kecamatan</label>
                    <input
                      type="text"
                      value={schoolData.kecamatan}
                      onChange={(e) => setSchoolData({ ...schoolData, kecamatan: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 shadow-xs focus:border-sky-500 outline-none"
                      placeholder="Cilandak"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Kabupaten / Kota *</label>
                    <input
                      type="text"
                      value={schoolData.kabupatenKota}
                      onChange={(e) => setSchoolData({ ...schoolData, kabupatenKota: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 shadow-xs focus:border-sky-500 outline-none"
                      placeholder="Jakarta Selatan"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Provinsi *</label>
                    <input
                      type="text"
                      value={schoolData.provinsi}
                      onChange={(e) => setSchoolData({ ...schoolData, provinsi: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 shadow-xs focus:border-sky-500 outline-none"
                      placeholder="DKI Jakarta"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Kode Pos</label>
                    <input
                      type="text"
                      maxLength={5}
                      value={schoolData.kodePos || ''}
                      onChange={(e) => setSchoolData({ ...schoolData, kodePos: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono shadow-xs focus:border-sky-500 outline-none"
                      placeholder="12110"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Nomor Telepon Kantor</label>
                    <input
                      type="text"
                      value={schoolData.telepon || ''}
                      onChange={(e) => setSchoolData({ ...schoolData, telepon: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono shadow-xs focus:border-sky-500 outline-none"
                      placeholder="(021) 7208899"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Email Resmi Sekolah</label>
                    <input
                      type="email"
                      value={schoolData.email || ''}
                      onChange={(e) => setSchoolData({ ...schoolData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono shadow-xs focus:border-sky-500 outline-none"
                      placeholder="info@smpn1unggulan.sch.id"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Website Resmi Sekolah</label>
                    <input
                      type="text"
                      value={schoolData.website || ''}
                      onChange={(e) => setSchoolData({ ...schoolData, website: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono shadow-xs focus:border-sky-500 outline-none"
                      placeholder="https://smpn1unggulan.sch.id"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Daya Listrik PLN</label>
                    <input
                      type="text"
                      value={schoolData.dayaListrik || ''}
                      onChange={(e) => setSchoolData({ ...schoolData, dayaListrik: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 shadow-xs focus:border-sky-500 outline-none"
                      placeholder="33.000 VA"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Akses Internet Sekolah</label>
                    <input
                      type="text"
                      value={schoolData.aksesInternet || ''}
                      onChange={(e) => setSchoolData({ ...schoolData, aksesInternet: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 shadow-xs focus:border-sky-500 outline-none"
                      placeholder="Fiber Optik 200 Mbps"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PIMPINAN & MANAJEMEN */}
            {schoolSectionTab === 'pimpinan' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Komponen 3: Kepala Sekolah, NIP, Operator Dapodik, Bendahara BOS, dan Komite Sekolah.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Nama Kepala Satuan Pendidikan *</label>
                    <input
                      type="text"
                      value={schoolData.kepalaSekolah}
                      onChange={(e) => setSchoolData({ ...schoolData, kepalaSekolah: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold shadow-xs focus:border-sky-500 outline-none"
                      placeholder="Drs. H. Ahmad Sudrajat, M.Pd."
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">NIP Kepala Sekolah</label>
                    <input
                      type="text"
                      value={schoolData.nipKepalaSekolah}
                      onChange={(e) => setSchoolData({ ...schoolData, nipKepalaSekolah: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono shadow-xs focus:border-sky-500 outline-none"
                      placeholder="19750812 200003 1 004"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Pangkat / Golongan Ruang</label>
                    <input
                      type="text"
                      value={schoolData.pangkatGolongan || ''}
                      onChange={(e) => setSchoolData({ ...schoolData, pangkatGolongan: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 shadow-xs focus:border-sky-500 outline-none"
                      placeholder="Pembina Tk. I / IV-b"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">TMT Menjabat Kepala Sekolah</label>
                    <input
                      type="text"
                      value={schoolData.tmtMenjabat || ''}
                      onChange={(e) => setSchoolData({ ...schoolData, tmtMenjabat: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 shadow-xs focus:border-sky-500 outline-none"
                      placeholder="01 Juli 2021"
                    />
                  </div>

                  <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-900 font-semibold text-xs flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-amber-600" />
                        <span>Link Foto / Avatar Kepala Satuan Pendidikan</span>
                      </label>
                      {schoolData.fotoKepalaSekolah && (
                        <button
                          type="button"
                          onClick={() => setSchoolData({ ...schoolData, fotoKepalaSekolah: '' })}
                          className="text-[11px] text-rose-600 hover:text-rose-700 font-medium transition-colors"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 p-0.5 shrink-0 shadow-sm relative group">
                        <div className="w-full h-full bg-white rounded-[14px] overflow-hidden flex items-center justify-center">
                          {schoolData.fotoKepalaSekolah ? (
                            <img
                              src={schoolData.fotoKepalaSekolah}
                              alt="Foto Kepala Sekolah"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="font-extrabold text-amber-600 text-xl">
                              {schoolData.kepalaSekolah ? schoolData.kepalaSekolah.substring(0, 1) : 'K'}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 w-full space-y-2">
                        <input
                          type="url"
                          value={schoolData.fotoKepalaSekolah || ''}
                          onChange={(e) => setSchoolData({ ...schoolData, fotoKepalaSekolah: e.target.value })}
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none shadow-xs"
                          placeholder="https://contoh.com/foto-kepala-sekolah.jpg atau direct link Google Drive"
                        />
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-amber-800 border border-slate-200 text-[11px] font-semibold flex items-center gap-1.5 transition-colors shadow-xs">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Unggah Foto dari Komputer</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const compressed = await compressImage(file);
                                    setSchoolData({ ...schoolData, fotoKepalaSekolah: compressed });
                                  } catch (err) {
                                    console.error('Failed to compress, using fallback:', err);
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setSchoolData({ ...schoolData, fotoKepalaSekolah: reader.result as string });
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }
                              }}
                            />
                          </label>
                          <span className="text-[10px] text-slate-500">Format: JPG/PNG/WebP/URL</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Operator Dapodik Sekolah</label>
                    <input
                      type="text"
                      value={schoolData.operatorSekolah || ''}
                      onChange={(e) => setSchoolData({ ...schoolData, operatorSekolah: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 shadow-xs focus:border-sky-500 outline-none"
                      placeholder="Ahmad Andryanto, S.Kom."
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Bendahara Dana BOS / BOSP</label>
                    <input
                      type="text"
                      value={schoolData.bendaharaBos || ''}
                      onChange={(e) => setSchoolData({ ...schoolData, bendaharaBos: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 shadow-xs focus:border-sky-500 outline-none"
                      placeholder="Siti Rahmawati, S.Pd., M.M."
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-medium mb-1">Ketua Komite Sekolah</label>
                    <input
                      type="text"
                      value={schoolData.komiteSekolah || ''}
                      onChange={(e) => setSchoolData({ ...schoolData, komiteSekolah: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 shadow-xs focus:border-sky-500 outline-none"
                      placeholder="Ir. H. Budi Santoso, M.T."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: VISI & MISI */}
            {schoolSectionTab === 'visimisi' && (
              <div className="space-y-4">
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 text-xs text-sky-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Komponen 4: Visi dan butir-butir Misi Satuan Pendidikan.</span>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Visi Satuan Pendidikan</label>
                    <textarea
                      rows={3}
                      value={schoolData.visi || ''}
                      onChange={(e) => setSchoolData({ ...schoolData, visi: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 leading-relaxed shadow-xs focus:border-sky-500 outline-none"
                      placeholder="Terwujudnya Peserta Didik yang Berakhlak Mulia, Cerdas, Berkarakter Profil Pelajar Pancasila, dan Berwawasan Global."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-slate-700 font-medium">Butir-Butir Misi Satuan Pendidikan</label>
                    
                    {/* List of current missions */}
                    <div className="space-y-2">
                      {getNormalizedMisi(schoolData.misi).map((m, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-white border border-slate-200 p-2.5 rounded-xl shadow-xs">
                          <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={m}
                            onChange={(e) => {
                              const updated = [...getNormalizedMisi(schoolData.misi)];
                              updated[idx] = e.target.value;
                              setSchoolData({ ...schoolData, misi: updated });
                            }}
                            className="flex-1 bg-transparent text-slate-900 border-none focus:outline-none text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = getNormalizedMisi(schoolData.misi).filter((_, i) => i !== idx);
                              setSchoolData({ ...schoolData, misi: updated });
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus Misi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add new mission input */}
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        value={newMisiInput}
                        onChange={(e) => setNewMisiInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newMisiInput.trim()) {
                            e.preventDefault();
                            const current = getNormalizedMisi(schoolData.misi);
                            setSchoolData({ ...schoolData, misi: [...current, newMisiInput.trim()] });
                            setNewMisiInput('');
                          }
                        }}
                        placeholder="Ketik butir misi baru lalu klik Tambah..."
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs shadow-xs focus:border-sky-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newMisiInput.trim()) {
                            const current = getNormalizedMisi(schoolData.misi);
                            setSchoolData({ ...schoolData, misi: [...current, newMisiInput.trim()] });
                            setNewMisiInput('');
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs flex items-center gap-1.5 border border-sky-200 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Misi</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: REKAPITULASI SATUAN PENDIDIKAN */}
            {schoolSectionTab === 'rekap' && (
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 text-xs text-purple-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Komponen 5: Luas tanah, luas bangunan, kapasitas daya tampung, jumlah rombel, dan keterangan.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Luas Tanah Milik (m²)</label>
                    <input
                      type="text"
                      value={schoolData.luasTanah || ''}
                      onChange={(e) => setSchoolData({ ...schoolData, luasTanah: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono shadow-xs focus:border-sky-500 outline-none"
                      placeholder="12.500 m²"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Luas Bangunan (m²)</label>
                    <input
                      type="text"
                      value={schoolData.luasBangunan || ''}
                      onChange={(e) => setSchoolData({ ...schoolData, luasBangunan: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono shadow-xs focus:border-sky-500 outline-none"
                      placeholder="4.850 m²"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Daya Tampung Siswa</label>
                    <input
                      type="text"
                      value={schoolData.dayaTampung || ''}
                      onChange={(e) => setSchoolData({ ...schoolData, dayaTampung: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 shadow-xs focus:border-sky-500 outline-none"
                      placeholder="720 Siswa (24 Rombel)"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Jumlah Rombongan Belajar (Rombel)</label>
                    <input
                      type="text"
                      value={schoolData.jumlahRombel || ''}
                      onChange={(e) => setSchoolData({ ...schoolData, jumlahRombel: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 shadow-xs focus:border-sky-500 outline-none"
                      placeholder="24 Rombel"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-medium mb-1">Keterangan / Catatan Tambahan</label>
                    <input
                      type="text"
                      value={schoolData.keterangan || ''}
                      onChange={(e) => setSchoolData({ ...schoolData, keterangan: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 shadow-xs focus:border-sky-500 outline-none"
                      placeholder="Sekolah Ramah Anak, Adiwiyata Mandiri, dan Sekolah Penggerak Angkatan I"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-5 border-t border-slate-200 gap-3">
              <div>
                {isSyncing ? (
                  <span className="text-sky-600 text-xs font-semibold flex items-center gap-1.5 animate-pulse">
                    <span className="w-3.5 h-3.5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                    Menyimpan dan menyinkronkan profil & rekapitulasi sekolah ke Database...
                  </span>
                ) : isSaved ? (
                  <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Profil & rekapitulasi sekolah berhasil disimpan langsung ke Database!
                  </span>
                ) : (
                  <span className="text-slate-500 text-xs flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" /> Klik tombol simpan untuk menyinkronkan profil & rekapitulasi sekolah langsung ke Database.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isSyncing}
                  className={`px-6 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all ${
                    isSyncing 
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' 
                      : 'bg-sky-600 hover:bg-sky-700 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {isSyncing ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isSyncing ? 'Menyinkronkan...' : 'Simpan Profil Satuan Pendidikan'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'sync' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-900 font-bold text-sm">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Integrasi Database Cloud Real-Time</span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Data 5 komponen tampilan (Gambar 1 s/d 5), data siswa, PTK, sarpras, dan rapor secara otomatis terhubung dan disimpan langsung ke Database pada tabel <code className="text-sky-700 font-mono bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">Data_Pengaturan</code>.
              </p>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700">
                <div>Status Database: <strong className="text-slate-900">{syncConfig.status === 'connected' ? 'Terhubung' : 'Belum Terhubung'}</strong></div>
                <div>Sinkronisasi Otomatis: <strong className="text-slate-900">{syncConfig.autoSync ? 'Aktif' : 'Non-Aktif'}</strong></div>
                <div>Terakhir Disinkron: <strong className="text-slate-900">{syncConfig.lastSynced || 'Tersedia saat sinkronisasi'}</strong></div>
              </div>

              <button
                type="button"
                onClick={onOpenSheets}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Database className="w-4 h-4" />
                <span>Buka Pengaturan & Script Database Cloud</span>
              </button>
            </div>

            <div className="lg:col-span-5 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-900 font-bold text-sm">
                <Globe className="w-4 h-4 text-sky-600" />
                <span>Deploy ke GitHub & Vercel</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                    <Github className="w-3.5 h-3.5 text-slate-700" />
                    <span>1. Export ke GitHub</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Klik menu <strong>Settings</strong> di AI Studio &gt; pilih <strong>Export to GitHub</strong>.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                    <Server className="w-3.5 h-3.5 text-sky-600" />
                    <span>2. Import di Vercel</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Buka <strong>vercel.com</strong> &gt; Impor repositori GitHub Anda &gt; Klik <strong>Deploy</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>

    </div>
  );
};
