import React, { useState, useRef, useMemo } from 'react';
import { SafeImage } from './SafeImage';
import { 
  Users, 
  Plus, 
  Search, 
  Download, 
  Upload, 
  Edit3, 
  Trash2, 
  FileSpreadsheet, 
  UserCheck, 
  ArrowLeft, 
  Filter, 
  CheckCircle2, 
  CreditCard, 
  X, 
  AlertCircle,
  FileDown,
  Eye,
  FileCheck,
  Building,
  User,
  HeartHandshake,
  MapPin,
  Sparkles,
  Info,
  ChevronDown,
  RotateCcw,
  GraduationCap,
  Calendar
} from 'lucide-react';
import { Student } from '../types';
import { formatDateIndonesian, formatDateForInput } from '../utils/dateUtils';
import { exportToCSV } from '../services/googleSheetsService';
import { 
  downloadStudentExcelTemplate, 
  downloadStudentCSVTemplate, 
  parseStudentImportFile,
  DAPODIK_STUDENT_HEADERS,
  exportStudentsToExcel
} from '../utils/studentTemplateHelper';

export const normalizeTahunLulus = (val?: any): string => {
  if (!val) return '2025';
  const str = String(val).trim();
  if (!str) return '2025';
  if (str.includes('/')) {
    const parts = str.split('/').map(p => p.trim());
    return parts[parts.length - 1] || parts[0] || '2025';
  }
  return str;
};

interface StudentModuleProps {
  students: Student[];
  studentsKeluar?: Student[];
  alumni?: Student[];
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onImportStudents?: (newStudents: Student[], append: boolean) => void;
  onMoveToStudentKeluar?: (id: string, reason: 'Mutasi' | 'Putus sekolah' | 'Wafat/Meninggal' | 'Dikeluarkan' | 'Mengundurkan diri') => void;
  onDeleteStudentKeluar?: (id: string) => void;
  onGraduateStudent?: (id: string, tahunLulus: string, noSeriIjazah?: string) => void;
  onRestoreStudent?: (id: string) => void;
  onBackToHome: () => void;
  onSync: () => void;
  schoolProfile?: any;
  displayConfig?: any;
}

export const StudentModule: React.FC<StudentModuleProps> = ({
  students,
  studentsKeluar = [],
  alumni = [],
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onImportStudents,
  onMoveToStudentKeluar,
  onDeleteStudentKeluar,
  onGraduateStudent,
  onRestoreStudent,
  onBackToHome,
  onSync,
  schoolProfile,
  displayConfig
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'aktif' | 'keluar' | 'alumni'>('aktif');
  const [movingStudent, setMovingStudent] = useState<Student | null>(null);
  const [graduatingStudent, setGraduatingStudent] = useState<Student | null>(null);
  const [graduationTahunLulus, setGraduationTahunLulus] = useState<string>('2025');
  const [graduationNoSeriIjazah, setGraduationNoSeriIjazah] = useState<string>('');
  const [search, setSearch] = useState('');
  const [filterRombel, setFilterRombel] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterTahunLulus, setFilterTahunLulus] = useState('ALL');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<Student | null>(null);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<{ id: string; name: string } | null>(null);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  
  // Import preview modal state
  const [importedPreviewStudents, setImportedPreviewStudents] = useState<Student[]>([]);
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  
  // Form active tab in Add/Edit modal
  const [formActiveTab, setFormActiveTab] = useState<'biodata' | 'orangtua' | 'bantuan' | 'periodik'>('biodata');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<Student, 'id'>>({
    nisn: '',
    nik: '',
    nama: '',
    jenisKelamin: 'L',
    tempatLahir: '',
    tanggalLahir: '',
    rombel: 'IX. Moh Hatta',
    namaIbu: '',
    alamat: '',
    status: 'Aktif',
    agama: 'Islam',
    
    nis: '',
    rt: '',
    rw: '',
    dusun: '',
    kelurahan: '',
    kecamatan: '',
    kodePos: '',
    jenisTinggal: 'Bersama orang tua',
    alatTransportasi: 'Sepeda Motor',
    telepon: '',
    hp: '',
    email: '',
    skhun: '',
    penerimaKps: 'Tidak',
    noKps: '',
    namaAyah: '',
    tahunLahirAyah: '',
    jenjangPendidikanAyah: 'SMA',
    pekerjaanAyah: 'Wiraswasta',
    penghasilanAyah: 'Rp 3.000.000 - Rp 5.000.000',
    nikAyah: '',
    tahunLahirIbu: '',
    jenjangPendidikanIbu: 'SMA',
    pekerjaanIbu: 'Ibu Rumah Tangga',
    penghasilanIbu: 'Tidak Berpenghasilan',
    nikIbu: '',
    namaWali: '',
    tahunLahirWali: '',
    jenjangPendidikanWali: '',
    pekerjaanWali: '',
    penghasilanWali: '',
    nikWali: '',
    rombelSaatIni: 'IX. Moh Hatta',
    noPesertaUn: '',
    noSeriIjazah: '',
    penerimaKip: 'Tidak',
    nomorKip: '',
    namaDiKip: '',
    nomorKks: '',
    noRegistrasiAktaLahir: '',
    bank: 'BRI',
    nomorRekeningBank: '',
    rekeningAtasNama: '',
    layakPip: 'Tidak',
    alasanLayakPip: '',
    kebutuhanKhusus: 'Tidak ada',
    sekolahAsal: '',
    anakKeBerapa: '1',
    lintang: '',
    bujur: '',
    noKk: '',
    beratBadan: '',
    tinggiBadan: '',
    lingkarKepala: '',
    jmlSaudaraKandung: '1',
    jarakRumahKeSekolah: '1',
    tahunLulus: ''
  });

  const safeStudents = useMemo(() => Array.isArray(students) ? students : [], [students]);
  const safeStudentsKeluar = useMemo(() => Array.isArray(studentsKeluar) ? studentsKeluar : [], [studentsKeluar]);
  const safeAlumni = useMemo(() => Array.isArray(alumni) ? alumni : [], [alumni]);

  const currentStudentsList = useMemo(() => {
    if (activeSubTab === 'aktif') return safeStudents;
    if (activeSubTab === 'keluar') return safeStudentsKeluar;
    return safeAlumni;
  }, [activeSubTab, safeStudents, safeStudentsKeluar, safeAlumni]);

  const rombelOptions = useMemo(() => {
    const set = new Set<string>();
    if (Array.isArray(currentStudentsList)) {
      currentStudentsList.forEach(s => {
        const r1 = String(s.rombel || '').trim();
        const r2 = String(s.rombelSaatIni || '').trim();
        if (r1) set.add(r1);
        if (r2) set.add(r2);
      });
    }

    const sorted = Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );

    return ['ALL', ...sorted];
  }, [currentStudentsList]);

  const modalRombelOptions = useMemo(() => {
    const set = new Set<string>();
    [...safeStudents, ...safeStudentsKeluar, ...safeAlumni].forEach(s => {
      const r1 = String(s.rombel || '').trim();
      const r2 = String(s.rombelSaatIni || '').trim();
      if (r1) set.add(r1);
      if (r2) set.add(r2);
    });
    const rForm = String(formData.rombel || '').trim();
    if (rForm) set.add(rForm);

    if (set.size === 0) {
      ['Kelas 7A', 'Kelas 8A', 'Kelas 9A'].forEach(d => set.add(d));
    }

    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [safeStudents, safeStudentsKeluar, safeAlumni, formData.rombel]);

  const tahunLulusOptions = useMemo(() => {
    const set = new Set<string>();
    safeAlumni.forEach(s => {
      const yearStr = normalizeTahunLulus(s.tahunLulus);
      if (yearStr) {
        set.add(yearStr);
      }
    });
    // Add default graduation years (single 4-digit years)
    ['2026', '2025', '2024', '2023', '2022', '2021', '2020'].forEach(y => set.add(y));
    const sorted = Array.from(set).sort((a, b) => b.localeCompare(a));
    return ['ALL', ...sorted];
  }, [safeAlumni]);

  const filteredStudents = useMemo(() => {
    return currentStudentsList.filter(s => {
      if (!s) return false;
      const queryStr = String(search || '').toLowerCase().trim();

      let matchSearch = true;
      if (queryStr) {
        const namaStr = String(s.nama || '').toLowerCase();
        const nisnStr = String(s.nisn || '').toLowerCase();
        const nikStr = String(s.nik || '').toLowerCase();
        const nisStr = String(s.nis || '').toLowerCase();
        const namaIbuStr = String(s.namaIbu || '').toLowerCase();
        const namaAyahStr = String(s.namaAyah || '').toLowerCase();
        const rombelStr = String(s.rombel || '').toLowerCase();
        const rombelSaatIniStr = String(s.rombelSaatIni || '').toLowerCase();
        const tempatLahirStr = String(s.tempatLahir || '').toLowerCase();
        const statusStr = String(s.status || '').toLowerCase();
        const alasanKeluarStr = String(s.alasanKeluar || '').toLowerCase();
        const tahunLulusStr = String(s.tahunLulus || '').toLowerCase();
        const noSeriIjazahStr = String(s.noSeriIjazah || '').toLowerCase();

        matchSearch = namaStr.includes(queryStr) || 
                      nisnStr.includes(queryStr) || 
                      nikStr.includes(queryStr) ||
                      nisStr.includes(queryStr) ||
                      namaIbuStr.includes(queryStr) ||
                      namaAyahStr.includes(queryStr) ||
                      rombelStr.includes(queryStr) ||
                      rombelSaatIniStr.includes(queryStr) ||
                      tempatLahirStr.includes(queryStr) ||
                      statusStr.includes(queryStr) ||
                      alasanKeluarStr.includes(queryStr) ||
                      tahunLulusStr.includes(queryStr) ||
                      noSeriIjazahStr.includes(queryStr);
      }

      const matchRombel = filterRombel === 'ALL' || s.rombel === filterRombel || s.rombelSaatIni === filterRombel;
      const matchStatus = filterStatus === 'ALL' || s.status === filterStatus;
      const matchTahunLulus = filterTahunLulus === 'ALL' || 
                              (s.tahunLulus && String(s.tahunLulus).trim().includes(filterTahunLulus));

      return matchSearch && matchRombel && matchStatus && matchTahunLulus;
    });
  }, [currentStudentsList, search, filterRombel, filterStatus, filterTahunLulus]);

  const handleResetFilters = () => {
    setSearch('');
    setFilterRombel('ALL');
    setFilterStatus('ALL');
    setFilterTahunLulus('ALL');
  };

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setFormActiveTab('biodata');
    setFormData({
      nisn: '00' + Math.floor(10000000 + Math.random() * 90000000),
      nik: '7201' + Math.floor(100000000000 + Math.random() * 900000000000),
      nama: '',
      jenisKelamin: 'L',
      tempatLahir: 'Jakarta',
      tanggalLahir: '2011-01-01',
      rombel: 'Kelas 7A',
      namaIbu: '',
      alamat: '',
      status: 'Aktif',
      agama: 'Islam',
      nis: '242507' + Math.floor(100 + Math.random() * 900),
      rt: '001',
      rw: '001',
      dusun: 'Dusun I',
      kelurahan: '',
      kecamatan: '',
      kodePos: '',
      jenisTinggal: 'Bersama orang tua',
      alatTransportasi: 'Sepeda Motor',
      telepon: '',
      hp: '',
      email: '',
      skhun: '',
      penerimaKps: 'Tidak',
      noKps: '-',
      namaAyah: '',
      tahunLahirAyah: '1980',
      jenjangPendidikanAyah: 'SMA',
      pekerjaanAyah: 'Wiraswasta',
      penghasilanAyah: 'Rp 2.000.000 - Rp 5.000.000',
      nikAyah: '',
      tahunLahirIbu: '1984',
      jenjangPendidikanIbu: 'SMA',
      pekerjaanIbu: 'Ibu Rumah Tangga',
      penghasilanIbu: 'Tidak Berpenghasilan',
      nikIbu: '',
      namaWali: '-',
      tahunLahirWali: '-',
      jenjangPendidikanWali: '-',
      pekerjaanWali: '-',
      penghasilanWali: '-',
      nikWali: '-',
      rombelSaatIni: 'Kelas 7A',
      noPesertaUn: '',
      noSeriIjazah: '',
      penerimaKip: 'Tidak',
      nomorKip: '-',
      namaDiKip: '-',
      nomorKks: '-',
      noRegistrasiAktaLahir: '',
      bank: 'BRI',
      nomorRekeningBank: '',
      rekeningAtasNama: '',
      layakPip: 'Tidak',
      alasanLayakPip: '-',
      kebutuhanKhusus: 'Tidak ada',
      sekolahAsal: 'SD Negeri',
      anakKeBerapa: '1',
      lintang: '-0.8912',
      bujur: '119.8765',
      noKk: '7201' + Math.floor(100000000000 + Math.random() * 900000000000),
      beratBadan: '45',
      tinggiBadan: '155',
      lingkarKepala: '52',
      jmlSaudaraKandung: '2',
      jarakRumahKeSekolah: '1.5',
      tahunLulus: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormActiveTab('biodata');
    setFormData({
      nisn: student.nisn || '',
      nik: student.nik || '',
      nama: student.nama || '',
      jenisKelamin: student.jenisKelamin || 'L',
      tempatLahir: student.tempatLahir || '',
      tanggalLahir: student.tanggalLahir ? formatDateIndonesian(student.tanggalLahir) : '',
      rombel: student.rombel || 'Kelas 7A',
      namaIbu: student.namaIbu || '',
      alamat: student.alamat || '',
      status: student.status || 'Aktif',
      agama: student.agama || 'Islam',
      nis: student.nis || '',
      rt: student.rt || '',
      rw: student.rw || '',
      dusun: student.dusun || '',
      kelurahan: student.kelurahan || '',
      kecamatan: student.kecamatan || '',
      kodePos: student.kodePos || '',
      jenisTinggal: student.jenisTinggal || 'Bersama orang tua',
      alatTransportasi: student.alatTransportasi || 'Sepeda Motor',
      telepon: student.telepon || '',
      hp: student.hp || '',
      email: student.email || '',
      skhun: student.skhun || '',
      penerimaKps: student.penerimaKps || 'Tidak',
      noKps: student.noKps || '',
      namaAyah: student.namaAyah || '',
      tahunLahirAyah: student.tahunLahirAyah || '',
      jenjangPendidikanAyah: student.jenjangPendidikanAyah || 'SMA',
      pekerjaanAyah: student.pekerjaanAyah || 'Wiraswasta',
      penghasilanAyah: student.penghasilanAyah || '',
      nikAyah: student.nikAyah || '',
      tahunLahirIbu: student.tahunLahirIbu || '',
      jenjangPendidikanIbu: student.jenjangPendidikanIbu || 'SMA',
      pekerjaanIbu: student.pekerjaanIbu || 'Ibu Rumah Tangga',
      penghasilanIbu: student.penghasilanIbu || '',
      nikIbu: student.nikIbu || '',
      namaWali: student.namaWali || '',
      tahunLahirWali: student.tahunLahirWali || '',
      jenjangPendidikanWali: student.jenjangPendidikanWali || '',
      pekerjaanWali: student.pekerjaanWali || '',
      penghasilanWali: student.penghasilanWali || '',
      nikWali: student.nikWali || '',
      rombelSaatIni: student.rombelSaatIni || student.rombel || 'Kelas 7A',
      noPesertaUn: student.noPesertaUn || '',
      noSeriIjazah: student.noSeriIjazah || '',
      penerimaKip: student.penerimaKip || 'Tidak',
      nomorKip: student.nomorKip || '',
      namaDiKip: student.namaDiKip || '',
      nomorKks: student.nomorKks || '',
      noRegistrasiAktaLahir: student.noRegistrasiAktaLahir || '',
      bank: student.bank || 'BRI',
      nomorRekeningBank: student.nomorRekeningBank || '',
      rekeningAtasNama: student.rekeningAtasNama || '',
      layakPip: student.layakPip || 'Tidak',
      alasanLayakPip: student.alasanLayakPip || '',
      kebutuhanKhusus: student.kebutuhanKhusus || 'Tidak ada',
      sekolahAsal: student.sekolahAsal || '',
      anakKeBerapa: student.anakKeBerapa || '1',
      lintang: student.lintang || '',
      bujur: student.bujur || '',
      noKk: student.noKk || '',
      beratBadan: student.beratBadan || '',
      tinggiBadan: student.tinggiBadan || '',
      lingkarKepala: student.lingkarKepala || '',
      jmlSaudaraKandung: student.jmlSaudaraKandung || '1',
      jarakRumahKeSekolah: student.jarakRumahKeSekolah || '1',
      tahunLulus: student.tahunLulus || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.nisn) {
      alert('Nama dan NISN wajib diisi');
      return;
    }

    const cleanedFormData = {
      ...formData,
      tanggalLahir: formatDateIndonesian(formData.tanggalLahir)
    };

    if (editingStudent) {
      onUpdateStudent({
        ...cleanedFormData,
        id: editingStudent.id
      });
    } else {
      onAddStudent({
        ...cleanedFormData,
        id: `std-${Date.now().toString().slice(-6)}`
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    setDeletingStudent({ id, name });
  };

  const confirmDeleteStudent = () => {
    if (deletingStudent) {
      if (activeSubTab === 'aktif') {
        onDeleteStudent(deletingStudent.id);
      } else {
        if (onDeleteStudentKeluar) {
          onDeleteStudentKeluar(deletingStudent.id);
        }
      }
      setDeletingStudent(null);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(students, 'DAPODIK_DATA_SISWA_LENGKAP');
  };

  // Upload handler supporting .xlsx, .xls, .csv
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportFileName(file.name);
      const { students: parsedStudents, totalParsed } = await parseStudentImportFile(file);

      if (parsedStudents.length === 0) {
        alert('Tidak ada baris data siswa yang berhasil terbaca dari file.');
        return;
      }

      setImportedPreviewStudents(parsedStudents);
      setIsImportPreviewOpen(true);
    } catch (err: any) {
      alert(`Gagal membaca file impor: ${err?.message || 'Format tidak didukung'}`);
    } finally {
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Confirm import into database
  const handleConfirmImport = (append: boolean) => {
    if (importedPreviewStudents.length === 0) return;

    if (onImportStudents) {
      onImportStudents(importedPreviewStudents, append);
    } else {
      if (!append) {
        students.forEach(s => onDeleteStudent(s.id));
      }
      importedPreviewStudents.forEach(newStd => {
        onAddStudent(newStd);
      });
    }

    setIsImportPreviewOpen(false);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Aktif':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200/80';
      case 'Mutasi':
        return 'bg-blue-50 text-blue-700 border border-blue-200/80';
      case 'Putus sekolah':
        return 'bg-orange-50 text-orange-700 border border-orange-200/80';
      case 'Wafat/Meninggal':
        return 'bg-purple-50 text-purple-700 border border-purple-200/80';
      case 'Dikeluarkan':
        return 'bg-rose-50 text-rose-700 border border-rose-200/80';
      case 'Mengundurkan diri':
        return 'bg-amber-50 text-amber-700 border border-amber-200/80';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input for Excel / CSV */}
      <input 
        ref={fileInputRef}
        type="file" 
        accept=".xlsx, .xls, .csv" 
        onChange={handleFileUpload} 
        className="hidden" 
      />

      {/* Header Bar */}
      <div className="sticky top-[57px] z-30 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/95 backdrop-blur-xl border border-sky-100/90 p-5 rounded-2xl shadow-md transition-all">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200/60 transition-colors"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Data Peserta Didik (Siswa)</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                {students.length} Siswa Terdaftar
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Pengelolaan biodata standar Dapodik
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Unduh Template Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
              className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-rose-500/20 cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-white" />
              <span>Unduh Format Template</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-white" />
            </button>

            {isTemplateMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 backdrop-blur-xl space-y-1"
                onMouseLeave={() => setIsTemplateMenuOpen(false)}
              >
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-100">
                  Pilih Format Template (66 Kolom):
                </div>
                <button
                  onClick={() => {
                    downloadStudentExcelTemplate();
                    setIsTemplateMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center gap-2 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-900">Template Excel (.xlsx)</div>
                    <div className="text-[10px] text-slate-500">Direkomendasikan (66 Kolom Dapodik)</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    downloadStudentCSVTemplate();
                    setIsTemplateMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-sky-50 text-sky-700 text-xs font-medium flex items-center gap-2 transition-colors"
                >
                  <FileDown className="w-4 h-4 text-sky-600 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-900">Template CSV (.csv)</div>
                    <div className="text-[10px] text-slate-500">Format text comma-separated</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Impor Excel / CSV */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-amber-400/20 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-slate-900" />
            <span>Impor Data Siswa</span>
          </button>

          {/* Ekspor Spreadsheet */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 cursor-pointer"
            >
              <Download className="w-4 h-4 text-white" />
              <span>Ekspor Data</span>
              <ChevronDown className="w-3.5 h-3.5 text-white" />
            </button>

            {isExportMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 backdrop-blur-xl space-y-1"
                onMouseLeave={() => setIsExportMenuOpen(false)}
              >
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-100">
                  Pilih Format & Cakupan Data:
                </div>
                
                {/* 1. Ekspor Excel: Semua Kelas */}
                <button
                  onClick={() => {
                    exportStudentsToExcel(students, 'ALL');
                    setIsExportMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center gap-2 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-900 text-[11px]">Ekspor Excel (.xlsx) - Semua Kelas</div>
                    <div className="text-[10px] text-slate-500">Seluruh data siswa dari database</div>
                  </div>
                </button>

                {/* 2. Ekspor Excel: Kelas Terpilih */}
                {filterRombel !== 'ALL' && (
                  <button
                    onClick={() => {
                      exportStudentsToExcel(students, filterRombel);
                    setIsExportMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-50 text-amber-700 text-xs font-medium flex items-center gap-2 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-900 text-[11px]">Ekspor Excel (.xlsx) - {filterRombel}</div>
                    <div className="text-[10px] text-slate-500">Hanya data kelas/rombel yang aktif</div>
                  </div>
                </button>
              )}

                {/* 3. Ekspor CSV: Semua Data */}
                <button
                  onClick={() => {
                    handleExportCSV();
                    setIsExportMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-sky-50 text-sky-700 text-xs font-medium flex items-center gap-2 transition-colors"
                >
                  <FileDown className="w-4 h-4 text-sky-600 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-900 text-[11px]">Ekspor CSV (.csv) - Semua Data</div>
                    <div className="text-[10px] text-slate-500">Format text kompresi universal</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Tambah Siswa Baru */}
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-sm shadow-sky-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span className="text-white">Tambah Siswa</span>
          </button>
        </div>
      </div>

      {/* Quick Info Banner for Dapodik Kemendikbudristek */}
      <div className="bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-400/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm">Integrasi Dapodik Kemendikbudristek</div>
            <p className="text-slate-600 text-[11px]">
              Mendukung impor/ekspor data siswa lengkap
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation Siswa Aktif vs Siswa Keluar vs Alumni */}
      <div className="bg-white/95 backdrop-blur-xl border border-sky-100/90 p-2 rounded-2xl shadow-sm flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <button
          type="button"
          onClick={() => {
            setActiveSubTab('aktif');
            setSearch('');
            setFilterRombel('ALL');
            setFilterStatus('ALL');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'aktif'
              ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/25 border border-sky-700/20'
              : 'bg-sky-50/70 hover:bg-sky-100 text-sky-800 border border-sky-200/60'
          }`}
        >
          <Users className={`w-4 h-4 ${activeSubTab === 'aktif' ? 'text-white' : 'text-sky-600'}`} />
          <span>Siswa Aktif</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeSubTab === 'aktif' ? 'bg-white/20 text-white' : 'bg-sky-200/80 text-sky-800'
          }`}>
            {students.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab('keluar');
            setSearch('');
            setFilterRombel('ALL');
            setFilterStatus('ALL');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'keluar'
              ? 'bg-[#ff7a00] hover:bg-[#f06e00] text-white shadow-md shadow-orange-500/30 border border-orange-600/20'
              : 'bg-orange-50/80 hover:bg-orange-100 text-orange-800 border border-orange-200/60'
          }`}
        >
          <UserCheck className={`w-4 h-4 rotate-180 ${activeSubTab === 'keluar' ? 'text-white' : 'text-[#ff7a00]'}`} />
          <span>Siswa Keluar / Mutasi</span>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
            activeSubTab === 'keluar' ? 'bg-black/15 text-white' : 'bg-orange-200/80 text-orange-900'
          }`}>
            {studentsKeluar.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab('alumni');
            setSearch('');
            setFilterRombel('ALL');
            setFilterStatus('ALL');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'alumni'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 border border-emerald-700/20'
              : 'bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60'
          }`}
        >
          <GraduationCap className={`w-4 h-4 ${activeSubTab === 'alumni' ? 'text-white' : 'text-emerald-600'}`} />
          <span>Alumni</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
            activeSubTab === 'alumni' ? 'bg-white/20 text-white' : 'bg-emerald-200/80 text-emerald-800'
          }`}>
            {alumni.length}
          </span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white/95 p-4 rounded-xl border border-slate-200 shadow-sm backdrop-blur-md">
          <div className={`${activeSubTab === 'alumni' ? 'sm:col-span-4' : 'sm:col-span-5'} relative`}>
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan Nama Siswa, NISN, NIK, NIS, Ibu, Ayah, Tahun Lulus..."
              className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-sky-500 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-md"
                title="Hapus kata kunci pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className={`${activeSubTab === 'alumni' ? 'sm:col-span-3' : 'sm:col-span-4'} flex items-center gap-2`}>
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={filterRombel}
              onChange={(e) => setFilterRombel(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500 transition-colors"
            >
              {rombelOptions.map(r => (
                <option key={r} value={r}>
                  {r === 'ALL' ? (activeSubTab === 'alumni' ? 'Semua Rombel Terakhir' : 'Semua Rombel (Kelas)') : r}
                </option>
              ))}
            </select>
          </div>

          <div className={`${activeSubTab === 'alumni' ? 'sm:col-span-2' : 'sm:col-span-3'}`}>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500 transition-colors"
            >
              {activeSubTab === 'aktif' ? (
                <>
                  <option value="ALL">Semua Status Siswa Aktif ({students.length})</option>
                  <option value="Aktif">Aktif</option>
                </>
              ) : activeSubTab === 'keluar' ? (
                <>
                  <option value="ALL">Semua Status Siswa Keluar / Mutasi ({studentsKeluar.length})</option>
                  <option value="Mutasi">Mutasi</option>
                  <option value="Putus sekolah">Putus sekolah</option>
                  <option value="Wafat/Meninggal">Wafat/Meninggal</option>
                  <option value="Dikeluarkan">Dikeluarkan</option>
                  <option value="Mengundurkan diri">Mengundurkan diri</option>
                  <option value="Keluar">Keluar</option>
                </>
              ) : (
                <>
                  <option value="ALL">Semua Status ({alumni.length})</option>
                  <option value="Lulus">Lulus</option>
                </>
              )}
            </select>
          </div>

          {activeSubTab === 'alumni' && (
            <div className="sm:col-span-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <select
                value={filterTahunLulus}
                onChange={(e) => setFilterTahunLulus(e.target.value)}
                className="w-full py-2 px-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 focus:bg-white focus:outline-none focus:border-emerald-600 transition-colors"
              >
                <option value="ALL">Semua Tahun Lulus</option>
                {tahunLulusOptions.filter(y => y !== 'ALL').map(y => (
                  <option key={y} value={y}>Tahun Lulus: {y}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Filter status & clear filter banner */}
        {(search || filterRombel !== 'ALL' || filterStatus !== 'ALL' || filterTahunLulus !== 'ALL') && (
          <div className="flex items-center justify-between px-3.5 py-2 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>
                Menampilkan <strong>{filteredStudents.length}</strong> dari total <strong>{currentStudentsList.length}</strong> siswa
                {activeSubTab === 'alumni' ? ' alumni' : activeSubTab === 'keluar' ? ' keluar / mutasi' : ' aktif'}
                {search && <> dengan kata kunci "<em>{search}</em>"</>}
              </span>
            </div>
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-sky-100 text-sky-800 font-bold text-[11px] border border-sky-300 transition-colors flex items-center gap-1 shrink-0"
            >
              <RotateCcw className="w-3 h-3 text-sky-600" />
              Tampilkan Semua ({currentStudentsList.length})
            </button>
          </div>
        )}
      </div>

      {/* Table of Students */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[650px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-left text-xs text-slate-700 relative border-collapse">
            <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-3.5 px-4">No</th>
                <th className="py-3.5 px-4">NISN & NIS</th>
                <th className="py-3.5 px-4">Nama Lengkap & NIK</th>
                <th className="py-3.5 px-4">L/P</th>
                <th className="py-3.5 px-4">{activeSubTab === 'alumni' ? 'Rombel Terakhir' : 'Rombel'}</th>
                <th className="py-3.5 px-4">Tempat, Tgl Lahir</th>
                <th className="py-3.5 px-4">Nama Orang Tua</th>
                <th className="py-3.5 px-4">Bantuan PIP/KIP</th>
                <th className="py-3.5 px-4">Status</th>
                {activeSubTab === 'alumni' && (
                  <th className="py-3.5 px-4 text-emerald-700 font-bold">Tahun Lulus</th>
                )}
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={activeSubTab === 'alumni' ? 11 : 10} className="py-12 text-center text-slate-500">
                    <AlertCircle className="w-9 h-9 mx-auto mb-2 text-slate-400" />
                    <p className="font-semibold text-sm text-slate-700">
                      {currentStudentsList.length > 0 
                        ? 'Tidak ada data siswa yang cocok dengan pencarian / filter ini.'
                        : activeSubTab === 'alumni'
                          ? 'Belum ada data alumni terdaftar.'
                          : activeSubTab === 'keluar' 
                            ? 'Belum ada data siswa keluar / mutasi.' 
                            : 'Belum ada data siswa terdaftar.'}
                    </p>
                    {currentStudentsList.length > 0 ? (
                      <button
                        onClick={handleResetFilters}
                        className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Tampilkan Semua Siswa ({currentStudentsList.length} data)
                      </button>
                    ) : (
                      <p className="text-xs text-slate-400 mt-1">Gunakan tombol "Unduh Format Template" lalu klik "Impor Data Siswa" untuk mengisi data secara cepat.</p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-sky-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono">
                      <div className="text-sky-700 font-bold">{student.nisn}</div>
                      <div className="text-[10px] text-slate-400">NIS: {student.nis || '-'}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          student.jenisKelamin === 'L' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-rose-100 text-rose-700 border border-rose-200'
                        }`}>
                          {String(student.nama || '').charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{student.nama}</div>
                          <div className="text-[10px] text-slate-400 font-mono">NIK: {student.nik}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        student.jenisKelamin === 'L' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {student.jenisKelamin === 'L' ? 'L' : 'P'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-slate-700 border border-slate-200">
                        {student.rombel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="font-medium text-slate-800">{student.tempatLahir}</div>
                      <div className="text-[10px] text-slate-400">{formatDateIndonesian(student.tanggalLahir)}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="text-[11px] font-medium text-slate-800">Ibu: {student.namaIbu || '-'}</div>
                      <div className="text-[10px] text-slate-400">Ayah: {student.namaAyah || '-'}</div>
                    </td>
                    <td className="py-3 px-4">
                      {student.penerimaKip === 'Ya' || student.layakPip === 'Ya' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          KIP / PIP
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Non-Bantuan</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusStyle(student.status || 'Aktif')}`}>
                        {student.status}
                      </span>
                    </td>
                    {activeSubTab === 'alumni' && (
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 font-bold text-emerald-800 border border-emerald-200 flex items-center gap-1.5 w-fit">
                          <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{normalizeTahunLulus(student.tahunLulus) || '2025'}</span>
                        </span>
                      </td>
                    )}
                    <td className="py-3 px-4 text-center">
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionId(openActionId === student.id ? null : student.id);
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs cursor-pointer ${
                            openActionId === student.id
                              ? 'bg-sky-600 text-white border-sky-600 shadow-md'
                              : 'bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border-slate-300 hover:border-sky-300'
                          }`}
                          title="Pilih Aksi"
                        >
                          <span>Aksi</span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openActionId === student.id ? 'rotate-180 text-white' : 'text-slate-400'}`} />
                        </button>

                        {openActionId === student.id && (
                          <>
                            {/* Invisible backdrop to close menu when clicking outside */}
                            <div 
                              className="fixed inset-0 z-20 cursor-default" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionId(null);
                              }} 
                            />
                            <div 
                              className={`absolute right-0 z-30 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 text-xs text-slate-700 divide-y divide-slate-100 ${
                                idx >= filteredStudents.length - 2 && filteredStudents.length > 2
                                  ? 'bottom-full mb-1.5 origin-bottom-right'
                                  : 'top-full mt-1.5 origin-top-right'
                              }`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="py-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionId(null);
                                    setSelectedStudentForDetail(student);
                                  }}
                                  className="w-full text-left px-3.5 py-2 hover:bg-sky-50 text-slate-700 hover:text-sky-700 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                                >
                                  <div className="w-6 h-6 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 border border-sky-200">
                                    <Eye className="w-3.5 h-3.5" />
                                  </div>
                                  <span>Lihat Detail (66 Kolom)</span>
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionId(null);
                                    setSelectedStudentForCard(student);
                                  }}
                                  className="w-full text-left px-3.5 py-2 hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                                >
                                  <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
                                    <CreditCard className="w-3.5 h-3.5" />
                                  </div>
                                  <span>Cetak Kartu Pelajar</span>
                                </button>

                                {activeSubTab === 'aktif' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionId(null);
                                        handleOpenEditModal(student);
                                      }}
                                      className="w-full text-left px-3.5 py-2 hover:bg-amber-50 text-slate-700 hover:text-amber-700 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                                    >
                                      <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </div>
                                      <span>Edit Biodata Siswa</span>
                                    </button>
                                    
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionId(null);
                                        setGraduatingStudent(student);
                                        setGraduationTahunLulus(normalizeTahunLulus(student.tahunLulus) || '2025');
                                        setGraduationNoSeriIjazah(student.noSeriIjazah || '');
                                      }}
                                      className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                                    >
                                      <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                                        <GraduationCap className="w-3.5 h-3.5" />
                                      </div>
                                      <span>Luluskan (Alumni)</span>
                                    </button>
                                    
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionId(null);
                                        setMovingStudent(student);
                                      }}
                                      className="w-full text-left px-3.5 py-2 hover:bg-fuchsia-50 text-slate-700 hover:text-fuchsia-700 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                                    >
                                      <div className="w-6 h-6 rounded-lg bg-fuchsia-50 text-fuchsia-700 flex items-center justify-center shrink-0 border border-fuchsia-200">
                                        <UserCheck className="w-3.5 h-3.5" />
                                      </div>
                                      <span>Keluarkan / Mutasi</span>
                                    </button>
                                  </>
                                )}

                                {activeSubTab === 'alumni' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionId(null);
                                        handleOpenEditModal(student);
                                      }}
                                      className="w-full text-left px-3.5 py-2 hover:bg-amber-50 text-slate-700 hover:text-amber-700 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                                    >
                                      <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </div>
                                      <span>Edit Data Alumni</span>
                                    </button>
                                    {onRestoreStudent && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenActionId(null);
                                          onRestoreStudent(student.id);
                                        }}
                                        className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                                      >
                                        <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                                          <RotateCcw className="w-3.5 h-3.5" />
                                        </div>
                                        <span>Kembalikan ke Aktif</span>
                                      </button>
                                    )}
                                  </>
                                )}

                                {activeSubTab === 'keluar' && onRestoreStudent && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionId(null);
                                      onRestoreStudent(student.id);
                                    }}
                                    className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                                  >
                                    <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                                      <RotateCcw className="w-3.5 h-3.5" />
                                    </div>
                                    <span>Kembalikan ke Aktif</span>
                                  </button>
                                )}
                              </div>

                              <div className="py-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionId(null);
                                    handleDelete(student.id, student.nama);
                                  }}
                                  className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                                >
                                  <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </div>
                                  <span>Hapus Siswa</span>
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Import Preview */}
      {isImportPreviewOpen && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-50 flex items-start justify-center p-3 sm:p-5 pt-3 sm:pt-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Pratinjau Impor Data Siswa Dapodik</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {importedPreviewStudents.length} Siswa Terdeteksi
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    File: <span className="text-sky-700 font-mono font-bold">{importFileName}</span> &bull; 66 Kolom Berhasil Dipetakan
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsImportPreviewOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 text-xs text-sky-900 flex items-start gap-2.5">
                <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Verifikasi Kolom Dapodik: </span>
                  Sistem telah memverifikasi seluruh kolom nama, NISN, NIK, orang tua, bantuan, dan periodik. Silakan pilih metode penyimpanan di bawah ini.
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Nama Siswa</th>
                      <th className="py-2.5 px-3">NISN & NIK</th>
                      <th className="py-2.5 px-3">L/P</th>
                      <th className="py-2.5 px-3">Kelas</th>
                      <th className="py-2.5 px-3">Tempat, Tgl Lahir</th>
                      <th className="py-2.5 px-3">Nama Orang Tua</th>
                      <th className="py-2.5 px-3">KIP/PIP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {importedPreviewStudents.map((s, idx) => (
                      <tr key={idx} className="hover:bg-sky-50/50">
                        <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{s.nama}</td>
                        <td className="py-2 px-3 font-mono text-[11px]">
                          <span className="text-sky-700 font-bold">{s.nisn}</span> / <span className="text-slate-500">{s.nik}</span>
                        </td>
                        <td className="py-2 px-3">{s.jenisKelamin}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{s.rombel}</td>
                        <td className="py-2 px-3 text-[11px]">{s.tempatLahir}, {formatDateIndonesian(s.tanggalLahir)}</td>
                        <td className="py-2 px-3 text-[11px]">Ibu: {s.namaIbu || '-'} | Ayah: {s.namaAyah || '-'}</td>
                        <td className="py-2 px-3 text-[11px]">{s.penerimaKip === 'Ya' ? 'KIP' : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-600">
                Pilih apakah data baru ingin <strong className="text-slate-900">ditambahkan</strong> ke data lama atau <strong className="text-slate-900">menggantikan seluruh data</strong>.
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setIsImportPreviewOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs flex-1 sm:flex-none transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleConfirmImport(false)}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-all flex-1 sm:flex-none"
                >
                  Gantikan Semua Data
                </button>
                <button
                  onClick={() => handleConfirmImport(true)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tambahkan ke Database</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Student (66 Kolom Dapodik) */}
      {selectedStudentForDetail && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-50 flex items-start justify-center p-3 sm:p-5 pt-3 sm:pt-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[85vh] sm:max-h-[82vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-3.5 sm:p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-sky-100 border border-sky-200 flex items-center justify-center font-extrabold text-sky-700 text-base shrink-0">
                  {String(selectedStudentForDetail.nama || '').charAt(0) || '?'}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>{selectedStudentForDetail.nama}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                      {selectedStudentForDetail.rombel}
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-500 font-mono">
                    NISN: <span className="text-sky-700 font-bold">{selectedStudentForDetail.nisn}</span> &bull; NIK: {selectedStudentForDetail.nik} &bull; NIS: {selectedStudentForDetail.nis || '-'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStudentForDetail(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs text-slate-700">
              {/* Grid 1: Biodata & Alamat */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-sky-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <User className="w-4 h-4 text-sky-600" />
                  1. Biodata Pribadi & Kontak Siswa
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Tempat, Tgl Lahir</span>
                    <span className="font-semibold text-slate-900">{selectedStudentForDetail.tempatLahir}, {formatDateIndonesian(selectedStudentForDetail.tanggalLahir)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Jenis Kelamin</span>
                    <span className="font-semibold text-slate-900">{selectedStudentForDetail.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Agama</span>
                    <span className="font-semibold text-slate-900">{selectedStudentForDetail.agama}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">No Registrasi Akta Lahir</span>
                    <span className="font-semibold text-slate-900">{selectedStudentForDetail.noRegistrasiAktaLahir || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">No Handphone / HP</span>
                    <span className="font-semibold text-slate-900">{selectedStudentForDetail.hp || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">E-Mail Siswa</span>
                    <span className="font-semibold text-slate-900">{selectedStudentForDetail.email || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Jenis Tinggal</span>
                    <span className="font-semibold text-slate-900">{selectedStudentForDetail.jenisTinggal || 'Bersama orang tua'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Alat Transportasi</span>
                    <span className="font-semibold text-slate-900">{selectedStudentForDetail.alatTransportasi || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Grid 2: Alamat Lengkap */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-sky-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <MapPin className="w-4 h-4 text-sky-600" />
                  2. Alamat & Wilayah Domisili
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 block text-[10px]">Alamat Jalan</span>
                    <span className="font-semibold text-slate-900">{selectedStudentForDetail.alamat || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">RT / RW / Dusun</span>
                    <span className="font-semibold text-slate-900">RT {selectedStudentForDetail.rt || '-'} / RW {selectedStudentForDetail.rw || '-'} ({selectedStudentForDetail.dusun || '-'})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Kelurahan / Kecamatan</span>
                    <span className="font-semibold text-slate-900">{selectedStudentForDetail.kelurahan || '-'}, {selectedStudentForDetail.kecamatan || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Kode Pos</span>
                    <span className="font-semibold text-slate-900">{selectedStudentForDetail.kodePos || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Titik Koordinat (Lintang, Bujur)</span>
                    <span className="font-semibold text-slate-900 font-mono">{selectedStudentForDetail.lintang || '-'}, {selectedStudentForDetail.bujur || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Jarak Rumah Ke Sekolah</span>
                    <span className="font-semibold text-slate-900">{selectedStudentForDetail.jarakRumahKeSekolah || '1'} KM</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">No Kartu Keluarga (KK)</span>
                    <span className="font-semibold text-slate-900 font-mono">{selectedStudentForDetail.noKk || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Grid 3: Data Orang Tua & Wali */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-amber-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Users className="w-4 h-4 text-amber-600" />
                  3. Data Orang Tua & Wali
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Ayah */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="font-bold text-sky-800 text-xs border-b border-slate-200 pb-1">Data Ayah Kandung</div>
                    <div><span className="text-slate-500 text-[10px]">Nama:</span> <span className="font-bold text-slate-900">{selectedStudentForDetail.namaAyah || '-'}</span></div>
                    <div><span className="text-slate-500 text-[10px]">NIK:</span> <span className="font-mono text-slate-800">{selectedStudentForDetail.nikAyah || '-'}</span></div>
                    <div><span className="text-slate-500 text-[10px]">Tahun Lahir:</span> <span className="text-slate-800">{selectedStudentForDetail.tahunLahirAyah || '-'}</span></div>
                    <div><span className="text-slate-500 text-[10px]">Pendidikan:</span> <span className="text-slate-800">{selectedStudentForDetail.jenjangPendidikanAyah || '-'}</span></div>
                    <div><span className="text-slate-500 text-[10px]">Pekerjaan:</span> <span className="text-slate-800">{selectedStudentForDetail.pekerjaanAyah || '-'}</span></div>
                    <div><span className="text-slate-500 text-[10px]">Penghasilan:</span> <span className="text-slate-800">{selectedStudentForDetail.penghasilanAyah || '-'}</span></div>
                  </div>

                  {/* Ibu */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="font-bold text-rose-800 text-xs border-b border-slate-200 pb-1">Data Ibu Kandung</div>
                    <div><span className="text-slate-500 text-[10px]">Nama:</span> <span className="font-bold text-slate-900">{selectedStudentForDetail.namaIbu || '-'}</span></div>
                    <div><span className="text-slate-500 text-[10px]">NIK:</span> <span className="font-mono text-slate-800">{selectedStudentForDetail.nikIbu || '-'}</span></div>
                    <div><span className="text-slate-500 text-[10px]">Tahun Lahir:</span> <span className="text-slate-800">{selectedStudentForDetail.tahunLahirIbu || '-'}</span></div>
                    <div><span className="text-slate-500 text-[10px]">Pendidikan:</span> <span className="text-slate-800">{selectedStudentForDetail.jenjangPendidikanIbu || '-'}</span></div>
                    <div><span className="text-slate-500 text-[10px]">Pekerjaan:</span> <span className="text-slate-800">{selectedStudentForDetail.pekerjaanIbu || '-'}</span></div>
                    <div><span className="text-slate-500 text-[10px]">Penghasilan:</span> <span className="text-slate-800">{selectedStudentForDetail.penghasilanIbu || '-'}</span></div>
                  </div>

                  {/* Wali */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="font-bold text-emerald-800 text-xs border-b border-slate-200 pb-1">Data Wali (Jika Ada)</div>
                    <div><span className="text-slate-500 text-[10px]">Nama:</span> <span className="font-bold text-slate-900">{selectedStudentForDetail.namaWali || '-'}</span></div>
                    <div><span className="text-slate-500 text-[10px]">NIK:</span> <span className="font-mono text-slate-800">{selectedStudentForDetail.nikWali || '-'}</span></div>
                    <div><span className="text-slate-500 text-[10px]">Tahun Lahir:</span> <span className="text-slate-800">{selectedStudentForDetail.tahunLahirWali || '-'}</span></div>
                    <div><span className="text-slate-500 text-[10px]">Pendidikan:</span> <span className="text-slate-800">{selectedStudentForDetail.jenjangPendidikanWali || '-'}</span></div>
                    <div><span className="text-slate-500 text-[10px]">Pekerjaan:</span> <span className="text-slate-800">{selectedStudentForDetail.pekerjaanWali || '-'}</span></div>
                    <div><span className="text-slate-500 text-[10px]">Penghasilan:</span> <span className="text-slate-800">{selectedStudentForDetail.penghasilanWali || '-'}</span></div>
                  </div>
                </div>
              </div>

              {/* Grid 4: Bantuan PIP, KIP, KKS & Rekening Bank */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-emerald-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <HeartHandshake className="w-4 h-4 text-emerald-600" />
                  4. Bantuan KIP / PIP / KKS & Rekening Perbankan
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Penerima KIP</span>
                    <span className="font-semibold text-slate-900">{selectedStudentForDetail.penerimaKip || 'Tidak'} (No: {selectedStudentForDetail.nomorKip || '-'})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Nama di KIP</span>
                    <span className="font-semibold text-slate-900">{selectedStudentForDetail.namaDiKip || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Penerima KPS / Nomor KPS</span>
                    <span className="font-semibold text-slate-900">{selectedStudentForDetail.penerimaKps || 'Tidak'} (No: {selectedStudentForDetail.noKps || '-'})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Nomor KKS</span>
                    <span className="font-semibold text-slate-900">{selectedStudentForDetail.nomorKks || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Layak PIP (Usulan Sekolah)</span>
                    <span className="font-semibold text-slate-900">{selectedStudentForDetail.layakPip || 'Tidak'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Alasan Layak PIP</span>
                    <span className="font-semibold text-slate-900">{selectedStudentForDetail.alasanLayakPip || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Bank Penyalur & No Rekening</span>
                    <span className="font-semibold text-slate-900">{selectedStudentForDetail.bank || 'BRI'} - {selectedStudentForDetail.nomorRekeningBank || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Rekening Atas Nama</span>
                    <span className="font-semibold text-slate-900">{selectedStudentForDetail.rekeningAtasNama || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Grid 5: Data Periodik Fisik */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-purple-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Building className="w-4 h-4 text-purple-600" />
                  5. Data Periodik & Riwayat Akademik
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Tinggi / Berat / Lingkar Kepala</span>
                    <span className="font-semibold text-slate-900">{selectedStudentForDetail.tinggiBadan || '-'} cm / {selectedStudentForDetail.beratBadan || '-'} kg / {selectedStudentForDetail.lingkarKepala || '-'} cm</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Anak ke / Jumlah Saudara</span>
                    <span className="font-semibold text-slate-900">Anak ke-{selectedStudentForDetail.anakKeBerapa || '1'} dari {selectedStudentForDetail.jmlSaudaraKandung || '1'} bersaudara</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Sekolah Asal</span>
                    <span className="font-semibold text-slate-900">{selectedStudentForDetail.sekolahAsal || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Kebutuhan Khusus</span>
                    <span className="font-semibold text-slate-900">{selectedStudentForDetail.kebutuhanKhusus || 'Tidak ada'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">No Peserta Ujian Nasional</span>
                    <span className="font-semibold text-slate-900 font-mono">{selectedStudentForDetail.noPesertaUn || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">No Seri Ijazah</span>
                    <span className="font-semibold text-slate-900 font-mono">{selectedStudentForDetail.noSeriIjazah || '-'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 block text-[10px]">SKHUN</span>
                    <span className="font-semibold text-slate-900 font-mono">{selectedStudentForDetail.skhun || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedStudentForDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Student with Full 66 Columns Tabs */}
      {isModalOpen && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-50 flex items-start justify-center p-3 sm:p-5 pt-3 sm:pt-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[85vh] sm:max-h-[82vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-600" />
                <span>{editingStudent ? 'Edit Data Peserta Didik (Dapodik 66 Kolom)' : 'Tambah Peserta Didik Baru (Dapodik 66 Kolom)'}</span>
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Tabs */}
            <div className="flex items-center border-b border-slate-200 bg-slate-50/50 px-4 pt-2 gap-1.5 overflow-x-auto text-xs shrink-0">
              <button
                type="button"
                onClick={() => setFormActiveTab('biodata')}
                className={`pb-2 px-2.5 font-semibold border-b-2 transition-all shrink-0 ${
                  formActiveTab === 'biodata' ? 'border-sky-600 text-sky-700 bg-white rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. Biodata & Domisili
              </button>
              <button
                type="button"
                onClick={() => setFormActiveTab('orangtua')}
                className={`pb-2 px-2.5 font-semibold border-b-2 transition-all shrink-0 ${
                  formActiveTab === 'orangtua' ? 'border-sky-600 text-sky-700 bg-white rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                2. Data Orang Tua & Wali
              </button>
              <button
                type="button"
                onClick={() => setFormActiveTab('bantuan')}
                className={`pb-2 px-2.5 font-semibold border-b-2 transition-all shrink-0 ${
                  formActiveTab === 'bantuan' ? 'border-sky-600 text-sky-700 bg-white rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                3. Bantuan KIP / PIP / KKS
              </button>
              <button
                type="button"
                onClick={() => setFormActiveTab('periodik')}
                className={`pb-2 px-2.5 font-semibold border-b-2 transition-all shrink-0 ${
                  formActiveTab === 'periodik' ? 'border-sky-600 text-sky-700 bg-white rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                4. Data Periodik & Akademik
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              {/* TAB 1: Biodata & Domisili */}
              {formActiveTab === 'biodata' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Nama Lengkap Siswa *</label>
                      <input
                        type="text"
                        required
                        value={formData.nama}
                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none"
                        placeholder="Nama lengkap sesuai Akta"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Rombongan Belajar (Kelas) *</label>
                      <select
                        value={formData.rombel}
                        onChange={(e) => setFormData({ ...formData, rombel: e.target.value, rombelSaatIni: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none"
                      >
                        {modalRombelOptions.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">NISN (10 Digit) *</label>
                      <input
                        type="text"
                        required
                        value={formData.nisn}
                        onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none font-mono"
                        placeholder="0098xxxxxx"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">NIK (16 Digit) *</label>
                      <input
                        type="text"
                        required
                        value={formData.nik}
                        onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none font-mono"
                        placeholder="7201xxxxxxxxxxxx"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">NIS (Nomor Induk Siswa)</label>
                      <input
                        type="text"
                        value={formData.nis || ''}
                        onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none font-mono"
                        placeholder="Contoh: 242507001"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Jenis Kelamin *</label>
                      <select
                        value={formData.jenisKelamin}
                        onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value as 'L' | 'P' })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none"
                      >
                        <option value="L">Laki-laki (L)</option>
                        <option value="P">Perempuan (P)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Tempat Lahir</label>
                      <input
                        type="text"
                        value={formData.tempatLahir}
                        onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none"
                        placeholder="Kota kelahiran"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Tanggal Lahir</label>
                      <input
                        type="date"
                        value={formatDateForInput(formData.tanggalLahir)}
                        onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Agama</label>
                      <select
                        value={formData.agama}
                        onChange={(e) => setFormData({ ...formData, agama: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none"
                      >
                        <option value="Islam">Islam</option>
                        <option value="Kristen">Kristen</option>
                        <option value="Katolik">Katolik</option>
                        <option value="Hindu">Hindu</option>
                        <option value="Buddha">Buddha</option>
                        <option value="Konghucu">Konghucu</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">No HP / Handphone</label>
                      <input
                        type="text"
                        value={formData.hp || ''}
                        onChange={(e) => setFormData({ ...formData, hp: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none font-mono"
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 font-medium mb-1">Alamat Jalan</label>
                      <input
                        type="text"
                        value={formData.alamat}
                        onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none"
                        placeholder="Nama jalan dan nomor rumah"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">RT / RW</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={formData.rt || ''}
                          onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none"
                          placeholder="RT"
                        />
                        <input
                          type="text"
                          value={formData.rw || ''}
                          onChange={(e) => setFormData({ ...formData, rw: e.target.value })}
                          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none"
                          placeholder="RW"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Dusun / Lingkungan</label>
                      <input
                        type="text"
                        value={formData.dusun || ''}
                        onChange={(e) => setFormData({ ...formData, dusun: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none"
                        placeholder="Nama Dusun"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Kelurahan / Desa</label>
                      <input
                        type="text"
                        value={formData.kelurahan || ''}
                        onChange={(e) => setFormData({ ...formData, kelurahan: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none"
                        placeholder="Nama Kelurahan"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Kecamatan & Kode Pos</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={formData.kecamatan || ''}
                          onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none"
                          placeholder="Kecamatan"
                        />
                        <input
                          type="text"
                          value={formData.kodePos || ''}
                          onChange={(e) => setFormData({ ...formData, kodePos: e.target.value })}
                          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none font-mono"
                          placeholder="Kode Pos"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Data Orang Tua & Wali */}
              {formActiveTab === 'orangtua' && (
                <div className="space-y-5">
                  {/* Ayah */}
                  <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3">
                    <div className="font-bold text-sky-800 text-xs border-b border-slate-200 pb-2">Data Ayah Kandung</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-600 text-[11px] mb-1">Nama Ayah</label>
                        <input
                          type="text"
                          value={formData.namaAyah || ''}
                          onChange={(e) => setFormData({ ...formData, namaAyah: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-sky-500"
                          placeholder="Nama Ayah"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 text-[11px] mb-1">NIK Ayah</label>
                        <input
                          type="text"
                          value={formData.nikAyah || ''}
                          onChange={(e) => setFormData({ ...formData, nikAyah: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono focus:border-sky-500"
                          placeholder="NIK Ayah"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 text-[11px] mb-1">Tahun Lahir Ayah</label>
                        <input
                          type="text"
                          value={formData.tahunLahirAyah || ''}
                          onChange={(e) => setFormData({ ...formData, tahunLahirAyah: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-sky-500"
                          placeholder="Contoh: 1980"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 text-[11px] mb-1">Pendidikan Ayah</label>
                        <input
                          type="text"
                          value={formData.jenjangPendidikanAyah || ''}
                          onChange={(e) => setFormData({ ...formData, jenjangPendidikanAyah: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-sky-500"
                          placeholder="SMA / S1 / SMP"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 text-[11px] mb-1">Pekerjaan Ayah</label>
                        <input
                          type="text"
                          value={formData.pekerjaanAyah || ''}
                          onChange={(e) => setFormData({ ...formData, pekerjaanAyah: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-sky-500"
                          placeholder="Wiraswasta / PNS"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 text-[11px] mb-1">Penghasilan Ayah</label>
                        <input
                          type="text"
                          value={formData.penghasilanAyah || ''}
                          onChange={(e) => setFormData({ ...formData, penghasilanAyah: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-sky-500"
                          placeholder="Rp 2.000.000 - Rp 5.000.000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ibu */}
                  <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3">
                    <div className="font-bold text-rose-700 text-xs border-b border-slate-200 pb-2">Data Ibu Kandung</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-600 text-[11px] mb-1">Nama Ibu Kandung *</label>
                        <input
                          type="text"
                          value={formData.namaIbu}
                          onChange={(e) => setFormData({ ...formData, namaIbu: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-sky-500"
                          placeholder="Nama Ibu"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 text-[11px] mb-1">NIK Ibu</label>
                        <input
                          type="text"
                          value={formData.nikIbu || ''}
                          onChange={(e) => setFormData({ ...formData, nikIbu: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono focus:border-sky-500"
                          placeholder="NIK Ibu"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 text-[11px] mb-1">Tahun Lahir Ibu</label>
                        <input
                          type="text"
                          value={formData.tahunLahirIbu || ''}
                          onChange={(e) => setFormData({ ...formData, tahunLahirIbu: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-sky-500"
                          placeholder="Contoh: 1984"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 text-[11px] mb-1">Pendidikan Ibu</label>
                        <input
                          type="text"
                          value={formData.jenjangPendidikanIbu || ''}
                          onChange={(e) => setFormData({ ...formData, jenjangPendidikanIbu: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-sky-500"
                          placeholder="SMA / S1 / SMP"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 text-[11px] mb-1">Pekerjaan Ibu</label>
                        <input
                          type="text"
                          value={formData.pekerjaanIbu || ''}
                          onChange={(e) => setFormData({ ...formData, pekerjaanIbu: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-sky-500"
                          placeholder="Ibu Rumah Tangga"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 text-[11px] mb-1">Penghasilan Ibu</label>
                        <input
                          type="text"
                          value={formData.penghasilanIbu || ''}
                          onChange={(e) => setFormData({ ...formData, penghasilanIbu: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-sky-500"
                          placeholder="Tidak Berpenghasilan"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Wali */}
                  <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3">
                    <div className="font-bold text-emerald-800 text-xs border-b border-slate-200 pb-2">Data Wali (Opsional)</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-600 text-[11px] mb-1">Nama Wali</label>
                        <input
                          type="text"
                          value={formData.namaWali || ''}
                          onChange={(e) => setFormData({ ...formData, namaWali: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-sky-500"
                          placeholder="Nama Wali (Jika ada)"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 text-[11px] mb-1">NIK Wali</label>
                        <input
                          type="text"
                          value={formData.nikWali || ''}
                          onChange={(e) => setFormData({ ...formData, nikWali: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono focus:border-sky-500"
                          placeholder="NIK Wali"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 text-[11px] mb-1">Pekerjaan Wali</label>
                        <input
                          type="text"
                          value={formData.pekerjaanWali || ''}
                          onChange={(e) => setFormData({ ...formData, pekerjaanWali: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-sky-500"
                          placeholder="Pekerjaan Wali"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Bantuan PIP, KIP, KKS & Rekening Bank */}
              {formActiveTab === 'bantuan' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Penerima KIP (Kartu Indonesia Pintar)</label>
                      <select
                        value={formData.penerimaKip || 'Tidak'}
                        onChange={(e) => setFormData({ ...formData, penerimaKip: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-sky-500"
                      >
                        <option value="Tidak">Tidak</option>
                        <option value="Ya">Ya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Nomor KIP</label>
                      <input
                        type="text"
                        value={formData.nomorKip || ''}
                        onChange={(e) => setFormData({ ...formData, nomorKip: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono focus:border-sky-500"
                        placeholder="KIP-xxxxxxxx"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Nama Tertera di KIP</label>
                      <input
                        type="text"
                        value={formData.namaDiKip || ''}
                        onChange={(e) => setFormData({ ...formData, namaDiKip: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-sky-500"
                        placeholder="Nama di KIP"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Nomor KKS (Kartu Keluarga Sejahtera)</label>
                      <input
                        type="text"
                        value={formData.nomorKks || ''}
                        onChange={(e) => setFormData({ ...formData, nomorKks: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono focus:border-sky-500"
                        placeholder="KKS-xxxxxx"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Layak PIP (Usulan Sekolah)</label>
                      <select
                        value={formData.layakPip || 'Tidak'}
                        onChange={(e) => setFormData({ ...formData, layakPip: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-sky-500"
                      >
                        <option value="Tidak">Tidak</option>
                        <option value="Ya">Ya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Alasan Layak PIP</label>
                      <input
                        type="text"
                        value={formData.alasanLayakPip || ''}
                        onChange={(e) => setFormData({ ...formData, alasanLayakPip: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-sky-500"
                        placeholder="Pemegang KIP / Miskin / Yatim"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Bank Penyalur & Nomor Rekening</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={formData.bank || 'BRI'}
                          onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-sky-500"
                          placeholder="Bank (BRI/BNI)"
                        />
                        <input
                          type="text"
                          value={formData.nomorRekeningBank || ''}
                          onChange={(e) => setFormData({ ...formData, nomorRekeningBank: e.target.value })}
                          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono focus:border-sky-500"
                          placeholder="No Rekening"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Rekening Atas Nama</label>
                      <input
                        type="text"
                        value={formData.rekeningAtasNama || ''}
                        onChange={(e) => setFormData({ ...formData, rekeningAtasNama: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-sky-500"
                        placeholder="Nama pemilik rekening"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Periodik & Akademik */}
              {formActiveTab === 'periodik' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Tinggi Badan (cm)</label>
                      <input
                        type="text"
                        value={formData.tinggiBadan || ''}
                        onChange={(e) => setFormData({ ...formData, tinggiBadan: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono focus:border-sky-500"
                        placeholder="155"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Berat Badan (kg)</label>
                      <input
                        type="text"
                        value={formData.beratBadan || ''}
                        onChange={(e) => setFormData({ ...formData, beratBadan: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono focus:border-sky-500"
                        placeholder="45"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Lingkar Kepala (cm)</label>
                      <input
                        type="text"
                        value={formData.lingkarKepala || ''}
                        onChange={(e) => setFormData({ ...formData, lingkarKepala: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono focus:border-sky-500"
                        placeholder="52"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Anak Ke-berapa</label>
                      <input
                        type="text"
                        value={formData.anakKeBerapa || '1'}
                        onChange={(e) => setFormData({ ...formData, anakKeBerapa: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono focus:border-sky-500"
                        placeholder="1"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Jml Saudara Kandung</label>
                      <input
                        type="text"
                        value={formData.jmlSaudaraKandung || '1'}
                        onChange={(e) => setFormData({ ...formData, jmlSaudaraKandung: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono focus:border-sky-500"
                        placeholder="2"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Jarak Rumah ke Sekolah (KM)</label>
                      <input
                        type="text"
                        value={formData.jarakRumahKeSekolah || '1'}
                        onChange={(e) => setFormData({ ...formData, jarakRumahKeSekolah: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono focus:border-sky-500"
                        placeholder="1.5"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Sekolah Asal</label>
                      <input
                        type="text"
                        value={formData.sekolahAsal || ''}
                        onChange={(e) => setFormData({ ...formData, sekolahAsal: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-sky-500"
                        placeholder="SD Negeri 1"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Kebutuhan Khusus</label>
                      <input
                        type="text"
                        value={formData.kebutuhanKhusus || 'Tidak ada'}
                        onChange={(e) => setFormData({ ...formData, kebutuhanKhusus: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-sky-500"
                        placeholder="Tidak ada"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">No KK (Kartu Keluarga)</label>
                      <input
                        type="text"
                        value={formData.noKk || ''}
                        onChange={(e) => setFormData({ ...formData, noKk: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono focus:border-sky-500"
                        placeholder="7201xxxxxxxxxxxx"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">No Peserta UN</label>
                      <input
                        type="text"
                        value={formData.noPesertaUn || ''}
                        onChange={(e) => setFormData({ ...formData, noPesertaUn: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono focus:border-sky-500"
                        placeholder="02-24-05-01-xxx"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">No Seri Ijazah</label>
                      <input
                        type="text"
                        value={formData.noSeriIjazah || ''}
                        onChange={(e) => setFormData({ ...formData, noSeriIjazah: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono focus:border-sky-500"
                        placeholder="DN-02/D-SMP/24/xxxx"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">SKHUN</label>
                      <input
                        type="text"
                        value={formData.skhun || ''}
                        onChange={(e) => setFormData({ ...formData, skhun: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono focus:border-sky-500"
                        placeholder="SKHUN-2024-xxx"
                      />
                    </div>

                    <div>
                      <label className="block text-emerald-700 font-medium mb-1 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                        Tahun Lulus (Khusus Alumni)
                      </label>
                      <input
                        type="text"
                        value={formData.tahunLulus || ''}
                        onChange={(e) => setFormData({ ...formData, tahunLulus: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-slate-900 font-mono placeholder:text-slate-400 focus:border-emerald-500"
                        placeholder="Contoh: 2024/2025 atau 2025"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-md shadow-sky-600/20 transition-all"
                >
                  {editingStudent ? 'Simpan Perubahan' : 'Tambah Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Student Card Preview */}
      {selectedStudentForCard && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-50 flex items-start justify-center p-3 sm:p-5 pt-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">Kartu Pelajar Siswa</h3>
              <button onClick={() => setSelectedStudentForCard(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual Card Display */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-700 via-sky-600 to-cyan-500 text-white shadow-xl relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/10 blur-xl" />
              <div className="flex items-center justify-between border-b border-white/20 pb-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shadow overflow-hidden shrink-0">
                    <SafeImage
                      src={displayConfig?.logoCustomUrl || schoolProfile?.logoSekolah}
                      fallbackNode={<span className="text-slate-900 font-bold text-xs">D</span>}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-extrabold tracking-wide text-xs truncate leading-tight">
                      {(schoolProfile?.namaSekolah || displayConfig?.operatorName || 'SMP NEGERI 11 PALU').toUpperCase()}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full font-bold shadow-sm">
                  KARTU PELAJAR
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 items-center">
                <div className="w-20 h-24 rounded-xl bg-white/20 border border-white/30 flex flex-col items-center justify-center font-bold text-xl shadow-inner">
                  {String(selectedStudentForCard.nama || '').charAt(0) || '?'}
                  <span className="text-[9px] font-normal mt-1 opacity-80">Foto</span>
                </div>
                <div className="col-span-2 space-y-1">
                  <div className="font-bold text-sm leading-tight text-white">{selectedStudentForCard.nama}</div>
                  <div className="text-[11px] text-sky-100 font-mono">NISN: {selectedStudentForCard.nisn}</div>
                  <div className="text-[11px] text-sky-100 font-mono">NIS: {selectedStudentForCard.nis || '-'}</div>
                  <div className="text-[11px] text-sky-100">Kelas: {selectedStudentForCard.rombel}</div>
                  <div className="text-[10px] text-sky-200">{selectedStudentForCard.tempatLahir}, {formatDateIndonesian(selectedStudentForCard.tanggalLahir)}</div>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-white/20 flex justify-between text-[10px] text-sky-100">
                <span>NPSN: 40203578</span>
                <span>Tervalidasi Dapodik 2026</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-500 shadow-md shadow-sky-600/20 transition-all"
              >
                Cetak Dokumen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Siswa */}
      {deletingStudent && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-50 flex items-start justify-center p-3 sm:p-5 pt-8 bg-slate-900/50 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Konfirmasi Hapus Data Siswa</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Apakah Anda yakin ingin menghapus data siswa <strong className="text-rose-600">"{deletingStudent.name}"</strong>?
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Data di aplikasi dan database akan langsung diperbarui.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteStudent}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-md shadow-rose-600/20 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus Siswa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Proses Siswa Keluar / Mutasi */}
      {movingStudent && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-50 flex items-start justify-center p-3 sm:p-5 pt-8 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-800">Proses Siswa Keluar / Mutasi</h3>
              </div>
              <button
                type="button"
                onClick={() => setMovingStudent(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-slate-500 text-xs">Siswa yang akan dipindahkan:</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{movingStudent.nama}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">NISN: {movingStudent.nisn} • Kelas: {movingStudent.rombel}</p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Pilih Alasan Keluar / Mutasi:</label>
                <div className="grid grid-cols-1 gap-2">
                  {['Mutasi', 'Putus sekolah', 'Wafat/Meninggal', 'Dikeluarkan', 'Mengundurkan diri'].map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => {
                        if (onMoveToStudentKeluar) {
                          onMoveToStudentKeluar(movingStudent.id, reason as any);
                        }
                        setMovingStudent(null);
                      }}
                      className="w-full text-left px-4 py-3 rounded-xl bg-white hover:bg-amber-50 hover:border-amber-300 text-xs text-slate-700 hover:text-amber-800 border border-slate-200 transition-all font-medium flex items-center justify-between shadow-sm"
                    >
                      <span>{reason}</span>
                      <ChevronDown className="w-4 h-4 -rotate-90 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setMovingStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Proses Kelulusan Siswa (Pindah ke Alumni) */}
      {graduatingStudent && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-50 flex items-start justify-center p-3 sm:p-5 pt-8 bg-slate-900/50 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="bg-white border border-emerald-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-950">Proses Kelulusan Siswa (Alumni)</h3>
                  <p className="text-[11px] text-emerald-700">Pindahkan siswa aktif ke daftar Alumni</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGraduatingStudent(null)}
                className="p-1.5 rounded-lg hover:bg-emerald-100/60 text-emerald-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <p className="text-slate-500 text-xs">Siswa yang akan diluluskan:</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{graduatingStudent.nama}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">NISN: {graduatingStudent.nisn} • Rombel Terakhir: {graduatingStudent.rombel || graduatingStudent.rombelSaatIni || '-'}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">
                    Tahun Lulus (Wajib):
                  </label>
                  <input
                    type="text"
                    value={graduationTahunLulus}
                    onChange={(e) => setGraduationTahunLulus(e.target.value)}
                    placeholder="Contoh: 2025, 2024, 2023..."
                    className="w-full px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors font-medium shadow-sm"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['2026', '2025', '2024', '2023', '2022', '2021', '2020'].map((thn) => (
                      <button
                        key={thn}
                        type="button"
                        onClick={() => setGraduationTahunLulus(thn)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-colors ${
                          graduationTahunLulus === thn
                            ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {thn}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No Seri Ijazah (Opsional):
                  </label>
                  <input
                    type="text"
                    value={graduationNoSeriIjazah}
                    onChange={(e) => setGraduationNoSeriIjazah(e.target.value)}
                    placeholder="Contoh: DN-02/D-SMP/24/000123"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors font-mono shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setGraduatingStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!graduationTahunLulus.trim()) {
                    alert('Mohon masukkan Tahun Lulus siswa.');
                    return;
                  }
                  if (onGraduateStudent) {
                    onGraduateStudent(
                      graduatingStudent.id, 
                      graduationTahunLulus.trim(), 
                      graduationNoSeriIjazah.trim() || undefined
                    );
                  }
                  setGraduatingStudent(null);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
              >
                <GraduationCap className="w-4 h-4" />
                Luluskan & Pindah ke Alumni
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
