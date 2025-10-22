import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="py-6 text-center">
      <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
        Kavya Ai Studio
      </h1>
      <p className="text-gray-400 mt-2">Edit your photos with the power of Gemini Nano</p>
    </header>
  );
};

export default Header;