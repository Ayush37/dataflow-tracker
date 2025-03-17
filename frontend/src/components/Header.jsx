import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-blue-900 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          DERIV Flow Tracker
        </Link>
        <div>
          <a 
            href="https://github.com/your-username/deriv-flow-tracker" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-white hover:text-blue-200"
          >
            Documentation
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
