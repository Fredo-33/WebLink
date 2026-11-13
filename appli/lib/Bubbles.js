import { useEffect, useRef } from 'react';

const Bubbles = ({ bubbleCount = 46 }) => {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const getCookie = (name) => {
      const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
      return match ? decodeURIComponent(match[2]) : null;
    };

    const defaultColors = {
      bgColor: '#ffffffb8',
      color: '#d9534f',
      buttonColor: '#fff',
      CtaColor: '#797a80',
    };

    const colors = {
      bgColor: getCookie('selectedBgColor') || defaultColors.bgColor,
      color: getCookie('selectedColor') || defaultColors.color,
      buttonColor: getCookie('selectedButtonColor') || defaultColors.buttonColor,
      CtaColor: getCookie('selectedCtaColor') || defaultColors.CtaColor,
    };

    const bubbles = Array.from({ length: bubbleCount }, () => createBubble());

    function createBubble(x = Math.random() * width, y = Math.random() * height, size = Math.random() * 16 + 4) {
      return {
        x,
        y,
        size,
        speedX: Math.random() * 1.6 - 0.8,
        speedY: Math.random() * 1.6 - 0.8,
        color: Object.values(colors)[Math.floor(Math.random() * Object.values(colors).length)],
        opacity: Math.random() * 0.4 + 0.2,
      };
    }

    const drawBubble = (bubble) => {
      ctx.save();
      ctx.globalAlpha = bubble.opacity * 0.4;
      const gradient = ctx.createRadialGradient(
        bubble.x,
        bubble.y,
        bubble.size * 0.68,
        bubble.x,
        bubble.y,
        bubble.size
      );
      gradient.addColorStop(0, bubble.color);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = bubble.opacity;
      ctx.fillStyle = bubble.color;
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawShards = (shards) => {
      shards.forEach((shard) => {
        ctx.save();
        ctx.globalAlpha = shard.opacity;
        ctx.fillStyle = shard.color;
        ctx.beginPath();
        ctx.arc(shard.x, shard.y, shard.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        shard.x += shard.speedX;
        shard.y += shard.speedY;
        shard.opacity -= 0.02;
      });
    };

    const update = () => {
      bubbles.forEach((bubble, index) => {
        bubble.x += bubble.speedX;
        bubble.y += bubble.speedY;

        if (mouse.current.active) {
          const dx = mouse.current.x - bubble.x;
          const dy = mouse.current.y - bubble.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const repulsionForce = 2;

          if (distance < 140) {
            const repelX = (dx / distance) * repulsionForce;
            const repelY = (dy / distance) * repulsionForce;

            bubble.x -= repelX;
            bubble.y -= repelY;
          }
        }

        if (bubble.x - bubble.size < 0 || bubble.x + bubble.size > width || bubble.y - bubble.size < 0 || bubble.y + bubble.size > height) {
          const shards = createShards(bubble.x, bubble.y, bubble.color, 6);
          bubbles.splice(index, 1);
          shardsList.push(...shards);
          bubbles.push(createBubble());
        }
      });

      shardsList = shardsList.filter((shard) => shard.opacity > 0);
    };

    const createShards = (x, y, color, count) => {
      return Array.from({ length: count }, () => ({
        x,
        y,
        size: Math.random() * 6.2 + 1,
        speedX: Math.random() * 1.4 - 0.7,
        speedY: Math.random() * 1.4 - 0.7,
        color,
        opacity: Math.random() * 0.5 + 0.5,
      }));
    };

    let shardsList = [];

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      bubbles.forEach(drawBubble);
      drawShards(shardsList);
      update();
      requestAnimationFrame(draw);
    };

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    const handleMouseMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      mouse.current.active = true;
    };

    const handleMouseLeave = () => {
      mouse.current.active = false;
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [bubbleCount]);

  return (
    <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1000, pointerEvents: 'none', }} />
  );
};

export default Bubbles;