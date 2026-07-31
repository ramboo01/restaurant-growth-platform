const express = require('express');
const aiController = require('./ai.controller');

const router = express.Router();

router.post('/query', aiController.handleCopilotQuery);

module.exports = router;
