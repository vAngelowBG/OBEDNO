import React from 'react';
import { Utensils } from 'lucide-react';

interface LogoProps {
  className?: string;
}

export function Logo({ className = "h-6 w-6" }: LogoProps) {
  return (
    <div className={`${className} bg-red-600 rounded-lg flex items-center justify-center`}>
      <Utensils className="text-white" size={16} />
    </div>
  );
}