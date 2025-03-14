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

// Get all members
exports.getAllMembers = async (req, res) => {
  try {
    const members = await fetchAllMembers();
    res.render(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.render({ error: 'Failed to fetch members' });
  }
};

// Get all members
exports.getAllMembers = async (req, res) => {
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

// Get member by ID
exports.getMemberById = async (req, res) => {
  try {
    const member = await fetchMemberById(req.params.id);
    if (!member) {
      return res.render({ error: 'Member not found' });
    }
    res.render(member);
  } catch (error) {
    console.error('Error fetching member:', error);
    res.render({ error: 'Failed to fetch member' });
  }
};

// Get member by ID
exports.getMemberById = async (req, res) => {
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
        return res.render('error', {
          title: 'Error',
          message: 'Phone and name are required'
        });
      }
    }
    
    const newMember = await Member.create({ phone, name });
    
      res.redirect('/members');
    }
  } catch (error) {
    console.error('Error creating member:', error);
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
        return res.render('error', {
          title: 'Error',
          message: 'Phone and name are required'
        });
      }
    }
    
    const member = await Member.findByPk(req.params.id);
    if (!member) {
        return res.render('error', {
          title: 'Error',
          message: 'Member not found'
        });
      }
    }
    
    member.phone = phone;
    member.name = name;
    await member.save();
    
      res.redirect(`/members/${member.id}`);
    }
  } catch (error) {
    console.error('Error updating member:', error);
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
        return res.render('error', {
          title: 'Error',
          message: 'Member not found'
        });
      }
    }
    
    await member.destroy();
    
      res.redirect('/members');
    }
  } catch (error) {
    console.error('Error deleting member:', error);
      res.render('error', {
        title: 'Error',
        message: 'Failed to delete member'
      });
    }
  }
};

// Get member transactions
exports.getMemberTransactions = async (req, res) => {
  try {
    const transactions = await fetchMemberTransactions(req.params.id);
    res.render(transactions);
  } catch (error) {
    console.error('Error fetching member transactions:', error);
    res.render({ error: 'Failed to fetch member transactions' });
  }
};

// Get member transactions
exports.getMemberTransactions = async (req, res) => {
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

// Get member loans
exports.getMemberLoans = async (req, res) => {
  try {
    const loans = await fetchMemberLoans(req.params.id);
    res.render(loans);
  } catch (error) {
    console.error('Error fetching member loans:', error);
    res.render({ error: 'Failed to fetch member loans' });
  }
};

// Get member loans
exports.getMemberLoans = async (req, res) => {
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