// Calculate loan repayment schedule
exports.calculateLoanSchedule = (loan) => {
  const { amount, interest_rate, term_months, loan_type } = loan;
  const monthlyInterestRate = interest_rate / 100 / 12;
  const schedule = [];
  
  if (loan_type === 'fixed') {
    // Simple interest calculation
    const monthlyPrincipal = amount / term_months;
    const monthlyInterest = amount * monthlyInterestRate;
    const monthlyPayment = monthlyPrincipal + monthlyInterest;
    
    let remainingBalance = amount;
    
    for (let month = 1; month <= term_months; month++) {
      const principalPaid = monthlyPrincipal;
      const interestPaid = monthlyInterest;
      
      remainingBalance -= principalPaid;
      
      schedule.push({
        month,
        payment: monthlyPayment,
        principalPaid,
        interestPaid,
        totalPaid: month * monthlyPayment,
        remainingBalance: Math.max(0, remainingBalance)
      });
    }
  } else if (loan_type === 'reducing') {
    // Calculate payment using the formula for reducing balance
    // Formula: P * r * (1+r)^n / ((1+r)^n - 1)
    // Where P = principal, r = interest rate per period, n = number of periods
    const monthlyPayment = amount * monthlyInterestRate * 
      Math.pow(1 + monthlyInterestRate, term_months) / 
      (Math.pow(1 + monthlyInterestRate, term_months) - 1);
    
    let remainingBalance = amount;
    
    for (let month = 1; month <= term_months; month++) {
      const interestPaid = remainingBalance * monthlyInterestRate;
      const principalPaid = monthlyPayment - interestPaid;
      
      remainingBalance -= principalPaid;
      
      schedule.push({
        month,
        payment: monthlyPayment,
        principalPaid,
        interestPaid,
        totalPaid: month * monthlyPayment,
        remainingBalance: Math.max(0, remainingBalance)
      });
    }
  }
  
  return {
    schedule,
    totalPayment: schedule.reduce((sum, period) => sum + period.payment, 0),
    totalInterest: schedule.reduce((sum, period) => sum + period.interestPaid, 0),
    monthlyPayment: schedule[0].payment
  };
};