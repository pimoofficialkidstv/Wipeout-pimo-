import React from 'react';
import PimoStudiosLogo from './PimoStudiosLogo';

interface MoroStudioLogoProps {
  className?: string;
  size?: number;
}

const MoroStudioLogo: React.FC<MoroStudioLogoProps> = ({ className = "mb-8", size = 160 }) => {
  return (
    <PimoStudiosLogo 
      size={size}
      className={className}
      variant="card"
      animated={true}
    />
  );
};

export default MoroStudioLogo;

