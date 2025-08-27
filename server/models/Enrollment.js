import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  completedLessons: [{
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    completedAt: {
      type: Date,
      default: Date.now
    },
    timeSpent: {
      type: Number, // in minutes
      default: 0
    }
  }],
  certificate: {
    issued: {
      type: Boolean,
      default: false
    },
    issuedAt: {
      type: Date
    },
    certificateId: {
      type: String
    }
  },
  notes: [{
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  totalTimeSpent: {
    type: Number, // in minutes
    default: 0
  },
  quizScores: [{
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    totalQuestions: {
      type: Number,
      required: true
    },
    correctAnswers: {
      type: Number,
      required: true
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Compound index to ensure unique enrollment per student per course
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// Calculate progress based on completed lessons
enrollmentSchema.methods.calculateProgress = function() {
  if (!this.course || !this.course.lessons) return 0;
  
  const totalLessons = this.course.lessons.length;
  if (totalLessons === 0) return 0;
  
  const completedCount = this.completedLessons.length;
  return Math.round((completedCount / totalLessons) * 100);
};

// Check if course is completed
enrollmentSchema.methods.isCompleted = function() {
  return this.progress === 100;
};

// Get average quiz score
enrollmentSchema.methods.getAverageQuizScore = function() {
  if (this.quizScores.length === 0) return 0;
  
  const totalScore = this.quizScores.reduce((sum, quiz) => sum + quiz.score, 0);
  return Math.round(totalScore / this.quizScores.length);
};

// Pre-save middleware to update progress
enrollmentSchema.pre('save', function(next) {
  if (this.isModified('completedLessons')) {
    this.progress = this.calculateProgress();
    
    // Mark as completed if progress is 100%
    if (this.progress === 100 && !this.completedAt) {
      this.completedAt = new Date();
    }
  }
  
  // Update last accessed
  this.lastAccessed = new Date();
  next();
});

export default mongoose.model('Enrollment', enrollmentSchema);
