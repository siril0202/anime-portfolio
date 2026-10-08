import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const App = () => {
  const canvasRef = useRef(null);
  const cursorRef = useRef(null);
  const auraRef = useRef(null);

  // Constants
  const TOTAL_FRAMES = 64;
  const LERP_FACTOR = 0.08; // Decreased for smoother head tracking
  const DEADZONE_FACTOR = 0.12;

  // State for images
  const [images, setImages] = useState([]);
  const [centerImage, setCenterImage] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // Animation Refs
  const targetAngleRef = useRef(0);
  const currentAngleRef = useRef(0);
  const isCenterRef = useRef(true);
  const frameIndexRef = useRef(24);

  // Mouse Tracking Refs for smooth cursor
  const mouse = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const cursor = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const aura = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const isTouchRef = useRef(false);

  useEffect(() => {
    // Preload images
    const loadImages = async () => {
      const imgPromises = [];
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        const img = new Image();
        img.src = `/frames/${i}.webp`;
        imgPromises.push(new Promise((resolve) => {
          img.onload = () => resolve(img);
        }));
      }

      const cImg = new Image();
      cImg.src = `/frames/center.webp`;
      const centerPromise = new Promise((resolve) => {
        cImg.onload = () => resolve(cImg);
      });

      const loadedImgs = await Promise.all(imgPromises);
      const loadedCenter = await centerPromise;

      setImages(loadedImgs);
      setCenterImage(loadedCenter);
      setLoaded(true);
    };

    loadImages();
  }, []);

  useEffect(() => {
    if (!loaded || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const lerpAngle = (start, end, factor) => {
      let diff = end - start;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      return start + diff * factor;
    };

    const lerp = (start, end, factor) => start + (end - start) * factor;

    const render = () => {
      // 1. Smooth cursor logic
      if (!isTouchRef.current) {
        cursor.current.x = lerp(cursor.current.x, mouse.current.x, 0.4);
        cursor.current.y = lerp(cursor.current.y, mouse.current.y, 0.4);
        aura.current.x = lerp(aura.current.x, mouse.current.x, 0.15);
        aura.current.y = lerp(aura.current.y, mouse.current.y, 0.15);

        if (cursorRef.current) {
          cursorRef.current.style.transform = `translate(${cursor.current.x}px, ${cursor.current.y}px)`;
        }
        if (auraRef.current) {
          auraRef.current.style.transform = `translate(${aura.current.x}px, ${aura.current.y}px)`;
        }
      }

      // 2. Character tracking logic
      ctx.fillStyle = '#af1112';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (isCenterRef.current) {
        drawCover(ctx, centerImage, canvas.width, canvas.height);
      } else {
        currentAngleRef.current = lerpAngle(currentAngleRef.current, targetAngleRef.current, LERP_FACTOR);

        let frameFloat = 24 + (currentAngleRef.current * 32 / Math.PI);
        let frameIndex = Math.round(frameFloat);

        frameIndex = ((frameIndex % TOTAL_FRAMES) + TOTAL_FRAMES) % TOTAL_FRAMES;
        frameIndexRef.current = frameIndex;

        drawCover(ctx, images[frameIndex], canvas.width, canvas.height);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [loaded, images, centerImage]);

  const drawCover = (ctx, img, canvasWidth, canvasHeight) => {
    if (!img) return;

    const imgRatio = img.width / img.height;
    const canvasRatio = canvasWidth / canvasHeight;
    let drawWidth, drawHeight, offsetX, offsetY;

    if (canvasRatio > imgRatio) {
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imgRatio;
      offsetX = 0;
      offsetY = (canvasHeight - drawHeight) / 2;
    } else {
      drawWidth = canvasHeight * imgRatio;
      drawHeight = canvasHeight;
      offsetX = (canvasWidth - drawWidth) / 2;
      offsetY = 0;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  };

  useEffect(() => {
    const handleTouch = () => { isTouchRef.current = true; };
    window.addEventListener('touchstart', handleTouch, { once: true });

    const handleMouseMove = (e) => {
      if (isTouchRef.current) return;

      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;

      const faceX = window.innerWidth / 2;
      const faceY = window.innerHeight * 0.45;
      const dx = e.clientX - faceX;
      const dy = e.clientY - faceY;

      const dist = Math.hypot(dx, dy);
      const deadzone = Math.min(window.innerWidth, window.innerHeight) * DEADZONE_FACTOR;

      if (dist < deadzone) {
        isCenterRef.current = true;
      } else {
        isCenterRef.current = false;
        targetAngleRef.current = Math.atan2(dy, dx);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleHoverStart = () => {
    if (auraRef.current) auraRef.current.classList.add('cursor-hover');
  };
  const handleHoverEnd = () => {
    if (auraRef.current) auraRef.current.classList.remove('cursor-hover');
  };

  return (
    <div className="app-container">
      <canvas
        ref={canvasRef}
        className="character-canvas"
      />

      <div
        ref={cursorRef}
        className="custom-cursor"
      />
      <div
        ref={auraRef}
        className="cursor-aura"
      />

      <div className="ui-overlay">

        <header className="header">
          <nav
            className="nav-pill"
            onMouseEnter={handleHoverStart}
            onMouseLeave={handleHoverEnd}
          >
            <a href="#work" className="nav-item">WORK</a>
            <a href="#about" className="nav-item">ABOUT</a>
            <a href="#contact" className="nav-item">CONTACT</a>
          </nav>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="hero-content"
        >
          <p className="intro-small">Hi, I'm</p>
          <h1 className="name-title">
            Santhana Siril
          </h1>
          <p className="intro-desc">
            Full Stack Developer crafting modern, scalable and interactive web experiences with clean code, thoughtful design and powerful technology.
          </p>

          <div className="button-group">
            <button
              className="btn btn-primary"
              onMouseEnter={handleHoverStart}
              onMouseLeave={handleHoverEnd}
            >
              Resume
              <ArrowRight size={18} />
            </button>
            <button
              className="btn btn-secondary"
              onMouseEnter={handleHoverStart}
              onMouseLeave={handleHoverEnd}
            >
              Let's Talk
            </button>
          </div>
        </motion.div>
      </div>

      {!loaded && (
        <div className="loader-overlay">
          <div className="loader-text">
            LOADING EXPERIENCE...
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
