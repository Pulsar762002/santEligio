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
