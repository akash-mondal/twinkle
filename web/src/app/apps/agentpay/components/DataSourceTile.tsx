'use client';

import { motion } from 'framer-motion';
import type { DataSource } from '../data/sources';

interface DataSourceTileProps {
  source: DataSource;
  isActive?: boolean;
  isPending?: boolean;
  className?: string;
}

export function DataSourceTile({
  source,
  isActive = false,
  isPending = false,
  className = '',
}: DataSourceTileProps) {
  const Icon = source.icon;

  return (
    <motion.div
      data-source-id={source.id}
      className={`relative rounded-xl border bg-[var(--agent-surface)] overflow-hidden ${className}`}
      style={{
        borderColor: isActive || isPending ? source.color : 'var(--agent-border)',
      }}
      animate={{
        boxShadow: isActive
          ? `0 0 30px ${source.color}50, 0 0 60px ${source.color}25`
          : isPending
          ? `0 0 15px ${source.color}30`
          : 'none',
        borderColor: isActive || isPending ? source.color : 'var(--agent-border)',
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Glow overlay when active */}
      {isActive && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            background: `radial-gradient(circle at center, ${source.color}20 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Content */}
      <div className="relative p-4">
        {/* Header with icon and name */}
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${source.color}20` }}
          >
            <Icon className="w-5 h-5" style={{ color: source.color }} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[var(--agent-text)]">
              {source.name}
            </h3>
            <p className="text-xs text-[var(--agent-muted)]">{source.description}</p>
          </div>
        </div>

        {/* API badge */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--agent-border)]">
          <span className="text-[11px] px-2 py-1 rounded-md bg-[var(--agent-surface-light)] text-[var(--agent-muted)]">
            {source.api}
          </span>
          <span className="text-[11px] text-[var(--agent-accent)]">0.1 MNEE</span>
        </div>

        {/* Active indicator pulse */}
        {isActive && (
          <motion.div
            className="absolute top-3 right-3 w-3 h-3 rounded-full"
            style={{ backgroundColor: source.color }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [1, 0.6, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Pending indicator */}
        {isPending && !isActive && (
          <div
            className="absolute top-3 right-3 w-3 h-3 rounded-full animate-pulse"
            style={{ backgroundColor: source.color, opacity: 0.6 }}
          />
        )}
      </div>
    </motion.div>
  );
}
