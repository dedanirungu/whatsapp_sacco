const { Loan, LoanPayment, Member, Transaction } = require('../models');
const { calculateLoanSchedule } = require('../utils/loanCalculator');
const { Op } = require('sequelize');

// Get all loans
exports.getAllLoans = async (req, res) => {
  try {
    const loans = await Loan.findAll({
      include: [{
        model: Member,
        attributes: ['name', 'phone']
      }],
      order: [['start_date', 'DESC']]
    });
    
    res.json(loans);
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
};

// Get loan by ID with payment history
exports.getLoanById = async (req, res) => {
  try {
    const loan = await Loan.findByPk(req.params.id, {
      include: [{
        model: Member,
        attributes: ['name', 'phone']
      }]
    });
    
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    
    // Get loan payments
    const payments = await LoanPayment.findAll({
      where: { loan_id: req.params.id },
      order: [['payment_date', 'DESC']]
    });
    
    // Calculate total paid
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    res.json({
      ...loan.toJSON(),
      payments,
      totalPaid,
      remainingBalance: loan.amount - totalPaid
    });
  } catch (error) {
    console.error('Error fetching loan:', error);
    res.status(500).json({ error: 'Failed to fetch loan' });
  }
};

// Create new loan
exports.createLoan = async (req, res) => {
  try {
    const { member_id, amount, interest_rate, loan_type, term_months, description } = req.body;
    
    if (!member_id || !amount || !interest_rate || !loan_type || !term_months) {
      return res.status(400).json({ 
        error: 'Member ID, amount, interest rate, loan type, and term are required' 
      });
    }
    
    // Validate loan type
    if (!['reducing', 'fixed'].includes(loan_type)) {
      return res.status(400).json({ error: "Loan type must be 'reducing' or 'fixed'" });
    }
    
    // Calculate end date (start date + term months)
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + term_months);
    
    // Create the loan
    const newLoan = await Loan.create({
      member_id,
      amount,
      interest_rate,
      loan_type,
      term_months,
      description: description || '',
      start_date: startDate,
      end_date: endDate
    });
    
    // Create a transaction record for the loan disbursement
    await Transaction.create({
      member_id,
      amount,
      type: 'loan',
      description: `Loan disbursement (ID: ${newLoan.id})`
    });
    
    res.status(201).json(newLoan);
  } catch (error) {
    console.error('Error creating loan:', error);
    res.status(500).json({ error: 'Failed to create loan' });
  }
};

// Update loan status or description
exports.updateLoan = async (req, res) => {
  try {
    const { status, description } = req.body;
    
    // Only allow updating status and description
    if (!status && !description) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    // Validate status if provided
    if (status && !['active', 'paid', 'defaulted', 'restructured'].includes(status)) {
      return res.status(400).json({ 
        error: "Status must be 'active', 'paid', 'defaulted', or 'restructured'" 
      });
    }
    
    const loan = await Loan.findByPk(req.params.id);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    
    if (status) loan.status = status;
    if (description) loan.description = description;
    
    await loan.save();
    
    res.json({ 
      id: parseInt(req.params.id), 
      status: status || undefined,
      description: description || undefined,
      updated: true 
    });
  } catch (error) {
    console.error('Error updating loan:', error);
    res.status(500).json({ error: 'Failed to update loan' });
  }
};

// Make a payment on a loan
exports.makeLoanPayment = async (req, res) => {
  try {
    const { amount } = req.body;
    const loanId = req.params.id;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'A positive payment amount is required' });
    }
    
    // First verify the loan exists
    const loan = await Loan.findByPk(loanId);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    
    // Process the payment
    const payment = await LoanPayment.create({
      loan_id: loanId,
      amount
    });
    
    // Create a transaction record for the loan payment
    await Transaction.create({
      member_id: loan.member_id,
      amount,
      type: 'repayment',
      description: `Loan payment (Loan ID: ${loanId})`
    });
    
    // Get all payments to calculate if loan is fully paid
    const payments = await LoanPayment.findAll({
      where: { loan_id: loanId }
    });
    
    // Calculate total paid
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // If fully paid, update loan status
    if (totalPaid >= loan.amount) {
      loan.status = 'paid';
      await loan.save();
    }
    
    res.status(201).json({
      id: payment.id,
      loan_id: parseInt(loanId),
      amount,
      payment_date: payment.payment_date,
      totalPaid,
      remainingBalance: Math.max(0, loan.amount - totalPaid),
      isFullyPaid: totalPaid >= loan.amount
    });
  } catch (error) {
    console.error('Error processing loan payment:', error);
    res.status(500).json({ error: 'Failed to process loan payment' });
  }
};

// Get loan repayment schedule
exports.getLoanSchedule = async (req, res) => {
  try {
    const loan = await Loan.findByPk(req.params.id);
    
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    
    // Calculate loan schedule
    const schedule = calculateLoanSchedule(loan);
    
    // Get actual payments made
    const payments = await LoanPayment.findAll({
      where: { loan_id: req.params.id },
      order: [['payment_date', 'ASC']]
    });
    
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    res.json({
      loan,
      ...schedule,
      actualPayments: payments,
      totalPaid,
      remainingBalance: Math.max(0, loan.amount - totalPaid)
    });
  } catch (error) {
    console.error('Error generating loan schedule:', error);
    res.status(500).json({ error: 'Failed to generate loan schedule' });
  }
};