const sequelize = require('../config/database');
const Member = require('./Member');
const Transaction = require('./Transaction');
const Loan = require('./Loan');
const LoanPayment = require('./LoanPayment');
const Contribution = require('./Contribution');
const Message = require('./Message');

// Define associations
Member.hasMany(Transaction, { foreignKey: 'member_id' });
Transaction.belongsTo(Member, { foreignKey: 'member_id' });

Member.hasMany(Loan, { foreignKey: 'member_id' });
Loan.belongsTo(Member, { foreignKey: 'member_id' });

Loan.hasMany(LoanPayment, { foreignKey: 'loan_id' });
LoanPayment.belongsTo(Loan, { foreignKey: 'loan_id' });

Member.hasMany(Contribution, { foreignKey: 'member_id' });
Contribution.belongsTo(Member, { foreignKey: 'member_id' });

Member.hasMany(Message, { foreignKey: 'member_id' });
Message.belongsTo(Member, { foreignKey: 'member_id' });

module.exports = {
  sequelize,
  Member,
  Transaction,
  Loan,
  LoanPayment,
  Contribution,
  Message
};