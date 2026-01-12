'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DataSource } from '../data/sources';

interface ConnectionLayerProps {
  chatRef: React.RefObject<HTMLElement | null>;
  activeSourceId: string | null;
  sources: DataSource[];
  containerRef: React.RefObject<HTMLElement | null>;
}

interface Point {
  x: number;
  y: number;
}

export function ConnectionLayer({
  chatRef,
  activeSourceId,
  sources,
  containerRef,
}: ConnectionLayerProps) {
  const [path, setPath] = useState<string>('');
  const [sourceColor, setSourceColor] = useState<string>('#10B981');
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!activeSourceId || !chatRef.current || !containerRef.current) {
      setPath('');
      return;
    }

    const source = sources.find((s) => s.id === activeSourceId);
    if (!source) {
      setPath('');
      return;
    }

    setSourceColor(source.color);

    // Find the tile element
    const tileEl = containerRef.current.querySelector(
      `[data-source-id="${activeSourceId}"]`
    ) as HTMLElement | null;

    if (!tileEl) {
      setPath('');
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const chatRect = chatRef.current.getBoundingClientRect();
    const tileRect = tileEl.getBoundingClientRect();

    // Calculate positions relative to container
    const chatCenter: Point = {
      x: chatRect.left + chatRect.width / 2 - containerRect.left,
      y: chatRect.top + chatRect.height / 2 - containerRect.top,
    };

    const tileCenter: Point = {
      x: tileRect.left + tileRect.width / 2 - containerRect.left,
      y: tileRect.top + tileRect.height / 2 - containerRect.top,
    };

    // Create curved bezier path
    const midX = (chatCenter.x + tileCenter.x) / 2;
    const midY = (chatCenter.y + tileCenter.y) / 2;

    // Control points for smooth curve
    const ctrl1: Point = {
      x: chatCenter.x,
      y: midY,
    };
    const ctrl2: Point = {
      x: tileCenter.x,
      y: midY,
    };

    const pathString = `M ${chatCenter.x} ${chatCenter.y} C ${ctrl1.x} ${ctrl1.y}, ${ctrl2.x} ${ctrl2.y}, ${tileCenter.x} ${tileCenter.y}`;
    setPath(pathString);
  }, [activeSourceId, chatRef, containerRef, sources]);

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Glow filter */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Gradient for the line */}
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={sourceColor} stopOpacity="0.3" />
          <stop offset="50%" stopColor={sourceColor} stopOpacity="1" />
          <stop offset="100%" stopColor={sourceColor} stopOpacity="0.3" />
        </linearGradient>
      </defs>

      <AnimatePresence>
        {path && (
          <>
            {/* Background glow path */}
            <motion.path
              key="glow-path"
              d={path}
              fill="none"
              stroke={sourceColor}
              strokeWidth="4"
              filter="url(#glow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.5 }}
              exit={{ pathLength: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />

            {/* Main animated path */}
            <motion.path
              key="main-path"
              d={path}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              exit={{ pathLength: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />

            {/* Animated dot traveling along path */}
            <motion.circle
              key="dot"
              r="4"
              fill={sourceColor}
              filter="url(#glow)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <animateMotion dur="2s" repeatCount="indefinite" path={path} />
            </motion.circle>
          </>
        )}
      </AnimatePresence>
    </svg>
  );
}
