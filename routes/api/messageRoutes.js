const express = require('express');
const router = express.Router();
const messageController = require('../../controllers/messageController');

// GET all messages
router.get('/', messageController.getAllMessages);

// GET a single message by ID
router.get('/:id', messageController.getMessageById);

// POST a new message
router.post('/', messageController.createMessage);

// GET messages by member ID
router.get('/member/:member_id', messageController.getMessagesByMember);

module.exports = router;