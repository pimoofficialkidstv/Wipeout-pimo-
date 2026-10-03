import React from 'react';
import { motion } from 'motion/react';

export interface PimoStudiosLogoProps {
  className?: string;
  size?: number;
  width?: number | string;
  height?: number | string;
  variant?: 'card' | 'transparent' | 'banner' | 'icon';
  animated?: boolean;
}

/**
 * Official Pimo Studios Brand Logo
 * Features the signature chunky red block "PIMO" letters with the apple stem/leaf on the 'P',
 * deep crimson backdrop, and bold black "Studios" subtitle.
 */
export const PimoStudiosLogo: React.FC<PimoStudiosLogoProps> = ({
  className = '',
  size,
  width,
  height,
  variant = 'card',
  animated = true,
}) => {
  const isCard = variant === 'card' || variant === 'banner';
  const isIcon = variant === 'icon';

  const defaultWidth = isIcon ? (size || 48) : (width || (size ? size * 1.8 : 280));
  const defaultHeight = isIcon ? (size || 48) : (height || (size ? size * 0.9 : 140));

  return (
    <motion.div
      initial={animated ? { scale: 0.96, opacity: 0 } : false}
      animate={animated ? { scale: 1, opacity: 1 } : false}
      whileHover={animated ? { scale: 1.02 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
      className={`inline-flex items-center justify-center select-none relative ${
        isCard
          ? 'bg-[#8B0000] rounded-2xl shadow-xl border border-red-950/40 p-2 sm:p-3 overflow-hidden'
          : ''
      } ${className}`}
      style={{
        width: defaultWidth,
        height: defaultHeight,
        aspectRatio: isIcon ? '1 / 1' : '2 / 1',
      }}
    >
      {/* Background radial glow on card mode */}
      {isCard && (
        <div className="absolute inset-0 bg-radial from-red-600/20 via-transparent to-black/30 pointer-events-none" />
      )}

      <svg
        viewBox={isIcon ? "60 10 220 280" : "0 0 1000 500"}
        className="w-full h-full relative z-10 drop-shadow-md"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="pimo-3d-shadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="3" dy="6" stdDeviation="4" floodColor="#400000" floodOpacity="0.7" />
          </filter>
        </defs>

        <g filter="url(#pimo-3d-shadow)">
          {/* === LETTER P with Apple Leaf & Stem === */}
          <g id="letter-p">
            {/* Brown Apple Stem */}
            <path
              d="M 188,32 C 185,16 195,5 212,1 C 208,18 199,28 193,38 Z"
              fill="#8B4513"
              stroke="#5C2E0B"
              strokeWidth="2.5"
            />
            {/* Bright Green Apple Leaf */}
            <path
              d="M 184,36 C 168,26 162,10 174,0 C 188,10 190,24 184,36 Z"
              fill="#22C55E"
              stroke="#15803D"
              strokeWidth="2.5"
            />
            {/* Main P body */}
            <path
              d="M 95,65 L 225,42 C 258,40 292,68 288,122 C 282,170 248,196 195,198 L 158,200 L 150,305 L 92,300 Z"
              fill="#FF0505"
              stroke="#D60000"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            {/* Inner P cut-out hole */}
            <polygon
              points="155,98 210,88 222,142 155,152"
              fill={isCard ? '#8B0000' : '#111214'}
              stroke="#550000"
              strokeWidth="2"
            />
          </g>

          {!isIcon && (
            <>
              {/* === LETTER I === */}
              <g id="letter-i">
                <path
                  d="M 305,58 L 435,52 L 430,110 L 398,112 L 398,245 L 430,248 L 425,305 L 298,310 L 302,250 L 335,248 L 335,112 L 305,110 Z"
                  fill="#FF0505"
                  stroke="#D60000"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
              </g>

              {/* === LETTER M === */}
              <g id="letter-m">
                <path
                  d="M 458,52 L 522,50 L 585,190 L 648,48 L 712,50 L 690,308 L 628,308 L 640,150 L 585,268 L 532,268 L 490,150 L 490,308 L 438,308 Z"
                  fill="#FF0505"
                  stroke="#D60000"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
              </g>

              {/* === LETTER O (Chunky Octagon) === */}
              <g id="letter-o">
                {/* Outer Octagon */}
                <polygon
                  points="760,50 875,50 928,108 928,252 875,310 760,310 708,252 708,108"
                  fill="#FF0505"
                  stroke="#D60000"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
                {/* Inner Octagonal Hole */}
                <polygon
                  points="782,108 852,108 880,140 880,222 852,254 782,254 755,222 755,140"
                  fill={isCard ? '#8B0000' : '#111214'}
                  stroke="#550000"
                  strokeWidth="2"
                />
              </g>
            </>
          )}
        </g>

        {/* === "Studios" SUBTITLE TEXT === */}
        {!isIcon && (
          <text
            x="500"
            y="450"
            textAnchor="middle"
            fill="#000000"
            fontFamily="'Fredoka', 'Montserrat', 'Inter', system-ui, sans-serif"
            fontSize="145"
            fontWeight="900"
            letterSpacing="-1px"
            className="select-none"
          >
            Studios
          </text>
        )}
      </svg>
    </motion.div>
  );
};

export default PimoStudiosLogo;
