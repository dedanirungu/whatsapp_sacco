const express = require('express');
const router = express.Router();
const memberRoutes = require('./memberRoutes');
const transactionRoutes = require('./transactionRoutes');
const loanRoutes = require('./loanRoutes');
const whatsappRoutes = require('./whatsappRoutes');
const contributionRoutes = require('./contributionRoutes');
const messageRoutes = require('./messageRoutes');

module.exports = (client) => {
  // API routes
  router.use('/members', memberRoutes);
  router.use('/transactions', transactionRoutes);
  router.use('/loans', loanRoutes);
  router.use('/whatsapp', whatsappRoutes(client));
  router.use('/contributions', contributionRoutes);
  router.use('/messages', messageRoutes);
  
  return router;
};