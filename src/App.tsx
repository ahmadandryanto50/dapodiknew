/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ActiveTab, 
  Student, 
  TeacherStaff, 
  SarprasItem, 
  KibBItem,
  StudentReport, 
  SyncConfig, 
  NotificationItem,
  AppDisplayConfig,
  SchoolProfile,
  AdminUser,
  SchoolAccount
} from './types';
import { 
  initialStudents, 
  initialTeachers, 
  initialSarpras, 
  initialKibB,
  initialReports, 
  initialNotifications,
  initialAdministrators,
  initialSchoolAccounts
} from './data/mockData';

import { LoginScreen } from './components/LoginScreen';
import { WelcomeHero } from './components/WelcomeHero';
import { StudentModule } from './components/StudentModule';
import { SchoolModule } from './components/SchoolModule';
import { PtkModule } from './components/PtkModule';
import { SarprasModule } from './components/SarprasModule';
import { RaporModule } from './components/RaporModule';
import { LaporanModule } from './components/LaporanModule';
import { SettingsModule } from './components/SettingsModule';
import { AplikasiModule, defaultAplikasiLinks, defaultOtherAplikasiLinks } from './components/AplikasiModule';
import { GuestUploadDashboard } from './components/GuestUploadDashboard';
import { QuickSearchModal } from './components/QuickSearchModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { SafeImage } from './components/SafeImage';
import { formatDateIndonesian, cleanLeadingZerosCode } from './utils/dateUtils';
import { loadFromGoogleSheets, syncToGoogleSheets, syncKibBToGoogleSheets, normalizeWebAppUrl } from './services/googleSheetsService';

const SHARED_CONTAINER_URL = "https://ais-pre-rl7bj4twi2wve75vqpw7yr-169174220206.asia-east1.run.app";
import { 
  Home, 
  School,
  Users, 
  GraduationCap, 
  Building2, 
  FileText, 
  BarChart3, 
  Settings, 
  Database, 
  RefreshCw,
  DownloadCloud,
  Bell,
  Search,
  LogOut,
  Shield,
  Laptop,
  FolderLock,
  Menu,
  X,
  Eye,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

const sanitizeTeacherDates = (teachersList: TeacherStaff[]): TeacherStaff[] => {
  if (!Array.isArray(teachersList)) return [];
  return teachersList.map(t => ({
    ...t,
    nuptk: cleanLeadingZerosCode(t.nuptk, 'nuptk'),
    nip: cleanLeadingZerosCode(t.nip, 'nip'),
    nik: cleanLeadingZerosCode(t.nik, 'nik'),
    noHp: cleanLeadingZerosCode(t.noHp, 'noHp'),
    noKk: cleanLeadingZerosCode(t.noKk, 'noKk'),
    rt: cleanLeadingZerosCode(t.rt, 'rt'),
    rw: cleanLeadingZerosCode(t.rw, 'rw'),
    kodePos: cleanLeadingZerosCode(t.kodePos, 'kodePos'),
    tanggalLahir: t.tanggalLahir ? formatDateIndonesian(t.tanggalLahir) : '',
    tanggalCpns: t.tanggalCpns ? formatDateIndonesian(t.tanggalCpns) : '',
    tmtPengangkatan: t.tmtPengangkatan ? formatDateIndonesian(t.tmtPengangkatan) : '',
    tmtPns: t.tmtPns ? formatDateIndonesian(t.tmtPns) : ''
  }));
};

const sanitizeStudentDates = (studentsList: Student[]): Student[] => {
  if (!Array.isArray(studentsList)) return [];
  return studentsList.map(s => ({
    ...s,
    nisn: cleanLeadingZerosCode(s.nisn, 'nisn'),
    nis: cleanLeadingZerosCode(s.nis, 'nis'),
    nik: cleanLeadingZerosCode(s.nik, 'nik'),
    hp: cleanLeadingZerosCode(s.hp, 'hp'),
    telepon: cleanLeadingZerosCode(s.telepon, 'telepon'),
    rt: cleanLeadingZerosCode(s.rt, 'rt'),
    rw: cleanLeadingZerosCode(s.rw, 'rw'),
    kodePos: cleanLeadingZerosCode(s.kodePos, 'kodePos'),
    noKk: cleanLeadingZerosCode(s.noKk, 'noKk'),
    tanggalLahir: s.tanggalLahir ? formatDateIndonesian(s.tanggalLahir) : ''
  }));
};

const sanitizeSchoolProfileDates = (sp: SchoolProfile): SchoolProfile => {
  if (!sp) return sp;
  return {
    ...sp,
    tmtMenjabat: sp.tmtMenjabat ? formatDateIndonesian(sp.tmtMenjabat) : '',
    tanggalSkPendirian: sp.tanggalSkPendirian ? formatDateIndonesian(sp.tanggalSkPendirian) : '',
    tanggalSkIzinOperasional: sp.tanggalSkIzinOperasional ? formatDateIndonesian(sp.tanggalSkIzinOperasional) : ''
  };
};

const sanitizeReports = (raporList: any[]): StudentReport[] => {
  if (!Array.isArray(raporList)) return [];
  return raporList.map((r: any) => {
    let parsedScores = r.scores;
    if (typeof parsedScores === 'string') {
      try {
        parsedScores = JSON.parse(parsedScores);
      } catch (e) {
        parsedScores = [];
      }
    }
    let parsedKehadiran = r.kehadiran;
    if (typeof parsedKehadiran === 'string') {
      try {
        parsedKehadiran = JSON.parse(parsedKehadiran);
      } catch (e) {
        parsedKehadiran = { sakit: 0, izin: 0, alpa: 0 };
      }
    }
    return {
      ...r,
      scores: Array.isArray(parsedScores) ? parsedScores : [],
      kehadiran: parsedKehadiran && typeof parsedKehadiran === 'object' ? parsedKehadiran : { sakit: 0, izin: 0, alpa: 0 }
    };
  });
};

function getCleanAdministrators(admins: AdminUser[]): AdminUser[] {
  if (!Array.isArray(admins)) return [];
  return admins.filter(a => a && a.username && String(a.username).trim().length > 0);
}

function mergeAdministratorsWithLocal(incomingAdmins: AdminUser[], currentAdmins: AdminUser[]): AdminUser[] {
  if (Array.isArray(incomingAdmins) && incomingAdmins.length > 0) {
    return getCleanAdministrators(incomingAdmins);
  }
  return getCleanAdministrators(currentAdmins);
}

function getDeletedNotifIds(): string[] {
  try {
    const saved = localStorage.getItem('dapodik_deleted_notif_ids');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

function saveDeletedNotifId(id: string) {
  if (!id) return;
  try {
    const list = getDeletedNotifIds();
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem('dapodik_deleted_notif_ids', JSON.stringify(list));
    }
  } catch (e) {}
}

function saveDeletedNotifIds(ids: string[]) {
  if (!Array.isArray(ids) || ids.length === 0) return;
  try {
    const current = getDeletedNotifIds();
    const set = new Set([...current, ...ids]);
    localStorage.setItem('dapodik_deleted_notif_ids', JSON.stringify(Array.from(set)));
  } catch (e) {}
}

function getFilteredNotifications(notifs: NotificationItem[], extraDeletedIds: string[] = []): NotificationItem[] {
  if (!Array.isArray(notifs)) return [];
  // Permanent blacklist of dummy mock notifications & deleted IDs so they never return in any browser
  const dummyIds = ['notif-1', 'notif-2', 'notif-3'];
  const deletedSet = new Set([...dummyIds, ...getDeletedNotifIds(), ...extraDeletedIds]);

  return notifs
    .filter(n => n && (n.id || n.title || n.message) && !deletedSet.has(String(n.id)))
    .map((n, idx) => ({
      ...n,
      id: n.id ? String(n.id) : `notif-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`
    }));
}

function mergeNotifications(
  list1: NotificationItem[] = [],
  list2: NotificationItem[] = [],
  extraDeletedIds: string[] = []
): NotificationItem[] {
  const dummyIds = ['notif-1', 'notif-2', 'notif-3'];
  const deletedSet = new Set([...dummyIds, ...getDeletedNotifIds(), ...extraDeletedIds]);
  const map = new Map<string, NotificationItem>();

  const processItem = (n: NotificationItem, idx: number) => {
    if (!n) return;
    const rawId = n.id ? String(n.id) : `notif-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
    if (deletedSet.has(rawId)) return;

    if (!map.has(rawId)) {
      map.set(rawId, { ...n, id: rawId });
    } else {
      const existing = map.get(rawId)!;
      map.set(rawId, {
        ...existing,
        ...n,
        id: rawId,
        read: existing.read || Boolean(n.read)
      });
    }
  };

  if (Array.isArray(list1)) list1.forEach((item, idx) => processItem(item, idx));
  if (Array.isArray(list2)) list2.forEach((item, idx) => processItem(item, idx));

  const merged = Array.from(map.values());
  merged.sort((a, b) => {
    const timeA = a.time ? new Date(a.time).getTime() : 0;
    const timeB = b.time ? new Date(b.time).getTime() : 0;
    return timeB - timeA;
  });

  return merged;
}

function cleanKibBItems(items: KibBItem[] = []): KibBItem[] {
  if (!Array.isArray(items)) return [];
  return items.filter(item => item && typeof item === 'object' && (item.namaBarang || item.kodeBarang || item.id || item.merkType));
}

export default function App() {
  // Authentication State
  const [administrators, setAdministrators] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem('dapodik_administrators');
    const list = saved ? JSON.parse(saved) : initialAdministrators;
    return getCleanAdministrators(list);
  });

  const [schoolAccounts, setSchoolAccounts] = useState<SchoolAccount[]>(() => {
    const saved = localStorage.getItem('dapodik_school_accounts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return initialSchoolAccounts;
  });

  const [activeSchoolNpsn, setActiveSchoolNpsn] = useState<string>('40203578');

  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('dapodik_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('dapodik_authenticated') === 'true';
  });

  // Ref to prevent background polling from overwriting local state right after user operations
  const lastLocalMutationRef = useRef<number>(0);
  const isSyncingFromServerRef = useRef<boolean>(false);
  const loadedSchoolNpsnRef = useRef<string>(localStorage.getItem('dapodik_active_school_npsn') || '40203578');

  const getStorageKey = (baseKey: string, npsn = activeSchoolNpsn) => {
    if (npsn === '40203578') return baseKey;
    return `${baseKey}_${npsn}`;
  };

  // State Initialization from LocalStorage with automatic obsolete offline cache purge
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  
  const [students, setStudents] = useState<Student[]>(() => {
    // Purge obsolete offline cache from localStorage so all browsers and mobile devices synchronize immediately
    const CLEAN_OFFLINE_VER = 'dapodik_offline_clean_v2026_09_19_baseline_335';
    if (typeof window !== 'undefined' && localStorage.getItem(CLEAN_OFFLINE_VER) !== 'true') {
      localStorage.setItem('dapodik_students', JSON.stringify(initialStudents));
      localStorage.setItem('dapodik_teachers', JSON.stringify(initialTeachers));
      localStorage.setItem('dapodik_sarpras', JSON.stringify(initialSarpras));
      localStorage.setItem('dapodik_kib_b', JSON.stringify(initialKibB));
      localStorage.setItem('dapodik_reports', JSON.stringify(initialReports));
      localStorage.setItem(CLEAN_OFFLINE_VER, 'true');
    }
    const saved = localStorage.getItem('dapodik_students');
    const data = saved ? JSON.parse(saved) : initialStudents;
    return sanitizeStudentDates(data);
  });

  const [teachers, setTeachers] = useState<TeacherStaff[]>(() => {
    const saved = localStorage.getItem('dapodik_teachers');
    const data = saved ? JSON.parse(saved) : initialTeachers;
    return sanitizeTeacherDates(data);
  });

  const [sarpras, setSarpras] = useState<SarprasItem[]>(() => {
    const saved = localStorage.getItem('dapodik_sarpras');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse dapodik_sarpras', e);
      }
    }
    return initialSarpras;
  });

  const [kibB, setKibB] = useState<KibBItem[]>(() => {
    const saved = localStorage.getItem('dapodik_kib_b');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = cleanKibBItems(parsed);
          if (cleaned.length !== parsed.length) {
            localStorage.setItem('dapodik_kib_b', JSON.stringify(cleaned));
          }
          return cleaned;
        }
      } catch (e) {
        console.error('Failed to parse dapodik_kib_b', e);
      }
    }
    return cleanKibBItems(initialKibB);
  });

  const [reports, setReports] = useState<StudentReport[]>(() => {
    const saved = localStorage.getItem('dapodik_reports');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return sanitizeReports(parsed);
        }
      } catch (e) {
        console.error('Failed to parse dapodik_reports', e);
      }
    }
    return sanitizeReports(initialReports);
  });

  const [displayConfig, setDisplayConfig] = useState<AppDisplayConfig>(() => {
    const saved = localStorage.getItem('dapodik_display_config');
    const parsed = saved ? JSON.parse(saved) : {
      appName: 'DAPODIK',
      appVersion: '2026.b',
      appSubtitle: '',
      logoCustomUrl: '/logo_smpn11palu.jpg',
      welcomeGreeting: 'SELAMAT DATANG',
      welcomeTitle: 'DI DAPODIK',
      welcomeSubtitle: 'DATA POKOK PENDIDIKAN',
      welcomeCustomIconUrl: '/logo_smpn11palu.jpg',
      operatorTitle: 'Operator Sekolah',
      operatorName: 'Ahmad Andryanto, S.Pd.',
      operatorAvatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80',
      curriculumBadge: 'Kurikulum Merdeka Ready',
      footerVersionText: 'Dapodik Cloud 2026.a (Next.js & Vercel Ready)'
    };
    if (parsed.appSubtitle === 'KEMENDIKBUDRISTEK' || !parsed.appSubtitle) {
      parsed.appSubtitle = '';
    }
    if (!parsed.logoCustomUrl || parsed.logoCustomUrl.includes('facebook.com')) {
      parsed.logoCustomUrl = '/logo_smpn11palu.jpg';
    }
    if (!parsed.welcomeCustomIconUrl) {
      parsed.welcomeCustomIconUrl = '/logo_smpn11palu.jpg';
    }
    if (!parsed.operatorName || parsed.operatorName === 'SMP NEGERI 11 PALU') {
      parsed.operatorName = 'Ahmad Andryanto, S.Pd.';
    }
    if (!parsed.operatorAvatarUrl) {
      parsed.operatorAvatarUrl = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80';
    }
    if (parsed.appVersion === '2026.A' || parsed.appVersion === '2026.B') {
      parsed.appVersion = '2026.b';
    }
    return parsed;
  });

  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => {
    const saved = localStorage.getItem('dapodik_school_profile');
    const data = saved ? JSON.parse(saved) : {
      npsn: '40203578',
      namaSekolah: 'SMP NEGERI 11 PALU',
      logoSekolah: '/logo_smpn11palu.jpg',
      bentukPendidikan: 'Sekolah Menengah Pertama (SMP)',
      statusSekolah: 'Negeri',
      alamat: 'Jl. Keramik, Kelurahan Duyu, Kecamatan Tatanga',
      desaKelurahan: 'Duyu',
      kecamatan: 'Tatanga',
      kabupatenKota: 'Kota Palu',
      provinsi: 'Sulawesi Tengah',
      kepalaSekolah: 'Drs. Bambang Sudarsono, M.Pd.',
      nipKepalaSekolah: '197805122005011002',
      pangkatGolongan: 'Pembina Tk. I / IV-b',
      tmtMenjabat: '01 Juli 2021',
      fotoKepalaSekolah: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80',
      akreditasi: 'A (Unggul)',
      kurikulum: 'Kurikulum Merdeka',
      luasTanah: '12.500 m²',
      luasBangunan: '4.850 m²',
      dayaTampung: '384 Siswa (12 Rombel)',
      jumlahRombel: '12 Rombel',
      keterangan: 'Sekolah Ramah Anak, Adiwiyata Mandiri, dan Sekolah Penggerak Angkatan I'
    };
    if (data.namaSekolah === 'SMP Negeri Unggulan 1' || !data.namaSekolah) {
      data.namaSekolah = 'SMP NEGERI 11 PALU';
    }
    if (data.npsn === '20109988' || !data.npsn) {
      data.npsn = '40203578';
    }
    if (data.alamat?.includes('Jl. Pendidikan No. 12') || !data.alamat) {
      data.alamat = 'Jl. Keramik, Kelurahan Duyu, Kecamatan Tatanga';
      data.desaKelurahan = 'Duyu';
      data.kecamatan = 'Tatanga';
      data.kabupatenKota = 'Kota Palu';
      data.provinsi = 'Sulawesi Tengah';
    }
    if (!data.logoSekolah || data.logoSekolah.includes('facebook.com')) {
      data.logoSekolah = '/logo_smpn11palu.jpg';
    }
    return sanitizeSchoolProfileDates(data);
  });

  const [syncConfig, setSyncConfig] = useState<SyncConfig>(() => {
    const OLD_APP_SCRIPT_URL_1 = 'https://script.google.com/macros/s/AKfycbwHOEkfJ7iJVAlTKUVboM7ZHd13dX9Z6adJBH6N2UwA-LbDmTrJvxPHuBB8T4kePUmJAQ/exec';
    const OLD_APP_SCRIPT_URL_2 = 'https://script.google.com/macros/s/AKfycbwCjNbFmpToPA9JATA4FlFJPESoWbqS9JzIhbF2TS7FNsTlK2ZIUMtfsPBE5ln3Q7eO/exec';
    const OLD_APP_SCRIPT_URL_3 = 'https://script.google.com/macros/s/AKfycbx82FotXhPvN0i9hOo_S-bctwcT5JCB6JrvUu5CHtIMEepaJj1EIl5Bf7mxPoW8JuPguA/exec';
    const ACTIVE_APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwOjTnhqqQFCvRGK_5NPVICqUbK-yHUTq1b0CwX3aXqcYjOITfoaogfBWDS3I1bdL6hZA/exec';

    const saved = localStorage.getItem('dapodik_sync_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.webAppUrl) {
          if (parsed.webAppUrl === OLD_APP_SCRIPT_URL_1 || parsed.webAppUrl === OLD_APP_SCRIPT_URL_2 || parsed.webAppUrl === OLD_APP_SCRIPT_URL_3) {
            parsed.webAppUrl = ACTIVE_APP_SCRIPT_URL;
            localStorage.setItem('dapodik_sync_config', JSON.stringify(parsed));
          }
          return parsed;
        }
      } catch (e) {
        // Fallback to hardcoded default
      }
    }
    return {
      spreadsheetUrl: '1XmLmshCOhSktRfzW8uG_8RqxlxVCQt5eUVekEFLwj_M',
      webAppUrl: ACTIVE_APP_SCRIPT_URL,
      sheetId: '',
      autoSync: true,
      lastSynced: null,
      status: 'connected',
      mode: 'appscript'
    };
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const isCleared = localStorage.getItem('dapodik_notif_cleared_flag') === 'true';
    const saved = localStorage.getItem('dapodik_notifications');
    let base: NotificationItem[] = [];
    if (saved !== null) {
      try {
        base = JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    } else if (!isCleared) {
      base = initialNotifications;
    }
    return getFilteredNotifications(base);
  });

  const [aplikasiLinks, setAplikasiLinks] = useState<any[]>(() => {
    const saved = localStorage.getItem('dapodik_aplikasi_links');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // Fallback to default
      }
    }
    return [...defaultAplikasiLinks, ...defaultOtherAplikasiLinks];
  });

  const [customFolders, setCustomFolders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dapodik_custom_folders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // UI Modals
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasSuccessfullyPulled, setHasSuccessfullyPulled] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [settingsInitialFilter, setSettingsInitialFilter] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all');

  const notificationsRef = useRef<NotificationItem[]>(notifications);
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const syncConfigRef = useRef<SyncConfig>(syncConfig);
  useEffect(() => {
    syncConfigRef.current = syncConfig;
  }, [syncConfig]);

  const kibBRef = useRef<KibBItem[]>(kibB);
  useEffect(() => {
    kibBRef.current = kibB;
  }, [kibB]);

  const handleOpenEditDisplay = (filter: 'all' | '1' | '2' | '3' | '4' | '5' = 'all') => {
    setSettingsInitialFilter(filter);
    setActiveTab('pengaturan');
  };

  const getApiUrl = (path: string) => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('run.app');
    return isLocal ? path : `${SHARED_CONTAINER_URL}${path}`;
  };

  // Save application data cache to server so that it is shared across all browsers/devices
  const saveCacheToServer = async (
    customStudents = students,
    customTeachers = teachers,
    customSarpras = sarpras,
    customReports = reports,
    customDisplayConfig = displayConfig,
    customSchoolProfile = schoolProfile,
    customAdministrators = administrators,
    customNotifications = notificationsRef.current,
    customAplikasiLinks = aplikasiLinks,
    customDeletedNotifIds = getDeletedNotifIds(),
    customSchoolAccounts = schoolAccounts,
    customKibB = kibBRef.current,
    customSchoolFiles?: any[]
  ) => {
    if (!isInitialized) return;
    try {
      await fetch(getApiUrl('/api/app-data'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          students: customStudents,
          teachers: customTeachers,
          sarpras: customSarpras,
          kibB: customKibB,
          reports: customReports,
          displayConfig: customDisplayConfig,
          schoolProfile: customSchoolProfile,
          administrators: customAdministrators,
          notifications: customNotifications,
          aplikasiLinks: customAplikasiLinks,
          deletedNotifIds: customDeletedNotifIds,
          schoolAccounts: customSchoolAccounts,
          schoolFiles: customSchoolFiles
        })
      });
    } catch (err) {
      console.error('Failed to save data cache to server:', err);
    }
  };

  // Save sync config to server so that it is shared across all browsers/devices
  const saveSyncConfigToServer = async (newConfig: SyncConfig) => {
    const normalizedConfig: SyncConfig = {
      ...newConfig,
      webAppUrl: normalizeWebAppUrl(newConfig.webAppUrl)
    };
    try {
      // 1. Save to local deployment API
      await fetch(getApiUrl('/api/sync-config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizedConfig)
      });
    } catch (err) {
      console.warn('Failed to save sync config to local server:', err);
    }
    try {
      // 2. Also save to central shared container API so it is shared across Vercel, HP, and Laptop permanently
      await fetch(`${SHARED_CONTAINER_URL}/api/sync-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizedConfig)
      });
    } catch (err) {
      console.warn('Failed to save sync config to central shared server:', err);
    }
  };

  const loadSchoolWorkspaceData = (npsn: string) => {
    isSyncingFromServerRef.current = true;
    try {
      if (npsn === '40203578') {
        const sS = localStorage.getItem('dapodik_students');
        setStudents(sS ? sanitizeStudentDates(JSON.parse(sS)) : initialStudents);

        const sT = localStorage.getItem('dapodik_teachers');
        setTeachers(sT ? sanitizeTeacherDates(JSON.parse(sT)) : initialTeachers);

        const sSar = localStorage.getItem('dapodik_sarpras');
        setSarpras(sSar ? JSON.parse(sSar) : initialSarpras);

        const sKib = localStorage.getItem('dapodik_kib_b');
        setKibB(sKib ? cleanKibBItems(JSON.parse(sKib)) : cleanKibBItems(initialKibB));

        const sR = localStorage.getItem('dapodik_reports');
        setReports(sR ? sanitizeReports(JSON.parse(sR)) : sanitizeReports(initialReports));

        const sP = localStorage.getItem('dapodik_school_profile');
        if (sP) {
          setSchoolProfile(sanitizeSchoolProfileDates(JSON.parse(sP)));
        } else {
          setSchoolProfile({
            npsn: '40203578',
            namaSekolah: 'SMP NEGERI 11 PALU',
            logoSekolah: '/logo_smpn11palu.jpg',
            bentukPendidikan: 'Sekolah Menengah Pertama (SMP)',
            statusSekolah: 'Negeri',
            alamat: 'Jl. Keramik, Kelurahan Duyu, Kecamatan Tatanga',
            desaKelurahan: 'Duyu',
            kecamatan: 'Tatanga',
            kabupatenKota: 'Kota Palu',
            provinsi: 'Sulawesi Tengah',
            kepalaSekolah: 'Drs. Bambang Sudarsono, M.Pd.',
            nipKepalaSekolah: '197805122005011002',
            pangkatGolongan: 'Pembina Tk. I / IV-b',
            tmtMenjabat: '01 Juli 2021',
            fotoKepalaSekolah: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80',
            akreditasi: 'A (Unggul)',
            kurikulum: 'Kurikulum Merdeka',
            luasTanah: '12.500 m²',
            luasBangunan: '4.850 m²',
            dayaTampung: '384 Siswa (12 Rombel)',
            jumlahRombel: '12 Rombel',
            keterangan: 'Sekolah Ramah Anak, Adiwiyata Mandiri, dan Sekolah Penggerak Angkatan I'
          });
        }

        const sD = localStorage.getItem('dapodik_display_config');
        if (sD) {
          setDisplayConfig(JSON.parse(sD));
        } else {
          setDisplayConfig({
            appName: 'DAPODIK',
            appVersion: '2026.b',
            appSubtitle: '',
            logoCustomUrl: '/logo_smpn11palu.jpg',
            welcomeGreeting: 'SELAMAT DATANG',
            welcomeTitle: 'DI DAPODIK',
            welcomeSubtitle: 'DATA POKOK PENDIDIKAN',
            welcomeCustomIconUrl: '/logo_smpn11palu.jpg',
            operatorTitle: 'Operator Sekolah',
            operatorName: 'Ahmad Andryanto, S.Pd.',
            operatorAvatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80',
            curriculumBadge: 'Kurikulum Merdeka Ready',
            footerVersionText: 'Dapodik Cloud 2026.a (Next.js & Vercel Ready)'
          });
        }
      } else {
        const activeSch = schoolAccounts.find(s => s.npsn === npsn);

        const sS = localStorage.getItem(`dapodik_students_${npsn}`);
        setStudents(sS ? sanitizeStudentDates(JSON.parse(sS)) : []);

        const sT = localStorage.getItem(`dapodik_teachers_${npsn}`);
        setTeachers(sT ? sanitizeTeacherDates(JSON.parse(sT)) : []);

        const sSar = localStorage.getItem(`dapodik_sarpras_${npsn}`);
        setSarpras(sSar ? JSON.parse(sSar) : []);

        const sKib = localStorage.getItem(`dapodik_kib_b_${npsn}`);
        setKibB(sKib ? JSON.parse(sKib) : []);

        const sR = localStorage.getItem(`dapodik_reports_${npsn}`);
        setReports(sR ? sanitizeReports(JSON.parse(sR)) : []);

        const sP = localStorage.getItem(`dapodik_school_profile_${npsn}`);
        if (sP) {
          setSchoolProfile(sanitizeSchoolProfileDates(JSON.parse(sP)));
        } else if (activeSch) {
          const blankProfile: SchoolProfile = {
            npsn: activeSch.npsn,
            namaSekolah: activeSch.namaSekolah,
            bentukPendidikan: activeSch.bentukPendidikan || 'Sekolah Menengah Pertama (SMP)',
            statusSekolah: 'Swasta',
            alamat: activeSch.alamat || '',
            desaKelurahan: '',
            kecamatan: '',
            kabupatenKota: activeSch.kabupatenKota || '',
            provinsi: activeSch.provinsi || 'Sulawesi Tengah',
            kepalaSekolah: activeSch.kepalaSekolah || '',
            nipKepalaSekolah: activeSch.nipKepalaSekolah || '',
            pangkatGolongan: '',
            tmtMenjabat: '',
            logoSekolah: '',
            fotoKepalaSekolah: '',
            akreditasi: 'Belum Terakreditasi',
            kurikulum: 'Kurikulum Merdeka',
            luasTanah: '',
            luasBangunan: '',
            dayaTampung: '',
            jumlahRombel: '',
            keterangan: activeSch.catatan || ''
          };
          setSchoolProfile(blankProfile);
        }

        const sD = localStorage.getItem(`dapodik_display_config_${npsn}`);
        if (sD) {
          setDisplayConfig(JSON.parse(sD));
        } else if (activeSch) {
          setDisplayConfig({
            appName: 'DAPODIK',
            appVersion: '2026.b',
            appSubtitle: activeSch.namaSekolah.toUpperCase(),
            logoCustomUrl: '',
            welcomeGreeting: 'SELAMAT DATANG',
            welcomeTitle: 'DI PORTAL',
            welcomeSubtitle: activeSch.namaSekolah.toUpperCase(),
            welcomeCustomIconUrl: '',
            operatorTitle: 'Operator Sekolah',
            operatorName: activeSch.kepalaSekolah || 'Operator',
            operatorAvatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80',
            curriculumBadge: 'Kurikulum Merdeka Ready',
            footerVersionText: `Dapodik Cloud 2026.a - ${activeSch.namaSekolah}`
          });
        }
      }
      loadedSchoolNpsnRef.current = npsn;
    } catch (e) {
      console.error('Error loading school workspace data:', e);
    } finally {
      setTimeout(() => {
        isSyncingFromServerRef.current = false;
      }, 300);
    }
  };

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): NotificationItem[] => {
    lastLocalMutationRef.current = Date.now();
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title,
      message,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      type,
      read: false
    };
    const updated = mergeNotifications([newNotif], notificationsRef.current);
    notificationsRef.current = updated;
    setNotifications(updated);
    localStorage.setItem('dapodik_notifications', JSON.stringify(updated));
    saveCacheToServer(students, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, updated, aplikasiLinks, getDeletedNotifIds(), schoolAccounts);
    return updated;
  };

  // Save to LocalStorage & Server Cache
  useEffect(() => {
    if (!isInitialized) return;
    if (loadedSchoolNpsnRef.current !== activeSchoolNpsn) return;
    localStorage.setItem(getStorageKey('dapodik_students'), JSON.stringify(students));
    if (!isSyncingFromServerRef.current) {
      lastLocalMutationRef.current = Date.now();
      saveCacheToServer(students, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, notificationsRef.current, aplikasiLinks, getDeletedNotifIds(), schoolAccounts);
    }
  }, [students, isInitialized, activeSchoolNpsn]);

  useEffect(() => {
    if (!isInitialized) return;
    if (loadedSchoolNpsnRef.current !== activeSchoolNpsn) return;
    localStorage.setItem(getStorageKey('dapodik_teachers'), JSON.stringify(teachers));
    if (!isSyncingFromServerRef.current) {
      lastLocalMutationRef.current = Date.now();
      saveCacheToServer(students, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, notificationsRef.current, aplikasiLinks, getDeletedNotifIds(), schoolAccounts);
    }
  }, [teachers, isInitialized, activeSchoolNpsn]);

  useEffect(() => {
    if (!isInitialized) return;
    if (loadedSchoolNpsnRef.current !== activeSchoolNpsn) return;
    localStorage.setItem(getStorageKey('dapodik_sarpras'), JSON.stringify(sarpras));
    if (!isSyncingFromServerRef.current) {
      lastLocalMutationRef.current = Date.now();
      saveCacheToServer(students, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, notificationsRef.current, aplikasiLinks, getDeletedNotifIds(), schoolAccounts, kibB);
    }
  }, [sarpras, isInitialized, activeSchoolNpsn]);

  useEffect(() => {
    if (!isInitialized) return;
    if (loadedSchoolNpsnRef.current !== activeSchoolNpsn) return;
    localStorage.setItem(getStorageKey('dapodik_kib_b'), JSON.stringify(kibB));
    if (!isSyncingFromServerRef.current) {
      lastLocalMutationRef.current = Date.now();
      saveCacheToServer(students, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, notificationsRef.current, aplikasiLinks, getDeletedNotifIds(), schoolAccounts, kibB);
    }
  }, [kibB, isInitialized, activeSchoolNpsn]);

  useEffect(() => {
    if (!isInitialized) return;
    if (loadedSchoolNpsnRef.current !== activeSchoolNpsn) return;
    localStorage.setItem(getStorageKey('dapodik_reports'), JSON.stringify(reports));
    if (!isSyncingFromServerRef.current) {
      lastLocalMutationRef.current = Date.now();
      saveCacheToServer(students, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, notificationsRef.current, aplikasiLinks, getDeletedNotifIds(), schoolAccounts);
    }
  }, [reports, isInitialized, activeSchoolNpsn]);

  useEffect(() => {
    if (!isInitialized) return;
    if (loadedSchoolNpsnRef.current !== activeSchoolNpsn) return;
    localStorage.setItem(getStorageKey('dapodik_display_config'), JSON.stringify(displayConfig));
    if (!isSyncingFromServerRef.current) {
      lastLocalMutationRef.current = Date.now();
      saveCacheToServer(students, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, notificationsRef.current, aplikasiLinks, getDeletedNotifIds(), schoolAccounts);
    }
  }, [displayConfig, isInitialized, activeSchoolNpsn]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('dapodik_administrators', JSON.stringify(administrators));
    if (!isSyncingFromServerRef.current) {
      lastLocalMutationRef.current = Date.now();
      saveCacheToServer(students, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, notificationsRef.current, aplikasiLinks, getDeletedNotifIds(), schoolAccounts);
    }
  }, [administrators, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('dapodik_school_accounts', JSON.stringify(schoolAccounts));
    if (!isSyncingFromServerRef.current) {
      lastLocalMutationRef.current = Date.now();
      saveCacheToServer(students, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, notificationsRef.current, aplikasiLinks, getDeletedNotifIds(), schoolAccounts);
    }
  }, [schoolAccounts, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    if (loadedSchoolNpsnRef.current !== activeSchoolNpsn) return;
    localStorage.setItem(getStorageKey('dapodik_school_profile'), JSON.stringify(schoolProfile));
    if (!isSyncingFromServerRef.current) {
      lastLocalMutationRef.current = Date.now();
      saveCacheToServer(students, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, notificationsRef.current, aplikasiLinks, getDeletedNotifIds(), schoolAccounts);
    }
  }, [schoolProfile, isInitialized, activeSchoolNpsn]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem(getStorageKey('dapodik_sync_config'), JSON.stringify(syncConfig));
    saveSyncConfigToServer(syncConfig);
  }, [syncConfig, isInitialized, activeSchoolNpsn]);

  useEffect(() => {
    if (!isInitialized) return;
    if (loadedSchoolNpsnRef.current !== activeSchoolNpsn) return;
    localStorage.setItem(getStorageKey('dapodik_notifications'), JSON.stringify(notifications));
    if (!isSyncingFromServerRef.current) {
      lastLocalMutationRef.current = Date.now();
      saveCacheToServer(students, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, notifications, aplikasiLinks, getDeletedNotifIds(), schoolAccounts);
    }
  }, [notifications, isInitialized, activeSchoolNpsn]);

  useEffect(() => {
    if (!isInitialized) return;
    if (loadedSchoolNpsnRef.current !== activeSchoolNpsn) return;
    localStorage.setItem(getStorageKey('dapodik_aplikasi_links'), JSON.stringify(aplikasiLinks));
    if (!isSyncingFromServerRef.current) {
      lastLocalMutationRef.current = Date.now();
      saveCacheToServer(students, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, notificationsRef.current, aplikasiLinks, getDeletedNotifIds(), schoolAccounts);
    }
  }, [aplikasiLinks, isInitialized, activeSchoolNpsn]);

  // Auth Handlers
  const handleLogin = (user: AdminUser, school?: SchoolAccount) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('dapodik_current_user', JSON.stringify(user));
    localStorage.setItem('dapodik_authenticated', 'true');
    if (user.schoolNpsn) {
      setActiveSchoolNpsn(user.schoolNpsn);
      localStorage.setItem('dapodik_active_school_npsn', user.schoolNpsn);
    } else {
      setActiveSchoolNpsn('40203578');
      localStorage.setItem('dapodik_active_school_npsn', '40203578');
    }
    showToast(`Selamat datang kembali, ${user.nama}!`);
    handlePullFromSheets(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('dapodik_authenticated');
    localStorage.removeItem('dapodik_current_user');
    showToast('Anda telah keluar dari sistem.');
  };

  const handleSaveSchoolAccounts = (newAccounts: SchoolAccount[]) => {
    setSchoolAccounts(newAccounts);
    localStorage.setItem('dapodik_school_accounts', JSON.stringify(newAccounts));
    
    lastLocalMutationRef.current = Date.now();
    showToast('Data akun multi-sekolah berhasil diperbarui...');
    triggerAutoSync(
      students,
      teachers,
      sarpras,
      reports,
      displayConfig,
      schoolProfile,
      administrators,
      true,
      notificationsRef.current,
      {
        title: 'Update Akun Sekolah',
        message: 'Data akun multi-sekolah berhasil diperbarui di database.',
        type: 'info'
      },
      aplikasiLinks,
      newAccounts
    );
  };

  const handleSwitchSchoolWorkspace = (targetSchool: SchoolAccount) => {
    setActiveSchoolNpsn(targetSchool.npsn);
    localStorage.setItem('dapodik_active_school_npsn', targetSchool.npsn);
    showToast(`Beralih ke mode pantau: ${targetSchool.namaSekolah} (${targetSchool.npsn})`);
  };

  const handleResetToMainSchool = () => {
    setActiveSchoolNpsn('40203578');
    localStorage.setItem('dapodik_active_school_npsn', '40203578');
    showToast('Kembali ke ruang kerja Sekolah Utama (SMP NEGERI 11 PALU).');
  };

  const handleSaveAdministrators = (newAdmins: AdminUser[]) => {
    const cleanAdmins = getCleanAdministrators(newAdmins);
    setAdministrators(cleanAdmins);
    localStorage.setItem('dapodik_administrators', JSON.stringify(cleanAdmins));

    // Update currentUser session immediately if current user's data/password or status was edited
    const savedUserStr = localStorage.getItem('dapodik_current_user');
    if (savedUserStr) {
      try {
        const currentSaved = JSON.parse(savedUserStr);
        const matched = cleanAdmins.find(a => a.username.toLowerCase() === currentSaved.username.toLowerCase());
        if (matched) {
          if (matched.status === 'Nonaktif' || matched.status === 'Tidak Aktif' || (matched.status as string) === 'Tidak-Aktif') {
            handleLogout();
            showToast('Akun Anda telah dinonaktifkan oleh Administrator.');
          } else {
            setCurrentUser(matched);
            localStorage.setItem('dapodik_current_user', JSON.stringify(matched));
          }
        }
      } catch (e) {}
    }

    lastLocalMutationRef.current = Date.now();
    showToast('Data akun pengguna berhasil diperbarui...');
    triggerAutoSync(
      students,
      teachers,
      sarpras,
      reports,
      displayConfig,
      schoolProfile,
      cleanAdmins,
      true,
      notificationsRef.current,
      {
        title: 'Update Akun Pengguna',
        message: 'Data pengguna & hak akses administrator berhasil diperbarui di database.',
        type: 'info'
      }
    );
  };

  const getEffectiveSyncConfig = (): SyncConfig => {
    const mainCfg = syncConfigRef.current || syncConfig;
    const activeSch = schoolAccounts.find(s => s.npsn === activeSchoolNpsn);
    if (activeSchoolNpsn !== '40203578' && activeSch) {
      return {
        ...mainCfg,
        spreadsheetUrl: activeSch.spreadsheetUrl || mainCfg.spreadsheetUrl || '',
        webAppUrl: activeSch.webAppUrl || mainCfg.webAppUrl || '',
        sheetId: ''
      };
    }
    return mainCfg;
  };

  const handlePullFromSheets = async (silent = false) => {
    if (silent && (Date.now() - lastLocalMutationRef.current < 15000)) {
      return true;
    }
    setIsSyncing(true);
    try {
      const currentCfg = getEffectiveSyncConfig();
      const isMainSchool = activeSchoolNpsn === '40203578';
      
      if (currentCfg && currentCfg.webAppUrl) {
        const result = await loadFromGoogleSheets(currentCfg);
        if (result && result.success && result.data) {
          const {
            siswa, ptk, sarpras, kibB: pulledKibB, rapor, administrator, pengaturan, profilSekolah, aplikasi, notifikasi, berkas: pulledBerkas, schoolAccounts: pulledSchoolAccounts
          } = result.data;

          isSyncingFromServerRef.current = true;

          if (Array.isArray(siswa)) {
            const clean = sanitizeStudentDates(siswa);
            setStudents(clean);
            localStorage.setItem(getStorageKey('dapodik_students'), JSON.stringify(clean));
          }
          if (Array.isArray(ptk)) {
            const clean = sanitizeTeacherDates(ptk);
            setTeachers(clean);
            localStorage.setItem(getStorageKey('dapodik_teachers'), JSON.stringify(clean));
          }
          if (Array.isArray(sarpras)) {
            setSarpras(sarpras);
            localStorage.setItem(getStorageKey('dapodik_sarpras'), JSON.stringify(sarpras));
          }
          if (Array.isArray(pulledKibB)) {
            const clean = cleanKibBItems(pulledKibB);
            
            // Perbarui state KIB B sesuai data spreadsheet yang ditarik
            // Jika baris dihapus dari spreadsheet, aplikasi akan mengikuti data spreadsheet sehingga data yang dihapus ikut terhapus di aplikasi
            setKibB(clean);
            kibBRef.current = clean;
            localStorage.setItem(getStorageKey('dapodik_kib_b'), JSON.stringify(clean));
          }
          if (Array.isArray(rapor)) {
            const clean = sanitizeReports(rapor);
            setReports(clean);
            localStorage.setItem(getStorageKey('dapodik_reports'), JSON.stringify(clean));
          }
          if (Array.isArray(administrator)) {
            const cleanAdmins = getCleanAdministrators(administrator);
            setAdministrators(cleanAdmins);
            localStorage.setItem('dapodik_administrators', JSON.stringify(cleanAdmins));
          }
          if (Array.isArray(notifikasi)) {
            const mergedNotifs = mergeNotifications(notificationsRef.current, notifikasi);
            setNotifications(mergedNotifs);
            notificationsRef.current = mergedNotifs;
            localStorage.setItem(getStorageKey('dapodik_notifications'), JSON.stringify(mergedNotifs));
          }
          if (Array.isArray(aplikasi)) {
            setAplikasiLinks(aplikasi);
            localStorage.setItem(getStorageKey('dapodik_aplikasi_links'), JSON.stringify(aplikasi));
          }
          if (Array.isArray(pulledSchoolAccounts) && pulledSchoolAccounts.length > 0) {
            setSchoolAccounts(pulledSchoolAccounts);
            localStorage.setItem('dapodik_school_accounts', JSON.stringify(pulledSchoolAccounts));
          }
          let pulledDisplayConfig = displayConfig;
          if (Array.isArray(pengaturan) && pengaturan.length > 0) {
            const newCfgObj: any = { ...displayConfig };
            pengaturan.forEach((item: any) => {
              if (item && item.key && item.value !== undefined && item.value !== '') {
                newCfgObj[item.key] = item.value;
              }
            });
            pulledDisplayConfig = newCfgObj;
            setDisplayConfig(newCfgObj);
            localStorage.setItem(getStorageKey('dapodik_display_config'), JSON.stringify(newCfgObj));
          }

          let pulledSchoolProfile = schoolProfile;
          if (Array.isArray(profilSekolah) && profilSekolah.length > 0) {
            const newProf: any = { ...schoolProfile };
            profilSekolah.forEach((item: any) => {
              if (item && item.key && item.value !== undefined && item.value !== '') {
                newProf[item.key] = item.value;
              }
            });
            const cleanProf = sanitizeSchoolProfileDates(newProf);
            pulledSchoolProfile = cleanProf;
            setSchoolProfile(cleanProf);
            localStorage.setItem(getStorageKey('dapodik_school_profile'), JSON.stringify(cleanProf));
          }

          if (Array.isArray(pulledBerkas) && pulledBerkas.length > 0) {
            localStorage.setItem('dapodik_school_files', JSON.stringify(pulledBerkas));
          }

          // Update server cache with updated displayConfig & schoolProfile
          saveCacheToServer(
            Array.isArray(siswa) ? siswa : students,
            Array.isArray(ptk) ? ptk : teachers,
            Array.isArray(sarpras) ? sarpras : sarpras,
            Array.isArray(rapor) ? rapor : reports,
            pulledDisplayConfig,
            pulledSchoolProfile,
            Array.isArray(administrator) ? administrator : administrators,
            Array.isArray(notifikasi) ? notifikasi : notificationsRef.current,
            Array.isArray(aplikasi) ? aplikasi : aplikasiLinks,
            getDeletedNotifIds(),
            Array.isArray(pulledSchoolAccounts) && pulledSchoolAccounts.length > 0 ? pulledSchoolAccounts : schoolAccounts,
            Array.isArray(pulledKibB) ? pulledKibB : kibB,
            Array.isArray(pulledBerkas) ? pulledBerkas : undefined
          );

          const nowStr = new Date().toLocaleString('id-ID');
          const updatedSyncCfg = { ...currentCfg, lastSynced: nowStr };
          setSyncConfig(updatedSyncCfg);
          localStorage.setItem(getStorageKey('dapodik_sync_config'), JSON.stringify(updatedSyncCfg));
          saveSyncConfigToServer(updatedSyncCfg);

          setTimeout(() => {
            isSyncingFromServerRef.current = false;
          }, 400);

          setIsSyncing(false);
          setHasSuccessfullyPulled(true);
          if (!silent) {
            showToast('Tarik Data Berhasil');
            try { confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } }); } catch (e) {}
          }
          return true;
        }
      } else {
        // No webAppUrl - newly registered school account!
        if (!isMainSchool) {
          isSyncingFromServerRef.current = true;
          setStudents([]);
          localStorage.setItem(getStorageKey('dapodik_students'), JSON.stringify([]));
          setTeachers([]);
          localStorage.setItem(getStorageKey('dapodik_teachers'), JSON.stringify([]));
          setSarpras([]);
          localStorage.setItem(getStorageKey('dapodik_sarpras'), JSON.stringify([]));
          setKibB([]);
          localStorage.setItem(getStorageKey('dapodik_kib_b'), JSON.stringify([]));
          setReports([]);
          localStorage.setItem(getStorageKey('dapodik_reports'), JSON.stringify([]));

          // Set default school profile using the registered school account info
          const activeSch = schoolAccounts.find(s => s.npsn === activeSchoolNpsn);
          if (activeSch) {
            const blankProfile: SchoolProfile = {
              npsn: activeSch.npsn,
              namaSekolah: activeSch.namaSekolah,
              bentukPendidikan: activeSch.bentukPendidikan || 'Sekolah Menengah Pertama (SMP)',
              statusSekolah: 'Swasta',
              alamat: activeSch.alamat || '',
              desaKelurahan: '',
              kecamatan: '',
              kabupatenKota: activeSch.kabupatenKota || '',
              provinsi: activeSch.provinsi || 'Sulawesi Tengah',
              kepalaSekolah: activeSch.kepalaSekolah || '',
              nipKepalaSekolah: activeSch.nipKepalaSekolah || '',
              pangkatGolongan: '',
              tmtMenjabat: '',
              logoSekolah: '',
              fotoKepalaSekolah: '',
              akreditasi: 'Belum Terakreditasi',
              kurikulum: 'Kurikulum Merdeka',
              luasTanah: '',
              luasBangunan: '',
              dayaTampung: '',
              jumlahRombel: '',
              keterangan: activeSch.catatan || ''
            };
            setSchoolProfile(blankProfile);
            localStorage.setItem(getStorageKey('dapodik_school_profile'), JSON.stringify(blankProfile));
          }

          setTimeout(() => {
            isSyncingFromServerRef.current = false;
          }, 400);
          setIsSyncing(false);
          return true;
        }
      }

      // Fallback: server cache (only for main school)
      if (isMainSchool) {
        const cacheRes = await fetch(getApiUrl(`/api/app-data?t=${Date.now()}`));
        setIsSyncing(false);
        if (cacheRes.ok) {
          const serverData = await cacheRes.json();
          if (serverData) {
            if (serverData.students && Array.isArray(serverData.students)) {
              const clean = sanitizeStudentDates(serverData.students);
              setStudents(clean);
              localStorage.setItem('dapodik_students', JSON.stringify(clean));
            }
            if (serverData.teachers && Array.isArray(serverData.teachers)) {
              const clean = sanitizeTeacherDates(serverData.teachers);
              setTeachers(clean);
              localStorage.setItem('dapodik_teachers', JSON.stringify(clean));
            }
            if (serverData.sarpras && Array.isArray(serverData.sarpras)) {
              setSarpras(serverData.sarpras);
              localStorage.setItem('dapodik_sarpras', JSON.stringify(serverData.sarpras));
            }
            if (serverData.kibB && Array.isArray(serverData.kibB)) {
              const clean = cleanKibBItems(serverData.kibB);
              setKibB(clean);
              localStorage.setItem('dapodik_kib_b', JSON.stringify(clean));
            }
            if (serverData.reports && Array.isArray(serverData.reports)) {
              const clean = sanitizeReports(serverData.reports);
              setReports(clean);
              localStorage.setItem('dapodik_reports', JSON.stringify(clean));
            }
            if (serverData.administrators && Array.isArray(serverData.administrators)) {
              const cleanAdmins = getCleanAdministrators(serverData.administrators);
              setAdministrators(cleanAdmins);
              localStorage.setItem('dapodik_administrators', JSON.stringify(cleanAdmins));
            }
            if (serverData.aplikasiLinks && Array.isArray(serverData.aplikasiLinks)) {
              setAplikasiLinks(serverData.aplikasiLinks);
              localStorage.setItem('dapodik_aplikasi_links', JSON.stringify(serverData.aplikasiLinks));
            }
            if (serverData.notifications && Array.isArray(serverData.notifications)) {
              setNotifications(serverData.notifications);
              notificationsRef.current = serverData.notifications;
              localStorage.setItem('dapodik_notifications', JSON.stringify(serverData.notifications));
            }
            if (serverData.displayConfig) {
              setDisplayConfig(serverData.displayConfig);
              localStorage.setItem('dapodik_display_config', JSON.stringify(serverData.displayConfig));
            }
            if (serverData.schoolProfile) {
              setSchoolProfile(serverData.schoolProfile);
              localStorage.setItem('dapodik_school_profile', JSON.stringify(serverData.schoolProfile));
            }
            if (serverData.schoolAccounts && Array.isArray(serverData.schoolAccounts)) {
              setSchoolAccounts(serverData.schoolAccounts);
              localStorage.setItem('dapodik_school_accounts', JSON.stringify(serverData.schoolAccounts));
            }
          }
          
          setHasSuccessfullyPulled(true);
          if (!silent) {
            showToast('Tarik Data Berhasil');
          }
          return true;
        }
      }
    } catch (e) {
      console.error(e);
    }
    setIsSyncing(false);
    if (!silent) {
      showToast('⚠️ Gagal memuat data dari Cloud Database.');
    }
    return false;
  };



  // Google Spreadsheet & Local Storage Initialization
  useEffect(() => {
    let isMounted = true;

    const initApp = async () => {
      try {
        // Load active shared sync config from server first to keep all devices/browsers synchronized
        try {
          let serverConfig = null;
          // 1. Try local endpoint first
          try {
            const configRes = await fetch(getApiUrl(`/api/sync-config?t=${Date.now()}`));
            if (configRes.ok) {
              const resJson = await configRes.json();
              if (resJson && resJson.webAppUrl && !resJson.webAppUrl.includes("AKfycbyhC26e6a4a0ORdBvnMCz7c1pDR0rQsGkcO_LfVKhxAZGYtBMGle4qbjZoNx6D_uT79")) {
                serverConfig = resJson;
              }
            }
          } catch (e) {
            console.warn('Local sync-config load skipped:', e);
          }

          // 2. Fallback to Central Shared Container if local is empty/default
          if (!serverConfig) {
            try {
              const sharedConfigRes = await fetch(`${SHARED_CONTAINER_URL}/api/sync-config?t=${Date.now()}`);
              if (sharedConfigRes.ok) {
                const resJson = await sharedConfigRes.json();
                if (resJson && resJson.webAppUrl) {
                  serverConfig = resJson;
                }
              }
            } catch (e) {
              console.warn('Central sync-config fallback skipped:', e);
            }
          }

          if (serverConfig && serverConfig.webAppUrl) {
            serverConfig.webAppUrl = normalizeWebAppUrl(serverConfig.webAppUrl);
            setSyncConfig(serverConfig);
            localStorage.setItem('dapodik_sync_config', JSON.stringify(serverConfig));
          }
        } catch (err) {
          console.warn('Failed to load shared sync-config from server:', err);
        }

        // Hydrate from server cache immediately so new browsers (like Mozilla or mobile) have data instantly
        try {
          const cacheRes = await fetch(getApiUrl(`/api/app-data?t=${Date.now()}`));
          if (cacheRes.ok) {
            const serverData = await cacheRes.json();
            if (serverData) {
              if (Array.isArray(serverData.students) && serverData.students.length > 0) {
                const clean = sanitizeStudentDates(serverData.students);
                setStudents(clean);
                localStorage.setItem('dapodik_students', JSON.stringify(clean));
              }
              if (Array.isArray(serverData.teachers) && serverData.teachers.length > 0) {
                const clean = sanitizeTeacherDates(serverData.teachers);
                setTeachers(clean);
                localStorage.setItem('dapodik_teachers', JSON.stringify(clean));
              }
              if (Array.isArray(serverData.sarpras) && serverData.sarpras.length > 0) {
                setSarpras(serverData.sarpras);
                localStorage.setItem('dapodik_sarpras', JSON.stringify(serverData.sarpras));
              }
              if (Array.isArray(serverData.kibB) && serverData.kibB.length > 0) {
                const clean = cleanKibBItems(serverData.kibB);
                setKibB(clean);
                localStorage.setItem('dapodik_kib_b', JSON.stringify(clean));
              }
              if (Array.isArray(serverData.reports) && serverData.reports.length > 0) {
                const clean = sanitizeReports(serverData.reports);
                setReports(clean);
                localStorage.setItem('dapodik_reports', JSON.stringify(clean));
              }
              if (Array.isArray(serverData.administrators) && serverData.administrators.length > 0) {
                const cleanAdmins = getCleanAdministrators(serverData.administrators);
                setAdministrators(cleanAdmins);
                localStorage.setItem('dapodik_administrators', JSON.stringify(cleanAdmins));
              }
              if (Array.isArray(serverData.aplikasiLinks) && serverData.aplikasiLinks.length > 0) {
                setAplikasiLinks(serverData.aplikasiLinks);
                localStorage.setItem('dapodik_aplikasi_links', JSON.stringify(serverData.aplikasiLinks));
              }
              if (Array.isArray(serverData.notifications) && serverData.notifications.length > 0) {
                setNotifications(serverData.notifications);
                notificationsRef.current = serverData.notifications;
                localStorage.setItem('dapodik_notifications', JSON.stringify(serverData.notifications));
              }
              if (Array.isArray(serverData.customFolders) && serverData.customFolders.length > 0) {
                setCustomFolders(serverData.customFolders);
              }
              if (Array.isArray(serverData.schoolAccounts) && serverData.schoolAccounts.length > 0) {
                setSchoolAccounts(serverData.schoolAccounts);
                localStorage.setItem('dapodik_school_accounts', JSON.stringify(serverData.schoolAccounts));
              }
              if (Array.isArray(serverData.schoolFiles) && serverData.schoolFiles.length > 0) {
                localStorage.setItem('dapodik_school_files', JSON.stringify(serverData.schoolFiles));
              }
              if (serverData.displayConfig) {
                setDisplayConfig(serverData.displayConfig);
                localStorage.setItem('dapodik_display_config', JSON.stringify(serverData.displayConfig));
              }
              if (serverData.schoolProfile) {
                setSchoolProfile(serverData.schoolProfile);
                localStorage.setItem('dapodik_school_profile', JSON.stringify(serverData.schoolProfile));
              }
            }
          }
        } catch (e) {}

        // Pulling is now handled centrally by the activeSchoolNpsn useEffect below
      } catch (err) {
        console.error('Failed to init app state:', err);
      } finally {
        if (isMounted) setIsInitialized(true);
      }
    };

    initApp();

    return () => {
      isMounted = false;
    };
  }, []);

  // Pull data automatically whenever activeSchoolNpsn changes or once initialized
  useEffect(() => {
    if (!isInitialized) return;
    loadSchoolWorkspaceData(activeSchoolNpsn);
    handlePullFromSheets(true);
  }, [activeSchoolNpsn, isInitialized]);

  // Periodic 2-way background polling from Google Sheets (every 60 seconds)
  useEffect(() => {
    if (!isInitialized) return;
    const interval = setInterval(async () => {
      if (document.visibilityState !== 'visible') return;

      // 1. Check if sync-config has been updated on the server by another device
      try {
        let serverConfig = null;
        try {
          const configRes = await fetch(getApiUrl(`/api/sync-config?t=${Date.now()}`));
          if (configRes.ok) {
            const resJson = await configRes.json();
            if (resJson && resJson.webAppUrl && !resJson.webAppUrl.includes("AKfycbyhC26e6a4a0ORdBvnMCz7c1pDR0rQsGkcO_LfVKhxAZGYtBMGle4qbjZoNx6D_uT79")) {
              serverConfig = resJson;
            }
          }
        } catch (e) {}

        if (!serverConfig) {
          try {
            const sharedConfigRes = await fetch(`${SHARED_CONTAINER_URL}/api/sync-config?t=${Date.now()}`);
            if (sharedConfigRes.ok) {
              const resJson = await sharedConfigRes.json();
              if (resJson && resJson.webAppUrl) {
                serverConfig = resJson;
              }
            }
          } catch (e) {}
        }

        if (serverConfig && serverConfig.webAppUrl) {
          const currentCfgStr = JSON.stringify(syncConfigRef.current);
          const serverCfgStr = JSON.stringify(serverConfig);
          if (currentCfgStr !== serverCfgStr) {
            setSyncConfig(serverConfig);
            localStorage.setItem('dapodik_sync_config', JSON.stringify(serverConfig));
          }
        }
      } catch (err) {
        console.warn('Failed to poll updated sync-config from server:', err);
      }

      // 2. Poll sheet data
      const currentCfg = getEffectiveSyncConfig();
      if (currentCfg && currentCfg.webAppUrl) {
        handlePullFromSheets(true);
      }
    }, 45000);

    const handleWindowFocus = () => {
      if (document.visibilityState === 'visible') {
        const currentCfg = getEffectiveSyncConfig();
        if (currentCfg && currentCfg.webAppUrl) {
          handlePullFromSheets(true);
        }
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleWindowFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleWindowFocus);
    };
  }, [isInitialized, activeSchoolNpsn]);











  // Keyboard shortcut ⌘K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Build settings payload for Google Sheets Data_Pengaturan
  const buildPengaturanPayload = (dConfig = displayConfig, sProfile = schoolProfile) => {
    return [
      { key: 'appName', value: dConfig.appName },
      { key: 'appVersion', value: dConfig.appVersion },
      { key: 'appSubtitle', value: dConfig.appSubtitle },
      { key: 'logoCustomUrl', value: dConfig.logoCustomUrl || sProfile.logoSekolah || '' },
      { key: 'logoSekolah', value: sProfile.logoSekolah || dConfig.logoCustomUrl || '' },
      { key: 'welcomeGreeting', value: dConfig.welcomeGreeting },
      { key: 'welcomeTitle', value: dConfig.welcomeTitle },
      { key: 'welcomeSubtitle', value: dConfig.welcomeSubtitle },
      { key: 'welcomeIconType', value: dConfig.welcomeIconType || 'school' },
      { key: 'welcomeCustomIconUrl', value: dConfig.welcomeCustomIconUrl || '' },
      { key: 'curriculumBadge', value: dConfig.curriculumBadge },
      { key: 'curriculumBadgeIcon', value: dConfig.curriculumBadgeIcon || 'check' },
      { key: 'footerVersionText', value: dConfig.footerVersionText },
      { key: 'operatorTitle', value: dConfig.operatorTitle || 'Operator Sekolah' },
      { key: 'operatorName', value: dConfig.operatorName || sProfile.operatorSekolah || sProfile.namaSekolah || '' },
      { key: 'operatorAvatarUrl', value: dConfig.operatorAvatarUrl || '' },
      // 1. Identitas & Legalitas
      { key: 'npsn', value: sProfile.npsn || '' },
      { key: 'namaSekolah', value: sProfile.namaSekolah || '' },
      { key: 'bentukPendidikan', value: sProfile.bentukPendidikan || '' },
      { key: 'statusSekolah', value: sProfile.statusSekolah || '' },
      { key: 'akreditasi', value: sProfile.akreditasi || '' },
      { key: 'kurikulum', value: sProfile.kurikulum || '' },
      { key: 'skPendirian', value: sProfile.skPendirian || '' },
      { key: 'tanggalSkPendirian', value: sProfile.tanggalSkPendirian || '' },
      { key: 'skIzinOperasional', value: sProfile.skIzinOperasional || '' },
      { key: 'tanggalSkIzinOperasional', value: sProfile.tanggalSkIzinOperasional || '' },
      { key: 'statusKepemilikan', value: sProfile.statusKepemilikan || '' },
      { key: 'namaYayasan', value: sProfile.namaYayasan || '' },
      // 2. Lokasi & Kontak
      { key: 'alamat', value: sProfile.alamat || '' },
      { key: 'rtRwDusun', value: sProfile.rtRwDusun || '' },
      { key: 'desaKelurahan', value: sProfile.desaKelurahan || '' },
      { key: 'kecamatan', value: sProfile.kecamatan || '' },
      { key: 'kabupatenKota', value: sProfile.kabupatenKota || '' },
      { key: 'provinsi', value: sProfile.provinsi || '' },
      { key: 'kodePos', value: sProfile.kodePos || '' },
      { key: 'telepon', value: sProfile.telepon || '' },
      { key: 'email', value: sProfile.email || '' },
      { key: 'website', value: sProfile.website || '' },
      { key: 'dayaListrik', value: sProfile.dayaListrik || '' },
      { key: 'aksesInternet', value: sProfile.aksesInternet || '' },
      // 3. Pimpinan & Manajemen
      { key: 'kepalaSekolah', value: sProfile.kepalaSekolah || '' },
      { key: 'nipKepalaSekolah', value: sProfile.nipKepalaSekolah || '' },
      { key: 'pangkatGolongan', value: sProfile.pangkatGolongan || 'Pembina Tk. I / IV-b' },
      { key: 'tmtMenjabat', value: sProfile.tmtMenjabat || '01 Juli 2021' },
      { key: 'fotoKepalaSekolah', value: sProfile.fotoKepalaSekolah || '' },
      { key: 'operatorSekolah', value: sProfile.operatorSekolah || '' },
      { key: 'bendaharaBos', value: sProfile.bendaharaBos || '' },
      { key: 'komiteSekolah', value: sProfile.komiteSekolah || '' },
      // 4. Visi & Misi
      { key: 'visi', value: sProfile.visi || '' },
      { key: 'misi', value: Array.isArray(sProfile.misi) ? JSON.stringify(sProfile.misi) : (sProfile.misi || '') },
      // 5. Rekapitulasi & Sarana
      { key: 'luasTanah', value: sProfile.luasTanah || '' },
      { key: 'luasBangunan', value: sProfile.luasBangunan || '' },
      { key: 'dayaTampung', value: sProfile.dayaTampung || '' },
      { key: 'jumlahRombel', value: sProfile.jumlahRombel || '' },
      { key: 'keterangan', value: sProfile.keterangan || '' }
    ];
  };

  const buildProfilSekolahPayload = (sProfile = schoolProfile) => {
    return [
      { key: 'npsn', value: sProfile.npsn || '' },
      { key: 'namaSekolah', value: sProfile.namaSekolah || '' },
      { key: 'bentukPendidikan', value: sProfile.bentukPendidikan || '' },
      { key: 'statusSekolah', value: sProfile.statusSekolah || '' },
      { key: 'logoSekolah', value: sProfile.logoSekolah || '' },
      { key: 'alamat', value: sProfile.alamat || '' },
      { key: 'rtRwDusun', value: sProfile.rtRwDusun || '' },
      { key: 'desaKelurahan', value: sProfile.desaKelurahan || '' },
      { key: 'kecamatan', value: sProfile.kecamatan || '' },
      { key: 'kabupatenKota', value: sProfile.kabupatenKota || '' },
      { key: 'provinsi', value: sProfile.provinsi || '' },
      { key: 'kepalaSekolah', value: sProfile.kepalaSekolah || '' },
      { key: 'nipKepalaSekolah', value: sProfile.nipKepalaSekolah || '' },
      { key: 'pangkatGolongan', value: sProfile.pangkatGolongan || '' },
      { key: 'tmtMenjabat', value: sProfile.tmtMenjabat || '' },
      { key: 'fotoKepalaSekolah', value: sProfile.fotoKepalaSekolah || '' },
      { key: 'akreditasi', value: sProfile.akreditasi || '' },
      { key: 'kurikulum', value: sProfile.kurikulum || '' },
      { key: 'kodePos', value: sProfile.kodePos || '' },
      { key: 'telepon', value: sProfile.telepon || '' },
      { key: 'email', value: sProfile.email || '' },
      { key: 'website', value: sProfile.website || '' },
      { key: 'skPendirian', value: sProfile.skPendirian || '' },
      { key: 'tanggalSkPendirian', value: sProfile.tanggalSkPendirian || '' },
      { key: 'skIzinOperasional', value: sProfile.skIzinOperasional || '' },
      { key: 'tanggalSkIzinOperasional', value: sProfile.tanggalSkIzinOperasional || '' },
      { key: 'statusKepemilikan', value: sProfile.statusKepemilikan || '' },
      { key: 'namaYayasan', value: sProfile.namaYayasan || '' },
      { key: 'operatorSekolah', value: sProfile.operatorSekolah || '' },
      { key: 'bendaharaBos', value: sProfile.bendaharaBos || '' },
      { key: 'komiteSekolah', value: sProfile.komiteSekolah || '' },
      { key: 'luasTanah', value: sProfile.luasTanah || '' },
      { key: 'luasBangunan', value: sProfile.luasBangunan || '' },
      { key: 'dayaListrik', value: sProfile.dayaListrik || '' },
      { key: 'aksesInternet', value: sProfile.aksesInternet || '' },
      { key: 'dayaTampung', value: sProfile.dayaTampung || '' },
      { key: 'jumlahRombel', value: sProfile.jumlahRombel || '' },
      { key: 'keterangan', value: sProfile.keterangan || '' },
      { key: 'visi', value: sProfile.visi || '' },
      { key: 'misi', value: Array.isArray(sProfile.misi) ? JSON.stringify(sProfile.misi) : (sProfile.misi || '') }
    ];
  };

  const buildAplikasiPayload = () => {
    if (Array.isArray(aplikasiLinks)) {
      return aplikasiLinks;
    }
    const saved = localStorage.getItem('dapodik_aplikasi_links');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        // Fallback default
      }
    }
    return [...defaultAplikasiLinks, ...defaultOtherAplikasiLinks];
  };

  // Real-time Cloud Sync Trigger:
  // Data perubahan masuk terlebih dahulu ke database spreadsheet, lalu notifikasinya disinkronkan
  const triggerAutoSync = async (
    customStudents = students,
    customTeachers = teachers,
    customSarpras = sarpras,
    customReports = reports,
    customDisplayConfig = displayConfig,
    customSchoolProfile = schoolProfile,
    customAdministrators = administrators,
    force = false,
    customNotifications = notificationsRef.current,
    pendingNotification?: {
      title: string;
      message: string;
      type?: 'info' | 'success' | 'warning' | 'error';
    },
    customAplikasiLinks = aplikasiLinks,
    customSchoolAccounts = schoolAccounts,
    customKibB = kibB,
    skipSheetsSync = false
  ) => {
    // Persiapkan notifikasi terbaru jika ada pendingNotification
    let activeNotifs = customNotifications || [];
    if (pendingNotification) {
      activeNotifs = addNotification(
        pendingNotification.title,
        pendingNotification.message,
        pendingNotification.type || 'info'
      );
    }

    const currentAplikasi = customAplikasiLinks || aplikasiLinks;

    // Safeguard: Cegah penghapusan database Spreadsheet jika data lokal masih kosong dan belum berhasil ditarik dari Sheets
    let effectiveSkipSheetsSync = skipSheetsSync;
    if (!effectiveSkipSheetsSync) {
      const isLocalStateEmpty = (customStudents.length === 0 && customTeachers.length === 0 && customSarpras.length === 0 && customKibB.length === 0);
      if (isLocalStateEmpty && !hasSuccessfullyPulled && !force) {
        console.warn("[Safeguard] Sinkronisasi ke Spreadsheet dibatalkan karena data lokal masih kosong dan belum berhasil menarik data dari Cloud Database.");
        effectiveSkipSheetsSync = true;
      }
    }

    // Data tersimpan di localStorage & Google Sheets via triggerAutoSync di bawah

    // Simpan seluruh data & notifikasi terbaru ke server cache untuk sinkronisasi multi-perangkat
    saveCacheToServer(
      customStudents,
      customTeachers,
      customSarpras,
      customReports,
      customDisplayConfig,
      customSchoolProfile,
      customAdministrators,
      activeNotifs,
      currentAplikasi,
      getDeletedNotifIds(),
      customSchoolAccounts,
      customKibB
    );

    // Otomatis simpan & sync perubahan ke Google Spreadsheet
    const currentCfg = getEffectiveSyncConfig();
    if (!effectiveSkipSheetsSync && currentCfg && currentCfg.webAppUrl && currentCfg.autoSync !== false) {
      const pengaturanArray = Object.entries(customDisplayConfig || {}).map(([key, value]) => ({
        key,
        value: value !== undefined && value !== null ? String(value) : ''
      }));
      const profilSekolahArray = Object.entries(customSchoolProfile || {}).map(([key, value]) => ({
        key,
        value: value !== undefined && value !== null ? String(value) : ''
      }));

      syncToGoogleSheets(currentCfg, {
        siswa: customStudents,
        ptk: customTeachers,
        sarpras: customSarpras,
        kibB: customKibB,
        rapor: customReports,
        pengaturan: pengaturanArray,
        profilSekolah: profilSekolahArray,
        administrator: customAdministrators,
        notifikasi: activeNotifs,
        aplikasi: currentAplikasi,
        schoolAccounts: customSchoolAccounts
      }).then(res => {
        if (res && res.success) {
          const nowStr = new Date().toLocaleString('id-ID');
          setSyncConfig(prev => {
            const updated = { ...prev, lastSynced: nowStr };
            localStorage.setItem('dapodik_sync_config', JSON.stringify(updated));
            saveSyncConfigToServer(updated);
            return updated;
          });
        }
      }).catch(err => {
        console.error('Auto sync to Google Sheets failed:', err);
      });
    }

    if (force) {
      showToast('Sinkron Selesai');
    }
  };

  const handleManualSync = async () => {
    return handlePullFromSheets(false);
  };

  const handlePushToSheets = async () => {
    setIsSyncing(true);
    showToast('Mengirim seluruh data aplikasi ke database Google Spreadsheet...');
    try {
      const currentCfg = getEffectiveSyncConfig();
      if (!currentCfg || !currentCfg.webAppUrl) {
        showToast('URL Google Apps Script belum diisi di menu Pengaturan / Database Cloud.');
        setIsSyncing(false);
        return false;
      }

      const pengaturanArray = Object.entries(displayConfig || {}).map(([key, value]) => ({
        key,
        value: value !== undefined && value !== null ? String(value) : ''
      }));
      const profilSekolahArray = Object.entries(schoolProfile || {}).map(([key, value]) => ({
        key,
        value: value !== undefined && value !== null ? String(value) : ''
      }));

      const res = await syncToGoogleSheets(currentCfg, {
        siswa: students,
        ptk: teachers,
        sarpras: sarpras,
        kibB: kibB,
        rapor: reports,
        pengaturan: pengaturanArray,
        profilSekolah: profilSekolahArray,
        administrator: administrators,
        notifikasi: notificationsRef.current,
        aplikasi: aplikasiLinks,
        schoolAccounts: schoolAccounts
      });

      if (res && res.success) {
        const nowStr = new Date().toLocaleString('id-ID');
        const updated = { ...currentCfg, lastSynced: nowStr };
        setSyncConfig(updated);
        localStorage.setItem(getStorageKey('dapodik_sync_config'), JSON.stringify(updated));
        saveSyncConfigToServer(updated);
        showToast('Sinkronisasi Berhasil: Seluruh data perubahan aplikasi berhasil dikirim ke Google Spreadsheet!');
        try { (window as any).confetti?.({ particleCount: 50, spread: 60, origin: { y: 0.7 } }); } catch (e) {}
        return true;
      } else {
        showToast(res?.message || 'Gagal mengirim data ke Google Spreadsheet.');
        return false;
      }
    } catch (err: any) {
      showToast(`Gagal sinkronisasi ke Spreadsheet: ${err?.message || 'Terjadi kesalahan'}`);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearOfflineCache = () => {
    localStorage.removeItem('dapodik_students');
    localStorage.removeItem('dapodik_teachers');
    localStorage.removeItem('dapodik_sarpras');
    localStorage.removeItem('dapodik_reports');
    setStudents([]);
    setTeachers([]);
    setSarpras([]);
    setReports([]);
    saveCacheToServer(
      [],
      [],
      [],
      [],
      displayConfig,
      schoolProfile,
      administrators,
      notificationsRef.current,
      aplikasiLinks,
      getDeletedNotifIds()
    );
    showToast('Seluruh cache data offline (Siswa, PTK, Sarpras, Rapor) berhasil dibersihkan permanen!');
  };

  const handleSaveAplikasiLinks = (newLinks: any[]) => {
    lastLocalMutationRef.current = Date.now();
    setAplikasiLinks(newLinks);
    localStorage.setItem('dapodik_aplikasi_links', JSON.stringify(newLinks));

    triggerAutoSync(
      students,
      teachers,
      sarpras,
      reports,
      displayConfig,
      schoolProfile,
      administrators,
      true,
      notificationsRef.current,
      {
        title: 'Update Pintasan Dapodik',
        message: 'Pengaturan tautan pintasan berhasil diperbarui dan tersimpan di database.',
        type: 'success'
      },
      newLinks
    );
  };

  const handleSaveDisplayConfig = (newConfig: AppDisplayConfig) => {
    lastLocalMutationRef.current = Date.now();
    let finalLogo = displayConfig.logoCustomUrl || schoolProfile.logoSekolah || '';
    if (newConfig.logoCustomUrl !== displayConfig.logoCustomUrl) {
      finalLogo = newConfig.logoCustomUrl || '';
    }
    const updatedProfile = { ...schoolProfile, logoSekolah: finalLogo };
    const updatedDisplay = { ...newConfig, logoCustomUrl: finalLogo };

    setDisplayConfig(updatedDisplay);
    setSchoolProfile(updatedProfile);
    localStorage.setItem('dapodik_display_config', JSON.stringify(updatedDisplay));
    localStorage.setItem('dapodik_school_profile', JSON.stringify(updatedProfile));
    showToast('Teks & tampilan disimpan...');
    triggerAutoSync(
      students,
      teachers,
      sarpras,
      reports,
      updatedDisplay,
      updatedProfile,
      administrators,
      true,
      notificationsRef.current,
      {
        title: 'Update Tampilan Beranda',
        message: 'Pengaturan teks dan tampilan beranda berhasil diperbarui di database.',
        type: 'info'
      }
    );
  };

  const handleSaveSchoolProfile = (newProfile: SchoolProfile) => {
    lastLocalMutationRef.current = Date.now();
    let finalLogo = displayConfig.logoCustomUrl || schoolProfile.logoSekolah || '';
    if (newProfile.logoSekolah !== schoolProfile.logoSekolah) {
      finalLogo = newProfile.logoSekolah || '';
    }
    const updatedProfile = { ...newProfile, logoSekolah: finalLogo };
    const updatedDisplay = { ...displayConfig, logoCustomUrl: finalLogo };

    setSchoolProfile(updatedProfile);
    setDisplayConfig(updatedDisplay);
    localStorage.setItem('dapodik_school_profile', JSON.stringify(updatedProfile));
    localStorage.setItem('dapodik_display_config', JSON.stringify(updatedDisplay));
    showToast('Profil sekolah disimpan...');
    triggerAutoSync(
      students,
      teachers,
      sarpras,
      reports,
      updatedDisplay,
      updatedProfile,
      administrators,
      true,
      notificationsRef.current,
      {
        title: 'Update Profil Sekolah',
        message: 'Data Profil Satuan Pendidikan berhasil diperbarui di database.',
        type: 'info'
      }
    );
  };

  const handleSaveAllSettings = (newConfig: AppDisplayConfig, newProfile: SchoolProfile) => {
    lastLocalMutationRef.current = Date.now();
    let finalLogo = displayConfig.logoCustomUrl || schoolProfile.logoSekolah || '';
    
    if (newProfile.logoSekolah !== schoolProfile.logoSekolah) {
      finalLogo = newProfile.logoSekolah || '';
    } else if (newConfig.logoCustomUrl !== displayConfig.logoCustomUrl) {
      finalLogo = newConfig.logoCustomUrl || '';
    } else if (newProfile.logoSekolah !== newConfig.logoCustomUrl) {
      finalLogo = newProfile.logoSekolah || newConfig.logoCustomUrl || '';
    }

    const updatedProfile = sanitizeSchoolProfileDates({ ...newProfile, logoSekolah: finalLogo });
    const updatedDisplay = { ...newConfig, logoCustomUrl: finalLogo };

    setDisplayConfig(updatedDisplay);
    setSchoolProfile(updatedProfile);
    localStorage.setItem('dapodik_display_config', JSON.stringify(updatedDisplay));
    localStorage.setItem('dapodik_school_profile', JSON.stringify(updatedProfile));
    
    showToast('Semua pengaturan dan profil sekolah berhasil disimpan...');
    triggerAutoSync(
      students,
      teachers,
      sarpras,
      reports,
      updatedDisplay,
      updatedProfile,
      administrators,
      true,
      notificationsRef.current,
      {
        title: 'Update Pengaturan Sistem',
        message: 'Seluruh konfigurasi aplikasi dan profil sekolah telah disinkronkan ke database.',
        type: 'success'
      }
    );
  };

  // Student Handlers
  const handleAddStudent = (std: Student) => {
    lastLocalMutationRef.current = Date.now();
    const updated = sanitizeStudentDates([std, ...students]);
    setStudents(updated);
    localStorage.setItem('dapodik_students', JSON.stringify(updated));
    showToast(`Siswa "${std.nama}" ditambahkan...`);
    triggerAutoSync(
      updated,
      teachers,
      sarpras,
      reports,
      displayConfig,
      schoolProfile,
      administrators,
      true,
      notificationsRef.current,
      {
        title: 'Penambahan Data Siswa',
        message: `Siswa baru "${std.nama}" (NISN: ${std.nisn || '-'}) berhasil disimpan ke database.`,
        type: 'success'
      }
    );
  };

  const handleUpdateStudent = (std: Student) => {
    lastLocalMutationRef.current = Date.now();
    const updated = sanitizeStudentDates(students.map(s => s.id === std.id ? std : s));
    setStudents(updated);
    localStorage.setItem('dapodik_students', JSON.stringify(updated));
    showToast(`Data siswa "${std.nama}" diperbarui...`);
    triggerAutoSync(
      updated,
      teachers,
      sarpras,
      reports,
      displayConfig,
      schoolProfile,
      administrators,
      true,
      notificationsRef.current,
      {
        title: 'Pembaruan Data Siswa',
        message: `Data siswa "${std.nama}" berhasil diperbarui di database.`,
        type: 'info'
      }
    );
  };

  const handleDeleteStudent = (id: string) => {
    lastLocalMutationRef.current = Date.now();
    const std = students.find(s => s.id === id);
    const updated = sanitizeStudentDates(students.filter(s => s.id !== id));
    setStudents(updated);
    localStorage.setItem('dapodik_students', JSON.stringify(updated));
    showToast('Data siswa dihapus...');
    triggerAutoSync(
      updated,
      teachers,
      sarpras,
      reports,
      displayConfig,
      schoolProfile,
      administrators,
      true,
      notificationsRef.current,
      {
        title: 'Penghapusan Data Siswa',
        message: `Data siswa "${std?.nama || 'Siswa'}" berhasil dihapus dari database.`,
        type: 'warning'
      }
    );
  };

  const handleMoveToStudentKeluar = (studentId: string, reason: 'Mutasi' | 'Putus sekolah' | 'Wafat/Meninggal' | 'Dikeluarkan' | 'Mengundurkan diri') => {
    lastLocalMutationRef.current = Date.now();
    const targetStudent = students.find(s => s.id === studentId);
    const updated = sanitizeStudentDates(students.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          status: reason as any,
          alasanKeluar: reason
        };
      }
      return s;
    }));
    setStudents(updated);
    localStorage.setItem('dapodik_students', JSON.stringify(updated));
    showToast(`Berhasil memindahkan siswa ke Data Siswa Keluar (${reason})`);
    triggerAutoSync(
      updated,
      teachers,
      sarpras,
      reports,
      displayConfig,
      schoolProfile,
      administrators,
      true,
      notificationsRef.current,
      {
        title: 'Siswa Keluar / Mutasi',
        message: `Siswa "${targetStudent?.nama || 'Siswa'}" berhasil dipindahkan ke Data Siswa Keluar (${reason}).`,
        type: 'warning'
      }
    );
  };

  const handleDeleteStudentKeluar = (id: string) => {
    handleDeleteStudent(id);
  };

  const handleRestoreStudent = (studentId: string) => {
    lastLocalMutationRef.current = Date.now();
    const targetStudent = students.find(s => s.id === studentId);
    const updated = sanitizeStudentDates(students.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          status: 'Aktif' as any,
          alasanKeluar: '',
          tahunLulus: undefined
        };
      }
      return s;
    }));
    setStudents(updated);
    localStorage.setItem('dapodik_students', JSON.stringify(updated));
    showToast('Berhasil menarik siswa kembali ke Data Siswa Aktif');
    triggerAutoSync(
      updated,
      teachers,
      sarpras,
      reports,
      displayConfig,
      schoolProfile,
      administrators,
      true,
      notificationsRef.current,
      {
        title: 'Siswa Dikembalikan',
        message: `Siswa "${targetStudent?.nama || 'Siswa'}" berhasil ditarik kembali ke Data Siswa Aktif.`,
        type: 'info'
      }
    );
  };

  const handleGraduateStudent = (studentId: string, tahunLulus: string, noSeriIjazah?: string) => {
    lastLocalMutationRef.current = Date.now();
    const targetStudent = students.find(s => s.id === studentId);
    const updated = sanitizeStudentDates(students.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          status: 'Lulus' as any,
          alasanKeluar: 'Lulus',
          tahunLulus: tahunLulus,
          ...(noSeriIjazah ? { noSeriIjazah } : {})
        };
      }
      return s;
    }));
    setStudents(updated);
    localStorage.setItem('dapodik_students', JSON.stringify(updated));
    showToast(`🎓 Siswa "${targetStudent?.nama || 'Siswa'}" berhasil dipindahkan ke Menu Alumni (Tahun Lulus: ${tahunLulus})`);
    triggerAutoSync(
      updated,
      teachers,
      sarpras,
      reports,
      displayConfig,
      schoolProfile,
      administrators,
      true,
      notificationsRef.current,
      {
        title: 'Siswa Lulus / Alumni',
        message: `Siswa "${targetStudent?.nama || 'Siswa'}" berhasil diluluskan (Alumni ${tahunLulus}).`,
        type: 'success'
      }
    );
  };

  const handleImportStudents = (imported: Student[], append: boolean) => {
    lastLocalMutationRef.current = Date.now();
    let updated: Student[];
    if (append) {
      const existingIds = new Set(students.map(s => s.id));
      const filtered = imported.filter(s => !existingIds.has(s.id));
      updated = sanitizeStudentDates([...filtered, ...students]);
    } else {
      updated = sanitizeStudentDates([...imported]);
    }
    setStudents(updated);
    localStorage.setItem('dapodik_students', JSON.stringify(updated));
    showToast('Tersimpan');
    triggerAutoSync(
      updated,
      teachers,
      sarpras,
      reports,
      displayConfig,
      schoolProfile,
      administrators,
      true,
      notificationsRef.current,
      {
        title: 'Impor Data Siswa',
        message: `Berhasil mengimpor ${imported.length} data siswa baru ke database.`,
        type: 'success'
      }
    );
  };

  // Teacher Handlers
  const handleAddTeacher = (t: TeacherStaff) => {
    lastLocalMutationRef.current = Date.now();
    const updated = sanitizeTeacherDates([t, ...teachers]);
    setTeachers(updated);
    localStorage.setItem('dapodik_teachers', JSON.stringify(updated));
    showToast(`PTK "${t.nama}" ditambahkan...`);
    triggerAutoSync(
      students,
      updated,
      sarpras,
      reports,
      displayConfig,
      schoolProfile,
      administrators,
      true,
      notificationsRef.current,
      {
        title: 'Penambahan PTK/Guru',
        message: `PTK/Guru baru "${t.nama}" berhasil disimpan ke database.`,
        type: 'success'
      }
    );
  };

  const handleUpdateTeacher = (t: TeacherStaff) => {
    lastLocalMutationRef.current = Date.now();
    const updated = sanitizeTeacherDates(teachers.map(tc => tc.id === t.id ? t : tc));
    setTeachers(updated);
    localStorage.setItem('dapodik_teachers', JSON.stringify(updated));
    showToast(`Data PTK "${t.nama}" diperbarui...`);
    triggerAutoSync(
      students,
      updated,
      sarpras,
      reports,
      displayConfig,
      schoolProfile,
      administrators,
      true,
      notificationsRef.current,
      {
        title: 'Pembaruan PTK/Guru',
        message: `Data PTK "${t.nama}" berhasil diperbarui di database.`,
        type: 'info'
      }
    );
  };

  const handleDeleteTeacher = (id: string) => {
    lastLocalMutationRef.current = Date.now();
    const target = teachers.find(t => t.id === id);
    const updated = sanitizeTeacherDates(teachers.filter(t => t.id !== id));
    setTeachers(updated);
    localStorage.setItem('dapodik_teachers', JSON.stringify(updated));
    showToast('Data PTK dihapus...');
    triggerAutoSync(
      students,
      updated,
      sarpras,
      reports,
      displayConfig,
      schoolProfile,
      administrators,
      true,
      notificationsRef.current,
      {
        title: 'Penghapusan PTK/Guru',
        message: `Data PTK "${target?.nama || 'Guru'}" telah dihapus dari database.`,
        type: 'warning'
      }
    );
  };

  const handleImportTeachers = (imported: TeacherStaff[], append: boolean) => {
    lastLocalMutationRef.current = Date.now();
    let updated: TeacherStaff[];
    if (append) {
      const existingIds = new Set(teachers.map(t => t.id));
      const filtered = imported.filter(t => !existingIds.has(t.id));
      updated = sanitizeTeacherDates([...filtered, ...teachers]);
    } else {
      updated = sanitizeTeacherDates([...imported]);
    }
    setTeachers(updated);
    localStorage.setItem('dapodik_teachers', JSON.stringify(updated));
    showToast('Tersimpan');
    triggerAutoSync(
      students,
      updated,
      sarpras,
      reports,
      displayConfig,
      schoolProfile,
      administrators,
      true,
      notificationsRef.current,
      {
        title: 'Impor Data PTK',
        message: `Berhasil mengimpor ${imported.length} data PTK ke database.`,
        type: 'success'
      }
    );
  };

  // Sarpras Handlers
  const handleAddSarpras = (s: SarprasItem) => {
    lastLocalMutationRef.current = Date.now();
    const updated = [s, ...sarpras];
    setSarpras(updated);
    localStorage.setItem('dapodik_sarpras', JSON.stringify(updated));
    showToast(`Sarpras "${s.namaBarang}" ditambahkan...`);
    triggerAutoSync(
      students,
      teachers,
      updated,
      reports,
      displayConfig,
      schoolProfile,
      administrators,
      true,
      notificationsRef.current,
      {
        title: 'Penambahan Sarpras',
        message: `Sarpras "${s.namaBarang}" berhasil disimpan ke database.`,
        type: 'success'
      }
    );
  };

  const handleUpdateSarpras = (s: SarprasItem) => {
    lastLocalMutationRef.current = Date.now();
    const updated = sarpras.map(sp => sp.id === s.id ? s : sp);
    setSarpras(updated);
    localStorage.setItem('dapodik_sarpras', JSON.stringify(updated));
    showToast(`Data sarpras "${s.namaBarang}" diperbarui...`);
    triggerAutoSync(
      students,
      teachers,
      updated,
      reports,
      displayConfig,
      schoolProfile,
      administrators,
      true,
      notificationsRef.current,
      {
        title: 'Pembaruan Sarpras',
        message: `Data sarpras "${s.namaBarang}" berhasil diperbarui di database.`,
        type: 'info'
      }
    );
  };

  const handleDeleteSarpras = (id: string) => {
    lastLocalMutationRef.current = Date.now();
    const target = sarpras.find(s => s.id === id);
    const updated = sarpras.filter(s => s.id !== id);
    setSarpras(updated);
    localStorage.setItem('dapodik_sarpras', JSON.stringify(updated));
    showToast('Data sarpras dihapus...');
    triggerAutoSync(
      students,
      teachers,
      updated,
      reports,
      displayConfig,
      schoolProfile,
      administrators,
      true,
      notificationsRef.current,
      {
        title: 'Penghapusan Sarpras',
        message: `Data sarana & prasarana "${target?.namaBarang || 'Item'}" dihapus dari database.`,
        type: 'warning'
      }
    );
  };

  // KIB B Handlers (Peralatan dan Mesin)
  const handleAddKibB = (item: KibBItem) => {
    lastLocalMutationRef.current = Date.now();
    const updated = [item, ...kibB];
    setKibB(updated);
    kibBRef.current = updated;
    localStorage.setItem(getStorageKey('dapodik_kib_b'), JSON.stringify(updated));
    showToast(`Menyimpan barang KIB B "${item.namaBarang}" ke database & Spreadsheet...`);

    // Auto-sync ke server cache & Google Sheets menggunakan Sinkronisasi Penuh
    triggerAutoSync(
      students,
      teachers,
      sarpras,
      reports,
      displayConfig,
      schoolProfile,
      administrators,
      true, // force = true
      notificationsRef.current,
      {
        title: 'Penambahan KIB B',
        message: `Barang baru "${item.namaBarang}" berhasil ditambahkan ke KIB B.`,
        type: 'success'
      },
      aplikasiLinks,
      schoolAccounts,
      updated,
      false // skipSheetsSync = false (lakukan sinkronisasi penuh ke spreadsheet)
    );
  };

  const handleUpdateKibB = (item: KibBItem) => {
    lastLocalMutationRef.current = Date.now();
    const updated = kibB.map(i => i.id === item.id ? item : i);
    setKibB(updated);
    kibBRef.current = updated;
    localStorage.setItem(getStorageKey('dapodik_kib_b'), JSON.stringify(updated));
    showToast(`Memperbarui data barang KIB B "${item.namaBarang}" ke Spreadsheet...`);

    // Auto-sync ke server cache & Google Sheets menggunakan Sinkronisasi Penuh
    triggerAutoSync(
      students,
      teachers,
      sarpras,
      reports,
      displayConfig,
      schoolProfile,
      administrators,
      true, // force = true
      notificationsRef.current,
      {
        title: 'Pembaruan KIB B',
        message: `Data barang "${item.namaBarang}" berhasil diperbarui.`,
        type: 'info'
      },
      aplikasiLinks,
      schoolAccounts,
      updated,
      false // skipSheetsSync = false (lakukan sinkronisasi penuh ke spreadsheet)
    );
  };

  const handleDeleteKibB = (id: string) => {
    lastLocalMutationRef.current = Date.now();
    const target = kibB.find(i => i.id === id);
    const updated = kibB.filter(i => i.id !== id);
    setKibB(updated);
    kibBRef.current = updated;
    localStorage.setItem(getStorageKey('dapodik_kib_b'), JSON.stringify(updated));
    showToast(`Menghapus barang KIB B dari database & Spreadsheet...`);

    // Auto-sync ke server cache & Google Sheets menggunakan Sinkronisasi Penuh untuk menjamin penghapusan data
    triggerAutoSync(
      students,
      teachers,
      sarpras,
      reports,
      displayConfig,
      schoolProfile,
      administrators,
      true, // force = true
      notificationsRef.current,
      {
        title: 'Penghapusan KIB B',
        message: `Barang "${target?.namaBarang || 'Barang'}" telah dihapus dari database KIB B.`,
        type: 'warning'
      },
      aplikasiLinks,
      schoolAccounts,
      updated,
      false // skipSheetsSync = false (lakukan sinkronisasi penuh agar item terhapus permanen dari Spreadsheet)
    );
  };

  const handleBulkAddKibB = (newItems: KibBItem[], replaceAll: boolean = false) => {
    if (!Array.isArray(newItems) || newItems.length === 0) return;
    lastLocalMutationRef.current = Date.now();
    
    let updated: KibBItem[];
    if (replaceAll) {
      // Model 1: Hapus semua data lama dan ganti dengan data baru
      updated = newItems.map((item, idx) => ({
        ...item,
        no: idx + 1
      }));
    } else {
      // Model 2: Tambahkan ke data lama tanpa merusak data lama
      const currentLength = kibB.length;
      const indexedNew = newItems.map((item, idx) => ({
        ...item,
        no: currentLength + idx + 1
      }));
      updated = [...kibB, ...indexedNew];
    }

    setKibB(updated);
    kibBRef.current = updated;
    localStorage.setItem(getStorageKey('dapodik_kib_b'), JSON.stringify(updated));
    showToast(replaceAll 
      ? `Seluruh data lama KIB B diganti dengan ${newItems.length} barang baru!`
      : `Berhasil menambahkan ${newItems.length} barang baru ke KIB B!`
    );

    // Auto-sync ke server cache & Google Sheets menggunakan Sinkronisasi Penuh
    triggerAutoSync(
      students,
      teachers,
      sarpras,
      reports,
      displayConfig,
      schoolProfile,
      administrators,
      true, // force = true
      notificationsRef.current,
      {
        title: replaceAll ? 'KIB B: Data Lama Diganti' : 'KIB B: Data Ditambahkan',
        message: replaceAll 
          ? `Seluruh data lama KIB B diganti dengan ${newItems.length} barang baru.`
          : `${newItems.length} barang baru berhasil ditambahkan ke KIB B.`,
        type: replaceAll ? 'warning' : 'success'
      },
      aplikasiLinks,
      schoolAccounts,
      updated,
      false // skipSheetsSync = false (lakukan sinkronisasi penuh ke spreadsheet)
    );
  };

  // Reports Handlers
  const handleAddReport = (r: StudentReport) => {
    lastLocalMutationRef.current = Date.now();
    const updated = [r, ...reports];
    setReports(updated);
    localStorage.setItem('dapodik_reports', JSON.stringify(updated));
    showToast(`Lembar Rapor untuk "${r.studentName}" disimpan...`);
    triggerAutoSync(
      students,
      teachers,
      sarpras,
      updated,
      displayConfig,
      schoolProfile,
      administrators,
      true,
      notificationsRef.current,
      {
        title: 'Rapor Disimpan',
        message: `Lembar Rapor untuk "${r.studentName}" berhasil disimpan ke database.`,
        type: 'success'
      }
    );
  };

  const handleUpdateReport = (r: StudentReport) => {
    lastLocalMutationRef.current = Date.now();
    const updated = reports.map(rp => rp.id === r.id ? r : rp);
    setReports(updated);
    localStorage.setItem('dapodik_reports', JSON.stringify(updated));
    showToast(`Rapor "${r.studentName}" diperbarui...`);
    triggerAutoSync(
      students,
      teachers,
      sarpras,
      updated,
      displayConfig,
      schoolProfile,
      administrators,
      true,
      notificationsRef.current,
      {
        title: 'Rapor Diperbarui',
        message: `Rapor "${r.studentName}" berhasil diperbarui di database.`,
        type: 'info'
      }
    );
  };

  const handleDeleteReport = (id: string) => {
    lastLocalMutationRef.current = Date.now();
    const target = reports.find(r => r.id === id);
    const updated = reports.filter(r => r.id !== id);
    setReports(updated);
    localStorage.setItem('dapodik_reports', JSON.stringify(updated));
    showToast('Data rapor dihapus...');
    triggerAutoSync(
      students,
      teachers,
      sarpras,
      updated,
      displayConfig,
      schoolProfile,
      administrators,
      true,
      notificationsRef.current,
      {
        title: 'Penghapusan Rapor',
        message: `Data lembar rapor untuk "${target?.studentName || 'Siswa'}" dihapus dari database.`,
        type: 'warning'
      }
    );
  };

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  const handleMarkAllNotifRead = () => {
    lastLocalMutationRef.current = Date.now();
    const updated = notificationsRef.current.map(n => ({ ...n, read: true }));
    notificationsRef.current = updated;
    setNotifications(updated);
    localStorage.setItem('dapodik_notifications', JSON.stringify(updated));
    saveCacheToServer(students, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, updated, aplikasiLinks);
    triggerAutoSync(students, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, true, updated);
  };

  const handleMarkNotifRead = (id: string) => {
    lastLocalMutationRef.current = Date.now();
    const updated = notificationsRef.current.map(n => String(n.id) === String(id) ? { ...n, read: true } : n);
    notificationsRef.current = updated;
    setNotifications(updated);
    localStorage.setItem('dapodik_notifications', JSON.stringify(updated));
    saveCacheToServer(students, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, updated, aplikasiLinks);
    triggerAutoSync(students, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, true, updated);
  };

  const handleDeleteNotif = (id: string) => {
    lastLocalMutationRef.current = Date.now();
    saveDeletedNotifId(String(id));
    const updated = getFilteredNotifications(notificationsRef.current.filter(n => String(n.id) !== String(id)));
    notificationsRef.current = updated;
    setNotifications(updated);
    localStorage.setItem('dapodik_notifications', JSON.stringify(updated));
    saveCacheToServer(students, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, updated, aplikasiLinks);
    showToast('Notifikasi berhasil dihapus');
    triggerAutoSync(students, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, true, updated);
  };

  const handleClearAllNotif = () => {
    lastLocalMutationRef.current = Date.now();
    const idsToDelete = notificationsRef.current.map(n => n.id).filter(Boolean);
    saveDeletedNotifIds(idsToDelete);
    localStorage.setItem('dapodik_notif_cleared_flag', 'true');
    const updated: NotificationItem[] = [];
    notificationsRef.current = updated;
    setNotifications(updated);
    localStorage.setItem('dapodik_notifications', '[]');
    saveCacheToServer(students, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, updated, aplikasiLinks);
    showToast('Semua notifikasi berhasil dihapus...');
    triggerAutoSync(students, teachers, sarpras, reports, displayConfig, schoolProfile, administrators, true, updated);
  };

  // School Profile Handler
  const handleUpdateSchoolProfile = (updated: SchoolProfile) => {
    lastLocalMutationRef.current = Date.now();
    setSchoolProfile(updated);
    let updatedDisplay = displayConfig;
    if (updated.logoSekolah && updated.logoSekolah !== displayConfig.logoCustomUrl) {
      updatedDisplay = { ...displayConfig, logoCustomUrl: updated.logoSekolah };
      setDisplayConfig(updatedDisplay);
    }
    localStorage.setItem('dapodik_school_profile', JSON.stringify(updated));
    localStorage.setItem('dapodik_display_config', JSON.stringify(updatedDisplay));
    showToast('Profil Satuan Pendidikan disimpan...');
    triggerAutoSync(
      students,
      teachers,
      sarpras,
      reports,
      updatedDisplay,
      updated,
      administrators,
      true,
      notificationsRef.current,
      {
        title: 'Update Profil Sekolah',
        message: 'Data Profil Satuan Pendidikan berhasil diperbarui di database.',
        type: 'info'
      }
    );
  };

  // Active School Account (for multi-tenancy & monitoring)
  const activeSchool = schoolAccounts.find(s => s.npsn === activeSchoolNpsn) || schoolAccounts[0];
  const isMonitoringOtherSchool = activeSchoolNpsn !== '40203578' && Boolean(activeSchool && activeSchool.npsn !== '40203578');

  // If user is not authenticated, show the LoginScreen
  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        displayConfig={displayConfig}
        administrators={administrators}
        syncConfig={syncConfig}
        isSyncing={isSyncing}
        onPullData={() => handlePullFromSheets(false)}
        schoolProfile={schoolProfile}
        teachers={teachers}
        students={students}
        sarpras={sarpras}
        reports={reports}
        schoolAccounts={schoolAccounts}
        onUpdateSchoolAccounts={handleSaveSchoolAccounts}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c4a6e] via-[#0284c7] to-[#0369a1] text-white flex flex-col font-['Plus_Jakarta_Sans',sans-serif] relative selection:bg-sky-200 selection:text-sky-950">
      
      {/* Sticky Top Container for Banner & Submodule Headers to prevent overlaps */}
      <div className="sticky top-0 z-40 w-full flex flex-col">
        {/* Multi-School Monitoring Mode Banner */}
        {isMonitoringOtherSchool && activeSchool && (
          <div className="h-10 bg-amber-500 text-slate-950 px-4 shadow-md flex items-center justify-between text-xs font-bold border-b border-amber-600 animate-in fade-in slide-in-from-top-2 select-none">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-slate-950 text-amber-400">
                <Eye className="w-3.5 h-3.5" />
              </span>
              <span>
                MODE PEMANTAUAN MULTI-SEKOLAH: <strong>{activeSchool.namaSekolah}</strong> (NPSN: <span className="font-mono">{activeSchool.npsn}</span>)
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-slate-900/10 text-[10px] font-semibold">
                Status: {activeSchool.status}
              </span>
            </div>
            <button
              type="button"
              onClick={handleResetToMainSchool}
              className="px-3 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-[11px] font-extrabold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <span>Kembali ke Sekolah Utama</span>
              <span>✕</span>
            </button>
          </div>
        )}
      
      {/* Background Static Bokeh, Auroras & Constellation matching Beranda for All Pages */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Soft Radial glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-[32rem] h-[32rem] bg-blue-400/25 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 w-[40rem] h-[40rem] bg-sky-300/15 rounded-full blur-3xl" />
      </div>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white font-bold px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs animate-bounce border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Top Navbar when inside Submodules */}
      {activeTab !== 'home' && (
        <header className="bg-[#0c4a6e]/85 backdrop-blur-xl border-b border-white/15 px-4 sm:px-6 py-3 flex items-center justify-between shadow-md text-white select-none">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-white p-1 shadow-lg shadow-sky-950/20 flex items-center justify-center overflow-hidden shrink-0 border border-white/40 group-hover:scale-105 transition-transform">
                <SafeImage
                  src={displayConfig.logoCustomUrl || schoolProfile.logoSekolah}
                  fallbackSrc="/logo_smpn11palu.jpg"
                  alt={displayConfig.appName ?? 'Logo'}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="font-extrabold text-sm text-white group-hover:text-cyan-200 transition-colors tracking-wide">
                  {displayConfig.appName ?? 'DAPODIK'}
                </div>
                <div className="text-[9px] text-sky-200 font-bold tracking-wider uppercase">
                  {schoolProfile.namaSekolah ?? 'SMP NEGERI 11 PALU'}
                </div>
              </div>
            </button>

            {/* Quick module selector */}
            <div className="hidden md:flex items-center gap-1 ml-6 bg-white/15 backdrop-blur-md p-1 rounded-2xl border border-white/20 text-xs">
              <button
                onClick={() => setActiveTab('home')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'home' 
                    ? 'bg-white text-slate-900 shadow-md shadow-sky-950/20' 
                    : 'text-sky-100 hover:text-white hover:bg-white/15'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Beranda</span>
              </button>
              <button
                onClick={() => setActiveTab('sekolah')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'sekolah' 
                    ? 'bg-white text-slate-900 shadow-md shadow-sky-950/20' 
                    : 'text-sky-100 hover:text-white hover:bg-white/15'
                }`}
              >
                <School className="w-3.5 h-3.5" />
                <span>Sekolah</span>
              </button>
              <button
                onClick={() => setActiveTab('siswa')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'siswa' 
                    ? 'bg-white text-slate-900 shadow-md shadow-sky-950/20' 
                    : 'text-sky-100 hover:text-white hover:bg-white/15'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Siswa</span>
              </button>
              <button
                onClick={() => setActiveTab('ptk')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'ptk' 
                    ? 'bg-white text-slate-900 shadow-md shadow-sky-950/20' 
                    : 'text-sky-100 hover:text-white hover:bg-white/15'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>PTK</span>
              </button>
              <button
                onClick={() => setActiveTab('sarpras')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'sarpras' 
                    ? 'bg-white text-slate-900 shadow-md shadow-sky-950/20' 
                    : 'text-sky-100 hover:text-white hover:bg-white/15'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Sarpras</span>
              </button>
              <button
                onClick={() => setActiveTab('rapor')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'rapor' 
                    ? 'bg-white text-slate-900 shadow-md shadow-sky-950/20' 
                    : 'text-sky-100 hover:text-white hover:bg-white/15'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Rapor</span>
              </button>
              <button
                onClick={() => setActiveTab('laporan')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'laporan' 
                    ? 'bg-white text-slate-900 shadow-md shadow-sky-950/20' 
                    : 'text-sky-100 hover:text-white hover:bg-white/15'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Laporan</span>
              </button>
              <button
                onClick={() => setActiveTab('aplikasi')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'aplikasi' 
                    ? 'bg-white text-slate-900 shadow-md shadow-sky-950/20' 
                    : 'text-sky-100 hover:text-white hover:bg-white/15'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Aplikasi</span>
              </button>
              <button
                onClick={() => setActiveTab('berkas')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'berkas' 
                    ? 'bg-white text-slate-900 shadow-md shadow-sky-950/20' 
                    : 'text-sky-100 hover:text-white hover:bg-white/15'
                }`}
              >
                <FolderLock className="w-3.5 h-3.5" />
                <span>Berkas</span>
              </button>
              {(currentUser?.role === 'Administrator' || currentUser?.role === 'Operator') && !(currentUser?.schoolNpsn && currentUser?.schoolNpsn !== '40203578') && (
                <button
                  onClick={() => setActiveTab('pengaturan')}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'pengaturan' 
                      ? 'bg-white text-slate-900 shadow-md shadow-sky-950/20' 
                      : 'text-sky-100 hover:text-white hover:bg-white/15'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Pengaturan</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-md transition-all shadow-xs cursor-pointer"
              title="Cari Cepat (⌘K)"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsNotifDrawerOpen(true)}
              className="relative p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-md transition-all shadow-xs cursor-pointer"
              title="Notifikasi"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold flex items-center justify-center text-white shadow-md">
                  {unreadNotifCount}
                </span>
              )}
            </button>
          </div>
        </header>
      )}
      </div>

      {/* Main View Router */}
      <main className={`flex-1 relative z-10 ${currentUser && currentUser.role !== 'Tamu / Umum' ? 'pb-20 md:pb-0' : ''}`}>
        {activeTab === 'home' && (
          <WelcomeHero
            onNavigate={(tab) => {
              setSettingsInitialFilter('all');
              setActiveTab(tab);
            }}
            onOpenEditDisplay={handleOpenEditDisplay}
            syncConfig={syncConfig}
            displayConfig={displayConfig}
            schoolProfile={schoolProfile}
            onOpenSearch={() => setIsSearchModalOpen(true)}
            onOpenNotifications={() => setIsNotifDrawerOpen(true)}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            unreadCount={unreadNotifCount}
            students={students}
            teachers={teachers}
            sarpras={sarpras}
            reports={reports}
            isSyncing={isSyncing}
            onQuickSync={handlePushToSheets}
            onPullData={() => handlePullFromSheets(false)}
            currentUser={currentUser}
            onLogout={handleLogout}
            hasTopBanner={isMonitoringOtherSchool}
          />
        )}

        {activeTab === 'sekolah' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <SchoolModule
              schoolProfile={schoolProfile}
              onUpdateSchoolProfile={handleUpdateSchoolProfile}
              onBackToHome={() => setActiveTab('home')}
              onSync={handleManualSync}
              isSyncing={isSyncing}
              students={students}
              teachers={teachers}
              sarpras={sarpras}
              reports={reports}
            />
          </div>
        )}

        {activeTab === 'siswa' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <StudentModule
              students={students.filter(s => !s.status || s.status === 'Aktif')}
              studentsKeluar={students.filter(s => s.status && s.status !== 'Aktif' && s.status !== 'Lulus')}
              alumni={students.filter(s => s.status === 'Lulus')}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onImportStudents={handleImportStudents}
              onMoveToStudentKeluar={handleMoveToStudentKeluar}
              onDeleteStudentKeluar={handleDeleteStudentKeluar}
              onGraduateStudent={handleGraduateStudent}
              onRestoreStudent={handleRestoreStudent}
              onBackToHome={() => setActiveTab('home')}
              onSync={handleManualSync}
              schoolProfile={schoolProfile}
              displayConfig={displayConfig}
            />
          </div>
        )}

        {activeTab === 'ptk' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <PtkModule
              teachers={teachers}
              onAddTeacher={handleAddTeacher}
              onUpdateTeacher={handleUpdateTeacher}
              onDeleteTeacher={handleDeleteTeacher}
              onImportTeachers={handleImportTeachers}
              onBackToHome={() => setActiveTab('home')}
            />
          </div>
        )}

        {activeTab === 'sarpras' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <SarprasModule
              sarpras={sarpras}
              onAddSarpras={handleAddSarpras}
              onUpdateSarpras={handleUpdateSarpras}
              onDeleteSarpras={handleDeleteSarpras}
              kibB={kibB}
              onAddKibB={handleAddKibB}
              onBulkAddKibB={handleBulkAddKibB}
              onUpdateKibB={handleUpdateKibB}
              onDeleteKibB={handleDeleteKibB}
              onBackToHome={() => setActiveTab('home')}
              onSync={handleManualSync}
              isSyncing={isSyncing}
            />
          </div>
        )}

        {activeTab === 'rapor' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <RaporModule
              reports={reports}
              students={students}
              onAddReport={handleAddReport}
              onUpdateReport={handleUpdateReport}
              onDeleteReport={handleDeleteReport}
              onBackToHome={() => setActiveTab('home')}
              schoolProfile={schoolProfile}
            />
          </div>
        )}

        {activeTab === 'laporan' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <LaporanModule
              students={students}
              teachers={teachers}
              sarpras={sarpras}
              reports={reports}
              onBackToHome={() => setActiveTab('home')}
              schoolProfile={schoolProfile}
              displayConfig={displayConfig}
            />
          </div>
        )}

        {activeTab === 'aplikasi' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <AplikasiModule
              onBackToHome={() => setActiveTab('home')}
              onSync={handleManualSync}
              isSyncing={isSyncing}
              aplikasiLinks={aplikasiLinks}
              setAplikasiLinks={setAplikasiLinks}
              onSaveLinks={handleSaveAplikasiLinks}
            />
          </div>
        )}

        {activeTab === 'berkas' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="mb-4">
              <button
                onClick={() => setActiveTab('home')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                &larr; Kembali ke Beranda
              </button>
            </div>
            <GuestUploadDashboard
              currentUser={currentUser}
              displayConfig={displayConfig}
              schoolProfile={schoolProfile}
              onPullData={() => handlePullFromSheets(false)}
              isSyncing={isSyncing}
              onQuickSync={handlePushToSheets}
              students={students}
              teachers={teachers}
              sarpras={sarpras}
              reports={reports}
            />
          </div>
        )}

        {activeTab === 'pengaturan' && (currentUser?.role === 'Administrator' || currentUser?.role === 'Operator') && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <SettingsModule
              syncConfig={syncConfig}
              displayConfig={displayConfig}
              schoolProfile={schoolProfile}
              onSaveDisplayConfig={handleSaveDisplayConfig}
              onSaveSchoolProfile={handleSaveSchoolProfile}
              onSaveSettings={handleSaveAllSettings}
              onBackToHome={() => setActiveTab('home')}
              initialComponentFilter={settingsInitialFilter}
              administrators={administrators}
              onSaveAdministrators={handleSaveAdministrators}
              schoolAccounts={schoolAccounts}
              onSaveSchoolAccounts={handleSaveSchoolAccounts}
              activeSchoolNpsn={activeSchoolNpsn}
              onSwitchSchoolWorkspace={handleSwitchSchoolWorkspace}
              onResetToMainSchool={handleResetToMainSchool}
              currentUser={currentUser}
              onLogout={handleLogout}
              isSyncing={isSyncing}
              onSync={handleManualSync}
              onClearOfflineCache={handleClearOfflineCache}
              onSaveSyncConfig={async (newConfig) => {
                const normalizedConfig: SyncConfig = {
                  ...newConfig,
                  webAppUrl: normalizeWebAppUrl(newConfig.webAppUrl)
                };
                setSyncConfig(normalizedConfig);
                localStorage.setItem('dapodik_sync_config', JSON.stringify(normalizedConfig));
                await saveSyncConfigToServer(normalizedConfig);
                showToast('✅ URL Database Google Spreadsheet berhasil disimpan permanen untuk seluruh perangkat (HP & Laptop)!');
                // Segera tarik data dari spreadsheet baru untuk mempopulasi state lokal
                setTimeout(() => {
                  handlePullFromSheets(false);
                }, 800);
              }}
            />
          </div>
        )}
      </main>
      
      {/* Mobile Bottom Navigation Bar (Hanya tampil jika sudah Login ke DAPODIK) */}
      {currentUser && currentUser.role !== 'Tamu / Umum' && (
        <MobileBottomNav
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setSettingsInitialFilter('all');
            setActiveTab(tab);
          }}
          onOpenMenu={() => setIsMobileMenuOpen(true)}
          currentUser={currentUser}
        />
      )}

      {/* Global Modals */}


      <QuickSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        students={students}
        teachers={teachers}
        sarpras={sarpras}
        reports={reports}
        onNavigate={(tab) => setActiveTab(tab)}
      />

      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllNotifRead}
        onMarkRead={handleMarkNotifRead}
        onClearAllNotif={handleClearAllNotif}
        onDeleteNotif={handleDeleteNotif}
      />

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex select-none animate-fade-in">
          {/* Backdrop */}
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
          />
          
          {/* Drawer Content */}
          <div className="relative flex flex-col w-72 max-w-[85vw] bg-white h-full shadow-2xl p-5 border-r border-slate-100 z-10">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3 text-left">
                {displayConfig.logoCustomUrl || schoolProfile.logoSekolah ? (
                  <img
                    src={displayConfig.logoCustomUrl || schoolProfile.logoSekolah}
                    alt="Logo"
                    className="w-10 h-10 rounded-2xl object-contain bg-slate-50 border border-slate-200 p-1 shrink-0 shadow-xs"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-[#034d74] p-1.5 flex items-center justify-center shrink-0 shadow-md">
                    <div className="w-full h-full rounded-xl border-2 border-white/90 border-t-amber-400 border-r-amber-400 flex items-center justify-center transform -rotate-45 relative">
                      <div className="w-2 h-2 bg-amber-400 rounded-full shadow-xs" />
                    </div>
                  </div>
                )}
                <div className="overflow-hidden">
                  <h3 className="font-extrabold text-sm text-[#0c2340] tracking-wider truncate leading-tight">
                    {displayConfig.appName ?? 'DAPODIK'}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">
                    MENU NAVIGASI
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action: Tarik Data Spreadsheet */}
            <div className="p-3 mb-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-2">
              <div className="flex items-center justify-between text-emerald-900 font-bold">
                <span className="flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>Google Spreadsheet</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-200/60 text-emerald-800 font-extrabold">
                  TERHUBUNG
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 leading-tight">
                Tarik data terbaru jika ada pembaruan dari perangkat laptop / browser lain.
              </p>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handlePullFromSheets(false);
                }}
                disabled={isSyncing}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-60"
              >
                <DownloadCloud className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                <span>{isSyncing ? 'Menarik Data...' : 'Tarik Data Terbaru'}</span>
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
              {[
                { id: 'home' as ActiveTab, label: 'Beranda / Dashboard', icon: Home, desc: 'Halaman utama & rekap singkat' },
                { id: 'sekolah' as ActiveTab, label: 'Profil Sekolah', icon: School, desc: 'Identitas resmi & izin operasional' },
                { id: 'siswa' as ActiveTab, label: 'Data Siswa', icon: Users, desc: 'Manajemen peserta didik' },
                { id: 'ptk' as ActiveTab, label: 'Data PTK (Guru)', icon: GraduationCap, desc: 'Daftar pendidik & staf' },
                { id: 'sarpras' as ActiveTab, label: 'Sarana & Prasarana', icon: Building2, desc: 'Inventaris ruang & aset' },
                { id: 'rapor' as ActiveTab, label: 'Penilaian Rapor', icon: FileText, desc: 'Capaian kompetensi & nilai' },
                { id: 'laporan' as ActiveTab, label: 'Laporan & Statistik', icon: BarChart3, desc: 'Rekapitulasi grafik & analisis' },
                { id: 'aplikasi' as ActiveTab, label: 'Portal Aplikasi', icon: Laptop, desc: 'Tautan eksternal & pintasan' },
                { id: 'berkas' as ActiveTab, label: 'Portal Berkas', icon: FolderLock, desc: 'Kelola & upload berkas sekolah' },
                ...((currentUser?.role === 'Administrator' || currentUser?.role === 'Operator') && !(currentUser?.schoolNpsn && currentUser?.schoolNpsn !== '40203578') ? [
                  { id: 'pengaturan' as ActiveTab, label: 'Pengaturan Database', icon: Settings, desc: 'Konfigurasi cloud & akun' }
                ] : [])
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-start gap-3 transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-sky-50 text-sky-900 font-semibold border-l-4 border-sky-600 pl-2.5' 
                        : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4.5 h-4.5 shrink-0 mt-0.5 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold leading-none">{item.label}</div>
                      <div className="text-[10px] text-slate-400 font-medium truncate mt-1 leading-none">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Operator Status */}
            {currentUser && (
              <div className="border-t border-slate-100 pt-3 mt-auto shrink-0">
                <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
                    {currentUser.nama.substring(0, 1).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-slate-800 truncate">{currentUser.nama}</div>
                    <div className="text-[10px] text-slate-400 font-bold truncate uppercase leading-none mt-0.5">{currentUser.role}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
