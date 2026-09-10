import * as XLSX from 'xlsx';
import { TeacherStaff } from '../types';
import { formatDateIndonesian, cleanLeadingZerosCode } from './dateUtils';

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
 * Exports all PTK data to clean Excel (.xlsx) file matching the exact 51-column Dapodik template format
 */
export function exportPtkExcelData(teachers: TeacherStaff[], fileName = 'DAPODIK_DATA_PTK_LENGKAP_2026') {
  const rows = teachers.map(t => [
    t.nama || '',
    t.nuptk || '',
    t.jenisKelamin || '',
    t.tempatLahir || '',
    t.tanggalLahir || '',
    t.nip || '',
    t.statusKepegawaian || '',
    t.jenisPtk || '',
    t.agama || '',
    t.alamatJalan || '',
    t.rt || '',
    t.rw || '',
    t.namaDusun || '',
    t.desaKelurahan || '',
    t.kecamatan || '',
    t.kodePos || '',
    t.telepon || '',
    t.noHp || '',
    t.email || '',
    t.tugasTambahan || '',
    t.skCpns || '',
    t.tanggalCpns || '',
    t.skPengangkatan || '',
    t.tmtPengangkatan || '',
    t.lembagaPengangkatan || '',
    t.pangkatGolongan || '',
    t.sumberGaji || '',
    t.namaIbuKandung || '',
    t.statusPerkawinan || '',
    t.namaSuamiIstri || '',
    t.nipSuamiIstri || '',
    t.pekerjaanSuamiIstri || '',
    t.tmtPns || '',
    t.sudahLisensiKepalaSekolah || '',
    t.pernahDiklatKepengawasan || '',
    t.keahlianBraille || '',
    t.keahlianBahasaIsyarat || '',
    t.npwp || '',
    t.namaWajibPajak || '',
    t.kewarganegaraan || '',
    t.bank || '',
    t.nomorRekeningBank || '',
    t.rekeningAtasNama || '',
    t.nik || '',
    t.noKk || '',
    t.karpeg || '',
    t.karisKarsu || '',
    t.lintang || '',
    t.bujur || '',
    t.nuks || '',
    t.statusSertifikasi || t.sertifikasi || ''
  ]);

  const wsData = [DAPODIK_PTK_HEADERS, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths dynamically
  const colWidths = DAPODIK_PTK_HEADERS.map((h, i) => {
    let maxLen = h.length;
    rows.forEach(r => {
      const valStr = String(r[i] || '');
      if (valStr.length > maxLen) maxLen = valStr.length;
    });
    return { wch: Math.min(Math.max(maxLen + 3, 12), 40) };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data_PTK_Dapodik');

  XLSX.writeFile(wb, `${fileName}.xlsx`);
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
        const workbook = XLSX.read(data, { type: 'array', cellDates: true, cellText: true, raw: false });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });

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

        const getColVal = (row: any[], headerName: string, aliases: string[] = []): any => {
          const searchNames = [headerName, ...aliases].map(s => s.toLowerCase().replace(/[^a-z0-9]/g, ''));
          const idx = headers.findIndex(h => {
            const cleanH = h.toLowerCase().replace(/[^a-z0-9]/g, '');
            return searchNames.includes(cleanH);
          });
          if (idx !== -1 && row[idx] !== undefined && row[idx] !== null) {
            const raw = row[idx];
            if (raw instanceof Date) return raw;
            return cleanLeadingZerosCode(raw, headerName);
          }
          return '';
        };

        const parsedTeachers: TeacherStaff[] = [];

        for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          const nama = getColVal(row, 'Nama', ['Nama Lengkap', 'Nama PTK', 'Nama Guru']);
          const nuptk = getColVal(row, 'Nuptk', ['NUPTK', 'Nomor NUPTK', 'No NUPTK']);

          if (!nama && !nuptk) continue; // skip empty rows

          const jkRaw = String(getColVal(row, 'L/P', ['Jenis Kelamin', 'JK', 'Gender'])).toUpperCase();
          const jenisKelamin: 'L' | 'P' = jkRaw.startsWith('P') ? 'P' : 'L';

          // Status Kepegawaian normalization
          const rawStatusKep = String(getColVal(row, 'Status Kepegawaian', ['Status Pegawai', 'Status Kepegawaian Saat Ini', 'Status PTK', 'Status Kep']) || '').trim();
          let statusKep = 'PNS';
          const lowerStatus = rawStatusKep.toLowerCase();
          if (lowerStatus.includes('paruh waktu') || lowerStatus.includes('paruh-waktu') || lowerStatus.includes('part time')) {
            statusKep = 'PPPK Paruh Waktu';
          } else if (lowerStatus.includes('pppk') || lowerStatus.includes('p3k')) {
            statusKep = 'PPPK';
          } else if (lowerStatus.includes('pns') || lowerStatus.includes('cpns') || lowerStatus === 'asn') {
            statusKep = 'PNS';
          } else if (lowerStatus.includes('gty')) {
            statusKep = 'GTY';
          } else if (lowerStatus.includes('gtt')) {
            statusKep = 'GTT';
          } else if (lowerStatus.includes('tenaga honor')) {
            statusKep = 'Tenaga Honor Sekolah';
          } else if (lowerStatus.includes('guru honor') || lowerStatus.includes('honor')) {
            statusKep = 'Guru Honor Sekolah';
          } else if (rawStatusKep) {
            statusKep = rawStatusKep;
          }

          // Jenis PTK normalization
          const rawJenisPtk = String(getColVal(row, 'Jenis Ptk', ['Jenis PTK', 'Jenis PTK Saat Ini', 'Tugas PTK', 'Tugas', 'Jabatan', 'Jenis Ketenagaan', 'Jenis Pegawai']) || '').trim();
          const rawMapel = getColVal(row, 'Mata Pelajaran', ['Mapel', 'Mata Pelajaran Diajarkan', 'Bidang Tugas']) || '';
          const rawTugasTambahan = getColVal(row, 'Tugas Tambahan', ['Tugas Tambahan PTK', 'Tugas Tambahan Sekolah']) || '';

          let jenisPtk = rawJenisPtk;
          if (!jenisPtk) {
            const combinedNonTeaching = `${rawMapel} ${rawTugasTambahan} ${rawStatusKep}`.toLowerCase();
            if (combinedNonTeaching.includes('tata usaha') || combinedNonTeaching.includes('administrasi') || combinedNonTeaching.includes('tu') || combinedNonTeaching.includes('tas')) {
              jenisPtk = 'Tenaga Administrasi';
            } else if (combinedNonTeaching.includes('laboran') || combinedNonTeaching.includes('laboratorium')) {
              jenisPtk = 'Laboran';
            } else if (combinedNonTeaching.includes('pustakawan') || combinedNonTeaching.includes('perpustakaan')) {
              jenisPtk = 'Pustakawan';
            } else if (combinedNonTeaching.includes('operator') || combinedNonTeaching.includes('ops')) {
              jenisPtk = 'Tenaga Kependidikan';
            } else if (combinedNonTeaching.includes('penjaga') || combinedNonTeaching.includes('satpam') || combinedNonTeaching.includes('security') || combinedNonTeaching.includes('kebersihan')) {
              jenisPtk = 'Tenaga Kependidikan';
            } else if (combinedNonTeaching.includes('kepala sekolah')) {
              jenisPtk = 'Kepala Sekolah';
            } else {
              jenisPtk = 'Guru Mapel';
            }
          }

          const sertifikasiRaw = String(getColVal(row, 'Sertifikasi', ['Status Sertifikasi', 'Sudah Sertifikasi']) || 'Sudah');
          const statusSertifikasi = (sertifikasiRaw.toLowerCase().includes('sudah') || sertifikasiRaw.toLowerCase().includes('ya') || sertifikasiRaw.toLowerCase().includes('lulus')) ? 'Sudah' : 'Belum';

          const teacher: TeacherStaff = {
            id: `ptk-imp-${Date.now()}-${r}`,
            nama: nama || 'Tanpa Nama',
            nuptk: nuptk || Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString(),
            jenisKelamin,
            nip: getColVal(row, 'Nip', ['NIP', 'Nomor Induk Pegawai']) || '-',
            statusKepegawaian: statusKep,
            jenisPtk: jenisPtk,
            mapel: rawMapel || rawTugasTambahan || (jenisPtk.toLowerCase().includes('administrasi') ? 'Tenaga Administrasi (TU)' : 'Guru Mata Pelajaran'),
            pendidikanTerakhir: getColVal(row, 'Pendidikan Terakhir', ['Pendidikan', 'Pangkat Golongan', 'Kualifikasi']) || 'S1 Pendidikan',
            noHp: getColVal(row, 'HP', ['No HP', 'Nomor HP', 'Handphone', 'Telepon']) || '-',
            email: getColVal(row, 'Email', ['E-mail', 'Surel']) || '-',
            statusSertifikasi,

            // All 51 Columns Dapodik PTK
            tempatLahir: getColVal(row, 'Tempat Lahir'),
            tanggalLahir: formatDateIndonesian(getColVal(row, 'Tanggal Lahir')),
            agama: getColVal(row, 'Agama'),
            alamatJalan: getColVal(row, 'Alamat Jalan', ['Alamat', 'Jalan']),
            rt: getColVal(row, 'RT'),
            rw: getColVal(row, 'RW'),
            namaDusun: getColVal(row, 'Nama Dusun', ['Dusun']),
            desaKelurahan: getColVal(row, 'Desa/Kelurahan', ['Desa', 'Kelurahan']),
            kecamatan: getColVal(row, 'Kecamatan'),
            kodePos: getColVal(row, 'Kode Pos'),
            telepon: getColVal(row, 'Telepon'),
            tugasTambahan: rawTugasTambahan,
            skCpns: getColVal(row, 'SK CPNS', ['SK CPNS/PPPK']),
            tanggalCpns: formatDateIndonesian(getColVal(row, 'Tanggal CPNS')),
            skPengangkatan: getColVal(row, 'SK Pengangkatan'),
            tmtPengangkatan: formatDateIndonesian(getColVal(row, 'TMT Pengangkatan')),
            lembagaPengangkatan: getColVal(row, 'Lembaga Pengangkatan'),
            pangkatGolongan: getColVal(row, 'Pangkat Golongan', ['Golongan', 'Pangkat']),
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
            nomorRekeningBank: getColVal(row, 'Nomor Rekening Bank', ['No Rekening']),
            rekeningAtasNama: getColVal(row, 'Rekening Atas Nama'),
            nik: getColVal(row, 'NIK', ['No KTP', 'Nomor Induk Kependudukan']),
            noKk: getColVal(row, 'No KK', ['Nomor KK', 'Kartu Keluarga']),
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
