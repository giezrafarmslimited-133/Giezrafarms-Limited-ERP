/**
 * Google Drive API Service for Giezra Farms Limited
 * Integrates directly with official Google Drive API v3 using OAuth2 token
 */

import { getGoogleAccessToken } from './googleAuth';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
export const ROOT_FOLDER_NAME = 'GIEZRA FARMS';

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  webViewLink?: string;
  webContentLink?: string;
  createdTime?: string;
  parents?: string[];
  thumbnailLink?: string;
}

// In-memory cache for folder IDs to prevent redundant API calls
const folderIdCache: Record<string, string> = {};

/**
 * Helper to get authorization headers
 */
function getHeaders(tokenOverride?: string): Record<string, string> {
  const token = tokenOverride || getGoogleAccessToken();
  if (!token) {
    throw new Error('Google Drive authorization required. Please sign in with Google to access Drive storage.');
  }
  return {
    Authorization: `Bearer ${token}`
  };
}

/**
 * Search for an existing folder or file by name and parent
 */
export async function findDriveItem(name: string, mimeType?: string, parentId?: string): Promise<DriveFileItem | null> {
  try {
    const headers = getHeaders();
    let query = `name = '${name.replace(/'/g, "\\'")}' and trashed = false`;
    if (mimeType) {
      query += ` and mimeType = '${mimeType}'`;
    }
    if (parentId) {
      query += ` and '${parentId}' in parents`;
    }

    const params = new URLSearchParams({
      q: query,
      fields: 'files(id, name, mimeType, webViewLink, webContentLink, createdTime, parents)',
      spaces: 'drive',
      pageSize: '1'
    });

    const res = await fetch(`${DRIVE_API_BASE}/files?${params.toString()}`, { headers });
    if (!res.ok) {
      if (res.status === 401) throw new Error('Google Drive session expired. Please sign in again.');
      return null;
    }
    const data = await res.json();
    return data.files && data.files.length > 0 ? data.files[0] : null;
  } catch (err) {
    console.warn('[Drive API] Search error:', err);
    return null;
  }
}

/**
 * Get or create a folder in Google Drive
 */
export async function getOrCreateFolder(folderName: string, parentId?: string): Promise<string> {
  const cacheKey = `${parentId || 'root'}:${folderName}`;
  if (folderIdCache[cacheKey]) {
    return folderIdCache[cacheKey];
  }

  const existing = await findDriveItem(folderName, 'application/vnd.google-apps.folder', parentId);
  if (existing) {
    folderIdCache[cacheKey] = existing.id;
    return existing.id;
  }

  // Create folder
  const headers = getHeaders();
  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };
  if (parentId) {
    metadata.parents = [parentId];
  }

  const res = await fetch(`${DRIVE_API_BASE}/files?fields=id,name,webViewLink`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Failed to create Google Drive folder "${folderName}": ${errBody}`);
  }

  const created = await res.json();
  folderIdCache[cacheKey] = created.id;
  return created.id;
}

/**
 * Ensure GIEZRA FARMS root and all required operational subfolders exist
 */
export async function ensureGiezraFolderHierarchy(): Promise<{
  rootFolderId: string;
  subfolders: Record<string, string>;
}> {
  // 1. Root folder: GIEZRA FARMS
  const rootFolderId = await getOrCreateFolder(ROOT_FOLDER_NAME);

  // 2. Main operational folders
  const currentYear = new Date().getFullYear().toString();
  const invoicesFolderId = await getOrCreateFolder('Invoices', rootFolderId);
  const currentYearInvoicesId = await getOrCreateFolder(currentYear, invoicesFolderId);

  const subfolderNames = [
    'Quotations',
    'Sales Reports',
    'Stock Reports',
    'Production Reports',
    'Customer Documents',
    'Business Documents',
    'Backups'
  ];

  const subfolders: Record<string, string> = {
    root: rootFolderId,
    Invoices: invoicesFolderId,
    [`Invoices/${currentYear}`]: currentYearInvoicesId
  };

  for (const name of subfolderNames) {
    const id = await getOrCreateFolder(name, rootFolderId);
    subfolders[name] = id;
  }

  return { rootFolderId, subfolders };
}

export const initializeFolderStructure = ensureGiezraFolderHierarchy;

/**
 * Upload a file (Blob, File, or string) to a specific Google Drive folder
 */
export async function uploadToDrive(options: {
  file: Blob | File | string;
  fileName: string;
  mimeType: string;
  folderCategory?: 'Invoices' | 'Quotations' | 'Sales Reports' | 'Stock Reports' | 'Production Reports' | 'Customer Documents' | 'Business Documents' | 'Backups';
  customParentFolderId?: string;
}): Promise<{ fileId: string; webViewLink: string; webContentLink: string; fileName: string }> {
  const token = getGoogleAccessToken();
  if (!token) {
    throw new Error('Please sign in with Google to upload documents to Google Drive.');
  }

  let parentId = options.customParentFolderId;
  if (!parentId) {
    const { subfolders } = await ensureGiezraFolderHierarchy();
    if (options.folderCategory === 'Invoices') {
      const currentYear = new Date().getFullYear().toString();
      parentId = subfolders[`Invoices/${currentYear}`] || subfolders['Invoices'];
    } else if (options.folderCategory && subfolders[options.folderCategory]) {
      parentId = subfolders[options.folderCategory];
    } else {
      parentId = subfolders['Business Documents'] || subfolders.root;
    }
  }

  // Create multipart payload
  const metadata = {
    name: options.fileName,
    parents: parentId ? [parentId] : undefined,
    mimeType: options.mimeType
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  let fileContent: Blob;
  if (typeof options.file === 'string') {
    fileContent = new Blob([options.file], { type: options.mimeType });
  } else {
    fileContent = options.file;
  }

  // Build multipart body
  const metadataBlob = new Blob([
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${options.mimeType}\r\n\r\n`
  ], { type: 'text/plain' });

  const multipartBody = new Blob([metadataBlob, fileContent, new Blob([closeDelimiter], { type: 'text/plain' })]);

  const res = await fetch(`${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartBody
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Drive upload failed: ${errorText}`);
  }

  const uploaded = await res.json();
  return {
    fileId: uploaded.id,
    webViewLink: uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.id}/view`,
    webContentLink: uploaded.webContentLink || `https://drive.google.com/uc?id=${uploaded.id}&export=download`,
    fileName: options.fileName
  };
}

/**
 * List files in a Google Drive folder or all files in GIEZRA FARMS
 */
export async function listDriveFiles(folderId?: string): Promise<DriveFileItem[]> {
  try {
    const headers = getHeaders();
    let query = 'trashed = false';
    if (folderId) {
      query += ` and '${folderId}' in parents`;
    }

    const params = new URLSearchParams({
      q: query,
      fields: 'files(id, name, mimeType, size, webViewLink, webContentLink, createdTime, thumbnailLink, parents)',
      orderBy: 'createdTime desc',
      pageSize: '50'
    });

    const res = await fetch(`${DRIVE_API_BASE}/files?${params.toString()}`, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.error('[Drive API] Error listing files:', err);
    return [];
  }
}

/**
 * Check if Google Drive is authorized and reachable
 */
export async function checkDriveStatus(): Promise<{ connected: boolean; userEmail?: string; message: string }> {
  const token = getGoogleAccessToken();
  if (!token) {
    return {
      connected: false,
      message: 'Google Drive requires authentication. Click "Sign in with Google" to enable real-time Drive sync.'
    };
  }
  try {
    const res = await fetch(`${DRIVE_API_BASE}/about?fields=user(displayName,emailAddress),storageQuota`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      return {
        connected: true,
        userEmail: data.user?.emailAddress,
        message: `Connected to Google Drive as ${data.user?.displayName || data.user?.emailAddress}`
      };
    }
    return {
      connected: false,
      message: 'Google Drive token expired or invalid. Please sign in again.'
    };
  } catch (e: any) {
    return { connected: false, message: e.message || 'Drive connection check failed.' };
  }
}
