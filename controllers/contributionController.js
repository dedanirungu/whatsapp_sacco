const { Contribution, Member } = require('../models');

// Fetch contributions data with member information
const fetchContributions = async () => {
  return await Contribution.findAll({
    include: [{ model: Member, attributes: ['id', 'name', 'phone'] }],
    order: [['timestamp', 'DESC']]
  });
};

// Fetch a specific contribution by ID
const fetchContributionById = async (id) => {
  return await Contribution.findByPk(id, {
    include: [{ model: Member, attributes: ['id', 'name', 'phone'] }]
  });
};

// Get contributions by member ID
const fetchContributionsByMember = async (memberId) => {
  return await Contribution.findAll({
    where: { member_id: memberId },
    order: [['timestamp', 'DESC']],
    include: [{ model: Member, attributes: ['id', 'name', 'phone'] }]
  });
};

// Get all contributions
exports.getAllContributions = async (req, res) => {
  try {
    const contributions = await fetchContributions();
    res.render('contributions', {
      title: 'Contributions',
      contributions: contributions.map(contribution => contribution.toJSON()),
      activeContributions: true
    });
  } catch (error) {
    console.error('Error fetching contributions:', error);
    res.render('error', {
      title: 'Error',
      message: 'Error fetching contributions'
    });
  }
};

// Get a single contribution
exports.getContributionById = async (req, res) => {
  try {
    const contribution = await fetchContributionById(req.params.id);
    
    if (!contribution) {
      return res.render('error', {
        title: 'Error',
        message: 'Contribution not found'
      });
    }
    
    res.render('contribution-details', {
      title: 'Contribution Details',
      contribution: contribution.toJSON(),
      activeContributions: true
    });
  } catch (error) {
    console.error('Error fetching contribution details:', error);
    res.render('error', {
      title: 'Error',
      message: 'Error fetching contribution details'
    });
  }
};

// Create a new contribution
exports.createContribution = async (req, res) => {
  try {
    const { member_id, amount, reason } = req.body;
    
    // Validate required fields
    if (!member_id || !amount) {
      return res.render('error', {
        title: 'Error',
        message: 'Member ID and amount are required'
      });
    }
    
    // Check if member exists
    const member = await Member.findByPk(member_id);
    if (!member) {
      return res.render('error', {
        title: 'Error',
        message: 'Member not found'
      });
    }
    
    await Contribution.create({
      member_id,
      amount,
      reason
    });
    
    // Redirect to contributions list for web form submissions
    res.redirect('/contributions');
  } catch (error) {
    res.render('error', {
      title: 'Error',
      message: 'Error creating contribution: ' + error.message
    });
  }
};

// Get contributions by member
exports.getContributionsByMember = async (req, res) => {
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
    
    const contributions = await fetchContributionsByMember(memberId);
    
    res.render('member-contributions', {
      title: `${member.name}'s Contributions`,
      member: member.toJSON(),
      contributions: contributions.map(contribution => contribution.toJSON()),
      activeContributions: true
    });
  } catch (error) {
    console.error('Error fetching member contributions:', error);
    res.render('error', {
      title: 'Error',
      message: 'Error fetching member contributions'
    });
  }
};