const express = require('express');
const router = express.Router();
const loanController = require('../../controllers/loanController');

// Loans listing page
router.get('/', loanController.getAllLoansWeb);

// Loan details page
router.get('/:id', loanController.getLoanByIdWeb);

// Loan repayment schedule
router.get('/:id/schedule', loanController.getLoanScheduleWeb);

module.exports = router;