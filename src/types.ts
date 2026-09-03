export interface Student {
  id: string;
  nisn: string;
  nik: string;
  nama: string;
  jenisKelamin: 'L' | 'P';
  tempatLahir: string;
  tanggalLahir: string;
  rombel: string;
  namaIbu: string;
  alamat: string;
  status: 'Aktif' | 'Lulus' | 'Mutasi' | 'Keluar';
  agama: string;
  
  // Extended Dapodik Columns
  nis?: string;
  rt?: string;
  rw?: string;
  dusun?: string;
  kelurahan?: string;
  kecamatan?: string;
  kodePos?: string;
  jenisTinggal?: string;
  alatTransportasi?: string;
  telepon?: string;
  hp?: string;
  email?: string;
  skhun?: string;
  penerimaKps?: string;
  noKps?: string;
  
  // Ayah
  namaAyah?: string;
  tahunLahirAyah?: string;
  jenjangPendidikanAyah?: string;
  pekerjaanAyah?: string;
  penghasilanAyah?: string;
  nikAyah?: string;
  
  // Ibu
  tahunLahirIbu?: string;
  jenjangPendidikanIbu?: string;
  pekerjaanIbu?: string;
  penghasilanIbu?: string;
  nikIbu?: string;
  
  // Wali
  namaWali?: string;
  tahunLahirWali?: string;
  jenjangPendidikanWali?: string;
  pekerjaanWali?: string;
  penghasilanWali?: string;
  nikWali?: string;
  
  // Akademik & Registrasi
  rombelSaatIni?: string;
  noPesertaUn?: string;
  noSeriIjazah?: string;
  penerimaKip?: string;
  nomorKip?: string;
  namaDiKip?: string;
  nomorKks?: string;
  noRegistrasiAktaLahir?: string;
  bank?: string;
  nomorRekeningBank?: string;
  rekeningAtasNama?: string;
  layakPip?: string;
  alasanLayakPip?: string;
  kebutuhanKhusus?: string;
  sekolahAsal?: string;
  anakKeBerapa?: string;
  lintang?: string;
  bujur?: string;
  noKk?: string;
  beratBadan?: string;
  tinggiBadan?: string;
  lingkarKepala?: string;
  jmlSaudaraKandung?: string;
  jarakRumahKeSekolah?: string;
  alasanKeluar?: string;
  tahunLulus?: string;
}

export interface TeacherStaff {
  id: string;
  nuptk: string;
  nip?: string;
  nama: string;
  jenisKelamin: 'L' | 'P';
  statusKepegawaian: 'PNS' | 'PPPK' | 'GTT' | 'GTY' | 'Honor Sekolah' | string;
  jenisPtk: 'Guru Mapel' | 'Guru Kelas' | 'Kepala Sekolah' | 'Tenaga Administrasi' | 'Laboran' | 'Pustakawan' | string;
  mapel: string;
  pendidikanTerakhir: string;
  noHp: string;
  email: string;
  statusSertifikasi: 'Sudah' | 'Belum' | string;

  // Extended Dapodik PTK Fields (51 Columns)
  tempatLahir?: string;
  tanggalLahir?: string;
  agama?: string;
  alamatJalan?: string;
  rt?: string;
  rw?: string;
  namaDusun?: string;
  desaKelurahan?: string;
  kecamatan?: string;
  kodePos?: string;
  telepon?: string;
  tugasTambahan?: string;
  skCpns?: string;
  tanggalCpns?: string;
  skPengangkatan?: string;
  tmtPengangkatan?: string;
  lembagaPengangkatan?: string;
  pangkatGolongan?: string;
  sumberGaji?: string;
  namaIbuKandung?: string;
  statusPerkawinan?: string;
  namaSuamiIstri?: string;
  nipSuamiIstri?: string;
  pekerjaanSuamiIstri?: string;
  tmtPns?: string;
  sudahLisensiKepalaSekolah?: string;
  pernahDiklatKepengawasan?: string;
  keahlianBraille?: string;
  keahlianBahasaIsyarat?: string;
  npwp?: string;
  namaWajibPajak?: string;
  kewarganegaraan?: string;
  bank?: string;
  nomorRekeningBank?: string;
  rekeningAtasNama?: string;
  nik?: string;
  noKk?: string;
  karpeg?: string;
  karisKarsu?: string;
  lintang?: string;
  bujur?: string;
  nuks?: string;
  sertifikasi?: string;
}

export interface SarprasItem {
  id: string;
  kodeBarang: string;
  namaBarang: string;
  kategori: 'Ruang Teori/Kelas' | 'Ruang Laboratorium' | 'Ruang Pimpinan' | 'Perpustakaan' | 'Peralatan Elektronik' | 'Perabot';
  kondisi: 'Baik' | 'Rusak Ringan' | 'Rusak Sedang' | 'Rusak Berat';
  jumlah: number;
  satuan: string;
  letakRuang: string;
  tahunPengadaan: string;
  layakPakai: boolean;
}

export interface SubjectScore {
  mapel: string;
  nilaiPengetahuan: number;
  nilaiKeterampilan: number;
  predikat: 'A' | 'B' | 'C' | 'D';
  catatan: string;
}

export interface StudentReport {
  id: string;
  studentId: string;
  nisn: string;
  studentName: string;
  rombel: string;
  semester: 'Ganjil' | 'Genap';
  tahunAjaran: string;
  scores: SubjectScore[];
  kehadiran: {
    sakit: number;
    izin: number;
    alpa: number;
  };
  catatanWaliKelas: string;
  statusKenaikan: 'Naik Kelas' | 'Tinggal Kelas' | 'Lulus' | 'Dalam Proses';
}

export interface AppDisplayConfig {
  appName: string;
  appVersion: string;
  appSubtitle: string;
  logoCustomUrl?: string;
  welcomeGreeting: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  welcomeIconType?: 'school' | 'landmark' | 'graduation' | 'award' | 'book' | 'star' | 'shield' | 'custom';
  welcomeCustomIconUrl?: string;
  curriculumBadge: string;
  curriculumBadgeIcon?: 'check' | 'sparkles' | 'award' | 'shield';
  footerVersionText: string;
  operatorTitle?: string;
  operatorName?: string;
  operatorAvatarUrl?: string;
}

export interface SchoolProfile {
  npsn: string;
  namaSekolah: string;
  bentukPendidikan: string;
  statusSekolah: string;
  logoSekolah?: string;
  alamat: string;
  rtRwDusun?: string;
  desaKelurahan: string;
  kecamatan: string;
  kabupatenKota: string;
  provinsi: string;
  kepalaSekolah: string;
  nipKepalaSekolah: string;
  pangkatGolongan?: string;
  tmtMenjabat?: string;
  fotoKepalaSekolah?: string;
  akreditasi: string;
  kurikulum: string;
  kodePos?: string;
  telepon?: string;
  email?: string;
  website?: string;
  skPendirian?: string;
  tanggalSkPendirian?: string;
  skIzinOperasional?: string;
  tanggalSkIzinOperasional?: string;
  statusKepemilikan?: string;
  namaYayasan?: string;
  operatorSekolah?: string;
  bendaharaBos?: string;
  komiteSekolah?: string;
  luasTanah?: string;
  luasBangunan?: string;
  dayaListrik?: string;
  aksesInternet?: string;
  dayaTampung?: string;
  jumlahRombel?: string;
  keterangan?: string;
  visi?: string;
  misi?: string[];
}

export interface SyncConfig {
  spreadsheetUrl: string;
  webAppUrl: string;
  sheetId: string;
  autoSync: boolean;
  lastSynced: string | null;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  mode: 'appscript' | 'csv_preview' | 'local_storage';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
}

export interface AdminUser {
  id: string;
  username: string;
  password: string;
  nama: string;
  role: 'Administrator' | 'Operator' | 'Kepala Sekolah' | 'Guru';
  email: string;
  noHp?: string;
  status: 'Aktif' | 'Nonaktif';
  lastLogin?: string;
}

export type ActiveTab = 'home' | 'sekolah' | 'siswa' | 'ptk' | 'sarpras' | 'rapor' | 'laporan' | 'aplikasi' | 'pengaturan' | 'sheets';
