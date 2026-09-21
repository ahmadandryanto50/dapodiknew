import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

let CONFIG_FILE = path.join(process.cwd(), "sync_config.json");
let DATA_FILE = path.join(process.cwd(), "app_data.json");
let UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

const DEFAULT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwOjTnhqqQFCvRGK_5NPVICqUbK-yHUTq1b0CwX3aXqcYjOITfoaogfBWDS3I1bdL6hZA/exec";

function normalizeWebAppUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  let url = rawUrl.trim();
  if (!url) return "";
  url = url.replace(/^[<"']+|[>"']+$/g, "").trim();
  if (url.includes("script.google.com/macros/s/")) {
    url = url.replace(/\/+$/, "");
    if (url.endsWith("/edit")) {
      url = url.replace(/\/edit$/, "/exec");
    } else if (!url.endsWith("/exec") && !url.endsWith("/dev")) {
      url = `${url}/exec`;
    }
  }
  return url;
}

function getEffectiveWebAppUrl(incomingUrl?: string): string {
  if (incomingUrl && typeof incomingUrl === "string" && incomingUrl.trim().startsWith("http")) {
    return normalizeWebAppUrl(incomingUrl.trim());
  }
  const config = safeReadJSON(CONFIG_FILE, null);
  if (config && config.webAppUrl && typeof config.webAppUrl === "string" && config.webAppUrl.trim().startsWith("http")) {
    return normalizeWebAppUrl(config.webAppUrl.trim());
  }
  return DEFAULT_WEB_APP_URL;
}

try {
  // Test if the current working directory is writeable (fails on read-only serverless like Cloud Run)
  const testFile = path.join(process.cwd(), ".write_test_" + Date.now());
  let isReadOnly = false;
  try {
    fs.writeFileSync(testFile, "test");
    fs.unlinkSync(testFile);
  } catch (e) {
    isReadOnly = true;
  }

  // Force /tmp in production or if read-only filesystem is detected
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

    // Copy initial seed files from read-only directory to writeable /tmp if not already there
    const srcConfig = path.join(process.cwd(), "sync_config.json");
    const srcData = path.join(process.cwd(), "app_data.json");

    if (fs.existsSync(srcConfig) && !fs.existsSync(tmpConfig)) {
      fs.copyFileSync(srcConfig, tmpConfig);
    }
    if (fs.existsSync(srcData) && !fs.existsSync(tmpData)) {
      fs.copyFileSync(srcData, tmpData);
    }

    CONFIG_FILE = tmpConfig;
    DATA_FILE = tmpData;
    UPLOADS_DIR = tmpUploads;
    console.log("Using writeable /tmp filesystem for serverless environment:", { CONFIG_FILE, DATA_FILE, UPLOADS_DIR });
  } else {
    // Standard workspace local write check
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }
} catch (e) {
  console.error("Failed to setup writeable directories, falling back to defaults:", e);
  if (!fs.existsSync(UPLOADS_DIR)) {
    try {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    } catch (err) {}
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
  } catch (err) {
    console.error(`Error reading ${path.basename(filePath)}:`, err);
  }
  return fallback;
}

function safeWriteJSON(filePath: string, data: any) {
  try {
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    console.error(`Error writing ${path.basename(filePath)}:`, err);
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {}
  }
}

function cleanKibB(items: any[] = []): any[] {
  if (!Array.isArray(items)) return [];
  return items.filter((item: any) => item && typeof item === 'object' && (item.namaBarang || item.kodeBarang || item.id || item.merkType));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable CORS headers for all origins to prevent "Failed to fetch" due to iframe sandboxes, cross-origin developer/shared containers, or custom domains
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Support JSON & URL-encoded bodies up to 50MB (for file uploads and base64 strings from mobile/browsers)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Prevent caching on all API responses so multi-device/browser sync is always instantaneous and fresh
  app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    next();
  });

  // API Route: Get Shared Sync Config
  app.get("/api/sync-config", (req, res) => {
    const config = safeReadJSON(CONFIG_FILE, null);
    if (config && config.webAppUrl) {
      return res.json(config);
    }
    // Fallback to default
    return res.json({
      spreadsheetUrl: "1XmLmshCOhSktRfzW8uG_8RqxlxVCQt5eUVekEFLwj_M",
      webAppUrl: getEffectiveWebAppUrl(),
      sheetId: "",
      autoSync: true,
      lastSynced: null,
      status: "connected",
      mode: "appscript"
    });
  });

  // Serve uploaded files statically with correct cache & CORS headers
  app.use("/uploads", express.static(UPLOADS_DIR, {
    maxAge: '1d',
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }));

  // API Route: Unified Rock-Solid File Upload (Works on Mobile / All Browsers + Drive Backup)
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

      // If we are only saving metadata from a direct client-side upload
      if (onlySaveMetadata) {
        fileUrl = providedDriveUrl || "";
      } else {
        if (!base64Data) {
          return res.status(400).json({ success: false, message: "Data berkas (base64) diperlukan." });
        }

        // Extract raw base64 string
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
          console.warn("Local FS write failed, proceeding as memory only:", fsErr);
          fileUrl = `data:${mimeType || "application/octet-stream"};base64,${cleanBase64.substring(0, 100)}...`;
        }

        // Try uploading to Google Apps Script (with robust 45s timeout to allow large file transfers)
        const webAppUrl = getEffectiveWebAppUrl();

        if (webAppUrl) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 45000);

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

            if (scriptRes.status === 403) {
              syncWarning = "Google Apps Script mengembalikan error 403 Forbidden. Harap pastikan setelan 'Who has access' (Siapa yang memiliki akses) diatur ke 'Anyone' (Siapa saja) saat melakukan deployment Web App.";
              console.warn("Apps Script 403 Forbidden detected.");
            } else if (!scriptRes.ok) {
              syncWarning = `Google Apps Script mengembalikan HTTP status ${scriptRes.status}`;
            } else {
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
            console.warn("Apps Script Drive sync warning in /api/upload-file:", scriptErr?.message || scriptErr);
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

      // Persist directly to app_data.json
      const currentData: any = safeReadJSON(DATA_FILE, {});
      const existingFiles: any[] = Array.isArray(currentData.schoolFiles) ? currentData.schoolFiles : [];
      const updatedFiles = [newItem, ...existingFiles.filter(f => f && f.id !== fileId)];
      
      currentData.schoolFiles = updatedFiles;
      safeWriteJSON(DATA_FILE, currentData);

      // SINKRONISASI KE GOOGLE SPREADSHEET (Data_Berkas Sheet)
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
              tags: newItem.tags ? newItem.tags.join(",") : "",
              allowedUserIds: "",
              allowedRoles: ""
            }]
          };

          const sheetsSyncRes = await fetch(webAppUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify(syncPayload),
            redirect: "follow"
          });
          
          if (sheetsSyncRes.ok) {
            console.log(`Successfully synced uploaded file "${newItem.name}" metadata to Google Sheets Data_Berkas.`);
          } else {
            console.warn(`Failed to sync uploaded file metadata to Google Sheets. Status: ${sheetsSyncRes.status}`);
          }
        } catch (syncErr: any) {
          console.warn("Spreadsheet file sync error in upload-file:", syncErr?.message || syncErr);
        }
      }

      return res.json({
        success: true,
        message: isDriveSynced 
          ? `Berkas "${name}" berhasil disimpan dan disinkronkan ke Google Drive!` 
          : `Berkas "${name}" berhasil disimpan ke server sekolah dan dapat diakses semua perangkat!`,
        file: newItem,
        isDriveSynced,
        syncWarning: syncWarning || undefined
      });
    } catch (err: any) {
      console.error("Error in /api/upload-file:", err);
      return res.status(500).json({
        success: false,
        message: `Gagal memproses berkas: ${err?.message || err}`
      });
    }
  });

  // API Route: Download file directly
  app.get("/api/download-file/:fileId", (req, res) => {
    try {
      const { fileId } = req.params;
      const currentData: any = safeReadJSON(DATA_FILE, {});
      const files: any[] = Array.isArray(currentData.schoolFiles) ? currentData.schoolFiles : [];
      const targetFile = files.find(f => String(f.id) === String(fileId));

      if (fs.existsSync(UPLOADS_DIR)) {
        const allFiles = fs.readdirSync(UPLOADS_DIR);
        const match = allFiles.find(fname => fname.startsWith(fileId));
        if (match) {
          const fullPath = path.join(UPLOADS_DIR, match);
          return res.download(fullPath, targetFile?.name || match);
        }
      }

      if (targetFile?.driveFileUrl && targetFile.driveFileUrl.startsWith("http")) {
        return res.redirect(targetFile.driveFileUrl);
      }

      return res.status(404).send("File tidak ditemukan.");
    } catch (e: any) {
      return res.status(500).send("Gagal mengunduh file.");
    }
  });

  // API Route: Proxy Sync to Google Sheets (bypasses browser CORS & mobile restrictions)
  app.post("/api/sync-sheets", async (req, res) => {
    try {
      let { webAppUrl, payload } = req.body || {};
      webAppUrl = getEffectiveWebAppUrl(webAppUrl);
      
      let parsedPayload = payload;
      if (typeof payload === 'string') {
        try {
          parsedPayload = JSON.parse(payload);
        } catch (e) {}
      }

      if (parsedPayload && typeof parsedPayload === 'object') {
        let sUrl = parsedPayload.spreadsheetUrl || "";
        if (sUrl && !sUrl.startsWith("http")) {
          parsedPayload.spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${sUrl}/edit`;
        }
        payload = parsedPayload;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 180 seconds timeout for file uploads
      
      const response = await fetch(webAppUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: typeof payload === 'string' ? payload : JSON.stringify(payload),
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

      if (!isJson || (typeof text === 'string' && (text.includes('<!DOCTYPE') || text.includes('<html>') || text.includes('Google Accounts')))) {
        return res.json({ 
          success: false, 
          message: "Google Apps Script mengembalikan halaman HTML/Login. Pastikan Web App sudah di-deploy sebagai 'New Version' dengan akses 'Anyone' (Siapa saja)." 
        });
      }

      if (data.status === 'error') {
        return res.json({ success: false, message: data.message || "Gagal dari Google Apps Script", data });
      }

      // Persist latest Bangunan & Ruang to DATA_FILE so server-side cache is always up-to-date
      try {
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
      } catch (saveErr) {}

      return res.json({ success: true, data });
    } catch (err: any) {
      console.warn("Proxying to Google Sheets warning in /api/sync-sheets:", err?.message || err);
      return res.json({ success: false, message: err?.message || "Gagal menghubungi endpoint Google Sheets" });
    }
  });

  // API Route: Proxy Load from Google Sheets
  app.post("/api/load-sheets", async (req, res) => {
    try {
      const { webAppUrl, spreadsheetUrl } = req.body;
      if (!webAppUrl) {
        return res.status(400).json({ success: false, message: "webAppUrl is required" });
      }

      let resolvedSpreadsheetUrl = spreadsheetUrl || "";
      if (resolvedSpreadsheetUrl && !resolvedSpreadsheetUrl.startsWith("http")) {
        resolvedSpreadsheetUrl = `https://docs.google.com/spreadsheets/d/${resolvedSpreadsheetUrl}/edit`;
      }

      let data: any = null;

      // Append spreadsheetUrl as query parameter for GET requests
      let getUrl = webAppUrl;
      if (resolvedSpreadsheetUrl) {
        const separator = getUrl.includes('?') ? '&' : '?';
        getUrl = `${getUrl}${separator}spreadsheetUrl=${encodeURIComponent(resolvedSpreadsheetUrl)}`;
      }

      // 1. Try GET first with 60s timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout
        const response = await fetch(getUrl, {
          method: "GET",
          redirect: "follow",
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch (e) {}
      } catch (getErr) {
        // GET failed or timed out, attempt server-side POST fallback
      }

      // 2. If GET did not return valid status === 'success', try POST fallback on server
      if (!data || data.status !== 'success') {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout
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

      // Filter out deleted files permanently across devices
      const cachedData = safeReadJSON(DATA_FILE, {});
      const deletedFileIds: string[] = Array.isArray(cachedData.deletedFileIds) ? cachedData.deletedFileIds : [];
      const deletedSet = new Set(deletedFileIds.map(id => String(id)));

      if (data && data.status === 'success') {
        if (deletedFileIds.length > 0 && Array.isArray(data.berkas)) {
          data.berkas = data.berkas.filter((b: any) => b && b.id && !deletedSet.has(String(b.id)));
        }

        // Immediately persist the fresh Google Sheets data into DATA_FILE so any visitor or device has the latest data
        try {
          const toSave = safeReadJSON(DATA_FILE, {});
          if (Array.isArray(data.siswa) && data.siswa.length > 0) toSave.students = data.siswa;
          if (Array.isArray(data.ptk) && data.ptk.length > 0) toSave.teachers = data.ptk;
          if (Array.isArray(data.sarpras)) toSave.sarpras = data.sarpras;
          if (Array.isArray(data.bangunan) && data.bangunan.length > 0) toSave.bangunan = data.bangunan;
          if (Array.isArray(data.ruang) && data.ruang.length > 0) toSave.ruang = data.ruang;
          if (Array.isArray(data.kibB)) toSave.kibB = cleanKibB(data.kibB);
          if (Array.isArray(data.rapor)) toSave.reports = data.rapor;
          if (Array.isArray(data.administrator) && data.administrator.length > 0) toSave.administrators = data.administrator;
          if (Array.isArray(data.aplikasi) && data.aplikasi.length > 0) toSave.aplikasiLinks = data.aplikasi;
          if (Array.isArray(data.notifikasi)) toSave.notifications = data.notifikasi;
          if (Array.isArray(data.schoolAccounts) && data.schoolAccounts.length > 0) toSave.schoolAccounts = data.schoolAccounts;
          if (Array.isArray(data.berkas)) {
            const existingFiles: any[] = Array.isArray(toSave.schoolFiles) ? toSave.schoolFiles : [];
            const existingMap = new Map(existingFiles.map((f: any) => [String(f.id), f]));
            for (const b of data.berkas) {
              if (b && b.id && !deletedSet.has(String(b.id))) {
                existingMap.set(String(b.id), { ...existingMap.get(String(b.id)), ...b });
              }
            }
            toSave.schoolFiles = Array.from(existingMap.values());
          }
          safeWriteJSON(DATA_FILE, toSave);
        } catch (saveErr) {
          console.error("Error updating DATA_FILE in /api/load-sheets:", saveErr);
        }

        return res.json(data);
      } else {
        // Fallback to locally cached app_data.json so multi-device/browser sync never fails
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
      console.warn("Proxying from Google Sheets warning in /api/load-sheets:", err?.message || err);
      // Fallback to locally cached app_data.json
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
      return res.json({ status: 'error', message: err?.message || 'Gagal memuat data dari Google Sheets' });
    }
  });

  // API Route: Save Shared Sync Config
  app.post("/api/sync-config", (req, res) => {
    try {
      const config = req.body || {};
      if (config.webAppUrl) {
        config.webAppUrl = normalizeWebAppUrl(config.webAppUrl);
      }
      safeWriteJSON(CONFIG_FILE, config);
      try {
        const rootConfigFile = path.join(process.cwd(), "sync_config.json");
        if (CONFIG_FILE !== rootConfigFile) {
          safeWriteJSON(rootConfigFile, config);
        }
      } catch (e) {}
      return res.json({ success: true, config });
    } catch (err) {
      console.error("Error writing sync_config.json:", err);
      return res.status(500).json({ success: false, message: (err as Error).message });
    }
  });

  // API Route: Get Shared App Data Cache
  app.get("/api/app-data", (req, res) => {
    try {
      const data = safeReadJSON(DATA_FILE, {});
      if (Array.isArray(data.kibB)) {
        data.kibB = cleanKibB(data.kibB);
      }
      
      // Filter out deleted files permanently across devices
      const deletedFileIds: string[] = Array.isArray(data.deletedFileIds) ? data.deletedFileIds : [];
      const deletedSet = new Set(deletedFileIds.map(id => String(id)));
      
      if (deletedFileIds.length > 0) {
        if (Array.isArray(data.schoolFiles)) {
          data.schoolFiles = data.schoolFiles.filter((f: any) => f && f.id && !deletedSet.has(String(f.id)));
        }
        if (Array.isArray(data.files)) {
          data.files = data.files.filter((f: any) => f && f.id && !deletedSet.has(String(f.id)));
        }
      }
      
      return res.json(data);
    } catch (e: any) {
      console.error("Error in GET /api/app-data:", e);
      // Fail-safe: return local cache
      const data = safeReadJSON(DATA_FILE, {});
      return res.json(data);
    }
  });

  // API Route: Delete File & Sync to Google Spreadsheet
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

      // Remove from disk if present
      if (fs.existsSync(UPLOADS_DIR)) {
        try {
          const filesOnDisk = fs.readdirSync(UPLOADS_DIR);
          const matches = filesOnDisk.filter(f => f.startsWith(String(fileId)));
          for (const match of matches) {
            try {
              fs.unlinkSync(path.join(UPLOADS_DIR, match));
            } catch (e) {}
          }
        } catch (e) {}
      }

      // Filter out deleted file from schoolFiles in app_data.json
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
        } catch (gasErr: any) {
          console.warn("Spreadsheet deletion warning in /api/delete-file:", gasErr?.message || gasErr);
        }
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
      console.error("Error in /api/delete-file:", err);
      return res.status(500).json({ success: false, message: err?.message || "Gagal menghapus berkas." });
    }
  });

  // API Route: Save Shared App Data Cache
  app.post("/api/app-data", (req, res) => {
    try {
      const incoming = req.body || {};
      const currentData: any = safeReadJSON(DATA_FILE, {});

      // Merge deletedNotifIds
      const currentDeleted: string[] = Array.isArray(currentData.deletedNotifIds) ? currentData.deletedNotifIds : [];
      const incomingDeleted: string[] = Array.isArray(incoming.deletedNotifIds) ? incoming.deletedNotifIds : [];
      const mergedDeleted = Array.from(new Set([...currentDeleted, ...incomingDeleted]));

      // Merge deletedPermintaanAksesIds
      const currentDeletedReqs: string[] = Array.isArray(currentData.deletedPermintaanAksesIds) ? currentData.deletedPermintaanAksesIds : [];
      const incomingDeletedReqs: string[] = Array.isArray(incoming.deletedPermintaanAksesIds)
        ? incoming.deletedPermintaanAksesIds
        : (incoming.deletedPermintaanAksesId ? [incoming.deletedPermintaanAksesId] : []);
      const mergedDeletedReqs = Array.from(new Set([...currentDeletedReqs, ...incomingDeletedReqs]));

      // Merge deletedFileIds
      const currentDeletedFiles: string[] = Array.isArray(currentData.deletedFileIds) ? currentData.deletedFileIds : [];
      const incomingDeletedFiles: string[] = Array.isArray(incoming.deletedFileIds)
        ? incoming.deletedFileIds
        : (incoming.deletedFileId ? [incoming.deletedFileId] : []);
      const mergedDeletedFiles = Array.from(new Set([...currentDeletedFiles, ...incomingDeletedFiles]));

      // Sync deletion to Google Apps Script Spreadsheet & remove local disk files
      if (incomingDeletedFiles.length > 0) {
        if (fs.existsSync(UPLOADS_DIR)) {
          try {
            const filesOnDisk = fs.readdirSync(UPLOADS_DIR);
            for (const delId of incomingDeletedFiles) {
              const matches = filesOnDisk.filter(f => f.startsWith(String(delId)));
              for (const match of matches) {
                try {
                  fs.unlinkSync(path.join(UPLOADS_DIR, match));
                } catch (e) {}
              }
            }
          } catch (e) {}
        }

        // Trigger row deletion in Google Spreadsheet (Data_Berkas sheet)
        const webAppUrl = getEffectiveWebAppUrl(incoming.webAppUrl);
        if (webAppUrl) {
          const currentFilesList: any[] = Array.isArray(currentData.schoolFiles) ? currentData.schoolFiles : (Array.isArray(currentData.files) ? currentData.files : []);
          for (const delId of incomingDeletedFiles) {
            const targetFile = currentFilesList.find((f: any) => String(f.id) === String(delId)) || incoming.deletedFile;
            const fileName = targetFile?.name || targetFile?.["Nama Berkas"] || incoming.fileName || "";
            const driveFileUrl = targetFile?.driveFileUrl || targetFile?.["Link Drive"] || incoming.driveFileUrl || "";

            try {
              fetch(webAppUrl, {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({
                  type: "DELETE_BERKAS",
                  id: delId,
                  fileId: delId,
                  fileName: fileName,
                  driveFileUrl: driveFileUrl
                }),
                redirect: "follow"
              }).catch(err => console.warn("Spreadsheet row deletion sync error:", err?.message || err));
            } catch (syncErr) {
              console.warn("Could not send spreadsheet row deletion request:", syncErr);
            }
          }
        }
      }

      // Handle schoolFiles with smart merging by ID across multiple devices & browsers
      let mergedFiles: any[] = [];
      const delFileSet = new Set<string>(mergedDeletedFiles);
      const currentFilesList: any[] = Array.isArray(currentData.schoolFiles) ? currentData.schoolFiles : (Array.isArray(currentData.files) ? currentData.files : []);
      
      const fileMap = new Map<string, any>();
      for (const f of currentFilesList) {
        if (f && f.id && !delFileSet.has(String(f.id))) {
          fileMap.set(String(f.id), f);
        }
      }
      const incFiles = Array.isArray(incoming.schoolFiles) ? incoming.schoolFiles : (Array.isArray(incoming.berkas) ? incoming.berkas : (Array.isArray(incoming.files) ? incoming.files : []));
      if (incFiles.length > 0) {
        for (let idx = 0; idx < incFiles.length; idx++) {
          const f = incFiles[idx];
          if (f && (f.id || f.name || f["Nama Berkas"] || f.driveFileUrl || f["Link Drive"])) {
            const fileId = String(f.id || f.fileId || `BRK-I-${idx}`);
            if (!delFileSet.has(fileId)) {
              fileMap.set(fileId, {
                id: fileId,
                name: f.name || f["Nama Berkas"] || f.Name || "Berkas Dokumen",
                category: f.category || f["Kategori"] || f.Category || "Umum",
                fileSize: Number(f.fileSize || f["Ukuran File"] || f.FileSize || f.size || 0),
                fileType: f.fileType || f.FileType || "application/octet-stream",
                fileExtension: f.fileExtension || f.FileExtension || "",
                uploadedAt: f.uploadedAt || f["Tanggal"] || f.UploadedAt || "",
                uploadedBy: f.uploadedBy || f["Nama Pengirim/Orang Tua"] || f.UploadedBy || "Tamu / Orang Tua",
                uploadedByRole: f.uploadedByRole || f.UploadedByRole || "Tamu / Umum",
                driveFileUrl: f.driveFileUrl || f["Link Drive"] || f.DriveFileUrl || f.url || "",
                driveFolderId: f.driveFolderId || f.DriveFolderId || "",
                privacy: f.privacy || f.Privacy || "Public",
                description: f.description || f.Description || ""
              });
            }
          }
        }
      }
      mergedFiles = Array.from(fileMap.values());
      mergedFiles.sort((a: any, b: any) => {
        const timeA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
        const timeB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
        return timeB - timeA;
      });

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

      // Handle permintaanAkses
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
      console.error("Error writing app_data.json:", err);
      return res.status(500).json({ success: false, message: (err as Error).message });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
