import React from 'react';

export const Spinner: React.FC<{ message?: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center p-8 space-y-4">
    <div className="relative w-16 h-16">
      <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-700 rounded-full"></div>
      <div className="absolute top-0 left-0 w-full h-full border-4 border-t-legal-gold border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
    </div>
    {message && (
      <p className="text-legal-gold font-serif text-lg animate-pulse text-center">
        {message}
      </p>
    )}
  </div>
);