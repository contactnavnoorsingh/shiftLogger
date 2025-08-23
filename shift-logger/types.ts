// types.ts

/**
 * Represents the authenticated user.
 * Based on models/User.ts and API responses.
 */
export interface User {
  _id: string;
  username: string;
}

/**
 * Represents a single log entry within a shift.
 * Based on models/Shift.ts.
 */
export interface Entry {
  time: string;
  status: '10-7' | '10-8';
  site: string;
  staffName?: string;
  guardName?: string;
  guardChecks?: boolean[];
  ok: boolean;
  text: string;
  tenFour: boolean;
  manual: boolean;
}

/**
 * Represents a full shift, including its entries.
 * Based on models/Shift.ts.
 */
export interface Shift {
  _id: string;
  userId: string;
  date: string;
  timings: string;
  designation: string;
  startTime: string; // Dates are serialized as strings over JSON
  endTime: string;   // Dates are serialized as strings over JSON
  entries: Entry[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Represents an entry that is queued for offline syncing.
 * Based on app/page.tsx.
 */
export interface QueuedItem {
  date: string;
  entry: Entry;
}