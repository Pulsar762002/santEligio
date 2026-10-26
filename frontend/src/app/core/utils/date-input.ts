// ISO (dal backend) -> valore per <input type="datetime-local"> in ora locale
export function isoToLocalInput(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// datetime-local -> ISO string per il backend (IsDateString)
export function localInputToIso(value: string): string {
  return value ? new Date(value).toISOString() : '';
}

// ISO -> valore per <input type="date"> (giorno in ora locale)
export function isoToDateInput(iso?: string | null): string {
  return iso ? isoToLocalInput(iso).slice(0, 10) : '';
}

// <input type="date"> -> ISO di inizio (00:00) o fine (23:59:59) giornata locale; '' -> null
export function dateInputToIso(value: string, fineGiornata = false): string | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  const data = fineGiornata ? new Date(y, m - 1, d, 23, 59, 59, 999) : new Date(y, m - 1, d);
  return data.toISOString();
}
