const mongoose = require('mongoose');

const EntrySchema = new mongoose.Schema({
  time: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
  status: { type: String, required: true, enum: ['10-7', '10-8'] },
  site: { type: String, required: true, trim: true },
  staffName: { type: String, trim: true },
  guardName: { type: String, trim: true },
  guardChecks: [Boolean],
  ok: { type: Boolean, required: true },
  text: { type: String, required: true, trim: true },
  tenFour: { type: Boolean, default: false },
  manual: { type: Boolean, default: false }
});

const ShiftSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // "YYYY-MM-DD"
  timings: { type: String, required: true, trim: true },
  designation: { type: String, required: true, trim: true },
  entries: [EntrySchema],
}, { timestamps: true });

// Create a unique compound index on userId and date
ShiftSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Shift', ShiftSchema);