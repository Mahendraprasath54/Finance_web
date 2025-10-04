import { Request, Response, NextFunction } from 'express';
import { DailyEntry } from '../models/dailyEntry.model';
import { User } from '../models/user.model';
import { ApiError } from '../middleware/errorHandler';
import { Types } from 'mongoose';
import { startOfDay, endOfDay } from 'date-fns';

// Helper function to validate request
function validateDailyEntryRequest(req: Request) {
  const errors: { field: string; message: string }[] = [];
  
  if (!req.body.userId || !Types.ObjectId.isValid(req.body.userId)) {
    errors.push({ field: 'userId', message: 'Valid user ID is required' });
  }
  
  if (req.body.amount === undefined || isNaN(Number(req.body.amount)) || Number(req.body.amount) <= 0) {
    errors.push({ field: 'amount', message: 'Valid positive amount is required' });
  }
  
  if (!req.body.entryType || !['credit', 'debit'].includes(req.body.entryType)) {
    errors.push({ field: 'entryType', message: 'Entry type must be either credit or debit' });
  }
  
  if (!req.body.date || isNaN(Date.parse(req.body.date))) {
    errors.push({ field: 'date', message: 'Valid date is required' });
  }
  
  if (!req.body.paymentMode || typeof req.body.paymentMode !== 'string') {
    errors.push({ field: 'paymentMode', message: 'Payment mode is required' });
  }

  return errors.length > 0 ? errors : null;
}

// Create a new daily entry
export const createDailyEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationErrors = validateDailyEntryRequest(req);
    if (validationErrors) {
      return next(ApiError.badRequest('Validation failed', validationErrors));
    }

    const { userId, ...entryData } = req.body;

    if (!Types.ObjectId.isValid(userId)) {
      return next(ApiError.badRequest('Invalid user ID'));
    }

    // Check if user exists
    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      return next(ApiError.notFound('User not found'));
    }

    const entry = new DailyEntry({
      user: userId,
      ...entryData,
      date: new Date(entryData.date)
    });

    await entry.save();

    res.status(201).json({
      success: true,
      data: entry
    });
  } catch (error) {
    next(error);
  }
};

// Get daily entries
export const getDailyEntries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, startDate, endDate, entryType, page = '1', limit = '10' } = req.query;

    const query: any = {};

    if (userId) {
      if (!Types.ObjectId.isValid(userId as string)) {
        return next(ApiError.badRequest('Invalid user ID'));
      }
      query.user = userId;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate as string);
        if (isNaN(start.getTime())) {
          return next(ApiError.badRequest('Invalid start date'));
        }
        query.date.$gte = startOfDay(start);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        if (isNaN(end.getTime())) {
          return next(ApiError.badRequest('Invalid end date'));
        }
        query.date.$lte = endOfDay(end);
      }
    }

    if (entryType && ['credit', 'debit'].includes(entryType as string)) {
      query.entryType = entryType;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [entries, total] = await Promise.all([
      DailyEntry.find(query)
        .populate('user', 'name mobileNumber')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      DailyEntry.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: entries,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get a single entry by ID
export const getDailyEntryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return next(ApiError.badRequest('Invalid entry ID'));
    }

    const entry = await DailyEntry.findById(id)
      .populate('user', 'name mobileNumber');

    if (!entry) {
      return next(ApiError.notFound('Entry not found'));
    }

    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    next(error);
  }
};

// Update a daily entry
export const updateDailyEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return next(ApiError.badRequest('Invalid entry ID'));
    }

    const validationErrors = validateDailyEntryRequest(req);
    if (validationErrors) {
      return next(ApiError.badRequest('Validation failed', validationErrors));
    }

    const updates = req.body;

    // Prevent updating certain fields
    const { _id, user, createdAt, ...allowedUpdates } = updates;

    // Validate date if provided
    if (allowedUpdates.date) {
      const date = new Date(allowedUpdates.date);
      if (isNaN(date.getTime())) {
        return next(ApiError.badRequest('Invalid date format'));
      }
      allowedUpdates.date = date;
    }

    const entry = await DailyEntry.findByIdAndUpdate(
      id,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    );

    if (!entry) {
      return next(ApiError.notFound('Entry not found'));
    }

    res.json({
      success: true,
      data: entry
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message
      }));
      return next(ApiError.badRequest('Validation failed', errors));
    }
    next(error);
  }
};

// Delete a daily entry
export const deleteDailyEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return next(ApiError.badRequest('Invalid entry ID'));
    }

    const entry = await DailyEntry.findByIdAndDelete(id);

    if (!entry) {
      return next(ApiError.notFound('Entry not found'));
    }

    res.json({
      success: true,
      message: 'Entry deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get summary of entries for a user
export const getDailySummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, startDate, endDate } = req.query;

    if (!userId) {
      return next(ApiError.badRequest('User ID is required'));
    }

    if (!Types.ObjectId.isValid(userId as string)) {
      return next(ApiError.badRequest('Invalid user ID'));
    }

    // Check if user exists
    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      return next(ApiError.notFound('User not found'));
    }

    const match: any = { user: new Types.ObjectId(userId as string) };
    
    if (startDate) {
      const start = new Date(startDate as string);
      if (isNaN(start.getTime())) {
        return next(ApiError.badRequest('Invalid start date'));
      }
      match.date = { ...match.date, $gte: startOfDay(start) };
    }

    if (endDate) {
      const end = new Date(endDate as string);
      if (isNaN(end.getTime())) {
        return next(ApiError.badRequest('Invalid end date'));
      }
      match.date = { ...match.date, $lte: endOfDay(end) };
    }
    
    const result = await DailyEntry.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalCredit: {
            $sum: { $cond: [{ $eq: ['$entryType', 'credit'] }, '$amount', 0] }
          },
          totalDebit: {
            $sum: { $cond: [{ $eq: ['$entryType', 'debit'] }, '$amount', 0] }
          },
          count: { $sum: 1 },
          entries: { $push: '$$ROOT' }
        }
      },
      {
        $project: {
          _id: 0,
          totalCredit: 1,
          totalDebit: 1,
          balance: { $subtract: ['$totalCredit', '$totalDebit'] },
          count: 1,
          entries: {
            $map: {
              input: '$entries',
              as: 'entry',
              in: {
                id: '$$entry._id',
                amount: '$$entry.amount',
                entryType: '$$entry.entryType',
                date: '$$entry.date',
                paymentMode: '$$entry.paymentMode',
                description: '$$entry.description'
              }
            }
          }
        }
      }
    ]);
    
    const summary = result[0] || { 
      totalCredit: 0, 
      totalDebit: 0, 
      balance: 0, 
      count: 0,
      entries: []
    };
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};
