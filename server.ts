import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const CONFIG_FILE = path.join(process.cwd(), "sync_config.json");
const DATA_FILE = path.join(process.cwd(), "app_data.json");

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support JSON bodies up to 10MB (in case of large profile photo base64 strings)
  app.use(express.json({ limit: '10mb' }));

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
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const data = fs.readFileSync(CONFIG_FILE, "utf-8");
        return res.json(JSON.parse(data));
      }
    } catch (err) {
      console.error("Error reading sync_config.json:", err);
    }
    // Fallback to default
    return res.json({
      spreadsheetUrl: "1XmLmshCOhSktRfzW8uG_8RqxlxVCQt5eUVekEFLwj_M",
      webAppUrl: "https://script.google.com/macros/s/AKfycbwCjNbFmpToPA9JATA4FlFJPESoWbqS9JzIhbF2TS7FNsTlK2ZIUMtfsPBE5ln3Q7eO/exec",
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
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      
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
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { text };
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

      // 1. Try GET first with 8s timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(webAppUrl, {
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
          const timeoutId = setTimeout(() => controller.abort(), 8000);
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
        return res.json({
          status: 'error',
          message: data?.message || 'Tidak dapat memuat data dari Spreadsheet saat ini.'
        });
      }
    } catch (err: any) {
      console.warn("Proxying from Google Sheets warning in /api/load-sheets:", err?.message || err);
      return res.json({ status: 'error', message: err?.message || 'Gagal memuat data dari Google Sheets' });
    }
  });

  // API Route: Save Shared Sync Config
  app.post("/api/sync-config", (req, res) => {
    try {
      const config = req.body;
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
      return res.json({ success: true, config });
    } catch (err) {
      console.error("Error writing sync_config.json:", err);
      return res.status(500).json({ success: false, message: (err as Error).message });
    }
  });

  // API Route: Get Shared App Data Cache
  app.get("/api/app-data", (req, res) => {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, "utf-8");
        return res.json(JSON.parse(data));
      }
    } catch (err) {
      console.error("Error reading app_data.json:", err);
    }
    return res.json({});
  });

  // API Route: Save Shared App Data Cache
  app.post("/api/app-data", (req, res) => {
    try {
      const incoming = req.body || {};
      let currentData: any = {};
      if (fs.existsSync(DATA_FILE)) {
        try {
          currentData = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
        } catch (e) {}
      }

      // Merge deletedNotifIds
      const currentDeleted: string[] = Array.isArray(currentData.deletedNotifIds) ? currentData.deletedNotifIds : [];
      const incomingDeleted: string[] = Array.isArray(incoming.deletedNotifIds) ? incoming.deletedNotifIds : [];
      const mergedDeleted = Array.from(new Set([...currentDeleted, ...incomingDeleted]));

      // Merge deletedPermintaanAksesIds
      const currentDeletedReqs: string[] = Array.isArray(currentData.deletedPermintaanAksesIds) ? currentData.deletedPermintaanAksesIds : [];
      const incomingDeletedReqs: string[] = Array.isArray(incoming.deletedPermintaanAksesIds) ? incoming.deletedPermintaanAksesIds : [];
      const mergedDeletedReqs = Array.from(new Set([...currentDeletedReqs, ...incomingDeletedReqs]));

      // Merge notifications carefully so no notification is ever lost by cross-device race conditions
      const currentNotifs: any[] = Array.isArray(currentData.notifications) ? currentData.notifications : [];
      const incomingNotifs: any[] = Array.isArray(incoming.notifications) ? incoming.notifications : [];
      
      const notifMap = new Map<string, any>();
      const deletedSet = new Set<string>(['notif-1', 'notif-2', 'notif-3', ...mergedDeleted]);

      // Add current notifs
      currentNotifs.forEach((n: any) => {
        if (n && n.id && !deletedSet.has(String(n.id))) {
          notifMap.set(String(n.id), n);
        }
      });
      // Add incoming notifs (if existing, update read status or properties)
      incomingNotifs.forEach((n: any) => {
        if (n && n.id && !deletedSet.has(String(n.id))) {
          if (notifMap.has(String(n.id))) {
            const exist = notifMap.get(String(n.id));
            notifMap.set(String(n.id), { ...exist, ...n, read: Boolean(exist.read || n.read) });
          } else {
            notifMap.set(String(n.id), n);
          }
        }
      });

      const mergedNotifs = Array.from(notifMap.values());
      mergedNotifs.sort((a: any, b: any) => {
        const timeA = a.time ? new Date(a.time).getTime() : 0;
        const timeB = b.time ? new Date(b.time).getTime() : 0;
        return timeB - timeA;
      });

      // Merge permintaanAkses
      const currentRequests: any[] = Array.isArray(currentData.permintaanAkses) ? currentData.permintaanAkses : [];
      const incomingRequests: any[] = Array.isArray(incoming.permintaanAkses) ? incoming.permintaanAkses : [];
      
      const reqMap = new Map<string, any>();
      const deletedReqSet = new Set<string>(mergedDeletedReqs);

      currentRequests.forEach((r: any) => {
        if (r && r.id && !deletedReqSet.has(String(r.id))) {
          reqMap.set(String(r.id), r);
        }
      });
      incomingRequests.forEach((r: any) => {
        if (r && r.id && !deletedReqSet.has(String(r.id))) {
          if (reqMap.has(String(r.id))) {
            const exist = reqMap.get(String(r.id));
            reqMap.set(String(r.id), { ...exist, ...r });
          } else {
            reqMap.set(String(r.id), r);
          }
        }
      });

      const mergedRequests = Array.from(reqMap.values());
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
        notifications: mergedNotifs,
        permintaanAkses: mergedRequests
      };

      fs.writeFileSync(DATA_FILE, JSON.stringify(finalData, null, 2), "utf-8");
      return res.json({ success: true, notifications: mergedNotifs, permintaanAkses: mergedRequests });
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
