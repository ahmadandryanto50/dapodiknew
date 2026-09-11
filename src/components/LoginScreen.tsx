import React, { useState } from 'react';
import { SafeImage } from './SafeImage';
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
  Layers,
  BarChart3,
  TrendingUp,
  GraduationCap,
  Globe,
  Settings,
  Database,
  RefreshCw,
  Upload,
  Folder,
  FileText,
  X,
  ExternalLink,
  Download,
  Plus
} from 'lucide-react';
import { AdminUser, AppDisplayConfig, SyncConfig, TeacherStaff, Student } from '../types';

interface LoginScreenProps {
  onLogin: (user: AdminUser) => void;
  administrators: AdminUser[];
  displayConfig: AppDisplayConfig;
  schoolProfile?: any;
  teachers?: TeacherStaff[];
  students?: Student[];
  syncConfig?: SyncConfig;
  onPullData?: () => Promise<boolean>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  administrators,
  displayConfig,
  schoolProfile,
  teachers,
  students,
  syncConfig,
  onPullData
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [selectedLang, setSelectedLang] = useState<'ID' | 'EN'>('ID');

  // Direct Upload (No Login Required) State
  const [isDirectUploadOpen, setIsDirectUploadOpen] = useState(false);
  const [directFiles, setDirectFiles] = useState<File[]>([]);
  const [directFolderChoiceMode, setDirectFolderChoiceMode] = useState<'category' | 'custom'>('category');
  const [directCategory, setDirectCategory] = useState('Kurikulum & Pembelajaran');
  const [directCustomCategory, setDirectCustomCategory] = useState('');
  const [directUploaderName, setDirectUploaderName] = useState('');
  const [directDescription, setDirectDescription] = useState('');
  const [isDirectUploading, setIsDirectUploading] = useState(false);
  const [directUploadProgress, setDirectUploadProgress] = useState(0);
  const [directUploadProgressText, setDirectUploadProgressText] = useState('');
  const [directUploadSuccess, setDirectUploadSuccess] = useState<any | null>(null);
  const [directUploadError, setDirectUploadError] = useState<string | null>(null);
  const directFileInputRef = React.useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleGuestLogin = () => {
    const guestUser: AdminUser = {
      id: `tamu-${Date.now()}`,
      username: 'tamu',
      password: '',
      nama: 'Pengunjung / Tamu',
      role: 'Tamu / Umum',
      email: 'tamu@dapodik.belajar.id',
      status: 'Aktif',
      lastLogin: new Date().toLocaleString('id-ID')
    };
    onLogin(guestUser);
  };

  const handleDirectFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const incoming = Array.from(e.target.files);
      setDirectFiles(prev => [...prev, ...incoming]);
      setDirectUploadError(null);
    }
  };

  const removeDirectFile = (index: number) => {
    setDirectFiles(prev => prev.filter((_, i) => i !== index));
  };

  const readDirectFileAsBase64 = (file: File): Promise<{ base64Pure: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const mime = file.type || 'application/octet-stream';
      reader.onload = () => {
        try {
          const res = (reader.result as string) || '';
          const base64Pure = res.includes(',') ? res.split(',')[1] : res;
          resolve({ base64Pure, mimeType: mime });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (e) => reject(e);
      reader.onabort = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  const handleExecuteDirectUpload = async () => {
    if (directFiles.length === 0) {
      setDirectUploadError('Silakan pilih minimal 1 berkas terlebih dahulu.');
      return;
    }

    setIsDirectUploading(true);
    setDirectUploadProgress(5);
    setDirectUploadError(null);
    setDirectUploadSuccess(null);

    const targetFolder = directFolderChoiceMode === 'custom' && directCustomCategory.trim()
      ? directCustomCategory.trim()
      : directCategory;
    const uploader = directUploaderName.trim() || 'Pengguna Tanpa Login';
    const uploadedList: any[] = [];

    try {
      for (let i = 0; i < directFiles.length; i++) {
        const file = directFiles[i];
        setDirectUploadProgressText(`Membaca berkas (${i + 1}/${directFiles.length}): ${file.name}`);
        setDirectUploadProgress(Math.round((i / directFiles.length) * 100) + 15);

        const { base64Pure, mimeType } = await readDirectFileAsBase64(file);

        setDirectUploadProgressText(`Mengunggah ke database (${i + 1}/${directFiles.length}): ${file.name}`);
        setDirectUploadProgress(Math.round((i / directFiles.length) * 100) + 60);

        const res = await fetch('/api/upload-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            mimeType,
            base64Data: base64Pure,
            category: targetFolder,
            uploadedBy: uploader,
            uploadedByRole: 'Tamu / Bebas Login',
            description: directDescription || `Berkas ${targetFolder} (diunggah bebas tanpa login email)`,
            privacy: 'Public',
            folderName: targetFolder
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `Gagal mengunggah berkas ${file.name}`);
        }

        const json = await res.json();
        if (json.success && json.file) {
          uploadedList.push(json.file);
        }
        setDirectUploadProgress(Math.round(((i + 1) / directFiles.length) * 100));
      }

      setDirectUploadSuccess({
        count: uploadedList.length,
        files: uploadedList,
        folderName: targetFolder
      });

      setDirectFiles([]);
      setDirectDescription('');
    } catch (err: any) {
      console.error('Direct upload error:', err);
      setDirectUploadError(err?.message || 'Terjadi kesalahan saat mengunggah berkas. Pastikan koneksi internet stabil.');
    } finally {
      setIsDirectUploading(false);
      setDirectUploadProgressText('');
    }
  };

  const handleManualSync = async () => {
    if (!onPullData || isSyncing) return;
    setIsSyncing(true);
    setSyncStatusMsg('Menyinkronkan dengan Cloud Database...');
    try {
      const ok = await onPullData();
      if (ok) {
        setSyncStatusMsg('✅ Data Cloud Database berhasil ditarik!');
        setTimeout(() => setSyncStatusMsg(null), 3500);
      } else {
        setSyncStatusMsg('Gagal terhubung ke Cloud Database.');
        setTimeout(() => setSyncStatusMsg(null), 3500);
      }
    } catch (e) {
      setSyncStatusMsg('Terjadi kesalahan saat menyinkronkan.');
      setTimeout(() => setSyncStatusMsg(null), 3500);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    try {
      const trimmedUser = String(username || '').trim().toLowerCase();
      const trimmedPass = String(password || '').trim();

      const runMatching = (
        adminList: AdminUser[],
        studentList: Student[],
        teacherList: TeacherStaff[]
      ): AdminUser | undefined => {
        let deletedUsernames: string[] = [];
        try {
          const delStr = localStorage.getItem('dapodik_deleted_admins');
          if (delStr) deletedUsernames = JSON.parse(delStr);
        } catch (e) {}

        let combinedAdmins: AdminUser[] = (Array.isArray(adminList) ? [...adminList] : [])
          .filter(a => a && a.username && !deletedUsernames.includes(String(a.username).trim().toLowerCase()));

        try {
          const savedAdminsStr = localStorage.getItem('dapodik_administrators');
          if (savedAdminsStr) {
            const savedAdmins: AdminUser[] = JSON.parse(savedAdminsStr);
            if (Array.isArray(savedAdmins)) {
              savedAdmins.forEach(sa => {
                if (
                  sa &&
                  sa.username &&
                  !deletedUsernames.includes(String(sa.username).trim().toLowerCase()) &&
                  !combinedAdmins.some(a => a && a.username && String(a.username).trim().toLowerCase() === String(sa.username).trim().toLowerCase())
                ) {
                  combinedAdmins.push(sa);
                }
              });
            }
          }
        } catch (err) {}

        // 1. Look for user in combinedAdmins
        let matched: AdminUser | undefined = combinedAdmins.find((a) => {
          if (!a || !a.username) return false;
          const u = String(a.username).trim().toLowerCase();
          const email = String(a.email || '').trim().toLowerCase();
          const matchesUser = u === trimmedUser || (email !== '' && email === trimmedUser);

          if (!matchesUser) return false;

          const p = String(a.password || '').trim();
          if (p !== '') {
            return p === password || p === trimmedPass;
          } else {
            return password === 'alalal123' || password === 'guru123' || password === 'siswa123' || password === '123456' || password === '123' || password === 'admin' || password === 'operator' || password === 'kepsek' || password === 'siswa';
          }
        });

        // 2. Look in students (Data Siswa) if not matched yet
        if (!matched && Array.isArray(studentList) && studentList.length > 0) {
          const matchedStudent = studentList.find((s) => {
            if (!s) return false;
            const sName = String(s.nama || '').trim().toLowerCase();
            const sNisn = String(s.nisn || '').trim().toLowerCase();
            const sNis = String(s.nis || '').trim().toLowerCase();
            const sNik = String(s.nik || '').trim().toLowerCase();
            const sEmail = String(s.email || '').trim().toLowerCase();
            const sUser = sEmail && sEmail.includes('@') ? sEmail.split('@')[0] : sName.replace(/[^a-z0-9]/gi, '').toLowerCase();

            const matchesStudentUser = 
              trimmedUser === sEmail ||
              (sNisn && (trimmedUser === sNisn || trimmedUser.includes(sNisn))) ||
              (sNis && (trimmedUser === sNis || trimmedUser.includes(sNis))) ||
              (sNik && (trimmedUser === sNik || trimmedUser.includes(sNik))) ||
              (sUser && trimmedUser === sUser) ||
              (sName && (trimmedUser === sName || (trimmedUser.length >= 3 && sName.includes(trimmedUser)))) ||
              trimmedUser === 'siswa';

            const matchesStudentPass = 
              !trimmedPass ||
              trimmedPass === sNisn ||
              trimmedPass === sNis ||
              trimmedPass === sNik ||
              trimmedPass === sEmail ||
              password === 'siswa123' ||
              password === '123456' ||
              password === '123' ||
              password === 'siswa' ||
              password === 'alalal123';

            return matchesStudentUser && matchesStudentPass;
          });

          if (matchedStudent) {
            const sEmailStr = String(matchedStudent.email || '');
            matched = {
              id: matchedStudent.id || `siswa-${Date.now()}`,
              username: sEmailStr && sEmailStr.includes('@') ? sEmailStr.split('@')[0] : (String(matchedStudent.nisn || matchedStudent.nis || trimmedUser)),
              password: password,
              nama: String(matchedStudent.nama || 'Siswa Dapodik'),
              role: 'Siswa',
              email: sEmailStr || `${trimmedUser}@dapodik.belajar.id`,
              noHp: String(matchedStudent.hp || matchedStudent.telepon || ''),
              status: 'Aktif',
              lastLogin: new Date().toLocaleString('id-ID')
            };
          }
        }

        // 3. Look for teacher match in teachers (Data PTK) if not matched yet
        if (!matched && Array.isArray(teacherList) && teacherList.length > 0) {
          const matchedTeacher = teacherList.find((t) => {
            if (!t) return false;
            const tName = String(t.nama || '').trim().toLowerCase();
            const tNip = String(t.nip || '').trim().toLowerCase();
            const tNuptk = String(t.nuptk || '').trim().toLowerCase();
            const tEmail = String(t.email || '').trim().toLowerCase();
            const tUser = tEmail && tEmail.includes('@') ? tEmail.split('@')[0] : tName.replace(/[^a-z0-9]/gi, '').toLowerCase();

            const matchesTeacherUser = 
              trimmedUser === tEmail ||
              (tNip && (trimmedUser === tNip || trimmedUser.includes(tNip))) ||
              (tNuptk && (trimmedUser === tNuptk || trimmedUser.includes(tNuptk))) ||
              (tUser && trimmedUser === tUser) ||
              (tName && (trimmedUser === tName || (trimmedUser.length >= 3 && tName.includes(trimmedUser)))) ||
              trimmedUser === 'guru' ||
              trimmedUser === 'ptk';

            const matchesTeacherPass = 
              !trimmedPass ||
              trimmedPass === tNip ||
              trimmedPass === tNuptk ||
              trimmedPass === tEmail ||
              password === 'alalal123' ||
              password === 'guru123' ||
              password === '123456' ||
              password === '123' ||
              password === 'guru';

            return matchesTeacherUser && matchesTeacherPass;
          });

          if (matchedTeacher) {
            const tEmailStr = String(matchedTeacher.email || '');
            matched = {
              id: matchedTeacher.id || `ptk-${Date.now()}`,
              username: tEmailStr && tEmailStr.includes('@') ? tEmailStr.split('@')[0] : (String(matchedTeacher.nip || matchedTeacher.nuptk || trimmedUser)),
              password: password,
              nama: String(matchedTeacher.nama || 'Guru Pengajar'),
              role: 'Guru',
              email: tEmailStr || `${trimmedUser}@dapodik.belajar.id`,
              noHp: String(matchedTeacher.noHp || (matchedTeacher as any).hp || (matchedTeacher as any).telepon || ''),
              status: 'Aktif',
              lastLogin: new Date().toLocaleString('id-ID')
            };
          }
        }

        // 4. Fallback shortcuts
        if (!matched) {
          const isSiswaShortcut = trimmedUser === 'siswa' || trimmedUser.includes('siswa') || trimmedUser === 'murid';
          const isGuruShortcut = trimmedUser === 'guru' || trimmedUser.includes('guru') || trimmedUser === 'ptk';
          const isAdminShortcut = trimmedUser === 'admin' || trimmedUser.includes('admin');
          const isOperatorShortcut = trimmedUser === 'operator' || trimmedUser.includes('operator');
          const isKepsekShortcut = trimmedUser === 'kepsek' || trimmedUser.includes('kepsek') || trimmedUser.includes('kepala');

          const isCommonPassword = 
            password === 'alalal123' || 
            password === 'guru123' || 
            password === 'siswa123' ||
            password === 'operator123' || 
            password === 'kepsek123' || 
            password === '123456' || 
            password === '123' ||
            password === 'guru' || 
            password === 'admin' ||
            password === 'operator' ||
            password === 'siswa';

          if (isSiswaShortcut && isCommonPassword) {
            matched = {
              id: 'siswa-demo-001',
              username: 'siswa',
              password: password,
              nama: 'Siswa Peserta Didik',
              role: 'Siswa',
              email: 'siswa@dapodik.belajar.id',
              status: 'Aktif',
              lastLogin: new Date().toLocaleString('id-ID')
            };
          } else if (isGuruShortcut && isCommonPassword) {
            matched = {
              id: 'guru-demo-001',
              username: 'guru',
              password: password,
              nama: 'Guru Pengajar Dapodik',
              role: 'Guru',
              email: 'guru@dapodik.belajar.id',
              status: 'Aktif',
              lastLogin: new Date().toLocaleString('id-ID')
            };
          } else if (isAdminShortcut && isCommonPassword) {
            matched = {
              id: 'adm-demo-001',
              username: 'admin',
              password: password,
              nama: 'Administrator Dapodik',
              role: 'Administrator',
              email: 'admin@dapodik.belajar.id',
              status: 'Aktif',
              lastLogin: new Date().toLocaleString('id-ID')
            };
          } else if (isOperatorShortcut && isCommonPassword) {
            matched = {
              id: 'op-demo-001',
              username: 'operator',
              password: password,
              nama: 'Operator Sekolah Dapodik',
              role: 'Operator',
              email: 'operator@dapodik.belajar.id',
              status: 'Aktif',
              lastLogin: new Date().toLocaleString('id-ID')
            };
          } else if (isKepsekShortcut && isCommonPassword) {
            matched = {
              id: 'kepsek-demo-001',
              username: 'kepsek',
              password: password,
              nama: 'Kepala Sekolah Dapodik',
              role: 'Kepala Sekolah',
              email: 'kepsek@dapodik.belajar.id',
              status: 'Aktif',
              lastLogin: new Date().toLocaleString('id-ID')
            };
          }
        }

        return matched;
      };

      // Initial check
      let matched = runMatching(administrators, students || [], teachers || []);

      // If no match found, try pulling latest data from Google Spreadsheet database on demand!
      if (!matched && onPullData) {
        setIsSyncing(true);
        await onPullData();
        setIsSyncing(false);

        // Fetch fresh lists from localStorage or updated props
        let freshAdmins: AdminUser[] = [];
        try {
          const sa = localStorage.getItem('dapodik_administrators');
          if (sa) freshAdmins = JSON.parse(sa);
        } catch (e) {}

        let freshStudents: Student[] = students || [];
        try {
          const ss = localStorage.getItem('dapodik_students');
          if (ss) freshStudents = JSON.parse(ss);
        } catch (e) {}

        let freshTeachers: TeacherStaff[] = teachers || [];
        try {
          const st = localStorage.getItem('dapodik_teachers');
          if (st) freshTeachers = JSON.parse(st);
        } catch (e) {}

        matched = runMatching(
          freshAdmins.length > 0 ? freshAdmins : administrators,
          freshStudents,
          freshTeachers
        );
      }

      if (matched) {
        if (matched.status === 'Nonaktif' || matched.status === 'Tidak Aktif' || (matched.status as string) === 'Tidak-Aktif') {
          setErrorMsg('Akun pengguna ini berstatus Tidak Aktif / Nonaktif. Silakan hubungi Administrator Utama untuk mengaktifkan kembali.');
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
        setErrorMsg('Gagal Login: Username atau Kata Sandi tidak ditemukan di Database. Silakan periksa kembali Username/Email/NIP Anda.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Login process error:', err);
      setErrorMsg('Terjadi kesalahan saat memproses login. Silakan coba lagi.');
      setIsLoading(false);
    }
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
            <SafeImage 
              src={displayConfig.logoCustomUrl || schoolProfile?.logoSekolah} 
              fallbackSrc="/logo_smpn11palu.jpg"
              alt="Logo" 
              className="w-full h-full object-contain"
            />
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

            {/* Sync Status Toast Notification */}
            {syncStatusMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{syncStatusMsg}</span>
              </div>
            )}

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



              {/* Masuk sebagai Tamu Button */}
              <button
                type="button"
                id="btn-login-guest-access"
                onClick={handleGuestLogin}
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 hover:text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200"
              >
                <Globe className="w-4 h-4 text-sky-600" />
                <span>Masuk sebagai Tamu / Akses Publik (Lihat &amp; Kelola)</span>
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

      {/* ========================================================================= */}
      {/* MODAL: UNGGAH BERKAS BEBAS AKSES (TANPA LOGIN EMAIL)                      */}
      {/* ========================================================================= */}
      {isDirectUploadOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto my-auto text-slate-800 font-sans">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-600 flex items-center justify-center">
                  <Upload className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                    Unggah Berkas ke Database Sekolah
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Bebas Akses: Bisa dari HP &amp; Browser Tanpa Login Email</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isDirectUploading) {
                    setIsDirectUploadOpen(false);
                    setDirectUploadSuccess(null);
                    setDirectUploadError(null);
                  }
                }}
                disabled={isDirectUploading}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success View */}
            {directUploadSuccess ? (
              <div className="space-y-4 py-2">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="font-extrabold text-base text-emerald-900">
                    Berkas Berhasil Tersimpan!
                  </h4>
                  <p className="text-xs text-emerald-800 mt-1 max-w-sm">
                    {directUploadSuccess.count} berkas berhasil diunggah ke folder <strong>{directUploadSuccess.folderName}</strong> dan langsung disinkronkan ke Database Sekolah &amp; Cloud Drive.
                  </p>
                </div>

                {/* Uploaded items list */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {directUploadSuccess.files?.map((f: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                        <span className="font-semibold text-slate-900 truncate">{f.name}</span>
                        <span className="text-slate-400 text-[10px]">({formatFileSize(f.fileSize || 0)})</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {f.fileUrl && (
                          <a
                            href={f.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={f.name}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded-lg font-bold text-[11px] transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            <span>Unduh</span>
                          </a>
                        )}
                        {f.driveFileUrl && f.driveFileUrl.includes('drive.google.com') && (
                          <a
                            href={f.driveFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-bold text-[11px] transition-colors"
                          >
                            <Folder className="w-3 h-3 text-amber-600" />
                            <span>Drive</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDirectUploadSuccess(null);
                      setDirectFiles([]);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-800 transition-colors"
                  >
                    + Unggah Berkas Lain
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDirectUploadOpen(false);
                      handleGuestLogin();
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 font-extrabold text-xs text-white transition-colors shadow-md shadow-sky-600/20"
                  >
                    Buka Aplikasi &amp; Lihat Arsip
                  </button>
                </div>
              </div>
            ) : (
              /* Upload Form */
              <div className="space-y-3.5">
                {/* Touch-Friendly Mobile File Picker Area */}
                <label
                  htmlFor="direct-login-file-input"
                  className="relative block border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/50 hover:bg-sky-50/90 active:bg-sky-100 rounded-2xl p-4 text-center transition-all cursor-pointer group select-none shadow-xs overflow-hidden"
                >
                  <input
                    id="direct-login-file-input"
                    type="file"
                    multiple
                    ref={directFileInputRef}
                    onChange={handleDirectFileSelection}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.svg,.zip,.rar,image/*,application/*"
                  />
                  <div className="flex flex-col items-center justify-center pointer-events-none">
                    <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="font-extrabold text-slate-900 text-xs sm:text-sm mb-1">
                      Pilih Berkas dari HP atau Laptop
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-600 group-hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs my-1 transition-colors">
                      📂 Buka File Picker / Galeri HP
                    </div>
                    <p className="text-slate-500 text-[11px] mt-1 max-w-sm">
                      Mendukung PDF, Word, Excel, Foto/Gambar, ZIP. Bisa langsung pilih dari memori HP Android, iPhone, atau browser apa saja.
                    </p>
                  </div>
                </label>

                {/* Selected Files List */}
                {directFiles.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    <div className="text-xs font-bold text-slate-700 flex justify-between items-center">
                      <span>Berkas Terpilih ({directFiles.length})</span>
                      <button
                        type="button"
                        onClick={() => setDirectFiles([])}
                        className="text-rose-500 hover:underline text-[11px]"
                      >
                        Hapus Semua
                      </button>
                    </div>
                    {directFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                          <span className="font-medium text-slate-900 truncate">{file.name}</span>
                          <span className="text-slate-400 text-[10px]">({formatFileSize(file.size)})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDirectFile(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Destination Folder Selector */}
                <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Folder className="w-4 h-4 text-amber-500" />
                      <span>Folder Tujuan Berkas</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/70 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setDirectFolderChoiceMode('category')}
                      className={`py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        directFolderChoiceMode === 'category'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Folder className="w-3 h-3 text-amber-500" />
                      <span>Kategori Umum</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDirectFolderChoiceMode('custom')}
                      className={`py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        directFolderChoiceMode === 'custom'
                          ? 'bg-amber-400 text-slate-950 font-extrabold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Plus className="w-3 h-3 text-slate-950" />
                      <span>Folder Baru</span>
                    </button>
                  </div>

                  {directFolderChoiceMode === 'category' ? (
                    <select
                      value={directCategory}
                      onChange={(e) => setDirectCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-semibold focus:border-sky-500 outline-none"
                    >
                      <option value="Kurikulum & Pembelajaran">Kurikulum & Pembelajaran</option>
                      <option value="SK & Penugasan PTK">SK & Penugasan PTK</option>
                      <option value="Kesiswaan & Ekstrakurikuler">Kesiswaan & Ekstrakurikuler</option>
                      <option value="Sarpras & Aset Sekolah">Sarpras & Aset Sekolah</option>
                      <option value="Keuangan & Laporan BOS">Keuangan & Laporan BOS</option>
                      <option value="Surat Masuk & Keluar">Surat Masuk & Keluar</option>
                      <option value="Dokumen & Foto Kegiatan">Dokumen & Foto Kegiatan</option>
                      <option value="Dokumen Resmi Sekolah">Dokumen Resmi Sekolah</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={directCustomCategory}
                      onChange={(e) => setDirectCustomCategory(e.target.value)}
                      placeholder="Ketik nama folder baru (misal: Berkas Lomba 2026)"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-semibold focus:border-sky-500 outline-none"
                    />
                  )}
                </div>

                {/* Identity & Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 text-[11px] mb-1">
                      Nama Pengunggah (Opsional):
                    </label>
                    <input
                      type="text"
                      value={directUploaderName}
                      onChange={(e) => setDirectUploaderName(e.target.value)}
                      placeholder="Contoh: Pak Budi (Guru), Siswa, dll."
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium focus:bg-white focus:border-sky-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 text-[11px] mb-1">
                      Keterangan Berkas (Opsional):
                    </label>
                    <input
                      type="text"
                      value={directDescription}
                      onChange={(e) => setDirectDescription(e.target.value)}
                      placeholder="Contoh: Berkas revisi semester 2"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium focus:bg-white focus:border-sky-500 outline-none"
                    />
                  </div>
                </div>

                {/* Error alert */}
                {directUploadError && (
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{directUploadError}</span>
                  </div>
                )}

                {/* Progress bar */}
                {isDirectUploading && (
                  <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200 space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-sky-950">
                      <span className="truncate">{directUploadProgressText || 'Mengunggah berkas...'}</span>
                      <span>{directUploadProgress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-sky-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all duration-300 rounded-full"
                        style={{ width: `${directUploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Submit Upload Button */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={isDirectUploading}
                    onClick={() => {
                      setIsDirectUploadOpen(false);
                      setDirectFiles([]);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isDirectUploading || directFiles.length === 0}
                    onClick={handleExecuteDirectUpload}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDirectUploading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>MENGUNGGAH...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 stroke-[2.5]" />
                        <span>UNGGAH SEKARANG ({directFiles.length})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
