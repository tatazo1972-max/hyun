/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import StartScreen from './components/StartScreen';
import ChatScreen from './components/ChatScreen';
import ResultCard from './components/ResultCard';
import AdminScreen from './components/AdminScreen';
import { Participant, Answers } from './types';
import { MOCK_DEMO_PARTICIPANT } from './data/mockDemo';

export default function App() {
  const [view, setView] = useState<'onboarding' | 'chatting' | 'result' | 'admin'>('onboarding');
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDemo, setIsDemo] = useState(false);

  // Check URL pathname for admin secret route
  useEffect(() => {
    if (window.location.pathname === '/admin-xyz123' || window.location.hash === '#admin-xyz123') {
      setView('admin');
    }
  }, []);

  // Handle participant join or continue session
  const handleJoin = async (nickname: string, group: string) => {
    setErrorMsg('');
    try {
      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, group })
      });

      if (response.ok) {
        const data: Participant = await response.json();
        setParticipant(data);
        setIsDemo(false);
        setView('chatting');
      } else {
        const err = await response.json();
        setErrorMsg(err.error || "참여 등록에 실패했습니다.");
      }
    } catch (e) {
      setErrorMsg("서버와의 연결이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  // Resume old profile with unique code
  const handleResume = async (typedCode: string) => {
    setErrorMsg('');
    try {
      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: typedCode })
      });

      if (response.ok) {
        const data: Participant = await response.json();
        setParticipant(data);
        setIsDemo(false);
        if (data.status === 'card_ready') {
          setView('result');
        } else {
          setView('chatting');
        }
      } else {
        const err = await response.json();
        setErrorMsg(err.error || "입력하신 코드에 해당하는 기록이 없습니다.");
      }
    } catch (e) {
      setErrorMsg("서버 통신에 실패했습니다.");
    }
  };

  // Launch pre-filled demo mode
  const handleLaunchDemo = () => {
    setParticipant(MOCK_DEMO_PARTICIPANT);
    setIsDemo(true);
    setView('result');
  };

  // Progress auto-saver (AJAX PUT proxy)
  const handleSaveProgress = async (updatedAnswers: Answers, nextStep: number, nextSubStep: number) => {
    if (!participant || isDemo) return;

    try {
      const response = await fetch(`/api/participants/${participant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: updatedAnswers,
          currentStep: nextStep,
          subStep: nextSubStep
        })
      });

      if (response.ok) {
        const updatedUser: Participant = await response.json();
        setParticipant(updatedUser);
      }
    } catch (e) {
      console.error("Auto-save progress failed:", e);
    }
  };

  // Trigger Gemini-powered result card synthesis
  const handleGenerateCard = async () => {
    if (!participant || isDemo) return;

    try {
      const customKey = sessionStorage.getItem('gemini_api_key') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (customKey) {
        headers['x-gemini-api-key'] = customKey;
      }

      const response = await fetch(`/api/generate-card/${participant.id}`, {
        method: 'POST',
        headers
      });

      if (response.ok) {
        const finalizedUser: Participant = await response.json();
        setParticipant(finalizedUser);
        setView('result');
      } else {
        const err = await response.json();
        alert(err.error || "설계도 종합 생성 중 에러가 발생했습니다.");
      }
    } catch (e) {
      alert("서버 오류로 인해 설계도를 생성하지 못했습니다.");
    }
  };

  // Restart, clear state
  const handleQuitOrRestart = () => {
    setParticipant(null);
    setIsDemo(false);
    setView('onboarding');
  };

  return (
    <div className="w-full min-h-screen bg-brand-cream text-brand-slate" id="app-viewport">
      {view === 'onboarding' && (
        <StartScreen
          onJoin={handleJoin}
          onResume={handleResume}
          onDemo={handleLaunchDemo}
          errorMsg={errorMsg}
        />
      )}

      {view === 'chatting' && participant && (
        <ChatScreen
          participant={participant}
          onUpdateParticipant={setParticipant}
          onSaveProgress={handleSaveProgress}
          onGenerateResultCard={handleGenerateCard}
          onQuit={handleQuitOrRestart}
        />
      )}

      {view === 'result' && participant && (
        <ResultCard
          participant={participant}
          onUpdateParticipant={setParticipant}
          onRestart={handleQuitOrRestart}
          isDemo={isDemo}
        />
      )}

      {view === 'admin' && (
        <AdminScreen
          onBackToMain={() => {
            window.location.hash = '';
            setView('onboarding');
          }}
        />
      )}
    </div>
  );
}
