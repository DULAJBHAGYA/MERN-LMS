import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

const router = express.Router();

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin only)
router.get('/', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const users = await User.find()
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments();

  res.status(200).json({
    status: 'success',
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return res.status(404).json({
      status: 'error',
      message: 'User not found'
    });
  }

  // Only allow users to view their own profile or admins to view any profile
  if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
    return res.status(403).json({
      status: 'error',
      message: 'Not authorized to view this profile'
    });
  }

  res.status(200).json({
    status: 'success',
    data: { user }
  });
}));

// @desc    Update user (Admin or self)
// @route   PUT /api/users/:id
// @access  Private
router.put('/:id', protect, asyncHandler(async (req, res) => {
  // Only allow users to update their own profile or admins to update any profile
  if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
    return res.status(403).json({
      status: 'error',
      message: 'Not authorized to update this profile'
    });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).select('-password');

  if (!user) {
    return res.status(404).json({
      status: 'error',
      message: 'User not found'
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'User updated successfully',
    data: { user }
  });
}));

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      status: 'error',
      message: 'User not found'
    });
  }

  // Soft delete - mark as inactive
  user.isActive = false;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'User deactivated successfully'
  });
}));

// @desc    Get educators
// @route   GET /api/users/educators
// @access  Public
router.get('/educators', asyncHandler(async (req, res) => {
  const educators = await User.find({ 
    role: 'educator',
    isActive: true 
  })
    .select('name avatar bio')
    .sort({ name: 1 });

  res.status(200).json({
    status: 'success',
    data: { educators }
  });
}));

// @desc    Get educator profile with courses
// @route   GET /api/users/educators/:id
// @access  Public
router.get('/educators/:id', asyncHandler(async (req, res) => {
  const educator = await User.findOne({
    _id: req.params.id,
    role: 'educator',
    isActive: true
  }).select('-password');

  if (!educator) {
    return res.status(404).json({
      status: 'error',
      message: 'Educator not found'
    });
  }

  // Get educator's published courses
  const Course = mongoose.model('Course');
  const courses = await Course.find({
    educator: req.params.id,
    isPublished: true
  })
    .select('title description thumbnail price rating numReviews totalEnrollments')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    data: { 
      educator,
      courses
    }
  });
}));

// @desc    Get user statistics (Admin only)
// @route   GET /api/users/stats
// @access  Private (Admin only)
router.get('/stats', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalStudents = await User.countDocuments({ role: 'student' });
  const totalEducators = await User.countDocuments({ role: 'educator' });
  const activeUsers = await User.countDocuments({ isActive: true });
  const verifiedUsers = await User.countDocuments({ isEmailVerified: true });

  // Get recent registrations (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentRegistrations = await User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo }
  });

  const stats = {
    totalUsers,
    totalStudents,
    totalEducators,
    activeUsers,
    verifiedUsers,
    recentRegistrations,
    verificationRate: totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(1) : 0
  };

  res.status(200).json({
    status: 'success',
    data: { stats }
  });
}));

export default router;
