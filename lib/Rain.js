import { useEffect, useRef } from 'react';

const Rain = ({ maxSize = 16, minSize = 4, maxSpeed = 6.2 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const colors = ['#D1D1D1', '#B8DBFC', '#E1E8EB', '#4682B4'];

    const raindrops = Array.from({ length: 298 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: Math.random() * (maxSize - minSize) + minSize,
      speed: Math.random() * maxSpeed + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      raindrops.forEach((drop) => {
        ctx.beginPath();
        ctx.strokeStyle = drop.color;
        ctx.lineWidth = 0.72;
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x, drop.y + drop.length);
        ctx.stroke();
      });
      update();
    };

    const update = () => {
      raindrops.forEach((drop) => {
        drop.y += drop.speed;
        if (drop.y > height) {
          drop.y = -drop.length;
          drop.x = Math.random() * width;
          drop.color = colors[Math.floor(Math.random() * colors.length)];
        }
      });
    };

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', resizeCanvas);

    const interval = setInterval(draw, 30);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [maxSize, minSize, maxSpeed]);

  return (
    <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1000, pointerEvents: 'none' }} />
  );
};

export default Rain;