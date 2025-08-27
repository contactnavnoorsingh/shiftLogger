import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  fullName: string;
  isAdmin: boolean;
  lastLogin: Date;
  onlineStatus: 'Online' | 'Offline';
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, required: true, trim: true },
  isAdmin: { type: Boolean, default: false },
  lastLogin: { type: Date, default: Date.now },
  onlineStatus: { type: String, enum: ['Online', 'Offline'], default: 'Offline' },
}, { timestamps: true });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
