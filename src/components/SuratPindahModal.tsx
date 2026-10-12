import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  Sliders, 
  CheckCircle2, 
  Sparkles,
  School,
  User,
  Calendar,
  MapPin,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import { Student, SchoolProfile, AppDisplayConfig } from '../types';
import { formatDateIndonesian } from '../utils/dateUtils';
import { formatImageUrl } from '../utils/imageUtils';
import { printElement, exportElementToPdf } from '../utils/printHelper';
import { generateSuratPindahPdf, toTitleCase } from '../utils/pdfExportHelper';
import logoKotaPaluAsset from '../assets/images/logo_kota_palu_1791772520754.jpg';

interface SuratPindahModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  schoolProfile?: SchoolProfile;
  displayConfig?: AppDisplayConfig;
  onMarkMutasi?: (studentId: string, reason: string) => void;
}

export const SuratPindahModal: React.FC<SuratPindahModalProps> = ({
  isOpen,
  onClose,
  student,
  schoolProfile,
  displayConfig,
  onMarkMutasi
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);
  const [showEditorPanel, setShowEditorPanel] = useState(true);

  // Track whether user has manually edited / customized the nomor surat
  const hasUserEditedNomorSuratRef = useRef(false);

  // Logo selection & custom uploads for Kop Surat
  const [logoChoice, setLogoChoice] = useState<'palu' | 'sekolah' | 'custom'>('palu');
  const [customLogoKiri, setCustomLogoKiri] = useState<string | null>(null);

  // Logo Kanan (Tut Wuri Handayani default atau Custom Upload)
  const [logoKananChoice, setLogoKananChoice] = useState<'tutwuri' | 'custom'>('tutwuri');
  const [customLogoKanan, setCustomLogoKanan] = useState<string | null>(null);

  const fileInputKiriRef = useRef<HTMLInputElement>(null);
  const fileInputKananRef = useRef<HTMLInputElement>(null);

  // Handle Logo Kiri Upload
  const handleUploadLogoKiri = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCustomLogoKiri(reader.result);
          setLogoChoice('custom');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Logo Kanan Upload
  const handleUploadLogoKanan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCustomLogoKanan(reader.result);
          setLogoKananChoice('custom');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Editable fields
  const currentYear = new Date().getFullYear();
  const [nomorSurat, setNomorSurat] = useState('');
  const [sekolahTujuan, setSekolahTujuan] = useState('');
  const [kabKotaTujuan, setKabKotaTujuan] = useState('');
  const [kelasTujuan, setKelasTujuan] = useState('');
  const [alasanPindah, setAlasanPindah] = useState('Mengikuti Orang Tua / Pindah Domisili');
  const [catatanKelengkapan, setCatatanKelengkapan] = useState('Buku Laporan Hasil Belajar (Raport) dan Surat Keterangan Kelakuan Baik telah diserahkan kepada yang bersangkutan.');
  const [tanggalSurat, setTanggalSurat] = useState('');
  const [tanggalPermohonan, setTanggalPermohonan] = useState('');
  const [tanggalEfektif, setTanggalEfektif] = useState('');
  
  // Student & Parents editable values (Point 6, 7, 8 manual inputs)
  const [namaSiswa, setNamaSiswa] = useState('');
  const [nisn, setNisn] = useState('');
  const [nis, setNis] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState('');
  const [tempatTanggalLahir, setTempatTanggalLahir] = useState('');
  const [kelasAsal, setKelasAsal] = useState('');
  const [namaOrangTua, setNamaOrangTua] = useState('');
  const [pekerjaanOrangTua, setPekerjaanOrangTua] = useState('');
  const [alamatOrangTua, setAlamatOrangTua] = useState('');

  // School profile values
  const [namaSekolah, setNamaSekolah] = useState('');
  const [npsnSekolah, setNpsnSekolah] = useState('');
  const [alamatSekolah, setAlamatSekolah] = useState('');
  const [kepalaSekolah, setKepalaSekolah] = useState('');
  const [nipKepalaSekolah, setNipKepalaSekolah] = useState('');
  const [kotaSurat, setKotaSurat] = useState('');

  // Initialize data whenever modal opens or student changes
  useEffect(() => {
    if (!student || !isOpen) return;

    const todayStr = formatDateIndonesian(new Date().toISOString());
    const schoolName = schoolProfile?.namaSekolah || 'SMP NEGERI 11 PALU';
    const city = schoolProfile?.kabupatenKota || 'Kota Palu';
    const cleanCity = city.replace(/^(KABUPATEN|KOTA)\s+/i, '');

    // Formatted nomor surat:
    // IMPORTANT: Only generate random sequence if nomorSurat is not yet set or not edited by user.
    // If already filled by user, do NOT let it change randomly!
    setNomorSurat(prev => {
      if (prev && prev.trim() !== '' && hasUserEditedNomorSuratRef.current) {
        return prev;
      }
      if (prev && prev.trim() !== '') {
        return prev;
      }
      const randomSeq = Math.floor(100 + Math.random() * 900);
      return `421.2 / ${randomSeq} / SMPN.11 / ${currentYear}`;
    });

    setSekolahTujuan('');
    setKabKotaTujuan('');
    setAlasanPindah('Mengikuti Orang Tua / Pindah Domisili');
    setCatatanKelengkapan('Buku Laporan Hasil Belajar (Raport) dan Surat Keterangan Kelakuan Baik telah diserahkan kepada yang bersangkutan.');
    setTanggalSurat(todayStr);
    setTanggalPermohonan(todayStr);
    setTanggalEfektif(todayStr);

    // Student fields
    setNamaSiswa(toTitleCase(student.nama || ''));
    setNisn(student.nisn || '');
    setNis(student.nis || '');
    setJenisKelamin(student.jenisKelamin === 'P' ? 'Perempuan' : 'Laki-laki');
    
    const ttlStr = `${student.tempatLahir || 'Palu'}, ${student.tanggalLahir ? formatDateIndonesian(student.tanggalLahir) : '-'}`;
    setTempatTanggalLahir(toTitleCase(ttlStr));

    const rombelStr = student.rombel || student.rombelSaatIni || 'Kelas VII';
    setKelasAsal(rombelStr);
    setKelasTujuan(rombelStr);

    // Parent details (6, 7, 8 - can be manually typed/overridden)
    const ortu = student.namaAyah || student.namaIbu || student.namaWali || '';
    const pekerjaan = student.pekerjaanAyah || student.pekerjaanIbu || student.pekerjaanWali || '';
    const alamat = student.alamat || '';
    setNamaOrangTua(toTitleCase(ortu));
    setPekerjaanOrangTua(pekerjaan);
    setAlamatOrangTua(alamat);

    // School details
    setNamaSekolah(schoolName);
    setNpsnSekolah(schoolProfile?.npsn || '40203578');
    setAlamatSekolah(schoolProfile?.alamat || 'Jl. Sintuvu No. 11, Tatanga, Kota Palu, Sulawesi Tengah');
    setKepalaSekolah(toTitleCase(schoolProfile?.kepalaSekolah || 'Sunardiyanto, S.Pd., M.Pd.'));
    setNipKepalaSekolah(schoolProfile?.nipKepalaSekolah || (schoolProfile as any)?.nipKepsek || '196805121994121003');
    setKotaSurat(cleanCity || 'Palu');
  }, [student?.id, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !student) return null;

  const schoolLogoUrl = formatImageUrl(displayConfig?.logoCustomUrl || schoolProfile?.logoSekolah, '/logo_smpn11palu.jpg');
  const logoPaluUrl = logoKotaPaluAsset || '/logo_kota_palu.png';
  
  // URL Logo Kiri (Bisa Palu, Sekolah, atau Custom Upload)
  const activeLogoUrl = logoChoice === 'custom' && customLogoKiri
    ? customLogoKiri
    : (logoChoice === 'sekolah' ? schoolLogoUrl : logoPaluUrl);

  // URL Logo Kanan (Bisa Tut Wuri default atau Custom Upload)
  const isCustomLogoKanan = logoKananChoice === 'custom' && Boolean(customLogoKanan);
  const activeLogoKananUrl = customLogoKanan;

  // Trigger Print with clean document layout
  const handlePrint = async () => {
    if (isPrinting || isDownloading) return;
    setIsPrinting(true);
    setIsGeneratingDocument(true);
    try {
      // Allow React to re-render inputs as formal text spans
      await new Promise((r) => setTimeout(r, 150));
      await printElement('printable-surat-pindah-content', `Surat_Pindah_${student?.nama || 'Siswa'}`);
    } catch (err) {
      console.error('Gagal mencetak surat:', err);
    } finally {
      setIsGeneratingDocument(false);
      setIsPrinting(false);
    }
  };

  // Trigger Download PDF with instant native jsPDF generator (zero freeze, 100% reliable)
  const handleDownloadPdf = async () => {
    if (isDownloading || isPrinting) return;
    setIsDownloading(true);
    setIsGeneratingDocument(true);
    try {
      await new Promise((r) => setTimeout(r, 100));
      const success = generateSuratPindahPdf({
        namaSekolah,
        npsnSekolah,
        alamatSekolah,
        emailSekolah: schoolProfile?.email || 'smpnegeri11palu@gmail.com',
        akreditasiSekolah: schoolProfile?.akreditasi || 'A',
        kepalaSekolah,
        nipKepalaSekolah,
        kotaSurat,
        nomorSurat,
        tanggalSurat,
        tanggalPermohonan,
        tanggalEfektif,
        namaSiswa,
        nis,
        nisn,
        jenisKelamin,
        tempatTanggalLahir,
        kelasAsal,
        namaOrangTua,
        pekerjaanOrangTua,
        alamatOrangTua,
        sekolahTujuan,
        kabKotaTujuan,
        kelasTujuan,
        alasanPindah,
        catatanKelengkapan,
      });

      if (!success) {
        // Safe fallback to exportElementToPdf if ever required
        const cleanFileName = `Surat_Keterangan_Pindah_${(namaSiswa || student?.nama || 'Siswa').replace(/[^a-zA-Z0-9]/g, '_')}_${nisn || ''}`;
        await exportElementToPdf('printable-surat-pindah-content', cleanFileName);
      }
    } catch (err) {
      console.error('Gagal mengunduh PDF:', err);
    } finally {
      setIsGeneratingDocument(false);
      setIsDownloading(false);
    }
  };

  const commonReasons = [
    'Mengikuti Orang Tua / Pindah Domisili',
    'Mengikuti Tugas Kerja Orang Tua',
    'Keinginan Orang Tua / Peserta Didik',
    'Mencari Sekolah yang Lebih Dekat',
    'Pondok Pesantren / Sekolah Berasrama'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 pt-16 sm:pt-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200 print:bg-white print:p-0 print:static print:overflow-visible">
      <div className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-6xl h-[92vh] sm:h-[88vh] max-h-[940px] flex flex-col shadow-2xl overflow-hidden my-auto print:border-none print:shadow-none print:max-w-none print:max-h-none print:w-full print:h-auto print:overflow-visible">
        
        {/* ========================================================= */}
        {/* TOP BAR / ACTION HEADER */}
        {/* ========================================================= */}
        <div className="no-print px-4 sm:px-6 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white leading-tight">Surat Keterangan Pindah Sekolah</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 hidden sm:inline-block">
                  Resmi Kemdikbudristek
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Siswa: <span className="text-sky-300 font-semibold">{namaSiswa}</span> &bull; NISN: <span className="font-mono text-slate-300">{nisn}</span> &bull; {kelasAsal}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEditorPanel(!showEditorPanel)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                showEditorPanel 
                  ? 'bg-sky-600/30 border-sky-500 text-sky-200' 
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title="Tampilkan / Sembunyikan Panel Edit Form"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{showEditorPanel ? 'Sembunyikan Form' : 'Buka Form Isian'}</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting || isDownloading}
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="Cetak Surat Langsung ke Printer"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Menyiapkan...' : 'Cetak / Print'}</span>
            </button>

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading || isPrinting}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="Unduh Surat dalam Format Dokumen PDF"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'Memproses PDF...' : 'Download PDF'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Tutup Modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MAIN BODY: SPLIT VIEW (EDITOR CONTROLS + LIVE A4 PREVIEW) */}
        {/* ========================================================= */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-100 print:bg-white print:overflow-visible print:block">
          
          {/* LEFT PANEL: FAST INPUT CONTROLS */}
          {showEditorPanel && (
            <div className="no-print w-full lg:w-80 xl:w-96 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto max-h-64 lg:max-h-none p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-sky-600" />
                  Isian Form Surat Mutasi
                </span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Live Update
                </span>
              </div>

              {/* PENGATURAN LOGO KOP SURAT (KIRI & KANAN) */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                    Kop Surat Logo (Kiri & Kanan)
                  </span>
                  <span className="text-[9px] text-emerald-700 font-semibold bg-emerald-100/80 px-1.5 py-0.5 rounded">
                    Bisa Di-Upload
                  </span>
                </div>

                {/* 1. LOGO KIRI (KOTA PALU / SEKOLAH / UPLOAD CUSTOM) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Logo Kiri
                    </label>
                    {customLogoKiri && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomLogoKiri(null);
                          setLogoChoice('palu');
                          if (fileInputKiriRef.current) fileInputKiriRef.current.value = '';
                        }}
                        className="text-[9px] text-rose-600 hover:text-rose-700 font-medium flex items-center gap-0.5 cursor-pointer"
                        title="Hapus upload dan kembalikan ke default"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        Reset Kiri
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 shrink-0 rounded-lg border border-slate-300 bg-white p-1 flex items-center justify-center shadow-xs overflow-hidden">
                      <img
                        src={activeLogoUrl}
                        alt="Logo Kiri"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <select
                        value={logoChoice}
                        onChange={(e) => setLogoChoice(e.target.value as 'palu' | 'sekolah' | 'custom')}
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 focus:border-sky-500 outline-none bg-white font-medium text-slate-800 cursor-pointer"
                      >
                        <option value="palu">Lambang Kota Palu (Resmi)</option>
                        <option value="sekolah">Logo SMP Negeri 11 Palu</option>
                        {customLogoKiri && <option value="custom">Logo Kustom Ter-upload</option>}
                      </select>
                      <div>
                        <input
                          ref={fileInputKiriRef}
                          type="file"
                          accept="image/*"
                          onChange={handleUploadLogoKiri}
                          className="hidden"
                          id="upload-logo-kiri-input"
                        />
                        <label
                          htmlFor="upload-logo-kiri-input"
                          className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md border border-sky-200 cursor-pointer transition-colors"
                        >
                          <Upload className="w-3 h-3 text-sky-600" />
                          <span>{customLogoKiri ? 'Ganti File Logo Kiri' : 'Upload Logo Kiri...'}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. LOGO KANAN (TUT WURI / UPLOAD CUSTOM) */}
                <div className="pt-2 border-t border-slate-200/80">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Logo Kanan
                    </label>
                    {customLogoKanan && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomLogoKanan(null);
                          setLogoKananChoice('tutwuri');
                          if (fileInputKananRef.current) fileInputKananRef.current.value = '';
                        }}
                        className="text-[9px] text-rose-600 hover:text-rose-700 font-medium flex items-center gap-0.5 cursor-pointer"
                        title="Hapus upload dan kembalikan ke lambang resmi Tut Wuri Handayani"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        Reset Kanan
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 shrink-0 rounded-lg border border-slate-300 bg-white p-1 flex items-center justify-center shadow-xs overflow-hidden">
                      {isCustomLogoKanan && activeLogoKananUrl ? (
                        <img
                          src={activeLogoKananUrl}
                          alt="Logo Kanan"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <svg className="w-8 h-8 text-black" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="50" cy="50" r="46" stroke="#000000" strokeWidth="2.5" />
                          <circle cx="50" cy="50" r="41" stroke="#000000" strokeWidth="1" strokeDasharray="3 2" />
                          <path d="M50 20 L53 32 L47 32 Z" fill="#000000" />
                          <circle cx="50" cy="22" r="3.5" fill="#000000" />
                          <path d="M42 34 L58 34 L56 50 L44 50 Z" stroke="#000000" strokeWidth="1.5" fill="none" />
                          <path d="M42 36 C32 36 22 42 18 52 C26 50 34 50 42 46 Z" fill="#000000" />
                          <path d="M58 36 C68 36 78 42 82 52 C74 50 66 50 58 46 Z" fill="#000000" />
                          <path d="M25 64 Q50 58 50 72 Q50 58 75 64 L72 74 Q50 68 50 78 Q50 68 28 74 Z" fill="#000000" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <select
                        value={logoKananChoice}
                        onChange={(e) => setLogoKananChoice(e.target.value as 'tutwuri' | 'custom')}
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 focus:border-sky-500 outline-none bg-white font-medium text-slate-800 cursor-pointer"
                      >
                        <option value="tutwuri">Lambang Tut Wuri Handayani</option>
                        {customLogoKanan && <option value="custom">Logo Kustom Ter-upload</option>}
                      </select>
                      <div>
                        <input
                          ref={fileInputKananRef}
                          type="file"
                          accept="image/*"
                          onChange={handleUploadLogoKanan}
                          className="hidden"
                          id="upload-logo-kanan-input"
                        />
                        <label
                          htmlFor="upload-logo-kanan-input"
                          className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md border border-sky-200 cursor-pointer transition-colors"
                        >
                          <Upload className="w-3 h-3 text-sky-600" />
                          <span>{customLogoKanan ? 'Ganti File Logo Kanan' : 'Upload Logo Kanan...'}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nomor Surat (TETAP / TIDAK BERUBAH JIKA SUDAH DIISI) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Nomor Surat <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const randomSeq = Math.floor(100 + Math.random() * 900);
                      setNomorSurat(`421.2 / ${randomSeq} / SMPN.11 / ${currentYear}`);
                      hasUserEditedNomorSuratRef.current = true;
                    }}
                    className="text-[9px] text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-0.5 cursor-pointer"
                    title="Buat nomor acak baru"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    Reset No.
                  </button>
                </div>
                <input
                  type="text"
                  value={nomorSurat}
                  onChange={(e) => {
                    setNomorSurat(e.target.value);
                    hasUserEditedNomorSuratRef.current = true;
                  }}
                  placeholder="Contoh: 421.2 / 123 / SMPN.11 / 2026"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none font-mono font-medium text-slate-800"
                />
                <p className="text-[10px] text-emerald-700 font-medium mt-1">
                  ✓ Nomor surat tersimpan terkunci & tidak akan berubah-ubah otomatis saat form diedit.
                </p>
              </div>

              {/* Sekolah Tujuan */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Pindah ke Sekolah Tujuan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={sekolahTujuan}
                  onChange={(e) => setSekolahTujuan(e.target.value)}
                  placeholder="Contoh: SMP Negeri 1 Jakarta / SMP IT Insan Cendekia"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none font-semibold text-sky-950 placeholder:font-normal"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Jika dikosongkan, akan tampil garis titik-titik (....................).
                </p>
              </div>

              {/* Kabupaten / Kota Sekolah Tujuan */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Kabupaten/Kota Sekolah Tujuan (Opsional)
                </label>
                <input
                  type="text"
                  value={kabKotaTujuan}
                  onChange={(e) => setKabKotaTujuan(e.target.value)}
                  placeholder="Contoh: Kota Palu / Kab. Donggala"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-slate-800"
                />
              </div>

              {/* Kelas / Tingkat di Sekolah Tujuan */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tingkat / Kelas di Sekolah Tujuan
                </label>
                <input
                  type="text"
                  value={kelasTujuan}
                  onChange={(e) => setKelasTujuan(e.target.value)}
                  placeholder="Contoh: VII (Tujuh) / VIII / IX"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-slate-800"
                />
              </div>

              {/* Alasan Kepindahan */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Alasan Kepindahan
                </label>
                <input
                  type="text"
                  value={alasanPindah}
                  onChange={(e) => setAlasanPindah(e.target.value)}
                  placeholder="Ketik alasan kepindahan..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-slate-800"
                />
                {/* Fast reason pills */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {commonReasons.map((r, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAlasanPindah(r)}
                      className="text-[9px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-700 border border-slate-200 transition-colors cursor-pointer"
                    >
                      {r.split('/')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Catatan Kelengkapan */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Catatan Kelengkapan
                </label>
                <textarea
                  rows={2}
                  value={catatanKelengkapan}
                  onChange={(e) => setCatatanKelengkapan(e.target.value)}
                  placeholder="Ketik catatan kelengkapan dokumen..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-slate-800 resize-none"
                />
              </div>

              {/* Tanggal Surat & Tanggal Permohonan */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">
                    Tanggal Surat
                  </label>
                  <input
                    type="text"
                    value={tanggalSurat}
                    onChange={(e) => setTanggalSurat(e.target.value)}
                    placeholder="Contoh: 12 Oktober 2026"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">
                    Tgl Permohonan Ortu
                  </label>
                  <input
                    type="text"
                    value={tanggalPermohonan}
                    onChange={(e) => setTanggalPermohonan(e.target.value)}
                    placeholder="Contoh: 10 Oktober 2026"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-sky-500 outline-none"
                  />
                </div>
              </div>

              {/* Data Orang Tua / Siswa (Poin 6, 7, 8 - BISA DIISI MANUAL) */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800">
                    6, 7, 8. Isian Manual Data Ortu / Siswa
                  </span>
                  <span className="text-[9px] text-slate-400">Bisa diketik bebas</span>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">
                    6. Nama Orang Tua / Wali
                  </label>
                  <input
                    type="text"
                    value={namaOrangTua}
                    onChange={(e) => setNamaOrangTua(e.target.value)}
                    placeholder="Ketik Nama Orang Tua / Wali..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">
                    7. Pekerjaan Orang Tua
                  </label>
                  <input
                    type="text"
                    value={pekerjaanOrangTua}
                    onChange={(e) => setPekerjaanOrangTua(e.target.value)}
                    placeholder="Ketik Pekerjaan Orang Tua..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">
                    8. Alamat Orang Tua / Siswa
                  </label>
                  <textarea
                    rows={2}
                    value={alamatOrangTua}
                    onChange={(e) => setAlamatOrangTua(e.target.value)}
                    placeholder="Ketik Alamat Lengkap Orang Tua / Siswa..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-sky-500 outline-none resize-none"
                  />
                </div>
              </div>

              {/* Kepala Sekolah */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">
                    Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    value={kepalaSekolah}
                    onChange={(e) => setKepalaSekolah(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">
                    NIP Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    value={nipKepalaSekolah}
                    onChange={(e) => setNipKepalaSekolah(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-sky-500 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Optional Mutasi Status trigger */}
              {onMarkMutasi && (
                <div className="pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Pindahkan status siswa "${namaSiswa}" ke data Siswa Mutasi/Keluar?`)) {
                        onMarkMutasi(student.id, 'Mutasi');
                        onClose();
                      }
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Set Status Siswa Menjadi Mutasi</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* RIGHT PANEL: LIVE A4 PRINTABLE DOCUMENT VIEW */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 flex justify-center bg-slate-200/60 print:bg-white print:p-0 print:m-0 print:overflow-visible print:block">
            <div 
              id="printable-surat-pindah-content"
              className="bg-white w-full max-w-[210mm] shadow-xl border border-slate-300 p-8 sm:p-12 text-slate-900 rounded-none print:shadow-none print:border-none print:p-0 print:m-0 print:w-full"
              style={{ 
                minHeight: '297mm',
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: '12pt',
                lineHeight: '1.45',
                color: '#000000'
              }}
            >
              {/* ========================================================= */}
              {/* KOP SURAT RESMI SEKOLAH (SESUAI GAMBAR DOKUMEN RESMI KEDUA) */}
              {/* ========================================================= */}
              <div className="flex items-center justify-between gap-4 pb-2 border-b-4 border-double border-black mb-5">
                {/* Logo Dinas / Pemerintah Kota Palu di Kiri */}
                <div className="w-20 h-20 shrink-0 flex items-center justify-center p-1">
                  <img
                    src={activeLogoUrl}
                    alt={logoChoice === 'sekolah' ? "Logo SMP Negeri 11 Palu" : "Lambang Pemerintah Kota Palu"}
                    className="w-20 h-20 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = logoChoice === 'sekolah' ? '/logo_smpn11palu.jpg' : '/logo_kota_palu.png';
                    }}
                  />
                </div>

                {/* Teks Kop Resmi */}
                <div className="text-center flex-1 space-y-0.5">
                  <div className="text-[12pt] font-bold uppercase tracking-wider text-black">
                    PEMERINTAH KOTA PALU
                  </div>
                  <h1 className="text-[16pt] font-black uppercase tracking-tight text-black leading-tight">
                    {namaSekolah}
                  </h1>
                  <div className="text-[9pt] text-black">
                    {alamatSekolah}
                  </div>
                  <div className="text-[8.5pt] text-black">
                    NPSN: {npsnSekolah} &bull; Email: {schoolProfile?.email || 'smpnegeri11palu@gmail.com'} &bull; Akreditasi: {schoolProfile?.akreditasi || 'A'}
                  </div>
                </div>

                {/* Lambang Tut Wuri Handayani Resmi atau Logo Kustom di Kanan */}
                <div className="w-20 h-20 shrink-0 flex items-center justify-center p-1">
                  {isCustomLogoKanan && activeLogoKananUrl ? (
                    <img
                      src={activeLogoKananUrl}
                      alt="Logo Kanan Kop"
                      className="w-20 h-20 object-contain"
                    />
                  ) : (
                    <svg className="w-16 h-16 text-black" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="50" cy="50" r="46" stroke="#000000" strokeWidth="2.5" />
                      <circle cx="50" cy="50" r="41" stroke="#000000" strokeWidth="1" strokeDasharray="3 2" />
                      {/* Sayap & Obor Tut Wuri Handayani */}
                      <path d="M50 20 L53 32 L47 32 Z" fill="#000000" />
                      <circle cx="50" cy="22" r="3.5" fill="#000000" />
                      <path d="M42 34 L58 34 L56 50 L44 50 Z" stroke="#000000" strokeWidth="1.5" fill="none" />
                      {/* Sayap Kiri & Kanan */}
                      <path d="M42 36 C32 36 22 42 18 52 C26 50 34 50 42 46 Z" fill="#000000" />
                      <path d="M58 36 C68 36 78 42 82 52 C74 50 66 50 58 46 Z" fill="#000000" />
                      {/* Buku Terbuka */}
                      <path d="M25 64 Q50 58 50 72 Q50 58 75 64 L72 74 Q50 68 50 78 Q50 68 28 74 Z" fill="#000000" />
                      {/* Teks Melingkar */}
                      <text x="50" y="86" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="#000000" fontFamily="sans-serif">TUT WURI HANDAYANI</text>
                    </svg>
                  )}
                </div>
              </div>

              {/* ========================================================= */}
              {/* JUDUL DAN NOMOR SURAT (EDITABLE INLINE & TETAP JIKA SUDAH DIISI) */}
              {/* ========================================================= */}
              <div className="text-center my-4">
                <h2 className="text-[14pt] font-bold underline uppercase tracking-wide text-black">
                  SURAT KETERANGAN PINDAH SEKOLAH
                </h2>
                <div className="text-[11pt] font-semibold text-black mt-1 flex items-center justify-center gap-1">
                  <span>Nomor: </span>
                  {isGeneratingDocument ? (
                    <span className="font-mono font-semibold">{nomorSurat || '421.2 / ......................... / SMPN.11 / 2026'}</span>
                  ) : (
                    <input
                      type="text"
                      value={nomorSurat}
                      onChange={(e) => {
                        setNomorSurat(e.target.value);
                        hasUserEditedNomorSuratRef.current = true;
                      }}
                      placeholder="421.2 / ......................... / SMPN.11 / 2026"
                      className="font-mono font-semibold text-center border-b border-dotted border-black px-1 outline-none bg-transparent hover:bg-amber-50 focus:bg-amber-50 focus:border-solid transition-colors w-72 text-[11pt]"
                      title="Klik untuk mengedit nomor surat (tidak akan berubah jika sudah diisi)"
                    />
                  )}
                </div>
              </div>

              {/* ========================================================= */}
              {/* PEMBUKA */}
              {/* ========================================================= */}
              <div className="text-justify my-3 text-[11.5pt]">
                <p>
                  Yang bertanda tangan di bawah ini, Kepala {namaSekolah}, Kecamatan Tatanga, Kota Palu, Provinsi Sulawesi Tengah, dengan ini menerangkan bahwa:
                </p>
              </div>

              {/* ========================================================= */}
              {/* DATA SISWA (POIN 6, 7, 8 BISA DIKETIK / DIISI MANUAL SECARA LANGSUNG) */}
              {/* ========================================================= */}
              <div className="my-3 pl-3 pr-2 text-[11.5pt] space-y-1">
                <table className="w-full border-collapse">
                  <tbody>
                    <tr>
                      <td className="w-52 py-0.5 align-top">1. Nama Peserta Didik</td>
                      <td className="w-4 py-0.5 align-top">:</td>
                      <td className="py-0.5 align-top font-bold">{toTitleCase(namaSiswa) || '............................................................'}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 align-top">2. NIS / NISN</td>
                      <td className="py-0.5 align-top">:</td>
                      <td className="py-0.5 align-top font-mono">{nis || '-'} / {nisn || '....................................'}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 align-top">3. Jenis Kelamin</td>
                      <td className="py-0.5 align-top">:</td>
                      <td className="py-0.5 align-top">{jenisKelamin}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 align-top">4. Tempat, Tanggal Lahir</td>
                      <td className="py-0.5 align-top">:</td>
                      <td className="py-0.5 align-top">{toTitleCase(tempatTanggalLahir)}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 align-top">5. Tingkat / Kelas Asal</td>
                      <td className="py-0.5 align-top">:</td>
                      <td className="py-0.5 align-top">{kelasAsal}</td>
                    </tr>

                    {/* 6. Nama Orang Tua / Wali - BISA DIISI MANUAL */}
                    <tr>
                      <td className="py-1 align-top">6. Nama Orang Tua / Wali</td>
                      <td className="py-1 align-top">:</td>
                      <td className="py-1 align-top">
                        {isGeneratingDocument ? (
                          <span>
                            {toTitleCase(namaOrangTua) || '............................................................'}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={namaOrangTua}
                            onChange={(e) => setNamaOrangTua(e.target.value)}
                            placeholder="............................................................"
                            className="w-full border-b border-dotted border-black px-1 outline-none bg-transparent hover:bg-amber-50 focus:bg-amber-50 focus:border-solid transition-colors text-[11.5pt]"
                            title="Klik untuk mengetik / mengedit Nama Orang Tua atau Wali"
                          />
                        )}
                      </td>
                    </tr>

                    {/* 7. Pekerjaan Orang Tua - BISA DIISI MANUAL */}
                    <tr>
                      <td className="py-1 align-top">7. Pekerjaan Orang Tua</td>
                      <td className="py-1 align-top">:</td>
                      <td className="py-1 align-top">
                        {isGeneratingDocument ? (
                          <span>
                            {pekerjaanOrangTua || '............................................................'}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={pekerjaanOrangTua}
                            onChange={(e) => setPekerjaanOrangTua(e.target.value)}
                            placeholder="............................................................"
                            className="w-full border-b border-dotted border-black px-1 outline-none bg-transparent hover:bg-amber-50 focus:bg-amber-50 focus:border-solid transition-colors text-[11.5pt]"
                            title="Klik untuk mengetik / mengedit Pekerjaan Orang Tua"
                          />
                        )}
                      </td>
                    </tr>

                    {/* 8. Alamat Orang Tua / Siswa - BISA DIISI MANUAL */}
                    <tr>
                      <td className="py-1 align-top">8. Alamat Orang Tua / Siswa</td>
                      <td className="py-1 align-top">:</td>
                      <td className="py-1 align-top">
                        {isGeneratingDocument ? (
                          <span>
                            {alamatOrangTua || '..........................................................................................'}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={alamatOrangTua}
                            onChange={(e) => setAlamatOrangTua(e.target.value)}
                            placeholder=".........................................................................................."
                            className="w-full border-b border-dotted border-black px-1 outline-none bg-transparent hover:bg-amber-50 focus:bg-amber-50 focus:border-solid transition-colors text-[11.5pt]"
                            title="Klik untuk mengetik / mengedit Alamat Orang Tua / Siswa"
                          />
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ========================================================= */}
              {/* KETERANGAN KEPINDAHAN / SEKOLAH TUJUAN */}
              {/* ========================================================= */}
              <div className="text-justify my-3 text-[11.5pt]">
                <p>
                  Sesuai dengan surat permohonan pindah sekolah dari Orang Tua / Wali Siswa tertanggal <strong>{tanggalPermohonan || '....................................'}</strong>, peserta didik tersebut di atas terhitung mulai tanggal <strong>{tanggalEfektif || tanggalSurat || '....................................'}</strong> dinyatakan pindah sekolah ke:
                </p>
              </div>

              <div className="my-2 pl-3 pr-2 text-[11.5pt] space-y-1">
                <table className="w-full border-collapse">
                  <tbody>
                    <tr>
                      <td className="w-52 py-1 align-top">Sekolah Tujuan</td>
                      <td className="w-4 py-1 align-top">:</td>
                      <td className="py-1 align-top">
                        {isGeneratingDocument ? (
                          <span className="text-[12pt] underline">
                            {sekolahTujuan ? (
                              <span>{toTitleCase(sekolahTujuan)} {kabKotaTujuan ? `(${kabKotaTujuan})` : ''}</span>
                            ) : (
                              '..........................................................................................'
                            )}
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5 w-full">
                            <input
                              type="text"
                              value={sekolahTujuan}
                              onChange={(e) => setSekolahTujuan(e.target.value)}
                              placeholder="Ketik Nama Sekolah Tujuan / ............................................................"
                              className="w-full underline text-[12pt] border-b border-dotted border-black px-1 outline-none bg-transparent hover:bg-amber-50 focus:bg-amber-50 focus:border-solid transition-colors placeholder:font-normal placeholder:no-underline placeholder:text-slate-400"
                              title="Ketik nama sekolah tujuan di sini"
                            />
                            {kabKotaTujuan && (
                              <span className="text-xs text-slate-600 shrink-0">({kabKotaTujuan})</span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 align-top">Diterima di Kelas</td>
                      <td className="py-1 align-top">:</td>
                      <td className="py-1 align-top">
                        {isGeneratingDocument ? (
                          <span>{kelasTujuan || '............................................................'}</span>
                        ) : (
                          <input
                            type="text"
                            value={kelasTujuan}
                            onChange={(e) => setKelasTujuan(e.target.value)}
                            placeholder="............................................................"
                            className="w-full border-b border-dotted border-black px-1 outline-none bg-transparent hover:bg-amber-50 focus:bg-amber-50 focus:border-solid transition-colors text-[11.5pt]"
                          />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 align-top">Alasan Kepindahan</td>
                      <td className="py-1 align-top">:</td>
                      <td className="py-1 align-top">
                        {isGeneratingDocument ? (
                          <span>{alasanPindah || '..........................................................................................'}</span>
                        ) : (
                          <input
                            type="text"
                            value={alasanPindah}
                            onChange={(e) => setAlasanPindah(e.target.value)}
                            placeholder=".........................................................................................."
                            className="w-full border-b border-dotted border-black px-1 outline-none bg-transparent hover:bg-amber-50 focus:bg-amber-50 focus:border-solid transition-colors text-[11.5pt]"
                          />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 align-top">Catatan Kelengkapan</td>
                      <td className="py-1 align-top">:</td>
                      <td className="py-1 align-top text-[10.5pt]">
                        {isGeneratingDocument ? (
                          <span className="italic">{catatanKelengkapan || '..........................................................................................'}</span>
                        ) : (
                          <textarea
                            rows={2}
                            value={catatanKelengkapan}
                            onChange={(e) => setCatatanKelengkapan(e.target.value)}
                            placeholder="Buku Laporan Hasil Belajar (Raport) dan Surat Keterangan Kelakuan Baik telah diserahkan..."
                            className="w-full italic border-b border-dotted border-black px-1 outline-none bg-transparent hover:bg-amber-50 focus:bg-amber-50 focus:border-solid transition-colors text-[10.5pt] resize-none"
                            title="Klik untuk mengedit catatan kelengkapan"
                          />
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ========================================================= */}
              {/* PENUTUP */}
              {/* ========================================================= */}
              <div className="text-justify my-4 text-[11.5pt]">
                <p>
                  Demikian Surat Keterangan Pindah Sekolah ini dibuat dengan sebenarnya atas permintaan orang tua / wali siswa yang bersangkutan untuk dapat dipergunakan sebagaimana mestinya.
                </p>
              </div>

              {/* ========================================================= */}
              {/* TANDA TANGAN (FORMAT RESMI 2 KOLOM) */}
              {/* ========================================================= */}
              <div className="mt-8 pt-2 grid grid-cols-2 gap-6 text-[11pt]">
                {/* Kolom Kiri: Orang Tua / Wali */}
                <div className="text-center">
                  <p className="invisible">Tempat, Tanggal</p>
                  <p>Mengetahui / Mengajukan,</p>
                  <p>Orang Tua / Wali Siswa,</p>
                  <div className="h-20 flex items-end justify-center">
                    {/* Ruang tanda tangan */}
                  </div>
                  <p className="font-bold underline">
                    ( {toTitleCase(namaOrangTua) || '................................................'} )
                  </p>
                </div>

                {/* Kolom Kanan: Kepala Sekolah */}
                <div className="text-center">
                  <p>{kotaSurat}, {tanggalSurat}</p>
                  <p className="font-semibold">Kepala Sekolah,</p>
                  <p>{namaSekolah}</p>
                  <div className="h-20 flex items-end justify-center">
                    {/* Ruang stempel & tanda tangan */}
                  </div>
                  <p className="font-bold underline">
                    {toTitleCase(kepalaSekolah)}
                  </p>
                  <p className="text-[10pt]">
                    NIP. {nipKepalaSekolah || '................................................'}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BOTTOM FOOTER INFO */}
        {/* ========================================================= */}
        <div className="no-print px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>Nomor surat tidak akan berubah jika sudah diisi. Poin 6 (Nama Orang Tua), 7 (Pekerjaan), 8 (Alamat) dan sekolah tujuan bisa diedit di form maupun langsung di dokumen.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading || isPrinting}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Memproses PDF...' : 'Download PDF'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting || isDownloading}
              className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isPrinting ? 'Mencetak...' : 'Cetak Dokumen'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
