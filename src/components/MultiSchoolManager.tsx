import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Key, 
  ShieldCheck, 
  RefreshCw, 
  FileSpreadsheet, 
  UserCheck, 
  School,
  Sparkles,
  Download,
  Upload,
  ArrowRightCircle,
  HelpCircle,
  Phone,
  Calendar,
  Lock,
  FileText
} from 'lucide-react';
import { SchoolAccount, AdminUser, SchoolProfile, SyncConfig } from '../types';

interface MultiSchoolManagerProps {
  schoolAccounts: SchoolAccount[];
  onSaveSchoolAccounts: (accounts: SchoolAccount[]) => void;
  currentUser?: AdminUser | null;
  activeSchoolNpsn?: string;
  onSwitchSchoolWorkspace?: (school: SchoolAccount) => void;
  onResetToMainSchool?: () => void;
}

export const MultiSchoolManager: React.FC<MultiSchoolManagerProps> = ({
  schoolAccounts,
  onSaveSchoolAccounts,
  currentUser,
  activeSchoolNpsn = '40203578',
  onSwitchSchoolWorkspace,
  onResetToMainSchool
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Aktif' | 'Nonaktif' | 'Suspended'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SchoolAccount | null>(null);
  const [showPasswordMap, setShowPasswordMap] = useState<{ [id: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<SchoolAccount>>({
    npsn: '',
    namaSekolah: '',
    password: '',
    bentukPendidikan: 'Sekolah Menengah Pertama (SMP)',
    kepalaSekolah: '',
    nipKepalaSekolah: '',
    alamat: '',
    kabupatenKota: 'Kota Palu',
    provinsi: 'Sulawesi Tengah',
    status: 'Aktif',
    spreadsheetUrl: '',
    webAppUrl: '',
    kontakAdmin: '',
    catatan: ''
  });

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCopyPassword = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Kata sandi berhasil disalin!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswordMap(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setFormData({
      npsn: '',
      namaSekolah: '',
      password: `sekolah${Math.floor(1000 + Math.random() * 9000)}`,
      bentukPendidikan: 'Sekolah Menengah Pertama (SMP)',
      kepalaSekolah: '',
      nipKepalaSekolah: '',
      alamat: '',
      kabupatenKota: 'Kota Palu',
      provinsi: 'Sulawesi Tengah',
      status: 'Aktif',
      spreadsheetUrl: '',
      webAppUrl: '',
      kontakAdmin: '',
      catatan: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (account: SchoolAccount) => {
    setEditingAccount(account);
    setFormData({ ...account });
    setIsModalOpen(true);
  };

  const handleGeneratePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let rand = '';
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const prefix = formData.npsn ? `sch${formData.npsn.slice(-4)}_` : 'dapodik_';
    setFormData(prev => ({
      ...prev,
      password: `${prefix}${rand}`
    }));
    showToast('Kata sandi baru otomatis digenerate', 'info');
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNpsn = String(formData.npsn || '').trim().replace(/\D/g, '');
    const cleanNama = String(formData.namaSekolah || '').trim().toUpperCase();
    const cleanPass = String(formData.password || '').trim();

    if (!cleanNpsn || cleanNpsn.length < 6) {
      showToast('NPSN wajib diisi dengan minimal 6-8 digit angka.', 'error');
      return;
    }
    if (!cleanNama) {
      showToast('Nama Sekolah wajib diisi.', 'error');
      return;
    }
    if (!cleanPass || cleanPass.length < 4) {
      showToast('Kata sandi wajib diisi minimal 4 karakter.', 'error');
      return;
    }

    // Check duplicate NPSN
    const existing = schoolAccounts.find(s => s.npsn === cleanNpsn && s.id !== editingAccount?.id);
    if (existing) {
      showToast(`NPSN ${cleanNpsn} sudah terdaftar untuk "${existing.namaSekolah}". Gunakan NPSN lain.`, 'error');
      return;
    }

    let updatedList: SchoolAccount[] = [];

    if (editingAccount) {
      updatedList = schoolAccounts.map(s => {
        if (s.id === editingAccount.id) {
          return {
            ...s,
            ...formData,
            npsn: cleanNpsn,
            namaSekolah: cleanNama,
            password: cleanPass
          } as SchoolAccount;
        }
        return s;
      });
      showToast(`Data akun sekolah "${cleanNama}" berhasil diperbarui!`, 'success');
    } else {
      const newAccount: SchoolAccount = {
        id: `school-${cleanNpsn}-${Date.now()}`,
        npsn: cleanNpsn,
        namaSekolah: cleanNama,
        password: cleanPass,
        status: (formData.status as any) || 'Aktif',
        bentukPendidikan: formData.bentukPendidikan || 'Sekolah Menengah Pertama (SMP)',
        kepalaSekolah: formData.kepalaSekolah || '',
        nipKepalaSekolah: formData.nipKepalaSekolah || '',
        alamat: formData.alamat || '',
        kabupatenKota: formData.kabupatenKota || 'Kota Palu',
        provinsi: formData.provinsi || 'Sulawesi Tengah',
        spreadsheetUrl: formData.spreadsheetUrl || '',
        webAppUrl: formData.webAppUrl || '',
        kontakAdmin: formData.kontakAdmin || '',
        catatan: formData.catatan || '',
        createdAt: new Date().toLocaleDateString('id-ID'),
        lastLogin: '-'
      };
      updatedList = [newAccount, ...schoolAccounts];
      showToast(`Akun sekolah baru "${cleanNama}" dengan NPSN ${cleanNpsn} berhasil didaftarkan!`, 'success');
    }

    onSaveSchoolAccounts(updatedList);
    setIsModalOpen(false);
  };

  const handleDeleteAccount = (account: SchoolAccount) => {
    if (account.npsn === '40203578' || account.catatan?.includes('Sekolah Induk')) {
      showToast('Sekolah Induk utama tidak dapat dihapus.', 'error');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus akun sekolah "${account.namaSekolah}" (NPSN: ${account.npsn})?\n\nAkun ini tidak akan bisa login lagi ke aplikasi.`)) {
      const updated = schoolAccounts.filter(s => s.id !== account.id);
      onSaveSchoolAccounts(updated);
      showToast(`Akun sekolah "${account.namaSekolah}" berhasil dihapus.`, 'success');
    }
  };

  const handleToggleStatus = (account: SchoolAccount) => {
    const nextStatus = account.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    const updated = schoolAccounts.map(s => {
      if (s.id === account.id) {
        return { ...s, status: nextStatus } as SchoolAccount;
      }
      return s;
    });
    onSaveSchoolAccounts(updated);
    showToast(`Status akun ${account.namaSekolah} diubah menjadi "${nextStatus}"`, 'info');
  };

  // Filtered list
  const filteredSchools = schoolAccounts.filter(item => {
    const matchSearch = 
      item.namaSekolah.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.npsn.includes(searchTerm) ||
      (item.kabupatenKota && item.kabupatenKota.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.kontakAdmin && item.kontakAdmin.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRegistered = schoolAccounts.length;
  const totalActive = schoolAccounts.filter(s => s.status === 'Aktif').length;
  const totalInactive = schoolAccounts.filter(s => s.status !== 'Aktif').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-2xl text-sm font-semibold flex items-center gap-3 shadow-lg border transition-all animate-in fade-in slide-in-from-top-4 duration-300 ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : notification.type === 'error'
            ? 'bg-rose-50 text-rose-900 border-rose-200'
            : 'bg-sky-50 text-sky-900 border-sky-200'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : notification.type === 'error' ? (
            <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          ) : (
            <Sparkles className="w-5 h-5 text-sky-600 flex-shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Header & Description Card */}
      <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/20 text-cyan-200 text-xs font-bold tracking-wide uppercase border border-cyan-400/30">
              <ShieldCheck className="w-4 h-4" />
              <span>Super Admin Management</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Manajemen Akun Multi-Sekolah</span>
            </h2>
            <p className="text-sky-200/80 text-sm max-w-2xl leading-relaxed">
              Daftarkan sekolah rekanan Anda agar mereka dapat login menggunakan <strong>Username NPSN</strong> dan <strong>Kata Sandi</strong> yang Anda tentukan. Anda dapat mengontrol status aktif, memantau riwayat login, serta menghubungkan database spreadsheet masing-masing sekolah tanpa saling mengganggu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenAdd}
              className="px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Daftarkan Sekolah Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sekolah Terdaftar</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalRegistered} <span className="text-xs font-normal text-slate-500">Sekolah</span></h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sekolah Berstatus Aktif</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{totalActive} <span className="text-xs font-normal text-slate-500">Dapat Login</span></h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nonaktif / Ditangguhkan</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">{totalInactive} <span className="text-xs font-normal text-slate-500">Terkunci</span></h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
            <Lock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari NPSN, Nama Sekolah, Wilayah..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">Semua Status ({totalRegistered})</option>
            <option value="Aktif">Aktif ({totalActive})</option>
            <option value="Nonaktif">Nonaktif / Suspended ({totalInactive})</option>
          </select>
        </div>
      </div>

      {/* Schools List Cards */}
      <div className="space-y-4">
        {filteredSchools.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-700">Tidak ada sekolah ditemukan</h4>
            <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau daftarkan akun sekolah baru.</p>
          </div>
        ) : (
          filteredSchools.map((school) => {
            const isMainSchool = school.npsn === '40203578' || school.catatan?.includes('Sekolah Induk');
            const isCurrentlyActive = activeSchoolNpsn === school.npsn;
            const isPassVisible = showPasswordMap[school.id];

            return (
              <div 
                key={school.id}
                className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all shadow-xs ${
                  isCurrentlyActive 
                    ? 'border-cyan-400 ring-2 ring-cyan-400/20 bg-gradient-to-br from-cyan-50/30 to-white' 
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left info */}
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base flex-shrink-0 shadow-xs ${
                      isMainSchool 
                        ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                        : school.status === 'Aktif'
                        ? 'bg-sky-100 text-sky-800 border border-sky-300'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      <School className="w-6 h-6" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-sky-100 text-sky-800 font-mono font-extrabold text-xs tracking-wider border border-sky-200">
                          NPSN: {school.npsn}
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-slate-900">
                          {school.namaSekolah}
                        </h3>
                        {isMainSchool && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-extrabold border border-amber-300">
                            ⭐ Sekolah Utama (Host)
                          </span>
                        )}
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                          school.status === 'Aktif'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          ● {school.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                        {school.kepalaSekolah && (
                          <span><strong>Kepsek:</strong> {school.kepalaSekolah}</span>
                        )}
                        {school.kabupatenKota && (
                          <span><strong>Wilayah:</strong> {school.kabupatenKota}, {school.provinsi || 'Indonesia'}</span>
                        )}
                        {school.kontakAdmin && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {school.kontakAdmin}
                          </span>
                        )}
                      </div>

                      {school.catatan && (
                        <p className="text-xs text-slate-400 italic pt-0.5">
                          "{school.catatan}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Login Credentials & Actions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Password Box */}
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/90 text-xs w-full sm:w-auto">
                      <Key className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-500 font-semibold">Sandi:</span>
                      <span className="font-mono font-bold text-slate-800 tracking-wider">
                        {isPassVisible ? school.password : '••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(school.id)}
                        className="p-1 text-slate-400 hover:text-slate-700 transition-colors ml-1 cursor-pointer"
                        title={isPassVisible ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                      >
                        {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyPassword(school.password, school.id)}
                        className="p-1 text-slate-400 hover:text-sky-600 transition-colors cursor-pointer"
                        title="Salin Kata Sandi"
                      >
                        {copiedId === school.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {onSwitchSchoolWorkspace && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isCurrentlyActive && onResetToMainSchool) {
                              onResetToMainSchool();
                              showToast('Kembali ke ruang kerja Sekolah Utama.', 'info');
                            } else {
                              onSwitchSchoolWorkspace(school);
                              showToast(`Beralih ke mode pantau sekolah "${school.namaSekolah}" (NPSN: ${school.npsn})`, 'success');
                            }
                          }}
                          className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                            isCurrentlyActive
                              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                              : 'bg-sky-600 hover:bg-sky-700 text-white'
                          }`}
                          title="Masuk ke mode pantau ruang kerja sekolah ini"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isCurrentlyActive ? 'Sedang Dipantau' : 'Pantau Sekolah'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(school)}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          school.status === 'Aktif'
                            ? 'bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 border-slate-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300'
                        }`}
                        title={school.status === 'Aktif' ? 'Nonaktifkan Akun Ini' : 'Aktifkan Akun Ini'}
                      >
                        {school.status === 'Aktif' ? <Lock className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(school)}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                        title="Edit Data & Kata Sandi Sekolah"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {!isMainSchool && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAccount(school)}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer"
                          title="Hapus Akun Sekolah"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional footer meta */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
                  <div className="flex items-center gap-4">
                    <span>Terdaftar: <strong>{school.createdAt || '-'}</strong></span>
                    <span>Terakhir Login: <strong className="text-slate-600">{school.lastLogin || '-'}</strong></span>
                  </div>
                  {school.spreadsheetUrl && (
                    <div className="flex items-center gap-1 text-emerald-600 font-medium">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Spreadsheet Terhubung: {school.spreadsheetUrl.length > 25 ? `${school.spreadsheetUrl.slice(0, 25)}...` : school.spreadsheetUrl}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Guide Info Box */}
      <div className="bg-sky-50/70 border border-sky-200 rounded-3xl p-6 text-sky-950 space-y-3">
        <h4 className="font-extrabold text-sm flex items-center gap-2 text-sky-900">
          <HelpCircle className="w-4 h-4 text-sky-600" />
          <span>Petunjuk Penggunaan Akun Multi-Sekolah untuk Rekan Sekolah:</span>
        </h4>
        <ul className="text-xs text-sky-900/80 space-y-1.5 list-disc list-inside leading-relaxed">
          <li>Berikan <strong>Username = NPSN Sekolah</strong> (contoh: <code className="bg-sky-100 px-1 py-0.5 rounded font-bold text-sky-900">40203578</code>) dan <strong>Kata Sandi</strong> yang telah Anda buat kepada operator sekolah teman Anda.</li>
          <li>Mereka cukup memasukkan NPSN dan Password pada halaman login aplikasi seperti biasa.</li>
          <li>Setiap sekolah dapat memasukkan link Google Spreadsheet masing-masing di menu Pengaturan mereka agar data siswa, nilai rapor, dan PTK tersimpan terpisah di spreadsheet sekolah mereka sendiri.</li>
          <li>Sebagai Super Admin, Anda dapat memantau atau mengunci akses sekolah kapan saja dengan menonaktifkan status akun di atas.</li>
        </ul>
      </div>

      {/* Modal: Tambah / Edit Akun Sekolah */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingAccount ? 'Edit Akun Sekolah' : 'Daftarkan Akun Sekolah Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">Tentukan NPSN dan Kata Sandi untuk akses sekolah</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* NPSN */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    NPSN Sekolah (Username Login) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 40203578"
                    value={formData.npsn}
                    onChange={(e) => setFormData(prev => ({ ...prev, npsn: e.target.value.replace(/\D/g, '') }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">8 digit nomor pokok sekolah</p>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Kata Sandi Akses <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[11px] text-sky-600 hover:text-sky-800 font-bold cursor-pointer"
                    >
                      + Generate Acak
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Kata sandi untuk sekolah"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Nama Sekolah */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Resmi Satuan Pendidikan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SMP NEGERI 2 PALU"
                  value={formData.namaSekolah}
                  onChange={(e) => setFormData(prev => ({ ...prev, namaSekolah: e.target.value.toUpperCase() }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bentuk Pendidikan */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Bentuk Pendidikan
                  </label>
                  <select
                    value={formData.bentukPendidikan}
                    onChange={(e) => setFormData(prev => ({ ...prev, bentukPendidikan: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Sekolah Menengah Pertama (SMP)">Sekolah Menengah Pertama (SMP)</option>
                    <option value="Sekolah Dasar (SD)">Sekolah Dasar (SD)</option>
                    <option value="Sekolah Menengah Atas (SMA)">Sekolah Menengah Atas (SMA)</option>
                    <option value="Sekolah Menengah Kejuruan (SMK)">Sekolah Menengah Kejuruan (SMK)</option>
                    <option value="Madrasah Tsanawiyah (MTs)">Madrasah Tsanawiyah (MTs)</option>
                    <option value="Madrasah Ibtidaiyah (MI)">Madrasah Ibtidaiyah (MI)</option>
                  </select>
                </div>

                {/* Status Lisensi */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status Akses Login
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e: any) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Aktif">🟢 Aktif (Bisa Login)</option>
                    <option value="Nonaktif">🔴 Nonaktif (Terkunci)</option>
                    <option value="Suspended">🟡 Ditangguhkan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Kepala Sekolah */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    placeholder="Nama Kepala Sekolah"
                    value={formData.kepalaSekolah}
                    onChange={(e) => setFormData(prev => ({ ...prev, kepalaSekolah: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Kontak Admin / No HP */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    No. HP Operator / Admin
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 08123456789"
                    value={formData.kontakAdmin}
                    onChange={(e) => setFormData(prev => ({ ...prev, kontakAdmin: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Kabupaten & Wilayah */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kabupaten / Kota
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Kota Palu"
                    value={formData.kabupatenKota}
                    onChange={(e) => setFormData(prev => ({ ...prev, kabupatenKota: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Provinsi
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Sulawesi Tengah"
                    value={formData.provinsi}
                    onChange={(e) => setFormData(prev => ({ ...prev, provinsi: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Google Spreadsheet ID (Opsional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  ID / URL Google Spreadsheet Sekolah (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="ID Spreadsheet atau URL Google Sheet khusus sekolah ini"
                  value={formData.spreadsheetUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, spreadsheetUrl: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">Dapat dikosongkan dan diatur kemudian oleh operator sekolah.</p>
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Catatan Admin / Keterangan Lisensi
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Lisensi Resmi Sahabat Sekolah Palu"
                  value={formData.catatan}
                  onChange={(e) => setFormData(prev => ({ ...prev, catatan: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingAccount ? 'Simpan Perubahan' : 'Daftarkan Akun'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
