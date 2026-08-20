const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Sport = require('../models/Sport');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const { success, error } = require('../utils/responseService');
const { createLog } = require('../utils/ActivityLog');
const { createNotification } = require('../utils/notificationService');

// دالة مساعدة لتحديث XP والمستوى مباشرة
const addXPToUser = async (userId, amount) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // تحديث الـ XP
    user.xp = Math.max(0, (user.xp || 0) + amount);

    // حساب المستودع/المستوى تلقائياً بناءً على الـ XP (كل 100 XP تساوي مستوى)
    user.level = Math.floor(user.xp / 100) + 1;

    await user.save();
    console.log(`✅ XP updated for user ${userId}: New XP = ${user.xp}, Level = ${user.level}`);
  } catch (err) {
    console.error('❌ Error updating XP:', err);
  }
};

class PostController {

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

  getPostById = asyncHandler(async (req, res) => {
    const post = await Post.findOne({ _id: req.params.id, isActive: true })
      .populate('author', 'name avatar')
      .populate('sport', 'name slug colorTheme')
      .select('-__v');

    if (!post) {
      const resp = error('Post not found', 404);
      return res.status(resp.status).json(resp);
    }

    await Post.updateOne({ _id: post._id }, { $inc: { views: 1 } });

    const resp = success(post, 'Post fetched successfully');
    return res.status(resp.status).json(resp);
  });

  getPostsBySport = asyncHandler(async (req, res) => {
    const { sportId } = req.params;
    const { page = 1, limit = 10, sort = 'latest' } = req.query;

    const sport = await Sport.findOne({ _id: sportId, isActive: true });
    if (!sport) {
      const resp = error('Sport not found', 404);
      return res.status(resp.status).json(resp);
    }

    const filter = { sport: sport._id, isActive: true };
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
      'Posts by sport fetched successfully'
    );
    return res.status(resp.status).json(resp);
  });

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
      author: req.user._id || req.user.id,
      media: media || [],
    });

    // 🔥 زيادة 10 XP لمنشئ المنشور
    await addXPToUser(req.user._id || req.user.id, 10);

    await createLog({
      userId: req.user._id || req.user.id,
      role: req.user.role,
      action: 'CREATE_POST',
      details: `Post created: ${post.title}`,
    });

    logger.info('Post created', { postId: post._id, userId: req.user._id || req.user.id });

    const resp = success(post, 'Post created successfully');
    return res.status(201).json({ ...resp, status: 201 });
  });

  updatePost = asyncHandler(async (req, res) => {
    const post = await Post.findOne({ _id: req.params.id, isActive: true });

    if (!post) {
      const resp = error('Post not found', 404);
      return res.status(resp.status).json(resp);
    }

    const currentUserId = (req.user._id || req.user.id).toString();
    if (post.author.toString() !== currentUserId) {
      const resp = error('You are not authorized to update this post', 403);
      return res.status(resp.status).json(resp);
    }

    const { title, body, media } = req.body;

    if (title !== undefined) post.title = title;
    if (body !== undefined) post.body = body;
    if (media !== undefined) post.media = media;

    await post.save();

    await createLog({
      userId: currentUserId,
      role: req.user.role,
      action: 'UPDATE_POST',
      details: `Post updated: ${post.title}`,
    });

    const resp = success(post, 'Post updated successfully');
    return res.status(resp.status).json(resp);
  });

  deletePost = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
      const resp = error('Post not found', 404);
      return res.status(resp.status).json(resp);
    }

    const currentUserId = (req.user._id || req.user.id).toString();
    const isOwner = post.author.toString() === currentUserId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      const resp = error('You are not authorized to delete this post', 403);
      return res.status(resp.status).json(resp);
    }

    await Post.deleteOne({ _id: req.params.id });

    // 🔥 خصم 10 XP عند حذف المنشور
    await addXPToUser(post.author, -10);

    await createLog({
      userId: currentUserId,
      role: req.user.role,
      action: 'DELETE_POST',
      details: `Post deleted: ${post.title}`,
    });

    const resp = success(null, 'Post deleted successfully');
    return res.status(resp.status).json(resp);
  });

  // POST /api/posts/:id/like
  likePost = asyncHandler(async (req, res) => {
    const post = await Post.findOne({ _id: req.params.id, isActive: true });

    if (!post) {
      const resp = error('Post not found', 404);
      return res.status(resp.status).json(resp);
    }

    const currentUserId = (req.user._id || req.user.id).toString();
    const alreadyLiked = post.likes.some((id) => id.toString() === currentUserId);

    if (alreadyLiked) {
      const resp = error('You already liked this post', 400);
      return res.status(resp.status).json(resp);
    }

    post.likes.push(currentUserId);
    await post.save();

    // 🔥 إضافة 2 XP للشخص الذي أضاف اللايك
    await addXPToUser(currentUserId, 2);

    // إرسال notification لصاحب البوست
    if (post.author.toString() !== currentUserId) {
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
  unlikePost = asyncHandler(async (req, res) => {
    const post = await Post.findOne({ _id: req.params.id, isActive: true });

    if (!post) {
      const resp = error('Post not found', 404);
      return res.status(resp.status).json(resp);
    }

    const currentUserId = (req.user._id || req.user.id).toString();
    const alreadyLiked = post.likes.some((id) => id.toString() === currentUserId);

    if (!alreadyLiked) {
      const resp = error('You have not liked this post', 400);
      return res.status(resp.status).json(resp);
    }

    post.likes = post.likes.filter((id) => id.toString() !== currentUserId);
    await post.save();

    // 🔥 خصم 2 XP من الشخص الذي أزال اللايك
    await addXPToUser(currentUserId, -2);

    const resp = success({ likesCount: post.likes.length }, 'Post unliked');
    return res.status(resp.status).json(resp);
  });

  // ─── Comments ───────────────────────────────────────────────────────────

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
  addComment = asyncHandler(async (req, res) => {
    const post = await Post.findOne({ _id: req.params.id, isActive: true });
    if (!post) {
      const resp = error('Post not found', 404);
      return res.status(resp.status).json(resp);
    }

    const currentUserId = (req.user._id || req.user.id).toString();

    const comment = await Comment.create({
      post: post._id,
      author: currentUserId,
      body: req.body.body,
    });

    // 🔥 إضافة 5 XP للشخص الذي أضاف التعليق
    await addXPToUser(currentUserId, 5);

    // إرسال notification لصاحب البوست
    if (post.author.toString() !== currentUserId) {
      await createNotification({
        userId: post.author,
        type: 'POST_COMMENTED',
        title: 'New Comment',
        message: `Someone commented on your post: "${post.title}".`,
        link: `/forum/posts/${post._id}`,
      });
    }

    await createLog({
      userId: currentUserId,
      role: req.user.role,
      action: 'ADD_COMMENT',
      details: `Comment added to post: ${post._id}`,
    });

    const resp = success(comment, 'Comment added successfully');
    return res.status(201).json({ ...resp, status: 201 });
  });

  updateComment = asyncHandler(async (req, res) => {
    const comment = await Comment.findOne({ _id: req.params.commentId, isActive: true });

    if (!comment) {
      const resp = error('Comment not found', 404);
      return res.status(resp.status).json(resp);
    }

    const currentUserId = (req.user._id || req.user.id).toString();
    if (comment.author.toString() !== currentUserId) {
      const resp = error('You are not authorized to update this comment', 403);
      return res.status(resp.status).json(resp);
    }

    comment.body = req.body.body;
    await comment.save();

    const resp = success(comment, 'Comment updated successfully');
    return res.status(resp.status).json(resp);
  });

  deleteComment = asyncHandler(async (req, res) => {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      const resp = error('Comment not found', 404);
      return res.status(resp.status).json(resp);
    }

    const currentUserId = (req.user._id || req.user.id).toString();
    const isOwner = comment.author.toString() === currentUserId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      const resp = error('You are not authorized to delete this comment', 403);
      return res.status(resp.status).json(resp);
    }

    comment.isActive = false;
    await comment.save();

    // 🔥 خصم 5 XP من صاحب التعليق عند الحذف
    await addXPToUser(comment.author, -5);

    const resp = success(null, 'Comment deleted successfully');
    return res.status(resp.status).json(resp);
  });
}

module.exports = new PostController();