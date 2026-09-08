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
  AlertCircle
} from 'lucide-react';
import { SchoolFileItem, FileAccessRequest, AdminUser } from '../types';
import { GOOGLE_DRIVE_MAIN_FOLDER_URL, GOOGLE_DRIVE_FOLDER_ID, initialSchoolFiles, initialAccessRequests } from '../data/mockFiles';
import {
  subscribeGoogleDriveAuth,
  signInWithGoogleDrive,
  signOutGoogleDrive,
  uploadFileToGoogleDrive,
  isGoogleDriveConnected
} from '../services/googleDriveService';

interface BerkasModuleProps {
  currentUser: AdminUser | null;
  onBackToHome?: () => void;
  autoOpenUpload?: boolean;
}

export const BerkasModule: React.FC<BerkasModuleProps> = ({ currentUser, onBackToHome, autoOpenUpload }) => {
  // Persistence state - Clean empty initialization
  const [files, setFiles] = useState<SchoolFileItem[]>(() => {
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

  const [accessRequests, setAccessRequests] = useState<FileAccessRequest[]>(() => {
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

  // Google Drive Real Auth State
  const [driveUser, setDriveUser] = useState<any>(null);
  const [isDriveLinked, setIsDriveLinked] = useState<boolean>(false);
  const [isConnectingDrive, setIsConnectingDrive] = useState<boolean>(false);
  const [currentUploadingFileName, setCurrentUploadingFileName] = useState<string>('');
  const [driveConnectError, setDriveConnectError] = useState<string | null>(null);

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

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dapodik_school_files_v3', JSON.stringify(files));
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
  const [isUploading, setIsUploading] = useState<boolean>(false);
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

  const isAdmin =
    !currentUser ||
    currentUser?.role === 'Administrator' ||
    currentUser?.role === 'Operator' ||
    currentUser?.username === 'admin' ||
    (typeof currentUser?.role === 'string' && currentUser.role.toLowerCase().includes('admin'));
  const isOperator = currentUser?.role === 'Operator';

  // Extract all categories
  const categories = Array.from(new Set(files.map(f => f.category))).filter(Boolean);

  // Check if current user has permission for a file
  const hasAccessToFile = (file: SchoolFileItem): boolean => {
    if (isAdmin) return true;
    if (file.privacy === 'Public') return true;

    // Check if role is Guru and file is Guru Only
    if (file.privacy === 'Guru Only' && (currentUser?.role === 'Guru' || currentUser?.role === 'Kepala Sekolah' || isOperator)) {
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
             (req.requesterName.toLowerCase() === (currentUser?.nama || '').toLowerCase() ||
              req.requesterEmail === currentUser?.email)
    );

    return hasApprovedRequest;
  };

  // Get user request status for a file
  const getUserRequestStatus = (fileId: string): 'none' | 'pending' | 'approved' | 'rejected' => {
    const userReq = accessRequests.find(
      req => req.fileId === fileId &&
             (req.requesterName.toLowerCase() === (currentUser?.nama || '').toLowerCase() ||
              req.requesterEmail === currentUser?.email)
    );
    return userReq ? userReq.status : 'none';
  };

  // Check if current user has access to Google Drive Main Folder
  const hasDriveMainFolderAccess = (): boolean => {
    if (isAdmin) return true;
    const currentUserName = (currentUser?.nama || currentUser?.username || '').toLowerCase();
    const currentUserEmail = (currentUser?.email || '').toLowerCase();
    return accessRequests.some(
      req => req.fileId === 'gdrive-main-folder' &&
             req.status === 'approved' &&
             ((currentUserName && req.requesterName.toLowerCase() === currentUserName) ||
              (currentUserEmail && req.requesterEmail.toLowerCase() === currentUserEmail))
    );
  };

  // Get request status specifically for Google Drive Main Folder
  const getDriveMainFolderRequestStatus = (): 'none' | 'pending' | 'approved' | 'rejected' => {
    if (isAdmin) return 'approved';
    const currentUserName = (currentUser?.nama || currentUser?.username || '').toLowerCase();
    const currentUserEmail = (currentUser?.email || '').toLowerCase();
    const matchingReq = accessRequests.find(
      req => req.fileId === 'gdrive-main-folder' &&
             ((currentUserName && req.requesterName.toLowerCase() === currentUserName) ||
              (currentUserEmail && req.requesterEmail.toLowerCase() === currentUserEmail))
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
      if (!isGoogleDriveConnected()) {
        const authRes = await signInWithGoogleDrive();
        setIsDriveLinked(true);
        setDriveUser(authRes.user);
      }

      let fileBlob: Blob;
      if (file.dataUrl && file.dataUrl.startsWith('data:')) {
        const res = await fetch(file.dataUrl);
        fileBlob = await res.blob();
      } else {
        fileBlob = new Blob([`Dokumen ${file.name} - Dapodik Sekolah`], { type: file.fileType || 'text/plain' });
      }

      const fileObj = new File([fileBlob], file.name, { type: file.fileType || 'application/octet-stream' });
      const driveResult = await uploadFileToGoogleDrive(fileObj, {
        category: file.category,
        customFolderName: file.category,
        description: file.description || `Berkas ${file.name}`,
        parentFolderId: GOOGLE_DRIVE_FOLDER_ID
      });

      setFiles(prev =>
        prev.map(f => {
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
        })
      );

      const targetFolderMsg = driveResult.folderName ? ` ke folder "${driveResult.folderName}"` : '';
      setSyncFeedback(`Berkas "${file.name}" berhasil diunggah langsung${targetFolderMsg} di Google Drive Anda!`);
      setTimeout(() => setSyncFeedback(null), 5000);
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

    setIsUploading(true);
    setUploadProgress(5);
    setDriveConnectError(null);

    // If folderChoiceMode is 'custom' and customFolder is provided, use customFolder
    // Otherwise use uploadCategory
    const targetCategory = folderChoiceMode === 'custom'
      ? (customFolder.trim() || 'Folder Baru')
      : (customFolder.trim() && folderChoiceMode === 'custom' ? customFolder.trim() : uploadCategory);

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newItems: SchoolFileItem[] = [];

    // Check / prompt Google Drive connection
    let isConnected = isGoogleDriveConnected();
    if (!isConnected) {
      try {
        const authRes = await signInWithGoogleDrive();
        if (authRes?.accessToken) {
          isConnected = true;
          setIsDriveLinked(true);
          setDriveUser(authRes.user);
        }
      } catch (authErr: any) {
        console.warn('Google Drive auth was not completed before upload:', authErr);
      }
    }

    const total = selectedUploadFiles.length;
    let successCount = 0;
    let failedCount = 0;
    let lastError = '';

    for (let i = 0; i < total; i++) {
      const file = selectedUploadFiles[i];
      setCurrentUploadingFileName(file.name);
      setUploadProgress(Math.round(((i + 0.3) / total) * 90));

      let driveResult: any = null;
      try {
        driveResult = await uploadFileToGoogleDrive(file, {
          category: targetCategory,
          customFolderName: targetCategory,
          description: uploadDescription || `Berkas resmi ${targetCategory} diunggah via Dapodik.`,
          parentFolderId: GOOGLE_DRIVE_FOLDER_ID
        });
        if (driveResult && driveResult.id) {
          successCount++;
        }
      } catch (uploadErr: any) {
        failedCount++;
        lastError = uploadErr?.message || 'Gagal mengunggah ke Google Drive';
        console.error('Google Drive direct upload error for file:', file.name, uploadErr);
      }

      // Read local base64 for instant in-app preview
      let dataUrl: string | undefined = undefined;
      try {
        dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });
      } catch (e) {
        // ignore
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';

      const fileItem: SchoolFileItem = {
        id: driveResult?.id || `file-up-${Date.now()}-${i}`,
        name: file.name,
        category: targetCategory,
        fileSize: file.size,
        fileType: file.type || 'application/octet-stream',
        fileExtension: ext,
        uploadedAt: nowStr,
        uploadedBy: currentUser?.nama || driveUser?.displayName || driveUser?.email || 'Administrator Sekolah',
        uploadedByRole: currentUser?.role || 'Administrator',
        driveFolderId: driveResult?.folderId || GOOGLE_DRIVE_FOLDER_ID,
        driveFileUrl: driveResult?.webViewLink || (driveResult?.id ? `https://drive.google.com/file/d/${driveResult.id}/view` : GOOGLE_DRIVE_MAIN_FOLDER_URL),
        dataUrl: dataUrl,
        privacy: uploadPrivacy,
        description: uploadDescription || `Berkas resmi diunggah ke repositori ${targetCategory}.`,
        tags: [ext.toUpperCase(), targetCategory.split(' ')[0], driveResult ? 'GoogleDrive' : 'Lokal'],
        allowedUserIds: ['admin'],
        allowedRoles: uploadPrivacy === 'Public' ? ['*'] : uploadPrivacy === 'Guru Only' ? ['Administrator', 'Guru', 'Operator'] : ['Administrator']
      };

      newItems.push(fileItem);
      setUploadProgress(Math.round(((i + 1) / total) * 100));
    }

    setFiles(prev => [...newItems, ...prev]);
    setIsUploading(false);
    setIsUploadModalOpen(false);
    setSelectedUploadFiles([]);
    setUploadDescription('');
    setCustomFolder('');
    setFolderChoiceMode('category');
    setUploadProgress(0);
    setCurrentUploadingFileName('');

    if (successCount > 0 && failedCount === 0) {
      setSyncFeedback(`Sukses! ${successCount} berkas berhasil diunggah dan tersimpan ke folder "${targetCategory}" di Google Drive!`);
    } else if (successCount > 0 && failedCount > 0) {
      setSyncFeedback(`${successCount} berkas berhasil disimpan di folder "${targetCategory}" Google Drive, ${failedCount} tersimpan lokal (${lastError}).`);
    } else if (failedCount > 0) {
      setDriveConnectError(`Berkas tersimpan lokal. Gagal upload ke Google Drive: ${lastError}. Silakan klik "Hubungkan Akun Google" dan klik tombol "Ke Drive" pada berkas.`);
    } else {
      setSyncFeedback(`Berhasil mengunggah ${newItems.length} berkas ke repositori sekolah (${targetCategory}).`);
    }
    setTimeout(() => setSyncFeedback(null), 6000);
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

    setAccessRequests(prev => [newReq, ...prev]);
    setRequestSuccessMsg('Permintaan akses berhasil dikirim! Menunggu persetujuan Administrator.');
    setTimeout(() => {
      setIsRequestModalOpen(false);
      setRequestSuccessMsg(null);
    }, 1800);
  };

  // Handle Admin Approval / Rejection
  const handleApproveRequest = (reqId: string) => {
    setAccessRequests(prev =>
      prev.map(r => {
        if (r.id === reqId) {
          return {
            ...r,
            status: 'approved',
            reviewedBy: currentUser?.nama || 'Administrator',
            reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            reviewNotes: 'Izin akses disetujui oleh Administrator.'
          };
        }
        return r;
      })
    );
  };

  const handleRejectRequest = (reqId: string) => {
    setAccessRequests(prev =>
      prev.map(r => {
        if (r.id === reqId) {
          return {
            ...r,
            status: 'rejected',
            reviewedBy: currentUser?.nama || 'Administrator',
            reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            reviewNotes: 'Permintaan akses ditolak oleh Administrator.'
          };
        }
        return r;
      })
    );
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
    setFiles(prev => prev.filter(f => f.id !== targetFile.id));
    setAccessRequests(prev => prev.filter(r => r.fileId !== targetFile.id));
    if (previewFile?.id === targetFile.id) {
      setPreviewFile(null);
    }
    setDeletingFile(null);
    setSyncFeedback(`Berkas "${targetFile.name}" berhasil dihapus dari repositori sekolah.`);
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  const confirmDeleteRequest = () => {
    if (!deletingRequest) return;
    const targetReq = deletingRequest;
    setAccessRequests(prev => prev.filter(r => r.id !== targetReq.id));
    setDeletingRequest(null);
    setSyncFeedback(`Riwayat permintaan izin akses berkas "${targetReq.fileName}" berhasil dihapus.`);
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  // Sync to Google Drive
  const handleSyncToDrive = async () => {
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
          let fileBlob: Blob;
          if (file.dataUrl && file.dataUrl.startsWith('data:')) {
            const res = await fetch(file.dataUrl);
            fileBlob = await res.blob();
          } else {
            fileBlob = new Blob([`Dokumen ${file.name} - Dapodik Sekolah`], { type: file.fileType || 'text/plain' });
          }
          const fileObj = new File([fileBlob], file.name, { type: file.fileType || 'application/octet-stream' });
          const driveResult = await uploadFileToGoogleDrive(fileObj, {
            category: file.category,
            customFolderName: file.category,
            description: file.description || `Berkas ${file.name}`,
            parentFolderId: GOOGLE_DRIVE_FOLDER_ID
          });

          if (driveResult && driveResult.id) {
            syncedCount++;
            setFiles(prev =>
              prev.map(f => {
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
              })
            );
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-amber-300">
              <HardDrive className="w-3.5 h-3.5" />
              <span>Google Drive Cloud Storage</span>
              <span className={`w-2 h-2 rounded-full ${isDriveLinked ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-[11px] text-sky-100 font-normal">
                {isDriveLinked ? `Terhubung (${driveUser?.email || 'Akun Google'})` : 'Belum Terhubung'}
              </span>
            </div>

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
              {hasDriveMainFolderAccess() ? (
                <a
                  href={GOOGLE_DRIVE_MAIN_FOLDER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold transition-all hover:scale-[1.02] cursor-pointer"
                  title="Buka Folder Google Drive Utama Sekolah"
                >
                  <Folder className="w-4 h-4 text-amber-300" />
                  <span>Buka Folder Google Drive Utama</span>
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

              {isDriveLinked ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-400/40 text-[11px] text-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-medium">Otorisasi Aktif: {driveUser?.email}</span>
                  <button
                    onClick={handleDisconnectDrive}
                    className="ml-1 text-emerald-300 hover:text-white underline cursor-pointer text-[10px]"
                    title="Putuskan Akun"
                  >
                    Ganti
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectDrive}
                  disabled={isConnectingDrive}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white text-slate-900 font-bold hover:bg-sky-50 border border-white/40 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>{isConnectingDrive ? 'Menghubungkan...' : 'Hubungkan Akun Google'}</span>
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
            <button
              onClick={handleSyncToDrive}
              disabled={isSyncing}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-sky-300 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkron Google Drive'}</span>
            </button>

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

        {driveConnectError && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
            <span>{driveConnectError}</span>
          </div>
        )}
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('files')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'files'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-sky-600" />
            <span>Semua Berkas ({files.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('folders')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'folders'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Folder className="w-4 h-4 text-amber-500" />
            <span>Kategori Folder ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'approvals'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Kelola Izin & Akses</span>
            {pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                {pendingRequestsCount}
              </span>
            )}
          </button>
        </div>

        {/* View mode toggle */}
        {activeTab === 'files' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                title="Tampilan Grid"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                title="Tampilan Tabel"
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ALL FILES LIST & SEARCH */}
      {/* ========================================================================= */}
      {activeTab === 'files' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-xs">
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari nama berkas, kategori, tag, atau pengunggah..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors font-medium"
              >
                <option value="ALL">Semua Kategori Folder</option>
                {categories.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={selectedPrivacy}
                onChange={e => setSelectedPrivacy(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors font-medium"
              >
                <option value="ALL">Semua Status Privasi</option>
                <option value="Restricted">Terkunci (Perlu Izin Admin)</option>
                <option value="Guru Only">Khusus Guru & Tendik</option>
                <option value="Public">Publik / Terbuka</option>
              </select>
            </div>
          </div>

          {/* Empty State when no files exist or match filters */}
          {filteredFiles.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 mb-4 shadow-xs">
                <FolderLock className="w-8 h-8" />
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mb-1">
                {files.length === 0 ? 'Repositori Berkas Masih Kosong' : 'Berkas Tidak Ditemukan'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
                {files.length === 0
                  ? 'Belum ada dokumen atau file yang diunggah. Anda dapat mengunggah berkas baru (PDF, Excel, Word, Foto, dll.) untuk disimpan ke repositori dan Google Drive sekolah.'
                  : 'Tidak ada berkas yang sesuai dengan kata kunci pencarian atau filter kategori yang Anda pilih.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {files.length > 0 && (
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
                )}
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-md hover:scale-105 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-slate-950" />
                  <span>Unggah Berkas Baru</span>
                </button>
              </div>
            </div>
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
                        <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
                          {getFileIcon(file.fileExtension)}
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
                            <a
                              href={file.driveFileUrl || GOOGLE_DRIVE_MAIN_FOLDER_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
                              title="Buka di Google Drive"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
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
                                <a
                                  href={file.driveFileUrl || GOOGLE_DRIVE_MAIN_FOLDER_URL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
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

              <div className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-800 text-xs font-bold">
                Total Permintaan: {accessRequests.length}
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
                    {isAdmin && <th className="py-3 px-4 text-center">Tindakan Administrator</th>}
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
                              <span>Disetujui</span>
                            </span>
                          )}
                          {req.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 text-[11px] font-bold border border-rose-200">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Ditolak</span>
                            </span>
                          )}
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-4 text-center">
                            {req.status === 'pending' ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleApproveRequest(req.id)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Izinkan</span>
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(req.id)}
                                  className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Tolak</span>
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                                <span>Ditinjau: {req.reviewedBy || 'Admin'} ({req.reviewedAt})</span>
                                <button
                                  onClick={() => setDeletingRequest(req)}
                                  className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="Hapus Riwayat Permintaan Ini"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Unggah Berkas Baru ke Google Drive</h3>
                  <p className="text-[11px] text-slate-500">Mendukung multi-upload otomatis tersimpan di Cloud Storage</p>
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
            {isDriveLinked ? (
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
            ) : (
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-slate-800 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-amber-600" />
                    <span>Koneksikan Akun Google Drive</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Hubungkan akun Google Anda agar berkas langsung tersimpan ke Google Drive pribadi/sekolah.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleConnectDrive}
                  disabled={isConnectingDrive}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-bold border border-slate-300 shadow-xs text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>{isConnectingDrive ? 'Menghubungkan...' : 'Hubungkan Akun'}</span>
                </button>
              </div>
            )}

            {/* Drag & Drop Box */}
            <div
              onClick={() => multiFileInputRef.current?.click()}
              className="border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/40 hover:bg-sky-50/80 rounded-2xl p-6 text-center transition-all cursor-pointer group"
            >
              <input
                type="file"
                multiple
                ref={multiFileInputRef}
                onChange={handleFileSelection}
                className="hidden"
              />
              <Upload className="w-10 h-10 text-sky-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-slate-900 text-sm">
                Klik atau Seret Berkas ke Area Ini
              </div>
              <p className="text-slate-500 text-xs mt-1">
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
                  <div className="text-[11px] text-amber-950 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      {customFolder.trim()
                        ? `Folder baru "${customFolder.trim()}" akan otomatis dibuat di Google Drive & tampil di menu Kategori Folder.`
                        : 'Ketik nama folder baru. Berkas akan masuk ke folder baru ini di Google Drive & menu kategori.'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Privacy Level */}
            <div className="text-xs">
              <label className="block font-bold text-slate-700 mb-1">Tingkat Privasi / Akses Berkas *</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setUploadPrivacy('Restricted')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    uploadPrivacy === 'Restricted'
                      ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <Lock className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                  <span>Terkunci (Izin Admin)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUploadPrivacy('Guru Only')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    uploadPrivacy === 'Guru Only'
                      ? 'bg-sky-50 border-sky-400 text-sky-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <UserCheck className="w-4 h-4 mx-auto mb-1 text-sky-600" />
                  <span>Khusus Guru & Tendik</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUploadPrivacy('Public')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    uploadPrivacy === 'Public'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <Unlock className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                  <span>Publik / Terbuka</span>
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="text-xs">
              <label className="block font-bold text-slate-700 mb-1">Keterangan / Catatan Dokumen</label>
              <textarea
                value={uploadDescription}
                onChange={e => setUploadDescription(e.target.value)}
                rows={2}
                placeholder="Deskripsi singkat isi dokumen..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-sky-500 resize-none"
              />
            </div>

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="space-y-1.5 p-3 bg-sky-50 rounded-2xl border border-sky-100">
                <div className="flex justify-between text-xs font-bold text-sky-900">
                  <span className="truncate max-w-[300px]">
                    {currentUploadingFileName ? `Mengunggah: ${currentUploadingFileName}` : 'Menyimpan ke Google Drive...'}
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-sky-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-sky-600 h-2 transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
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

              {/* Preview Window Simulator */}
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
                Apakah Anda yakin ingin menghapus berkas ini dari repositori sekolah? Berkas tidak akan lagi dapat diakses oleh pengguna lain.
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
    </div>
  );
};
