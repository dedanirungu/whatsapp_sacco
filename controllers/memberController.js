const { Member, Transaction, Loan, Contribution, Message } = require('../models');

// Shared data fetching functions
const fetchAllMembers = async () => {
  return await Member.findAll({
    order: [['name', 'ASC']]
  });
};

const fetchMemberById = async (id) => {
  return await Member.findByPk(id);
};

const fetchMemberWithDetails = async (id) => {
  return await Member.findByPk(id, {
    include: [
      { model: Transaction },
      { model: Loan }
    ]
  });
};

const fetchMemberTransactions = async (memberId) => {
  return await Transaction.findAll({
    where: { member_id: memberId },
    order: [['timestamp', 'DESC']]
  });
};

const fetchMemberLoans = async (memberId) => {
  return await Loan.findAll({
    where: { member_id: memberId },
    order: [['start_date', 'DESC']]
  });
};

// API: Get all members
exports.getAllMembers = async (req, res) => {
  try {
    const members = await fetchAllMembers();
    res.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
};

// Web: Get all members
exports.getAllMembersWeb = async (req, res) => {
  try {
    const members = await fetchAllMembers();
    res.render('members', {
      title: 'Members',
      members: members.map(member => member.toJSON()),
      activeMembers: true
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.render('members', {
      title: 'Members',
      error: 'Error fetching members',
      activeMembers: true
    });
  }
};

// API: Get member by ID
exports.getMemberById = async (req, res) => {
  try {
    const member = await fetchMemberById(req.params.id);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(member);
  } catch (error) {
    console.error('Error fetching member:', error);
    res.status(500).json({ error: 'Failed to fetch member' });
  }
};

// Web: Get member by ID
exports.getMemberByIdWeb = async (req, res) => {
  try {
    const member = await fetchMemberWithDetails(req.params.id);
    
    if (!member) {
      return res.render('error', {
        title: 'Error',
        message: 'Member not found'
      });
    }
    
    res.render('member-details', {
      title: `Member - ${member.name}`,
      member: member.toJSON(),
      activeMembers: true
    });
  } catch (error) {
    console.error('Error fetching member details:', error);
    res.render('error', {
      title: 'Error',
      message: 'Error fetching member details'
    });
  }
};

// Create new member
exports.createMember = async (req, res) => {
  try {
    const { phone, name } = req.body;
    
    if (!phone || !name) {
      if (req.headers.accept === 'application/json' || req.query.format === 'json') {
        return res.status(400).json({ error: 'Phone and name are required' });
      } else {
        return res.render('error', {
          title: 'Error',
          message: 'Phone and name are required'
        });
      }
    }
    
    const newMember = await Member.create({ phone, name });
    
    if (req.headers.accept === 'application/json' || req.query.format === 'json') {
      res.status(201).json(newMember);
    } else {
      res.redirect('/members');
    }
  } catch (error) {
    console.error('Error creating member:', error);
    if (req.headers.accept === 'application/json' || req.query.format === 'json') {
      res.status(500).json({ error: 'Failed to create member' });
    } else {
      res.render('error', {
        title: 'Error',
        message: 'Failed to create member'
      });
    }
  }
};

// Update member
exports.updateMember = async (req, res) => {
  try {
    const { phone, name } = req.body;
    
    if (!phone || !name) {
      if (req.headers.accept === 'application/json' || req.query.format === 'json') {
        return res.status(400).json({ error: 'Phone and name are required' });
      } else {
        return res.render('error', {
          title: 'Error',
          message: 'Phone and name are required'
        });
      }
    }
    
    const member = await Member.findByPk(req.params.id);
    if (!member) {
      if (req.headers.accept === 'application/json' || req.query.format === 'json') {
        return res.status(404).json({ error: 'Member not found' });
      } else {
        return res.render('error', {
          title: 'Error',
          message: 'Member not found'
        });
      }
    }
    
    member.phone = phone;
    member.name = name;
    await member.save();
    
    if (req.headers.accept === 'application/json' || req.query.format === 'json') {
      res.json(member);
    } else {
      res.redirect(`/members/${member.id}`);
    }
  } catch (error) {
    console.error('Error updating member:', error);
    if (req.headers.accept === 'application/json' || req.query.format === 'json') {
      res.status(500).json({ error: 'Failed to update member' });
    } else {
      res.render('error', {
        title: 'Error',
        message: 'Failed to update member'
      });
    }
  }
};

// Delete member
exports.deleteMember = async (req, res) => {
  try {
    const member = await Member.findByPk(req.params.id);
    if (!member) {
      if (req.headers.accept === 'application/json' || req.query.format === 'json') {
        return res.status(404).json({ error: 'Member not found' });
      } else {
        return res.render('error', {
          title: 'Error',
          message: 'Member not found'
        });
      }
    }
    
    await member.destroy();
    
    if (req.headers.accept === 'application/json' || req.query.format === 'json') {
      res.status(204).send();
    } else {
      res.redirect('/members');
    }
  } catch (error) {
    console.error('Error deleting member:', error);
    if (req.headers.accept === 'application/json' || req.query.format === 'json') {
      res.status(500).json({ error: 'Failed to delete member' });
    } else {
      res.render('error', {
        title: 'Error',
        message: 'Failed to delete member'
      });
    }
  }
};

// API: Get member transactions
exports.getMemberTransactions = async (req, res) => {
  try {
    const transactions = await fetchMemberTransactions(req.params.id);
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching member transactions:', error);
    res.status(500).json({ error: 'Failed to fetch member transactions' });
  }
};

// Web: Get member transactions
exports.getMemberTransactionsWeb = async (req, res) => {
  try {
    const member = await fetchMemberById(req.params.id);
    if (!member) {
      return res.render('error', {
        title: 'Error',
        message: 'Member not found'
      });
    }
    
    const transactions = await fetchMemberTransactions(req.params.id);
    
    res.render('member-transactions', {
      title: `${member.name}'s Transactions`,
      member: member.toJSON(),
      transactions: transactions.map(transaction => transaction.toJSON()),
      activeMembers: true
    });
  } catch (error) {
    console.error('Error fetching member transactions:', error);
    res.render('error', {
      title: 'Error',
      message: 'Error fetching member transactions'
    });
  }
};

// API: Get member loans
exports.getMemberLoans = async (req, res) => {
  try {
    const loans = await fetchMemberLoans(req.params.id);
    res.json(loans);
  } catch (error) {
    console.error('Error fetching member loans:', error);
    res.status(500).json({ error: 'Failed to fetch member loans' });
  }
};

// Web: Get member loans
exports.getMemberLoansWeb = async (req, res) => {
  try {
    const member = await fetchMemberById(req.params.id);
    if (!member) {
      return res.render('error', {
        title: 'Error',
        message: 'Member not found'
      });
    }
    
    const loans = await fetchMemberLoans(req.params.id);
    
    res.render('member-loans', {
      title: `${member.name}'s Loans`,
      member: member.toJSON(),
      loans: loans.map(loan => loan.toJSON()),
      activeMembers: true
    });
  } catch (error) {
    console.error('Error fetching member loans:', error);
    res.render('error', {
      title: 'Error',
      message: 'Error fetching member loans'
    });
  }
};