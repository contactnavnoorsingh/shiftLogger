// types.ts

export interface User {
  _id: string;
  username: string;
}

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

export interface Shift {
  _id: string;
  userId: string;
  date: string;
  timings: string;
  designation: string;
  startTime: string;
  endTime: string;
  entries: Entry[];
  summary?: string; // <-- ADDED THIS LINE
  createdAt?: string;
  updatedAt?: string;
}

export interface QueuedItem {
  date: string;
  entry: Entry;
}