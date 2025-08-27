import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';

const router = express.Router();

// @desc    Enroll in a course
// @route   POST /api/enrollments
// @access  Private (Students only)
router.post('/', protect, authorize('student'), asyncHandler(async (req, res) => {
  const { courseId } = req.body;

  if (!courseId) {
    return res.status(400).json({
      status: 'error',
      message: 'Course ID is required'
    });
  }

  // Check if course exists and is published
  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json({
      status: 'error',
      message: 'Course not found'
    });
  }

  if (!course.isPublished) {
    return res.status(400).json({
      status: 'error',
      message: 'Course is not available for enrollment'
    });
  }

  // Check if already enrolled
  const existingEnrollment = await Enrollment.findOne({
    student: req.user.id,
    course: courseId
  });

  if (existingEnrollment) {
    return res.status(400).json({
      status: 'error',
      message: 'You are already enrolled in this course'
    });
  }

  // Create enrollment
  const enrollment = await Enrollment.create({
    student: req.user.id,
    course: courseId
  });

  // Add student to course's enrolled students
  course.enrolledStudents.push({
    student: req.user.id,
    enrolledAt: new Date()
  });
  course.totalEnrollments += 1;
  await course.save();

  // Populate course details
  await enrollment.populate('course', 'title description thumbnail educator');

  res.status(201).json({
    status: 'success',
    message: 'Successfully enrolled in course',
    data: { enrollment }
  });
}));

// @desc    Get user's enrollments
// @route   GET /api/enrollments/my-enrollments
// @access  Private
router.get('/my-enrollments', protect, asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ 
    student: req.user.id,
    isActive: true 
  })
    .populate('course', 'title description thumbnail educator totalLessons totalDuration')
    .populate('course.educator', 'name avatar')
    .sort({ enrolledAt: -1 });

  res.status(200).json({
    status: 'success',
    data: { enrollments }
  });
}));

// @desc    Get single enrollment
// @route   GET /api/enrollments/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findOne({
    _id: req.params.id,
    student: req.user.id
  })
    .populate('course', 'title description thumbnail educator lessons')
    .populate('course.educator', 'name avatar');

  if (!enrollment) {
    return res.status(404).json({
      status: 'error',
      message: 'Enrollment not found'
    });
  }

  res.status(200).json({
    status: 'success',
    data: { enrollment }
  });
}));

// @desc    Mark lesson as completed
// @route   POST /api/enrollments/:id/complete-lesson
// @access  Private
router.post('/:id/complete-lesson', protect, asyncHandler(async (req, res) => {
  const { lessonId, timeSpent = 0 } = req.body;

  if (!lessonId) {
    return res.status(400).json({
      status: 'error',
      message: 'Lesson ID is required'
    });
  }

  const enrollment = await Enrollment.findOne({
    _id: req.params.id,
    student: req.user.id
  });

  if (!enrollment) {
    return res.status(404).json({
      status: 'error',
      message: 'Enrollment not found'
    });
  }

  // Check if lesson is already completed
  const alreadyCompleted = enrollment.completedLessons.find(
    lesson => lesson.lesson.toString() === lessonId
  );

  if (alreadyCompleted) {
    return res.status(400).json({
      status: 'error',
      message: 'Lesson is already completed'
    });
  }

  // Add lesson to completed lessons
  enrollment.completedLessons.push({
    lesson: lessonId,
    timeSpent: timeSpent
  });

  // Update total time spent
  enrollment.totalTimeSpent += timeSpent;

  await enrollment.save();

  res.status(200).json({
    status: 'success',
    message: 'Lesson marked as completed',
    data: { enrollment }
  });
}));

// @desc    Add note to lesson
// @route   POST /api/enrollments/:id/notes
// @access  Private
router.post('/:id/notes', protect, asyncHandler(async (req, res) => {
  const { lessonId, content } = req.body;

  if (!lessonId || !content) {
    return res.status(400).json({
      status: 'error',
      message: 'Lesson ID and content are required'
    });
  }

  if (content.trim().length < 1) {
    return res.status(400).json({
      status: 'error',
      message: 'Note content cannot be empty'
    });
  }

  const enrollment = await Enrollment.findOne({
    _id: req.params.id,
    student: req.user.id
  });

  if (!enrollment) {
    return res.status(404).json({
      status: 'error',
      message: 'Enrollment not found'
    });
  }

  // Add note
  enrollment.notes.push({
    lesson: lessonId,
    content: content.trim()
  });

  await enrollment.save();

  res.status(201).json({
    status: 'success',
    message: 'Note added successfully',
    data: { 
      note: enrollment.notes[enrollment.notes.length - 1] 
    }
  });
}));

// @desc    Get notes for a lesson
// @route   GET /api/enrollments/:id/notes/:lessonId
// @access  Private
router.get('/:id/notes/:lessonId', protect, asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findOne({
    _id: req.params.id,
    student: req.user.id
  });

  if (!enrollment) {
    return res.status(404).json({
      status: 'error',
      message: 'Enrollment not found'
    });
  }

  const notes = enrollment.notes.filter(
    note => note.lesson.toString() === req.params.lessonId
  );

  res.status(200).json({
    status: 'success',
    data: { notes }
  });
}));

// @desc    Get course progress
// @route   GET /api/enrollments/:id/progress
// @access  Private
router.get('/:id/progress', protect, asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findOne({
    _id: req.params.id,
    student: req.user.id
  })
    .populate('course', 'title totalLessons lessons');

  if (!enrollment) {
    return res.status(404).json({
      status: 'error',
      message: 'Enrollment not found'
    });
  }

  const progress = {
    enrollmentId: enrollment._id,
    courseId: enrollment.course._id,
    courseTitle: enrollment.course.title,
    totalLessons: enrollment.course.totalLessons,
    completedLessons: enrollment.completedLessons.length,
    progress: enrollment.progress,
    totalTimeSpent: enrollment.totalTimeSpent,
    isCompleted: enrollment.isCompleted(),
    enrolledAt: enrollment.enrolledAt,
    lastAccessed: enrollment.lastAccessed
  };

  res.status(200).json({
    status: 'success',
    data: { progress }
  });
}));

// @desc    Cancel enrollment
// @route   DELETE /api/enrollments/:id
// @access  Private
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findOne({
    _id: req.params.id,
    student: req.user.id
  });

  if (!enrollment) {
    return res.status(404).json({
      status: 'error',
      message: 'Enrollment not found'
    });
  }

  // Soft delete - mark as inactive
  enrollment.isActive = false;
  await enrollment.save();

  // Remove from course's enrolled students
  const course = await Course.findById(enrollment.course);
  if (course) {
    course.enrolledStudents = course.enrolledStudents.filter(
      student => student.student.toString() !== req.user.id
    );
    course.totalEnrollments = Math.max(0, course.totalEnrollments - 1);
    await course.save();
  }

  res.status(200).json({
    status: 'success',
    message: 'Enrollment cancelled successfully'
  });
}));

export default router;
