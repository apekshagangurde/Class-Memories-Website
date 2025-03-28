import React, { useState, useEffect } from 'react';

interface HeaderSlide {
  image: string;
  slogan: string;
  subtext: string;
}

const headerSlides: HeaderSlide[] = [
  {
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    slogan: 'We made memories that will last a lifetime',
    subtext: 'Class of BE2025 - Our journey together'
  },
  {
    image: 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    slogan: 'From strangers to family in four short years',
    subtext: 'BE2025 - The bonds we formed'
  },
  {
    image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    slogan: 'Every challenge, every triumph, every memory',
    subtext: 'BE2025 - Engineering our futures together'
  }
];

const Header: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % headerSlides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleDotClick = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <header className="relative h-96 overflow-hidden">
      {headerSlides.map((slide, index) => (
        <div
          key={index}
          className="header-slide absolute inset-0 bg-cover bg-center transition-opacity duration-800"
          style={{
            backgroundImage: `url('${slide.image}')`,
            opacity: index === currentSlide ? 1 : 0,
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          <div className="absolute inset-0 flex items-center justify-center text-center px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-4 text-shadow">
                {slide.slogan}
              </h1>
              <p className="text-xl md:text-2xl text-white font-serif italic">{slide.subtext}</p>
            </div>
          </div>
        </div>
      ))}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-6">
        <div className="flex space-x-2">
          {headerSlides.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full bg-white ${
                index === currentSlide ? 'bg-opacity-100' : 'bg-opacity-50 hover:bg-opacity-75'
              } transition`}
              onClick={() => handleDotClick(index)}
              aria-label={`Go to slide ${index + 1}`}
            ></button>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Header;
