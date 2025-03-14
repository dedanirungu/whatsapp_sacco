const express = require('express');
const router = express.Router();
const contributionController = require('../controllers/contributionController');

// GET all contributions
router.get('/', contributionController.getAllContributions);

// GET a single contribution by ID
router.get('/:id', contributionController.getContributionById);

// POST a new contribution
router.post('/', contributionController.createContribution);

// GET contributions by member ID
router.get('/member/:member_id', contributionController.getContributionsByMember);

module.exports = router;