import { Router } from 'express';
import * as dailyEntryController from '../controllers/dailyEntry.controller';

const router = Router();

/**
 * @swagger
 * /api/entries:
 *   post:
 *     summary: Create a new daily entry
 *     tags: [Daily Entries]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DailyEntry'
 *     responses:
 *       201:
 *         description: Entry created successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: User not found
 */
router.post('/', dailyEntryController.createDailyEntry);

/**
 * @swagger
 * /api/entries:
 *   get:
 *     summary: Get all entries with filtering and pagination
 *     tags: [Daily Entries]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (inclusive)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (inclusive)
 *       - in: query
 *         name: entryType
 *         schema:
 *           type: string
 *           enum: [credit, debit]
 *         description: Filter by entry type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of entries with pagination info
 */
router.get('/', dailyEntryController.getDailyEntries);

/**
 * @swagger
 * /api/entries/summary:
 *   get:
 *     summary: Get summary of entries for a user
 *     tags: [Daily Entries]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to get summary for
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for summary (inclusive)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for summary (inclusive)
 *     responses:
 *       200:
 *         description: Summary of entries grouped by date
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: User not found
 */
router.get('/summary', dailyEntryController.getDailySummary);

/**
 * @swagger
 * /api/entries/{id}:
 *   get:
 *     summary: Get a single entry by ID
 *     tags: [Daily Entries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Entry ID
 *     responses:
 *       200:
 *         description: Entry data
 *       400:
 *         description: Invalid entry ID
 *       404:
 *         description: Entry not found
 */
router.get('/:id', dailyEntryController.getDailyEntryById);

/**
 * @swagger
 * /api/entries/{id}:
 *   put:
 *     summary: Update an entry
 *     tags: [Daily Entries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Entry ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DailyEntry'
 *     responses:
 *       200:
 *         description: Entry updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Entry not found
 */
router.put('/:id', dailyEntryController.updateDailyEntry);

/**
 * @swagger
 * /api/entries/{id}:
 *   delete:
 *     summary: Delete an entry
 *     tags: [Daily Entries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Entry ID
 *     responses:
 *       200:
 *         description: Entry deleted successfully
 *       400:
 *         description: Invalid entry ID
 *       404:
 *         description: Entry not found
 */
router.delete('/:id', dailyEntryController.deleteDailyEntry);

export default router;
