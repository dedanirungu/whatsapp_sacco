const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');

// Member listing page
router.get('/', memberController.getAllMembersWeb);

// Member details page
router.get('/:id', memberController.getMemberByIdWeb);

// Member transactions
router.get('/:id/transactions', memberController.getMemberTransactionsWeb);

// Member loans
router.get('/:id/loans', memberController.getMemberLoansWeb);

module.exports = router;