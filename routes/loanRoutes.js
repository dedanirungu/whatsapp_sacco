const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');

// Loans listing page
router.get('/', loanController.getAllLoans);

// Loan details page
router.get('/:id', loanController.getLoanById);

// Loan repayment schedule
router.get('/:id/schedule', loanController.getLoanSchedule);

module.exports = router;