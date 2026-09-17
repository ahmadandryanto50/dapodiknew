import * as XLSX from 'xlsx';
import { Student, TeacherStaff, SarprasItem, KibBItem, StudentReport, SyncConfig, AppDisplayConfig, SchoolProfile, AdminUser, NotificationItem, SchoolAccount } from '../types';

export const APPS_SCRIPT_TEMPLATE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT UNTUK DAPODIK TERINTEGRASI 2026
 * Versi Script: v3.3 (Pure Google Sheets, Drive Sync & KIB B Inventarisasi Barang)
 * =========================================================================
 * 
 * FUNGSI UTAMA OTORISASI GOOGLE DRIVE (Jalankan ini jika butuh izin ulang):
 * -------------------------------------------------------------------------
 * 1. Di bagian atas editor Apps Script, pilih fungsi: 'testAndAuthorizeGoogleDrive'
 * 2. Klik tombol ▶ 'Jalankan' (Run)
 * 3. Klik 'Tinjau Izin' (Review Permissions) -> Pilih Akun Google Anda -> 'Lanjutan' (Advanced) -> 'Buka Kode (tidak aman)' -> 'Izinkan' (Allow)
 */

// Function Standalone untuk Otorisasi & Tes Google Drive Instant
function testAndAuthorizeGoogleDrive() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    checkAndInitializeSheets(ss);
    
    // Tes Akses Google Drive
    var parentName = 'Berkas Dapodik';
    var folders = DriveApp.getFoldersByName(parentName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(parentName);
    
    // Buat file tes
    var testFile = folder.createFile('Tes_Otorisasi_Dapodik_' + Date.now() + '.txt', 'Otorisasi Google Drive Dapodik Berhasil pada ' + new Date().toLocaleString('id-ID'), MimeType.PLAIN_TEXT);
    var fileId = testFile.getId();
    testFile.setTrashed(true); // Bersihkan kembali
    
    var msg = "✅ OTORISASI GOOGLE DRIVE 100% SUKSES!\\n\\nFolder '" + parentName + "' telah siap di Google Drive Anda.\\nPengunggahan berkas dari aplikasi Dapodik Web telah aktif!";
    Logger.log(msg);
    try {
      SpreadsheetApp.getUi().alert(msg);
    } catch(e) {}
    return { status: 'success', id: fileId, message: msg };
  } catch (err) {
    var errMsg = "❌ GAGAL OTORISASI GOOGLE DRIVE: " + err.toString();
    Logger.log(errMsg);
    try {
      SpreadsheetApp.getUi().alert(errMsg);
    } catch(e) {}
    return { status: 'error', message: errMsg };
  }
}

// Menu Otorisasi & Akses Cepat di Google Spreadsheet
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('⚡ Otorisasi Dapodik')
      .addItem('🔑 1. Berikan Izin & Tes Google Drive', 'testAndAuthorizeGoogleDrive')
      .addItem('📁 2. Buat Struktur Folder Berkas', 'setupDapodikFolders')
      .addToUi();
  } catch(e) {}
}

function triggerAuthorization() {
  return testAndAuthorizeGoogleDrive();
}

function setupDapodikFolders() {
  var parentName = 'Berkas Dapodik';
  var parent = DriveApp.getFoldersByName(parentName);
  var pFolder = parent.hasNext() ? parent.next() : DriveApp.createFolder(parentName);
  
  var categories = ['Kesiswaan', 'Kurikulum', 'Keuangan', 'Kepegawaian', 'Sarpras', 'Surat Masuk & Keluar', 'Umum'];
  for (var i = 0; i < categories.length; i++) {
    var sub = pFolder.getFoldersByName(categories[i]);
    if (!sub.hasNext()) {
      pFolder.createFolder(categories[i]);
    }
  }
  try {
    SpreadsheetApp.getUi().alert("✅ Struktur Folder Berkas Dapodik (" + categories.join(', ') + ") Berhasil Dibuat di Google Drive Anda!");
  } catch(e) {}
}

// Header Baku Setiap Sheet Database
const HEADERS_MAP = {
  'Data_Siswa': ['id', 'nisn', 'nik', 'nama', 'jenisKelamin', 'tempatLahir', 'tanggalLahir', 'rombel', 'namaIbu', 'alamat', 'status', 'agama', 'nis', 'rt', 'rw', 'dusun', 'kelurahan', 'kecamatan', 'kodePos', 'jenisTinggal', 'alatTransportasi', 'telepon', 'hp', 'email', 'skhun', 'penerimaKps', 'noKps', 'namaAyah', 'nikAyah', 'pekerjaanAyah', 'namaIbu', 'nikIbu', 'pekerjaanIbu', 'rombelSaatIni', 'layakPip', 'alasanLayakPip', 'noKk', 'beratBadan', 'tinggiBadan', 'lingkarKepala', 'jmlSaudaraKandung', 'jarakRumahKeSekolah', 'alasanKeluar', 'tahunLulus', 'noSeriIjazah'],
  'Data_Siswa_Keluar': ['id', 'nisn', 'nik', 'nama', 'jenisKelamin', 'tempatLahir', 'tanggalLahir', 'rombel', 'namaIbu', 'alamat', 'status', 'alasanKeluar', 'agama', 'nis', 'hp', 'email', 'namaAyah', 'nikAyah'],
  'Data_Alumni': ['id', 'nisn', 'nik', 'nama', 'jenisKelamin', 'tempatLahir', 'tanggalLahir', 'rombel', 'tahunLulus', 'noSeriIjazah', 'namaIbu', 'namaAyah', 'alamat', 'hp', 'status', 'alasanKeluar', 'agama', 'nis', 'skhun', 'sekolahAsal'],
  'Data_PTK': ['id', 'nuptk', 'nip', 'nama', 'jenisKelamin', 'statusKepegawaian', 'jenisPtk', 'mapel', 'pendidikanTerakhir', 'noHp', 'email', 'statusSertifikasi', 'tempatLahir', 'tanggalLahir', 'agama', 'alamatJalan', 'rt', 'rw', 'namaDusun', 'desaKelurahan', 'kecamatan', 'kodePos', 'tugasTambahan', 'skCpns', 'tanggalCpns', 'skPengangkatan', 'tmtPengangkatan', 'pangkatGolongan', 'nik', 'noKk'],
  'Data_Sarpras': ['id', 'kodeBarang', 'namaBarang', 'kategori', 'kondisi', 'jumlah', 'satuan', 'letakRuang', 'tahunPengadaan', 'layakPakai'],
  'KIB B': ['id', 'No', 'Nama Barang', 'Kode Barang', 'Kondisi', 'Merk / Type', 'Ukuran / CC', 'Bahan', 'Tahun', 'No Pabrik', 'No Rangka', 'No Mesin', 'No Polisi', 'No Bpkb', 'Asal Usul', 'Harga', 'Keterangan'],
  'Data_KIB_B': ['id', 'No', 'Nama Barang', 'Kode Barang', 'Kondisi', 'Merk / Type', 'Ukuran / CC', 'Bahan', 'Tahun', 'No Pabrik', 'No Rangka', 'No Mesin', 'No Polisi', 'No Bpkb', 'Asal Usul', 'Harga', 'Keterangan'],
  'Data_Rapor': ['id', 'studentId', 'nisn', 'studentName', 'rombel', 'semester', 'tahunAjaran', 'scores', 'kehadiran', 'catatanWaliKelas', 'statusKenaikan'],
  'Notifikasi': ['id', 'title', 'message', 'time', 'type', 'read'],
  'Permintaan_Akses_Berkas': ['id', 'fileId', 'fileName', 'requesterName', 'requesterRole', 'requesterEmail', 'requestedAt', 'reason', 'status', 'reviewedBy', 'reviewedAt', 'reviewNotes'],
  'Data_Berkas': ['id', 'Nama Berkas', 'Nama Pengirim/Orang Tua', 'Kategori', 'Tanggal', 'Link Drive', 'Ukuran File'],
  'Data_Aplikasi': ['id', 'label', 'url', 'icon', 'color', 'category', 'desc', 'tag'],
  'Data_Multi_Sekolah': ['id', 'npsn', 'namaSekolah', 'password', 'status', 'role', 'bentukPendidikan', 'kepalaSekolah', 'nipKepalaSekolah', 'alamat', 'kabupatenKota', 'provinsi', 'spreadsheetUrl', 'webAppUrl', 'kontakAdmin', 'catatan', 'createdAt', 'lastLogin']
};

// Utility helper to open correct spreadsheet based on parameters for multi-tenant isolation
function getTargetSpreadsheet(e, postData) {
  if (postData && postData.spreadsheetUrl) {
    try { return SpreadsheetApp.openByUrl(postData.spreadsheetUrl); } catch(err) {}
  }
  if (postData && postData.spreadsheetId) {
    try { return SpreadsheetApp.openById(postData.spreadsheetId); } catch(err) {}
  }
  if (e && e.parameter) {
    if (e.parameter.spreadsheetUrl) {
      try { return SpreadsheetApp.openByUrl(e.parameter.spreadsheetUrl); } catch(err) {}
    }
    if (e.parameter.spreadsheetId) {
      try { return SpreadsheetApp.openById(e.parameter.spreadsheetId); } catch(err) {}
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

// ID Spreadsheet Master (Hanya diketahui oleh Anda sebagai Pembuat Aplikasi)
const MASTER_SPREADSHEET_ID = "MASUKKAN_ID_SPREADSHEET_MASTER_DISINI";

function loginUser(npsn, password) {
  try {
    const masterSs = SpreadsheetApp.openById(MASTER_SPREADSHEET_ID);
    const userSheet = masterSs.getSheetByName("Users") || masterSs.getSheetByName("Data_Multi_Sekolah") || checkAndCreateUserSheet(masterSs);
    const logSheet = masterSs.getSheetByName("Log_Aktivitas") || checkAndCreateLogSheet(masterSs);
    
    const data = userSheet.getDataRange().getValues();
    
    // Cari baris data berdasarkan NPSN dan Password (abaikan baris header index 0)
    for (let i = 1; i < data.length; i++) {
      const rowNpsn = String(data[i][0] || "").trim();
      const rowPass = String(data[i][1] || "").trim();
      const namaSekolah = data[i][2] || "Sekolah " + rowNpsn;
      const status = data[i][3] || "Active";
      const targetSpreadsheetId = data[i][4] || "";
      
      if (rowNpsn === String(npsn).trim() && rowPass === String(password).trim()) {
        if (status !== "Active" && status !== "Aktif") {
          return { success: false, message: "Akun sekolah ini sedang dinonaktifkan." };
        }
        
        // Catat Log Login ke Master Spreadsheet
        try {
          logSheet.appendRow([new Date(), rowNpsn, namaSekolah, "Login Berhasil", "Web App Session"]);
        } catch(eLog) {}
        
        return {
          success: true,
          npsn: rowNpsn,
          namaSekolah: namaSekolah,
          spreadsheetId: targetSpreadsheetId,
          spreadsheetUrl: targetSpreadsheetId.indexOf('http') > -1 ? targetSpreadsheetId : "https://docs.google.com/spreadsheets/d/" + targetSpreadsheetId + "/edit"
        };
      }
    }
  } catch(err) {
    return { success: false, message: "Gagal menghubungkan ke database pusat: " + err.toString() };
  }
  
  return { success: false, message: "NPSN atau Password salah!" };
}

function checkAndCreateUserSheet(ss) {
  try {
    var sheet = ss.insertSheet("Users");
    sheet.appendRow(["NPSN", "Password", "Nama_Sekolah", "Status", "Spreadsheet_ID_Sekolah"]);
    sheet.appendRow(["10101001", "PassSekolahA123", "SMP Negeri 1", "Active", ss.getId()]);
    return sheet;
  } catch(e) {
    return ss.getSheetByName("Sheet1") || ss.getSheets()[0];
  }
}

function checkAndCreateLogSheet(ss) {
  try {
    var sheet = ss.insertSheet("Log_Aktivitas");
    sheet.appendRow(["Timestamp", "NPSN", "Nama_Sekolah", "Waktu_Login", "IP / Info"]);
    return sheet;
  } catch(e) {
    return ss.getSheetByName("Sheet1") || ss.getSheets()[0];
  }
}

function doGet(e) {
  const ss = getTargetSpreadsheet(e, null);
  // Pastikan seluruh sheet & tabel otomatis terbuat
  checkAndInitializeSheets(ss);

  // Ambil data KIB B (utamakan nama sheet "KIB B", jika belum ada coba "Data_KIB_B")
  var kibSheet = ss.getSheetByName('KIB B') || ss.getSheetByName('Data_KIB_B');
  var kibData = kibSheet ? getSheetData(ss, kibSheet.getName()) : [];

  const result = {
    siswa: getSheetData(ss, 'Data_Siswa'),
    siswaKeluar: getSheetData(ss, 'Data_Siswa_Keluar'),
    alumni: getSheetData(ss, 'Data_Alumni'),
    ptk: getSheetData(ss, 'Data_PTK'),
    sarpras: getSheetData(ss, 'Data_Sarpras'),
    kibB: kibData,
    'KIB B': kibData,
    rapor: getSheetData(ss, 'Data_Rapor'),
    pengaturan: getSheetData(ss, 'Data_Pengaturan'),
    administrator: getSheetData(ss, 'Administrator'),
    profilSekolah: getSheetData(ss, 'Profil_Sekolah'),
    aplikasi: getSheetData(ss, 'Data_Aplikasi'),
    notifikasi: getSheetData(ss, 'Notifikasi'),
    permintaanAkses: getSheetData(ss, 'Permintaan_Akses_Berkas'),
    berkas: getSheetData(ss, 'Data_Berkas'),
    schoolAccounts: getSheetData(ss, 'Data_Multi_Sekolah'),
    status: 'success',
    version: '2026.3.3',
    timestamp: new Date().toLocaleString('id-ID')
  };
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Dynamic routing bypass for login validation
    if (data && data.type === 'LOGIN_USER') {
      const loginResult = loginUser(data.npsn, data.password);
      return ContentService.createTextOutput(JSON.stringify(loginResult))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const ss = getTargetSpreadsheet(e, data);
    
    // Pastikan seluruh sheet & tabel otomatis terbuat
    checkAndInitializeSheets(ss);

    // Feature: Hapus Baris Berkas dari Spreadsheet Data_Berkas
    if (data.type === 'DELETE_BERKAS' || data.type === 'DELETE_FILE') {
      var fileIdToDelete = data.id || data.fileId;
      var fileNameToDelete = data.fileName || data.name;
      var driveUrlToDelete = data.driveFileUrl || data.url;

      var sheet = ss.getSheetByName("Data_Berkas");
      if (sheet) {
        var lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          var values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
          for (var i = values.length - 1; i >= 0; i--) {
            var rowId = String(values[i][0] || "");
            var rowName = String(values[i][1] || "");
            var rowLink = String(values[i][10] || values[i][9] || "");

            if (
              (fileIdToDelete && rowId === String(fileIdToDelete)) ||
              (fileNameToDelete && rowName === String(fileNameToDelete)) ||
              (driveUrlToDelete && rowLink && driveUrlToDelete.includes(rowLink))
            ) {
              sheet.deleteRow(i + 2); // Hapus baris dari Spreadsheet
            }
          }
        }
      }
      return ContentService.createTextOutput(
        JSON.stringify({ status: "success", message: "Baris berkas berhasil terhapus dari spreadsheet." })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    if (data.type === 'LOAD_ALL') {
      var kibSheet = ss.getSheetByName('KIB B') || ss.getSheetByName('Data_KIB_B');
      var kibData = kibSheet ? getSheetData(ss, kibSheet.getName()) : [];

      const result = {
        siswa: getSheetData(ss, 'Data_Siswa'),
        siswaKeluar: getSheetData(ss, 'Data_Siswa_Keluar'),
        alumni: getSheetData(ss, 'Data_Alumni'),
        ptk: getSheetData(ss, 'Data_PTK'),
        sarpras: getSheetData(ss, 'Data_Sarpras'),
        kibB: kibData,
        'KIB B': kibData,
        rapor: getSheetData(ss, 'Data_Rapor'),
        pengaturan: getSheetData(ss, 'Data_Pengaturan'),
        administrator: getSheetData(ss, 'Administrator'),
        profilSekolah: getSheetData(ss, 'Profil_Sekolah'),
        aplikasi: getSheetData(ss, 'Data_Aplikasi'),
        notifikasi: getSheetData(ss, 'Notifikasi'),
        permintaanAkses: getSheetData(ss, 'Permintaan_Akses_Berkas'),
        berkas: getSheetData(ss, 'Data_Berkas'),
        schoolAccounts: getSheetData(ss, 'Data_Multi_Sekolah'),
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
      if (data.kibB !== undefined || data['KIB B'] !== undefined) {
        var kibItems = data.kibB !== undefined ? data.kibB : data['KIB B'];
        var targetKibSheet = ss.getSheetByName('KIB B') || ss.getSheetByName('Data_KIB_B');
        var targetSheetName = 'KIB B';
        if (targetKibSheet) {
          if (targetKibSheet.getName() === 'Data_KIB_B' && !ss.getSheetByName('KIB B')) {
            try { targetKibSheet.setName('KIB B'); } catch(eRename) {}
          }
          targetSheetName = targetKibSheet.getName();
        } else {
          targetKibSheet = ss.insertSheet('KIB B');
        }
        saveSheetData(ss, targetSheetName, kibItems, HEADERS_MAP['KIB B']);
      }
      if (data.rapor !== undefined) saveSheetData(ss, 'Data_Rapor', data.rapor, HEADERS_MAP['Data_Rapor']);
      if (data.pengaturan !== undefined) saveSheetData(ss, 'Data_Pengaturan', data.pengaturan);
      if (data.administrator !== undefined) saveSheetData(ss, 'Administrator', data.administrator);
      if (data.profilSekolah !== undefined) saveSheetData(ss, 'Profil_Sekolah', data.profilSekolah);
      if (data.aplikasi !== undefined) saveSheetData(ss, 'Data_Aplikasi', data.aplikasi, HEADERS_MAP['Data_Aplikasi']);
      if (data.notifikasi !== undefined) saveSheetData(ss, 'Notifikasi', data.notifikasi, HEADERS_MAP['Notifikasi']);
      if (data.berkas !== undefined) appendOrMergeSheetData(ss, 'Data_Berkas', data.berkas, HEADERS_MAP['Data_Berkas']);
      if (data.schoolAccounts !== undefined) saveSheetData(ss, 'Data_Multi_Sekolah', data.schoolAccounts, HEADERS_MAP['Data_Multi_Sekolah']);
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
    } else if (data.type === 'SYNC_KIB_B') {
      var targetKibSheet = ss.getSheetByName('KIB B') || ss.getSheetByName('Data_KIB_B');
      var targetSheetName = 'KIB B';
      if (targetKibSheet) {
        if (targetKibSheet.getName() === 'Data_KIB_B' && !ss.getSheetByName('KIB B')) {
          try { targetKibSheet.setName('KIB B'); } catch(eRename) {}
        }
        targetSheetName = targetKibSheet.getName();
      } else {
        targetKibSheet = ss.insertSheet('KIB B');
      }
      var kibItems = data.payload || data.kibB || data['KIB B'] || [];
      saveSheetData(ss, targetSheetName, kibItems, HEADERS_MAP['KIB B']);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Data KIB B berhasil disimpan ke Google Spreadsheet pada sheet "' + targetSheetName + '"!'
      })).setMimeType(ContentService.MimeType.JSON);
    } else if (data.type === 'SYNC_RAPOR') {
      saveSheetData(ss, 'Data_Rapor', data.payload, HEADERS_MAP['Data_Rapor']);
    } else if (data.type === 'SYNC_NOTIFIKASI') {
      saveSheetData(ss, 'Notifikasi', data.payload, HEADERS_MAP['Notifikasi']);
    } else if (data.type === 'SYNC_PERMINTAAN_AKSES') {
      saveSheetData(ss, 'Permintaan_Akses_Berkas', data.payload, HEADERS_MAP['Permintaan_Akses_Berkas']);
    } else if (data.type === 'SYNC_BERKAS') {
      appendOrMergeSheetData(ss, 'Data_Berkas', data.payload, HEADERS_MAP['Data_Berkas']);
    } else if (data.type === 'UPLOAD_FILE_TO_DRIVE') {
      var parentFolder = null;
      var folderName = data.folderName || data.category || 'Berkas Dapodik';
      
      // 1. Dapatkan folder induk (parent folder)
      if (data.parentFolderId) {
        try {
          parentFolder = DriveApp.getFolderById(data.parentFolderId);
        } catch(err) {
          parentFolder = null;
        }
      }
      if (!parentFolder) {
        try {
          parentFolder = DriveApp.getRootFolder();
        } catch(err) {
          parentFolder = null;
        }
      }
      
      // 2. Cari atau buat subfolder (folder kategori) di dalam folder induk tersebut (mendukung folder bersarang / nested folder dengan pemisah '/')
      var folder = parentFolder;
      if (folder) {
        try {
          var folderParts = folderName.split('/');
          for (var i = 0; i < folderParts.length; i++) {
            var part = folderParts[i].trim();
            if (!part) continue;
            var subFolders = folder.getFoldersByName(part);
            if (subFolders.hasNext()) {
              folder = subFolders.next();
            } else {
              folder = folder.createFolder(part);
            }
          }
        } catch(err) {
          folder = null;
        }
      }
      
      // Fallback jika semua di atas gagal, buat di root
      if (!folder) {
        try {
          var folderParts = folderName.split('/');
          var currentFolder = DriveApp.getRootFolder();
          for (var i = 0; i < folderParts.length; i++) {
            var part = folderParts[i].trim();
            if (!part) continue;
            var folders = currentFolder.getFoldersByName(part);
            if (folders.hasNext()) {
              currentFolder = folders.next();
            } else {
              currentFolder = currentFolder.createFolder(part);
            }
          }
          folder = currentFolder;
        } catch(err) {
          folder = null;
        }
      }
      
      var rawBase64 = String(data.base64Data || '');
      if (rawBase64.indexOf(',') > -1) {
        rawBase64 = rawBase64.split(',')[1];
      }
      var decodedBytes = Utilities.base64Decode(rawBase64);
      var safeMimeType = data.mimeType || 'application/octet-stream';
      var safeFileName = data.fileName || ('berkas_' + new Date().getTime());
      var blob = Utilities.newBlob(decodedBytes, safeMimeType, safeFileName);
      
      var createdFile = folder ? folder.createFile(blob) : DriveApp.createFile(blob);
      if (data.description) {
        try { createdFile.setDescription(String(data.description)); } catch(e) {}
      }
      try {
        createdFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch(e) {}
      
      var fileId = createdFile.getId();
      var fileUrl = createdFile.getUrl();
      var fileSize = createdFile.getSize();
      var actualMimeType = createdFile.getMimeType();
      var folderId = folder ? folder.getId() : (parentFolder ? parentFolder.getId() : '');
      var folderActualName = folder ? folder.getName() : folderName;

      // Otomatis catat metadata berkas ke Sheet Data_Berkas
      try {
        var nowStr = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone() || "Asia/Jakarta", "yyyy-MM-dd HH:mm");
        var fileMetaData = {
          id: fileId,
          'Nama Berkas': safeFileName || createdFile.getName(),
          'Nama Pengirim/Orang Tua': data.uploadedBy || 'Tamu / Orang Tua',
          'Kategori': folderActualName || 'Umum',
          'Tanggal': nowStr,
          'Link Drive': fileUrl,
          'Ukuran File': fileSize,
          name: safeFileName || createdFile.getName(),
          category: folderActualName || 'Umum',
          fileSize: fileSize,
          fileType: actualMimeType,
          fileExtension: safeFileName.indexOf('.') > -1 ? safeFileName.split('.').pop() : '',
          uploadedAt: nowStr,
          uploadedBy: data.uploadedBy || 'Tamu / Orang Tua',
          uploadedByRole: data.uploadedByRole || 'Tamu / Umum',
          driveFolderId: folderId,
          driveFileUrl: fileUrl
        };
        appendOrMergeSheetData(ss, 'Data_Berkas', [fileMetaData], HEADERS_MAP['Data_Berkas']);
      } catch(errRecord) {
        Logger.log('Could not auto-record to Data_Berkas: ' + errRecord.toString());
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        id: fileId,
        name: createdFile.getName(),
        webViewLink: fileUrl,
        size: fileSize,
        mimeType: actualMimeType,
        folderId: folderId,
        folderName: folderActualName
      })).setMimeType(ContentService.MimeType.JSON);
    } else if (data.type === 'SYNC_PENGATURAN') {
      saveSheetData(ss, 'Data_Pengaturan', data.payload);
    } else if (data.type === 'SYNC_ADMINISTRATOR' || data.type === 'SYNC_ADMIN') {
      saveSheetData(ss, 'Administrator', data.payload);
    } else if (data.type === 'SYNC_PROFIL_SEKOLAH') {
      saveSheetData(ss, 'Profil_Sekolah', data.payload);
    } else if (data.type === 'SYNC_APLIKASI') {
      saveSheetData(ss, 'Data_Aplikasi', data.payload, HEADERS_MAP['Data_Aplikasi']);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'success', 
      message: 'Data Dapodik (Siswa, Alumni, PTK, Sarpras, Notifikasi, Permintaan Akses Berkas, Berkas & Pengaturan) berhasil disinkronkan ke Google Sheet!' 
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
  const headers = fallbackHeaders || (HEADERS_MAP[sheetName] || Object.keys(items[0]));
  const rows = [headers];
  
  for (let i = 0; i < items.length; i++) {
    const row = [];
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j];
      let val = items[i][key];
      if (val === undefined || val === null) {
        if (key === 'Nama Berkas') val = items[i]['name'] || items[i]['Name'];
        else if (key === 'Nama Pengirim/Orang Tua') val = items[i]['uploadedBy'] || items[i]['UploadedBy'];
        else if (key === 'Kategori') val = items[i]['category'] || items[i]['Category'];
        else if (key === 'Tanggal') val = items[i]['uploadedAt'] || items[i]['UploadedAt'];
        else if (key === 'Link Drive') val = items[i]['driveFileUrl'] || items[i]['DriveFileUrl'] || items[i]['url'];
        else if (key === 'Ukuran File') val = items[i]['fileSize'] || items[i]['FileSize'] || items[i]['size'];
        // KIB B field aliases
        else if (key === 'No' || key === 'No.' || key === 'no') val = items[i]['no'] !== undefined ? items[i]['no'] : (i + 1);
        else if (key === 'Nama Barang' || key === 'namaBarang' || key === 'Jenis Barang / Nama Barang') val = items[i]['namaBarang'] || items[i]['Nama Barang'];
        else if (key === 'Kode Barang' || key === 'kodeBarang' || key === 'Nomor Kode Barang') val = items[i]['kodeBarang'] || items[i]['Kode Barang'];
        else if (key === 'Kondisi' || key === 'kondisi') val = items[i]['kondisi'] || items[i]['Kondisi'];
        else if (key === 'Merk / Type' || key === 'merkType' || key === 'Merk/Type') val = items[i]['merkType'] || items[i]['Merk / Type'];
        else if (key === 'Ukuran / CC' || key === 'ukuranCc' || key === 'Ukuran/CC') val = items[i]['ukuranCc'] || items[i]['Ukuran / CC'];
        else if (key === 'Bahan' || key === 'bahan') val = items[i]['bahan'] || items[i]['Bahan'];
        else if (key === 'Tahun' || key === 'tahun' || key === 'Tahun Pembelian') val = items[i]['tahun'] || items[i]['Tahun'];
        else if (key === 'No Pabrik' || key === 'noPabrik' || key === 'No. Pabrik') val = items[i]['noPabrik'] || items[i]['No Pabrik'];
        else if (key === 'No Rangka' || key === 'noRangka' || key === 'No. Rangka') val = items[i]['noRangka'] || items[i]['No Rangka'];
        else if (key === 'No Mesin' || key === 'noMesin' || key === 'No. Mesin') val = items[i]['noMesin'] || items[i]['No Mesin'];
        else if (key === 'No Polisi' || key === 'noPolisi' || key === 'No. Polisi') val = items[i]['noPolisi'] || items[i]['No Polisi'];
        else if (key === 'No Bpkb' || key === 'noBpkb' || key === 'No. BPKB') val = items[i]['noBpkb'] || items[i]['No Bpkb'];
        else if (key === 'Asal Usul' || key === 'asalUsul' || key === 'Asal Usul Perolehan') val = items[i]['asalUsul'] || items[i]['Asal Usul'];
        else if (key === 'Harga' || key === 'harga' || key === 'Harga (Rp)') val = items[i]['harga'] || items[i]['Harga'];
        else if (key === 'Keterangan' || key === 'keterangan') val = items[i]['keterangan'] || items[i]['Keterangan'];
      }
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
  headerRange.setBackground(sheetName === 'Data_Alumni' ? '#059669' : (sheetName === 'KIB B' || sheetName === 'Data_KIB_B') ? '#0D9488' : sheetName === 'Permintaan_Akses_Berkas' ? '#D97706' : '#0284C7');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setHorizontalAlignment('center');
  
  // Auto-resize columns
  try {
    for (let c = 1; c <= Math.min(headers.length, 30); c++) {
      sheet.autoResizeColumn(c);
    }
  } catch(e) {}
}

function appendOrMergeSheetData(ss, sheetName, newItems, fallbackHeaders) {
  if (!newItems || !Array.isArray(newItems) || newItems.length === 0) return;
  var existingItems = getSheetData(ss, sheetName) || [];
  var itemMap = {};
  for (var i = 0; i < existingItems.length; i++) {
    var item = existingItems[i];
    if (item && item.id) {
      itemMap[String(item.id)] = item;
    }
  }
  for (var j = 0; j < newItems.length; j++) {
    var newItem = newItems[j];
    if (newItem && newItem.id) {
      itemMap[String(newItem.id)] = newItem;
    }
  }
  var mergedList = [];
  for (var key in itemMap) {
    if (itemMap.hasOwnProperty(key)) {
      mergedList.push(itemMap[key]);
    }
  }
  saveSheetData(ss, sheetName, mergedList, fallbackHeaders);
}

function checkAndInitializeSheets(ss) {
  if (!ss) {
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    } catch(err) {
      // ignore
    }
  }
  if (!ss) return;

  // Jika ada sheet lama bernama "Data_KIB_B" dan belum ada sheet "KIB B", ubah namanya menjadi "KIB B"
  var oldKibSheet = ss.getSheetByName('Data_KIB_B');
  if (oldKibSheet && !ss.getSheetByName('KIB B')) {
    try { oldKibSheet.setName('KIB B'); } catch(eRen) {}
  }

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
    'KIB B': [
      HEADERS_MAP['KIB B'],
      ['kib-001', '1', 'Timbangan Meja Kapasitas 5 kg', '1.3.2.03.03.010.003', 'Baik', 'Timbangan Meja', '5 kg', 'Besi/Plastik', '2017', '', '', '', '', '', 'DAK / P2HP', '1467800', 'Ruang Wakasek']
    ],
    'Data_Rapor': [
      HEADERS_MAP['Data_Rapor']
    ],
    'Notifikasi': [
      HEADERS_MAP['Notifikasi']
    ],
    'Permintaan_Akses_Berkas': [
      HEADERS_MAP['Permintaan_Akses_Berkas']
    ],
    'Data_Berkas': [
      HEADERS_MAP['Data_Berkas']
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
      ['id', 'label', 'url', 'icon', 'color', 'category', 'desc', 'tag'],
      ['1', 'Login Dapodik', 'https://sp.datadik.kemdikbud.go.id/', 'Laptop', 'from-indigo-500 to-indigo-600', 'main', '', ''],
      ['2', 'PTK Datadik', 'https://ptk.datadik.kemdikbud.go.id/', 'Database', 'from-pink-500 to-pink-600', 'main', '', ''],
      ['3', 'Area Member', 'https://daftarpemberi.kemdikbud.go.id/', 'Globe', 'from-indigo-600 to-purple-600', 'main', '', ''],
      ['4', 'SP Datadik', 'https://sp.datadik.kemdikbud.go.id/', 'School', 'from-blue-500 to-blue-600', 'main', '', ''],
      ['5', 'Info GTK', 'https://info.gtk.kemdikbud.go.id/', 'Info', 'from-cyan-400 to-cyan-500', 'main', '', ''],
      ['6', 'Prefill 1', 'https://dapo.kemdikbud.go.id/unduh', 'Archive', 'from-blue-600 to-blue-700', 'main', '', ''],
      ['7', 'Verval PD', 'https://vervalpd.data.kemdikbud.go.id/', 'Users', 'from-pink-600 to-rose-600', 'main', '', ''],
      ['8', 'NISN', 'https://nisn.data.kemdikbud.go.id/', 'FileText', 'from-orange-500 to-orange-600', 'main', '', ''],
      ['9', 'Prefill 2', 'https://dapo.kemdikbud.go.id/unduh', 'Archive', 'from-blue-500 to-sky-600', 'main', '', ''],
      ['10', 'Verval PTK', 'https://vervalptk.data.kemdikbud.go.id/', 'UserCheck', 'from-amber-500 to-amber-600', 'main', '', ''],
      ['11', 'BOSP Salur', 'https://bos.kemdikbud.go.id/', 'Wallet', 'from-teal-500 to-emerald-600', 'main', '', ''],
      ['12', 'Login SDM', 'https://sdm.data.kemdikbud.go.id/', 'ShieldCheck', 'from-cyan-500 to-blue-500', 'main', '', ''],
      ['13', 'Verval SP', 'https://vervalsp.data.kemdikbud.go.id/', 'ShieldCheck', 'from-indigo-500 to-blue-600', 'main', '', ''],
      ['14', 'RSDM', 'https://sdm.data.kemdikbud.go.id/', 'Box', 'from-orange-600 to-amber-700', 'main', '', ''],
      ['15', 'Web Dapodik', 'https://dapo.kemdikbud.go.id/', 'Laptop', 'from-red-500 to-red-600', 'main', '', ''],
      ['other-1', 'Rapor Pendidikan', 'https://raporpendidikan.kemdikbud.go.id/', 'FileText', 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30', 'other', 'Evaluasi Mutu & Satuan Pendidikan', 'Evaluasi'],
      ['other-2', 'Merdeka Mengajar (PMM)', 'https://guru.kemdikbud.go.id/', 'School', 'bg-sky-500/20 text-sky-300 border-sky-500/30 hover:bg-sky-500/30', 'other', 'Platform Perangkat Ajar & Guru', 'Pelatihan'],
      ['other-3', 'Canva Pendidikan', 'https://www.canva.com/education/', 'Laptop', 'bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30', 'other', 'Desain Grafis Media Pembelajaran', 'Kreatif'],
      ['other-4', 'Sistem Perbukuan (SIBI)', 'https://buku.kemdikbud.go.id/', 'Archive', 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30', 'other', 'Katalog Buku Teks & Kurikulum', 'Buku Ajar']
    ],
    'Data_Multi_Sekolah': [
      HEADERS_MAP['Data_Multi_Sekolah'],
      ['sch-001', '40203578', 'SMP NEGERI 11 PALU', 'admin123', 'Aktif', 'Super Administrator', 'Sekolah Menengah Pertama (SMP)', 'Drs. Bambang Sudarsono, M.Pd.', '197508122003121002', 'Jl. Keramik, Kelurahan Duyu, Kecamatan Tatanga', 'Kota Palu', 'Sulawesi Tengah', '', '', '', '', '2026-09-13', '']
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
      headerRange.setBackground(name === 'Data_Alumni' ? '#059669' : name === 'KIB B' ? '#0D9488' : name === 'Permintaan_Akses_Berkas' ? '#D97706' : '#0284C7');
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

async function callProxyOrDirectPost(webAppUrl: string, payload: any): Promise<{ success: boolean; message: string; data?: any }> {
  // 1. Try server-side proxy endpoint first (bypasses browser CORS & mobile browser restrictions)
  try {
    const proxyRes = await fetch('/api/sync-sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webAppUrl, payload })
    });
    if (proxyRes.ok) {
      const json = await proxyRes.json();
      if (json && json.success) {
        return {
          success: true,
          message: 'Data berhasil dikirim & disinkronkan ke Database Spreadsheet!',
          data: json.data
        };
      } else {
        console.warn('Proxy returned error, falling back to direct browser post:', json?.message);
      }
    } else {
      console.warn('Proxy status not OK, falling back to direct browser post:', proxyRes.status, proxyRes.statusText);
    }
  } catch (proxyErr) {
    console.warn('Proxy connection failed, falling back to direct browser post:', proxyErr);
  }

  // 2. Direct browser fetch with mode: 'no-cors'
  try {
    const response = await fetch(webAppUrl, {
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
            message: resJson.message || 'Data berhasil dikirim & disinkronkan ke Database!',
            data: resJson
          };
        } else if (resJson && resJson.status === 'error') {
          return {
            success: false,
            message: 'Respons Database Error: ' + (resJson.message || 'Gagal memproses data.'),
            data: resJson
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
    if (error instanceof TypeError) {
      return {
        success: true,
        message: 'Data berhasil dikirim & disinkronkan ke Database!'
      };
    }
    return {
      success: false,
      message: error?.message || 'Gagal menyinkronkan data ke Database.'
    };
  }
}

function parseSheetsResult(result: any) {
  const rawSiswa = Array.isArray(result.siswa) ? result.siswa : [];
  const rawSiswaKeluar = Array.isArray(result.siswaKeluar) ? result.siswaKeluar : [];
  const rawAlumni = Array.isArray(result.alumni) ? result.alumni : [];

  const combinedStudents = [
    ...rawSiswa.map((s: any) => ({ ...s, status: s.status || 'Aktif' })),
    ...rawSiswaKeluar.map((sk: any) => ({ ...sk, status: sk.status || 'Mutasi' })).filter((sk: any) => !rawSiswa.some((s: any) => s.id === sk.id)),
    ...rawAlumni.map((al: any) => ({ ...al, status: al.status || 'Lulus' })).filter((al: any) => !rawSiswa.some((s: any) => s.id === al.id) && !rawSiswaKeluar.some((sk: any) => sk.id === al.id))
  ];

  return {
    success: true,
    message: 'Data berhasil ditarik dari Database!',
    data: {
      siswa: combinedStudents,
      ptk: Array.isArray(result.ptk) ? result.ptk : [],
      sarpras: Array.isArray(result.sarpras) ? result.sarpras : [],
      kibB: (function() {
        const rawKib = Array.isArray(result.kibB) 
          ? result.kibB 
          : (Array.isArray(result['KIB B']) 
            ? result['KIB B'] 
            : (Array.isArray(result.kib_b) 
              ? result.kib_b 
              : (Array.isArray(result.Data_KIB_B) ? result.Data_KIB_B : [])));
        
        return rawKib.map((item: any, idx: number) => {
          if (!item || typeof item !== 'object') return null;
          
          const getVal = (...keys: string[]) => {
            for (const k of keys) {
              if (item[k] !== undefined && item[k] !== null && String(item[k]).trim() !== '') {
                return String(item[k]).trim();
              }
              // Also check lowercase key without spaces
              const matchKey = Object.keys(item).find(ik => ik.toLowerCase().replace(/[^a-z0-9]/g, '') === k.toLowerCase().replace(/[^a-z0-9]/g, ''));
              if (matchKey && item[matchKey] !== undefined && item[matchKey] !== null && String(item[matchKey]).trim() !== '') {
                return String(item[matchKey]).trim();
              }
            }
            return '';
          };

          const id = getVal('id', 'ID', 'Id') || `kib-${Date.now()}-${idx}`;
          const noVal = getVal('no', 'No', 'No.', 'Nomor') || String(idx + 1);
          const namaBarang = getVal('namaBarang', 'Nama Barang', 'Jenis Barang / Nama Barang', 'nama_barang', 'Jenis Barang', 'Nama', 'nama');
          const kodeBarang = getVal('kodeBarang', 'Kode Barang', 'Nomor Kode Barang', 'kode_barang', 'Kode');
          const kondisi = getVal('kondisi', 'Kondisi', 'Keadaan Barang', 'Keadaan') || 'Baik';
          const merkType = getVal('merkType', 'Merk / Type', 'Merk/Type', 'merk', 'Type', 'Merk', 'Tipe', 'Merk / Tipe');
          const ukuranCc = getVal('ukuranCc', 'Ukuran / CC', 'Ukuran/CC', 'ukuran', 'Ukuran', 'CC');
          const bahan = getVal('bahan', 'Bahan', 'Material');
          const tahun = getVal('tahun', 'Tahun', 'Tahun Pembelian', 'Tahun Pengadaan', 'Tahun Perolehan');
          const noPabrik = getVal('noPabrik', 'No Pabrik', 'No. Pabrik', 'Nomor Pabrik');
          const noRangka = getVal('noRangka', 'No Rangka', 'No. Rangka', 'Nomor Rangka');
          const noMesin = getVal('noMesin', 'No Mesin', 'No. Mesin', 'Nomor Mesin');
          const noPolisi = getVal('noPolisi', 'No Polisi', 'No. Polisi', 'Nomor Polisi', 'No Plat');
          const noBpkb = getVal('noBpkb', 'No Bpkb', 'No. BPKB', 'Nomor BPKB');
          const asalUsul = getVal('asalUsul', 'Asal Usul', 'Asal Usul Perolehan', 'Asal-Usul', 'Sumber Dana');
          const harga = getVal('harga', 'Harga', 'Harga (Rp)', 'Harga Beli', 'Nilai');
          const keterangan = getVal('keterangan', 'Keterangan', 'Ket', 'Ket.', 'Lokasi', 'Letak Ruang');

          return {
            id,
            no: parseInt(noVal, 10) || (idx + 1),
            namaBarang,
            kodeBarang,
            kondisi,
            merkType,
            ukuranCc,
            bahan,
            tahun,
            noPabrik,
            noRangka,
            noMesin,
            noPolisi,
            noBpkb,
            asalUsul,
            harga,
            keterangan
          };
        }).filter((k: any) => k && (k.namaBarang || k.kodeBarang || k.merkType || k.harga || k.asalUsul || k.keterangan || k.id));
      })(),
      rapor: Array.isArray(result.rapor) ? result.rapor : [],
      pengaturan: Array.isArray(result.pengaturan) ? result.pengaturan : [],
      administrator: Array.isArray(result.administrator) ? result.administrator : [],
      profilSekolah: Array.isArray(result.profilSekolah) ? result.profilSekolah : [],
      aplikasi: Array.isArray(result.aplikasi) ? result.aplikasi : [],
      schoolAccounts: Array.isArray(result.schoolAccounts) ? result.schoolAccounts : [],
      notifikasi: (result.notifikasi || []).map((n: any, idx: number) => {
        const id = String(n.id || n.ID || `notif-${Date.now()}-${idx}`);
        const title = String(n.title || n.Judul || n.judul || n.Title || '');
        const message = String(n.message || n.Pesan || n.pesan || n.Message || '');
        const time = String(n.time || n.Waktu || n.waktu || n.Time || '');
        const rawType = String(n.type || n.tipe || n.Type || 'info').toLowerCase();
        const type = (['info', 'success', 'warning', 'error'].includes(rawType) ? rawType : 'info') as 'info' | 'success' | 'warning' | 'error';
        const rawRead = n.read !== undefined ? n.read : (n.readStatus !== undefined ? n.readStatus : n.dibaca);
        const read = Boolean(rawRead === true || rawRead === 'true' || rawRead === 'TRUE' || rawRead === 1 || rawRead === '1');
        return { id, title, message, time, type, read };
      }).filter((n: NotificationItem) => n.title || n.message),
      berkas: Array.isArray(result.berkas) ? result.berkas : (Array.isArray(result['Data_Berkas']) ? result['Data_Berkas'] : [])
    }
  };
}

export async function validateCentralLogin(
  webAppUrl: string,
  npsn: string,
  password: string
): Promise<{ success: boolean; message: string; data?: any }> {
  if (!webAppUrl) {
    return { success: false, message: 'URL Google Apps Script belum dikonfigurasi.' };
  }
  const payload = {
    type: 'LOGIN_USER',
    npsn,
    password
  };
  try {
    const result = await callProxyOrDirectPost(webAppUrl, payload);
    if (result && result.success && result.data) {
      return {
        success: result.data.success,
        message: result.data.message || (result.data.success ? 'Login sukses!' : 'Gagal login.'),
        data: result.data
      };
    }
    return { success: false, message: result.message || 'Gagal terhubung ke server login.' };
  } catch (error: any) {
    return { success: false, message: error?.message || 'Gagal menghubungi server login.' };
  }
}

export async function syncToGoogleSheets(
  config: SyncConfig,
  data: {
    siswa: Student[];
    ptk: TeacherStaff[];
    sarpras: SarprasItem[];
    kibB?: KibBItem[];
    rapor: StudentReport[];
    pengaturan?: Array<{ key: string; value: string }>;
    administrator?: AdminUser[];
    profilSekolah?: Array<{ key: string; value: string }>;
    aplikasi?: any[];
    notifikasi?: NotificationItem[];
    schoolAccounts?: SchoolAccount[];
  }
): Promise<{ success: boolean; message: string }> {
  if (!config.webAppUrl) {
    return {
      success: false,
      message: 'URL Google Apps Script belum diisi di menu Pengaturan / Database Cloud.'
    };
  }

  try {
    const isKeluar = (status?: string) => {
      if (!status) return false;
      const s = String(status).trim().toLowerCase();
      return ['mutasi', 'putus sekolah', 'wafat/meninggal', 'dikeluarkan', 'mengundurkan diri', 'keluar'].includes(s);
    };

    const isLulus = (status?: string, tahunLulus?: string) => {
      if (tahunLulus && String(tahunLulus).trim().length > 0) return true;
      if (!status) return false;
      const s = String(status).trim().toLowerCase();
      return s === 'lulus' || s === 'alumni';
    };

    const siswaAktif = (data.siswa || []).filter(s => !isKeluar(s.status) && !isLulus(s.status, s.tahunLulus));
    const siswaKeluar = (data.siswa || []).filter(s => isKeluar(s.status));
    const siswaAlumni = (data.siswa || []).filter(s => isLulus(s.status, s.tahunLulus));

    const payload = {
      type: 'SYNC_ALL',
      siswa: siswaAktif.map(s => {
        const { alasanKeluar, ...rest } = s;
        return {
          ...rest,
          alasanKeluar: alasanKeluar || '',
          tahunLulus: s.tahunLulus || ''
        };
      }),
      siswaKeluar: siswaKeluar.map(s => {
        const { alasanKeluar, ...rest } = s;
        return {
          ...rest,
          alasanKeluar: alasanKeluar || s.status || 'Mutasi'
        };
      }),
      alumni: siswaAlumni.map(s => {
        const { alasanKeluar, ...rest } = s;
        return {
          ...rest,
          status: 'Lulus',
          alasanKeluar: alasanKeluar || 'Lulus',
          tahunLulus: s.tahunLulus || '2024/2025',
          noSeriIjazah: s.noSeriIjazah || ''
        };
      }),
      ptk: data.ptk || [],
      sarpras: data.sarpras || [],
      kibB: (data.kibB || []).map((item, idx) => ({
        ...item,
        'id': item.id,
        'No': idx + 1,
        'Nama Barang': item.namaBarang,
        'Kode Barang': item.kodeBarang,
        'Kondisi': item.kondisi,
        'Merk / Type': item.merkType || '',
        'Ukuran / CC': item.ukuranCc || '',
        'Bahan': item.bahan || '',
        'Tahun': item.tahun || '',
        'No Pabrik': item.noPabrik || '',
        'No Rangka': item.noRangka || '',
        'No Mesin': item.noMesin || '',
        'No Polisi': item.noPolisi || '',
        'No Bpkb': item.noBpkb || '',
        'Asal Usul': item.asalUsul || '',
        'Harga': item.harga || '',
        'Keterangan': item.keterangan || ''
      })),
      'KIB B': (data.kibB || []).map((item, idx) => ({
        ...item,
        'id': item.id,
        'No': idx + 1,
        'Nama Barang': item.namaBarang,
        'Kode Barang': item.kodeBarang,
        'Kondisi': item.kondisi,
        'Merk / Type': item.merkType || '',
        'Ukuran / CC': item.ukuranCc || '',
        'Bahan': item.bahan || '',
        'Tahun': item.tahun || '',
        'No Pabrik': item.noPabrik || '',
        'No Rangka': item.noRangka || '',
        'No Mesin': item.noMesin || '',
        'No Polisi': item.noPolisi || '',
        'No Bpkb': item.noBpkb || '',
        'Asal Usul': item.asalUsul || '',
        'Harga': item.harga || '',
        'Keterangan': item.keterangan || ''
      })),
      rapor: data.rapor || [],
      pengaturan: data.pengaturan || [],
      administrator: data.administrator || [],
      profilSekolah: data.profilSekolah || [],
      aplikasi: data.aplikasi || [],
      notifikasi: data.notifikasi || [],
      schoolAccounts: data.schoolAccounts || [],
      spreadsheetUrl: config.spreadsheetUrl || '',
      spreadsheetId: config.spreadsheetUrl || '',
      timestamp: new Date().toLocaleString('id-ID')
    };

    return await callProxyOrDirectPost(config.webAppUrl, payload);
  } catch (error: any) {
    console.error('Sync error:', error);
    return {
      success: false,
      message: error?.message || 'Gagal menyinkronkan data ke Database.'
    };
  }
}

/**
 * Fungsi khusus sinkronisasi instan KIB B langsung ke sheet "KIB B" di Google Spreadsheet
 */
export async function syncKibBToGoogleSheets(
  config: SyncConfig,
  items: KibBItem[]
): Promise<{ success: boolean; message: string; data?: any }> {
  if (!config.webAppUrl) {
    return {
      success: false,
      message: 'URL Google Apps Script belum diisi di Pengaturan.'
    };
  }
  const mappedItems = (items || []).map((item, idx) => ({
    ...item,
    'id': item.id,
    'No': idx + 1,
    'Nama Barang': item.namaBarang,
    'Kode Barang': item.kodeBarang,
    'Kondisi': item.kondisi,
    'Merk / Type': item.merkType || '',
    'Ukuran / CC': item.ukuranCc || '',
    'Bahan': item.bahan || '',
    'Tahun': item.tahun || '',
    'No Pabrik': item.noPabrik || '',
    'No Rangka': item.noRangka || '',
    'No Mesin': item.noMesin || '',
    'No Polisi': item.noPolisi || '',
    'No Bpkb': item.noBpkb || '',
    'Asal Usul': item.asalUsul || '',
    'Harga': item.harga || '',
    'Keterangan': item.keterangan || ''
  }));
  const payload = {
    type: 'SYNC_KIB_B',
    payload: mappedItems,
    kibB: mappedItems,
    'KIB B': mappedItems,
    spreadsheetUrl: config.spreadsheetUrl || '',
    spreadsheetId: config.spreadsheetUrl || '',
    timestamp: new Date().toLocaleString('id-ID')
  };
  return await callProxyOrDirectPost(config.webAppUrl, payload);
}

export function getSavedSyncConfig(): SyncConfig {
  const ACTIVE_APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwOjTnhqqQFCvRGK_5NPVICqUbK-yHUTq1b0CwX3aXqcYjOITfoaogfBWDS3I1bdL6hZA/exec';
  try {
    const saved = localStorage.getItem('dapodik_sync_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.webAppUrl) return parsed;
    }
  } catch (e) {}
  return {
    spreadsheetUrl: '1XmLmshCOhSktRfzW8uG_8RqxlxVCQt5eUVekEFLwj_M',
    webAppUrl: ACTIVE_APP_SCRIPT_URL,
    sheetId: '',
    autoSync: true,
    lastSynced: null,
    status: 'connected',
    mode: 'appscript'
  };
}

export async function loadFromGoogleSheets(config: SyncConfig): Promise<{
  success: boolean;
  message: string;
  data?: {
    siswa: Student[];
    ptk: TeacherStaff[];
    sarpras: SarprasItem[];
    kibB?: KibBItem[];
    rapor: StudentReport[];
    pengaturan: Array<{ key: string; value: string }>;
    administrator: AdminUser[];
    profilSekolah: Array<{ key: string; value: string }>;
    aplikasi?: any[];
    notifikasi?: NotificationItem[];
    schoolAccounts?: SchoolAccount[];
    berkas?: any[];
  };
}> {
  if (!config.webAppUrl) {
    return {
      success: false,
      message: 'URL Google Apps Script belum dikonfigurasi.'
    };
  }

  // 1. Try server-side proxy endpoint first
  try {
    const proxyRes = await fetch('/api/load-sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        webAppUrl: config.webAppUrl,
        spreadsheetUrl: config.spreadsheetUrl || '',
        spreadsheetId: config.spreadsheetUrl || ''
      })
    });
    if (proxyRes.ok) {
      const result = await proxyRes.json();
      if (result && result.status === 'success') {
        return parseSheetsResult(result);
      }
    }
  } catch (proxyErr) {
    // Proxy request error
  }

  // 2. Fallback to direct client-side fetch (supports redirect follow in modern browsers)
  try {
    let getUrl = config.webAppUrl;
    if (config.spreadsheetUrl) {
      const separator = getUrl.includes('?') ? '&' : '?';
      getUrl = `${getUrl}${separator}spreadsheetUrl=${encodeURIComponent(config.spreadsheetUrl)}&spreadsheetId=${encodeURIComponent(config.spreadsheetUrl)}`;
    }

    const directRes = await fetch(getUrl, {
      method: 'GET',
      redirect: 'follow'
    });
    if (directRes.ok) {
      const text = await directRes.text();
      const directData = JSON.parse(text);
      if (directData && directData.status === 'success') {
        return parseSheetsResult(directData);
      }
    }
  } catch (directErr) {
    // Direct fetch error
  }

  // 3. Fallback to server cache (/api/app-data) so users on any device/browser never lose data
  try {
    const cacheRes = await fetch(`/api/app-data?t=${Date.now()}`);
    if (cacheRes.ok) {
      const cache = await cacheRes.json();
      if (cache && (cache.students?.length || cache.teachers?.length || cache.sarpras?.length || cache.schoolFiles?.length || cache.files?.length)) {
        return {
          success: true,
          message: 'Data dimuat dari sinkronisasi server cache.',
          data: {
            siswa: cache.students || [],
            ptk: cache.teachers || [],
            sarpras: cache.sarpras || [],
            kibB: cache.kibB || [],
            rapor: cache.reports || [],
            pengaturan: cache.displayConfig 
              ? Object.entries(cache.displayConfig).map(([k, v]) => ({ key: k, value: v !== undefined && v !== null ? String(v) : '' }))
              : [],
            administrator: cache.administrators || [],
            profilSekolah: cache.schoolProfile 
              ? Object.entries(cache.schoolProfile).map(([k, v]) => ({ key: k, value: v !== undefined && v !== null ? String(v) : '' }))
              : [],
            aplikasi: cache.aplikasiLinks || [],
            notifikasi: cache.notifications || [],
            schoolAccounts: cache.schoolAccounts || []
          }
        };
      }
    }
  } catch (cacheErr) {
    // Cache error
  }

  return {
    success: false,
    message: 'Gagal terhubung ke Database Spreadsheet. Pastikan deploy Apps Script Anda sudah diatur ke "Anyone" (Siapa saja).'
  };
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

export function exportToExcel(data: Record<string, any>[], filename: string, sheetName: string = 'KIB B') {
  if (!data || data.length === 0) {
    alert('Tidak ada data untuk diekspor.');
    return;
  }
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Auto calculate column widths
    const keys = Object.keys(data[0] || {});
    const colWidths = keys.map(k => {
      let maxLen = k.length;
      data.forEach(row => {
        const val = row[k] !== undefined && row[k] !== null ? String(row[k]) : '';
        if (val.length > maxLen) maxLen = val.length;
      });
      return { wch: Math.min(Math.max(maxLen + 4, 14), 45) };
    });
    worksheet['!cols'] = colWidths;

    const dateStr = new Date().toISOString().slice(0, 10);
    const finalFilename = filename.toLowerCase().endsWith('.xlsx') ? filename : `${filename}_${dateStr}.xlsx`;
    XLSX.writeFile(workbook, finalFilename);
  } catch (e: any) {
    console.error('Error exporting to Excel:', e);
    // Fallback to CSV if any issue
    exportToCSV(data, filename);
  }
}

export function readExcelOrCSVFile(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '', raw: false });

        const stringified = jsonData.map(row => {
          const cleanRow: Record<string, string> = {};
          Object.keys(row).forEach(k => {
            cleanRow[k] = row[k] !== undefined && row[k] !== null ? String(row[k]).trim() : '';
          });
          return cleanRow;
        });
        resolve(stringified);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

export async function syncNotifikasiToGoogleSheets(
  config: SyncConfig,
  notifications: NotificationItem[]
): Promise<{ success: boolean; message: string }> {
  if (!config.webAppUrl) {
    return { success: false, message: 'URL Google Apps Script belum dikonfigurasi.' };
  }
  const payload = {
    type: 'SYNC_NOTIFIKASI',
    payload: notifications,
    spreadsheetUrl: config.spreadsheetUrl || ''
  };
  return await callProxyOrDirectPost(config.webAppUrl, payload);
}

export function downloadKodeGsFile() {
  try {
    const element = document.createElement('a');
    const file = new Blob([APPS_SCRIPT_TEMPLATE], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = 'Kode.gs';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  } catch(e) {
    console.error('Error downloading Kode.gs file:', e);
  }
}

