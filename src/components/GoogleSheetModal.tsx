import React, { useState } from 'react';
import { 
  Database, 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  HelpCircle, 
  FileSpreadsheet, 
  Code,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import { SyncConfig, Student, TeacherStaff, SarprasItem, StudentReport, AdminUser, NotificationItem } from '../types';
import { APPS_SCRIPT_TEMPLATE, syncToGoogleSheets } from '../services/googleSheetsService';
import confetti from 'canvas-confetti';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncConfig: SyncConfig;
  onSaveConfig: (config: SyncConfig) => void;
  students: Student[];
  teachers: TeacherStaff[];
  sarpras: SarprasItem[];
  reports: StudentReport[];
  pengaturan?: Array<{ key: string; value: string }>;
  administrators?: AdminUser[];
  profilSekolah?: Array<{ key: string; value: string }>;
  notifications?: NotificationItem[];
  onPullData?: () => void;
}

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  syncConfig,
  onSaveConfig,
  students,
  teachers,
  sarpras,
  reports,
  pengaturan,
  administrators,
  profilSekolah,
  notifications,
  onPullData
}) => {
  const [webAppUrl, setWebAppUrl] = useState(syncConfig.webAppUrl);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState(syncConfig.spreadsheetUrl);
  const [autoSync, setAutoSync] = useState(syncConfig.autoSync);
  const [isCopied, setIsCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'code' | 'guide'>('config');

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSave = () => {
    const updated: SyncConfig = {
      ...syncConfig,
      webAppUrl,
      spreadsheetUrl,
      autoSync,
      status: webAppUrl ? 'connected' : 'disconnected'
    };
    onSaveConfig(updated);
    onClose();
  };

  const handleTestSync = async () => {
    setIsTesting(true);
    setTestResult(null);

    const tempConfig: SyncConfig = {
      ...syncConfig,
      webAppUrl,
      spreadsheetUrl
    };

    const res = await syncToGoogleSheets(tempConfig, {
      siswa: students,
      ptk: teachers,
      sarpras: sarpras,
      rapor: reports,
      pengaturan: pengaturan || [],
      administrator: administrators || [],
      profilSekolah: profilSekolah || [],
      notifikasi: notifications || []
    });

    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 text-xs flex flex-col justify-between">
        
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Integrasi Database Cloud Real-Time</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                    Live Sync
                  </span>
                </h2>
                <p className="text-slate-500 text-[11px]">
                  Simpan seluruh data Siswa, Alumni, PTK, Sarpras, Rapor, Notifikasi, dan Profil Sekolah otomatis ke Database Cloud Anda
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 border-b border-slate-100 mt-4 pb-2">
            <button
              onClick={() => setActiveTab('config')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'config' 
                  ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-600/20' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Pengaturan Koneksi
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'code' 
                  ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-600/20' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Salin Skrip Apps Script</span>
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'guide' 
                  ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-600/20' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Panduan Pasang (1 Menit)</span>
            </button>
          </div>

          {/* Tab 1: Config */}
          {activeTab === 'config' && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 text-slate-700">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 font-bold">Sinkronisasi Dua Arah Tanpa Batas:</strong>
                    <p className="text-[11px] mt-0.5 text-slate-600">
                      Dengan memasang URL Google Apps Script di bawah, setiap perubahan data (Tambah, Edit, Hapus) di Dapodik akan otomatis tersimpan langsung ke Database Cloud Anda secara real-time.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  URL Google Apps Script Web App (Wajib untuk Real-Time Sync) *
                </label>
                <input
                  type="url"
                  value={webAppUrl}
                  onChange={(e) => setWebAppUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 font-mono focus:border-sky-500 focus:bg-white focus:outline-none placeholder-slate-400"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Didapatkan setelah menerapkan (deploy) skrip v2.7 di Database Cloud (lihat tab Panduan).
                </p>
                <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Catatan Notifikasi:</strong> Jika sheet <em>"Notifikasi"</em> belum muncul di Spreadsheet Google Anda, harap buka tab <strong>"Salin Skrip Apps Script"</strong>, salin kode v2.7 terbaru, lalu perbarui deployment Anda di Apps Script (<em>Deploy &gt; New Deployment</em> atau <em>Manage Deployments</em>).
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Tautan Database Cloud Anda (Opsional untuk Akses Cepat)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={spreadsheetUrl}
                    onChange={(e) => setSpreadsheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 font-mono focus:border-sky-500 focus:bg-white focus:outline-none placeholder-slate-400"
                  />
                  {spreadsheetUrl && (
                    <a
                      href={spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold flex items-center gap-1.5 shrink-0 transition-colors"
                    >
                      <span>Buka Database</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200">
                <div>
                  <div className="font-bold text-slate-900">Auto-Sync Otomatis</div>
                  <div className="text-[11px] text-slate-500">Kirim data ke Database Cloud setiap kali ada entri baru</div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoSync(!autoSync)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${autoSync ? 'bg-sky-600' : 'bg-slate-300'}`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white shadow-xs absolute top-1 transition-transform ${autoSync ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              {testResult && (
                <div className={`p-3 rounded-2xl border flex items-center gap-2 font-medium ${
                  testResult.success ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800'
                }`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Script Code */}
          {activeTab === 'code' && (
            <div className="space-y-3 py-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-700 font-bold">Kode Google Apps Script (Code.gs):</span>
                <button
                  onClick={handleCopyCode}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold transition-all flex items-center gap-1.5 shadow-md shadow-sky-600/20 cursor-pointer"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Tersalin!' : 'Salin Semua Kode'}</span>
                </button>
              </div>

              <div className="relative rounded-2xl bg-slate-900 border border-slate-800 p-4 font-mono text-[11px] text-sky-200 max-h-72 overflow-y-auto leading-relaxed shadow-inner">
                <pre>{APPS_SCRIPT_TEMPLATE}</pre>
              </div>
            </div>
          )}

          {/* Tab 3: Easy Step-by-Step Guide */}
          {activeTab === 'guide' && (
            <div className="space-y-3 py-4 text-slate-700">
              <div className="grid grid-cols-1 gap-2.5">
                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 border border-sky-300 flex items-center justify-center font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Buat Lembar Kerja Baru</h4>
                    <p className="text-[11px] text-slate-500">
                      Buka tab baru dan ketik <strong>sheets.new</strong> atau buat lembar kerja baru di Google Drive.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 border border-sky-300 flex items-center justify-center font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Buka Apps Script</h4>
                    <p className="text-[11px] text-slate-500">
                      Di menu atas lembar kerja, klik <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 border border-sky-300 flex items-center justify-center font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Paste Kode</h4>
                    <p className="text-[11px] text-slate-500">
                      Hapus teks kode lama di editor, lalu Paste kode dari tab <em>"Salin Skrip Apps Script"</em> di atas.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 border border-sky-300 flex items-center justify-center font-bold shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Terapkan Sebagai Aplikasi Web (Deploy)</h4>
                    <p className="text-[11px] text-slate-500">
                      Klik <strong>Terapkan (Deploy)</strong> &gt; <strong>Penerapan baru (New deployment)</strong> &gt; Pilih jenis <strong>Aplikasi Web</strong> &gt; Ubah Akses ke <strong>"Siapa saja" (Anyone)</strong> &gt; Klik Terapkan & Salin URL Aplikasi Web.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleTestSync}
              disabled={isTesting}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Kirim dan timpa semua data dari aplikasi ke Database Cloud"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Menguji...' : 'Kirim & Sinkronkan Data'}</span>
            </button>
            {onPullData && (
              <button
                type="button"
                onClick={onPullData}
                className="px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold border border-sky-200 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Tarik semua data dari Database Cloud dan timpa data lokal aplikasi"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tarik Data</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold cursor-pointer transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold shadow-md shadow-sky-600/20 cursor-pointer transition-all"
            >
              Simpan Pengaturan
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
