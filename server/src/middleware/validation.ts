import { body, param, query } from 'express-validator';

export const userValidationRules = {
  createUser: [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    
    body('mobileNumber')
      .trim()
      .notEmpty().withMessage('Mobile number is required')
      .matches(/^[0-9]{10}$/).withMessage('Mobile number must be 10 digits'),
    
    body('employeeId')
      .optional()
      .trim()
      .isLength({ min: 3, max: 50 }).withMessage('Employee ID must be between 3 and 50 characters'),
    
    body('status')
      .optional()
      .isIn(['active', 'inactive']).withMessage('Invalid status'),
    
    body('permanentAddress')
      .isObject().withMessage('Permanent address is required')
      .custom((value) => {
        const requiredFields = ['doorNumber', 'street', 'area', 'localAddress', 'city', 'district', 'state', 'pinCode'];
        const missingFields = requiredFields.filter(field => !value[field]);
        if (missingFields.length > 0) {
          throw new Error(`Permanent address is missing required fields: ${missingFields.join(', ')}`);
        }
        return true;
      }),
    
    body('temporaryAddress')
      .optional()
      .isObject().withMessage('Temporary address must be an object')
      .custom((value) => {
        if (!value) return true;
        const requiredFields = ['doorNumber', 'street', 'area', 'localAddress', 'city', 'district', 'state', 'pinCode'];
        const missingFields = requiredFields.filter(field => value[field] === undefined || value[field] === '');
        if (missingFields.length > 0) {
          throw new Error(`Temporary address is missing required fields: ${missingFields.join(', ')}`);
        }
        return true;
      }),
    
    body('loanDetails')
      .optional()
      .isObject().withMessage('Loan details must be an object')
      .custom((value) => {
        if (!value) return true;
        const requiredFields = ['amount', 'interestRate', 'durationMonths', 'loanType', 'startDate'];
        const missingFields = requiredFields.filter(field => value[field] === undefined || value[field] === '');
        if (missingFields.length > 0) {
          throw new Error(`Loan details is missing required fields: ${missingFields.join(', ')}`);
        }
        
        if (value.amount <= 0) {
          throw new Error('Loan amount must be greater than 0');
        }
        
        if (value.interestRate < 0 || value.interestRate > 100) {
          throw new Error('Interest rate must be between 0 and 100');
        }
        
        if (value.durationMonths <= 0) {
          throw new Error('Duration must be greater than 0 months');
        }
        
        if (!['lend', 'borrow'].includes(value.loanType)) {
          throw new Error('Loan type must be either "lend" or "borrow"');
        }
        
        return true;
      })
  ],
  
  userIdParam: [
    param('id')
      .notEmpty().withMessage('User ID is required')
      .isMongoId().withMessage('Invalid user ID')
  ],
  
  listUsers: [
    query('status')
      .optional()
      .isIn(['active', 'inactive']).withMessage('Invalid status filter'),
    
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer')
      .toInt(),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
      .toInt(),
    
    query('search')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Search query is too long')
  ]
};

export const dailyEntryValidationRules = {
  createEntry: [
    body('userId')
      .notEmpty().withMessage('User ID is required')
      .isMongoId().withMessage('Invalid user ID'),
    
    body('date')
      .optional()
      .isISO8601().withMessage('Invalid date format')
      .toDate(),
    
    body('amount')
      .isNumeric().withMessage('Amount must be a number')
      .isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
    
    body('description')
      .trim()
      .notEmpty().withMessage('Description is required')
      .isLength({ max: 500 }).withMessage('Description is too long'),
    
    body('entryType')
      .isIn(['credit', 'debit']).withMessage('Entry type must be either credit or debit'),
    
    body('paymentMode')
      .isIn(['cash', 'bank_transfer', 'upi', 'other']).withMessage('Invalid payment mode'),
    
    body('referenceNumber')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Reference number is too long')
  ],
  
  entryIdParam: [
    param('id')
      .notEmpty().withMessage('Entry ID is required')
      .isMongoId().withMessage('Invalid entry ID')
  ],
  
  listEntries: [
    query('userId')
      .optional()
      .isMongoId().withMessage('Invalid user ID'),
    
    query('startDate')
      .optional()
      .isISO8601().withMessage('Invalid start date format'),
    
    query('endDate')
      .optional()
      .isISO8601().withMessage('Invalid end date format'),
    
    query('entryType')
      .optional()
      .isIn(['credit', 'debit']).withMessage('Invalid entry type'),
    
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer')
      .toInt(),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
      .toInt()
  ]
};
