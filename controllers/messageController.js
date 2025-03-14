const { Message, Member } = require('../models');

// Get all messages
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await Message.findAll({
      include: [{ model: Member, attributes: ['id', 'name', 'phone'] }],
      order: [['timestamp', 'DESC']]
    });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};

// Get a single message
exports.getMessageById = async (req, res) => {
  try {
    const message = await Message.findByPk(req.params.id, {
      include: [{ model: Member, attributes: ['id', 'name', 'phone'] }]
    });
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching message', error: error.message });
  }
};

// Create a new message
exports.createMessage = async (req, res) => {
  try {
    const { member_id, message } = req.body;
    
    // Validate required fields
    if (!member_id || !message) {
      return res.status(400).json({ message: 'Member ID and message content are required' });
    }
    
    // Check if member exists
    const member = await Member.findByPk(member_id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    // Create message in database
    const newMessage = await Message.create({
      member_id,
      message
    });
    
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: 'Error creating message', error: error.message });
  }
};

// Get messages by member
exports.getMessagesByMember = async (req, res) => {
  try {
    const memberId = req.params.member_id;
    
    // Check if member exists
    const member = await Member.findByPk(memberId);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    const messages = await Message.findAll({
      where: { member_id: memberId },
      order: [['timestamp', 'DESC']]
    });
    
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching member messages', error: error.message });
  }
};