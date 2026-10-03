import React from 'react';

interface RobloxStudioIconProps {
  className?: string;
  size?: number;
}

const RobloxStudioIcon: React.FC<RobloxStudioIconProps> = ({ className = "w-4 h-4", size }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={`${className} inline-block align-middle shadow-lg`} 
      style={size ? { width: size, height: size } : {}}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="wipeoutMoroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="50%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.3" />
        </filter>
      </defs>
      {/* Background Rounded Square (App Icon style) */}
      <rect 
        x="5" y="5" 
        width="90" height="90" 
        rx="26" 
        fill="url(#wipeoutMoroGradient)" 
      />
      {/* The Styled White W centered inside */}
      <text 
        x="50" y="54" 
        fill="white" 
        fontSize="54" 
        fontFamily="'Space Grotesk', 'Outfit', 'Inter', 'Fredoka', sans-serif" 
        fontWeight="900" 
        textAnchor="middle" 
        dominantBaseline="central"
        filter="url(#softShadow)"
      >
        W
      </text>
    </svg>
  );
};

export default RobloxStudioIcon;
