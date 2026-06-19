import React, { useState, useEffect } from 'react';
import { Lock, FileSpreadsheet, Users, PieChart, ChevronDown, ChevronUp, MessageSquare, ListTodo, LogOut, ArrowRightLeft, Sparkles, LayoutGrid, CheckSquare, Loader2 } from 'lucide-react';
import { Participant } from '../types';

interface AdminScreenProps {
  onBackToMain: () => void;
}

export default function AdminScreen({ onBackToMain }: AdminScreenProps) {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  // Data states
  const [participantsList, setParticipantsList] = useState<Participant[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [groupOptions, setGroupOptions] = useState<string[]>([]);
  const [statsData, setStatsData] = useState<any>(null);
  const [activeDetailsRowId, setActiveDetailsRowId] = useState<string | null>(null);

  // Verify password with backend
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthorizing) return;
    setIsAuthorizing(true);
    setAuthError('');

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        setIsAuthenticated(true);
        fetchAdminData();
      } else {
        const err = await response.json();
        setAuthError(err.error || "비밀번호가 일치하지 않습니다.");
      }
    } catch (err) {
      setAuthError("서버와의 보안 통신에 실패했습니다.");
    } finally {
      setIsAuthorizing(false);
    }
  };

  // Fetch admin and stats datasets
  const fetchAdminData = async (grp: string = selectedGroup) => {
    try {
      // 1. Fetch participants list
      const listRes = await fetch(`/api/admin/participants?password=${encodeURIComponent(password)}&group=${encodeURIComponent(grp)}`);
      if (listRes.ok) {
        const list = await listRes.json();
        setParticipantsList(list);

        // Deduplicate workshop groups to select dropdown
        if (groupOptions.length === 0) {
          const uniqueGroups: string[] = Array.from(new Set(list.map((p: Participant) => p.group))).filter(Boolean) as string[];
          setGroupOptions(uniqueGroups);
        }
      }

      // 2. Fetch aggregation statistics analytics
      const statsRes = await fetch(`/api/admin/stats?password=${encodeURIComponent(password)}&group=${encodeURIComponent(grp)}`);
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setStatsData(stats);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger group filters
  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminData(selectedGroup);
    }
  }, [selectedGroup, isAuthenticated]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    setParticipantsList([]);
    setStatsData(null);
  };

  // UI rendering login panel
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-brand-cream text-brand-slate flex items-center justify-center p-6 relative overflow-hidden" id="admin-auth-panel">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-gold/10 rounded-full filter blur-[150px] pointer-events-none" />
        
        <div className="max-w-md mx-auto w-full bg-[#F7F2EB] border border-brand-border p-8 rounded-3xl shadow-xl relative" id="auth-lock-card">
          <div className="text-center space-y-3 mb-8">
            <div className="w-12 h-12 bg-white text-brand-gold border border-brand-gold/30 rounded-2xl flex items-center justify-center mx-auto shadow-md">
              <Lock size={20} />
            </div>
            <h2 className="text-xl font-bold text-brand-blue">행사 강사관리자 인증 통제</h2>
            <p className="text-xs text-brand-gray">참여자 통계집계 및 정밀 CSV 데이터 다운로드를 위한 비밀보안창</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-5" id="auth-form">
            <div>
              <label className="block text-[11px] font-bold text-brand-slate uppercase tracking-wider mb-2" htmlFor="admin-pw">
                관리자 통제 키 (ADMIN_PASSWORD)
              </label>
              <input
                type="password"
                id="admin-pw"
                className="w-full bg-white border border-brand-border rounded-xl px-4 py-3 text-brand-slate focus:outline-none focus:ring-2 focus:ring-brand-gold text-center text-sm font-mono placeholder:text-brand-gray/30"
                placeholder="마스터 키를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {authError && (
              <p className="text-xs text-red-800 text-center bg-red-55/60 p-2.5 rounded-lg border border-red-200 animate-pulse">
                {authError}
              </p>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onBackToMain}
                className="flex-1 bg-white border border-brand-border hover:bg-brand-cream text-brand-slate py-3 rounded-xl text-xs font-bold transition"
                id="btn-auth-back"
              >
                메인홈구절
              </button>
              <button
                type="submit"
                disabled={isAuthorizing || !password.trim()}
                className="flex-[2] bg-brand-blue hover:bg-brand-hover-blue text-white py-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                id="btn-auth-confirm"
              >
                {isAuthorizing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>진위 타진 중...</span>
                  </>
                ) : (
                  <span>관리자 채널 개방</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream text-brand-slate flex flex-col justify-between" id="admin-dashboard-container">
      
      {/* Top micro panel admin */}
      <header className="bg-[#F7F2EB] border-b border-brand-border p-4 sticky top-0 z-20 shadow-sm" id="admin-header">
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-1 px-2 text-brand-blue bg-blue-50 border border-brand-blue/20 rounded font-mono text-[10px] font-bold tracking-widest uppercase">
              MASTER CONSOLE
            </span>
            <h1 className="text-lg font-black text-brand-blue">행사 강사 대시보드</h1>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto" id="admin-top-controls">
            {/* Filter */}
            <select
              className="bg-white border border-brand-border text-xs rounded-xl px-3 py-2 text-brand-slate focus:ring-1 focus:ring-brand-gold outline-none w-full sm:w-auto shrink-0 font-bold"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              id="admin-group-filter"
            >
              <option value="all">전체 행사 그룹 / 세션</option>
              {groupOptions.map(go => (
                <option key={go} value={go}>{go}</option>
              ))}
            </select>

            <a
              href={`/api/admin/export-csv?password=${encodeURIComponent(password)}&group=${encodeURIComponent(selectedGroup)}`}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-xl shadow shrink-0 active:scale-95 transition"
              id="btn-export-csv"
            >
              <FileSpreadsheet size={13} />
              <span>진도부 Excel 다운로드</span>
            </a>

            <button
              onClick={handleLogout}
              className="p-2 bg-white hover:bg-red-50 hover:text-red-500 border border-brand-border rounded-xl transition duration-200"
              id="btn-admin-logout"
              title="관리자 세션 닫기"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Stats body */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-6" id="admin-main-grid">
        
        {/* Core Stat numbers panels */}
        {statsData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="stats-numbers-deck">
            <div className="bg-white border border-brand-border p-5 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="space-y-1.5">
                <span className="text-xs text-brand-gray font-bold uppercase tracking-wider">총 동참 인원</span>
                <p className="text-2xl font-black text-brand-blue">{statsData.total} 명</p>
              </div>
              <Users size={32} className="opacity-30 text-brand-gold" />
            </div>

            <div className="bg-white border border-brand-border p-5 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="space-y-1.5">
                <span className="text-xs text-brand-gray font-bold uppercase tracking-wider">최종 완주자 비율 (카드발급 완료)</span>
                <p className="text-2xl font-black text-emerald-600">
                  {statsData.total > 0 ? Math.round((statsData.completed / statsData.total) * 100) : 0}% 
                  <span className="text-xs font-normal text-brand-gray ml-1.5">({statsData.completed}명)</span>
                </p>
              </div>
              <Sparkles size={32} className="opacity-30 text-emerald-600" />
            </div>

            <div className="bg-white border border-brand-border p-5 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="space-y-1.5">
                <span className="text-xs text-brand-gray font-bold uppercase tracking-wider">설문 가동 중</span>
                <p className="text-2xl font-black text-sky-600">{statsData.inProgress} 명</p>
              </div>
              <ArrowRightLeft size={32} className="opacity-30 text-sky-600" />
            </div>
          </div>
        )}

        {/* Dynamic Aggregated CSS Bar Charts list */}
        {statsData && statsData.total > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="stats-aggregate-charts">
            
            {/* Chart 1: Core Skills */}
            <div className="bg-white border border-brand-border p-5 rounded-3xl shadow-sm space-y-4">
              <span className="text-xs font-bold text-brand-blue flex items-center gap-1">
                <LayoutGrid size={13} className="text-brand-gold" />
                <span>STEP 1. 핵심 커리어 다변화 자산 분류 비율 (동참원 중 선택비율)</span>
              </span>
              <div className="space-y-2.5">
                {Object.entries(statsData.coreSkills || {}).map(([skill, count]: [any, any]) => {
                  const perc = Math.round((count / statsData.total) * 100);
                  return (
                    <div key={skill} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-brand-slate">
                        <span>{skill}</span>
                        <span className="font-bold text-brand-blue">{count}명 ({perc}%)</span>
                      </div>
                      <div className="w-full bg-[#F7F2EB] h-2.5 rounded-full overflow-hidden border border-brand-border">
                        <div className="bg-brand-gold h-full rounded-full" style={{ width: `${perc}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 2: Future Expectations */}
            <div className="bg-white border border-brand-border p-5 rounded-3xl shadow-sm space-y-4">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                <CheckSquare size={13} className="text-emerald-600" />
                <span>STEP 8. 미래 지향 기대 활동군 선정 비율</span>
              </span>
              <div className="space-y-2.5">
                {Object.entries(statsData.activities || {}).map(([act, count]: [any, any]) => {
                  const perc = Math.round((count / statsData.total) * 100);
                  return (
                    <div key={act} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-brand-slate">
                        <span>{act}</span>
                        <span className="font-bold text-emerald-800">{count}명 ({perc}%)</span>
                      </div>
                      <div className="w-full bg-[#F7F2EB] h-2.5 rounded-full overflow-hidden border border-brand-border">
                        <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${perc}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 3: financialPriority */}
            <div className="bg-white border border-brand-border p-5 rounded-3xl shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-sky-850 flex items-center gap-1 pb-1">
                <PieChart size={13} className="text-sky-500" />
                <span>STEP 5. 재무적 1순위 타겟 우선순위 분화</span>
              </h4>
              <div className="space-y-2.5">
                {Object.entries(statsData.financialPriority || {}).map(([pri, count]: [any, any]) => {
                  const perc = Math.round((count / statsData.total) * 100);
                  return (
                    <div key={pri} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-brand-slate">
                        <span>{pri}</span>
                        <span className="font-bold text-sky-850">{perc}%</span>
                      </div>
                      <div className="w-full bg-[#F7F2EB] h-2 rounded-full overflow-hidden border border-brand-border">
                        <div className="bg-sky-500 h-full rounded-full" style={{ width: `${perc}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 4: targetIncome */}
            <div className="bg-white border border-brand-border p-5 rounded-3xl shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-purple-800 flex items-center gap-1 pb-1">
                <PieChart size={13} className="text-purple-650" />
                <span>STEP 5. 참여자 희망 최소 목표선 소득단위</span>
              </h4>
              <div className="space-y-2.5">
                {Object.entries(statsData.targetIncome || {}).map(([inc, count]: [any, any]) => {
                  const perc = Math.round((count / statsData.total) * 100);
                  return (
                    <div key={inc} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-brand-slate">
                        <span>{inc}</span>
                        <span className="font-bold text-purple-850">{perc}%</span>
                      </div>
                      <div className="w-full bg-[#F7F2EB] h-2 rounded-full overflow-hidden border border-brand-border">
                        <div className="bg-purple-500 h-full rounded-full" style={{ width: `${perc}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* Dynamic Participant Row items */}
        <div className="bg-white border border-brand-border rounded-3xl p-6 shadow-sm space-y-4" id="participants-list-block">
          <span className="text-xs uppercase font-extrabold text-brand-gray tracking-wider block mb-2">
            탐험 완료 및 가동중 동참 원부 ({participantsList.length}명)
          </span>
          
          <div className="overflow-x-auto w-full" id="table-outer">
            <table className="w-full text-xs text-left border-collapse" id="table-admin-participants">
              <thead className="bg-[#F7F2EB] text-brand-blue border-b border-brand-border">
                <tr>
                  <th className="p-4 rounded-tl-xl font-bold uppercase tracking-wider">닉네임 / ID코드</th>
                  <th className="p-4 font-bold uppercase tracking-wider">단체 / 세션</th>
                  <th className="p-4 text-center font-bold uppercase tracking-wider">현재 단계</th>
                  <th className="p-4 text-center font-bold uppercase tracking-wider">상태</th>
                  <th className="p-4 text-center font-bold uppercase tracking-wider">발급 카드수</th>
                  <th className="p-4 rounded-tr-xl text-center font-bold uppercase tracking-wider">세부 기획서</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {participantsList.map((p) => {
                  const isExpanded = activeDetailsRowId === p.id;
                  
                  return (
                    <React.Fragment key={p.id}>
                      <tr className="hover:bg-[#FDFBF7] group transition-all text-brand-slate">
                        <td className="p-4 font-bold text-brand-blue whitespace-nowrap">
                          {p.nickname} <span className="block text-[10px] text-brand-gray font-mono font-normal">{p.id}</span>
                        </td>
                        <td className="p-4 text-brand-slate font-medium">{p.group}</td>
                        <td className="p-4 text-center font-mono font-bold text-brand-gold">
                          {p.currentStep} / 10
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${p.status === 'card_ready' || p.status === 'completed' ? 'bg-emerald-50 text-emerald-850 border border-emerald-200' : 'bg-brand-cream text-brand-gray border border-brand-border'}`}>
                            {p.status === 'card_ready' || p.status === 'completed' ? '발급 완료' : '진행 중'}
                          </span>
                        </td>
                        <td className="p-4 text-center font-bold text-brand-blue">{p.cardVersions?.length || 0} 개</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => setActiveDetailsRowId(isExpanded ? null : p.id)}
                            className="inline-flex items-center gap-1 bg-white hover:bg-brand-cream text-[10px] font-bold px-3 py-1.5 rounded-lg transition border border-brand-border shadow-xs cursor-pointer"
                            id={`btn-expand-${p.id}`}
                          >
                            <span>조회</span>
                            {isExpanded ? <ChevronUp size={11} className="text-brand-gold" /> : <ChevronDown size={11} className="text-brand-gold" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded drawer details block */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-[#FDFBF7] p-6 border-b border-brand-border shadow-inner">
                            <div className="space-y-6 text-left" id={`details-drawer-${p.id}`}>
                              
                              <div className="flex items-center justify-between border-b border-brand-border pb-3" id="drawer-top">
                                <h4 className="font-bold text-sm text-brand-blue">
                                  "{p.nickname}" 탐험 정보 세부 검수 결과창
                                </h4>
                                <span className="text-[10px] text-brand-gray font-mono">시작일자: {new Date(p.createdAt || '').toLocaleString()}</span>
                              </div>

                              {/* Answers structured grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="drawer-answers-list">
                                <div className="space-y-3">
                                  <h5 className="font-bold text-xs text-brand-gray uppercase tracking-widest">[핵심 경력 및 자산]</h5>
                                  <div className="space-y-2 bg-white border border-brand-border p-4 rounded-xl text-xs text-brand-slate shadow-xs">
                                    <div><span className="text-brand-gray font-bold">· 기존 경력:</span> {p.answers.step0?.career || "미작성"}</div>
                                    <div><span className="text-brand-gray font-bold">· 연령/퇴직:</span> {p.answers.step0?.ageGroup || "N/A"} / {p.answers.step0?.retirementStatus || "N/A"}</div>
                                    <div><span className="text-brand-gray font-bold">· 강점 대분류(2):</span> {p.answers.step1?.coreSkills?.join(", ") || "N/A"}</div>
                                    <div><span className="text-brand-gray font-bold">· 오랜 반복업무:</span> {p.answers.step1?.repeatedTask || "미작성"}</div>
                                    <div><span className="text-brand-gray font-bold">· 남이자주묻는것:</span> {p.answers.step1?.askedByOthers || "미작성"}</div>
                                    <div><span className="text-brand-gray font-bold">· 가장자랑스런보람:</span> {p.answers.step1?.proudAchievement || "미작성"}</div>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <h5 className="font-bold text-xs text-brand-gray uppercase tracking-widest">[의미, 목표, 로드맵]</h5>
                                  <div className="space-y-2 bg-white border border-brand-border p-4 rounded-xl text-xs text-brand-slate shadow-xs">
                                    <div><span className="text-brand-gray font-bold">· 2막 자기서약:</span> {p.answers.step2?.finalDefinition || "N/A"}</div>
                                    <div><span className="text-brand-gray font-bold">· 응원대상 및 Why:</span> {p.answers.step3?.personToHelp || "N/A"} &rArr; {p.answers.step3?.whyHelp || "N/A"}</div>
                                    <div><span className="text-brand-gray font-bold">· 희망 소득목표:</span> {p.answers.step5?.targetIncome || "N/A"}</div>
                                    <div><span className="text-brand-gray font-bold">· 1순위/2순위재무:</span> {p.answers.step5?.financialPriority?.first || "N/A"} / {p.answers.step5?.financialPriority?.second || "N/A"}</div>
                                    <div><span className="text-brand-gray font-bold">· 90일 다짐:</span> {p.answers.step10?.in90days || "N/A"}</div>
                                  </div>
                                </div>
                              </div>

                              {/* Version snapshot review */}
                              {p.cardVersions && p.cardVersions.length > 0 && (
                                <div className="space-y-3">
                                  <h5 className="font-bold text-xs text-brand-gray uppercase tracking-widest">[최종 발급 설계도 콘텐츠]</h5>
                                  <div className="bg-white border border-brand-border p-5 rounded-xl text-xs space-y-2.5 leading-relaxed text-brand-slate shadow-xs">
                                    <div><span className="text-brand-gold font-bold">브랜드:</span> "{p.cardVersions[p.cardVersions.length - 1].cardContent.identity.oneLineBrand}"</div>
                                    <div><span className="text-brand-gold font-bold">자기정의:</span> {p.cardVersions[p.cardVersions.length - 1].cardContent.identity.selfDefinition}</div>
                                    <div><span className="text-brand-gold font-bold">3트랙 생계형:</span> {p.cardVersions[p.cardVersions.length - 1].cardContent.threeTracks.livelihoodTrack}</div>
                                    <div><span className="text-brand-gold font-bold">3트랙 성장형:</span> {p.cardVersions[p.cardVersions.length - 1].cardContent.threeTracks.growthTrack}</div>
                                    <div><span className="text-brand-gold font-bold">3트랙 활동형:</span> {p.cardVersions[p.cardVersions.length - 1].cardContent.threeTracks.activityTrack}</div>
                                    <div><span className="text-brand-gold font-bold">지속가능인맥:</span> {p.cardVersions[p.cardVersions.length - 1].cardContent.lifeAreas.relation}</div>
                                  </div>
                                </div>
                              )}

                              {/* Chat message logs */}
                              {p.chatHistory && p.chatHistory.length > 0 && (
                                <div className="space-y-3" id="drawer-chat-logs">
                                  <div className="flex items-center gap-1 text-xs text-brand-gray font-bold uppercase tracking-widest">
                                    <MessageSquare size={13} className="text-brand-gold" />
                                    <span>AI 튜터 조율 대화 내역 ({p.chatHistory.length})</span>
                                  </div>
                                  <div className="max-h-48 overflow-y-auto bg-white border border-brand-border rounded-xl p-4 space-y-2 text-[11px] leading-relaxed shadow-xs">
                                    {p.chatHistory.map((ch, idx) => (
                                      <div key={idx} className="flex gap-2">
                                        <span className={`font-bold uppercase ${ch.role === 'user' ? 'text-brand-gold shrink-0' : 'text-brand-gray shrink-0'}`}>
                                          [{ch.role === 'user' ? '참여자' : 'AI'}]
                                        </span>
                                        <span className="text-brand-slate">{ch.content}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* Footer credits in layout */}
      <footer className="text-center text-xs text-brand-gray py-6 border-t border-brand-border block bg-[#F7F2EB]" id="admin-footer">
        <span>© 2026 인생 2막 마스터 대시보드 콘솔 · All Rights Reserved.</span>
      </footer>

    </div>
  );
}
