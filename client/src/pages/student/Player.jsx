import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { useParams } from "react-router-dom";
import { assets } from "../../assets/assets";
import humanizeDuration from "humanize-duration";
import YouTube from "react-youtube";
import Footer from "../../components/student/Footer";
import Rating from "../../components/student/Rating";

const Player = () => {
  const { enrolledCourses, calculateChapterTime } = useContext(AppContext);
  const params = useParams();
  const [courseData, setCourseData] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const [playerData, setPlayerData] = useState(null);

  const courseId = params.courseId || params.id || params.course_id || params.courseid;

  const getCourseData = () => {
    console.log("All URL params:", params);
    console.log("Enrolled courses:", enrolledCourses);
    console.log("Course ID from params:", courseId);
    
    if (!enrolledCourses || enrolledCourses.length === 0) {
      console.log("No enrolled courses available");
      return;
    }

    if (!courseId) {
      console.log("No courseId found in URL params. Available params:", Object.keys(params));
      if (enrolledCourses.length > 0) {
        console.log("Setting first course as fallback");
        setCourseData(enrolledCourses[0]);
      }
      return;
    }

    const foundCourse = enrolledCourses.find(course => course._id === courseId);
    console.log("Found course:", foundCourse);
    
    if (foundCourse) {
      setCourseData(foundCourse);
      console.log("Course data set:", foundCourse);
    } else {
      console.log("Course not found with ID:", courseId);
      console.log("Available course IDs:", enrolledCourses.map(c => c._id));
    }
  };

  const toggleSection = (index) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  useEffect(() => {
    console.log("useEffect triggered");
    getCourseData();
  }, [enrolledCourses, courseId]);

  useEffect(() => {
    console.log("Current courseData:", courseData);
  }, [courseData]);

  if (!courseData) {
    return (
      <div className="p-4 sm:p-10 flex justify-center items-center">
        <div className="text-center">
          <p className="text-gray-600">Loading course content...</p>
          {/* Debug info */}
          <div className="mt-4 text-sm text-gray-400">
            <p>Course ID: {courseId || 'Not found'}</p>
            <p>Available params: {JSON.stringify(params)}</p>
            <p>Enrolled Courses: {enrolledCourses ? enrolledCourses.length : 0}</p>
            {enrolledCourses && enrolledCourses.length > 0 && (
              <p>Available Course IDs: {enrolledCourses.map(c => c._id).join(', ')}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 sm:p-10 flex flex-col-reverse md:grid md:grid-cols-2 gap-10 md:px-36">
        {/*left-column*/}
        <div className="text-gray-800">
          <h2 className="text-xl font-semibold">Course Structure</h2>
          <p className="text-2xl font-bold text-gray-800 mb-4">{courseData.courseTitle}</p>

          <div className="pt-5">
            {courseData.courseContent && courseData.courseContent.length > 0 ? (
              courseData.courseContent.map((chapter, index) => (
                <div
                  key={index}
                  className="border border-gray-300 bg-white mb-2 rounded"
                >
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                    onClick={() => toggleSection(index)}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        className={`transform transition-transform ${
                          openSections[index] ? "rotate-180" : ""
                        }`}
                        src={assets.down_arrow_icon}
                        alt="arrow icon"
                      />
                      <p className="font-medium md:text-base text-sm">
                        {chapter.chapterTitle}
                      </p>
                      <p className="text-sm text-gray-600">
                        : {chapter.chapterContent?.length || 0} lectures |{" "}
                        {calculateChapterTime ? calculateChapterTime(chapter) : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openSections[index] ? "max-h-96" : "max-h-0"
                    }`}
                  >
                    <ul className="list-disc md:pl-10 pl-4 pr-4 py-2 text-gray-600 border-t border-gray-300">
                      {chapter.chapterContent && chapter.chapterContent.map((lecture, i) => (
                        <li key={i} className="flex items-start gap-2 py-1">
                          <img
                            src={false ? assets.blue_tick_icon : assets.play_icon}
                            alt="play icon"
                            className="w-4 h-4 mt-1"
                          />
                          <div className="flex items-center justify-between w-full text-gray-800 text-xs md:text-sm">
                            <p>{lecture.lectureTitle}</p>
                            <div className="flex gap-2">
                              {lecture.lectureUrl && (
                                <p
                                  onClick={() =>
                                    setPlayerData({
                                      ...lecture,
                                      chapter: index + 1,
                                      lecture: i + 1
                                    })
                                  }
                                  className="text-blue-500 cursor-pointer hover:underline"
                                >
                                  Watch
                                </p>
                              )}
                              <p className="text-gray-500">
                                {lecture.lectureDuration 
                                  ? humanizeDuration(
                                      lecture.lectureDuration * 60 * 1000,
                                      { units: ["h", "m"] }
                                    )
                                  : "N/A"
                                }
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No course content available.</p>
                <div className="mt-4 text-sm text-gray-400">
                  <p>Debug: Course data structure:</p>
                  <pre className="text-xs mt-2 bg-gray-100 p-2 rounded">
                    {JSON.stringify(courseData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 py-3  mt-10">
            <h1 className="text-xl font-bold">Rate this course:</h1>
            <Rating initialRating={0}/>
          </div>
        </div>

        {/*right-column*/}
        <div className="md:mt-10">
          {
            playerData ? (
              <div>
                <YouTube videoId={playerData.lectureUrl.split('/').pop()} opts={{playerVars: {
                    autoplay: 1
                  }}} iframeClassName="w-full aspect-video"/>
                  <div className="flex justify-between items-center mt-1">
                    <p>{playerData.chapter}.{playerData.lecture} {playerData.lectureTitle}</p>
                    <button className="text-blue-600">{false ? 'Completed' : 'Mark Complete'}</button>
                  </div>
              </div>
            )
            :
          <img src={courseData ? courseData.courseThumbnail : ''} alt="" />

          }
        </div>
      </div>
      <Footer/>
    </>
  );
};

export default Player;