import React, { useState } from 'react';
import { SafeImage } from './SafeImage';
import { formatDateIndonesian } from '../utils/dateUtils';
import { compressImage } from '../utils/imageCompressor';
import { getNormalizedMisi } from '../utils/misiUtils';
import { 
  School, 
  Edit3, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Award, 
  ShieldCheck, 
  FileText, 
  Users, 
  GraduationCap, 
  Building2, 
  Sparkles, 
  ArrowLeft, 
  RefreshCw, 
  Printer, 
  Copy, 
  Check, 
  Save, 
  X, 
  BookOpen, 
  Zap, 
  Wifi, 
  Landmark, 
  Calendar,
  Layers,
  ChevronRight,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { SchoolProfile, Student, TeacherStaff, SarprasItem, StudentReport } from '../types';

interface SchoolModuleProps {
  schoolProfile: SchoolProfile;
  onUpdateSchoolProfile: (profile: SchoolProfile) => void;
  onBackToHome: () => void;
  onSync: () => void;
  isSyncing?: boolean;
  students: Student[];
  teachers: TeacherStaff[];
  sarpras: SarprasItem[];
  reports: StudentReport[];
}

export const SchoolModule: React.FC<SchoolModuleProps> = ({
  schoolProfile,
  onUpdateSchoolProfile,
  onBackToHome,
  onSync,
  isSyncing = false,
  students,
  teachers,
  sarpras,
  reports
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'identitas' | 'lokasi' | 'pimpinan' | 'visimisi' | 'rekap'>('identitas');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<SchoolProfile>(schoolProfile);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleOpenEdit = () => {
    setEditFormData(schoolProfile);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = {
      ...editFormData,
      tmtMenjabat: editFormData.tmtMenjabat ? formatDateIndonesian(editFormData.tmtMenjabat) : '',
      tanggalSkPendirian: editFormData.tanggalSkPendirian ? formatDateIndonesian(editFormData.tanggalSkPendirian) : '',
      tanggalSkIzinOperasional: editFormData.tanggalSkIzinOperasional ? formatDateIndonesian(editFormData.tanggalSkIzinOperasional) : ''
    };
    onUpdateSchoolProfile(cleaned);
    setIsEditModalOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  // Aggregated Stats
  const activeStudents = students.filter(s => !s.status || s.status === 'Aktif');
  const totalLaki = activeStudents.filter(s => s.jenisKelamin === 'L').length;
  const totalPerempuan = activeStudents.filter(s => s.jenisKelamin === 'P').length;
  const totalPNS = teachers.filter(t => t.statusKepegawaian === 'PNS' || t.statusKepegawaian === 'PPPK').length;
  const totalHonorer = teachers.filter(t => t.statusKepegawaian !== 'PNS' && t.statusKepegawaian !== 'PPPK').length;
  const sarprasBaik = sarpras.filter(s => s.kondisi === 'Baik').length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-xl border border-sky-100 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 transition-colors border border-slate-200/80 cursor-pointer"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700 shrink-0 shadow-xs">
            <School className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold text-slate-900">
                Profil Satuan Pendidikan
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
                NPSN: {schoolProfile.npsn}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {schoolProfile.akreditasi ?? 'A (Unggul)'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Informasi identitas resmi, data kelembagaan, sarana, dan profil satuan pendidikan
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all flex items-center gap-2 border border-slate-200 shadow-xs cursor-pointer"
            title="Cetak Profil Sekolah"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="hidden md:inline">Cetak Profil</span>
          </button>

          <button
            onClick={onSync}
            disabled={isSyncing}
            className="px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold text-xs transition-all flex items-center gap-2 border border-sky-200 shadow-xs cursor-pointer"
            title="Sinkronkan Data Sekolah ke Database Cloud"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Sinkronkan</span>
          </button>
        </div>
      </div>

      {/* Hero Banner Card for School */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-sky-50/70 to-blue-50/50 border border-sky-200/90 p-6 md:p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-blue-200/30 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-sky-500 via-blue-500 to-indigo-500 p-1 flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20 overflow-hidden">
              <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center p-2 overflow-hidden shadow-inner">
                {schoolProfile.logoSekolah ? (
                  <SafeImage
                    src={schoolProfile.logoSekolah}
                    fallbackNode={<Landmark className="w-10 h-10 text-sky-600" />}
                    alt={schoolProfile.namaSekolah}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Landmark className="w-10 h-10 text-sky-600" />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                  {schoolProfile.bentukPendidikan ?? 'SMP'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  Status: {schoolProfile.statusSekolah ?? 'Negeri'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  {schoolProfile.kurikulum ?? 'Kurikulum Merdeka'}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {schoolProfile.namaSekolah ?? 'SMP NEGERI 11 PALU'}
              </h2>
              <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap font-medium">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  <span>{schoolProfile.alamat}, {schoolProfile.kabupatenKota}, {schoolProfile.provinsi}</span>
                </div>
                <button
                  onClick={() => handleCopy(`${schoolProfile.namaSekolah} - NPSN: ${schoolProfile.npsn}`, 'npsn')}
                  className="flex items-center gap-1 text-sky-700 hover:text-sky-900 underline underline-offset-2 transition-colors cursor-pointer font-semibold"
                >
                  {copiedField === 'npsn' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>Salin Info</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stat Pill Widget */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto shrink-0">
            <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-sky-100 shadow-xs flex flex-col items-center justify-center text-center">
              <Users className="w-5 h-5 text-sky-600 mb-1" />
              <span className="text-lg font-extrabold text-slate-900">{activeStudents.length}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Siswa Aktif</span>
            </div>
            <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-sky-100 shadow-xs flex flex-col items-center justify-center text-center">
              <GraduationCap className="w-5 h-5 text-amber-600 mb-1" />
              <span className="text-lg font-extrabold text-slate-900">{teachers.length}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total PTK</span>
            </div>
            <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-sky-100 shadow-xs flex flex-col items-center justify-center text-center">
              <Building2 className="w-5 h-5 text-emerald-600 mb-1" />
              <span className="text-lg font-extrabold text-slate-900">{sarpras.length}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sarpras</span>
            </div>
            <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-sky-100 shadow-xs flex flex-col items-center justify-center text-center">
              <Award className="w-5 h-5 text-rose-600 mb-1" />
              <span className="text-lg font-extrabold text-slate-900">{reports.length}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rapor</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('identitas')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubTab === 'identitas'
              ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-600/20'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-sky-50 hover:text-sky-700'
          }`}
        >
          <School className="w-4 h-4" />
          <span>Identitas & Legalitas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('lokasi')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubTab === 'lokasi'
              ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-600/20'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-sky-50 hover:text-sky-700'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Lokasi & Kontak</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('pimpinan')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubTab === 'pimpinan'
              ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-600/20'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-sky-50 hover:text-sky-700'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Pimpinan & Manajemen</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('visimisi')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubTab === 'visimisi'
              ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-600/20'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-sky-50 hover:text-sky-700'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Visi & Misi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('rekap')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubTab === 'rekap'
              ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-600/20'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-sky-50 hover:text-sky-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Rekapitulasi Satuan Pendidikan</span>
        </button>
      </div>

      {/* Tab 1: Identitas & Legalitas */}
      {activeSubTab === 'identitas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-sky-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <School className="w-4 h-4 text-sky-600" />
              <span>Identitas Pokok Satuan Pendidikan</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Nama Satuan Pendidikan</span>
                <span className="font-bold text-slate-900 text-right">{schoolProfile.namaSekolah}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Nomor Pokok Sekolah Nasional (NPSN)</span>
                <span className="font-bold text-sky-700 font-mono">{schoolProfile.npsn}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Bentuk Pendidikan</span>
                <span className="font-semibold text-slate-800">{schoolProfile.bentukPendidikan}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Status Sekolah</span>
                <span className="font-bold text-emerald-700">{schoolProfile.statusSekolah}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Status Kepemilikan</span>
                <span className="font-semibold text-slate-800">{schoolProfile.statusKepemilikan ?? 'Pemerintah Daerah'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500 font-medium">Kurikulum Operasional</span>
                <span className="font-bold text-amber-800">{schoolProfile.kurikulum}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="w-4 h-4 text-amber-600" />
              <span>Legalitas & Akreditasi</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Peringkat Akreditasi</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  {schoolProfile.akreditasi}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">SK Pendirian Sekolah</span>
                <span className="font-mono text-slate-800 font-medium">{schoolProfile.skPendirian ?? '421.3/089/Disdik/2004'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Tanggal SK Pendirian</span>
                <span className="text-slate-800 font-medium">{formatDateIndonesian(schoolProfile.tanggalSkPendirian || '14 Juli 2004')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">SK Izin Operasional</span>
                <span className="font-mono text-slate-800 font-medium">{schoolProfile.skIzinOperasional ?? '188.4/552/KPTS/2005'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500 font-medium">Tanggal SK Operasional</span>
                <span className="text-slate-800 font-medium">{formatDateIndonesian(schoolProfile.tanggalSkIzinOperasional || '02 Mei 2005')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Lokasi & Kontak */}
      {activeSubTab === 'lokasi' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-sky-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <MapPin className="w-4 h-4 text-sky-600" />
              <span>Alamat & Wilayah Satuan Pendidikan</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Alamat Jalan</span>
                <span className="font-semibold text-slate-900 text-right max-w-[250px]">{schoolProfile.alamat}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Desa / Kelurahan</span>
                <span className="text-slate-800 font-medium">{schoolProfile.desaKelurahan}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Kecamatan</span>
                <span className="text-slate-800 font-medium">{schoolProfile.kecamatan}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Kabupaten / Kota</span>
                <span className="text-slate-800 font-medium">{schoolProfile.kabupatenKota}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Provinsi</span>
                <span className="text-slate-800 font-medium">{schoolProfile.provinsi}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500 font-medium">Kode Pos</span>
                <span className="font-mono text-sky-700 font-bold">{schoolProfile.kodePos ?? '12110'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Kontak & Fasilitas Jaringan</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-sky-600" />
                  <span>Nomor Telepon</span>
                </span>
                <span className="font-mono text-slate-800 font-semibold">{schoolProfile.telepon ?? '(021) 7208899'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-rose-600" />
                  <span>Email Resmi</span>
                </span>
                <span className="text-sky-700 font-mono font-semibold">{schoolProfile.email ?? 'info@smpn1unggulan.sch.id'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span>Website Sekolah</span>
                </span>
                <span className="text-sky-700 underline font-mono font-semibold">{schoolProfile.website ?? 'https://smpn1unggulan.sch.id'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span>Daya Listrik PLN</span>
                </span>
                <span className="font-bold text-amber-800">{schoolProfile.dayaListrik ?? '33.000 VA'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Akses Internet</span>
                </span>
                <span className="font-bold text-emerald-800">{schoolProfile.aksesInternet ?? 'Fiber Optik 200 Mbps'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Pimpinan & Manajemen */}
      {activeSubTab === 'pimpinan' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Kepala Sekolah Card */}
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-900">Kepala Satuan Pendidikan</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Pimpinan Utama
                </span>
              </div>

              <div className="flex items-start gap-4 pt-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 p-0.5 flex items-center justify-center shadow-md shrink-0 overflow-hidden">
                  <div className="w-full h-full bg-white rounded-[14px] overflow-hidden flex items-center justify-center font-extrabold text-amber-700 text-lg">
                    {schoolProfile.fotoKepalaSekolah ? (
                      <SafeImage
                        src={schoolProfile.fotoKepalaSekolah}
                        fallbackNode={
                          <span className="font-extrabold text-amber-700 text-lg">
                            {schoolProfile.kepalaSekolah.substring(0, 1) || 'K'}
                          </span>
                        }
                        alt={schoolProfile.kepalaSekolah}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      schoolProfile.kepalaSekolah.substring(0, 1) || 'K'
                    )}
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  <h4 className="text-base font-bold text-slate-900">{schoolProfile.kepalaSekolah}</h4>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span>NIP:</span>
                    <span className="font-mono text-sky-700 font-bold">{schoolProfile.nipKepalaSekolah ?? '-'}</span>
                  </div>
                  <div className="text-slate-500">Pangkat/Gol: <span className="text-slate-800 font-medium">{schoolProfile.pangkatGolongan ?? 'Pembina Tk. I / IV-b'}</span></div>
                  <div className="text-emerald-700 font-semibold">TMT Menjabat: <span className="text-emerald-800">{formatDateIndonesian(schoolProfile.tmtMenjabat || '01 Juli 2021')}</span></div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>Status Kepegawaian</span>
              <span className="font-bold text-emerald-700">PNS Guru Madya</span>
            </div>
          </div>

          {/* Tim Manajemen Sekolah */}
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-sky-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Users className="w-4 h-4 text-sky-600" />
              <span>Tim Manajemen & Pengelola Sekolah</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Operator Dapodik Sekolah</div>
                  <div className="text-sky-700 font-semibold text-xs mt-0.5">{schoolProfile.operatorSekolah ?? 'Ahmad Andryanto, S.Kom.'}</div>
                  <div className="text-slate-500 text-[11px]">Pengelola Sinkronisasi & Verifikasi Data</div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-800 font-bold">Aktif</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Bendahara Dana BOS / BOSP</div>
                  <div className="text-emerald-700 font-semibold text-xs mt-0.5">{schoolProfile.bendaharaBos ?? 'Siti Rahmawati, S.Pd., M.M.'}</div>
                  <div className="text-slate-500 text-[11px]">Pengelolaan Anggaran & Keuangan Satuan Pendidikan</div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold">Terverifikasi</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Ketua Komite Sekolah</div>
                  <div className="text-amber-800 font-semibold text-xs mt-0.5">{schoolProfile.komiteSekolah ?? 'Ir. H. Budi Santoso, M.T.'}</div>
                  <div className="text-slate-500 text-[11px]">Perwakilan Wali Murid & Mitra Sekolah</div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold">Mitra</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Visi & Misi */}
      {activeSubTab === 'visimisi' && (
        <div className="space-y-6">
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-sky-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>Visi Satuan Pendidikan</span>
            </h3>
            <p className="text-sm sm:text-base italic text-slate-800 font-semibold leading-relaxed pt-4 pl-4 border-l-4 border-sky-500">
              "{schoolProfile.visi ?? 'Terwujudnya Peserta Didik yang Berakhlak Mulia, Cerdas, Berkarakter Profil Pelajar Pancasila, dan Berwawasan Global.'}"
            </p>
          </div>

          <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>Misi Satuan Pendidikan</span>
            </h3>

            <div className="space-y-3 pt-2">
              {getNormalizedMisi(schoolProfile?.misi).map((m, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-800">
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <span className="leading-relaxed font-medium">{m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Rekapitulasi Satuan Pendidikan */}
      {activeSubTab === 'rekap' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Siswa Card */}
            <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-sky-800 flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-600" />
                  <span>Peserta Didik</span>
                </span>
                <span className="text-lg font-extrabold text-slate-900">{activeStudents.length}</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Laki-laki (L)</span>
                  <span className="font-bold text-sky-700">{totalLaki} Siswa</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Perempuan (P)</span>
                  <span className="font-bold text-pink-700">{totalPerempuan} Siswi</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 font-medium">Status Aktif</span>
                  <span className="font-bold text-emerald-700">{activeStudents.length} Siswa</span>
                </div>
              </div>
            </div>

            {/* PTK Card */}
            <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-amber-800 flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-amber-600" />
                  <span>Pendidik & Tendik</span>
                </span>
                <span className="text-lg font-extrabold text-slate-900">{teachers.length}</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Guru PNS / PPPK</span>
                  <span className="font-bold text-emerald-700">{totalPNS} Orang</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Guru Honorer / GTY</span>
                  <span className="font-bold text-amber-800">{totalHonorer} Orang</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 font-medium">Sertifikasi Pendidik</span>
                  <span className="font-bold text-sky-700">{teachers.filter(t => t.statusSertifikasi === 'Sudah').length} Guru</span>
                </div>
              </div>
            </div>

            {/* Sarpras Card */}
            <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-emerald-800 flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>Sarana & Prasarana</span>
                </span>
                <span className="text-lg font-extrabold text-slate-900">{sarpras.length}</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Kondisi Baik</span>
                  <span className="font-bold text-emerald-700">{sarprasBaik} Item</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Rusak Ringan/Sedang</span>
                  <span className="font-bold text-amber-800">{sarpras.length - sarprasBaik} Item</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 font-medium">Layak Pakai</span>
                  <span className="font-bold text-sky-700">{sarpras.filter(s => s.layakPakai).length} Item</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section Tambahan Sesuai Gambar: Rekapitulasi Luas, Rombel & Keterangan Tambahan */}
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <h3 className="text-sm font-bold text-sky-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-600" />
                <span>Rekapitulasi Luas Lahan & Kapasitas Satuan Pendidikan</span>
              </h3>
              <span className="text-[11px] text-emerald-800 font-bold bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg">
                Data Pokok Satuan Pendidikan
              </span>
            </div>

            {/* Grid Baris 1: Luas Tanah, Luas Bangunan, Daya Tampung */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Luas Tanah Milik (m²)</label>
                <div className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-xs font-semibold shadow-inner">
                  {schoolProfile.luasTanah ?? '12.500 m²'}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Luas Bangunan (m²)</label>
                <div className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-xs font-semibold shadow-inner">
                  {schoolProfile.luasBangunan ?? '4.850 m²'}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Daya Tampung Siswa</label>
                <div className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold shadow-inner">
                  {schoolProfile.dayaTampung ?? '384 Siswa (12 Rombel)'}
                </div>
              </div>
            </div>

            {/* Grid Baris 2: Jumlah Rombongan Belajar, Keterangan / Catatan Tambahan */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Jumlah Rombongan Belajar (Rombel)</label>
                <div className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold shadow-inner">
                  {schoolProfile.jumlahRombel ?? '12 Rombel'}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-600 font-bold mb-1.5">Keterangan / Catatan Tambahan</label>
                <div className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium shadow-inner">
                  {schoolProfile.keterangan ?? 'Sekolah Ramah Anak, Adiwiyata Mandiri, dan Sekolah Penggerak Angkatan I'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Profil Satuan Pendidikan */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white border border-sky-100 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <School className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Edit Data Profil Satuan Pendidikan</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-6 text-xs">
              {/* Section Identitas */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-sky-800 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                  1. Identitas & Legalitas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-800 font-bold text-xs flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                        <span>Logo Satuan Pendidikan / Sekolah</span>
                      </label>
                      {editFormData.logoSekolah && (
                        <button
                          type="button"
                          onClick={() => setEditFormData({ ...editFormData, logoSekolah: '' })}
                          className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                    <div className="flex gap-3 items-center">
                      <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-xs flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                        {editFormData.logoSekolah ? (
                          <SafeImage
                            src={editFormData.logoSekolah}
                            fallbackNode={<Landmark className="w-6 h-6 text-slate-400" />}
                            alt="Preview Logo"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Landmark className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <input
                          type="url"
                          value={editFormData.logoSekolah || ''}
                          onChange={e => setEditFormData({ ...editFormData, logoSekolah: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-sky-500 font-mono"
                          placeholder="https://... URL logo atau upload di bawah"
                        />
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-[10px] font-bold transition-colors border border-sky-200">
                          <Upload className="w-3 h-3" />
                          <span>Pilih Berkas Logo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const compressed = await compressImage(file);
                                  setEditFormData({ ...editFormData, logoSekolah: compressed });
                                } catch (err) {
                                  console.error('Failed to compress, using fallback:', err);
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setEditFormData({ ...editFormData, logoSekolah: reader.result as string });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 font-semibold">Nama Satuan Pendidikan *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.namaSekolah}
                      onChange={e => setEditFormData({ ...editFormData, namaSekolah: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 font-semibold">NPSN (8 Digit) *</label>
                    <input
                      type="text"
                      required
                      maxLength={8}
                      value={editFormData.npsn}
                      onChange={e => setEditFormData({ ...editFormData, npsn: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-sky-500 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 font-semibold">Bentuk Pendidikan</label>
                    <select
                      value={editFormData.bentukPendidikan}
                      onChange={e => setEditFormData({ ...editFormData, bentukPendidikan: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                    >
                      <option value="Sekolah Dasar (SD)">Sekolah Dasar (SD)</option>
                      <option value="Sekolah Menengah Pertama (SMP)">Sekolah Menengah Pertama (SMP)</option>
                      <option value="Sekolah Menengah Atas (SMA)">Sekolah Menengah Atas (SMA)</option>
                      <option value="Sekolah Menengah Kejuruan (SMK)">Sekolah Menengah Kejuruan (SMK)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 font-semibold">Status Sekolah</label>
                    <select
                      value={editFormData.statusSekolah}
                      onChange={e => setEditFormData({ ...editFormData, statusSekolah: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                    >
                      <option value="Negeri">Negeri</option>
                      <option value="Swasta">Swasta</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 font-semibold">Akreditasi</label>
                    <select
                      value={editFormData.akreditasi}
                      onChange={e => setEditFormData({ ...editFormData, akreditasi: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                    >
                      <option value="A (Unggul)">A (Unggul)</option>
                      <option value="B (Baik)">B (Baik)</option>
                      <option value="C (Cukup)">C (Cukup)</option>
                      <option value="Belum Terakreditasi">Belum Terakreditasi</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 font-semibold">Kurikulum</label>
                    <input
                      type="text"
                      value={editFormData.kurikulum}
                      onChange={e => setEditFormData({ ...editFormData, kurikulum: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Section Pimpinan & Manajemen */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                  2. Pimpinan & Manajemen
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-700 font-semibold">Nama Kepala Sekolah</label>
                    <input
                      type="text"
                      value={editFormData.kepalaSekolah}
                      onChange={e => setEditFormData({ ...editFormData, kepalaSekolah: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 font-semibold">NIP Kepala Sekolah</label>
                    <input
                      type="text"
                      value={editFormData.nipKepalaSekolah}
                      onChange={e => setEditFormData({ ...editFormData, nipKepalaSekolah: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-sky-500 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 font-semibold">Pangkat / Golongan</label>
                    <input
                      type="text"
                      value={editFormData.pangkatGolongan || ''}
                      onChange={e => setEditFormData({ ...editFormData, pangkatGolongan: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                      placeholder="Pembina Tk. I / IV-b"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 font-semibold">TMT Menjabat</label>
                    <input
                      type="text"
                      value={editFormData.tmtMenjabat || ''}
                      onChange={e => setEditFormData({ ...editFormData, tmtMenjabat: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                      placeholder="01 Juli 2021"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-800 font-bold text-xs flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                        <span>Link Foto / Avatar Kepala Satuan Pendidikan</span>
                      </label>
                      {editFormData.fotoKepalaSekolah && (
                        <button
                          type="button"
                          onClick={() => setEditFormData({ ...editFormData, fotoKepalaSekolah: '' })}
                          className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                        {editFormData.fotoKepalaSekolah ? (
                          <SafeImage
                            src={editFormData.fotoKepalaSekolah}
                            fallbackNode={
                              <span className="font-bold text-amber-700 text-sm">
                                {editFormData.kepalaSekolah.substring(0, 1) || 'K'}
                              </span>
                            }
                            alt="Foto"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="font-bold text-amber-700 text-sm">
                            {editFormData.kepalaSekolah ? editFormData.kepalaSekolah.substring(0, 1) : 'K'}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 space-y-1.5">
                        <input
                          type="url"
                          value={editFormData.fotoKepalaSekolah || ''}
                          onChange={e => setEditFormData({ ...editFormData, fotoKepalaSekolah: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-sky-500"
                          placeholder="https://contoh.com/foto-kepala-sekolah.jpg"
                        />
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-amber-800 border border-slate-200 text-[10px] font-bold flex items-center gap-1 transition-colors">
                            <Upload className="w-3 h-3 text-amber-600" />
                            <span>Unggah Foto</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const compressed = await compressImage(file);
                                    setEditFormData({ ...editFormData, fotoKepalaSekolah: compressed });
                                  } catch (err) {
                                    console.error('Failed to compress, using fallback:', err);
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setEditFormData({ ...editFormData, fotoKepalaSekolah: reader.result as string });
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }
                              }}
                            />
                          </label>
                          <span className="text-[10px] text-slate-500">Mendukung URL langsung atau file gambar</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 font-semibold">Operator Dapodik Sekolah</label>
                    <input
                      type="text"
                      value={editFormData.operatorSekolah || ''}
                      onChange={e => setEditFormData({ ...editFormData, operatorSekolah: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 font-semibold">Bendahara Dana BOS</label>
                    <input
                      type="text"
                      value={editFormData.bendaharaBos || ''}
                      onChange={e => setEditFormData({ ...editFormData, bendaharaBos: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-slate-700 font-semibold">Ketua Komite Sekolah</label>
                    <input
                      type="text"
                      value={editFormData.komiteSekolah || ''}
                      onChange={e => setEditFormData({ ...editFormData, komiteSekolah: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Section Rekapitulasi & Fasilitas */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                  3. Rekapitulasi Luas & Fasilitas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-700 font-semibold">Luas Tanah Milik (m²)</label>
                    <input
                      type="text"
                      value={editFormData.luasTanah || ''}
                      onChange={e => setEditFormData({ ...editFormData, luasTanah: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                      placeholder="12.500 m²"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 font-semibold">Luas Bangunan (m²)</label>
                    <input
                      type="text"
                      value={editFormData.luasBangunan || ''}
                      onChange={e => setEditFormData({ ...editFormData, luasBangunan: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                      placeholder="4.850 m²"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 font-semibold">Daya Tampung Siswa</label>
                    <input
                      type="text"
                      value={editFormData.dayaTampung || ''}
                      onChange={e => setEditFormData({ ...editFormData, dayaTampung: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                      placeholder="384 Siswa (12 Rombel)"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 font-semibold">Jumlah Rombel</label>
                    <input
                      type="text"
                      value={editFormData.jumlahRombel || ''}
                      onChange={e => setEditFormData({ ...editFormData, jumlahRombel: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                      placeholder="12 Rombel"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-slate-700 font-semibold">Keterangan / Catatan Tambahan</label>
                    <input
                      type="text"
                      value={editFormData.keterangan || ''}
                      onChange={e => setEditFormData({ ...editFormData, keterangan: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                      placeholder="Sekolah Ramah Anak, Adiwiyata Mandiri..."
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white/95 py-2 backdrop-blur">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold flex items-center gap-2 shadow-md shadow-sky-600/20 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
