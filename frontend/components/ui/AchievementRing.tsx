import React from 'react';

interface AchievementRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  color?: string;
  trackColor?: string;
}

export default function AchievementRing({
  percentage,
  size = 140,
  strokeWidth = 12,
  label = 'Achieved',
  sublabel,
  color = '#7C3AED',
  trackColor = '#EDE9FE',
}: AchievementRingProps) {
  const clamped = Math.max(0, Math.min(percentage, 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
        <span className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
          {percentage}%
        </span>
        {label && (
          <span className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
            {label}
          </span>
        )}
        {sublabel && (
          <span className="text-[10px] text-slate-400 mt-0.5 max-w-[90px] truncate">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
