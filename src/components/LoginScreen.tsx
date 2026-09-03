import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  KeyRound,
  HelpCircle,
  Clock,
  Lightbulb,
  Camera,
  Layers,
  BarChart3,
  TrendingUp,
  GraduationCap,
  Globe,
  Settings,
  Database
} from 'lucide-react';
import { AdminUser, AppDisplayConfig, SyncConfig } from '../types';

interface LoginScreenProps {
  onLogin: (user: AdminUser) => void;
  administrators: AdminUser[];
  displayConfig: AppDisplayConfig;
  onOpenSheetsModal?: () => void;
  syncConfig: SyncConfig;
  onPullData?: () => void;
  schoolProfile?: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  administrators,
  displayConfig,
  onOpenSheetsModal,
  syncConfig,
  onPullData,
  schoolProfile
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [selectedLang, setSelectedLang] = useState<'ID' | 'EN'>('ID');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim()) {
      setErrorMsg('Silakan masukkan Username');
      return;
    }
    if (!password) {
      setErrorMsg('Silakan masukkan Kata Sandi');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const trimmedUser = username.trim().toLowerCase();
      const isConnectedToDatabase = syncConfig?.status === 'connected' || Boolean(syncConfig?.webAppUrl && syncConfig.webAppUrl.trim() !== '');

      if (isConnectedToDatabase) {
        // MODE ONLINE (TERKONEKSI DATABASE):
        // Wajib akun yang terdaftar di database. Password offline (alalal123) TIDAK BERFUNGSI.
        const matched = administrators.find(
          (a) => a.username.toLowerCase() === trimmedUser && a.password === password
        );

        if (matched) {
          if (matched.status === 'Nonaktif') {
            setErrorMsg('Akun administrator ini berstatus Nonaktif. Hubungi Admin Utama.');
            setIsLoading(false);
            return;
          }

          const updatedUser: AdminUser = {
            ...matched,
            lastLogin: new Date().toLocaleString('id-ID', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          };

          setIsLoading(false);
          onLogin(updatedUser);
        } else {
          setErrorMsg('Gagal Login: Aplikasi terhubung ke Database. Username atau Kata Sandi salah / tidak terdaftar di database.');
          setIsLoading(false);
        }
      } else {
        // MODE OFFLINE (BELUM TERKONEKSI DATABASE):
        // Kode kata sandi offline diubah menjadi: alalal123
        const matched = administrators.find(
          (a) => a.username.toLowerCase() === trimmedUser && (a.password === password || password === 'alalal123')
        );

        if (matched) {
          if (matched.status === 'Nonaktif') {
            setErrorMsg('Akun administrator ini berstatus Nonaktif.');
            setIsLoading(false);
            return;
          }

          const updatedUser: AdminUser = {
            ...matched,
            lastLogin: new Date().toLocaleString('id-ID')
          };

          setIsLoading(false);
          onLogin(updatedUser);
        } else if (trimmedUser === 'admin' && password === 'alalal123') {
          const defaultAdmin: AdminUser = {
            id: 'adm-001',
            username: 'admin',
            password: 'alalal123',
            nama: 'Administrator Dapodik (Mode Offline)',
            role: 'Administrator',
            email: 'admin@dapodik.belajar.id',
            status: 'Aktif',
            lastLogin: new Date().toLocaleString('id-ID')
          };
          setIsLoading(false);
          onLogin(defaultAdmin);
        } else {
          setErrorMsg('Mode Offline: Username atau Kata Sandi salah. Gunakan sandi offline (alalal123).');
          setIsLoading(false);
        }
      }
    }, 450);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#0284c7] via-[#0ea5e9] to-[#0369a1] flex flex-col justify-between select-none">
      
      {/* Background Graphic Elements & Modern Vectors Matching the Reference Image */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft radial glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-300/30 blur-3xl" />
        <div className="absolute top-1/4 -right-20 w-[30rem] h-[30rem] rounded-full bg-sky-300/25 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-[36rem] h-[36rem] rounded-full bg-blue-600/30 blur-3xl" />

        {/* Diagonal Soft Abstract Waves */}
        <svg className="absolute inset-0 w-full h-full opacity-35" preserveAspectRatio="none" viewBox="0 0 1440 900">
          <path fill="url(#grad-wave-1)" d="M0,192L48,202.7C96,213,192,235,288,218.7C384,203,480,149,576,144C672,139,768,181,864,208C960,235,1056,245,1152,229.3C1248,213,1344,171,1392,149.3L1440,128L1440,900L1392,900C1344,900,1248,900,1152,900C1056,900,960,900,864,900C768,900,672,900,576,900C480,900,384,900,288,900C192,900,96,900,48,900L0,900Z"></path>
          <defs>
            <linearGradient id="grad-wave-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Floating Constellation Nodes and Geometric Accents */}
        <div className="absolute top-24 right-1/4 flex items-center gap-16 opacity-75">
          <div className="relative">
            <div className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center bg-white/10 backdrop-blur-sm shadow-lg">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div className="absolute top-4 left-8 w-24 h-[1px] bg-gradient-to-r from-white/50 to-transparent rotate-12" />
          </div>
          <div className="relative -top-6">
            <div className="w-9 h-9 rounded-full border border-amber-300/60 flex items-center justify-center bg-amber-400/20 backdrop-blur-sm shadow-lg">
              <Lightbulb className="w-4 h-4 text-amber-200" />
            </div>
            <div className="absolute top-4 left-9 w-20 h-[1px] bg-gradient-to-r from-amber-300/50 to-transparent -rotate-12" />
          </div>
          <div className="hidden lg:flex w-7 h-7 rounded-full border border-cyan-200/50 items-center justify-center bg-cyan-400/20 backdrop-blur-sm">
            <Camera className="w-3.5 h-3.5 text-cyan-100" />
          </div>
        </div>

        {/* Floating Orange & Blue Gears on Left */}
        <div className="absolute top-36 left-28 hidden sm:block">
          <div className="w-12 h-12 rounded-full border-4 border-dashed border-orange-400/80 animate-spin-slow opacity-80" style={{ animationDuration: '24s' }} />
        </div>
        <div className="absolute top-48 left-16 hidden sm:block">
          <div className="w-8 h-8 rounded-full border-2 border-dashed border-cyan-200/70 animate-spin-slow opacity-75" style={{ animationDuration: '18s', animationDirection: 'reverse' }} />
        </div>

        {/* Dots Matrix Pattern on Bottom Left */}
        <div className="absolute bottom-16 left-8 grid grid-cols-5 gap-2 opacity-50">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/70" />
          ))}
        </div>

      </div>

      {/* Top Header with Dapodik Logo & Kemendikbud */}
      <header className="relative z-20 w-full px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Distinct Dapodik Brand Logo (Arrow Swoosh in Rounded Shield) */}
          <div className="w-12 h-12 rounded-2xl bg-white p-1.5 shadow-xl shadow-sky-950/20 flex items-center justify-center overflow-hidden shrink-0 border border-white/40">
            {(displayConfig.logoCustomUrl || schoolProfile?.logoSekolah) ? (
              <img 
                src={displayConfig.logoCustomUrl || schoolProfile?.logoSekolah} 
                alt="Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/logo_smpn11palu.jpg';
                }}
              />
            ) : (
              <img 
                src="/logo_smpn11palu.jpg" 
                alt="Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wider flex items-center gap-1.5 drop-shadow-md">
              <span>{displayConfig.appName ?? 'DAPODIK'}</span>
            </h1>
            <p className="text-[11px] font-extrabold text-sky-200 tracking-wider uppercase opacity-95">
              {schoolProfile?.namaSekolah || 'SMP NEGERI 11 PALU'}
            </p>
          </div>
        </div>

        {/* Database & Quick Demo Login Link */}
        <div className="flex items-center gap-2">
          {onOpenSheetsModal && (
            <button
              onClick={onOpenSheetsModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold backdrop-blur-md border border-white/30 transition-all shadow-md"
              title="Konfigurasi Database Cloud"
            >
              <Database className="w-3.5 h-3.5 text-amber-300" />
              <span>Database Cloud</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area: Centered Login Card Faithful to the Reference Image */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 py-4 sm:py-8">
        <div className="w-full max-w-[430px] sm:max-w-[450px]">
          
          {/* Main Pure White Rounded Card */}
          <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] p-7 sm:p-9 shadow-2xl shadow-sky-950/40 border border-white/80 transition-all">
            
            {/* Header: Title in Dark Navy Blue */}
            <div className="text-center mb-7">
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight uppercase">
                LOGIN KE DAPODIK
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Masukkan Akun Administrator / Operator Sekolah
              </p>
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            {/* Form Inputs */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Field 1: Username */}
              <div className="space-y-1">
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-slate-400 pointer-events-none">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="Username"
                    autoComplete="username"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 rounded-2xl text-slate-800 placeholder-slate-400 text-sm font-medium transition-all outline-none"
                  />
                </div>
              </div>

              {/* Field 2: Kata Sandi */}
              <div className="space-y-1">
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-slate-400 pointer-events-none">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="Kata Sandi"
                    autoComplete="current-password"
                    className="w-full pl-12 pr-12 py-3.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 rounded-2xl text-slate-800 placeholder-slate-400 text-sm font-medium transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-slate-400 hover:text-slate-600 focus:outline-none"
                    title={showPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Lupa Kata Sandi? */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline transition-all"
                  >
                    Lupa Kata Sandi?
                  </button>
                </div>
              </div>

              {/* Action 1: MASUK > (Blue Gradient Rounded Button) */}
              <button
                id="btn-login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-6 rounded-full bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:scale-[0.98] text-white font-extrabold text-sm tracking-wider shadow-lg shadow-sky-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>MEMVERIFIKASI...</span>
                  </div>
                ) : (
                  <>
                    <span>MASUK</span>
                    <ChevronRight className="w-4 h-4 stroke-[3]" />
                  </>
                )}
              </button>

            </form>

          </div>
        </div>
      </main>

      {/* Bottom Footer Bar Matching Reference Image */}
      <footer className="relative z-20 w-full px-6 py-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-white/90">
        <div className="flex items-center gap-3 font-medium">
          <span>Aplikasi Resmi Dapodik</span>
          <span className="text-white/40">|</span>
          
          {/* Language / Region Pill */}
          <div className="relative">
            <button
              onClick={() => setSelectedLang(selectedLang === 'ID' ? 'EN' : 'ID')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-[11px] font-bold text-white transition-all"
            >
              <span>🇮🇩 {selectedLang === 'ID' ? 'ID (Indonesia)' : 'EN (English)'}</span>
              <span className="text-[9px]">▾</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-slate-900 font-bold text-base pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900">Bantuan Kata Sandi</h3>
                <p className="text-xs text-slate-500 font-normal">Pemulihan Akun Administrator Dapodik</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>
                Saat terhubung ke database, akun administrator wajib terdaftar pada tabel <strong>`Administrator`</strong> di Database Cloud.
              </p>
              <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-100 text-slate-800 space-y-2">
                <div className="font-bold text-sky-900">Petunjuk Mode Akses Login:</div>
                <div className="text-[11px] space-y-1">
                  <div>• <strong>Mode Offline:</strong> Gunakan Username <strong>admin</strong> &amp; Kata Sandi <strong>alalal123</strong>.</div>
                  <div>• <strong>Mode Online (Database):</strong> HANYA akun yang terdaftar di Database yang bisa login (akses offline otomatis dinonaktifkan).</div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Kelola akun administrator melalui menu <strong>Pengaturan &gt; Kelola Administrator</strong> atau langsung dari Database Cloud.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all shadow-md"
              >
                Tutup & Kembali
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
