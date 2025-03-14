const { Message, Member } = require('../models');

// Shared data fetching functions
const fetchAllMessages = async () => {
  return await Message.findAll({
    include: [{ model: Member, attributes: ['id', 'name', 'phone'] }],
    order: [['timestamp', 'DESC']]
  });
};

const fetchMessageById = async (id) => {
  return await Message.findByPk(id, {
    include: [{ model: Member, attributes: ['id', 'name', 'phone'] }]
  });
};

const fetchMessagesByMember = async (memberId) => {
  return await Message.findAll({
    where: { member_id: memberId },
    order: [['timestamp', 'DESC']]
  });
};

// API: Get all messages
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await fetchAllMessages();
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};

// Web: Get all messages
exports.getAllMessagesWeb = async (req, res) => {
  try {
    const messages = await fetchAllMessages();
    res.render('messages', {
      title: 'Messages',
      messages: messages.map(message => message.toJSON()),
      activeMessages: true
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.render('messages', {
      title: 'Messages',
      error: 'Error fetching messages',
      activeMessages: true
    });
  }
};

// API: Get a single message
exports.getMessageById = async (req, res) => {
  try {
    const message = await fetchMessageById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching message', error: error.message });
  }
};

// Web: Get a single message
exports.getMessageByIdWeb = async (req, res) => {
  try {
    const message = await fetchMessageById(req.params.id);
    
    if (!message) {
      return res.render('error', {
        title: 'Error',
        message: 'Message not found'
      });
    }
    
    res.render('message-details', {
      title: 'Message Details',
      message: message.toJSON(),
      activeMessages: true
    });
  } catch (error) {
    console.error('Error fetching message details:', error);
    res.render('error', {
      title: 'Error',
      message: 'Error fetching message details'
    });
  }
};

// Create a new message
exports.createMessage = async (req, res) => {
  try {
    const { member_id, message } = req.body;
    
    // Validate required fields
    if (!member_id || !message) {
      if (req.headers.accept === 'application/json' || req.query.format === 'json') {
        return res.status(400).json({ message: 'Member ID and message content are required' });
      } else {
        return res.render('error', {
          title: 'Error',
          message: 'Member ID and message content are required'
        });
      }
    }
    
    // Check if member exists
    const member = await Member.findByPk(member_id);
    if (!member) {
      if (req.headers.accept === 'application/json' || req.query.format === 'json') {
        return res.status(404).json({ message: 'Member not found' });
      } else {
        return res.render('error', {
          title: 'Error',
          message: 'Member not found'
        });
      }
    }
    
    // Create message in database
    const newMessage = await Message.create({
      member_id,
      message
    });
    
    if (req.headers.accept === 'application/json' || req.query.format === 'json') {
      res.status(201).json(newMessage);
    } else {
      res.redirect('/messages');
    }
  } catch (error) {
    console.error('Error creating message:', error);
    if (req.headers.accept === 'application/json' || req.query.format === 'json') {
      res.status(500).json({ message: 'Error creating message', error: error.message });
    } else {
      res.render('error', {
        title: 'Error',
        message: 'Error creating message'
      });
    }
  }
};

// API: Get messages by member
exports.getMessagesByMember = async (req, res) => {
  try {
    const memberId = req.params.member_id;
    
    // Check if member exists
    const member = await Member.findByPk(memberId);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    const messages = await fetchMessagesByMember(memberId);
    
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching member messages', error: error.message });
  }
};

// Web: Get messages by member
exports.getMessagesByMemberWeb = async (req, res) => {
  try {
    const memberId = req.params.member_id;
    
    // Check if member exists
    const member = await Member.findByPk(memberId);
    if (!member) {
      return res.render('error', {
        title: 'Error',
        message: 'Member not found'
      });
    }
    
    const messages = await fetchMessagesByMember(memberId);
    
    res.render('member-messages', {
      title: `${member.name}'s Messages`,
      member: member.toJSON(),
      messages: messages.map(message => message.toJSON()),
      activeMessages: true
    });
  } catch (error) {
    console.error('Error fetching member messages:', error);
    res.render('error', {
      title: 'Error',
      message: 'Error fetching member messages'
    });
  }
};