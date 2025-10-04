import mongoose, { Document, Schema } from 'mongoose';

interface IAddress {
  doorNumber: string;
  street: string;
  area: string;
  localAddress: string;
  city: string;
  district: string;
  state: string;
  pinCode: string;
}

interface ILoanDetails {
  amount: number;
  interestRate: number;
  durationMonths: number;
  loanType: 'lend' | 'borrow';
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'defaulted';
}

export interface IUser extends Document {
  name: string;
  mobileNumber: string;
  employeeId: string;
  schemes: string[];
  permanentAddress: IAddress;
  temporaryAddress: IAddress;
  loanDetails?: ILoanDetails;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>({
  doorNumber: { type: String, required: true },
  street: { type: String, required: true },
  area: { type: String, required: true },
  localAddress: { type: String, required: true },
  city: { type: String, required: true },
  district: { type: String, required: true },
  state: { type: String, required: true },
  pinCode: { type: String, required: true }
});

const loanDetailsSchema = new Schema<ILoanDetails>({
  amount: { type: Number, required: true, min: 0 },
  interestRate: { type: Number, required: true, min: 0, max: 100 },
  durationMonths: { type: Number, required: true, min: 1 },
  loanType: { type: String, enum: ['lend', 'borrow'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'defaulted'], 
    default: 'active' 
  }
});

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  mobileNumber: { 
    type: String, 
    required: true,
    unique: true,
    match: /^[0-9]{10}$/
  },
  employeeId: { 
    type: String, 
    unique: true,
    index: true
  },
  schemes: [{
    type: String,
    enum: ['gold', 'savings', 'furniture'],
    required: true
  }],
  permanentAddress: { type: addressSchema, required: true },
  temporaryAddress: { type: addressSchema, required: true },
  loanDetails: { type: loanDetailsSchema }
}, {
  timestamps: true
});

// Add index for frequently queried fields
userSchema.index({ name: 'text', mobileNumber: 'text', 'permanentAddress.city': 'text' });

// Auto-generate employee ID before saving
userSchema.pre('save', async function(next) {
  if (!this.isNew) {
    this.updatedAt = new Date();
    return next();
  }
  
  try {
    // Find the last user and get the highest employeeId
    const UserModel = this.constructor as unknown as mongoose.Model<IUser>;
    const lastUser = await UserModel.findOne({}, { employeeId: 1 }).sort({ employeeId: -1 });
    let nextId = 1;
    
    if (lastUser && lastUser.employeeId) {
      const lastId = parseInt(lastUser.employeeId.replace('EMP', ''), 10);
      if (!isNaN(lastId)) {
        nextId = lastId + 1;
      }
    }
    
    // Format as EMP0001, EMP0002, etc.
    this.employeeId = `EMP${nextId.toString().padStart(4, '0')}`;
    this.updatedAt = new Date();
    next();
  } catch (error) {
    next(error as Error);
  }
});

export const User = mongoose.model<IUser>('User', userSchema);
