const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// Transactions listing page
router.get('/', transactionController.getAllTransactions);

// Transactions filtered by type
router.get('/type/:type', transactionController.getTransactionsByType);

// Transaction details page
router.get('/:id', transactionController.getTransactionById);

module.exports = router;