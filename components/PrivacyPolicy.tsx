
import React from 'react';

export const PrivacyPolicy: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-legal-900/95 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-3xl my-8 shadow-2xl p-8 sm:p-12 relative">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors text-xl font-bold p-2"
        >
          ✕
        </button>

        <h2 className="text-3xl font-serif text-white mb-2">Data Protection Policy</h2>
        <p className="text-legal-gold text-xs font-bold uppercase tracking-widest mb-8">Khalwale & Co Advocates • IP Division</p>

        <div className="prose prose-invert prose-sm max-w-none text-slate-300 space-y-6 h-[60vh] overflow-y-auto pr-6 scrollbar-thin">
          <p>
            **Effective Date:** {new Date().toLocaleDateString()}<br/>
            **Compliance:** Data Protection Act, 2019 (Kenya) & GDPR (International).
          </p>

          <h3 className="text-white font-bold text-lg">1. Data Collection & Usage</h3>
          <p>
            We collect personal data (Name, Email, WhatsApp) and sensitive documents (Contracts) strictly for the purpose of 
            legal auditing and client communication. Your data is processed via secure encryption protocols using Supabase 
            and Google Cloud infrastructure.
          </p>

          <h3 className="text-white font-bold text-lg">2. AI Processing</h3>
          <p>
            Documents uploaded to the "Khatiebi" system are processed by an LLM (Large Language Model) solely for extraction 
            and risk analysis. Data is not used to train public models.
          </p>

          <h3 className="text-white font-bold text-lg">3. Storage & Retention</h3>
          <p>
            Client records are stored in an encrypted PostgreSQL database. You have the right to request the "Right to Erasure" 
            of your data from our archives at any time by contacting the Data Protection Officer at Khalwale & Co.
          </p>

          <h3 className="text-white font-bold text-lg">4. Third-Party Sharing</h3>
          <p>
            We do not sell your data. We share data only with:
            <ul className="list-disc pl-4 mt-2">
                <li>Payment Processors (Pesapal/Stripe) for consultation fees.</li>
                <li>Transactional Email Providers (Resend) for briefing delivery.</li>
            </ul>
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-700 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-legal-gold text-legal-900 font-bold rounded-xl hover:bg-legal-goldLight transition-all uppercase tracking-widest text-xs"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
