export function now24(): string {
  // Returns current time in 24-hour format (HH:mm)
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function todayISO(): string {
  // Returns today's date in YYYY-MM-DD (ISO) format
  return new Date().toISOString().slice(0, 10);
}

// FIX: A more robust copy-to-clipboard function that prioritizes the modern Clipboard API.
export async function copyToClipboard(text: string) {
  try {
    // Try the modern Clipboard API first
    await navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  } catch (err) {
    // Fallback for older browsers or insecure contexts
    console.warn('Clipboard API failed, falling back to execCommand.');
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      alert('Copied to clipboard!');
    } catch (execErr) {
      console.error('Fallback failed: Oops, unable to copy', execErr);
      alert('Failed to copy text.');
    }
    document.body.removeChild(textArea);
  }
}
