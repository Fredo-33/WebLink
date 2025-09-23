import { useEffect, useRef } from 'react';

const Fireflies = ({ fireflyCount = 98 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const fireflies = Array.from({ length: fireflyCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.6 + 0.8,
      opacity: Math.random(),
      opacitySpeed: Math.random() * 0.02 + 0.01,
      dx: (Math.random() * 1 - 0.5) * 1.8,
      dy: (Math.random() * 1 - 0.5) * 1.8,
      color: Math.random() > 0.5 ? '#F0F0F0' : '#808080',
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      fireflies.forEach((firefly) => {
        firefly.opacity += firefly.opacitySpeed;
        if (firefly.opacity > 1 || firefly.opacity < 0) {
          firefly.opacitySpeed *= -1;
        }

        firefly.x += firefly.dx;
        firefly.y += firefly.dy;

        if (firefly.x > width) firefly.x = 0;
        if (firefly.x < 0) firefly.x = width;
        if (firefly.y > height) firefly.y = 0;
        if (firefly.y < 0) firefly.y = height;

        ctx.globalAlpha = firefly.opacity;
        ctx.fillStyle = firefly.color;
        ctx.beginPath();
        ctx.arc(firefly.x, firefly.y, firefly.size, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    const interval = setInterval(draw, 30);

    window.addEventListener('resize', resizeCanvas);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [fireflyCount]);

  return (
    <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1000, pointerEvents: 'none' }} />
  );
};

export default Fireflies;