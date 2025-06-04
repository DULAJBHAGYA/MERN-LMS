import React, { useEffect, useState } from 'react'

const Rating = ({ initialRating = 0, onRate }) => {
  const [rating, setRating] = useState(initialRating)
  const [hoverRating, setHoverRating] = useState(0)

  const handleRating = (value) => {
    setRating(value);
    if(onRate) onRate(value)
  }

  useEffect((initialRating)=>{
    if(initialRating)
    {setRating(initialRating)}
  }, [initialRating]);

  return (
    <div className="flex">
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1
        return (
          <span 
            key={index}
            className={`text-xl sm:text-2xl cursor-pointer transition-colors duration-200
              ${starValue <= (hoverRating || rating) ? 'text-yellow-500' : 'text-gray-400'}`}
          onClick={()=> handleRating(starValue)}>
            &#9733;
          </span>
        )
      })}
    </div>
  )
}

export default Rating