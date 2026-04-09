import {
  User,
  AuditLog,
  Scanrequests,
  AuditActionType,
} from "../models/schema.js";

import { catchAsync } from "../utils/catchAsync.js";

// Home Dashboard Overview
const getDashboardOverview = catchAsync(async (req, res) => {
  const [userStats, userGrowth, subscriptionDistribution, auditCompletion] =
    await Promise.all([
      // Get total counts for dashboard cards
      Promise.all([
        // Total Users with role distribution
        User.aggregate([
          {
            $facet: {
              totalCount: [
                {
                  $group: {
                    _id: null,
                    count: { $sum: 1 },
                  },
                },
              ],
              roleDistribution: [
                {
                  $group: {
                    _id: "$role",
                    count: { $sum: 1 },
                  },
                },
              ],
            },
          },
        ]),
        // Active Subscriptions
        User.aggregate([
          {
            $match: {
              "subscription.status": "active",
            },
          },
          {
            $group: {
              _id: null,
              count: {
                $sum: {
                  $cond: [{ $eq: ["$role", "user"] }, 1, 0],
                },
              },
            },
          },
        ]),
        // Reviewed Requests (Completed Audits)
        AuditLog.aggregate([
          {
            $match: {
              type: AuditActionType.SCAN_REVIEWED,
            },
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
            },
          },
        ]),
        // Pending Requests
        Scanrequests.aggregate([
          {
            $match: {
              status: "pending",
            },
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
            },
          },
        ]),
      ]),

      // Get user growth data (monthly)
      User.aggregate([
        {
          $group: {
            _id: {
              month: { $month: "$createdAt" },
              year: { $year: "$createdAt" },
            },
            daily: { $sum: 1 },
            weekly: { $sum: 1 },
            monthly: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        { $limit: 6 },
      ]),

      // Get subscriber distribution
      User.aggregate([
        {
          $group: {
            _id: "$subscription.planId",
            planName: { $first: "$subscription.planName" },
            users: {
              $sum: {
                $cond: [{ $eq: ["$role", "user"] }, 1, 0],
              },
            },
          },
        },
      ]).then((data) => {
        return data.filter((item) => item._id !== null);
      }),

      // Updated audit completion stats
      AuditLog.aggregate([
        {
          $match: {
            type: AuditActionType.SCAN_COMPLETED,
            status: { $in: ["Passed", "Failed", "Pending"] },
          },
        },
        {
          $group: {
            _id: "$status",
            value: { $sum: 1 },
          },
        },
      ]),
    ]);

  // Format stats object
  const stats = {
    totalUsers: userStats[0] || [{ count: 0 }],
    activeSubscriptions: userStats[1] || [{ count: 0 }],
    reviewedRequests: userStats[2] || [{ count: 0 }],
    pendingRequests: userStats[3] || [{ count: 0 }],
  };

  res.status(200).json({
    status: "success",
    data: {
      stats,
      userGrowth,
      subscriptionDistribution,
      auditCompletion,
    },
  });
});

// User Management Data
const getUserManagementData = catchAsync(async (req, res) => {
  const users = await User.aggregate([
    {
      $lookup: {
        from: "auditlogs",
        localField: "_id",
        foreignField: "userId",
        as: "lastActivity",
      },
    },
    {
      $project: {
        name: 1,
        email: 1,
        role: 1,
        plan: "$subscription.planId",
        planName: "$subscription.planName",
        status: "$subscription.status",
        lastActive: {
          $ifNull: [{ $max: "$lastActivity.createdAt" }, "$createdAt"],
        },
      },
    },
    { $sort: { lastActive: -1 } },
  ]);

  res.status(200).json({
    status: "success",
    data: { users },
  });
});

// Audit Report Data
const getLogData = catchAsync(async (req, res) => {
  const [auditOverview, auditHistory] = await Promise.all([
    // Get audit overview statistics
    AuditLog.aggregate([
      {
        $group: {
          _id: "$status",
          value: { $sum: 1 },
        },
      },
    ]),

    // Get detailed audit history with username
    AuditLog.aggregate([
      // Convert string userId to ObjectId if needed
      {
        $addFields: {
          userObjectId: {
            $toObjectId: "$userId",
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userObjectId",
          foreignField: "_id",
          as: "users",
        },
      },
      {
        $project: {
          user_id: "$userId",
          date: "$createdAt",
          status: 1,
          type: 1,
          reportUrl: 1,
          userName: { $arrayElemAt: ["$users.name", 0] },
          userEmail: { $arrayElemAt: ["$users.email", 0] },
        },
      },
      { $sort: { date: -1 } },
    ]),
  ]);

  // Log the results for debugging
  console.log("Audit history sample:", auditHistory.slice(0, 2));

  res.status(200).json({
    status: "success",
    data: {
      auditOverview,
      auditHistory,
    },
  });
});

// Audit Report Data
const getAuditReportData = catchAsync(async (req, res) => {
  const [auditOverview, auditHistory] = await Promise.all([
    // Get scan-related audit counts
    AuditLog.aggregate([
      {
        $match: {
          type: {
            $in: [
              AuditActionType.SCAN_INITIATED,
              AuditActionType.SCAN_COMPLETED,
              AuditActionType.SCAN_REVIEWED,
            ],
          },
        },
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          type: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]),

    // Get all scan requests
    Scanrequests.find({}, { data: 0 }),
  ]);

  res.status(200).json({
    status: "success",
    data: {
      scanMetrics: auditOverview,
      auditHistory,
    },
  });
});

const updateUserRole = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { newRole } = req.body;

  // Validate the role
  if (!["user", "admin"].includes(newRole)) {
    return res.status(400).json({
      status: "error",
      message: "Invalid role. Role must be either 'user' or 'admin'",
    });
  }

  const user = await User.findById(userId);

  // Check if user exists
  if (!user) {
    return res.status(404).json({
      status: "error",
      message: "User not found",
    });
  }

  // Prevent changing superadmin role
  if (user.role === "superadmin") {
    return res.status(403).json({
      status: "error",
      message: "Superadmin role cannot be modified",
    });
  }

  user.role = newRole;
  await user.save();

  res.status(200).json({
    status: "success",
    message: "User role updated successfully",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
});

// Export all functions as an object
export default {
  getDashboardOverview,
  getUserManagementData,
  getLogData,
  getAuditReportData,
  updateUserRole,
};
