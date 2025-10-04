import { Request, Response, NextFunction } from 'express';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  public statusCode: number;
  public errors?: any[];
  public isOperational: boolean;

  constructor(
    statusCode: number, 
    message: string, 
    errors?: any[],
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Bad Request (400) - The request was invalid or cannot be served
   */
  static badRequest(message: string, errors?: any[]) {
    return new ApiError(400, message, errors);
  }

  /**
   * Unauthorized (401) - Authentication is required and has failed or has not been provided
   */
  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  /**
   * Forbidden (403) - The request was valid, but the server is refusing action
   */
  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  /**
   * Not Found (404) - The requested resource could not be found
   */
  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  /**
   * Conflict (409) - Request conflicts with current state of the target resource
   */
  static conflict(message: string) {
    return new ApiError(409, message);
  }

  /**
   * Internal Server Error (500) - A generic error message
   */
  static internal(message = 'Internal Server Error') {
    return new ApiError(500, message);
  }
}

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Handle ApiError instances
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors
    });
  }

  // Handle MongoDB duplicate key error
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `Duplicate field value: ${field}. Please use another value.`,
      errors: [{
        field,
        message: `This ${field} is already in use.`
      }]
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values((err as any).errors).map((el: any) => ({
      field: el.path,
      message: el.message
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  // Handle invalid MongoDB ID
  if (err.name === 'CastError') {
    const castError = err as any;
    return res.status(400).json({
      success: false,
      message: `Invalid ID format: ${castError.value}`,
      errors: [{
        field: castError.path,
        message: 'Please provide a valid ID'
      }]
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again!'
    });
  }

  // Log the error for server-side debugging
  console.error(`[${new Date().toISOString()}] Error: ${err.message}`, {
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Default error response for unhandled errors
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err
    })
  });
};
