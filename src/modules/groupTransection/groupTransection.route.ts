import express from 'express';
import { userRole } from '../../constants';
import auth from '../../middleware/auth';
import groupTransactionController from './groupTransection.controller';
import { localeMiddleware } from '../../middleware/locale';

const groupTransactionRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Group Transactions
 *   description: Group transaction management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateGroupRequest:
 *       type: object
 *       required:
 *         - groupName
 *       properties:
 *         groupName:
 *           type: string
 *           description: Name of the group
 *           example: "Bangkok Trip"
 *     AddGroupMemberRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email of the member to add
 *           example: "friend@example.com"
 *     GroupExpenseRequest:
 *       type: object
 *       required:
 *         - totalExpenseAmount
 *         - currency
 *         - description
 *       properties:
 *         totalExpenseAmount:
 *           type: number
 *           description: Total amount of the expense
 *           example: 150.50
 *         currency:
 *           type: string
 *           enum: [USD, EUR, SGD, GBP, AUD]
 *           description: Currency of the expense
 *           example: "USD"
 *         description:
 *           type: string
 *           description: Description of the expense
 *           example: "Dinner at restaurant"
 *         category:
 *           type: string
 *           description: Expense category ID
 *         splitMethod:
 *           type: string
 *           enum: [equal, custom]
 *           description: How to split the expense
 *         participants:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               shareAmount:
 *                 type: number
 *           description: List of participants and their shares
 */

/**
 * @swagger
 * /api/v1/groupTransaction/createGroupTransaction:
 *   post:
 *     summary: Create a new group
 *     description: Create a new expense sharing group
 *     tags: [Group Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGroupRequest'
 *     responses:
 *       200:
 *         description: Group created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/GroupTransaction'
 *                 message:
 *                   type: string
 *                   example: "Group created successfully"
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
groupTransactionRouter.post('/createGroupTransaction', auth([userRole.user]), localeMiddleware, groupTransactionController.createGroupTransaction);

/**
 * @swagger
 * /api/v1/groupTransaction/addGroupMember/{groupId}:
 *   post:
 *     summary: Add member to group
 *     description: Add a new member to an existing group
 *     tags: [Group Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddGroupMemberRequest'
 *     responses:
 *       200:
 *         description: Member added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
groupTransactionRouter.post('/addGroupMember/:groupId', auth([userRole.user]), localeMiddleware, groupTransactionController.addGroupMember);

/**
 * @swagger
 * /api/v1/groupTransaction/getGroups:
 *   get:
 *     summary: Get user's groups
 *     description: Retrieve all groups that the user is a member or owner of, with financial summaries converted to user's preferred currency
 *     tags: [Group Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Groups retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalGroups:
 *                       type: number
 *                       example: 3
 *                     groups:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/GroupTransaction'
 *                 message:
 *                   type: string
 *                   example: "Groups retrieved successfully"
 *                 currencyNote:
 *                   type: string
 *                   example: "Amounts converted to EUR"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
groupTransactionRouter.get('/getGroups', auth([userRole.user]), localeMiddleware, groupTransactionController.getGroups);

/**
 * @swagger
 * /api/v1/groupTransaction/addGroupExpense/{groupId}:
 *   post:
 *     summary: Add expense to group
 *     description: Add a new expense to a group and split it among members
 *     tags: [Group Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GroupExpenseRequest'
 *     responses:
 *       200:
 *         description: Expense added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
groupTransactionRouter.post('/addGroupExpense/:groupId', auth([userRole.user]), localeMiddleware, groupTransactionController.addGroupExpense);

/**
 * @swagger
 * /api/v1/groupTransaction/getGroupTransactions/{groupId}:
 *   get:
 *     summary: Get group transactions
 *     description: Retrieve all transactions for a specific group with filtering options
 *     tags: [Group Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *       - in: query
 *         name: expenseView
 *         schema:
 *           type: string
 *           enum: [all, involving_me_only]
 *         description: Filter expenses based on user involvement
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *           enum: [i_borrowed, i_lent, all]
 *         description: Filter by transaction type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search expenses by category name or note
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
groupTransactionRouter.get('/getGroupTransactions/:groupId', auth([userRole.user]), localeMiddleware, groupTransactionController.getGroupTransactions);

/**
 * @swagger
 * /api/v1/groupTransaction/getGroupStatus/{groupId}:
 *   get:
 *     summary: Get group financial status
 *     description: Get comprehensive financial status and balances for a group
 *     tags: [Group Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     group:
 *                       type: object
 *                       properties:
 *                         groupId:
 *                           type: number
 *                         groupName:
 *                           type: string
 *                         ownerEmail:
 *                           type: string
 *                         totalMembers:
 *                           type: number
 *                         totalExpenses:
 *                           type: number
 *                     summary:
 *                       type: object
 *                       properties:
 *                         involvedAmount:
 *                           type: number
 *                         myExpensesAmount:
 *                           type: number
 *                         myExpensesPercentage:
 *                           type: number
 *                         netBalance:
 *                           type: object
 *                           properties:
 *                             amount:
 *                               type: number
 *                             status:
 *                               type: string
 *                               enum: [you_owe, you_are_owed, settled_up]
 *                             currency:
 *                               type: string
 *                 message:
 *                   type: string
 *                   example: "Group status retrieved successfully"
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
groupTransactionRouter.get('/getGroupStatus/:groupId', auth([userRole.user]), localeMiddleware, groupTransactionController.getGroupStatus);

/**
 * @swagger
 * /api/v1/groupTransaction/getGroupDetails/{groupId}:
 *   get:
 *     summary: Get detailed group information
 *     description: Get comprehensive group details including members, expenses, and financial breakdown
 *     tags: [Group Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
groupTransactionRouter.get('/getGroupDetails/:groupId', auth([userRole.user]), localeMiddleware, groupTransactionController.getGroupDetails);

/**
 * @swagger
 * /api/v1/groupTransaction/deleteGroup/{groupId}:
 *   delete:
 *     summary: Delete a group
 *     description: Delete a group (only owner can delete)
 *     tags: [Group Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Only group owner can delete
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
groupTransactionRouter.delete('/deleteGroup/:groupId', auth([userRole.user]), localeMiddleware, groupTransactionController.deleteGroup);

/**
 * @swagger
 * /api/v1/groupTransaction/removeMember/{groupId}/{memberEmail}:
 *   delete:
 *     summary: Remove member from group
 *     description: Remove a member from the group (only owner can remove members)
 *     tags: [Group Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *       - in: path
 *         name: memberEmail
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email of the member to remove
 *     responses:
 *       200:
 *         description: Member removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Only group owner can remove members
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
groupTransactionRouter.delete('/removeMember/:groupId/:memberEmail', auth([userRole.user]), localeMiddleware, groupTransactionController.removeMember);

/**
 * @swagger
 * /api/v1/groupTransaction/updateGroupName/{groupId}:
 *   patch:
 *     summary: Update group name
 *     description: Update the name of a group (only owner can update)
 *     tags: [Group Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupName
 *             properties:
 *               groupName:
 *                 type: string
 *                 description: New group name
 *                 example: "Updated Trip Name"
 *     responses:
 *       200:
 *         description: Group name updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Only group owner can update name
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
groupTransactionRouter.patch('/updateGroupName/:groupId', auth([userRole.user]), localeMiddleware, groupTransactionController.updateGroupName);

export default groupTransactionRouter;