import * as XLSX from 'xlsx';
import { Student } from '../types';
import { formatDateIndonesian } from './dateUtils';

export const DAPODIK_STUDENT_HEADERS = [
  'Nama',
  'Kelas',
  'Nis',
  'J/P',
  'Nisn',
  'Tempat Lahir',
  'Tanggal Lahir',
  'Nik',
  'Agama',
  'Alamat',
  'RT',
  'RW',
  'Dusun',
  'Kelurahan',
  'Kecamatan',
  'Kode Pos',
  'Jenis Tinggal',
  'Alat Transportasi',
  'Telepon',
  'HP',
  'E-Mail',
  'SKHUN',
  'Penerima KPS',
  'No. KPS',
  'Nama Ayah',
  'Tahun Lahir Ayah',
  'Jenjang Pendidikan Ayah',
  'Pekerjaan Ayah',
  'Penghasilan Ayah',
  'NIK ayah',
  'Nama Ibu',
  'Tahun Lahir Ibu',
  'Jenjang Pendidikan Ibu',
  'Pekerjaan Ibu',
  'Penghasilan Ibu',
  'NIK Ibu',
  'Nama Wali',
  'Tahun Lahir Wali',
  'Jenjang Pendidikan Wali',
  'Pekerjaan Wali',
  'Penghasilan Wali',
  'NIK Wali',
  'Rombel Saat Ini',
  'No Peserta Ujian Nasional',
  'No Seri Ijazah',
  'Penerima KIP',
  'Nomor KIP',
  'Nama di KIP',
  'Nomor KKS',
  'No Registrasi Akta Lahir',
  'Bank',
  'Nomor Rekening Bank',
  'Rekening Atas Nama',
  'Layak PIP (usulan dari sekolah)',
  'Alasan Layak PIP',
  'Kebutuhan Khusus',
  'Sekolah Asal',
  'Anak ke-berapa',
  'Lintang',
  'Bujur',
  'No KK',
  'Berat Badan',
  'Tinggi Badan',
  'Lingkar Kepala',
  'Jml. Saudara Kandung',
  'Jarak Rumah Ke Sekolah (KM)',
  'Tahun Lulus'
];

export const SAMPLE_STUDENT_ROW = [
  'Ahmad Fauzan Pratama',
  'Kelas 7A',
  '242507001',
  'L',
  '0098765432',
  'Palu',
  '2011-05-14',
  '7271011405110001',
  'Islam',
  'Jl. Sam Ratulangi No. 45',
  '002',
  '003',
  'Dusun I',
  'Besusu Barat',
  'Palu Timur',
  '94118',
  'Bersama orang tua',
  'Sepeda Motor',
  '0451-421000',
  '081234567890',
  'ahmad.fauzan@gmail.com',
  'SKHUN-2024-001',
  'Tidak',
  '-',
  'Rahmat Hidayat',
  '1980',
  'S1',
  'Wiraswasta',
  'Rp 3.000.000 - Rp 5.000.000',
  '7271011004800002',
  'Nurhasanah',
  '1983',
  'SMA',
  'Ibu Rumah Tangga',
  'Tidak Berpenghasilan',
  '7271015508830003',
  '-',
  '-',
  '-',
  '-',
  '-',
  '-',
  'Kelas 7A',
  '02-24-05-01-001',
  'DN-02/D-SMP/24/0001234',
  'Ya',
  'KIP-98765432',
  'Ahmad Fauzan Pratama',
  'KKS-123456',
  '4567/DISDUK/2011',
  'BRI',
  '012301098765501',
  'Ahmad Fauzan Pratama',
  'Ya',
  'Pemegang KIP',
  'Tidak ada',
  'SD Negeri 3 Palu',
  '1',
  '-0.891234',
  '119.876543',
  '7271010101080005',
  '45',
  '155',
  '52',
  '2',
  '1.5',
  ''
];

export const SAMPLE_STUDENT_ROW_2 = [
  'Siti Aisyah Rahmadani',
  'Kelas 7B',
  '242507002',
  'P',
  '0098765433',
  'Palu',
  '2011-09-22',
  '7271016209110002',
  'Islam',
  'Jl. Tadulako No. 12',
  '001',
  '001',
  'Dusun II',
  'Tondo',
  'Mantikulore',
  '94119',
  'Bersama orang tua',
  'Jalan Kaki',
  '-',
  '085298765432',
  'siti.aisyah@gmail.com',
  'SKHUN-2024-002',
  'Ya',
  'KPS-887766',
  'Bambang Sutejo',
  '1978',
  'D3',
  'PNS',
  'Rp 5.000.000 - Rp 10.000.000',
  '7271011503780004',
  'Dewi Sartika',
  '1982',
  'S1',
  'Guru',
  'Rp 3.000.000 - Rp 5.000.000',
  '7271016511820005',
  '-',
  '-',
  '-',
  '-',
  '-',
  '-',
  'Kelas 7B',
  '02-24-05-01-002',
  'DN-02/D-SMP/24/0001235',
  'Ya',
  'KIP-98765433',
  'Siti Aisyah Rahmadani',
  'KKS-123457',
  '4568/DISDUK/2011',
  'BNI',
  '098765432101',
  'Siti Aisyah Rahmadani',
  'Ya',
  'Pemegang KIP / KPS',
  'Tidak ada',
  'SD Negeri 5 Palu',
  '2',
  '-0.884521',
  '119.889123',
  '7271010101080006',
  '42',
  '150',
  '51',
  '1',
  '0.8',
  '2024/2025'
];

/**
 * Downloads Dapodik Excel (.xlsx) template with sample data
 */
export function downloadStudentExcelTemplate() {
  const wsData = [
    DAPODIK_STUDENT_HEADERS,
    SAMPLE_STUDENT_ROW,
    SAMPLE_STUDENT_ROW_2
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  const colWidths = DAPODIK_STUDENT_HEADERS.map(h => ({
    wch: Math.max(h.length + 3, 14)
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template_Data_Siswa');

  XLSX.writeFile(wb, `Template_Impor_Data_Siswa_Dapodik_2026.xlsx`);
}

/**
 * Exports real student data from database to Excel (.xlsx) file
 * Supports exporting ALL students or filtered per Rombel/Kelas
 */
export function exportStudentsToExcel(students: Student[], selectedRombel: string = 'ALL') {
  if (!students || students.length === 0) {
    alert('Tidak ada data siswa di database untuk diekspor.');
    return;
  }

  // Filter students based on selected Rombel if not ALL
  const targetStudents = selectedRombel === 'ALL'
    ? students
    : students.filter(s => {
        const r1 = (s.rombel || '').trim().toLowerCase();
        const r2 = (s.rombelSaatIni || '').trim().toLowerCase();
        const target = selectedRombel.trim().toLowerCase();
        return r1 === target || r2 === target;
      });

  if (targetStudents.length === 0) {
    alert(`Tidak ada data siswa di database untuk rombel/kelas "${selectedRombel}".`);
    return;
  }

  const rows = targetStudents.map(s => [
    s.nama || '',
    s.rombel || s.rombelSaatIni || '',
    s.nis || '',
    s.jenisKelamin || 'L',
    s.nisn || '',
    s.tempatLahir || '',
    s.tanggalLahir || '',
    s.nik || '',
    s.agama || 'Islam',
    s.alamat || '',
    s.rt || '',
    s.rw || '',
    s.dusun || '',
    s.kelurahan || '',
    s.kecamatan || '',
    s.kodePos || '',
    s.jenisTinggal || 'Bersama orang tua',
    s.alatTransportasi || 'Jalan kaki',
    s.telepon || '',
    s.hp || '',
    s.email || '',
    s.skhun || '',
    s.penerimaKps || 'Tidak',
    s.noKps || '',
    s.namaAyah || '',
    s.tahunLahirAyah || '',
    s.jenjangPendidikanAyah || '',
    s.pekerjaanAyah || '',
    s.penghasilanAyah || '',
    s.nikAyah || '',
    s.namaIbu || '',
    s.tahunLahirIbu || '',
    s.jenjangPendidikanIbu || '',
    s.pekerjaanIbu || '',
    s.penghasilanIbu || '',
    s.nikIbu || '',
    s.namaWali || '',
    s.tahunLahirWali || '',
    s.jenjangPendidikanWali || '',
    s.pekerjaanWali || '',
    s.penghasilanWali || '',
    s.nikWali || '',
    s.rombelSaatIni || s.rombel || '',
    s.noPesertaUn || '',
    s.noSeriIjazah || '',
    s.penerimaKip || 'Tidak',
    s.nomorKip || '',
    s.namaDiKip || '',
    s.nomorKks || '',
    s.noRegistrasiAktaLahir || '',
    s.bank || '',
    s.nomorRekeningBank || '',
    s.rekeningAtasNama || '',
    s.layakPip || 'Tidak',
    s.alasanLayakPip || '',
    s.kebutuhanKhusus || 'Tidak ada',
    s.sekolahAsal || '',
    s.anakKeBerapa || '1',
    s.lintang || '',
    s.bujur || '',
    s.noKk || '',
    s.beratBadan || '',
    s.tinggiBadan || '',
    s.lingkarKepala || '',
    s.jmlSaudaraKandung || '',
    s.jarakRumahKeSekolah || '',
    s.tahunLulus || ''
  ]);

  const wsData = [
    DAPODIK_STUDENT_HEADERS,
    ...rows
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  const colWidths = DAPODIK_STUDENT_HEADERS.map(h => ({
    wch: Math.max(h.length + 3, 14)
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  const sheetName = selectedRombel === 'ALL' ? 'Semua_Siswa' : selectedRombel.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const cleanRombelName = selectedRombel === 'ALL' ? 'SEMUA_ROMBEL' : selectedRombel.replace(/\s+/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Data_Siswa_${cleanRombelName}_${dateStr}.xlsx`);
}

/**
 * Downloads Dapodik CSV (.csv) template with sample data
 */
export function downloadStudentCSVTemplate() {
  const rows = [
    DAPODIK_STUDENT_HEADERS,
    SAMPLE_STUDENT_ROW,
    SAMPLE_STUDENT_ROW_2
  ];

  const csvContent = rows.map(r => 
    r.map(val => {
      const v = val !== undefined && val !== null ? String(val) : '';
      return `"${v.replace(/"/g, '""')}"`;
    }).join(',')
  ).join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Template_Impor_Data_Siswa_Dapodik_2026.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Parses file (Excel .xlsx, .xls or CSV .csv) and returns Student array
 */
export async function parseStudentImportFile(file: File): Promise<{ students: Student[]; totalParsed: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let rows: any[][] = [];

        if (file.name.endsWith('.csv') || file.type === 'text/csv') {
          const text = typeof data === 'string' ? data : new TextDecoder('utf-8').decode(data as ArrayBuffer);
          const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
          
          rows = lines.map(line => {
            // Regex to parse CSV with quoted values
            const result: string[] = [];
            let inQuotes = false;
            let currentStr = '';
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
                inQuotes = !inQuotes;
              } else if ((char === ',' || char === '\t' || char === ';') && !inQuotes) {
                result.push(currentStr.trim().replace(/^"|"$/g, ''));
                currentStr = '';
              } else {
                currentStr += char;
              }
            }
            result.push(currentStr.trim().replace(/^"|"$/g, ''));
            return result;
          });
        } else {
          // XLSX or XLS
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
        }

        if (rows.length < 2) {
          throw new Error('File tidak memiliki data atau baris kosong.');
        }

        // Detect header row (first non-empty row)
        let headerRowIndex = 0;
        while (headerRowIndex < rows.length && (!rows[headerRowIndex] || rows[headerRowIndex].length === 0)) {
          headerRowIndex++;
        }

        const headers = (rows[headerRowIndex] || []).map((h: any) => String(h || '').trim());
        const dataRows = rows.slice(headerRowIndex + 1);

        const students: Student[] = [];

        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          if (!row || row.length === 0 || row.every(val => !val || String(val).trim() === '')) {
            continue;
          }

          // Helper to get value by header name or index fallback
          const getVal = (colIndex: number, ...headerAliases: string[]): string => {
            // Try matching header aliases first
            for (const alias of headerAliases) {
              const foundIdx = headers.findIndex(h => 
                h.toLowerCase().replace(/[^a-z0-9]/g, '') === alias.toLowerCase().replace(/[^a-z0-9]/g, '')
              );
              if (foundIdx !== -1 && row[foundIdx] !== undefined && row[foundIdx] !== null) {
                const val = String(row[foundIdx]).trim();
                if (val) return val;
              }
            }
            // Fallback by expected fixed index
            if (row[colIndex] !== undefined && row[colIndex] !== null) {
              return String(row[colIndex]).trim();
            }
            return '';
          };

          const nama = getVal(0, 'Nama', 'Nama Lengkap', 'Nama Siswa');
          const nisn = getVal(4, 'Nisn', 'NISN');
          const nik = getVal(7, 'Nik', 'NIK', 'No KTP');
          const genderRaw = getVal(3, 'J/P', 'JK', 'Jenis Kelamin', 'L/P');
          const gender: 'L' | 'P' = (genderRaw.toUpperCase().startsWith('P') || genderRaw.toLowerCase().includes('perempuan')) ? 'P' : 'L';
          const kelas = getVal(1, 'Kelas', 'Rombel', 'Rombel Saat Ini') || getVal(42, 'Rombel Saat Ini') || 'Kelas 7A';
          const nis = getVal(2, 'Nis', 'NIS');
          const tempatLahir = getVal(5, 'Tempat Lahir');
          const tanggalLahir = getVal(6, 'Tanggal Lahir');
          const agama = getVal(8, 'Agama') || 'Islam';
          const alamat = getVal(9, 'Alamat');
          const rt = getVal(10, 'RT');
          const rw = getVal(11, 'RW');
          const dusun = getVal(12, 'Dusun');
          const kelurahan = getVal(13, 'Kelurahan', 'Desa');
          const kecamatan = getVal(14, 'Kecamatan');
          const kodePos = getVal(15, 'Kode Pos');
          const jenisTinggal = getVal(16, 'Jenis Tinggal');
          const alatTransportasi = getVal(17, 'Alat Transportasi');
          const telepon = getVal(18, 'Telepon');
          const hp = getVal(19, 'HP', 'No HP', 'Handphone');
          const email = getVal(20, 'E-Mail', 'Email');
          const skhun = getVal(21, 'SKHUN');
          const penerimaKps = getVal(22, 'Penerima KPS');
          const noKps = getVal(23, 'No. KPS', 'No KPS');
          const namaAyah = getVal(24, 'Nama Ayah');
          const tahunLahirAyah = getVal(25, 'Tahun Lahir Ayah', 'Tahun Lahir');
          const jenjangPendidikanAyah = getVal(26, 'Jenjang Pendidikan Ayah', 'Jenjang Pendidikan');
          const pekerjaanAyah = getVal(27, 'Pekerjaan Ayah', 'Pekerjaan');
          const penghasilanAyah = getVal(28, 'Penghasilan Ayah', 'Penghasilan');
          const nikAyah = getVal(29, 'NIK ayah', 'NIK Ayah');
          const namaIbu = getVal(30, 'Nama Ibu', 'Nama Ibu Kandung');
          const tahunLahirIbu = getVal(31, 'Tahun Lahir Ibu');
          const jenjangPendidikanIbu = getVal(32, 'Jenjang Pendidikan Ibu');
          const pekerjaanIbu = getVal(33, 'Pekerjaan Ibu');
          const penghasilanIbu = getVal(34, 'Penghasilan Ibu');
          const nikIbu = getVal(35, 'NIK Ibu');
          const namaWali = getVal(36, 'Nama Wali');
          const tahunLahirWali = getVal(37, 'Tahun Lahir Wali');
          const jenjangPendidikanWali = getVal(38, 'Jenjang Pendidikan Wali');
          const pekerjaanWali = getVal(39, 'Pekerjaan Wali');
          const penghasilanWali = getVal(40, 'Penghasilan Wali');
          const nikWali = getVal(41, 'NIK Wali');
          const rombelSaatIni = getVal(42, 'Rombel Saat Ini') || kelas;
          const noPesertaUn = getVal(43, 'No Peserta Ujian Nasional', 'No Peserta UN');
          const noSeriIjazah = getVal(44, 'No Seri Ijazah');
          const penerimaKip = getVal(45, 'Penerima KIP');
          const nomorKip = getVal(46, 'Nomor KIP');
          const namaDiKip = getVal(47, 'Nama di KIP');
          const nomorKks = getVal(48, 'Nomor KKS');
          const noRegistrasiAktaLahir = getVal(49, 'No Registrasi Akta Lahir');
          const bank = getVal(50, 'Bank');
          const nomorRekeningBank = getVal(51, 'Nomor Rekening Bank');
          const rekeningAtasNama = getVal(52, 'Rekening Atas Nama');
          const layakPip = getVal(53, 'Layak PIP (usulan dari sekolah)', 'Layak PIP');
          const alasanLayakPip = getVal(54, 'Alasan Layak PIP');
          const kebutuhanKhusus = getVal(55, 'Kebutuhan Khusus');
          const sekolahAsal = getVal(56, 'Sekolah Asal');
          const anakKeBerapa = getVal(57, 'Anak ke-berapa');
          const lintang = getVal(58, 'Lintang');
          const bujur = getVal(59, 'Bujur');
          const noKk = getVal(60, 'No KK');
          const beratBadan = getVal(61, 'Berat Badan');
          const tinggiBadan = getVal(62, 'Tinggi Badan');
          const lingkarKepala = getVal(63, 'Lingkar Kepala');
          const jmlSaudaraKandung = getVal(64, 'Jml. Saudara Kandung', 'Jml Saudara');
          const jarakRumahKeSekolah = getVal(65, 'Jarak Rumah Ke Sekolah (KM)', 'Jarak Rumah Ke Sekolah');
          const tahunLulus = getVal(66, 'Tahun Lulus', 'Tahun Kelulusan', 'Tahun Lulusan', 'Tahun Tamat');

          // Skip if missing name
          if (!nama) continue;

          students.push({
            id: `std-imp-${Date.now()}-${i + 1}`,
            nama,
            nisn: nisn || `00${Math.floor(10000000 + Math.random() * 90000000)}`,
            nik: nik || `7271${Math.floor(100000000000 + Math.random() * 900000000000)}`,
            jenisKelamin: gender,
            rombel: rombelSaatIni || kelas || 'Kelas 7A',
            tempatLahir: tempatLahir || 'Palu',
            tanggalLahir: formatDateIndonesian(tanggalLahir) || '01 Januari 2011',
            namaIbu: namaIbu || '-',
            alamat: alamat || 'Jl. Pendidikan',
            status: tahunLulus ? 'Lulus' : 'Aktif',
            agama: agama || 'Islam',
            nis,
            rt,
            rw,
            dusun,
            kelurahan,
            kecamatan,
            kodePos,
            jenisTinggal,
            alatTransportasi,
            telepon,
            hp,
            email,
            skhun,
            penerimaKps,
            noKps,
            namaAyah,
            tahunLahirAyah,
            jenjangPendidikanAyah,
            pekerjaanAyah,
            penghasilanAyah,
            nikAyah,
            tahunLahirIbu,
            jenjangPendidikanIbu,
            pekerjaanIbu,
            penghasilanIbu,
            nikIbu,
            namaWali,
            tahunLahirWali,
            jenjangPendidikanWali,
            pekerjaanWali,
            penghasilanWali,
            nikWali,
            rombelSaatIni,
            noPesertaUn,
            noSeriIjazah,
            penerimaKip,
            nomorKip,
            namaDiKip,
            nomorKks,
            noRegistrasiAktaLahir,
            bank,
            nomorRekeningBank,
            rekeningAtasNama,
            layakPip,
            alasanLayakPip,
            kebutuhanKhusus,
            sekolahAsal,
            anakKeBerapa,
            lintang,
            bujur,
            noKk,
            beratBadan,
            tinggiBadan,
            lingkarKepala,
            jmlSaudaraKandung,
            jarakRumahKeSekolah,
            tahunLulus: tahunLulus || undefined
          });
        }

        resolve({ students, totalParsed: students.length });
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca file'));
    };

    if (file.name.endsWith('.csv') || file.type === 'text/csv') {
      reader.readAsText(file, 'UTF-8');
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
}
