import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const SearchBar = ({ onSearch, initialValue = '' }) => {
  const navigate = useNavigate()
  const [input, setInput] = useState(initialValue)

  useEffect(() => {
    setInput(initialValue)
  }, [initialValue])

  const onSearchHandler = (e) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(input)
    } else {
      navigate('/course-list/' + input)
    }
  }

  return (
    <form onSubmit={onSearchHandler} className='max-w-xl w-full md:h-14 h-12 flex items-center bg-white border border-gray-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500'>
      <div className='flex items-center px-3'>
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input 
        onChange={e => setInput(e.target.value)} 
        value={input}
        type='text' 
        placeholder='Search for courses...' 
        className='w-full h-full outline-none text-gray-700 placeholder-gray-400 px-2'
      />
      <button 
        type='submit' 
        className='bg-indigo-600 hover:bg-indigo-700 rounded-r-lg text-white md:px-8 px-6 md:py-3 py-2 transition-colors duration-200'
      >
        Search
      </button>
    </form>
  )
}

export default SearchBar
