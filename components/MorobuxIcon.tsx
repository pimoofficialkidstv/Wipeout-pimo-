import React from 'react';

interface MorobuxIconProps {
  className?: string;
  size?: number;
}

const MorobuxIcon: React.FC<MorobuxIconProps> = ({ className = "w-5 h-5", size }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={`${className} inline-block align-middle drop-shadow-[0_2px_4px_rgba(234,179,8,0.3)]`} 
      style={size ? { width: size, height: size } : {}}
      fill="currentColor"
    >
      <circle cx="50" cy="50" r="46" fill="#ca8a04" />
      <circle cx="50" cy="50" r="41" fill="#eab308" />
      <circle cx="50" cy="50" r="34" fill="#facc15" stroke="#fef08a" strokeWidth="2.5" />
      {/* Embossed P for PimoBux */}
      <path 
        d="M38 28 L54 28 C63 28 68 33 68 41 C68 49 63 54 54 54 L46 54 L46 72 L38 72 Z M46 35 L46 47 L53 47 C57.5 47 60 45 60 41 C60 37 57.5 35 53 35 Z" 
        fill="#713f12" 
      />
    </svg>
  );
};

export const PimobuxIcon = MorobuxIcon;
export default MorobuxIcon;
