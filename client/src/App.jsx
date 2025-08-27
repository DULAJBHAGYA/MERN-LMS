import React from 'react'
import { Route, Routes, useMatch } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import LoginForm from './components/auth/LoginForm'
import RegisterForm from './components/auth/RegisterForm'

// Student Pages
import Home from './pages/student/Home'
import CourseList from './pages/student/CourseList'
import CourseDetails from './pages/student/CourseDetails'
import MyEnrollments from './pages/student/MyEnrollments'
import Player from './pages/student/Player'
import Loading from './components/student/Loading'

// Educator Pages
import Educator from './pages/educator/Educator'
import Dashboard from './pages/educator/Dashboard'
import AddCourse from './pages/educator/AddCourse'
import MyCourses from './pages/educator/MyCourses'
import StudentsEnrolled from './pages/educator/StudentsEnrolled'

// Common Components
import Navbar from './components/student/Navbar'

const App = () => {
  const { loading } = useAuth()
  const isEducatorRoute = useMatch('/educator/*')
  const isAuthRoute = useMatch('/login') || useMatch('/register')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className='text-default min-h-screen bg-white'>
      {!isEducatorRoute && !isAuthRoute && <Navbar/>}
      <Routes>
        {/* Public Routes */}
        <Route path='/' element={<Home/>}/>
        <Route path='/course-list' element={<CourseList/>}/>
        <Route path='/course-list/:input' element={<CourseList/>}/>
        <Route path='/course/:id' element={<CourseDetails/>}/>
        <Route path='/loading/:path' element={<Loading/>}/>
        
        {/* Authentication Routes */}
        <Route path='/login' element={<LoginForm/>}/>
        <Route path='/register' element={<RegisterForm/>}/>

        {/* Protected Student Routes */}
        <Route path='/my-enrollments' element={
          <ProtectedRoute allowedRoles={['student', 'educator', 'admin']}>
            <MyEnrollments/>
          </ProtectedRoute>
        }/>
        <Route path='/player/:courseID' element={
          <ProtectedRoute allowedRoles={['student', 'educator', 'admin']}>
            <Player/>
          </ProtectedRoute>
        }/>

        {/* Protected Educator Routes */}
        <Route path='/educator' element={
          <ProtectedRoute allowedRoles={['educator', 'admin']}>
            <Educator/>
          </ProtectedRoute>
        }>
          <Route path='educator' element={<Dashboard/>}/>
          <Route path='add-course' element={<AddCourse/>}/>
          <Route path='my-course' element={<MyCourses/>}/>
          <Route path='student-enrolled' element={<StudentsEnrolled/>}/>
        </Route>
      </Routes>
    </div>
  )
}

export default App