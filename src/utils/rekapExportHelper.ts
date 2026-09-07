import * as XLSX from 'xlsx';
import { Student, TeacherStaff, SarprasItem, StudentReport, SchoolProfile, AppDisplayConfig } from '../types';
import { formatDateIndonesian } from './dateUtils';

export interface RekapExportData {
  students: Student[];
  teachers: TeacherStaff[];
  sarpras: SarprasItem[];
  reports: StudentReport[];
  schoolProfile?: SchoolProfile;
  displayConfig?: AppDisplayConfig;
}

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

const checkIsPendudukPalu = (s: Student): boolean => {
  const nik = String(s.nik || '').trim();
  const noKk = String(s.noKk || '').trim();
  if (nik.startsWith('7271') || noKk.startsWith('7271')) return true;

  const kec = String(s.kecamatan || '').toLowerCase();
  const paluKecList = ['palu barat', 'palu timur', 'palu selatan', 'palu utara', 'mantikulore', 'tatanga', 'tawaeli', 'ulujadi'];
  if (paluKecList.some(k => kec.includes(k))) return true;

  const alamat = String(s.alamat || '').toLowerCase();
  const kel = String(s.kelurahan || '').toLowerCase();
  if (alamat.includes('palu') || kel.includes('palu')) return true;

  return false;
};

const calculateAge = (tanggalLahirStr?: string): number => {
  if (!tanggalLahirStr) return 14;
  try {
    let birthDate: Date | null = null;
    const cleanStr = String(tanggalLahirStr).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(cleanStr)) {
      birthDate = new Date(cleanStr);
    } else if (/^\d{2}[-/.]\d{2}[-/.]\d{4}/.test(cleanStr)) {
      const parts = cleanStr.split(/[-/.]/);
      birthDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    } else {
      birthDate = new Date(cleanStr);
    }

    if (birthDate && !isNaN(birthDate.getTime())) {
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age > 0 && age < 100 ? age : 14;
    }
  } catch (e) {
    // fallback
  }
  return 14;
};

/**
 * Exports complete, beautifully structured Excel workbook with multiple worksheets
 */
export function exportCompleteRekapToExcel({
  students,
  teachers,
  sarpras,
  reports,
  schoolProfile,
}: RekapExportData) {
  const allStudents = Array.isArray(students) ? students : [];
  const allTeachers = Array.isArray(teachers) ? teachers : [];
  const allSarpras = Array.isArray(sarpras) ? sarpras : [];
  const allReports = Array.isArray(reports) ? reports : [];

  const schoolName = schoolProfile?.namaSekolah || 'SMP NEGERI 11 PALU';
  const schoolNpsn = schoolProfile?.npsn || '40203578';
  const schoolAddress = schoolProfile?.alamat || 'Jl. Sintuvu No. 11, Palu Barat, Kota Palu, Sulawesi Tengah';
  const currentDateFormatted = formatDateIndonesian(new Date().toISOString());

  const activeStudents = allStudents.filter(s => s && (!s.status || s.status === 'Aktif'));
  const alumniStudents = allStudents.filter(s => s && (s.status === 'Lulus' || Boolean(s.tahunLulus && String(s.tahunLulus).trim())));
  const maleStudents = activeStudents.filter(s => s.jenisKelamin === 'L').length;
  const femaleStudents = activeStudents.filter(s => s.jenisKelamin === 'P').length;

  // Demography KK Usia 13-15 calculations
  let usia13_15_Palu_L = 0;
  let usia13_15_Palu_P = 0;
  let usia13_15_NonPalu_L = 0;
  let usia13_15_NonPalu_P = 0;

  let usia13_Palu_L = 0; let usia13_Palu_P = 0; let usia13_NonPalu_L = 0; let usia13_NonPalu_P = 0;
  let usia14_Palu_L = 0; let usia14_Palu_P = 0; let usia14_NonPalu_L = 0; let usia14_NonPalu_P = 0;
  let usia15_Palu_L = 0; let usia15_Palu_P = 0; let usia15_NonPalu_L = 0; let usia15_NonPalu_P = 0;
  let usiaUnder13_Palu_L = 0; let usiaUnder13_Palu_P = 0; let usiaUnder13_NonPalu_L = 0; let usiaUnder13_NonPalu_P = 0;
  let usiaOver15_Palu_L = 0; let usiaOver15_Palu_P = 0; let usiaOver15_NonPalu_L = 0; let usiaOver15_NonPalu_P = 0;

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

  // PTK stats
  const pendidikList = allTeachers.filter(t => {
    const jenis = (t.jenisPtk || '').toLowerCase();
    return jenis.includes('guru') || jenis.includes('kepala sekolah') || jenis.includes('pendidik');
  });
  const tendikList = allTeachers.filter(t => !pendidikList.includes(t));
  const certifiedCount = allTeachers.filter(t => (t.statusSertifikasi || '').toLowerCase().includes('sudah')).length;

  // Sarpras stats
  const sarprasBaik = allSarpras.filter(s => s.kondisi === 'Baik').length;
  const sarprasRusakRingan = allSarpras.filter(s => s.kondisi === 'Rusak Ringan').length;
  const sarprasRusakSedang = allSarpras.filter(s => s.kondisi === 'Rusak Sedang').length;
  const sarprasRusakBerat = allSarpras.filter(s => s.kondisi === 'Rusak Berat').length;

  // Rombel stats
  const classGenderRekap: Record<string, { level: string; male: number; female: number; total: number }> = {};
  activeStudents.forEach(s => {
    const rName = s.rombel || s.rombelSaatIni || 'Belum Terplot';
    if (!classGenderRekap[rName]) {
      let level = 'Lainnya';
      if (rName.includes('7') || rName.toLowerCase().includes('vii')) level = 'Kelas VII';
      else if (rName.includes('8') || rName.toLowerCase().includes('viii')) level = 'Kelas VIII';
      else if (rName.includes('9') || rName.toLowerCase().includes('ix')) level = 'Kelas IX';
      classGenderRekap[rName] = { level, male: 0, female: 0, total: 0 };
    }
    if (s.jenisKelamin === 'L') {
      classGenderRekap[rName].male += 1;
    } else if (s.jenisKelamin === 'P') {
      classGenderRekap[rName].female += 1;
    }
    classGenderRekap[rName].total += 1;
  });

  const sortedClassNames = Object.keys(classGenderRekap).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  // Alumni stats
  const alumniByYearCounts: Record<string, { total: number; male: number; female: number }> = {};
  alumniStudents.forEach(s => {
    const y = normalizeTahunLulus(s.tahunLulus);
    if (!alumniByYearCounts[y]) alumniByYearCounts[y] = { total: 0, male: 0, female: 0 };
    alumniByYearCounts[y].total += 1;
    if (s.jenisKelamin === 'L') alumniByYearCounts[y].male += 1;
    else if (s.jenisKelamin === 'P') alumniByYearCounts[y].female += 1;
  });
  const sortedAlumniYears = Object.keys(alumniByYearCounts).sort((a, b) => b.localeCompare(a));

  const wb = XLSX.utils.book_new();

  // ==========================================
  // SHEET 1: RINGKASAN_UTAMA
  // ==========================================
  const sheet1Data = [
    ['LAPORAN REKAPITULASI DATA POKOK PENDIDIKAN (DAPODIK)'],
    [schoolName.toUpperCase()],
    [`NPSN: ${schoolNpsn} | Alamat: ${schoolAddress}`],
    [`Tanggal Unduh Data: ${currentDateFormatted}`],
    [],
    ['NO', 'INDIKATOR / PARAMETER DATA', 'JUMLAH', 'SATUAN', 'RINCIAN / KETERANGAN'],
    [1, 'Total Peserta Didik Aktif', activeStudents.length, 'Siswa', `L: ${maleStudents} Siswa, P: ${femaleStudents} Siswa`],
    [2, 'Total Rombongan Belajar (Rombel)', sortedClassNames.length, 'Rombel', 'Terbagi dalam jenjang Kelas VII, VIII, dan IX'],
    [3, 'Kohort Siswa Usia SMP (13 s.d. 15 Tahun)', totalUsia13_15, 'Siswa', `${totalUsia13_15_Palu} KK Palu (${pctPalu}%), ${totalUsia13_15_NonPalu} KK Luar Palu (${pctNonPalu}%)`],
    [4, 'Siswa Usia di Bawah Standar SMP (< 13 Thn)', (usiaUnder13_Palu_L + usiaUnder13_Palu_P + usiaUnder13_NonPalu_L + usiaUnder13_NonPalu_P), 'Siswa', 'Siswa dengan usia di bawah 13 tahun'],
    [5, 'Siswa Usia di Atas Standar SMP (> 15 Thn)', (usiaOver15_Palu_L + usiaOver15_Palu_P + usiaOver15_NonPalu_L + usiaOver15_NonPalu_P), 'Siswa', 'Siswa dengan usia di atas 15 tahun'],
    [6, 'Total Pendidik & Tenaga Kependidikan (PTK)', allTeachers.length, 'Orang', `${pendidikList.length} Guru/Pendidik, ${tendikList.length} Tenaga Kependidikan`],
    [7, 'PTK Tersertifikasi Pendidik', certifiedCount, 'Orang', `${allTeachers.length > 0 ? Math.round((certifiedCount / allTeachers.length) * 100) : 0}% dari seluruh PTK`],
    [8, 'Total Sarana & Prasarana', allSarpras.length, 'Unit/Ruang', `${sarprasBaik} Baik, ${sarprasRusakRingan} Rusak Ringan, ${sarprasRusakSedang} Rusak Sedang, ${sarprasRusakBerat} Rusak Berat`],
    [9, 'Total Rapor Hasil Belajar Selesai', allReports.length, 'Dokumen', 'Laporan Rapor Peserta Didik'],
    [10, 'Total Alumni Siswa Lulus Terdata', alumniStudents.length, 'Siswa', `Tercatat dalam ${sortedAlumniYears.length} periode tahun kelulusan`],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  ws1['!cols'] = [
    { wch: 6 },
    { wch: 45 },
    { wch: 12 },
    { wch: 12 },
    { wch: 60 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Ringkasan_Utama');

  // ==========================================
  // SHEET 2: REKAP_SISWA_ROMBEL
  // ==========================================
  const sheet2Data = [
    ['REKAPITULASI PESERTA DIDIK PER TINGKAT & ROMBONGAN BELAJAR'],
    [schoolName.toUpperCase()],
    [`Total Siswa Aktif: ${activeStudents.length} (L: ${maleStudents}, P: ${femaleStudents})`],
    [],
    ['NO', 'TINGKAT KELAS', 'ROMBONGAN BELAJAR', 'LAKI-LAKI (L)', 'PEREMPUAN (P)', 'TOTAL SISWA', 'RASIO L (%)', 'RASIO P (%)'],
  ];

  sortedClassNames.forEach((className, idx) => {
    const item = classGenderRekap[className];
    const malePct = item.total > 0 ? Math.round((item.male / item.total) * 100) : 0;
    const femalePct = item.total > 0 ? Math.round((item.female / item.total) * 100) : 0;
    sheet2Data.push([
      (idx + 1) as any,
      item.level,
      className,
      item.male as any,
      item.female as any,
      item.total as any,
      `${malePct}%` as any,
      `${femalePct}%` as any
    ]);
  });

  sheet2Data.push([
    'Σ' as any,
    'TOTAL KESELURUHAN' as any,
    `${sortedClassNames.length} Rombel` as any,
    maleStudents as any,
    femaleStudents as any,
    activeStudents.length as any,
    `${activeStudents.length > 0 ? Math.round((maleStudents / activeStudents.length) * 100) : 0}%` as any,
    `${activeStudents.length > 0 ? Math.round((femaleStudents / activeStudents.length) * 100) : 0}%` as any
  ]);

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  ws2['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 25 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Rekap_Siswa_Rombel');

  // ==========================================
  // SHEET 3: REKAP_DEMOGRAFI_KK_USIA
  // ==========================================
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

  const sheet3Data = [
    ['REKAPITULASI USIA 13 S.D. 15 TAHUN BERDASARKAN TEMPAT TINGGAL KK (KOTA PALU VS LUAR PALU)'],
    [schoolName.toUpperCase()],
    [`Dasar Identifikasi: NIK / No KK (7271) & Kecamatan Domisili Kota Palu`],
    [],
    [
      'NO',
      'KELOMPOK USIA',
      'KK PALU (L)',
      'KK PALU (P)',
      'TOTAL KK PALU',
      'KK LUAR PALU (L)',
      'KK LUAR PALU (P)',
      'TOTAL KK LUAR PALU',
      'TOTAL SISWA (L)',
      'TOTAL SISWA (P)',
      'GRAND TOTAL SISWA',
      'PROPORSI PALU (%)'
    ],
    [
      1,
      'Usia 13 Tahun',
      usia13_Palu_L,
      usia13_Palu_P,
      usia13_Palu_L + usia13_Palu_P,
      usia13_NonPalu_L,
      usia13_NonPalu_P,
      usia13_NonPalu_L + usia13_NonPalu_P,
      usia13_Palu_L + usia13_NonPalu_L,
      usia13_Palu_P + usia13_NonPalu_P,
      usia13_Palu_L + usia13_Palu_P + usia13_NonPalu_L + usia13_NonPalu_P,
      `${(usia13_Palu_L + usia13_Palu_P + usia13_NonPalu_L + usia13_NonPalu_P) > 0 ? Math.round(((usia13_Palu_L + usia13_Palu_P) / (usia13_Palu_L + usia13_Palu_P + usia13_NonPalu_L + usia13_NonPalu_P)) * 100) : 0}%`
    ],
    [
      2,
      'Usia 14 Tahun',
      usia14_Palu_L,
      usia14_Palu_P,
      usia14_Palu_L + usia14_Palu_P,
      usia14_NonPalu_L,
      usia14_NonPalu_P,
      usia14_NonPalu_L + usia14_NonPalu_P,
      usia14_Palu_L + usia14_NonPalu_L,
      usia14_Palu_P + usia14_NonPalu_P,
      usia14_Palu_L + usia14_Palu_P + usia14_NonPalu_L + usia14_NonPalu_P,
      `${(usia14_Palu_L + usia14_Palu_P + usia14_NonPalu_L + usia14_NonPalu_P) > 0 ? Math.round(((usia14_Palu_L + usia14_Palu_P) / (usia14_Palu_L + usia14_Palu_P + usia14_NonPalu_L + usia14_NonPalu_P)) * 100) : 0}%`
    ],
    [
      3,
      'Usia 15 Tahun',
      usia15_Palu_L,
      usia15_Palu_P,
      usia15_Palu_L + usia15_Palu_P,
      usia15_NonPalu_L,
      usia15_NonPalu_P,
      usia15_NonPalu_L + usia15_NonPalu_P,
      usia15_Palu_L + usia15_NonPalu_L,
      usia15_Palu_P + usia15_NonPalu_P,
      usia15_Palu_L + usia15_Palu_P + usia15_NonPalu_L + usia15_NonPalu_P,
      `${(usia15_Palu_L + usia15_Palu_P + usia15_NonPalu_L + usia15_NonPalu_P) > 0 ? Math.round(((usia15_Palu_L + usia15_Palu_P) / (usia15_Palu_L + usia15_Palu_P + usia15_NonPalu_L + usia15_NonPalu_P)) * 100) : 0}%`
    ],
    [
      '★',
      'SUBTOTAL USIA 13-15 TAHUN (STANDAR SMP)',
      usia13_15_Palu_L,
      usia13_15_Palu_P,
      totalUsia13_15_Palu,
      usia13_15_NonPalu_L,
      usia13_15_NonPalu_P,
      totalUsia13_15_NonPalu,
      usia13_15_Palu_L + usia13_15_NonPalu_L,
      usia13_15_Palu_P + usia13_15_NonPalu_P,
      totalUsia13_15,
      `${pctPalu}%`
    ],
    [
      4,
      'Usia < 13 Tahun (Di Bawah Standar)',
      usiaUnder13_Palu_L,
      usiaUnder13_Palu_P,
      usiaUnder13_Palu_L + usiaUnder13_Palu_P,
      usiaUnder13_NonPalu_L,
      usiaUnder13_NonPalu_P,
      usiaUnder13_NonPalu_L + usiaUnder13_NonPalu_P,
      usiaUnder13_Palu_L + usiaUnder13_NonPalu_L,
      usiaUnder13_Palu_P + usiaUnder13_NonPalu_P,
      usiaUnder13_Palu_L + usiaUnder13_Palu_P + usiaUnder13_NonPalu_L + usiaUnder13_NonPalu_P,
      `${(usiaUnder13_Palu_L + usiaUnder13_Palu_P + usiaUnder13_NonPalu_L + usiaUnder13_NonPalu_P) > 0 ? Math.round(((usiaUnder13_Palu_L + usiaUnder13_Palu_P) / (usiaUnder13_Palu_L + usiaUnder13_Palu_P + usiaUnder13_NonPalu_L + usiaUnder13_NonPalu_P)) * 100) : 0}%`
    ],
    [
      5,
      'Usia > 15 Tahun (Di Atas Standar)',
      usiaOver15_Palu_L,
      usiaOver15_Palu_P,
      usiaOver15_Palu_L + usiaOver15_Palu_P,
      usiaOver15_NonPalu_L,
      usiaOver15_NonPalu_P,
      usiaOver15_NonPalu_L + usiaOver15_NonPalu_P,
      usiaOver15_Palu_L + usiaOver15_NonPalu_L,
      usiaOver15_Palu_P + usiaOver15_NonPalu_P,
      usiaOver15_Palu_L + usiaOver15_Palu_P + usiaOver15_NonPalu_L + usiaOver15_NonPalu_P,
      `${(usiaOver15_Palu_L + usiaOver15_Palu_P + usiaOver15_NonPalu_L + usiaOver15_NonPalu_P) > 0 ? Math.round(((usiaOver15_Palu_L + usiaOver15_Palu_P) / (usiaOver15_Palu_L + usiaOver15_Palu_P + usiaOver15_NonPalu_L + usiaOver15_NonPalu_P)) * 100) : 0}%`
    ],
    [
      'Σ',
      'TOTAL SELURUH SISWA AKTIF',
      totalAllPalu_L,
      totalAllPalu_P,
      totalAllPalu,
      totalAllNonPalu_L,
      totalAllNonPalu_P,
      totalAllNonPalu,
      grandTotal_L,
      grandTotal_P,
      grandTotal,
      `${pctGrandPalu}%`
    ]
  ];

  const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
  ws3['!cols'] = [
    { wch: 6 },
    { wch: 38 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, 'Rekap_Demografi_Usia_KK');

  // ==========================================
  // SHEET 4: REKAP_PTK
  // ==========================================
  const sheet4Data = [
    ['REKAPITULASI PROFIL PENDIDIK & TENAGA KEPENDIDIKAN (PTK)'],
    [schoolName.toUpperCase()],
    [`Total PTK: ${allTeachers.length} (Pendidik: ${pendidikList.length}, Tendik: ${tendikList.length})`],
    [],
    ['NO', 'NAMA LENGKAP', 'NIP / NUPTK', 'JENIS KELAMIN', 'JENIS PTK', 'STATUS KEPEGAWAIAN', 'STATUS SERTIFIKASI', 'PENDIDIKAN TERAKHIR', 'MATA PELAJARAN'],
  ];

  allTeachers.forEach((t, idx) => {
    sheet4Data.push([
      (idx + 1) as any,
      t.nama || '',
      t.nip || t.nuptk || '-',
      t.jenisKelamin || 'L',
      t.jenisPtk || 'Guru Mapel',
      t.statusKepegawaian || 'PNS',
      t.statusSertifikasi || t.sertifikasi || 'Belum',
      t.pendidikanTerakhir || 'S1',
      t.tugasTambahan || '-'
    ]);
  });

  const ws4 = XLSX.utils.aoa_to_sheet(sheet4Data);
  ws4['!cols'] = [
    { wch: 6 },
    { wch: 32 },
    { wch: 22 },
    { wch: 14 },
    { wch: 22 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 25 },
  ];
  XLSX.utils.book_append_sheet(wb, ws4, 'Rekap_PTK');

  // ==========================================
  // SHEET 5: REKAP_SARPRAS
  // ==========================================
  const sheet5Data = [
    ['REKAPITULASI SARANA & PRASARANA SEKOLAH'],
    [schoolName.toUpperCase()],
    [`Total Sarpras: ${allSarpras.length} (Baik: ${sarprasBaik}, Rusak Ringan: ${sarprasRusakRingan}, Rusak Sedang: ${sarprasRusakSedang}, Rusak Berat: ${sarprasRusakBerat})`],
    [],
    ['NO', 'KODE BARANG', 'NAMA SARPRAS / ASET', 'KATEGORI', 'JUMLAH', 'SATUAN', 'KONDISI FISIK', 'LETAK RUANG', 'LAYAK PAKAI'],
  ];

  allSarpras.forEach((s, idx) => {
    sheet5Data.push([
      (idx + 1) as any,
      s.kodeBarang || `SPR-${String(idx + 1).padStart(3, '0')}`,
      s.namaBarang || '',
      s.kategori || 'Perabot',
      (s.jumlah || 1) as any,
      s.satuan || 'Unit',
      s.kondisi || 'Baik',
      s.letakRuang || 'Ruang Kelas',
      s.layakPakai ? 'Ya (Layak)' : 'Tidak (Perlu Perbaikan)'
    ]);
  });

  const ws5 = XLSX.utils.aoa_to_sheet(sheet5Data);
  ws5['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 32 },
    { wch: 20 },
    { wch: 10 },
    { wch: 10 },
    { wch: 16 },
    { wch: 22 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, ws5, 'Rekap_Sarpras');

  // ==========================================
  // SHEET 6: REKAP_ALUMNI_KELULUSAN
  // ==========================================
  const sheet6Data = [
    ['REKAPITULASI HISTORIS KELULUSAN SISWA (ALUMNI)'],
    [schoolName.toUpperCase()],
    [`Total Siswa Lulus: ${alumniStudents.length} Siswa`],
    [],
    ['REKAPITULASI PER TAHUN KELULUSAN'],
    ['NO', 'TAHUN LULUS', 'LAKI-LAKI (L)', 'PEREMPUAN (P)', 'TOTAL LULUS'],
  ];

  sortedAlumniYears.forEach((year, idx) => {
    const row = alumniByYearCounts[year];
    sheet6Data.push([
      (idx + 1) as any,
      `Tahun ${year}`,
      row.male as any,
      row.female as any,
      row.total as any
    ]);
  });

  sheet6Data.push([]);
  sheet6Data.push(['DAFTAR RINCIAN SISWA LULUS / ALUMNI']);
  sheet6Data.push(['NO', 'NISN / NIS', 'NAMA LENGKAP SISWA', 'L/P', 'ROMBEL TERAKHIR', 'TAHUN LULUS', 'NO. SERI IJAZAH']);

  alumniStudents.forEach((st, idx) => {
    sheet6Data.push([
      (idx + 1) as any,
      st.nisn || st.nis || '-',
      st.nama || '',
      st.jenisKelamin || 'L',
      st.rombel || st.rombelSaatIni || '-',
      normalizeTahunLulus(st.tahunLulus),
      st.noSeriIjazah || '-'
    ]);
  });

  const ws6 = XLSX.utils.aoa_to_sheet(sheet6Data);
  ws6['!cols'] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 35 },
    { wch: 10 },
    { wch: 20 },
    { wch: 14 },
    { wch: 25 },
  ];
  XLSX.utils.book_append_sheet(wb, ws6, 'Rekap_Alumni_Lulus');

  // ==========================================
  // SHEET 7: REKAP_RAPOR_SISWA
  // ==========================================
  if (allReports.length > 0) {
    const sheet7Data = [
      ['REKAPITULASI BUKU RAPOR HASIL BELAJAR PESERTA DIDIK'],
      [schoolName.toUpperCase()],
      [`Total Rapor Tervalidasi: ${allReports.length} Dokumen`],
      [],
      ['NO', 'NAMA SISWA', 'NISN', 'ROMBEL', 'SEMESTER', 'TAHUN AJARAN', 'RATA-RATA NILAI', 'SAKIT', 'IZIN', 'ALPA', 'STATUS KENAIKAN'],
    ];

    allReports.forEach((rep, idx) => {
      const scores = Array.isArray(rep.scores) ? rep.scores : [];
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((acc, curr) => acc + (curr.nilaiPengetahuan + curr.nilaiKeterampilan) / 2, 0) / scores.length)
        : 0;

      sheet7Data.push([
        (idx + 1) as any,
        rep.studentName || '',
        rep.nisn || '',
        rep.rombel || '',
        rep.semester || 'Genap',
        rep.tahunAjaran || '2025/2026',
        avgScore as any,
        (rep.kehadiran?.sakit || 0) as any,
        (rep.kehadiran?.izin || 0) as any,
        (rep.kehadiran?.alpa || 0) as any,
        rep.statusKenaikan || 'Naik Kelas'
      ]);
    });

    const ws7 = XLSX.utils.aoa_to_sheet(sheet7Data);
    ws7['!cols'] = [
      { wch: 6 },
      { wch: 32 },
      { wch: 18 },
      { wch: 16 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, ws7, 'Rekap_Rapor_Siswa');
  }

  // Write out file
  const safeSchoolName = schoolName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `REKAP_DAPODIK_${safeSchoolName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}
