import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  PlusCircle,
  Search, 
  Download, 
  Printer, 
  Edit3, 
  Trash2, 
  ArrowLeft, 
  Award, 
  CheckCircle2, 
  X,
  Sparkles,
  BookOpen,
  UserCheck,
  PenTool,
  Eye,
  Building2,
  Calendar,
  Layers,
  GraduationCap
} from 'lucide-react';
import { StudentReport, Student, SubjectScore, ExtraScore, CustomDataField, SchoolProfile } from '../types';
import { exportToCSV } from '../services/googleSheetsService';
import { printElement } from '../utils/printHelper';

interface RaporModuleProps {
  reports: StudentReport[];
  students: Student[];
  onAddReport: (report: StudentReport) => void;
  onUpdateReport: (report: StudentReport) => void;
  onDeleteReport: (id: string) => void;
  onBackToHome: () => void;
  schoolProfile?: SchoolProfile;
}

export const getSampleAbdulahReport = (schoolProfile?: SchoolProfile): StudentReport => {
  return {
    id: `rep-abdulah-${Date.now()}`,
    studentId: 'std-abdulah',
    nis: '3899',
    nisn: '3124628953',
    studentName: 'ABDULAH',
    rombel: '7 A',
    fase: 'D',
    namaSekolah: schoolProfile?.namaSekolah || 'SMP NEGERI 11 PALU',
    alamat: schoolProfile?.alamat || 'Jl. Keramik',
    semester: '2',
    tahunAjaran: '2025/2026',
    scores: [
      {
        mapel: 'Pendidikan Agama Islam dan Budi Pekerti',
        kelompok: 'Kelompok A',
        nilaiAkhir: 80,
        predikat: 'B',
        catatan: 'Mencapai Kompetensi dengan sangat baik dalam hal memahami makna iman kepada malaikat dan menghindari gibah dalam kehidupan sehari-hari.\n\nPerlu peningkatan dalam hal membaca, menulis, mengartikan dan menghafalkan Q.S Al-Anbiya/21:30 dan Q.S Al a\'araf/7:54 beserta hadist terkait, memahami makna rukhsah dan cara rukhsah dalam salat, puasa, zakat dan haji, menjelaskan perkembangan ilmu pengetahuan pada masa Bani Umayyah di Andalusia.'
      },
      {
        mapel: 'Pendidikan Pancasila',
        kelompok: 'Kelompok A',
        nilaiAkhir: 75,
        predikat: 'B',
        catatan: 'Perlu peningkatan dalam hal Mengindentifikasi keberagaman suku, agama, ras, dan antargolongan dalam bingkai bhineka tunggal ika , Menjelaskan jenis-jenis dan faktor penyebab keberagaman bangsa indonesia.'
      },
      {
        mapel: 'Bahasa Indonesia',
        kelompok: 'Kelompok A',
        nilaiAkhir: 75,
        predikat: 'B',
        catatan: 'Mencapai Kompetensi dengan sangat baik dalam hal peserta didik mampu mengidentifikasi ide pokokargumen pendukung dan pesan dari teks lisam.\n\nPerlu peningkatan dalam hal Peserta didik terampil menyajikan atu mendemonstrasikan langkah langkah suatu prosessecara runtut dan komunikatif.'
      },
      {
        mapel: 'Bahasa Inggris',
        kelompok: 'Kelompok A',
        nilaiAkhir: 70,
        predikat: 'C',
        catatan: 'Mencapai Kompetensi dengan sangat baik dalam hal mengenal dan menyebutkan benda benda sekitarnya.\n\nPerlu peningkatan dalam hal menggunakan preposiotion dalam kalimat, mendeskripsikan benda secara sederhana dalam bahasa inggris lisan dan tulisan.'
      },
      {
        mapel: 'Matematika (Umum)',
        kelompok: 'Kelompok A',
        nilaiAkhir: 70,
        predikat: 'C',
        catatan: 'Mencapai Kompetensi dengan sangat baik dalam hal Mengidentifikasi konstanta, koefisien, variabel dan suku pada bentuk aljabar.\n\nPerlu peningkatan dalam hal Mengubah bentuk aljabar ke bentuk aljabar ekuivalen dengan menggunakan sifat-sifat, operasi aljabar dan memfaktorkan , Memodelkan suatu permasalahan menjadi suatu bentuk aljabar dan penyelesaiaannya, Menentukan kedudukan dua garis dan hubungkan antar sudut pada dua garis sejajar yang di potong oleh sebuah garis transversal.'
      },
      {
        mapel: 'Ilmu Pengetahuan Alam (IPA)',
        kelompok: 'Kelompok A',
        nilaiAkhir: 81,
        predikat: 'B',
        catatan: 'Mencapai Kompetensi dengan sangat baik dalam hal Mengidentifikasi tingkatan organisasi kehidupan, Menganalisis jenis-jenis dan dampak dari pencemaran lingkungan.'
      },
      {
        mapel: 'Ilmu Pengetahuan Sosial (IPS)',
        kelompok: 'Kelompok A',
        nilaiAkhir: 75,
        predikat: 'B',
        catatan: 'Mencapai Kompetensi dengan sangat baik dalam hal mengenali konsep dasar ilmu sejarah yaitu manusia,ruang waktu kronologi perubahan, memahami keberagaman kondisi geografis indonesia.\n\nPerlu peningkatan dalam hal Merujuk pada kompetensi dan keterampilan spesifik yang berfokus pada ekonomi,interaksi sosial dan lingkungan.'
      },
      {
        mapel: 'Pendidikan Jasmani, Olahraga, dan Kesehatan',
        kelompok: 'Kelompok B',
        nilaiAkhir: 85,
        predikat: 'A',
        catatan: 'Mencapai Kompetensi dengan sangat baik dalam hal Menganalisis dan memahami pola makan sehat, bergizi, seimbang, dan pengaruhnya terhadap kesehatan.\n\nPerlu peningkatan dalam hal merancang serta mempraktikkan program latihan kebungaran jasmani terkait kesehatan..'
      },
      {
        mapel: 'Informatika',
        kelompok: 'Kelompok B',
        nilaiAkhir: 76,
        predikat: 'B',
        catatan: 'Mencapai Kompetensi dengan sangat baik dalam hal Memahami Konsep Dasar Informatika dan Teknologi.\n\nPerlu peningkatan dalam hal Memahami Konsep Algoritma dan Pemecahan Masalah, Mengembangkan Keterampilan Berpikir Komputasional.'
      },
      {
        mapel: 'Seni Rupa',
        kelompok: 'Kelompok B',
        nilaiAkhir: 78,
        predikat: 'B',
        catatan: 'Mencapai Kompetensi dengan sangat baik dalam hal peserta didik mampu membuat karya rupa dengan menggunakan dan menggabungkan pengetahuan dalam bentuk logo dan tipografi.\n\nPerlu peningkatan dalam hal peserta didik mampu membuat karya dengan tujuan mengubah lingkuangan sekitar sekolah.'
      }
    ],
    kokurikuler: 'Pada semester ini, ananda menunjukkan capaian yang cukup baik dalam penguatan profil lulusan, yang ditunjukkan melalui kegiatan kokurikuler Literasi dan Numerasi.\n\nPada dimensi penalaran kritis, ananda berkembang dalam subdimensi penyampaian argumentasi.',
    ekstrakurikuler: [
      {
        id: 'ex-1',
        namaEkstra: 'Pramuka',
        keterangan: 'Mampu dalam menerapkan nilai-nilai Dasa Darma dan Trisatya, selalu hadir tepat waktu, aktif membantu teman dalam regu, serta menunjukkan perkembangan yang baik dalam memahami pengetahuan kepramukaan.'
      }
    ],
    kehadiran: { sakit: 1, izin: 1, alpa: 1 },
    catatanWaliKelas: 'Perlu meningkatkan motivasi belajar, kedisiplinan, dan tanggung jawab dalam mengikuti pembelajaran, Partisipasi dalam kegiatan belajar masih perlu ditingkatkan.',
    statusKenaikan: 'Naik ke kelas VIII',
    tanggapanOrangTua: '',
    tempatTanggalCetak: 'Palu, 22 Juni 2026',
    namaWaliKelas: 'RINA, S.Pd., M.Pd',
    nipWaliKelas: 'NIP 9740817200932003',
    namaKepalaSekolah: schoolProfile?.kepalaSekolah || 'Martha Taewa, S.Pd',
    nipKepalaSekolah: schoolProfile?.nipKepalaSekolah ? `NIP ${schoolProfile.nipKepalaSekolah}` : 'NIP 197103192007012011'
  };
};

export const RaporModule: React.FC<RaporModuleProps> = ({
  reports,
  students,
  onAddReport,
  onUpdateReport,
  onDeleteReport,
  onBackToHome,
  schoolProfile
}) => {
  const [search, setSearch] = useState('');
  const [filterRombel, setFilterRombel] = useState('ALL');
  const [selectedReportForPrint, setSelectedReportForPrint] = useState<StudentReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<StudentReport | null>(null);
  const [activeTabForm, setActiveTabForm] = useState<'identitas' | 'nilai' | 'ekstra' | 'catatan' | 'ttd' | 'tambahData'>('identitas');

  // Form State
  const [formData, setFormData] = useState<Omit<StudentReport, 'id'>>({
    studentId: '',
    nis: '3899',
    nisn: '3124628953',
    studentName: 'ABDULAH',
    rombel: '7 A',
    fase: 'D',
    namaSekolah: schoolProfile?.namaSekolah || 'SMP NEGERI 11 PALU',
    alamat: schoolProfile?.alamat || 'Jl. Keramik',
    semester: '2',
    tahunAjaran: '2025/2026',
    scores: [],
    kokurikuler: '',
    ekstrakurikuler: [],
    customFields: [],
    kehadiran: { sakit: 0, izin: 0, alpa: 0 },
    catatanWaliKelas: '',
    statusKenaikan: 'Naik ke kelas VIII',
    tanggapanOrangTua: '',
    tempatTanggalCetak: 'Palu, 22 Juni 2026',
    namaWaliKelas: 'RINA, S.Pd., M.Pd',
    nipWaliKelas: 'NIP 9740817200932003',
    namaKepalaSekolah: schoolProfile?.kepalaSekolah || 'Martha Taewa, S.Pd',
    nipKepalaSekolah: schoolProfile?.nipKepalaSekolah ? `NIP ${schoolProfile.nipKepalaSekolah}` : 'NIP 197103192007012011'
  });

  const filteredReports = reports.filter(r => {
    const matchSearch = r.studentName.toLowerCase().includes(search.toLowerCase()) || r.nisn.includes(search) || (r.nis && r.nis.includes(search));
    const matchRombel = filterRombel === 'ALL' || r.rombel === filterRombel;
    return matchSearch && matchRombel;
  });

  const handleOpenAdd = () => {
    setEditingReport(null);
    const sample = getSampleAbdulahReport(schoolProfile);
    const firstStudent = students[0];
    if (firstStudent) {
      sample.studentId = firstStudent.id;
      sample.studentName = firstStudent.nama;
      sample.nisn = firstStudent.nisn;
      sample.nis = firstStudent.nis || '3899';
      sample.rombel = firstStudent.rombel || '7 A';
    }
    const { id, ...dataWithoutId } = sample;
    setFormData(dataWithoutId);
    setActiveTabForm('identitas');
    setIsModalOpen(true);
  };

  const handleLoadAbdulahPreset = () => {
    const sample = getSampleAbdulahReport(schoolProfile);
    onAddReport(sample);
    setSelectedReportForPrint(sample);
  };

  const handleEditReport = (report: StudentReport) => {
    setEditingReport(report);
    const { id, ...dataWithoutId } = report;
    setFormData({
      ...dataWithoutId,
      scores: Array.isArray(report.scores) ? report.scores : [],
      ekstrakurikuler: Array.isArray(report.ekstrakurikuler) ? report.ekstrakurikuler : [],
      customFields: Array.isArray(report.customFields) ? report.customFields : []
    });
    setActiveTabForm('identitas');
    setIsModalOpen(true);
  };

  const handleSelectStudentChange = (stdId: string) => {
    const std = students.find(s => s.id === stdId);
    if (std) {
      setFormData(prev => ({
        ...prev,
        studentId: std.id,
        nisn: std.nisn,
        nis: std.nis || prev.nis,
        studentName: std.nama,
        rombel: std.rombel || prev.rombel,
        alamat: std.alamat || prev.alamat
      }));
    }
  };

  // Subject Handlers
  const handleScoreChange = (index: number, field: keyof SubjectScore, value: any) => {
    const updatedScores = [...formData.scores];
    updatedScores[index] = {
      ...updatedScores[index],
      [field]: value
    };

    // Auto calculate predikat if nilaiAkhir changes
    if (field === 'nilaiAkhir') {
      const val = parseInt(value) || 0;
      updatedScores[index].predikat = val >= 85 ? 'A' : val >= 75 ? 'B' : val >= 65 ? 'C' : 'D';
    }

    setFormData({ ...formData, scores: updatedScores });
  };

  const handleAddSubject = (kelompokType: 'Kelompok A' | 'Kelompok B') => {
    const newSubject: SubjectScore = {
      mapel: kelompokType === 'Kelompok A' ? 'Mata Pelajaran Baru' : 'Muatan Lokal Baru',
      kelompok: kelompokType,
      nilaiAkhir: 75,
      predikat: 'B',
      catatan: 'Mencapai Kompetensi dengan baik dalam pembelajaran.'
    };
    setFormData({
      ...formData,
      scores: [...formData.scores, newSubject]
    });
  };

  const handleRemoveSubject = (index: number) => {
    const updated = formData.scores.filter((_, i) => i !== index);
    setFormData({ ...formData, scores: updated });
  };

  // Extra Handlers
  const handleAddExtra = () => {
    const newEx: ExtraScore = {
      id: `ex-${Date.now()}`,
      namaEkstra: 'Ekstrakurikuler',
      keterangan: 'Aktif mengikuti kegiatan ekstrakurikuler dengan sangat baik.'
    };
    setFormData({
      ...formData,
      ekstrakurikuler: [...(formData.ekstrakurikuler || []), newEx]
    });
  };

  const handleExtraChange = (index: number, field: keyof ExtraScore, value: string) => {
    const list = [...(formData.ekstrakurikuler || [])];
    list[index] = { ...list[index], [field]: value };
    setFormData({ ...formData, ekstrakurikuler: list });
  };

  const handleRemoveExtra = (index: number) => {
    const list = (formData.ekstrakurikuler || []).filter((_, i) => i !== index);
    setFormData({ ...formData, ekstrakurikuler: list });
  };

  // Custom Field Handlers
  const handleAddCustomField = () => {
    const newField: CustomDataField = {
      id: `cf-${Date.now()}`,
      judul: 'Catatan Prestasi / Data Tambahan Baru',
      isi: 'Mendapatkan Juara 1 lomba sains/seni tingkat kabupaten.'
    };
    setFormData(prev => ({
      ...prev,
      customFields: [...(prev.customFields || []), newField]
    }));
  };

  const handleCustomFieldChange = (index: number, field: keyof CustomDataField, value: string) => {
    const updated = [...(formData.customFields || [])];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setFormData({ ...formData, customFields: updated });
  };

  const handleRemoveCustomField = (index: number) => {
    const updated = (formData.customFields || []).filter((_, i) => i !== index);
    setFormData({ ...formData, customFields: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingReport) {
      onUpdateReport({
        ...formData,
        id: editingReport.id
      });
    } else {
      const newReport: StudentReport = {
        ...formData,
        id: `rep-${Date.now().toString().slice(-6)}`
      };
      onAddReport(newReport);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="sticky top-[57px] z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/95 backdrop-blur-xl border border-slate-200/80 p-5 rounded-2xl shadow-md">
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
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Rapor Kurikulum Merdeka</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                {reports.length} Lembar Rapor
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Laporan Hasil Belajar (LHB), capaian kompetensi, kokurikuler, dan cetak dokumen resmi PDF
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleLoadAbdulahPreset}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
            title="Muat contoh format Rapor Kurikulum Merdeka persis seperti PDF sampel ABDULAH"
          >
            <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
            <span>+ Contoh Rapor PDF (ABDULAH)</span>
          </button>

          <button
            onClick={() => exportToCSV(reports, 'DAPODIK_DATA_RAPOR')}
            className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Entri Rapor Baru</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama murid, NIS, atau NISN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-slate-500 font-medium">Rombel/Kelas:</span>
          <select
            value={filterRombel}
            onChange={(e) => setFilterRombel(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">Semua Kelas</option>
            {Array.from(new Set(reports.map(r => r.rombel))).map(rom => (
              <option key={rom} value={rom}>{rom}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredReports.map((report) => {
          const scoresList = Array.isArray(report.scores) ? report.scores : [];
          const totalVal = scoresList.reduce((acc, curr) => acc + (curr.nilaiAkhir || curr.nilaiPengetahuan || 0), 0);
          const avgScore = Math.round(totalVal / (scoresList.length || 1));

          return (
            <div
              key={report.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-rose-400 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-3.5 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] bg-rose-50 text-rose-700 font-extrabold px-2 py-0.5 rounded-full border border-rose-200">
                        Kelas {report.rombel}
                      </span>
                      {report.fase && (
                        <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                          Fase {report.fase}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-2 leading-snug group-hover:text-rose-600 transition-colors">
                      {report.studentName}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      NIS/NISN: {report.nis || '-'} / {report.nisn}
                    </p>
                  </div>
                  <div className="text-right bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="text-2xl font-black text-rose-600 leading-none">{avgScore}</div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold mt-1">Rata-Rata</div>
                  </div>
                </div>

                <div className="py-3.5 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400">Sekolah:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[180px]">{report.namaSekolah || schoolProfile?.namaSekolah || 'SMP NEGERI 11 PALU'}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400">Semester / T.A.:</span>
                    <span className="font-semibold text-slate-900">Semester {report.semester} ({report.tahunAjaran})</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400">Mata Pelajaran:</span>
                    <span className="font-bold text-slate-900">{scoresList.length} Mapel (Kelompok A & B)</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400">Kehadiran (S/I/A):</span>
                    <span className="font-semibold text-slate-900">{report.kehadiran?.sakit || 0} S, {report.kehadiran?.izin || 0} I, {report.kehadiran?.alpa || 0} A</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400">Keterangan Kenaikan:</span>
                    <span className="font-bold text-emerald-600">{report.statusKenaikan || 'Naik ke kelas VIII'}</span>
                  </div>
                  {report.catatanWaliKelas && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700 italic line-clamp-2 mt-1">
                      "{report.catatanWaliKelas}"
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedReportForPrint(report)}
                  className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Pratinjau PDF</span>
                </button>

                <button
                  onClick={() => handleEditReport(report)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  title="Edit Data Rapor"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onDeleteReport(report.id)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Hapus Rapor"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Editor Modal Add / Edit Student Report */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-600 rounded-xl">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold tracking-tight">
                    {editingReport ? `Edit Rapor: ${editingReport.studentName}` : 'Entri Rapor Kurikulum Merdeka'}
                  </h2>
                  <p className="text-xs text-slate-300">
                    Lengkapi identitas, capaian nilai kelompok A & B, kokurikuler, dan tanda tangan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Navigation Tabs */}
            <div className="flex items-center gap-1 px-6 py-2 bg-slate-100 border-b border-slate-200 text-xs overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTabForm('identitas')}
                className={`px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTabForm === 'identitas'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>1. Identitas Murid & Sekolah</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTabForm('nilai')}
                className={`px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTabForm === 'nilai'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>2. Nilai & Capaian ({formData.scores.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTabForm('ekstra')}
                className={`px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTabForm === 'ekstra'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>3. Kokurikuler & Ekstra</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTabForm('catatan')}
                className={`px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTabForm === 'catatan'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>4. Kehadiran & Catatan</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTabForm('ttd')}
                className={`px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTabForm === 'ttd'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>5. Tanda Tangan & Tanggal</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTabForm('tambahData')}
                className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shadow-xs ${
                  activeTabForm === 'tambahData'
                    ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-300'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-white" />
                <span>6. + Tambah Data / Kustom { (formData.customFields || []).length > 0 ? `(${formData.customFields.length})` : '' }</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* TAB 1: IDENTITAS */}
              {activeTabForm === 'identitas' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold">Pilih Siswa dari Database DAPODIK</span>
                      <p className="text-[11px] text-rose-600">
                        Atau ubah data di bawah secara manual untuk lembar rapor ini
                      </p>
                    </div>
                    {students.length > 0 && (
                      <select
                        value={formData.studentId}
                        onChange={(e) => handleSelectStudentChange(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-rose-300 rounded-xl text-slate-900 font-bold focus:outline-none"
                      >
                        <option value="">-- Pilih Siswa --</option>
                        {students.map(s => (
                          <option key={s.id} value={s.id}>{s.nama} ({s.rombel || 'Kelas 7'})</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Nama Murid *</label>
                      <input
                        type="text"
                        required
                        value={formData.studentName}
                        onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">NIS *</label>
                      <input
                        type="text"
                        value={formData.nis || ''}
                        onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                        placeholder="Contoh: 3899"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">NISN *</label>
                      <input
                        type="text"
                        required
                        value={formData.nisn}
                        onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                        placeholder="Contoh: 3124628953"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Kelas / Rombel *</label>
                      <input
                        type="text"
                        required
                        value={formData.rombel}
                        onChange={(e) => setFormData({ ...formData, rombel: e.target.value })}
                        placeholder="Contoh: 7 A"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Fase *</label>
                      <input
                        type="text"
                        value={formData.fase || 'D'}
                        onChange={(e) => setFormData({ ...formData, fase: e.target.value })}
                        placeholder="Contoh: D (SMP) / A,B,C (SD)"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Semester *</label>
                      <input
                        type="text"
                        value={formData.semester}
                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                        placeholder="Contoh: 2 atau Genap"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Tahun Ajaran *</label>
                      <input
                        type="text"
                        value={formData.tahunAjaran}
                        onChange={(e) => setFormData({ ...formData, tahunAjaran: e.target.value })}
                        placeholder="Contoh: 2025/2026"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Nama Sekolah *</label>
                      <input
                        type="text"
                        value={formData.namaSekolah || ''}
                        onChange={(e) => setFormData({ ...formData, namaSekolah: e.target.value })}
                        placeholder="Contoh: SMP NEGERI 11 PALU"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Alamat Sekolah *</label>
                      <input
                        type="text"
                        value={formData.alamat || ''}
                        onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                        placeholder="Contoh: Jl. Keramik"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: NILAI & CAPAIAN KOMPETENSI */}
              {activeTabForm === 'nilai' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      Mata Pelajaran & Capaian Kompetensi (Kelompok A & B)
                    </h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddSubject('Kelompok A')}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold hover:bg-indigo-100 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> + Mapel Kelompok A
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSubject('Kelompok B')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold hover:bg-emerald-100 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> + Mapel Kelompok B
                      </button>
                    </div>
                  </div>

                  {formData.scores.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                      <p className="text-slate-500 font-medium">Belum ada mata pelajaran yang ditambahkan.</p>
                      <button
                        type="button"
                        onClick={() => handleAddSubject('Kelompok A')}
                        className="mt-2 px-4 py-2 bg-rose-600 text-white rounded-xl font-bold"
                      >
                        Tambah Mapel Pertama
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.scores.map((score, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex-1 flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                                {idx + 1}
                              </span>
                              <input
                                type="text"
                                value={score.mapel}
                                onChange={(e) => handleScoreChange(idx, 'mapel', e.target.value)}
                                placeholder="Nama Mata Pelajaran"
                                className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-rose-500 focus:outline-none"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <select
                                value={score.kelompok || 'Kelompok A'}
                                onChange={(e) => handleScoreChange(idx, 'kelompok', e.target.value)}
                                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                              >
                                <option value="Kelompok A">Kelompok A</option>
                                <option value="Kelompok B">Kelompok B</option>
                              </select>

                              <div className="flex items-center gap-1">
                                <span className="font-bold text-slate-600">Nilai:</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={score.nilaiAkhir ?? score.nilaiPengetahuan ?? 75}
                                  onChange={(e) => handleScoreChange(idx, 'nilaiAkhir', parseInt(e.target.value) || 0)}
                                  className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-xl font-bold text-center text-rose-600 focus:border-rose-500"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveSubject(idx)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Hapus Mapel"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-slate-600 font-bold mb-1">
                              Capaian Kompetensi (Deskripsi Pembelajaran):
                            </label>
                            <textarea
                              rows={3}
                              value={score.catatan || ''}
                              onChange={(e) => handleScoreChange(idx, 'catatan', e.target.value)}
                              placeholder="Tuliskan capaian yang berhasil dan area yang perlu ditingkatkan..."
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:border-rose-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: KOKURIKULER & EKSTRAKURIKULER */}
              {activeTabForm === 'ekstra' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Kokurikuler Box */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-rose-600" />
                      <span>Kokurikuler (Penguatan Profil Lulusan)</span>
                    </h3>
                    <textarea
                      rows={3}
                      value={formData.kokurikuler || ''}
                      onChange={(e) => setFormData({ ...formData, kokurikuler: e.target.value })}
                      placeholder="Contoh: Pada semester ini, ananda menunjukkan capaian yang cukup baik dalam penguatan profil lulusan..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  {/* Ekstrakurikuler List */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between border-b pb-2 border-slate-200">
                      <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <Award className="w-4 h-4 text-emerald-600" />
                        <span>Kegiatan Ekstrakurikuler</span>
                      </h3>
                      <button
                        type="button"
                        onClick={handleAddExtra}
                        className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> + Ekstra
                      </button>
                    </div>

                    {(formData.ekstrakurikuler || []).length === 0 ? (
                      <p className="text-slate-400 italic text-center py-4">Belum ada kegiatan ekstrakurikuler.</p>
                    ) : (
                      (formData.ekstrakurikuler || []).map((ex, exIdx) => (
                        <div key={exIdx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <input
                              type="text"
                              value={ex.namaEkstra}
                              onChange={(e) => handleExtraChange(exIdx, 'namaEkstra', e.target.value)}
                              placeholder="Nama Ekstrakurikuler (misal: Pramuka)"
                              className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveExtra(exIdx)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={ex.keterangan}
                            onChange={(e) => handleExtraChange(exIdx, 'keterangan', e.target.value)}
                            placeholder="Keterangan capaian dan keaktifan peserta didik..."
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: KEHADIRAN & CATATAN */}
              {activeTabForm === 'catatan' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <h3 className="font-extrabold text-slate-900 text-sm">Ketidakhadiran (Absensi)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Sakit (Hari)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.kehadiran?.sakit || 0}
                          onChange={(e) => setFormData({
                            ...formData,
                            kehadiran: { ...(formData.kehadiran || { sakit: 0, izin: 0, alpa: 0 }), sakit: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Izin (Hari)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.kehadiran?.izin || 0}
                          onChange={(e) => setFormData({
                            ...formData,
                            kehadiran: { ...(formData.kehadiran || { sakit: 0, izin: 0, alpa: 0 }), izin: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Tanpa Keterangan / Alpa (Hari)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.kehadiran?.alpa || 0}
                          onChange={(e) => setFormData({
                            ...formData,
                            kehadiran: { ...(formData.kehadiran || { sakit: 0, izin: 0, alpa: 0 }), alpa: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div>
                      <label className="block text-slate-900 font-extrabold text-sm mb-1">Catatan Wali Kelas</label>
                      <textarea
                        rows={3}
                        value={formData.catatanWaliKelas}
                        onChange={(e) => setFormData({ ...formData, catatanWaliKelas: e.target.value })}
                        placeholder="Tuliskan pesan pembimbingan dan apresiasi dari wali kelas..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:border-rose-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-900 font-extrabold text-sm mb-1">Keterangan Kenaikan Kelas</label>
                      <input
                        type="text"
                        value={formData.statusKenaikan}
                        onChange={(e) => setFormData({ ...formData, statusKenaikan: e.target.value })}
                        placeholder="Contoh: Naik ke kelas VIII"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-emerald-700 focus:border-rose-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-900 font-extrabold text-sm mb-1">Tanggapan Orang Tua/Wali Murid (Opsional)</label>
                      <textarea
                        rows={2}
                        value={formData.tanggapanOrangTua || ''}
                        onChange={(e) => setFormData({ ...formData, tanggapanOrangTua: e.target.value })}
                        placeholder="Dapat dikosongkan jika diisi manual oleh orang tua setelah dicetak..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: TANDA TANGAN */}
              {activeTabForm === 'ttd' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Tempat & Tanggal Cetak Rapor *</label>
                      <input
                        type="text"
                        value={formData.tempatTanggalCetak || 'Palu, 22 Juni 2026'}
                        onChange={(e) => setFormData({ ...formData, tempatTanggalCetak: e.target.value })}
                        placeholder="Contoh: Palu, 22 Juni 2026"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Nama Wali Kelas *</label>
                      <input
                        type="text"
                        value={formData.namaWaliKelas || ''}
                        onChange={(e) => setFormData({ ...formData, namaWaliKelas: e.target.value })}
                        placeholder="Contoh: RINA, S.Pd., M.Pd"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">NIP Wali Kelas *</label>
                      <input
                        type="text"
                        value={formData.nipWaliKelas || ''}
                        onChange={(e) => setFormData({ ...formData, nipWaliKelas: e.target.value })}
                        placeholder="Contoh: NIP 9740817200932003"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Nama Kepala Sekolah *</label>
                      <input
                        type="text"
                        value={formData.namaKepalaSekolah || ''}
                        onChange={(e) => setFormData({ ...formData, namaKepalaSekolah: e.target.value })}
                        placeholder="Contoh: Martha Taewa, S.Pd"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">NIP Kepala Sekolah *</label>
                      <input
                        type="text"
                        value={formData.nipKepalaSekolah || ''}
                        onChange={(e) => setFormData({ ...formData, nipKepalaSekolah: e.target.value })}
                        placeholder="Contoh: NIP 197103192007012011"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: TAMBAH DATA & KUSTOM */}
              {activeTabForm === 'tambahData' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-rose-500/10 to-indigo-500/10 border border-emerald-200 rounded-2xl">
                    <div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm mb-1">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Tambah Data Baru & Komponen Kustom Rapor</span>
                    </div>
                    <p className="text-slate-600 text-[11.5px] leading-relaxed">
                      Gunakan menu ini untuk menambahkan komponen data baru ke lembar rapor murid ini, seperti mata pelajaran tambahan, ekstrakurikuler, atau catatan prestasi kustom.
                    </p>
                  </div>

                  {/* Fast Action Shortcut Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        handleAddSubject('Kelompok A');
                        setActiveTabForm('nilai');
                      }}
                      className="p-3.5 bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-200 rounded-2xl text-left transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-indigo-900 text-xs flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-indigo-600" /> + Mapel Kelompok A
                        </span>
                        <Plus className="w-4 h-4 text-indigo-600 group-hover:scale-125 transition-transform" />
                      </div>
                      <p className="text-[10.5px] text-indigo-700">Tambah mata pelajaran utama baru (Bahasa Daerah, Agama, dll)</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleAddSubject('Kelompok B');
                        setActiveTabForm('nilai');
                      }}
                      className="p-3.5 bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200 rounded-2xl text-left transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-emerald-900 text-xs flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-emerald-600" /> + Mapel Kelompok B
                        </span>
                        <Plus className="w-4 h-4 text-emerald-600 group-hover:scale-125 transition-transform" />
                      </div>
                      <p className="text-[10.5px] text-emerald-700">Tambah Muatan Lokal (Mulok) atau Seni & Prakarya</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleAddExtra();
                        setActiveTabForm('ekstra');
                      }}
                      className="p-3.5 bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200 rounded-2xl text-left transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-amber-900 text-xs flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-amber-600" /> + Ekstrakurikuler
                        </span>
                        <Plus className="w-4 h-4 text-amber-600 group-hover:scale-125 transition-transform" />
                      </div>
                      <p className="text-[10.5px] text-amber-700">Tambah kegiatan ekstra (Pramuka, PMR, Olahraga, Seni)</p>
                    </button>
                  </div>

                  {/* Custom Fields Section */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                          <PlusCircle className="w-4 h-4 text-rose-600" />
                          <span>Catatan Khusus & Data Tambahan Kustom</span>
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Tambahkan blok catatan kustom yang akan ikut tercetak pada halaman 2 Rapor
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCustomField}
                        className="px-3.5 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> + Tambah Catatan Kustom
                      </button>
                    </div>

                    {(formData.customFields || []).length === 0 ? (
                      <div className="text-center py-6 bg-white border border-dashed border-slate-300 rounded-xl">
                        <p className="text-slate-500 text-xs font-medium">Belum ada data/catatan kustom tambahan.</p>
                        <button
                          type="button"
                          onClick={handleAddCustomField}
                          className="mt-2 text-rose-600 font-bold hover:underline text-xs cursor-pointer"
                        >
                          + Klik di sini untuk membuat catatan tambahan
                        </button>
                      </div>
                    ) : (
                      (formData.customFields || []).map((field, cfIdx) => (
                        <div key={field.id || cfIdx} className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1">
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">Judul Komponen / Section:</label>
                              <input
                                type="text"
                                value={field.judul}
                                onChange={(e) => handleCustomFieldChange(cfIdx, 'judul', e.target.value)}
                                placeholder="Contoh: Prestasi Murid, Bimbingan Konseling, Dll"
                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:bg-white focus:border-rose-500"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomField(cfIdx)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Section Ini"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Isi / Keterangan Data:</label>
                            <textarea
                              rows={2}
                              value={field.isi}
                              onChange={(e) => handleCustomFieldChange(cfIdx, 'isi', e.target.value)}
                              placeholder="Tuliskan isi keterangan atau rincian data tambahan..."
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-rose-500"
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                >
                  Batal
                </button>

                <div className="flex items-center gap-2">
                  {activeTabForm !== 'ttd' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTabForm === 'identitas') setActiveTabForm('nilai');
                        else if (activeTabForm === 'nilai') setActiveTabForm('ekstra');
                        else if (activeTabForm === 'ekstra') setActiveTabForm('catatan');
                        else if (activeTabForm === 'catatan') setActiveTabForm('ttd');
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-900"
                    >
                      Lanjut →
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-sm transition-colors"
                  >
                    Simpan Lembar Rapor
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printed Report Modal (Matching PDF Sample Exactly) */}
      {selectedReportForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl w-full max-w-5xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Print Top Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 no-print">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
                  PDF
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Pratinjau Lembar Rapor Kurikulum Merdeka
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedReportForPrint.studentName} - NIS: {selectedReportForPrint.nis || '-'} - NISN: {selectedReportForPrint.nisn}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleEditReport(selectedReportForPrint);
                    setSelectedReportForPrint(null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-300"
                >
                  <Edit3 className="w-4 h-4 text-rose-600" />
                  <span>Edit Data Rapor Ini</span>
                </button>

                <button
                  onClick={() => printElement('printable-rapor-content', `Rapor_Kurikulum_Merdeka_${selectedReportForPrint.studentName}`)}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md transition-all flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Simpan PDF Resmi</span>
                </button>

                <button
                  onClick={() => setSelectedReportForPrint(null)}
                  className="p-2 text-slate-500 hover:text-slate-900 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Preview Sheet Area */}
            <div className="p-4 sm:p-8 overflow-y-auto bg-slate-200/80 flex justify-center">
              <div
                id="printable-rapor-content"
                className="w-full flex flex-col items-center gap-8 text-black font-sans text-xs leading-relaxed"
                style={{ fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }}
              >
                {/* SHEET / PAGE 1 */}
                <div className="bg-white text-black p-8 sm:p-12 w-full max-w-[210mm] min-h-[297mm] shadow-xl border border-slate-300 relative select-text flex flex-col justify-between print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:max-w-none print:min-h-0">
                  {/* Background Watermark Logo */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
                    <div className="w-96 h-96 rounded-full border-[16px] border-black flex items-center justify-center text-8xl font-black">
                      SMPN 11
                    </div>
                  </div>

                  {/* PAGE 1 CONTENT */}
                  <div className="relative z-10 space-y-6 bg-white text-black flex-1">
                    {/* Header Student & School Info Box (Page 1) */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[11px] pb-3 border-b border-black bg-white text-black">
                      <div className="space-y-1">
                        <div className="flex">
                          <span className="w-24 font-normal">Nama Murid</span>
                          <span className="font-bold">: {selectedReportForPrint.studentName}</span>
                        </div>
                        <div className="flex">
                          <span className="w-24 font-normal">NIS/NISN</span>
                          <span className="font-bold">: {selectedReportForPrint.nis || '3899'} / {selectedReportForPrint.nisn}</span>
                        </div>
                        <div className="flex">
                          <span className="w-24 font-normal">Sekolah</span>
                          <span className="font-bold">: {selectedReportForPrint.namaSekolah || schoolProfile?.namaSekolah || 'SMP NEGERI 11 PALU'}</span>
                        </div>
                        <div className="flex">
                          <span className="w-24 font-normal">Alamat</span>
                          <span className="font-bold">: {selectedReportForPrint.alamat || schoolProfile?.alamat || 'Jl. Keramik'}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex">
                          <span className="w-24 font-normal">Kelas</span>
                          <span className="font-bold">: {selectedReportForPrint.rombel}</span>
                        </div>
                        <div className="flex">
                          <span className="w-24 font-normal">Fase</span>
                          <span className="font-bold">: {selectedReportForPrint.fase || 'D'}</span>
                        </div>
                        <div className="flex">
                          <span className="w-24 font-normal">Semester</span>
                          <span className="font-bold">: {selectedReportForPrint.semester}</span>
                        </div>
                        <div className="flex">
                          <span className="w-24 font-normal">Tahun Ajaran</span>
                          <span className="font-bold">: {selectedReportForPrint.tahunAjaran}</span>
                        </div>
                      </div>
                    </div>

                    {/* Main Title */}
                    <div className="text-center py-2 bg-white text-black">
                      <h1 className="text-base font-extrabold tracking-wider uppercase underline decoration-1 underline-offset-4 text-black">
                        LAPORAN HASIL BELAJAR
                      </h1>
                    </div>

                    {/* Subject Scores Table */}
                    <div className="border border-black bg-white text-black overflow-hidden">
                      <table className="w-full text-left text-[11px] border-collapse bg-white text-black">
                        <thead>
                          <tr className="border-b border-black bg-slate-100 text-black font-bold">
                            <th className="py-2 px-2.5 border-r border-black text-center w-8 bg-slate-100 text-black">No</th>
                            <th className="py-2 px-3 border-r border-black w-48 bg-slate-100 text-black">Mata Pelajaran</th>
                            <th className="py-2 px-2 border-r border-black text-center w-20 bg-slate-100 text-black">Nilai Akhir</th>
                            <th className="py-2 px-3 bg-slate-100 text-black">Capaian Kompetensi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* KELOMPOK A */}
                          <tr className="border-b border-black bg-slate-100 text-black font-bold">
                            <td colSpan={4} className="py-1.5 px-3 bg-slate-100 text-black">Kelompok A</td>
                          </tr>

                          {(selectedReportForPrint.scores || [])
                            .filter(sc => !sc.kelompok || sc.kelompok === 'Kelompok A')
                            .map((sc, idx) => (
                              <tr key={idx} className="border-b border-black bg-white text-black">
                                <td className="py-2 px-2 border-r border-black text-center align-top font-bold bg-white text-black">{idx + 1}</td>
                                <td className="py-2 px-3 border-r border-black align-top font-semibold bg-white text-black">{sc.mapel}</td>
                                <td className="py-2 px-2 border-r border-black text-center align-top font-bold text-sm bg-white text-black">
                                  {sc.nilaiAkhir ?? sc.nilaiPengetahuan ?? 75}
                                </td>
                                <td className="py-2 px-3 align-top whitespace-pre-line text-[10.5px] bg-white text-black">
                                  {sc.catatan || 'Mencapai Kompetensi dengan baik.'}
                                </td>
                              </tr>
                            ))}

                          {/* KELOMPOK B */}
                          <tr className="border-b border-black bg-slate-100 text-black font-bold">
                            <td colSpan={4} className="py-1.5 px-3 bg-slate-100 text-black">Kelompok B</td>
                          </tr>

                          {(selectedReportForPrint.scores || [])
                            .filter(sc => sc.kelompok === 'Kelompok B')
                            .map((sc, idx) => (
                              <tr key={idx} className="border-b border-black bg-white text-black">
                                <td className="py-2 px-2 border-r border-black text-center align-top font-bold bg-white text-black">{idx + 1}</td>
                                <td className="py-2 px-3 border-r border-black align-top font-semibold bg-white text-black">{sc.mapel}</td>
                                <td className="py-2 px-2 border-r border-black text-center align-top font-bold text-sm bg-white text-black">
                                  {sc.nilaiAkhir ?? sc.nilaiPengetahuan ?? 75}
                                </td>
                                <td className="py-2 px-3 align-top whitespace-pre-line text-[10.5px] bg-white text-black">
                                  {sc.catatan || 'Mencapai Kompetensi dengan baik.'}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Page 1 Footer Line */}
                  <div className="pt-4 mt-6 border-t border-black/40 flex justify-between items-center text-[10px] font-bold text-black relative z-10 bg-white">
                    <div>
                      {selectedReportForPrint.rombel} | {selectedReportForPrint.studentName} | {selectedReportForPrint.nis || '3899'}
                    </div>
                    <div>Halaman : 1</div>
                  </div>
                </div>

                {/* PAGE BREAK SEPARATOR (NO PRINT) */}
                <div className="no-print w-full max-w-[210mm] flex items-center justify-center gap-4 py-2">
                  <div className="h-[1px] bg-slate-300 flex-1"></div>
                  <span className="bg-slate-200 text-slate-700 px-4 py-1 rounded-full text-[10px] font-bold border border-slate-300 shadow-xs">
                    --- Batas Halaman 2 (Lembar Berikutnya) ---
                  </span>
                  <div className="h-[1px] bg-slate-300 flex-1"></div>
                </div>

                {/* SHEET / PAGE 2 */}
                <div className="bg-white text-black p-8 sm:p-12 w-full max-w-[210mm] min-h-[297mm] shadow-xl border border-slate-300 relative select-text flex flex-col justify-between print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:max-w-none print:min-h-0 print:page-break-before">
                  {/* Background Watermark Logo */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
                    <div className="w-96 h-96 rounded-full border-[16px] border-black flex items-center justify-center text-8xl font-black">
                      SMPN 11
                    </div>
                  </div>

                  <div className="relative z-10 space-y-5 bg-white text-black flex-1">
                    {/* PAGE 2 HEADER (Student Info) */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[11px] pb-3 border-b border-black bg-white text-black">
                      <div className="space-y-1">
                        <div className="flex">
                          <span className="w-24 font-normal">Nama Murid</span>
                          <span className="font-bold">: {selectedReportForPrint.studentName}</span>
                        </div>
                        <div className="flex">
                          <span className="w-24 font-normal">NIS/NISN</span>
                          <span className="font-bold">: {selectedReportForPrint.nis || '3899'} / {selectedReportForPrint.nisn}</span>
                        </div>
                        <div className="flex">
                          <span className="w-24 font-normal">Sekolah</span>
                          <span className="font-bold">: {selectedReportForPrint.namaSekolah || schoolProfile?.namaSekolah || 'SMP NEGERI 11 PALU'}</span>
                        </div>
                        <div className="flex">
                          <span className="w-24 font-normal">Alamat</span>
                          <span className="font-bold">: {selectedReportForPrint.alamat || schoolProfile?.alamat || 'Jl. Keramik'}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex">
                          <span className="w-24 font-normal">Kelas</span>
                          <span className="font-bold">: {selectedReportForPrint.rombel}</span>
                        </div>
                        <div className="flex">
                          <span className="w-24 font-normal">Fase</span>
                          <span className="font-bold">: {selectedReportForPrint.fase || 'D'}</span>
                        </div>
                        <div className="flex">
                          <span className="w-24 font-normal">Semester</span>
                          <span className="font-bold">: {selectedReportForPrint.semester}</span>
                        </div>
                        <div className="flex">
                          <span className="w-24 font-normal">Tahun Ajaran</span>
                          <span className="font-bold">: {selectedReportForPrint.tahunAjaran}</span>
                        </div>
                      </div>
                    </div>

                    {/* Kokurikuler Box */}
                    <div className="border border-black bg-white text-black overflow-hidden">
                      <div className="bg-slate-100 text-black py-1 px-3 border-b border-black font-bold text-center">
                        Kokurikuler
                      </div>
                      <div className="p-3 text-[10.5px] whitespace-pre-line leading-relaxed bg-white text-black">
                        {selectedReportForPrint.kokurikuler ||
                          'Pada semester ini, ananda menunjukkan capaian yang cukup baik dalam penguatan profil lulusan, yang ditunjukkan melalui kegiatan kokurikuler Literasi dan Numerasi.\nPada dimensi penalaran kritis, ananda berkembang dalam subdimensi penyampaian argumentasi.'}
                      </div>
                    </div>

                    {/* Ekstrakurikuler Table */}
                    <div className="border border-black bg-white text-black overflow-hidden">
                      <table className="w-full text-left text-[11px] border-collapse bg-white text-black">
                        <thead>
                          <tr className="border-b border-black bg-slate-100 text-black font-bold">
                            <th className="py-1.5 px-2.5 border-r border-black text-center w-8 bg-slate-100 text-black">No</th>
                            <th className="py-1.5 px-3 border-r border-black w-40 bg-slate-100 text-black">Ekstrakurikuler</th>
                            <th className="py-1.5 px-3 bg-slate-100 text-black">Keterangan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedReportForPrint.ekstrakurikuler && selectedReportForPrint.ekstrakurikuler.length > 0) ? (
                            selectedReportForPrint.ekstrakurikuler.map((ex, idx) => (
                              <tr key={idx} className="border-b border-black/60 bg-white text-black">
                                <td className="py-2 px-2 border-r border-black text-center font-bold bg-white text-black">{idx + 1}</td>
                                <td className="py-2 px-3 border-r border-black font-semibold bg-white text-black">{ex.namaEkstra}</td>
                                <td className="py-2 px-3 text-[10.5px] bg-white text-black">{ex.keterangan}</td>
                              </tr>
                            ))
                          ) : (
                            <tr className="border-b border-black/60 bg-white text-black">
                              <td className="py-2 px-2 border-r border-black text-center font-bold bg-white text-black">1</td>
                              <td className="py-2 px-3 border-r border-black font-semibold bg-white text-black">Pramuka</td>
                              <td className="py-2 px-3 text-[10.5px] bg-white text-black">
                                Mampu dalam menerapkan nilai-nilai Dasa Darma dan Trisatya, selalu hadir tepat waktu, aktif membantu teman dalam regu, serta menunjukkan perkembangan yang baik dalam memahami pengetahuan kepramukaan.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Ketidakhadiran & Catatan Wali Kelas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white text-black">
                      {/* Ketidakhadiran */}
                      <div className="border border-black bg-white text-black overflow-hidden md:col-span-1">
                        <div className="bg-slate-100 text-black py-1 px-3 border-b border-black font-bold text-center">
                          Ketidakhadiran
                        </div>
                        <div className="p-3 space-y-1 text-[11px] bg-white text-black">
                          <div className="flex justify-between">
                            <span>Sakit</span>
                            <span className="font-bold">: {selectedReportForPrint.kehadiran?.sakit ?? 1} hari</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Izin</span>
                            <span className="font-bold">: {selectedReportForPrint.kehadiran?.izin ?? 1} hari</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tanpa Keterangan</span>
                            <span className="font-bold">: {selectedReportForPrint.kehadiran?.alpa ?? 1} hari</span>
                          </div>
                        </div>
                      </div>

                      {/* Catatan Wali Kelas */}
                      <div className="border border-black bg-white text-black overflow-hidden md:col-span-2">
                        <div className="bg-slate-100 text-black py-1 px-3 border-b border-black font-bold text-center">
                          Catatan Wali Kelas
                        </div>
                        <div className="p-3 text-[10.5px] leading-relaxed bg-white text-black">
                          {selectedReportForPrint.catatanWaliKelas ||
                            'Perlu meningkatkan motivasi belajar, kedisiplinan, dan tanggung jawab dalam mengikuti pembelajaran, Partisipasi dalam kegiatan belajar masih perlu ditingkatkan.'}
                        </div>
                      </div>
                    </div>

                    {/* Keterangan Kenaikan Kelas */}
                    <div className="border border-black bg-white text-black p-2.5 font-bold text-center text-xs">
                      Keterangan Kenaikan Kelas :{' '}
                      <span className="text-black font-extrabold">{selectedReportForPrint.statusKenaikan || 'Naik ke kelas VIII'}</span>
                    </div>

                    {/* Tanggapan Orang Tua/Wali Murid */}
                    <div className="border border-black bg-white text-black overflow-hidden">
                      <div className="bg-slate-100 text-black py-1 px-3 border-b border-black font-bold text-center">
                        Tanggapan Orang Tua/Wali Murid
                      </div>
                      <div className="p-4 h-16 text-[10.5px] bg-white text-black">
                        {selectedReportForPrint.tanggapanOrangTua || ''}
                      </div>
                    </div>

                    {/* Custom Additional Data Fields */}
                    {selectedReportForPrint.customFields && selectedReportForPrint.customFields.length > 0 && (
                      <div className="space-y-3">
                        {selectedReportForPrint.customFields.map((cf, cfIdx) => (
                          <div key={cfIdx} className="border border-black bg-white text-black overflow-hidden">
                            <div className="bg-slate-100 text-black py-1 px-3 border-b border-black font-bold text-center">
                              {cf.judul || 'Catatan / Data Tambahan'}
                            </div>
                            <div className="p-3 text-[10.5px] leading-relaxed bg-white text-black whitespace-pre-line">
                              {cf.isi}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Signatures Area */}
                    <div className="pt-4 space-y-6 bg-white text-black">
                      <div className="text-right pr-8 text-[11px]">
                        {selectedReportForPrint.tempatTanggalCetak || 'Palu, 22 Juni 2026'}
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-center text-[11px] font-normal pt-2">
                        <div>
                          <div>Orang Tua Murid</div>
                          <div className="h-16"></div>
                          <div className="font-bold underline">......................................</div>
                        </div>

                        <div>
                          <div>Kepala Sekolah</div>
                          <div className="h-16"></div>
                          <div className="font-bold">{selectedReportForPrint.namaKepalaSekolah || schoolProfile?.kepalaSekolah || 'Martha Taewa, S.Pd'}</div>
                          <div className="text-[10px] font-mono">{selectedReportForPrint.nipKepalaSekolah || 'NIP 197103192007012011'}</div>
                        </div>

                        <div>
                          <div>Wali Kelas</div>
                          <div className="h-16"></div>
                          <div className="font-bold">{selectedReportForPrint.namaWaliKelas || 'RINA, S.Pd., M.Pd'}</div>
                          <div className="text-[10px] font-mono">{selectedReportForPrint.nipWaliKelas || 'NIP 9740817200932003'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Page 2 Footer Line */}
                  <div className="pt-4 mt-6 border-t border-black/40 flex justify-between items-center text-[10px] font-bold text-black relative z-10 bg-white">
                    <div>
                      {selectedReportForPrint.rombel} | {selectedReportForPrint.studentName} | {selectedReportForPrint.nis || '3899'}
                    </div>
                    <div>Halaman : 2</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
