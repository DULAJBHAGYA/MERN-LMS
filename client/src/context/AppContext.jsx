import { createContext, useState, useEffect } from "react"; 
import { dummyCourses } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import humanizeDuration from "humanize-duration";

export const AppContext = createContext();

export const AppContextProvider = (props) => {

  const currency = import.meta.env.VITE_CURRENCY;

  const navigate = useNavigate()

  const [allCourses, setAllCourses] = useState([]);
  const [isEducator, setIsEdcuator] = useState(true);

  // Fetch all courses
  const fetchAllCourses = async () => {
    setAllCourses(dummyCourses);
  }

  //function to calculate average rating of course
  const calculateRating = (course)=> {
    if(course.courseRatings.length === 0){
        return 0;
    }
    let totalRating = 0
    course.courseRatings.forEach(rating => {
        totalRating += rating.rating
    })
    return totalRating / course.courseRatings.length
  }

  //function to claculate course chapter time
  const calculateChapterTime = (chapter) => {
    let time = 0
    chapter.chapterContent.map((lecture)=> time += lecture.lectureDuration)
    return humanizeDuration(time * 60 * 1000, {units: ["h", "m"]})
  }

  //function ot calculate course duration
  const calculateCourseDuration = (course) => {
  let time = 0;

  course.courseContent.map((chapter) =>
    chapter.chapterContent.map((lecture) => (time += lecture.lectureDuration))
  );

  return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
};


  //function to no. of lectures in the course
  const calculateNoOfLectures = (course) => {
  let totlaLectures = 0;

  course.courseContent.forEach(chapter => {
    if (Array.isArray(chapter.chapterContent)) {
      totlaLectures += chapter.chapterContent.length;
    }
  });

  return totlaLectures;
};



  useEffect(() => {
    fetchAllCourses();
  }, []);

  const value = {
    currency,
    allCourses,
    navigate,
    calculateRating,
    isEducator,
    setIsEdcuator,
    calculateNoOfLectures,
    calculateChapterTime,
    calculateCourseDuration
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};
