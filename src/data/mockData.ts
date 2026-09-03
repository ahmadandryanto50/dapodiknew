import { Student, TeacherStaff, SarprasItem, StudentReport, NotificationItem, AdminUser } from '../types';

export const initialStudents: Student[] = [
  {
    id: 'std-001',
    nisn: '0089123456',
    nik: '3201123456780001',
    nama: 'Ahmad Fauzi Pratama',
    jenisKelamin: 'L',
    tempatLahir: 'Jakarta',
    tanggalLahir: '2010-05-14',
    rombel: 'VIII. Moh Hatta',
    namaIbu: 'Siti Aminah',
    alamat: 'Jl. Merdeka No. 45, RT 02/05',
    status: 'Aktif',
    agama: 'Islam'
  },
  {
    id: 'std-002',
    nisn: '0098765432',
    nik: '3201123456780002',
    nama: 'Dewi Ayu Lestari',
    jenisKelamin: 'P',
    tempatLahir: 'Bandung',
    tanggalLahir: '2010-09-21',
    rombel: 'VIII. Moh Hatta',
    namaIbu: 'Nurhasanah',
    alamat: 'Jl. Melati Indah No. 12',
    status: 'Aktif',
    agama: 'Islam'
  },
  {
    id: 'std-003',
    nisn: '0081239871',
    nik: '3201123456780003',
    nama: 'Budi Santoso',
    jenisKelamin: 'L',
    tempatLahir: 'Surabaya',
    tanggalLahir: '2009-11-03',
    rombel: 'IX. Moh Hatta',
    namaIbu: 'Endang Rahayu',
    alamat: 'Komplek Griya Asri Blok C-4',
    status: 'Aktif',
    agama: 'Kristen'
  },
  {
    id: 'std-004',
    nisn: '0092348765',
    nik: '3201123456780004',
    nama: 'Citra Kirana',
    jenisKelamin: 'P',
    tempatLahir: 'Yogyakarta',
    tanggalLahir: '2011-01-18',
    rombel: 'VII. Soekarno',
    namaIbu: 'Sri Wahyuni',
    alamat: 'Jl. Mawar No. 8',
    status: 'Aktif',
    agama: 'Islam'
  },
  {
    id: 'std-005',
    nisn: '0087654321',
    nik: '3201123456780005',
    nama: 'Kevin Sanjaya',
    jenisKelamin: 'L',
    tempatLahir: 'Semarang',
    tanggalLahir: '2010-07-29',
    rombel: 'VIII. Soekarno',
    namaIbu: 'Maria Susanti',
    alamat: 'Jl. Kenanga Baru No. 19',
    status: 'Aktif',
    agama: 'Katolik'
  },
  {
    id: 'std-006',
    nisn: '0093456781',
    nik: '3201123456780006',
    nama: 'Nadia Putri Maharani',
    jenisKelamin: 'P',
    tempatLahir: 'Malang',
    tanggalLahir: '2011-04-10',
    rombel: 'VII. Hatta',
    namaIbu: 'Ratna Sari',
    alamat: 'Jl. Cempaka No. 22',
    status: 'Aktif',
    agama: 'Islam'
  },
  {
    id: 'std-007',
    nisn: '0071239811',
    nik: '3201123456780099',
    nama: 'Rian Hidayat, S.T.',
    jenisKelamin: 'L',
    tempatLahir: 'Jakarta',
    tanggalLahir: '2006-03-12',
    rombel: 'IX. Moh Hatta',
    namaIbu: 'Siti Maryam',
    namaAyah: 'H. Agus Pratama',
    alamat: 'Jl. Merdeka Barat No. 12',
    status: 'Lulus',
    alasanKeluar: 'Lulus',
    tahunLulus: '2023/2024',
    noSeriIjazah: 'DN-02/D-SMP/24/008129',
    agama: 'Islam',
    nis: '21001',
    skhun: 'SKHUN-2024-001',
    sekolahAsal: 'SMP NEGERI 11 PALU'
  },
  {
    id: 'std-008',
    nisn: '0078901234',
    nik: '3201123456780100',
    nama: 'Anisa Rahmawati',
    jenisKelamin: 'P',
    tempatLahir: 'Bandung',
    tanggalLahir: '2006-07-25',
    rombel: 'IX. Soekarno',
    namaIbu: 'Hj. Nuraini',
    namaAyah: 'Drs. Hendra Gunawan',
    alamat: 'Jl. Dago Asri No. 45',
    status: 'Lulus',
    alasanKeluar: 'Lulus',
    tahunLulus: '2023/2024',
    noSeriIjazah: 'DN-02/D-SMP/24/008130',
    agama: 'Islam',
    nis: '21002',
    skhun: 'SKHUN-2024-002',
    sekolahAsal: 'SMP NEGERI 11 PALU'
  }
];

export const initialTeachers: TeacherStaff[] = [
  {
    id: 'ptk-001',
    nuptk: '1234567890123456',
    nip: '197805122005011002',
    nama: 'Drs. Bambang Sudarsono, M.Pd.',
    jenisKelamin: 'L',
    statusKepegawaian: 'PNS',
    jenisPtk: 'Kepala Sekolah',
    mapel: 'Manajemen Pendidikan',
    pendidikanTerakhir: 'S2 Manajemen Pendidikan',
    noHp: '081234567890',
    email: 'bambang.sudarsono@sekolah.belajar.id',
    statusSertifikasi: 'Sudah'
  },
  {
    id: 'ptk-002',
    nuptk: '2345678901234567',
    nip: '198503152010012015',
    nama: 'Siti Rahmawati, S.Pd.',
    jenisKelamin: 'P',
    statusKepegawaian: 'PNS',
    jenisPtk: 'Guru Mapel',
    mapel: 'Matematika',
    pendidikanTerakhir: 'S1 Pendidikan Matematika',
    noHp: '081398765432',
    email: 'siti.rahmawati@sekolah.belajar.id',
    statusSertifikasi: 'Sudah'
  },
  {
    id: 'ptk-003',
    nuptk: '3456789012345678',
    nip: '199208202022211005',
    nama: 'Rian Hidayat, S.Kom.',
    jenisKelamin: 'L',
    statusKepegawaian: 'PPPK',
    jenisPtk: 'Guru Mapel',
    mapel: 'Informatika / TIK',
    pendidikanTerakhir: 'S1 Ilmu Komputer',
    noHp: '085712349988',
    email: 'rian.hidayat@sekolah.belajar.id',
    statusSertifikasi: 'Sudah'
  },
  {
    id: 'ptk-004',
    nuptk: '4567890123456789',
    nama: 'Nurul Hidayati, S.Pd.',
    jenisKelamin: 'P',
    statusKepegawaian: 'GTY',
    jenisPtk: 'Guru Mapel',
    mapel: 'Bahasa Indonesia',
    pendidikanTerakhir: 'S1 Pendidikan Bahasa Indonesia',
    noHp: '082145678901',
    email: 'nurul.hidayati@sekolah.belajar.id',
    statusSertifikasi: 'Belum'
  },
  {
    id: 'ptk-005',
    nuptk: '5678901234567890',
    nama: 'Agus Setiawan, A.Md.',
    jenisKelamin: 'L',
    statusKepegawaian: 'Honor Sekolah',
    jenisPtk: 'Tenaga Administrasi',
    mapel: 'Operator Dapodik / TU',
    pendidikanTerakhir: 'D3 Administrasi Perkantoran',
    noHp: '089612345678',
    email: 'agus.setiawan@sekolah.belajar.id',
    statusSertifikasi: 'Belum'
  }
];

export const initialSarpras: SarprasItem[] = [
  {
    id: 'srp-001',
    kodeBarang: 'RK-01',
    namaBarang: 'Ruang Kelas 7A',
    kategori: 'Ruang Teori/Kelas',
    kondisi: 'Baik',
    jumlah: 1,
    satuan: 'Ruangan',
    letakRuang: 'Gedung A Lantai 1',
    tahunPengadaan: '2020',
    layakPakai: true
  },
  {
    id: 'srp-002',
    kodeBarang: 'LAB-KOM',
    namaBarang: 'Laboratorium Komputer',
    kategori: 'Ruang Laboratorium',
    kondisi: 'Baik',
    jumlah: 36,
    satuan: 'Unit PC',
    letakRuang: 'Gedung B Lantai 2',
    tahunPengadaan: '2023',
    layakPakai: true
  },
  {
    id: 'srp-003',
    kodeBarang: 'PERPUS-01',
    namaBarang: 'Gedung Perpustakaan & Rak Buku',
    kategori: 'Perpustakaan',
    kondisi: 'Baik',
    jumlah: 1,
    satuan: 'Unit Ruang',
    letakRuang: 'Gedung C Lantai 1',
    tahunPengadaan: '2019',
    layakPakai: true
  },
  {
    id: 'srp-004',
    kodeBarang: 'PROJ-EPSON',
    namaBarang: 'Proyektor LCD Epson EB-X500',
    kategori: 'Peralatan Elektronik',
    kondisi: 'Rusak Ringan',
    jumlah: 4,
    satuan: 'Unit',
    letakRuang: 'Ruang Multimedia',
    tahunPengadaan: '2021',
    layakPakai: true
  },
  {
    id: 'srp-005',
    kodeBarang: 'MEJA-KURSI',
    namaBarang: 'Set Meja Kursi Siswa Kayu Jati',
    kategori: 'Perabot',
    kondisi: 'Baik',
    jumlah: 320,
    satuan: 'Set',
    letakRuang: 'Seluruh Ruang Kelas',
    tahunPengadaan: '2022',
    layakPakai: true
  }
];

export const initialReports: StudentReport[] = [
  {
    id: 'rep-001',
    studentId: 'std-001',
    nisn: '0089123456',
    studentName: 'Ahmad Fauzi Pratama',
    rombel: 'Kelas 8A',
    semester: 'Genap',
    tahunAjaran: '2025/2026',
    scores: [
      { mapel: 'Pendidikan Agama & Budi Pekerti', nilaiPengetahuan: 88, nilaiKeterampilan: 90, predikat: 'A', catatan: 'Sangat baik dalam pemahaman ibadah dan budi pekerti.' },
      { mapel: 'Pancasila & Kewarganegaraan', nilaiPengetahuan: 85, nilaiKeterampilan: 86, predikat: 'B', catatan: 'Mampu menjelaskan nilai-nilai konstitusi dengan runtut.' },
      { mapel: 'Bahasa Indonesia', nilaiPengetahuan: 91, nilaiKeterampilan: 92, predikat: 'A', catatan: 'Sangat terampil dalam menulis teks eksposisi dan ulasan.' },
      { mapel: 'Matematika', nilaiPengetahuan: 84, nilaiKeterampilan: 85, predikat: 'B', catatan: 'Baik dalam operasi aljabar dan geometri bidang.' },
      { mapel: 'Ilmu Pengetahuan Alam (IPA)', nilaiPengetahuan: 89, nilaiKeterampilan: 90, predikat: 'A', catatan: 'Aktif dan kritis dalam praktikum sains dan ekosistem.' },
      { mapel: 'Bahasa Inggris', nilaiPengetahuan: 87, nilaiKeterampilan: 88, predikat: 'B', catatan: 'Percaya diri dalam percakapan sehari-hari.' },
      { mapel: 'Informatika', nilaiPengetahuan: 95, nilaiKeterampilan: 96, predikat: 'A', catatan: 'Unggul dalam algoritma berpikir komputasional dan spreadsheet.' }
    ],
    kehadiran: { sakit: 1, izin: 2, alpa: 0 },
    catatanWaliKelas: 'Pertahankan prestasi akademik dan kepemimpinan di kelas.',
    statusKenaikan: 'Naik Kelas'
  },
  {
    id: 'rep-002',
    studentId: 'std-002',
    nisn: '0098765432',
    studentName: 'Dewi Ayu Lestari',
    rombel: 'Kelas 8A',
    semester: 'Genap',
    tahunAjaran: '2025/2026',
    scores: [
      { mapel: 'Pendidikan Agama & Budi Pekerti', nilaiPengetahuan: 92, nilaiKeterampilan: 94, predikat: 'A', catatan: 'Sangat tekun dan berbudi luhur.' },
      { mapel: 'Pancasila & Kewarganegaraan', nilaiPengetahuan: 88, nilaiKeterampilan: 89, predikat: 'A', catatan: 'Memahami hak dan kewajiban warga negara.' },
      { mapel: 'Bahasa Indonesia', nilaiPengetahuan: 90, nilaiKeterampilan: 92, predikat: 'A', catatan: 'Mampu menyusun pidato persuasif dengan baik.' },
      { mapel: 'Matematika', nilaiPengetahuan: 90, nilaiKeterampilan: 93, predikat: 'A', catatan: 'Sangat menguasai konsep statistika dan peluang.' },
      { mapel: 'Ilmu Pengetahuan Alam (IPA)', nilaiPengetahuan: 86, nilaiKeterampilan: 88, predikat: 'B', catatan: 'Baik dalam menganalisis hukum gerak dan energi.' },
      { mapel: 'Bahasa Inggris', nilaiPengetahuan: 94, nilaiKeterampilan: 95, predikat: 'A', catatan: 'Sangat fasih dalam membaca dan memahami teks bahasa Inggris.' },
      { mapel: 'Informatika', nilaiPengetahuan: 90, nilaiKeterampilan: 91, predikat: 'A', catatan: 'Kreatif dalam pengolahan data dan presentasi digital.' }
    ],
    kehadiran: { sakit: 0, izin: 1, alpa: 0 },
    catatanWaliKelas: 'Luar biasa, calon juara umum sekolah!',
    statusKenaikan: 'Naik Kelas'
  }
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Validasi Dapodik Berhasil',
    message: 'Data Pokok Pendidikan Semester Genap 2025/2026 telah tervalidasi 0 invalid.',
    time: '5 menit yang lalu',
    type: 'success',
    read: false
  },
  {
    id: 'notif-2',
    title: 'Integrasi Database Cloud Aktif',
    message: 'Sinkronisasi real-time siap digunakan. Data otomatis tercatat ke Database.',
    time: '30 menit yang lalu',
    type: 'info',
    read: false
  },
  {
    id: 'notif-3',
    title: 'Update Sarpras Ruang Lab',
    message: 'Penambahan 36 unit PC Lab Komputer telah diverifikasi.',
    time: '2 jam yang lalu',
    type: 'info',
    read: true
  }
];

export const initialAdministrators: AdminUser[] = [
  {
    id: 'adm-001',
    username: 'admin',
    password: 'alalal123',
    nama: 'Ahmad Andryanto (Administrator)',
    role: 'Administrator',
    email: 'ahmad.andryanto50@admin.smp.belajar.id',
    noHp: '081234567890',
    status: 'Aktif',
    lastLogin: '31/08/2026 22:30'
  },
  {
    id: 'adm-002',
    username: 'operator',
    password: 'operator123',
    nama: 'Operator Dapodik Sekolah',
    role: 'Operator',
    email: 'operator@smp.belajar.id',
    noHp: '081298765432',
    status: 'Aktif',
    lastLogin: '31/08/2026 21:15'
  },
  {
    id: 'adm-003',
    username: 'kepsek',
    password: 'kepsek123',
    nama: 'Drs. Bambang Sudarsono, M.Pd.',
    role: 'Kepala Sekolah',
    email: 'kepala.sekolah@smp.belajar.id',
    noHp: '081345678901',
    status: 'Aktif',
    lastLogin: '30/08/2026 14:20'
  }
];
