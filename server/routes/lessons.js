import express from 'express';
import { body, validationResult } from 'express-validator';
import { protect, authorize, checkCourseOwnership } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import Course from '../models/Course.js';

const router = express.Router();

// @desc    Add lesson to course
// @route   POST /api/lessons/:courseId
// @access  Private (Course owner or admin)
router.post('/:courseId', protect, checkCourseOwnership, [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('content')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters'),
  body('order')
    .isInt({ min: 1 })
    .withMessage('Order must be a positive integer'),
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a non-negative integer'),
  body('videoUrl')
    .optional()
    .isURL()
    .withMessage('Video URL must be a valid URL')
], asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      errors: errors.array()
    });
  }

  const course = await Course.findById(req.params.courseId);

  if (!course) {
    return res.status(404).json({
      status: 'error',
      message: 'Course not found'
    });
  }

  // Check if order already exists
  const existingLesson = course.lessons.find(
    lesson => lesson.order === req.body.order
  );

  if (existingLesson) {
    return res.status(400).json({
      status: 'error',
      message: 'A lesson with this order already exists'
    });
  }

  // Add lesson to course
  course.lessons.push(req.body);

  // Sort lessons by order
  course.lessons.sort((a, b) => a.order - b.order);

  await course.save();

  const newLesson = course.lessons[course.lessons.length - 1];

  res.status(201).json({
    status: 'success',
    message: 'Lesson added successfully',
    data: { lesson: newLesson }
  });
}));

// @desc    Update lesson
// @route   PUT /api/lessons/:courseId/:lessonId
// @access  Private (Course owner or admin)
router.put('/:courseId/:lessonId', protect, checkCourseOwnership, [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters'),
  body('order')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Order must be a positive integer'),
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a non-negative integer'),
  body('videoUrl')
    .optional()
    .isURL()
    .withMessage('Video URL must be a valid URL')
], asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      errors: errors.array()
    });
  }

  const course = await Course.findById(req.params.courseId);

  if (!course) {
    return res.status(404).json({
      status: 'error',
      message: 'Course not found'
    });
  }

  // Find lesson index
  const lessonIndex = course.lessons.findIndex(
    lesson => lesson._id.toString() === req.params.lessonId
  );

  if (lessonIndex === -1) {
    return res.status(404).json({
      status: 'error',
      message: 'Lesson not found'
    });
  }

  // Check if new order conflicts with existing lesson
  if (req.body.order && req.body.order !== course.lessons[lessonIndex].order) {
    const existingLesson = course.lessons.find(
      lesson => lesson.order === req.body.order && lesson._id.toString() !== req.params.lessonId
    );

    if (existingLesson) {
      return res.status(400).json({
        status: 'error',
        message: 'A lesson with this order already exists'
      });
    }
  }

  // Update lesson
  course.lessons[lessonIndex] = {
    ...course.lessons[lessonIndex].toObject(),
    ...req.body
  };

  // Sort lessons by order
  course.lessons.sort((a, b) => a.order - b.order);

  await course.save();

  res.status(200).json({
    status: 'success',
    message: 'Lesson updated successfully',
    data: { lesson: course.lessons[lessonIndex] }
  });
}));

// @desc    Delete lesson
// @route   DELETE /api/lessons/:courseId/:lessonId
// @access  Private (Course owner or admin)
router.delete('/:courseId/:lessonId', protect, checkCourseOwnership, asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);

  if (!course) {
    return res.status(404).json({
      status: 'error',
      message: 'Course not found'
    });
  }

  // Find lesson index
  const lessonIndex = course.lessons.findIndex(
    lesson => lesson._id.toString() === req.params.lessonId
  );

  if (lessonIndex === -1) {
    return res.status(404).json({
      status: 'error',
      message: 'Lesson not found'
    });
  }

  // Remove lesson
  course.lessons.splice(lessonIndex, 1);

  // Reorder remaining lessons
  course.lessons.forEach((lesson, index) => {
    lesson.order = index + 1;
  });

  await course.save();

  res.status(200).json({
    status: 'success',
    message: 'Lesson deleted successfully'
  });
}));

// @desc    Get lesson (for enrolled students)
// @route   GET /api/lessons/:courseId/:lessonId
// @access  Private (Enrolled students or course owner)
router.get('/:courseId/:lessonId', protect, asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);

  if (!course) {
    return res.status(404).json({
      status: 'error',
      message: 'Course not found'
    });
  }

  // Find lesson
  const lesson = course.lessons.find(
    lesson => lesson._id.toString() === req.params.lessonId
  );

  if (!lesson) {
    return res.status(404).json({
      status: 'error',
      message: 'Lesson not found'
    });
  }

  // Check if user is enrolled or is the course owner
  const isEnrolled = course.enrolledStudents.some(
    enrollment => enrollment.student.toString() === req.user.id
  );
  const isOwner = course.educator.toString() === req.user.id;

  if (!isEnrolled && !isOwner) {
    return res.status(403).json({
      status: 'error',
      message: 'You must be enrolled in this course to access lessons'
    });
  }

  res.status(200).json({
    status: 'success',
    data: { lesson }
  });
}));

// @desc    Reorder lessons
// @route   PUT /api/lessons/:courseId/reorder
// @access  Private (Course owner or admin)
router.put('/:courseId/reorder', protect, checkCourseOwnership, [
  body('lessonIds')
    .isArray({ min: 1 })
    .withMessage('Lesson IDs must be an array with at least one element')
], asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      errors: errors.array()
    });
  }

  const course = await Course.findById(req.params.courseId);

  if (!course) {
    return res.status(404).json({
      status: 'error',
      message: 'Course not found'
    });
  }

  const { lessonIds } = req.body;

  // Validate that all lesson IDs exist in the course
  const courseLessonIds = course.lessons.map(lesson => lesson._id.toString());
  const invalidIds = lessonIds.filter(id => !courseLessonIds.includes(id));

  if (invalidIds.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Some lesson IDs are invalid'
    });
  }

  // Reorder lessons
  const reorderedLessons = [];
  lessonIds.forEach((lessonId, index) => {
    const lesson = course.lessons.find(l => l._id.toString() === lessonId);
    if (lesson) {
      lesson.order = index + 1;
      reorderedLessons.push(lesson);
    }
  });

  course.lessons = reorderedLessons;
  await course.save();

  res.status(200).json({
    status: 'success',
    message: 'Lessons reordered successfully',
    data: { lessons: course.lessons }
  });
}));

// @desc    Publish/unpublish lesson
// @route   PUT /api/lessons/:courseId/:lessonId/publish
// @access  Private (Course owner or admin)
router.put('/:courseId/:lessonId/publish', protect, checkCourseOwnership, asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);

  if (!course) {
    return res.status(404).json({
      status: 'error',
      message: 'Course not found'
    });
  }

  // Find lesson index
  const lessonIndex = course.lessons.findIndex(
    lesson => lesson._id.toString() === req.params.lessonId
  );

  if (lessonIndex === -1) {
    return res.status(404).json({
      status: 'error',
      message: 'Lesson not found'
    });
  }

  // Toggle publish status
  course.lessons[lessonIndex].isPublished = !course.lessons[lessonIndex].isPublished;

  await course.save();

  res.status(200).json({
    status: 'success',
    message: `Lesson ${course.lessons[lessonIndex].isPublished ? 'published' : 'unpublished'} successfully`,
    data: { lesson: course.lessons[lessonIndex] }
  });
}));

export default router;
