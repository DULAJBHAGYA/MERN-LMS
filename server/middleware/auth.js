import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check for token in cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is deactivated'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to access this route'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // Token is invalid, but we don't fail the request
      console.log('Invalid token in optional auth:', error.message);
    }
  }

  next();
};

// Check if user is enrolled in a course
export const checkEnrollment = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const Enrollment = mongoose.model('Enrollment');
    const enrollment = await Enrollment.findOne({
      student: userId,
      course: courseId,
      isActive: true
    });

    if (!enrollment) {
      return res.status(403).json({
        status: 'error',
        message: 'You must be enrolled in this course to access this resource'
      });
    }

    req.enrollment = enrollment;
    next();
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Error checking enrollment'
    });
  }
};

// Check if user is the course educator
export const checkCourseOwnership = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const Course = mongoose.model('Course');
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        status: 'error',
        message: 'Course not found'
      });
    }

    if (course.educator.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to modify this course'
      });
    }

    req.course = course;
    next();
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Error checking course ownership'
    });
  }
};
