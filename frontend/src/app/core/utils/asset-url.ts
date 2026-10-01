import { environment } from '../../../environments/environment';

// Origine del backend ricavata da apiUrl: in dev "http://localhost:3000",
// in prod stringa vuota (gli upload sono serviti same-origin da Nginx).
const origin = environment.apiUrl.replace(/\/api\/?$/, '');

// URL completo e assoluto (es. "https://parrocchiasanteligio.it/uploads/x.jpg"),
// da incollare in pagine, email o altri siti.
export function assetUrlCompleto(path?: string | null): string {
  const u = assetUrl(path);
  return u ? new URL(u, window.location.origin).href : '';
}

// Risolve un path di upload (es. "/uploads/x.jpg") in URL utilizzabile come src.
export function assetUrl(path?: string | null): string {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  return origin + (path.startsWith('/') ? path : `/${path}`);
}
