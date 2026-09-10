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
  // =========================================================================
  // I. TENAGA KEPENDIDIKAN (9 ORANG TERMASUK KEPALA SEKOLAH)
  // =========================================================================
  {
    id: 'ptk-001',
    nuptk: '1234567890123456',
    nip: '197805122005011002',
    nama: 'Drs. Bambang Sudarsono, M.Pd.',
    jenisKelamin: 'L',
    statusKepegawaian: 'PNS',
    jenisPtk: 'Kepala Sekolah',
    mapel: 'Manajemen Pendidikan & Kepemimpinan Sekolah',
    tugasTambahan: 'Kepala Sekolah',
    pendidikanTerakhir: 'S2 Manajemen Pendidikan',
    noHp: '081234567890',
    email: 'bambang.sudarsono@sekolah.belajar.id',
    statusSertifikasi: 'Sudah'
  },
  {
    id: 'ptk-002',
    nuptk: '5678901234567890',
    nip: '198204152009011008',
    nama: 'Agus Setiawan, S.AP.',
    jenisKelamin: 'L',
    statusKepegawaian: 'PNS',
    jenisPtk: 'Tenaga Administrasi',
    mapel: 'Kepala Tata Usaha',
    tugasTambahan: 'Kepala Tenaga Administrasi Sekolah (KTAS)',
    pendidikanTerakhir: 'S1 Administrasi Publik',
    noHp: '089612345678',
    email: 'agus.setiawan@sekolah.belajar.id',
    statusSertifikasi: 'Belum'
  },
  {
    id: 'ptk-003',
    nuptk: '6789012345678901',
    nip: '199008202022211007',
    nama: 'Mohamad Fadli, S.Kom.',
    jenisKelamin: 'L',
    statusKepegawaian: 'PPPK',
    jenisPtk: 'Tenaga Kependidikan',
    mapel: 'Operator Dapodik & IT',
    tugasTambahan: 'Operator SIM Sekolah',
    pendidikanTerakhir: 'S1 Sistem Informasi',
    noHp: '085712340011',
    email: 'fadli.operator@sekolah.belajar.id',
    statusSertifikasi: 'Belum'
  },
  {
    id: 'ptk-004',
    nuptk: '7890123456789012',
    nip: '198603122014022003',
    nama: 'Hj. Endang Sri Wahyuni, S.Sos.',
    jenisKelamin: 'P',
    statusKepegawaian: 'PNS',
    jenisPtk: 'Tenaga Administrasi',
    mapel: 'Administrasi Kepegawaian & Keuangan',
    tugasTambahan: 'Bendahara Sekolah',
    pendidikanTerakhir: 'S1 Sosiologi',
    noHp: '081345678901',
    email: 'endang.sri@sekolah.belajar.id',
    statusSertifikasi: 'Belum'
  },
  {
    id: 'ptk-005',
    nuptk: '8901234567890123',
    nip: '199511102024212009',
    nama: 'Rina Agustina, A.Md.',
    jenisKelamin: 'P',
    statusKepegawaian: 'PPPK Paruh Waktu',
    jenisPtk: 'Tenaga Administrasi',
    mapel: 'Administrasi Kesiswaan & Arsip',
    tugasTambahan: 'Staf Kesiswaan',
    pendidikanTerakhir: 'D3 Administrasi Perkantoran',
    noHp: '082233445566',
    email: 'rina.agustina@sekolah.belajar.id',
    statusSertifikasi: 'Belum'
  },
  {
    id: 'ptk-006',
    nuptk: '9012345678901234',
    nip: '199107142023211004',
    nama: 'Budi Prasetyo, S.I.Pust.',
    jenisKelamin: 'L',
    statusKepegawaian: 'PPPK',
    jenisPtk: 'Pustakawan',
    mapel: 'Pengelola Perpustakaan',
    tugasTambahan: 'Kepala Perpustakaan',
    pendidikanTerakhir: 'S1 Ilmu Perpustakaan',
    noHp: '087811223344',
    email: 'budi.pustaka@sekolah.belajar.id',
    statusSertifikasi: 'Belum'
  },
  {
    id: 'ptk-007',
    nuptk: '0123456789012345',
    nip: '199309052024211006',
    nama: 'Rahmat Hidayat, S.Si.',
    jenisKelamin: 'L',
    statusKepegawaian: 'PPPK Paruh Waktu',
    jenisPtk: 'Laboran',
    mapel: 'Pengelola Laboratorium IPA & Komputer',
    tugasTambahan: 'Laboran IPA',
    pendidikanTerakhir: 'S1 Biologi',
    noHp: '085299887766',
    email: 'rahmat.laboran@sekolah.belajar.id',
    statusSertifikasi: 'Belum'
  },
  {
    id: 'ptk-008',
    nuptk: '1122334455667788',
    nama: 'Hasan Basri',
    jenisKelamin: 'L',
    statusKepegawaian: 'Tenaga Honor Sekolah',
    jenisPtk: 'Tenaga Kependidikan',
    mapel: 'Petugas Keamanan & Ketertiban',
    tugasTambahan: 'Satpam / Security Sekolah',
    pendidikanTerakhir: 'SMA Sederajat',
    noHp: '081299881122',
    email: 'hasan.keamanan@sekolah.belajar.id',
    statusSertifikasi: 'Belum'
  },
  {
    id: 'ptk-009',
    nuptk: '2233445566778899',
    nama: 'Syarifudin',
    jenisKelamin: 'L',
    statusKepegawaian: 'Tenaga Honor Sekolah',
    jenisPtk: 'Tenaga Kependidikan',
    mapel: 'Petugas Kebersihan & Perawatan Lingkungan',
    tugasTambahan: 'Caraka / Kebersihan',
    pendidikanTerakhir: 'SMP Sederajat',
    noHp: '085344556677',
    email: 'syarif.kebersihan@sekolah.belajar.id',
    statusSertifikasi: 'Belum'
  },

  // =========================================================================
  // II. GURU / PENDIDIK (25 ORANG)
  // =========================================================================
  // 1. Matematika (3 orang)
  {
    id: 'ptk-010',
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
    id: 'ptk-011',
    nuptk: '3141592653589793',
    nip: '198806142022211009',
    nama: 'Ahmad Dani, M.Pd.',
    jenisKelamin: 'L',
    statusKepegawaian: 'PPPK',
    jenisPtk: 'Guru Mapel',
    mapel: 'Matematika',
    pendidikanTerakhir: 'S2 Pendidikan Matematika',
    noHp: '081277889900',
    email: 'ahmad.dani@sekolah.belajar.id',
    statusSertifikasi: 'Sudah'
  },
  {
    id: 'ptk-012',
    nuptk: '2718281828459045',
    nama: 'Putri Handayani, S.Pd.',
    jenisKelamin: 'P',
    statusKepegawaian: 'Guru Honor Sekolah',
    jenisPtk: 'Guru Mapel',
    mapel: 'Matematika',
    pendidikanTerakhir: 'S1 Pendidikan Matematika',
    noHp: '085211223344',
    email: 'putri.handayani@sekolah.belajar.id',
    statusSertifikasi: 'Belum'
  },

  // 2. Bahasa Indonesia (3 orang)
  {
    id: 'ptk-013',
    nuptk: '4567890123456789',
    nip: '198302102008012006',
    nama: 'Nurul Hidayati, S.Pd.',
    jenisKelamin: 'P',
    statusKepegawaian: 'PNS',
    jenisPtk: 'Guru Mapel',
    mapel: 'Bahasa Indonesia',
    pendidikanTerakhir: 'S1 Pendidikan Bahasa Indonesia',
    noHp: '082145678901',
    email: 'nurul.hidayati@sekolah.belajar.id',
    statusSertifikasi: 'Sudah'
  },
  {
    id: 'ptk-014',
    nuptk: '1414213562373095',
    nip: '198905222023211008',
    nama: 'Wahyu Pratama, S.Pd.',
    jenisKelamin: 'L',
    statusKepegawaian: 'PPPK',
    jenisPtk: 'Guru Mapel',
    mapel: 'Bahasa Indonesia',
    pendidikanTerakhir: 'S1 Pendidikan Bahasa dan Sastra Indonesia',
    noHp: '081355667788',
    email: 'wahyu.pratama@sekolah.belajar.id',
    statusSertifikasi: 'Sudah'
  },
  {
    id: 'ptk-015',
    nuptk: '1732050807568877',
    nama: 'Tri Wahyuningsih, S.Pd.',
    jenisKelamin: 'P',
    statusKepegawaian: 'Guru Honor Sekolah',
    jenisPtk: 'Guru Mapel',
    mapel: 'Bahasa Indonesia',
    pendidikanTerakhir: 'S1 Pendidikan Bahasa Indonesia',
    noHp: '085377889900',
    email: 'tri.wahyuningsih@sekolah.belajar.id',
    statusSertifikasi: 'Belum'
  },

  // 3. IPA (3 orang)
  {
    id: 'ptk-016',
    nuptk: '2236067977499789',
    nip: '198009182006041005',
    nama: 'Hendra Wijaya, S.Pd., M.Si.',
    jenisKelamin: 'L',
    statusKepegawaian: 'PNS',
    jenisPtk: 'Guru Mapel',
    mapel: 'Ilmu Pengetahuan Alam (IPA)',
    pendidikanTerakhir: 'S2 Magister Sains Fisika',
    noHp: '081199882233',
    email: 'hendra.wijaya@sekolah.belajar.id',
    statusSertifikasi: 'Sudah'
  },
  {
    id: 'ptk-017',
    nuptk: '2449489742783178',
    nip: '199104122022212004',
    nama: 'Maya Anggraini, S.Pd.',
    jenisKelamin: 'P',
    statusKepegawaian: 'PPPK',
    jenisPtk: 'Guru Mapel',
    mapel: 'Ilmu Pengetahuan Alam (IPA)',
    pendidikanTerakhir: 'S1 Pendidikan Biologi',
    noHp: '082199883344',
    email: 'maya.anggraini@sekolah.belajar.id',
    statusSertifikasi: 'Sudah'
  },
  {
    id: 'ptk-018',
    nuptk: '2645751311064590',
    nama: 'Dedi Kurniawan, S.Pd.',
    jenisKelamin: 'L',
    statusKepegawaian: 'PPPK Paruh Waktu',
    jenisPtk: 'Guru Mapel',
    mapel: 'Ilmu Pengetahuan Alam (IPA)',
    pendidikanTerakhir: 'S1 Pendidikan Fisika',
    noHp: '085788990011',
    email: 'dedi.kurniawan@sekolah.belajar.id',
    statusSertifikasi: 'Belum'
  },

  // 4. Bahasa Inggris (3 orang)
  {
    id: 'ptk-019',
    nuptk: '2828427124746190',
    nip: '198411032009022004',
    nama: 'Dian Novita, S.Pd., M.Hum.',
    jenisKelamin: 'P',
    statusKepegawaian: 'PNS',
    jenisPtk: 'Guru Mapel',
    mapel: 'Bahasa Inggris',
    pendidikanTerakhir: 'S2 Magister Humaniora',
    noHp: '081266778899',
    email: 'dian.novita@sekolah.belajar.id',
    statusSertifikasi: 'Sudah'
  },
  {
    id: 'ptk-020',
    nuptk: '3000000000000001',
    nip: '199001152023211003',
    nama: 'Faisal Akbar, S.Pd.',
    jenisKelamin: 'L',
    statusKepegawaian: 'PPPK',
    jenisPtk: 'Guru Mapel',
    mapel: 'Bahasa Inggris',
    pendidikanTerakhir: 'S1 Pendidikan Bahasa Inggris',
    noHp: '081344559988',
    email: 'faisal.akbar@sekolah.belajar.id',
    statusSertifikasi: 'Sudah'
  },
  {
    id: 'ptk-021',
    nuptk: '3162277660168379',
    nama: 'Anita Larasati, S.Pd.',
    jenisKelamin: 'P',
    statusKepegawaian: 'GTY',
    jenisPtk: 'Guru Mapel',
    mapel: 'Bahasa Inggris',
    pendidikanTerakhir: 'S1 Pendidikan Bahasa Inggris',
    noHp: '085266771122',
    email: 'anita.larasati@sekolah.belajar.id',
    statusSertifikasi: 'Belum'
  },

  // 5. IPS (3 orang)
  {
    id: 'ptk-022',
    nuptk: '3316624790355400',
    nip: '197908122007011008',
    nama: 'Drs. Mulyadi, M.Pd.',
    jenisKelamin: 'L',
    statusKepegawaian: 'PNS',
    jenisPtk: 'Guru Mapel',
    mapel: 'Ilmu Pengetahuan Sosial (IPS)',
    pendidikanTerakhir: 'S2 Pendidikan IPS',
    noHp: '081133445566',
    email: 'mulyadi.ips@sekolah.belajar.id',
    statusSertifikasi: 'Sudah'
  },
  {
    id: 'ptk-023',
    nuptk: '3464101615137754',
    nip: '199209252022212006',
    nama: 'Dewi Kartika, S.Pd.',
    jenisKelamin: 'P',
    statusKepegawaian: 'PPPK',
    jenisPtk: 'Guru Mapel',
    mapel: 'Ilmu Pengetahuan Sosial (IPS)',
    pendidikanTerakhir: 'S1 Pendidikan Sejarah',
    noHp: '082211445588',
    email: 'dewi.kartika@sekolah.belajar.id',
    statusSertifikasi: 'Sudah'
  },
  {
    id: 'ptk-024',
    nuptk: '3605551275463989',
    nama: 'Arif Wicaksono, S.Pd.',
    jenisKelamin: 'L',
    statusKepegawaian: 'Guru Honor Sekolah',
    jenisPtk: 'Guru Mapel',
    mapel: 'Ilmu Pengetahuan Sosial (IPS)',
    pendidikanTerakhir: 'S1 Pendidikan Geografi',
    noHp: '085733441199',
    email: 'arif.wicaksono@sekolah.belajar.id',
    statusSertifikasi: 'Belum'
  },

  // 6. Pendidikan Agama Islam & Budi Pekerti (2 orang)
  {
    id: 'ptk-025',
    nuptk: '3741657386773941',
    nip: '197706192003121004',
    nama: 'Ust. H. Muhammad Ridwan, S.Ag., M.Pd.I.',
    jenisKelamin: 'L',
    statusKepegawaian: 'PNS',
    jenisPtk: 'Guru Mapel',
    mapel: 'Pendidikan Agama Islam & Budi Pekerti',
    pendidikanTerakhir: 'S2 Pendidikan Agama Islam',
    noHp: '081277112233',
    email: 'ridwan.pai@sekolah.belajar.id',
    statusSertifikasi: 'Sudah'
  },
  {
    id: 'ptk-026',
    nuptk: '3872983346207417',
    nip: '198712102023212005',
    nama: 'Syarifah Nur, S.Pd.I.',
    jenisKelamin: 'P',
    statusKepegawaian: 'PPPK',
    jenisPtk: 'Guru Mapel',
    mapel: 'Pendidikan Agama Islam & Budi Pekerti',
    pendidikanTerakhir: 'S1 Pendidikan Agama Islam',
    noHp: '082344556611',
    email: 'syarifah.nur@sekolah.belajar.id',
    statusSertifikasi: 'Sudah'
  },

  // 7. Pendidikan Agama Kristen & Budi Pekerti (1 orang)
  {
    id: 'ptk-027',
    nuptk: '4000000000000002',
    nip: '198604172011011003',
    nama: 'Yohanes Christian, S.Th.',
    jenisKelamin: 'L',
    statusKepegawaian: 'PNS',
    jenisPtk: 'Guru Mapel',
    mapel: 'Pendidikan Agama Kristen & Budi Pekerti',
    pendidikanTerakhir: 'S1 Teologi Pendidikan',
    noHp: '081399887711',
    email: 'yohanes.christian@sekolah.belajar.id',
    statusSertifikasi: 'Sudah'
  },

  // 8. PPKn / Pendidikan Pancasila (2 orang)
  {
    id: 'ptk-028',
    nuptk: '4123105625617660',
    nip: '198110052008012011',
    nama: 'Ratna Juwita, S.Pd., M.H.',
    jenisKelamin: 'P',
    statusKepegawaian: 'PNS',
    jenisPtk: 'Guru Mapel',
    mapel: 'Pendidikan Pancasila dan Kewarganegaraan (PPKn)',
    pendidikanTerakhir: 'S2 Magister Hukum',
    noHp: '081288994455',
    email: 'ratna.juwita@sekolah.belajar.id',
    statusSertifikasi: 'Sudah'
  },
  {
    id: 'ptk-029',
    nuptk: '4242640687119285',
    nama: 'Eko Prasetyo, S.Pd.',
    jenisKelamin: 'L',
    statusKepegawaian: 'PPPK Paruh Waktu',
    jenisPtk: 'Guru Mapel',
    mapel: 'Pendidikan Pancasila dan Kewarganegaraan (PPKn)',
    pendidikanTerakhir: 'S1 PPKn',
    noHp: '085699881144',
    email: 'eko.prasetyo@sekolah.belajar.id',
    statusSertifikasi: 'Belum'
  },

  // 9. PJOK / Penjasorkes (2 orang)
  {
    id: 'ptk-030',
    nuptk: '4358898943540673',
    nip: '198407282010011009',
    nama: 'Bayu Anggoro, S.Pd.',
    jenisKelamin: 'L',
    statusKepegawaian: 'PNS',
    jenisPtk: 'Guru Mapel',
    mapel: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    pendidikanTerakhir: 'S1 Pendidikan Kepelatihan Olahraga',
    noHp: '081377881122',
    email: 'bayu.anggoro@sekolah.belajar.id',
    statusSertifikasi: 'Sudah'
  },
  {
    id: 'ptk-031',
    nuptk: '4472135954999579',
    nip: '199302182023211006',
    nama: 'Fajar Ramadhan, S.Pd.',
    jenisKelamin: 'L',
    statusKepegawaian: 'PPPK',
    jenisPtk: 'Guru Mapel',
    mapel: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    pendidikanTerakhir: 'S1 Pendidikan Jasmani',
    noHp: '082155669900',
    email: 'fajar.ramadhan@sekolah.belajar.id',
    statusSertifikasi: 'Sudah'
  },

  // 10. Seni Budaya (1 orang)
  {
    id: 'ptk-032',
    nuptk: '4582575694955840',
    nip: '199405102022212007',
    nama: 'Indah Permatasari, S.Sn.',
    jenisKelamin: 'P',
    statusKepegawaian: 'PPPK',
    jenisPtk: 'Guru Mapel',
    mapel: 'Seni Budaya & Prakarya',
    pendidikanTerakhir: 'S1 Seni Pertunjukan',
    noHp: '081299447788',
    email: 'indah.seni@sekolah.belajar.id',
    statusSertifikasi: 'Sudah'
  },

  // 11. Informatika / TIK (1 orang)
  {
    id: 'ptk-033',
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

  // 12. Bimbingan dan Konseling (BK) (1 orang)
  {
    id: 'ptk-034',
    nuptk: '4690415759823429',
    nip: '198608142011012014',
    nama: 'Lilis Suryani, S.Pd., Kons.',
    jenisKelamin: 'P',
    statusKepegawaian: 'PNS',
    jenisPtk: 'Guru BK',
    mapel: 'Bimbingan dan Konseling (BK)',
    pendidikanTerakhir: 'S1 Bimbingan dan Konseling',
    noHp: '081366554433',
    email: 'lilis.suryani@sekolah.belajar.id',
    statusSertifikasi: 'Sudah'
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
    id: 'rep-abdulah',
    studentId: 'std-abdulah',
    nis: '3899',
    nisn: '3124628953',
    studentName: 'ABDULAH',
    rombel: '7 A',
    fase: 'D',
    namaSekolah: 'SMP NEGERI 11 PALU',
    alamat: 'Jl. Keramik',
    semester: '2',
    tahunAjaran: '2025/2026',
    scores: [
      {
        mapel: 'Pendidikan Agama Islam dan Budi Pekerti',
        kelompok: 'Kelompok A',
        nilaiAkhir: 80,
        predikat: 'B',
        catatan: 'Mencapai Kompetensi dengan sangat baik dalam hal memahami makna iman kepada malaikat dan menghindari gibah dalam kehidupan sehari-hari.\n\nPerlu peningkatan dalam hal membaca, menulis, mengartikan dan menghafalkan Q.S Al-Anbiya/21:30 dan Q.S Al a\'araf/7:54 beserta hadist terkait, memahami makna rukhsah dan cara rukhsah dalam salat, puasa, zakat dan haji, menjelaskan perkembangan ilmu pengetahuan pada masa Bani Umayyah di Andalusia.'
      },
      {
        mapel: 'Pendidikan Pancasila',
        kelompok: 'Kelompok A',
        nilaiAkhir: 75,
        predikat: 'B',
        catatan: 'Perlu peningkatan dalam hal Mengindentifikasi keberagaman suku, agama, ras, dan antargolongan dalam bingkai bhineka tunggal ika , Menjelaskan jenis-jenis dan faktor penyebab keberagaman bangsa indonesia.'
      },
      {
        mapel: 'Bahasa Indonesia',
        kelompok: 'Kelompok A',
        nilaiAkhir: 75,
        predikat: 'B',
        catatan: 'Mencapai Kompetensi dengan sangat baik dalam hal peserta didik mampu mengidentifikasi ide pokokargumen pendukung dan pesan dari teks lisam.\n\nPerlu peningkatan dalam hal Peserta didik terampil menyajikan atu mendemonstrasikan langkah langkah suatu prosessecara runtut dan komunikatif.'
      },
      {
        mapel: 'Bahasa Inggris',
        kelompok: 'Kelompok A',
        nilaiAkhir: 70,
        predikat: 'C',
        catatan: 'Mencapai Kompetensi dengan sangat baik dalam hal mengenal dan menyebutkan benda benda sekitarnya.\n\nPerlu peningkatan dalam hal menggunakan preposiotion dalam kalimat, mendeskripsikan benda secara sederhana dalam bahasa inggris lisan dan tulisan.'
      },
      {
        mapel: 'Matematika (Umum)',
        kelompok: 'Kelompok A',
        nilaiAkhir: 70,
        predikat: 'C',
        catatan: 'Mencapai Kompetensi dengan sangat baik dalam hal Mengidentifikasi konstanta, koefisien, variabel dan suku pada bentuk aljabar.\n\nPerlu peningkatan dalam hal Mengubah bentuk aljabar ke bentuk aljabar ekuivalen dengan menggunakan sifat-sifat, operasi aljabar dan memfaktorkan , Memodelkan suatu permasalahan menjadi suatu bentuk aljabar dan penyelesaiaannya, Menentukan kedudukan dua garis dan hubungkan antar sudut pada dua garis sejajar yang di potong oleh sebuah garis transversal.'
      },
      {
        mapel: 'Ilmu Pengetahuan Alam (IPA)',
        kelompok: 'Kelompok A',
        nilaiAkhir: 81,
        predikat: 'B',
        catatan: 'Mencapai Kompetensi dengan sangat baik dalam hal Mengidentifikasi tingkatan organisasi kehidupan, Menganalisis jenis-jenis dan dampak dari pencemaran lingkungan.'
      },
      {
        mapel: 'Ilmu Pengetahuan Sosial (IPS)',
        kelompok: 'Kelompok A',
        nilaiAkhir: 75,
        predikat: 'B',
        catatan: 'Mencapai Kompetensi dengan sangat baik dalam hal mengenali konsep dasar ilmu sejarah yaitu manusia,ruang waktu kronologi perubahan, memahami keberagaman kondisi geografis indonesia.\n\nPerlu peningkatan dalam hal Merujuk pada kompetensi dan keterampilan spesifik yang berfokus pada ekonomi,interaksi sosial dan lingkungan.'
      },
      {
        mapel: 'Pendidikan Jasmani, Olahraga, dan Kesehatan',
        kelompok: 'Kelompok B',
        nilaiAkhir: 85,
        predikat: 'A',
        catatan: 'Mencapai Kompetensi dengan sangat baik dalam hal Menganalisis dan memahami pola makan sehat, bergizi, seimbang, dan pengaruhnya terhadap kesehatan.\n\nPerlu peningkatan dalam hal merancang serta mempraktikkan program latihan kebungaran jasmani terkait kesehatan..'
      },
      {
        mapel: 'Informatika',
        kelompok: 'Kelompok B',
        nilaiAkhir: 76,
        predikat: 'B',
        catatan: 'Mencapai Kompetensi dengan sangat baik dalam hal Memahami Konsep Dasar Informatika dan Teknologi.\n\nPerlu peningkatan dalam hal Memahami Konsep Algoritma dan Pemecahan Masalah, Mengembangkan Keterampilan Berpikir Komputasional.'
      },
      {
        mapel: 'Seni Rupa',
        kelompok: 'Kelompok B',
        nilaiAkhir: 78,
        predikat: 'B',
        catatan: 'Mencapai Kompetensi dengan sangat baik dalam hal peserta didik mampu membuat karya rupa dengan menggunakan dan menggabungkan pengetahuan dalam bentuk logo dan tipografi.\n\nPerlu peningkatan dalam hal peserta didik mampu membuat karya dengan tujuan mengubah lingkuangan sekitar sekolah.'
      }
    ],
    kokurikuler: 'Pada semester ini, ananda menunjukkan capaian yang cukup baik dalam penguatan profil lulusan, yang ditunjukkan melalui kegiatan kokurikuler Literasi dan Numerasi.\n\nPada dimensi penalaran kritis, ananda berkembang dalam subdimensi penyampaian argumentasi.',
    ekstrakurikuler: [
      {
        id: 'ex-1',
        namaEkstra: 'Pramuka',
        keterangan: 'Mampu dalam menerapkan nilai-nilai Dasa Darma dan Trisatya, selalu hadir tepat waktu, aktif membantu teman dalam regu, serta menunjukkan perkembangan yang baik dalam memahami pengetahuan kepramukaan.'
      }
    ],
    kehadiran: { sakit: 1, izin: 1, alpa: 1 },
    catatanWaliKelas: 'Perlu meningkatkan motivasi belajar, kedisiplinan, dan tanggung jawab dalam mengikuti pembelajaran, Partisipasi dalam kegiatan belajar masih perlu ditingkatkan.',
    statusKenaikan: 'Naik ke kelas VIII',
    tanggapanOrangTua: '',
    tempatTanggalCetak: 'Palu, 22 Juni 2026',
    namaWaliKelas: 'RINA, S.Pd., M.Pd',
    nipWaliKelas: 'NIP 9740817200932003',
    namaKepalaSekolah: 'Martha Taewa, S.Pd',
    nipKepalaSekolah: 'NIP 197103192007012011'
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

export const initialNotifications: NotificationItem[] = [];

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
