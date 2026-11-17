import { API_ORIGIN } from '../services/api';

const OFFICE_OR_PDF = /\.(pdf|docx?|pptx?|xlsx?)(\?.*)?$/i;
const IMAGE = /\.(png|jpe?g|webp)(\?.*)?$/i;
const UPLOADED_FILE = /^https?:\/\/[^/]+(\/api\/v1\/files\/[0-9a-f-]{36}[^?]*)/i;

export const isUploadedFile = (url: string) => UPLOADED_FILE.test(url.trim());

export const uploadedFileUrl = (url: string) => {
  const match = url.trim().match(UPLOADED_FILE);
  return match ? `${API_ORIGIN}${match[1]}` : url;
};
const DRIVE_FILE = /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:.*&)?id=)([\w-]+)/;
const GOOGLE_DOC = /docs\.google\.com\/(document|presentation|spreadsheets)\/d\/([\w-]+)/;

const PRIVATE_HOST = /^https?:\/\/(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i;

const backendIsPublic = () => API_ORIGIN.startsWith('https://') && !PRIVATE_HOST.test(API_ORIGIN);

export const opensWithSystemViewer = (fileUrl: string) => {
  const url = fileUrl.trim();
  if (!isUploadedFile(url)) return false;
  const direct = uploadedFileUrl(url);
  return !IMAGE.test(direct) && !direct.endsWith('.txt') && !backendIsPublic();
};

export function previewUrlFor(fileUrl: string): string {
  const url = fileUrl.trim();

  if (isUploadedFile(url)) {
    const direct = uploadedFileUrl(url);
    return IMAGE.test(direct) || direct.endsWith('.txt') || !backendIsPublic()
      ? direct
      : `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(direct)}`;
  }

  const driveFile = url.match(DRIVE_FILE);
  if (driveFile) return `https://drive.google.com/file/d/${driveFile[1]}/view`;

  if (OFFICE_OR_PDF.test(url)) {
    return `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(url)}`;
  }

  return url;
}

export function downloadUrlFor(fileUrl: string): string | null {
  const url = fileUrl.trim();

  if (isUploadedFile(url)) return `${uploadedFileUrl(url)}?download=true`;

  const driveFile = url.match(DRIVE_FILE);
  if (driveFile) return `https://drive.google.com/uc?export=download&id=${driveFile[1]}`;

  const googleDoc = url.match(GOOGLE_DOC);
  if (googleDoc) {
    const [, type, id] = googleDoc;
    if (type === 'document') return `https://docs.google.com/document/d/${id}/export?format=pdf`;
    if (type === 'presentation') return `https://docs.google.com/presentation/d/${id}/export/pdf`;
    return `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`;
  }

  return OFFICE_OR_PDF.test(url) ? url : null;
}
