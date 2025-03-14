const express = require('express');
const router = express.Router();

const homeRoutes = require('./homeRoutes');
const memberRoutes = require('./memberRoutes');
const contributionRoutes = require('./contributionRoutes');
const loanRoutes = require('./loanRoutes');
const messageRoutes = require('./messageRoutes');
const transactionRoutes = require('./transactionRoutes');
const whatsappRoutes = require('./whatsappRoutes');

// Register web routes
router.use('/', homeRoutes);
router.use('/members', memberRoutes);
router.use('/contributions', contributionRoutes);
router.use('/loans', loanRoutes);
router.use('/messages', messageRoutes);
router.use('/transactions', transactionRoutes);
router.use('/whatsapp', whatsappRoutes);

module.exports = router;