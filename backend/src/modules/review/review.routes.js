const express = require('express');
const router = express.Router();
const reviewController = require('./review.controller');

router.get('/', reviewController.getReviewsHandler);
router.put('/:id', reviewController.updateReviewHandler);
router.post('/:id/ai-reply', reviewController.generateAiReplyHandler);

module.exports = router;
