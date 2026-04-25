/**
 * EricaCircle — CP-6
 *
 * Reusable animated waveform circle for Erica AI.
 * Extracted from PreScreen.tsx so it can be used across pages.
 */

import React from 'react'

interface EricaCircleProps {
  isActive?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function EricaCircle({ isActive = false, size = 'lg' }: EricaCircleProps) {
  const outerSize  = size === 'sm' ? 'w-16 h-16' : size === 'md' ? 'w-24 h-24' : 'w-32 h-32'
  const midSize    = size === 'sm' ? 'w-12 h-12' : size === 'md' ? 'w-18 h-18' : 'w-24 h-24'
  const innerSize  = size === 'sm' ? 'w-8 h-8'   : size === 'md' ? 'w-12 h-12' : 'w-16 h-16'
  const barWidth   = size === 'sm' ? 'w-[3px]'   : size === 'md' ? 'w-[4px]'   : 'w-[5px]'

  const barConfigs = [
    { keyframe: 'ec-bar-1', delay: '0s',    minH: 5,  maxH: 22 },
    { keyframe: 'ec-bar-2', delay: '0.1s',  minH: 8,  maxH: 28 },
    { keyframe: 'ec-bar-3', delay: '0.05s', minH: 6,  maxH: 32 },
    { keyframe: 'ec-bar-4', delay: '0.15s', minH: 8,  maxH: 24 },
    { keyframe: 'ec-bar-5', delay: '0.08s', minH: 5,  maxH: 18 },
  ]

  const barStyle = (cfg: typeof barConfigs[0], index: number): React.CSSProperties =>
    isActive
      ? {
          animationName:           cfg.keyframe,
          animationDuration:       ['0.8s', '0.6s', '0.7s', '0.9s', '0.75s'][index],
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
          animationDelay:          cfg.delay,
          height:                  `${cfg.minH}px`,
        }
      : { height: `${cfg.minH}px` }

  return (
    <>
      <style>{`
        @keyframes ec-bar-1 { 0%,100% { height: 5px; }  50% { height: 22px; } }
        @keyframes ec-bar-2 { 0%,100% { height: 8px; }  50% { height: 28px; } }
        @keyframes ec-bar-3 { 0%,100% { height: 6px; }  50% { height: 32px; } }
        @keyframes ec-bar-4 { 0%,100% { height: 8px; }  50% { height: 24px; } }
        @keyframes ec-bar-5 { 0%,100% { height: 5px; }  50% { height: 18px; } }
      `}</style>
      <div className={`relative flex items-center justify-center ${outerSize}`}>
        {/* Outer ring */}
        <div className={`absolute inset-0 rounded-full border-4 animate-pulse transition-all duration-700 ${
          isActive
            ? 'bg-[#FD802E]/30 border-[#FD802E]/70 shadow-[0_0_32px_rgba(253,128,46,0.45)]'
            : 'bg-[#FD802E]/15 border-[#FD802E]/30'
        }`} />
        {/* Middle ring */}
        <div className={`absolute ${midSize} rounded-full border-2 transition-all duration-700 ${
          isActive
            ? 'bg-[#FD802E]/40 border-[#FD802E]/80'
            : 'bg-[#FD802E]/20 border-[#FD802E]/50'
        }`} />
        {/* Inner circle with waveform bars */}
        <div className={`relative ${innerSize} rounded-full flex items-center justify-center transition-all duration-700 ${
          isActive ? 'bg-[#02182B]' : 'bg-[#02182B]'
        }`}>
          <div className="flex items-center gap-[3px]">
            {barConfigs.map((cfg, i) => (
              <div
                key={i}
                className={`${barWidth} rounded-full bg-[#FD802E] transition-all`}
                style={barStyle(cfg, i)}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
