const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');

// Member listing page
router.get('/', memberController.getAllMembers);

// Member details page
router.get('/:id', memberController.getMemberById);

// Member transactions
router.get('/:id/transactions', memberController.getMemberTransactions);

// Member loans
router.get('/:id/loans', memberController.getMemberLoans);

module.exports = router;