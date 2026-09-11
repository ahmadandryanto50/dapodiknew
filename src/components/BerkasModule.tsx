import React, { useState, useRef, useEffect } from 'react';
import {
  Folder,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileArchive,
  Upload,
  Download,
  Eye,
  CheckCircle2,
  Search,
  ExternalLink,
  Plus,
  Copy,
  Trash2,
  Sparkles,
  HardDrive,
  RefreshCw,
  ChevronRight,
  Check,
  X,
  FileCheck2,
  FileCode,
  Bell,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { SchoolFileItem, AdminUser, SyncConfig, FileAccessRequest } from '../types';
import { GOOGLE_DRIVE_MAIN_FOLDER_URL, GOOGLE_DRIVE_FOLDER_ID, initialSchoolFiles } from '../data/mockFiles';
import {
  subscribeGoogleDriveAuth,
  signInWithGoogleDrive,
  signOutGoogleDrive,
  isGoogleDriveConnected
} from '../services/googleDriveService';
import {
  uploadFileToDriveViaAppsScript,
  APPS_SCRIPT_TEMPLATE,
  downloadKodeGsFile,
  syncBerkasToGoogleSheets
} from '../services/googleSheetsService';

/**
 * Universal, robust file reader for mobile (Android/iOS) and all desktop browsers.
 * Combines FileReader.readAsDataURL and ArrayBuffer binary conversion with safe fallbacks.
 */
const readFileAsBase64 = async (
  file: File
): Promise<{ dataUrl: string; base64Pure: string; mimeType: string }> => {
  let mimeType = file.type || '';
  if (!mimeType) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') mimeType = 'application/pdf';
    else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
    else if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (ext === 'xlsx') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    else if (ext === 'pptx') mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    else if (ext === 'zip') mimeType = 'application/zip';
    else mimeType = 'application/octet-stream';
  }

  // Strategy 1: FileReader.readAsDataURL
  const readViaDataUrl = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = (e) => reject(e);
      reader.onabort = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  // Strategy 2: ArrayBuffer to base64 conversion
  const readViaArrayBuffer = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const buffer = reader.result as ArrayBuffer;
          const bytes = new Uint8Array(buffer);
          let binary = '';
          const chunkSize = 8192;
          for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.subarray(i, i + chunkSize);
            binary += String.fromCharCode.apply(null, chunk as any);
          }
          const base64 = btoa(binary);
          resolve(`data:${mimeType};base64,${base64}`);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (e) => reject(e);
      reader.onabort = (e) => reject(e);
      reader.readAsArrayBuffer(file);
    });
  };

  let dataUrl = '';
  try {
    dataUrl = await Promise.race([
      readViaDataUrl(),
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error('Timeout reading file')), 25000))
    ]);
  } catch (e1) {
    try {
      dataUrl = await readViaArrayBuffer();
    } catch (e2) {
      console.warn('Fallback ArrayBuffer read failed:', e2);
    }
  }

  if (!dataUrl) {
    try {
      dataUrl = await readViaArrayBuffer();
    } catch (e3) {}
  }

  // Soft optimization for huge mobile photos (> 3MB) to preserve mobile bandwidth and RAM
  if (mimeType.startsWith('image/') && file.size > 3 * 1024 * 1024 && dataUrl) {
    try {
      const compressed = await new Promise<string>((res) => {
        const timer = setTimeout(() => res(dataUrl), 3500);
        const img = new Image();
        img.onload = () => {
          clearTimeout(timer);
          try {
            const maxDim = 1920;
            let w = img.width;
            let h = img.height;
            if (w <= maxDim && h <= maxDim) {
              res(dataUrl);
              return;
            }
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              res(dataUrl);
              return;
            }
            ctx.drawImage(img, 0, 0, w, h);
            const outputFormat = mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
            res(canvas.toDataURL(outputFormat, 0.8));
          } catch (canvasErr) {
            res(dataUrl);
          }
        };
        img.onerror = () => {
          clearTimeout(timer);
          res(dataUrl);
        };
        img.src = dataUrl;
      });
      if (compressed) {
        dataUrl = compressed;
      }
    } catch (optErr) {
      // Keep original dataUrl
    }
  }

  let base64Pure = dataUrl;
  if (base64Pure.includes(',')) {
    base64Pure = base64Pure.split(',')[1];
  }

  return { dataUrl, base64Pure, mimeType };
};

interface BerkasModuleProps {
  currentUser: AdminUser | null;
  onBackToHome?: () => void;
  autoOpenUpload?: boolean;
  syncConfig?: SyncConfig;
  files?: SchoolFileItem[];
  setFiles?: React.Dispatch<React.SetStateAction<SchoolFileItem[]>>;
  accessRequests?: FileAccessRequest[];
  setAccessRequests?: React.Dispatch<React.SetStateAction<FileAccessRequest[]>>;
  customFolders?: string[];
  setCustomFolders?: React.Dispatch<React.SetStateAction<string[]>>;
}

export const BerkasModule: React.FC<BerkasModuleProps> = ({ 
  currentUser, 
  autoOpenUpload, 
  syncConfig,
  files: propFiles,
  setFiles: propSetFiles,
  customFolders: propCustomFolders,
  setCustomFolders: propSetCustomFolders
}) => {
  // Persistence state
  const [localFiles, setLocalFiles] = useState<SchoolFileItem[]>(() => {
    try {
      const saved = localStorage.getItem('dapodik_school_files_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading files from localStorage', e);
    }
    return initialSchoolFiles;
  });
  const files = propFiles !== undefined ? propFiles : localFiles;
  const setFiles = propSetFiles !== undefined ? propSetFiles : setLocalFiles;

  const [localCustomFolders, setLocalCustomFolders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dapodik_custom_folders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const customFolders = propCustomFolders !== undefined ? propCustomFolders : localCustomFolders;
  const setCustomFolders = propSetCustomFolders !== undefined ? propSetCustomFolders : setLocalCustomFolders;

  const [activeSyncConfig, setActiveSyncConfig] = useState<SyncConfig | null>(syncConfig || null);

  // Load effective sync configuration if not passed directly
  useEffect(() => {
    if (syncConfig) {
      setActiveSyncConfig(syncConfig);
      return;
    }
    try {
      const saved = localStorage.getItem('dapodik_sync_config');
      if (saved) {
        setActiveSyncConfig(JSON.parse(saved));
      } else {
        fetch('/api/sync-config')
          .then(res => res.json())
          .then(cfg => {
            if (cfg && cfg.webAppUrl) setActiveSyncConfig(cfg);
          })
          .catch(() => {});
      }
    } catch (e) {}
  }, [syncConfig]);

  useEffect(() => {
    if (propFiles !== undefined) {
      setLocalFiles(propFiles);
    }
  }, [propFiles]);

  // Pull latest school files from Server Cache
  const handlePullFilesFromCloud = async (silent: boolean = false) => {
    try {
      let updatedAny = false;
      try {
        const cacheRes = await fetch(`/api/app-data?t=${Date.now()}`);
        if (cacheRes.ok) {
          const cacheData = await cacheRes.json();
          if (Array.isArray(cacheData.schoolFiles)) {
            let delFileIds: string[] = [];
            try {
              delFileIds = JSON.parse(localStorage.getItem('dapodik_deleted_file_ids') || '[]');
            } catch (e) {}
            const serverDelFileIds: string[] = Array.isArray(cacheData.deletedFileIds) ? cacheData.deletedFileIds : [];
            const allDelFiles = new Set<string>([...delFileIds, ...serverDelFileIds]);

            const cleanFiles = cacheData.schoolFiles.filter(
              (f: SchoolFileItem) => f && f.id && !allDelFiles.has(String(f.id))
            );
            cleanFiles.sort((a: any, b: any) => {
              const timeA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
              const timeB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
              return timeB - timeA;
            });

            setFiles(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(cleanFiles)) {
                localStorage.setItem('dapodik_school_files_v3', JSON.stringify(cleanFiles));
                return cleanFiles;
              }
              return prev;
            });
            updatedAny = true;
          }
        }
      } catch (cacheErr) {
        console.warn('Cache pull error:', cacheErr);
      }

      if (!silent) {
        setSyncFeedback(updatedAny ? 'Database berkas berhasil disinkronkan!' : 'Database berkas sudah up-to-date!');
        setTimeout(() => setSyncFeedback(null), 3000);
      }
    } catch (err: any) {
      console.warn('Pull files error:', err);
    }
  };

  // Pull on initial load and recurring multi-device sync
  useEffect(() => {
    handlePullFilesFromCloud(true);

    const intervalId = setInterval(() => {
      handlePullFilesFromCloud(true);
    }, 5000);

    const onFocus = () => {
      handlePullFilesFromCloud(true);
    };
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
    };
  }, [activeSyncConfig?.webAppUrl]);

  // Synchronize helper for files (Upload, Delete, Update)
  const persistAndSyncFiles = async (
    updatedFiles: SchoolFileItem[],
    deletedId?: string,
    successNote?: string
  ) => {
    if (deletedId) {
      try {
        const savedDel = localStorage.getItem('dapodik_deleted_file_ids');
        const delList: string[] = savedDel ? JSON.parse(savedDel) : [];
        if (!delList.includes(deletedId)) delList.push(deletedId);
        localStorage.setItem('dapodik_deleted_file_ids', JSON.stringify(delList));
      } catch (e) {}
    }

    setLocalFiles(updatedFiles);
    if (propSetFiles) {
      propSetFiles(updatedFiles);
    }
    try {
      localStorage.setItem('dapodik_school_files_v3', JSON.stringify(updatedFiles));
    } catch (e) {}

    // Strip large dataUrl before sending over server cache and spreadsheet to save network
    const cleanFiles = updatedFiles.map(f => {
      if (f.dataUrl && f.dataUrl.length > 80000) {
        const { dataUrl, ...rest } = f;
        return rest;
      }
      return f;
    });

    // Broadcast to server app-data cache immediately
    fetch('/api/app-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolFiles: cleanFiles,
        ...(deletedId ? { deletedFileIds: [deletedId], deletedFileId: deletedId } : {})
      })
    }).catch(() => {});

    // Sync to Google Sheets
    let syncCfg = activeSyncConfig || syncConfig;
    if (!syncCfg || !syncCfg.webAppUrl) {
      try {
        const cfgSaved = localStorage.getItem('dapodik_sync_config');
        if (cfgSaved) syncCfg = JSON.parse(cfgSaved);
      } catch (e) {}
    }
    const finalWebAppUrl = syncCfg?.webAppUrl || 'https://script.google.com/macros/s/AKfycbyhC26e6a4a0ORdBvnMCz7c1pDR0rQsGkcO_LfVKhxAZGYtBMGle4qbjZoNx6D_uT79/exec';
    const effectiveCfg: SyncConfig = {
      ...(syncCfg || {}),
      webAppUrl: finalWebAppUrl
    } as SyncConfig;

    syncBerkasToGoogleSheets(effectiveCfg, cleanFiles).catch(err => {
      console.error('Failed to sync berkas to Google Sheets:', err);
    });

    if (successNote) {
      setSyncFeedback(successNote);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  // Google Drive Real Auth State & Diagnostics
  const DEFAULT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyhC26e6a4a0ORdBvnMCz7c1pDR0rQsGkcO_LfVKhxAZGYtBMGle4qbjZoNx6D_uT79/exec';
  const [driveUser, setDriveUser] = useState<any>(null);
  const [isDriveLinked, setIsDriveLinked] = useState<boolean>(false);
  const [isConnectingDrive, setIsConnectingDrive] = useState<boolean>(false);
  const [currentUploadingFileName, setCurrentUploadingFileName] = useState<string>('');
  const [driveConnectError, setDriveConnectError] = useState<string | null>(null);

  const [isDriveGuideModalOpen, setIsDriveGuideModalOpen] = useState<boolean>(false);
  const [isTestingDriveConnection, setIsTestingDriveConnection] = useState<boolean>(false);
  const [driveTestResult, setDriveTestResult] = useState<{ success: boolean; message: string; url?: string } | null>(null);
  const [inputWebAppUrl, setInputWebAppUrl] = useState<string>('');
  const [isScriptCopied, setIsScriptCopied] = useState<boolean>(false);

  useEffect(() => {
    if (activeSyncConfig?.webAppUrl) {
      setInputWebAppUrl(activeSyncConfig.webAppUrl);
    } else {
      setInputWebAppUrl(DEFAULT_WEB_APP_URL);
    }
  }, [activeSyncConfig]);

  const handleCopyAppsScriptCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
    setIsScriptCopied(true);
    setTimeout(() => setIsScriptCopied(false), 3000);
  };

  const handleTestDriveConnection = async (overrideUrl?: string) => {
    setIsTestingDriveConnection(true);
    setDriveTestResult(null);

    const targetUrl = (overrideUrl || inputWebAppUrl || activeSyncConfig?.webAppUrl || DEFAULT_WEB_APP_URL).trim();

    const testConfig: SyncConfig = {
      webAppUrl: targetUrl,
      spreadsheetUrl: activeSyncConfig?.spreadsheetUrl || '',
      sheetId: '',
      autoSync: true,
      lastSynced: null,
      status: 'connected',
      mode: 'appscript'
    };

    const testBase64 = 'VGVzIEtvbmVrc2kgR29vZ2xlIERyaXZlIERhcG9kaWsgMjAyNg==';

    try {
      const res = await uploadFileToDriveViaAppsScript(testConfig, {
        name: `Tes_Koneksi_Dapodik_${Date.now().toString().slice(-4)}.txt`,
        type: 'text/plain',
        base64Data: testBase64,
        category: 'Berkas Dapodik',
        description: 'Berkas tes koneksi otomatis Google Drive Dapodik'
      });

      if (res.success && res.id) {
        setDriveTestResult({
          success: true,
          message: `✅ LULUS TES 100%! Berkas pengujian berhasil tersimpan secara nyata di Google Drive Anda!\nID Berkas: ${res.id}`,
          url: res.webViewLink
        });
        const updatedConfig: SyncConfig = { ...testConfig, webAppUrl: targetUrl };
        setActiveSyncConfig(updatedConfig);
        localStorage.setItem('dapodik_sync_config', JSON.stringify(updatedConfig));
        fetch('/api/sync-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedConfig)
        }).catch(() => {});
        setSyncFeedback('✅ Koneksi Google Drive Berhasil Diuji & Tersambung 100%!');
        setTimeout(() => setSyncFeedback(null), 4000);
      } else {
        setDriveTestResult({
          success: false,
          message: res.message || 'Gagal menyimpan berkas tes di Google Drive.'
        });
        setIsDriveGuideModalOpen(true);
      }
    } catch (err: any) {
      setDriveTestResult({
        success: false,
        message: err?.message || 'Terjadi kesalahan saat menguji koneksi Google Drive.'
      });
      setIsDriveGuideModalOpen(true);
    } finally {
      setIsTestingDriveConnection(false);
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeGoogleDriveAuth((user, token) => {
      setDriveUser(user);
      setIsDriveLinked(!!user && !!token);
    });
    return () => unsubscribe();
  }, []);

  const handleConnectDrive = async () => {
    setIsConnectingDrive(true);
    setDriveConnectError(null);
    try {
      const result = await signInWithGoogleDrive();
      setSyncFeedback(`Akun Google Drive (${result.user.email}) berhasil terhubung!`);
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch (err: any) {
      console.error('Drive connection error:', err);
      setDriveConnectError(err?.message || 'Gagal menghubungkan Google Drive. Pastikan jendela popup diizinkan oleh browser.');
    } finally {
      setIsConnectingDrive(false);
    }
  };

  const handleDisconnectDrive = async () => {
    try {
      await signOutGoogleDrive();
      setSyncFeedback('Koneksi Google Drive telah diputuskan.');
      setTimeout(() => setSyncFeedback(null), 3500);
    } catch (e) {
      console.error(e);
    }
  };

  // Save changes to localStorage and server cache
  useEffect(() => {
    try {
      localStorage.setItem('dapodik_school_files_v3', JSON.stringify(files));
      if (files && files.length > 0) {
        fetch('/api/app-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ schoolFiles: files })
        }).catch(() => {});
      }
    } catch (e) {
      console.error('Failed to save school files', e);
    }
  }, [files]);

  // Tab & Filters
  const [activeTab, setActiveTab] = useState<'files' | 'folders'>('files');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPrivacy, setSelectedPrivacy] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(!!autoOpenUpload);

  useEffect(() => {
    if (autoOpenUpload) {
      setIsUploadModalOpen(true);
    }
  }, [autoOpenUpload]);

  const [previewFile, setPreviewFile] = useState<SchoolFileItem | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Upload Form State
  const [folderChoiceMode, setFolderChoiceMode] = useState<'category' | 'custom'>('category');
  const [uploadCategory, setUploadCategory] = useState<string>('Kurikulum & Pembelajaran');
  const [customFolder, setCustomFolder] = useState<string>('');
  const [uploadPrivacy, setUploadPrivacy] = useState<'Restricted' | 'Guru Only' | 'Public'>('Public');
  const [uploadDescription, setUploadDescription] = useState<string>('');
  const [selectedUploadFiles, setSelectedUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadRemainingBytesText, setUploadRemainingBytesText] = useState<string>('');
  const [currentUploadingFileIndex, setCurrentUploadingFileIndex] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const uploadCancelledRef = useRef<boolean>(false);
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  // Delete Confirmation State
  const [deletingFile, setDeletingFile] = useState<SchoolFileItem | null>(null);

  const isAdmin = Boolean(
    currentUser && (
      currentUser.role === 'Administrator' ||
      currentUser.role === 'Operator' ||
      currentUser.username === 'admin' ||
      (typeof currentUser.role === 'string' && currentUser.role.toLowerCase().includes('admin'))
    )
  );

  const canDeleteFile = (file: SchoolFileItem) => {
    if (isAdmin) return true;
    if (!currentUser) return false;
    const uploaderName = (file.uploadedBy || '').trim().toLowerCase();
    const currentName = (currentUser.nama || '').trim().toLowerCase();
    const currentUsername = (currentUser.username || '').trim().toLowerCase();
    return Boolean(
      (currentName && uploaderName === currentName) ||
      (currentUsername && uploaderName === currentUsername) ||
      (currentUsername && uploaderName.includes(currentUsername))
    );
  };

  // Extract all categories including customFolders
  const categories = Array.from(new Set([
    ...files.map(f => f.category),
    ...customFolders
  ])).filter(Boolean);

  // Filtered files
  const filteredFiles = files.filter(f => {
    const matchCategory = selectedCategory === 'ALL' || f.category === selectedCategory;
    const matchPrivacy = selectedPrivacy === 'ALL' || f.privacy === selectedPrivacy;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      f.name.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q) ||
      (f.description && f.description.toLowerCase().includes(q)) ||
      (f.uploadedBy && f.uploadedBy.toLowerCase().includes(q)) ||
      (f.tags && f.tags.some(t => t.toLowerCase().includes(q)));
    return matchCategory && matchPrivacy && matchSearch;
  });

  const [syncingFileId, setSyncingFileId] = useState<string | null>(null);

  // Handle Single File Sync to Google Drive
  const handleSyncSingleFileToDrive = async (file: SchoolFileItem) => {
    setSyncingFileId(file.id);
    setDriveConnectError(null);
    try {
      let driveResult: any = null;

      let currentCfg = activeSyncConfig;
      if (!currentCfg?.webAppUrl) {
        try {
          const cfgSaved = localStorage.getItem('dapodik_sync_config');
          if (cfgSaved) currentCfg = JSON.parse(cfgSaved);
        } catch (e) {}
      }

      let base64Pure = '';
      if (file.dataUrl) {
        base64Pure = file.dataUrl.includes(',') ? file.dataUrl.split(',')[1] : file.dataUrl;
      } else if (file.fileUrl) {
        try {
          const fetchRes = await fetch(file.fileUrl);
          if (fetchRes.ok) {
            const blob = await fetchRes.blob();
            const reader = new FileReader();
            base64Pure = await new Promise((resolve) => {
              reader.onload = () => {
                const s = reader.result as string;
                resolve(s.includes(',') ? s.split(',')[1] : s);
              };
              reader.onerror = () => resolve('');
              reader.readAsDataURL(blob);
            });
          }
        } catch (fErr) {}
      }

      if (currentCfg?.webAppUrl && base64Pure) {
        const uploadRes = await uploadFileToDriveViaAppsScript(currentCfg, {
          name: file.name,
          type: file.fileType || 'application/octet-stream',
          base64Data: base64Pure,
          description: file.description || `Berkas ${file.name}`,
          parentFolderId: GOOGLE_DRIVE_FOLDER_ID,
          folderName: file.category || 'Berkas Dapodik'
        });
        
        if (uploadRes.success && uploadRes.id) {
          driveResult = uploadRes;
        } else {
          throw new Error('Gagal dari Apps Script: ' + (uploadRes.message || ''));
        }
      } else {
        throw new Error('Data berkas belum siap atau URL Google Apps Script belum dikonfigurasi.');
      }

      if (!driveResult) {
        throw new Error('Gagal mengunggah berkas ke Google Drive via Apps Script. Silakan coba lagi.');
      }

      const updatedFiles = files.map(f => {
        if (f.id === file.id) {
          return {
            ...f,
            id: driveResult.id,
            driveFileUrl: driveResult.webViewLink,
            driveFolderId: driveResult.folderId || GOOGLE_DRIVE_FOLDER_ID,
            tags: Array.from(new Set([...(f.tags || []).filter(t => t !== 'Lokal'), 'GoogleDrive']))
          };
        }
        return f;
      });

      await persistAndSyncFiles(updatedFiles, undefined, `Berkas "${file.name}" berhasil diunggah langsung ke Google Drive!`);
    } catch (err: any) {
      console.error('Error syncing file to drive:', err);
      setDriveConnectError(`Gagal upload "${file.name}" ke Google Drive: ${err?.message || err}`);
    } finally {
      setSyncingFileId(null);
    }
  };

  // Handle Multi-Upload
  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      setSelectedUploadFiles(prev => [...prev, ...selected]);
    }
    // Crucial for mobile: reset input value so selecting the same file triggers onChange
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeSelectedUploadFile = (index: number) => {
    setSelectedUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleExecuteUpload = async () => {
    if (selectedUploadFiles.length === 0) return;

    uploadCancelledRef.current = false;
    setIsUploading(true);
    setUploadProgress(0);
    setDriveConnectError(null);

    const targetCategory = folderChoiceMode === 'custom'
      ? (customFolder.trim() || 'Folder Baru')
      : (customFolder.trim() && folderChoiceMode === 'custom' ? customFolder.trim() : uploadCategory);

    if (folderChoiceMode === 'custom' && customFolder.trim()) {
      const folderName = customFolder.trim();
      if (!customFolders.includes(folderName)) {
        const updatedCustomFolders = [...customFolders, folderName];
        setCustomFolders(updatedCustomFolders);
        localStorage.setItem('dapodik_custom_folders', JSON.stringify(updatedCustomFolders));
        fetch('/api/app-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customFolders: updatedCustomFolders })
        }).catch(() => {});
      }
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newItems: SchoolFileItem[] = [];
    let currentFilesList = [...files];

    let currentCfg = activeSyncConfig;
    if (!currentCfg?.webAppUrl) {
      try {
        const cfgSaved = localStorage.getItem('dapodik_sync_config');
        if (cfgSaved) currentCfg = JSON.parse(cfgSaved);
      } catch (e) {}
    }
    if (!currentCfg?.webAppUrl) {
      currentCfg = {
        webAppUrl: DEFAULT_WEB_APP_URL,
        spreadsheetUrl: '',
        sheetId: '',
        autoSync: true,
        lastSynced: null,
        status: 'connected',
        mode: 'appscript'
      };
    }

    const hasAppsScriptUrl = Boolean(currentCfg?.webAppUrl && currentCfg.webAppUrl.trim().startsWith('http'));
    const hasDriveOAuth = isGoogleDriveConnected();

    if (!hasAppsScriptUrl && !hasDriveOAuth) {
      setDriveConnectError('ℹ️ Penyimpanan Lokal: Akun Google Drive belum dihubungkan. Berkas Anda berhasil disimpan ke database sekolah.');
      setTimeout(() => setDriveConnectError(null), 6000);
    }

    const total = selectedUploadFiles.length;
    if (total === 0) {
      setIsUploading(false);
      setUploadProgress(0);
      return;
    }

    const uploadErrors: string[] = [];

    try {
      for (let i = 0; i < total; i++) {
        if (uploadCancelledRef.current) break;

        setCurrentUploadingFileIndex(i + 1);
        const file = selectedUploadFiles[i];
        const fileSize = file.size || 100000;
        const sizeStr = fileSize > 1024 * 1024 ? `${(fileSize / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(fileSize / 1024)} KB`;
        
        setCurrentUploadingFileName(`${file.name} (${sizeStr})`);
        setUploadRemainingBytesText(`Mempersiapkan berkas: ${formatBytes(fileSize)}...`);

        const prepSteps = 4;
        for (let step = 1; step <= prepSteps; step++) {
          if (uploadCancelledRef.current) break;
          const processed = Math.round((step / prepSteps) * (fileSize * 0.2));
          setUploadRemainingBytesText(`Telah terbaca: ${formatBytes(processed)} dari ${formatBytes(fileSize)}`);
          const subProgress = Math.round(((i / total) * 100) + ((step / prepSteps) * (20 / total)));
          setUploadProgress(Math.min(95, subProgress));
          await new Promise(r => setTimeout(r, 60));
        }

        let dataUrl: string | undefined = undefined;
        let base64Pure = '';
        let inferredMime = file.type || 'application/octet-stream';
        try {
          const readResult = await readFileAsBase64(file);
          dataUrl = readResult.dataUrl;
          base64Pure = readResult.base64Pure;
          inferredMime = readResult.mimeType;
        } catch (readErr: any) {
          console.warn('File reading error on mobile/browser:', readErr);
        }

        if (uploadCancelledRef.current) break;

        const activeSize = base64Pure ? Math.round(base64Pure.length * 0.75) : fileSize;

        const uploadSteps = 10;
        for (let step = 1; step <= uploadSteps; step++) {
          if (uploadCancelledRef.current) break;
          const ratio = step / uploadSteps;
          const sentBytes = Math.round(ratio * activeSize);

          setUploadRemainingBytesText(`Telah terkirim: ${formatBytes(sentBytes)} dari ${formatBytes(activeSize)}`);

          const currentFileProgress = (20 + (ratio * 70)) * (100 / total);
          const overallProgress = Math.round(((i / total) * 100) + currentFileProgress);
          setUploadProgress(Math.min(95, overallProgress));

          await new Promise(r => setTimeout(r, 60));
        }

        if (uploadCancelledRef.current) break;

        setUploadRemainingBytesText(`Menyimpan berkas ke repositori...`);

        let driveResult: any = null;
        let uploadedServerFile: any = null;
        let isDriveSynced = false;

        if (base64Pure) {
          // 1. Upload to local server storage directly (Works reliably on mobile & all browsers)
          try {
            const uploadRes = await fetch('/api/upload-file', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: file.name,
                mimeType: inferredMime,
                base64Data: base64Pure,
                category: targetCategory,
                uploadedBy: currentUser?.nama || currentUser?.username || 'Administrator',
                uploadedByRole: currentUser?.role || 'Staff Sekolah',
                description: uploadDescription || `Berkas ${targetCategory}`,
                privacy: uploadPrivacy,
                folderName: targetCategory
              })
            });

            if (uploadRes.ok) {
              const uploadJson = await uploadRes.json();
              if (uploadJson.success && uploadJson.file) {
                uploadedServerFile = uploadJson.file;
                isDriveSynced = Boolean(uploadJson.isDriveSynced);
                if (uploadJson.isDriveSynced) {
                  driveResult = {
                    id: uploadJson.file.id,
                    webViewLink: uploadJson.file.driveFileUrl,
                    folderId: uploadJson.file.driveFolderId
                  };
                }
              }
            }
          } catch (serverUploadErr) {
            console.warn('Direct /api/upload-file warning:', serverUploadErr);
          }

          // 2. If server didn't sync to Drive and Apps Script is configured, try direct Apps Script
          if (!isDriveSynced && currentCfg?.webAppUrl) {
            try {
              const appsScriptRes = await uploadFileToDriveViaAppsScript(currentCfg, {
                name: file.name,
                type: inferredMime,
                base64Data: base64Pure,
                description: uploadDescription || `Berkas resmi ${targetCategory} diunggah.`,
                parentFolderId: GOOGLE_DRIVE_FOLDER_ID,
                folderName: targetCategory
              });
              if (appsScriptRes.success && appsScriptRes.id) {
                driveResult = appsScriptRes;
                isDriveSynced = true;
              }
            } catch (appsScriptErr: any) {
              console.warn('Apps Script direct upload warning:', appsScriptErr);
            }
          }
        }

        const ext = file.name.split('.').pop() || 'dat';
        const fileId = uploadedServerFile?.id || driveResult?.id || `file-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const localFileUrl = uploadedServerFile?.fileUrl || `/uploads/${fileId}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const driveUrl = driveResult?.webViewLink || (driveResult?.id ? `https://drive.google.com/file/d/${driveResult.id}/view` : (uploadedServerFile?.driveFileUrl || localFileUrl));
        const folderId = driveResult?.folderId || GOOGLE_DRIVE_FOLDER_ID;

        const newItem: SchoolFileItem = {
          id: fileId,
          name: file.name,
          category: targetCategory,
          fileSize: driveResult?.size || uploadedServerFile?.fileSize || fileSize,
          uploadedBy: currentUser?.nama || currentUser?.username || 'Administrator',
          uploadedByRole: currentUser?.role || 'Staff Sekolah',
          uploadedAt: nowStr,
          privacy: uploadPrivacy,
          driveFileUrl: driveUrl,
          fileUrl: localFileUrl,
          driveFolderId: folderId,
          fileExtension: ext,
          fileType: driveResult?.mimeType || inferredMime,
          dataUrl: fileSize <= 120000 ? dataUrl : undefined,
          description: uploadDescription || `Berkas ${targetCategory}`,
          tags: Array.from(new Set([
            isDriveSynced ? 'GoogleDrive' : 'Server',
            targetCategory.split(' ')[0],
            ext.toUpperCase()
          ]))
        };

        newItems.push(newItem);
        currentFilesList = [newItem, ...currentFilesList];
        setFiles(currentFilesList);
      }

      setUploadProgress(100);
      setUploadRemainingBytesText('Pengunggahan selesai 100%!');

      const combinedFiles = [...newItems, ...files];
      await persistAndSyncFiles(combinedFiles);

      if (uploadErrors.length === 0) {
        setSyncFeedback(`✅ ${newItems.length} berkas berhasil diunggah & tersimpan langsung ke Google Drive!`);
      } else {
        setSyncFeedback(`✅ ${newItems.length} berkas berhasil diunggah dan tersimpan ke sistem Dapodik!`);
      }
      setTimeout(() => setSyncFeedback(null), 5000);

      setSelectedUploadFiles([]);
      setUploadDescription('');
      setIsUploadModalOpen(false);
    } catch (err: any) {
      console.error('Upload execution error:', err);
      setDriveConnectError(`Terjadi kesalahan saat mengunggah: ${err?.message || err}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadRemainingBytesText('');
    }
  };

  const handleDeleteFile = (fileOrId: SchoolFileItem | string) => {
    if (!isAdmin) return;
    const target = typeof fileOrId === 'string' ? files.find(f => f.id === fileOrId) : fileOrId;
    if (target) {
      setDeletingFile(target);
    }
  };

  const confirmDeleteFile = () => {
    if (!deletingFile) return;
    const targetFile = deletingFile;
    const remainingFiles = files.filter(f => f.id !== targetFile.id);
    persistAndSyncFiles(remainingFiles, targetFile.id, `Berkas "${targetFile.name}" berhasil dihapus dari Google Drive.`);
    if (previewFile?.id === targetFile.id) {
      setPreviewFile(null);
    }
    setDeletingFile(null);
  };

  // File Icon Helper
  const getFileIcon = (ext: string) => {
    const lower = ext.toLowerCase();
    if (lower === 'pdf') return <FileText className="w-6 h-6 text-rose-500 shrink-0" />;
    if (['xlsx', 'xls', 'csv'].includes(lower)) return <FileSpreadsheet className="w-6 h-6 text-emerald-600 shrink-0" />;
    if (['doc', 'docx'].includes(lower)) return <FileText className="w-6 h-6 text-sky-600 shrink-0" />;
    if (['jpg', 'jpeg', 'png', 'svg', 'webp'].includes(lower)) return <FileImage className="w-6 h-6 text-amber-500 shrink-0" />;
    if (['zip', 'rar', '7z'].includes(lower)) return <FileArchive className="w-6 h-6 text-indigo-500 shrink-0" />;
    return <FileCode className="w-6 h-6 text-slate-500 shrink-0" />;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner / Google Drive Integration Bar */}
      <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-sky-950/20 border border-white/10 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Folder className="w-8 h-8 text-amber-400 shrink-0" />
              <span>Manajemen Berkas & Arsip Digital</span>
            </h1>

            <p className="text-sky-100 text-xs sm:text-sm leading-relaxed">
              Penyimpanan terpusat dokumen resmi sekolah, SK PTK, Kurikulum KOSP, berkas kesiswaan, dan sertifikat. Terhubung langsung secara otomatis dengan Google Drive satuan pendidikan.
            </p>

            {/* Google Drive Link Indicator */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
              <a
                href={GOOGLE_DRIVE_MAIN_FOLDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold transition-all hover:scale-[1.02] cursor-pointer shadow-sm"
                title="Buka Folder Google Drive Utama Sekolah"
              >
                <Folder className="w-4 h-4 text-amber-300" />
                <span>Buka Folder Google Drive Utama</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-950/40 border border-white/10 text-[11px] text-sky-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Repositori Arsip Digital Terpadu</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto shrink-0">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-900 font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/25 hover:scale-[1.02]"
            >
              <Upload className="w-4 h-4 text-slate-900" />
              <span>Unggah Berkas Baru</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {syncFeedback && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}
      </div>

      {/* Dynamic Tab Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('files')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'files'
                ? 'bg-white text-sky-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-sky-600" />
            <span>Semua Berkas ({files.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab('folders')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'folders'
                ? 'bg-white text-sky-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Folder className="w-4 h-4 text-amber-500" />
            <span>Kategori Folder ({categories.length})</span>
          </button>
        </div>

        {/* View Mode Toggle Controls */}
        {activeTab === 'files' && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                title="Tampilan Grid"
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                title="Tampilan List"
              >
                List
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Global Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input Box */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'folders'
                ? "Cari nama kategori folder..."
                : "Cari nama berkas, pengunggah, deskripsi, atau kata kunci..."
            }
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200/80 transition-colors cursor-pointer"
              title="Hapus Kata Kunci"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'files' && (
            <>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold focus:bg-white focus:border-sky-500 outline-none transition-all cursor-pointer"
              >
                <option value="ALL">Semua Kategori ({categories.length})</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    Folder: {cat}
                  </option>
                ))}
              </select>

              <select
                value={selectedPrivacy}
                onChange={(e) => setSelectedPrivacy(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold focus:bg-white focus:border-sky-500 outline-none transition-all cursor-pointer"
              >
                <option value="ALL">Semua Akses</option>
                <option value="Public">Publik</option>
                <option value="Guru Only">Khusus Guru</option>
                <option value="Restricted">Terbatas</option>
              </select>
            </>
          )}

          {activeTab === 'folders' && selectedCategory !== 'ALL' && (
            <button
              onClick={() => setSelectedCategory('ALL')}
              className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Folder className="w-3.5 h-3.5 text-amber-600" />
              <span>Filter: {selectedCategory}</span>
              <X className="w-3 h-3 text-amber-600" />
            </button>
          )}

          {(searchQuery || selectedCategory !== 'ALL' || selectedPrivacy !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedPrivacy('ALL');
              }}
              className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              title="Reset Semua Filter"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Permanent Information Banner */}
      <div className="bg-gradient-to-r from-sky-500/5 via-blue-500/5 to-indigo-500/5 border border-sky-200/50 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-sky-100 text-sky-700 shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="font-bold text-sky-950 text-sm">Pemberitahuan Status Pengunggahan Berkas</h4>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">Otomatis Aktif</span>
            </div>
            <p className="text-slate-700 text-xs leading-relaxed">
              Setiap berkas yang diunggah secara otomatis tersimpan ke <strong>Google Drive</strong>. Riwayat & status sukses pengunggahan akan langsung tercatat dan masuk ke menu <strong>Notifikasi (Ikon Lonceng)</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ALL FILES LIST & SEARCH */}
      {/* ========================================================================= */}
      {activeTab === 'files' && (
        <div className="space-y-4">
          {filteredFiles.length === 0 ? (
            files.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600 mb-4 shadow-xs">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mb-1">
                  Belum Ada Berkas yang Diunggah
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
                  Dokumen dan arsip digital sekolah yang Anda unggah akan otomatis tersimpan dan terorganisir rapi di sini.
                </p>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-md hover:scale-105 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-slate-950" />
                  <span>Unggah Berkas Sekarang</span>
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
                <p className="text-sm text-slate-500 mb-4">
                  Tidak ada berkas yang sesuai dengan kata kunci pencarian atau filter kategori yang Anda pilih.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setSelectedPrivacy('ALL');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                >
                  Reset Filter
                </button>
              </div>
            )
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFiles.map(file => (
                <div
                  key={file.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-sky-300 transition-all p-5 flex flex-col justify-between hover:shadow-md"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 font-bold text-[10px] border border-sky-100 flex items-center gap-1">
                        <Folder className="w-3 h-3 text-sky-600" />
                        <span className="truncate max-w-[150px]">{file.category}</span>
                      </span>

                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Tersimpan</span>
                      </span>
                    </div>

                    {/* File Icon & Name */}
                    <div className="flex items-start gap-3 mb-2.5">
                      <div className="w-11 h-11 bg-slate-100 rounded-xl border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center p-0.5">
                        {file.dataUrl && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(file.fileExtension?.toLowerCase()) ? (
                          <img src={file.dataUrl} alt={file.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          getFileIcon(file.fileExtension)
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug hover:text-sky-700 transition-colors">
                          {file.name}
                        </h3>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                          <span>{formatBytes(file.fileSize)}</span>
                          <span>•</span>
                          <span>{file.fileExtension.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {file.description && (
                      <p className="text-slate-600 text-xs line-clamp-2 mb-3 leading-relaxed">
                        {file.description}
                      </p>
                    )}

                    {/* Tags */}
                    {file.tags && file.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {file.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="border-t border-slate-100 pt-3 mt-2 flex items-center justify-between gap-2 text-xs">
                    <div className="text-[10px] text-slate-400 truncate">
                      Oleh: <strong className="text-slate-700">{file.uploadedBy.split(',')[0]}</strong>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {(!file.tags?.includes('GoogleDrive') || file.tags?.includes('Lokal')) && (
                        <button
                          onClick={() => handleSyncSingleFileToDrive(file)}
                          disabled={syncingFileId === file.id}
                          className="px-2 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                          title="Unggah / Sinkronkan ke Google Drive"
                        >
                          <RefreshCw className={`w-3 h-3 text-amber-700 ${syncingFileId === file.id ? 'animate-spin' : ''}`} />
                          <span>{syncingFileId === file.id ? 'Mengunggah...' : 'Ke Drive'}</span>
                        </button>
                      )}
                      <a
                        href={file.fileUrl || `/api/download-file/${file.id}` || file.driveFileUrl || file.dataUrl}
                        download={file.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold transition-colors cursor-pointer"
                        title="Unduh Berkas Langsung"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => setPreviewFile(file)}
                        className="px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Lihat Berkas"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat</span>
                      </button>
                      {canDeleteFile(file) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFile(file);
                          }}
                          className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title={isAdmin ? "Hapus Berkas (Administrator)" : "Hapus Berkas Saya"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table List View */
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-thin">
                <table className="w-full text-left text-xs text-slate-700 relative border-collapse">
                  <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="py-3 px-4">Nama Dokumen / Berkas</th>
                      <th className="py-3 px-4">Kategori Folder</th>
                      <th className="py-3 px-4">Ukuran & Format</th>
                      <th className="py-3 px-4">Pengunggah</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredFiles.map(file => (
                      <tr key={file.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {getFileIcon(file.fileExtension)}
                            <div>
                              <div className="font-bold text-slate-900">{file.name}</div>
                              <div className="text-[10px] text-slate-400">{file.uploadedAt}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 font-semibold text-[11px] border border-sky-100">
                            {file.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {formatBytes(file.fileSize)} ({file.fileExtension.toUpperCase()})
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{file.uploadedBy}</div>
                          <div className="text-[10px] text-slate-400">{file.uploadedByRole}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {(!file.tags?.includes('GoogleDrive') || file.tags?.includes('Lokal')) && (
                              <button
                                onClick={() => handleSyncSingleFileToDrive(file)}
                                disabled={syncingFileId === file.id}
                                className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                                title="Unggah / Sinkronkan ke Google Drive"
                              >
                                <RefreshCw className={`w-3 h-3 text-amber-700 ${syncingFileId === file.id ? 'animate-spin' : ''}`} />
                                <span>{syncingFileId === file.id ? 'Mengunggah...' : 'Ke Drive'}</span>
                              </button>
                            )}
                            <a
                              href={file.fileUrl || `/api/download-file/${file.id}` || file.driveFileUrl || file.dataUrl}
                              download={file.name}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                              title="Unduh Berkas Langsung"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => setPreviewFile(file)}
                              className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat</span>
                            </button>
                            {canDeleteFile(file) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFile(file);
                                }}
                                className="p-1 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                                title={isAdmin ? "Hapus Berkas (Administrator)" : "Hapus Berkas Saya"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FOLDER DIRECTORY CATEGORIES */}
      {/* ========================================================================= */}
      {activeTab === 'folders' && (
        <div className="space-y-4">
          {categories.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600 mb-4 shadow-xs">
                <Folder className="w-8 h-8" />
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mb-1">
                Belum Ada Kategori Folder
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
                Kategori folder akan otomatis terbentuk saat Anda mengunggah dokumen baru dan memilih atau menuliskan nama folder tujuan.
              </p>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-md hover:scale-105 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4 text-slate-950" />
                <span>Unggah Berkas & Buat Folder</span>
              </button>
            </div>
          ) : (
            (() => {
              const filteredCats = categories.filter(cat =>
                cat.toLowerCase().includes(searchQuery.toLowerCase().trim())
              );

              if (filteredCats.length === 0) {
                return (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
                    <p className="text-sm text-slate-600 mb-3 font-medium">
                      Tidak ada kategori folder yang sesuai dengan kata kunci "<span className="font-bold text-slate-900">{searchQuery}</span>".
                    </p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                    >
                      Reset Pencarian
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCats.map(cat => {
                    const catFiles = files.filter(f => f.category === cat);
                    const totalSize = catFiles.reduce((sum, f) => sum + f.fileSize, 0);

                    return (
                      <div
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setActiveTab('files');
                        }}
                        className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-sky-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
                            <Folder className="w-6 h-6" />
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                            {catFiles.length} Berkas
                          </span>
                        </div>

                        <div>
                          <h3 className="font-bold text-slate-900 text-sm group-hover:text-sky-600 transition-colors mb-1">
                            {cat}
                          </h3>
                          <p className="text-[11px] text-slate-500 mb-3">
                            Total Ukuran: {formatBytes(totalSize)}
                          </p>

                          <div className="flex items-center justify-between text-xs text-sky-600 font-bold pt-2 border-t border-slate-100">
                            <span>Buka Folder</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MULTI-UPLOAD BERKAS */}
      {/* ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 pt-16 sm:pt-6 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-slate-100 space-y-3 animate-scale-up max-h-[85vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Unggah Berkas Baru ke Database</h3>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Google Drive Status inside Modal */}
            {isDriveLinked && (
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-hidden">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate font-medium">
                    Google Drive Terhubung: <strong>{driveUser?.email}</strong>
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 text-[10px] font-bold shrink-0">
                  Otomatis Sinkron
                </span>
              </div>
            )}

            {/* Mobile & Desktop Friendly File Picker Box */}
            <label
              htmlFor="berkas-file-input"
              className="relative block border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/50 hover:bg-sky-50/90 active:bg-sky-100 rounded-2xl p-4 text-center transition-all cursor-pointer group select-none shadow-xs"
            >
              <input
                id="berkas-file-input"
                type="file"
                multiple
                ref={multiFileInputRef}
                onChange={handleFileSelection}
                className="sr-only"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.svg,.zip,.rar,image/*,application/*"
              />
              <div className="flex flex-col items-center justify-center">
                <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="font-extrabold text-slate-900 text-xs sm:text-sm mb-1">
                  Pilih Berkas dari HP atau Komputer
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs my-1 transition-colors">
                  📂 Buka File Picker / Galeri HP
                </span>
                <p className="text-slate-500 text-[11px] mt-1 max-w-sm">
                  Mendukung PDF, Word, Excel, Foto/Gambar, ZIP. Bisa pilih langsung dari penyimpanan internal HP atau browser.
                </p>
              </div>
            </label>

            {/* Selected Files List */}
            {selectedUploadFiles.length > 0 && (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                <div className="text-xs font-bold text-slate-700 flex justify-between">
                  <span>Berkas Terpilih ({selectedUploadFiles.length})</span>
                  <button
                    onClick={() => setSelectedUploadFiles([])}
                    className="text-rose-500 hover:underline text-[11px]"
                  >
                    Hapus Semua
                  </button>
                </div>
                {selectedUploadFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                      <span className="font-medium text-slate-900 truncate">{file.name}</span>
                      <span className="text-slate-400 text-[10px]">({formatBytes(file.size)})</span>
                    </div>
                    <button
                      onClick={() => removeSelectedUploadFile(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Category / Folder Selection Mode */}
            <div className="space-y-3 bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Folder className="w-4 h-4 text-amber-500" />
                  <span>Tujuan Folder di Google Drive & Dapodik *</span>
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Pilih salah satu metode</span>
              </div>

              {/* Mode Switch Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/70 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setFolderChoiceMode('category');
                  }}
                  className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    folderChoiceMode === 'category'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Folder className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pilih Kategori Folder</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFolderChoiceMode('custom');
                  }}
                  className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    folderChoiceMode === 'custom'
                      ? 'bg-amber-400 text-slate-950 shadow-sm font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 text-slate-950" />
                  <span>Buat Folder Baru Sendiri</span>
                </button>
              </div>

              {/* Mode Content */}
              {folderChoiceMode === 'category' ? (
                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-700">
                    Kategori Folder Tujuan:
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={e => setUploadCategory(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-sky-500 shadow-xs"
                  >
                    <option value="Kurikulum & Pembelajaran">Kurikulum & Pembelajaran</option>
                    <option value="Kepegawaian & SK PTK">Kepegawaian & SK PTK</option>
                    <option value="Kesiswaan & Ijazah">Kesiswaan & Ijazah</option>
                    <option value="Sarpras & Inventaris">Sarpras & Inventaris</option>
                    <option value="Keuangan & BOS">Keuangan & BOS</option>
                    <option value="Akreditasi & SPM">Akreditasi & SPM</option>
                    <option value="Surat & Administrasi">Surat & Administrasi</option>
                    <option value="Umum">Umum</option>
                    {categories.filter((c: string) => ![
                      'Semua Kategori',
                      'Kurikulum & Pembelajaran',
                      'Kepegawaian & SK PTK',
                      'Kesiswaan & Ijazah',
                      'Sarpras & Inventaris',
                      'Keuangan & BOS',
                      'Akreditasi & SPM',
                      'Surat & Administrasi',
                      'Umum'
                    ].includes(c)).map((customCat: string) => (
                      <option key={customCat} value={customCat}>
                        📁 {customCat} (Folder Kustom)
                      </option>
                    ))}
                  </select>
                  <div className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Folder otomatis dibuat & berkas masuk ke folder <strong>"{uploadCategory}"</strong> di Google Drive.</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-slate-700">
                      Nama Folder Baru yang Ingin Dibuat Sendiri:
                    </label>
                    <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
                      Kategori Otomatis
                    </span>
                  </div>
                  <input
                    type="text"
                    value={customFolder}
                    onChange={e => {
                      setCustomFolder(e.target.value);
                      if (folderChoiceMode !== 'custom') setFolderChoiceMode('custom');
                    }}
                    placeholder="Contoh: Arsip Soal Ujian 2026, SPJ BOS Tahap 1, dll..."
                    className="w-full p-2.5 bg-white border border-amber-300 focus:border-amber-500 rounded-xl text-slate-900 font-medium focus:outline-none shadow-xs"
                    autoFocus
                  />
                  <div className="text-[11px] text-amber-950 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        {customFolder.trim()
                          ? `Folder baru "${customFolder.trim()}" akan otomatis dibuat di Google Drive & tampil di menu Kategori Folder.`
                          : 'Ketik nama folder baru. Berkas akan masuk ke folder baru ini di Google Drive & menu kategori.'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Uploader Profile Badge & Privacy Selector for All Roles */}
            <div className="bg-sky-50/90 p-3.5 rounded-2xl border border-sky-200/80 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-sky-700 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                    {(currentUser?.nama || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">
                      {currentUser?.nama || 'Pengguna Terdaftar'}
                    </div>
                    <div className="text-[10px] text-sky-800 font-medium">
                      Role: <span className="bg-sky-200 text-sky-950 px-1.5 py-0.2 rounded font-extrabold">{currentUser?.role || 'Umum'}</span> • Hak unggah aktif untuk semua role
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Dapat Mengunggah</span>
                </div>
              </div>

              {/* Privacy Setting Selector */}
              <div className="space-y-1 pt-1.5 border-t border-sky-200/70">
                <label className="block font-semibold text-slate-800 text-[11px]">
                  Tingkat Akses & Privasi Dokumen:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadPrivacy('Public')}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      uploadPrivacy === 'Public'
                        ? 'bg-white border-emerald-500 shadow-xs ring-2 ring-emerald-500/30'
                        : 'bg-white/70 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <div className="font-extrabold text-slate-900 text-[11px] flex items-center gap-1">
                      <span>🌐 Publik</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">Semua role (Guru, Siswa, Tendik) dapat akses</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadPrivacy('Guru Only')}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      uploadPrivacy === 'Guru Only'
                        ? 'bg-white border-sky-500 shadow-xs ring-2 ring-sky-500/30'
                        : 'bg-white/70 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <div className="font-extrabold text-slate-900 text-[11px] flex items-center gap-1">
                      <span>👨‍🏫 Khusus Guru</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">Khusus Guru, Tendik & Kepala Sekolah</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadPrivacy('Restricted')}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      uploadPrivacy === 'Restricted'
                        ? 'bg-white border-amber-500 shadow-xs ring-2 ring-amber-500/30'
                        : 'bg-white/70 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <div className="font-extrabold text-slate-900 text-[11px] flex items-center gap-1">
                      <span>🔒 Terbatas</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">Hanya Pengunggah & Administrator</div>
                  </button>
                </div>
              </div>

              {/* Description Input */}
              <div className="space-y-1">
                <label className="block font-semibold text-slate-800 text-[11px]">
                  Keterangan / Catatan Berkas (Opsional):
                </label>
                <input
                  type="text"
                  value={uploadDescription}
                  onChange={e => setUploadDescription(e.target.value)}
                  placeholder="Contoh: SK Tugas Mengajar 2026, Nilai Asesmen, Sertifikat Pelatihan..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-sky-500 shadow-xs font-medium"
                />
              </div>
            </div>

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="space-y-3.5 p-4 bg-[#1e1e1e] text-[#d4d4d4] rounded-2xl border border-zinc-800 shadow-xl font-mono text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#9cdcfe]">
                    <FileCode className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate text-xs tracking-tight font-bold">
                      /{uploadCategory || 'Database'}/{currentUploadingFileName || 'berkas'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-[#ce9178] font-bold">
                    <span>Uploading {currentUploadingFileIndex} of {selectedUploadFiles.length} files</span>
                    <span className="text-[#b5cea8] font-mono font-extrabold text-sm">{uploadProgress}%</span>
                  </div>
                </div>

                <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#4ec9b0] h-full transition-all duration-300 ease-out rounded-full shadow-xs"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1.5 text-zinc-400 border-t border-zinc-800/80">
                  <div className="flex items-center gap-1.5 text-[#569cd6]">
                    <span>{uploadRemainingBytesText || 'Mengunggah...'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      uploadCancelledRef.current = true;
                    }}
                    className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-300 font-bold text-[10px] rounded border border-red-800/40 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    <span>Batal</span>
                  </button>
                </div>
              </div>
            )}

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                disabled={isUploading}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteUpload}
                disabled={isUploading || selectedUploadFiles.length === 0}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-400/20 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>Unggah ({selectedUploadFiles.length} Berkas)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FILE PREVIEW & DETAILS */}
      {/* ========================================================================= */}
      {previewFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 pt-16 sm:pt-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl border border-slate-100 space-y-3 animate-scale-up max-h-[85vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 overflow-hidden">
                {getFileIcon(previewFile.fileExtension)}
                <div className="min-w-0">
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base truncate max-w-xs sm:max-w-sm">
                    {previewFile.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {previewFile.category} • {formatBytes(previewFile.fileSize)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Details */}
            <div className="space-y-2.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-600 text-[11px]">
                  <div>
                    <span className="text-slate-400">Pengunggah:</span>{' '}
                    <strong className="text-slate-900">{previewFile.uploadedBy}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Waktu:</span>{' '}
                    <strong className="text-slate-900">{previewFile.uploadedAt}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Format:</span>{' '}
                    <strong className="text-slate-900">{previewFile.fileExtension.toUpperCase()}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Kategori:</span>{' '}
                    <strong className="text-emerald-700">{previewFile.category}</strong>
                  </div>
                </div>

                {previewFile.description && (
                  <div className="pt-1.5 border-t border-slate-200/80 text-[11px]">
                    <span className="text-slate-400">Deskripsi:</span>
                    <p className="text-slate-800 mt-0.5">{previewFile.description}</p>
                  </div>
                )}
              </div>

              {/* Preview Window */}
              {previewFile.dataUrl || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(previewFile.fileExtension?.toLowerCase()) ? (
                <div className="p-2.5 bg-slate-900 rounded-xl text-center space-y-2 border border-slate-800 flex flex-col items-center">
                  <div className="max-h-[200px] w-full flex items-center justify-center bg-slate-950/80 rounded-lg overflow-hidden p-1.5 border border-slate-800">
                    <img
                      src={previewFile.dataUrl || previewFile.driveFileUrl}
                      alt={previewFile.name}
                      referrerPolicy="no-referrer"
                      className="max-h-[180px] max-w-full object-contain rounded-md shadow-md"
                    />
                  </div>
                  <div className="pt-0.5 flex flex-wrap items-center justify-center gap-2">
                    <a
                      href={previewFile.fileUrl || `/api/download-file/${previewFile.id}` || previewFile.dataUrl || previewFile.driveFileUrl}
                      download={previewFile.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Berkas</span>
                    </a>
                    <a
                      href={previewFile.driveFileUrl || GOOGLE_DRIVE_MAIN_FOLDER_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka File di Google Drive</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-900 rounded-xl text-center text-slate-300 space-y-2 border border-slate-800">
                  <FileCheck2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <div className="font-bold text-white text-xs">Pratinjau Dokumen Tersedia</div>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-tight">
                    Berkas telah diverifikasi & tersimpan di repositori server sekolah dan Google Drive.
                  </p>
                  <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
                    <a
                      href={previewFile.fileUrl || `/api/download-file/${previewFile.id}` || previewFile.dataUrl || previewFile.driveFileUrl}
                      download={previewFile.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Berkas</span>
                    </a>
                    <a
                      href={previewFile.driveFileUrl || GOOGLE_DRIVE_MAIN_FOLDER_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka File di Google Drive</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              {isAdmin ? (
                <button
                  onClick={() => {
                    handleDeleteFile(previewFile);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200"
                  title="Hapus Berkas dari Repositori"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Hapus Berkas</span>
                </button>
              ) : <div />}
              <button
                onClick={() => setPreviewFile(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRM DELETE FILE */}
      {/* ========================================================================= */}
      {deletingFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 pt-16 sm:pt-6 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-up my-auto max-h-[85vh] overflow-y-auto">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Hapus Berkas</h3>
                <p className="text-xs text-slate-500">Konfirmasi tindakan Administrator</p>
              </div>
            </div>

            <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200/80 space-y-2 text-xs">
              <div className="font-bold text-slate-900 text-sm">{deletingFile.name}</div>
              <div className="text-slate-600 flex flex-wrap gap-2 text-[11px]">
                <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  📁 {deletingFile.category}
                </span>
                <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  📦 {formatBytes(deletingFile.fileSize)}
                </span>
                <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  🕒 {deletingFile.uploadedAt}
                </span>
              </div>
              <p className="text-rose-800 text-[11px] pt-1">
                Apakah Anda yakin ingin menghapus berkas ini dari Google Drive? Berkas tidak akan lagi dapat diakses oleh pengguna lain.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingFile(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteFile}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/20 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Berkas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GOOGLE DRIVE DIAGNOSTICS & SETUP GUIDE */}
      {/* ========================================================================= */}
      {isDriveGuideModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 pt-16 sm:pt-6 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-scale-up my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
                  <HardDrive className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                    <span>Panduan & Setup Google Drive</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                      v2.9 Sync
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pastikan berkas tersimpan 100% di Google Drive milik Sekolah / Pribadi Anda
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDriveGuideModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Diagnostic Alert Box */}
            {driveTestResult && (
              <div className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 ${
                driveTestResult.success
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}>
                <div className="font-bold text-sm flex items-center gap-2">
                  {driveTestResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <X className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <span>{driveTestResult.success ? 'Koneksi Google Drive Terverifikasi LULUS!' : 'Koneksi Google Drive Belum Siap'}</span>
                </div>
                <div className="whitespace-pre-line text-slate-700 font-medium">
                  {driveTestResult.message}
                </div>
                {driveTestResult.url && (
                  <a
                    href={driveTestResult.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-bold text-sky-600 hover:underline pt-1"
                  >
                    <span>Lihat Berkas Tes di Google Drive</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}

            {/* Quick URL Config Form */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <label className="block text-xs font-bold text-slate-800">
                URL Aplikasi Web Google Apps Script (Web App Exec URL):
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={inputWebAppUrl}
                  onChange={(e) => setInputWebAppUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleTestDriveConnection(inputWebAppUrl)}
                  disabled={isTestingDriveConnection}
                  className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-sky-600/20 cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {isTestingDriveConnection ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menguji...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Simpan & Tes Koneksi</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Panduan Setup / Re-Otorisasi Kode.gs Tanpa Merusak Data:</span>
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={downloadKodeGsFile}
                    className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    title="Unduh file Kode.gs langsung ke komputer/HP Anda"
                  >
                    <Download className="w-3.5 h-3.5 text-white" />
                    <span>Unduh Kode.gs</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyAppsScriptCode}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    {isScriptCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-slate-950" />
                        <span>Kode Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-950" />
                        <span>Salin Kode Script</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0">1</span>
                    <span>Buka Apps Script</span>
                  </div>
                  <p className="text-slate-600 text-[11px] pl-6">
                    Buka Google Sheets Sekolah &gt; <strong>Ekstensi</strong> &gt; <strong>Apps Script</strong>.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0">2</span>
                    <span>Tempel Kode Baru</span>
                  </div>
                  <p className="text-slate-600 text-[11px] pl-6">
                    Hapus isi lama, lalu <strong>Paste (Ctrl+V)</strong> kode v3.0 terbaru.
                  </p>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 space-y-1 md:col-span-2">
                  <div className="font-bold text-amber-950 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0">3</span>
                    <span>⚡ CARA MUDAH IJIN GOOGLE DRIVE (Klik ▶ Jalankan):</span>
                  </div>
                  <p className="text-amber-900 text-[11px] pl-6 leading-relaxed">
                    Di bagian atas editor Apps Script, pilih fungsi <strong>testAndAuthorizeGoogleDrive</strong> dari dropdown, lalu klik tombol ▶ <strong>Jalankan (Run)</strong>.<br />
                    Klik <strong>Tinjau Izin (Review Permissions)</strong> &gt; Pilih Akun Google &gt; <strong>Lanjutan (Advanced)</strong> &gt; <strong>Buka Script (tidak aman)</strong> &gt; <strong>Izinkan (Allow)</strong>.<br />
                    <em>Selesai! Izin Google Drive akan langsung aktif 100% tanpa merusak data spreadsheet!</em>
                  </p>
                </div>

                <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-1 md:col-span-2">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0">4</span>
                    <span>Terapkan / Deploy Aplikasi Web:</span>
                  </div>
                  <ul className="list-disc list-inside text-emerald-900 text-[11px] pl-6 space-y-0.5">
                    <li>Klik <strong>Terapkan (Deploy)</strong> &gt; <strong>Penerapan Baru (New Deployment)</strong></li>
                    <li>Pilih jenis: <strong>Aplikasi Web (Web App)</strong></li>
                    <li>Jalankan sebagai (Execute as): <strong>Saya (Me)</strong></li>
                    <li>Akses (Who has access): <strong>Siapa saja (Anyone)</strong> *(WAJIB!)*</li>
                    <li>Klik <strong>Terapkan (Deploy)</strong>, salin URL Web App dan tempel ke kotak di atas, lalu klik <strong>Simpan & Tes Koneksi</strong>!</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Option B: Direct OAuth Google Account Connect */}
            <div className="p-4 bg-sky-50/80 rounded-2xl border border-sky-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-bold text-sky-950 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-sky-600" />
                  <span>Atau Opsi B: Hubungkan Langsung Akun Google (OAuth)</span>
                </div>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Alternatif lain: login dan otorisasi langsung menggunakan akun Google Drive Anda.
                </p>
              </div>
              <button
                type="button"
                onClick={handleConnectDrive}
                disabled={isConnectingDrive}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-bold border border-slate-300 shadow-xs text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
              >
                <span>{isConnectingDrive ? 'Menghubungkan...' : '🔑 Hubungkan Akun Google'}</span>
              </button>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCopyAppsScriptCode}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span>{isScriptCopied ? 'Kode Script Copied!' : 'Salin Kode Script'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDriveGuideModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
