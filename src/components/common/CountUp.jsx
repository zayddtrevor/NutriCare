import React, { useState, useEffect } from 'react';

const CountUp = ({ end, duration = 2000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = currentTime - startTime;

      if (progress < duration) {
        const percentage = progress / duration;
        // Ease out quint
        const ease = 1 - Math.pow(1 - percentage, 5);
        setCount(Math.floor(ease * end));
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration]);

  return <>{count.toLocaleString()}</>;
};

export default CountUp;
