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

// Get all messages
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await fetchAllMessages();
    res.render(messages);
  } catch (error) {
    res.render({ message: 'Error fetching messages', error: error.message });
  }
};

// Get all messages
exports.getAllMessages = async (req, res) => {
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

// Get a single message
exports.getMessageById = async (req, res) => {
  try {
    const message = await fetchMessageById(req.params.id);
    
    if (!message) {
      return res.render({ message: 'Message not found' });
    }
    
    res.render(message);
  } catch (error) {
    res.render({ message: 'Error fetching message', error: error.message });
  }
};

// Get a single message
exports.getMessageById = async (req, res) => {
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
        return res.render('error', {
          title: 'Error',
          message: 'Member ID and message content are required'
        });
      }
    }
    
    // Check if member exists
    const member = await Member.findByPk(member_id);
    if (!member) {
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
    
      res.redirect('/messages');
    }
  } catch (error) {
    console.error('Error creating message:', error);
      res.render('error', {
        title: 'Error',
        message: 'Error creating message'
      });
    }
  }
};

// Get messages by member
exports.getMessagesByMember = async (req, res) => {
  try {
    const memberId = req.params.member_id;
    
    // Check if member exists
    const member = await Member.findByPk(memberId);
    if (!member) {
      return res.render({ message: 'Member not found' });
    }
    
    const messages = await fetchMessagesByMember(memberId);
    
    res.render(messages);
  } catch (error) {
    res.render({ message: 'Error fetching member messages', error: error.message });
  }
};

// Get messages by member
exports.getMessagesByMember = async (req, res) => {
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