export function now24(): string {
  // Returns current time in 24-hour format (HH:mm)
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function todayISO(): string {
  // Returns today's date in YYYY-MM-DD (ISO) format
  return new Date().toISOString().slice(0, 10);
}
