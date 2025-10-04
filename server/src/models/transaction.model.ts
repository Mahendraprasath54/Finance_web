import { Schema, model, Document } from 'mongoose';

export interface ITransaction extends Document {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description?: string;
  date: Date;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    userId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default model<ITransaction>('Transaction', transactionSchema);
