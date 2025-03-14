const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');

// Get all members
router.get('/', memberController.getAllMembers);

// Get member by ID
router.get('/:id', memberController.getMemberById);

// Create new member
router.post('/', memberController.createMember);

// Update member
router.put('/:id', memberController.updateMember);

// Delete member
router.delete('/:id', memberController.deleteMember);

// Get member transactions
router.get('/:id/transactions', memberController.getMemberTransactions);

// Get member loans
router.get('/:id/loans', memberController.getMemberLoans);

module.exports = router;