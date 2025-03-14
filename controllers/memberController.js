const { Member, Transaction, Loan } = require('../models');

// Get all members
exports.getAllMembers = async (req, res) => {
  try {
    const members = await Member.findAll({
      order: [['name', 'ASC']]
    });
    res.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
};

// Get member by ID
exports.getMemberById = async (req, res) => {
  try {
    const member = await Member.findByPk(req.params.id);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(member);
  } catch (error) {
    console.error('Error fetching member:', error);
    res.status(500).json({ error: 'Failed to fetch member' });
  }
};

// Create new member
exports.createMember = async (req, res) => {
  try {
    const { phone, name } = req.body;
    
    if (!phone || !name) {
      return res.status(400).json({ error: 'Phone and name are required' });
    }
    
    const newMember = await Member.create({ phone, name });
    res.status(201).json(newMember);
  } catch (error) {
    console.error('Error creating member:', error);
    res.status(500).json({ error: 'Failed to create member' });
  }
};

// Update member
exports.updateMember = async (req, res) => {
  try {
    const { phone, name } = req.body;
    
    if (!phone || !name) {
      return res.status(400).json({ error: 'Phone and name are required' });
    }
    
    const member = await Member.findByPk(req.params.id);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    member.phone = phone;
    member.name = name;
    await member.save();
    
    res.json(member);
  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).json({ error: 'Failed to update member' });
  }
};

// Delete member
exports.deleteMember = async (req, res) => {
  try {
    const member = await Member.findByPk(req.params.id);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    await member.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({ error: 'Failed to delete member' });
  }
};

// Get member transactions
exports.getMemberTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: { member_id: req.params.id },
      order: [['timestamp', 'DESC']]
    });
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching member transactions:', error);
    res.status(500).json({ error: 'Failed to fetch member transactions' });
  }
};

// Get member loans
exports.getMemberLoans = async (req, res) => {
  try {
    const loans = await Loan.findAll({
      where: { member_id: req.params.id },
      order: [['start_date', 'DESC']]
    });
    res.json(loans);
  } catch (error) {
    console.error('Error fetching member loans:', error);
    res.status(500).json({ error: 'Failed to fetch member loans' });
  }
};