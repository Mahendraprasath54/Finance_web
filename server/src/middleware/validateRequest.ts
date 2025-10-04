import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain as ExpressValidationChain } from 'express-validator';
import { ApiError } from './errorHandler';

// Extend the Express ValidationChain to include the run method
export interface ValidationChain extends ExpressValidationChain {
  run: (req: Request) => Promise<any>;
}

// Middleware to validate request using express-validator
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error: any) => ({
      field: error.param,
      message: error.msg
    }));
    
    return next(ApiError.badRequest('Validation failed', errorMessages));
  }
  next();
};

// Higher-order function to validate request with specific validation rules
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Run all validations in parallel
      await Promise.all(validations.map(validation => validation.run(req)));
      
      const errors = validationResult(req);
      if (errors.isEmpty()) {
        return next();
      }
      
      const errorMessages = errors.array().map((error: any) => ({
        field: error.param,
        message: error.msg
      }));
      
      next(ApiError.badRequest('Validation failed', errorMessages));
    } catch (error) {
      next(error);
    }
  };
};
