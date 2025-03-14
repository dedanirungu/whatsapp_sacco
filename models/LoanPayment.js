const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoanPayment = sequelize.define('LoanPayment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  loan_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  payment_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'loan_payments',
  timestamps: false
});

module.exports = LoanPayment;