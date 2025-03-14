const { Transaction, Member } = require('../models');
const { Op } = require('sequelize');

// Shared data fetching functions
const fetchAllTransactions = async () => {
  return await Transaction.findAll({
    include: [{
      model: Member,
      attributes: ['id', 'name', 'phone']
    }],
    order: [['timestamp', 'DESC']]
  });
};

const fetchTransactionById = async (id) => {
  return await Transaction.findByPk(id, {
    include: [{
      model: Member,
      attributes: ['id', 'name', 'phone']
    }]
  });
};

// Get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await fetchAllTransactions();
    res.render(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.render({ error: 'Failed to fetch transactions' });
  }
};

// Get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await fetchAllTransactions();
    res.render('transactions', {
      title: 'Transactions',
      transactions: transactions.map(transaction => transaction.toJSON()),
      activeTransactions: true
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.render('transactions', {
      title: 'Transactions',
      error: 'Error fetching transactions',
      activeTransactions: true
    });
  }
};

// Get transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await fetchTransactionById(req.params.id);
    
    if (!transaction) {
      return res.render({ error: 'Transaction not found' });
    }
    
    res.render(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.render({ error: 'Failed to fetch transaction' });
  }
};

// Get transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await fetchTransactionById(req.params.id);
    
    if (!transaction) {
      return res.render('error', {
        title: 'Error',
        message: 'Transaction not found'
      });
    }
    
    res.render('transaction-details', {
      title: 'Transaction Details',
      transaction: transaction.toJSON(),
      activeTransactions: true
    });
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    res.render('error', {
      title: 'Error',
      message: 'Error fetching transaction details'
    });
  }
};

// Create new transaction
exports.createTransaction = async (req, res) => {
  try {
    const { member_id, amount, type, description } = req.body;
    
    // Validate required fields
    if (!member_id || !amount || !type) {
        return res.render('error', {
          title: 'Error',
          message: 'Member ID, amount, and type are required'
        });
      }
    }
    
    // Validate transaction type
    const validTypes = ['deposit', 'withdrawal', 'loan', 'repayment'];
    if (!validTypes.includes(type)) {
        return res.render('error', {
          title: 'Error',
          message: 'Invalid transaction type. Valid types are: deposit, withdrawal, loan, repayment'
        });
      }
    }
    
    // Check if member exists
    const member = await Member.findByPk(member_id);
    if (!member) {
        return res.render('error', {
          title: 'Error',
          message: 'Member not found'
        });
      }
    }
    
    // Create transaction
    const newTransaction = await Transaction.create({
      member_id,
      amount: parseFloat(amount),
      type,
      description: description || ''
    });
    
    // Handle different response types
      res.redirect('/transactions');
    }
  } catch (error) {
    console.error('Error creating transaction:', error);
      res.render('error', {
        title: 'Error',
        message: 'Failed to create transaction: ' + error.message
      });
    }
  }
};

// Get transactions by type
exports.getTransactionsByType = async (req, res) => {
  try {
    const { type } = req.params;
    
    // Validate transaction type
    const validTypes = ['deposit', 'withdrawal', 'loan', 'repayment'];
    if (!validTypes.includes(type)) {
      return res.render('error', {
        title: 'Error',
        message: 'Invalid transaction type'
      });
    }
    
    const transactions = await Transaction.findAll({
      where: { type },
      include: [{ model: Member, attributes: ['id', 'name', 'phone'] }],
      order: [['timestamp', 'DESC']]
    });
    
    res.render('transactions', {
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Transactions`,
      transactions: transactions.map(transaction => transaction.toJSON()),
      activeTransactions: true,
      filterType: type
    });
  } catch (error) {
    console.error('Error fetching transactions by type:', error);
    res.render('error', {
      title: 'Error',
      message: 'Error fetching transactions'
    });
  }
};

// Get transactions by type
exports.getTransactionsByType = async (req, res) => {
  try {
    const { type } = req.params;
    
    // Validate transaction type
    const validTypes = ['deposit', 'withdrawal', 'loan', 'repayment'];
    if (!validTypes.includes(type)) {
      return res.render({ error: 'Invalid transaction type' });
    }
    
    const transactions = await Transaction.findAll({
      where: { type },
      include: [{ model: Member, attributes: ['id', 'name', 'phone'] }],
      order: [['timestamp', 'DESC']]
    });
    
    res.render(transactions);
  } catch (error) {
    console.error('Error fetching transactions by type:', error);
    res.render({ error: 'Failed to fetch transactions' });
  }
};