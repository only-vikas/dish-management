'use strict';

const { Router } = require('express');
const adminController = require('../controllers/admin.controller');

const router = Router();

// Note: In a real app, these routes would be protected by admin authentication middleware.

router.post('/simulate-change', adminController.simulateChange);
router.post('/reset-workspace', adminController.resetWorkspace);

module.exports = router;
