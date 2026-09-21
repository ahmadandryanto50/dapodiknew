import express from "express";
import path from "path";
import fs from "fs";
import serverless from "serverless-http";

const app = express();

// Determine file storage paths (using /tmp on serverless environments like Vercel)
let CONFIG_FILE = path.join(process.cwd(), "sync_config.json");
let DATA_FILE = path.join(process.cwd(), "app_data.json");
let UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

const DEFAULT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzUjSFWKd2esZ0qgApuYzT1P4oJQklgiS3rvELTY1z0nxzXrwth5v_Xb5uAeEUmTzm8/exec";

try {
  const isReadOnly = Boolean(process.env.VERCEL) || !fs.existsSync(process.cwd());
  if (isReadOnly || process.env.NODE_ENV === "production") {
    const tmpUploads = path.join("/tmp", "uploads");
    const tmpConfig = path.join("/tmp", "sync_config.json");
    const tmpData = path.join("/tmp", "app_data.json");

    if (!fs.existsSync("/tmp")) {
      fs.mkdirSync("/tmp", { recursive: true });
    }
    if (!fs.existsSync(tmpUploads)) {
      fs.mkdirSync(tmpUploads, { recursive: true });
    }

    const srcConfig = path.join(process.cwd(), "sync_config.json");
    const srcData = path.join(process.cwd(), "app_data.json");

    if (fs.existsSync(srcConfig) && !fs.existsSync(tmpConfig)) {
      try { fs.copyFileSync(srcConfig, tmpConfig); } catch (e) {}
    }
    if (fs.existsSync(srcData) && !fs.existsSync(tmpData)) {
      try { fs.copyFileSync(srcData, tmpData); } catch (e) {}
    }

    CONFIG_FILE = tmpConfig;
    DATA_FILE = tmpData;
    UPLOADS_DIR = tmpUploads;
  } else {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }
} catch (e) {
  if (!fs.existsSync(UPLOADS_DIR)) {
    try { fs.mkdirSync(UPLOADS_DIR, { recursive: true }); } catch (err) {}
  }
}

function safeReadJSON(filePath: string, fallback: any = {}) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8").trim();
      if (content) {
        return JSON.parse(content);
      }
    }
  } catch (err) {}
  return fallback;
}

function safeWriteJSON(filePath: string, data: any) {
  try {
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {}
  }
}

function cleanKibB(items: any[] = []): any[] {
  if (!Array.isArray(items)) return [];
  return items.filter((item: any) => item && typeof item === 'object' && (item.namaBarang || item.kodeBarang || item.id || item.merkType));
}

function getEffectiveWebAppUrl(incomingUrl?: string): string {
  if (incomingUrl && typeof incomingUrl === "string" && incomingUrl.trim().startsWith("http")) {
    return incomingUrl.trim();
  }
  const config = safeReadJSON(CONFIG_FILE, null);
  if (config && config.webAppUrl && typeof config.webAppUrl === "string" && config.webAppUrl.trim().startsWith("http")) {
    return config.webAppUrl.trim();
  }
  return DEFAULT_WEB_APP_URL;
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use("/api", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type,Authorization");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// API Route: Get Sync Config
app.get("/api/sync-config", (req, res) => {
  const config = safeReadJSON(CONFIG_FILE, null);
  if (config) {
    return res.json(config);
  }
  return res.json({
    spreadsheetUrl: "1XmLmshCOhSktRfzW8uG_8RqxlxVCQt5eUVekEFLwj_M",
    webAppUrl: DEFAULT_WEB_APP_URL,
    sheetId: "",
    autoSync: true,
    lastSynced: null,
    status: "connected",
    mode: "appscript"
  });
});

// API Route: Save Sync Config
app.post("/api/sync-config", (req, res) => {
  try {
    const config = req.body;
    if (config) {
      safeWriteJSON(CONFIG_FILE, config);
      return res.json({ success: true, message: "Configuration updated successfully", config });
    }
    return res.status(400).json({ success: false, message: "Invalid payload" });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// API Route: Upload File
app.post("/api/upload-file", async (req, res) => {
  try {
    const {
      name,
      mimeType,
      base64Data,
      category,
      uploadedBy,
      uploadedByRole,
      description,
      privacy,
      folderName,
      onlySaveMetadata,
      driveFileUrl: providedDriveUrl,
      driveFolderId: providedFolderId,
      fileSize: providedSize
    } = req.body || {};

    if (!name) {
      return res.status(400).json({ success: false, message: "Nama berkas diperlukan." });
    }

    const fileId = `BRK-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const ext = name.split(".").pop()?.toLowerCase() || "dat";
    const nowStr = new Date().toISOString().replace("T", " ").substring(0, 16);

    let driveFileUrl = providedDriveUrl || "";
    let driveFolderId = providedFolderId || "1OFVFI1xhsk45_ONTihtuSHeBVvEOr44m";
    let fileSize = providedSize || 0;
    let fileUrl = "";
    let isDriveSynced = Boolean(providedDriveUrl);
    let syncWarning = "";

    if (onlySaveMetadata) {
      fileUrl = providedDriveUrl || "";
    } else {
      if (!base64Data) {
        return res.status(400).json({ success: false, message: "Data berkas (base64) diperlukan." });
      }

      let cleanBase64 = String(base64Data);
      if (cleanBase64.includes(",")) {
        cleanBase64 = cleanBase64.split(",")[1];
      }

      const buffer = Buffer.from(cleanBase64, "base64");
      fileSize = buffer.length;
      const safeName = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, "_");
      const storedFileName = `${fileId}_${safeName}`;
      const localFilePath = path.join(UPLOADS_DIR, storedFileName);

      try {
        fs.writeFileSync(localFilePath, buffer);
        fileUrl = `/uploads/${storedFileName}`;
      } catch (fsErr) {
        fileUrl = `data:${mimeType || "application/octet-stream"};base64,${cleanBase64.substring(0, 100)}...`;
      }

      const webAppUrl = getEffectiveWebAppUrl();
      if (webAppUrl) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 25000);

          const scriptRes = await fetch(webAppUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({
              type: "UPLOAD_FILE_TO_DRIVE",
              fileName: name,
              mimeType: mimeType || "application/octet-stream",
              base64Data: cleanBase64,
              folderName: folderName || category || "Berkas Dapodik",
              uploadedBy: uploadedBy || "Pengguna",
              uploadedByRole: uploadedByRole || "Staff Sekolah",
              description: description || `Berkas resmi ${category || "Dapodik"}`,
              parentFolderId: "1OFVFI1xhsk45_ONTihtuSHeBVvEOr44m"
            }),
            redirect: "follow",
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (scriptRes.ok) {
            const resText = await scriptRes.text();
            try {
              const parsed = JSON.parse(resText);
              if (parsed && parsed.status === "success" && parsed.id) {
                driveFileUrl = parsed.webViewLink || `https://drive.google.com/file/d/${parsed.id}/view`;
                driveFolderId = parsed.folderId || driveFolderId;
                isDriveSynced = true;
              } else if (parsed && parsed.status === "error") {
                syncWarning = parsed.message || "Error dikembalikan oleh Google Apps Script.";
              }
            } catch (e) {
              syncWarning = "Gagal memproses respons dari Google Apps Script.";
            }
          }
        } catch (scriptErr: any) {
          syncWarning = `Gagal terhubung ke Google Apps Script: ${scriptErr?.message || "Koneksi terputus / Timeout"}`;
        }
      }
    }

    const newItem = {
      id: fileId,
      name: name,
      category: category || "Umum",
      fileSize: fileSize,
      uploadedBy: uploadedBy || "Pengguna",
      uploadedByRole: uploadedByRole || "Staff Sekolah",
      uploadedAt: nowStr,
      privacy: privacy || "Public",
      driveFileUrl: driveFileUrl || fileUrl,
      driveFolderId: driveFolderId,
      fileExtension: ext,
      fileType: mimeType || "application/octet-stream",
      fileUrl: fileUrl || driveFileUrl,
      description: description || `Berkas ${category || "Sekolah"}`,
      tags: Array.from(new Set([
        isDriveSynced ? "GoogleDrive" : "Server",
        (category || "Umum").split(" ")[0],
        ext.toUpperCase()
      ]))
    };

    const currentData: any = safeReadJSON(DATA_FILE, {});
    const existingFiles: any[] = Array.isArray(currentData.schoolFiles) ? currentData.schoolFiles : [];
    const updatedFiles = [newItem, ...existingFiles.filter(f => f && f.id !== fileId)];
    
    currentData.schoolFiles = updatedFiles;
    safeWriteJSON(DATA_FILE, currentData);

    // Sync to Google Spreadsheet (Data_Berkas)
    const webAppUrl = getEffectiveWebAppUrl();
    if (webAppUrl) {
      try {
        const syncPayload = {
          type: "SYNC_BERKAS",
          payload: [{
            id: fileId,
            name: newItem.name,
            category: newItem.category,
            fileSize: newItem.fileSize,
            fileType: newItem.fileType,
            fileExtension: newItem.fileExtension,
            uploadedAt: newItem.uploadedAt,
            uploadedBy: newItem.uploadedBy,
            uploadedByRole: newItem.uploadedByRole,
            driveFolderId: newItem.driveFolderId || "",
            driveFileUrl: newItem.driveFileUrl || newItem.fileUrl || "",
            privacy: newItem.privacy,
            description: newItem.description,
            tags: newItem.tags ? newItem.tags.join(",") : ""
          }]
        };

        await fetch(webAppUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify(syncPayload),
          redirect: "follow"
        });
      } catch (syncErr: any) {}
    }

    return res.json({
      success: true,
      message: isDriveSynced 
        ? `Berkas "${name}" berhasil disimpan dan disinkronkan ke Google Drive!` 
        : `Berkas "${name}" berhasil disimpan ke server sekolah!`,
      file: newItem,
      isDriveSynced,
      syncWarning: syncWarning || undefined
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: `Gagal memproses berkas: ${err?.message || err}` });
  }
});

// API Route: Download file
app.get("/api/download-file/:fileId", (req, res) => {
  try {
    const { fileId } = req.params;
    const currentData: any = safeReadJSON(DATA_FILE, {});
    const files: any[] = Array.isArray(currentData.schoolFiles) ? currentData.schoolFiles : [];
    const file = files.find(f => f.id === fileId);

    if (!file) {
      return res.status(404).json({ success: false, message: "Berkas tidak ditemukan." });
    }

    if (file.driveFileUrl) {
      return res.redirect(file.driveFileUrl);
    }

    return res.json({ success: true, file });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Gagal mengunduh berkas." });
  }
});

// API Route: Proxy Sync to Google Sheets
app.post("/api/sync-sheets", async (req, res) => {
  try {
    let { webAppUrl, payload } = req.body || {};
    webAppUrl = getEffectiveWebAppUrl(webAppUrl);
    
    // Serverless-optimized timeout (8.5s) to guarantee response before Vercel 10s cutoff
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8500);
    const response = await fetch(webAppUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
      redirect: "follow",
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const text = await response.text();
    let data: any = {};
    let isJson = false;
    try { 
      data = JSON.parse(text); 
      isJson = true;
    } catch (e) { 
      data = { text }; 
    }

    // Persist latest Bangunan & Ruang to DATA_FILE so serverless cache is always up-to-date
    try {
      const parsedPayload = typeof payload === 'string' ? JSON.parse(payload) : payload;
      const toSave = safeReadJSON(DATA_FILE, {});
      let modified = false;
      if (parsedPayload && typeof parsedPayload === 'object') {
        if (parsedPayload.type === 'SYNC_BANGUNAN' && Array.isArray(parsedPayload.payload || parsedPayload.bangunan)) {
          toSave.bangunan = parsedPayload.payload || parsedPayload.bangunan;
          modified = true;
        } else if (parsedPayload.type === 'SYNC_RUANG' && Array.isArray(parsedPayload.payload || parsedPayload.ruang)) {
          toSave.ruang = parsedPayload.payload || parsedPayload.ruang;
          modified = true;
        } else if (parsedPayload.type === 'SYNC_ALL') {
          if (Array.isArray(parsedPayload.bangunan) && parsedPayload.bangunan.length > 0) {
            toSave.bangunan = parsedPayload.bangunan;
            modified = true;
          }
          if (Array.isArray(parsedPayload.ruang) && parsedPayload.ruang.length > 0) {
            toSave.ruang = parsedPayload.ruang;
            modified = true;
          }
        }
      }
      if (modified) {
        safeWriteJSON(DATA_FILE, toSave);
      }
    } catch (cacheErr) {
      console.warn("Failed to update cache on sync:", cacheErr);
    }

    if (!isJson || (typeof text === 'string' && (text.includes('<!DOCTYPE') || text.includes('<html>') || text.includes('Google Accounts')))) {
      return res.json({ 
        success: false, 
        message: "Google Apps Script mengembalikan halaman HTML/Login. Pastikan Web App sudah di-deploy sebagai 'New Version' dengan akses 'Anyone' (Siapa saja)." 
      });
    }

    if (data.status === 'error') {
      return res.json({ success: false, message: data.message || "Gagal dari Google Apps Script", data });
    }

    return res.json({ success: true, data });
  } catch (err: any) {
    return res.json({ success: false, message: err?.message || "Gagal menghubungi endpoint Google Sheets" });
  }
});

// API Route: Proxy Load from Google Sheets (matching server.ts output structure)
app.post("/api/load-sheets", async (req, res) => {
  try {
    const { webAppUrl: rawUrl, spreadsheetUrl } = req.body || {};
    const webAppUrl = getEffectiveWebAppUrl(rawUrl);

    let resolvedSpreadsheetUrl = spreadsheetUrl || "";
    if (resolvedSpreadsheetUrl && !resolvedSpreadsheetUrl.startsWith("http")) {
      resolvedSpreadsheetUrl = `https://docs.google.com/spreadsheets/d/${resolvedSpreadsheetUrl}/edit`;
    }

    let data: any = null;
    let getUrl = webAppUrl;
    if (resolvedSpreadsheetUrl) {
      const separator = getUrl.includes('?') ? '&' : '?';
      getUrl = `${getUrl}${separator}spreadsheetUrl=${encodeURIComponent(resolvedSpreadsheetUrl)}`;
    }

    // 1. Try GET first with 7s timeout for Vercel
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const response = await fetch(getUrl, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const text = await response.text();
      data = JSON.parse(text);
    } catch (getErr) {}

    // 2. If GET did not return valid status === 'success', try POST fallback
    if (!data || data.status !== 'success') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);
        const postRes = await fetch(webAppUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({ type: "LOAD_ALL", spreadsheetUrl: resolvedSpreadsheetUrl }),
          redirect: "follow",
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const postText = await postRes.text();
        data = JSON.parse(postText);
      } catch (postErr) {}
    }

    const cachedData = safeReadJSON(DATA_FILE, {});
    const deletedFileIds: string[] = Array.isArray(cachedData.deletedFileIds) ? cachedData.deletedFileIds : [];
    const deletedSet = new Set(deletedFileIds.map(id => String(id)));

    if (data && data.status === 'success') {
      if (deletedFileIds.length > 0 && Array.isArray(data.berkas)) {
        data.berkas = data.berkas.filter((b: any) => b && b.id && !deletedSet.has(String(b.id)));
      }
      return res.json(data);
    } else {
      // Fallback to locally cached app_data.json
      if (cachedData) {
        const unfilteredFiles = cachedData.schoolFiles || cachedData.files || [];
        const filteredFiles = unfilteredFiles.filter((b: any) => b && b.id && !deletedSet.has(String(b.id)));
        
        return res.json({
          status: 'success',
          source: 'cache',
          siswa: cachedData.students || [],
          ptk: cachedData.teachers || [],
          sarpras: cachedData.sarpras || [],
          bangunan: cachedData.bangunan || [],
          ruang: cachedData.ruang || [],
          kibB: cleanKibB(cachedData.kibB),
          rapor: cachedData.reports || [],
          administrator: cachedData.administrators || [],
          aplikasi: cachedData.aplikasiLinks || [],
          notifikasi: cachedData.notifications || [],
          permintaanAkses: cachedData.permintaanAkses || [],
          berkas: filteredFiles
        });
      }

      return res.json({
        status: 'error',
        message: data?.message || 'Tidak dapat memuat data dari Spreadsheet saat ini.'
      });
    }
  } catch (err: any) {
    const cached = safeReadJSON(DATA_FILE, null);
    if (cached) {
      const deletedFileIds: string[] = Array.isArray(cached.deletedFileIds) ? cached.deletedFileIds : [];
      const deletedSet = new Set(deletedFileIds.map(id => String(id)));
      const unfilteredFiles = cached.schoolFiles || cached.files || [];
      const filteredFiles = unfilteredFiles.filter((b: any) => b && b.id && !deletedSet.has(String(b.id)));

      return res.json({
        status: 'success',
        source: 'cache',
        siswa: cached.students || [],
        ptk: cached.teachers || [],
        sarpras: cached.sarpras || [],
        bangunan: cached.bangunan || [],
        ruang: cached.ruang || [],
        kibB: cleanKibB(cached.kibB),
        rapor: cached.reports || [],
        administrator: cached.administrators || [],
        aplikasi: cached.aplikasiLinks || [],
        notifikasi: cached.notifications || [],
        permintaanAkses: cached.permintaanAkses || [],
        berkas: filteredFiles
      });
    }
    return res.status(500).json({ status: 'error', message: err?.message || "Gagal load dari Google Sheets" });
  }
});

// API Route: Delete File
app.post("/api/delete-file", async (req, res) => {
  try {
    const { fileId, fileName, driveFileUrl, webAppUrl: incomingUrl } = req.body || {};
    if (!fileId) {
      return res.status(400).json({ success: false, message: "fileId is required" });
    }

    const currentData: any = safeReadJSON(DATA_FILE, {});
    const currentDeleted: string[] = Array.isArray(currentData.deletedFileIds) ? currentData.deletedFileIds : [];
    const updatedDeleted = Array.from(new Set([...currentDeleted, String(fileId)]));
    
    const currentFiles: any[] = Array.isArray(currentData.schoolFiles) ? currentData.schoolFiles : [];
    const targetFile = currentFiles.find(f => String(f.id) === String(fileId));
    const targetName = fileName || targetFile?.name || targetFile?.["Nama Berkas"] || "";
    const targetUrl = driveFileUrl || targetFile?.driveFileUrl || targetFile?.["Link Drive"] || "";

    const updatedSchoolFiles = currentFiles.filter(f => String(f.id) !== String(fileId));
    currentData.deletedFileIds = updatedDeleted;
    currentData.schoolFiles = updatedSchoolFiles;
    safeWriteJSON(DATA_FILE, currentData);

    // Trigger deletion in Google Spreadsheet via Apps Script
    const activeWebAppUrl = getEffectiveWebAppUrl(incomingUrl);
    let gasDeleted = false;
    let gasMessage = "";

    if (activeWebAppUrl) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const gasRes = await fetch(activeWebAppUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            type: "DELETE_BERKAS",
            id: fileId,
            fileId: fileId,
            fileName: targetName,
            driveFileUrl: targetUrl
          }),
          redirect: "follow",
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (gasRes.ok) {
          const text = await gasRes.text();
          try {
            const json = JSON.parse(text);
            if (json && json.status === "success") {
              gasDeleted = true;
              gasMessage = json.message || "Baris berkas terhapus dari spreadsheet.";
            }
          } catch (e) {}
        }
      } catch (gasErr: any) {}
    }

    return res.json({
      success: true,
      message: gasDeleted 
        ? "Berkas berhasil terhapus dari riwayat aplikasi dan spreadsheet!" 
        : "Berkas berhasil terhapus dari riwayat aplikasi!",
      fileId,
      gasDeleted,
      gasMessage
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || "Gagal menghapus berkas." });
  }
});

// API Route: Get Shared App Data Cache
app.get("/api/app-data", async (req, res) => {
  try {
    const data = safeReadJSON(DATA_FILE, {});
    if (Array.isArray(data.kibB)) {
      data.kibB = cleanKibB(data.kibB);
    }
    
    const deletedFileIds: string[] = Array.isArray(data.deletedFileIds) ? data.deletedFileIds : [];
    const deletedSet = new Set(deletedFileIds.map(id => String(id)));
    
    // Also attempt quick load from Google Sheets to merge
    const webAppUrl = getEffectiveWebAppUrl();
    let spreadsheetFiles: any[] = [];
    
    if (webAppUrl) {
      try {
        const configObj = safeReadJSON(CONFIG_FILE, null);
        let spreadsheetUrl = configObj?.spreadsheetUrl || "";
        if (spreadsheetUrl && !spreadsheetUrl.startsWith("http")) {
          spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetUrl}/edit`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);
        const sheetsRes = await fetch(webAppUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({ type: "LOAD_ALL", spreadsheetUrl }),
          redirect: "follow",
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (sheetsRes.ok) {
          const sheetsData = await sheetsRes.json();
          if (sheetsData && sheetsData.status === "success") {
            const rawBerkas = sheetsData.berkas || sheetsData["Data_Berkas"] || sheetsData["Data Berkas"] || sheetsData.schoolFiles || sheetsData.files;
            if (Array.isArray(rawBerkas)) {
              spreadsheetFiles = rawBerkas;
            }
            if (Array.isArray(sheetsData.schoolAccounts) && sheetsData.schoolAccounts.length > 0) {
              data.schoolAccounts = sheetsData.schoolAccounts;
            }
          }
        }
      } catch (e: any) {}
    }

    const localFiles = Array.isArray(data.schoolFiles) ? data.schoolFiles : [];
    const fileMap = new Map<string, any>();
    
    for (let idx = 0; idx < spreadsheetFiles.length; idx++) {
      const f = spreadsheetFiles[idx];
      if (f && (f.id || f["Nama Berkas"] || f.name || f["Link Drive"] || f.driveFileUrl)) {
        const fileId = String(f.id || f.fileId || `BRK-S-${idx}`);
        fileMap.set(fileId, {
          id: fileId,
          name: f["Nama Berkas"] || f.name || f.Name || "Berkas Dokumen",
          category: f["Kategori"] || f.category || f.Category || "Umum",
          fileSize: Number(f["Ukuran File"] || f.fileSize || f.FileSize || f.size || 0),
          fileType: f.fileType || f.FileType || "application/octet-stream",
          fileExtension: f.fileExtension || f.FileExtension || "",
          uploadedAt: f["Tanggal"] || f.uploadedAt || f.UploadedAt || "",
          uploadedBy: f["Nama Pengirim/Orang Tua"] || f.uploadedBy || f.UploadedBy || "Tamu / Orang Tua",
          uploadedByRole: f.uploadedByRole || f.UploadedByRole || "Tamu / Umum",
          driveFileUrl: f["Link Drive"] || f.driveFileUrl || f.DriveFileUrl || f.url || "",
          driveFolderId: f.driveFolderId || f.DriveFolderId || "",
          privacy: f.privacy || f.Privacy || "Public",
          description: f.description || f.Description || ""
        });
      }
    }
    
    for (const f of localFiles) {
      if (f && f.id) {
        fileMap.set(String(f.id), f);
      }
    }
    
    let mergedFiles = Array.from(fileMap.values());
    if (deletedSet.size > 0) {
      mergedFiles = mergedFiles.filter(f => f && f.id && !deletedSet.has(String(f.id)));
    }
    
    data.schoolFiles = mergedFiles;
    safeWriteJSON(DATA_FILE, data);
    
    if (deletedFileIds.length > 0 && Array.isArray(data.files)) {
      data.files = data.files.filter((f: any) => f && f.id && !deletedSet.has(String(f.id)));
    }
    
    return res.json(data);
  } catch (e: any) {
    const data = safeReadJSON(DATA_FILE, {});
    return res.json(data);
  }
});

// API Route: Save Shared App Data Cache
app.post("/api/app-data", (req, res) => {
  try {
    const incoming = req.body;
    const currentData = safeReadJSON(DATA_FILE, {
      notifications: [],
      permintaanAkses: [],
      schoolFiles: [],
      deletedNotifIds: [],
      deletedPermintaanAksesIds: [],
      deletedFileIds: []
    });

    const mergedDeleted = Array.from(new Set([...(currentData.deletedNotifIds || []), ...(incoming.deletedNotifIds || [])]));
    const incomingDeletedReqs = Array.isArray(incoming.deletedPermintaanAksesIds)
      ? incoming.deletedPermintaanAksesIds
      : (incoming.deletedPermintaanAksesId ? [incoming.deletedPermintaanAksesId] : []);
    const mergedDeletedReqs = Array.from(new Set([...(currentData.deletedPermintaanAksesIds || []), ...incomingDeletedReqs]));

    const incomingDeletedFiles = Array.isArray(incoming.deletedFileIds)
      ? incoming.deletedFileIds
      : (incoming.deletedFileId ? [incoming.deletedFileId] : []);
    const mergedDeletedFiles = Array.from(new Set([...(currentData.deletedFileIds || []), ...incomingDeletedFiles]));

    // Handle notifications
    let mergedNotifs: any[] = [];
    const deletedSet = new Set<string>(['notif-1', 'notif-2', 'notif-3', ...mergedDeleted]);
    if (Array.isArray(incoming.notifications)) {
      mergedNotifs = incoming.notifications.filter((n: any) => n && n.id && !deletedSet.has(String(n.id)));
    } else {
      const currentNotifs: any[] = Array.isArray(currentData.notifications) ? currentData.notifications : [];
      mergedNotifs = currentNotifs.filter((n: any) => n && n.id && !deletedSet.has(String(n.id)));
    }
    mergedNotifs.sort((a: any, b: any) => {
      const timeA = a.time ? new Date(a.time).getTime() : 0;
      const timeB = b.time ? new Date(b.time).getTime() : 0;
      return timeB - timeA;
    });

    // Handle requests
    let mergedRequests: any[] = [];
    const deletedReqSet = new Set<string>(mergedDeletedReqs);
    if (Array.isArray(incoming.permintaanAkses)) {
      mergedRequests = incoming.permintaanAkses.filter((r: any) => r && r.id && !deletedReqSet.has(String(r.id)));
    } else {
      const currentRequests: any[] = Array.isArray(currentData.permintaanAkses) ? currentData.permintaanAkses : [];
      mergedRequests = currentRequests.filter((r: any) => r && r.id && !deletedReqSet.has(String(r.id)));
    }
    mergedRequests.sort((a: any, b: any) => {
      const timeA = a.requestedAt ? new Date(a.requestedAt).getTime() : 0;
      const timeB = b.requestedAt ? new Date(b.requestedAt).getTime() : 0;
      return timeB - timeA;
    });

    // Handle files
    let mergedFiles: any[] = [];
    const delFileSet = new Set<string>(mergedDeletedFiles);
    if (Array.isArray(incoming.schoolFiles)) {
      mergedFiles = incoming.schoolFiles.filter((f: any) => f && f.id && !delFileSet.has(String(f.id)));
    } else {
      const currentFilesList: any[] = Array.isArray(currentData.schoolFiles) ? currentData.schoolFiles : (Array.isArray(currentData.files) ? currentData.files : []);
      mergedFiles = currentFilesList.filter((f: any) => f && f.id && !delFileSet.has(String(f.id)));
    }
    mergedFiles.sort((a: any, b: any) => {
      const timeA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
      const timeB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
      return timeB - timeA;
    });

    const finalData = {
      ...currentData,
      ...incoming,
      bangunan: incoming.bangunan !== undefined
        ? (Array.isArray(incoming.bangunan) ? incoming.bangunan : [])
        : (Array.isArray(currentData.bangunan) ? currentData.bangunan : []),
      ruang: incoming.ruang !== undefined
        ? (Array.isArray(incoming.ruang) ? incoming.ruang : [])
        : (Array.isArray(currentData.ruang) ? currentData.ruang : []),
      kibB: cleanKibB(incoming.kibB !== undefined ? incoming.kibB : (currentData.kibB || [])),
      schoolAccounts: incoming.schoolAccounts !== undefined ? incoming.schoolAccounts : (currentData.schoolAccounts || []),
      deletedNotifIds: mergedDeleted,
      deletedPermintaanAksesIds: mergedDeletedReqs,
      deletedFileIds: mergedDeletedFiles,
      notifications: mergedNotifs,
      permintaanAkses: mergedRequests,
      schoolFiles: mergedFiles
    };

    safeWriteJSON(DATA_FILE, finalData);
    return res.json({ success: true, notifications: mergedNotifs, permintaanAkses: mergedRequests, schoolFiles: mergedFiles });
  } catch (err) {
    return res.status(500).json({ success: false, message: (err as Error).message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

export default serverless(app);
