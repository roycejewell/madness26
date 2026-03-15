'use client';

import { useState } from 'react';

/**
 * Avatar image for a draft player. Expects PNG in public folder:
 * /{name in lowercase, no spaces}.png (e.g. chuck.png, brandon.png)
 */
export function playerAvatarSrc(name: string): string {
  return `/${name.toLowerCase().replace(/\s+/g, '')}.png`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
  return name.slice(0, 2).toUpperCase();
}

interface PlayerAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
};

const fallbackTextClasses = {
  sm: 'text-[11px]',
  md: 'text-xs',
  lg: 'text-sm',
};

export default function PlayerAvatar({ name, size = 'md', className = '' }: PlayerAvatarProps) {
  const [failed, setFailed] = useState(false);
  const sizeClass = sizeClasses[size];
  const textClass = fallbackTextClasses[size];
  if (failed) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--surface)] font-bold text-[var(--text-muted)] ${sizeClass} ${textClass} ${className}`}
        role="img"
        aria-label={name}
      >
        {getInitials(name)}
      </span>
    );
  }
  return (
    <span
      className={`inline-block shrink-0 overflow-hidden rounded-full bg-[var(--surface)] ${sizeClass} ${className}`}
      role="img"
      aria-label={name}
    >
      <img
        src={playerAvatarSrc(name)}
        alt=""
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
