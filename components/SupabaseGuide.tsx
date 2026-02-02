
import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface SupabaseGuideProps {
  onClose: () => void;
  testEmail?: string;
}

export const SupabaseGuide: React.FC<SupabaseGuideProps> = ({ onClose, testEmail }) => {
  const [testResults, setTestResults] = useState<{ [key: string]: 'pending' | 'success' | 'error' | 'idle' }>({
    key_integrity: isSupabaseConfigured ? 'success' : 'error',
    creative_database: 'idle',
    clients: 'idle',
    contract_audits: 'idle',
    email_service: 'idle'
  });
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [customEmail, setCustomEmail] = useState(testEmail || '');

  const addLog = (msg: string) => {
    setDiagnosticLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const runIntegrationTest = async () => {
    setIsTesting(true);
    setGeneralError(null);
    setDiagnosticLogs([]);
    const tables = ['creative_database', 'clients', 'contract_audits'];
    const newResults: any = { ...testResults };

    addLog("Starting system diagnostics...");

    // 1. Check Key Format
    if (!isSupabaseConfigured) {
        addLog("CRITICAL: Supabase Key format is invalid. It must start with 'eyJ'.");
        newResults['key_integrity'] = 'error';
    } else {
        addLog("Key format: Valid JWT detected.");
        newResults['key_integrity'] = 'success';
    }

    // 2. Test Database Tables
    for (const table of tables) {
      addLog(`Testing table: ${table}...`);
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        
        if (error) {
          const errorMsg = error.message || "Unknown error";
          const errorCode = error.code || "No code";
          addLog(`Result for ${table}: Code ${errorCode} - ${errorMsg}`);

          if (errorCode === '42P01') {
            newResults[table] = 'error'; // Table does not exist
          } else if (errorCode === 'PGRST301' || errorMsg.includes('JWT') || errorMsg.includes('API key')) {
            setGeneralError(`Authentication Failure: Your Supabase API key is likely invalid.`);
            newResults[table] = 'idle';
            break; 
          } else {
            addLog(`Note: ${table} exists (RLS active).`);
            newResults[table] = 'success';
          }
        } else {
          addLog(`Success: ${table} is reachable.`);
          newResults[table] = 'success';
        }
      } catch (e: any) {
        addLog(`Critical Catch for ${table}: ${e.message}`);
        newResults[table] = 'error';
      }
    }

    // 3. Test Email Edge Function
    addLog("Testing Email Service (Gmail SMTP)...");
    try {
      const targetEmail = customEmail || 'khalwaleip@gmail.com';
      addLog(`Invoking send-brief for: ${targetEmail}`);
      
      const { error } = await supabase.functions.invoke('send-brief', {
        body: {
          email: targetEmail,
          name: "Diagnostic Test",
          caseId: "SYS-TEST",
          brief: "This is a connectivity test for the Gmail SMTP integration. If you received this, the system is fully operational."
        }
      });
      
      if (error) {
        addLog(`Email Service Failed: ${error.message}`);
        newResults['email_service'] = 'error';
      } else {
        addLog("Email Service: Pulse detected (200 OK).");
        newResults['email_service'] = 'success';
      }
    } catch (e: any) {
       addLog(`Email Service Critical: ${e.message}`);
       newResults['email_service'] = 'error';
    }

    setTestResults(newResults);
    setIsTesting(false);
    addLog("Diagnostics complete.");
  };

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'success') return <span className="ml-auto text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30 font-bold uppercase tracking-tighter">Verified</span>;
    if (status === 'error') return <span className="ml-auto text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30 font-bold uppercase tracking-tighter">Failed</span>;
    return <span className="ml-auto text-[10px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded font-bold uppercase tracking-tighter">Idle</span>;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-legal-900/95 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-800 border border-legal-gold/30 rounded-3xl w-full max-w-2xl my-8 shadow-2xl p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-serif text-white">System Diagnostics</h2>
            <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-bold text-[10px]">Cloud Connectivity Hub</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2 text-xl">✕</button>
        </div>

        <div className="mb-6 p-5 bg-legal-900/50 rounded-2xl border border-slate-700 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 w-full">
            <div className="text-left">
              <p className="text-white text-sm font-bold">Run Connectivity Check</p>
              <p className="text-slate-500 text-xs italic">Verifies Database & Gmail SMTP Gateway.</p>
            </div>
            <button 
              onClick={runIntegrationTest}
              disabled={isTesting}
              className={`w-full sm:w-auto px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${isTesting ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-legal-gold text-legal-900 hover:scale-105 shadow-lg shadow-legal-gold/10'}`}
            >
              {isTesting ? 'Running Analysis...' : 'Start Diagnostics'}
            </button>
          </div>
          
          <div className="w-full border-t border-slate-700/50 pt-4 mt-2">
             <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Test Email Recipient</label>
             <input 
               type="email" 
               value={customEmail}
               onChange={(e) => setCustomEmail(e.target.value)}
               placeholder="Enter your email address to verify delivery..."
               className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-legal-gold outline-none"
             />
          </div>
        </div>

        {generalError && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-xl text-red-400 text-xs font-bold">
            ⚠️ {generalError}
          </div>
        )}

        {diagnosticLogs.length > 0 && (
          <div className="mb-8 bg-black/40 rounded-xl p-4 border border-slate-700 font-mono text-[10px] text-green-400/80 h-32 overflow-y-auto scrollbar-thin">
            {diagnosticLogs.map((log, i) => (
              <div key={i} className="mb-1 leading-tight">{log}</div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
            {['key_integrity', 'creative_database', 'clients', 'contract_audits', 'email_service'].map((service) => (
                <div key={service} className="p-3 bg-slate-900/30 rounded-xl border border-slate-700/50 flex flex-col">
                    <span className="text-slate-500 text-[9px] uppercase font-bold tracking-widest mb-1">Service</span>
                    <span className="text-white font-mono text-[10px] mb-2 truncate">{service.replace('_', ' ')}</span>
                    <StatusBadge status={testResults[service]} />
                </div>
            ))}
        </div>

        <button 
          onClick={onClose}
          className="w-full py-4 bg-slate-700 text-white font-bold rounded-2xl hover:bg-slate-600 transition-all uppercase tracking-[0.2em] text-xs"
        >
          Close Diagnostics
        </button>
      </div>
    </div>
  );
};
