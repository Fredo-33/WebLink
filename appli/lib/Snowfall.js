import { useEffect, useRef } from 'react';

const Snowfall = ({ maxSize = 3.8, minSize = 0.4, maxSpeed = 1.2 }) => {
  const canvasRef = useRef(null);


  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const colors = ['#FAFAFA', '#DCDCDC', '#E0E0E0', '#A9A9A9'];
    const shapes = ['circle', 'star'];

    const snowflakes = Array.from({ length: 168 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * (maxSize - minSize) + minSize,
      d: Math.random() * maxSpeed,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)]
    }));

    const drawStar = (ctx, x, y, r, points = 5, inset = 0.5) => {
      ctx.moveTo(x, y - r);
      for (let i = 0; i < points * 2; i++) {
        const angle = (Math.PI / points) * i;
        const radius = i % 2 === 0 ? r : r * inset;
        const xPos = x + Math.cos(angle) * radius;
        const yPos = y + Math.sin(angle) * radius;
        ctx.lineTo(xPos, yPos);
      }
      ctx.closePath();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (let flake of snowflakes) {
        ctx.fillStyle = flake.color;
        ctx.beginPath();

        switch (flake.shape) {
          case 'circle':
            ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);
            break;
          case 'square':
            ctx.rect(flake.x - flake.r, flake.y - flake.r, flake.r * 2, flake.r * 2);
            break;
          case 'triangle':
            ctx.moveTo(flake.x, flake.y - flake.r);
            ctx.lineTo(flake.x - flake.r, flake.y + flake.r);
            ctx.lineTo(flake.x + flake.r, flake.y + flake.r);
            ctx.closePath();
            break;
          case 'star':
            drawStar(ctx, flake.x, flake.y, flake.r, 5, 0.5);
            break;
          default:
            ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);
        }

        ctx.fill();
      }
      update();
    };

    const update = () => {
      for (let flake of snowflakes) {
        flake.y += Math.pow(flake.d, 2) + 1;
        flake.x += Math.sin(flake.y / 50);

        if (flake.y > height) {
          flake.y = 0;
          flake.x = Math.random() * width;
        }
      }
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

export default Snowfall;