import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const CONFIG_FILE = path.join(process.cwd(), "sync_config.json");
const DATA_FILE = path.join(process.cwd(), "app_data.json");

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

  // Support JSON bodies up to 50MB (for file uploads and base64 strings)
  app.use(express.json({ limit: '50mb' }));

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
    if (config) {
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

  // API Route: Proxy Sync to Google Sheets (bypasses browser CORS & mobile restrictions)
  app.post("/api/sync-sheets", async (req, res) => {
    try {
      const { webAppUrl, payload } = req.body;
      if (!webAppUrl) {
        return res.status(400).json({ success: false, message: "webAppUrl is required" });
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 seconds timeout
      
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

      if (data && data.status === 'success') {
        return res.json(data);
      } else {
        // Fallback to locally cached app_data.json so multi-device/browser sync never fails
        const cached = safeReadJSON(DATA_FILE, null);
        if (cached) {
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
            berkas: cached.schoolFiles || cached.files || []
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
          berkas: cached.schoolFiles || cached.files || []
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

      // Handle schoolFiles
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
