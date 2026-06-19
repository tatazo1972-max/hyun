import React, { useState, useEffect } from 'react';
import { Play, Sparkles, LogIn, ArrowRight, Award, Compass, Layers, Globe, Lock, CheckCircle, HelpCircle, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { Participant } from '../types';

interface StartScreenProps {
  onJoin: (nickname: string, group: string) => void;
  onResume: (code: string) => void;
  onDemo: () => void;
  errorMsg: string;
}

export default function StartScreen({ onJoin, onResume, onDemo, errorMsg }: StartScreenProps) {
  const [nickname, setNickname] = useState('');
  const [group, setGroup] = useState('');
  const [typedCode, setTypedCode] = useState('');
  const [isResuming, setIsResuming] = useState(false);

  // States for Gemini API Key Verification
  const [apiKey, setApiKey] = useState(sessionStorage.getItem('gemini_api_key') || '');
  const [isKeyValidated, setIsKeyValidated] = useState(!!sessionStorage.getItem('gemini_api_key'));
  const [isValidating, setIsValidating] = useState(false);
  const [keyError, setKeyError] = useState('');
  const [isGuideExpanded, setIsGuideExpanded] = useState(false);

  // Suggested standard groups/sessions
  const standardGroups = [
    "2026년 6월 은퇴설계 1기",
    "평생현역 커리어 어드벤처 2기",
    "중장년 재취업 역량강화 세미나",
    "퇴직예정 공직자 생애설계 워크숍"
  ];

  useEffect(() => {
    const cachedKey = sessionStorage.getItem('gemini_api_key');
    if (cachedKey) {
      setApiKey(cachedKey);
      setIsKeyValidated(true);
    }
  }, []);

  const handleValidateKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!apiKey.trim()) {
      setKeyError("Gemini API 키를 입력해 주세요.");
      return;
    }
    setKeyError('');
    setIsValidating(true);
    try {
      const response = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.valid) {
          sessionStorage.setItem('gemini_api_key', apiKey.trim());
          setIsKeyValidated(true);
        } else {
          setKeyError("유효하지 않은 API 키입니다. 다시 입력해 주세요.");
        }
      } else {
        const err = await response.json();
        setKeyError(err.error || "API 키 인증에 실패했습니다.");
      }
    } catch (error) {
      setKeyError("인증 서버와의 통신에 실패했습니다.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleChangeKey = () => {
    sessionStorage.removeItem('gemini_api_key');
    setIsKeyValidated(false);
    setApiKey('');
  };

  return (
    <div className="min-h-screen bg-brand-cream text-brand-slate flex flex-col justify-between p-4 md:p-8 relative overflow-hidden" id="start-screen-container">
      {/* Decorative absolute background grid & ambient light */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-brand-blue/10 rounded-full filter blur-[120px] pointer-events-none animate-pulse" id="landing-ambient-blue" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-brand-gold/5 rounded-full filter blur-[150px] pointer-events-none" id="landing-ambient-gold" />

      {/* Header Top Branding */}
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between border-b border-brand-border/60 pb-4 z-10" id="landing-header">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-brand-blue flex items-center justify-center text-white font-black text-sm tracking-tighter">LP</span>
          <span className="text-sm font-bold tracking-tight text-brand-slate uppercase font-mono">Life 2nd Act · Active Platform</span>
        </div>
        <div className="text-[10px] font-mono font-bold text-brand-gray bg-white border border-brand-border px-2.5 py-1 rounded-full shadow-xs">
          STABLE VERSION 2.5
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto py-8 z-10" id="landing-main-grid">
        
        {/* Left Area: Hero & Features Presentation (Slides 01, 02, 03 aesthetic) */}
        <div className="lg:col-span-7 flex flex-col space-y-8 text-left" id="landing-hero-showcase">
          
          {/* Main Title Banner */}
          <div className="space-y-4" id="hero-title-group">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-blue/5 text-brand-blue border border-brand-blue/15 text-xs font-semibold mr-auto shadow-xs"
              id="top-sparkle-badge"
            >
              <Sparkles size={13} className="text-brand-blue" />
              <span>독보적 대화형 AI 중장년 특화 솔루션</span>
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-brand-slate leading-[1.125] tracking-tight" id="main-landing-title">
              인생 2막, <br />
              <span className="relative inline-block text-brand-blue">
                평생현역 어드벤처 가이드
                <span className="absolute bottom-1.5 left-0 w-full h-[6px] bg-brand-blue/10 -z-10" />
              </span>
            </h1>
            
            <p className="text-brand-gray text-[15px] sm:text-base max-w-xl leading-relaxed font-normal pt-1" id="main-landing-subtitle">
              자신의 숨은 강점을 찾고 은퇴 후의 커리어 패스를 명확히 정의하는 AI 대장정.
              지금 대화를 시작하고 귀하에게 최적인 <strong>평생현역 3트랙 실행 설계도</strong>를 발급받으세요.
            </p>
          </div>

          {/* Dynamic Vector Art block matching uploaded mockup page 1 */}
          <div className="relative bg-white border border-brand-border rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col md:flex-row items-center gap-6" id="floating-character-artwork">
            <div className="absolute top-0 left-0 w-24 h-24 bg-brand-blue/5 rounded-full filter blur-md pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-full filter blur-xl pointer-events-none" />
            
            {/* Embedded vector sphere art mirroring the upload image cover style */}
            <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center bg-brand-cream border border-brand-border rounded-2xl overflow-hidden shadow-inner uppercase font-mono text-center" id="vector-container">
              <svg viewBox="0 0 200 200" className="w-full h-full p-2" id="art-svg">
                {/* Background smooth gradient */}
                <defs>
                  <linearGradient id="blueSphere" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0047FF" />
                    <stop offset="60%" stopColor="#2E62FF" />
                    <stop offset="100%" stopColor="#0D1E4E" />
                  </linearGradient>
                  <linearGradient id="accentOrange" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#EA580C" />
                    <stop offset="100%" stopColor="#FF9030" />
                  </linearGradient>
                </defs>
                {/* Core flow/fluid sphere */}
                <ellipse cx="100" cy="115" rx="50" ry="25" fill="#E2E8F0" />
                <circle cx="100" cy="85" r="50" fill="url(#blueSphere)" opacity="0.9" />
                <ellipse cx="100" cy="80" rx="35" ry="30" fill="none" stroke="white" strokeWidth="1" strokeDasharray="3 3" />
                {/* Floating shiny orbital line */}
                <path d="M 40 90 Q 100 130 160 90" fill="none" stroke="url(#accentOrange)" strokeWidth="3" />
                <circle cx="120" cy="105" r="10" fill="url(#accentOrange)" />
                {/* Silhouette or premium character motif sphere */}
                <circle cx="75" cy="70" r="14" fill="#000" opacity="0.15" />
                <circle cx="75" cy="70" r="8" fill="#FFF" />
              </svg>
              <div className="absolute bottom-2 inset-x-0 text-[8px] tracking-widest font-black text-brand-slate opacity-75">
                PORTFOLIO ART
              </div>
            </div>

            {/* Side bullet highlights */}
            <div className="space-y-2 text-left" id="artwork-intro-bullets">
              <div className="text-[10px] uppercase font-mono tracking-widest font-bold text-brand-blue">
                Core Value Statement
              </div>
              <h3 className="text-lg font-black text-brand-slate leading-snug">
                중장년 커리어 재발견의 혁신적 여정
              </h3>
              <p className="text-xs text-brand-gray leading-relaxed max-w-md">
                대화 과정을 통해 가치관, 성과 내력, 가용한 네트워킹 및 학습 선호를 종합 분석하여, 1회성이 아닌 평생에 걸쳐 자생력을 갖추는 로드맵 카드를 즉시 합성해냅니다.
              </p>
            </div>
          </div>

          {/* Contents Feature list: Mirroring 01, 02, 03 exactly from the attached images */}
          <div className="space-y-4" id="contents-features-panel">
            <div className="text-xs font-mono font-bold tracking-widest text-brand-gray/80 flex items-center gap-2 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
              <span>Contents · 솔루션 핵심 기능 명세</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="contents-grid">
              
              {/* Feature 01 - Highlight Blue Card */}
              <div className="bg-brand-blue text-white rounded-2xl p-5 shadow-xs border border-brand-blue hover:scale-[1.02] transition-transform duration-300" id="feature-01">
                <div className="text-2xl font-black font-mono tracking-tight opacity-90 border-b border-white/20 pb-2 mb-3 flex justify-between items-center">
                  <span>01</span>
                  <Award size={16} className="text-white opacity-80" />
                </div>
                <h4 className="text-sm font-black tracking-tight mb-1">
                  나만의 고유 브랜드
                </h4>
                <p className="text-[11px] text-white/80 leading-relaxed font-light">
                  개인 맞춤형 한 줄 슬로건과 사명 선언서(Mission)를 작성해 완주 증서를 생성합니다.
                </p>
              </div>

              {/* Feature 02 - Elegant light card */}
              <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-xs hover:scale-[1.02] transition-transform duration-300" id="feature-02">
                <div className="text-2xl font-black font-mono text-brand-blue tracking-tight border-b border-brand-border pb-2 mb-3 flex justify-between items-center">
                  <span>02</span>
                  <Layers size={16} className="text-brand-gold" />
                </div>
                <h4 className="text-sm font-black text-brand-slate tracking-tight mb-1">
                  7대 생애역량 매트릭스
                </h4>
                <p className="text-[11px] text-brand-gray leading-relaxed font-light">
                  건강, 재무, 전문성 등 인생의 주요 7대 영역을 시각 다이어그램으로 완벽 검수합니다.
                </p>
              </div>

              {/* Feature 03 - Elegant light card */}
              <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-xs hover:scale-[1.02] transition-transform duration-300" id="feature-03">
                <div className="text-2xl font-black font-mono text-brand-blue tracking-tight border-b border-brand-border pb-2 mb-3 flex justify-between items-center">
                  <span>03</span>
                  <Compass size={16} className="text-brand-blue" />
                </div>
                <h4 className="text-sm font-black text-brand-slate tracking-tight mb-1">
                  3트랙 실행 로드맵
                </h4>
                <p className="text-[11px] text-brand-gray leading-relaxed font-light">
                  오늘 당장 실천할 과업부터 7일, 30일, 90일 단위의 디테일한 이정표를 획정합니다.
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* Right Area: Onboarding Registration & Resume Form Board (styled flawlessly) */}
        <div className="lg:col-span-5 h-full flex flex-col justify-center" id="landing-onboarding-form">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-brand-border shadow-md relative overflow-hidden" id="registration-form-panel">
            {/* Form decorative glowing bubble */}
            <div className="absolute top-[-10%] right-[-10%] w-24 h-24 bg-brand-gold/5 rounded-full filter blur-xl pointer-events-none" />
            
            {!isKeyValidated ? (
              <div className="space-y-6 text-left" id="api-key-validation-screen">
                <div className="flex items-start gap-2.5 bg-green-50/50 border border-green-200/60 rounded-2xl p-4 text-xs font-semibold text-green-800 leading-relaxed" id="api-key-status-title">
                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="font-extrabold text-green-700">무료로 시작하세요. Gemini API 키만 있으면 됩니다.</span>
                </div>

                <form onSubmit={handleValidateKey} className="flex gap-2" id="api-key-input-form">
                  <div className="relative flex-1" id="api-key-input-container">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-gray/50 animate-pulse">
                      <Lock size={16} />
                    </div>
                    <input
                      type="password"
                      id="api-key-input"
                      className="w-full bg-brand-cream border border-brand-border rounded-xl pl-9 pr-4 py-3.5 text-brand-slate focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all text-sm placeholder:text-brand-gray/50 font-medium"
                      placeholder="Gemini API Key 입력"
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value);
                        if (keyError) setKeyError('');
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isValidating || !apiKey.trim()}
                    className="bg-brand-blue hover:bg-brand-hover-blue text-white font-black px-6 py-3.5 rounded-xl shadow-xs transition-all duration-200 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-sm cursor-pointer whitespace-nowrap"
                    id="api-key-submit-btn"
                  >
                    {isValidating ? "확인 중..." : "시작하기"}
                  </button>
                </form>

                {keyError && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs font-semibold leading-relaxed"
                    id="api-key-error"
                  >
                    {keyError}
                  </motion.div>
                )}

                {/* Collapsible Key Issuance Guide matching the mockup precisely */}
                <div className="border border-brand-border/85 rounded-2xl overflow-hidden bg-brand-cream/30 shadow-xs" id="guide-accordion">
                  <button
                    onClick={() => setIsGuideExpanded(!isGuideExpanded)}
                    type="button"
                    className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-black text-brand-slate bg-brand-cream/55 hover:bg-brand-cream hover:text-brand-blue transition-colors cursor-pointer"
                    id="guide-accordion-toggle"
                  >
                    <div className="flex items-center gap-2">
                      <HelpCircle size={15} className="text-brand-blue" />
                      <span>Gemini API Key 발급 가이드</span>
                    </div>
                    <ChevronDown size={14} className={`transform transition-transform duration-300 ${isGuideExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {isGuideExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="p-4 border-t border-brand-border/60 bg-white space-y-4 text-xs text-brand-slate"
                      id="guide-accordion-content"
                    >
                      <div className="space-y-4" id="guide-steps-list">
                        {/* Step 1 */}
                        <div className="flex gap-3" id="step-1">
                          <span className="w-5 h-5 rounded bg-brand-blue/10 text-brand-blue font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                          <div className="space-y-1">
                            <span className="font-extrabold text-brand-slate">Google AI Studio 접속</span>
                            <p className="text-brand-gray text-[11px] leading-relaxed">
                              아래 링크를 클릭하여 Google AI Studio에 접속하세요.
                              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="block text-brand-blue hover:underline mt-1 font-medium break-all">
                                https://aistudio.google.com/apikey
                              </a>
                            </p>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex gap-3" id="step-2">
                          <span className="w-5 h-5 rounded bg-brand-blue/10 text-brand-blue font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                          <div className="space-y-1">
                            <span className="font-extrabold text-brand-slate">Google Account로 로그인</span>
                            <p className="text-brand-gray text-[11px] leading-relaxed">
                              Gmail 계정으로 로그인하세요. 계정이 없으면 무료로 만들 수 있어요.
                            </p>
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex gap-3" id="step-3">
                          <span className="w-5 h-5 rounded bg-brand-blue/10 text-brand-blue font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                          <div className="space-y-1">
                            <span className="font-extrabold text-brand-slate">'API 키 만들기' 클릭</span>
                            <p className="text-brand-gray text-[11px] leading-relaxed">
                              화면에서 'Create API Key' 또는 'API 키 만들기' 버튼을 클릭하세요.
                            </p>
                          </div>
                        </div>

                        {/* Step 4 */}
                        <div className="flex gap-3" id="step-4">
                          <span className="w-5 h-5 rounded bg-brand-blue/10 text-brand-blue font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                          <div className="space-y-1">
                            <span className="font-extrabold text-brand-slate">프로젝트 선택 후 생성</span>
                            <p className="text-brand-gray text-[11px] leading-relaxed">
                              기본 프로젝트를 선택하고 'Create API key in existing project'를 클릭하세요.
                            </p>
                          </div>
                        </div>

                        {/* Step 5 */}
                        <div className="flex gap-3" id="step-5">
                          <span className="w-5 h-5 rounded bg-brand-blue/10 text-brand-blue font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">5</span>
                          <div className="space-y-1">
                            <span className="font-extrabold text-brand-slate">API 키 복사</span>
                            <p className="text-brand-gray text-[11px] leading-relaxed">
                              생성된 API 키(AIza로 시작)를 복사하세요. 이 키를 입력창에 붙여넣기하면 됩니다!
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Big pill blue link button at the bottom of the steps */}
                      <a
                        href="https://aistudio.google.com/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full mt-2 flex items-center justify-center gap-2 bg-brand-blue/5 hover:bg-brand-blue/10 text-brand-blue font-black py-3 rounded-xl border border-brand-blue/15 text-xs transition-colors duration-200"
                        id="guide-pill-link"
                      >
                        🔑 API 키 발급 페이지로 이동
                      </a>
                    </motion.div>
                  )}
                </div>

                {/* Quick Demo Option inside form */}
                <div className="pt-4 mt-4 border-t border-brand-border/60 text-center" id="demo-mode-portal">
                  <span className="text-[11px] text-brand-gray block mb-3">설문 참여 없이 종합 진단 결과 화면과 기능을 먼저 보려면?</span>
                  <button
                    onClick={onDemo}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-brand-border text-xs font-bold text-brand-slate bg-brand-cream hover:bg-brand-beige active:scale-95 transition-all cursor-pointer"
                    id="btn-fast-demo"
                  >
                    <Sparkles size={12} className="text-brand-blue" />
                    <span>예시로 빠르게 보기 (데모 모드)</span>
                    <ArrowRight size={11} className="text-brand-gray" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Header active key panel status */}
                <div className="flex items-center justify-between bg-green-50/50 border border-green-200/60 rounded-xl p-3 mb-6 animate-pulse" id="api-key-connected-badge">
                  <div className="flex items-center gap-2 text-xs font-semibold text-green-800">
                    <CheckCircle size={15} className="text-green-600" />
                    <span>Gemini API 키 연결됨</span>
                  </div>
                  <button
                    onClick={handleChangeKey}
                    className="text-[11px] font-bold text-brand-blue hover:underline cursor-pointer"
                    id="btn-change-api-key"
                  >
                    변경하기
                  </button>
                </div>

                {/* Header tab switcher */}
                <div className="flex border-b border-brand-border mb-6" id="onboarding-tabs">
                  <button
                    onClick={() => setIsResuming(false)}
                    className={`flex-1 pb-3 text-center text-sm font-bold transition-all relative cursor-pointer ${!isResuming ? 'text-brand-blue font-black' : 'text-brand-gray hover:text-brand-slate'}`}
                    id="tab-new"
                  >
                    <span>새로 탐험하기</span>
                    {!isResuming && (
                      <motion.div layoutId="tab-underline" className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-blue" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsResuming(true)}
                    className={`flex-1 pb-3 text-center text-sm font-bold transition-all relative cursor-pointer ${isResuming ? 'text-brand-blue font-black' : 'text-brand-gray hover:text-brand-slate'}`}
                    id="tab-resume"
                  >
                    <span>기록 이어하기</span>
                    {isResuming && (
                      <motion.div layoutId="tab-underline" className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-blue" />
                    )}
                  </button>
                </div>

                {/* Error notifications block */}
                {errorMsg && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs font-semibold leading-relaxed" 
                    id="onboarding-error-box"
                  >
                    {errorMsg}
                  </motion.div>
                )}

                {!isResuming ? (
                  <div className="space-y-5 text-left" id="new-mode-fields">
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-brand-slate mb-1.5" htmlFor="nickname-input">
                        닉네임 (또는 이름) <span className="text-brand-blue">*</span>
                      </label>
                      <input
                        type="text"
                        id="nickname-input"
                        className="w-full bg-brand-cream border border-brand-border rounded-xl px-4 py-3 text-brand-slate focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all text-sm placeholder:text-brand-gray/50"
                        placeholder="예: 홍길동, 대장장"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-brand-slate mb-1.5" htmlFor="group-select">
                        참여 세션 / 회차 선택 <span className="text-brand-blue">*</span>
                      </label>
                      
                      <select
                        id="group-select"
                        className="w-full bg-brand-cream border border-brand-border rounded-xl px-4 py-3 text-brand-slate focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue mb-2.5 transition-all text-sm cursor-pointer"
                        value={group}
                        onChange={(e) => setGroup(e.target.value)}
                      >
                        <option value="">-- 직접 입력 또는 선택 --</option>
                        {standardGroups.map((sg, idx) => (
                          <option key={idx} value={sg}>{sg}</option>
                        ))}
                      </select>

                      <input
                        type="text"
                        id="group-text"
                        className="w-full bg-brand-cream border border-brand-border rounded-xl px-4 py-3 text-brand-slate focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all text-sm placeholder:text-brand-gray/50"
                        placeholder="회차명이 없거나 다를 경우 직접 기입"
                        value={group}
                        onChange={(e) => setGroup(e.target.value)}
                      />
                    </div>

                    <button
                      onClick={() => onJoin(nickname, group)}
                      disabled={!nickname.trim() || !group.trim()}
                      className="w-full flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-hover-blue text-white font-black py-4 rounded-xl shadow-xs transition-all duration-200 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-6 text-sm cursor-pointer"
                      id="btn-start"
                    >
                      <span>탐험 시작하기</span>
                      <Play size={14} fill="currentColor" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5 text-left" id="resume-mode-fields">
                    <p className="text-xs text-brand-gray mb-1 leading-relaxed">
                      지급받으셨거나 저장된 참여 코드를 입력하시면 기존 진행 내용에서 연속하여 여정을 이어나가실 수 있습니다.
                    </p>
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-brand-slate mb-1.5" htmlFor="code-input">
                        지급받은 참여 코드 (예: 홍길동-A3F9) <span className="text-brand-blue">*</span>
                      </label>
                      <input
                        type="text"
                        id="code-input"
                        className="w-full bg-brand-cream border border-brand-border rounded-xl px-4 py-3 text-brand-slate focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all text-sm placeholder:text-brand-gray/50"
                        placeholder="예: 홍길동-A3F9"
                        value={typedCode}
                        onChange={(e) => setTypedCode(e.target.value)}
                      />
                    </div>

                    <button
                      onClick={() => onResume(typedCode)}
                      disabled={!typedCode.trim()}
                      className="w-full flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-hover-blue text-white font-black py-4 rounded-xl shadow-xs transition-all duration-200 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-6 text-sm cursor-pointer"
                      id="btn-resume"
                    >
                      <span>기록 불러오기</span>
                      <LogIn size={15} />
                    </button>
                  </div>
                )}

                {/* Quick Demo Option inside form */}
                <div className="pt-6 mt-6 border-t border-brand-border/60 text-center" id="demo-mode-portal">
                  <span className="text-[11px] text-brand-gray block mb-3">설문 참여 없이 종합 진단 결과 화면과 기능을 먼저 보려면?</span>
                  <button
                    onClick={onDemo}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-brand-border text-xs font-bold text-brand-slate bg-brand-cream hover:bg-brand-beige active:scale-95 transition-all cursor-pointer"
                    id="btn-fast-demo"
                  >
                    <Sparkles size={12} className="text-brand-blue" />
                    <span>예시로 빠르게 보기 (데모 모드)</span>
                    <ArrowRight size={11} className="text-brand-gray" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

      </main>

      {/* Footer credits in layout */}
      <footer className="w-full text-center text-[10px] font-mono text-brand-gray/80 py-4 border-t border-brand-border/60 z-10" id="footer-disclaimer-info">
        <span>© 2026 LIFE 2ND ACT · ACTIVE PLATFORM PROJECT · ALL RIGHTS RESERVED.</span>
      </footer>
    </div>
  );
}
