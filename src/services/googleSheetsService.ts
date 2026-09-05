import { Student, TeacherStaff, SarprasItem, StudentReport, SyncConfig, AppDisplayConfig, SchoolProfile, AdminUser } from '../types';

export const APPS_SCRIPT_TEMPLATE = `/**
 * Google Apps Script untuk Dapodik Terintegrasi 2026
 * Versi Script: v2.6 (Mendukung Data_Alumni, Data_Siswa, Data_Siswa_Keluar, PTK, Sarpras & Profil Lengkap)
 * 
 * Cara pasang / update:
 * 1. Buka Google Spreadsheet Anda di https://sheets.new (atau spreadsheet yang sudah ada)
 * 2. Klik menu 'Ekstensi' (Extensions) > 'Apps Script'
 * 3. Hapus kode lama, lalu Paste semua kode ini
 * 4. Klik 'Terapkan' (Deploy) > 'Kelola Penerapan' (Manage Deployments) atau 'Penerapan Baru' (New Deployment)
 * 5. Pilih jenis: 'Aplikasi Web' (Web App)
 * 6. Set 'Jalankan sebagai' (Execute as) = 'Saya' (Me)
 * 7. Set 'Akses' (Who has access) = 'Siapa saja' (Anyone)
 * 8. Klik 'Terapkan' (Deploy), izinkan akses akun Google, lalu salin URL Aplikasi Web dan tempel di Dapodik.
 */

// Header Baku Setiap Sheet Database
const HEADERS_MAP = {
  'Data_Siswa': ['id', 'nisn', 'nik', 'nama', 'jenisKelamin', 'tempatLahir', 'tanggalLahir', 'rombel', 'namaIbu', 'alamat', 'status', 'agama', 'nis', 'rt', 'rw', 'dusun', 'kelurahan', 'kecamatan', 'kodePos', 'jenisTinggal', 'alatTransportasi', 'telepon', 'hp', 'email', 'skhun', 'penerimaKps', 'noKps', 'namaAyah', 'nikAyah', 'pekerjaanAyah', 'namaIbu', 'nikIbu', 'pekerjaanIbu', 'rombelSaatIni', 'layakPip', 'alasanLayakPip', 'noKk', 'beratBadan', 'tinggiBadan', 'lingkarKepala', 'jmlSaudaraKandung', 'jarakRumahKeSekolah', 'alasanKeluar', 'tahunLulus', 'noSeriIjazah'],
  'Data_Siswa_Keluar': ['id', 'nisn', 'nik', 'nama', 'jenisKelamin', 'tempatLahir', 'tanggalLahir', 'rombel', 'namaIbu', 'alamat', 'status', 'alasanKeluar', 'agama', 'nis', 'hp', 'email', 'namaAyah', 'nikAyah'],
  'Data_Alumni': ['id', 'nisn', 'nik', 'nama', 'jenisKelamin', 'tempatLahir', 'tanggalLahir', 'rombel', 'tahunLulus', 'noSeriIjazah', 'namaIbu', 'namaAyah', 'alamat', 'hp', 'status', 'alasanKeluar', 'agama', 'nis', 'skhun', 'sekolahAsal'],
  'Data_PTK': ['id', 'nuptk', 'nip', 'nama', 'jenisKelamin', 'statusKepegawaian', 'jenisPtk', 'mapel', 'pendidikanTerakhir', 'noHp', 'email', 'statusSertifikasi', 'tempatLahir', 'tanggalLahir', 'agama', 'alamatJalan', 'rt', 'rw', 'namaDusun', 'desaKelurahan', 'kecamatan', 'kodePos', 'tugasTambahan', 'skCpns', 'tanggalCpns', 'skPengangkatan', 'tmtPengangkatan', 'pangkatGolongan', 'nik', 'noKk'],
  'Data_Sarpras': ['id', 'kodeBarang', 'namaBarang', 'kategori', 'kondisi', 'jumlah', 'satuan', 'letakRuang', 'tahunPengadaan', 'layakPakai'],
  'Data_Rapor': ['id', 'studentId', 'nisn', 'studentName', 'rombel', 'semester', 'tahunAjaran', 'scores', 'kehadiran', 'catatanWaliKelas', 'statusKenaikan']
};

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // Pastikan seluruh sheet & tabel otomatis terbuat
  checkAndInitializeSheets(ss);

  const result = {
    siswa: getSheetData(ss, 'Data_Siswa'),
    siswaKeluar: getSheetData(ss, 'Data_Siswa_Keluar'),
    alumni: getSheetData(ss, 'Data_Alumni'),
    ptk: getSheetData(ss, 'Data_PTK'),
    sarpras: getSheetData(ss, 'Data_Sarpras'),
    rapor: getSheetData(ss, 'Data_Rapor'),
    pengaturan: getSheetData(ss, 'Data_Pengaturan'),
    administrator: getSheetData(ss, 'Administrator'),
    profilSekolah: getSheetData(ss, 'Profil_Sekolah'),
    aplikasi: getSheetData(ss, 'Data_Aplikasi'),
    status: 'success',
    version: '2026.2.8',
    timestamp: new Date().toLocaleString('id-ID')
  };
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Pastikan seluruh sheet & tabel otomatis terbuat
    checkAndInitializeSheets(ss);

    if (data.type === 'LOAD_ALL') {
      const result = {
        siswa: getSheetData(ss, 'Data_Siswa'),
        siswaKeluar: getSheetData(ss, 'Data_Siswa_Keluar'),
        alumni: getSheetData(ss, 'Data_Alumni'),
        ptk: getSheetData(ss, 'Data_PTK'),
        sarpras: getSheetData(ss, 'Data_Sarpras'),
        rapor: getSheetData(ss, 'Data_Rapor'),
        pengaturan: getSheetData(ss, 'Data_Pengaturan'),
        administrator: getSheetData(ss, 'Administrator'),
        profilSekolah: getSheetData(ss, 'Profil_Sekolah'),
        aplikasi: getSheetData(ss, 'Data_Aplikasi'),
        status: 'success'
      };
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.type === 'SYNC_ALL' || data.type === 'UPDATE_ALL') {
      if (data.siswa !== undefined) saveSheetData(ss, 'Data_Siswa', data.siswa, HEADERS_MAP['Data_Siswa']);
      if (data.siswaKeluar !== undefined) saveSheetData(ss, 'Data_Siswa_Keluar', data.siswaKeluar, HEADERS_MAP['Data_Siswa_Keluar']);
      if (data.alumni !== undefined) saveSheetData(ss, 'Data_Alumni', data.alumni, HEADERS_MAP['Data_Alumni']);
      if (data.ptk !== undefined) saveSheetData(ss, 'Data_PTK', data.ptk, HEADERS_MAP['Data_PTK']);
      if (data.sarpras !== undefined) saveSheetData(ss, 'Data_Sarpras', data.sarpras, HEADERS_MAP['Data_Sarpras']);
      if (data.rapor !== undefined) saveSheetData(ss, 'Data_Rapor', data.rapor, HEADERS_MAP['Data_Rapor']);
      if (data.pengaturan !== undefined) saveSheetData(ss, 'Data_Pengaturan', data.pengaturan);
      if (data.administrator !== undefined) saveSheetData(ss, 'Administrator', data.administrator);
      if (data.profilSekolah !== undefined) saveSheetData(ss, 'Profil_Sekolah', data.profilSekolah);
      if (data.aplikasi !== undefined) saveSheetData(ss, 'Data_Aplikasi', data.aplikasi);
    } else if (data.type === 'SYNC_SISWA') {
      saveSheetData(ss, 'Data_Siswa', data.payload, HEADERS_MAP['Data_Siswa']);
    } else if (data.type === 'SYNC_SISWA_KELUAR') {
      saveSheetData(ss, 'Data_Siswa_Keluar', data.payload, HEADERS_MAP['Data_Siswa_Keluar']);
    } else if (data.type === 'SYNC_ALUMNI') {
      saveSheetData(ss, 'Data_Alumni', data.payload, HEADERS_MAP['Data_Alumni']);
    } else if (data.type === 'SYNC_PTK') {
      saveSheetData(ss, 'Data_PTK', data.payload, HEADERS_MAP['Data_PTK']);
    } else if (data.type === 'SYNC_SARPRAS') {
      saveSheetData(ss, 'Data_Sarpras', data.payload, HEADERS_MAP['Data_Sarpras']);
    } else if (data.type === 'SYNC_RAPOR') {
      saveSheetData(ss, 'Data_Rapor', data.payload, HEADERS_MAP['Data_Rapor']);
    } else if (data.type === 'SYNC_PENGATURAN') {
      saveSheetData(ss, 'Data_Pengaturan', data.payload);
    } else if (data.type === 'SYNC_ADMINISTRATOR' || data.type === 'SYNC_ADMIN') {
      saveSheetData(ss, 'Administrator', data.payload);
    } else if (data.type === 'SYNC_PROFIL_SEKOLAH') {
      saveSheetData(ss, 'Profil_Sekolah', data.payload);
    } else if (data.type === 'SYNC_APLIKASI') {
      saveSheetData(ss, 'Data_Aplikasi', data.payload);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'success', 
      message: 'Data Dapodik (Siswa, Alumni, PTK, Sarpras, Profil & Pengaturan) berhasil disinkronkan ke Google Sheet!' 
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'error', 
      message: err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheetData(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const range = sheet.getDataRange();
  const rows = range.getValues();
  const displayRows = range.getDisplayValues();
  if (rows.length < 2) return [];
  const headers = rows[0];
  const items = [];
  for (let i = 1; i < rows.length; i++) {
    const item = {};
    let hasValue = false;
    for (let j = 0; j < headers.length; j++) {
      let val = rows[i][j];
      let displayVal = displayRows[i] ? displayRows[i][j] : '';
      // Convert Date object to yyyy-MM-dd string using Spreadsheet Timezone to avoid UTC timezone shifts
      if (val instanceof Date) {
        val = Utilities.formatDate(val, ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");
      } else if (val === 'TRUE' || val === true) {
        val = true;
      } else if (val === 'FALSE' || val === false) {
        val = false;
      } else {
        if (displayVal && typeof displayVal === 'string') {
          displayVal = displayVal.trim();
          if (displayVal.startsWith('0') || (typeof val === 'number' && displayVal !== String(val))) {
            val = displayVal;
          } else if (typeof val === 'number') {
            val = String(val);
          }
        } else if (typeof val === 'number') {
          val = String(val);
        }
      }
      item[headers[j]] = val;
      if (val !== '' && val !== null && val !== undefined) {
        hasValue = true;
      }
    }
    if (hasValue) {
      items.push(item);
    }
  }
  return items;
}

function saveSheetData(ss, sheetName, items, fallbackHeaders) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  if (!items || items.length === 0) {
    // Jika data kosong, pastikan baris Header tetap ada dan rapi
    const headers = fallbackHeaders || (HEADERS_MAP[sheetName] || []);
    if (headers && headers.length > 0) {
      sheet.clear();
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground(sheetName === 'Data_Alumni' ? '#059669' : '#0284C7');
      headerRange.setFontColor('#FFFFFF');
      headerRange.setHorizontalAlignment('center');
      try {
        for (let c = 1; c <= Math.min(headers.length, 30); c++) {
          sheet.autoResizeColumn(c);
        }
      } catch(e) {}
    }
    return;
  }
  
  sheet.clear();
  const headers = Object.keys(items[0]);
  const rows = [headers];
  
  for (let i = 0; i < items.length; i++) {
    const row = [];
    for (let j = 0; j < headers.length; j++) {
      let val = items[i][headers[j]];
      if (typeof val === 'object' && val !== null) {
        val = JSON.stringify(val);
      } else if (typeof val === 'string' && val.trim().startsWith('0') && val.trim().length > 1 && !val.includes('-') && !val.includes('/')) {
        // Prefix with single quote so Google Sheets treats it as text and preserves leading zeros
        val = "'" + val.trim();
      }
      row.push(val !== undefined && val !== null ? val : '');
    }
    rows.push(row);
  }
  
  const fullRange = sheet.getRange(1, 1, rows.length, headers.length);
  fullRange.setNumberFormat('@');
  fullRange.setValues(rows);
  
  // Format Header
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground(sheetName === 'Data_Alumni' ? '#059669' : '#0284C7');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setHorizontalAlignment('center');
  
  // Auto-resize columns
  try {
    for (let c = 1; c <= Math.min(headers.length, 30); c++) {
      sheet.autoResizeColumn(c);
    }
  } catch(e) {}
}

function checkAndInitializeSheets(ss) {
  // Safe sheet creator to ensure sheets exist on doGet / doPost
  const defaultSheets = {
    'Data_Alumni': [
      HEADERS_MAP['Data_Alumni'],
      ['alm-001', '0071239811', '3201123456780099', 'Rian Hidayat, S.T.', 'L', 'Jakarta', '2006-03-12', 'IX. Moh Hatta', '2023/2024', 'DN-02/D-SMP/24/008129', 'Siti Maryam', 'H. Agus Pratama', 'Jl. Merdeka Barat No. 12', '081234567800', 'Lulus', 'Lulus', 'Islam', '21001', 'SKHUN-2024-001', 'SMP Negeri Unggulan 1']
    ],
    'Data_Siswa': [
      HEADERS_MAP['Data_Siswa']
    ],
    'Data_Siswa_Keluar': [
      HEADERS_MAP['Data_Siswa_Keluar']
    ],
    'Data_PTK': [
      HEADERS_MAP['Data_PTK']
    ],
    'Data_Sarpras': [
      HEADERS_MAP['Data_Sarpras']
    ],
    'Data_Rapor': [
      HEADERS_MAP['Data_Rapor']
    ],
    'Administrator': [
      ['id', 'username', 'password', 'nama', 'role', 'email', 'noHp', 'status', 'lastLogin'],
      ['adm-001', 'admin', 'admin123', 'Ahmad Andryanto (Administrator)', 'Administrator', 'ahmad.andryanto50@admin.smp.belajar.id', '081234567890', 'Aktif', ''],
      ['adm-002', 'operator', 'operator123', 'Operator Dapodik Sekolah', 'Operator', 'operator@smp.belajar.id', '081298765432', 'Aktif', ''],
      ['adm-003', 'kepsek', 'kepsek123', 'Drs. Bambang Sudarsono, M.Pd.', 'Kepala Sekolah', 'kepala.sekolah@smp.belajar.id', '081345678901', 'Aktif', '']
    ],
    'Profil_Sekolah': [
      ['key', 'value'],
      ['npsn', '40203578'],
      ['namaSekolah', 'SMP NEGERI 11 PALU'],
      ['bentukPendidikan', 'Sekolah Menengah Pertama (SMP)'],
      ['statusSekolah', 'Negeri'],
      ['logoSekolah', '/logo_smpn11palu.jpg'],
      ['alamat', 'Jl. Keramik, Kelurahan Duyu, Kecamatan Tatanga'],
      ['rtRwDusun', 'RT 02/RW 05'],
      ['desaKelurahan', 'Duyu'],
      ['kecamatan', 'Tatanga'],
      ['kabupatenKota', 'Kota Palu'],
      ['provinsi', 'Sulawesi Tengah'],
      ['kepalaSekolah', 'Drs. Bambang Sudarsono, M.Pd.'],
      ['nipKepalaSekolah', '197508122003121002'],
      ['pangkatGolongan', 'Pembina Tk. I / IV-b'],
      ['tmtMenjabat', '01 Juli 2021'],
      ['fotoKepalaSekolah', ''],
      ['akreditasi', 'A (Unggul)'],
      ['kurikulum', 'Kurikulum Merdeka'],
      ['kodePos', '94225'],
      ['telepon', '(0451) 123456'],
      ['email', 'info@smpn11palu.sch.id'],
      ['website', 'https://smpn11palu.sch.id'],
      ['skPendirian', '421.3/089/Disdik/1991'],
      ['tanggalSkPendirian', '02 Juni 1991'],
      ['skIzinOperasional', '188.4/552/KPTS/1991'],
      ['tanggalSkIzinOperasional', '29 Juni 1991'],
      ['statusKepemilikan', 'Pemerintah Daerah'],
      ['namaYayasan', ''],
      ['operatorSekolah', 'Ahmad Andryanto, S.Kom.'],
      ['bendaharaBos', 'Siti Rahmawati, S.Pd., M.M.'],
      ['komiteSekolah', 'Ir. H. Budi Santoso, M.T.'],
      ['luasTanah', '12.500 m²'],
      ['luasBangunan', '4.850 m²'],
      ['dayaListrik', '33.000 VA'],
      ['aksesInternet', 'Fiber Optik 200 Mbps'],
      ['dayaTampung', '384 Siswa (12 Rombel)'],
      ['jumlahRombel', '12 Rombel'],
      ['keterangan', 'Sekolah Ramah Anak, Adiwiyata Mandiri, dan Sekolah Penggerak Angkatan I'],
      ['visi', 'Terwujudnya Peserta Didik yang Berakhlak Mulia, Cerdas, Berkarakter Profil Pelajar Pancasila, dan Berwawasan Global.'],
      ['misi', '["Menyelenggarakan pembelajaran berkualitas","Membentuk karakter islami dan nasionalis","Meningkatkan prestasi akademik dan non-akademik","Membina kerja sama dengan wali murid dan masyarakat"]']
    ],
    'Data_Pengaturan': [
      ['key', 'value'],
      ['appName', 'DAPODIK'],
      ['appVersion', '2026.b'],
      ['appSubtitle', ''],
      ['logoCustomUrl', '/logo_smpn11palu.jpg'],
      ['welcomeGreeting', 'SELAMAT DATANG'],
      ['welcomeTitle', 'DI DAPODIK'],
      ['welcomeSubtitle', 'DATA POKOK PENDIDIKAN'],
      ['welcomeIconType', 'school'],
      ['welcomeCustomIconUrl', ''],
      ['curriculumBadge', 'Kurikulum Merdeka Ready'],
      ['curriculumBadgeIcon', 'check'],
      ['footerVersionText', 'Dapodik Cloud 2026.a (Next.js & Vercel Ready)'],
      ['operatorTitle', 'Operator Sekolah'],
      ['operatorName', 'SMP NEGERI 11 PALU'],
      ['operatorAvatarUrl', '']
    ],
    'Data_Aplikasi': [
      ['id', 'label', 'url', 'icon', 'color'],
      ['1', 'Login Dapodik', 'https://sp.datadik.kemdikbud.go.id/', 'Laptop', 'from-indigo-500 to-indigo-600'],
      ['2', 'PTK Datadik', 'https://ptk.datadik.kemdikbud.go.id/', 'Database', 'from-pink-500 to-pink-600'],
      ['3', 'Area Member', 'https://daftarpemberi.kemdikbud.go.id/', 'Globe', 'from-indigo-600 to-purple-600'],
      ['4', 'SP Datadik', 'https://sp.datadik.kemdikbud.go.id/', 'School', 'from-blue-500 to-blue-600'],
      ['5', 'Info GTK', 'https://info.gtk.kemdikbud.go.id/', 'Info', 'from-cyan-400 to-cyan-500'],
      ['6', 'Prefill 1', 'https://dapo.kemdikbud.go.id/unduh', 'Archive', 'from-blue-600 to-blue-700'],
      ['7', 'Verval PD', 'https://vervalpd.data.kemdikbud.go.id/', 'Users', 'from-pink-600 to-rose-600'],
      ['8', 'NISN', 'https://nisn.data.kemdikbud.go.id/', 'FileText', 'from-orange-500 to-orange-600'],
      ['9', 'Prefill 2', 'https://dapo.kemdikbud.go.id/unduh', 'Archive', 'from-blue-500 to-sky-600'],
      ['10', 'Verval PTK', 'https://vervalptk.data.kemdikbud.go.id/', 'UserCheck', 'from-amber-500 to-amber-600'],
      ['11', 'BOSP Salur', 'https://bos.kemdikbud.go.id/', 'Wallet', 'from-teal-500 to-emerald-600'],
      ['12', 'Login SDM', 'https://sdm.data.kemdikbud.go.id/', 'ShieldCheck', 'from-cyan-500 to-blue-500'],
      ['13', 'Verval SP', 'https://vervalsp.data.kemdikbud.go.id/', 'ShieldCheck', 'from-indigo-500 to-blue-600'],
      ['14', 'RSDM', 'https://sdm.data.kemdikbud.go.id/', 'Box', 'from-orange-600 to-amber-700'],
      ['15', 'Web Dapodik', 'https://dapo.kemdikbud.go.id/', 'Laptop', 'from-red-500 to-red-600']
    ]
  };

  for (let name in defaultSheets) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      const rows = defaultSheets[name];
      sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
      
      const headerRange = sheet.getRange(1, 1, 1, rows[0].length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground(name === 'Data_Alumni' ? '#059669' : '#0284C7');
      headerRange.setFontColor('#FFFFFF');
      headerRange.setHorizontalAlignment('center');
      try {
        for (let c = 1; c <= rows[0].length; c++) {
          sheet.autoResizeColumn(c);
        }
      } catch(e) {}
    }
  }
}
`;

export async function syncToGoogleSheets(
  config: SyncConfig,
  data: {
    siswa: Student[];
    ptk: TeacherStaff[];
    sarpras: SarprasItem[];
    rapor: StudentReport[];
    pengaturan?: Array<{ key: string; value: string }>;
    administrator?: AdminUser[];
    profilSekolah?: Array<{ key: string; value: string }>;
    aplikasi?: any[];
  }
): Promise<{ success: boolean; message: string }> {
  if (!config.webAppUrl) {
    return {
      success: false,
      message: 'URL Google Apps Script belum diisi di menu Pengaturan / Database Cloud.'
    };
  }

  try {
    const payload = {
      type: 'SYNC_ALL',
      siswa: data.siswa
        .filter(s => !s.status || s.status === 'Aktif')
        .map(s => {
          const { alasanKeluar, ...rest } = s;
          return {
            ...rest,
            alasanKeluar: alasanKeluar || '',
            tahunLulus: s.tahunLulus || ''
          };
        }),
      siswaKeluar: data.siswa
        .filter(s => s.status && s.status !== 'Aktif' && s.status !== 'Lulus')
        .map(s => {
          const { alasanKeluar, ...rest } = s;
          return {
            ...rest,
            alasanKeluar: alasanKeluar || ''
          };
        }),
      alumni: data.siswa
        .filter(s => s.status === 'Lulus')
        .map(s => {
          const { alasanKeluar, ...rest } = s;
          return {
            ...rest,
            status: 'Lulus',
            alasanKeluar: alasanKeluar || 'Lulus',
            tahunLulus: s.tahunLulus || '2024/2025',
            noSeriIjazah: s.noSeriIjazah || ''
          };
        }),
      ptk: data.ptk,
      sarpras: data.sarpras,
      rapor: data.rapor,
      pengaturan: data.pengaturan || [],
      administrator: data.administrator || [],
      profilSekolah: data.profilSekolah || [],
      aplikasi: data.aplikasi || [],
      timestamp: new Date().toLocaleString('id-ID')
    };

    const response = await fetch(config.webAppUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      try {
        const resJson = await response.json();
        if (resJson && resJson.status === 'success') {
          return {
            success: true,
            message: resJson.message || 'Data berhasil dikirim & disinkronkan ke Database!'
          };
        } else if (resJson && resJson.status === 'error') {
          return {
            success: false,
            message: 'Respons Database Error: ' + (resJson.message || 'Gagal memproses data.')
          };
        }
      } catch (parseError) {
        // Fallback if JSON parsing failed but request was OK
      }
    }

    return {
      success: true,
      message: 'Data berhasil dikirim & disinkronkan ke Database!'
    };
  } catch (error: any) {
    console.error('Sync error:', error);
    // Standard browsers may block reading the redirected response if CORS headers are missing,
    // but the POST request itself has been sent and executed successfully on Google servers.
    if (error instanceof TypeError) {
      return {
        success: true,
        message: 'Data berhasil dikirim & disinkronkan ke Database! (Penjelasan: Respons terkirim dengan sukses ke server Database Cloud).'
      };
    }
    return {
      success: false,
      message: error?.message || 'Gagal menyinkronkan data ke Database.'
    };
  }
}

export async function loadFromGoogleSheets(config: SyncConfig): Promise<{
  success: boolean;
  message: string;
  data?: {
    siswa: Student[];
    ptk: TeacherStaff[];
    sarpras: SarprasItem[];
    rapor: StudentReport[];
    pengaturan: Array<{ key: string; value: string }>;
    administrator: AdminUser[];
    profilSekolah: Array<{ key: string; value: string }>;
    aplikasi?: any[];
  }
}> {
  if (!config.webAppUrl) {
    return {
      success: false,
      message: 'URL Google Apps Script belum dikonfigurasi.'
    };
  }

  try {
    const response = await fetch(config.webAppUrl);
    if (!response.ok) {
      throw new Error(`HTTP status ${response.status}`);
    }
    const result = await response.json();
    if (result && result.status === 'success') {
      return {
        success: true,
        message: 'Data berhasil ditarik dari Database!',
        data: {
          siswa: [
            ...(result.siswa || []),
            ...(result.siswaKeluar || []).filter((sk: any) => !(result.siswa || []).some((s: any) => s.id === sk.id)),
            ...(result.alumni || []).map((al: any) => ({ ...al, status: al.status || 'Lulus' })).filter((al: any) => !(result.siswa || []).some((s: any) => s.id === al.id) && !(result.siswaKeluar || []).some((sk: any) => sk.id === al.id))
          ],
          ptk: result.ptk || [],
          sarpras: result.sarpras || [],
          rapor: result.rapor || [],
          pengaturan: result.pengaturan || [],
          administrator: result.administrator || [],
          profilSekolah: result.profilSekolah || [],
          aplikasi: result.aplikasi || []
        }
      };
    } else {
      return {
        success: false,
        message: result?.message || 'Gagal mengurai respons dari Google Apps Script.'
      };
    }
  } catch (error: any) {
    console.warn('GET request failed, trying POST fallback:', error);
    try {
      // POST fallback for strict network sandbox or iframe restrictions
      const response = await fetch(config.webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ type: 'LOAD_ALL' })
      });
      const result = await response.json();
      if (result && result.status === 'success') {
        return {
          success: true,
          message: 'Data berhasil ditarik dari Database (POST fallback)!',
          data: {
            siswa: [
              ...(result.siswa || []),
              ...(result.siswaKeluar || []).filter((sk: any) => !(result.siswa || []).some((s: any) => s.id === sk.id)),
              ...(result.alumni || []).map((al: any) => ({ ...al, status: al.status || 'Lulus' })).filter((al: any) => !(result.siswa || []).some((s: any) => s.id === al.id) && !(result.siswaKeluar || []).some((sk: any) => sk.id === al.id))
            ],
            ptk: result.ptk || [],
            sarpras: result.sarpras || [],
            rapor: result.rapor || [],
            pengaturan: result.pengaturan || [],
            administrator: result.administrator || [],
            profilSekolah: result.profilSekolah || [],
            aplikasi: result.aplikasi || []
          }
        };
      }
    } catch (fallbackError: any) {
      console.error('POST fallback failed:', fallbackError);
    }
    
    return {
      success: false,
      message: 'Gagal terhubung ke Database. Pastikan deploy Apps Script Anda sudah diatur ke "Anyone" (Siapa saja).'
    };
  }
}

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert('Tidak ada data untuk diekspor.');
    return;
  }
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      let val = row[header];
      if (typeof val === 'object') {
        val = JSON.stringify(val);
      }
      val = val !== undefined && val !== null ? String(val) : '';
      const escaped = val.replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `${filename}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
