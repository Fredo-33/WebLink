import { useEffect, useRef } from 'react';

const FallLeaves = ({ maxSize = 32, minSize = 6, maxSpeed = 0.6, leafCount = 12 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const colors = ['#FF5733', '#FFC300', '#DAF7A6', '#C70039'];
    const leafShapes = ['🍁', '🍂', '🍃'];

    const leaves = Array.from({ length: leafCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * (maxSize - minSize) + minSize,
      speed: Math.random() * maxSpeed + 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: leafShapes[Math.floor(Math.random() * leafShapes.length)],
      angle: Math.random() * 360,
      rotationSpeed: Math.random() * 2 - 1,
      opacity: Math.random() * 0.4 + 0.5,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      leaves.forEach((leaf) => {
        ctx.save();
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate((leaf.angle * Math.PI) / 180);
        ctx.globalAlpha = leaf.opacity;
        ctx.font = `${leaf.size}px Arial`;
        ctx.fillStyle = leaf.color;
        ctx.fillText(leaf.shape, 0, 0);
        ctx.restore();
      });
      update();
    };

    const update = () => {
      leaves.forEach((leaf) => {
        leaf.y += leaf.speed;
        leaf.x += Math.sin(leaf.y / 68.8);
        leaf.angle += leaf.rotationSpeed;

        if (leaf.y > height) {
          leaf.y = -leaf.size;
          leaf.x = Math.random() * width;
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
  }, [maxSize, minSize, maxSpeed, leafCount]);

  return (
    <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1000, pointerEvents: 'none', }} />
  );
};

export default FallLeaves;