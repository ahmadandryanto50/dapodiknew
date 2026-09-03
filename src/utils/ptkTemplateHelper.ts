import * as XLSX from 'xlsx';
import { TeacherStaff } from '../types';
import { formatDateIndonesian } from './dateUtils';

export const DAPODIK_PTK_HEADERS = [
  'Nama',
  'Nuptk',
  'L/P',
  'Tempat Lahir',
  'Tanggal Lahir',
  'Nip',
  'Status Kepegawaian',
  'Jenis Ptk',
  'Agama',
  'Alamat Jalan',
  'RT',
  'RW',
  'Nama Dusun',
  'Desa/Kelurahan',
  'Kecamatan',
  'Kode Pos',
  'Telepon',
  'HP',
  'Email',
  'Tugas Tambahan',
  'SK CPNS',
  'Tanggal CPNS',
  'SK Pengangkatan',
  'TMT Pengangkatan',
  'Lembaga Pengangkatan',
  'Pangkat Golongan',
  'Sumber Gaji',
  'Nama Ibu Kandung',
  'Status Perkawinan',
  'Nama Suami/Istri',
  'NIP Suami/Istri',
  'Pekerjaan Suami/Istri',
  'TMT PNS',
  'Sudah Lisensi Kepala Sekolah',
  'Pernah Diklat Kepengawasan',
  'Keahlian Braille',
  'Keahlian Bahasa Isyarat',
  'NPWP',
  'Nama Wajib Pajak',
  'Kewarganegaraan',
  'Bank',
  'Nomor Rekening Bank',
  'Rekening Atas Nama',
  'NIK',
  'No KK',
  'Karpeg',
  'Karis/Karsu',
  'Lintang',
  'Bujur',
  'NUKS',
  'Sertifikasi'
];

export const SAMPLE_PTK_ROW_1 = [
  'Drs. Bambang Sudarsono, M.Pd.',
  '1234567890123456',
  'L',
  'Jakarta',
  '1975-08-12',
  '197508122003121002',
  'PNS',
  'Kepala Sekolah',
  'Islam',
  'Jl. Pendidikan No. 45',
  '002',
  '005',
  'Dusun Krajan',
  'Menteng',
  'Menteng',
  '10310',
  '021-3193000',
  '081234567890',
  'bambang.sudarsono@smp.belajar.id',
  'Kepala Sekolah',
  '813/CPNS/2003',
  '2003-12-01',
  '821/SK-PNS/2005',
  '2005-01-01',
  'Bupati/Wali Kota',
  'Pembina Tk. I / IV-b',
  'APBD Kabupaten/Kota',
  'Siti Aminah',
  'Kawin',
  'Hj. Ratna Juwita, S.E.',
  '-',
  'PNS / Guru',
  '2005-01-01',
  'Sudah',
  'Ya',
  'Tidak',
  'Tidak',
  '12.345.678.9-012.000',
  'Bambang Sudarsono',
  'Indonesia (WNI)',
  'Bank DKI',
  '1012345678',
  'Bambang Sudarsono',
  '3171011208750001',
  '3171010101080001',
  'F123456',
  'G987654',
  '-6.182345',
  '106.834567',
  '197508122003121002',
  'Sudah'
];

export const SAMPLE_PTK_ROW_2 = [
  'Siti Rahmawati, S.Pd., M.M.',
  '9876543210987654',
  'P',
  'Bandung',
  '1985-03-15',
  '198503152010012015',
  'PNS',
  'Guru Mapel',
  'Islam',
  'Jl. Pemuda No. 12',
  '001',
  '003',
  'Dusun Suka Maju',
  'Cikini',
  'Menteng',
  '10320',
  '-',
  '081298765432',
  'siti.rahmawati@smp.belajar.id',
  'Bendahara BOS',
  '813/CPNS/2010',
  '2010-01-01',
  '821/SK-PNS/2011',
  '2011-03-01',
  'Gubernur / Dinas Pendidikan',
  'Penata / III-c',
  'APBN / APBD',
  'Dewi Sartika',
  'Kawin',
  'Ir. Agus Setiawan',
  '-',
  'Wiraswasta',
  '2011-03-01',
  'Belum',
  'Tidak',
  'Tidak',
  'Tidak',
  '98.765.432.1-012.000',
  'Siti Rahmawati',
  'Indonesia (WNI)',
  'BRI',
  '012301098765502',
  'Siti Rahmawati',
  '3171015503850002',
  '3171010101080002',
  'F654321',
  'G123456',
  '-6.189012',
  '106.839012',
  '-',
  'Sudah'
];

/**
 * Downloads Dapodik PTK Excel (.xlsx) template with sample data (51 Columns)
 */
export function downloadPtkExcelTemplate() {
  const wsData = [
    DAPODIK_PTK_HEADERS,
    SAMPLE_PTK_ROW_1,
    SAMPLE_PTK_ROW_2
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths dynamically
  const colWidths = DAPODIK_PTK_HEADERS.map(h => ({
    wch: Math.max(h.length + 3, 14)
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template_Data_PTK');

  XLSX.writeFile(wb, `Template_Impor_Data_PTK_Dapodik_2026.xlsx`);
}

/**
 * Downloads Dapodik PTK CSV (.csv) template with sample data (51 Columns)
 */
export function downloadPtkCSVTemplate() {
  const rows = [
    DAPODIK_PTK_HEADERS,
    SAMPLE_PTK_ROW_1,
    SAMPLE_PTK_ROW_2
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
  link.setAttribute('download', `Template_Impor_Data_PTK_Dapodik_2026.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Parses file (Excel .xlsx, .xls or CSV .csv) and returns TeacherStaff array with all 51 fields mapped
 */
export async function parsePtkImportFile(file: File): Promise<{ teachers: TeacherStaff[]; totalParsed: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (rawRows.length < 2) {
          resolve({ teachers: [], totalParsed: 0 });
          return;
        }

        // Find header row (match "Nama" or "Nuptk")
        let headerRowIdx = 0;
        for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
          const rowStr = (rawRows[i] || []).map((c: any) => String(c).toLowerCase()).join(' ');
          if (rowStr.includes('nama') && (rowStr.includes('nuptk') || rowStr.includes('nip') || rowStr.includes('ptk'))) {
            headerRowIdx = i;
            break;
          }
        }

        const headers: string[] = (rawRows[headerRowIdx] || []).map((h: any) => String(h).trim());

        const getColVal = (row: any[], headerName: string): string => {
          const idx = headers.findIndex(h => h.toLowerCase() === headerName.toLowerCase());
          if (idx !== -1 && row[idx] !== undefined && row[idx] !== null) {
            return String(row[idx]).trim();
          }
          return '';
        };

        const parsedTeachers: TeacherStaff[] = [];

        for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          const nama = getColVal(row, 'Nama');
          const nuptk = getColVal(row, 'Nuptk');

          if (!nama && !nuptk) continue; // skip empty rows

          const jkRaw = getColVal(row, 'L/P').toUpperCase();
          const jenisKelamin: 'L' | 'P' = jkRaw.startsWith('P') ? 'P' : 'L';

          const statusKep = getColVal(row, 'Status Kepegawaian') || 'PNS';
          const jenisPtk = getColVal(row, 'Jenis Ptk') || 'Guru Mapel';
          const sertifikasiRaw = getColVal(row, 'Sertifikasi') || 'Sudah';
          const statusSertifikasi = (sertifikasiRaw.toLowerCase().includes('sudah') || sertifikasiRaw.toLowerCase().includes('ya')) ? 'Sudah' : 'Belum';

          const teacher: TeacherStaff = {
            id: `ptk-imp-${Date.now()}-${r}`,
            nama: nama || 'Tanpa Nama',
            nuptk: nuptk || Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString(),
            jenisKelamin,
            nip: getColVal(row, 'Nip') || '-',
            statusKepegawaian: statusKep,
            jenisPtk: jenisPtk,
            mapel: getColVal(row, 'Tugas Tambahan') || getColVal(row, 'Mata Pelajaran') || 'Guru Kelas',
            pendidikanTerakhir: getColVal(row, 'Pangkat Golongan') || 'S1 Pendidikan',
            noHp: getColVal(row, 'HP') || getColVal(row, 'Telepon') || '-',
            email: getColVal(row, 'Email') || '-',
            statusSertifikasi,

            // All 51 Columns Dapodik PTK
            tempatLahir: getColVal(row, 'Tempat Lahir'),
            tanggalLahir: formatDateIndonesian(getColVal(row, 'Tanggal Lahir')),
            agama: getColVal(row, 'Agama'),
            alamatJalan: getColVal(row, 'Alamat Jalan'),
            rt: getColVal(row, 'RT'),
            rw: getColVal(row, 'RW'),
            namaDusun: getColVal(row, 'Nama Dusun'),
            desaKelurahan: getColVal(row, 'Desa/Kelurahan'),
            kecamatan: getColVal(row, 'Kecamatan'),
            kodePos: getColVal(row, 'Kode Pos'),
            telepon: getColVal(row, 'Telepon'),
            tugasTambahan: getColVal(row, 'Tugas Tambahan'),
            skCpns: getColVal(row, 'SK CPNS'),
            tanggalCpns: formatDateIndonesian(getColVal(row, 'Tanggal CPNS')),
            skPengangkatan: getColVal(row, 'SK Pengangkatan'),
            tmtPengangkatan: formatDateIndonesian(getColVal(row, 'TMT Pengangkatan')),
            lembagaPengangkatan: getColVal(row, 'Lembaga Pengangkatan'),
            pangkatGolongan: getColVal(row, 'Pangkat Golongan'),
            sumberGaji: getColVal(row, 'Sumber Gaji'),
            namaIbuKandung: getColVal(row, 'Nama Ibu Kandung'),
            statusPerkawinan: getColVal(row, 'Status Perkawinan'),
            namaSuamiIstri: getColVal(row, 'Nama Suami/Istri'),
            nipSuamiIstri: getColVal(row, 'NIP Suami/Istri'),
            pekerjaanSuamiIstri: getColVal(row, 'Pekerjaan Suami/Istri'),
            tmtPns: formatDateIndonesian(getColVal(row, 'TMT PNS')),
            sudahLisensiKepalaSekolah: getColVal(row, 'Sudah Lisensi Kepala Sekolah'),
            pernahDiklatKepengawasan: getColVal(row, 'Pernah Diklat Kepengawasan'),
            keahlianBraille: getColVal(row, 'Keahlian Braille'),
            keahlianBahasaIsyarat: getColVal(row, 'Keahlian Bahasa Isyarat'),
            npwp: getColVal(row, 'NPWP'),
            namaWajibPajak: getColVal(row, 'Nama Wajib Pajak'),
            kewarganegaraan: getColVal(row, 'Kewarganegaraan'),
            bank: getColVal(row, 'Bank'),
            nomorRekeningBank: getColVal(row, 'Nomor Rekening Bank'),
            rekeningAtasNama: getColVal(row, 'Rekening Atas Nama'),
            nik: getColVal(row, 'NIK'),
            noKk: getColVal(row, 'No KK'),
            karpeg: getColVal(row, 'Karpeg'),
            karisKarsu: getColVal(row, 'Karis/Karsu'),
            lintang: getColVal(row, 'Lintang'),
            bujur: getColVal(row, 'Bujur'),
            nuks: getColVal(row, 'NUKS'),
            sertifikasi: getColVal(row, 'Sertifikasi')
          };

          parsedTeachers.push(teacher);
        }

        resolve({ teachers: parsedTeachers, totalParsed: parsedTeachers.length });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
