
import React, { useState, useRef, useEffect } from 'react';
import { UserInfo, AppState, ContractFile, CaseFile, QuizCategory, QuizQuestion, MailingListEntry, DBContractAudit } from './types';
import { analyzeContract, generateAttorneyBrief, generateQuizQuestions } from './services/geminiService';
import { LegalDisclaimer } from './components/LegalDisclaimer';
import { Spinner } from './components/Spinner';
import { ChatWidget } from './components/ChatWidget';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { SupabaseGuide } from './components/SupabaseGuide';
import { storageService } from './services/storageService';
import { sendEmailBrief } from './services/emailService';
import { mpesaService } from './services/mpesaService';
import { LEGAL_TEMPLATES } from './contractsData';
import { LegalTemplate } from './types';
import { newsService } from './services/newsService';
// Safe Markdown-ish renderer to replace library if it crashes
const SafeMarkdown = ({ content }: { content: string }) => {
  if (!content) return null;
  return (
    <div className="whitespace-pre-wrap">
      {content.split('\n').map((line, i) => (
        <p key={i} className={line.startsWith('#') ? 'text-xl font-bold text-legal-gold mt-4 mb-2' : 'mb-2'}>
          {line.replace(/^#+\s*/, '')}
        </p>
      ))}
    </div>
  );
};

// --- Icons ---
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-legal-gold mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ScaleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-legal-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
  </svg>
);

const MusicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-legal-gold mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
  </svg>
);

const MixerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-legal-gold mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  </svg>
);

const AcademicCapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-legal-gold mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
  </svg>
);

const StoreIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-legal-gold mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

const ShoppingCartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const NewsTicker = () => {
  const [news, setNews] = useState<any[]>([]);

  useEffect(() => {
    const getNews = async () => {
      const latestNews = await newsService.fetchLatestNews();
      setNews(latestNews);
    };
    getNews();

    // Refresh every 15 minutes
    const interval = setInterval(getNews, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const displayNews = news.length > 0 ? news : [
    { title: "Kenya Copyright Board (KECOBO) updates digital royalty frameworks for 2025.", source: "KECOBO" },
    { title: "KFCB signals revision of licensing for independent Nairobi creators.", source: "KFCB" },
    { title: "Kalasha Awards nominations window closing soon.", source: "Kalasha" }
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-legal-900 border-t border-legal-gold/20 z-40 h-10 flex items-center overflow-hidden">
      <div className="bg-legal-gold text-legal-900 px-4 py-2 font-bold text-xs uppercase tracking-wider z-10 h-full flex items-center shadow-lg whitespace-nowrap">
        <span className="w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse"></span>
        Live Feed
      </div>
      <div className="whitespace-nowrap animate-marquee flex items-center">
        {displayNews.concat(displayNews).map((item, index) => (
          <span key={index} className="text-slate-400 text-xs mx-8 inline-block">
            <span className="text-legal-gold mr-2 font-bold font-mono">[{item.source}]</span>
            {item.title}
          </span>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.LANDING);
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: '', email: '', whatsapp: '' });
  const [mailingEntry, setMailingEntry] = useState<MailingListEntry>({ full_name: '', email: '', niche: '' });
  const [file, setFile] = useState<ContractFile | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [clientComplaints, setClientComplaints] = useState<string>('');
  const [caseFile, setCaseFile] = useState<CaseFile | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [mailingListStatus, setMailingListStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showDbDiagnostics, setShowDbDiagnostics] = useState(false);

  // Secure Archive State
  const [archiveEmail, setArchiveEmail] = useState('');
  const [archiveWhatsapp, setArchiveWhatsapp] = useState('');
  const [pastAudits, setPastAudits] = useState<DBContractAudit[]>([]);
  const [isFetchingArchive, setIsFetchingArchive] = useState(false);
  const [archiveTried, setArchiveTried] = useState(false);

  // Quiz State
  const [quizCategory, setQuizCategory] = useState<QuizCategory>('Music Business');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [failedQuestions, setFailedQuestions] = useState<QuizQuestion[]>([]);

  const [loadingStep, setLoadingStep] = useState<string>('Initializing...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Store & M-Pesa State
  const [purchasingTemplate, setPurchasingTemplate] = useState<LegalTemplate | null>(null);
  const [stkStatus, setStkStatus] = useState<string>('');
  const [isStkActive, setIsStkActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [appState]);

  // Load Calendly Script
  useEffect(() => {
    if (appState === AppState.BOOKING) {
      const script = document.createElement('script');
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.async = true;
      document.body.appendChild(script);
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      }
    }
  }, [appState]);

  // --- Logic Handlers ---

  const handleArchiveLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archiveEmail || !archiveWhatsapp) return;
    setIsFetchingArchive(true);
    setArchiveTried(true);
    const audits = await storageService.fetchAuditsBySecurityPair(archiveEmail, archiveWhatsapp);
    setPastAudits(audits);
    setIsFetchingArchive(false);
  };

  const selectAuditFromArchive = (audit: DBContractAudit) => {
    setAnalysisResult(audit.analysis_summary);
    setFile({ name: audit.contract_name, type: 'Archive Record', base64: '', mimeType: 'text/markdown' });
    setAppState(AppState.RESULTS);
  };

  const handleMailingListSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMailingListStatus('loading');

    try {
      const success = await storageService.persistMailingList(mailingEntry);

      if (success) {
        setMailingListStatus('success');
        setMailingEntry({ full_name: '', email: '', niche: '' });
      } else {
        setMailingListStatus('idle');
        alert("Registration failed. Please try again or contact support.");
      }
    } catch (err) {
      setMailingListStatus('idle');
      alert("Error connecting to database. Please check your internet connection.");
    }

    setTimeout(() => setMailingListStatus('idle'), 5000);
  };

  const handleUserInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInfo.name && userInfo.email && userInfo.whatsapp) {
      if (purchasingTemplate) {
        handleTemplatePurchase(purchasingTemplate);
      } else if (appState === AppState.QUIZ_INTRO) {
        startQuizGeneration();
      } else {
        setAppState(AppState.UPLOAD);
      }
    }
  };

  const startQuizGeneration = async () => {
    setLoadingStep("Khatiebi is preparing your IP mastery challenge...");
    setAppState(AppState.GENERATING_BRIEF);
    try {
      const questions = await generateQuizQuestions(quizCategory);
      setQuizQuestions(questions);
      setCurrentQuestionIndex(0);
      setQuizScore(0);
      setQuizAnswered(false);
      setSelectedOption(null);
      setFailedQuestions([]);
      setAppState(AppState.QUIZ_GAME);
    } catch (e) {
      setErrorMsg("Failed to generate quiz questions.");
      setAppState(AppState.ERROR);
    }
  };

  const handleQuizAnswer = (optionIndex: number) => {
    if (quizAnswered) return;
    setSelectedOption(optionIndex);
    setQuizAnswered(true);

    const currentQuestion = quizQuestions[currentQuestionIndex];
    if (optionIndex === currentQuestion.correctAnswerIndex) {
      setQuizScore(prev => prev + 1);
    } else {
      setFailedQuestions(prev => [...prev, currentQuestion]);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setQuizAnswered(false);
      setSelectedOption(null);
    } else {
      setAppState(AppState.QUIZ_RESULTS);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setFile({
        name: selectedFile.name,
        type: selectedFile.type,
        mimeType: selectedFile.type || 'application/pdf',
        base64: base64String.split(',')[1]
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  const startAnalysis = async () => {
    if (!file) return;
    setAppState(AppState.ANALYZING);
    setLoadingStep("Khatiebi is conducting a deep multi-jurisdictional review...");
    try {
      const result = await analyzeContract(file, userInfo);
      setAnalysisResult(result);
      setAppState(AppState.RESULTS);
    } catch (err) {
      setErrorMsg("Analysis encountered an unexpected obstacle.");
      setAppState(AppState.ERROR);
    }
  };

  const handlePaymentSubmit = async () => {
    setIsProcessingPayment(true);
    setStkStatus("Initiating Secure M-PESA Connection...");
    setIsStkActive(true);

    try {
      const response = await mpesaService.initiateStkPush(userInfo, 5000);
      if (response.success) {
        setStkStatus(response.message);
        // Wait for user to enter PIN (simulated)
        const verified = await mpesaService.verifyPayment(response.checkoutRequestID!);
        if (verified) {
          setIsProcessingPayment(false);
          setIsStkActive(false);
          setAppState(AppState.CONSULT_FORM);
        }
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      setErrorMsg("M-Pesa session timed out or was cancelled.");
      setAppState(AppState.ERROR);
      setIsProcessingPayment(false);
      setIsStkActive(false);
    }
  };

  const handleTemplatePurchase = async (template: LegalTemplate) => {
    if (!userInfo.name || !userInfo.email || !userInfo.whatsapp) {
      setPurchasingTemplate(template);
      setAppState(AppState.DETAILS_FORM);
      return;
    }

    setIsProcessingPayment(true);
    setStkStatus(`Requesting KSH ${template.price} for ${template.name}...`);
    setIsStkActive(true);

    try {
      const response = await mpesaService.initiateStkPush(userInfo, template.price);
      if (response.success) {
        setStkStatus(response.message);
        const verified = await mpesaService.verifyPayment(response.checkoutRequestID!);
        if (verified) {
          setIsProcessingPayment(false);
          setIsStkActive(false);
          alert(`Success! Your ${template.name} has been sent to ${userInfo.email}. Check your inbox for the download link.`);
          setAppState(AppState.LANDING);
        }
      }
    } catch (err) {
      alert("Payment failed. Please try again.");
      setIsProcessingPayment(false);
      setIsStkActive(false);
    }
  };

  const handleConsultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppState(AppState.GENERATING_BRIEF);
    setLoadingStep("Khatiebi is preparing your official case brief...");

    const newCaseId = `KCA-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const brief = await generateAttorneyBrief(userInfo, analysisResult, clientComplaints);
      setCaseFile({
        id: newCaseId,
        createdDate: new Date().toLocaleDateString(),
        clientComplaints,
        attorneyBrief: brief
      });

      // Send Email via Supabase Edge Function
      setLoadingStep("Dispatching legal brief via Secure Edge Network...");
      const emailSuccess = await sendEmailBrief(userInfo.email, userInfo.name, newCaseId, brief);

      if (emailSuccess) {
        setIsEmailSent(true);
      } else {
        console.warn("Email dispatch failed, but proceeding to booking.");
      }

      setAppState(AppState.BOOKING);
    } catch (e) {
      setErrorMsg("Briefing generation failed.");
      setAppState(AppState.ERROR);
    }
  };

  // --- Screens ---

  const renderLanding = () => (
    <div className="flex flex-col items-center text-center space-y-12 max-w-5xl mx-auto py-16 px-6">
      <div className="bg-legal-800 p-5 rounded-full border border-legal-gold/20 shadow-xl">
        <ScaleIcon />
      </div>
      <div className="space-y-4">
        <h1 className="text-5xl md:text-7xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-br from-legal-goldLight via-white to-legal-gold">
          Khalwale & Co Advocates
        </h1>
        <h2 className="text-3xl md:text-4xl font-serif text-slate-300 italic">IP Division</h2>
      </div>
      <p className="text-xl md:text-2xl text-slate-400 max-w-3xl leading-relaxed font-light">
        Elite legal vetting and protection for the <span className="text-white font-medium border-b border-legal-gold/50">Modern Creative Economy</span>.
      </p>

      <div className="flex flex-col md:flex-row gap-6 pt-6">
        <button
          onClick={() => setAppState(AppState.DETAILS_FORM)}
          className="px-12 py-5 bg-legal-gold hover:bg-legal-goldLight text-legal-900 font-bold text-lg rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center space-x-3"
        >
          <span>Start Professional Review</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
        </button>
        <button
          onClick={() => setAppState(AppState.QUIZ_INTRO)}
          className="px-12 py-5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg rounded-full border border-slate-700 transition-all flex items-center justify-center space-x-3"
        >
          <span>Take the IP Quiz</span>
        </button>
        <button
          onClick={() => setAppState(AppState.STORE)}
          className="px-12 py-5 bg-legal-900 border border-legal-gold/50 text-legal-gold font-bold text-lg rounded-full hover:bg-legal-gold/10 transition-all flex items-center justify-center space-x-3"
        >
          <span>Contract Marketplace</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full mt-16">
        <div onClick={() => setAppState(AppState.ARTIST_EDU)} className="group cursor-pointer bg-slate-800/40 p-10 rounded-3xl border border-slate-700 hover:border-legal-gold/50 transition-all hover:-translate-y-2">
          <div className="flex justify-center"><MusicIcon /></div>
          <h3 className="text-2xl font-serif text-white mb-4">Artists</h3>
          <p className="text-slate-400 text-sm leading-relaxed">Guard your royalties, masters, and creative legacy from predatory clauses.</p>
        </div>
        <div onClick={() => setAppState(AppState.PRODUCER_EDU)} className="group cursor-pointer bg-slate-800/40 p-10 rounded-3xl border border-slate-700 hover:border-legal-gold/50 transition-all hover:-translate-y-2">
          <div className="flex justify-center"><MixerIcon /></div>
          <h3 className="text-2xl font-serif text-white mb-4">Producers</h3>
          <p className="text-slate-400 text-sm leading-relaxed">Secure your points, publishing splits, and mechanical rights in every session.</p>
        </div>
        <div className="md:col-span-2 lg:col-span-1 bg-legal-gold/5 p-10 rounded-3xl border border-legal-gold/20 flex flex-col items-center">
          <AcademicCapIcon />
          <h3 className="text-2xl font-serif text-white mb-4">Knowledge Base</h3>
          <p className="text-slate-400 text-sm mb-6 text-center">Master the laws of MCSK, KECOBO, and International IP standards.</p>
          <button onClick={() => setAppState(AppState.QUIZ_INTRO)} className="text-legal-gold font-bold uppercase tracking-widest text-xs hover:text-legal-goldLight underline underline-offset-8">Study Guide &rarr;</button>
        </div>
      </div>
    </div>
  );

  const renderArchive = () => (
    <div className="max-w-4xl mx-auto py-16 px-6 animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif text-white mb-2">Secure Client Archive</h1>
        <p className="text-slate-400">Identity verification required to retrieve past audits.</p>
      </div>

      <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl max-w-xl mx-auto mb-16">
        <form onSubmit={handleArchiveLookup} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Registered Email</label>
            <input
              required
              type="email"
              value={archiveEmail}
              onChange={(e) => setArchiveEmail(e.target.value)}
              placeholder="e.g. artist@creative.com"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-3 text-white focus:ring-2 focus:ring-legal-gold/50 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">WhatsApp Number</label>
            <input
              required
              type="tel"
              value={archiveWhatsapp}
              onChange={(e) => setArchiveWhatsapp(e.target.value)}
              placeholder="+254 7XX XXX XXX"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-3 text-white focus:ring-2 focus:ring-legal-gold/50 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isFetchingArchive}
            className="w-full py-4 bg-legal-gold text-legal-900 font-bold rounded-xl hover:bg-legal-goldLight transition-all disabled:opacity-50 uppercase tracking-widest text-xs"
          >
            {isFetchingArchive ? 'Verifying Identity...' : 'Access My Records'}
          </button>
        </form>
      </div>

      {pastAudits.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          <div className="mb-4 flex items-center space-x-2 text-green-400 px-2">
            <CheckIcon />
            <span className="text-xs font-bold uppercase tracking-widest">Verified: {pastAudits.length} Records Found</span>
          </div>
          {pastAudits.map((audit) => (
            <div
              key={audit.id}
              onClick={() => selectAuditFromArchive(audit)}
              className="group p-6 bg-slate-800/40 border border-slate-700 rounded-2xl flex items-center justify-between cursor-pointer hover:border-legal-gold/50 transition-all"
            >
              <div className="flex items-center space-x-6">
                <div className="w-12 h-12 rounded-xl bg-legal-gold/10 flex items-center justify-center text-legal-gold"><ScaleIcon /></div>
                <div>
                  <h3 className="text-white font-bold">{audit.contract_name}</h3>
                  <p className="text-slate-500 text-xs font-mono uppercase tracking-widest">{new Date(audit.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <span className="text-legal-gold text-xs font-bold opacity-0 group-hover:opacity-100 transition-all">View Full Report &rarr;</span>
            </div>
          ))}
        </div>
      ) : archiveTried && !isFetchingArchive ? (
        <div className="text-center p-12 bg-red-900/10 rounded-3xl border border-red-500/20 max-w-xl mx-auto">
          <p className="text-red-400 text-sm font-bold">Verification Failed.</p>
          <p className="text-slate-500 text-xs mt-1 italic">Credentials do not match our secure records.</p>
        </div>
      ) : null}
    </div>
  );

  const renderEduScreen = (type: 'artist' | 'producer') => (
    <div className="max-w-4xl mx-auto py-16 px-6 animate-fade-in">
      <button onClick={() => setAppState(AppState.LANDING)} className="text-slate-500 hover:text-white mb-10 group flex items-center space-x-2">
        <span>&larr;</span> <span>Back to Dashboard</span>
      </button>
      <div className="flex items-center space-x-6 mb-12">
        {type === 'artist' ? <MusicIcon /> : <MixerIcon />}
        <h1 className="text-4xl md:text-5xl font-serif text-white">{type === 'artist' ? "Artist's IP Shield" : "Producer's Rights Vault"}</h1>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-3xl space-y-10 prose prose-invert prose-lg max-w-none text-slate-300">
        <div className="bg-red-900/10 border-l-4 border-red-500 p-6 rounded-r-2xl">
          <h3 className="text-xl font-bold text-white mb-2">The Danger Zone</h3>
          <p className="text-sm">Many contracts in Kenya today use "Work for Hire" clauses to strip creators of their lifelong copyright. Once signed, you lose all future royalties from that specific work.</p>
        </div>

        <div>
          <h3 className="text-2xl font-serif text-legal-gold mb-6 underline underline-offset-8">Critical Audit Points</h3>
          <ul className="list-none pl-0 space-y-6">
            <li className="flex items-start space-x-4">
              <span className="w-8 h-8 rounded-full bg-legal-gold/20 flex items-center justify-center text-legal-gold font-bold flex-shrink-0">1</span>
              <div>
                <strong className="text-white">Master Ownership Architecture</strong> Do you retain the original recordings, or are you handing over the keys to your legacy forever?
              </div>
            </li>
            <li className="flex items-start space-x-4">
              <span className="w-8 h-8 rounded-full bg-legal-gold/20 flex items-center justify-center text-legal-gold font-bold flex-shrink-0">2</span>
              <div>
                <strong className="text-white">Recoupment Engineering</strong> Labels shouldn't recoup marketing expenses from 100% of your earnings. This math is often intentionally obscured.
              </div>
            </li>
            <li className="flex items-start space-x-4">
              <span className="w-8 h-8 rounded-full bg-legal-gold/20 flex items-center justify-center text-legal-gold font-bold flex-shrink-0">3</span>
              <div>
                <strong className="text-white">Exit Strategy & Termination</strong> When does the contract end? A contract without a clear, executable exit clause is a professional life sentence.
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-16 text-center">
        <button onClick={() => setAppState(AppState.DETAILS_FORM)} className="px-12 py-5 bg-legal-gold text-legal-900 font-bold rounded-full shadow-2xl hover:bg-legal-goldLight transition-all">Submit Contract for Professional Review</button>
      </div>
    </div>
  );

  const renderDetailsForm = () => (
    <div className="w-full max-w-md mx-auto py-20 px-6 animate-fade-in">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-serif text-white mb-4">Client Onboarding</h2>
        <p className="text-slate-400">Strictly confidential record for the IP Division.</p>
      </div>
      <form onSubmit={handleUserInfoSubmit} className="space-y-6 bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Full Legal Name</label>
          <input required type="text" value={userInfo.name} onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-white focus:ring-2 focus:ring-legal-gold/50 outline-none transition-all" placeholder="e.g. John Doe" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Secure Email</label>
          <input required type="email" value={userInfo.email} onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-white focus:ring-2 focus:ring-legal-gold/50 outline-none transition-all" placeholder="client@legal.com" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Priority WhatsApp</label>
          <input required type="tel" value={userInfo.whatsapp} onChange={(e) => setUserInfo({ ...userInfo, whatsapp: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-white focus:ring-2 focus:ring-legal-gold/50 outline-none transition-all" placeholder="+254 7XX XXX XXX" />
        </div>
        <button type="submit" className="w-full py-5 bg-legal-gold text-legal-900 font-bold rounded-xl shadow-lg hover:bg-legal-goldLight transition-all mt-4">Initialize IP Audit</button>
        <button type="button" onClick={() => setAppState(AppState.LANDING)} className="w-full py-2 text-slate-500 hover:text-white text-sm transition-colors mt-2">Return to Home</button>
      </form>
    </div>
  );

  const renderUploadScreen = () => (
    <div className="w-full max-w-3xl mx-auto py-20 px-6 animate-fade-in text-center">
      <h2 className="text-4xl font-serif text-white mb-4">Upload Document</h2>
      <p className="text-slate-400 mb-10">Khatiebi will perform an immediate diagnostic audit for lethal compliance risks.</p>

      <div
        onClick={() => fileInputRef.current?.click()}
        className="group border-2 border-dashed border-slate-700 hover:border-legal-gold/50 rounded-3xl p-20 bg-slate-800/40 transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 hover:bg-slate-800/60"
      >
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx,.txt" />
        <UploadIcon />
        {file ? (
          <div className="text-legal-gold font-bold flex items-center animate-bounce-short">
            <CheckIcon /> {file.name}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-white text-xl font-medium">Drop Contract or Click to Select</p>
            <p className="text-slate-500 text-sm">PDF, DOCX, or TXT up to 4MB</p>
          </div>
        )}
      </div>

      <div className="mt-12 space-y-4">
        <button
          onClick={startAnalysis}
          disabled={!file}
          className="w-full py-5 bg-legal-gold text-legal-900 font-bold rounded-2xl shadow-2xl disabled:opacity-30 transition-all hover:scale-[1.02]"
        >
          Begin Deep AI Legal Analysis
        </button>
        <button onClick={() => setAppState(AppState.LANDING)} className="text-slate-500 hover:text-white text-sm">Cancel and Return</button>
      </div>
    </div>
  );

  const renderAnalysisResults = () => (
    <div className="w-full max-w-5xl mx-auto py-20 px-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-serif text-white mb-2">Legal Audit Findings</h2>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Khatiebi Diagnostic Complete</span>
          </div>
        </div>
        <div className="text-xs text-slate-400 bg-slate-800 px-5 py-2 rounded-full border border-slate-700 font-mono">{file?.name}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-slate-800/80 p-10 rounded-3xl border border-slate-700 shadow-inner overflow-y-auto max-h-[70vh] scrollbar-thin">
          <div className="prose prose-invert max-w-none prose-headings:text-legal-gold prose-a:text-legal-goldLight">
            <SafeMarkdown content={analysisResult} />
          </div>
          <LegalDisclaimer />
        </div>

        <div className="flex flex-col space-y-6">
          <div className="bg-gradient-to-br from-legal-800 to-slate-900 p-8 rounded-3xl border border-legal-gold/20 shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-legal-gold/5 rounded-full blur-3xl group-hover:bg-legal-gold/10 transition-all"></div>
            <h3 className="text-2xl font-serif text-white mb-4">Escalate to Senior Partner</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Khatiebi has identified structural leverage points that require a human legal surgical strike. A video consultation is required to draft the neutralized counter-language.
            </p>
            <div className="space-y-3 mb-8">
              <div className="flex items-center text-xs text-slate-300 font-bold"><CheckIcon /> 30-Min Tactical Strategy Session</div>
              <div className="flex items-center text-xs text-slate-300 font-bold"><CheckIcon /> Final Vetted Attorney Briefing</div>
              <div className="flex items-center text-xs text-slate-300 font-bold"><CheckIcon /> Direct Counter-Offer Language</div>
            </div>
            <button onClick={() => setAppState(AppState.PAYMENT)} className="w-full py-4 bg-legal-gold text-legal-900 font-bold rounded-xl shadow-lg hover:bg-legal-goldLight transition-all">Secure Professional Session (KSH 5,000)</button>
          </div>
          <button onClick={() => setAppState(AppState.LANDING)} className="w-full py-3 text-slate-600 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors">Return to Dashboard</button>
        </div>
      </div>
    </div>
  );

  const renderPaymentScreen = () => (
    <div className="w-full max-w-md mx-auto py-24 px-6 animate-fade-in">
      <div className="bg-slate-800 p-10 rounded-3xl border border-slate-700 shadow-2xl text-center">
        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-blue-500/20 shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3-3v8a3 3 0 003 3z" /></svg>
        </div>
        <h2 className="text-3xl font-serif text-white mb-2">Secure Checkout</h2>
        <p className="text-slate-400 mb-10 text-sm">Consultation Fee Allocation</p>

        <div className="space-y-4 mb-10 text-left bg-slate-900/50 p-6 rounded-2xl border border-slate-700">
          <div className="flex justify-between text-sm"><span className="text-slate-400">Strategic Fee</span><span className="text-white">KSH 4,310.34</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-400">VAT (16%)</span><span className="text-white">KSH 689.66</span></div>
          <div className="h-px bg-slate-700 my-2"></div>
          <div className="flex justify-between font-bold text-xl"><span className="text-white">Total Priority Payment</span><span className="text-legal-gold">KSH 5,000.00</span></div>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={handlePaymentSubmit}
            disabled={isProcessingPayment}
            className={`w-full py-5 ${isStkActive ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-500'} text-white font-bold rounded-2xl shadow-xl flex flex-col justify-center items-center transition-all active:scale-95`}
          >
            <span className="text-lg">{isProcessingPayment ? "Processing..." : "Pay with M-PESA"}</span>
            {isStkActive && <span className="text-[10px] mt-1 animate-pulse">Waiting for PIN entry on phone...</span>}
          </button>

          {isStkActive && (
            <div className="bg-legal-900/50 p-4 rounded-xl border border-legal-gold/20 text-xs text-slate-400 italic">
              {stkStatus}
            </div>
          )}

          <div className="flex justify-center space-x-6 opacity-40 grayscale hover:grayscale-0 transition-all">
            <span className="text-xs font-bold text-green-500">M-PESA</span>
            <span className="text-xs font-bold text-slate-100 italic">VISA</span>
            <span className="text-xs font-bold text-slate-100 italic">Mastercard</span>
          </div>
        </div>
      </div>
      <button onClick={() => setAppState(AppState.RESULTS)} className="w-full mt-8 text-slate-600 hover:text-white text-sm transition-colors underline">Return to Audit</button>
    </div>
  );

  const renderConsultationForm = () => (
    <div className="w-full max-w-2xl mx-auto py-24 px-6 animate-fade-in">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-serif text-white mb-4">Open Your Priority Case File</h2>
        <p className="text-slate-400">Payment Verified. Define your specific objectives for the Senior Partner.</p>
      </div>
      <form onSubmit={handleConsultSubmit} className="bg-slate-800 p-10 rounded-3xl border border-slate-700 shadow-2xl">
        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 ml-1">Strategic Objectives & Concerns</label>
        <textarea required value={clientComplaints} onChange={(e) => setClientComplaints(e.target.value)} className="w-full h-48 bg-slate-900 border border-slate-700 rounded-2xl px-6 py-5 text-white focus:ring-2 focus:ring-legal-gold/50 outline-none mb-8 resize-none transition-all" placeholder="e.g. I must retain 100% of my mechanical publishing. The current recoupment schedule is unrealistic..." />
        <button type="submit" className="w-full py-5 bg-legal-gold text-legal-900 font-bold rounded-2xl shadow-lg hover:bg-legal-goldLight transition-all">Generate Final Case Briefing</button>
      </form>
    </div>
  );

  const renderBookingSuccess = () => (
    <div className="w-full max-w-7xl mx-auto py-16 px-6 animate-fade-in">
      <div className="bg-green-900/10 border border-green-500/30 p-10 rounded-3xl mb-12 flex flex-col items-center text-center shadow-inner">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-500/20 font-bold text-white text-2xl leading-none">✓</div>
        <h2 className="text-4xl font-serif text-white mb-2">Priority Consultation Active</h2>
        <div className="flex items-center space-x-3 text-green-400 font-mono text-sm tracking-widest uppercase">
          <span>FILE ID: {caseFile?.id}</span>
          {isEmailSent && <span className="bg-green-900/30 px-3 py-1 rounded text-[10px] border border-green-500/20">Counsel Notification Sent</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div className="bg-slate-800 p-10 rounded-3xl border border-slate-700 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-legal-gold uppercase tracking-widest">Counsel Briefing Protocol</h3>
            <button onClick={() => window.print()} className="text-[10px] text-slate-400 hover:text-white uppercase font-bold tracking-widest transition-colors">Download PDF</button>
          </div>
          <div className="prose prose-invert prose-sm max-w-none h-[600px] overflow-y-auto pr-6 scrollbar-thin">
            <SafeMarkdown content={caseFile?.attorneyBrief || ''} />
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl flex flex-col h-[700px]">
            <div className="mb-6">
              <h3 className="text-2xl font-serif text-white mb-1">Live Calendar Sync</h3>
              <p className="text-slate-400 text-sm">Select your preferred slot with the Senior Partner.</p>
            </div>
            {/* Calendly Inline Widget Embed with User Prefill */}
            <div
              className="calendly-inline-widget flex-grow w-full h-full rounded-2xl overflow-hidden"
              data-url={`https://calendly.com/khalwaleip/30min?name=${encodeURIComponent(userInfo.name)}&email=${encodeURIComponent(userInfo.email)}&a1=${encodeURIComponent(caseFile?.id || '')}`}
              style={{ minWidth: '320px', height: '100%' }}
            ></div>
          </div>
          <div className="text-center pt-2">
            <button onClick={() => setAppState(AppState.LANDING)} className="text-legal-gold font-bold hover:underline transition-all uppercase tracking-widest text-[10px]">Return to Secure Professional Dashboard</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQuizIntro = () => (
    <div className="w-full max-w-3xl mx-auto py-24 px-6 animate-fade-in text-center">
      <div className="mb-10 inline-block p-6 bg-legal-gold/10 rounded-full border border-legal-gold/20 shadow-inner"><AcademicCapIcon /></div>
      <h2 className="text-5xl font-serif text-white mb-6">IP Mastery Assessment</h2>
      <p className="text-slate-400 text-lg mb-12 max-w-2xl mx-auto font-light">20-question advanced diagnostic based on KECOBO, MCSK, and international industry benchmarks.</p>

      <div className="bg-slate-800 p-10 rounded-3xl border border-slate-700 shadow-2xl text-left mb-10">
        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 ml-1">Area of Specialization</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {['Music Business', 'Film Industry', 'Publishing', 'Production', 'Artist Rights'].map((cat) => (
            <button
              key={cat}
              onClick={() => setQuizCategory(cat as QuizCategory)}
              className={`p-5 rounded-xl border text-sm font-bold transition-all ${quizCategory === cat ? 'bg-legal-gold/20 border-legal-gold text-white shadow-lg scale-[1.02]' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <form onSubmit={handleUserInfoSubmit} className="space-y-4">
          <input required type="text" placeholder="Full Legal Name for Professional Certificate" value={userInfo.name} onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-white focus:ring-2 focus:ring-legal-gold/50 outline-none transition-all" />
          <button type="submit" className="w-full py-5 bg-legal-gold text-legal-900 font-bold rounded-xl shadow-xl hover:bg-legal-goldLight transition-all mt-4 uppercase tracking-widest text-xs">Begin Professional Assessment</button>
        </form>
      </div>
      <button onClick={() => setAppState(AppState.LANDING)} className="text-slate-600 hover:text-white transition-colors text-sm underline underline-offset-4">Return to Dashboard</button>
    </div>
  );

  const renderQuizGame = () => {
    const q = quizQuestions[currentQuestionIndex];
    if (!q) return <Spinner message="Khatiebi is preparing your assessment set..." />;

    return (
      <div className="w-full max-w-3xl mx-auto py-24 px-6 animate-fade-in">
        <div className="flex justify-between items-center mb-10">
          <div className="space-y-1">
            <span className="text-legal-gold font-bold uppercase tracking-widest text-[10px]">Division: {quizCategory}</span>
            <div className="text-slate-500 text-sm">Requirement {currentQuestionIndex + 1} of 20</div>
          </div>
          <div className="w-32 bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-700 shadow-inner">
            <div className="bg-legal-gold h-full transition-all duration-500 ease-in-out" style={{ width: `${((currentQuestionIndex + 1) / 20) * 100}%` }}></div>
          </div>
        </div>

        <h2 className="text-3xl font-serif text-white mb-12 leading-snug">{q.question}</h2>

        <div className="space-y-4">
          {q.options.map((opt, idx) => {
            let btnClass = "w-full text-left p-6 rounded-2xl border transition-all flex items-center group relative overflow-hidden ";
            if (quizAnswered) {
              if (idx === q.correctAnswerIndex) btnClass += "bg-green-900/30 border-green-500/50 text-green-100 shadow-lg shadow-green-500/5";
              else if (idx === selectedOption) btnClass += "bg-red-900/30 border-red-500/50 text-red-100";
              else btnClass += "bg-slate-900 border-slate-800 text-slate-600 opacity-40";
            } else {
              btnClass += "bg-slate-800 border-slate-700 text-slate-300 hover:border-legal-gold/50 hover:bg-slate-700/50 hover:translate-x-2";
            }

            return (
              <button key={idx} disabled={quizAnswered} onClick={() => handleQuizAnswer(idx)} className={btnClass}>
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center mr-6 text-xs font-bold border transition-all ${quizAnswered && idx === q.correctAnswerIndex ? 'bg-green-500 border-green-400 text-white' : 'bg-slate-900 border-slate-700 group-hover:border-legal-gold text-slate-500'}`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-lg">{opt}</span>
              </button>
            );
          })}
        </div>

        {quizAnswered && (
          <div className="mt-12 p-8 bg-legal-800/30 rounded-3xl border border-slate-700 animate-fade-in-up shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-3 h-3 rounded-full ${selectedOption === q.correctAnswerIndex ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <h4 className="font-bold text-white uppercase tracking-widest text-[10px]">Professional Context</h4>
            </div>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed italic">"{q.explanation}"</p>
            <a href={q.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-legal-gold text-xs font-bold uppercase tracking-tighter hover:text-legal-goldLight transition-all underline underline-offset-4"> Review Industry Precedent &rarr;</a>

            <button onClick={handleNextQuestion} className="w-full mt-10 py-5 bg-legal-gold text-legal-900 font-bold rounded-2xl shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.99]">
              {currentQuestionIndex === 19 ? "View Professional Mastery Report" : "Confirm & Proceed"}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderQuizResults = () => {
    const passed = quizScore >= 16;

    return (
      <div className="w-full max-w-4xl mx-auto py-20 px-6 animate-fade-in text-center">
        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-8 shadow-2xl ${passed ? 'bg-green-500/20 text-green-500 border border-green-500/40' : 'bg-red-500/20 text-red-500 border border-red-500/40'}`}>
          <AcademicCapIcon />
        </div>
        <h2 className="text-5xl font-serif text-white mb-4 uppercase tracking-widest">{passed ? "Status: Professional" : "Status: Apprentice"}</h2>
        <p className="text-slate-400 mb-12 text-2xl font-light">Proficiency Level: <span className={`font-bold ${passed ? 'text-green-500' : 'text-red-400'}`}>{quizScore} / 20</span></p>

        {failedQuestions.length > 0 && (
          <div className="bg-slate-800/50 p-10 rounded-3xl border border-slate-700 text-left mb-12 shadow-2xl">
            <h3 className="text-xs font-bold text-slate-500 mb-8 border-b border-slate-700 pb-4 uppercase tracking-[0.3em]">Compulsory Professional Review</h3>
            <div className="space-y-8 max-h-[500px] overflow-y-auto pr-6 scrollbar-thin">
              {failedQuestions.map((q, idx) => (
                <div key={idx} className="border-l-4 border-red-500/30 pl-6 py-2 group hover:border-red-500 transition-all rounded-r-xl bg-slate-900/10">
                  <p className="text-white font-bold mb-3 text-lg leading-snug">{q.question}</p>
                  <p className="text-slate-500 text-sm mb-4 leading-relaxed italic">{q.explanation}</p>
                  <a href={q.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-legal-gold text-[10px] uppercase font-bold tracking-widest hover:text-white transition-all underline underline-offset-4">Official Legal Protocol &rarr;</a>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <button onClick={() => setAppState(AppState.LANDING)} className="px-12 py-5 bg-slate-800 text-white font-bold rounded-2xl border border-slate-700 hover:bg-slate-700 transition-all">Return to Hub</button>
          {passed && (
            <button onClick={() => setAppState(AppState.CERTIFICATE)} className="px-12 py-5 bg-green-600 text-white font-bold rounded-2xl shadow-2xl hover:bg-green-500 transition-all">Download IP Certificate</button>
          )}
          <button onClick={() => setAppState(AppState.QUIZ_INTRO)} className="px-12 py-5 bg-legal-gold text-legal-900 font-bold rounded-2xl shadow-2xl hover:bg-legal-goldLight transition-all">Retake Assessment</button>
        </div>
      </div>
    );
  };

  const renderStore = () => (
    <div className="max-w-7xl mx-auto py-16 px-6 animate-fade-in">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-5xl font-serif font-bold text-white">Legal Template Marketplace</h1>
        <p className="text-xl text-slate-400 font-light">Vetted, industry-standard IP contracts for immediate download.</p>
        <div className="flex justify-center">
          <div className="h-1 w-24 bg-legal-gold rounded-full"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {LEGAL_TEMPLATES.map((template) => (
          <div key={template.id} className="bg-slate-800/80 border border-slate-700 rounded-3xl p-8 flex flex-col justify-between hover:border-legal-gold/40 transition-all group">
            <div>
              <div className="flex justify-between items-start mb-6">
                <span className="px-3 py-1 bg-legal-gold/10 text-legal-gold text-[10px] font-bold uppercase tracking-widest rounded-full border border-legal-gold/20">
                  {template.category}
                </span>
                <span className="text-2xl font-bold text-white font-serif">KSH {template.price.toLocaleString()}</span>
              </div>
              <h3 className="text-2xl font-serif text-white mb-4 group-hover:text-legal-gold transition-colors">{template.name}</h3>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">{template.description}</p>

              <div className="space-y-3 mb-10">
                {template.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center text-xs text-slate-300">
                    <CheckIcon /> {benefit}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleTemplatePurchase(template)}
              disabled={isProcessingPayment}
              className="w-full py-4 bg-legal-gold text-legal-900 font-bold rounded-xl hover:bg-legal-goldLight transition-all uppercase tracking-widest text-[10px] flex items-center justify-center space-x-2"
            >
              <ShoppingCartIcon />
              <span>{isProcessingPayment && purchasingTemplate?.id === template.id ? 'Processing...' : 'Purchase & Download'}</span>
            </button>
          </div>
        ))}
      </div>

      <div className="mt-20 p-12 bg-legal-gold/5 rounded-[40px] border border-legal-gold/20 flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="max-w-xl text-center md:text-left">
          <h3 className="text-3xl font-serif text-white mb-4">Need Custom Drafting?</h3>
          <p className="text-slate-400 leading-relaxed font-light">Our marketplace provides standard templates. For complex, multi-party international deals, we recommend a secondary review or custom drafting session.</p>
        </div>
        <button onClick={() => setAppState(AppState.DETAILS_FORM)} className="px-10 py-5 bg-white text-legal-900 font-bold rounded-2xl hover:bg-slate-100 transition-all whitespace-nowrap">Schedule Custom Draft</button>
      </div>
    </div>
  );

  const renderCertificate = () => (
    <div className="min-h-screen bg-white flex items-center justify-center p-8 animate-fade-in overflow-hidden">
      <div className="w-full max-w-5xl aspect-[1.414/1] bg-white border-[20px] border-double border-[#cca43b] p-12 relative flex flex-col items-center justify-between text-[#1e293b] shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#cca43b] opacity-10 rounded-full blur-2xl"></div>

        <div className="text-center space-y-4 z-10">
          <h3 className="text-sm font-bold uppercase tracking-[0.5em] text-[#cca43b]">Khalwale & Co Advocates</h3>
          <h1 className="text-6xl font-serif font-bold italic border-b-2 border-[#cca43b] pb-4 inline-block">Certificate of IP Mastery</h1>
        </div>

        <div className="text-center space-y-6 z-10">
          <p className="text-xl font-light italic text-slate-500">This official document certifies that</p>
          <h2 className="text-5xl font-serif font-bold underline underline-offset-[12px] text-slate-900">{userInfo.name || "Distinguished Creator"}</h2>
          <p className="text-lg max-w-2xl mx-auto leading-relaxed text-slate-700">
            has successfully completed the <strong>Senior Intellectual Property Assessment</strong> for the <strong>{quizCategory}</strong> sector with a proficiency score of <strong>{quizScore}/20</strong>.
          </p>
        </div>

        <div className="flex justify-between w-full items-end mt-12 z-10">
          <div className="text-center w-64 border-t-2 border-[#cca43b] pt-4">
            <p className="text-base font-bold text-slate-900">Khatiebi</p>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Intake Counsel (AI)</p>
          </div>

          <div className="relative">
            <div className="w-32 h-32 border-4 border-[#cca43b] rounded-full flex items-center justify-center bg-[#cca43b]/5 rotate-12 shadow-inner">
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-tighter text-[#cca43b]">Khalwale & Co</p>
                <p className="text-[10px] font-bold text-slate-900">OFFICIAL SEAL</p>
                <p className="text-[10px] italic text-slate-500">Nairobi, KE</p>
              </div>
            </div>
          </div>

          <div className="text-center w-64 border-t-2 border-[#cca43b] pt-4">
            <p className="text-base font-bold text-slate-900">Senior Partner</p>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">IP Division</p>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 font-mono tracking-[0.3em] uppercase">
          VERIFICATION ID: {Math.random().toString(36).substr(2, 9).toUpperCase()} • {new Date().toLocaleDateString()}
        </div>

        <div className="absolute top-4 right-8 flex gap-4 print:hidden">
          <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-700 shadow-xl transition-all">Print / PDF</button>
          <button onClick={() => setAppState(AppState.QUIZ_RESULTS)} className="bg-slate-100 text-slate-800 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all border border-slate-200">Close</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col pb-10 overflow-x-hidden selection:bg-legal-gold selection:text-legal-900">

      {appState !== AppState.CERTIFICATE && (
        <header className="border-b border-slate-800/50 bg-legal-900/95 backdrop-blur-xl sticky top-0 z-50 shadow-xl">
          <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
            <div className="flex items-center space-x-5 cursor-pointer group" onClick={() => setAppState(AppState.LANDING)}>
              <div className="w-12 h-12 bg-legal-gold rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                <span className="font-serif font-bold text-legal-900 text-3xl">K</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-2xl font-serif text-white tracking-wide font-bold leading-none">Khalwale & Co</span>
                <span className="text-xs text-legal-gold font-bold uppercase tracking-[0.3em] mt-1.5">IP Division</span>
              </div>
            </div>

            <div className="hidden lg:flex items-center space-x-8">
              <nav className="flex items-center space-x-12">
                <button onClick={() => setAppState(AppState.ARTIST_EDU)} className="text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-legal-gold transition-all">Artists</button>
                <button onClick={() => setAppState(AppState.PRODUCER_EDU)} className="text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-legal-gold transition-all">Producers</button>
                <button onClick={() => setAppState(AppState.STORE)} className="text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-legal-gold transition-all">Legal Templates</button>
                <button onClick={() => setAppState(AppState.ARCHIVE)} className="text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-legal-gold transition-all">Client Archive</button>
                <button onClick={() => setAppState(AppState.QUIZ_INTRO)} className="text-xs font-bold uppercase tracking-widest px-7 py-3 rounded-full border border-legal-gold/20 text-legal-gold hover:bg-legal-gold hover:text-legal-900 transition-all shadow-lg">Mastery Quiz</button>
              </nav>
            </div>

            <div className="lg:hidden">
              <button onClick={() => setAppState(AppState.LANDING)} className="p-2 text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
              </button>
            </div>
          </div>
        </header>
      )}

      <main className={`flex-grow ${appState === AppState.CERTIFICATE ? 'bg-white' : 'bg-legal-900'} relative`}>
        {appState !== AppState.CERTIFICATE && <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-slate-800/20 to-transparent pointer-events-none"></div>}
        <div className="relative z-10">
          {appState === AppState.LANDING && renderLanding()}
          {appState === AppState.ARCHIVE && renderArchive()}
          {appState === AppState.ARTIST_EDU && renderEduScreen('artist')}
          {appState === AppState.PRODUCER_EDU && renderEduScreen('producer')}
          {appState === AppState.QUIZ_INTRO && renderQuizIntro()}
          {appState === AppState.QUIZ_GAME && renderQuizGame()}
          {appState === AppState.QUIZ_RESULTS && renderQuizResults()}
          {appState === AppState.CERTIFICATE && renderCertificate()}
          {appState === AppState.DETAILS_FORM && renderDetailsForm()}
          {appState === AppState.UPLOAD && renderUploadScreen()}
          {appState === AppState.ANALYZING && <div className="min-h-[60vh] flex items-center justify-center"><Spinner message={loadingStep} /></div>}
          {appState === AppState.RESULTS && renderAnalysisResults()}
          {appState === AppState.PAYMENT && renderPaymentScreen()}
          {appState === AppState.CONSULT_FORM && renderConsultationForm()}
          {appState === AppState.STORE && renderStore()}
          {appState === AppState.BOOKING && renderBookingSuccess()}
          {appState === AppState.ERROR && (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 border border-red-500/20 font-bold text-xl">✕</div>
              <h3 className="text-2xl font-serif text-white">System Protocol Fault</h3>
              <p className="text-slate-400 max-w-md text-sm leading-relaxed">{errorMsg}</p>
              <button onClick={() => setAppState(AppState.LANDING)} className="px-8 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 shadow-xl transition-all hover:bg-slate-700">Return to Secure Hub</button>
            </div>
          )}
          {appState === AppState.GENERATING_BRIEF && <div className="min-h-[60vh] flex items-center justify-center"><Spinner message={loadingStep} /></div>}
        </div>
      </main>

      {/* Privacy Policy Modal */}
      {showPrivacyPolicy && <PrivacyPolicy onClose={() => setShowPrivacyPolicy(false)} />}

      {/* Supabase Diagnostics Modal */}
      {showDbDiagnostics && <SupabaseGuide onClose={() => setShowDbDiagnostics(false)} testEmail={userInfo.email} />}

      {appState !== AppState.CERTIFICATE && (
        <>
          <NewsTicker />
          <ChatWidget onStartReview={() => setAppState(AppState.UPLOAD)} />
          <footer className="bg-slate-900/50 border-t border-slate-800/50 py-12 px-6 text-center mb-10">
            <div className="max-w-6xl mx-auto space-y-4">
              <p className="text-slate-600 text-xs font-bold uppercase tracking-[0.4em]">Khalwale & Co Advocates • Nairobi • Digital IP</p>
              <div className="flex justify-center space-x-6">
                <p className="text-slate-500 text-sm italic font-light">Dedicated to safeguarding the global legacy of African creative excellence.</p>
                <span className="text-slate-700">|</span>
                <button onClick={() => setShowPrivacyPolicy(true)} className="text-legal-gold text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">Privacy Policy</button>
                <span className="text-slate-700">|</span>
                <button onClick={() => setShowDbDiagnostics(true)} className="text-slate-600 hover:text-green-500 text-xs font-bold uppercase tracking-widest transition-colors">DB Status</button>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
