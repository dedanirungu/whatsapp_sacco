const { Member, Loan, LoanPayment } = require('../models');
const { calculateLoanSchedule } = require('../utils/loanCalculator');
const { Op } = require('sequelize');

// Store QR code data
let qrCodeData = null;

// Set the QR code data from an external source (client)
exports.setQRCode = (qrCode) => {
  qrCodeData = qrCode;
};

// Get the current QR code for WhatsApp authentication
exports.getQRCode = (req, res) => {
  if (qrCodeData) {
    res.render('whatsapp-qr', {
      title: 'WhatsApp QR Code',
      qrCode: qrCodeData,
      activeWhatsapp: true
    });
  } else {
    res.render('whatsapp', {
      title: 'WhatsApp Integration',
      error: 'QR code not available yet. Please wait a moment and try again.',
      activeWhatsapp: true
    });
  }
};

// Render WhatsApp interface
exports.getWhatsappInterface = (req, res) => {
  res.render('whatsapp', {
    title: 'WhatsApp Integration',
    activeWhatsapp: true
  });
};

// Send a WhatsApp message to a phone number
exports.sendMessage = async (req, res, client) => {
  try {
    const { number, message } = req.body;
    
    if (!number || !message) {
      return res.render('error', {
        title: 'Error',
        message: 'Number and message are required'
      });
    }
    
    // Format number to include WhatsApp format (add @ at the end)
    const formattedNumber = number.includes('@c.us') ? number : `${number}@c.us`;
    
    // Send the message
    const result = await client.sendMessage(formattedNumber, message);
    
    res.render('whatsapp', {
      title: 'WhatsApp Integration',
      success: 'Message sent successfully!',
      activeWhatsapp: true
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.render('error', {
      title: 'Error',
      message: 'Failed to send message: ' + error.message
    });
  }
};

// Send a message to a member by ID
exports.sendMessageToMember = async (req, res, client) => {
  try {
    const { message } = req.body;
    const memberId = req.params.id;
    
    if (!message) {
      return res.render('error', {
        title: 'Error',
        message: 'Message content is required'
      });
    }
    
    // Get member phone number
    const member = await Member.findByPk(memberId);
    
    if (!member) {
      return res.render('error', {
        title: 'Error',
        message: 'Member not found'
      });
    }
    
    try {
      // Format number and send message
      const formattedNumber = member.phone.includes('@c.us') ? member.phone : `${member.phone}@c.us`;
      const result = await client.sendMessage(formattedNumber, message);
      
      res.redirect(`/members/${memberId}`);
    } catch (error) {
      console.error('Error sending message:', error);
      res.render('error', {
        title: 'Error',
        message: 'Failed to send WhatsApp message: ' + error.message
      });
    }
  } catch (error) {
    console.error('Error in member message route:', error);
    res.render('error', {
      title: 'Error',
      message: 'Failed to process request: ' + error.message
    });
  }
};

// Send bulk messages to members
exports.sendBulkMessages = async (req, res, client) => {
  try {
    const { message, filter } = req.body;
    
    if (!message) {
      return res.render('error', {
        title: 'Error',
        message: 'Message content is required'
      });
    }
    
    // Build query based on filter
    const where = {};
    
    if (filter && Object.keys(filter).length > 0) {
      if (filter.name) {
        where.name = { [Op.like]: `%${filter.name}%` };
      }
      // Add more filter conditions as needed
    }
    
    const members = await Member.findAll({ where });
    
    if (!members || members.length === 0) {
      return res.render('error', {
        title: 'Error',
        message: 'No members found matching criteria'
      });
    }
    
    const results = [];
    const errors = [];
    
    // Send messages in sequence to avoid rate limiting
    for (const member of members) {
      try {
        const formattedNumber = member.phone.includes('@c.us') ? member.phone : `${member.phone}@c.us`;
        const result = await client.sendMessage(formattedNumber, message);
        results.push({
          memberId: member.id,
          messageId: result.id._serialized,
          success: true
        });
      } catch (error) {
        console.error(`Error sending message to ${member.phone}:`, error);
        errors.push({
          memberId: member.id,
          error: error.message
        });
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    res.render('whatsapp-bulk-result', {
      title: 'Bulk Message Results',
      totalSent: results.length,
      totalFailed: errors.length,
      successDetails: results,
      failures: errors,
      activeWhatsapp: true
    });
  } catch (error) {
    console.error('Error in bulk message route:', error);
    res.render('error', {
      title: 'Error',
      message: 'Failed to process bulk message request: ' + error.message
    });
  }
};

// Send loan payment reminders to members with active loans
exports.sendLoanReminders = async (req, res, client) => {
  try {
    const { customMessage } = req.body;
    
    // Get all active loans with member information
    const loans = await Loan.findAll({
      where: { status: 'active' },
      include: [{
        model: Member,
        attributes: ['id', 'name', 'phone']
      }],
      order: [['id', 'ASC']]
    });
    
    if (!loans || loans.length === 0) {
      return res.render('error', {
        title: 'Error',
        message: 'No active loans found'
      });
    }
    
    const results = [];
    const errors = [];
    
    // Process each loan
    for (const loan of loans) {
      try {
        // Calculate loan schedule
        const loanSchedule = calculateLoanSchedule(loan);
        const nextPaymentAmount = loanSchedule.monthlyPayment;
        
        // Get all payments for this loan
        const payments = await loan.getLoanPayments();
        
        // Calculate total paid and remaining balance
        const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const remainingBalance = Math.max(0, loan.amount - totalPaid);
        
        // Create reminder message
        let message = customMessage || 
          `Dear ${loan.Member.name}, this is a reminder for your loan payment.\n\n` +
          `Loan ID: ${loan.id}\n` +
          `Loan Amount: ${loan.amount}\n` +
          `Total Paid: ${totalPaid.toFixed(2)}\n` +
          `Remaining Balance: ${remainingBalance.toFixed(2)}\n` +
          `Suggested Payment: ${nextPaymentAmount.toFixed(2)}\n\n` +
          `Please make your payment on time to maintain a good credit record.`;
        
        // Send the message
        const formattedNumber = loan.Member.phone.includes('@c.us') ? 
          loan.Member.phone : `${loan.Member.phone}@c.us`;
        
        const result = await client.sendMessage(formattedNumber, message);
        
        results.push({
          loanId: loan.id,
          memberId: loan.Member.id,
          memberName: loan.Member.name,
          messageId: result.id._serialized,
          success: true
        });
      } catch (error) {
        console.error(`Error sending reminder for loan ${loan.id}:`, error);
        errors.push({
          loanId: loan.id,
          memberId: loan.Member?.id,
          memberName: loan.Member?.name,
          error: error.message
        });
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    res.render('whatsapp-reminder-result', {
      title: 'Loan Reminder Results',
      totalSent: results.length,
      totalFailed: errors.length,
      successDetails: results,
      failures: errors,
      activeWhatsapp: true
    });
  } catch (error) {
    console.error('Error in loan reminders route:', error);
    res.render('error', {
      title: 'Error',
      message: 'Failed to process loan reminders: ' + error.message
    });
  }
};