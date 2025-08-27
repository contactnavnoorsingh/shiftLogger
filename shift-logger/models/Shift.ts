import mongoose, { Schema, Document, Model } from 'mongoose';
import { IUser } from './User';
import { EntryType, ShiftMode, ShiftStatus, StatusCode } from '@/types';

export interface IEntry {
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
  details?: object;
}

export interface IShift extends Document {
  userId: IUser['_id'];
  date: string;
  timings: string;
  designation: string;
  startTime: Date;
  endTime: Date;
  entries: IEntry[];
  summary?: string;
  mode?: ShiftMode;
  status: ShiftStatus;
}

const EntrySchema: Schema = new Schema({
  time: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
  status: { type: String, required: true, enum: ['10-7', '10-8', '10-4', '10-6'] },
  site: { type: String, required: true, trim: true },
  staffName: { type: String, trim: true },
  guardName: { type: String, trim: true },
  guardChecks: [Boolean],
  ok: { type: Boolean, required: true },
  text: { type: String, required: true, trim: true },
  tenFour: { type: Boolean, default: false },
  manual: { type: Boolean, default: false },
  inProgress: { type: Boolean, default: false },
  entryType: { type: String, required: false },
  details: { type: Schema.Types.Mixed },
}, { timestamps: true }); // Add timestamps to each entry

const ShiftSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  timings: { type: String, required: true, trim: true },
  designation: { type: String, required: true, trim: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  summary: { type: String },
  entries: [EntrySchema],
  mode: { type: String, required: false },
  status: { type: String, enum: ['Active', 'Completed'], default: 'Active' },
}, { timestamps: true });

const Shift: Model<IShift> = mongoose.models.Shift || mongoose.model<IShift>('Shift', ShiftSchema);
export default Shift;
