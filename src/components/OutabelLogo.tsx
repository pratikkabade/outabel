import React from 'react';

interface OutabelLogoProps {
  className?: string;
}

export const OutabelLogo: React.FC<OutabelLogoProps> = ({
  className = 'w-8 h-8',
}) => {
  return (
    <img
      src="/outabel-logo.png"
      alt="Outabel"
      className={`shrink-0 object-contain select-none ${className}`}
      draggable={false}
    />
  );
};
