import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a lesson title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a lesson description']
  },
  content: {
    type: String,
    required: [true, 'Please provide lesson content']
  },
  videoUrl: {
    type: String,
    default: ''
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  order: {
    type: Number,
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['pdf', 'video', 'link', 'document'],
      default: 'document'
    }
  }]
}, {
  timestamps: true
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a course title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a course description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot be more than 200 characters']
  },
  educator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: [
      'programming',
      'design',
      'business',
      'marketing',
      'music',
      'photography',
      'health',
      'fitness',
      'cooking',
      'language',
      'other'
    ]
  },
  level: {
    type: String,
    required: [true, 'Please provide a difficulty level'],
    enum: ['beginner', 'intermediate', 'advanced']
  },
  price: {
    type: Number,
    required: [true, 'Please provide a price'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  thumbnail: {
    public_id: {
      type: String,
      default: ''
    },
    url: {
      type: String,
      default: ''
    }
  },
  lessons: [lessonSchema],
  totalLessons: {
    type: Number,
    default: 0
  },
  totalDuration: {
    type: Number, // in minutes
    default: 0
  },
  enrolledStudents: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    completedLessons: [{
      type: mongoose.Schema.Types.ObjectId
    }]
  }],
  totalEnrollments: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numReviews: {
    type: Number,
    default: 0
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  requirements: [{
    type: String,
    trim: true
  }],
  learningOutcomes: [{
    type: String,
    trim: true
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  language: {
    type: String,
    default: 'English'
  },
  certificate: {
    type: Boolean,
    default: true
  },
  access: {
    type: String,
    enum: ['lifetime', 'limited'],
    default: 'lifetime'
  },
  accessDuration: {
    type: Number, // in days, for limited access
    default: 365
  }
}, {
  timestamps: true
});

// Index for search functionality
courseSchema.index({ 
  title: 'text', 
  description: 'text', 
  tags: 'text' 
});

// Calculate total lessons and duration before saving
courseSchema.pre('save', function(next) {
  this.totalLessons = this.lessons.length;
  this.totalDuration = this.lessons.reduce((total, lesson) => total + lesson.duration, 0);
  next();
});

// Virtual for average rating
courseSchema.virtual('averageRating').get(function() {
  if (this.reviews.length === 0) return 0;
  const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  return (total / this.reviews.length).toFixed(1);
});

export default mongoose.model('Course', courseSchema);
