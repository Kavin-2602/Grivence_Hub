import React from 'react';

export default function CMSLotusLogo({ className = "w-10 h-10" }) {
  return (
    <img 
      src="/logo.svg" 
      alt="CMSCE Lotus Logo" 
      className={`${className} object-contain flex-shrink-0`}
    />
  );
}
