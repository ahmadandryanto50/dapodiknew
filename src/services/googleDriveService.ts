import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App instance safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Google Drive file management scope
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.setCustomParameters({
  prompt: 'select_account'
});

// Keys for persistence
const TOKEN_KEY = 'dapodik_drive_access_token_v1';
const EXPIRY_KEY = 'dapodik_drive_token_expires_v1';
const USER_KEY = 'dapodik_drive_user_v1';

let cachedAccessToken: string | null = null;
let cachedUser: any = null;

// Initialize cached token from localStorage if valid
try {
  const savedToken = localStorage.getItem(TOKEN_KEY);
  const savedExpiry = localStorage.getItem(EXPIRY_KEY);
  const savedUser = localStorage.getItem(USER_KEY);

  if (savedToken && savedExpiry && Number(savedExpiry) > Date.now()) {
    cachedAccessToken = savedToken;
    if (savedUser) {
      cachedUser = JSON.parse(savedUser);
    }
  } else {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    localStorage.removeItem(USER_KEY);
  }
} catch (e) {
  console.warn('Could not restore Drive auth from localStorage', e);
}

// Auth state listeners
const listeners = new Set<(user: any, token: string | null) => void>();

export const subscribeGoogleDriveAuth = (
  callback: (user: any, token: string | null) => void
) => {
  listeners.add(callback);
  callback(cachedUser, cachedAccessToken);
  return () => {
    listeners.delete(callback);
  };
};

const notifyListeners = () => {
  listeners.forEach(cb => cb(cachedUser, cachedAccessToken));
};

// Initialize listener on auth state change
onAuthStateChanged(auth, async (user: User | null) => {
  if (user) {
    cachedUser = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL
    };
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(cachedUser));
    } catch (e) {}
  } else if (!cachedAccessToken) {
    cachedUser = null;
    localStorage.removeItem(USER_KEY);
  }
  notifyListeners();
});

/**
 * Sign in with Google to get real Google Drive access token
 */
export const signInWithGoogleDrive = async (): Promise<{ user: any; accessToken: string }> => {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token otorisasi Google Drive. Pastikan izin akses Drive disetujui.');
    }

    cachedAccessToken = credential.accessToken;
    cachedUser = {
      uid: result.user.uid,
      displayName: result.user.displayName,
      email: result.user.email,
      photoURL: result.user.photoURL
    };

    // Save token with 1 hour expiration
    const expiryTime = Date.now() + 3500 * 1000;
    try {
      localStorage.setItem(TOKEN_KEY, cachedAccessToken);
      localStorage.setItem(EXPIRY_KEY, expiryTime.toString());
      localStorage.setItem(USER_KEY, JSON.stringify(cachedUser));
    } catch (e) {}

    notifyListeners();

    return { user: cachedUser, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Drive sign in error:', error);
    throw error;
  }
};

/**
 * Get current Google Drive access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  // Check if current token in cache is expired
  try {
    const savedExpiry = localStorage.getItem(EXPIRY_KEY);
    if (savedExpiry && Number(savedExpiry) <= Date.now()) {
      cachedAccessToken = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EXPIRY_KEY);
      notifyListeners();
    }
  } catch (e) {}
  return cachedAccessToken;
};

/**
 * Check if connected to Google Drive
 */
export const isGoogleDriveConnected = (): boolean => {
  if (!cachedAccessToken) return false;
  try {
    const savedExpiry = localStorage.getItem(EXPIRY_KEY);
    if (savedExpiry && Number(savedExpiry) <= Date.now()) {
      return false;
    }
  } catch (e) {}
  return true;
};

/**
 * Sign out from Google Drive
 */
export const signOutGoogleDrive = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (e) {}
  cachedAccessToken = null;
  cachedUser = null;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (e) {}
  notifyListeners();
};

/**
 * Upload a real file to Google Drive using the Drive v3 REST API
 */
export interface DriveUploadResult {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink?: string;
  size: number;
  mimeType: string;
  folderId?: string;
  folderName?: string;
}

// Memory cache for folder IDs to prevent redundant requests
const folderCache = new Map<string, string>();

/**
 * Create a folder in Google Drive
 */
export const createFolderInGoogleDrive = async (folderName: string, parentFolderId?: string): Promise<{ id: string; name: string; webViewLink: string }> => {
  let token = await getAccessToken();
  if (!token) {
    const authResult = await signInWithGoogleDrive();
    token = authResult.accessToken;
  }

  const metadata: Record<string, any> = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const res = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal membuat folder "${folderName}" di Google Drive`);
  }

  return await res.json();
};

/**
 * Get or automatically create a folder in Google Drive by name
 */
export const getOrCreateFolderInGoogleDrive = async (
  folderName: string,
  parentFolderId?: string
): Promise<{ id: string; name: string; webViewLink?: string }> => {
  const cleanName = folderName.trim();
  if (!cleanName) {
    return { id: parentFolderId || '', name: 'Root' };
  }

  const cacheKey = `${parentFolderId || 'root'}_${cleanName.toLowerCase()}`;
  if (folderCache.has(cacheKey)) {
    const cachedId = folderCache.get(cacheKey)!;
    return { id: cachedId, name: cleanName };
  }

  let token = await getAccessToken();
  if (!token) {
    const authResult = await signInWithGoogleDrive();
    token = authResult.accessToken;
  }

  // 1. Search for existing folder by name inside parentFolderId or Drive
  try {
    let q = `mimeType = 'application/vnd.google-apps.folder' and name = '${cleanName.replace(/'/g, "\\'")}' and trashed = false`;
    if (parentFolderId) {
      q += ` and '${parentFolderId}' in parents`;
    }

    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=files(id,name,webViewLink)&pageSize=1`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        const foundFolder = searchData.files[0];
        folderCache.set(cacheKey, foundFolder.id);
        return {
          id: foundFolder.id,
          name: foundFolder.name,
          webViewLink: foundFolder.webViewLink
        };
      }
    }
  } catch (searchErr) {
    console.warn('Search for folder error, creating new folder:', searchErr);
  }

  // 2. Folder does not exist, create it inside parentFolderId
  try {
    const createdFolder = await createFolderInGoogleDrive(cleanName, parentFolderId);
    folderCache.set(cacheKey, createdFolder.id);
    return createdFolder;
  } catch (createErr: any) {
    // If parentFolderId is not writable, fallback to creating folder in root My Drive
    if (parentFolderId) {
      console.warn(`Creating folder "${cleanName}" in parent failed, attempting in root Drive:`, createErr);
      try {
        const fallbackCreated = await createFolderInGoogleDrive(cleanName);
        folderCache.set(cacheKey, fallbackCreated.id);
        return fallbackCreated;
      } catch (fallbackErr) {
        console.error(`Fallback folder creation for "${cleanName}" failed:`, fallbackErr);
      }
    }
    throw createErr;
  }
};

export const uploadFileToGoogleDrive = async (
  file: File,
  options?: {
    category?: string;
    customFolderName?: string;
    description?: string;
    parentFolderId?: string;
  }
): Promise<DriveUploadResult> => {
  let token = await getAccessToken();
  
  if (!token) {
    // Attempt sign in if not currently signed in
    const authResult = await signInWithGoogleDrive();
    token = authResult.accessToken;
  }

  // Determine target subfolder (Category Folder OR Custom Folder)
  const targetFolderName = (options?.customFolderName || options?.category || '').trim();
  let effectiveFolderId = options?.parentFolderId;

  if (targetFolderName) {
    try {
      const folderRes = await getOrCreateFolderInGoogleDrive(targetFolderName, options?.parentFolderId);
      if (folderRes && folderRes.id) {
        effectiveFolderId = folderRes.id;
      }
    } catch (folderErr) {
      console.warn(`Could not prepare subfolder "${targetFolderName}", using parent folder directly:`, folderErr);
    }
  }

  const uploadWithMetadata = async (targetParentId?: string): Promise<DriveUploadResult> => {
    const metadata: Record<string, any> = {
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      description: options?.description || `Diunggah melalui Dapodik Kemendikbudristek (${targetFolderName || 'Umum'})`,
    };

    if (targetParentId) {
      metadata.parents = [targetParentId];
    }

    // 1. STRATEGY A: Resumable Upload (Most reliable for Google Drive API)
    try {
      const initResponse = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id,name,webViewLink,webContentLink,size,mimeType,parents',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Upload-Content-Type': file.type || 'application/octet-stream',
            'X-Upload-Content-Length': file.size.toString()
          },
          body: JSON.stringify(metadata)
        }
      );

      if (initResponse.ok) {
        const locationUrl = initResponse.headers.get('Location') || initResponse.headers.get('location');
        if (locationUrl) {
          const fileBuffer = await file.arrayBuffer();
          const uploadResponse = await fetch(locationUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': file.type || 'application/octet-stream'
            },
            body: fileBuffer
          });

          if (uploadResponse.ok) {
            const data = await uploadResponse.json();
            return {
              id: data.id,
              name: data.name || file.name,
              webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view?usp=drivesdk`,
              webContentLink: data.webContentLink,
              size: Number(data.size) || file.size,
              mimeType: data.mimeType || file.type || 'application/octet-stream',
              folderId: effectiveFolderId,
              folderName: targetFolderName
            };
          }
        }
      }
    } catch (resumableErr) {
      console.warn('Resumable upload attempt had an issue, falling back to multipart:', resumableErr);
    }

    // 2. STRATEGY B: Multipart Upload with strict MIME compliance
    const boundary = 'DapodikBoundary' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    const fileData = await file.arrayBuffer();

    const multipartRequestBody = new Blob([
      `--${boundary}\r\n`,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      JSON.stringify(metadata),
      `\r\n--${boundary}\r\n`,
      `Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`,
      fileData,
      `\r\n--${boundary}--`
    ]);

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink,webContentLink,size,mimeType,parents',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartRequestBody
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData?.error?.message || `Gagal mengunggah ke Google Drive (Kode HTTP: ${response.status})`;
      
      // If token expired (401), clear token
      if (response.status === 401) {
        cachedAccessToken = null;
        try {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(EXPIRY_KEY);
        } catch (e) {}
        notifyListeners();
        throw new Error('Sesi otorisasi Google Drive telah berakhir. Silakan klik "Hubungkan Akun Google" kembali.');
      }

      // If target folder is not accessible (403/404), throw custom so we can fallback
      if (targetParentId && (response.status === 404 || response.status === 403 || errorMsg.toLowerCase().includes('parent') || errorMsg.toLowerCase().includes('folder'))) {
        throw new Error(`PARENT_FOLDER_INACCESSIBLE: ${errorMsg}`);
      }
      
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return {
      id: data.id,
      name: data.name || file.name,
      webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view?usp=drivesdk`,
      webContentLink: data.webContentLink,
      size: Number(data.size) || file.size,
      mimeType: data.mimeType || file.type || 'application/octet-stream',
      folderId: effectiveFolderId,
      folderName: targetFolderName
    };
  };

  try {
    // Attempt upload directly inside the resolved target folder
    return await uploadWithMetadata(effectiveFolderId);
  } catch (primaryErr: any) {
    if (primaryErr?.message?.startsWith('PARENT_FOLDER_INACCESSIBLE') && effectiveFolderId) {
      console.warn('Target folder was not writable for this account, uploading to root My Drive instead:', primaryErr.message);
      return await uploadWithMetadata(undefined);
    }
    throw primaryErr;
  }
};

