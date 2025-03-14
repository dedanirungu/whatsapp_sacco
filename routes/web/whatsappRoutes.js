const express = require('express');
const router = express.Router();
const whatsappController = require('../../controllers/whatsappController');

// WhatsApp integration page
router.get('/', whatsappController.getWhatsappInterfaceWeb);

// WhatsApp QR code page
router.get('/qr', whatsappController.getQRCode);

module.exports = router;