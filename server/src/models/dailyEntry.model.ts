import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './user.model';

export interface IDailyEntry extends Document {
  user: mongoose.Types.ObjectId | IUser;
  date: Date;
  amount: number;
  description: string;
  entryType: 'credit' | 'debit';
  paymentMode: 'cash' | 'bank_transfer' | 'upi' | 'other';
  referenceNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const dailyEntrySchema = new Schema<IDailyEntry>({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  date: { 
    type: Date, 
    required: true,
    default: Date.now 
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0 
  },
  description: { 
    type: String, 
    required: true,
    trim: true 
  },
  entryType: { 
    type: String, 
    enum: ['credit', 'debit'],
    required: true 
  },
  paymentMode: { 
    type: String, 
    enum: ['cash', 'bank_transfer', 'upi', 'other'],
    required: true 
  },
  referenceNumber: { 
    type: String, 
    trim: true 
  }
}, {
  timestamps: true
});

// Index for faster queries
dailyEntrySchema.index({ user: 1, date: -1 });
dailyEntrySchema.index({ date: -1 });

// Middleware to update the updatedAt field
dailyEntrySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const DailyEntry = mongoose.model<IDailyEntry>('DailyEntry', dailyEntrySchema);
