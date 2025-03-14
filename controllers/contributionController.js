const { Contribution, Member } = require('../models');

// Get all contributions
exports.getAllContributions = async (req, res) => {
  try {
    const contributions = await Contribution.findAll({
      include: [{ model: Member, attributes: ['id', 'name', 'phone'] }]
    });
    res.status(200).json(contributions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching contributions', error: error.message });
  }
};

// Get a single contribution
exports.getContributionById = async (req, res) => {
  try {
    const contribution = await Contribution.findByPk(req.params.id, {
      include: [{ model: Member, attributes: ['id', 'name', 'phone'] }]
    });
    
    if (!contribution) {
      return res.status(404).json({ message: 'Contribution not found' });
    }
    
    res.status(200).json(contribution);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching contribution', error: error.message });
  }
};

// Create a new contribution
exports.createContribution = async (req, res) => {
  try {
    const { member_id, amount, reason } = req.body;
    
    // Validate required fields
    if (!member_id || !amount) {
      return res.status(400).json({ message: 'Member ID and amount are required' });
    }
    
    // Check if member exists
    const member = await Member.findByPk(member_id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    const contribution = await Contribution.create({
      member_id,
      amount,
      reason
    });
    
    res.status(201).json(contribution);
  } catch (error) {
    res.status(500).json({ message: 'Error creating contribution', error: error.message });
  }
};

// Get contributions by member
exports.getContributionsByMember = async (req, res) => {
  try {
    const memberId = req.params.member_id;
    
    // Check if member exists
    const member = await Member.findByPk(memberId);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    const contributions = await Contribution.findAll({
      where: { member_id: memberId },
      order: [['timestamp', 'DESC']]
    });
    
    res.status(200).json(contributions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching member contributions', error: error.message });
  }
};