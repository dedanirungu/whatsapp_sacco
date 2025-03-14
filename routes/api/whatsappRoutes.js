const express = require('express');
const router = express.Router();
const whatsappController = require('../../controllers/whatsappController');

// WhatsApp routes need the client instance
module.exports = (client) => {
  // Get QR code for WhatsApp authentication
  router.get('/qr', whatsappController.getQRCode);
  
  // Send a WhatsApp message
  router.post('/send', (req, res) => whatsappController.sendMessage(req, res, client));
  
  // Send message to a member by ID
  router.post('/members/:id/send', (req, res) => whatsappController.sendMessageToMember(req, res, client));
  
  // Send bulk message to members
  router.post('/members/bulk-send', (req, res) => whatsappController.sendBulkMessages(req, res, client));
  
  // Send loan payment reminders
  router.post('/loans/send-reminders', (req, res) => whatsappController.sendLoanReminders(req, res, client));
  
  return router;
};