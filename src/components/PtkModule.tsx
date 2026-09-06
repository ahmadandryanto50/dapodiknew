import React, { useState, useRef } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Download, 
  Edit3, 
  Trash2, 
  ArrowLeft,
  Filter,
  CheckCircle2,
  Phone,
  Mail,
  Award,
  X,
  AlertCircle,
  FileSpreadsheet,
  FileDown,
  Upload,
  ChevronDown,
  Sparkles,
  Eye,
  Check,
  Building2,
  UserCheck,
  CreditCard,
  MapPin
} from 'lucide-react';
import { TeacherStaff } from '../types';
import { formatDateIndonesian, formatDateForInput } from '../utils/dateUtils';
import { exportToCSV } from '../services/googleSheetsService';
import { 
  downloadPtkExcelTemplate, 
  downloadPtkCSVTemplate, 
  parsePtkImportFile, 
  DAPODIK_PTK_HEADERS 
} from '../utils/ptkTemplateHelper';

interface PtkModuleProps {
  teachers: TeacherStaff[];
  onAddTeacher: (teacher: TeacherStaff) => void;
  onUpdateTeacher: (teacher: TeacherStaff) => void;
  onDeleteTeacher: (id: string) => void;
  onImportTeachers?: (teachers: TeacherStaff[], append: boolean) => void;
  onBackToHome: () => void;
}

export const PtkModule: React.FC<PtkModuleProps> = ({
  teachers,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onImportTeachers,
  onBackToHome
}) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterJenis, setFilterJenis] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherStaff | null>(null);

  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
  const [importedPreviewTeachers, setImportedPreviewTeachers] = useState<TeacherStaff[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [selectedPtkDetail, setSelectedPtkDetail] = useState<TeacherStaff | null>(null);
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formActiveTab, setFormActiveTab] = useState<'identitas' | 'kepegawaian' | 'kualifikasi' | 'keluarga' | 'finansial'>('identitas');

  const [formData, setFormData] = useState<Omit<TeacherStaff, 'id'>>({
    nuptk: '',
    nip: '',
    nama: '',
    jenisKelamin: 'L',
    statusKepegawaian: 'PNS',
    jenisPtk: 'Guru Mapel',
    mapel: '',
    pendidikanTerakhir: 'S1 Pendidikan',
    noHp: '',
    email: '',
    statusSertifikasi: 'Sudah',
    tempatLahir: '',
    tanggalLahir: '',
    agama: 'Islam',
    alamatJalan: '',
    rt: '',
    rw: '',
    namaDusun: '',
    desaKelurahan: '',
    kecamatan: '',
    kodePos: '',
    telepon: '',
    tugasTambahan: '',
    skCpns: '',
    tanggalCpns: '',
    skPengangkatan: '',
    tmtPengangkatan: '',
    lembagaPengangkatan: '',
    pangkatGolongan: '',
    sumberGaji: '',
    namaIbuKandung: '',
    statusPerkawinan: 'Menikah',
    namaSuamiIstri: '',
    nipSuamiIstri: '',
    pekerjaanSuamiIstri: '',
    tmtPns: '',
    sudahLisensiKepalaSekolah: 'Belum',
    pernahDiklatKepengawasan: 'Belum',
    keahlianBraille: 'Tidak',
    keahlianBahasaIsyarat: 'Tidak',
    npwp: '',
    namaWajibPajak: '',
    kewarganegaraan: 'Indonesia',
    bank: '',
    nomorRekeningBank: '',
    rekeningAtasNama: '',
    nik: '',
    noKk: '',
    karpeg: '',
    karisKarsu: '',
    lintang: '',
    bujur: '',
    nuks: '',
    sertifikasi: ''
  });

  const [deletingPtk, setDeletingPtk] = useState<{ id: string; name: string } | null>(null);

  const totalGuru = teachers.filter(t => {
    const j = String(t.jenisPtk || '').toLowerCase();
    return (['Guru Mapel', 'Guru Kelas'].includes(t.jenisPtk) || j.includes('guru')) && !j.includes('kepala');
  }).length;
  const totalTendik = teachers.length - totalGuru;

  const filteredTeachers = teachers.filter(t => {
    const namaStr = String(t.nama || '');
    const nuptkStr = String(t.nuptk || '');
    const nipStr = String(t.nip || '');
    const mapelStr = String(t.mapel || '');
    const queryStr = String(search || '').toLowerCase();

    const matchSearch = namaStr.toLowerCase().includes(queryStr) ||
                        nuptkStr.includes(search) ||
                        (nipStr && nipStr.includes(search)) ||
                        mapelStr.toLowerCase().includes(queryStr);
    const matchStatus = filterStatus === 'ALL' || 
                        t.statusKepegawaian === filterStatus ||
                        (filterStatus === 'GTY' && String(t.statusKepegawaian).toUpperCase().includes('GTY')) ||
                        (filterStatus === 'GTT' && String(t.statusKepegawaian).toUpperCase().includes('GTT')) ||
                        (filterStatus === 'Tenaga Honor Sekolah' && (t.statusKepegawaian === 'Tenaga Honor Sekolah' || t.statusKepegawaian === 'Honor Sekolah')) ||
                        (filterStatus === 'Guru Honor Sekolah' && (t.statusKepegawaian === 'Guru Honor Sekolah' || t.statusKepegawaian === 'Honor Sekolah'));
    const matchJenis = filterJenis === 'ALL' || 
                       t.jenisPtk === filterJenis ||
                       (filterJenis === 'Tenaga Kependidikan' && !['Guru Mapel', 'Guru Kelas'].includes(t.jenisPtk) && !t.jenisPtk.toLowerCase().includes('guru'));
    return matchSearch && matchStatus && matchJenis;
  });

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormActiveTab('identitas');
    setFormData({
      nuptk: Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString(),
      nip: '19850101' + Math.floor(2010011000 + Math.random() * 9000).toString(),
      nama: '',
      jenisKelamin: 'L',
      statusKepegawaian: 'PNS',
      jenisPtk: 'Guru Mapel',
      mapel: 'Matematika',
      pendidikanTerakhir: 'S1 Pendidikan Matematika',
      noHp: '08' + Math.floor(1000000000 + Math.random() * 9000000000),
      email: '',
      statusSertifikasi: 'Sudah',
      tempatLahir: '',
      tanggalLahir: '',
      agama: 'Islam',
      alamatJalan: '',
      rt: '',
      rw: '',
      namaDusun: '',
      desaKelurahan: '',
      kecamatan: '',
      kodePos: '',
      telepon: '',
      tugasTambahan: '',
      skCpns: '',
      tanggalCpns: '',
      skPengangkatan: '',
      tmtPengangkatan: '',
      lembagaPengangkatan: '',
      pangkatGolongan: '',
      sumberGaji: '',
      namaIbuKandung: '',
      statusPerkawinan: 'Menikah',
      namaSuamiIstri: '',
      nipSuamiIstri: '',
      pekerjaanSuamiIstri: '',
      tmtPns: '',
      sudahLisensiKepalaSekolah: 'Belum',
      pernahDiklatKepengawasan: 'Belum',
      keahlianBraille: 'Tidak',
      keahlianBahasaIsyarat: 'Tidak',
      npwp: '',
      namaWajibPajak: '',
      kewarganegaraan: 'Indonesia',
      bank: '',
      nomorRekeningBank: '',
      rekeningAtasNama: '',
      nik: '',
      noKk: '',
      karpeg: '',
      karisKarsu: '',
      lintang: '',
      bujur: '',
      nuks: '',
      sertifikasi: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: TeacherStaff) => {
    setEditingTeacher(t);
    setFormActiveTab('identitas');
    setFormData({
      nuptk: t.nuptk || '',
      nip: t.nip || '',
      nama: t.nama || '',
      jenisKelamin: t.jenisKelamin || 'L',
      statusKepegawaian: t.statusKepegawaian || 'PNS',
      jenisPtk: t.jenisPtk || 'Guru Mapel',
      mapel: t.mapel || '',
      pendidikanTerakhir: t.pendidikanTerakhir || '',
      noHp: t.noHp || '',
      email: t.email || '',
      statusSertifikasi: t.statusSertifikasi || 'Sudah',
      tempatLahir: t.tempatLahir || '',
      tanggalLahir: t.tanggalLahir ? formatDateIndonesian(t.tanggalLahir) : '',
      agama: t.agama || 'Islam',
      alamatJalan: t.alamatJalan || '',
      rt: t.rt || '',
      rw: t.rw || '',
      namaDusun: t.namaDusun || '',
      desaKelurahan: t.desaKelurahan || '',
      kecamatan: t.kecamatan || '',
      kodePos: t.kodePos || '',
      telepon: t.telepon || '',
      tugasTambahan: t.tugasTambahan || '',
      skCpns: t.skCpns || '',
      tanggalCpns: t.tanggalCpns ? formatDateIndonesian(t.tanggalCpns) : '',
      skPengangkatan: t.skPengangkatan || '',
      tmtPengangkatan: t.tmtPengangkatan ? formatDateIndonesian(t.tmtPengangkatan) : '',
      lembagaPengangkatan: t.lembagaPengangkatan || '',
      pangkatGolongan: t.pangkatGolongan || '',
      sumberGaji: t.sumberGaji || '',
      namaIbuKandung: t.namaIbuKandung || '',
      statusPerkawinan: t.statusPerkawinan || 'Menikah',
      namaSuamiIstri: t.namaSuamiIstri || '',
      nipSuamiIstri: t.nipSuamiIstri || '',
      pekerjaanSuamiIstri: t.pekerjaanSuamiIstri || '',
      tmtPns: t.tmtPns ? formatDateIndonesian(t.tmtPns) : '',
      sudahLisensiKepalaSekolah: t.sudahLisensiKepalaSekolah || 'Belum',
      pernahDiklatKepengawasan: t.pernahDiklatKepengawasan || 'Belum',
      keahlianBraille: t.keahlianBraille || 'Tidak',
      keahlianBahasaIsyarat: t.keahlianBahasaIsyarat || 'Tidak',
      npwp: t.npwp || '',
      namaWajibPajak: t.namaWajibPajak || '',
      kewarganegaraan: t.kewarganegaraan || 'Indonesia',
      bank: t.bank || '',
      nomorRekeningBank: t.nomorRekeningBank || '',
      rekeningAtasNama: t.rekeningAtasNama || '',
      nik: t.nik || '',
      noKk: t.noKk || '',
      karpeg: t.karpeg || '',
      karisKarsu: t.karisKarsu || '',
      lintang: t.lintang || '',
      bujur: t.bujur || '',
      nuks: t.nuks || '',
      sertifikasi: t.sertifikasi || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.nuptk) {
      alert('Nama dan NUPTK wajib diisi');
      return;
    }

    const cleanedFormData = {
      ...formData,
      tanggalLahir: formatDateIndonesian(formData.tanggalLahir),
      tanggalCpns: formatDateIndonesian(formData.tanggalCpns),
      tmtPengangkatan: formatDateIndonesian(formData.tmtPengangkatan),
      tmtPns: formatDateIndonesian(formData.tmtPns)
    };

    if (editingTeacher) {
      onUpdateTeacher({
        ...editingTeacher,
        ...cleanedFormData
      });
    } else {
      onAddTeacher({
        ...cleanedFormData,
        id: `ptk-${Date.now().toString().slice(-4)}`
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    setDeletingPtk({ id, name });
  };

  const confirmDeletePtk = () => {
    if (deletingPtk) {
      onDeleteTeacher(deletingPtk.id);
      setDeletingPtk(null);
    }
  };

  // Import handler for PTK Excel / CSV
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportFileName(file.name);
      const { teachers: parsedTeachers } = await parsePtkImportFile(file);

      if (parsedTeachers.length === 0) {
        alert('Tidak ada baris data PTK yang berhasil terbaca dari file.');
        return;
      }

      setImportedPreviewTeachers(parsedTeachers);
      setIsImportPreviewOpen(true);
    } catch (err: any) {
      alert(`Gagal membaca file impor PTK: ${err?.message || 'Format tidak didukung'}`);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmImport = (append: boolean) => {
    if (importedPreviewTeachers.length === 0) return;

    if (onImportTeachers) {
      onImportTeachers(importedPreviewTeachers, append);
    } else {
      if (!append) {
        teachers.forEach(t => onDeleteTeacher(t.id));
      }
      importedPreviewTeachers.forEach(newPtk => {
        onAddTeacher(newPtk);
      });
    }

    setIsImportPreviewOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Input for PTK Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".xlsx, .xls, .csv" 
        className="hidden" 
      />

      {/* Header Bar */}
      <div className="sticky top-[57px] z-30 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white/95 backdrop-blur-xl border border-slate-200/80 p-5 rounded-2xl shadow-md transition-all">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900">Pendidik & Tendik</h1>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 whitespace-nowrap shrink-0">
                {totalGuru} Guru &bull; {totalTendik} Tendik (Total {teachers.length} PTK)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pengelolaan biodata standar Dapodik
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dropdown Unduh Format Template */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
              className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-rose-500/20 cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-white" />
              <span>Unduh Format Template PTK</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-white" />
            </button>

            {isTemplateMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 space-y-1"
                onMouseLeave={() => setIsTemplateMenuOpen(false)}
              >
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-500 border-b border-slate-100">
                  Pilih Format Template PTK (51 Kolom Dapodik):
                </div>
                <button
                  onClick={() => {
                    downloadPtkExcelTemplate();
                    setIsTemplateMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center gap-2 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-900">Template Excel (.xlsx)</div>
                    <div className="text-[10px] text-slate-500">51 Kolom Lengkap Dapodik Kemendikbud</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    downloadPtkCSVTemplate();
                    setIsTemplateMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-sky-50 text-sky-700 text-xs font-medium flex items-center gap-2 transition-colors"
                >
                  <FileDown className="w-4 h-4 text-sky-600 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-900">Template CSV (.csv)</div>
                    <div className="text-[10px] text-slate-500">Format text comma-separated UTF-8</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Impor Data PTK */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-amber-400/20 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-slate-900" />
            <span>Impor Data PTK</span>
          </button>

          {/* Ekspor Data */}
          <button
            onClick={() => exportToCSV(teachers, 'DAPODIK_DATA_PTK_LENGKAP')}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 cursor-pointer"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Ekspor Data</span>
          </button>

          {/* Tambah PTK */}
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-sm shadow-sky-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Tambah PTK Baru</span>
          </button>
        </div>
      </div>

      {/* Quick Info Banner for PTK Dapodik */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50/50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm">Integrasi PTK Dapodik Kemendikbudristek</div>
            <p className="text-slate-600 text-[11px]">
              Mendukung impor/ekspor data PTK lengkap
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari Nama Guru, NUPTK, NIP, atau Mata Pelajaran..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
          >
            <option value="ALL">Semua Status Kepegawaian</option>
            <option value="PNS">PNS</option>
            <option value="PPPK">PPPK</option>
            <option value="PPPK Paruh Waktu">PPPK Paruh Waktu</option>
            <option value="GTY">GTY (Tetap Yayasan)</option>
            <option value="GTT">GTT (Tidak Tetap)</option>
            <option value="Guru Honor Sekolah">Guru Honor Sekolah</option>
            <option value="Tenaga Honor Sekolah">Tenaga Honor Sekolah</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
          >
            <option value="ALL">Semua Jenis Tugas PTK</option>
            <option value="Kepala Sekolah">Kepala Sekolah</option>
            <option value="Guru Mapel">Guru Mapel</option>
            <option value="Guru Kelas">Guru Kelas</option>
            <option value="Tenaga Administrasi">Tenaga Administrasi (TU)</option>
            <option value="Laboran">Laboran</option>
            <option value="Pustakawan">Pustakawan</option>
            <option value="Tenaga Kependidikan">Tenaga Kependidikan</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[650px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-left text-xs text-slate-700 relative border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-3.5 px-4">No</th>
                <th className="py-3.5 px-4">Nama Lengkap & NUPTK</th>
                <th className="py-3.5 px-4">Tugas / Jenis PTK</th>
                <th className="py-3.5 px-4">Status & NIP</th>
                <th className="py-3.5 px-4">Mata Pelajaran</th>
                <th className="py-3.5 px-4">Pendidikan</th>
                <th className="py-3.5 px-4">Sertifikasi</th>
                <th className="py-3.5 px-4">Kontak</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    Tidak ada data PTK ditemukan.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-xs shrink-0">
                          {String(t.nama || '').charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{t.nama}</div>
                          <div className="text-[10px] text-amber-700 font-mono">NUPTK: {t.nuptk}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                        {t.jenisPtk}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{t.statusKepegawaian}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{t.nip || 'Non-NIP'}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-sky-700">
                      {t.mapel}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {t.pendidikanTerakhir}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 w-fit ${
                        t.statusSertifikasi === 'Sudah' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <Award className="w-3 h-3" />
                        {t.statusSertifikasi === 'Sudah' ? 'Tersertifikasi' : 'Belum'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      <div className="flex items-center gap-1 text-[11px] text-slate-700">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>{t.noHp}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 truncate max-w-[140px]">
                        <Mail className="w-3 h-3 text-sky-600" />
                        <span className="truncate">{t.email || '-'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionId(openActionId === t.id ? null : t.id);
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs cursor-pointer ${
                            openActionId === t.id
                              ? 'bg-sky-600 text-white border-sky-600 shadow-md'
                              : 'bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border-slate-300 hover:border-sky-300'
                          }`}
                          title="Pilih Aksi"
                        >
                          <span>Aksi</span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openActionId === t.id ? 'rotate-180 text-white' : 'text-slate-400'}`} />
                        </button>

                        {openActionId === t.id && (
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
                              className={`absolute right-0 z-30 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 text-xs text-slate-700 divide-y divide-slate-100 ${
                                idx >= filteredTeachers.length - 2 && filteredTeachers.length > 2
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
                                    setSelectedPtkDetail(t);
                                  }}
                                  className="w-full text-left px-3.5 py-2 hover:bg-sky-50 text-slate-700 hover:text-sky-700 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                                >
                                  <div className="w-6 h-6 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 border border-sky-200">
                                    <Eye className="w-3.5 h-3.5" />
                                  </div>
                                  <span>Lihat Detail (51 Kolom)</span>
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionId(null);
                                    handleOpenEdit(t);
                                  }}
                                  className="w-full text-left px-3.5 py-2 hover:bg-amber-50 text-slate-700 hover:text-amber-700 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                                >
                                  <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </div>
                                  <span>Edit Data PTK</span>
                                </button>
                              </div>

                              <div className="py-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionId(null);
                                    handleDelete(t.id, t.nama);
                                  }}
                                  className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                                >
                                  <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </div>
                                  <span>Hapus PTK</span>
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

      {/* Modal Preview Impor PTK */}
      {isImportPreviewOpen && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-50 flex items-start justify-center p-3 sm:p-5 pt-3 sm:pt-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Pratinjau Impor Data PTK</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 font-mono border border-emerald-200">
                      {importedPreviewTeachers.length} Data Terdeteksi
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    File: <span className="text-sky-700 font-mono">{importFileName}</span> &bull; 51 Kolom Dipetakan ke Database
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsImportPreviewOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 text-[11px] leading-relaxed">
                ℹ️ Membaca <strong>{importedPreviewTeachers.length} data PTK</strong> dari file. Silakan pilih mode konfirmasi di bawah ini. Seluruh data (termasuk SK CPNS, NIP, Sertifikasi, Rekening Bank, NIK/KK) akan tersimpan lengkap.
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-[350px]">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Nama PTK</th>
                      <th className="py-2.5 px-3">NUPTK</th>
                      <th className="py-2.5 px-3">L/P</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Jenis Tugas</th>
                      <th className="py-2.5 px-3">Sertifikasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importedPreviewTeachers.map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{t.nama}</td>
                        <td className="py-2 px-3 font-mono text-amber-700">{t.nuptk}</td>
                        <td className="py-2 px-3">{t.jenisKelamin}</td>
                        <td className="py-2 px-3">{t.statusKepegawaian}</td>
                        <td className="py-2 px-3 text-sky-700">{t.jenisPtk}</td>
                        <td className="py-2 px-3">{t.statusSertifikasi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsImportPreviewOpen(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100"
              >
                Batal
              </button>

              <div className="w-full sm:w-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleConfirmImport(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm"
                >
                  Gantikan Semua Data PTK
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmImport(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-sm"
                >
                  Tambahkan ke Database PTK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail PTK (51 Kolom Profil) */}
      {selectedPtkDetail && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-50 flex items-start justify-center p-3 sm:p-5 pt-3 sm:pt-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[85vh] sm:max-h-[82vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-3.5 sm:p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold text-sm shrink-0">
                  {selectedPtkDetail.nama.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedPtkDetail.nama}</h3>
                  <p className="text-[11px] text-amber-700 font-mono">
                    NUPTK: {selectedPtkDetail.nuptk} &bull; NIP: {selectedPtkDetail.nip || '-'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPtkDetail(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3.5 text-xs text-slate-700">
              {/* Seksi Kepegawaian */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-amber-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span>Kepegawaian & Penugasan</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div><span className="text-slate-500">Status Kepegawaian:</span> <strong className="text-slate-900">{selectedPtkDetail.statusKepegawaian}</strong></div>
                  <div><span className="text-slate-500">Jenis PTK:</span> <strong className="text-sky-700">{selectedPtkDetail.jenisPtk}</strong></div>
                  <div><span className="text-slate-500">Tugas / Mapel:</span> <strong className="text-slate-900">{selectedPtkDetail.mapel}</strong></div>
                  <div><span className="text-slate-500">Pangkat / Golongan:</span> <strong className="text-slate-900">{selectedPtkDetail.pangkatGolongan || '-'}</strong></div>
                  <div><span className="text-slate-500">SK Pengangkatan:</span> <strong className="text-slate-900">{selectedPtkDetail.skPengangkatan || '-'}</strong></div>
                  <div><span className="text-slate-500">TMT Pengangkatan:</span> <strong className="text-slate-900">{formatDateIndonesian(selectedPtkDetail.tmtPengangkatan)}</strong></div>
                  <div><span className="text-slate-500">SK CPNS:</span> <strong className="text-slate-900">{selectedPtkDetail.skCpns || '-'}</strong></div>
                  <div><span className="text-slate-500">Tanggal CPNS:</span> <strong className="text-slate-900">{formatDateIndonesian(selectedPtkDetail.tanggalCpns)}</strong></div>
                  <div><span className="text-slate-500">TMT PNS:</span> <strong className="text-slate-900">{formatDateIndonesian(selectedPtkDetail.tmtPns)}</strong></div>
                  <div><span className="text-slate-500">Lembaga Pengangkat:</span> <strong className="text-slate-900">{selectedPtkDetail.lembagaPengangkatan || '-'}</strong></div>
                  <div><span className="text-slate-500">Tempat, Tgl Lahir:</span> <strong className="text-slate-900">{selectedPtkDetail.tempatLahir || '-'}, {formatDateIndonesian(selectedPtkDetail.tanggalLahir)}</strong></div>
                  <div><span className="text-slate-500">Sumber Gaji:</span> <strong className="text-slate-900">{selectedPtkDetail.sumberGaji || '-'}</strong></div>
                </div>
              </div>

              {/* Seksi Sertifikasi & Identitas */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-emerald-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Sertifikasi & Kualifikasi</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div><span className="text-slate-500">Status Sertifikasi:</span> <strong className="text-emerald-700">{selectedPtkDetail.statusSertifikasi}</strong></div>
                  <div><span className="text-slate-500">Lisensi Kepala Sekolah:</span> <strong className="text-slate-900">{selectedPtkDetail.sudahLisensiKepalaSekolah || '-'}</strong></div>
                  <div><span className="text-slate-500">NUKS:</span> <strong className="text-slate-900">{selectedPtkDetail.nuks || '-'}</strong></div>
                  <div><span className="text-slate-500">Diklat Kepengawasan:</span> <strong className="text-slate-900">{selectedPtkDetail.pernahDiklatKepengawasan || '-'}</strong></div>
                  <div><span className="text-slate-500">Keahlian Braille:</span> <strong className="text-slate-900">{selectedPtkDetail.keahlianBraille || '-'}</strong></div>
                  <div><span className="text-slate-500">Keahlian Bahasa Isyarat:</span> <strong className="text-slate-900">{selectedPtkDetail.keahlianBahasaIsyarat || '-'}</strong></div>
                </div>
              </div>

              {/* Seksi Finansial & Dokumen Kependudukan */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-sky-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <CreditCard className="w-4 h-4 text-sky-600" />
                  <span>Finansial & Dokumen Resmi (NIK / KK / NPWP / Rekening)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div><span className="text-slate-500">NIK:</span> <strong className="text-slate-900 font-mono">{selectedPtkDetail.nik || '-'}</strong></div>
                  <div><span className="text-slate-500">No. KK:</span> <strong className="text-slate-900 font-mono">{selectedPtkDetail.noKk || '-'}</strong></div>
                  <div><span className="text-slate-500">NPWP:</span> <strong className="text-slate-900 font-mono">{selectedPtkDetail.npwp || '-'}</strong></div>
                  <div><span className="text-slate-500">Bank:</span> <strong className="text-slate-900">{selectedPtkDetail.bank || '-'}</strong></div>
                  <div><span className="text-slate-500">No. Rekening:</span> <strong className="text-slate-900 font-mono">{selectedPtkDetail.nomorRekeningBank || '-'}</strong></div>
                  <div><span className="text-slate-500">Atas Nama Rekening:</span> <strong className="text-slate-900">{selectedPtkDetail.rekeningAtasNama || '-'}</strong></div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedPtkDetail(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-50 flex items-start justify-center p-3 sm:p-5 pt-3 sm:pt-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[85vh] sm:max-h-[82vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {editingTeacher ? 'Edit Data PTK' : 'Tambah Data PTK Baru'}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Kelola data identitas, kepegawaian, kualifikasi, keluarga, dan dokumen finansial PTK.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Header Navigation */}
            <div className="flex items-center gap-1 sm:gap-1.5 px-4 pt-2 border-b border-slate-200 bg-slate-50 overflow-x-auto text-xs whitespace-nowrap scrollbar-none shrink-0">
              <button
                type="button"
                onClick={() => setFormActiveTab('identitas')}
                className={`pb-2 px-2.5 font-semibold border-b-2 transition-all shrink-0 ${
                  formActiveTab === 'identitas' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                1. Identitas & Domisili PTK
              </button>
              <button
                type="button"
                onClick={() => setFormActiveTab('kepegawaian')}
                className={`pb-2 px-2.5 font-semibold border-b-2 transition-all shrink-0 ${
                  formActiveTab === 'kepegawaian' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                2. Kepegawaian & Penugasan
              </button>
              <button
                type="button"
                onClick={() => setFormActiveTab('kualifikasi')}
                className={`pb-2 px-2.5 font-semibold border-b-2 transition-all shrink-0 ${
                  formActiveTab === 'kualifikasi' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                3. Kualifikasi & Sertifikasi
              </button>
              <button
                type="button"
                onClick={() => setFormActiveTab('keluarga')}
                className={`pb-2 px-2.5 font-semibold border-b-2 transition-all shrink-0 ${
                  formActiveTab === 'keluarga' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                4. Data Keluarga & Kontak
              </button>
              <button
                type="button"
                onClick={() => setFormActiveTab('finansial')}
                className={`pb-2 px-2.5 font-semibold border-b-2 transition-all shrink-0 ${
                  formActiveTab === 'finansial' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                5. Dokumen & Finansial
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              {/* TAB 1: Identitas & Domisili PTK */}
              {formActiveTab === 'identitas' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 font-medium mb-1">Nama Lengkap & Gelar *</label>
                      <input
                        type="text"
                        required
                        value={formData.nama}
                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                        placeholder="Contoh: Drs. Bambang Sudarsono, M.Pd."
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">NUPTK (16 Digit) *</label>
                      <input
                        type="text"
                        required
                        value={formData.nuptk}
                        onChange={(e) => setFormData({ ...formData, nuptk: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono"
                        placeholder="Contoh: 1234567890123456"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">NIP (Bagi PNS / PPPK)</label>
                      <input
                        type="text"
                        value={formData.nip || ''}
                        onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono"
                        placeholder="Contoh: 198503152010012015"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">NIK (Nomor Induk Kependudukan)</label>
                      <input
                        type="text"
                        value={formData.nik || ''}
                        onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono"
                        placeholder="7201xxxxxxxxxxxx"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Nomor Kartu Keluarga (KK)</label>
                      <input
                        type="text"
                        value={formData.noKk || ''}
                        onChange={(e) => setFormData({ ...formData, noKk: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono"
                        placeholder="7201xxxxxxxxxxxx"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Jenis Kelamin</label>
                      <select
                        value={formData.jenisKelamin}
                        onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value as 'L' | 'P' })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                      >
                        <option value="L">Laki-laki (L)</option>
                        <option value="P">Perempuan (P)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Tempat Lahir</label>
                      <input
                        type="text"
                        value={formData.tempatLahir || ''}
                        onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                        placeholder="Contoh: Palu"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Tanggal Lahir</label>
                      <input
                        type="date"
                        value={formatDateForInput(formData.tanggalLahir)}
                        onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Agama</label>
                      <select
                        value={formData.agama || 'Islam'}
                        onChange={(e) => setFormData({ ...formData, agama: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                      >
                        <option value="Islam">Islam</option>
                        <option value="Kristen">Kristen</option>
                        <option value="Katolik">Katolik</option>
                        <option value="Hindu">Hindu</option>
                        <option value="Buddha">Buddha</option>
                        <option value="Khonghucu">Khonghucu</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Kewarganegaraan</label>
                      <input
                        type="text"
                        value={formData.kewarganegaraan || 'Indonesia'}
                        onChange={(e) => setFormData({ ...formData, kewarganegaraan: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                        placeholder="Indonesia"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 font-medium mb-1">Alamat Jalan</label>
                      <input
                        type="text"
                        value={formData.alamatJalan || ''}
                        onChange={(e) => setFormData({ ...formData, alamatJalan: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                        placeholder="Jl. Pendidikan No. 12"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">RT / RW</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.rt || ''}
                          onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                          className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono"
                          placeholder="RT 001"
                        />
                        <input
                          type="text"
                          value={formData.rw || ''}
                          onChange={(e) => setFormData({ ...formData, rw: e.target.value })}
                          className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono"
                          placeholder="RW 002"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Nama Dusun</label>
                      <input
                        type="text"
                        value={formData.namaDusun || ''}
                        onChange={(e) => setFormData({ ...formData, namaDusun: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                        placeholder="Dusun II"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Desa / Kelurahan</label>
                      <input
                        type="text"
                        value={formData.desaKelurahan || ''}
                        onChange={(e) => setFormData({ ...formData, desaKelurahan: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                        placeholder="Kel. Besusu"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Kecamatan & Kode Pos</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.kecamatan || ''}
                          onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                          className="w-2/3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                          placeholder="Palu Timur"
                        />
                        <input
                          type="text"
                          value={formData.kodePos || ''}
                          onChange={(e) => setFormData({ ...formData, kodePos: e.target.value })}
                          className="w-1/3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono"
                          placeholder="94118"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Koordinat Lintang & Bujur</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.lintang || ''}
                          onChange={(e) => setFormData({ ...formData, lintang: e.target.value })}
                          className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono text-[11px]"
                          placeholder="Lintang: -0.8912"
                        />
                        <input
                          type="text"
                          value={formData.bujur || ''}
                          onChange={(e) => setFormData({ ...formData, bujur: e.target.value })}
                          className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono text-[11px]"
                          placeholder="Bujur: 119.8712"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Kepegawaian & Penugasan */}
              {formActiveTab === 'kepegawaian' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Status Kepegawaian *</label>
                      <select
                        value={formData.statusKepegawaian}
                        onChange={(e) => setFormData({ ...formData, statusKepegawaian: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                      >
                        <option value="PNS">PNS</option>
                        <option value="PPPK">PPPK</option>
                        <option value="PPPK Paruh Waktu">PPPK Paruh Waktu</option>
                        <option value="GTY">GTY (Tetap Yayasan)</option>
                        <option value="GTT">GTT (Tidak Tetap)</option>
                        <option value="Guru Honor Sekolah">Guru Honor Sekolah</option>
                        <option value="Tenaga Honor Sekolah">Tenaga Honor Sekolah</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Jenis Tugas PTK *</label>
                      <select
                        value={formData.jenisPtk}
                        onChange={(e) => setFormData({ ...formData, jenisPtk: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                      >
                        <option value="Kepala Sekolah">Kepala Sekolah</option>
                        <option value="Guru Mapel">Guru Mapel</option>
                        <option value="Guru Kelas">Guru Kelas</option>
                        <option value="Tenaga Administrasi">Tenaga Administrasi</option>
                        <option value="Laboran">Laboran</option>
                        <option value="Pustakawan">Pustakawan</option>
                        <option value="Tenaga Kependidikan">Tenaga Kependidikan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Mata Pelajaran / Bidang Tugas</label>
                      <input
                        type="text"
                        value={formData.mapel}
                        onChange={(e) => setFormData({ ...formData, mapel: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                        placeholder="Contoh: Matematika, IPA, TU"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Tugas Tambahan</label>
                      <input
                        type="text"
                        value={formData.tugasTambahan || ''}
                        onChange={(e) => setFormData({ ...formData, tugasTambahan: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                        placeholder="Wakil Kepala Sekolah / Pembina OSIS / Wali Kelas"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Pangkat / Golongan</label>
                      <input
                        type="text"
                        value={formData.pangkatGolongan || ''}
                        onChange={(e) => setFormData({ ...formData, pangkatGolongan: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                        placeholder="Contoh: Penata Muda / III/a"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Lembaga Pengangkat</label>
                      <input
                        type="text"
                        value={formData.lembagaPengangkatan || ''}
                        onChange={(e) => setFormData({ ...formData, lembagaPengangkatan: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                        placeholder="Bupati / Kepala Dinas / Ketua Yayasan"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">SK Pengangkatan</label>
                      <input
                        type="text"
                        value={formData.skPengangkatan || ''}
                        onChange={(e) => setFormData({ ...formData, skPengangkatan: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono"
                        placeholder="800/123/DISDIK/2020"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">TMT Pengangkatan</label>
                      <input
                        type="date"
                        value={formatDateForInput(formData.tmtPengangkatan)}
                        onChange={(e) => setFormData({ ...formData, tmtPengangkatan: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">SK CPNS</label>
                      <input
                        type="text"
                        value={formData.skCpns || ''}
                        onChange={(e) => setFormData({ ...formData, skCpns: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono"
                        placeholder="813/045/BKD/2018"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Tanggal SK CPNS</label>
                      <input
                        type="date"
                        value={formatDateForInput(formData.tanggalCpns)}
                        onChange={(e) => setFormData({ ...formData, tanggalCpns: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">TMT PNS</label>
                      <input
                        type="date"
                        value={formatDateForInput(formData.tmtPns)}
                        onChange={(e) => setFormData({ ...formData, tmtPns: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Sumber Gaji</label>
                      <input
                        type="text"
                        value={formData.sumberGaji || ''}
                        onChange={(e) => setFormData({ ...formData, sumberGaji: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                        placeholder="APBD Kabupaten/Kota / APBN / Dana BOS"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Kualifikasi & Sertifikasi */}
              {formActiveTab === 'kualifikasi' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Pendidikan Terakhir</label>
                      <input
                        type="text"
                        value={formData.pendidikanTerakhir}
                        onChange={(e) => setFormData({ ...formData, pendidikanTerakhir: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                        placeholder="Contoh: S1 Pendidikan Matematika"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Status Sertifikasi Profesi (PPG)</label>
                      <select
                        value={formData.statusSertifikasi}
                        onChange={(e) => setFormData({ ...formData, statusSertifikasi: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                      >
                        <option value="Sudah">Sudah Tersertifikasi</option>
                        <option value="Belum">Belum Tersertifikasi</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Bidang Sertifikasi / Mapel Sertifikasi</label>
                      <input
                        type="text"
                        value={formData.sertifikasi || ''}
                        onChange={(e) => setFormData({ ...formData, sertifikasi: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                        placeholder="Sertifikasi Pendidik Matematika"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Lisensi Kepala Sekolah</label>
                      <select
                        value={formData.sudahLisensiKepalaSekolah || 'Belum'}
                        onChange={(e) => setFormData({ ...formData, sudahLisensiKepalaSekolah: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                      >
                        <option value="Sudah">Sudah Memiliki Lisensi</option>
                        <option value="Belum">Belum Memiliki Lisensi</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">NUKS (Nomor Unik Kepala Sekolah)</label>
                      <input
                        type="text"
                        value={formData.nuks || ''}
                        onChange={(e) => setFormData({ ...formData, nuks: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono"
                        placeholder="19023xxxxxxxx"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Pernah Diklat Kepengawasan</label>
                      <select
                        value={formData.pernahDiklatKepengawasan || 'Belum'}
                        onChange={(e) => setFormData({ ...formData, pernahDiklatKepengawasan: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                      >
                        <option value="Pernah">Pernah</option>
                        <option value="Belum">Belum / Tidak Pernah</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Keahlian Braille</label>
                      <select
                        value={formData.keahlianBraille || 'Tidak'}
                        onChange={(e) => setFormData({ ...formData, keahlianBraille: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                      >
                        <option value="Ya">Ya (Memiliki Keahlian)</option>
                        <option value="Tidak">Tidak</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Keahlian Bahasa Isyarat</label>
                      <select
                        value={formData.keahlianBahasaIsyarat || 'Tidak'}
                        onChange={(e) => setFormData({ ...formData, keahlianBahasaIsyarat: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                      >
                        <option value="Ya">Ya (Memiliki Keahlian)</option>
                        <option value="Tidak">Tidak</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Data Keluarga & Kontak */}
              {formActiveTab === 'keluarga' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Status Perkawinan</label>
                      <select
                        value={formData.statusPerkawinan || 'Menikah'}
                        onChange={(e) => setFormData({ ...formData, statusPerkawinan: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                      >
                        <option value="Menikah">Menikah</option>
                        <option value="Belum Menikah">Belum Menikah</option>
                        <option value="Duda / Janda">Duda / Janda</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Nama Ibu Kandung</label>
                      <input
                        type="text"
                        value={formData.namaIbuKandung || ''}
                        onChange={(e) => setFormData({ ...formData, namaIbuKandung: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                        placeholder="Nama lengkap ibu kandung"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Nama Suami / Istri</label>
                      <input
                        type="text"
                        value={formData.namaSuamiIstri || ''}
                        onChange={(e) => setFormData({ ...formData, namaSuamiIstri: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                        placeholder="Nama suami / istri jika ada"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">NIP Suami / Istri (Jika PNS)</label>
                      <input
                        type="text"
                        value={formData.nipSuamiIstri || ''}
                        onChange={(e) => setFormData({ ...formData, nipSuamiIstri: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono"
                        placeholder="198701xxxxxxxx"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Pekerjaan Suami / Istri</label>
                      <input
                        type="text"
                        value={formData.pekerjaanSuamiIstri || ''}
                        onChange={(e) => setFormData({ ...formData, pekerjaanSuamiIstri: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                        placeholder="PNS / Swasta / Wiraswasta"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">No. Handphone / WhatsApp *</label>
                      <input
                        type="text"
                        value={formData.noHp}
                        onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono"
                        placeholder="081234567890"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Akun Email (Belajar.id / Resmi)</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                        placeholder="nama.guru@sekolah.belajar.id"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Telepon Rumah</label>
                      <input
                        type="text"
                        value={formData.telepon || ''}
                        onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono"
                        placeholder="0451-xxxxxx"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: Dokumen & Finansial */}
              {formActiveTab === 'finansial' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Nomor NPWP</label>
                      <input
                        type="text"
                        value={formData.npwp || ''}
                        onChange={(e) => setFormData({ ...formData, npwp: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono"
                        placeholder="00.000.000.0-000.000"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Nama Wajib Pajak</label>
                      <input
                        type="text"
                        value={formData.namaWajibPajak || ''}
                        onChange={(e) => setFormData({ ...formData, namaWajibPajak: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                        placeholder="Nama sesuai NPWP"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Nama Bank</label>
                      <input
                        type="text"
                        value={formData.bank || ''}
                        onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                        placeholder="Bank Mandiri / Bank BPD Sulteng / BRI"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Nomor Rekening Bank</label>
                      <input
                        type="text"
                        value={formData.nomorRekeningBank || ''}
                        onChange={(e) => setFormData({ ...formData, nomorRekeningBank: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono"
                        placeholder="1234567890"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Rekening Atas Nama</label>
                      <input
                        type="text"
                        value={formData.rekeningAtasNama || ''}
                        onChange={(e) => setFormData({ ...formData, rekeningAtasNama: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                        placeholder="Nama pemegang rekening"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">No. KARPEG (Kartu Pegawai)</label>
                      <input
                        type="text"
                        value={formData.karpeg || ''}
                        onChange={(e) => setFormData({ ...formData, karpeg: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono"
                        placeholder="F 123456"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">No. KARIS / KARSU</label>
                      <input
                        type="text"
                        value={formData.karisKarsu || ''}
                        onChange={(e) => setFormData({ ...formData, karisKarsu: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono"
                        placeholder="K 123456"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Modal Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-6">
                <div className="text-[11px] text-slate-500">
                  Semua perubahan akan langsung disimpan ke database.
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-sm transition-colors"
                  >
                    {editingTeacher ? 'Simpan Perubahan' : 'Tambah PTK'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus PTK */}
      {deletingPtk && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-50 flex items-start justify-center p-3 sm:p-5 pt-8 bg-slate-900/50 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Konfirmasi Hapus Data PTK</h3>
              <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                Apakah Anda yakin ingin menghapus data PTK <strong className="text-rose-700">"{deletingPtk.name}"</strong>?
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Data di aplikasi dan database akan langsung diperbarui.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeletingPtk(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeletePtk}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus PTK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
