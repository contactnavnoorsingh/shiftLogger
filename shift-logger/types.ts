// types.ts

export interface User {
  _id: string;
  username: string;
}

// --- Entry Detail Interfaces ---
export interface InterchangeDetails {
  location: string;
}

export interface AlarmDetails {
  company: string;
  location: string;
}

export interface ParkingEnforcementDetails {
  vehicleDetails: string;
  actionTaken: 'Ticket Issued' | 'Vehicle Towed' | 'Warning Given' | 'Observed';
}

// --- Main Interfaces ---
export type EntryType = 
  | 'TPL_PATROL' 
  | 'TPL_ALARM' 
  | 'TPL_PARKING' 
  | 'GTA_INTERCHANGE' 
  | 'GTA_ALARM' 
  | 'MANUAL';

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
  inProgress: boolean;
  entryType: EntryType;
  details?: InterchangeDetails | AlarmDetails | ParkingEnforcementDetails;
}

export type ShiftMode = 
  | 'GTA_MOBILE' 
  | 'TPL_MOBILE' 
  | 'TPL_ALARM' 
  | 'TPL_PARKING' 
  | 'TPL_PATROL';

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
  mode: ShiftMode;
}

export interface QueuedItem {
  shiftId: string;
  entry: Entry;
  isUpdate: boolean;
  entryIndex?: number;
}
