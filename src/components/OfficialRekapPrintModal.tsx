import React, { useEffect, useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileSpreadsheet, 
  ShieldCheck, 
  School, 
  Calendar,
  Building2,
  Users,
  GraduationCap,
  Loader2,
  FileText
} from 'lucide-react';
import { Student, TeacherStaff, SarprasItem, StudentReport, SchoolProfile, AppDisplayConfig } from '../types';
import { formatDateIndonesian } from '../utils/dateUtils';
import { exportCompleteRekapToExcel } from '../utils/rekapExportHelper';
import { formatImageUrl } from '../utils/imageUtils';
import { printElement } from '../utils/printHelper';
import { generateOfficialRekapPdf } from '../utils/pdfExportHelper';
import { getPtkBreakdown } from '../utils/ptkClassification';

interface OfficialRekapPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  teachers: TeacherStaff[];
  sarpras: SarprasItem[];
  reports: StudentReport[];
  schoolProfile?: SchoolProfile;
  displayConfig?: AppDisplayConfig;
}

export const OfficialRekapPrintModal: React.FC<OfficialRekapPrintModalProps> = ({
  isOpen,
  onClose,
  students,
  teachers,
  sarpras,
  reports,
  schoolProfile,
  displayConfig,
}) => {
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const allStudents = Array.isArray(students) ? students : [];
  const allTeachers = Array.isArray(teachers) ? teachers : [];
  const allSarpras = Array.isArray(sarpras) ? sarpras : [];
  const allReports = Array.isArray(reports) ? reports : [];

  const schoolName = schoolProfile?.namaSekolah || 'SMP NEGERI 11 PALU';
  const schoolNpsn = schoolProfile?.npsn || '40203578';
  const schoolAddress = schoolProfile?.alamat || 'Jl. Sintuvu No. 11, Palu Barat, Kota Palu, Sulawesi Tengah';
  const logoUrl = formatImageUrl(displayConfig?.logoCustomUrl || schoolProfile?.logoSekolah, '/logo_smpn11palu.jpg');
  const currentDateFormatted = formatDateIndonesian(new Date().toISOString());

  const activeStudents = allStudents.filter(s => s && (!s.status || s.status === 'Aktif'));
  const alumniStudents = allStudents.filter(s => s && (s.status === 'Lulus' || Boolean(s.tahunLulus && String(s.tahunLulus).trim())));
  const maleStudents = activeStudents.filter(s => s.jenisKelamin === 'L').length;
  const femaleStudents = activeStudents.filter(s => s.jenisKelamin === 'P').length;

  // Grade level cumulative calculations
  let kelas7L = 0, kelas7P = 0;
  let kelas8L = 0, kelas8P = 0;
  let kelas9L = 0, kelas9P = 0;

  activeStudents.forEach(s => {
    const rNameUpper = (s.rombel || s.rombelSaatIni || '').toUpperCase();
    if (rNameUpper.startsWith('VIII') || rNameUpper.includes('8')) {
      if (s.jenisKelamin === 'L') kelas8L += 1;
      else if (s.jenisKelamin === 'P') kelas8P += 1;
    } else if (rNameUpper.startsWith('VII') || rNameUpper.includes('7')) {
      if (s.jenisKelamin === 'L') kelas7L += 1;
      else if (s.jenisKelamin === 'P') kelas7P += 1;
    } else if (rNameUpper.startsWith('IX') || rNameUpper.includes('9')) {
      if (s.jenisKelamin === 'L') kelas9L += 1;
      else if (s.jenisKelamin === 'P') kelas9P += 1;
    }
  });

  // Rombel detailed grouping
  const classGenderRekap: Record<string, { level: string; male: number; female: number; total: number }> = {};
  activeStudents.forEach(s => {
    const rName = s.rombel || s.rombelSaatIni || 'Belum Terplot';
    if (!classGenderRekap[rName]) {
      let level = 'Lainnya';
      const upper = rName.toUpperCase();
      if (upper.startsWith('VII') || upper.includes('7')) level = 'Kelas VII';
      else if (upper.startsWith('VIII') || upper.includes('8')) level = 'Kelas VIII';
      else if (upper.startsWith('IX') || upper.includes('9')) level = 'Kelas IX';
      classGenderRekap[rName] = { level, male: 0, female: 0, total: 0 };
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

  // Demografi KK Usia 13-15 helper
  const checkIsPendudukPalu = (s: Student): boolean => {
    const cleanKk = String(s.noKk ?? '').replace(/\D/g, '');
    const cleanNik = String(s.nik ?? '').replace(/\D/g, '');
    if (cleanKk.startsWith('7271') || cleanNik.startsWith('7271')) return true;

    const KECAMATAN_PALU = ['palu barat', 'palu selatan', 'palu timur', 'palu utara', 'mantikulore', 'tatanga', 'tawaeli', 'ulujadi'];
    const kec = String(s.kecamatan ?? '').toLowerCase().trim();
    if (KECAMATAN_PALU.some(k => kec.includes(k)) || kec.includes('palu')) return true;

    const alm = String(s.alamat ?? '').toLowerCase().trim();
    const kel = String(s.kelurahan ?? '').toLowerCase().trim();
    if (alm.includes('palu') || kel.includes('palu')) return true;

    return false;
  };

  const calculateAge = (tanggalLahirStr?: string): number => {
    if (!tanggalLahirStr) return 14;
    try {
      let birthDate: Date | null = null;
      const cleanStr = String(tanggalLahirStr).trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(cleanStr)) birthDate = new Date(cleanStr);
      else if (/^\d{2}[-/.]\d{2}[-/.]\d{4}/.test(cleanStr)) {
        const parts = cleanStr.split(/[-/.]/);
        birthDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      } else birthDate = new Date(cleanStr);

      if (birthDate && !isNaN(birthDate.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age > 0 && age < 100 ? age : 14;
      }
    } catch (e) {
      // fallback
    }
    return 14;
  };

  let usia13_15_Palu_L = 0, usia13_15_Palu_P = 0;
  let usia13_15_NonPalu_L = 0, usia13_15_NonPalu_P = 0;

  let usia13_Palu_L = 0, usia13_Palu_P = 0, usia13_NonPalu_L = 0, usia13_NonPalu_P = 0;
  let usia14_Palu_L = 0, usia14_Palu_P = 0, usia14_NonPalu_L = 0, usia14_NonPalu_P = 0;
  let usia15_Palu_L = 0, usia15_Palu_P = 0, usia15_NonPalu_L = 0, usia15_NonPalu_P = 0;
  let usiaUnder13_Palu_L = 0, usiaUnder13_Palu_P = 0, usiaUnder13_NonPalu_L = 0, usiaUnder13_NonPalu_P = 0;
  let usiaOver15_Palu_L = 0, usiaOver15_Palu_P = 0, usiaOver15_NonPalu_L = 0, usiaOver15_NonPalu_P = 0;

  activeStudents.forEach(s => {
    const age = calculateAge(s.tanggalLahir);
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

  // PTK stats
  const ptkBreakdown = getPtkBreakdown(allTeachers);
  const pendidikList = ptkBreakdown.pendidikList;
  const tendikList = ptkBreakdown.tendikList;
  const ptkPns = ptkBreakdown.pnsCount;
  const ptkPppk = ptkBreakdown.pppkPenuhCount;
  const ptkPppkParuh = ptkBreakdown.pppkParuhCount;
  const ptkHonorer = ptkBreakdown.honorerCount;
  const ptkCertified = ptkBreakdown.sertifikasiSudahCount;

  // Sarpras stats
  const sarprasBaik = allSarpras.filter(s => s.kondisi === 'Baik').length;
  const sarprasRusakRingan = allSarpras.filter(s => s.kondisi === 'Rusak Ringan').length;
  const sarprasRusakSedang = allSarpras.filter(s => s.kondisi === 'Rusak Sedang').length;
  const sarprasRusakBerat = allSarpras.filter(s => s.kondisi === 'Rusak Berat').length;

  // Alumni stats
  const alumniByYearCounts: Record<string, { total: number; male: number; female: number }> = {};
  alumniStudents.forEach(s => {
    let y = '2025';
    if (s.tahunLulus) {
      const str = String(s.tahunLulus).trim();
      if (str.includes('/')) {
        const parts = str.split('/').map(p => p.trim());
        y = parts[parts.length - 1] || parts[0] || '2025';
      } else {
        y = str;
      }
    }
    if (!alumniByYearCounts[y]) alumniByYearCounts[y] = { total: 0, male: 0, female: 0 };
    alumniByYearCounts[y].total += 1;
    if (s.jenisKelamin === 'L') alumniByYearCounts[y].male += 1;
    else if (s.jenisKelamin === 'P') alumniByYearCounts[y].female += 1;
  });
  const sortedAlumniYears = Object.keys(alumniByYearCounts).sort((a, b) => b.localeCompare(a));

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await printElement('printable-rekap-document', `Laporan Rekapitulasi DAPODIK - ${schoolName}`);
    } catch (err) {
      console.error('Print failed:', err);
      // Fallback
      window.focus();
      window.print();
    } finally {
      setTimeout(() => setIsPrinting(false), 800);
    }
  };

  const handleDownloadPdf = () => {
    setIsExportingPdf(true);
    try {
      generateOfficialRekapPdf({
        students,
        teachers,
        sarpras,
        reports,
        schoolProfile,
        displayConfig,
      });
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setTimeout(() => setIsExportingPdf(false), 500);
    }
  };

  const handleDownloadExcel = () => {
    exportCompleteRekapToExcel({
      students,
      teachers,
      sarpras,
      reports,
      schoolProfile,
      displayConfig
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-fadeIn">
      {/* Modal Container */}
      <div className="bg-white text-slate-900 rounded-3xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="no-print p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Pratinjau Cetak / Unduh PDF Rekapitulasi</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Resmi Standar A4
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Dokumen kompilasi seluruh data pokok sekolah siap dicetak atau disimpan ke PDF & Excel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
            {/* Download Excel */}
            <button
              onClick={handleDownloadExcel}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:shadow"
              title="Unduh format spreadsheet Excel multi-sheet"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Unduh Excel</span>
              <span className="sm:hidden">Excel</span>
            </button>

            {/* Direct Download PDF File */}
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 hover:shadow"
              title="Simpan dokumen langsung sebagai file PDF (.pdf)"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              <span>{isExportingPdf ? 'Mengunduh PDF...' : 'Simpan PDF'}</span>
            </button>

            {/* Print Document */}
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer ring-2 ring-indigo-400/50 disabled:opacity-50 hover:shadow"
              title="Cetak langsung ke printer atau Simpan sebagai PDF dari browser"
            >
              {isPrinting ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              <span>{isPrinting ? 'Menyiapkan Cetak...' : 'Cetak Dokumen'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Tutup Pratinjau (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/70">
          <div 
            id="printable-rekap-document"
            className="bg-white max-w-4xl mx-auto p-6 sm:p-10 shadow-lg border border-slate-200 text-slate-900 rounded-2xl print:rounded-none print:border-none print:shadow-none print:p-0"
            style={{ minHeight: '297mm', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }}
          >
            {/* ========================================================= */}
            {/* KOP SURAT RESMI SEKOLAH */}
            {/* ========================================================= */}
            <div className="flex items-center justify-between gap-4 pb-3 border-b-4 border-double border-slate-900 mb-6">
              <div className="w-20 h-20 shrink-0 flex items-center justify-center p-1">
                <img
                  src={logoUrl}
                  alt="Logo Sekolah"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = '/logo_smpn11palu.jpg';
                  }}
                />
              </div>

              <div className="text-center flex-1 space-y-0.5">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-800">
                  PEMERINTAH KOTA PALU &bull; DINAS PENDIDIKAN DAN KEBUDAYAAN
                </div>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950">
                  {schoolName}
                </h1>
                <div className="text-[11px] font-semibold text-slate-700">
                  NPSN: <strong>{schoolNpsn}</strong> &bull; Status: <strong>{schoolProfile?.statusSekolah || 'Negeri'}</strong> &bull; Akreditasi: <strong>{schoolProfile?.akreditasi || 'A (Unggul)'}</strong>
                </div>
                <div className="text-[10px] text-slate-600">
                  {schoolAddress} &bull; Email: {schoolProfile?.email || 'smpn11palu@gmail.com'}
                </div>
              </div>

              <div className="w-20 h-20 shrink-0 flex items-center justify-center p-1 hidden sm:flex">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center p-1">
                  <ShieldCheck className="w-6 h-6 text-emerald-600 mb-0.5" />
                  <span className="text-[8px] font-black text-slate-700 uppercase leading-none">DAPODIK VALID</span>
                </div>
              </div>
            </div>

            {/* DOKUMEN TITLE */}
            <div className="text-center space-y-1 mb-6 pb-2 border-b border-slate-200">
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900">
                LAPORAN REKAPITULASI RESMI DATA POKOK PENDIDIKAN (DAPODIK)
              </h2>
              <div className="text-xs font-bold text-indigo-900 uppercase tracking-wide">
                SEMESTER GENAP TAHUN AJARAN 2025/2026
              </div>
              <div className="text-[10px] text-slate-500">
                Tanggal Terbit: <strong>{currentDateFormatted}</strong> &bull; Status Sinkronisasi: <strong className="text-emerald-700">100% Valid & Bersih</strong>
              </div>
            </div>

            {/* ========================================================= */}
            {/* BAB I: RINGKASAN EKSEKUTIF KELEMBAGAAN */}
            {/* ========================================================= */}
            <div className="mb-6 space-y-2.5 page-break-avoid">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-l-4 border-indigo-600 pl-2.5 py-0.5 flex items-center justify-between">
                <span>I. Ringkasan Eksekutif Kelembagaan</span>
                <span className="text-[10px] font-bold text-slate-500 lowercase font-mono">live summary</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Peserta Didik Aktif</div>
                  <div className="text-lg font-black text-slate-900 font-mono mt-0.5">{activeStudents.length} <span className="text-[10px] font-normal text-slate-500">Siswa</span></div>
                  <div className="text-[10px] text-slate-600 mt-0.5">L: {maleStudents} &bull; P: {femaleStudents}</div>
                </div>

                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Pendidik & Tenaga Kependidikan</div>
                  <div className="text-lg font-black text-slate-900 font-mono mt-0.5">{allTeachers.length} <span className="text-[10px] font-normal text-slate-500">PTK</span></div>
                  <div className="text-[10px] text-slate-600 mt-0.5">{pendidikList.length} Guru &bull; {tendikList.length} Tenaga Kependidikan</div>
                </div>

                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Sarana & Prasarana</div>
                  <div className="text-lg font-black text-slate-900 font-mono mt-0.5">{allSarpras.length} <span className="text-[10px] font-normal text-slate-500">Unit</span></div>
                  <div className="text-[10px] text-slate-600 mt-0.5">{sarprasBaik} Baik ({allSarpras.length > 0 ? Math.round((sarprasBaik/allSarpras.length)*100) : 0}%)</div>
                </div>

                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Alumni / Kelulusan</div>
                  <div className="text-lg font-black text-slate-900 font-mono mt-0.5">{alumniStudents.length} <span className="text-[10px] font-normal text-slate-500">Siswa</span></div>
                  <div className="text-[10px] text-slate-600 mt-0.5">{sortedAlumniYears.length} Periode Kelulusan</div>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* BAB II: REKAPITULASI PESERTA DIDIK PER KELAS & ROMBEL */}
            {/* ========================================================= */}
            <div className="mb-6 space-y-2.5 page-break-avoid">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-l-4 border-sky-600 pl-2.5 py-0.5 flex items-center justify-between">
                <span>II. Rekapitulasi Peserta Didik per Tingkat & Rombel</span>
                <span className="text-[10px] font-mono text-slate-600 font-semibold">{sortedClassNames.length} Rombel Terdata</span>
              </h3>

              {/* Cumulative Tingkat Box */}
              <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                <div className="p-2 bg-indigo-50/60 rounded-lg border border-indigo-100 flex items-center justify-between">
                  <span className="font-bold text-indigo-950">Kelas VII (Tujuh):</span>
                  <span className="font-mono font-black text-slate-900">{kelas7L + kelas7P} <span className="text-[10px] font-normal text-slate-500">(L:{kelas7L}, P:{kelas7P})</span></span>
                </div>
                <div className="p-2 bg-amber-50/60 rounded-lg border border-amber-100 flex items-center justify-between">
                  <span className="font-bold text-amber-950">Kelas VIII (Delapan):</span>
                  <span className="font-mono font-black text-slate-900">{kelas8L + kelas8P} <span className="text-[10px] font-normal text-slate-500">(L:{kelas8L}, P:{kelas8P})</span></span>
                </div>
                <div className="p-2 bg-emerald-50/60 rounded-lg border border-emerald-100 flex items-center justify-between">
                  <span className="font-bold text-emerald-950">Kelas IX (Sembilan):</span>
                  <span className="font-mono font-black text-slate-900">{kelas9L + kelas9P} <span className="text-[10px] font-normal text-slate-500">(L:{kelas9L}, P:{kelas9P})</span></span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto border border-slate-300 rounded-xl">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                      <th className="py-2 px-2.5 text-center border-r border-slate-300 w-10">No</th>
                      <th className="py-2 px-3 border-r border-slate-300">Tingkat</th>
                      <th className="py-2 px-3 border-r border-slate-300">Nama Rombongan Belajar (Rombel)</th>
                      <th className="py-2 px-3 text-center border-r border-slate-300 text-sky-800">L</th>
                      <th className="py-2 px-3 text-center border-r border-slate-300 text-rose-800">P</th>
                      <th className="py-2 px-3 text-center font-bold text-slate-900 border-r border-slate-300 bg-slate-200/50">Total</th>
                      <th className="py-2 px-3 text-center">Rasio (L / P)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sortedClassNames.map((className, idx) => {
                      const item = classGenderRekap[className];
                      const malePct = item.total > 0 ? Math.round((item.male / item.total) * 100) : 0;
                      return (
                        <tr key={className} className="hover:bg-slate-50">
                          <td className="py-1.5 px-2.5 text-center font-mono text-slate-500 border-r border-slate-200">{idx + 1}</td>
                          <td className="py-1.5 px-3 border-r border-slate-200 font-semibold text-slate-700">{item.level}</td>
                          <td className="py-1.5 px-3 border-r border-slate-200 font-bold text-slate-900">{className}</td>
                          <td className="py-1.5 px-3 text-center font-mono text-sky-700 border-r border-slate-200">{item.male}</td>
                          <td className="py-1.5 px-3 text-center font-mono text-rose-700 border-r border-slate-200">{item.female}</td>
                          <td className="py-1.5 px-3 text-center font-mono font-black text-slate-900 border-r border-slate-200 bg-slate-50">{item.total}</td>
                          <td className="py-1.5 px-3 text-center font-mono text-[10px] text-slate-600">{malePct}% L / {100 - malePct}% P</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-200 font-black text-slate-900 border-t-2 border-slate-400">
                      <td colSpan={3} className="py-2 px-3 text-right uppercase tracking-wider text-[11px] border-r border-slate-300">
                        TOTAL KESELURUHAN PESERTA DIDIK:
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-sky-900 border-r border-slate-300">{maleStudents}</td>
                      <td className="py-2 px-3 text-center font-mono text-rose-900 border-r border-slate-300">{femaleStudents}</td>
                      <td className="py-2 px-3 text-center font-mono font-black text-slate-950 bg-slate-300 border-r border-slate-300 text-xs">{activeStudents.length}</td>
                      <td className="py-2 px-3 text-center font-mono text-[10px] font-bold text-slate-800">
                        {activeStudents.length > 0 ? Math.round((maleStudents/activeStudents.length)*100) : 0}% L / {activeStudents.length > 0 ? Math.round((femaleStudents/activeStudents.length)*100) : 0}% P
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* ========================================================= */}
            {/* BAB III: REKAPITULASI DEMOGRAFI USIA 13-15 BERDASARKAN KK */}
            {/* ========================================================= */}
            <div className="mb-6 space-y-2.5 page-break-avoid">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-l-4 border-amber-600 pl-2.5 py-0.5 flex items-center justify-between">
                <span>III. Rekapitulasi Usia 13 s.d. 15 Tahun Berdasarkan Tempat Tinggal KK</span>
                <span className="text-[10px] font-mono text-amber-800 font-bold">Kode Wilayah KK: 7271 (Kota Palu)</span>
              </h3>

              <div className="overflow-x-auto border border-slate-300 rounded-xl">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                      <th className="py-2 px-2.5 text-center border-r border-slate-300 w-10" rowSpan={2}>No</th>
                      <th className="py-2 px-3 border-r border-slate-300" rowSpan={2}>Kelompok Usia</th>
                      <th className="py-1 px-3 text-center border-r border-slate-300 bg-sky-100 text-sky-900" colSpan={3}>Penduduk Kota Palu (KK)</th>
                      <th className="py-1 px-3 text-center border-r border-slate-300 bg-amber-100 text-amber-900" colSpan={3}>Bukan Penduduk Palu (KK)</th>
                      <th className="py-1 px-3 text-center border-r border-slate-300 bg-indigo-100 text-indigo-900" colSpan={3}>Total Siswa</th>
                      <th className="py-2 px-3 text-center" rowSpan={2}>% Palu</th>
                    </tr>
                    <tr className="bg-slate-50 text-[10px] font-mono border-b border-slate-300">
                      <th className="py-1 px-2 text-center text-sky-800 border-r border-slate-200">L</th>
                      <th className="py-1 px-2 text-center text-rose-800 border-r border-slate-200">P</th>
                      <th className="py-1 px-2 text-center font-bold text-slate-900 border-r border-slate-300 bg-sky-50">Jml</th>
                      <th className="py-1 px-2 text-center text-sky-800 border-r border-slate-200">L</th>
                      <th className="py-1 px-2 text-center text-rose-800 border-r border-slate-200">P</th>
                      <th className="py-1 px-2 text-center font-bold text-slate-900 border-r border-slate-300 bg-amber-50">Jml</th>
                      <th className="py-1 px-2 text-center text-sky-800 border-r border-slate-200">L</th>
                      <th className="py-1 px-2 text-center text-rose-800 border-r border-slate-200">P</th>
                      <th className="py-1 px-2 text-center font-black text-slate-900 border-r border-slate-300 bg-indigo-50">Jml</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-1.5 px-2.5 text-center font-mono border-r border-slate-200">1</td>
                      <td className="py-1.5 px-3 font-semibold border-r border-slate-200">Usia 13 Tahun</td>
                      <td className="py-1.5 px-2 text-center font-mono text-sky-700 border-r border-slate-200">{usia13_Palu_L}</td>
                      <td className="py-1.5 px-2 text-center font-mono text-rose-700 border-r border-slate-200">{usia13_Palu_P}</td>
                      <td className="py-1.5 px-2 text-center font-mono font-bold border-r border-slate-300 bg-sky-50">{usia13_Palu_L + usia13_Palu_P}</td>
                      <td className="py-1.5 px-2 text-center font-mono text-sky-700 border-r border-slate-200">{usia13_NonPalu_L}</td>
                      <td className="py-1.5 px-2 text-center font-mono text-rose-700 border-r border-slate-200">{usia13_NonPalu_P}</td>
                      <td className="py-1.5 px-2 text-center font-mono font-bold border-r border-slate-300 bg-amber-50">{usia13_NonPalu_L + usia13_NonPalu_P}</td>
                      <td className="py-1.5 px-2 text-center font-mono text-sky-700 border-r border-slate-200">{usia13_Palu_L + usia13_NonPalu_L}</td>
                      <td className="py-1.5 px-2 text-center font-mono text-rose-700 border-r border-slate-200">{usia13_Palu_P + usia13_NonPalu_P}</td>
                      <td className="py-1.5 px-2 text-center font-mono font-black border-r border-slate-300 bg-indigo-50">{usia13_Palu_L + usia13_Palu_P + usia13_NonPalu_L + usia13_NonPalu_P}</td>
                      <td className="py-1.5 px-3 text-center font-mono text-[10px]">
                        {(usia13_Palu_L + usia13_Palu_P + usia13_NonPalu_L + usia13_NonPalu_P) > 0 ? Math.round(((usia13_Palu_L + usia13_Palu_P)/(usia13_Palu_L + usia13_Palu_P + usia13_NonPalu_L + usia13_NonPalu_P))*100) : 0}%
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-2.5 text-center font-mono border-r border-slate-200">2</td>
                      <td className="py-1.5 px-3 font-semibold border-r border-slate-200">Usia 14 Tahun</td>
                      <td className="py-1.5 px-2 text-center font-mono text-sky-700 border-r border-slate-200">{usia14_Palu_L}</td>
                      <td className="py-1.5 px-2 text-center font-mono text-rose-700 border-r border-slate-200">{usia14_Palu_P}</td>
                      <td className="py-1.5 px-2 text-center font-mono font-bold border-r border-slate-300 bg-sky-50">{usia14_Palu_L + usia14_Palu_P}</td>
                      <td className="py-1.5 px-2 text-center font-mono text-sky-700 border-r border-slate-200">{usia14_NonPalu_L}</td>
                      <td className="py-1.5 px-2 text-center font-mono text-rose-700 border-r border-slate-200">{usia14_NonPalu_P}</td>
                      <td className="py-1.5 px-2 text-center font-mono font-bold border-r border-slate-300 bg-amber-50">{usia14_NonPalu_L + usia14_NonPalu_P}</td>
                      <td className="py-1.5 px-2 text-center font-mono text-sky-700 border-r border-slate-200">{usia14_Palu_L + usia14_NonPalu_L}</td>
                      <td className="py-1.5 px-2 text-center font-mono text-rose-700 border-r border-slate-200">{usia14_Palu_P + usia14_NonPalu_P}</td>
                      <td className="py-1.5 px-2 text-center font-mono font-black border-r border-slate-300 bg-indigo-50">{usia14_Palu_L + usia14_Palu_P + usia14_NonPalu_L + usia14_NonPalu_P}</td>
                      <td className="py-1.5 px-3 text-center font-mono text-[10px]">
                        {(usia14_Palu_L + usia14_Palu_P + usia14_NonPalu_L + usia14_NonPalu_P) > 0 ? Math.round(((usia14_Palu_L + usia14_Palu_P)/(usia14_Palu_L + usia14_Palu_P + usia14_NonPalu_L + usia14_NonPalu_P))*100) : 0}%
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-2.5 text-center font-mono border-r border-slate-200">3</td>
                      <td className="py-1.5 px-3 font-semibold border-r border-slate-200">Usia 15 Tahun</td>
                      <td className="py-1.5 px-2 text-center font-mono text-sky-700 border-r border-slate-200">{usia15_Palu_L}</td>
                      <td className="py-1.5 px-2 text-center font-mono text-rose-700 border-r border-slate-200">{usia15_Palu_P}</td>
                      <td className="py-1.5 px-2 text-center font-mono font-bold border-r border-slate-300 bg-sky-50">{usia15_Palu_L + usia15_Palu_P}</td>
                      <td className="py-1.5 px-2 text-center font-mono text-sky-700 border-r border-slate-200">{usia15_NonPalu_L}</td>
                      <td className="py-1.5 px-2 text-center font-mono text-rose-700 border-r border-slate-200">{usia15_NonPalu_P}</td>
                      <td className="py-1.5 px-2 text-center font-mono font-bold border-r border-slate-300 bg-amber-50">{usia15_NonPalu_L + usia15_NonPalu_P}</td>
                      <td className="py-1.5 px-2 text-center font-mono text-sky-700 border-r border-slate-200">{usia15_Palu_L + usia15_NonPalu_L}</td>
                      <td className="py-1.5 px-2 text-center font-mono text-rose-700 border-r border-slate-200">{usia15_Palu_P + usia15_NonPalu_P}</td>
                      <td className="py-1.5 px-2 text-center font-mono font-black border-r border-slate-300 bg-indigo-50">{usia15_Palu_L + usia15_Palu_P + usia15_NonPalu_L + usia15_NonPalu_P}</td>
                      <td className="py-1.5 px-3 text-center font-mono text-[10px]">
                        {(usia15_Palu_L + usia15_Palu_P + usia15_NonPalu_L + usia15_NonPalu_P) > 0 ? Math.round(((usia15_Palu_L + usia15_Palu_P)/(usia15_Palu_L + usia15_Palu_P + usia15_NonPalu_L + usia15_NonPalu_P))*100) : 0}%
                      </td>
                    </tr>
                    {/* Subtotal 13-15 */}
                    <tr className="bg-indigo-50/70 font-black border-y-2 border-indigo-200">
                      <td className="py-2 px-2.5 text-center font-mono text-indigo-800 border-r border-indigo-200">★</td>
                      <td className="py-2 px-3 uppercase text-indigo-950 border-r border-indigo-200">Subtotal Usia 13–15 Tahun (SMP)</td>
                      <td className="py-2 px-2 text-center font-mono text-sky-800 border-r border-indigo-200">{usia13_15_Palu_L}</td>
                      <td className="py-2 px-2 text-center font-mono text-rose-800 border-r border-indigo-200">{usia13_15_Palu_P}</td>
                      <td className="py-2 px-2 text-center font-mono font-black text-sky-900 bg-sky-100 border-r border-indigo-300">{totalUsia13_15_Palu}</td>
                      <td className="py-2 px-2 text-center font-mono text-sky-800 border-r border-indigo-200">{usia13_15_NonPalu_L}</td>
                      <td className="py-2 px-2 text-center font-mono text-rose-800 border-r border-indigo-200">{usia13_15_NonPalu_P}</td>
                      <td className="py-2 px-2 text-center font-mono font-black text-amber-900 bg-amber-100 border-r border-indigo-300">{totalUsia13_15_NonPalu}</td>
                      <td className="py-2 px-2 text-center font-mono text-sky-800 border-r border-indigo-200">{usia13_15_Palu_L + usia13_15_NonPalu_L}</td>
                      <td className="py-2 px-2 text-center font-mono text-rose-800 border-r border-indigo-200">{usia13_15_Palu_P + usia13_15_NonPalu_P}</td>
                      <td className="py-2 px-2 text-center font-mono font-black text-indigo-950 bg-indigo-100 border-r border-indigo-300">{totalUsia13_15}</td>
                      <td className="py-2 px-3 text-center font-mono font-black text-sky-900">{pctPalu}%</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-2.5 text-center font-mono border-r border-slate-200">4</td>
                      <td className="py-1.5 px-3 text-slate-600 border-r border-slate-200">Usia &lt; 13 Tahun (Di Bawah Standar)</td>
                      <td className="py-1.5 px-2 text-center font-mono text-slate-600 border-r border-slate-200">{usiaUnder13_Palu_L}</td>
                      <td className="py-1.5 px-2 text-center font-mono text-slate-600 border-r border-slate-200">{usiaUnder13_Palu_P}</td>
                      <td className="py-1.5 px-2 text-center font-mono font-bold border-r border-slate-300 bg-slate-50">{usiaUnder13_Palu_L + usiaUnder13_Palu_P}</td>
                      <td className="py-1.5 px-2 text-center font-mono text-slate-600 border-r border-slate-200">{usiaUnder13_NonPalu_L}</td>
                      <td className="py-1.5 px-2 text-center font-mono text-slate-600 border-r border-slate-200">{usiaUnder13_NonPalu_P}</td>
                      <td className="py-1.5 px-2 text-center font-mono font-bold border-r border-slate-300 bg-slate-50">{usiaUnder13_NonPalu_L + usiaUnder13_NonPalu_P}</td>
                      <td className="py-1.5 px-2 text-center font-mono text-slate-600 border-r border-slate-200">{usiaUnder13_Palu_L + usiaUnder13_NonPalu_L}</td>
                      <td className="py-1.5 px-2 text-center font-mono text-slate-600 border-r border-slate-200">{usiaUnder13_Palu_P + usiaUnder13_NonPalu_P}</td>
                      <td className="py-1.5 px-2 text-center font-mono font-black border-r border-slate-300 bg-slate-100">{usiaUnder13_Palu_L + usiaUnder13_Palu_P + usiaUnder13_NonPalu_L + usiaUnder13_NonPalu_P}</td>
                      <td className="py-1.5 px-3 text-center font-mono text-[10px]">
                        {(usiaUnder13_Palu_L + usiaUnder13_Palu_P + usiaUnder13_NonPalu_L + usiaUnder13_NonPalu_P) > 0 ? Math.round(((usiaUnder13_Palu_L + usiaUnder13_Palu_P)/(usiaUnder13_Palu_L + usiaUnder13_Palu_P + usiaUnder13_NonPalu_L + usiaUnder13_NonPalu_P))*100) : 0}%
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-2.5 text-center font-mono border-r border-slate-200">5</td>
                      <td className="py-1.5 px-3 text-slate-600 border-r border-slate-200">Usia &gt; 15 Tahun (Di Atas Standar)</td>
                      <td className="py-1.5 px-2 text-center font-mono text-slate-600 border-r border-slate-200">{usiaOver15_Palu_L}</td>
                      <td className="py-1.5 px-2 text-center font-mono text-slate-600 border-r border-slate-200">{usiaOver15_Palu_P}</td>
                      <td className="py-1.5 px-2 text-center font-mono font-bold border-r border-slate-300 bg-slate-50">{usiaOver15_Palu_L + usiaOver15_Palu_P}</td>
                      <td className="py-1.5 px-2 text-center font-mono text-slate-600 border-r border-slate-200">{usiaOver15_NonPalu_L}</td>
                      <td className="py-1.5 px-2 text-center font-mono text-slate-600 border-r border-slate-200">{usiaOver15_NonPalu_P}</td>
                      <td className="py-1.5 px-2 text-center font-mono font-bold border-r border-slate-300 bg-slate-50">{usiaOver15_NonPalu_L + usiaOver15_NonPalu_P}</td>
                      <td className="py-1.5 px-2 text-center font-mono text-slate-600 border-r border-slate-200">{usiaOver15_Palu_L + usiaOver15_NonPalu_L}</td>
                      <td className="py-1.5 px-2 text-center font-mono text-slate-600 border-r border-slate-200">{usiaOver15_Palu_P + usiaOver15_NonPalu_P}</td>
                      <td className="py-1.5 px-2 text-center font-mono font-black border-r border-slate-300 bg-slate-100">{usiaOver15_Palu_L + usiaOver15_Palu_P + usiaOver15_NonPalu_L + usiaOver15_NonPalu_P}</td>
                      <td className="py-1.5 px-3 text-center font-mono text-[10px]">
                        {(usiaOver15_Palu_L + usiaOver15_Palu_P + usiaOver15_NonPalu_L + usiaOver15_NonPalu_P) > 0 ? Math.round(((usiaOver15_Palu_L + usiaOver15_Palu_P)/(usiaOver15_Palu_L + usiaOver15_Palu_P + usiaOver15_NonPalu_L + usiaOver15_NonPalu_P))*100) : 0}%
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-200 font-black text-slate-900 border-t-2 border-slate-400">
                      <td colSpan={2} className="py-2 px-3 uppercase text-[11px] text-right border-r border-slate-300">
                        TOTAL KESELURUHAN SISWA AKTIF:
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-sky-900 border-r border-slate-300">{totalAllPalu_L}</td>
                      <td className="py-2 px-2 text-center font-mono text-rose-900 border-r border-slate-300">{totalAllPalu_P}</td>
                      <td className="py-2 px-2 text-center font-mono font-black text-sky-950 bg-sky-200 border-r border-slate-300">{totalAllPalu}</td>
                      <td className="py-2 px-2 text-center font-mono text-sky-900 border-r border-slate-300">{totalAllNonPalu_L}</td>
                      <td className="py-2 px-2 text-center font-mono text-rose-900 border-r border-slate-300">{totalAllNonPalu_P}</td>
                      <td className="py-2 px-2 text-center font-mono font-black text-amber-950 bg-amber-200 border-r border-slate-300">{totalAllNonPalu}</td>
                      <td className="py-2 px-2 text-center font-mono text-sky-900 border-r border-slate-300">{grandTotal_L}</td>
                      <td className="py-2 px-2 text-center font-mono text-rose-900 border-r border-slate-300">{grandTotal_P}</td>
                      <td className="py-2 px-2 text-center font-mono font-black text-slate-950 bg-slate-300 border-r border-slate-300 text-xs">{grandTotal}</td>
                      <td className="py-2 px-3 text-center font-mono font-black text-sky-950">{pctGrandPalu}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* ========================================================= */}
            {/* BAB IV: REKAPITULASI PTK & SARPRAS (GRID) */}
            {/* ========================================================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 page-break-avoid">
              {/* PTK Summary */}
              <div className="space-y-2 border border-slate-300 rounded-xl p-3 bg-slate-50/50">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-l-4 border-emerald-600 pl-2 py-0.5">
                  IV. Rekapitulasi PTK
                </h3>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Pendidik (Guru):</span>
                    <span className="font-mono font-bold text-slate-900">{pendidikList.length} Orang</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Tenaga Kependidikan:</span>
                    <span className="font-mono font-bold text-slate-900">{tendikList.length} Orang</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Status Kepegawaian:</span>
                    <span className="font-mono font-bold text-slate-900 text-right">
                      {ptkPns} PNS / {ptkPppk} PPPK {ptkPppkParuh > 0 ? `/ ${ptkPppkParuh} PPPK-PW ` : ''}/ {ptkHonorer} Honorer
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">Guru Tersertifikasi Pendidik:</span>
                    <span className="font-mono font-bold text-emerald-800">{ptkCertified} Orang ({allTeachers.length > 0 ? Math.round((ptkCertified/allTeachers.length)*100) : 0}%)</span>
                  </div>
                </div>
              </div>

              {/* Sarpras Summary */}
              <div className="space-y-2 border border-slate-300 rounded-xl p-3 bg-slate-50/50">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-l-4 border-rose-600 pl-2 py-0.5">
                  V. Rekapitulasi Sarana & Prasarana
                </h3>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Kondisi Baik:</span>
                    <span className="font-mono font-bold text-emerald-700">{sarprasBaik} Unit ({allSarpras.length > 0 ? Math.round((sarprasBaik/allSarpras.length)*100) : 0}%)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Rusak Ringan:</span>
                    <span className="font-mono font-bold text-amber-700">{sarprasRusakRingan} Unit</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Rusak Sedang / Rusak Berat:</span>
                    <span className="font-mono font-bold text-rose-700">{sarprasRusakSedang} / {sarprasRusakBerat} Unit</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600 font-bold">Total Seluruh Aset / Sarpras:</span>
                    <span className="font-mono font-black text-slate-950">{allSarpras.length} Unit</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* BAB VI: REKAPITULASI HISTORIS KELULUSAN (ALUMNI) */}
            {/* ========================================================= */}
            {sortedAlumniYears.length > 0 && (
              <div className="mb-6 space-y-2.5 page-break-avoid">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-l-4 border-teal-600 pl-2.5 py-0.5 flex items-center justify-between">
                  <span>VI. Rekapitulasi Historis Kelulusan (Alumni)</span>
                  <span className="text-[10px] font-mono text-slate-600 font-semibold">Total {alumniStudents.length} Siswa Lulus</span>
                </h3>

                <div className="overflow-x-auto border border-slate-300 rounded-xl">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                        <th className="py-2 px-2.5 text-center border-r border-slate-300 w-10">No</th>
                        <th className="py-2 px-3 border-r border-slate-300">Tahun Kelulusan</th>
                        <th className="py-2 px-3 text-center border-r border-slate-300 text-sky-800">Laki-Laki (L)</th>
                        <th className="py-2 px-3 text-center border-r border-slate-300 text-rose-800">Perempuan (P)</th>
                        <th className="py-2 px-3 text-center font-bold text-slate-900 bg-slate-200/50">Total Lulus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {sortedAlumniYears.map((year, idx) => {
                        const row = alumniByYearCounts[year];
                        return (
                          <tr key={year} className="hover:bg-slate-50">
                            <td className="py-1.5 px-2.5 text-center font-mono border-r border-slate-200">{idx + 1}</td>
                            <td className="py-1.5 px-3 font-bold text-slate-800 border-r border-slate-200">Tahun {year}</td>
                            <td className="py-1.5 px-3 text-center font-mono text-sky-700 border-r border-slate-200">{row.male}</td>
                            <td className="py-1.5 px-3 text-center font-mono text-rose-700 border-r border-slate-200">{row.female}</td>
                            <td className="py-1.5 px-3 text-center font-mono font-black text-slate-900 bg-slate-50">{row.total}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* LEMBAR PENGESAHAN RESMI (TANDA TANGAN) */}
            {/* ========================================================= */}
            <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs page-break-avoid">
              <div className="text-center space-y-16">
                <div>
                  <div className="text-slate-500 text-[10px]">Mengetahui / Memvalidasi:</div>
                  <div className="font-bold text-slate-900 uppercase">Petugas Operator Dapodik</div>
                </div>
                <div>
                  <div className="font-black text-slate-950 underline decoration-slate-400 underline-offset-4">
                    {schoolProfile?.operatorSekolah || 'Ahmad Andryanto, S.Kom.'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    NIP/NUPTK: {(schoolProfile as any)?.nipOperator || '199208142022031008'}
                  </div>
                </div>
              </div>

              <div className="text-center space-y-16">
                <div>
                  <div className="text-slate-500 text-[10px]">Palu, {currentDateFormatted}</div>
                  <div className="font-bold text-slate-900 uppercase">Kepala Sekolah</div>
                </div>
                <div>
                  <div className="font-black text-slate-950 underline decoration-slate-400 underline-offset-4">
                    {schoolProfile?.kepalaSekolah || 'Hj. Rosdiana, S.Pd., M.Pd.'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    NIP. {schoolProfile?.nipKepalaSekolah || '196805121994122003'}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Bar Controls (Hidden when printing) */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Dokumen ini dihasilkan secara otomatis dari Master Database DAPODIK Sekolah Terintegrasi.</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={handleDownloadExcel}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:shadow"
              title="Unduh seluruh tabel dalam format Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Unduh Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 hover:shadow"
              title="Simpan dokumen langsung sebagai file PDF"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              <span>{isExportingPdf ? 'Mengunduh PDF...' : 'Simpan PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 hover:shadow"
              title="Buka dialog cetak atau simpan PDF melalui browser"
            >
              {isPrinting ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              <span>{isPrinting ? 'Menyiapkan...' : 'Cetak / Simpan PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
