"use client";

import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  pulse: number;
}

const NODE_COLORS = ["#1d9e75", "#378add", "#8aa3bc", "#1d9e75", "#378add"];
const MAX_DIST = 90;

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    function resize() {
      if (!canvas) return;
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    resize();
    window.addEventListener("resize", resize);

    const W = () => canvas?.width  ?? 0;
    const H = () => canvas?.height ?? 0;

    // Initialise nodes using the spec from the brief
    const nodes: Node[] = Array.from({ length: 48 }, () => ({
      x:     Math.random() * W(),
      y:     Math.random() * H(),
      vx:    (Math.random() - 0.5) * 0.4,
      vy:    (Math.random() - 0.5) * 0.4,
      r:     Math.random() * 2 + 1,
      pulse: Math.random() * Math.PI * 2,
    }));

    function draw() {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, W(), H());

      // Update positions — bounce off walls
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += 0.015;
        if (n.x < 0 || n.x > W()) n.vx *= -1;
        if (n.y < 0 || n.y > H()) n.vy *= -1;
      }

      // Draw connecting lines
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < MAX_DIST) {
            // Opacity fades with distance — 0 at MAX_DIST, ~0.4 at 0
            const alpha = (1 - dist / MAX_DIST) * 0.4;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(29,158,117,${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Draw pulsing node circles
      nodes.forEach((n, i) => {
        const color = NODE_COLORS[i % NODE_COLORS.length];
        const pulseFactor = 1 + Math.sin(n.pulse) * 0.3;

        // Outer glow
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * pulseFactor * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = color + "22"; // 13% opacity
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * pulseFactor, 0, Math.PI * 2);
        ctx.fillStyle = color + "cc"; // 80% opacity
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    />
  );
}
