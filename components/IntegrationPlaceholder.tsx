import React from 'react';

export const IntegrationPlaceholder: React.FC = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
      <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold text-slate-800">Ready for Your Code</h2>
      
      <div className="max-w-xl bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-left">
        <h3 className="font-semibold text-slate-900 mb-2">How to integrate your existing app:</h3>
        <ol className="list-decimal list-inside space-y-3 text-slate-600 text-sm">
          <li>
            Paste your component files into the <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">components/</code> folder.
          </li>
          <li>
            Import your main component in <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">App.tsx</code>.
          </li>
          <li>
            Replace this <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">IntegrationPlaceholder</code> component with your own component in the render logic.
          </li>
          <li>
            Connect the <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">geminiService.ts</code> to your components to add AI functionality.
          </li>
        </ol>
      </div>

      <p className="text-slate-500 max-w-lg">
        This workbench is configured with React 18, TypeScript, Tailwind CSS, and the latest Google GenAI SDK. It is a stable foundation for your project.
      </p>
    </div>
  );
};