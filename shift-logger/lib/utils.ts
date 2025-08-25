export function now24(): string {
  // Returns current time in 24-hour format (HH:mm)
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function todayISO(): string {
  // Returns today's date in YYYY-MM-DD (ISO) format
  return new Date().toISOString().slice(0, 10);
}

// FIX: A more robust copy-to-clipboard function that works in most environments.
export function copyToClipboard(text: string) {
  // Create a temporary textarea element to hold the text
  const textArea = document.createElement('textarea');
  textArea.value = text;
  
  // Prevent scrolling to bottom of page in MS Edge.
  textArea.style.position = 'fixed';
  textArea.style.top = '0';
  textArea.style.left = '0';

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    // Use the older, more reliable command
    document.execCommand('copy');
    alert('Copied to clipboard!');
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
    alert('Failed to copy text.');
  }

  document.body.removeChild(textArea);
}
