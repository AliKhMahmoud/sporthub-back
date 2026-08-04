const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Sport = require('../models/Sport');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const { success, error } = require('../utils/responseService');
const { createLog } = require('../utils/ActivityLog');
const { createNotification } = require('../utils/notificationService');

class PostController {

  // GET /api/posts?sport=slug&page=1&limit=10&sort=latest
  // Public — جلب المنشورات مع فلترة وصفحات
  getPosts = asyncHandler(async (req, res) => {
    const { sport: sportSlug, page = 1, limit = 10, sort = 'latest' } = req.query;

    const filter = { isActive: true };

    if (sportSlug) {
      const sport = await Sport.findOne({ slug: sportSlug, isActive: true });
      if (!sport) {
        const resp = error('Sport not found', 404);
        return res.status(resp.status).json(resp);
      }
      filter.sport = sport._id;
    }

    const sortOption = sort === 'popular' ? { views: -1 } : { createdAt: -1 };

    const total = await Post.countDocuments(filter);
    const posts = await Post.find(filter)
      .populate('author', 'name avatar')
      .populate('sport', 'name slug colorTheme')
      .select('-__v')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const resp = success(
      {
        posts,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / limit),
        },
      },
      'Posts fetched successfully'
    );
    return res.status(resp.status).json(resp);
  });

  // GET /api/posts/:id
  // Public — جلب منشور وحدة + زيادة الـ views
  getPostById = asyncHandler(async (req, res) => {
    const post = await Post.findOne({ _id: req.params.id, isActive: true })
      .populate('author', 'name avatar')
      .populate('sport', 'name slug colorTheme')
      .select('-__v');

    if (!post) {
      const resp = error('Post not found', 404);
      return res.status(resp.status).json(resp);
    }

    // زيادة الـ views
    await Post.updateOne({ _id: post._id }, { $inc: { views: 1 } });

    const resp = success(post, 'Post fetched successfully');
    return res.status(resp.status).json(resp);
  });

  // POST /api/posts
  // User + Publisher — إنشاء منشور
  createPost = asyncHandler(async (req, res) => {
    const { title, body, sportId, media } = req.body;

    const sport = await Sport.findOne({ _id: sportId, isActive: true });
    if (!sport) {
      const resp = error('Sport not found', 404);
      return res.status(resp.status).json(resp);
    }

    if (req.user.role === 'coach' && req.user.coachStatus !== 'approved') {
      const resp = error('Your account is not approved yet', 403);
      return res.status(resp.status).json(resp);
    }

    const post = await Post.create({
      title,
      body,
      sport: sport._id,
      author: req.user.id,
      media: media || [],
    });

    await createLog({
      userId: req.user.id,
      role: req.user.role,
      action: 'CREATE_POST',
      details: `Post created: ${post.title}`,
    });

    logger.info('Post created', { postId: post._id, userId: req.user.id });

    const resp = success(post, 'Post created successfully');
    return res.status(201).json({ ...resp, status: 201 });
  });

  // PUT /api/posts/:id
  // صاحب المنشور فقط
  updatePost = asyncHandler(async (req, res) => {
    const post = await Post.findOne({ _id: req.params.id, isActive: true });

    if (!post) {
      const resp = error('Post not found', 404);
      return res.status(resp.status).json(resp);
    }

    if (post.author.toString() !== req.user.id.toString()) {
      const resp = error('You are not authorized to update this post', 403);
      return res.status(resp.status).json(resp);
    }

    const { title, body, media } = req.body;

    if (title !== undefined) post.title = title;
    if (body !== undefined) post.body = body;
    if (media !== undefined) post.media = media;

    await post.save();

    await createLog({
      userId: req.user.id,
      role: req.user.role,
      action: 'UPDATE_POST',
      details: `Post updated: ${post.title}`,
    });

    const resp = success(post, 'Post updated successfully');
    return res.status(resp.status).json(resp);
  });

  // DELETE /api/posts/:id
  // صاحبه أو Admin — Soft delete
  deletePost = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
      const resp = error('Post not found', 404);
      return res.status(resp.status).json(resp);
    }

    const isOwner = post.author.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      const resp = error('You are not authorized to delete this post', 403);
      return res.status(resp.status).json(resp);
    }

    await Post.deleteOne({ _id: req.params.id });

    await createLog({
      userId: req.user.id,
      role: req.user.role,
      action: 'DELETE_POST',
      details: `Post deleted: ${post.title}`,
    });

    const resp = success(null, 'Post deleted successfully');
    return res.status(resp.status).json(resp);
  });

  // POST /api/posts/:id/like
  // User مسجل — إضافة لايك
  likePost = asyncHandler(async (req, res) => {
    const post = await Post.findOne({ _id: req.params.id, isActive: true });

    if (!post) {
      const resp = error('Post not found', 404);
      return res.status(resp.status).json(resp);
    }

    const alreadyLiked = post.likes.includes(req.user.id);
    if (alreadyLiked) {
      const resp = error('You already liked this post', 400);
      return res.status(resp.status).json(resp);
    }

    post.likes.push(req.user.id);
    await post.save();

    if (post.author.toString() !== req.user.id.toString()) {
      await createNotification({
        userId: post.author,
        type: 'POST_LIKED',
        title: 'New Like',
        message: `Someone liked your post: "${post.title}".`,
        link: `/forum/posts/${post._id}`,
      });
    }
    

    const resp = success({ likesCount: post.likes.length }, 'Post liked');
    return res.status(resp.status).json(resp);
  });

  // DELETE /api/posts/:id/like
  // User مسجل — إلغاء لايك
  unlikePost = asyncHandler(async (req, res) => {
    const post = await Post.findOne({ _id: req.params.id, isActive: true });

    if (!post) {
      const resp = error('Post not found', 404);
      return res.status(resp.status).json(resp);
    }

    const alreadyLiked = post.likes.includes(req.user.id);
    if (!alreadyLiked) {
      const resp = error('You have not liked this post', 400);
      return res.status(resp.status).json(resp);
    }

    post.likes = post.likes.filter((id) => id.toString() !== req.user.id.toString());
    await post.save();

    const resp = success({ likesCount: post.likes.length }, 'Post unliked');
    return res.status(resp.status).json(resp);
  });

  // ─── Comments ───────────────────────────────────────────────────────────

  // GET /api/posts/:id/comments
  // Public
  getComments = asyncHandler(async (req, res) => {
    const post = await Post.findOne({ _id: req.params.id, isActive: true });
    if (!post) {
      const resp = error('Post not found', 404);
      return res.status(resp.status).json(resp);
    }

    const comments = await Comment.find({ post: post._id, isActive: true })
      .populate('author', 'name avatar')
      .select('-__v')
      .sort({ createdAt: -1 });

    const resp = success(comments, 'Comments fetched successfully');
    return res.status(resp.status).json(resp);
  });

  // POST /api/posts/:id/comments
  // User مسجل
  addComment = asyncHandler(async (req, res) => {
    const post = await Post.findOne({ _id: req.params.id, isActive: true });
    if (!post) {
      const resp = error('Post not found', 404);
      return res.status(resp.status).json(resp);
    }

    const comment = await Comment.create({
      post: post._id,
      author: req.user.id,
      body: req.body.body,
    });

    if (post.author.toString() !== req.user.id.toString()) {
      await createNotification({
        userId: post.author,
        type: 'POST_COMMENTED',
        title: 'New Comment',
        message: `Someone commented on your post: "${post.title}".`,
        link: `/forum/posts/${post._id}`,
      });
    }

    await createLog({
      userId: req.user.id,
      role: req.user.role,
      action: 'ADD_COMMENT',
      details: `Comment added to post: ${post._id}`,
    });

    const resp = success(comment, 'Comment added successfully');
    return res.status(201).json({ ...resp, status: 201 });
  });

  // PUT /api/comments/:commentId
  // صاحب التعليق فقط
  updateComment = asyncHandler(async (req, res) => {
    const comment = await Comment.findOne({ _id: req.params.commentId, isActive: true });

    if (!comment) {
      const resp = error('Comment not found', 404);
      return res.status(resp.status).json(resp);
    }

    if (comment.author.toString() !== req.user.id.toString()) {
      const resp = error('You are not authorized to update this comment', 403);
      return res.status(resp.status).json(resp);
    }

    comment.body = req.body.body;
    await comment.save();

    const resp = success(comment, 'Comment updated successfully');
    return res.status(resp.status).json(resp);
  });

  // DELETE /api/comments/:commentId
  // صاحبه أو Admin — Soft delete
  deleteComment = asyncHandler(async (req, res) => {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      const resp = error('Comment not found', 404);
      return res.status(resp.status).json(resp);
    }

    const isOwner = comment.author.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      const resp = error('You are not authorized to delete this comment', 403);
      return res.status(resp.status).json(resp);
    }

    comment.isActive = false;
    await comment.save();

    const resp = success(null, 'Comment deleted successfully');
    return res.status(resp.status).json(resp);
  });
}

module.exports = new PostController();
