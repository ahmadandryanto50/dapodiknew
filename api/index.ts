import express from "express";
import path from "path";
import fs from "fs";
import serverless from "serverless-http";

const app = express();
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
  } catch (err) {}
  return fallback;
}

function safeWriteJSON(filePath: string, data: any) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {}
}

app.use(express.json({ limit: '50mb' }));

app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  next();
});

app.get("/api/sync-config", (req, res) => {
  const config = safeReadJSON(CONFIG_FILE, null);
  if (config) {
    return res.json(config);
  }
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

app.post("/api/sync-sheets", async (req, res) => {
  try {
    const { webAppUrl, payload } = req.body;
    if (!webAppUrl) {
      return res.status(400).json({ success: false, message: "webAppUrl is required" });
    }
    const response = await fetch(webAppUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
      redirect: "follow"
    });
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
    return res.json({ success: false, message: err?.message || "Gagal menghubungi endpoint Google Sheets" });
  }
});

app.post("/api/load-sheets", async (req, res) => {
  try {
    const { webAppUrl } = req.body;
    if (!webAppUrl) {
      return res.status(400).json({ success: false, message: "webAppUrl is required" });
    }
    let data: any = null;
    try {
      const response = await fetch(webAppUrl, { method: "GET", redirect: "follow" });
      const text = await response.text();
      data = JSON.parse(text);
    } catch (e) {}

    if (!data || data.status !== 'success') {
      try {
        const postRes = await fetch(webAppUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({ type: "LOAD_ALL" }),
          redirect: "follow"
        });
        const postText = await postRes.text();
        data = JSON.parse(postText);
      } catch (e2) {}
    }

    return res.json({ success: true, data: data || { status: 'error', message: 'Failed to load' } });
  } catch (err: any) {
    return res.json({ success: false, message: err?.message || "Gagal load dari Google Sheets" });
  }
});

app.get("/api/app-data", (req, res) => {
  const data = safeReadJSON(DATA_FILE, {
    notifications: [],
    permintaanAkses: [],
    schoolFiles: [],
    deletedNotifIds: [],
    deletedPermintaanAksesIds: [],
    deletedFileIds: []
  });
  return res.json(data);
});

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
