const express = require('express');
const router = express.Router();
const contributionController = require('../../controllers/contributionController');

// GET contributions page
router.get('/', contributionController.getAllContributionsWeb);

// GET a single contribution by ID
router.get('/:id', contributionController.getContributionByIdWeb);

// GET contributions by member ID
router.get('/member/:member_id', contributionController.getContributionsByMemberWeb);

module.exports = router;