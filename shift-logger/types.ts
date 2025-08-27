// types.ts

export interface User {
  _id: string;
  username: string;
  fullName: string;
  isAdmin?: boolean;
  lastLogin?: string; // For security logging
  onlineStatus?: 'Online' | 'Offline'; // For security logging
}

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

export type EntryType = 
  | 'TPL_PATROL' 
  | 'TPL_ALARM' 
  | 'TPL_PARKING' 
  | 'GTA_INTERCHANGE' 
  | 'GTA_ALARM' 
  | 'MANUAL';

export type StatusCode = '10-7' | '10-8' | '10-4' | '10-6';

export interface Entry {
  time: string;
  status: StatusCode;
  site: string;
  staffName?: string;
  guardName?: string;
  guardChecks?: boolean[];
  ok: boolean;
  text: string;
  tenFour: boolean;
  manual: boolean;
  inProgress: boolean;
  entryType?: EntryType;
  details?: InterchangeDetails | AlarmDetails | ParkingEnforcementDetails;
  createdAt?: string; // For security logging
}

export type ShiftMode = 
  | 'GTA_MOBILE' 
  | 'TPL_MOBILE' 
  | 'TPL_ALARM' 
  | 'TPL_PARKING' 
  | 'TPL_PATROL';

export type ShiftStatus = 'Active' | 'Completed';

export interface Shift {
  _id: string;
  userId: string | User; // Can be populated with User object
  date: string;
  timings: string;
  designation: string;
  startTime: string;
  endTime: string;
  entries: Entry[];
  summary?: string;
  createdAt?: string;
  updatedAt?: string;
  mode?: ShiftMode;
  status: ShiftStatus;
}

export interface QueuedItem {
  shiftId: string;
  entry: Entry;
  isUpdate: boolean;
  entryIndex?: number;
}
