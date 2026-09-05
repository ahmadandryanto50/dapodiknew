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
      spreadsheetUrl: "",
      webAppUrl: "",
      sheetId: "",
      autoSync: true,
      lastSynced: null,
      status: "disconnected",
      mode: "appscript"
    });
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
      const data = req.body;
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
      return res.json({ success: true });
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
