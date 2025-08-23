export interface User {
  _id: string;
  username: string;
}

export interface Shift {
  _id: string;
  userId: string;
  date: string;
  timings: string;
  designation: string;
  entries: string[];
}