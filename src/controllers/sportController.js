const Sport = require('../models/Sport');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const { success, error } = require('../utils/responseService');
const { createLog } = require('../utils/ActivityLog');

class SportController {

  // GET /api/sports
  // Public — جلب كل الرياضات النشطة
  getAllSports = asyncHandler(async (req, res) => {
    const sports = await Sport.find({ isActive: true }).select('-__v');

    const resp = success(sports, 'Sports fetched successfully');
    return res.status(resp.status).json(resp);
  });

  // GET /api/sports/:id
  // Public — جلب رياضة وحدة بالـ ID
  getSportById = asyncHandler(async (req, res) => {
    const sport = await Sport.findById(req.params.id).select('-__v');

    if (!sport) {
      const resp = error('Sport not found', 404);
      return res.status(resp.status).json(resp);
    }

    const resp = success(sport, 'Sport fetched successfully');
    return res.status(resp.status).json(resp);
  });

  // PUT /api/sports/:id
  // Admin only — تعديل رياضة
  updateSport = asyncHandler(async (req, res) => {
    const { name, description, colorTheme, image, isActive } = req.body;

    const sport = await Sport.findById(req.params.id);

    if (!sport) {
      const resp = error('Sport not found', 404);
      return res.status(resp.status).json(resp);
    }

    if (name !== undefined) sport.name = name;
    if (description !== undefined) sport.description = description;
    if (colorTheme !== undefined) sport.colorTheme = colorTheme;
    if (image !== undefined) sport.image = image;
    if (isActive !== undefined) sport.isActive = isActive;

    await sport.save();

    await createLog({
      userId: req.user.id,
      role: req.user.role,
      action: 'UPDATE_SPORT',
      details: `Admin updated sport: ${sport.name}`,
    });

    logger.info('Sport updated', { sportId: sport._id, adminId: req.user.id });

    const resp = success(sport, 'Sport updated successfully');
    return res.status(resp.status).json(resp);
  });

  // DELETE /api/sports/:id
// Admin only — حذف رياضة (Soft Delete)
  deleteSport = asyncHandler(async (req, res) => {
  const sport = await Sport.findById(req.params.id);

  if (!sport || !sport.isActive) {
    const resp = error('Sport not found or already deleted', 404);
    return res.status(resp.status).json(resp);
  }

  sport.isActive = false;
  await sport.save(); 

  await createLog({
    userId: req.user.id,
    role: req.user.role,
    action: 'DELETE_SPORT',
    details: `Sport deleted: ${sport.name}`,
  });

  logger.info('Sport deleted', {
    sportId: sport._id,
    adminId: req.user.id,
  });

  const resp = success(null, 'Sport deleted successfully');
  return res.status(resp.status).json(resp);
  });
}

module.exports = new SportController();
