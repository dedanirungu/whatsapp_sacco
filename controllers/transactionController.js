const { Transaction, Member } = require('../models');
const { Op } = require('sequelize');

// Get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      include: [{
        model: Member,
        attributes: ['name', 'phone']
      }],
      order: [['timestamp', 'DESC']]
    });
    
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

// Get transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id, {
      include: [{
        model: Member,
        attributes: ['name', 'phone']
      }]
    });
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
};

// Create new transaction
exports.createTransaction = async (req, res) => {
  try {
    const { member_id, amount, type, description } = req.body;
    
    if (!member_id || !amount || !type) {
      return res.status(400).json({ error: 'Member ID, amount, and type are required' });
    }
    
    // Validate transaction type
    const validTypes = ['deposit', 'withdrawal', 'loan', 'repayment'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid transaction type' });
    }
    
    const newTransaction = await Transaction.create({
      member_id,
      amount,
      type,
      description: description || ''
    });
    
    res.status(201).json(newTransaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
};