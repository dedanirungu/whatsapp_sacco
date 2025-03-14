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

// Get all loans
exports.getAllLoans = async (req, res) => {
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

// Get loan by ID
exports.getLoanById = async (req, res) => {
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
      return res.render({ 
        error: 'Member ID, amount, interest rate, loan type, and term are required' 
      });
    }
    
    // Validate loan type
    if (!['reducing', 'fixed'].includes(loan_type)) {
      return res.render({ error: "Loan type must be 'reducing' or 'fixed'" });
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
    
    // Redirect to loans list for web form submissions
    res.redirect('/loans');
  } catch (error) {
    console.error('Error creating loan:', error);
    res.render('error', {
      title: 'Error',
      message: 'Failed to create loan'
    });
  }
};

// Update loan status or description
exports.updateLoan = async (req, res) => {
  try {
    const { status, description } = req.body;
    
    // Only allow updating status and description
    if (!status && !description) {
      return res.render({ error: 'No valid fields to update' });
    }
    
    // Validate status if provided
    if (status && !['active', 'paid', 'defaulted', 'restructured'].includes(status)) {
      return res.render({ 
        error: "Status must be 'active', 'paid', 'defaulted', or 'restructured'" 
      });
    }
    
    const loan = await Loan.findByPk(req.params.id);
    if (!loan) {
      return res.render({ error: 'Loan not found' });
    }
    
    if (status) loan.status = status;
    if (description) loan.description = description;
    
    await loan.save();
    
    // Redirect back to loan details for web form submissions
    res.redirect(`/loans/${req.params.id}`);
  } catch (error) {
    console.error('Error updating loan:', error);
    res.render('error', {
      title: 'Error',
      message: 'Failed to update loan'
    });
  }
};

// Make a payment on a loan
exports.makeLoanPayment = async (req, res) => {
  try {
    const { amount } = req.body;
    const loanId = req.params.id;
    
    if (!amount || amount <= 0) {
      return res.render({ error: 'A positive payment amount is required' });
    }
    
    // First verify the loan exists
    const loan = await Loan.findByPk(loanId);
    if (!loan) {
      return res.render({ error: 'Loan not found' });
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
    
    // Redirect back to loan details for web form submissions
    res.redirect(`/loans/${loanId}`);
  } catch (error) {
    console.error('Error processing loan payment:', error);
    res.render('error', {
      title: 'Error',
      message: 'Failed to process loan payment'
    });
  }
};

// Get loan repayment schedule
exports.getLoanSchedule = async (req, res) => {
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