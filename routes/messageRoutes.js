const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

// Messages listing page
router.get('/', messageController.getAllMessages);

// Message details page
router.get('/:id', messageController.getMessageById);

// Messages by member
router.get('/member/:member_id', messageController.getMessagesByMember);

module.exports = router;