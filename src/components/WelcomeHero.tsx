import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  GraduationCap, 
  Building2, 
  FileText, 
  BarChart3, 
  Settings, 
  Search, 
  Bell, 
  Clock, 
  Lightbulb, 
  Camera, 
  Cog, 
  RefreshCw, 
  CheckCircle2, 
  Database, 
  ChevronRight,
  ChevronDown,
  TrendingUp,
  School,
  Landmark,
  Star,
  Laptop,
  Award,
  BookOpen,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Pencil,
  Palette,
  LayoutTemplate,
  LogOut,
  User,
  Menu,
  X,
  ZoomIn
} from 'lucide-react';
import { ActiveTab, SyncConfig, Student, TeacherStaff, SarprasItem, StudentReport, AppDisplayConfig, SchoolProfile, AdminUser } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { SafeImage } from './SafeImage';

interface WelcomeHeroProps {
  onNavigate: (tab: ActiveTab) => void;
  onOpenEditDisplay?: (filter?: 'all' | '1' | '2' | '3' | '4' | '5') => void;
  syncConfig: SyncConfig;
  displayConfig: AppDisplayConfig;
  schoolProfile: SchoolProfile;
  onOpenSheets: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenMobileMenu?: () => void;
  unreadCount: number;
  students: Student[];
  teachers: TeacherStaff[];
  sarpras: SarprasItem[];
  reports: StudentReport[];
  isSyncing: boolean;
  onQuickSync: () => void;
  currentUser?: AdminUser | null;
  onLogout?: () => void;
}

export const WelcomeHero: React.FC<WelcomeHeroProps> = ({
  onNavigate,
  onOpenEditDisplay,
  syncConfig,
  displayConfig,
  schoolProfile,
  onOpenSheets,
  onOpenSearch,
  onOpenNotifications,
  onOpenMobileMenu,
  unreadCount,
  students,
  teachers,
  sarpras,
  reports,
  isSyncing,
  onQuickSync,
  currentUser,
  onLogout
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('dapodik_nav_open');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const toggleNav = () => {
    setIsNavOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('dapodik_nav_open', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const activeStudents = students.filter(s => !s.status || s.status === 'Aktif');

  const totalGuru = teachers.filter(t => {
    const j = String(t.jenisPtk || '').toLowerCase();
    return (['Guru Mapel', 'Guru Kelas'].includes(t.jenisPtk) || j.includes('guru')) && !j.includes('kepala');
  }).length;
  const totalTendik = teachers.length - totalGuru;

  const menuItems = [
    {
      id: 'sekolah' as ActiveTab,
      label: 'Sekolah',
      icon: School,
      count: schoolProfile.npsn || '40203578',
      desc: 'Profil Satuan Pendidikan',
      color: 'from-cyan-500/20 to-sky-500/20 border-cyan-400/30 text-cyan-300'
    },
    {
      id: 'siswa' as ActiveTab,
      label: 'Data Siswa',
      icon: Users,
      count: activeStudents.length,
      desc: 'Peserta Didik Aktif',
      color: 'from-blue-500/20 to-cyan-500/20 border-cyan-400/30 text-cyan-300'
    },
    {
      id: 'ptk' as ActiveTab,
      label: 'PTK',
      icon: GraduationCap,
      count: teachers.length,
      desc: 'Guru & Tenaga Kependidikan',
      color: 'from-amber-500/20 to-orange-500/20 border-amber-400/30 text-amber-300'
    },
    {
      id: 'sarpras' as ActiveTab,
      label: 'Sarpras',
      icon: Building2,
      count: sarpras.length,
      desc: 'Sarana & Prasarana Sekolah',
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-400/30 text-emerald-300'
    },
    {
      id: 'rapor' as ActiveTab,
      label: 'Rapor',
      icon: FileText,
      count: reports.length,
      desc: 'Penilaian & Capaian Belajar',
      color: 'from-rose-500/20 to-pink-500/20 border-rose-400/30 text-rose-300'
    },
    {
      id: 'laporan' as ActiveTab,
      label: 'Laporan',
      icon: BarChart3,
      count: `${Math.round(((activeStudents.length + teachers.length + sarpras.length) / 50) * 100)}%`,
      desc: 'Rekapitulasi & Statistik',
      color: 'from-indigo-500/20 to-blue-500/20 border-indigo-400/30 text-indigo-300'
    },
    {
      id: 'aplikasi' as ActiveTab,
      label: 'Aplikasi',
      icon: Laptop,
      count: 'Pintasan',
      desc: 'Portal Pintasan Dapodik',
      color: 'from-violet-500/20 to-fuchsia-500/20 border-violet-400/30 text-violet-300'
    },
    {
      id: 'pengaturan' as ActiveTab,
      label: 'Pengaturan',
      icon: Settings,
      count: syncConfig.status === 'connected' ? 'Aktif' : 'Konfigurasi',
      desc: 'Database Cloud & Tampilan',
      color: 'from-sky-500/20 to-blue-500/20 border-sky-400/30 text-sky-300'
    }
  ].filter(item => {
    if (item.id === 'pengaturan') {
      const role = currentUser?.role;
      return role === 'Administrator' || role === 'Operator';
    }
    return true;
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onOpenSearch();
    }
  };

  return (
    <div id="welcome-hero-container" className="relative min-h-[calc(100vh-4rem)] w-full bg-gradient-to-br from-[#0c4a6e] via-[#0284c7] to-[#0369a1] text-white flex flex-col justify-between select-none overflow-x-clip">
      {/* Background Animated Bokeh & Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft Radial glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-20 w-[32rem] h-[32rem] bg-blue-400/25 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 w-[40rem] h-[40rem] bg-sky-300/15 rounded-full blur-3xl" />

        {/* Network constellation dots & lines */}
        <svg className="absolute inset-0 w-full h-full opacity-30">
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <line x1="20%" y1="20%" x2="50%" y2="40%" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="50%" y1="40%" x2="80%" y2="25%" stroke="url(#lineGrad)" strokeWidth="1.5" />
          <line x1="80%" y1="25%" x2="70%" y2="65%" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="30%" y1="70%" x2="50%" y2="40%" stroke="url(#lineGrad)" strokeWidth="1.5" />
          <line x1="70%" y1="65%" x2="85%" y2="80%" stroke="url(#lineGrad)" strokeWidth="1.5" />
          
          <circle cx="20%" cy="20%" r="4" fill="#38bdf8" className="animate-ping" />
          <circle cx="50%" cy="40%" r="5" fill="#ffffff" />
          <circle cx="80%" cy="25%" r="6" fill="#38bdf8" />
          <circle cx="70%" cy="65%" r="4" fill="#fbbf24" />
          <circle cx="30%" cy="70%" r="5" fill="#38bdf8" />
          <circle cx="85%" cy="80%" r="4" fill="#ffffff" />
        </svg>

        {/* Decorative Grid Patterns */}
        <div className="absolute left-6 bottom-16 opacity-30 flex gap-2">
          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/70" />
            ))}
          </div>
        </div>
        <div className="absolute right-6 top-48 opacity-30 flex gap-2">
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/70" />
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Top Header Bar (Persists position on scroll) */}
      <header id="welcome-hero-sticky-header" className="sticky top-0 z-30 w-full bg-[#0c4a6e]/85 backdrop-blur-xl border-b border-white/15 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          {/* Logo Brand */}
          <div className="flex items-center gap-3.5 group relative">
            <div 
              className="w-11 h-11 rounded-xl bg-white p-1.5 shadow-lg shadow-sky-950/20 flex items-center justify-center overflow-hidden shrink-0 cursor-default transition-all"
              title="Logo Aplikasi"
            >
              <SafeImage 
                src={displayConfig.logoCustomUrl || schoolProfile.logoSekolah} 
                fallbackSrc="/logo_smpn11palu.jpg"
                alt="Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-extrabold tracking-wider text-white">
                  {displayConfig.appName ?? 'DAPODIK'}
                </span>
                <span className="text-xs bg-amber-400/90 text-slate-900 font-bold px-2 py-0.5 rounded-full tracking-wider">
                  {displayConfig.appVersion ?? '2026.a'}
                </span>
              </div>
              <p className="text-[11px] font-semibold tracking-wide text-sky-200 uppercase">
                {schoolProfile.namaSekolah ?? 'SMP NEGERI 11 PALU'}
              </p>
            </div>
          </div>

          {/* Quick Realtime Sync Pill & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Install APK HP Button */}
            <PWAInstallButton variant="header" />

            {/* Mobile Menu Button */}
            {onOpenMobileMenu && (
              <button 
                onClick={onOpenMobileMenu}
                className="md:hidden p-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer"
                title="Menu Navigasi"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}

            {/* Quick Notification Bell */}
            <button 
              id="header-notif-btn"
              onClick={onOpenNotifications}
              className="relative p-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer"
              title="Notifikasi & Validasi"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold flex items-center justify-center shadow-md">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Quick Search Header Bar */}
            <div 
              onClick={onOpenSearch}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-sky-100 text-xs backdrop-blur-md border border-white/20 cursor-pointer transition-all w-36 lg:w-44"
            >
              <Search className="w-3.5 h-3.5 text-sky-200" />
              <span className="truncate">Quick Search...</span>
              <kbd className="ml-auto text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white/80 font-mono">⌘K</kbd>
            </div>

            {/* Current Logged-in User Chip & Logout */}
            {currentUser && onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-2 bg-white/15 hover:bg-rose-500/25 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 hover:border-rose-400/50 text-sky-100 hover:text-rose-100 transition-all cursor-pointer shadow-sm group"
                title={`Keluar ke Halaman Login (${currentUser.nama})`}
              >
                <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center justify-center shadow-sm">
                  {(currentUser.nama.replace(/[^a-zA-Z0-9]/g, '').substring(0, 1) || 'A').toUpperCase()}
                </div>
                <span className="text-xs font-bold text-white hidden lg:inline max-w-[120px] truncate">
                  {currentUser.nama.replace(/^\(|\)$/g, '')}
                </span>
                <LogOut className="w-3.5 h-3.5 text-sky-200 group-hover:text-rose-300 transition-colors ml-0.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col justify-between">

        {/* Center Grid: Left Nav Cards + Center Welcome Display + Right Interactive Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6">
          
          {/* Left Vertical Pill Navigation (Collapsible Accordion) */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <button
              type="button"
              id="toggle-main-nav-btn"
              onClick={toggleNav}
              className="w-full text-xs font-bold uppercase tracking-wider text-sky-100 bg-white/15 hover:bg-white/25 border border-white/25 backdrop-blur-xl px-3.5 py-2.5 rounded-2xl flex items-center justify-between cursor-pointer transition-all shadow-md active:scale-98 group"
              title="Klik untuk Membuka / Menutup Navigasi Utama"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-cyan-400/20 border border-cyan-300/40 text-cyan-200 group-hover:scale-110 transition-transform">
                  <Menu className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm tracking-wide">Menu Navigasi Utama</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/20 text-white font-extrabold px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] shadow-xs group-hover:bg-cyan-400 group-hover:text-slate-900 transition-colors">
                <span>{isNavOpen ? 'Tutup' : `Buka (${menuItems.length})`}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-cyan-200 group-hover:text-slate-900 transition-transform duration-300 ${isNavOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isNavOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                  exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="space-y-2.5"
                >
                  {menuItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.label}
                        id={`menu-btn-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() => (item as any).customAction ? (item as any).customAction() : onNavigate(item.id)}
                        className="w-full group flex items-center justify-between px-4 py-3 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-xl border border-white/25 shadow-lg shadow-sky-950/10 hover:shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.99] transition-all text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${item.color} border shadow-inner transition-transform group-hover:rotate-6`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-sm text-white group-hover:text-cyan-200 transition-colors">
                              {item.label}
                            </div>
                            <div className="text-[11px] text-sky-100/70 font-medium">
                              {item.desc}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-sky-100 group-hover:bg-cyan-400 group-hover:text-slate-900 transition-colors">
                            {item.count}
                          </span>
                          <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Center Graphic & Typography Banner */}
          <div className="lg:col-span-6 flex flex-col items-center text-center px-2 relative">
            
            {/* Floating Visual Badges & Constellation Items */}
            <div className="relative w-full flex items-center justify-center py-3">
              {/* Floating Clock */}
              <div className="absolute left-4 top-0 p-2.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-lg animate-bounce duration-1000">
                <Clock className="w-5 h-5 text-amber-300" />
              </div>
              
              {/* Floating Idea Bulb */}
              <div className="absolute right-8 top-2 p-2.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-lg animate-pulse">
                <Lightbulb className="w-5 h-5 text-yellow-300" />
              </div>

              {/* Floating Camera / Gallery */}
              <div className="absolute right-24 -top-6 p-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20">
                <Camera className="w-4 h-4 text-cyan-200" />
              </div>

              {/* Central Glowing Shield Icon */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="p-3.5 sm:p-4 rounded-full bg-gradient-to-tr from-cyan-400/35 via-white/25 to-blue-500/35 backdrop-blur-2xl border-2 border-white/50 shadow-2xl shadow-cyan-400/40 ring-4 ring-cyan-300/20 cursor-default transition-all duration-300 group select-none"
                title="Logo Banner"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-white via-sky-50 to-sky-100 p-2.5 sm:p-3 flex items-center justify-center shadow-lg overflow-hidden border-2 border-white/80">
                  {displayConfig.welcomeCustomIconUrl ? (
                    <SafeImage 
                      src={displayConfig.welcomeCustomIconUrl} 
                      fallbackSrc="/logo_smpn11palu.jpg"
                      fallbackNode={
                        displayConfig.welcomeIconType === 'graduation' ? <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 text-[#0284c7]" /> :
                        displayConfig.welcomeIconType === 'award' ? <Award className="w-10 h-10 sm:w-12 sm:h-12 text-[#0284c7]" /> :
                        displayConfig.welcomeIconType === 'book' ? <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-[#0284c7]" /> :
                        displayConfig.welcomeIconType === 'star' ? <Star className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500" /> :
                        displayConfig.welcomeIconType === 'shield' ? <ShieldCheck className="w-10 h-10 sm:w-12 sm:h-12 text-[#0284c7]" /> :
                        displayConfig.welcomeIconType === 'landmark' ? <Landmark className="w-10 h-10 sm:w-12 sm:h-12 text-[#0284c7]" /> :
                        <School className="w-10 h-10 sm:w-12 sm:h-12 text-[#0284c7]" />
                      }
                      alt="Custom Banner Icon" 
                      className="w-full h-full object-contain rounded-full"
                    />
                  ) : displayConfig.welcomeIconType === 'graduation' ? (
                    <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 text-[#0284c7]" />
                  ) : displayConfig.welcomeIconType === 'award' ? (
                    <Award className="w-10 h-10 sm:w-12 sm:h-12 text-[#0284c7]" />
                  ) : displayConfig.welcomeIconType === 'book' ? (
                    <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-[#0284c7]" />
                  ) : displayConfig.welcomeIconType === 'star' ? (
                    <Star className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500" />
                  ) : displayConfig.welcomeIconType === 'shield' ? (
                    <ShieldCheck className="w-10 h-10 sm:w-12 sm:h-12 text-[#0284c7]" />
                  ) : displayConfig.welcomeIconType === 'landmark' ? (
                    <Landmark className="w-10 h-10 sm:w-12 sm:h-12 text-[#0284c7]" />
                  ) : (
                    <School className="w-10 h-10 sm:w-12 sm:h-12 text-[#0284c7]" />
                  )}
                </div>
              </motion.div>
            </div>

            {/* Big Catchy Titles Exactly as shown in the picture */}
            <div className="space-y-1.5 mt-2">
              <h2 className="text-sm sm:text-base font-bold tracking-[0.25em] text-cyan-200 uppercase drop-shadow-sm">
                {displayConfig.welcomeGreeting ?? 'SELAMAT DATANG'}
              </h2>
              <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-white drop-shadow-md">
                {displayConfig.welcomeTitle ?? 'DI DAPODIK'}
              </h1>
              <div className="text-base sm:text-xl font-bold tracking-widest text-sky-100 uppercase">
                {displayConfig.welcomeSubtitle ?? 'DATA POKOK PENDIDIKAN'}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-5">
              <PWAInstallButton variant="hero" />

              <button
                id="hero-enter-siswa-btn"
                onClick={() => onNavigate('siswa')}
                className="px-5 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-sm shadow-xl shadow-sky-950/20 hover:bg-cyan-50 hover:shadow-cyan-400/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Users className="w-4 h-4 text-blue-600" />
                <span>Buka Data Siswa</span>
              </button>

              <button
                id="hero-quick-sync-btn"
                onClick={onQuickSync}
                disabled={isSyncing}
                className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-sm backdrop-blur-md border border-white/30 hover:border-white/50 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 text-cyan-300 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sinkronkan Data' : 'Sinkronkan Data'}</span>
              </button>
            </div>

            {/* Bottom Graphic with Characters & School Elements */}
            <div className="w-full pt-6 flex items-end justify-center gap-4 text-sky-100/80">
              <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-full text-xs backdrop-blur-md border border-white/15">
                {displayConfig.curriculumBadgeIcon === 'sparkles' ? (
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                ) : displayConfig.curriculumBadgeIcon === 'award' ? (
                  <Award className="w-3.5 h-3.5 text-cyan-300" />
                ) : displayConfig.curriculumBadgeIcon === 'shield' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-300" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                )}
                <span>{displayConfig.curriculumBadge ?? 'Kurikulum Merdeka Ready'}</span>
              </div>
            </div>
          </div>

          {/* Right Live Dashboard Preview & Quick Stats Widget */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            
            {/* Quick Search Widget at Bottom Right */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                id="hero-bottom-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Siswa, PTK, NISN..."
                className="w-full px-4 py-2.5 pl-4 pr-10 rounded-2xl bg-white/20 hover:bg-white/25 focus:bg-white/30 text-white placeholder-sky-200 text-xs backdrop-blur-xl border border-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-300 transition-all shadow-lg font-medium"
              />
              <button
                type="submit"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors shadow-sm cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* School Operator Card */}
            <div className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 text-xs flex items-center justify-between gap-3">
              <div 
                className="flex items-center gap-3 overflow-hidden cursor-pointer group"
                onClick={() => setIsOperatorModalOpen(true)}
                title="Klik untuk melihat foto operator"
              >
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center font-bold text-slate-950 shadow-md overflow-hidden shrink-0 ring-2 ring-amber-300/40 group-hover:ring-amber-300 group-hover:scale-105 transition-all">
                  {displayConfig.operatorAvatarUrl ? (
                    <SafeImage 
                      src={displayConfig.operatorAvatarUrl} 
                      fallbackNode={
                        <span className="text-xs font-black">
                          {(displayConfig.operatorTitle ?? 'OP').replace(/[^a-zA-Z0-9]/g, '').substring(0, 2).toUpperCase() || 'OP'}
                        </span>
                      }
                      alt="Operator" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-black">
                      {(displayConfig.operatorTitle ?? 'OP').replace(/[^a-zA-Z0-9]/g, '').substring(0, 2).toUpperCase() || 'OP'}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <ZoomIn className="w-3.5 h-3.5 drop-shadow" />
                  </div>
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold text-white truncate group-hover:text-amber-200 transition-colors flex items-center gap-1.5">
                    <span>{displayConfig.operatorTitle ?? 'Operator Sekolah'}</span>
                  </div>
                  <div className="text-[11px] text-sky-200 truncate">
                    {displayConfig.operatorName ?? schoolProfile.namaSekolah ?? 'SMP NEGERI 11 PALU'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOperatorModalOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-amber-400 hover:text-slate-950 text-white text-[11px] font-semibold border border-white/20 transition-all shrink-0 cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                title="Lihat Foto Operator"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Foto</span>
              </button>
            </div>

          </div>

        </div>

        {/* Bottom Bar Info & Fast Shortcuts */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-sky-100/70">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Versi Aplikasi: <strong>{displayConfig.footerVersionText ?? 'Dapodik Cloud 2026.a (Next.js & Vercel Ready)'}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <span>NPSN: <strong>{schoolProfile.npsn ?? '40203578'}</strong></span>
          </div>
        </div>

      </div>

      {/* Operator Photo Popup Modal */}
      {isOperatorModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setIsOperatorModalOpen(false)}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden p-6 text-white flex flex-col items-center text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setIsOperatorModalOpen(false)}
              className="absolute top-3.5 right-3.5 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Badge */}
            <div className="px-3.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold mb-4 flex items-center gap-1.5 shadow-xs">
              <UserCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>{displayConfig.operatorTitle ?? 'Operator Sekolah'}</span>
            </div>

            {/* Large Avatar Photo Frame */}
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-300 p-1.5 shadow-2xl shadow-amber-500/20 mb-4 overflow-hidden border-2 border-white/30 group">
              <div className="w-full h-full rounded-xl bg-slate-800 overflow-hidden flex items-center justify-center relative">
                {displayConfig.operatorAvatarUrl ? (
                  <SafeImage 
                    src={displayConfig.operatorAvatarUrl} 
                    fallbackNode={
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <User className="w-16 h-16" />
                        <span className="text-xs font-semibold">Foto Operator</span>
                      </div>
                    }
                    alt="Foto Operator Sekolah" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-center text-amber-300">
                    <User className="w-20 h-20 mb-1" />
                    <span className="text-sm font-bold text-white">
                      {displayConfig.operatorName ?? 'Operator Dapodik'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Name and School Info */}
            <h3 className="text-lg font-extrabold text-white">
              {displayConfig.operatorName ?? 'Ahmad'}
            </h3>
            <p className="text-xs text-sky-200/80 font-medium mt-0.5">
              {schoolProfile.namaSekolah ?? 'SMP NEGERI 11 PALU'}
            </p>

            {/* Secondary Details */}
            <div className="mt-4 w-full pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-around">
              <div>
                <span className="block text-slate-500">NPSN</span>
                <span className="font-bold text-slate-200">{schoolProfile.npsn ?? '40203578'}</span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <span className="block text-slate-500">Status</span>
                <span className="font-bold text-emerald-400">Aktif Dapodik</span>
              </div>
            </div>

            {/* Close Action Button */}
            <button
              onClick={() => setIsOperatorModalOpen(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
            >
              Tutup Tampilan Foto
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};
