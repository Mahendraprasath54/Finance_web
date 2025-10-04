/**
 * Calculates the week number for a given date
 * @param date - The date to calculate week number for
 * @returns Object containing year and week number
 */
export const getWeekNumber = (date: Date): { year: number; week: number } => {
  const d = new Date(date);
  // Set to nearest Thursday (to handle weeks starting on Sunday)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  // January 4 is always in week 1
  const week1 = new Date(d.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks
  const weekNumber = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  return { year: d.getFullYear(), week: weekNumber };
};

/**
 * Checks if a payment is eligible for bonus
 * @param paymentDate - The date when payment was made
 * @param startDate - The start date of the scheme
 * @returns boolean indicating if bonus is applicable
 */
export const isEligibleForBonus = (paymentDate: Date, startDate: Date): boolean => {
  // Convert to start of day for comparison
  const payDate = new Date(paymentDate);
  payDate.setHours(0, 0, 0, 0);
  
  // Calculate days since start of scheme
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  const dayOfWeek = payDate.getDay();
  
  // Convert to Monday = 0, Tuesday = 1, ..., Sunday = 6
  const normalizedDay = (dayOfWeek + 6) % 7;
  
  // Check if it's within the first 5 days of the week (Monday to Friday)
  return normalizedDay < 5;
};

/**
 * Calculates the next payment due date
 * @param lastPaymentDate - The date of the last payment
 * @returns The next payment due date
 */
export const getNextPaymentDate = (lastPaymentDate: Date): Date => {
  const nextDate = new Date(lastPaymentDate);
  // Add 7 days to get to the same day next week
  nextDate.setDate(nextDate.getDate() + 7);
  return nextDate;
};

/**
 * Calculates bonus for a payment
 * @param paymentDate - The date when payment was made
 * @param startDate - The start date of the scheme
 * @returns The bonus amount (5 if eligible, 0 otherwise)
 */
export const calculateBonus = (paymentDate: Date, startDate: Date): number => {
  return isEligibleForBonus(paymentDate, startDate) ? 5 : 0;
};
