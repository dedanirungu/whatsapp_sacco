const express = require('express');
const router = express.Router();
const messageController = require('../../controllers/messageController');

// Messages listing page
router.get('/', messageController.getAllMessagesWeb);

// Message details page
router.get('/:id', messageController.getMessageByIdWeb);

// Messages by member
router.get('/member/:member_id', messageController.getMessagesByMemberWeb);

module.exports = router;