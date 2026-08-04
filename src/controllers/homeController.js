const User    = require('../models/User');
const Sport   = require('../models/Sport');
const Plan    = require('../models/Plan');
const AIPlan  = require('../models/AIPlan');
const Post    = require('../models/Post');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/responseService');

class HomeController {

  // GET /api/home
  // Public — كل إحصائيات الصفحة الرئيسية دفعة وحدة
  getHomeStats = asyncHandler(async (req, res) => {

    // ─── 1. أعداد أساسية ───────────────────────────────────────────────
    const [
      totalAthletes,
      totalCoaches,
      totalSports,
      totalRegularPlans,
      totalAIPlans,
    ] = await Promise.all([
      User.countDocuments({ role: 'athlete', isActive: true }),
      User.countDocuments({ role: 'coach', coachStatus: 'approved', isActive: true }),
      Sport.countDocuments({ isActive: true }),
      Plan.countDocuments({ isActive: true }),
      AIPlan.countDocuments({ isDeleted: false }),
    ]);

    const totalPlans = totalRegularPlans + totalAIPlans;

    // ─── 2. أكثر الرياضات نشاطاً (حسب عدد المدربين المعتمدين) ─────────────
    const sportsWithCoachCount = await User.aggregate([
      { $match: { role: 'coach', coachStatus: 'approved', isActive: true, sport: { $ne: null } } },
      { $group: { _id: '$sport', coachCount: { $sum: 1 } } },
      { $sort: { coachCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'sports',
          localField: '_id',
          foreignField: '_id',
          as: 'sport',
        },
      },
      { $unwind: '$sport' },
      {
        $project: {
          _id: '$sport._id',
          name: '$sport.name',
          slug: '$sport.slug',
          colorTheme: '$sport.colorTheme',
          coachCount: 1,
        },
      },
    ]);

    // لو ما في بيانات كافية بالـ aggregation (كل الرياضات صفر مدربين)، رجّع كل الرياضات بترتيب الإنشاء
    const mostActiveSports = sportsWithCoachCount.length > 0
      ? sportsWithCoachCount
      : await Sport.find({ isActive: true }).select('name slug colorTheme').limit(5);

    // ─── 3. آخر المنشورات بالمنتدى ────────────────────────────────────────
    const recentPosts = await Post.find({ isActive: true })
      .populate('author', 'name avatar role')
      .populate('sport', 'name slug')
      .select('title tag likes comments createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const formattedPosts = recentPosts.map(p => ({
      _id:           p._id,
      title:         p.title,
      tag:           p.tag,
      author:        p.author,
      sport:         p.sport,
      likesCount:    p.likes?.length || 0,
      commentsCount: p.comments?.length || 0,
      createdAt:     p.createdAt,
    }));

    // ─── 4. آخر خطط AI تم إنشاؤها ─────────────────────────────────────────
    const recentAIPlans = await AIPlan.find({ isDeleted: false })
      .populate('athlete', 'name avatar')
      .populate('sport', 'name slug')
      .select('title goal level status progress createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // ─── Response ──────────────────────────────────────────────────────────
    const resp = success({
      totalAthletes,
      totalCoaches,
      totalSports,
      totalPlans,
      mostActiveSports,
      recentPosts:   formattedPosts,
      recentAIPlans,
    }, 'Home stats fetched successfully');

    return res.status(resp.status).json(resp);
  });
}

module.exports = new HomeController();
