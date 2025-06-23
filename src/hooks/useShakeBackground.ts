import { useEffect, useRef, useState } from 'react';

const phoneBackgrounds = [
  '/background_phone_2.jpg',
  '/background_phone_1.jpg',
  '/background_phone_3.jpg',
  '/background_phone_4.jpg',
  '/background_phone_5.jpg',
];

// Simple shake detection config
const SHAKE_THRESHOLD = 15; // Adjust for sensitivity
const SHAKE_TIMEOUT = 1000; // ms

export function useShakeBackground() {
  const [bgIndex, setBgIndex] = useState(0);
  const lastShake = useRef(Date.now());
  const lastAccel = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    function handleMotion(event: DeviceMotionEvent) {
      if (!event.accelerationIncludingGravity) return;
      // Ensure x, y, z are always numbers
      const x = event.accelerationIncludingGravity.x ?? 0;
      const y = event.accelerationIncludingGravity.y ?? 0;
      const z = event.accelerationIncludingGravity.z ?? 0;
      const deltaX = Math.abs(x - lastAccel.current.x);
      const deltaY = Math.abs(y - lastAccel.current.y);
      const deltaZ = Math.abs(z - lastAccel.current.z);
      lastAccel.current = { x, y, z };
      const now = Date.now();
      if (
        (deltaX > SHAKE_THRESHOLD || deltaY > SHAKE_THRESHOLD || deltaZ > SHAKE_THRESHOLD) &&
        now - lastShake.current > SHAKE_TIMEOUT
      ) {
        setBgIndex((prev) => (prev + 1) % phoneBackgrounds.length);
        lastShake.current = now;
      }
    }
    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, []);

  // Preload images on mount
  useEffect(() => {
    phoneBackgrounds.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, []);

  return phoneBackgrounds[bgIndex];
} 