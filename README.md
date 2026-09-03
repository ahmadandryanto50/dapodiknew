# Dapodik Kemendikbudristek - Cloud & Google Spreadsheet Real-Time

Aplikasi Sistem Data Pokok Pendidikan (Dapodik) terintegrasi dengan tampilan antarmuka resmi Kemendikbudristek sesuai gambar dan tersinkronisasi langsung dengan **Google Sheets** secara *real-time*.

## ✨ Fitur Utama
1. **Tampilan Beranda Presisi**: Desain gradien biru khas Dapodik Kemendikbudristek lengkap dengan logo, menu vertikal (Data Siswa, PTK, Sarpras, Rapor, Laporan, Pengaturan), floating elements (Waktu, Inovasi, Kamera, Pengaturan), dan widget dashboard analitik.
2. **Integrasi Google Sheets Real-Time**:
   - Skrip Google Apps Script otomatis siap salin (1-klik).
   - Sinkronisasi instan dua arah untuk 4 lembar utama: `Data_Siswa`, `Data_PTK`, `Data_Sarpras`, dan `Data_Rapor`.
   - Fitur Ekspor Spreadsheet (CSV/Excel) & Impor CSV massal.
3. **Modul Lengkap Dapodik**:
   - **Data Siswa**: Pengelolaan biodata, NISN, NIK, Rombel, Agama, Tempat & Tanggal Lahir, serta Cetak Kartu Pelajar.
   - **PTK**: Guru & Tenaga Kependidikan, NUPTK, NIP, Sertifikasi Profesi Guru (PPG), dan Beban Tugas.
   - **Sarpras**: Monitoring kelaikan dan kondisi ruang kelas, laboratorium komputer, perpustakaan, dan inventaris.
   - **Rapor**: Penilaian capaian kompetensi, predikat huruf (A/B/C/D), absensi, dan Cetak Lembar Rapor Resmi.
   - **Laporan**: Grafik analitik interaktif (Recharts) untuk demografi gender, kepadatan rombel, dan kelaikan sarpras.
4. **Pencarian Cepat Global (⌘K)** & Pusat Notifikasi Validasi Dapodik.
5. **Deployment Ready**: Siap diexport ke GitHub dan dideploy langsung ke **Vercel** dengan arsitektur modern.

## 🚀 Panduan Menghubungkan Google Sheets (1 Menit)
1. Buat Google Spreadsheet baru di [sheets.new](https://sheets.new).
2. Di menu atas, pilih **Ekstensi** > **Apps Script**.
3. Buka menu **Pengaturan** di aplikasi Dapodik > klik tab **Salin Skrip Apps Script**, lalu paste ke editor Google Apps Script.
4. Klik **Terapkan (Deploy)** > **Penerapan Baru (New Deployment)** > Pilih **Aplikasi Web (Web App)** > Ubah Akses ke **"Siapa saja" (Anyone)**.
5. Salin URL Aplikasi Web yang didapat dan tempel di form integrasi Google Sheets di Dapodik.
