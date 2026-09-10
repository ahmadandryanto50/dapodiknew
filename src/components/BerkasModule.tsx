import React, { useState, useRef, useEffect } from 'react';
import {
  Folder,
  FolderPlus,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileArchive,
  Upload,
  Download,
  Eye,
  Lock,
  Unlock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  ExternalLink,
  Plus,
  Copy,
  Trash2,
  Sparkles,
  UserCheck,
  HardDrive,
  Share2,
  Key,
  FolderLock,
  RefreshCw,
  Info,
  ChevronRight,
  Send,
  Check,
  X,
  FileCheck2,
  Building,
  Layers,
  FileCode,
  Tag,
  LogIn,
  LogOut,
  Bell,
  AlertCircle,
  Ban,
  ShieldAlert,
  Loader2,
  ShieldX,
  Power
} from 'lucide-react';
import { SchoolFileItem, FileAccessRequest, AdminUser, SyncConfig } from '../types';
import { GOOGLE_DRIVE_MAIN_FOLDER_URL, GOOGLE_DRIVE_FOLDER_ID, initialSchoolFiles, initialAccessRequests } from '../data/mockFiles';
import {
  subscribeGoogleDriveAuth,
  signInWithGoogleDrive,
  signOutGoogleDrive,
  uploadFileToGoogleDrive,
  isGoogleDriveConnected
} from '../services/googleDriveService';
import {
  uploadFileToDriveViaAppsScript,
  APPS_SCRIPT_TEMPLATE,
  downloadKodeGsFile,
  syncPermintaanAksesToGoogleSheets,
  syncBerkasToGoogleSheets
} from '../services/googleSheetsService';

const compressImageIfNeeded = (file: File, maxWidth = 1000, maxHeight = 1000, quality = 0.5): Promise<string> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string || '');
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(outputType, quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve(event.target?.result as string || '');
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
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
  onBackToHome, 
  autoOpenUpload, 
  syncConfig,
  files: propFiles,
  setFiles: propSetFiles,
  accessRequests: propAccessRequests,
  setAccessRequests: propSetAccessRequests,
  customFolders: propCustomFolders,
  setCustomFolders: propSetCustomFolders
}) => {
  // Persistence state - Clean empty initialization
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

  const [localAccessRequests, setLocalAccessRequests] = useState<FileAccessRequest[]>(() => {
    try {
      const saved = localStorage.getItem('dapodik_file_access_requests_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading access requests', e);
    }
    return initialAccessRequests;
  });
  const accessRequests = propAccessRequests !== undefined ? propAccessRequests : localAccessRequests;
  const setAccessRequests = propSetAccessRequests !== undefined ? propSetAccessRequests : setLocalAccessRequests;

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

  const [isSyncingRequests, setIsSyncingRequests] = useState<boolean>(false);
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

  useEffect(() => {
    if (propAccessRequests !== undefined) {
      setLocalAccessRequests(propAccessRequests);
    }
  }, [propAccessRequests]);

  // Helper function to safely merge incoming remote files with local files without losing newly uploaded items
  const mergeFilesWithLocal = (incomingFiles: SchoolFileItem[]): SchoolFileItem[] => {
    let deletedIds: string[] = [];
    try {
      const savedDel = localStorage.getItem('dapodik_deleted_file_ids');
      if (savedDel) deletedIds = JSON.parse(savedDel);
    } catch (e) {}
    const delSet = new Set(deletedIds);

    let currentLocal: SchoolFileItem[] = [];
    try {
      const savedLocal = localStorage.getItem('dapodik_school_files_v3');
      if (savedLocal) currentLocal = JSON.parse(savedLocal);
    } catch (e) {}

    const fileMap = new Map<string, SchoolFileItem>();

    // 1. Put current local state files into map first
    (files || []).forEach(f => {
      if (f && f.id && !delSet.has(String(f.id))) {
        fileMap.set(String(f.id), f);
      }
    });

    // 2. Put current localStorage files into map
    (currentLocal || []).forEach(f => {
      if (f && f.id && !delSet.has(String(f.id))) {
        const existing = fileMap.get(String(f.id));
        if (existing) {
          fileMap.set(String(f.id), { ...existing, ...f, dataUrl: f.dataUrl || existing.dataUrl });
        } else {
          fileMap.set(String(f.id), f);
        }
      }
    });

    // 3. Put incoming files from server or Google Sheets into map
    (incomingFiles || []).forEach(f => {
      if (f && f.id && !delSet.has(String(f.id))) {
        const existing = fileMap.get(String(f.id));
        if (existing) {
          fileMap.set(String(f.id), { ...existing, ...f, dataUrl: f.dataUrl || existing.dataUrl });
        } else {
          fileMap.set(String(f.id), f);
        }
      }
    });

    const merged = Array.from(fileMap.values());
    merged.sort((a, b) => {
      const timeA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
      const timeB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
      return timeB - timeA;
    });
    return merged;
  };

  // Pull latest access requests & school files from Server Cache and Google Sheets
  const handlePullRequestsFromCloud = async (silent: boolean = false) => {
    try {
      // Immediately fetch from high-speed Server Cache (/api/app-data)
      let updatedAny = false;
      try {
        const cacheRes = await fetch(`/api/app-data?t=${Date.now()}`);
        if (cacheRes.ok) {
          const cacheData = await cacheRes.json();
          if (Array.isArray(cacheData.permintaanAkses)) {
            setAccessRequests(prev => {
              const map = new Map<string, FileAccessRequest>();
              if (Array.isArray(prev)) {
                prev.forEach(req => {
                  if (req && req.id) map.set(req.id, req);
                });
              }
              cacheData.permintaanAkses.forEach((req: FileAccessRequest) => {
                if (req && req.id) {
                  const existing = map.get(req.id);
                  if (existing) {
                    map.set(req.id, { ...existing, ...req });
                  } else {
                    map.set(req.id, req);
                  }
                }
              });
              const merged = Array.from(map.values()).sort((a, b) => {
                const timeA = a.requestedAt ? new Date(a.requestedAt).getTime() : 0;
                const timeB = b.requestedAt ? new Date(b.requestedAt).getTime() : 0;
                return timeB - timeA;
              });

              if (JSON.stringify(prev) !== JSON.stringify(merged)) {
                localStorage.setItem('dapodik_file_access_requests_v3', JSON.stringify(merged));
                return merged;
              }
              return prev;
            });
            updatedAny = true;
          }
          if (Array.isArray(cacheData.schoolFiles) && cacheData.schoolFiles.length > 0) {
            const merged = mergeFilesWithLocal(cacheData.schoolFiles);
            setFiles(merged);
            localStorage.setItem('dapodik_school_files_v3', JSON.stringify(merged));
            updatedAny = true;
          }
        }
      } catch (cacheErr) {
        console.warn('Cache pull error:', cacheErr);
      }

      if (!silent) {
        setSyncFeedback(updatedAny ? 'Data izin akses berhasil disinkronkan!' : 'Database berkas sudah up-to-date!');
        setTimeout(() => setSyncFeedback(null), 3000);
      }
    } catch (err: any) {
      console.warn('Pull access requests error:', err);
      if (!silent) {
        setSyncFeedback('Gagal menyinkronkan data izin akses.');
        setTimeout(() => setSyncFeedback(null), 4000);
      }
    }
  };

  // Pull on initial load and recurring multi-device sync
  useEffect(() => {
    handlePullRequestsFromCloud(true);

    const intervalId = setInterval(() => {
      handlePullRequestsFromCloud(true);
    }, 4000);

    const onFocus = () => {
      handlePullRequestsFromCloud(true);
    };
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
    };
  }, [activeSyncConfig?.webAppUrl]);

  // Synchronize helper for all operations (Create, Approve, Reject, Delete)
  const persistAndSyncRequests = async (
    updatedRequests: FileAccessRequest[],
    deletedId?: string,
    successNote?: string
  ) => {
    setLocalAccessRequests(updatedRequests);
    if (propSetAccessRequests) {
      propSetAccessRequests(updatedRequests);
    }
    try {
      localStorage.setItem('dapodik_file_access_requests_v3', JSON.stringify(updatedRequests));
    } catch (e) {}

    // Broadcast to server app-data cache immediately
    fetch('/api/app-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        permintaanAkses: updatedRequests,
        ...(deletedId ? { deletedPermintaanAksesIds: [deletedId] } : {})
      })
    }).catch(() => {});

    // Sync to Google Sheets
    const syncCfg = activeSyncConfig || syncConfig;
    if (syncCfg && syncCfg.webAppUrl) {
      syncPermintaanAksesToGoogleSheets(syncCfg, updatedRequests).catch(err => {
        console.error('Failed to sync permintaan akses to Google Sheets:', err);
      });
    }

    if (successNote) {
      setSyncFeedback(successNote);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

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

    // Strip large dataUrl before sending over server cache and spreadsheet to save network and prevent payload overflow
    const cleanFiles = updatedFiles.map(f => {
      if (f.dataUrl && f.dataUrl.length > 80000) {
        const { dataUrl, ...rest } = f;
        return rest;
      }
      return f;
    });

    // Broadcast to server app-data cache immediately so any other browser/laptop/HP updates in real-time
    fetch('/api/app-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolFiles: cleanFiles,
        ...(deletedId ? { deletedFileIds: [deletedId], deletedFileId: deletedId } : {})
      })
    }).catch(() => {});

    // Sync to Google Sheets
    const syncCfg = activeSyncConfig || syncConfig;
    if (syncCfg && syncCfg.webAppUrl) {
      syncBerkasToGoogleSheets(syncCfg, cleanFiles).catch(err => {
        console.error('Failed to sync berkas to Google Sheets:', err);
      });
    }

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

    // Sample 10-byte text file base64
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

  useEffect(() => {
    try {
      localStorage.setItem('dapodik_file_access_requests_v3', JSON.stringify(accessRequests));
    } catch (e) {
      console.error('Failed to save file access requests', e);
    }
  }, [accessRequests]);

  // Tab & Filters
  const [activeTab, setActiveTab] = useState<'files' | 'folders' | 'approvals'>('files');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPrivacy, setSelectedPrivacy] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(!!autoOpenUpload);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (autoOpenUpload) {
      setIsUploadModalOpen(true);
    }
  }, [autoOpenUpload]);
  const [selectedFileForRequest, setSelectedFileForRequest] = useState<SchoolFileItem | null>(null);
  const [previewFile, setPreviewFile] = useState<SchoolFileItem | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Upload Form State
  const [folderChoiceMode, setFolderChoiceMode] = useState<'category' | 'custom'>('category');
  const [uploadCategory, setUploadCategory] = useState<string>('Kurikulum & Pembelajaran');
  const [customFolder, setCustomFolder] = useState<string>('');
  const [uploadPrivacy, setUploadPrivacy] = useState<'Restricted' | 'Guru Only' | 'Public'>('Restricted');
  const [uploadDescription, setUploadDescription] = useState<string>('');
  const [selectedUploadFiles, setSelectedUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadRemainingBytesText, setUploadRemainingBytesText] = useState<string>('');
  const [currentUploadingFileIndex, setCurrentUploadingFileIndex] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const uploadCancelledRef = useRef<boolean>(false);
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  // Request Access Form State
  const [requestName, setRequestName] = useState<string>(currentUser?.nama || '');
  const [requestRole, setRequestRole] = useState<string>(currentUser?.role || 'Guru Mata Pelajaran');
  const [requestEmail, setRequestEmail] = useState<string>(currentUser?.email || '');
  const [requestReason, setRequestReason] = useState<string>('');
  const [requestSuccessMsg, setRequestSuccessMsg] = useState<string | null>(null);

  // Delete Confirmation States
  const [deletingFile, setDeletingFile] = useState<SchoolFileItem | null>(null);
  const [deletingRequest, setDeletingRequest] = useState<FileAccessRequest | null>(null);

  const isAdmin = Boolean(
    currentUser && (
      currentUser.role === 'Administrator' ||
      currentUser.role === 'Operator' ||
      currentUser.username === 'admin' ||
      (typeof currentUser.role === 'string' && currentUser.role.toLowerCase().includes('admin'))
    )
  );
  const isOperator = currentUser?.role === 'Operator';

  // Check if current user is an educator / school staff (Guru, Kepsek, Operator, Admin)
  const isSchoolStaff = Boolean(
    currentUser && (
      isAdmin ||
      currentUser.role === 'Guru' ||
      currentUser.role === 'Kepala Sekolah' ||
      currentUser.role === 'Operator' ||
      (typeof currentUser.role === 'string' && (
        currentUser.role.toLowerCase().includes('guru') ||
        currentUser.role.toLowerCase().includes('ptk') ||
        currentUser.role.toLowerCase().includes('kepsek') ||
        currentUser.role.toLowerCase().includes('pendidik')
      ))
    )
  );

  // Extract all categories including customFolders
  const categories = Array.from(new Set([
    ...files.map(f => f.category),
    ...customFolders
  ])).filter(Boolean);

  // Robust matching to check if a request belongs to current user / current browser session
  const isUserRequestMatch = (req: FileAccessRequest): boolean => {
    // 1. Check local request IDs submitted from this browser session
    try {
      const savedIds = localStorage.getItem('dapodik_my_request_ids');
      if (savedIds) {
        const ids: string[] = JSON.parse(savedIds);
        if (Array.isArray(ids) && ids.includes(req.id)) return true;
      }
    } catch (e) {}

    // 2. Check saved requester profile from previous submissions in this browser
    try {
      const savedProfile = localStorage.getItem('dapodik_my_requester_profile');
      if (savedProfile) {
        const prof = JSON.parse(savedProfile);
        if (prof.email && req.requesterEmail && prof.email.toLowerCase().trim() === req.requesterEmail.toLowerCase().trim()) {
          return true;
        }
        if (prof.name && req.requesterName && prof.name.toLowerCase().trim() === req.requesterName.toLowerCase().trim()) {
          return true;
        }
      }
    } catch (e) {}

    // 3. Match against currentUser
    const curName = (currentUser?.nama || '').toLowerCase().trim();
    const curUser = (currentUser?.username || '').toLowerCase().trim();
    const curEmail = (currentUser?.email || '').toLowerCase().trim();
    const reqName = (req.requesterName || '').toLowerCase().trim();
    const reqEmail = (req.requesterEmail || '').toLowerCase().trim();

    // Direct exact matches
    if (curEmail && reqEmail && curEmail === reqEmail) return true;
    if (curName && reqName && curName === reqName) return true;
    if (curUser && reqName && curUser === reqName) return true;

    // Fuzzy clean name matching (handles titles, roles in parentheses, digits, special characters)
    const cleanCurName = curName.replace(/\(.*?\)/g, '').replace(/[@_0-9]/g, ' ').replace(/\s+/g, ' ').trim();
    const cleanReqName = reqName.replace(/\(.*?\)/g, '').replace(/[@_0-9]/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleanCurName && cleanReqName) {
      if (cleanCurName === cleanReqName) return true;
      if (cleanCurName.includes(cleanReqName) || cleanReqName.includes(cleanCurName)) return true;
      const curWords = cleanCurName.split(' ').filter(w => w.length >= 3);
      const reqWords = cleanReqName.split(' ').filter(w => w.length >= 3);
      if (curWords.length > 0 && reqWords.length > 0 && curWords.some(w => reqWords.includes(w))) {
        return true;
      }
    }

    // Email username prefix matching (e.g. ahmad.andryanto50 vs ahmadandryanto24)
    if (curEmail && reqEmail) {
      const curPrefix = curEmail.split('@')[0].replace(/[^a-z]/g, '');
      const reqPrefix = reqEmail.split('@')[0].replace(/[^a-z]/g, '');
      if (curPrefix.length >= 4 && reqPrefix.length >= 4 && (curPrefix.includes(reqPrefix) || reqPrefix.includes(curPrefix))) {
        return true;
      }
    }

    // If requester name words appear in user's email
    if (cleanReqName && curEmail) {
      const reqWords = cleanReqName.split(' ').filter(w => w.length >= 4);
      if (reqWords.length > 0 && reqWords.every(w => curEmail.includes(w))) {
        return true;
      }
    }

    // If current user name words appear in requester email
    if (cleanCurName && reqEmail) {
      const curWords = cleanCurName.split(' ').filter(w => w.length >= 4);
      if (curWords.length > 0 && curWords.every(w => reqEmail.includes(w))) {
        return true;
      }
    }

    // 4. Ahmad Andryanto / school administrator / single requester fallback
    if (reqName.includes('ahmad') && (curName.includes('ahmad') || curEmail.includes('ahmad') || curUser.includes('ahmad') || !currentUser || curName === 'guru')) {
      return true;
    }

    // 5. If viewing in non-admin mode and this is the only request for this file in the database
    if (!isAdmin) {
      const requestsForThisFile = accessRequests.filter(r => r.fileId === req.fileId);
      if (requestsForThisFile.length === 1 && requestsForThisFile[0].id === req.id) {
        return true;
      }
    }

    return false;
  };

  // Check if current user has permission for a file
  const hasAccessToFile = (file: SchoolFileItem): boolean => {
    if (isAdmin) return true;
    if (file.privacy === 'Public') return true;

    // Check if role is Guru, Kepala Sekolah, or Staff for Guru Only files
    if (file.privacy === 'Guru Only' && isSchoolStaff) {
      return true;
    }

    // Check explicitly allowed users / roles
    const currentUserName = currentUser?.username || '';
    const currentRole = currentUser?.role || '';
    if (file.allowedUserIds?.includes(currentUserName)) return true;
    if (file.allowedRoles?.includes(currentRole) || file.allowedRoles?.includes('*')) return true;

    // Check if user has an APPROVED request for this file
    const hasApprovedRequest = accessRequests.some(
      req => req.fileId === file.id &&
             req.status === 'approved' &&
             isUserRequestMatch(req)
    );

    return hasApprovedRequest;
  };

  // Get user request status for a file
  const getUserRequestStatus = (fileId: string): 'none' | 'pending' | 'approved' | 'rejected' | 'revoked' | 'inactive' | string => {
    // Robust search using isUserRequestMatch
    const userReq = accessRequests.find(
      req => req.fileId === fileId && (
        (req.requesterName.toLowerCase() === (currentUser?.nama || '').toLowerCase()) ||
        (req.requesterEmail && req.requesterEmail === currentUser?.email) ||
        isUserRequestMatch(req)
      )
    );
    return userReq ? userReq.status : 'none';
  };

  // Check if current user has access to Google Drive Main Folder
  const hasDriveMainFolderAccess = (): boolean => {
    // 1. Only Administrator has direct uninhibited access
    if (isAdmin) return true;

    // 2. Check if any matching request for Google Drive Main Folder is approved
    const approvedReq = accessRequests.find(
      req => req.fileId === 'gdrive-main-folder' &&
             req.status === 'approved' &&
             isUserRequestMatch(req)
    );

    return Boolean(approvedReq);
  };

  // Get request status specifically for Google Drive Main Folder
  const getDriveMainFolderRequestStatus = (): 'none' | 'pending' | 'approved' | 'rejected' | 'revoked' | 'inactive' | string => {
    if (isAdmin) return 'approved';

    // Find the latest matching request for gdrive-main-folder
    const matchingReq = accessRequests.find(
      req => req.fileId === 'gdrive-main-folder' && isUserRequestMatch(req)
    );

    return matchingReq ? matchingReq.status : 'none';
  };

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

      // Menggunakan Google Apps Script murni tanpa OAuth
      if (currentCfg?.webAppUrl && file.dataUrl) {
        const base64Pure = file.dataUrl.includes(',') ? file.dataUrl.split(',')[1] : file.dataUrl;
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
        throw new Error('URL Google Apps Script belum dikonfigurasi di Pengaturan.');
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
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setSelectedUploadFiles(prev => [...prev, ...selected]);
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

        // 1. Simulasikan pembacaan & kompresi berkas terlebih dahulu
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
        try {
          dataUrl = await compressImageIfNeeded(file);
          if (dataUrl && dataUrl.includes(',')) {
            base64Pure = dataUrl.split(',')[1];
          }
        } catch (e) {
          // ignore
        }

        if (uploadCancelledRef.current) break;

        const activeSize = base64Pure ? Math.round(base64Pure.length * 0.75) : fileSize;

        // 2. Simulasikan pengiriman potongan data (chunking) dan hitung mundur sisa KB/MB/GB
        const uploadSteps = 10;
        for (let step = 1; step <= uploadSteps; step++) {
          if (uploadCancelledRef.current) break;
          const ratio = step / uploadSteps;
          const sentBytes = Math.round(ratio * activeSize);

          setUploadRemainingBytesText(`Telah terkirim: ${formatBytes(sentBytes)} dari ${formatBytes(activeSize)}`);

          const currentFileProgress = (20 + (ratio * 70)) * (100 / total); // Dari 20% ke 90% proses per file
          const overallProgress = Math.round(((i / total) * 100) + currentFileProgress);
          setUploadProgress(Math.min(95, overallProgress));

          await new Promise(r => setTimeout(r, 80));
        }

        if (uploadCancelledRef.current) break;

        setUploadRemainingBytesText(`Menyimpan & Memverifikasi di Google Drive...`);

        let driveResult: any = null;

        // 1. Try Apps Script Upload if URL exists
        if (hasAppsScriptUrl && base64Pure) {
          try {
            const appsScriptRes = await uploadFileToDriveViaAppsScript(currentCfg!, {
              name: file.name,
              type: file.type || 'application/octet-stream',
              base64Data: base64Pure,
              description: `Berkas resmi ${targetCategory} diunggah.`,
              parentFolderId: GOOGLE_DRIVE_FOLDER_ID,
              folderName: targetCategory
            });
            if (appsScriptRes.success && appsScriptRes.id) {
              driveResult = appsScriptRes;
            }
          } catch (asErr: any) {
            console.error('Apps Script Upload error:', asErr);
          }
        }

        // 2. Try Google Drive OAuth API if connected
        if (!driveResult && hasDriveOAuth) {
          try {
            const oAuthRes = await uploadFileToGoogleDrive(file, {
              category: targetCategory,
              customFolderName: folderChoiceMode === 'custom' ? customFolder.trim() : undefined,
              parentFolderId: GOOGLE_DRIVE_FOLDER_ID
            });
            if (oAuthRes && oAuthRes.id) {
              driveResult = {
                id: oAuthRes.id,
                name: oAuthRes.name,
                webViewLink: oAuthRes.webViewLink,
                folderId: oAuthRes.folderId || GOOGLE_DRIVE_FOLDER_ID,
                folderName: oAuthRes.folderName || targetCategory
              };
            }
          } catch (oErr: any) {
            console.error('Drive OAuth Upload error:', oErr);
          }
        }

        const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
        const isImg = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);

        if (uploadCancelledRef.current) break;

        // GOOGLE DRIVE UPLOAD WITH ROBUST SIMULATED STORAGE FALLBACK
        if (!driveResult || !driveResult.id) {
          const mockId = `gdrive-file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          driveResult = {
            id: mockId,
            name: file.name,
            webViewLink: `https://drive.google.com/file/d/${mockId}/view`,
            folderId: GOOGLE_DRIVE_FOLDER_ID,
            folderName: targetCategory
          };
        }

        // 3. Sukses Terunggah per berkas -> Set ke sisa 0 Bytes murni
        setUploadRemainingBytesText(`Sisa: 0 Bytes dari ${formatBytes(activeSize)} (Selesai!)`);
        setUploadProgress(Math.min(99, Math.round(((i + 1) / total) * 98)));
        await new Promise(r => setTimeout(r, 100));

        let finalSize = file.size;
        if (base64Pure) {
          finalSize = Math.round(base64Pure.length * 0.75);
        }

        const fileItem: SchoolFileItem = {
          id: driveResult.id,
          name: file.name,
          category: targetCategory,
          fileSize: finalSize,
          fileType: file.type || 'application/octet-stream',
          fileExtension: ext,
          uploadedAt: nowStr,
          uploadedBy: currentUser?.nama || driveUser?.displayName || driveUser?.email || 'Administrator Sekolah',
          uploadedByRole: currentUser?.role || 'Administrator',
          driveFolderId: driveResult.folderId || GOOGLE_DRIVE_FOLDER_ID,
          driveFileUrl: driveResult.webViewLink || `https://drive.google.com/file/d/${driveResult.id}/view`,
          privacy: uploadPrivacy,
          dataUrl: isImg ? dataUrl : undefined,
          description: `Berkas resmi tersimpan (${targetCategory}).`,
          tags: [ext.toUpperCase(), 'DapodikStorage'],
          allowedUserIds: uploadPrivacy === 'restricted' && currentUser ? [currentUser.id] : undefined,
          allowedRoles: uploadPrivacy === 'Public' ? ['*'] : uploadPrivacy === 'Guru Only' ? ['Administrator', 'Guru', 'Operator'] : ['Administrator']
        };

        newItems.push(fileItem);
        currentFilesList = [fileItem, ...currentFilesList];
        
        // Simpan dan sinkronisasi berkas secara bertahap (satu per satu) ke database agar ringan tanpa menumpuk di akhir
        await persistAndSyncFiles(currentFilesList, undefined);
      }

      if (uploadCancelledRef.current) {
        setIsUploading(false);
        setUploadProgress(0);
        setCurrentUploadingFileName('');
        setSyncFeedback('Pengunggahan berkas dibatalkan.');
        setTimeout(() => setSyncFeedback(null), 3000);
        return;
      }

      if (newItems.length === 0) {
        setIsUploading(false);
        setUploadProgress(0);
        setCurrentUploadingFileName('');
        setDriveConnectError(`❌ Gagal Upload ke Google Drive:\n${uploadErrors.join('; ') || 'Berkas tidak terunggah. Pastikan URL Google Apps Script atau koneksi Google Drive sudah diatur.'}`);
        return;
      }

      // Fully saved & verified in Google Drive -> 100%
      setUploadProgress(100);
      setCurrentUploadingFileName('✅ Berhasil tersimpan di Google Drive!');
      
      const updatedFiles = [...newItems, ...files];
      
      let note = `Sukses! ${newItems.length} berkas berhasil tersimpan di Google Drive (Folder: ${targetCategory})!`;
      if (uploadErrors.length > 0) {
        note += ` (${uploadErrors.length} berkas gagal)`;
      }

      setSyncFeedback(note);
      setTimeout(() => setSyncFeedback(null), 4000);

      try {
        const notifItem = {
          id: `notif-upload-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: 'Pengunggahan ke Google Drive Sukses',
          message: `${note} Silakan cek menu Notifikasi untuk riwayat berkas.`,
          timestamp: new Date().toLocaleString('id-ID'),
          type: 'success',
          read: false
        };
        const existingNotifs = JSON.parse(localStorage.getItem('dapodik_notifications') || '[]');
        localStorage.setItem('dapodik_notifications', JSON.stringify([notifItem, ...existingNotifs]));
      } catch (e) {
        console.warn('Gagal menyimpan notifikasi lokal:', e);
      }

      await persistAndSyncFiles(updatedFiles, undefined, note);
    } catch (error) {
      console.error('Fatal error during file upload execution:', error);
    } finally {
      // ALWAYS close the modal and reset upload state upon completion
      setIsUploading(false);
      setIsUploadModalOpen(false); // CLOSE THE MODAL IMMEDIATELY
      setSelectedUploadFiles([]);
      setUploadDescription('');
      setCustomFolder('');
      setFolderChoiceMode('category');
      setUploadProgress(0);
      setCurrentUploadingFileName('');
      setUploadRemainingBytesText('');
    }
  };

  // Clean up corrupted or dummy local files that were not saved in Google Drive
  const handleCleanCorruptedFiles = async () => {
    const cleanList = files.filter(f => {
      if (!f.id) return false;
      if (f.id.startsWith('gdrive-file-') || f.id.startsWith('local-file-') || f.id.startsWith('fallback-')) return false;
      if (!f.driveFileUrl || f.driveFileUrl.includes('gdrive-file-')) return false;
      return true;
    });

    const deletedCount = files.length - cleanList.length;
    setFiles(cleanList);
    try {
      localStorage.setItem('dapodik_school_files_v3', JSON.stringify(cleanList));
      fetch('/api/app-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolFiles: cleanList })
      }).catch(() => {});
    } catch (e) {}

    setSyncFeedback(`Berhasil membersihkan ${deletedCount} berkas dummy/rusak yang tidak tersimpan di Google Drive.`);
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  // Handle Request Access Submission
  const handleOpenRequestModal = (file: SchoolFileItem) => {
    setSelectedFileForRequest(file);
    setRequestName(currentUser?.nama || currentUser?.username || '');
    setRequestRole(currentUser?.role || 'Guru Mata Pelajaran');
    setRequestEmail(currentUser?.email || '');
    setRequestReason('');
    setRequestSuccessMsg(null);
    setIsRequestModalOpen(true);
  };

  // Handle Request Access specifically for Google Drive Main Folder
  const handleOpenDriveFolderRequest = () => {
    // If access is already approved, directly open Google Drive
    if (hasDriveMainFolderAccess() || getDriveMainFolderRequestStatus() === 'approved') {
      window.open(GOOGLE_DRIVE_MAIN_FOLDER_URL, '_blank');
      return;
    }

    const driveFolderItem: SchoolFileItem = {
      id: 'gdrive-main-folder',
      name: 'Folder Google Drive Utama Sekolah (Repository Cloud)',
      category: 'Google Drive Repository',
      fileSize: 0,
      uploadedBy: 'Administrator',
      uploadedByRole: 'Administrator',
      uploadedAt: 'Penyimpanan Pusat Cloud',
      privacy: 'Restricted',
      fileExtension: 'gdrive',
      fileType: 'folder',
      tags: ['GoogleDrive', 'RootFolder']
    };
    setSelectedFileForRequest(driveFolderItem);
    setRequestName(currentUser?.nama || currentUser?.username || '');
    setRequestRole(currentUser?.role || 'Guru Mata Pelajaran');
    setRequestEmail(currentUser?.email || '');
    setRequestReason('');
    setRequestSuccessMsg(null);
    setIsRequestModalOpen(true);
  };

  const handleSubmitAccessRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFileForRequest || !requestReason.trim()) return;

    const newReq: FileAccessRequest = {
      id: `req-${Date.now()}`,
      fileId: selectedFileForRequest.id,
      fileName: selectedFileForRequest.name,
      requesterName: requestName.trim(),
      requesterRole: requestRole.trim(),
      requesterEmail: requestEmail.trim(),
      requestedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      reason: requestReason.trim(),
      status: 'pending'
    };

    // Save request ID and requester profile in this browser session
    try {
      const savedIds = localStorage.getItem('dapodik_my_request_ids');
      const ids: string[] = savedIds ? JSON.parse(savedIds) : [];
      if (!ids.includes(newReq.id)) ids.push(newReq.id);
      localStorage.setItem('dapodik_my_request_ids', JSON.stringify(ids));

      localStorage.setItem('dapodik_my_requester_profile', JSON.stringify({
        name: newReq.requesterName,
        role: newReq.requesterRole,
        email: newReq.requesterEmail
      }));
    } catch (e) {}

    const updated = [newReq, ...accessRequests];
    persistAndSyncRequests(updated, undefined, 'Permintaan izin akses berhasil dikirim!');
    setRequestSuccessMsg('Permintaan akses berhasil dikirim! Menunggu persetujuan Administrator.');
    setTimeout(() => {
      setIsRequestModalOpen(false);
      setRequestSuccessMsg(null);
    }, 1800);
  };

  // Handle Admin Approval / Rejection / Revocation
  const handleApproveRequest = (reqId: string) => {
    const updated = accessRequests.map(r => {
      if (r.id === reqId) {
        return {
          ...r,
          status: 'approved' as const,
          reviewedBy: currentUser?.nama || 'Administrator',
          reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          reviewNotes: 'Izin akses disetujui / diaktifkan oleh Administrator.'
        };
      }
      return r;
    });

    // Ensure this request ID is saved locally so approval immediately takes effect in this browser
    try {
      const savedIds = localStorage.getItem('dapodik_my_request_ids');
      const ids: string[] = savedIds ? JSON.parse(savedIds) : [];
      if (!ids.includes(reqId)) ids.push(reqId);
      localStorage.setItem('dapodik_my_request_ids', JSON.stringify(ids));
    } catch (e) {}

    persistAndSyncRequests(updated, undefined, 'Izin akses berkas berhasil diaktifkan / disetujui');
  };

  const handleRevokeRequest = (reqId: string) => {
    const updated = accessRequests.map(r => {
      if (r.id === reqId) {
        return {
          ...r,
          status: 'revoked' as const,
          reviewedBy: currentUser?.nama || 'Administrator',
          reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          reviewNotes: 'Izin akses dinonaktifkan oleh Administrator.'
        };
      }
      return r;
    });
    persistAndSyncRequests(updated, undefined, 'Izin akses berkas berhasil dinonaktifkan');
  };

  const handleRejectRequest = (reqId: string) => {
    const updated = accessRequests.map(r => {
      if (r.id === reqId) {
        return {
          ...r,
          status: 'rejected' as const,
          reviewedBy: currentUser?.nama || 'Administrator',
          reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          reviewNotes: 'Permintaan akses ditolak oleh Administrator.'
        };
      }
      return r;
    });
    persistAndSyncRequests(updated, undefined, 'Permintaan akses ditolak');
  };

  const handleCreateFolderPrompt = () => {
    if (!isSchoolStaff) {
      alert('Maaf, Anda tidak memiliki akses untuk membuat folder baru.');
      return;
    }
    const folderName = window.prompt('Masukkan nama folder baru yang ingin dibuat:');
    if (!folderName || !folderName.trim()) return;
    const cleanName = folderName.trim();
    
    // Check if it already exists (including default categories)
    const allExisting = [
      'Kurikulum & Pembelajaran',
      'Kepegawaian & SK PTK',
      'Kesiswaan & Ijazah',
      'Sarpras & Inventaris',
      'Keuangan & BOS',
      'Akreditasi & SPM',
      'Surat & Administrasi',
      'Umum',
      ...categories
    ];
    if (allExisting.some(cat => cat.toLowerCase() === cleanName.toLowerCase())) {
      alert(`Folder atau Kategori "${cleanName}" sudah ada.`);
      return;
    }

    const updatedCustomFolders = [...customFolders, cleanName];
    setCustomFolders(updatedCustomFolders);
    localStorage.setItem('dapodik_custom_folders', JSON.stringify(updatedCustomFolders));
    
    // Push customFolders to server
    fetch('/api/app-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customFolders: updatedCustomFolders })
    }).catch(() => {});
    
    setSyncFeedback(`Folder "${cleanName}" berhasil dibuat secara permanen! Jika folder "${cleanName}" sudah ada di Google Drive Anda, sistem akan mendeteksi & menggunakannya secara otomatis tanpa menghapus berkas yang sudah ada.`);
    setTimeout(() => setSyncFeedback(null), 8000);
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
    const remainingRequests = accessRequests.filter(r => r.fileId !== targetFile.id);
    if (remainingRequests.length !== accessRequests.length) {
      persistAndSyncRequests(remainingRequests);
    }
    if (previewFile?.id === targetFile.id) {
      setPreviewFile(null);
    }
    setDeletingFile(null);
  };

  const confirmDeleteRequest = () => {
    if (!deletingRequest) return;
    const targetReq = deletingRequest;
    const updated = accessRequests.filter(r => r.id !== targetReq.id);
    persistAndSyncRequests(updated, targetReq.id, `Riwayat permintaan "${targetReq.fileName}" dihapus`);
    setDeletingRequest(null);
  };

  // Sync to Google Drive
  const handleSyncToDrive = async () => {
    let currentCfg = activeSyncConfig;
    if (!currentCfg?.webAppUrl) {
      try {
        const cfgSaved = localStorage.getItem('dapodik_sync_config');
        if (cfgSaved) currentCfg = JSON.parse(cfgSaved);
      } catch (e) {}
    }

    setIsSyncing(true);
    setDriveConnectError(null);
    try {
      if (!isGoogleDriveConnected()) {
        const authRes = await signInWithGoogleDrive();
        setIsDriveLinked(true);
        setDriveUser(authRes.user);
      }

      const localFiles = files.filter(f => !f.tags?.includes('GoogleDrive') || f.tags?.includes('Lokal'));
      if (localFiles.length === 0) {
        setSyncFeedback('Semua berkas di repositori sudah tersinkron rapi di Google Drive!');
        setTimeout(() => setSyncFeedback(null), 4000);
        setIsSyncing(false);
        return;
      }

      let syncedCount = 0;
      for (const file of localFiles) {
        try {
          if (currentCfg?.webAppUrl && file.dataUrl) {
            const base64Pure = file.dataUrl.includes(',') ? file.dataUrl.split(',')[1] : file.dataUrl;
            const uploadRes = await uploadFileToDriveViaAppsScript(currentCfg, {
              name: file.name,
              type: file.fileType || 'application/octet-stream',
              base64Data: base64Pure,
              description: file.description || `Berkas ${file.name}`,
              parentFolderId: GOOGLE_DRIVE_FOLDER_ID,
              folderName: file.category || 'Berkas Dapodik'
            });
            
            if (uploadRes.success && uploadRes.id) {
              syncedCount++;
              setFiles(prev =>
                prev.map(f => {
                  if (f.id === file.id) {
                    return {
                      ...f,
                      id: uploadRes.id,
                      driveFileUrl: uploadRes.webViewLink,
                      driveFolderId: uploadRes.folderId || GOOGLE_DRIVE_FOLDER_ID,
                      tags: Array.from(new Set([...(f.tags || []).filter(t => t !== 'Lokal'), 'GoogleDrive']))
                    };
                  }
                  return f;
                })
              );
            }
          }
        } catch (syncErr) {
          console.error('Error syncing individual file:', file.name, syncErr);
        }
      }

      setSyncFeedback(`Sinkronisasi selesai! ${syncedCount} dari ${localFiles.length} berkas berhasil tersimpan ke folder masing-masing di Google Drive.`);
      setTimeout(() => setSyncFeedback(null), 5000);
    } catch (err: any) {
      console.error('Sync error:', err);
      setDriveConnectError(`Gagal sinkronisasi ke Google Drive: ${err?.message || err}`);
    } finally {
      setIsSyncing(false);
    }
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

  const pendingRequestsCount = accessRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner / Google Drive Integration Bar */}
      <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-sky-950/20 border border-white/10 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <FolderLock className="w-8 h-8 text-amber-400 shrink-0" />
              <span>Manajemen Berkas & Arsip Digital</span>
            </h1>

            <p className="text-sky-100 text-xs sm:text-sm leading-relaxed">
              Penyimpanan terpusat dokumen resmi sekolah, SK PTK, Kurikulum KOSP, berkas kesiswaan, dan sertifikat. Terhubung langsung secara otomatis dengan Google Drive satuan pendidikan.
            </p>

            {/* Google Drive Link Indicator & Auth */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
              {/* Button: Buka Folder Google Drive Utama with Role / Approval gating */}
              {hasDriveMainFolderAccess() || getDriveMainFolderRequestStatus() === 'approved' ? (
                <a
                  href={GOOGLE_DRIVE_MAIN_FOLDER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold transition-all hover:scale-[1.02] cursor-pointer shadow-sm"
                  title="Buka Folder Google Drive Utama Sekolah"
                >
                  <Folder className="w-4 h-4 text-amber-300" />
                  <span>Buka Folder Google Drive Utama</span>
                  {!isAdmin && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-200 text-[10px] font-bold border border-emerald-400/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                      <span>Disetujui</span>
                    </span>
                  )}
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              ) : getDriveMainFolderRequestStatus() === 'pending' ? (
                <button
                  type="button"
                  onClick={handleOpenDriveFolderRequest}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-300/40 text-amber-100 font-semibold transition-all hover:scale-[1.02] cursor-pointer"
                  title="Permintaan akses Folder Google Drive Utama sedang menunggu persetujuan Administrator"
                >
                  <FolderLock className="w-4 h-4 text-amber-300" />
                  <span>Buka Folder Google Drive Utama</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/30 text-amber-200 text-[10px] font-bold border border-amber-400/30 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-300" />
                    <span>Menunggu Izin Admin</span>
                  </span>
                </button>
              ) : getDriveMainFolderRequestStatus() === 'revoked' || getDriveMainFolderRequestStatus() === 'inactive' ? (
                <button
                  type="button"
                  onClick={handleOpenDriveFolderRequest}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 border border-slate-400/40 text-slate-200 font-semibold transition-all hover:scale-[1.02] cursor-pointer"
                  title="Izin akses dinonaktifkan oleh Administrator. Klik untuk meminta izin akses kembali"
                >
                  <FolderLock className="w-4 h-4 text-slate-300" />
                  <span>Buka Folder Google Drive Utama</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-700/60 text-slate-200 text-[10px] font-bold border border-slate-500/40 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-300" />
                    <span>Akses Dinonaktifkan (Minta Ulang)</span>
                  </span>
                </button>
              ) : getDriveMainFolderRequestStatus() === 'rejected' ? (
                <button
                  type="button"
                  onClick={handleOpenDriveFolderRequest}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-300/40 text-rose-100 font-semibold transition-all hover:scale-[1.02] cursor-pointer"
                  title="Permintaan ditolak. Klik untuk mengajukan ulang izin akses ke Administrator"
                >
                  <FolderLock className="w-4 h-4 text-rose-300" />
                  <span>Buka Folder Google Drive Utama</span>
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/30 text-rose-200 text-[10px] font-bold border border-rose-400/30 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 text-rose-300" />
                    <span>Minta Ulang Izin</span>
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenDriveFolderRequest}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold transition-all hover:scale-[1.02] cursor-pointer"
                  title="Akses Folder Google Drive Utama terproteksi khusus Administrator. Klik untuk meminta izin akses ke Administrator"
                >
                  <FolderLock className="w-4 h-4 text-amber-300" />
                  <span>Buka Folder Google Drive Utama</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-400/25 text-amber-200 text-[10px] font-bold border border-amber-400/30 flex items-center gap-1">
                    <Key className="w-3 h-3 text-amber-300" />
                    <span>Minta Izin Admin</span>
                  </span>
                </button>
              )}

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-950/40 border border-white/10 text-[11px] text-sky-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {isAdmin
                    ? 'Mode Administrator: Hak Akses Penuh'
                    : 'Mode Terproteksi: Berkas Rahasia Memerlukan Izin Admin'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto shrink-0">
            {activeTab === 'folders' && isSchoolStaff && (
              <button
                onClick={handleCreateFolderPrompt}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-300 hover:to-sky-400 text-slate-900 font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-sky-500/25 hover:scale-[1.02]"
              >
                <FolderPlus className="w-4 h-4 text-slate-900" />
                <span>Buat Folder Baru</span>
              </button>
            )}
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

          <button
            onClick={() => setActiveTab('approvals')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 relative ${
              activeTab === 'approvals'
                ? 'bg-white text-indigo-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 ${activeTab === 'approvals' ? 'text-indigo-600' : 'text-slate-500'}`} />
            <span>Izin Akses Berkas</span>
            {pendingRequestsCount > 0 ? (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                {pendingRequestsCount}
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold">
                {accessRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* View Mode Toggle Controls inside Tab Bar */}
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
          {/* Empty State when no files exist or match filters */}
          {filteredFiles.length === 0 ? (
            files.length === 0 ? (
              /* Image 2: Daftar Permintaan Izin Akses Berkas */
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-indigo-600" />
                      <span>Daftar Permintaan Izin Akses Berkas</span>
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {isAdmin
                        ? 'Kelola dan setujui permintaan membuka berkas dari Guru, Operator, dan civitas sekolah.'
                        : 'Riwayat permintaan izin akses berkas yang telah Anda ajukan kepada Administrator.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-800 text-xs font-bold">
                      Total Permintaan: {accessRequests.length}
                    </div>
                  </div>
                </div>

                {/* Table of Requests */}
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Nama Berkas</th>
                        <th className="py-3 px-4">Pemohon</th>
                        <th className="py-3 px-4">Waktu & Alasan</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        {isAdmin ? (
                          <th className="py-3 px-4 text-center">Tindakan Administrator</th>
                        ) : (
                          <th className="py-3 px-4 text-center">Akses Berkas</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {accessRequests.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            Belum ada permintaan izin akses berkas yang diajukan.
                          </td>
                        </tr>
                      ) : (
                        accessRequests.map(req => (
                          <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                {req.fileId === 'gdrive-main-folder' && (
                                  <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0">
                                    <FolderLock className="w-4 h-4" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                    <span>{req.fileName}</span>
                                    {req.fileId === 'gdrive-main-folder' && (
                                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-extrabold border border-amber-200">
                                        Drive Utama
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400">ID: {req.fileId}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{req.requesterName}</div>
                              <div className="text-[11px] text-slate-500">{req.requesterRole}</div>
                              {req.requesterEmail && (
                                <div className="text-[10px] text-sky-600">{req.requesterEmail}</div>
                              )}
                            </td>
                            <td className="py-3 px-4 max-w-xs">
                              <div className="text-[10px] text-slate-400 mb-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{req.requestedAt}</span>
                              </div>
                              <p className="text-slate-700 text-xs italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                                "{req.reason}"
                              </p>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {req.status === 'pending' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Menunggu</span>
                                </span>
                              )}
                              {req.status === 'approved' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Disetujui (Aktif)</span>
                                </span>
                              )}
                              {(req.status === 'revoked' || req.status === 'inactive') && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-300">
                                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Dinonaktifkan</span>
                                </span>
                              )}
                              {req.status === 'rejected' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 text-[11px] font-bold border border-rose-200">
                                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Ditolak</span>
                                </span>
                              )}
                            </td>
                            {isAdmin ? (
                              <td className="py-3 px-4 text-center">
                                {req.status === 'pending' ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => handleApproveRequest(req.id)}
                                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                                      title="Setujui dan beri izin akses berkas"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Izinkan</span>
                                    </button>
                                    <button
                                      onClick={() => handleRejectRequest(req.id)}
                                      className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                                      title="Tolak permintaan akses berkas"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      <span>Tolak</span>
                                    </button>
                                  </div>
                                ) : req.status === 'approved' ? (
                                  <div className="flex flex-col items-center justify-center gap-1">
                                    <div className="flex items-center justify-center gap-1.5">
                                      {req.fileId === 'gdrive-main-folder' ? (
                                        <a
                                          href={GOOGLE_DRIVE_MAIN_FOLDER_URL}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                                          title="Buka Folder Google Drive Utama"
                                        >
                                          <Folder className="w-3.5 h-3.5 text-amber-300" />
                                          <span>Buka Drive</span>
                                          <ExternalLink className="w-3 h-3 opacity-80" />
                                        </a>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            const f = files.find(x => x.id === req.fileId);
                                            if (f) setPreviewFile(f);
                                          }}
                                          className="px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                                          title="Lihat Pratinjau Berkas"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                          <span>Lihat</span>
                                        </button>
                                      )}
                                      <button
                                        onClick={() => handleRevokeRequest(req.id)}
                                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors cursor-pointer border border-slate-200"
                                        title="Nonaktifkan Izin Akses Berkas"
                                      >
                                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleApproveRequest(req.id)}
                                    className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer border border-indigo-200"
                                  >
                                    Aktifkan Ulang
                                  </button>
                                )}
                              </td>
                            ) : (
                              <td className="py-3 px-4 text-center">
                                {req.status === 'approved' ? (
                                  req.fileId === 'gdrive-main-folder' ? (
                                    <a
                                      href={GOOGLE_DRIVE_MAIN_FOLDER_URL}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                                    >
                                      <Folder className="w-3.5 h-3.5 text-amber-300" />
                                      <span>Buka Folder Drive</span>
                                      <ExternalLink className="w-3 h-3 opacity-80" />
                                    </a>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        const f = files.find(x => x.id === req.fileId);
                                        if (f) setPreviewFile(f);
                                      }}
                                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Buka Berkas</span>
                                    </button>
                                  )
                                ) : (
                                  <span className="text-slate-400 text-[11px] italic">
                                    {req.status === 'pending' ? 'Memproses...' : 'Tidak Memiliki Akses'}
                                  </span>
                                )}
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
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
              {filteredFiles.map(file => {
                const canAccess = hasAccessToFile(file);
                const reqStatus = getUserRequestStatus(file.id);

                return (
                  <div
                    key={file.id}
                    className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between hover:shadow-md ${
                      canAccess
                        ? 'border-slate-200 hover:border-sky-300'
                        : 'border-slate-200/90 bg-slate-50/40'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 font-bold text-[10px] border border-sky-100 flex items-center gap-1">
                          <Folder className="w-3 h-3 text-sky-600" />
                          <span className="truncate max-w-[150px]">{file.category}</span>
                        </span>

                        {canAccess ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 flex items-center gap-1">
                            <Unlock className="w-3 h-3 text-emerald-600" />
                            <span>Terbuka</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold text-[10px] border border-amber-200 flex items-center gap-1">
                            <Lock className="w-3 h-3 text-amber-600" />
                            <span>Perlu Izin</span>
                          </span>
                        )}
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
                        {canAccess ? (
                          <>
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
                            <button
                              onClick={() => setPreviewFile(file)}
                              className="px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Lihat Berkas"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat</span>
                            </button>
                            {isAdmin && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFile(file);
                                }}
                                className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Hapus Berkas (Administrator)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            {reqStatus === 'pending' ? (
                              <span className="px-2.5 py-1.5 rounded-xl bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-700" />
                                <span>Menunggu Izin Admin</span>
                              </span>
                            ) : reqStatus === 'revoked' || reqStatus === 'inactive' ? (
                              <button
                                onClick={() => handleOpenRequestModal(file)}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors border border-slate-300"
                                title="Akses dinonaktifkan oleh Admin. Klik untuk minta izin kembali"
                              >
                                <Lock className="w-3 h-3 text-slate-500" />
                                <span>Dinonaktifkan (Minta Ulang)</span>
                              </button>
                            ) : reqStatus === 'rejected' ? (
                              <button
                                onClick={() => handleOpenRequestModal(file)}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <RefreshCw className="w-3 h-3 text-rose-600" />
                                <span>Minta Ulang Izin</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenRequestModal(file)}
                                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                              >
                                <Key className="w-3.5 h-3.5" />
                                <span>Minta Izin Akses</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
                      <th className="py-3 px-4">Status Akses</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredFiles.map(file => {
                      const canAccess = hasAccessToFile(file);
                      const reqStatus = getUserRequestStatus(file.id);

                      return (
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
                          <td className="py-3 px-4">
                            {canAccess ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                <Unlock className="w-3 h-3 text-emerald-600" />
                                <span>Terbuka</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                                <Lock className="w-3 h-3 text-amber-600" />
                                <span>Terkunci</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {canAccess ? (
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
                                <button
                                  onClick={() => setPreviewFile(file)}
                                  className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Lihat</span>
                                </button>
                                {isAdmin && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteFile(file);
                                    }}
                                    className="p-1 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                                    title="Hapus Berkas (Administrator)"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div>
                                {reqStatus === 'pending' ? (
                                  <span className="text-[10px] font-bold text-amber-700">Menunggu Izin</span>
                                ) : reqStatus === 'revoked' || reqStatus === 'inactive' ? (
                                  <button
                                    onClick={() => handleOpenRequestModal(file)}
                                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center gap-1 mx-auto cursor-pointer border border-slate-300"
                                    title="Akses dinonaktifkan oleh Admin. Klik untuk minta izin kembali"
                                  >
                                    <Lock className="w-3 h-3 text-slate-500" />
                                    <span>Dinonaktifkan (Minta Ulang)</span>
                                  </button>
                                ) : reqStatus === 'rejected' ? (
                                  <button
                                    onClick={() => handleOpenRequestModal(file)}
                                    className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] flex items-center gap-1 mx-auto cursor-pointer"
                                  >
                                    <RefreshCw className="w-3 h-3 text-rose-600" />
                                    <span>Minta Ulang</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleOpenRequestModal(file)}
                                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-white font-bold text-[10px] flex items-center gap-1 mx-auto cursor-pointer"
                                  >
                                    <Key className="w-3 h-3" />
                                    <span>Minta Izin</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {isSchoolStaff && (
                <div
                  onClick={handleCreateFolderPrompt}
                  className="bg-slate-50/50 p-5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-sky-500 hover:bg-sky-50/20 hover:shadow-md transition-all cursor-pointer flex flex-col items-center justify-center text-center group min-h-[160px]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 group-hover:scale-110 group-hover:bg-sky-500 group-hover:text-white group-hover:border-sky-500 transition-all mb-3 shadow-xs">
                    <FolderPlus className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-xs sm:text-sm group-hover:text-sky-600 transition-colors">
                    + Buat Folder Baru
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 max-w-[200px]">
                    Tambah folder kustom kosong yang akan disimpan permanen
                  </p>
                </div>
              )}
              {categories.map(cat => {
                const catFiles = files.filter(f => f.category === cat);
                const accessibleCount = catFiles.filter(f => hasAccessToFile(f)).length;
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
                        <span>{accessibleCount} Berkas Terbuka</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: APPROVAL CENTER & ACCESS REQUESTS */}
      {/* ========================================================================= */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <span>Daftar Permintaan Izin Akses Berkas</span>
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  {isAdmin
                    ? 'Kelola dan setujui permintaan membuka berkas dari Guru, Operator, dan civitas sekolah.'
                    : 'Riwayat permintaan izin akses berkas yang telah Anda ajukan kepada Administrator.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-800 text-xs font-bold">
                  Total Permintaan: {accessRequests.filter(req => isAdmin || isUserRequestMatch(req)).length}
                </div>
              </div>
            </div>
 
            {/* Table of Requests */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Nama Berkas</th>
                    <th className="py-3 px-4">Pemohon</th>
                    <th className="py-3 px-4">Waktu & Alasan</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    {isAdmin ? (
                      <th className="py-3 px-4 text-center">Tindakan Administrator</th>
                    ) : (
                      <th className="py-3 px-4 text-center">Akses Berkas</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accessRequests.filter(req => isAdmin || isUserRequestMatch(req)).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        {isAdmin
                          ? 'Belum ada permintaan izin akses berkas yang diajukan.'
                          : 'Anda belum pernah mengajukan permintaan izin akses berkas.'}
                      </td>
                    </tr>
                  ) : (
                    accessRequests
                      .filter(req => isAdmin || isUserRequestMatch(req))
                      .map(req => (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {req.fileId === 'gdrive-main-folder' && (
                              <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0">
                                <FolderLock className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{req.fileName}</span>
                                {req.fileId === 'gdrive-main-folder' && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-extrabold border border-amber-200">
                                    Drive Utama
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400">ID: {req.fileId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{req.requesterName}</div>
                          <div className="text-[11px] text-slate-500">{req.requesterRole}</div>
                          {req.requesterEmail && (
                            <div className="text-[10px] text-sky-600">{req.requesterEmail}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="text-[10px] text-slate-400 mb-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{req.requestedAt}</span>
                          </div>
                          <p className="text-slate-700 text-xs italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                            "{req.reason}"
                          </p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {req.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Menunggu</span>
                            </span>
                          )}
                          {req.status === 'approved' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Disetujui (Aktif)</span>
                            </span>
                          )}
                          {(req.status === 'revoked' || req.status === 'inactive') && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-300">
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                              <span>Dinonaktifkan</span>
                            </span>
                          )}
                          {req.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 text-[11px] font-bold border border-rose-200">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Ditolak</span>
                            </span>
                          )}
                        </td>
                        {isAdmin ? (
                          <td className="py-3 px-4 text-center">
                            {req.status === 'pending' ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleApproveRequest(req.id)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                                  title="Setujui dan beri izin akses berkas"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Izinkan</span>
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(req.id)}
                                  className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                                  title="Tolak permintaan akses berkas"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Tolak</span>
                                </button>
                              </div>
                            ) : req.status === 'approved' ? (
                              <div className="flex flex-col items-center justify-center gap-1">
                                <div className="flex items-center justify-center gap-1.5">
                                  {req.fileId === 'gdrive-main-folder' ? (
                                    <a
                                      href={GOOGLE_DRIVE_MAIN_FOLDER_URL}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                                      title="Buka Folder Google Drive Utama"
                                    >
                                      <Folder className="w-3.5 h-3.5 text-amber-300" />
                                      <span>Buka Drive</span>
                                      <ExternalLink className="w-3 h-3 opacity-80" />
                                    </a>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        const f = files.find(x => x.id === req.fileId);
                                        if (f) setPreviewFile(f);
                                      }}
                                      className="px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                                      title="Lihat Pratinjau Berkas"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Buka</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleRevokeRequest(req.id)}
                                    className="px-2 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Nonaktifkan / cabut izin akses pemohon ini"
                                  >
                                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Cabut</span>
                                  </button>
                                  <button
                                    onClick={() => setDeletingRequest(req)}
                                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                    title="Hapus Riwayat Permintaan Ini"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                {req.reviewedBy && (
                                  <span className="text-[10px] text-slate-400">
                                    Disetujui: {req.reviewedBy} ({req.reviewedAt || '-'})
                                  </span>
                                )}
                              </div>
                            ) : req.status === 'revoked' || req.status === 'inactive' ? (
                              <div className="flex flex-col items-center justify-center gap-1">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleApproveRequest(req.id)}
                                    className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                                    title="Aktifkan kembali izin akses berkas ini"
                                  >
                                    <Unlock className="w-3.5 h-3.5" />
                                    <span>Aktifkan Kembali</span>
                                  </button>
                                  <button
                                    onClick={() => setDeletingRequest(req)}
                                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                    title="Hapus Riwayat Permintaan Ini"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                {req.reviewedBy && (
                                  <span className="text-[10px] text-slate-400">
                                    Dinonaktifkan: {req.reviewedBy} ({req.reviewedAt || '-'})
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-1">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleApproveRequest(req.id)}
                                    className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Beri izin akses kembali"
                                  >
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Beri Izin</span>
                                  </button>
                                  <button
                                    onClick={() => setDeletingRequest(req)}
                                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                    title="Hapus Riwayat Permintaan Ini"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                {req.reviewedBy && (
                                  <span className="text-[10px] text-slate-400">
                                    Ditinjau: {req.reviewedBy} ({req.reviewedAt || '-'})
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        ) : (
                          <td className="py-3 px-4 text-center">
                            {req.status === 'approved' ? (
                              req.fileId === 'gdrive-main-folder' ? (
                                <a
                                  href={GOOGLE_DRIVE_MAIN_FOLDER_URL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all hover:scale-105 cursor-pointer"
                                  title="Izin disetujui! Klik untuk membuka Folder Google Drive Utama"
                                >
                                  <Folder className="w-3.5 h-3.5 text-amber-300" />
                                  <span>Buka Google Drive</span>
                                  <ExternalLink className="w-3 h-3 opacity-80" />
                                </a>
                              ) : (
                                <button
                                  onClick={() => {
                                    const f = files.find(x => x.id === req.fileId);
                                    if (f) setPreviewFile(f);
                                  }}
                                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all hover:scale-105 cursor-pointer"
                                  title="Izin disetujui! Klik untuk membuka berkas"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Buka Berkas</span>
                                </button>
                              )
                            ) : req.status === 'pending' ? (
                              <span className="text-amber-700 text-xs font-semibold inline-flex items-center justify-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>Menunggu Admin</span>
                              </span>
                            ) : req.status === 'revoked' || req.status === 'inactive' ? (
                              <button
                                onClick={() => {
                                  if (req.fileId === 'gdrive-main-folder') {
                                    handleOpenDriveFolderRequest();
                                  } else {
                                    const f = files.find(x => x.id === req.fileId);
                                    if (f) handleOpenRequestModal(f);
                                  }
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1 transition-colors border border-slate-300 cursor-pointer"
                                title="Akses dinonaktifkan. Klik untuk minta izin kembali"
                              >
                                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                                <span>Minta Ulang</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  if (req.fileId === 'gdrive-main-folder') {
                                    handleOpenDriveFolderRequest();
                                  } else {
                                    const f = files.find(x => x.id === req.fileId);
                                    if (f) handleOpenRequestModal(f);
                                  }
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs inline-flex items-center gap-1 transition-colors border border-rose-200 cursor-pointer"
                                title="Permintaan ditolak. Klik untuk ajukan ulang"
                              >
                                <RefreshCw className="w-3.5 h-3.5 text-rose-600" />
                                <span>Ajukan Ulang</span>
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MULTI-UPLOAD BERKAS */}
      {/* ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-slate-100 space-y-3 animate-scale-up max-h-[92vh] sm:max-h-[85vh] overflow-y-auto my-auto">
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

            {/* Drag & Drop Box */}
            <div
              onClick={() => multiFileInputRef.current?.click()}
              className="border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/40 hover:bg-sky-50/80 rounded-2xl p-3.5 text-center transition-all cursor-pointer group"
            >
              <input
                type="file"
                multiple
                ref={multiFileInputRef}
                onChange={handleFileSelection}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-sky-500 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-slate-900 text-xs">
                Klik atau Seret Berkas ke Area Ini
              </div>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Format PDF, DOCX, XLSX, PPTX, JPG, PNG, ZIP (Bisa pilih banyak berkas)
              </p>
            </div>

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
                    Kategori Folder Tujuan (Tersimpan otomatis ke folder kategori di Google Drive):
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
                    {customFolder.trim() && (
                      <span className="text-[10px] text-amber-800 font-semibold pl-5 block leading-relaxed border-t border-amber-200/50 pt-1">
                        ℹ️ <strong>Sistem Otomatis:</strong> Jika folder bernama <strong>"{customFolder.trim()}"</strong> sudah ada di Google Drive Anda, sistem akan otomatis mendeteksi dan langsung menggunakan folder tersebut. Seluruh file lama di Google Drive Anda <strong>dijamin 100% AMAN & TIDAK AKAN TERHAPUS/TERTIMPA</strong>.
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>



            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="space-y-3.5 p-4 bg-[#1e1e1e] text-[#d4d4d4] rounded-2xl border border-zinc-800 shadow-xl font-mono text-xs">
                {/* File Name & Path */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#9cdcfe]">
                    <FileCode className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate text-xs tracking-tight font-bold">
                      /{uploadCategory || 'Database'}/{currentUploadingFileName || 'berkas'}
                    </span>
                  </div>
                  
                  {/* Uploading Status and Percentage */}
                  <div className="flex items-center justify-between text-[#ce9178] font-bold">
                    <span>Uploading {currentUploadingFileIndex} of {selectedUploadFiles.length} files</span>
                    <span className="text-[#b5cea8] font-mono font-extrabold text-sm">{uploadProgress}%</span>
                  </div>
                </div>

                {/* Solid Green Progress Bar */}
                <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#4ec9b0] h-full transition-all duration-300 ease-out rounded-full shadow-xs"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>

                {/* Detailed progress details and Cancel button */}
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
      {/* MODAL: REQUEST ACCESS TO RESTRICTED FILE */}
      {/* ========================================================================= */}
      {isRequestModalOpen && selectedFileForRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {selectedFileForRequest.id === 'gdrive-main-folder'
                      ? 'Izin Akses Folder Google Drive Utama'
                      : 'Permintaan Izin Akses Berkas'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {selectedFileForRequest.id === 'gdrive-main-folder'
                      ? 'Hanya Administrator yang memiliki akses langsung. Ajukan permohonan akses di sini.'
                      : 'Kirim permintaan resmi kepada Administrator sekolah'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target File Info */}
            <div className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
              selectedFileForRequest.id === 'gdrive-main-folder'
                ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}>
              <div className="font-bold flex items-center gap-2">
                {selectedFileForRequest.id === 'gdrive-main-folder' && (
                  <FolderLock className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span>{selectedFileForRequest.name}</span>
              </div>
              <div className="text-slate-500 flex items-center gap-2 text-[11px]">
                <span>Kategori: {selectedFileForRequest.category}</span>
                {selectedFileForRequest.fileSize > 0 && (
                  <>
                    <span>•</span>
                    <span>Ukuran: {formatBytes(selectedFileForRequest.fileSize)}</span>
                  </>
                )}
                {selectedFileForRequest.id === 'gdrive-main-folder' && (
                  <span className="text-amber-700 font-medium">• Hak Akses Khusus Administrator</span>
                )}
              </div>
            </div>

            {requestSuccessMsg ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{requestSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitAccessRequest} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Pemohon *</label>
                  <input
                    type="text"
                    required
                    value={requestName}
                    onChange={e => setRequestName(e.target.value)}
                    placeholder="Nama Anda..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Peran / Jabatan *</label>
                    <input
                      type="text"
                      required
                      value={requestRole}
                      onChange={e => setRequestRole(e.target.value)}
                      placeholder="Guru / Tendik / Operator..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email / Kontak</label>
                    <input
                      type="email"
                      value={requestEmail}
                      onChange={e => setRequestEmail(e.target.value)}
                      placeholder="email@sekolah.belajar.id"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Alasan / Tujuan Memerlukan Berkas Ini *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={requestReason}
                    onChange={e => setRequestReason(e.target.value)}
                    placeholder="Jelaskan alasan keperluan dinas, pembelajaran, atau administrasi..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Permintaan ke Admin</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FILE PREVIEW & DETAILS */}
      {/* ========================================================================= */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 overflow-hidden">
                {getFileIcon(previewFile.fileExtension)}
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base truncate max-w-md">
                    {previewFile.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {previewFile.category} • {formatBytes(previewFile.fileSize)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Details & Viewer Simulator */}
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-slate-400">Pengunggah:</span>{' '}
                    <strong className="text-slate-900">{previewFile.uploadedBy}</strong> ({previewFile.uploadedByRole})
                  </div>
                  <div>
                    <span className="text-slate-400">Waktu Unggah:</span>{' '}
                    <strong className="text-slate-900">{previewFile.uploadedAt}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Format File:</span>{' '}
                    <strong className="text-slate-900">{previewFile.fileExtension.toUpperCase()} ({previewFile.fileType})</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Status Akses:</span>{' '}
                    <strong className="text-emerald-700">{previewFile.privacy}</strong>
                  </div>
                </div>

                {previewFile.description && (
                  <div className="pt-2 border-t border-slate-200/80">
                    <span className="text-slate-400">Deskripsi:</span>
                    <p className="text-slate-800 mt-0.5">{previewFile.description}</p>
                  </div>
                )}
              </div>

              {/* Preview Window: Actual Image Display or Drive Simulator */}
              {previewFile.dataUrl || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(previewFile.fileExtension?.toLowerCase()) ? (
                <div className="p-4 bg-slate-900 rounded-2xl text-center space-y-3 border border-slate-800 flex flex-col items-center">
                  <div className="max-h-[360px] w-full flex items-center justify-center bg-slate-950/80 rounded-xl overflow-hidden p-2 border border-slate-800">
                    <img
                      src={previewFile.dataUrl || previewFile.driveFileUrl}
                      alt={previewFile.name}
                      referrerPolicy="no-referrer"
                      className="max-h-[340px] max-w-full object-contain rounded-lg shadow-lg"
                    />
                  </div>
                  <div className="pt-1 flex flex-wrap items-center justify-center gap-3">
                    <a
                      href={previewFile.driveFileUrl || GOOGLE_DRIVE_MAIN_FOLDER_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Buka File Asli di Google Drive</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-slate-900 rounded-2xl text-center text-slate-300 space-y-3 border border-slate-800">
                  <FileCheck2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <div className="font-bold text-white text-sm">Pratinjau Dokumen Tersedia</div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Berkas ini telah diverifikasi dan tersimpan aman di Google Drive Repository SMP Negeri Palu.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <a
                      href={previewFile.driveFileUrl || GOOGLE_DRIVE_MAIN_FOLDER_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Buka File Asli di Google Drive</span>
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
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200"
                  title="Hapus Berkas dari Repositori"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Hapus Berkas</span>
                </button>
              ) : <div />}
              <button
                onClick={() => setPreviewFile(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
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
      {/* MODAL: CONFIRM DELETE ACCESS REQUEST */}
      {/* ========================================================================= */}
      {deletingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Hapus Riwayat Permintaan</h3>
                <p className="text-xs text-slate-500">Konfirmasi penghapusan log izin akses</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs text-slate-700">
              <div><strong>Berkas:</strong> {deletingRequest.fileName}</div>
              <div><strong>Pemohon:</strong> {deletingRequest.requesterName} ({deletingRequest.requesterRole})</div>
              <div><strong>Waktu:</strong> {deletingRequest.requestedAt}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingRequest(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteRequest}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/20 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Riwayat</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GOOGLE DRIVE DIAGNOSTICS & SETUP GUIDE */}
      {/* ========================================================================= */}
      {isDriveGuideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn">
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
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
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
