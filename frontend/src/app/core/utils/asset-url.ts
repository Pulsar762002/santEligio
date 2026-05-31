import { environment } from '../../../environments/environment';

// Origine del backend ricavata da apiUrl: in dev "http://localhost:3000",
// in prod stringa vuota (gli upload sono serviti same-origin da Nginx).
const origin = environment.apiUrl.replace(/\/api\/?$/, '');

// Risolve un path di upload (es. "/uploads/x.jpg") in URL utilizzabile come src.
export function assetUrl(path?: string | null): string {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  return origin + (path.startsWith('/') ? path : `/${path}`);
}
