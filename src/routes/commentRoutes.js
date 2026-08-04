const express = require('express');
const router = express.Router();

const postController = require('../controllers/postController');
const { requireAuth } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { commentSchema } = require('../validations/postValidation');

// PUT  /api/comments/:commentId  ← صاحب التعليق
// DELETE /api/comments/:commentId ← صاحبه أو Admin
router.put('/:commentId', requireAuth, validate(commentSchema), postController.updateComment);
router.delete('/:commentId', requireAuth, postController.deleteComment);

module.exports = router;
