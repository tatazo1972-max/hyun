import React, { useState, useEffect, useRef } from 'react';
import { Download, MessageSquare, Send, Sparkles, RefreshCw, Layers, CheckCircle2, Award, Calendar, ExternalLink, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { Participant, CardVersion, ChatMessage } from '../types';

interface ResultCardProps {
  participant: Participant;
  onUpdateParticipant: (updated: Participant) => void;
  onRestart: () => void;
  isDemo?: boolean;
}

export default function ResultCard({
  participant,
  onUpdateParticipant,
  onRestart,
  isDemo = false
}: ResultCardProps) {
  // Select active card version - default to the latest version
  const [selectedVerCode, setSelectedVerCode] = useState<string>('');
  const [chatMessage, setChatMessage] = useState('');
  const [isChatSubmitting, setIsChatSubmitting] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [pdfStatusStr, setPdfStatusStr] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Versions array
  const versions = participant.cardVersions || [];
  
  // Set default selection
  useEffect(() => {
    if (versions.length > 0) {
      setSelectedVerCode(versions[versions.length - 1].version);
    }
  }, [participant.cardVersions?.length]);

  // Scroll to chat bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [participant.chatHistory?.length]);

  const activeVer = versions.find(v => v.version === selectedVerCode) || versions[versions.length - 1];

  if (!activeVer) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-center">
        <div className="space-y-4">
          <Loader2 className="animate-spin text-amber-400 mx-auto" size={32} />
          <p className="text-xl font-light">설계 카드가 준비되지 않았습니다. 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const { cardContent } = activeVer;

  // Handle conversational chat message
  const handleSendMessage = async () => {
    if (!chatMessage.trim() || isChatSubmitting || isDemo) return;

    setIsChatSubmitting(true);
    const userMsg = chatMessage;
    setChatMessage('');

    try {
      const customKey = sessionStorage.getItem('gemini_api_key') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (customKey) {
        headers['x-gemini-api-key'] = customKey;
      }

      const response = await fetch(`/api/chat-message/${participant.id}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: userMsg })
      });

      if (response.ok) {
        const data = await response.json();
        onUpdateParticipant(data.participant);

        if (data.regenerated && data.newVersion) {
          // Playful alert/feedback & toggle to the newly calculated card version
          setSelectedVerCode(data.newVersion);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsChatSubmitting(false);
    }
  };

  // Helper function to download NanumGothic font and register it to jsPDF dynamically
  const fetchFontAndRegister = async (doc: any) => {
    setPdfStatusStr('한글 어울림 폰트 수령 중...');
    try {
      const fontUrl = 'https://raw.githubusercontent.com/google/fonts/main/ofl/nanumgothic/NanumGothic-Regular.ttf';
      const response = await fetch(fontUrl);
      const arrayBuffer = await response.arrayBuffer();
      
      let binary = '';
      const bytes = new Uint8Array(arrayBuffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = window.btoa(binary);
      
      doc.addFileToVFS('NanumGothic.ttf', base64);
      doc.addFont('NanumGothic.ttf', 'NanumGothic', 'normal');
      doc.setFont('NanumGothic');
      return true;
    } catch (error) {
      console.error("Font loading failure, attempting fallback:", error);
      return false;
    }
  };

  // Vector Based jsPDF Download Method - drawing lines, borders on A4 layout cleanly
  const handleDownloadPDF = async () => {
    if (isPdfGenerating) return;
    setIsPdfGenerating(true);
    setPdfStatusStr('시작하는 중...');

    // A4 dimensions: 210 x 297 mm
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const fontSuccess = await fetchFontAndRegister(doc);
    setPdfStatusStr('정밀 기획 서한 드로잉 중...');

    // Colors mapping
    const darkSlate = '#0f172a';
    const amberAccent = '#b45309';
    const grayBorder = '#cbd5e1';

    // Page margin limits
    const marginL = 15;
    const marginR = 195;
    const contentW = 180;
    
    let y = 15; // Vertical tracker

    // 1. Draw elegant background border frame
    doc.setDrawColor(218, 165, 32); // Gold border
    doc.setLineWidth(0.6);
    doc.rect(8, 8, 194, 281);

    doc.setDrawColor(15, 23, 42); // Navy inner sub-line
    doc.setLineWidth(0.15);
    doc.rect(9.5, 9.5, 191, 278);

    // Header Logo Ribbon
    doc.setFillColor(15, 23, 42);
    doc.rect(13, 13, 184, 15, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('LIFE 2ND ACT · ACTIVE ADVENTURE GUIDE', 16, 22.5);
    
    doc.setTextColor(252, 211, 77); // Yellow Gold
    doc.setFontSize(8);
    const verText = `발급 번호: ${participant.id} (버전: ${activeVer.version})`;
    doc.text(verText, 191 - doc.getTextWidth(verText), 22.5);

    y = 36;

    // 2. Main Large Certificate Title
    doc.setTextColor('#0f172a');
    doc.setFontSize(18);
    doc.text('평생현역 어드벤처 실행 설계서', 15, y);
    
    doc.setFontSize(8.5);
    doc.setTextColor('#475569');
    doc.text(`참여자: ${participant.nickname}님 (${participant.group})`, 15, y + 5.5);
    doc.text(`발행일자: ${new Date(activeVer.createdAt).toLocaleDateString('ko-KR')}`, 195 - doc.getTextWidth(`발행일자: ${new Date(activeVer.createdAt).toLocaleDateString('ko-KR')}`), y + 5.5);

    // Section draw line separation
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.line(15, y + 8, 195, y + 8);

    y += 14;

    // SECTION 1: 핵심 아이덴티티
    doc.setFillColor(248, 250, 252);
    doc.rect(15, y, 180, 26, 'F');
    doc.setDrawColor(180, 83, 9); // Amber Outline for Identity
    doc.setLineWidth(0.3);
    doc.rect(15, y, 180, 26);

    // Identity Content
    doc.setTextColor('#b45309');
    doc.setFontSize(8);
    doc.text('[핵심 평생현역 아이덴티티]', 18, y + 4.5);

    doc.setTextColor('#1e293b');
    doc.setFontSize(10);
    doc.text(`한 줄 브랜드: "${cardContent.identity.oneLineBrand}"`, 18, y + 10);
    doc.setFontSize(9);
    doc.text(`자기 서약 정의: "${cardContent.identity.selfDefinition}"`, 18, y + 15);
    doc.text(`사명 선언문(Why): ${cardContent.identity.mission}`, 18, y + 20);

    y += 31;

    // SECTION 2: 생애설계 7영역 현황
    doc.setTextColor('#0f172a');
    doc.setFontSize(9.5);
    doc.text('■ 생애설계 7영역 맞춤 진단', 15, y);
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.15);
    doc.line(15, y + 2, 195, y + 2);

    y += 6;

    // Draw 7-row table cleanly
    const areaLabels = [
      { k: '[의미]', v: cardContent.lifeAreas.meaning },
      { k: '[일/활동]', v: cardContent.lifeAreas.workActivity },
      { k: '[재무]', v: cardContent.lifeAreas.finance },
      { k: '[건강]', v: cardContent.lifeAreas.health },
      { k: '[관계]', v: cardContent.lifeAreas.relation },
      { k: '[여가]', v: cardContent.lifeAreas.leisure },
      { k: '[환경]', v: cardContent.lifeAreas.environment }
    ];

    areaLabels.forEach((area, i) => {
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y + (i * 6.5), 26, 6, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, y + (i * 6.5), 180, 6);

      doc.setTextColor('#0f172a');
      doc.setFontSize(7.5);
      doc.text(area.k, 18, y + (i * 6.5) + 4.2);

      doc.setTextColor('#334155');
      doc.setFontSize(7.5);
      
      // Multi-line slice check to avoid text overflow
      const cleanVal = area.v.length > 90 ? area.v.substring(0, 87) + "..." : area.v;
      doc.text(cleanVal, 44, y + (i * 6.5) + 4.2);
    });

    y += 52;

    // SECTION 3: 4대 핵심 역량 및 가용 인프라
    doc.setTextColor('#0f172a');
    doc.setFontSize(9.5);
    doc.text('■ 인생 2막의 4대 핵심 자산 및 가능성 활동군', 15, y);
    doc.setDrawColor(148, 163, 184);
    doc.line(15, y + 2, 195, y + 2);

    y += 6;

    // Draw beautiful bento grids inside pdf vectors
    doc.setDrawColor(203, 213, 225);
    doc.rect(15, y, 88, 32);
    doc.rect(107, y, 88, 32);

    doc.setFontSize(7.5);
    doc.setTextColor('#b45309');
    doc.text('【 4대 핵심 자산 축 요약 】', 18, y + 4.5);
    doc.setTextColor('#334155');
    
    const wrapCareer = doc.splitTextToSize(`경력자산: ${cardContent.fourAssets.careerAsset}`, 82);
    doc.text(wrapCareer, 18, y + 8.5);
    const wrapHidden = doc.splitTextToSize(`범용 가치화: ${cardContent.fourAssets.hiddenPotential}`, 82);
    doc.text(wrapHidden, 18, y + 16);
    const wrapRel = doc.splitTextToSize(`관계/인맥 조건: ${cardContent.fourAssets.relationAsset}`, 82);
    doc.text(wrapRel, 18, y + 23.5);

    doc.setTextColor('#b45309');
    doc.text('【 기대 활동군 등급 분석 】', 110, y + 4.5);
    doc.setTextColor('#334155');
    doc.text(`1순위 활동: ${cardContent.fourAssets.possibilityGroups.first}`, 110, y + 8.5);
    doc.text(`2순위 활동: ${cardContent.fourAssets.possibilityGroups.second}`, 110, y + 14);
    doc.text(`숨은 잠재력: ${cardContent.fourAssets.possibilityGroups.hidden}`, 110, y + 19.5);

    const healthMeaningWrap = doc.splitTextToSize(`*건강조건: ${cardContent.fourAssets.healthAsset} | *의미가치: ${cardContent.fourAssets.meaningAsset}`, 82);
    doc.text(healthMeaningWrap, 110, y + 25.5);

    y += 37;

    // SECTION 4: 평생현역 3트랙 및 기민한 실험
    doc.setTextColor('#0f172a');
    doc.setFontSize(9.5);
    doc.text('■ 평생현역 3트랙 융합 비즈니스 모델', 15, y);
    doc.setDrawColor(148, 163, 184);
    doc.line(15, y + 2, 195, y + 2);

    y += 6;

    // 3track items horizontal divider panels
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, 180, 24, 'F');
    doc.setDrawColor(148, 163, 184);
    doc.rect(15, y, 180, 24);

    doc.setFontSize(7.5);
    doc.setTextColor('#1e293b');
    const wrapLivelihood = doc.splitTextToSize(`生 생계형: ${cardContent.threeTracks.livelihoodTrack}`, 174);
    doc.text(wrapLivelihood, 18, y + 4.5);

    const wrapGrowth = doc.splitTextToSize(`活 성장형: ${cardContent.threeTracks.growthTrack}`, 174);
    doc.text(wrapGrowth, 18, y + 11);

    const wrapActivity = doc.splitTextToSize(`義 활동형: ${cardContent.threeTracks.activityTrack}`, 174);
    doc.text(wrapActivity, 18, y + 17.5);

    y += 28;

    // 2-week experiment sub box
    doc.setFillColor(254, 252, 243);
    doc.rect(15, y, 180, 11, 'F');
    doc.setDrawColor(180, 83, 9);
    doc.rect(15, y, 180, 11);

    doc.setTextColor('#b45309');
    doc.setFontSize(8);
    doc.text('2주 이내 즉시 가능한 첫 실험:', 18, y + 7);
    doc.setTextColor('#1e293b');
    doc.text(`"${cardContent.threeTracks.firstExperiment}" 구원 대상 ☞ ${cardContent.threeTracks.firstPracticeTarget}`, 62, y + 7);

    y += 17;

    // SECTION 5: 90일 실행 로드맵 및 채널 제안
    doc.setTextColor('#0f172a');
    doc.setFontSize(9.5);
    doc.text('■ 리스크 대비용 90일 다짐 로드맵 (확정 선언)', 15, y);
    doc.setDrawColor(148, 163, 184);
    doc.line(15, y + 2, 195, y + 2);

    y += 6;

    // Columns of roadmap
    const roadmapSteps = [
      { label: '[오늘]', text: cardContent.roadmap.today },
      { label: '[7일]', text: cardContent.roadmap.in7days },
      { label: '[30일]', text: cardContent.roadmap.in30days },
      { label: '[90일]', text: cardContent.roadmap.in90days }
    ];

    roadmapSteps.forEach((step, idx) => {
      doc.setFillColor(248, 250, 252);
      doc.rect(15 + (idx * 46), y, 42, 21, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(15 + (idx * 46), y, 42, 21);

      doc.setTextColor('#1e293b');
      doc.setFontSize(8.5);
      doc.text(step.label, 15 + (idx * 46) + 3, y + 4.5);

      doc.setTextColor('#475569');
      doc.setFontSize(7.2);
      const wrapText = doc.splitTextToSize(step.text, 36);
      doc.text(wrapText, 15 + (idx * 46) + 3, y + 9.2);
    });

    y += 28;

    // Recommended entry channel footnote
    doc.setTextColor('#475569');
    doc.setFontSize(7.5);
    doc.text('※ 공식 성가 제휴 추천 진입 채널: 중장년내일플러스센터 / 고용복지플러스센터(취업신청) / 탤런트뱅크 위원등록', 15, y);

    doc.setFillColor(15, 23, 42);
    doc.rect(15, y + 2.5, 180, 0.4, 'F');

    // Bottom signatures
    doc.setFontSize(7.5);
    doc.setTextColor('#64748b');
    doc.text('본 어드벤처 가이드는 귀하의 정당한 내력 자산을 검수하여 산출되었으며, 실천 계획에 따른 멋진 도전을 응원합니다.', 15, y + 7.5);

    // Save
    doc.save(`인생2막_평생현역_설계도_${participant.nickname}_${activeVer.version}.pdf`);
    
    setIsPdfGenerating(false);
    setPdfStatusStr('');
  };

  return (
    <div className="min-h-screen bg-brand-cream text-brand-slate flex flex-col md:flex-row" id="result-dashboard-root">
      
      {/* Left panel: Core Planner Card Dashboard Display */}
      <div className="flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full space-y-6" id="planner-card-area">
        
        {/* Branding header in card dashboard */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-brand-border pb-5" id="dashboard-header-inner">
          <div className="space-y-1">
            <span className="text-xs font-bold text-brand-gold flex items-center gap-1">
              <Award size={14} />
              <span>평생현역 완주 증서 발급 완료</span>
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-brand-blue">
              {participant.nickname}님의 평생현역 설계도
            </h1>
          </div>
          
          <div className="flex items-center gap-2.5">
            {isDemo && (
              <span className="px-3 py-1 bg-blue-50 text-brand-blue border border-brand-blue/20 rounded-full text-xs font-bold" id="demo-mode-badge">
                데모 체험 가이드
              </span>
            )}
            
            <button
              onClick={handleDownloadPDF}
              disabled={isPdfGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-brand-blue hover:bg-brand-hover-blue text-white rounded-xl text-sm font-bold shadow transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              id="btn-pdf-download"
            >
              {isPdfGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin text-white" />
                  <span className="text-xs font-normal text-white">{pdfStatusStr}</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>PDF 설계도 출력</span>
                </>
              )}
            </button>

            <button
              onClick={onRestart}
              className="p-2 bg-white hover:bg-brand-cream text-brand-slate rounded-xl border border-brand-border hover:text-brand-blue transition active:scale-95 cursor-pointer"
              id="btn-restart-adventure"
              title="처음부터 다시 시도하기"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Card Versions Multi Tabs Selection layout */}
        {versions.length > 1 && (
          <div className="flex items-center gap-2 bg-[#F7F2EB] border border-brand-border p-2.5 rounded-2xl" id="version-tabs-panel">
            <span className="text-xs text-brand-slate font-mono flex items-center gap-1 px-1 shrink-0">
              <Layers size={13} className="text-brand-gold" />
              <span>설계도 이력:</span>
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {versions.map((ver, idx) => (
                <button
                  key={ver.version}
                  onClick={() => setSelectedVerCode(ver.version)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedVerCode === ver.version ? 'bg-brand-gold text-brand-slate font-black scale-105' : 'bg-white text-brand-gray hover:bg-brand-cream border border-brand-border'}`}
                  id={`ver-tab-${ver.version}`}
                >
                  {ver.version} {idx === versions.length - 1 ? '(최신)' : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Document Credential View box */}
        <div className="bg-white border border-brand-border rounded-3xl p-6 sm:p-8 space-y-8 shadow-sm relative overflow-hidden" id="main-credential-frame">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-full filter blur-xl pointer-events-none" />
          
          {/* Certificate Header Tagline */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-brand-border/60 pb-5" id="cert-top-branding">
            <div className="text-[10px] font-mono tracking-widest text-[#718096] uppercase flex items-center gap-1.5 font-bold">
              <span>LIFE 2ND ACT · ACTIVE PLATFORM</span>
            </div>
            <div className="text-[10px] font-mono text-brand-gray font-semibold">
              코드: <span className="text-brand-gold font-bold">{participant.id}</span> · 발행: {activeVer.version}
            </div>
          </div>

          {/* Section 1: BRAND IDENTITY CHIP */}
          <div className="bg-[#F7F2EB] border border-brand-border p-6 rounded-2xl space-y-4 shadow-xs" id="section-identity">
            <div className="flex items-center gap-2">
              <Award className="text-brand-gold animate-pulse" size={18} />
              <span className="text-xs uppercase font-extrabold text-brand-gold tracking-wider">나만의 평생현역 브랜드</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-brand-blue" id="brand-title">
                "{cardContent.identity.oneLineBrand}"
              </h2>
              <p className="text-sm font-bold text-brand-slate italic" id="self-definition-txt">
                {cardContent.identity.selfDefinition}
              </p>
            </div>
            
            {/* Keywords row wrap */}
            <div className="flex flex-wrap gap-1.5 pt-1.5" id="keywords-container">
              {cardContent.identity.keywords.map((kw, i) => (
                <span 
                  key={i} 
                  className="text-[10px] font-bold px-2.5 py-1 rounded bg-white border border-brand-border/80 text-brand-slate"
                  id={`keyword-tag-${i}`}
                >
                  #{kw}
                </span>
              ))}
            </div>

            <div className="border-t border-brand-border/60 pt-3 text-xs text-brand-gray leading-relaxed" id="identity-mission">
              <span className="font-extrabold text-brand-gold mr-1">사명 선언(Why):</span>
              {cardContent.identity.mission}
            </div>
          </div>

          {/* Section 2: 7 Life Dimensions Matrix cards */}
          <div className="space-y-4" id="section-7-dimensions">
            <h3 className="text-sm font-black text-brand-blue flex items-center gap-1.5 border-b border-brand-border/60 pb-2">
              <CheckCircle2 size={15} className="text-brand-blue" />
              <span>생애설계 7영역 맞춤 조언</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5" id="grid-dimensions">
              
              <div className="bg-brand-cream border border-brand-border p-4 rounded-xl space-y-1.5 hover:shadow-xs transition-all">
                <span className="text-[10px] font-black text-cyan-600 uppercase tracking-widest">[의미]</span>
                <p className="text-xs text-brand-slate leading-relaxed font-medium">{cardContent.lifeAreas.meaning}</p>
              </div>

              <div className="bg-brand-cream border border-brand-border p-4 rounded-xl space-y-1.5 hover:shadow-xs transition-all">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">[일·활동]</span>
                <p className="text-xs text-brand-slate leading-relaxed font-medium">{cardContent.lifeAreas.workActivity}</p>
              </div>

              <div className="bg-brand-cream border border-brand-border p-4 rounded-xl space-y-1.5 hover:shadow-xs transition-all">
                <span className="text-[10px] font-black text-brand-gold uppercase tracking-widest">[재무]</span>
                <p className="text-xs text-brand-slate leading-relaxed font-medium">{cardContent.lifeAreas.finance}</p>
              </div>

              <div className="bg-brand-cream border border-brand-border p-4 rounded-xl space-y-1.5 hover:shadow-xs transition-all">
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">[건강]</span>
                <p className="text-xs text-brand-slate leading-relaxed font-medium">{cardContent.lifeAreas.health}</p>
              </div>

              <div className="bg-brand-cream border border-brand-border p-4 rounded-xl space-y-1.5 hover:shadow-xs transition-all">
                <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">[관계]</span>
                <p className="text-xs text-brand-slate leading-relaxed font-medium">{cardContent.lifeAreas.relation}</p>
              </div>

              <div className="bg-brand-cream border border-brand-border p-4 rounded-xl space-y-1.5 hover:shadow-xs transition-all">
                <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">[여가]</span>
                <p className="text-xs text-brand-slate leading-relaxed font-medium">{cardContent.lifeAreas.leisure}</p>
              </div>

              <div className="bg-brand-gold/5 border border-brand-gold/20 p-4 rounded-xl md:col-span-2 lg:col-span-3 space-y-1.5 hover:shadow-xs transition-all">
                <span className="text-[10px] font-black text-brand-gold uppercase tracking-widest">[피해야 할 스트레스 환경]</span>
                <p className="text-xs text-brand-slate font-bold leading-relaxed">{cardContent.lifeAreas.environment}</p>
              </div>

            </div>
          </div>

          {/* Section 3: Four Core Assets row */}
          <div className="space-y-4" id="section-four-assets">
            <h3 className="text-sm font-black text-brand-blue flex items-center gap-1.5 border-b border-brand-border/60 pb-2">
              <CheckCircle2 size={15} className="text-brand-blue" />
              <span>핵심 4대 자산 축 정의 및 자격</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="assets-split-bento">
              
              {/* Asset list */}
              <div className="bg-brand-cream p-5 rounded-2xl border border-brand-border text-xs space-y-3" id="asset-bullet-box">
                <span className="font-extrabold text-[#111827] block pb-1 border-b border-brand-border/60">【 자산 축 분석 】</span>
                
                <div className="space-y-1">
                  <span className="font-bold text-brand-slate block">1. 경력 기술 자산:</span>
                  <p className="text-brand-gray leading-relaxed text-[11px] font-medium">{cardContent.fourAssets.careerAsset}</p>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-brand-slate block">2. 숨겨진 역량 번역:</span>
                  <p className="text-brand-gray leading-relaxed text-[11px] font-medium">{cardContent.fourAssets.hiddenPotential}</p>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-brand-slate block">3. 관계 및 건강 자산:</span>
                  <p className="text-brand-gray leading-relaxed text-[11px] font-medium">{cardContent.fourAssets.relationAsset}</p>
                </div>
              </div>

              {/* Groups Choice */}
              <div className="bg-brand-cream p-5 rounded-2xl border border-brand-border text-xs space-y-3.5" id="activities-potential-box">
                <span className="font-extrabold text-[#111827] block pb-1 border-b border-brand-border/60">【 순위별 최적 활동 매핑 】</span>
                
                <div className="flex items-start gap-2.5">
                  <span className="px-2 py-0.5 rounded bg-brand-blue/10 text-brand-blue font-bold text-[10px] shrink-0">1순위</span>
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-brand-slate text-[11px]">주력 비즈니스군</span>
                    <p className="text-brand-gray leading-relaxed text-[11px] font-medium">{cardContent.fourAssets.possibilityGroups.first}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px] shrink-0">2순위</span>
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-brand-slate text-[11px]">조력 활동 영역</span>
                    <p className="text-brand-gray leading-relaxed text-[11px] font-medium">{cardContent.fourAssets.possibilityGroups.second}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="px-2 py-0.5 rounded bg-brand-gold/10 text-brand-gold font-bold text-[10px] shrink-0">숨김</span>
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-brand-slate text-[11px]">미발견 미지 가능성</span>
                    <p className="text-brand-gray leading-relaxed text-[11px] font-medium">{cardContent.fourAssets.possibilityGroups.hidden}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Section 4: concurrent 3 tracks */}
          <div className="space-y-4" id="section-three-tracks">
            <h3 className="text-sm font-black text-brand-blue flex items-center gap-1.5 border-b border-brand-border/60 pb-2">
              <CheckCircle2 size={15} className="text-brand-blue" />
              <span>평생현역 동시 가동 3대 트랙 (융합 원칙)</span>
            </h3>
            
            <div className="bg-brand-cream border border-brand-border p-5 rounded-2xl space-y-4" id="track-panels-layout">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                
                <div className="space-y-1.5 p-4 rounded-xl bg-white border border-brand-border shadow-xs">
                  <span className="font-extrabold text-brand-blue text-[13px] block border-b border-brand-border/60 pb-1 mb-1">生 생계형 트랙</span>
                  <p className="text-brand-slate text-[11px] leading-relaxed font-medium">{cardContent.threeTracks.livelihoodTrack}</p>
                </div>

                <div className="space-y-1.5 p-4 rounded-xl bg-white border border-brand-border shadow-xs">
                  <span className="font-extrabold text-emerald-700 text-[13px] block border-b border-brand-border/60 pb-1 mb-1">活 성장형 트랙</span>
                  <p className="text-brand-slate text-[11px] leading-relaxed font-medium">{cardContent.threeTracks.growthTrack}</p>
                </div>

                <div className="space-y-1.5 p-4 rounded-xl bg-white border border-brand-border shadow-xs">
                  <span className="font-extrabold text-brand-gold text-[13px] block border-b border-brand-border/60 pb-1 mb-1">義 활동형 트랙</span>
                  <p className="text-brand-slate text-[11px] leading-relaxed font-medium">{cardContent.threeTracks.activityTrack}</p>
                </div>

              </div>

              {/* 2-week experiment ribbon */}
              <div className="p-4 bg-brand-gold/5 rounded-xl border border-brand-gold/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs" id="experiment-foot-callout">
                <div className="space-y-0.5">
                  <span className="font-bold text-brand-gold block">■ 2주 내 가볍게 즉시 돌입할 첫 행동(첫 실험)</span>
                  <p className="text-brand-slate font-extrabold text-sm">"{cardContent.threeTracks.firstExperiment}"</p>
                </div>
                <div className="text-right sm:border-l sm:border-brand-border/80 sm:pl-4">
                  <span className="text-[10px] text-brand-gray block font-bold">의외의 구조 실천 수혜대상</span>
                  <span className="font-black text-brand-blue text-[12px]">{cardContent.threeTracks.firstPracticeTarget}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Roadmap */}
          <div className="space-y-4" id="section-90-days-roadmap">
            <h3 className="text-sm font-black text-brand-blue flex items-center gap-1.5 border-b border-brand-border/60 pb-2">
              <Calendar size={15} className="text-brand-blue" />
              <span>리스크 관리용 90일 다짐 선언식 (본인 서약 그대로 표출)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5" id="roadmap-timeline-grid">
              
              <div className="bg-brand-cream p-4 rounded-xl border border-brand-border text-xs space-y-1">
                <span className="font-black text-brand-blue uppercase block text-[11px] tracking-wide">[오늘 당장]</span>
                <p className="text-brand-slate leading-relaxed font-semibold text-[11px]">{cardContent.roadmap.today}</p>
              </div>

              <div className="bg-brand-cream p-4 rounded-xl border border-brand-border text-xs space-y-1">
                <span className="font-black text-brand-gold uppercase block text-[11px] tracking-wide">[7일 이내]</span>
                <p className="text-brand-slate leading-relaxed font-semibold text-[11px]">{cardContent.roadmap.in7days}</p>
              </div>

              <div className="bg-brand-cream p-4 rounded-xl border border-brand-border text-xs space-y-1">
                <span className="font-black text-emerald-700 uppercase block text-[11px] tracking-wide">[30일 이내]</span>
                <p className="text-brand-slate leading-relaxed font-semibold text-[11px]">{cardContent.roadmap.in30days}</p>
              </div>

              <div className="bg-brand-cream p-4 rounded-xl border border-brand-border text-xs space-y-1">
                <span className="font-black text-purple-700 uppercase block text-[11px] tracking-wide">[90일 이내]</span>
                <p className="text-brand-slate leading-relaxed font-semibold text-[11px]">{cardContent.roadmap.in90days}</p>
              </div>

            </div>

            {/* External suggested entry links footer list */}
            <div className="bg-brand-beige p-4 rounded-xl border border-brand-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs" id="official-external-channels">
              <span className="text-brand-slate font-bold">인생 2막 공식 진입 추천 공적 가점 채널망 바로가기:</span>
              <div className="flex flex-wrap items-center gap-3">
                <a 
                  href="https://www.work24.go.kr" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-1.5 text-brand-blue hover:text-brand-hover-blue transition-colors bg-white border border-brand-border px-3 py-1.5 rounded-lg shadow-xs font-bold"
                >
                  <span>중장년내일플러스센터</span>
                  <ExternalLink size={11} className="opacity-60" />
                </a>
                <a 
                  href="https://www.work.go.kr" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-1.5 text-brand-blue hover:text-brand-hover-blue transition-colors bg-white border border-brand-border px-3 py-1.5 rounded-lg shadow-xs font-bold"
                >
                  <span>고용복지플러스센터</span>
                  <ExternalLink size={11} className="opacity-60" />
                </a>
                <a 
                  href="https://www.talentbank.co.kr" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-1.5 text-brand-blue hover:text-brand-hover-blue transition-colors bg-white border border-brand-border px-3 py-1.5 rounded-lg shadow-xs font-bold"
                >
                  <span>탤런트뱅크 위원신청</span>
                  <ExternalLink size={11} className="opacity-60" />
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Right panel: Conversational Sidechat for fine-tuning card items */}
      <aside className="w-full md:w-[350px] lg:w-[400px] border-t md:border-t-0 md:border-l border-brand-border bg-white flex flex-col shrink-0 h-auto md:h-screen sticky top-0" id="assistant-sidechat-column">
        
        {/* Chat Panel Header - premium electric blue themed */}
        <div className="p-4 border-b border-brand-border shadow-xs shrink-0 flex items-center gap-2.5 bg-[#EBEFF5]" id="chat-side-header">
          <MessageSquare className="text-brand-blue animate-pulse" size={16} />
          <div className="text-left">
            <h4 className="text-xs font-black text-brand-blue uppercase font-mono tracking-tight">어드벤처 가이드 AI 파트너</h4>
            <p className="text-[10px] text-brand-slate font-bold opacity-80">설계도 미세 조율 및 경력 자문 창구</p>
          </div>
        </div>

        {/* Chat history area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-brand-cream" id="chat-messages-scrollarea">
          
          <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-brand-border text-xs text-brand-slate leading-relaxed text-left font-medium" id="chat-sidepanel-welcome">
            👋 참 수고 많으셨습니다, {participant.nickname}님!<br />
            설계된 카드 결과를 보시며 아쉽거나 수정하고 싶으신 점이 있으신가요?<br />
            <span className="text-brand-gold font-extrabold block mt-1.5">
              "사경 목표 수입을 변경하고 싶어", "생계형 다른 걸 알아볼래" 
            </span>
            처럼 말씀 주시면 Answers의 값을 척척 조정한 후 v2로 알아서 업데이트할 제안을 드릴게요!
          </div>

          <AnimatePresence initial={false}>
            {participant.chatHistory?.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                id={`chat-bubble-${i}`}
              >
                <span className="text-[9px] text-brand-gray font-bold mb-1">
                  {msg.role === 'user' ? '본인' : 'AI 멘토'}
                </span>
                <div className={`p-3 rounded-xl text-xs leading-relaxed whitespace-pre-line text-left shadow-xs ${msg.role === 'user' ? 'bg-brand-blue text-white rounded-br-none font-medium' : 'bg-white border border-brand-border text-brand-slate rounded-bl-none font-medium'}`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isChatSubmitting && (
            <div className="flex flex-col items-start gap-1 max-w-[85%] mr-auto text-left" id="chat-typing-spinner">
              <span className="text-[9px] text-brand-gray mb-1 font-bold">가이드 멘토 답변 작성중</span>
              <div className="p-3 rounded-xl bg-white border border-brand-border text-brand-gray text-xs flex items-center gap-1.5 rounded-bl-none font-medium shadow-xs">
                <Loader2 size={12} className="animate-spin text-brand-blue" />
                <span>답계 분석 및 업데이트 타진중...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input box */}
        <div className="p-4 border-t border-brand-border bg-[#EBEFF5] shrink-0" id="chat-input-panel">
          <div className="flex items-center gap-1.5 bg-white rounded-xl p-1.5 border border-brand-border focus-within:ring-2 focus-within:ring-brand-blue/30 transition-all shadow-xs">
            <input
              type="text"
              disabled={isChatSubmitting || isDemo}
              placeholder={isDemo ? "데모 모드에서는 대화가 잠깁니다." : "의견을 멘토와 조율해 보세요..."}
              className="flex-1 bg-transparent px-3 py-2 text-xs text-brand-slate focus:outline-none disabled:opacity-40 placeholder:text-brand-gray/40 font-medium"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              id="chat-input-box"
            />
            <button
              onClick={handleSendMessage}
              disabled={!chatMessage.trim() || isChatSubmitting || isDemo}
              className="p-2 rounded-lg bg-brand-blue hover:bg-brand-hover-blue text-white disabled:opacity-30 transition cursor-pointer"
              id="btn-chat-send"
            >
              <Send size={13} fill="currentColor" />
            </button>
          </div>
        </div>

      </aside>

    </div>
  );
}
