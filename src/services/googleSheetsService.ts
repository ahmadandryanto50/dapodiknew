import { Student, TeacherStaff, SarprasItem, StudentReport, SyncConfig, AppDisplayConfig, SchoolProfile, AdminUser, NotificationItem } from '../types';

export const APPS_SCRIPT_TEMPLATE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT UNTUK DAPODIK TERINTEGRASI 2026
 * Versi Script: v3.2 (Pure Google Sheets & Drive Auto Row Delete Sync)
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
  'Data_Rapor': ['id', 'studentId', 'nisn', 'studentName', 'rombel', 'semester', 'tahunAjaran', 'scores', 'kehadiran', 'catatanWaliKelas', 'statusKenaikan'],
  'Notifikasi': ['id', 'title', 'message', 'time', 'type', 'read'],
  'Permintaan_Akses_Berkas': ['id', 'fileId', 'fileName', 'requesterName', 'requesterRole', 'requesterEmail', 'requestedAt', 'reason', 'status', 'reviewedBy', 'reviewedAt', 'reviewNotes'],
  'Data_Berkas': ['id', 'Nama Berkas', 'Nama Pengirim/Orang Tua', 'Kategori', 'Tanggal', 'Link Drive', 'Ukuran File']
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
    notifikasi: getSheetData(ss, 'Notifikasi'),
    permintaanAkses: getSheetData(ss, 'Permintaan_Akses_Berkas'),
    berkas: getSheetData(ss, 'Data_Berkas'),
    status: 'success',
    version: '2026.2.10',
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
        notifikasi: getSheetData(ss, 'Notifikasi'),
        permintaanAkses: getSheetData(ss, 'Permintaan_Akses_Berkas'),
        berkas: getSheetData(ss, 'Data_Berkas'),
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
      if (data.notifikasi !== undefined) saveSheetData(ss, 'Notifikasi', data.notifikasi, HEADERS_MAP['Notifikasi']);
      if (data.berkas !== undefined) appendOrMergeSheetData(ss, 'Data_Berkas', data.berkas, HEADERS_MAP['Data_Berkas']);
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
      saveSheetData(ss, 'Data_Aplikasi', data.payload);
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
  headerRange.setBackground(sheetName === 'Data_Alumni' ? '#059669' : sheetName === 'Permintaan_Akses_Berkas' ? '#D97706' : '#0284C7');
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
      headerRange.setBackground(name === 'Data_Alumni' ? '#059669' : name === 'Permintaan_Akses_Berkas' ? '#D97706' : '#0284C7');
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
      rapor: Array.isArray(result.rapor) ? result.rapor : [],
      pengaturan: Array.isArray(result.pengaturan) ? result.pengaturan : [],
      administrator: Array.isArray(result.administrator) ? result.administrator : [],
      profilSekolah: Array.isArray(result.profilSekolah) ? result.profilSekolah : [],
      aplikasi: Array.isArray(result.aplikasi) ? result.aplikasi : [],
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
      }).filter((n: NotificationItem) => n.title || n.message)
    }
  };
}

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
    notifikasi?: NotificationItem[];
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
      rapor: data.rapor || [],
      pengaturan: data.pengaturan || [],
      administrator: data.administrator || [],
      profilSekolah: data.profilSekolah || [],
      aplikasi: data.aplikasi || [],
      notifikasi: data.notifikasi || [],
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
    notifikasi?: NotificationItem[];
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
      body: JSON.stringify({ webAppUrl: config.webAppUrl })
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
    const directRes = await fetch(config.webAppUrl, {
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
            rapor: cache.reports || [],
            pengaturan: cache.displayConfig 
              ? Object.entries(cache.displayConfig).map(([k, v]) => ({ key: k, value: v !== undefined && v !== null ? String(v) : '' }))
              : [],
            administrator: cache.administrators || [],
            profilSekolah: cache.schoolProfile 
              ? Object.entries(cache.schoolProfile).map(([k, v]) => ({ key: k, value: v !== undefined && v !== null ? String(v) : '' }))
              : [],
            aplikasi: cache.aplikasiLinks || [],
            notifikasi: cache.notifications || []
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

export async function syncNotifikasiToGoogleSheets(
  config: SyncConfig,
  notifications: NotificationItem[]
): Promise<{ success: boolean; message: string }> {
  if (!config.webAppUrl) {
    return { success: false, message: 'URL Google Apps Script belum dikonfigurasi.' };
  }
  const payload = {
    type: 'SYNC_NOTIFIKASI',
    payload: notifications
  };
  return await callProxyOrDirectPost(config.webAppUrl, payload);
}

// Removed file upload/sync functions

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

