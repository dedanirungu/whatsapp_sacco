const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');

// Get all loans
router.get('/', loanController.getAllLoans);

// Get loan by ID with payment history
router.get('/:id', loanController.getLoanById);

// Create new loan
router.post('/', loanController.createLoan);

// Update loan status or description
router.put('/:id', loanController.updateLoan);

// Make a payment on a loan
router.post('/:id/payments', loanController.makeLoanPayment);

// Get loan repayment schedule
router.get('/:id/schedule', loanController.getLoanSchedule);

module.exports = router;