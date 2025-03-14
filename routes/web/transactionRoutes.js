const express = require('express');
const router = express.Router();
const transactionController = require('../../controllers/transactionController');

// Transactions listing page
router.get('/', transactionController.getAllTransactionsWeb);

// Transactions filtered by type
router.get('/type/:type', transactionController.getTransactionsByTypeWeb);

// Transaction details page
router.get('/:id', transactionController.getTransactionByIdWeb);

module.exports = router;