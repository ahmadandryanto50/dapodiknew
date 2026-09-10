import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Student,
  TeacherStaff,
  SarprasItem,
  StudentReport,
  AppDisplayConfig,
  SchoolProfile,
  AdminUser,
  NotificationItem,
  SchoolFileItem,
  FileAccessRequest
} from '../types';

export interface AplikasiLinkItem {
  id: string;
  nama: string;
  url: string;
  deskripsi: string;
  icon?: string;
  kategori?: string;
  status?: string;
}

export const COLLECTIONS = {
  STUDENTS: 'students',
  TEACHERS: 'teachers',
  SARPRAS: 'sarpras',
  REPORTS: 'reports',
  DISPLAY_CONFIG: 'display_config',
  SCHOOL_PROFILE: 'school_profile',
  ADMINISTRATORS: 'administrators',
  NOTIFICATIONS: 'notifications',
  APLIKASI_LINKS: 'aplikasi_links',
  SCHOOL_FILES: 'school_files',
  ACCESS_REQUESTS: 'access_requests'
} as const;

/**
 * Subscribe to real-time changes on a Firestore collection
 */
export function subscribeCollection<T extends { id: string }>(
  collectionName: string,
  onData: (data: T[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, collectionName);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as T);
      });
      onData(items);
    },
    (err) => {
      console.error(`Firebase error listening to ${collectionName}:`, err);
      if (onError) onError(err);
    }
  );
}

/**
 * Subscribe to a single document in Firestore
 */
export function subscribeDocument<T>(
  collectionName: string,
  docId: string,
  onData: (data: T | null) => void,
  onError?: (err: Error) => void
) {
  const docRef = doc(db, collectionName, docId);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data() as T);
      } else {
        onData(null);
      }
    },
    (err) => {
      console.error(`Firebase error listening to ${collectionName}/${docId}:`, err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save or update a document in Firestore
 */
export async function saveDocument<T extends object>(
  collectionName: string,
  docId: string,
  data: T
): Promise<void> {
  const docRef = doc(db, collectionName, String(docId));
  // Clean undefined/null functions to ensure Firestore serializability
  const cleanData = JSON.parse(JSON.stringify(data));
  await setDoc(docRef, cleanData, { merge: true });
}

/**
 * Remove a document from Firestore
 */
export async function removeDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  const docRef = doc(db, collectionName, String(docId));
  await deleteDoc(docRef);
}

/**
 * Batch save items to Firestore
 */
export async function saveBatchItems<T extends { id: string }>(
  collectionName: string,
  items: T[]
): Promise<void> {
  if (!items || items.length === 0) return;

  const BATCH_SIZE = 450;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    chunk.forEach((item) => {
      if (!item.id) return;
      const docRef = doc(db, collectionName, String(item.id));
      const cleanData = JSON.parse(JSON.stringify(item));
      batch.set(docRef, cleanData, { merge: true });
    });

    await batch.commit();
  }
}

/**
 * Replace all documents in a collection
 */
export async function replaceCollectionItems<T extends { id: string }>(
  collectionName: string,
  items: T[]
): Promise<void> {
  const colRef = collection(db, collectionName);
  const snapshot = await getDocs(colRef);

  const batchDelete = writeBatch(db);
  snapshot.docs.forEach((d) => {
    batchDelete.delete(d.ref);
  });
  await batchDelete.commit();

  if (items && items.length > 0) {
    await saveBatchItems(collectionName, items);
  }
}

/**
 * Seed initial sample datasets if Firebase collections are empty
 */
export async function seedFirebaseIfEmpty(initialData: {
  students: Student[];
  teachers: TeacherStaff[];
  sarpras: SarprasItem[];
  reports: StudentReport[];
  schoolProfile: SchoolProfile;
  displayConfig: AppDisplayConfig;
  administrators: AdminUser[];
  notifications: NotificationItem[];
  aplikasiLinks: AplikasiLinkItem[];
  schoolFiles: SchoolFileItem[];
  accessRequests: FileAccessRequest[];
}): Promise<boolean> {
  try {
    const studentsSnap = await getDocs(collection(db, COLLECTIONS.STUDENTS));
    if (!studentsSnap.empty) {
      return false; // Already seeded
    }

    console.log('Seeding initial data into Firebase Firestore...');

    if (initialData.students?.length) await saveBatchItems(COLLECTIONS.STUDENTS, initialData.students);
    if (initialData.teachers?.length) await saveBatchItems(COLLECTIONS.TEACHERS, initialData.teachers);
    if (initialData.sarpras?.length) await saveBatchItems(COLLECTIONS.SARPRAS, initialData.sarpras);
    if (initialData.reports?.length) await saveBatchItems(COLLECTIONS.REPORTS, initialData.reports);
    if (initialData.administrators?.length) await saveBatchItems(COLLECTIONS.ADMINISTRATORS, initialData.administrators);
    if (initialData.notifications?.length) await saveBatchItems(COLLECTIONS.NOTIFICATIONS, initialData.notifications);
    if (initialData.aplikasiLinks?.length) await saveBatchItems(COLLECTIONS.APLIKASI_LINKS, initialData.aplikasiLinks);
    if (initialData.schoolFiles?.length) await saveBatchItems(COLLECTIONS.SCHOOL_FILES, initialData.schoolFiles);
    if (initialData.accessRequests?.length) await saveBatchItems(COLLECTIONS.ACCESS_REQUESTS, initialData.accessRequests);

    if (initialData.schoolProfile) {
      await saveDocument(COLLECTIONS.SCHOOL_PROFILE, 'main', initialData.schoolProfile);
    }
    if (initialData.displayConfig) {
      await saveDocument(COLLECTIONS.DISPLAY_CONFIG, 'main', initialData.displayConfig);
    }

    console.log('Firebase seeding completed successfully!');
    return true;
  } catch (err) {
    console.error('Failed to seed Firebase:', err);
    return false;
  }
}

/**
 * Force re-seed all collections in Firebase
 */
export async function forceSeedFirebase(initialData: {
  students: Student[];
  teachers: TeacherStaff[];
  sarpras: SarprasItem[];
  reports: StudentReport[];
  schoolProfile: SchoolProfile;
  displayConfig: AppDisplayConfig;
  administrators: AdminUser[];
  notifications: NotificationItem[];
  aplikasiLinks: AplikasiLinkItem[];
  schoolFiles: SchoolFileItem[];
  accessRequests: FileAccessRequest[];
}): Promise<void> {
  await replaceCollectionItems(COLLECTIONS.STUDENTS, initialData.students || []);
  await replaceCollectionItems(COLLECTIONS.TEACHERS, initialData.teachers || []);
  await replaceCollectionItems(COLLECTIONS.SARPRAS, initialData.sarpras || []);
  await replaceCollectionItems(COLLECTIONS.REPORTS, initialData.reports || []);
  await replaceCollectionItems(COLLECTIONS.ADMINISTRATORS, initialData.administrators || []);
  await replaceCollectionItems(COLLECTIONS.NOTIFICATIONS, initialData.notifications || []);
  await replaceCollectionItems(COLLECTIONS.APLIKASI_LINKS, initialData.aplikasiLinks || []);
  await replaceCollectionItems(COLLECTIONS.SCHOOL_FILES, initialData.schoolFiles || []);
  await replaceCollectionItems(COLLECTIONS.ACCESS_REQUESTS, initialData.accessRequests || []);

  if (initialData.schoolProfile) {
    await saveDocument(COLLECTIONS.SCHOOL_PROFILE, 'main', initialData.schoolProfile);
  }
  if (initialData.displayConfig) {
    await saveDocument(COLLECTIONS.DISPLAY_CONFIG, 'main', initialData.displayConfig);
  }
}
