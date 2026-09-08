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
  Tag
} from 'lucide-react';
import { SchoolFileItem, FileAccessRequest, AdminUser } from '../types';
import { GOOGLE_DRIVE_MAIN_FOLDER_URL, GOOGLE_DRIVE_FOLDER_ID, initialSchoolFiles, initialAccessRequests } from '../data/mockFiles';

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

  const isAdmin = currentUser?.role === 'Administrator';
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

  const handleExecuteUpload = () => {
    if (selectedUploadFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(15);

    const targetCategory = customFolder.trim() ? customFolder.trim() : uploadCategory;

    // Simulate upload progression
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 95;
        }
        return prev + 25;
      });
    }, 250);

    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);

      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
      const newItems: SchoolFileItem[] = selectedUploadFiles.map((file, idx) => {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
        return {
          id: `file-up-${Date.now()}-${idx}`,
          name: file.name,
          category: targetCategory,
          fileSize: file.size,
          fileType: file.type || 'application/octet-stream',
          fileExtension: ext,
          uploadedAt: nowStr,
          uploadedBy: currentUser?.nama || 'Administrator Sekolah',
          uploadedByRole: currentUser?.role || 'Administrator',
          driveFolderId: GOOGLE_DRIVE_FOLDER_ID,
          driveFileUrl: GOOGLE_DRIVE_MAIN_FOLDER_URL,
          privacy: uploadPrivacy,
          description: uploadDescription || `Berkas resmi diunggah ke repositori ${targetCategory}.`,
          tags: [ext.toUpperCase(), targetCategory.split(' ')[0], 'GoogleDrive'],
          allowedUserIds: ['admin'],
          allowedRoles: uploadPrivacy === 'Public' ? ['*'] : uploadPrivacy === 'Guru Only' ? ['Administrator', 'Guru', 'Operator'] : ['Administrator']
        };
      });

      setFiles(prev => [...newItems, ...prev]);
      setIsUploading(false);
      setIsUploadModalOpen(false);
      setSelectedUploadFiles([]);
      setUploadDescription('');
      setCustomFolder('');
      setUploadProgress(0);
      setSyncFeedback(`Berhasil mengunggah ${newItems.length} berkas baru & tersimpan di Google Drive!`);
      setTimeout(() => setSyncFeedback(null), 4000);
    }, 1200);
  };

  // Handle Request Access Submission
  const handleOpenRequestModal = (file: SchoolFileItem) => {
    setSelectedFileForRequest(file);
    setRequestName(currentUser?.nama || '');
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

  const handleDeleteFile = (fileId: string) => {
    if (!isAdmin) return;
    if (confirm('Apakah Anda yakin ingin menghapus berkas ini dari repositori?')) {
      setFiles(prev => prev.filter(f => f.id !== fileId));
    }
  };

  // Sync to Google Drive Simulation
  const handleSyncToDrive = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncFeedback('Semua berkas berhasil disinkronkan dengan folder Google Drive!');
      setTimeout(() => setSyncFeedback(null), 3500);
    }, 1500);
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
              <span>Google Drive Cloud Repository</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <FolderLock className="w-8 h-8 text-amber-400 shrink-0" />
              <span>Manajemen Berkas & Arsip Digital</span>
            </h1>

            <p className="text-sky-100 text-xs sm:text-sm leading-relaxed">
              Penyimpanan terpusat dokumen resmi sekolah, SK PTK, Kurikulum KOSP, berkas kesiswaan, dan sertifikat. Terhubung langsung secara otomatis dengan folder Google Drive satuan pendidikan.
            </p>

            {/* Google Drive Link Indicator */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
              <a
                href={GOOGLE_DRIVE_MAIN_FOLDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Folder className="w-4 h-4 text-amber-300" />
                <span>Buka Folder Google Drive Utama</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

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
                                onClick={() => handleDeleteFile(file.id)}
                                className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Hapus Berkas"
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
                                    onClick={() => handleDeleteFile(file.id)}
                                    className="p-1 rounded-lg hover:bg-rose-50 text-rose-600"
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
                          <div className="font-bold text-slate-900">{req.fileName}</div>
                          <div className="text-[10px] text-slate-400">ID: {req.fileId}</div>
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
                              <div className="text-[11px] text-slate-400">
                                Ditinjau: {req.reviewedBy || 'Admin'} ({req.reviewedAt})
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
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Unggah Berkas Baru</h3>
                  <p className="text-[11px] text-slate-500">Mendukung multi-upload banyak file sekaligus ke Google Drive</p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
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

            {/* Category / Folder Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategori Folder *</label>
                <select
                  value={uploadCategory}
                  onChange={e => setUploadCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-sky-500"
                >
                  <option value="Kurikulum & Pembelajaran">Kurikulum & Pembelajaran</option>
                  <option value="Kepegawaian & SK PTK">Kepegawaian & SK PTK</option>
                  <option value="Kesiswaan & Ijazah">Kesiswaan & Ijazah</option>
                  <option value="Sarpras & Inventaris">Sarpras & Inventaris</option>
                  <option value="Keuangan & BOS">Keuangan & BOS</option>
                  <option value="Akreditasi & SPM">Akreditasi & SPM</option>
                  <option value="Surat & Administrasi">Surat & Administrasi</option>
                  <option value="Umum">Umum</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Atau Buat Folder Baru Sendiri
                </label>
                <input
                  type="text"
                  value={customFolder}
                  onChange={e => setCustomFolder(e.target.value)}
                  placeholder="Ketik nama folder baru..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>
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
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-sky-800">
                  <span>Mengunggah ke Google Drive...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-sky-500 h-2 transition-all duration-300 rounded-full"
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
                  <h3 className="font-extrabold text-slate-900 text-base">Permintaan Izin Akses Berkas</h3>
                  <p className="text-[11px] text-slate-500">Kirim permintaan resmi kepada Administrator</p>
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
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-900">{selectedFileForRequest.name}</div>
              <div className="text-slate-500 flex items-center gap-2 text-[11px]">
                <span>Kategori: {selectedFileForRequest.category}</span>
                <span>•</span>
                <span>Ukuran: {formatBytes(selectedFileForRequest.fileSize)}</span>
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
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
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
    </div>
  );
};
