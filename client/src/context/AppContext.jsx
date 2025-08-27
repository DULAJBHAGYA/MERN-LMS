import { createContext, useState, useEffect } from "react"; 
import { useAuth } from "./AuthContext";
import { coursesAPI, enrollmentsAPI } from "../services/api";
import { useNavigate } from "react-router-dom";
import humanizeDuration from "humanize-duration";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
  const currency = import.meta.env.VITE_CURRENCY || "$";
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [allCourses, setAllCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all courses from API
  const fetchAllCourses = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await coursesAPI.getAll(params);
      setAllCourses(response.data.data.courses);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch courses');
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's enrolled courses
  const fetchUserEnrolledCourses = async () => {
    if (!isAuthenticated) {
      setEnrolledCourses([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await enrollmentsAPI.getMyEnrollments();
      setEnrolledCourses(response.data.data.enrollments);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch enrollments');
      console.error('Error fetching enrollments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Enroll in a course
  const enrollInCourse = async (courseId) => {
    try {
      setLoading(true);
      setError(null);
      await enrollmentsAPI.enroll(courseId);
      // Refresh enrolled courses
      await fetchUserEnrolledCourses();
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to enroll in course';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Calculate average rating of course
  const calculateRating = (course) => {
    if (!course.reviews || course.reviews.length === 0) {
      return 0;
    }
    const totalRating = course.reviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / course.reviews.length;
  };

  // Calculate course chapter time
  const calculateChapterTime = (chapter) => {
    if (!chapter.lessons || chapter.lessons.length === 0) {
      return "0m";
    }
    const time = chapter.lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0);
    return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
  };

  // Calculate course duration
  const calculateCourseDuration = (course) => {
    if (!course.lessons || course.lessons.length === 0) {
      return "0m";
    }
    const time = course.lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0);
    return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
  };

  // Calculate number of lessons in the course
  const calculateNoOfLectures = (course) => {
    return course.lessons ? course.lessons.length : 0;
  };

  // Search courses
  const searchCourses = async (query) => {
    try {
      setLoading(true);
      setError(null);
      const response = await coursesAPI.search(query);
      setAllCourses(response.data.data.courses);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search courses');
      console.error('Error searching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Initialize data
  useEffect(() => {
    fetchAllCourses();
  }, []);

  useEffect(() => {
    fetchUserEnrolledCourses();
  }, [isAuthenticated]);

  const value = {
    currency,
    allCourses,
    enrolledCourses,
    loading,
    error,
    navigate,
    calculateRating,
    calculateNoOfLectures,
    calculateChapterTime,
    calculateCourseDuration,
    fetchAllCourses,
    fetchUserEnrolledCourses,
    enrollInCourse,
    searchCourses,
    clearError,
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};
