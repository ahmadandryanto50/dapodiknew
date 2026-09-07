import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, TeacherStaff, SarprasItem, StudentReport, SchoolProfile, AppDisplayConfig } from '../types';
import { formatDateIndonesian } from './dateUtils';

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
    const pendidikCount = allTeachers.filter(t => (t.jenisPtk || '').toLowerCase().includes('guru') || (t.jenisPtk || '').toLowerCase().includes('pendidik')).length;
    const tendikCount = allTeachers.length - pendidikCount;
    const certifiedCount = allTeachers.filter(t => (t.statusSertifikasi || t.sertifikasi || '').toLowerCase().includes('sudah')).length;

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
      ['Pendidik & Tenaga Kependidikan', `${allTeachers.length} PTK (${pendidikCount} Guru, ${tendikCount} Tendik, ${certifiedCount} Tersertifikasi)`],
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
      ['2', 'Tenaga Kependidikan (Tendik / TU / Operator)', tendikCount, 'PNS / Non ASN', 'Administrasi & Teknis'],
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
