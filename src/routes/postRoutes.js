const express = require('express');
const router = express.Router();

const postController = require('../controllers/postController');
const { requireAuth, authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { createPostSchema, updatePostSchema, commentSchema } = require('../validations/postValidation');

// ─── Posts ───────────────────────────────────────────────────────────────

// Public
router.get('/', postController.getPosts);
router.get('/:id', postController.getPostById);

// User + Publisher
router.post('/', requireAuth, validate(createPostSchema), postController.createPost);
router.put('/:id', requireAuth, validate(updatePostSchema), postController.updatePost);
router.delete('/:id', requireAuth, postController.deletePost);

// Likes
router.post('/:id/like', requireAuth, postController.likePost);
router.delete('/:id/like', requireAuth, postController.unlikePost);

// ─── Comments (nested under post) ────────────────────────────────────────
router.get('/:id/comments', postController.getComments);
router.post('/:id/comments', requireAuth, validate(commentSchema), postController.addComment);

module.exports = router;
