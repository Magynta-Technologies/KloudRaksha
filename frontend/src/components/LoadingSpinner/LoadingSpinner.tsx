import React, { useState, useEffect } from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  onAlertAppear: () => void;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ onAlertAppear }) => {
  const [progress, setProgress] = useState(1); // Start from 1 to reach 100%
  const [showSpinner, setShowSpinner] = useState(true);

  useEffect(() => {
    const intervalTime = 30; // Time between each progress update in milliseconds (3 seconds / 100)
    const totalTime = 2000; // Total time in milliseconds (3 seconds)
    const totalSteps = Math.ceil(totalTime / intervalTime); // Total number of steps to reach 100%

    const timer = setInterval(() => {
      if (progress < 100) {
        setProgress(prevProgress => prevProgress + (100 / totalSteps));
      } else {
        clearInterval(timer);
        setShowSpinner(false);
        onAlertAppear(); // Call the provided function when alert appears
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [progress, onAlertAppear]);

  return (
    <>
      {showSpinner && (
        <div className="overlay">
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            <div className="message">Please wait for 4 hours</div>
          </div>
        </div>
      )}
    </>
  );
};

export default LoadingSpinner;
