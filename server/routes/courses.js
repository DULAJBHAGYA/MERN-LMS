import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { protect, authorize, checkCourseOwnership } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import Course from '../models/Course.js';

const router = express.Router();

// @desc    Get all courses (public)
// @route   GET /api/courses
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('level').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid level'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('sort').optional().isIn(['newest', 'oldest', 'price-low', 'price-high', 'rating']).withMessage('Invalid sort option')
], asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      errors: errors.array()
    });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query
  let query = { isPublished: true };

  // Category filter
  if (req.query.category) {
    query.category = req.query.category;
  }

  // Level filter
  if (req.query.level) {
    query.level = req.query.level;
  }

  // Search filter
  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }

  // Build sort
  let sort = {};
  switch (req.query.sort) {
    case 'newest':
      sort = { createdAt: -1 };
      break;
    case 'oldest':
      sort = { createdAt: 1 };
      break;
    case 'price-low':
      sort = { price: 1 };
      break;
    case 'price-high':
      sort = { price: -1 };
      break;
    case 'rating':
      sort = { rating: -1 };
      break;
    default:
      sort = { createdAt: -1 };
  }

  const courses = await Course.find(query)
    .populate('educator', 'name avatar')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Course.countDocuments(query);

  res.status(200).json({
    status: 'success',
    data: {
      courses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// @desc    Get single course (public)
// @route   GET /api/courses/:id
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('educator', 'name avatar bio')
    .populate('reviews.user', 'name avatar');

  if (!course) {
    return res.status(404).json({
      status: 'error',
      message: 'Course not found'
    });
  }

  res.status(200).json({
    status: 'success',
    data: { course }
  });
}));

// @desc    Create course
// @route   POST /api/courses
// @access  Private (Educator only)
router.post('/', protect, authorize('educator', 'admin'), [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('category')
    .isIn(['programming', 'design', 'business', 'marketing', 'music', 'photography', 'health', 'fitness', 'cooking', 'language', 'other'])
    .withMessage('Invalid category'),
  body('level')
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid level'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('originalPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Original price must be a positive number')
], asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      errors: errors.array()
    });
  }

  const course = await Course.create({
    ...req.body,
    educator: req.user.id
  });

  res.status(201).json({
    status: 'success',
    message: 'Course created successfully',
    data: { course }
  });
}));

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Course owner or admin)
router.put('/:id', protect, checkCourseOwnership, [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('category')
    .optional()
    .isIn(['programming', 'design', 'business', 'marketing', 'music', 'photography', 'health', 'fitness', 'cooking', 'language', 'other'])
    .withMessage('Invalid category'),
  body('level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid level'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number')
], asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      errors: errors.array()
    });
  }

  const course = await Course.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    status: 'success',
    message: 'Course updated successfully',
    data: { course }
  });
}));

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Course owner or admin)
router.delete('/:id', protect, checkCourseOwnership, asyncHandler(async (req, res) => {
  await Course.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: 'success',
    message: 'Course deleted successfully'
  });
}));

// @desc    Get educator's courses
// @route   GET /api/courses/educator/my-courses
// @access  Private (Educator only)
router.get('/educator/my-courses', protect, authorize('educator', 'admin'), asyncHandler(async (req, res) => {
  const courses = await Course.find({ educator: req.user.id })
    .populate('educator', 'name avatar')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    data: { courses }
  });
}));

// @desc    Add course review
// @route   POST /api/courses/:id/reviews
// @access  Private (Enrolled students only)
router.post('/:id/reviews', protect, [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Comment must be between 10 and 500 characters')
], asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      errors: errors.array()
    });
  }

  const course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({
      status: 'error',
      message: 'Course not found'
    });
  }

  // Check if user is enrolled
  const isEnrolled = course.enrolledStudents.some(
    enrollment => enrollment.student.toString() === req.user.id
  );

  if (!isEnrolled) {
    return res.status(403).json({
      status: 'error',
      message: 'You must be enrolled in this course to leave a review'
    });
  }

  // Check if user already reviewed
  const alreadyReviewed = course.reviews.find(
    review => review.user.toString() === req.user.id
  );

  if (alreadyReviewed) {
    return res.status(400).json({
      status: 'error',
      message: 'You have already reviewed this course'
    });
  }

  const review = {
    user: req.user.id,
    rating: req.body.rating,
    comment: req.body.comment
  };

  course.reviews.push(review);

  // Calculate average rating
  const totalRating = course.reviews.reduce((sum, review) => sum + review.rating, 0);
  course.rating = totalRating / course.reviews.length;
  course.numReviews = course.reviews.length;

  await course.save();

  res.status(201).json({
    status: 'success',
    message: 'Review added successfully',
    data: { review }
  });
}));

export default router;
