import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

let CONFIG_FILE = path.join(process.cwd(), "sync_config.json");
let DATA_FILE = path.join(process.cwd(), "app_data.json");
let UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

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

async function startServer() {
  const app = express();
  const PORT = 3000;

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
      webAppUrl: "https://script.google.com/macros/s/AKfycbyhC26e6a4a0ORdBvnMCz7c1pDR0rQsGkcO_LfVKhxAZGYtBMGle4qbjZoNx6D_uT79/exec",
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
        folderName
      } = req.body || {};

      if (!name || !base64Data) {
        return res.status(400).json({ success: false, message: "Nama berkas dan data berkas (base64) diperlukan." });
      }

      // Extract raw base64 string
      let cleanBase64 = String(base64Data);
      if (cleanBase64.includes(",")) {
        cleanBase64 = cleanBase64.split(",")[1];
      }

      const buffer = Buffer.from(cleanBase64, "base64");
      const fileSize = buffer.length;
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const safeName = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, "_");
      const storedFileName = `${fileId}_${safeName}`;
      const localFilePath = path.join(UPLOADS_DIR, storedFileName);

      fs.writeFileSync(localFilePath, buffer);

      const fileUrl = `/uploads/${storedFileName}`;
      const ext = name.split(".").pop()?.toLowerCase() || "dat";
      const nowStr = new Date().toISOString().replace("T", " ").substring(0, 16);

      let driveResult: any = null;

      // Try uploading to Google Apps Script (with 12s timeout to avoid mobile browser hang)
      const savedConfig = safeReadJSON(CONFIG_FILE, null);
      const webAppUrl = savedConfig?.webAppUrl || "https://script.google.com/macros/s/AKfycbyhC26e6a4a0ORdBvnMCz7c1pDR0rQsGkcO_LfVKhxAZGYtBMGle4qbjZoNx6D_uT79/exec";

      if (webAppUrl) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);

          const scriptRes = await fetch(webAppUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({
              type: "UPLOAD_FILE_TO_DRIVE",
              fileName: name,
              mimeType: mimeType || "application/octet-stream",
              base64Data: cleanBase64,
              folderName: folderName || category || "Berkas Dapodik",
              description: description || `Berkas resmi ${category || "Dapodik"}`,
              parentFolderId: "1OFVFI1xhsk45_ONTihtuSHeBVvEOr44m"
            }),
            redirect: "follow",
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          const resText = await scriptRes.text();
          try {
            const parsed = JSON.parse(resText);
            if (parsed && parsed.status === "success" && parsed.id) {
              driveResult = parsed;
            }
          } catch (e) {}
        } catch (scriptErr: any) {
          console.warn("Apps Script Drive sync warning in /api/upload-file:", scriptErr?.message || scriptErr);
        }
      }

      const isDriveSynced = Boolean(driveResult?.id);
      const driveFileUrl = driveResult?.webViewLink || (driveResult?.id ? `https://drive.google.com/file/d/${driveResult.id}/view` : fileUrl);

      const newItem = {
        id: fileId,
        name: name,
        category: category || "Umum",
        fileSize: fileSize,
        uploadedBy: uploadedBy || "Pengguna",
        uploadedByRole: uploadedByRole || "Staff Sekolah",
        uploadedAt: nowStr,
        privacy: privacy || "Public",
        driveFileUrl: driveFileUrl,
        driveFolderId: driveResult?.folderId || "1OFVFI1xhsk45_ONTihtuSHeBVvEOr44m",
        fileExtension: ext,
        fileType: mimeType || "application/octet-stream",
        fileUrl: fileUrl,
        dataUrl: fileSize <= 120000 ? `data:${mimeType};base64,${cleanBase64}` : undefined,
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

      return res.json({
        success: true,
        message: isDriveSynced 
          ? `Berkas "${name}" berhasil disimpan dan disinkronkan ke Google Drive!` 
          : `Berkas "${name}" berhasil disimpan ke server sekolah dan dapat diakses semua perangkat!`,
        file: newItem,
        isDriveSynced
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
      if (!webAppUrl) {
        const savedConfig = safeReadJSON(CONFIG_FILE, null);
        webAppUrl = savedConfig?.webAppUrl || "https://script.google.com/macros/s/AKfycbyhC26e6a4a0ORdBvnMCz7c1pDR0rQsGkcO_LfVKhxAZGYtBMGle4qbjZoNx6D_uT79/exec";
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

      return res.json({ success: true, data });
    } catch (err: any) {
      console.warn("Proxying to Google Sheets warning in /api/sync-sheets:", err?.message || err);
      return res.json({ success: false, message: err?.message || "Gagal menghubungi endpoint Google Sheets" });
    }
  });

  // API Route: Proxy Load from Google Sheets
  app.post("/api/load-sheets", async (req, res) => {
    try {
      const { webAppUrl } = req.body;
      if (!webAppUrl) {
        return res.status(400).json({ success: false, message: "webAppUrl is required" });
      }

      let data: any = null;

      // 1. Try GET first with 60s timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout
        const response = await fetch(webAppUrl, {
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
            body: JSON.stringify({ type: "LOAD_ALL" }),
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
      const config = req.body;
      safeWriteJSON(CONFIG_FILE, config);
      return res.json({ success: true, config });
    } catch (err) {
      console.error("Error writing sync_config.json:", err);
      return res.status(500).json({ success: false, message: (err as Error).message });
    }
  });

  // API Route: Get Shared App Data Cache
  app.get("/api/app-data", (req, res) => {
    const data = safeReadJSON(DATA_FILE, {});
    
    // Filter out deleted files permanently across devices
    const deletedFileIds: string[] = Array.isArray(data.deletedFileIds) ? data.deletedFileIds : [];
    if (deletedFileIds.length > 0) {
      const deletedSet = new Set(deletedFileIds.map(id => String(id)));
      if (Array.isArray(data.schoolFiles)) {
        data.schoolFiles = data.schoolFiles.filter((f: any) => f && f.id && !deletedSet.has(String(f.id)));
      }
      if (Array.isArray(data.files)) {
        data.files = data.files.filter((f: any) => f && f.id && !deletedSet.has(String(f.id)));
      }
    }
    
    return res.json(data);
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

      // Remove deleted files from disk if present
      if (incomingDeletedFiles.length > 0 && fs.existsSync(UPLOADS_DIR)) {
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
      if (Array.isArray(incoming.schoolFiles)) {
        for (const f of incoming.schoolFiles) {
          if (f && f.id && !delFileSet.has(String(f.id))) {
            fileMap.set(String(f.id), f);
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
