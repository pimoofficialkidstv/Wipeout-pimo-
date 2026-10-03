import React from 'react';

interface MiketsIconProps {
  className?: string;
  size?: number;
}

const MiketsIcon: React.FC<MiketsIconProps> = ({ className = "w-5 h-5", size }) => {
  return (
    <svg 
      viewBox="0 0 100 50" 
      className={`${className} inline-block align-middle`} 
      style={size ? { width: size, height: size } : {}}
      fill="currentColor"
    >
      {/* Ticket shape */}
      <rect 
        x="5" y="5" width="90" height="40" rx="5" ry="5"
        className="text-yellow-400"
      />
      {/* Ticket holes */}
      <circle cx="15" cy="25" r="5" fill="black" />
      <circle cx="85" cy="25" r="5" fill="black" />
    </svg>
  );
};

export default MiketsIcon;
