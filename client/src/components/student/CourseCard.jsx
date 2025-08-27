import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import Rating from './Rating'

const CourseCard = ({ course }) => {
  const { 
    currency, 
    calculateRating, 
    calculateNoOfLectures, 
    calculateCourseDuration,
    enrollInCourse,
    enrolledCourses 
  } = useContext(AppContext)

  const isEnrolled = enrolledCourses.some(enrollment => 
    enrollment.course._id === course._id
  )

  const handleEnroll = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const result = await enrollInCourse(course._id)
    if (result.success) {
      // Success message or redirect
      console.log('Successfully enrolled!')
    }
  }

  const rating = calculateRating(course)
  const totalLectures = calculateNoOfLectures(course)
  const duration = calculateCourseDuration(course)

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Course Image */}
      <div className="relative">
        <img
          src={course.thumbnail?.url || '/default-course-image.jpg'}
          alt={course.title}
          className="w-full h-48 object-cover"
        />
        {course.isFeatured && (
          <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-medium">
            Featured
          </div>
        )}
        {course.originalPrice && course.originalPrice > course.price && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
            {Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)}% OFF
          </div>
        )}
      </div>

      {/* Course Content */}
      <div className="p-4">
        {/* Category and Level */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
            {course.category}
          </span>
          <span className="text-xs text-gray-500 capitalize">
            {course.level}
          </span>
        </div>

        {/* Course Title */}
        <Link to={`/course/${course._id}`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-indigo-600 transition-colors">
            {course.title}
          </h3>
        </Link>

        {/* Course Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {course.shortDescription || course.description}
        </p>

        {/* Educator */}
        {course.educator && (
          <div className="flex items-center mb-3">
            <img
              src={course.educator.avatar?.url || '/default-avatar.jpg'}
              alt={course.educator.name}
              className="w-6 h-6 rounded-full mr-2"
            />
            <span className="text-sm text-gray-600">{course.educator.name}</span>
          </div>
        )}

        {/* Course Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center space-x-4">
            <span>{totalLectures} lessons</span>
            <span>{duration}</span>
          </div>
          <div className="flex items-center">
            <Rating rating={rating} />
            <span className="ml-1">({course.numReviews || 0})</span>
          </div>
        </div>

        {/* Price and Enrollment */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {course.originalPrice && course.originalPrice > course.price ? (
              <>
                <span className="text-lg font-bold text-gray-900">
                  {currency}{course.price}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  {currency}{course.originalPrice}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-gray-900">
                {course.price === 0 ? 'Free' : `${currency}${course.price}`}
              </span>
            )}
          </div>

          {isEnrolled ? (
            <Link
              to={`/player/${course._id}`}
              className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Continue Learning
            </Link>
          ) : (
            <button
              onClick={handleEnroll}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Enroll Now
            </button>
          )}
        </div>

        {/* Enrollment Count */}
        <div className="mt-2 text-xs text-gray-500">
          {course.totalEnrollments || 0} students enrolled
        </div>
      </div>
    </div>
  )
}

export default CourseCard
