// types.ts

export interface User {
  _id: string;
  username: string;
}

// Details for specific GTA entry types
export interface InterchangeDetails {
  location: string;
}

export interface AlarmDetails {
  company: string;
  location: string;
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
  // New properties for two-step logging
  inProgress: boolean; // True if the entry is started but not completed
  entryType: 'TPL' | 'INTERCHANGE' | 'ALARM' | 'MANUAL';
  details?: InterchangeDetails | AlarmDetails;
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
  summary?: string;
  createdAt?: string;
  updatedAt?: string;
  // New property to determine the workflow
  mode: 'TPL' | 'GTA';
}

// QueuedItem remains for offline support
export interface QueuedItem {
  shiftId: string;
  entry: Entry;
  isUpdate: boolean; // Flag to know if it's a new entry or an update
  entryIndex?: number;
}
