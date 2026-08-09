import React from 'react';
import logoImg from './cms logo.jpeg';

export default function Logo({ className = "w-10 h-10" }) {
  return (
    <img 
      src={logoImg} 
      alt="CMS Lotus Logo" 
      className={`${className} object-contain rounded-lg`} 
    />
  );
}
