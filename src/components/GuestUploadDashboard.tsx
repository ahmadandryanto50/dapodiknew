import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Upload, 
  Folder, 
  Lock,
  FileText, 
  CheckCircle2, 
  Search, 
  Trash2, 
  Loader2, 
  RefreshCw, 
  ExternalLink, 
  User, 
  Sparkles, 
  Download, 
  AlertCircle,
  FileIcon,
  Check,
  X,
  Sun
} from 'lucide-react';
import { AdminUser, AppDisplayConfig, SchoolProfile } from '../types';

interface GuestUploadDashboardProps {
  currentUser?: AdminUser | null;
  displayConfig: AppDisplayConfig;
  schoolProfile: SchoolProfile;
}

interface QueuedFile {
  id: string;
  file: File;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  errorMsg?: string;
  driveUrl?: string;
}

export const GuestUploadDashboard: React.FC<GuestUploadDashboardProps> = ({
  currentUser,
  displayConfig,
  schoolProfile
}) => {
  const [senderName, setSenderName] = useState<string>(() => {
    try {
      return localStorage.getItem('dapodik_guest_sender_name') || '';
    } catch {
      return '';
    }
  });

  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [historyFiles, setHistoryFiles] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [historySearch, setHistorySearch] = useState<string>('');
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);
  const [isUploadingAll, setIsUploadingAll] = useState<boolean>(false);

  // Live Camera states
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [hasCameraError, setHasCameraError] = useState<string | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('environment');
  const [brightness, setBrightness] = useState<number>(115); // Default is 115% to boost under-lit laptop/phone cameras
  const [contrast, setContrast] = useState<number>(105);   // Default is 105% to make document lines crispy and clear
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showCameraModeModal, setShowCameraModeModal] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Bind the camera stream to the video element once the modal is active and videoRef is mounted in the DOM
  useEffect(() => {
    if (isCameraActive && cameraStream && videoRef.current) {
      console.log("Binding camera stream to video element srcObject.");
      videoRef.current.srcObject = cameraStream;
    }
  }, [isCameraActive, cameraStream]);

  const startLiveCamera = async (facing: 'user' | 'environment' = 'environment') => {
    // If there is an existing stream, stop it first to release the device lock
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }

    setIsCameraActive(true);
    setCameraLoading(true);
    setHasCameraError(null);
    setCameraFacingMode(facing);

    // Sequence of constraints from most specific to most generic
    const constraintAttempts = [
      // Attempt 1: Target facing mode with high-quality resolution (ideal for phone document scanning)
      {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      },
      // Attempt 2: Target facing mode with standard default resolution (safe fallback for older webcams)
      {
        video: {
          facingMode: { ideal: facing }
        },
        audio: false
      },
      // Attempt 3: No facing mode, standard video (highest compatibility for single-camera laptops)
      {
        video: true,
        audio: false
      }
    ];

    let successStream: MediaStream | null = null;
    let lastError: any = null;

    for (let i = 0; i < constraintAttempts.length; i++) {
      try {
        console.log(`Trying camera constraint attempt ${i + 1}:`, constraintAttempts[i]);
        successStream = await navigator.mediaDevices.getUserMedia(constraintAttempts[i]);
        if (successStream) {
          console.log(`Camera connection succeeded on attempt ${i + 1}!`);
          break; // Found a working camera!
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Camera attempt ${i + 1} failed:`, err);
      }
    }

    if (successStream) {
      setCameraStream(successStream);
      if (videoRef.current) {
        videoRef.current.srcObject = successStream;
      }
    } else {
      console.error('All camera constraint attempts failed:', lastError);
      setHasCameraError(
        'Tidak dapat mengakses kamera. Mohon pastikan izin kamera diizinkan di browser Anda, atau klik tautan "Buka di Tab Baru" di atas jika mengakses dari pratinjau laptop.'
      );
    }
    setCameraLoading(false);
  };

  const switchCamera = async () => {
    const nextMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
    await startLiveCamera(nextMode);
  };

  const stopLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
    setHasCameraError(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;

        // Apply same filters to canvas so captured photo matches preview brightness/contrast
        context.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

        // Draw current frame from video
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to Blob and then to File object
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
              const file = new File([blob], `Kamera_${timestamp}.jpg`, {
                type: 'image/jpeg'
              });

              const newItem = {
                id: `queued-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                file,
                progress: 0,
                status: 'idle' as const
              };

              setQueue((prev) => [...prev, newItem]);
              setGlobalError(null);
              setGlobalSuccess(null);
              stopLiveCamera();
            }
          },
          'image/jpeg',
          0.92
        );
      }
    }
  };

  // Persistence for sender's name
  useEffect(() => {
    try {
      localStorage.setItem('dapodik_guest_sender_name', senderName);
    } catch (e) {
      console.warn('Could not save sender name to localStorage', e);
    }
  }, [senderName]);

  // Fetch upload history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/app-data?t=${Date.now()}`);
      if (res.ok) {
        const serverData = await res.json();
        if (serverData && Array.isArray(serverData.schoolFiles)) {
          // Sort files by uploadedAt descending
          const sorted = [...serverData.schoolFiles].sort((a, b) => {
            const timeA = a.uploadedAt ? new Date(a.uploadedAt.replace(/-/g, '/')).getTime() : 0;
            const timeB = b.uploadedAt ? new Date(b.uploadedAt.replace(/-/g, '/')).getTime() : 0;
            return timeB - timeA;
          });
          setHistoryFiles(sorted);
        }
      }
    } catch (e) {
      console.error('Failed to fetch file history:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleDeleteHistoryFile = async (fileId: string) => {
    setIsDeletingId(fileId);
    try {
      const res = await fetch('/api/app-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deletedFileId: fileId
        })
      });
      if (res.ok) {
        setHistoryFiles((prev) => prev.filter((f) => f.id !== fileId));
        setGlobalSuccess('Berkas berhasil dihapus secara permanen dari riwayat!');
        setGlobalError(null);
      } else {
        setGlobalError('Gagal menghapus berkas dari server.');
      }
    } catch (err) {
      console.error('Error deleting file:', err);
      setGlobalError('Terjadi kesalahan saat menghapus berkas.');
    } finally {
      setIsDeletingId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>, isCamera = false) => {
    if (e.target.files && e.target.files.length > 0) {
      const incoming = Array.from(e.target.files);
      const newItems = incoming.map((file) => ({
        id: `queued-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        progress: 0,
        status: 'idle' as const
      }));
      setQueue((prev) => [...prev, ...newItems]);
      setGlobalError(null);
      setGlobalSuccess(null);
      // Reset inputs so same file can be selected again
      e.target.value = '';
    }
  };

  const removeQueueItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const clearQueue = () => {
    if (isUploadingAll) return;
    setQueue([]);
  };

  const readAsBase64 = (file: File): Promise<{ base64Pure: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const mime = file.type || 'application/octet-stream';
      reader.onload = () => {
        try {
          const res = (reader.result as string) || '';
          const base64Pure = res.includes(',') ? res.split(',')[1] : res;
          resolve({ base64Pure, mimeType: mime });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  const compressImageIfNeeded = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve(file);
        return;
      }

      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        try {
          URL.revokeObjectURL(img.src);
          
          // Max dimension of 1600px is perfect for clear readable school documents
          const MAX_WIDTH = 1600;
          const MAX_HEIGHT = 1600;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            if (width > height) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            } else {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                console.log(`Image compressed from ${(file.size / 1024).toFixed(1)}KB to ${(compressedFile.size / 1024).toFixed(1)}KB`);
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            0.8
          );
        } catch (err) {
          console.error('Error during image compression:', err);
          resolve(file);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        resolve(file);
      };
    });
  };

  const uploadSingleFile = async (queuedItem: QueuedFile, uploader: string): Promise<string> => {
    const { file, id } = queuedItem;

    // Update state to uploading
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'uploading', progress: 15 } : item))
    );

    let fileToUpload = file;
    try {
      fileToUpload = await compressImageIfNeeded(file);
    } catch (compressErr) {
      console.warn('Compression skipped, using original file:', compressErr);
    }

    const { base64Pure, mimeType } = await readAsBase64(fileToUpload);
    
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, progress: 45 } : item))
    );

    const targetFolder = "Arsip Tamu";

    // Load active webAppUrl dynamically from sync-config
    let targetWebAppUrl = "https://script.google.com/macros/s/AKfycbx82FotXhPvN0i9hOo_S-bctwcT5JCB6JrvUu5CHtIMEepaJj1EIl5Bf7mxPoW8JuPguA/exec";
    try {
      const configRes = await fetch('/api/sync-config');
      if (configRes.ok) {
        const configData = await configRes.json();
        if (configData && configData.webAppUrl) {
          targetWebAppUrl = configData.webAppUrl;
        }
      }
    } catch (configErr) {
      console.warn('Could not fetch dynamic sync-config, using default:', configErr);
    }

    let directDriveUrl = '';
    let directDriveId = '';
    let isDirectSuccess = false;

    // Step A: Attempt direct client-side upload to Google Drive for 100% reliability
    try {
      console.log('Attempting super-reliable direct client-side upload to:', targetWebAppUrl);
      const directUploadRes = await fetch(targetWebAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          type: "UPLOAD_FILE_TO_DRIVE",
          fileName: file.name,
          mimeType: mimeType || "application/octet-stream",
          base64Data: base64Pure,
          folderName: targetFolder,
          description: `Berkas tamu diunggah oleh ${uploader} via Portal Berkas (Direct Browser)`,
          parentFolderId: "1OFVFI1xhsk45_ONTihtuSHeBVvEOr44m"
        })
      });

      if (directUploadRes.ok) {
        const directText = await directUploadRes.text();
        const parsedDirect = JSON.parse(directText);
        if (parsedDirect && parsedDirect.status === 'success') {
          directDriveUrl = parsedDirect.webViewLink || `https://drive.google.com/file/d/${parsedDirect.id}/view`;
          directDriveId = parsedDirect.id;
          isDirectSuccess = true;
          console.log('Direct client-side upload to Google Drive succeeded!', directDriveUrl);
        }
      }
    } catch (directErr) {
      console.warn('Direct upload was interrupted or blocked, falling back to server-side upload:', directErr);
    }

    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, progress: 75 } : item))
    );

    // Step B: Send file or file-metadata to the server to record it in app_data.json/history
    const res = await fetch('/api/upload-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: file.name,
        mimeType,
        base64Data: isDirectSuccess ? undefined : base64Pure, // Skip sending heavy binary data to server if direct upload succeeded
        category: targetFolder,
        uploadedBy: uploader,
        uploadedByRole: 'Tamu / Umum',
        description: `Berkas tamu diunggah oleh ${uploader} via Portal Berkas`,
        privacy: 'Public',
        folderName: targetFolder,
        onlySaveMetadata: isDirectSuccess,
        driveFileUrl: directDriveUrl || undefined,
        driveFolderId: directDriveId || undefined,
        fileSize: fileToUpload.size
      })
    });

    if (!res.ok) {
      // If direct upload succeeded but server save failed, we still treat it as successful
      if (isDirectSuccess && directDriveUrl) {
        setQueue((prev) =>
          prev.map((item) => (item.id === id ? { 
            ...item, 
            status: 'success', 
            progress: 100,
            driveUrl: directDriveUrl 
          } : item))
        );
        return directDriveUrl;
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Gagal mengunggah berkas ${file.name}`);
    }

    const json = await res.json();
    if (!json.success && !isDirectSuccess) {
      throw new Error(json.message || `Gagal menyimpan berkas ${file.name}`);
    }

    const finalDriveUrl = json.file?.driveFileUrl || directDriveUrl;

    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { 
        ...item, 
        status: 'success', 
        progress: 100,
        driveUrl: finalDriveUrl 
      } : item))
    );

    return finalDriveUrl;
  };

  const handleExecuteUpload = async () => {
    if (!senderName.trim()) {
      setGlobalError('Silakan masukkan nama pengirim terlebih dahulu untuk melacak riwayat.');
      const uploaderInput = document.getElementById('sender-name-input');
      if (uploaderInput) uploaderInput.focus();
      return;
    }

    if (queue.length === 0) {
      setGlobalError('Silakan pilih berkas atau gunakan kamera untuk mengambil dokumen.');
      return;
    }

    setIsUploadingAll(true);
    setGlobalError(null);
    setGlobalSuccess(null);

    let successCount = 0;
    let firstErrorMessage = '';
    const uploader = senderName.trim();

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (item.status === 'success') {
        successCount++;
        continue; // skip already uploaded files
      }

      try {
        await uploadSingleFile(item, uploader);
        successCount++;
      } catch (err: any) {
        console.error('File upload error in queue:', err);
        const errMsg = err?.message || 'Gagal mengunggah';
        if (!firstErrorMessage) {
          firstErrorMessage = errMsg;
        }
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'error', errorMsg: errMsg } : q))
        );
      }
    }

    setIsUploadingAll(false);
    fetchHistory(); // Refresh history immediately after upload operations complete

    if (successCount === queue.length) {
      setGlobalSuccess(`Selamat! Seluruh ${successCount} berkas Anda berhasil dikirim dan tersimpan aman di Google Drive.`);
      // Clear queue shortly after success
      setTimeout(() => {
        setQueue([]);
      }, 5000);
    } else if (successCount > 0) {
      setGlobalError(`Berhasil mengunggah ${successCount} dari ${queue.length} berkas. Beberapa berkas mengalami kegagalan: ${firstErrorMessage}`);
    } else {
      setGlobalError(`Gagal mengunggah berkas ke Google Drive: ${firstErrorMessage || 'Silakan periksa koneksi internet Anda atau coba lagi.'}`);
    }
  };

  const triggerFileSelection = () => {
    if (isUploadingAll) return;
    fileInputRef.current?.click();
  };

  const triggerCameraSelection = () => {
    if (isUploadingAll) return;
    setShowCameraModeModal(true);
  };

  // Filter history list based on search bar
  const filteredHistory = historyFiles.filter((f) => {
    const q = historySearch.toLowerCase();
    return (
      (f.name || '').toLowerCase().includes(q) ||
      (f.uploadedBy || '').toLowerCase().includes(q) ||
      (f.category || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full space-y-6 select-text">
      
      {/* Welcome Banner Card */}
      <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 text-center space-y-2.5 shadow-xl">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-400 text-slate-900 shadow-md">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase drop-shadow-md">
          Selamat Datang di Portal Berkas
        </h2>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-amber-300 drop-shadow-sm">
          SMP Negeri 11 Palu
        </h1>
        <p className="text-xs sm:text-sm text-sky-100 max-w-2xl mx-auto font-medium leading-relaxed">
          Kirim, simpan, dan kelola seluruh berkas penting, tugas sekolah, dokumen PTK, atau dokumen penunjang lainnya langsung ke cloud Google Drive sekolah tanpa ribet.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Card: Upload Interface matching Reference Image */}
        <div className="lg:col-span-7 bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 sm:p-6 text-slate-800 space-y-5">
          
          {/* Card Header exactly matching image */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 shadow-sm">
                <FileText className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg leading-snug">
                  Upload Berkas Multi-File
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
                  Upload satu atau beberapa file sekaligus (foto, PDF, Word, Excel) langsung ke Google Drive
                </p>
              </div>
            </div>

            {/* Google Drive Link Folder Button */}
            {currentUser?.role === 'Tamu / Umum' ? (
              <div
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs border border-slate-200 shrink-0 self-start sm:self-center cursor-not-allowed select-none"
                title="Akses folder Drive dibatasi hanya untuk Administrator & Operator Sekolah."
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Drive Terkunci</span>
              </div>
            ) : (
              <a
                href="https://drive.google.com/drive/folders/1OFVFI1xhsk45_ONTihtuSHeBVvEOr44m"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 active:scale-95 text-sky-600 font-extrabold text-xs transition-all border border-sky-100 shrink-0 self-start sm:self-center"
                title="Buka Folder Google Drive Sekolah"
              >
                <Folder className="w-4 h-4 stroke-[2.5]" />
                <span>Lihat Folder Drive</span>
              </a>
            )}
          </div>

          {/* Sender Identity Input (Important for tracking) */}
          <div className="space-y-1.5">
            <label htmlFor="sender-name-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Nama Lengkap Pengirim <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                id="sender-name-input"
                type="text"
                placeholder="Masukkan nama Anda (misal: Ahmad, Ibu Guru Maria, dll.)"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                disabled={isUploadingAll}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-semibold placeholder:text-slate-400 bg-slate-50 focus:bg-white transition-all text-slate-900"
              />
            </div>
          </div>

          {/* Hidden inputs */}
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={(e) => handleFileSelection(e, false)}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.svg,.zip,.rar"
          />
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={cameraInputRef}
            onChange={(e) => handleFileSelection(e, true)}
            className="hidden"
          />

          {/* Action Boxes Grid strictly styled as in image */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Box 1: Gunakan Kamera */}
            <div
              onClick={triggerCameraSelection}
              className={`border-2 border-dashed border-slate-200 hover:border-sky-500 bg-slate-50/50 hover:bg-sky-50/70 p-6 rounded-2xl text-center cursor-pointer select-none transition-all group relative active:scale-98 ${
                isUploadingAll ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="font-extrabold text-slate-900 text-sm mb-1">
                  Gunakan Kamera
                </div>
                <div className="text-slate-500 text-xs">
                  Foto dokumen &amp; tambahkan ke antrean
                </div>
              </div>
            </div>

            {/* Box 2: Upload File (Multi-File) */}
            <div
              onClick={triggerFileSelection}
              className={`border-2 border-dashed border-slate-200 hover:border-sky-500 bg-slate-50/50 hover:bg-sky-50/70 p-6 rounded-2xl text-center cursor-pointer select-none transition-all group relative active:scale-98 ${
                isUploadingAll ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="font-extrabold text-slate-900 text-sm mb-1">
                  Upload File (Multi-File)
                </div>
                <div className="text-slate-500 text-xs">
                  Pilih satu atau banyak file sekaligus
                </div>
              </div>
            </div>

          </div>

          {/* Toast / Global alert banner */}
          <AnimatePresence>
            {globalError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-950 text-xs flex items-center gap-2.5 font-semibold"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{globalError}</span>
              </motion.div>
            )}
            {globalSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-xs flex items-center gap-2.5 font-semibold"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{globalSuccess}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Queue List of Selected Files */}
          {queue.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Daftar Antrean Berkas ({queue.length})
                </div>
                <button
                  onClick={clearQueue}
                  disabled={isUploadingAll}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kosongkan</span>
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-between gap-2.5 text-xs transition-all"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileIcon className="w-4 h-4 text-sky-600 shrink-0" />
                      <div className="overflow-hidden">
                        <div className="font-bold text-slate-900 truncate max-w-[180px] sm:max-w-xs">
                          {item.file.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold">
                          {formatFileSize(item.file.size)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {item.status === 'idle' && (
                        <button
                          onClick={() => removeQueueItem(item.id)}
                          disabled={isUploadingAll}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {item.status === 'uploading' && (
                        <div className="flex items-center gap-1.5 text-sky-600 font-bold text-[11px]">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{item.progress}%</span>
                        </div>
                      )}

                      {item.status === 'success' && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Selesai</span>
                        </div>
                      )}

                      {item.status === 'error' && (
                        <div
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]"
                          title={item.errorMsg}
                        >
                          <AlertCircle className="w-3 h-3" />
                          <span>Gagal</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Upload Action Trigger Button */}
              <button
                type="button"
                onClick={handleExecuteUpload}
                disabled={isUploadingAll}
                className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-300 font-extrabold text-sm text-white transition-all shadow-md shadow-sky-600/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                {isUploadingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Sedang Mengirim ke Google Drive...</span>
                  </>
                ) : (
                  <>
                    <CloudUploadIcon className="w-4 h-4" />
                    <span>Kirim {queue.length} Berkas ke Google Drive</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>

        {/* Right Card: Real-time History of Uploads */}
        <div className="lg:col-span-5 bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 sm:p-6 text-slate-800 space-y-4">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <h3 className="font-extrabold text-slate-900 text-base">
                Riwayat Berkas Tersimpan
              </h3>
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={fetchHistory}
              disabled={isLoadingHistory}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
              title="Perbarui Riwayat"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Search bar for history */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Cari nama berkas, pengirim..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs font-semibold bg-slate-50 text-slate-900"
            />
          </div>

          {/* Loading state */}
          {isLoadingHistory && historyFiles.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
              <span className="text-xs font-semibold">Memuat riwayat kiriman...</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-12 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center p-4">
              <FileText className="w-8 h-8 text-slate-300 mb-1" />
              <div className="font-bold text-slate-800 text-xs">Belum ada kiriman berkas</div>
              <p className="text-slate-400 text-[11px] mt-0.5 max-w-xs">
                {historySearch ? 'Kiriman dengan kata kunci tersebut tidak ditemukan.' : 'Silakan pilih berkas atau gunakan kamera di samping untuk mengirim berkas pertama Anda.'}
              </p>
            </div>
          ) : (
            /* History Lists */
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {filteredHistory.map((file: any) => (
                <div
                  key={file.id}
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-150 transition-all text-xs flex flex-col gap-2 relative group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 overflow-hidden">
                      <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600 shrink-0 mt-0.5">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="overflow-hidden">
                        <div
                          className="font-bold text-slate-900 truncate max-w-[150px] sm:max-w-[200px]"
                          title={file.name}
                        >
                          {file.name}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {formatFileSize(file.fileSize || 0)} • {file.uploadedAt || 'Baru'}
                        </p>
                      </div>
                    </div>

                    {currentUser?.role !== 'Tamu / Umum' && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Drive View Link */}
                        {file.driveFileUrl && (
                          <a
                            href={file.driveFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg font-bold text-[10px] transition-colors flex items-center gap-1"
                            title="Buka berkas di Google Drive"
                          >
                            <ExternalLink className="w-3 h-3 text-emerald-600" />
                            <span className="hidden sm:inline">Drive</span>
                          </a>
                        )}

                        {/* Hapus Button with custom confirmation to bypass iframe window.confirm block */}
                        {confirmDeleteId === file.id ? (
                          <div className="flex items-center gap-1.5 animate-fadeIn">
                            <button
                              type="button"
                              onClick={() => {
                                handleDeleteHistoryFile(file.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-[10px] rounded-lg transition-all cursor-pointer flex items-center gap-0.5 shadow-sm"
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>Ya, Hapus</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer border border-slate-200"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(file.id)}
                            disabled={isDeletingId === file.id}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 active:scale-95"
                            title="Hapus Berkas Permanen"
                          >
                            {isDeletingId === file.id ? (
                              <Loader2 className="w-3 h-3 animate-spin text-rose-600" />
                            ) : (
                              <Trash2 className="w-3 h-3 text-rose-600" />
                            )}
                            <span className="hidden sm:inline">Hapus</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-slate-100 text-[10px]">
                    <div className="flex items-center gap-1 font-bold text-slate-600">
                      <span className="text-slate-400 font-medium">Pengirim:</span>
                      <span className="text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded truncate max-w-[110px]" title={file.uploadedBy}>
                        {file.uploadedBy || 'Tamu'}
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[9px] shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                      <span>Selesai di Drive</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

      {/* Active Live Camera Modal */}
      <AnimatePresence>
        {isCameraActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 text-white">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                    <Camera className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm tracking-wide">Kamera Aktif Dokumen</span>
                </div>
                <button
                  type="button"
                  onClick={stopLiveCamera}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Video Display Frame */}
              <div className="aspect-video bg-black relative overflow-hidden flex items-center justify-center">
                {cameraLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400 bg-slate-950">
                    <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
                    <span className="text-xs font-semibold">Mengaktifkan kamera...</span>
                  </div>
                ) : hasCameraError ? (
                  <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center gap-3 text-slate-400 bg-slate-950">
                    <AlertCircle className="w-8 h-8 text-rose-500 animate-bounce" />
                    <span className="text-xs font-bold text-rose-200 leading-relaxed max-w-xs">{hasCameraError}</span>
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 mt-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-sky-950/40 active:scale-95"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>BUKA DI TAB BARU (PASTI AKTIF)</span>
                    </a>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }}
                    />
                    
                    {/* Camera Source Badge */}
                    <div className="absolute top-4 left-4 text-[10px] text-white bg-slate-950/75 border border-white/10 px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 backdrop-blur-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{cameraFacingMode === 'environment' ? 'Kamera Belakang' : 'Kamera Depan'}</span>
                    </div>

                    {/* Futuristic Scanning Line Overlay */}
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-sky-500/50 shadow-[0_0_8px_rgba(14,165,233,0.8)] animate-pulse" />
                    <div className="absolute inset-4 border border-white/20 rounded-xl pointer-events-none flex items-center justify-center">
                      <div className="w-8 h-8 border-t-2 border-l-2 border-sky-400 absolute top-0 left-0 rounded-tl-md" />
                      <div className="w-8 h-8 border-t-2 border-r-2 border-sky-400 absolute top-0 right-0 rounded-tr-md" />
                      <div className="w-8 h-8 border-b-2 border-l-2 border-sky-400 absolute bottom-0 left-0 rounded-bl-md" />
                      <div className="w-8 h-8 border-b-2 border-r-2 border-sky-400 absolute bottom-0 right-0 rounded-br-md" />
                      
                      <div className="text-[10px] text-white/60 bg-slate-950/60 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider backdrop-blur-xs">
                        Posisikan Dokumen di Sini
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Brightness & Contrast Controls Row */}
              {!cameraLoading && !hasCameraError && (
                <div className="px-5 py-3.5 bg-slate-950/70 border-b border-slate-800 flex flex-col gap-2.5">
                  {/* Brightness Control */}
                  <div className="flex items-center justify-between gap-3 text-white text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400 font-bold">
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span>Kecerahan (Terang):</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="100"
                        max="180"
                        value={brightness}
                        onChange={(e) => setBrightness(Number(e.target.value))}
                        className="w-28 sm:w-36 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                      />
                      <span className="font-mono text-[11px] font-bold text-sky-400 w-8 text-right">{brightness}%</span>
                    </div>
                  </div>

                  {/* Contrast Control */}
                  <div className="flex items-center justify-between gap-3 text-white text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400 font-bold">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400 w-4 h-4"><circle cx="12" cy="12" r="10"/><path d="M12 18a6 6 0 1 0 0-12v12z"/></svg>
                      <span>Ketajaman Kontras:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="100"
                        max="150"
                        value={contrast}
                        onChange={(e) => setContrast(Number(e.target.value))}
                        className="w-28 sm:w-36 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                      />
                      <span className="font-mono text-[11px] font-bold text-sky-400 w-8 text-right">{contrast}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Controls */}
              <div className="p-5 bg-slate-950/40 border-t border-slate-800 flex flex-col items-center gap-4">
                
                {/* Take Photo Trigger with Switch Camera Button */}
                {!cameraLoading && !hasCameraError && (
                  <div className="flex items-center gap-6 justify-center w-full">
                    {/* Left Spacer to Balance Layout */}
                    <div className="w-10 h-10" />

                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="w-16 h-16 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 ring-4 ring-sky-500/30 cursor-pointer"
                      title="Ambil Foto Dokumen"
                    >
                      <div className="w-12 h-12 rounded-full border-2 border-slate-900 bg-white flex items-center justify-center">
                        <Camera className="w-5 h-5 text-slate-900" />
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={switchCamera}
                      className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center shadow-md transition-all hover:scale-110 active:scale-90 cursor-pointer border border-slate-700"
                      title={cameraFacingMode === 'environment' ? "Alihkan ke Kamera Depan" : "Alihkan ke Kamera Belakang"}
                    >
                      <RefreshCw className="w-4.5 h-4.5 text-sky-300" />
                    </button>
                  </div>
                )}

                {/* Secondary Option: Native Input Trigger Fallback */}
                <div className="w-full flex items-center justify-between gap-3 text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      cameraInputRef.current?.click();
                      stopLiveCamera();
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Gunakan Kamera Bawaan HP</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={stopLiveCamera}
                    className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold transition-colors cursor-pointer border border-slate-800"
                  >
                    Batal
                  </button>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera Mode Selection Modal */}
      <AnimatePresence>
        {showCameraModeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="max-w-md w-full bg-white text-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col relative border border-slate-100"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowCameraModeModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center gap-2.5 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Camera className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-lg">Pilih Sumber Kamera</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Pilih cara yang paling cocok untuk mengambil foto dokumen atau tugas sekolah Anda.
                </p>
              </div>

              <div className="space-y-3.5">
                {/* Option 1: Native Phone Camera (Recommended) */}
                <button
                  type="button"
                  onClick={() => {
                    setShowCameraModeModal(false);
                    cameraInputRef.current?.click();
                  }}
                  className="w-full p-4 rounded-2xl border-2 border-emerald-100 hover:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/70 text-left transition-all flex items-start gap-3.5 group cursor-pointer"
                >
                  <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 shrink-0 group-hover:scale-105 transition-transform">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <span>Kamera HP / Tablet</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[9px] uppercase tracking-wide">Paling Aman</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-normal">
                      Sangat direkomendasikan untuk pengguna HP/Tablet. (Pada Laptop/PC, opsi ini akan membuka dialog pilih berkas foto).
                    </p>
                  </div>
                </button>

                {/* Option 2: Live Scanning Web Camera */}
                <button
                  type="button"
                  onClick={() => {
                    setShowCameraModeModal(false);
                    startLiveCamera();
                  }}
                  className="w-full p-4 rounded-2xl border-2 border-sky-100 hover:border-sky-500 bg-sky-50/30 hover:bg-sky-50/70 text-left transition-all flex items-start gap-3.5 group cursor-pointer"
                >
                  <div className="p-2.5 rounded-xl bg-sky-100 text-sky-700 shrink-0 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 text-sm">
                      Kamera Laptop / Webcam
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-normal">
                      Membuka kamera webcam laptop Anda langsung di browser. Ideal untuk scan berkas atau ambil foto langsung dari Laptop/PC!
                    </p>
                  </div>
                </button>
              </div>

              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={() => setShowCameraModeModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invisible canvas used for snapshot rendering */}
      <canvas ref={canvasRef} className="hidden" />

    </div>
  );
};

// Simple cloud upload icon helper to avoid missing import errors
const CloudUploadIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M12 12v9" />
    <path d="m16 16-4-4-4 4" />
  </svg>
);
