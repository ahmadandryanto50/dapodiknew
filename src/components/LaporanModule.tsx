import React, { useState } from 'react';
import { 
  BarChart3, 
  ArrowLeft, 
  Download, 
  PieChart as PieIcon, 
  CheckCircle2, 
  Users, 
  GraduationCap, 
  Building2, 
  FileText,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  MapPin,
  Home,
  Map,
  Calendar,
  UserCheck,
  UserX,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { Student, TeacherStaff, SarprasItem, StudentReport } from '../types';
import { exportToCSV } from '../services/googleSheetsService';
import { parseFlexibleDate } from '../utils/dateUtils';

interface LaporanModuleProps {
  students: Student[];
  teachers: TeacherStaff[];
  sarpras: SarprasItem[];
  reports: StudentReport[];
  onBackToHome: () => void;
}

export const LaporanModule: React.FC<LaporanModuleProps> = ({
  students,
  teachers,
  sarpras,
  reports,
  onBackToHome
}) => {
  // Defensive array checks
  const allStudents = Array.isArray(students) ? students : [];
  const allTeachers = Array.isArray(teachers) ? teachers : [];
  const allSarpras = Array.isArray(sarpras) ? sarpras : [];
  const allReports = Array.isArray(reports) ? reports : [];

  // State for Alumni Year Filter & Collapsible Detail
  const [selectedAlumniYear, setSelectedAlumniYear] = useState<string>('ALL');
  const [alumniSearchQuery, setAlumniSearchQuery] = useState<string>('');
  const [isAlumniDetailOpen, setIsAlumniDetailOpen] = useState<boolean>(false);

  const normalizeTahunLulus = (val?: any): string => {
    if (!val) return '2025';
    const str = String(val).trim();
    if (!str) return '2025';
    if (str.includes('/')) {
      const parts = str.split('/').map(p => p.trim());
      return parts[parts.length - 1] || parts[0] || '2025';
    }
    return str;
  };

  // Active students only for standard student statistics
  const activeStudents = allStudents.filter(s => s && (!s.status || s.status === 'Aktif'));

  // Alumni / Graduated students statistics by year
  const alumniStudents = allStudents.filter(s => s && (s.status === 'Lulus' || Boolean(s.tahunLulus && String(s.tahunLulus).trim())));

  const alumniByYearCounts: Record<string, { total: number; male: number; female: number }> = {};

  alumniStudents.forEach(s => {
    const year = normalizeTahunLulus(s.tahunLulus);
    if (!alumniByYearCounts[year]) {
      alumniByYearCounts[year] = { total: 0, male: 0, female: 0 };
    }
    alumniByYearCounts[year].total += 1;
    if (s.jenisKelamin === 'L') {
      alumniByYearCounts[year].male += 1;
    } else if (s.jenisKelamin === 'P') {
      alumniByYearCounts[year].female += 1;
    }
  });

  const sortedAlumniYears = Object.keys(alumniByYearCounts).sort((a, b) => b.localeCompare(a));

  const alumniChartData = sortedAlumniYears.map(year => ({
    tahun: year,
    jumlah: alumniByYearCounts[year].total,
    laki: alumniByYearCounts[year].male,
    perempuan: alumniByYearCounts[year].female,
  }));

  // Filtered alumni students based on dropdown year selection & search query
  const filteredAlumniList = alumniStudents.filter(s => {
    const y = normalizeTahunLulus(s.tahunLulus);
    const matchYear = selectedAlumniYear === 'ALL' || y === selectedAlumniYear;
    if (!alumniSearchQuery.trim()) return matchYear;
    const q = alumniSearchQuery.toLowerCase().trim();
    const nameStr = String(s.nama || '').toLowerCase();
    const nisnStr = String(s.nisn || '').toLowerCase();
    const nisStr = String(s.nis || '').toLowerCase();
    const rombelStr = String(s.rombel || s.rombelSaatIni || '').toLowerCase();
    const ijazahStr = String(s.noSeriIjazah || '').toLowerCase();
    return matchYear && (nameStr.includes(q) || nisnStr.includes(q) || nisStr.includes(q) || rombelStr.includes(q) || ijazahStr.includes(q));
  });

  const selectedYearTotal = filteredAlumniList.length;
  const selectedYearMale = filteredAlumniList.filter(s => s.jenisKelamin === 'L').length;
  const selectedYearFemale = filteredAlumniList.filter(s => s.jenisKelamin === 'P').length;

  // Compute Stats
  const maleStudents = activeStudents.filter(s => s.jenisKelamin === 'L').length;
  const femaleStudents = activeStudents.filter(s => s.jenisKelamin === 'P').length;

  const genderData = [
    { name: 'Laki-laki', value: maleStudents, color: '#38bdf8' },
    { name: 'Perempuan', value: femaleStudents, color: '#f43f5e' }
  ];
  const activeGenderData = genderData.filter(d => d.value > 0);

  // Rombel breakdown
  const rombelCounts: Record<string, number> = {};
  activeStudents.forEach(s => {
    const key = (s.rombel && s.rombel.trim()) ? s.rombel.trim() : 'Belum Terplot';
    rombelCounts[key] = (rombelCounts[key] || 0) + 1;
  });
  const rombelData = Object.keys(rombelCounts).map(rombel => ({
    name: rombel,
    jumlah: rombelCounts[rombel]
  }));

  // Student per-class gender rekapitulasi (X. Moh Hatta L 3 P 8 Jumlah 11)
  const classGenderRekap: Record<string, { male: number; female: number; total: number }> = {};
  activeStudents.forEach(s => {
    const rName = s.rombel || 'Belum Terplot';
    if (!classGenderRekap[rName]) {
      classGenderRekap[rName] = { male: 0, female: 0, total: 0 };
    }
    if (s.jenisKelamin === 'L') {
      classGenderRekap[rName].male += 1;
    } else if (s.jenisKelamin === 'P') {
      classGenderRekap[rName].female += 1;
    }
    classGenderRekap[rName].total += 1;
  });

  const sortedClassNames = Object.keys(classGenderRekap).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  // Cumulative grade level calculations
  let kelas7L = 0;
  let kelas7P = 0;
  let kelas8L = 0;
  let kelas8P = 0;
  let kelas9L = 0;
  let kelas9P = 0;

  activeStudents.forEach(s => {
    const rName = s.rombel || '';
    const rNameUpper = rName.toUpperCase();
    if (rNameUpper.startsWith('VIII')) {
      if (s.jenisKelamin === 'L') kelas8L += 1;
      else if (s.jenisKelamin === 'P') kelas8P += 1;
    } else if (rNameUpper.startsWith('VII')) {
      if (s.jenisKelamin === 'L') kelas7L += 1;
      else if (s.jenisKelamin === 'P') kelas7P += 1;
    } else if (rNameUpper.startsWith('IX')) {
      if (s.jenisKelamin === 'L') kelas9L += 1;
      else if (s.jenisKelamin === 'P') kelas9P += 1;
    }
  });

  const total7 = kelas7L + kelas7P;
  const total8 = kelas8L + kelas8P;
  const total9 = kelas9L + kelas9P;

  // Separation of Pendidik & Tendik by Gender (L/P)
  let pendidikL = 0;
  let pendidikP = 0;
  let tendikL = 0;
  let tendikP = 0;

  allTeachers.forEach(t => {
    if (!t) return;
    const jenisPtkStr = String(t.jenisPtk || '').toLowerCase();
    const isPendidik = (['Guru Mapel', 'Guru Kelas'].includes(t.jenisPtk) || jenisPtkStr.includes('guru')) && 
                       !jenisPtkStr.includes('kepala');
    
    if (isPendidik) {
      if (t.jenisKelamin === 'L') pendidikL += 1;
      else pendidikP += 1;
    } else {
      if (t.jenisKelamin === 'L') tendikL += 1;
      else tendikP += 1;
    }
  });

  const totalPendidik = pendidikL + pendidikP;
  const totalTendik = tendikL + tendikP;

  // PTK breakdown
  const ptkStatusCounts: Record<string, number> = {};
  allTeachers.forEach(t => {
    if (!t) return;
    const stKey = (t.statusKepegawaian && t.statusKepegawaian.trim()) ? t.statusKepegawaian.trim() : 'Lainnya';
    ptkStatusCounts[stKey] = (ptkStatusCounts[stKey] || 0) + 1;
  });
  const ptkData = Object.keys(ptkStatusCounts).map(st => ({
    name: st,
    jumlah: ptkStatusCounts[st]
  }));

  // Sarpras condition breakdown
  const sarprasKondisiCounts: Record<string, number> = {
    'Baik': 0,
    'Rusak Ringan': 0,
    'Rusak Sedang': 0,
    'Rusak Berat': 0
  };
  (sarpras || []).forEach(s => {
    if (!s) return;
    const cond = (s.kondisi || '').trim().toLowerCase();
    if (cond.includes('berat')) {
      sarprasKondisiCounts['Rusak Berat'] += 1;
    } else if (cond.includes('sedang')) {
      sarprasKondisiCounts['Rusak Sedang'] += 1;
    } else if (cond.includes('ringan')) {
      sarprasKondisiCounts['Rusak Ringan'] += 1;
    } else {
      sarprasKondisiCounts['Baik'] += 1;
    }
  });

  const sarprasData = [
    { name: 'Baik', value: sarprasKondisiCounts['Baik'], color: '#10b981' },
    { name: 'Rusak Ringan', value: sarprasKondisiCounts['Rusak Ringan'], color: '#f59e0b' },
    { name: 'Rusak Sedang', value: sarprasKondisiCounts['Rusak Sedang'], color: '#f97316' },
    { name: 'Rusak Berat', value: sarprasKondisiCounts['Rusak Berat'], color: '#ef4444' }
  ];
  const totalSarprasCount = (sarpras || []).length;
  const activeSarprasSlices = sarprasData.filter(d => d.value > 0);

  // ==========================================
  // DEMOGRAFI USIA 13-15 TAHUN & DOMISILI KK
  // ==========================================
  const checkIsPendudukPalu = (s: Student): boolean => {
    if (!s) return true;
    const cleanKk = String(s.noKk ?? '').replace(/\D/g, '');
    const cleanNik = String(s.nik ?? '').replace(/\D/g, '');
    
    // 1. Exact KK code prefix check (7271 = Kota Palu)
    if (cleanKk.length >= 4) {
      if (cleanKk.startsWith('7271')) return true;
      if (cleanKk.startsWith('72') && !cleanKk.startsWith('7271')) return false;
    }
    
    // 2. Exact NIK code prefix check (7271 = Kota Palu)
    if (cleanNik.length >= 4) {
      if (cleanNik.startsWith('7271')) return true;
      if (cleanNik.startsWith('72') && !cleanNik.startsWith('7271')) return false;
    }

    const KECAMATAN_PALU = [
      'palu barat', 'palu selatan', 'palu timur', 'palu utara',
      'mantikulore', 'tatanga', 'tawaeli', 'ulujadi'
    ];

    const KELURAHAN_PALU = [
      'besusu', 'lolu', 'talise', 'tondo', 'lasoani', 'layana', 'poboya', 'kawatuna',
      'birobuli', 'petobo', 'tatura', 'kamonji', 'siranindi', 'ujuna', 'bale', 'baru',
      'donggala kodi', 'kabonena', 'silae', 'tipo', 'buluri', 'watusampu', 'mamboro',
      'taipa', 'kayumalue', 'panau', 'pantoloan', 'baiya', 'lambara', 'nambo'
    ];

    const kec = String(s.kecamatan ?? '').toLowerCase().trim();
    const kel = String(s.kelurahan ?? '').toLowerCase().trim();
    const alm = String(s.alamat ?? '').toLowerCase().trim();

    if (kec) {
      if (KECAMATAN_PALU.some(k => kec.includes(k))) return true;
      if (kec.includes('palu')) return true;
    }

    if (kel) {
      if (KELURAHAN_PALU.some(k => kel.includes(k))) return true;
      if (kel.includes('palu')) return true;
    }

    if (alm) {
      if (alm.includes('kota palu') || alm.includes('palu')) return true;
      if (KECAMATAN_PALU.some(k => alm.includes(k))) return true;
      if (KELURAHAN_PALU.some(k => alm.includes(k))) return true;
    }

    const OUTSIDE_AREAS = [
      'sigi', 'donggala', 'parigi', 'parimo', 'poso', 'tolitoli', 'buol', 
      'morowali', 'banggai', 'tojo', 'biromaru', 'dolo', 'marawola', 'banawa',
      'labuan', 'sindue', 'sirenja', 'kulawi', 'palolo', 'sausu', 'torue', 'ampibabo'
    ];

    if (OUTSIDE_AREAS.some(area => kec.includes(area) || kel.includes(area) || alm.includes(area))) {
      return false;
    }

    if (cleanKk.length >= 2 && !cleanKk.startsWith('72')) return false;
    if (cleanNik.length >= 2 && !cleanNik.startsWith('72')) return false;

    return true;
  };

  const calculateAge = (tglLahir?: any): number | null => {
    if (!tglLahir) return null;
    const parsed = parseFlexibleDate(tglLahir);
    if (!parsed) return null;
    // Perhitungan usia real-time dinamis mengikuti tanggal berjalan saat ini
    const now = new Date();
    let age = now.getFullYear() - parsed.year;
    const m = (now.getMonth() + 1) - parsed.month;
    if (m < 0 || (m === 0 && now.getDate() < parsed.day)) {
      age--;
    }
    return age >= 0 && age < 100 ? age : null;
  };

  // Compute 13-15 and detailed age stats
  let usia13_15_Palu_L = 0;
  let usia13_15_Palu_P = 0;
  let usia13_15_NonPalu_L = 0;
  let usia13_15_NonPalu_P = 0;

  // Age 13 breakdown
  let usia13_Palu_L = 0, usia13_Palu_P = 0;
  let usia13_NonPalu_L = 0, usia13_NonPalu_P = 0;

  // Age 14 breakdown
  let usia14_Palu_L = 0, usia14_Palu_P = 0;
  let usia14_NonPalu_L = 0, usia14_NonPalu_P = 0;

  // Age 15 breakdown
  let usia15_Palu_L = 0, usia15_Palu_P = 0;
  let usia15_NonPalu_L = 0, usia15_NonPalu_P = 0;

  // Under 13 breakdown (<13)
  let usiaUnder13_Palu_L = 0, usiaUnder13_Palu_P = 0;
  let usiaUnder13_NonPalu_L = 0, usiaUnder13_NonPalu_P = 0;

  // Over 15 breakdown (>15)
  let usiaOver15_Palu_L = 0, usiaOver15_Palu_P = 0;
  let usiaOver15_NonPalu_L = 0, usiaOver15_NonPalu_P = 0;

  activeStudents.forEach(s => {
    if (!s) return;
    let age = calculateAge(s.tanggalLahir);
    
    // Fallback estimation by rombel if birthdate is empty
    if (age === null) {
      const rName = String(s.rombel ?? '').toUpperCase();
      if (rName.startsWith('VII')) age = 13;
      else if (rName.startsWith('VIII')) age = 14;
      else if (rName.startsWith('IX')) age = 15;
      else age = 14;
    }

    const isPalu = checkIsPendudukPalu(s);
    const isL = s.jenisKelamin === 'L';

    if (age >= 13 && age <= 15) {
      if (isPalu) {
        if (isL) usia13_15_Palu_L++;
        else usia13_15_Palu_P++;
      } else {
        if (isL) usia13_15_NonPalu_L++;
        else usia13_15_NonPalu_P++;
      }
    }

    if (age === 13) {
      if (isPalu) { if (isL) usia13_Palu_L++; else usia13_Palu_P++; }
      else { if (isL) usia13_NonPalu_L++; else usia13_NonPalu_P++; }
    } else if (age === 14) {
      if (isPalu) { if (isL) usia14_Palu_L++; else usia14_Palu_P++; }
      else { if (isL) usia14_NonPalu_L++; else usia14_NonPalu_P++; }
    } else if (age === 15) {
      if (isPalu) { if (isL) usia15_Palu_L++; else usia15_Palu_P++; }
      else { if (isL) usia15_NonPalu_L++; else usia15_NonPalu_P++; }
    } else if (age < 13) {
      if (isPalu) { if (isL) usiaUnder13_Palu_L++; else usiaUnder13_Palu_P++; }
      else { if (isL) usiaUnder13_NonPalu_L++; else usiaUnder13_NonPalu_P++; }
    } else if (age > 15) {
      if (isPalu) { if (isL) usiaOver15_Palu_L++; else usiaOver15_Palu_P++; }
      else { if (isL) usiaOver15_NonPalu_L++; else usiaOver15_NonPalu_P++; }
    }
  });

  const totalUsia13_15_Palu = usia13_15_Palu_L + usia13_15_Palu_P;
  const totalUsia13_15_NonPalu = usia13_15_NonPalu_L + usia13_15_NonPalu_P;
  const totalUsia13_15 = totalUsia13_15_Palu + totalUsia13_15_NonPalu;
  const pctPalu = totalUsia13_15 > 0 ? Math.round((totalUsia13_15_Palu / totalUsia13_15) * 100) : 0;
  const pctNonPalu = totalUsia13_15 > 0 ? Math.round((totalUsia13_15_NonPalu / totalUsia13_15) * 100) : 0;

  // Grand totals across all active students for KK demography
  const totalAllPalu_L = usia13_Palu_L + usia14_Palu_L + usia15_Palu_L + usiaUnder13_Palu_L + usiaOver15_Palu_L;
  const totalAllPalu_P = usia13_Palu_P + usia14_Palu_P + usia15_Palu_P + usiaUnder13_Palu_P + usiaOver15_Palu_P;
  const totalAllPalu = totalAllPalu_L + totalAllPalu_P;

  const totalAllNonPalu_L = usia13_NonPalu_L + usia14_NonPalu_L + usia15_NonPalu_L + usiaUnder13_NonPalu_L + usiaOver15_NonPalu_L;
  const totalAllNonPalu_P = usia13_NonPalu_P + usia14_NonPalu_P + usia15_NonPalu_P + usiaUnder13_NonPalu_P + usiaOver15_NonPalu_P;
  const totalAllNonPalu = totalAllNonPalu_L + totalAllNonPalu_P;

  const grandTotal_L = totalAllPalu_L + totalAllNonPalu_L;
  const grandTotal_P = totalAllPalu_P + totalAllNonPalu_P;
  const grandTotal = grandTotal_L + grandTotal_P;
  const pctGrandPalu = grandTotal > 0 ? Math.round((totalAllPalu / grandTotal) * 100) : 0;

  const paluVsNonPaluData = [
    { name: 'Penduduk Kota Palu', value: totalUsia13_15_Palu, color: '#0ea5e9' },
    { name: 'Bukan Penduduk Kota Palu', value: totalUsia13_15_NonPalu, color: '#f59e0b' }
  ];
  const activePaluData = paluVsNonPaluData.filter(d => d.value > 0);

  const ageCohortChartData = [
    { name: '13 Thn', palu: usia13_Palu_L + usia13_Palu_P, nonPalu: usia13_NonPalu_L + usia13_NonPalu_P },
    { name: '14 Thn', palu: usia14_Palu_L + usia14_Palu_P, nonPalu: usia14_NonPalu_L + usia14_NonPalu_P },
    { name: '15 Thn', palu: usia15_Palu_L + usia15_Palu_P, nonPalu: usia15_NonPalu_L + usia15_NonPalu_P },
    { name: '< 13 Thn', palu: usiaUnder13_Palu_L + usiaUnder13_Palu_P, nonPalu: usiaUnder13_NonPalu_L + usiaUnder13_NonPalu_P },
    { name: '> 15 Thn', palu: usiaOver15_Palu_L + usiaOver15_Palu_P, nonPalu: usiaOver15_NonPalu_L + usiaOver15_NonPalu_P }
  ];

  const handleExportAll = () => {
    const summaryData = [
      { Kategori: 'Total Peserta Didik Aktif (Siswa)', Jumlah: activeStudents.length, Keterangan: `${maleStudents} Laki-laki, ${femaleStudents} Perempuan` },
      { Kategori: 'Jumlah Usia 13 s.d. 15 Tahun - Penduduk Kota Palu (KK)', Jumlah: totalUsia13_15_Palu, Keterangan: `L: ${usia13_15_Palu_L}, P: ${usia13_15_Palu_P} (${pctPalu}%)` },
      { Kategori: 'Jumlah Usia 13 s.d. 15 Tahun - Bukan Penduduk Kota Palu (KK)', Jumlah: totalUsia13_15_NonPalu, Keterangan: `L: ${usia13_15_NonPalu_L}, P: ${usia13_15_NonPalu_P} (${pctNonPalu}%)` },
      { Kategori: 'Total Siswa Usia 13 s.d. 15 Tahun', Jumlah: totalUsia13_15, Keterangan: `Rentang Usia Standar SMP (13-15 Tahun)` },
      { Kategori: 'Siswa Usia < 13 Tahun', Jumlah: (usiaUnder13_Palu_L + usiaUnder13_Palu_P + usiaUnder13_NonPalu_L + usiaUnder13_NonPalu_P), Keterangan: 'Di Bawah Usia Standar SMP' },
      { Kategori: 'Siswa Usia > 15 Tahun', Jumlah: (usiaOver15_Palu_L + usiaOver15_Palu_P + usiaOver15_NonPalu_L + usiaOver15_NonPalu_P), Keterangan: 'Di Atas Usia Standar SMP' },
      { Kategori: 'Total Pendidik & Tendik (PTK)', Jumlah: teachers.length, Keterangan: `${teachers.filter(t => t.statusSertifikasi === 'Sudah').length} Tersertifikasi` },
      { Kategori: 'Total Sarana & Prasarana', Jumlah: sarpras.length, Keterangan: `${sarpras.filter(s => s.kondisi === 'Baik').length} Kondisi Baik` },
      { Kategori: 'Total Rapor Tervalidasi', Jumlah: reports.length, Keterangan: 'Semester Genap 2025/2026' }
    ];
    exportToCSV(summaryData, 'DAPODIK_REKAPITULASI_SEKOLAH');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-xl border border-slate-200/80 p-5 rounded-2xl shadow-sm">
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
              <h1 className="text-xl font-bold text-slate-900">Laporan & Rekapitulasi Data Pokok</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Validasi 100% Bersih
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Statistik agregat sekolah, distribusi demografi, profil PTK, dan indeks kelaikan sarpras
            </p>
          </div>
        </div>

        <button
          onClick={handleExportAll}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>Unduh Rekap Lengkap</span>
        </button>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-sky-50 text-sky-600 border border-sky-200">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{activeStudents.length}</div>
            <div className="text-xs text-slate-500 font-medium">Peserta Didik Aktif</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{teachers.length}</span>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 shadow-2xs">
                {totalPendidik} Guru &bull; {totalTendik} Tendik
              </span>
            </div>
            <div className="text-xs text-slate-500 font-medium">Pendidik & Tendik (PTK)</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{sarpras.length}</div>
            <div className="text-xs text-slate-500 font-medium">Aset & Sarpras</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{reports.length}</div>
            <div className="text-xs text-slate-500 font-medium">Buku Rapor Selesai</div>
          </div>
        </div>
      </div>

      {/* HIGHLIGHT: STATISTIK USIA 13-15 TAHUN BERDASARKAN TEMPAT TINGGAL KK */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Penduduk Kota Palu (Usia 13-15 Thn) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-50/90 via-white to-sky-100/40 border border-sky-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-sky-600" />
                Penduduk Kota Palu
              </span>
              <span className="text-[11px] font-mono text-sky-700 font-bold">{pctPalu}% dari Kelompok Usia</span>
            </div>
            <h3 className="text-xs font-semibold text-slate-600">
              Usia 13 s.d. 15 Tahun (KK Kota Palu)
            </h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono">{totalUsia13_15_Palu}</span>
              <span className="text-xs text-slate-500 font-bold">Siswa Terdata</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-sky-100 flex items-center justify-between font-mono text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-sky-100/80 text-sky-800 border border-sky-200">
              Laki-Laki: <strong className="text-slate-900 font-bold">{usia13_15_Palu_L}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-100/80 text-rose-800 border border-rose-200">
              Perempuan: <strong className="text-slate-900 font-bold">{usia13_15_Palu_P}</strong>
            </span>
          </div>
        </div>

        {/* Card 2: Bukan Penduduk Kota Palu (Usia 13-15 Thn) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/90 via-white to-amber-100/40 border border-amber-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                <Map className="w-3 h-3 text-amber-600" />
                Bukan Penduduk Kota Palu
              </span>
              <span className="text-[11px] font-mono text-amber-700 font-bold">{pctNonPalu}% dari Kelompok Usia</span>
            </div>
            <h3 className="text-xs font-semibold text-slate-600">
              Usia 13 s.d. 15 Tahun (KK Luar Kota Palu)
            </h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono">{totalUsia13_15_NonPalu}</span>
              <span className="text-xs text-slate-500 font-bold">Siswa Terdata</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between font-mono text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-sky-100/80 text-sky-800 border border-sky-200">
              Laki-Laki: <strong className="text-slate-900 font-bold">{usia13_15_NonPalu_L}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-100/80 text-rose-800 border border-rose-200">
              Perempuan: <strong className="text-slate-900 font-bold">{usia13_15_NonPalu_P}</strong>
            </span>
          </div>
        </div>

        {/* Card 3: Total Kelompok Usia 13-15 Tahun */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-white to-indigo-100/40 border border-indigo-200 shadow-sm relative overflow-hidden flex flex-col justify-between md:col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-indigo-600" />
                Kohort Usia SMP (13–15 Thn)
              </span>
              <span className="text-[11px] font-mono text-indigo-700 font-bold">
                {activeStudents.length > 0 ? Math.round((totalUsia13_15 / activeStudents.length) * 100) : 0}% Total Siswa Aktif
              </span>
            </div>
            <h3 className="text-xs font-semibold text-slate-600">
              Total Seluruh Siswa Usia 13 s.d. 15 Tahun
            </h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono">{totalUsia13_15}</span>
              <span className="text-xs text-slate-500 font-bold">dari {activeStudents.length} Siswa Aktif</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-indigo-100 flex items-center justify-between font-mono text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-sky-100/80 text-sky-800 border border-sky-200">
              Palu: <strong className="text-slate-900 font-bold">{totalUsia13_15_Palu}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-100/80 text-amber-800 border border-amber-200">
              Luar Palu: <strong className="text-slate-900 font-bold">{totalUsia13_15_NonPalu}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gender Distribution Pie */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-sky-600" />
            <span>Distribusi Gender Siswa (L/P)</span>
          </h3>
          <div className="h-64 w-full relative flex items-center justify-center">
            {activeGenderData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activeGenderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={activeGenderData.length > 1 ? 5 : 0}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${typeof percent === 'number' ? (percent * 100).toFixed(0) : 0}%`}
                  >
                    {activeGenderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center p-6 text-slate-400 text-xs">Belum ada data siswa</div>
            )}
          </div>
        </div>

        {/* Student per Rombel Bar Chart */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-600" />
            <span>Kepadatan Rombongan Belajar (Rombel)</span>
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rombelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }} />
                <Bar dataKey="jumlah" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PTK Employment Status */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            <span>Status Kepegawaian PTK (PNS, PPPK, Honorer)</span>
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ptkData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }} />
                <Bar dataKey="jumlah" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sarpras Condition Distribution */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-rose-600" />
              <span>Kelaikan & Kondisi Fisik Sarpras</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 font-semibold">
              Total: {totalSarprasCount} Sarpras
            </span>
          </div>

          <div className="h-64 w-full relative flex items-center justify-center">
            {totalSarprasCount > 0 && activeSarprasSlices.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activeSarprasSlices}
                      cx="50%"
                      cy="48%"
                      innerRadius={50}
                      outerRadius={78}
                      paddingAngle={activeSarprasSlices.length > 1 ? 4 : 0}
                      dataKey="value"
                      label={({ name, percent }) => {
                        const pct = typeof percent === 'number' ? Math.round(percent * 100) : 0;
                        return pct >= 10 ? `${name} ${pct}%` : '';
                      }}
                      labelLine={false}
                    >
                      {activeSarprasSlices.map((entry, index) => (
                        <Cell key={`cell-sarpras-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(val: any, name: any) => [
                        `${val} unit (${totalSarprasCount > 0 ? Math.round((Number(val) / totalSarprasCount) * 100) : 0}%)`, 
                        name
                      ]} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Badge inside Donut Hole */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-2">
                  <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">{totalSarprasCount}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sarpras</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                  <Building2 className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Belum Ada Data Sarpras</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">Data sarpras dapat ditambahkan melalui menu Sarpras untuk menampilkan kelaikan fisik.</p>
              </div>
            )}
          </div>

          {/* Condition Status Badges & Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
            {sarprasData.map(item => {
              const pct = totalSarprasCount > 0 ? Math.round((item.value / totalSarprasCount) * 100) : 0;
              return (
                <div key={item.name} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-3 h-3 rounded-md shrink-0" style={{ backgroundColor: item.color }} />
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-slate-700 truncate">{item.name}</div>
                    <div className="text-xs font-mono font-bold text-slate-900">{item.value} <span className="text-[10px] font-normal text-slate-500">({pct}%)</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* REKAPITULASI JUMLAH SISWA LULUS BERDASARKAN TAHUN LULUSNYA */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
              <GraduationCap className="w-5 h-5 text-emerald-600" />
              <span>Jumlah Siswa Lulus Berdasarkan Tahun Lulusnya (Alumni)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Rekapitulasi historis kelulusan peserta didik berdasarkan tahun kelulusan
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 text-emerald-800 font-bold">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Total {alumniStudents.length} Siswa Lulus</span>
          </div>
        </div>

        {/* INTERACTIVE YEAR FILTER SELECTOR */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <label className="text-xs font-bold text-emerald-950 block">Pilihan Tahun Kelulusan Alumni:</label>
              <p className="text-[11px] text-emerald-700">Pilih tahun untuk melihat rincian jumlah & data siswa lulus</p>
            </div>
          </div>
          <div className="w-full sm:w-auto min-w-[240px]">
            <select
              value={selectedAlumniYear}
              onChange={(e) => {
                setSelectedAlumniYear(e.target.value);
                setIsAlumniDetailOpen(true);
              }}
              className="w-full py-2.5 px-4 bg-white border border-emerald-300 rounded-xl text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs cursor-pointer"
            >
              <option value="ALL">Semua Tahun Kelulusan ({alumniStudents.length} Siswa)</option>
              {sortedAlumniYears.map(year => (
                <option key={year} value={year}>
                  Tahun Kelulusan {year} ({alumniByYearCounts[year].total} Siswa)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3 STAT CARDS FOR SELECTED YEAR */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs space-y-1">
            <div className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider">
              {selectedAlumniYear === 'ALL' ? 'Total Alumni (Semua Tahun)' : `Siswa Lulus Tahun ${selectedAlumniYear}`}
            </div>
            <div className="text-2xl font-black font-mono">{selectedYearTotal} <span className="text-xs font-normal text-emerald-100">Siswa</span></div>
          </div>
          <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950 shadow-xs space-y-1">
            <div className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">Laki-Laki (L)</div>
            <div className="text-2xl font-black font-mono text-sky-900">{selectedYearMale} <span className="text-xs font-normal text-sky-600">Siswa</span></div>
          </div>
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 shadow-xs space-y-1">
            <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Perempuan (P)</div>
            <div className="text-2xl font-black font-mono text-rose-900">{selectedYearFemale} <span className="text-xs font-normal text-rose-600">Siswa</span></div>
          </div>
        </div>

        {/* REKAP GRAFIK & TABEL TAHUNAN */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Bar Chart Siswa Lulus */}
          <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>Grafik Kelulusan per Tahun</span>
              <span className="text-[11px] font-mono text-slate-500">{sortedAlumniYears.length} Periode Kelulusan</span>
            </h3>
            <div className="h-64 w-full">
              {alumniChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={alumniChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="tahun" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }} 
                      formatter={(val: any, name: any) => [
                        `${val} Siswa`, 
                        name === 'laki' ? 'Laki-Laki' : name === 'perempuan' ? 'Perempuan' : 'Total Lulus'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="laki" name="Laki-Laki" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="perempuan" name="Perempuan" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                  Belum ada data siswa lulus
                </div>
              )}
            </div>
          </div>

          {/* Tabel Rincian Siswa Lulus per Tahun */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-3.5 text-center">No</th>
                  <th className="py-3 px-4">Tahun Lulus</th>
                  <th className="py-3 px-3 text-center text-sky-700">Laki-Laki (L)</th>
                  <th className="py-3 px-3 text-center text-rose-700">Perempuan (P)</th>
                  <th className="py-3 px-4 text-center font-bold text-slate-900 bg-slate-200/50">Total Lulus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedAlumniYears.length > 0 ? (
                  sortedAlumniYears.map((year, idx) => {
                    const row = alumniByYearCounts[year];
                    const isSelected = selectedAlumniYear === year;
                    return (
                      <tr 
                        key={year} 
                        onClick={() => setSelectedAlumniYear(year)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-emerald-50/80 font-semibold' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2.5 px-3.5 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-800 flex items-center justify-between">
                          <span>Tahun {year}</span>
                          {isSelected && <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-bold">Terpilih</span>}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-sky-700 font-semibold">{row.male}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-rose-700 font-semibold">{row.female}</td>
                        <td className="py-2.5 px-4 text-center font-mono font-black text-slate-900 bg-slate-50">{row.total}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Belum ada rekapitulasi data alumni/tahun lulus.
                    </td>
                  </tr>
                )}
              </tbody>
              {sortedAlumniYears.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100 font-black text-slate-900 border-t border-slate-200">
                    <td className="py-3 px-3.5 text-center">Σ</td>
                    <td className="py-3 px-4">TOTAL KESELURUHAN</td>
                    <td className="py-3 px-3 text-center font-mono text-sky-700">
                      {alumniStudents.filter(s => s.jenisKelamin === 'L').length}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-rose-700">
                      {alumniStudents.filter(s => s.jenisKelamin === 'P').length}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-black text-emerald-700 bg-emerald-100 text-sm">
                      {alumniStudents.length}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* DAFTAR NAMA SISWA ALUMNI UNTUK TAHUN YANG DIPILIH (COLLAPSIBLE / ACCORDION) */}
        <div className="border-t border-slate-200 pt-6 space-y-4">
          <div 
            onClick={() => setIsAlumniDetailOpen(!isAlumniDetailOpen)}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 hover:bg-slate-100/90 p-4 rounded-2xl border border-slate-200 cursor-pointer transition-all select-none group shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>Rincian Daftar Siswa Alumni {selectedAlumniYear === 'ALL' ? '(Semua Tahun)' : `Tahun ${selectedAlumniYear}`}</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {filteredAlumniList.length} Siswa
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  {isAlumniDetailOpen ? 'Klik untuk menutup / menyembunyikan tabel rincian ini' : 'Klik untuk membuka / menampilkan tabel rincian ini'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
              {isAlumniDetailOpen && (
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={alumniSearchQuery}
                    onChange={(e) => setAlumniSearchQuery(e.target.value)}
                    placeholder="Cari nama, NISN, rombel..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors shadow-2xs"
                  />
                </div>
              )}

              {selectedAlumniYear !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAlumniYear('ALL');
                    setIsAlumniDetailOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 text-xs font-bold shrink-0 transition-colors shadow-2xs"
                >
                  Reset Tahun
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsAlumniDetailOpen(!isAlumniDetailOpen)}
                className="p-2 rounded-xl bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 transition-colors shrink-0 flex items-center gap-1.5 text-xs font-bold shadow-2xs"
                title={isAlumniDetailOpen ? "Tutup Tabel" : "Buka Tabel"}
              >
                <span>{isAlumniDetailOpen ? "Tutup" : "Buka"}</span>
                {isAlumniDetailOpen ? <ChevronUp className="w-4 h-4 text-emerald-600" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>
            </div>
          </div>

          {/* ISINYA DITAMPILKAN JIKA OPEN */}
          {isAlumniDetailOpen && (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-2xs transition-all">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-3.5 text-center">No</th>
                    <th className="py-3 px-4">NISN / NIS</th>
                    <th className="py-3 px-4">Nama Lengkap Siswa</th>
                    <th className="py-3 px-3 text-center">L/P</th>
                    <th className="py-3 px-4">Rombel Terakhir</th>
                    <th className="py-3 px-3 text-center">Tahun Lulus</th>
                    <th className="py-3 px-4">No. Seri Ijazah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAlumniList.length > 0 ? (
                    filteredAlumniList.map((st, idx) => (
                      <tr key={st.id || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3.5 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-4 font-mono font-semibold text-slate-700">
                          {st.nisn || st.nis || '-'}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {st.nama}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            st.jenisKelamin === 'L' ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {st.jenisKelamin || '-'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">
                          {st.rombel || st.rombelSaatIni || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-emerald-700 font-mono">
                          {normalizeTahunLulus(st.tahunLulus)}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-600">
                          {st.noSeriIjazah || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Tidak ada data siswa alumni yang sesuai dengan filter tahun/pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* REKAPITULASI DATA POKOK DETAIL (KEREN & KEKINIAN) */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              <span>Rekapitulasi Data Pokok Terpadu (Siswa & PTK)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Rincian komparatif jumlah peserta didik per kelas dan pembagian gender pendidik & tenaga kependidikan
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-slate-700 font-semibold font-mono">DAPODIK Live Stats</span>
          </div>
        </div>

        {/* REKAPITULASI TINGKAT KELAS KESELURUHAN (COOL & MODERN) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Kelas VII */}
          <div className="p-4.5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-indigo-100/30 border border-indigo-100 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-wider text-indigo-700 uppercase">Kelas VII (Tujuh)</span>
              <span className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full border border-indigo-200 font-bold">Keseluruhan</span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl font-black text-slate-900 font-mono">{total7} <span className="text-xs text-slate-500 font-bold">Siswa</span></span>
              <div className="flex gap-2 font-mono text-xs">
                <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded-md border border-sky-200">L: {kelas7L}</span>
                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md border border-rose-200">P: {kelas7P}</span>
              </div>
            </div>
          </div>

          {/* Kelas VIII */}
          <div className="p-4.5 rounded-2xl bg-gradient-to-br from-amber-50/80 via-white to-amber-100/30 border border-amber-100 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-wider text-amber-700 uppercase">Kelas VIII (Delapan)</span>
              <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-200 font-bold">Keseluruhan</span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl font-black text-slate-900 font-mono">{total8} <span className="text-xs text-slate-500 font-bold">Siswa</span></span>
              <div className="flex gap-2 font-mono text-xs">
                <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded-md border border-sky-200">L: {kelas8L}</span>
                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md border border-rose-200">P: {kelas8P}</span>
              </div>
            </div>
          </div>

          {/* Kelas IX */}
          <div className="p-4.5 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-emerald-100/30 border border-emerald-100 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-wider text-emerald-700 uppercase">Kelas IX (Sembilan)</span>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200 font-bold">Keseluruhan</span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl font-black text-slate-900 font-mono">{total9} <span className="text-xs text-slate-500 font-bold">Siswa</span></span>
              <div className="flex gap-2 font-mono text-xs">
                <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded-md border border-sky-200">L: {kelas9L}</span>
                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md border border-rose-200">P: {kelas9P}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Column 1: Siswa per Rombongan Belajar (Rombel) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-3 bg-sky-600 rounded-full" />
                Siswa Per Rombongan Belajar (Rombel)
              </h3>
              <span className="text-[11px] text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                {sortedClassNames.length} Rombel Terdeteksi
              </span>
            </div>

            <div className="max-h-[380px] overflow-y-auto pr-2 space-y-3 scrollbar-thin">
              {sortedClassNames.map(className => {
                const info = classGenderRekap[className];
                const malePct = info.total > 0 ? (info.male / info.total) * 100 : 0;
                return (
                  <div 
                    key={className} 
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 transition-all shadow-sm flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-700 border border-indigo-200">
                          {className.split('.')[0] || className[0]}
                        </div>
                        <span className="font-bold text-slate-900 text-sm">{className}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span className="px-2 py-1 bg-sky-100 text-sky-800 rounded-md border border-sky-200 flex items-center gap-1">
                          <span className="font-bold">L</span> {info.male}
                        </span>
                        <span className="px-2 py-1 bg-rose-100 text-rose-800 rounded-md border border-rose-200 flex items-center gap-1">
                          <span className="font-bold">P</span> {info.female}
                        </span>
                        <span className="px-2 py-1 bg-slate-200 text-slate-800 rounded-md font-bold">
                          Total: <strong className="text-slate-900 font-black">{info.total}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Stacked Percentage Bar */}
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
                      <div 
                        style={{ width: `${malePct}%` }} 
                        className="h-full bg-sky-500 transition-all duration-500" 
                        title={`Laki-laki: ${info.male}`}
                      />
                      <div 
                        style={{ width: `${100 - malePct}%` }} 
                        className="h-full bg-rose-500 transition-all duration-500" 
                        title={`Perempuan: ${info.female}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2: Pendidik vs Tenaga Kependidikan */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-3 bg-emerald-600 rounded-full" />
              Komparasi Gender Pendidik vs Tenaga Kependidikan (PTK)
            </h3>

            <div className="grid grid-cols-1 gap-4">
              
              {/* Card Pendidik */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Pendidik (Guru)</h4>
                      <p className="text-[10px] text-slate-500">Kepala Sekolah & Guru Mata Pelajaran</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-600 font-mono">{totalPendidik}</span>
                    <span className="text-[10px] text-slate-400 block font-medium">Orang</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-center">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider mb-0.5">Laki-Laki (L)</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black text-sky-600 font-mono">{pendidikL}</span>
                      <span className="text-[10px] text-slate-500 font-bold">Orang ({totalPendidik > 0 ? Math.round((pendidikL/totalPendidik)*100) : 0}%)</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-center">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider mb-0.5">Perempuan (P)</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black text-rose-600 font-mono">{pendidikP}</span>
                      <span className="text-[10px] text-slate-500 font-bold">Orang ({totalPendidik > 0 ? Math.round((pendidikP/totalPendidik)*100) : 0}%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Tendik */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 transition-all shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Tenaga Kependidikan (Tendik)</h4>
                      <p className="text-[10px] text-slate-500">Tata Usaha, Laboran, Pustakawan & Staf Pendukung</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-sky-600 font-mono">{totalTendik}</span>
                    <span className="text-[10px] text-slate-400 block font-medium">Orang</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-center">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider mb-0.5">Laki-Laki (L)</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black text-sky-600 font-mono">{tendikL}</span>
                      <span className="text-[10px] text-slate-500 font-bold">Orang ({totalTendik > 0 ? Math.round((tendikL/totalTendik)*100) : 0}%)</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-center">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider mb-0.5">Perempuan (P)</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black text-rose-600 font-mono">{tendikP}</span>
                      <span className="text-[10px] text-slate-500 font-bold">Orang ({totalTendik > 0 ? Math.round((tendikP/totalTendik)*100) : 0}%)</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* REKAPITULASI USIA 13-15 TAHUN BERDASARKAN TEMPAT TINGGAL KK (KOTA PALU VS BUKAN KOTA PALU) */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
              <MapPin className="w-5 h-5 text-sky-600 animate-pulse" />
              <span>Rekapitulasi Usia 13 s.d. 15 Tahun Berdasarkan Tempat Tinggal KK</span>
            </h2>
            <p className="text-xs text-slate-500">
              Analisis demografi kependudukan peserta didik usia 13 s.d. 15 tahun (Penduduk Kota Palu vs Bukan Penduduk Kota Palu) berdasarkan Kartu Keluarga (KK) & domisili
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping" />
            <span className="text-slate-700 font-semibold font-mono">Kode Wilayah KK: 7271 Palu</span>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donut Chart: Proporsi Domisili KK Usia 13-15 */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-sky-600" />
                <span>Proporsi Tempat Tinggal KK (Usia 13–15 Tahun)</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                Total: {totalUsia13_15} Siswa
              </span>
            </div>
            <div className="h-60 w-full relative flex items-center justify-center">
              {activePaluData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activePaluData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={activePaluData.length > 1 ? 5 : 0}
                      dataKey="value"
                      label={({ name, percent }) => `${typeof percent === 'number' ? (percent * 100).toFixed(0) : 0}%`}
                    >
                      {activePaluData.map((entry, index) => (
                        <Cell key={`cell-demografi-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center p-6 text-slate-400 text-xs">Belum ada data demografi</div>
              )}
            </div>
          </div>

          {/* Bar Chart: Distribusi Usia & Domisili */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>Distribusi Kelompok Usia Siswa (Palu vs Luar Palu)</span>
              </h3>
              <span className="text-[11px] font-mono text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200">
                Kohort Siswa SMP
              </span>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageCohortChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }} />
                  <Legend verticalAlign="bottom" height={36} />
                  <Bar dataKey="palu" name="Penduduk Kota Palu" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="nonPalu" name="Bukan Penduduk Kota Palu" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tabel Rincian Data Demografi Usia 13-15 Berdasarkan Tempat Tinggal KK */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                <th className="py-3 px-4 text-center">No</th>
                <th className="py-3 px-4">Kategori / Rentang Usia</th>
                <th className="py-3 px-4 text-center bg-sky-50 text-sky-800 border-x border-slate-200" colSpan={3}>
                  Penduduk Kota Palu (KK)
                </th>
                <th className="py-3 px-4 text-center bg-amber-50 text-amber-800 border-r border-slate-200" colSpan={3}>
                  Bukan Penduduk Kota Palu (KK)
                </th>
                <th className="py-3 px-4 text-center bg-indigo-50 text-indigo-800 border-r border-slate-200" colSpan={3}>
                  Total Siswa
                </th>
                <th className="py-3 px-4 text-center">% Palu</th>
              </tr>
              <tr className="bg-slate-100 text-slate-600 text-[11px] font-mono border-b border-slate-200">
                <th className="py-2 px-3 text-center">#</th>
                <th className="py-2 px-3">Kelompok Usia</th>
                <th className="py-2 px-2 text-center text-sky-700 border-l border-slate-200">L</th>
                <th className="py-2 px-2 text-center text-rose-700">P</th>
                <th className="py-2 px-2 text-center font-bold text-slate-900 bg-sky-100">Jml</th>
                <th className="py-2 px-2 text-center text-sky-700 border-l border-slate-200">L</th>
                <th className="py-2 px-2 text-center text-rose-700">P</th>
                <th className="py-2 px-2 text-center font-bold text-slate-900 bg-amber-100">Jml</th>
                <th className="py-2 px-2 text-center text-sky-700 border-l border-slate-200">L</th>
                <th className="py-2 px-2 text-center text-rose-700">P</th>
                <th className="py-2 px-2 text-center font-bold text-slate-900 bg-indigo-100">Jml</th>
                <th className="py-2 px-3 text-center border-l border-slate-200">Rasio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {/* Usia 13 */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 text-center font-mono text-slate-400">1</td>
                <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  Usia 13 Tahun
                </td>
                <td className="py-3 px-2 text-center font-mono text-sky-700 border-l border-slate-100">{usia13_Palu_L}</td>
                <td className="py-3 px-2 text-center font-mono text-rose-700">{usia13_Palu_P}</td>
                <td className="py-3 px-2 text-center font-mono font-bold text-sky-900 bg-sky-50">{usia13_Palu_L + usia13_Palu_P}</td>
                
                <td className="py-3 px-2 text-center font-mono text-sky-700 border-l border-slate-100">{usia13_NonPalu_L}</td>
                <td className="py-3 px-2 text-center font-mono text-rose-700">{usia13_NonPalu_P}</td>
                <td className="py-3 px-2 text-center font-mono font-bold text-amber-900 bg-amber-50">{usia13_NonPalu_L + usia13_NonPalu_P}</td>

                <td className="py-3 px-2 text-center font-mono text-sky-700 border-l border-slate-100">{usia13_Palu_L + usia13_NonPalu_L}</td>
                <td className="py-3 px-2 text-center font-mono text-rose-700">{usia13_Palu_P + usia13_NonPalu_P}</td>
                <td className="py-3 px-2 text-center font-mono font-black text-slate-900 bg-indigo-50">{usia13_Palu_L + usia13_Palu_P + usia13_NonPalu_L + usia13_NonPalu_P}</td>
                <td className="py-3 px-4 text-center font-mono text-xs text-slate-600 border-l border-slate-100">
                  {(usia13_Palu_L + usia13_Palu_P + usia13_NonPalu_L + usia13_NonPalu_P) > 0
                    ? `${Math.round(((usia13_Palu_L + usia13_Palu_P) / (usia13_Palu_L + usia13_Palu_P + usia13_NonPalu_L + usia13_NonPalu_P)) * 100)}%`
                    : '0%'}
                </td>
              </tr>

              {/* Usia 14 */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 text-center font-mono text-slate-400">2</td>
                <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  Usia 14 Tahun
                </td>
                <td className="py-3 px-2 text-center font-mono text-sky-700 border-l border-slate-100">{usia14_Palu_L}</td>
                <td className="py-3 px-2 text-center font-mono text-rose-700">{usia14_Palu_P}</td>
                <td className="py-3 px-2 text-center font-mono font-bold text-sky-900 bg-sky-50">{usia14_Palu_L + usia14_Palu_P}</td>
                
                <td className="py-3 px-2 text-center font-mono text-sky-700 border-l border-slate-100">{usia14_NonPalu_L}</td>
                <td className="py-3 px-2 text-center font-mono text-rose-700">{usia14_NonPalu_P}</td>
                <td className="py-3 px-2 text-center font-mono font-bold text-amber-900 bg-amber-50">{usia14_NonPalu_L + usia14_NonPalu_P}</td>

                <td className="py-3 px-2 text-center font-mono text-sky-700 border-l border-slate-100">{usia14_Palu_L + usia14_NonPalu_L}</td>
                <td className="py-3 px-2 text-center font-mono text-rose-700">{usia14_Palu_P + usia14_NonPalu_P}</td>
                <td className="py-3 px-2 text-center font-mono font-black text-slate-900 bg-indigo-50">{usia14_Palu_L + usia14_Palu_P + usia14_NonPalu_L + usia14_NonPalu_P}</td>
                <td className="py-3 px-4 text-center font-mono text-xs text-slate-600 border-l border-slate-100">
                  {(usia14_Palu_L + usia14_Palu_P + usia14_NonPalu_L + usia14_NonPalu_P) > 0
                    ? `${Math.round(((usia14_Palu_L + usia14_Palu_P) / (usia14_Palu_L + usia14_Palu_P + usia14_NonPalu_L + usia14_NonPalu_P)) * 100)}%`
                    : '0%'}
                </td>
              </tr>

              {/* Usia 15 */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 text-center font-mono text-slate-400">3</td>
                <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  Usia 15 Tahun
                </td>
                <td className="py-3 px-2 text-center font-mono text-sky-700 border-l border-slate-100">{usia15_Palu_L}</td>
                <td className="py-3 px-2 text-center font-mono text-rose-700">{usia15_Palu_P}</td>
                <td className="py-3 px-2 text-center font-mono font-bold text-sky-900 bg-sky-50">{usia15_Palu_L + usia15_Palu_P}</td>
                
                <td className="py-3 px-2 text-center font-mono text-sky-700 border-l border-slate-100">{usia15_NonPalu_L}</td>
                <td className="py-3 px-2 text-center font-mono text-rose-700">{usia15_NonPalu_P}</td>
                <td className="py-3 px-2 text-center font-mono font-bold text-amber-900 bg-amber-50">{usia15_NonPalu_L + usia15_NonPalu_P}</td>

                <td className="py-3 px-2 text-center font-mono text-sky-700 border-l border-slate-100">{usia15_Palu_L + usia15_NonPalu_L}</td>
                <td className="py-3 px-2 text-center font-mono text-rose-700">{usia15_Palu_P + usia15_NonPalu_P}</td>
                <td className="py-3 px-2 text-center font-mono font-black text-slate-900 bg-indigo-50">{usia15_Palu_L + usia15_Palu_P + usia15_NonPalu_L + usia15_NonPalu_P}</td>
                <td className="py-3 px-4 text-center font-mono text-xs text-slate-600 border-l border-slate-100">
                  {(usia15_Palu_L + usia15_Palu_P + usia15_NonPalu_L + usia15_NonPalu_P) > 0
                    ? `${Math.round(((usia15_Palu_L + usia15_Palu_P) / (usia15_Palu_L + usia15_Palu_P + usia15_NonPalu_L + usia15_NonPalu_P)) * 100)}%`
                    : '0%'}
                </td>
              </tr>

              {/* SUB-TOTAL: Usia 13 s.d. 15 Tahun (Highlighted) */}
              <tr className="bg-indigo-50/70 font-black border-y-2 border-indigo-200">
                <td className="py-3.5 px-4 text-center font-mono text-indigo-700">★</td>
                <td className="py-3.5 px-4 text-indigo-950 font-bold uppercase tracking-wider text-xs">
                  Subtotal Usia 13 s.d. 15 Tahun
                </td>
                <td className="py-3.5 px-2 text-center font-mono text-sky-700 border-l border-indigo-200">{usia13_15_Palu_L}</td>
                <td className="py-3.5 px-2 text-center font-mono text-rose-700">{usia13_15_Palu_P}</td>
                <td className="py-3.5 px-2 text-center font-mono font-black text-sky-800 bg-sky-100 text-sm">{totalUsia13_15_Palu}</td>
                
                <td className="py-3.5 px-2 text-center font-mono text-sky-700 border-l border-indigo-200">{usia13_15_NonPalu_L}</td>
                <td className="py-3.5 px-2 text-center font-mono text-rose-700">{usia13_15_NonPalu_P}</td>
                <td className="py-3.5 px-2 text-center font-mono font-black text-amber-800 bg-amber-100 text-sm">{totalUsia13_15_NonPalu}</td>

                <td className="py-3.5 px-2 text-center font-mono text-sky-700 border-l border-indigo-200">{usia13_15_Palu_L + usia13_15_NonPalu_L}</td>
                <td className="py-3.5 px-2 text-center font-mono text-rose-700">{usia13_15_Palu_P + usia13_15_NonPalu_P}</td>
                <td className="py-3.5 px-2 text-center font-mono font-black text-slate-900 bg-indigo-100 text-sm">{totalUsia13_15}</td>
                <td className="py-3.5 px-4 text-center font-mono font-black text-xs text-sky-800 border-l border-indigo-200">
                  {pctPalu}%
                </td>
              </tr>

              {/* Usia < 13 */}
              <tr className="hover:bg-slate-50 transition-colors text-slate-600">
                <td className="py-2.5 px-4 text-center font-mono text-slate-400">4</td>
                <td className="py-2.5 px-4">Usia &lt; 13 Tahun (Di Bawah Standar SMP)</td>
                <td className="py-2.5 px-2 text-center font-mono border-l border-slate-100">{usiaUnder13_Palu_L}</td>
                <td className="py-2.5 px-2 text-center font-mono">{usiaUnder13_Palu_P}</td>
                <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-700 bg-slate-50">{usiaUnder13_Palu_L + usiaUnder13_Palu_P}</td>
                
                <td className="py-2.5 px-2 text-center font-mono border-l border-slate-100">{usiaUnder13_NonPalu_L}</td>
                <td className="py-2.5 px-2 text-center font-mono">{usiaUnder13_NonPalu_P}</td>
                <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-700 bg-slate-50">{usiaUnder13_NonPalu_L + usiaUnder13_NonPalu_P}</td>

                <td className="py-2.5 px-2 text-center font-mono border-l border-slate-100">{usiaUnder13_Palu_L + usiaUnder13_NonPalu_L}</td>
                <td className="py-2.5 px-2 text-center font-mono">{usiaUnder13_Palu_P + usiaUnder13_NonPalu_P}</td>
                <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-700 bg-slate-50">{usiaUnder13_Palu_L + usiaUnder13_Palu_P + usiaUnder13_NonPalu_L + usiaUnder13_NonPalu_P}</td>
                <td className="py-2.5 px-4 text-center font-mono text-xs border-l border-slate-100">
                  {(usiaUnder13_Palu_L + usiaUnder13_Palu_P + usiaUnder13_NonPalu_L + usiaUnder13_NonPalu_P) > 0
                    ? `${Math.round(((usiaUnder13_Palu_L + usiaUnder13_Palu_P) / (usiaUnder13_Palu_L + usiaUnder13_Palu_P + usiaUnder13_NonPalu_L + usiaUnder13_NonPalu_P)) * 100)}%`
                    : '0%'}
                </td>
              </tr>

              {/* Usia > 15 */}
              <tr className="hover:bg-slate-50 transition-colors text-slate-600">
                <td className="py-2.5 px-4 text-center font-mono text-slate-400">5</td>
                <td className="py-2.5 px-4">Usia &gt; 15 Tahun (Di Atas Standar SMP)</td>
                <td className="py-2.5 px-2 text-center font-mono border-l border-slate-100">{usiaOver15_Palu_L}</td>
                <td className="py-2.5 px-2 text-center font-mono">{usiaOver15_Palu_P}</td>
                <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-700 bg-slate-50">{usiaOver15_Palu_L + usiaOver15_Palu_P}</td>
                
                <td className="py-2.5 px-2 text-center font-mono border-l border-slate-100">{usiaOver15_NonPalu_L}</td>
                <td className="py-2.5 px-2 text-center font-mono">{usiaOver15_NonPalu_P}</td>
                <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-700 bg-slate-50">{usiaOver15_NonPalu_L + usiaOver15_NonPalu_P}</td>

                <td className="py-2.5 px-2 text-center font-mono border-l border-slate-100">{usiaOver15_Palu_L + usiaOver15_NonPalu_L}</td>
                <td className="py-2.5 px-2 text-center font-mono">{usiaOver15_Palu_P + usiaOver15_NonPalu_P}</td>
                <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-700 bg-slate-50">{usiaOver15_Palu_L + usiaOver15_Palu_P + usiaOver15_NonPalu_L + usiaOver15_NonPalu_P}</td>
                <td className="py-2.5 px-4 text-center font-mono text-xs border-l border-slate-100">
                  {(usiaOver15_Palu_L + usiaOver15_Palu_P + usiaOver15_NonPalu_L + usiaOver15_NonPalu_P) > 0
                    ? `${Math.round(((usiaOver15_Palu_L + usiaOver15_Palu_P) / (usiaOver15_Palu_L + usiaOver15_Palu_P + usiaOver15_NonPalu_L + usiaOver15_NonPalu_P)) * 100)}%`
                    : '0%'}
                </td>
              </tr>
            </tbody>

            {/* Footer Grand Total */}
            <tfoot>
              <tr className="bg-slate-100 text-slate-900 font-black text-xs border-t-2 border-slate-300">
                <td className="py-3 px-4 text-center font-mono text-slate-500">Σ</td>
                <td className="py-3 px-4 uppercase tracking-wider font-bold">Total Seluruh Peserta Didik Aktif</td>
                <td className="py-3 px-2 text-center font-mono text-sky-700 border-l border-slate-200">{totalAllPalu_L}</td>
                <td className="py-3 px-2 text-center font-mono text-rose-700">{totalAllPalu_P}</td>
                <td className="py-3 px-2 text-center font-mono font-black text-sky-800 bg-sky-100">{totalAllPalu}</td>

                <td className="py-3 px-2 text-center font-mono text-sky-700 border-l border-slate-200">{totalAllNonPalu_L}</td>
                <td className="py-3 px-2 text-center font-mono text-rose-700">{totalAllNonPalu_P}</td>
                <td className="py-3 px-2 text-center font-mono font-black text-amber-800 bg-amber-100">{totalAllNonPalu}</td>

                <td className="py-3 px-2 text-center font-mono text-sky-700 border-l border-slate-200">{grandTotal_L}</td>
                <td className="py-3 px-2 text-center font-mono text-rose-700">{grandTotal_P}</td>
                <td className="py-3 px-2 text-center font-mono font-black text-emerald-700 bg-emerald-100 text-sm">{grandTotal}</td>
                <td className="py-3 px-4 text-center font-mono text-xs text-sky-800 border-l border-slate-200">{pctGrandPalu}%</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Note / Penjelasan Sumber Data KK */}
        <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 text-slate-700 text-xs flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-sky-100 text-sky-700 border border-sky-200 shrink-0 mt-0.5">
            <Home className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <span className="font-bold text-slate-900 block">Metode Klasifikasi Tempat Tinggal KK:</span>
            <p className="leading-relaxed text-[11px] text-slate-600">
              Klasifikasi <strong>Penduduk Kota Palu</strong> vs <strong>Bukan Penduduk Kota Palu</strong> diproses secara otomatis berdasarkan Nomor KK / NIK (Prefiks Wilayah Kemendagri <strong>7271</strong>), data Kecamatan (8 Kecamatan: Palu Barat, Palu Selatan, Palu Timur, Palu Utara, Mantikulore, Tatanga, Tawaeli, Ulujadi), serta Kelurahan dan Alamat Tempat Tinggal yang tercatat pada master data Dapodik peserta didik.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
