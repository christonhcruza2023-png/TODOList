const { Task, CATEGORIES, PRIORITIES } = require('../models/Task');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { startOfDay, addDays } = require('../utils/helpers');

function parseDayParam(raw, field) {
  if (raw === undefined || raw === null || raw === '') return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw ApiError.badRequest(`Invalid ${field} date.`);
  }
  return date;
}

// GET /api/stats
// The client can pass its local day boundaries so "today" and "overdue" match
// the user's calendar day rather than the server's timezone.
const getStats = asyncHandler(async (req, res) => {
  const dayStart = parseDayParam(req.query.dayStart, 'dayStart') || startOfDay();
  const dayEnd = parseDayParam(req.query.dayEnd, 'dayEnd') || addDays(dayStart, 1);

  if (dayEnd <= dayStart) {
    throw ApiError.badRequest('dayEnd must be after dayStart.');
  }

  const notCompleted = { status: { $ne: 'Completed' } };

  const [
    total,
    completed,
    pendingStatus,
    inProgress,
    overdue,
    dueToday,
    upcoming,
    completedToday,
    byCategoryRaw,
    byPriorityRaw,
    recentTasks,
    todayTasks,
  ] = await Promise.all([
    Task.countDocuments({}),
    Task.countDocuments({ status: 'Completed' }),
    Task.countDocuments({ status: 'Pending' }),
    Task.countDocuments({ status: 'In Progress' }),
    Task.countDocuments({ dueDate: { $ne: null, $lt: dayStart }, ...notCompleted }),
    Task.countDocuments({ dueDate: { $gte: dayStart, $lt: dayEnd } }),
    Task.countDocuments({ dueDate: { $gte: dayEnd }, ...notCompleted }),
    Task.countDocuments({ status: 'Completed', updatedAt: { $gte: dayStart, $lt: dayEnd } }),
    Task.aggregate([
      {
        $group: {
          _id: '$category',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] },
          },
        },
      },
    ]),
    Task.aggregate([{ $group: { _id: '$priority', total: { $sum: 1 } } }]),
    Task.find({}).sort({ createdAt: -1 }).limit(5).lean(),
    Task.find({ dueDate: { $gte: dayStart, $lt: dayEnd } })
      .sort({ status: 1, dueDate: 1, createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const categoryMap = new Map(byCategoryRaw.map((row) => [row._id, row]));
  const byCategory = CATEGORIES.map((category) => ({
    category,
    total: categoryMap.get(category)?.total || 0,
    completed: categoryMap.get(category)?.completed || 0,
  }));

  const priorityMap = new Map(byPriorityRaw.map((row) => [row._id, row]));
  const byPriority = PRIORITIES.map((priority) => ({
    priority,
    total: priorityMap.get(priority)?.total || 0,
  }));

  res.json({
    success: true,
    data: {
      total,
      completed,
      pending: total - completed,
      pendingStatus,
      inProgress,
      overdue,
      dueToday,
      upcoming,
      completedToday,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      byCategory,
      byPriority,
      recentTasks,
      todayTasks,
      dayStart: dayStart.toISOString(),
      dayEnd: dayEnd.toISOString(),
    },
  });
});

module.exports = { getStats };
