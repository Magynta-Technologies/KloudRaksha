import React from 'react';
import { FaSpinner } from 'react-icons/fa';

const Preloader: React.FC = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-white ">
      <div className="flex flex-col items-center text-gray-300">
        <FaSpinner className="animate-spin h-12 w-12" color='#6B8AFD'/>
        <span className="mt-2 text-black">Loading...</span>
      </div>
    </div>
  );
};

export default Preloader;