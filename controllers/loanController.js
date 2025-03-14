const { Loan, LoanPayment, Member, Transaction } = require('../models');
const { calculateLoanSchedule } = require('../utils/loanCalculator');
const { Op } = require('sequelize');

// Shared data fetching functions
const fetchAllLoans = async () => {
  return await Loan.findAll({
    include: [{
      model: Member,
      attributes: ['id', 'name', 'phone']
    }],
    order: [['start_date', 'DESC']]
  });
};

const fetchLoanById = async (id) => {
  return await Loan.findByPk(id, {
    include: [{
      model: Member,
      attributes: ['id', 'name', 'phone']
    }]
  });
};

const fetchLoanPayments = async (loanId) => {
  return await LoanPayment.findAll({
    where: { loan_id: loanId },
    order: [['payment_date', 'DESC']]
  });
};

const calculateTotalPaid = (payments) => {
  return payments.reduce((sum, payment) => sum + payment.amount, 0);
};

// API: Get all loans
exports.getAllLoans = async (req, res) => {
  try {
    const loans = await fetchAllLoans();
    res.json(loans);
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
};

// Web: Get all loans
exports.getAllLoansWeb = async (req, res) => {
  try {
    const loans = await fetchAllLoans();
    res.render('loans', {
      title: 'Loans',
      loans: loans.map(loan => loan.toJSON()),
      activeLoans: true
    });
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.render('loans', {
      title: 'Loans',
      error: 'Error fetching loans',
      activeLoans: true
    });
  }
};

// API: Get loan by ID with payment history
exports.getLoanById = async (req, res) => {
  try {
    const loan = await fetchLoanById(req.params.id);
    
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    
    // Get loan payments
    const payments = await fetchLoanPayments(req.params.id);
    
    // Calculate total paid
    const totalPaid = calculateTotalPaid(payments);
    
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

// Web: Get loan by ID
exports.getLoanByIdWeb = async (req, res) => {
  try {
    const loan = await Loan.findByPk(req.params.id, {
      include: [
        { model: Member },
        { model: LoanPayment }
      ]
    });
    
    if (!loan) {
      return res.render('error', {
        title: 'Error',
        message: 'Loan not found'
      });
    }
    
    // Calculate total paid
    const totalPaid = loan.LoanPayments ? 
      loan.LoanPayments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
    
    const loanData = loan.toJSON();
    loanData.totalPaid = totalPaid;
    loanData.remainingBalance = Math.max(0, loan.amount - totalPaid);
    
    res.render('loan-details', {
      title: `Loan Details`,
      loan: loanData,
      activeLoans: true
    });
  } catch (error) {
    console.error('Error fetching loan details:', error);
    res.render('error', {
      title: 'Error',
      message: 'Error fetching loan details'
    });
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
    
    // Handle different response types based on Accept header or query param
    if (req.headers.accept === 'application/json' || req.query.format === 'json') {
      res.status(201).json(newLoan);
    } else {
      // Redirect to loans list for web form submissions
      res.redirect('/loans');
    }
  } catch (error) {
    console.error('Error creating loan:', error);
    if (req.headers.accept === 'application/json' || req.query.format === 'json') {
      res.status(500).json({ error: 'Failed to create loan' });
    } else {
      res.render('error', {
        title: 'Error',
        message: 'Failed to create loan'
      });
    }
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
    
    // Handle different response types based on Accept header or query param
    if (req.headers.accept === 'application/json' || req.query.format === 'json') {
      res.json({ 
        id: parseInt(req.params.id), 
        status: status || undefined,
        description: description || undefined,
        updated: true 
      });
    } else {
      // Redirect back to loan details for web form submissions
      res.redirect(`/loans/${req.params.id}`);
    }
  } catch (error) {
    console.error('Error updating loan:', error);
    if (req.headers.accept === 'application/json' || req.query.format === 'json') {
      res.status(500).json({ error: 'Failed to update loan' });
    } else {
      res.render('error', {
        title: 'Error',
        message: 'Failed to update loan'
      });
    }
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
    const totalPaid = calculateTotalPaid(payments);
    
    // If fully paid, update loan status
    if (totalPaid >= loan.amount) {
      loan.status = 'paid';
      await loan.save();
    }
    
    // Handle different response types based on Accept header or query param
    if (req.headers.accept === 'application/json' || req.query.format === 'json') {
      res.status(201).json({
        id: payment.id,
        loan_id: parseInt(loanId),
        amount,
        payment_date: payment.payment_date,
        totalPaid,
        remainingBalance: Math.max(0, loan.amount - totalPaid),
        isFullyPaid: totalPaid >= loan.amount
      });
    } else {
      // Redirect back to loan details for web form submissions
      res.redirect(`/loans/${loanId}`);
    }
  } catch (error) {
    console.error('Error processing loan payment:', error);
    if (req.headers.accept === 'application/json' || req.query.format === 'json') {
      res.status(500).json({ error: 'Failed to process loan payment' });
    } else {
      res.render('error', {
        title: 'Error',
        message: 'Failed to process loan payment'
      });
    }
  }
};

// API: Get loan repayment schedule
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
    
    const totalPaid = calculateTotalPaid(payments);
    
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

// Web: Get loan repayment schedule
exports.getLoanScheduleWeb = async (req, res) => {
  try {
    const loan = await Loan.findByPk(req.params.id, {
      include: [{ model: Member }]
    });
    
    if (!loan) {
      return res.render('error', {
        title: 'Error',
        message: 'Loan not found'
      });
    }
    
    // Calculate loan schedule
    const schedule = calculateLoanSchedule(loan);
    
    // Get actual payments made
    const payments = await LoanPayment.findAll({
      where: { loan_id: req.params.id },
      order: [['payment_date', 'ASC']]
    });
    
    const totalPaid = calculateTotalPaid(payments);
    
    res.render('loan-schedule', {
      title: 'Loan Repayment Schedule',
      loan: loan.toJSON(),
      schedule: schedule.schedule,
      totalInterest: schedule.totalInterest,
      totalPayment: schedule.totalPayment,
      actualPayments: payments.map(payment => payment.toJSON()),
      totalPaid,
      remainingBalance: Math.max(0, loan.amount - totalPaid),
      activeLoans: true
    });
  } catch (error) {
    console.error('Error generating loan schedule:', error);
    res.render('error', {
      title: 'Error',
      message: 'Error generating loan schedule'
    });
  }
};