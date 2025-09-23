import React, { useRef, useEffect, useState } from 'react';

const Pong = () => {
  const canvasRef = useRef(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [countdown, setCountdown] = useState(4);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameRunning, setGameRunning] = useState(true);
  const [gameVisible, setGameVisible] = useState(true);
  const lostSoundRef = useRef(null);
  const animationFrameIdRef = useRef(null);

  useEffect(() => {
    lostSoundRef.current = new Audio('../static/perdu.mp3');
      return () => {
        if (lostSoundRef.current) {
          lostSoundRef.current.pause();
          lostSoundRef.current = null;
        }
      };
  }, []);

  const stopGame = () => {
    setGameRunning(false);
    setGameVisible(false);
    setGameStarted(false);
    cancelAnimationFrame(animationFrameIdRef.current);
    if (lostSoundRef.current) {
      lostSoundRef.current.pause();
      lostSoundRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!canvasRef.current.contains(e.target)) {
        stopGame();
      }
    };

  document.addEventListener('click', handleClickOutside);

  return () => {
    document.removeEventListener('click', handleClickOutside);
  };

  }, []);

  useEffect(() => {
    if (!gameRunning) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 400;

    const drawInitial = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(90, 94, 107, 0.84)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = '48px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText(`${countdown}`, canvas.width / 2, canvas.height / 2);
    };

    if (countdown > 0) {
      drawInitial();
    }
  }, [countdown]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
      } else {
        setGameStarted(true);
      }
  }, [countdown]);

  useEffect(() => {
    if (gameStarted && gameRunning) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      const ballImage = new Image();
      ballImage.src = '../static/balle.png';

      const randomDirection = () => {
        const speed = 2;
      return {
        dx: Math.random() > 0.5 ? speed : -speed,
        dy: (Math.random() - 0.5) * 4
      };
  };

  const randomRotation = () => {
    return (Math.random() - 0.5) * 0.1;
  };

  let ball = { x: 300, y: 200, radius: 12, angle: 0, ...randomDirection() };
  let paddle1 = { x: 585, y: 150, width: 6, height: 84 };
  let paddle2 = { x: 10, y: 150, width: 6, height: 84 };
  let keys = {};

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(90, 94, 107, 0.84)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.fillRect(paddle1.x, paddle1.y, paddle1.width, paddle1.height);
    ctx.fillRect(paddle2.x, paddle2.y, paddle2.width, paddle2.height);

    if (ballImage.complete) {
      ctx.save();
      ctx.translate(ball.x, ball.y);
      ctx.rotate(ball.angle);
      ctx.drawImage(
        ballImage,
        -ball.radius,
        -ball.radius,
        ball.radius * 2,
        ball.radius * 2
      );
      ctx.restore();
    }
  };

  const update = () => {
    ball.x += ball.dx;
    ball.y += ball.dy;

    ball.angle += 0.05 * Math.sign(ball.dy);

    if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
      ball.dy *= -1;
    }

    if (
      ball.x - ball.radius < paddle2.x + paddle2.width &&
      ball.y > paddle2.y &&
      ball.y < paddle2.y + paddle2.height
    ) {
      ball.dx *= -1;
      ball.dx *= 1.05;
      ball.dy *= 1.05;
    }

    if (
      ball.x + ball.radius > paddle1.x &&
      ball.y > paddle1.y &&
      ball.y < paddle1.y + paddle1.height
    ) {
      ball.dx *= -1;
      ball.dx *= 1.05;
      ball.dy *= 1.05;
    }

    if (ball.x + ball.radius < 0) {
      playLostSound();
      setPlayerScore(prevScore => prevScore + 1);
      resetBall();
    } else if (ball.x - ball.radius > canvas.width) {
      playLostSound();
      setAiScore(prevScore => prevScore + 1);
      resetBall();
    }

    if (keys['ArrowUp'] && paddle1.y > 0) {
      paddle1.y -= 5;
    }
    if (keys['ArrowDown'] && paddle1.y < canvas.height - paddle1.height) {
      paddle1.y += 5;
    }

    const targetY = ball.y - paddle2.height / 2;
    const speed = 4;

    if (paddle2.y < targetY) {
      paddle2.y += speed;
    } else if (paddle2.y > targetY) {
      paddle2.y -= speed;
    }

    paddle2.y = Math.max(0, Math.min(paddle2.y, canvas.height - paddle2.height));
  };

  const resetBall = () => {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    const newDirection = randomDirection();
    ball.dx = newDirection.dx;
    ball.dy = newDirection.dy;
    ball.angle = randomRotation();
  };

  const playLostSound = () => {
    if (lostSoundRef.current) {
      lostSoundRef.current.currentTime = 0;
      lostSoundRef.current.play();
    }
  };

  const gameLoop = () => {
    draw();
    update();
    animationFrameIdRef.current = requestAnimationFrame(gameLoop);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
    }
    keys[e.key] = true;
  };

  const handleKeyUp = (e) => {
    keys[e.key] = false;
  };

  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
  gameLoop();

  return () => {
    cancelAnimationFrame(animationFrameIdRef.current);
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
    if (lostSoundRef.current) {
      lostSoundRef.current.pause();
      lostSoundRef.current.currentTime = 0;
    }
  };
  }
  }, [gameStarted, gameRunning]);

  return (

    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '3vh', backgroundColor: 'transparent' }}>
        <span style={{ position: 'absolute' }}> Ordi : {aiScore} &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; Joueur : {playerScore} </span>
        {gameVisible && ( <canvas ref={canvasRef} style={{ borderRadius: '22px', backgroundColor: 'rgba(90, 94, 107, 0.84)', marginTop: '688px', boxShadow: 'white 0 0 62px' }} /> )}
      </div>
    </div>

  )
}
export default Pong