const express = require('express');
const router = express.Router();
const memberRoutes = require('./api/memberRoutes');
const transactionRoutes = require('./api/transactionRoutes');
const loanRoutes = require('./api/loanRoutes');
const whatsappRoutes = require('./api/whatsappRoutes');
const contributionRoutes = require('./api/contributionRoutes');
const messageRoutes = require('./api/messageRoutes');

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