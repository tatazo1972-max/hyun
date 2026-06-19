import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Check, Sparkles, MessageSquare, ListTodo, BrainCircuit, ShieldAlert, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Participant, Answers } from '../types';
import { QUESTIONS, QuestionConfig } from '../data/questions';

interface ChatScreenProps {
  participant: Participant;
  onUpdateParticipant: (updated: Participant) => void;
  onSaveProgress: (answers: Answers, currentStep: number, subStep: number) => Promise<void>;
  onGenerateResultCard: () => Promise<void>;
  onQuit: () => void;
}

export default function ChatScreen({
  participant,
  onUpdateParticipant,
  onSaveProgress,
  onGenerateResultCard,
  onQuit
}: ChatScreenProps) {
  const [answers, setAnswers] = useState<Answers>(JSON.parse(JSON.stringify(participant.answers)));
  const [currentStep, setCurrentStep] = useState(participant.currentStep);
  const [subStep, setSubStep] = useState(participant.subStep);

  // UI state
  const [textVal, setTextVal] = useState('');
  const [selectedVals, setSelectedVals] = useState<string[]>([]);
  const [priorityVals, setPriorityVals] = useState<{ first: string; second: string }>({ first: '', second: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  // Step 2 Draft State
  const [draftDef, setDraftDef] = useState('');
  const [draftBrand, setDraftBrand] = useState('');

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Get current active question configuration
  const currentQ: QuestionConfig | undefined = QUESTIONS.find(
    q => q.step === currentStep && q.subStep === subStep
  );

  // Set titles for the 11 major steps (Step 0 to 10)
  const stepTitles = [
    "탐험 전 세션 기입", // 0
    "STEP 1. 핵심 커리어 자산 발굴", // 1
    "STEP 2. 나만의 한 줄 브랜드 & 자기정의", // 2
    "STEP 3. 인생 2막 의미 자산 발견", // 3
    "STEP 4. 소중한 지지인력 및 관계 자산", // 4
    "STEP 5. 최적 활동 성향 및 재무 진단", // 5
    "STEP 6. 지속가능 10년 건강 엔진 진단", // 6
    "STEP 7. 삶의 기쁨과 수렴 6대 키워드", // 7
    "STEP 8. 미래 기대 활동군 매핑", // 8
    "STEP 9. 평생현역 3대 연계 트랙(AI)", // 9
    "STEP 10. 리스크 대비 90일 실행 약속" // 10
  ];

  // Scroll to bottom when questions change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [currentStep, subStep, isSubmitting, aiAnalyzing]);

  // Synchronize input fields whenever question changes
  useEffect(() => {
    if (!currentQ) return;
    const ansObj = answers[`step${currentStep}` as keyof Answers] as any;
    const storedVal = ansObj ? ansObj[currentQ.field] : undefined;

    if (currentQ.type === 'text') {
      setTextVal(storedVal || '');
    } else if (currentQ.type === 'checkbox') {
      setSelectedVals(Array.isArray(storedVal) ? storedVal : []);
    } else if (currentQ.type === 'radio') {
      setTextVal(storedVal || '');
    } else if (currentQ.type === 'priority_picker') {
      setPriorityVals(storedVal || { first: '', second: '' });
    } else if (currentQ.type === 'draft_review') {
      // Handle in custom state
      setDraftDef(storedVal || ansObj.finalDefinition || '');
      setDraftBrand(ansObj.oneLineBrand || '');
    }
  }, [currentStep, subStep]);

  // Trigger Step 2 AI Draft Suggestion
  const triggerDraftSuggestion = async () => {
    setAiAnalyzing(true);
    try {
      const customKey = sessionStorage.getItem('gemini_api_key') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (customKey) {
        headers['x-gemini-api-key'] = customKey;
      }

      const response = await fetch('/api/suggest-draft', {
        method: 'POST',
        headers,
        body: JSON.stringify({ answers })
      });
      if (response.ok) {
        const data = await response.json();
        setDraftDef(data.draftDefinition);
        setDraftBrand(data.oneLineBrand);
        
        // Save initial suggestions
        const newAns = { ...answers };
        newAns.step2 = {
          ...newAns.step2,
          draftDefinition: data.draftDefinition,
          finalDefinition: data.draftDefinition,
          oneLineBrand: data.oneLineBrand
        };
        setAnswers(newAns);
        await onSaveProgress(newAns, currentStep, subStep);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Trigger Step 7 AI 6-aspect Summary
  const triggerStep7Summary = async (step7Ans: any) => {
    setAiAnalyzing(true);
    try {
      const customKey = sessionStorage.getItem('gemini_api_key') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (customKey) {
        headers['x-gemini-api-key'] = customKey;
      }

      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers,
        body: JSON.stringify({ answersStep7: step7Ans })
      });
      if (response.ok) {
        const data = await response.json();
        const newAns = { ...answers };
        newAns.step7 = {
          ...step7Ans,
          summary: data
        };
        setAnswers(newAns);
        await onSaveProgress(newAns, currentStep, subStep);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Trigger Step 8 AI Selection analysis
  const triggerStep8Analysis = async (selectedActs: string[]) => {
    setAiAnalyzing(true);
    try {
      const customKey = sessionStorage.getItem('gemini_api_key') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (customKey) {
        headers['x-gemini-api-key'] = customKey;
      }

      const response = await fetch('/api/analyze-step8', {
        method: 'POST',
        headers,
        body: JSON.stringify({ selectedActivities: selectedActs, answers })
      });
      if (response.ok) {
        const data = await response.json();
        const newAns = { ...answers };
        newAns.step8 = {
          selected: selectedActs,
          firstChoice: data.firstChoice,
          secondChoice: data.secondChoice,
          hiddenPotential: data.hiddenPotential
        };
        setAnswers(newAns);
        await onSaveProgress(newAns, currentStep, subStep);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Handle auto-trigger of AI draft creation when reaching step 2 draft suggestion
  useEffect(() => {
    if (currentStep === 2 && subStep === 1 && !answers.step2.finalDefinition) {
      triggerDraftSuggestion();
    }
  }, [currentStep, subStep]);

  // Handle "Next" traversal
  const handleNext = async () => {
    if (!currentQ && currentStep !== 9) return; // Allow step 9 view transition
    setIsSubmitting(true);

    try {
      const newAnswers = { ...answers };
      const stepKey = `step${currentStep}` as keyof Answers;

      if (currentStep === 9) {
        // Step 9 is reading slide, just advance to 10
        setCurrentStep(10);
        setSubStep(0);
        await onSaveProgress(newAnswers, 10, 0);
        setIsSubmitting(false);
        return;
      }

      // 1. Gather values and write answers cache
      if (currentQ!.type === 'text' || currentQ!.type === 'radio') {
        (newAnswers[stepKey] as any)[currentQ!.field] = textVal;
      } else if (currentQ!.type === 'checkbox') {
        (newAnswers[stepKey] as any)[currentQ!.field] = selectedVals;
      } else if (currentQ!.type === 'priority_picker') {
        (newAnswers[stepKey] as any)[currentQ!.field] = priorityVals;
      } else if (currentQ!.type === 'draft_review') {
        newAnswers.step2.finalDefinition = draftDef;
        newAnswers.step2.oneLineBrand = draftBrand;
      }

      setAnswers(newAnswers);

      // 2. Compute downstream effects before jumping steps
      // If we just finished STEP 7's last sub-question (subStep 3: aliveLookingMoment)
      if (currentStep === 7 && subStep === 3) {
        const s7Answers = {
          happyMoment: currentQ!.field === 'happyMoment' ? textVal : newAnswers.step7.happyMoment,
          longLikedThing: currentQ!.field === 'longLikedThing' ? textVal : newAnswers.step7.longLikedThing,
          freeActivity: currentQ!.field === 'freeActivity' ? textVal : newAnswers.step7.freeActivity,
          aliveLookingMoment: textVal
        };
        await triggerStep7Summary(s7Answers);
      }

      // If we just finished STEP 8's check (subStep 0: selected)
      if (currentStep === 8 && subStep === 0) {
        const selectedActs = selectedVals;
        await triggerStep8Analysis(selectedActs);
      }

      // 3. Determine next location coordinates in the 11 step model
      let nextStep = currentStep;
      let nextSubStep = subStep + 1;

      // Find if we have more sub-steps inside current major step
      const nextSubQExists = QUESTIONS.some(
        q => q.step === currentStep && q.subStep === nextSubStep
      );

      if (!nextSubQExists) {
        // Increment major step
        nextStep = currentStep + 1;
        nextSubStep = 0;
      }

      // If we finished step 10 (completed)
      if (currentStep === 10 && subStep === 3) {
        // Launch card generation!
        setAiAnalyzing(true);
        await onSaveProgress(newAnswers, 10, 3);
        await onGenerateResultCard();
        return;
      }

      // Normal traversal
      setCurrentStep(nextStep);
      setSubStep(nextSubStep);
      await onSaveProgress(newAnswers, nextStep, nextSubStep);

      // Reset local inputs
      setTextVal('');
      setSelectedVals([]);

    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle "Back" page traverse
  const handleBack = async () => {
    let prevStep = currentStep;
    let prevSubStep = subStep - 1;

    if (currentStep === 10 && subStep === 0) {
      // Go back to the Step 9 reading presentation
      setCurrentStep(9);
      setSubStep(0);
      await onSaveProgress(answers, 9, 0);
      return;
    }

    if (currentStep === 9) {
      // Go back to step 8
      setCurrentStep(8);
      setSubStep(0);
      await onSaveProgress(answers, 8, 0);
      return;
    }

    if (prevSubStep < 0) {
      prevStep = currentStep - 1;
      if (prevStep < 0) {
        // Go back to welcome start onboarding
        onQuit();
        return;
      }
      // Get max sub-step index of previous step
      const prevStepQs = QUESTIONS.filter(q => q.step === prevStep);
      prevSubStep = prevStepQs.length > 0 ? Math.max(...prevStepQs.map(q => q.subStep)) : 0;
    }

    setCurrentStep(prevStep);
    setSubStep(prevSubStep);
    await onSaveProgress(answers, prevStep, prevSubStep);
  };

  // Calculate overall program completion %
  const totalQuestionsListCount = QUESTIONS.length + 1; // +1 for the step 9 info slide
  const currentProgressRank = QUESTIONS.filter(
    q => q.step < currentStep || (q.step === currentStep && q.subStep < subStep)
  ).length + (currentStep > 9 ? 1 : 0);
  const progressPercent = Math.min(100, Math.round((currentProgressRank / totalQuestionsListCount) * 100));

  // Handle checkboxes selection
  const handleCheckboxToggle = (val: string, limit?: number) => {
    let currentSel = [...selectedVals];
    if (currentSel.includes(val)) {
      currentSel = currentSel.filter(item => item !== val);
    } else {
      if (limit && currentSel.length >= limit) {
        // Disallow going over limit
        if (limit === 2) {
          // Keep the newest, discard first
          currentSel = [currentSel[1], val];
        } else {
          return;
        }
      } else {
        currentSel.push(val);
      }
    }
    setSelectedVals(currentSel);
  };

  // Handle step 5 priority clicks
  const handlePriorityClick = (choice: string) => {
    const isFirst = priorityVals.first === choice;
    const isSecond = priorityVals.second === choice;

    if (isFirst) {
      setPriorityVals({ ...priorityVals, first: '' });
    } else if (isSecond) {
      setPriorityVals({ ...priorityVals, second: '' });
    } else {
      if (!priorityVals.first) {
        setPriorityVals({ ...priorityVals, first: choice });
      } else if (!priorityVals.second) {
        setPriorityVals({ ...priorityVals, second: choice });
      }
    }
  };

  // Determine if user can proceed
  const isInputValid = () => {
    if (aiAnalyzing || isSubmitting) return false;
    if (currentStep === 9) return true; // Reading screen

    if (currentQ?.type === 'text') {
      return textVal.trim().length >= 2;
    }
    if (currentQ?.type === 'radio') {
      return textVal.trim() !== '';
    }
    if (currentQ?.type === 'checkbox') {
      if (currentQ.limit) {
        return selectedVals.length === currentQ.limit;
      }
      return selectedVals.length >= 1;
    }
    if (currentQ?.type === 'priority_picker') {
      return priorityVals.first !== '' && priorityVals.second !== '';
    }
    if (currentQ?.type === 'draft_review') {
      return draftDef.trim().length > 10 && draftBrand.trim().length >= 2;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-brand-cream text-brand-slate flex flex-col justify-between" id="chat-session-root">
      
      {/* Top sticky guidance and progress status */}
      <header className="bg-[#F7F2EB] border-b border-brand-border p-4 sticky top-0 z-20 shadow-sm" id="chat-header">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 rounded bg-brand-blue/10 text-brand-blue border border-brand-blue/10 text-xs font-bold uppercase tracking-wider" id="header-stage-badge">
                설문 진행 단계
              </span>
              <h2 className="text-sm font-black text-brand-blue" id="header-stage-title">
                {stepTitles[currentStep]}
              </h2>
            </div>
            <button
              onClick={onQuit}
              className="text-xs text-brand-gray hover:text-brand-slate px-2.5 py-1.5 rounded-lg hover:bg-brand-cream border border-transparent hover:border-brand-border transition-all"
              id="btn-quit-chat"
            >
              나가기
            </button>
          </div>

          <div className="w-full flex items-center gap-3" id="progress-meter-container">
            <div className="flex-1 bg-white border border-brand-border h-3 rounded-full overflow-hidden">
              <motion.div 
                className="bg-brand-blue h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
                id="progress-bar-fill"
              />
            </div>
            <span className="text-xs font-mono font-bold text-brand-blue ml-1" id="progress-percentage">
              {progressPercent}%
            </span>
          </div>
        </div>
      </header>

      {/* Main Active Chat Body */}
      <main className="flex-1 overflow-y-auto p-6 flex flex-col justify-end" ref={chatContainerRef} id="chat-messages-scroller">
        <div className="max-w-2xl mx-auto w-full space-y-6 py-4">
          
          {/* Group previous steps summarizer as small speech bubbles */}
          <div className="text-center text-[11px] font-mono tracking-widest text-[#A0AEC0] pb-2 border-b border-brand-border">
            ▲ 탐험 정보 실시간 저장소 백엔드 전송 완료
          </div>

          {/* AI Message Bubble */}
          <div className="flex items-start gap-3.5" id="ai-message-turn">
            <div className="w-10 h-10 rounded-xl bg-white border border-brand-gold/30 text-brand-gold flex items-center justify-center shrink-0 shadow-md">
              <BrainCircuit size={20} />
            </div>
            <div className="bg-white border border-brand-border p-5 rounded-2xl rounded-tl-none max-w-[85%] text-brand-slate shadow-md relative leading-relaxed text-base" id="ai-message-bubble">
              <p className="font-normal whitespace-pre-line text-brand-slate">
                {currentStep === 9 
                  ? `${participant.nickname}님! 파악하신 6대 여정 속성과 강점을 결합해 평생현역 3대 동시 가동 트랙을 완성했습니다. 생계형 보살핌, 전문가 사명 전수, 기쁜 사회공헌이 유기적으로 어우러진 종합 전략을 카드에 실을 예정입니다. 확인하셨다면 로드맵 작성 단계로 넘어가 보겠습니다.` 
                  : currentQ?.aiMessage
                }
              </p>
              {aiAnalyzing && (
                <div className="mt-3 inline-flex items-center gap-2 text-xs text-brand-gold font-bold font-mono" id="ai-loading-alert">
                  <Loader2 size={12} className="animate-spin text-brand-gold" />
                  <span>AI 분석 엔진 구동중...</span>
                </div>
              )}
            </div>
          </div>

          {/* Render Customized Custom Inputs inside chat feed container */}
          <div className="ml-12 pt-2 animate-fade-in" id="chat-input-stage-injector">
            
            {/* Step 9 Presentation Slide Details */}
            {currentStep === 9 && (
              <div className="bg-white border border-brand-border p-5 rounded-2xl mb-4 text-left shadow-md space-y-4" id="step9-presentation-block">
                <div className="inline-flex items-center gap-1.5 text-xs text-brand-blue bg-brand-blue/5 p-1 px-3 rounded-full border border-brand-blue/15 font-bold">
                  <Sparkles size={12} className="text-brand-gold" />
                  <span>3트랙 연계 모델 개요</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-brand-cream p-3 rounded-xl border border-brand-border">
                    <span className="font-bold text-brand-blue block mb-1">生 생계형 트랙</span>
                    <span className="text-brand-slate">경력 바탕의 안정적 긱워크 및 파트타임 직무 수행</span>
                  </div>
                  <div className="bg-brand-cream p-3 rounded-xl border border-brand-border">
                    <span className="font-bold text-emerald-800 block mb-1">活 성장형 트랙</span>
                    <span className="text-brand-slate">후배 코칭, 맞춤 교재 제작 및 고문 강의 영역</span>
                  </div>
                  <div className="bg-brand-cream p-3 rounded-xl border border-brand-border">
                    <span className="font-bold text-brand-gold block mb-1">義 활동형 트랙</span>
                    <span className="text-brand-slate">수익을 지양하더라도 보람과 사람을 모으는 공헌</span>
                  </div>
                </div>
                <p className="text-[11px] text-brand-gray leading-normal">
                  * 이 3가지 트랙은 분절적으로 하나만 택하는 것이 아니라, 요일별/시간별로 유기적으로 결합하여 상호 보완적으로 작동하도록 설계되는 '동시 운영 원칙'을 가집니다.
                </p>
              </div>
            )}

            {/* Step 2-A Draft Suggestion Edit Layer */}
            {currentStep === 2 && subStep === 1 && (
              <div className="bg-[#F7F2EB] border border-brand-border rounded-2xl p-5 mb-4 space-y-4 text-left shadow-lg" id="step2-draft-reviewer">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-blue font-bold flex items-center gap-1.5">
                    <Sparkles size={14} className="text-brand-gold" />
                    <span>AI 디자인 전문가 브랜딩 초안</span>
                  </span>
                  <button 
                    onClick={triggerDraftSuggestion}
                    className="text-xs text-brand-slate bg-white hover:bg-brand-cream font-bold border border-brand-border rounded px-2.5 py-1"
                    id="btn-re-suggest"
                  >
                    초안 다시 짜기
                  </button>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-brand-slate mb-1">
                      1. 평생현역 한 줄 브랜드 이름 (자랑스런 전문성 집약)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white border border-brand-border rounded-xl px-3.5 py-2.5 text-brand-slate focus:ring-2 focus:ring-brand-gold focus:outline-none font-medium"
                      value={draftBrand}
                      onChange={(e) => setDraftBrand(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-brand-slate mb-1">
                      2. 평생현역 자기정의 서약 문장 (본인 소신에 맞춰 최종 조율)
                    </label>
                    <textarea
                      rows={3}
                      className="w-full bg-white border border-brand-border rounded-xl px-3.5 py-2.5 text-brand-slate focus:ring-2 focus:ring-brand-gold focus:outline-none text-sm leading-relaxed font-medium"
                      value={draftDef}
                      onChange={(e) => setDraftDef(e.target.value)}
                    />
                    <span className="text-[9px] text-brand-gray block mt-1">
                      * 형식 가이드: "나는 [ ] 문제를 해결해 온 전문가이다." 문구가 완전히 어울리도록 수정하면 더 매력적입니다.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 1. Standard TEXT input field */}
            {currentQ?.type === 'text' && (
              <div className="space-y-2 text-left" id="text-input-field">
                <span className="block text-xs font-bold text-brand-blue mb-1.5 uppercase tracking-wider">
                  {currentQ.userPromptLabel}
                </span>
                <textarea
                  className="w-full bg-white border border-brand-border rounded-2xl px-4 py-3.5 text-brand-slate focus:outline-none focus:ring-2 focus:ring-brand-gold placeholder:text-brand-gray/40 shadow-inner text-base resize-none"
                  rows={3}
                  placeholder={currentQ.placeholder}
                  value={textVal}
                  onChange={(e) => setTextVal(e.target.value)}
                />
                <div className="flex justify-between items-center text-[11px] text-brand-gray px-1">
                  <span>* 2자 이상 정성스럽게 작성 후 다음 이동</span>
                  <span className="font-bold">{textVal.trim().length} 자</span>
                </div>
              </div>
            )}

            {/* 2. Standard RADIO input choices */}
            {currentQ?.type === 'radio' && (
              <div className="space-y-3.5 text-left" id="radio-input-field">
                <span className="block text-xs font-bold text-brand-blue mb-1.5 uppercase tracking-wider">
                  {currentQ.userPromptLabel}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentQ.options?.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTextVal(opt)}
                      className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all text-sm font-semibold ${textVal === opt ? 'bg-[#F7F2EB] border-brand-gold text-brand-blue shadow-sm' : 'bg-white border-brand-border text-brand-slate hover:border-brand-gold hover:text-brand-blue'}`}
                    >
                      <span>{opt}</span>
                      {textVal === opt && <Check size={16} className="text-brand-gold stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Standard CHECKBOX input choices */}
            {currentQ?.type === 'checkbox' && (
              <div className="space-y-3.5 text-left" id="checkbox-input-field">
                <span className="block text-xs font-bold text-brand-blue mb-1.5 uppercase tracking-wider">
                  {currentQ.userPromptLabel}{' '}
                  <span className="text-brand-gold text-[10px] font-bold">
                    (반드시 {currentQ.limit ? `${currentQ.limit}개` : '1개 이상'} 지정)
                  </span>
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {currentQ.options?.map((opt, idx) => {
                    const isChecked = selectedVals.includes(opt);
                    return (
                      <button
                        key={idx}
                        onClick={() => handleCheckboxToggle(opt, currentQ.limit)}
                        className={`flex items-center justify-between p-3.5 px-4.5 rounded-xl border text-left transition-all text-sm font-medium ${isChecked ? 'bg-[#F7F2EB] border-brand-gold text-brand-blue shadow-sm' : 'bg-white border-brand-border text-brand-slate hover:border-brand-gold'}`}
                      >
                        <span>{opt}</span>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isChecked ? 'bg-brand-gold border-brand-gold text-white' : 'border-brand-border bg-white'}`}>
                          {isChecked && <Check size={14} strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Priority Picker UI for Step 5 */}
            {currentQ?.type === 'priority_picker' && (
              <div className="space-y-4 text-left" id="priority-picker-input-field">
                <span className="block text-xs font-bold text-brand-blue mb-1.5 uppercase tracking-wider">
                  {currentQ.userPromptLabel}{' '}
                  <span className="text-emerald-700 text-[10px] font-bold">(1순위와 2순위 순서대로 차례로 누르세요)</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {currentQ.options?.map((opt, idx) => {
                    const isFirst = priorityVals.first === opt;
                    const isSecond = priorityVals.second === opt;

                    return (
                      <button
                        key={idx}
                        onClick={() => handlePriorityClick(opt)}
                        className={`p-4 rounded-xl border text-left transition-all relative font-medium ${isFirst ? 'bg-[#F7F2EB] border-brand-gold text-brand-blue font-bold shadow-sm' : isSecond ? 'bg-emerald-50/65 border-emerald-400 text-emerald-900 font-bold shadow-sm' : 'bg-white border-brand-border text-brand-slate hover:border-brand-gold'}`}
                      >
                        <div className="text-sm pr-10">{opt}</div>
                        {isFirst && (
                          <span className="absolute top-3 right-3 bg-brand-gold text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                            1순위
                          </span>
                        )}
                        {isSecond && (
                          <span className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                            2순위
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-brand-border text-xs flex flex-col gap-2 font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="text-brand-gold font-bold">[1순위 입력]</span>
                    <span className="text-brand-slate font-medium">{priorityVals.first || "상자를 눌러 가치를 정하세요"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-600 font-bold">[2순위 입력]</span>
                    <span className="text-brand-slate font-medium">{priorityVals.second || "상자를 눌러 가치를 정하세요"}</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Buttons Controller Footer */}
      <footer className="bg-[#F7F2EB] border-t border-brand-border p-4 sticky bottom-0 z-20 shadow-md" id="chat-footer-controls">
        <div className="max-w-2xl mx-auto w-full flex items-center justify-between gap-4">
          <button
            onClick={handleBack}
            disabled={isSubmitting || aiAnalyzing}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-brand-border bg-white text-brand-slate hover:bg-brand-cream active:scale-95 transition disabled:opacity-30 disabled:pointer-events-none font-bold"
            id="chat-btn-back"
          >
            <ArrowLeft size={16} />
            <span>이전으로</span>
          </button>

          <button
            onClick={handleNext}
            disabled={!isInputValid()}
            className="flex-1 flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-hover-blue text-white font-bold py-3.5 px-6 rounded-xl transition shadow-md active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none text-base"
            id="chat-btn-next"
          >
            <span>
              {currentStep === 10 && subStep === 3 
                ? '최종 평생현역 설계도 발급' 
                : currentStep === 9 
                ? '로드맵 승인 및 단계 이동' 
                : '입력 완료하고 다음'
              }
            </span>
            <ArrowRight size={18} />
          </button>
        </div>
      </footer>
    </div>
  );
}
