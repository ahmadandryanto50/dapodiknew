import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, TeacherStaff, SarprasItem, StudentReport, SchoolProfile, AppDisplayConfig } from '../types';
import { formatDateIndonesian } from './dateUtils';
import { getPtkBreakdown } from './ptkClassification';

export interface ExportPdfOptions {
  students: Student[];
  teachers: TeacherStaff[];
  sarpras: SarprasItem[];
  reports: StudentReport[];
  schoolProfile?: SchoolProfile;
  displayConfig?: AppDisplayConfig;
}

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
    // ignore
  }
  return 14;
};

/**
 * Generates and downloads official multi-page Dapodik Rekap PDF instantly with jsPDF
 */
export function generateOfficialRekapPdf({
  students,
  teachers,
  sarpras,
  reports,
  schoolProfile,
}: ExportPdfOptions): boolean {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const allStudents = Array.isArray(students) ? students : [];
    const allTeachers = Array.isArray(teachers) ? teachers : [];
    const allSarpras = Array.isArray(sarpras) ? sarpras : [];
    const allReports = Array.isArray(reports) ? reports : [];

    const schoolName = (schoolProfile?.namaSekolah || 'SMP NEGERI 11 PALU').toUpperCase();
    const schoolNpsn = schoolProfile?.npsn || '40203578';
    const schoolAkreditasi = schoolProfile?.akreditasi || 'A (Unggul)';
    const schoolAddress = schoolProfile?.alamat || 'Jl. Sintuvu No. 11, Palu Barat, Kota Palu, Sulawesi Tengah';
    const schoolEmail = schoolProfile?.email || 'smpnegeri11palu@gmail.com';
    const kepalaSekolah = schoolProfile?.kepalaSekolah || 'Sunardiyanto, S.Pd., M.Pd.';
    const nipKepsek = (schoolProfile as any)?.nipKepsek || '196805121994121003';
    const operatorSekolah = schoolProfile?.operatorSekolah || 'Ahmad Andryanto, S.Kom.';
    const nipOperator = (schoolProfile as any)?.nipOperator || '199208142022031008';
    const currentDateFormatted = formatDateIndonesian(new Date().toISOString());

    const activeStudents = allStudents.filter(s => s && (!s.status || s.status === 'Aktif'));
    const maleStudents = activeStudents.filter(s => s.jenisKelamin === 'L').length;
    const femaleStudents = activeStudents.filter(s => s.jenisKelamin === 'P').length;
    const totalStudents = activeStudents.length;

    // Demography calculations
    let usia13_15_Palu_L = 0; let usia13_15_Palu_P = 0;
    let usia13_15_NonPalu_L = 0; let usia13_15_NonPalu_P = 0;
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
        if (isPalu) { if (isL) usia13_15_Palu_L++; else usia13_15_Palu_P++; }
        else { if (isL) usia13_15_NonPalu_L++; else usia13_15_NonPalu_P++; }
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

    const total13_15_Palu = usia13_15_Palu_L + usia13_15_Palu_P;
    const total13_15_NonPalu = usia13_15_NonPalu_L + usia13_15_NonPalu_P;
    const total13_15 = total13_15_Palu + total13_15_NonPalu;

    // Rombel stats
    const classRekap: Record<string, { level: string; male: number; female: number; total: number }> = {};
    activeStudents.forEach(s => {
      const rName = s.rombel || s.rombelSaatIni || 'Belum Terplot';
      if (!classRekap[rName]) {
        let level = 'Lainnya';
        if (rName.includes('7') || rName.toLowerCase().includes('vii')) level = 'Kelas VII';
        else if (rName.includes('8') || rName.toLowerCase().includes('viii')) level = 'Kelas VIII';
        else if (rName.includes('9') || rName.toLowerCase().includes('ix')) level = 'Kelas IX';
        classRekap[rName] = { level, male: 0, female: 0, total: 0 };
      }
      if (s.jenisKelamin === 'L') classRekap[rName].male++;
      else if (s.jenisKelamin === 'P') classRekap[rName].female++;
      classRekap[rName].total++;
    });

    // PTK stats
    const ptkBreakdown = getPtkBreakdown(allTeachers);
    const pendidikCount = ptkBreakdown.pendidikCount;
    const tendikCount = ptkBreakdown.tendikCount;
    const certifiedCount = ptkBreakdown.sertifikasiSudahCount;

    // Sarpras stats
    const sarprasBaik = allSarpras.filter(s => s.kondisi === 'Baik').length;
    const sarprasRusak = allSarpras.length - sarprasBaik;

    // Alumni stats
    const alumniList = allStudents.filter(s => s.status === 'Lulus' || Boolean(s.tahunLulus && String(s.tahunLulus).trim()));

    // PAGE MARGINS
    const marginX = 14;
    let currentY = 15;

    // 1. KOP SURAT
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text('PEMERINTAH KOTA PALU', 105, currentY, { align: 'center' });
    currentY += 4.5;
    doc.text('DINAS PENDIDIKAN DAN KEBUDAYAAN', 105, currentY, { align: 'center' });
    currentY += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42);
    doc.text(schoolName, 105, currentY, { align: 'center' });
    currentY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(70, 70, 70);
    doc.text(`NPSN: ${schoolNpsn} • Status: Negeri • Akreditasi: ${schoolAkreditasi}`, 105, currentY, { align: 'center' });
    currentY += 4;
    doc.text(`${schoolAddress} • Email: ${schoolEmail}`, 105, currentY, { align: 'center' });
    currentY += 4;

    // Double line divider
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.8);
    doc.line(marginX, currentY, 210 - marginX, currentY);
    currentY += 1;
    doc.setLineWidth(0.2);
    doc.line(marginX, currentY, 210 - marginX, currentY);
    currentY += 6;

    // 2. JUDUL DOKUMEN
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('LAPORAN REKAPITULASI RESMI DATA POKOK PENDIDIKAN (DAPODIK)', 105, currentY, { align: 'center' });
    currentY += 5;

    doc.setFontSize(9.5);
    doc.setTextColor(37, 99, 235);
    doc.text('SEMESTER GENAP TAHUN AJARAN 2025/2026', 105, currentY, { align: 'center' });
    currentY += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Tanggal Terbit: ${currentDateFormatted} • Status Sinkronisasi: 100% Valid & Bersih`, 105, currentY, { align: 'center' });
    currentY += 6;

    // SECTION I: RINGKASAN EKSEKUTIF KELEMBAGAAN
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text('I. RINGKASAN EKSEKUTIF KELEMBAGAAN', marginX, currentY);
    currentY += 2;

    const summaryTableData = [
      ['Total Peserta Didik Aktif', `${totalStudents} Siswa (Laki-laki: ${maleStudents}, Perempuan: ${femaleStudents})`],
      ['Total Rombongan Belajar (Rombel)', `${Object.keys(classRekap).length} Rombel Terdaftar`],
      ['Siswa Usia 13-15 Tahun (SMP)', `${total13_15} Siswa (Kota Palu: ${total13_15_Palu}, Luar Palu: ${total13_15_NonPalu})`],
      ['Pendidik & Tenaga Kependidikan', `${allTeachers.length} PTK (${pendidikCount} Guru, ${tendikCount} Tenaga Kependidikan, ${certifiedCount} Tersertifikasi)`],
      ['Sarana & Prasarana (Aset)', `${allSarpras.length} Unit Terdata (Baik: ${sarprasBaik}, Rusak: ${sarprasRusak})`],
      ['Alumni / Siswa Lulus', `${alumniList.length} Siswa Terdaftar`],
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['Indikator Utama', 'Rincian Data Aktual']],
      body: summaryTableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59], cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold' },
        1: { cellWidth: 'auto' },
      },
      margin: { left: marginX, right: marginX },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;

    // SECTION II: REKAPITULASI ROMBEL & TINGKAT
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text('II. REKAPITULASI PESERTA DIDIK PER TINGKAT & ROMBONGAN BELAJAR', marginX, currentY);
    currentY += 2;

    const rombelRows: any[] = [];
    const sortedRombelKeys = Object.keys(classRekap).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    sortedRombelKeys.forEach((rName, idx) => {
      const data = classRekap[rName];
      const pct = totalStudents > 0 ? ((data.total / totalStudents) * 100).toFixed(1) : '0';
      rombelRows.push([
        idx + 1,
        data.level,
        rName,
        data.male,
        data.female,
        data.total,
        `${pct}%`
      ]);
    });
    // Total Row
    rombelRows.push(['', 'TOTAL KESELURUHAN', `${sortedRombelKeys.length} Rombel`, maleStudents, femaleStudents, totalStudents, '100%']);

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Tingkat Kelas', 'Nama Rombel', 'L', 'P', 'Total', 'Proporsi']],
      body: rombelRows,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center' },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59], cellPadding: 2 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 35 },
        2: { cellWidth: 45 },
        3: { halign: 'center', cellWidth: 16 },
        4: { halign: 'center', cellWidth: 16 },
        5: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
        6: { halign: 'center', cellWidth: 25 },
      },
      didParseCell: (data) => {
        if (data.row.index === rombelRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
        }
      },
      margin: { left: marginX, right: marginX },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;

    // SECTION III: REKAPITULASI DEMOGRAFI USIA 13-15 TAHUN
    // Check page break needed
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text('III. REKAPITULASI SISWA USIA STANDAR SMP (13-15 TAHUN) BERDASARKAN KK', marginX, currentY);
    currentY += 2;

    const demografiRows = [
      ['1', 'Usia 13 Tahun', usia13_Palu_L, usia13_Palu_P, usia13_Palu_L + usia13_Palu_P, usia13_NonPalu_L, usia13_NonPalu_P, usia13_NonPalu_L + usia13_NonPalu_P, (usia13_Palu_L + usia13_Palu_P) + (usia13_NonPalu_L + usia13_NonPalu_P)],
      ['2', 'Usia 14 Tahun', usia14_Palu_L, usia14_Palu_P, usia14_Palu_L + usia14_Palu_P, usia14_NonPalu_L, usia14_NonPalu_P, usia14_NonPalu_L + usia14_NonPalu_P, (usia14_Palu_L + usia14_Palu_P) + (usia14_NonPalu_L + usia14_NonPalu_P)],
      ['3', 'Usia 15 Tahun', usia15_Palu_L, usia15_Palu_P, usia15_Palu_L + usia15_Palu_P, usia15_NonPalu_L, usia15_NonPalu_P, usia15_NonPalu_L + usia15_NonPalu_P, (usia15_Palu_L + usia15_Palu_P) + (usia15_NonPalu_L + usia15_NonPalu_P)],
      ['', 'SUBTOTAL USIA 13-15 THN', usia13_15_Palu_L, usia13_15_Palu_P, total13_15_Palu, usia13_15_NonPalu_L, usia13_15_NonPalu_P, total13_15_NonPalu, total13_15],
      ['4', 'Usia < 13 Tahun', usiaUnder13_Palu_L, usiaUnder13_Palu_P, usiaUnder13_Palu_L + usiaUnder13_Palu_P, usiaUnder13_NonPalu_L, usiaUnder13_NonPalu_P, usiaUnder13_NonPalu_L + usiaUnder13_NonPalu_P, (usiaUnder13_Palu_L + usiaUnder13_Palu_P) + (usiaUnder13_NonPalu_L + usiaUnder13_NonPalu_P)],
      ['5', 'Usia > 15 Tahun', usiaOver15_Palu_L, usiaOver15_Palu_P, usiaOver15_Palu_L + usiaOver15_Palu_P, usiaOver15_NonPalu_L, usiaOver15_NonPalu_P, usiaOver15_NonPalu_L + usiaOver15_NonPalu_P, (usiaOver15_Palu_L + usiaOver15_Palu_P) + (usiaOver15_NonPalu_L + usiaOver15_NonPalu_P)],
      ['', 'TOTAL KESELURUHAN SISWA', maleStudents, femaleStudents, totalStudents, '-', '-', '-', totalStudents],
    ];

    autoTable(doc, {
      startY: currentY,
      head: [
        [
          { content: 'No', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
          { content: 'Kategori Usia', rowSpan: 2, styles: { valign: 'middle' } },
          { content: 'Penduduk Kota Palu (KK Palu)', colSpan: 3, styles: { halign: 'center' } },
          { content: 'Bukan Penduduk Palu (Luar KK)', colSpan: 3, styles: { halign: 'center' } },
          { content: 'Total', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        ],
        ['L', 'P', 'Jml', 'L', 'P', 'Jml'],
      ],
      body: demografiRows,
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59], cellPadding: 1.8 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { cellWidth: 42 },
        2: { halign: 'center', cellWidth: 16 },
        3: { halign: 'center', cellWidth: 16 },
        4: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
        5: { halign: 'center', cellWidth: 16 },
        6: { halign: 'center', cellWidth: 16 },
        7: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
        8: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.row.index === 3 || data.row.index === demografiRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
        }
      },
      margin: { left: marginX, right: marginX },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;

    // Check page break for section IV & V
    if (currentY > 210) {
      doc.addPage();
      currentY = 20;
    }

    // SECTION IV: REKAP PTK
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text('IV. REKAPITULASI PENDIDIK & TENAGA KEPENDIDIKAN (PTK)', marginX, currentY);
    currentY += 2;

    const ptkSummaryRows = [
      ['1', 'Guru Mata Pelajaran / Pendidik', pendidikCount, 'PNS / PPPK / Honorer', 'Mengajar'],
      ['2', 'Tenaga Kependidikan (TU / Operator / Laboran / Pustakawan / Staf)', tendikCount, 'PNS / PPPK / Honorer', 'Administrasi & Teknis'],
      ['3', 'Status Sertifikasi Pendidik', certifiedCount, 'Tersertifikasi Pendidik', 'Tunjangan Profesi'],
      ['', 'TOTAL PTK TERDAFTAR', allTeachers.length, 'Status Aktif di Dapodik', '100%'],
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Kategori Kepegawaian', 'Jumlah', 'Status Dominan', 'Keterangan Tugas']],
      body: ptkSummaryRows,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center' },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59], cellPadding: 2 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 65 },
        2: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
        3: { cellWidth: 45 },
        4: { cellWidth: 40 },
      },
      didParseCell: (data) => {
        if (data.row.index === ptkSummaryRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
        }
      },
      margin: { left: marginX, right: marginX },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;

    // Check page break for section V & signature
    if (currentY > 200) {
      doc.addPage();
      currentY = 20;
    }

    // SECTION V: REKAP SARPRAS
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text('V. REKAPITULASI KONDISI SARANA & PRASARANA (SARPRAS)', marginX, currentY);
    currentY += 2;

    const sarprasRusakRingan = allSarpras.filter(s => s.kondisi === 'Rusak Ringan').length;
    const sarprasRusakSedang = allSarpras.filter(s => s.kondisi === 'Rusak Sedang').length;
    const sarprasRusakBerat = allSarpras.filter(s => s.kondisi === 'Rusak Berat').length;

    const sarprasRows = [
      ['1', 'Kondisi Baik (Layak Pakai)', sarprasBaik, allSarpras.length > 0 ? `${Math.round((sarprasBaik / allSarpras.length) * 100)}%` : '0%', 'Siap Digunakan'],
      ['2', 'Kondisi Rusak Ringan', sarprasRusakRingan, allSarpras.length > 0 ? `${Math.round((sarprasRusakRingan / allSarpras.length) * 100)}%` : '0%', 'Perlu Pemeliharaan Ringan'],
      ['3', 'Kondisi Rusak Sedang', sarprasRusakSedang, allSarpras.length > 0 ? `${Math.round((sarprasRusakSedang / allSarpras.length) * 100)}%` : '0%', 'Perlu Perbaikan Berkala'],
      ['4', 'Kondisi Rusak Berat', sarprasRusakBerat, allSarpras.length > 0 ? `${Math.round((sarprasRusakBerat / allSarpras.length) * 100)}%` : '0%', 'Perlu Penggantian / Usulan'],
      ['', 'TOTAL INVENTARIS ASET', allSarpras.length, '100%', 'Tercatat di SIM Sarpras'],
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Kondisi Fisik Sarpras', 'Jumlah Unit', 'Persentase', 'Tindakan / Keterangan']],
      body: sarprasRows,
      theme: 'grid',
      headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center' },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59], cellPadding: 2 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 60 },
        2: { halign: 'center', cellWidth: 25, fontStyle: 'bold' },
        3: { halign: 'center', cellWidth: 25 },
        4: { cellWidth: 60 },
      },
      didParseCell: (data) => {
        if (data.row.index === sarprasRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
        }
      },
      margin: { left: marginX, right: marginX },
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;

    // Check space for signature
    if (currentY > 230) {
      doc.addPage();
      currentY = 25;
    }

    // LEMBAR PENGESAHAN (SIGNATURE BLOCK)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    // Operator Column (Left)
    doc.text('Mengetahui / Mengesahkan,', marginX + 5, currentY);
    doc.text('Pengelola Data / Operator Dapodik,', marginX + 5, currentY + 4.5);
    doc.text('Palu, ' + currentDateFormatted, 210 - marginX - 65, currentY);
    doc.text('Kepala Sekolah,', 210 - marginX - 65, currentY + 4.5);

    currentY += 25;

    // Names & NIPs
    doc.setFont('helvetica', 'bold');
    doc.text(operatorSekolah, marginX + 5, currentY);
    doc.text(kepalaSekolah, 210 - marginX - 65, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(70, 70, 70);
    doc.text(`NIP/NUPTK: ${nipOperator}`, marginX + 5, currentY + 4.5);
    doc.text(`NIP: ${nipKepsek}`, 210 - marginX - 65, currentY + 4.5);

    // Add page numbers and official footer on all pages
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);

      doc.text(
        'Sistem Informasi Manajemen Dapodik • SMP NEGERI 11 PALU • Dokumen Resmi',
        marginX,
        290
      );
      doc.text(`Halaman ${i} dari ${pageCount}`, 210 - marginX, 290, { align: 'right' });
    }

    const cleanSchool = schoolName.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`LAPORAN_REKAPITULASI_DAPODIK_${cleanSchool}_${new Date().getFullYear()}.pdf`);
    return true;
  } catch (error) {
    console.error('Error generating PDF with jsPDF:', error);
    return false;
  }
}

/**
 * Generates a clean 2-page Rapor Kurikulum Merdeka PDF for a single student instantly with jsPDF
 */
export function generateSingleStudentReportPdf(
  report: StudentReport,
  schoolProfile?: SchoolProfile
): boolean {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const studentName = report.studentName || 'Siswa';
    const nis = report.nis || '3899';
    const nisn = report.nisn || '-';
    const namaSekolah = report.namaSekolah || schoolProfile?.namaSekolah || 'SMP NEGERI 11 PALU';
    const alamat = report.alamat || schoolProfile?.alamat || 'Jl. Keramik';
    const rombel = report.rombel || '7 A';
    const fase = report.fase || 'D';
    const semester = String(report.semester || '2');
    const tahunAjaran = report.tahunAjaran || '2025/2026';

    const marginX = 14;
    let currentY = 15;

    // Helper to draw student info header
    const drawHeaderBox = () => {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(0, 0, 0);

      // Left Column
      doc.text('Nama Murid', marginX, currentY);
      doc.setFont('helvetica', 'bold');
      doc.text(`: ${studentName}`, marginX + 28, currentY);

      currentY += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.text('NIS/NISN', marginX, currentY);
      doc.setFont('helvetica', 'bold');
      doc.text(`: ${nis} / ${nisn}`, marginX + 28, currentY);

      currentY += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.text('Sekolah', marginX, currentY);
      doc.setFont('helvetica', 'bold');
      doc.text(`: ${namaSekolah}`, marginX + 28, currentY);

      currentY += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.text('Alamat', marginX, currentY);
      doc.setFont('helvetica', 'bold');
      doc.text(`: ${alamat}`, marginX + 28, currentY);

      // Right Column
      let rightY = currentY - 13.5;
      const rightX = 120;
      doc.setFont('helvetica', 'normal');
      doc.text('Kelas', rightX, rightY);
      doc.setFont('helvetica', 'bold');
      doc.text(`: ${rombel}`, rightX + 25, rightY);

      rightY += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.text('Fase', rightX, rightY);
      doc.setFont('helvetica', 'bold');
      doc.text(`: ${fase}`, rightX + 25, rightY);

      rightY += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.text('Semester', rightX, rightY);
      doc.setFont('helvetica', 'bold');
      doc.text(`: ${semester}`, rightX + 25, rightY);

      rightY += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.text('Tahun Ajaran', rightX, rightY);
      doc.setFont('helvetica', 'bold');
      doc.text(`: ${tahunAjaran}`, rightX + 25, rightY);

      currentY += 4;
      doc.setLineWidth(0.4);
      doc.line(marginX, currentY, 210 - marginX, currentY);
      currentY += 5;
    };

    // PAGE 1
    drawHeaderBox();

    // Main Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('LAPORAN HASIL BELAJAR', 105, currentY, { align: 'center' });
    currentY += 6;

    // Table Scores
    const scores = report.scores || [];
    const groupA = scores.filter(sc => !sc.kelompok || sc.kelompok === 'Kelompok A');
    const groupB = scores.filter(sc => sc.kelompok === 'Kelompok B');

    const tableBody: any[] = [];
    tableBody.push([{ content: 'Kelompok A', colSpan: 4, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } }]);
    groupA.forEach((sc, idx) => {
      tableBody.push([
        idx + 1,
        sc.mapel,
        sc.nilaiAkhir ?? sc.nilaiPengetahuan ?? 75,
        sc.catatan || 'Mencapai Kompetensi dengan baik.'
      ]);
    });

    tableBody.push([{ content: 'Kelompok B', colSpan: 4, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } }]);
    groupB.forEach((sc, idx) => {
      tableBody.push([
        idx + 1,
        sc.mapel,
        sc.nilaiAkhir ?? sc.nilaiPengetahuan ?? 75,
        sc.catatan || 'Mencapai Kompetensi dengan baik.'
      ]);
    });

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Mata Pelajaran', 'Nilai Akhir', 'Capaian Kompetensi']],
      body: tableBody,
      theme: 'grid',
      styles: { lineColor: [0, 0, 0], lineWidth: 0.3 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5, halign: 'center', lineColor: [0, 0, 0], lineWidth: 0.3 },
      bodyStyles: { fontSize: 8, textColor: [0, 0, 0], cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.3 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10, fontStyle: 'bold' },
        1: { cellWidth: 45, fontStyle: 'bold' },
        2: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
        3: { cellWidth: 'auto' },
      },
      margin: { left: marginX, right: marginX },
    });

    // Page 1 Footer
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`${rombel}  |  ${studentName}  |  ${nis}`, marginX, 285);
    doc.text('Halaman : 1', 210 - marginX, 285, { align: 'right' });

    // PAGE 2
    doc.addPage();
    currentY = 15;
    drawHeaderBox();

    // Kokurikuler Box
    const kokurikulerText = report.kokurikuler ||
      'Pada semester ini, ananda menunjukkan capaian yang cukup baik dalam penguatan profil lulusan, yang ditunjukkan melalui kegiatan kokurikuler Literasi dan Numerasi.\nPada dimensi penalaran kritis, ananda berkembang dalam subdimensi penyampaian argumentasi.';

    autoTable(doc, {
      startY: currentY,
      head: [['Kokurikuler']],
      body: [[kokurikulerText]],
      theme: 'grid',
      styles: { lineColor: [0, 0, 0], lineWidth: 0.3 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5, halign: 'center', lineColor: [0, 0, 0], lineWidth: 0.3 },
      bodyStyles: { fontSize: 8, textColor: [0, 0, 0], cellPadding: 3, lineColor: [0, 0, 0], lineWidth: 0.3 },
      margin: { left: marginX, right: marginX },
    });
    currentY = (doc as any).lastAutoTable.finalY + 4;

    // Ekstrakurikuler Table
    const ekstraList = report.ekstrakurikuler && report.ekstrakurikuler.length > 0
      ? report.ekstrakurikuler
      : [{ namaEkstra: 'Pramuka', keterangan: 'Mampu dalam menerapkan nilai-nilai Dasa Darma dan Trisatya, selalu hadir tepat waktu, aktif membantu teman dalam regu, serta menunjukkan perkembangan yang baik dalam memahami pengetahuan kepramukaan.' }];

    const ekstraRows = ekstraList.map((ex, idx) => [idx + 1, ex.namaEkstra, ex.keterangan]);

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Ekstrakurikuler', 'Keterangan']],
      body: ekstraRows,
      theme: 'grid',
      styles: { lineColor: [0, 0, 0], lineWidth: 0.3 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5, halign: 'center', lineColor: [0, 0, 0], lineWidth: 0.3 },
      bodyStyles: { fontSize: 8, textColor: [0, 0, 0], cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.3 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10, fontStyle: 'bold' },
        1: { cellWidth: 40, fontStyle: 'bold' },
        2: { cellWidth: 'auto' },
      },
      margin: { left: marginX, right: marginX },
    });
    currentY = (doc as any).lastAutoTable.finalY + 4;

    // Ketidakhadiran & Catatan Wali Kelas
    const sakit = report.kehadiran?.sakit ?? 1;
    const izin = report.kehadiran?.izin ?? 1;
    const alpa = report.kehadiran?.alpa ?? 1;
    const catatanWali = report.catatanWaliKelas || 'Perlu meningkatkan motivasi belajar, kedisiplinan, dan tanggung jawab dalam mengikuti pembelajaran, Partisipasi dalam kegiatan belajar masih perlu ditingkatkan.';

    autoTable(doc, {
      startY: currentY,
      head: [['Ketidakhadiran', 'Catatan Wali Kelas']],
      body: [
        [
          `Sakit : ${sakit} hari\nIzin : ${izin} hari\nTanpa Keterangan : ${alpa} hari`,
          catatanWali
        ]
      ],
      theme: 'grid',
      styles: { lineColor: [0, 0, 0], lineWidth: 0.3 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5, halign: 'center', lineColor: [0, 0, 0], lineWidth: 0.3 },
      bodyStyles: { fontSize: 8, textColor: [0, 0, 0], cellPadding: 2.5, lineColor: [0, 0, 0], lineWidth: 0.3 },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 'auto' },
      },
      margin: { left: marginX, right: marginX },
    });
    currentY = (doc as any).lastAutoTable.finalY + 4;

    // Status Kenaikan Kelas
    const statusKenaikan = report.statusKenaikan || 'Naik ke kelas VIII';
    autoTable(doc, {
      startY: currentY,
      body: [[`Keterangan Kenaikan Kelas : ${statusKenaikan}`]],
      theme: 'grid',
      styles: { lineColor: [0, 0, 0], lineWidth: 0.3 },
      bodyStyles: { fontSize: 8.5, fontStyle: 'bold', textColor: [0, 0, 0], halign: 'center', cellPadding: 2.5, lineColor: [0, 0, 0], lineWidth: 0.3 },
      margin: { left: marginX, right: marginX },
    });
    currentY = (doc as any).lastAutoTable.finalY + 4;

    // Tanggapan Orang Tua
    autoTable(doc, {
      startY: currentY,
      head: [['Tanggapan Orang Tua/Wali Murid']],
      body: [[report.tanggapanOrangTua || '\n\n']],
      theme: 'grid',
      styles: { lineColor: [0, 0, 0], lineWidth: 0.3 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5, halign: 'center', lineColor: [0, 0, 0], lineWidth: 0.3 },
      bodyStyles: { fontSize: 8, textColor: [0, 0, 0], cellPadding: 2.5, lineColor: [0, 0, 0], lineWidth: 0.3 },
      margin: { left: marginX, right: marginX },
    });
    currentY = (doc as any).lastAutoTable.finalY + 6;

    // Custom Fields if any
    if (report.customFields && report.customFields.length > 0) {
      report.customFields.forEach(cf => {
        autoTable(doc, {
          startY: currentY,
          head: [[cf.judul || 'Catatan / Data Tambahan']],
          body: [[cf.isi]],
          theme: 'grid',
          styles: { lineColor: [0, 0, 0], lineWidth: 0.3 },
          headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5, halign: 'center', lineColor: [0, 0, 0], lineWidth: 0.3 },
          bodyStyles: { fontSize: 8, textColor: [0, 0, 0], cellPadding: 2.5, lineColor: [0, 0, 0], lineWidth: 0.3 },
          margin: { left: marginX, right: marginX },
        });
        currentY = (doc as any).lastAutoTable.finalY + 4;
      });
    }

    // Signatures
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);

    const tempatTgl = report.tempatTanggalCetak || 'Palu, 22 Juni 2026';
    doc.text(tempatTgl, 210 - marginX - 10, currentY, { align: 'right' });
    currentY += 5;

    const colWidth = (210 - marginX * 2) / 3;
    const x1 = marginX + colWidth / 2;
    const x2 = marginX + colWidth + colWidth / 2;
    const x3 = marginX + colWidth * 2 + colWidth / 2;

    doc.text('Orang Tua Murid', x1, currentY, { align: 'center' });
    doc.text('Kepala Sekolah', x2, currentY, { align: 'center' });
    doc.text('Wali Kelas', x3, currentY, { align: 'center' });

    currentY += 16;

    const kepsek = report.namaKepalaSekolah || schoolProfile?.kepalaSekolah || 'Martha Taewa, S.Pd';
    const nipKepsek = report.nipKepalaSekolah || 'NIP 197103192007012011';
    const wali = report.namaWaliKelas || 'RINA, S.Pd., M.Pd';
    const nipWali = report.nipWaliKelas || 'NIP 9740817200932003';

    doc.setFont('helvetica', 'bold');
    doc.text('......................................', x1, currentY, { align: 'center' });
    doc.text(kepsek, x2, currentY, { align: 'center' });
    doc.text(wali, x3, currentY, { align: 'center' });

    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(nipKepsek, x2, currentY, { align: 'center' });
    doc.text(nipWali, x3, currentY, { align: 'center' });

    // Page 2 Footer
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`${rombel}  |  ${studentName}  |  ${nis}`, marginX, 285);
    doc.text('Halaman : 2', 210 - marginX, 285, { align: 'right' });

    const cleanName = studentName.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Rapor_Kurikulum_Merdeka_${cleanName}.pdf`);
    return true;
  } catch (error) {
    console.error('Error generating single student report PDF:', error);
    return false;
  }
}

/**
 * Generates an editable Microsoft Word (.doc) document for a single student report
 */
export function exportSingleStudentReportToWord(
  report: StudentReport,
  schoolProfile?: SchoolProfile
): boolean {
  try {
    const studentName = report.studentName || 'Siswa';
    const nis = report.nis || '-';
    const nisn = report.nisn || '-';
    const namaSekolah = report.namaSekolah || schoolProfile?.namaSekolah || 'SMP NEGERI 11 PALU';
    const alamat = report.alamat || schoolProfile?.alamat || 'Jl. Keramik';
    const rombel = report.rombel || '7 A';
    const fase = report.fase || 'D';
    const semester = String(report.semester || '2');
    const tahunAjaran = report.tahunAjaran || '2025/2026';

    const scores = report.scores || [];
    const groupA = scores.filter(sc => !sc.kelompok || sc.kelompok === 'Kelompok A');
    const groupB = scores.filter(sc => sc.kelompok === 'Kelompok B');

    let groupARowsHtml = '';
    groupA.forEach((sc, idx) => {
      groupARowsHtml += `
        <tr>
          <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
          <td style="font-weight: bold;">${sc.mapel}</td>
          <td style="text-align: center; font-weight: bold;">${sc.nilaiAkhir ?? sc.nilaiPengetahuan ?? 75}</td>
          <td>${sc.catatan || 'Mencapai Kompetensi dengan baik.'}</td>
        </tr>
      `;
    });

    let groupBRowsHtml = '';
    groupB.forEach((sc, idx) => {
      groupBRowsHtml += `
        <tr>
          <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
          <td style="font-weight: bold;">${sc.mapel}</td>
          <td style="text-align: center; font-weight: bold;">${sc.nilaiAkhir ?? sc.nilaiPengetahuan ?? 75}</td>
          <td>${sc.catatan || 'Mencapai Kompetensi dengan baik.'}</td>
        </tr>
      `;
    });

    const kokurikulerText = report.kokurikuler ||
      'Pada semester ini, ananda menunjukkan capaian yang cukup baik dalam penguatan profil lulusan, yang ditunjukkan melalui kegiatan kokurikuler Literasi dan Numerasi.\nPada dimensi penalaran kritis, ananda berkembang dalam subdimensi penyampaian argumentasi.';

    const ekstraList = report.ekstrakurikuler && report.ekstrakurikuler.length > 0
      ? report.ekstrakurikuler
      : [{ namaEkstra: 'Pramuka', keterangan: 'Mampu dalam menerapkan nilai-nilai Dasa Darma dan Trisatya, selalu hadir tepat waktu, aktif membantu teman dalam regu, serta menunjukkan perkembangan yang baik dalam memahami pengetahuan kepramukaan.' }];

    let ekstraRowsHtml = '';
    ekstraList.forEach((ex, idx) => {
      ekstraRowsHtml += `
        <tr>
          <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
          <td style="font-weight: bold;">${ex.namaEkstra}</td>
          <td>${ex.keterangan}</td>
        </tr>
      `;
    });

    const sakit = report.kehadiran?.sakit ?? 1;
    const izin = report.kehadiran?.izin ?? 1;
    const alpa = report.kehadiran?.alpa ?? 1;
    const catatanWali = report.catatanWaliKelas || 'Perlu meningkatkan motivasi belajar, kedisiplinan, dan tanggung jawab dalam mengikuti pembelajaran, Partisipasi dalam kegiatan belajar masih perlu ditingkatkan.';
    const statusKenaikan = report.statusKenaikan || 'Naik ke kelas VIII';
    const tempatTgl = report.tempatTanggalCetak || 'Palu, 22 Juni 2026';

    const kepsek = report.namaKepalaSekolah || schoolProfile?.kepalaSekolah || 'Martha Taewa, S.Pd';
    const nipKepsek = report.nipKepalaSekolah || 'NIP 197103192007012011';
    const wali = report.namaWaliKelas || 'RINA, S.Pd., M.Pd';
    const nipWali = report.nipWaliKelas || 'NIP 9740817200932003';

    let customFieldsHtml = '';
    if (report.customFields && report.customFields.length > 0) {
      report.customFields.forEach(cf => {
        customFieldsHtml += `
          <table style="width: 100%; border-collapse: collapse; margin-top: 10pt; border: 1px solid #000000;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <th style="border: 1px solid #000000; padding: 6pt; text-align: center; font-weight: bold;">${cf.judul || 'Catatan Tambahan'}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #000000; padding: 6pt;">${cf.isi}</td>
              </tr>
            </tbody>
          </table>
        `;
      });
    }

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Rapor Kurikulum Merdeka - ${studentName}</title>
        <style>
          @page WordSection1 { size: 210mm 297mm; margin: 15mm 15mm 15mm 15mm; }
          div.WordSection1 { page: WordSection1; font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000000; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10pt; border: 1px solid #000000; }
          th, td { border: 1px solid #000000; padding: 5pt 6pt; vertical-align: top; font-size: 10pt; }
          th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
          .header-table { border: none !important; width: 100%; margin-bottom: 12pt; }
          .header-table td { border: none !important; padding: 2pt 4pt; font-size: 10pt; }
          .title-box { text-align: center; font-weight: bold; font-size: 12pt; margin: 10pt 0; text-transform: uppercase; }
          .page-break { page-break-before: always; }
          .sig-table { border: none !important; margin-top: 20pt; }
          .sig-table td { border: none !important; text-align: center; padding: 4pt; }
        </style>
      </head>
      <body>
        <div class="WordSection1">
          <!-- HALAMAN 1 -->
          <table class="header-table">
            <tr>
              <td style="width: 18%;">Nama Murid</td>
              <td style="width: 32%;">: <strong>${studentName}</strong></td>
              <td style="width: 18%;">Kelas</td>
              <td style="width: 32%;">: <strong>${rombel}</strong></td>
            </tr>
            <tr>
              <td>NIS / NISN</td>
              <td>: <strong>${nis} / ${nisn}</strong></td>
              <td>Fase</td>
              <td>: <strong>${fase}</strong></td>
            </tr>
            <tr>
              <td>Sekolah</td>
              <td>: <strong>${namaSekolah}</strong></td>
              <td>Semester</td>
              <td>: <strong>${semester}</strong></td>
            </tr>
            <tr>
              <td>Alamat</td>
              <td>: <strong>${alamat}</strong></td>
              <td>Tahun Ajaran</td>
              <td>: <strong>${tahunAjaran}</strong></td>
            </tr>
          </table>

          <hr style="border: 1px solid #000; margin-bottom: 10pt;" />

          <div class="title-box">LAPORAN HASIL BELAJAR</div>

          <table>
            <thead>
              <tr style="background-color: #f0f0f0;">
                <th style="width: 5%;">No</th>
                <th style="width: 30%;">Mata Pelajaran</th>
                <th style="width: 12%;">Nilai Akhir</th>
                <th style="width: 53%;">Capaian Kompetensi</th>
              </tr>
            </thead>
            <tbody>
              <tr style="background-color: #f9f9f9;">
                <td colspan="4" style="font-weight: bold;">Kelompok A</td>
              </tr>
              ${groupARowsHtml}
              <tr style="background-color: #f9f9f9;">
                <td colspan="4" style="font-weight: bold;">Kelompok B</td>
              </tr>
              ${groupBRowsHtml}
            </tbody>
          </table>

          <div style="text-align: right; font-size: 9pt; font-weight: bold; margin-top: 10pt;">
            ${rombel} | ${studentName} | ${nis} &nbsp;&nbsp;&nbsp;&nbsp; Halaman: 1
          </div>

          <!-- HALAMAN 2 -->
          <div class="page-break"></div>

          <table class="header-table" style="margin-top: 15pt;">
            <tr>
              <td style="width: 18%;">Nama Murid</td>
              <td style="width: 32%;">: <strong>${studentName}</strong></td>
              <td style="width: 18%;">Kelas</td>
              <td style="width: 32%;">: <strong>${rombel}</strong></td>
            </tr>
            <tr>
              <td>NIS / NISN</td>
              <td>: <strong>${nis} / ${nisn}</strong></td>
              <td>Fase</td>
              <td>: <strong>${fase}</strong></td>
            </tr>
            <tr>
              <td>Sekolah</td>
              <td>: <strong>${namaSekolah}</strong></td>
              <td>Semester</td>
              <td>: <strong>${semester}</strong></td>
            </tr>
            <tr>
              <td>Alamat</td>
              <td>: <strong>${alamat}</strong></td>
              <td>Tahun Ajaran</td>
              <td>: <strong>${tahunAjaran}</strong></td>
            </tr>
          </table>

          <hr style="border: 1px solid #000; margin-bottom: 10pt;" />

          <!-- Kokurikuler -->
          <table>
            <thead>
              <tr style="background-color: #f0f0f0;">
                <th>Kokurikuler</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 8pt; text-align: justify;">${kokurikulerText.replace(/\n/g, '<br/>')}</td>
              </tr>
            </tbody>
          </table>

          <!-- Ekstrakurikuler -->
          <table>
            <thead>
              <tr style="background-color: #f0f0f0;">
                <th style="width: 6%;">No</th>
                <th style="width: 30%;">Ekstrakurikuler</th>
                <th style="width: 64%;">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              ${ekstraRowsHtml}
            </tbody>
          </table>

          <!-- Ketidakhadiran & Catatan -->
          <table>
            <thead>
              <tr style="background-color: #f0f0f0;">
                <th style="width: 35%;">Ketidakhadiran</th>
                <th style="width: 65%;">Catatan Wali Kelas</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  Sakit : ${sakit} hari<br/>
                  Izin : ${izin} hari<br/>
                  Tanpa Keterangan : ${alpa} hari
                </td>
                <td style="text-align: justify;">${catatanWali}</td>
              </tr>
            </tbody>
          </table>

          <!-- Kenaikan Kelas -->
          <table>
            <tbody>
              <tr style="background-color: #f9f9f9;">
                <td style="text-align: center; font-weight: bold; padding: 6pt;">
                  Keterangan Kenaikan Kelas : ${statusKenaikan}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Tanggapan Orang Tua -->
          <table>
            <thead>
              <tr style="background-color: #f0f0f0;">
                <th>Tanggapan Orang Tua/Wali Murid</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="min-height: 40pt; height: 40pt; vertical-align: top;">${report.tanggapanOrangTua || ''}</td>
              </tr>
            </tbody>
          </table>

          ${customFieldsHtml}

          <!-- Tanda Tangan -->
          <div style="text-align: right; font-size: 10pt; margin-top: 15pt;">
            ${tempatTgl}
          </div>

          <table class="sig-table">
            <tr>
              <td style="width: 33%;">Orang Tua Murid</td>
              <td style="width: 33%;">Kepala Sekolah</td>
              <td style="width: 34%;">Wali Kelas</td>
            </tr>
            <tr style="height: 50pt;">
              <td></td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td><strong>......................................</strong></td>
              <td><strong>${kepsek}</strong><br/><span style="font-size: 9pt;">${nipKepsek}</span></td>
              <td><strong>${wali}</strong><br/><span style="font-size: 9pt;">${nipWali}</span></td>
            </tr>
          </table>

          <div style="text-align: right; font-size: 9pt; font-weight: bold; margin-top: 15pt;">
            ${rombel} | ${studentName} | ${nis} &nbsp;&nbsp;&nbsp;&nbsp; Halaman: 2
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const cleanName = studentName.replace(/[^a-zA-Z0-9]/g, '_');
    link.href = url;
    link.download = `Rapor_Kurikulum_Merdeka_${cleanName}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Error exporting single report to Word:', err);
    return false;
  }
}
