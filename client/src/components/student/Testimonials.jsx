import React from "react";
import { assets, dummyTestimonial } from "../../assets/assets";

const Testimonials = () => {
  return (
    <div className="pb-14 px-4 sm:px-8 md:px-12 lg:px-16 max-w-screen-xl mx-auto">
      <h2 className="text-2xl sm:text-3xl font-medium text-gray-800">Testimonials</h2>
      <p className="text-sm sm:text-base text-gray-500 mt-3">
        Hear from our learners as they share their journeys of transformation,
        success, and how our<br/> platform has made a difference in their lives.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-8 sm:mt-10 lg:mt-14 w-full">
        {dummyTestimonial.map((testimonial, index) => (
          <div
            key={index}
            className="min-w-full text-sm text-left border border-gray-500/30 pb-6 rounded-lg bg-white shadow-[0px_4px_15px_0px] shadow-black/5 overflow-hidden flex flex-col h-full"
          >
            <div className="flex items-center gap-4 px-4 sm:px-5 py-4 bg-gray-500/10">
              <img
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover"
                src={testimonial.image}
                alt={testimonial.name}
              />
              <div>
                <h1 className="text-base sm:text-lg font-medium text-gray-800">
                  {testimonial.name}
                </h1>
                <p className="text-xs sm:text-sm text-gray-800/80">{testimonial.role}</p>
              </div>
            </div>

            <div className="p-4 sm:p-5 pb-6 sm:pb-7 flex-grow">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <img
                    className="h-4 sm:h-5"
                    key={i}
                    src={
                      i < Math.floor(testimonial.rating)
                        ? assets.star
                        : assets.star_blank
                    }
                    alt="star"
                  />
                ))}
              </div>
              <p className="text-gray-500 mt-3 sm:mt-5 text-xs sm:text-sm">{testimonial.feedback}</p>
            </div>

            <a href="#" className="text-blue-500 underline px-4 sm:px-5 mt-auto text-xs sm:text-sm">
              Read more
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Testimonials;