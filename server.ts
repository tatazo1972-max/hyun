import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { Participant, Answers, CardContent, CardVersion, ChatMessage } from './src/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 강사가 직접 바꿀 수 있도록 이 값만 수정하면 됩니다.
const ADMIN_PASSWORD = "changeme123";

const PORT = 3000;
const app = express();

app.use(express.json());

// Ensure persistent data directory exists
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DATA_FILE = path.join(DATA_DIR, 'participants.json');

// Memory cache + File store for persistence
let participants: Record<string, Participant> = {};

function loadParticipants() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      participants = JSON.parse(data);
      console.log(`Loaded ${Object.keys(participants).length} participants from file store.`);
    } else {
      participants = {};
    }
  } catch (error) {
    console.error("Error loading participants:", error);
    participants = {};
  }
}

function saveParticipants() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(participants, null, 2), 'utf-8');
  } catch (error) {
    console.error("Error saving participants:", error);
  }
}

// Load now
loadParticipants();

// Initialize GoogleGenAI SDK with user-agent for telemetry
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY is not defined in environment variables. AI features will fail.");
}

function getAiClient(req?: express.Request): GoogleGenAI {
  const customKey = req?.headers['x-gemini-api-key'];
  const keyToUse = typeof customKey === 'string' ? customKey.trim() : process.env.GEMINI_API_KEY;

  if (!keyToUse) {
    throw new Error("GEMINI_API_KEY environment variable or custom API key is not defined.");
  }

  return new GoogleGenAI({
    apiKey: keyToUse,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Endpoint to validate a user-supplied standard Gemini API Key
app.post('/api/validate-key', async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    return res.status(400).json({ error: "API 키를 입력해 주세요." });
  }

  try {
    const testAi = new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    // Low latency check with maxOutputTokens: 1
    await testAi.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Hi",
      config: {
        maxOutputTokens: 1
      }
    });

    res.json({ valid: true });
  } catch (err: any) {
    console.error("API Key check error details:", err);
    res.status(400).json({ 
      valid: false, 
      error: err.message || "유효하지 않은 API 키입니다. 키 발급 상태나 오타를 확인해 주세요." 
    });
  }
});

// Helper to generate a random code
function generateRandomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// --- API Endpoints ---

// Get single participant details
app.get('/api/participants/:id', (req, res) => {
  const { id } = req.params;
  const participant = participants[id];
  if (!participant) {
    return res.status(404).json({ error: "참여자를 찾을 수 없습니다." });
  }
  res.json(participant);
});

// Join, resume or initialize a participant
app.post('/api/participants', (req, res) => {
  const { nickname, group, id: existingId } = req.body;

  if (existingId) {
    // Attempting to resume with an existing code
    const found = participants[existingId];
    if (found) {
      return res.json(found);
    }
    return res.status(404).json({ error: "입력하신 코드에 해당하는 기록을 찾을 수 없습니다." });
  }

  if (!nickname || !group) {
    return res.status(400).json({ error: "닉네임과 회차명(그룹명)을 모두 입력해 주세요." });
  }

  // Check if this id already exists (extremely unlikely, but handle it)
  let newId = "";
  let attempts = 0;
  do {
    const code = generateRandomCode();
    newId = `${nickname}-${code}`;
    attempts++;
  } while (participants[newId] && attempts < 10);

  const newParticipant: Participant = {
    id: newId,
    nickname,
    group,
    createdAt: new Date().toISOString(),
    status: 'in_progress',
    currentStep: 0,
    subStep: 0,
    answers: {
      step0: {},
      step1: {},
      step2: {},
      step3: {},
      step4: {},
      step5: {},
      step6: {},
      step7: {},
      step8: {},
      step9: {},
      step10: {}
    },
    cardVersions: [],
    chatHistory: []
  };

  participants[newId] = newParticipant;
  saveParticipants();

  res.json(newParticipant);
});

// Update participant answers, progress step
app.put('/api/participants/:id', (req, res) => {
  const { id } = req.params;
  const participant = participants[id];
  if (!participant) {
    return res.status(404).json({ error: "참여자를 찾을 수 없습니다." });
  }

  const { answers, currentStep, subStep, status, chatHistory } = req.body;

  if (answers !== undefined) participant.answers = answers;
  if (currentStep !== undefined) participant.currentStep = currentStep;
  if (subStep !== undefined) participant.subStep = subStep;
  if (status !== undefined) participant.status = status;
  if (chatHistory !== undefined) participant.chatHistory = chatHistory;

  saveParticipants();
  res.json(participant);
});

// Admin verify password
app.post('/api/admin/auth', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    return res.json({ authenticated: true });
  }
  res.status(401).json({ error: "비밀번호가 올바르지 않습니다." });
});

// Admin list participants
app.get('/api/admin/participants', (req, res) => {
  const { password, group } = req.query;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "인증되지 않은 접근입니다." });
  }

  let list = Object.values(participants);
  if (group && group !== 'all') {
    list = list.filter(p => p.group === group);
  }

  // Sort by createdAt descending
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(list);
});

// Admin stats calculation
app.get('/api/admin/stats', (req, res) => {
  const { password, group } = req.query;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "인증되지 않은 접근입니다." });
  }

  let list = Object.values(participants);
  if (group && group !== 'all') {
    list = list.filter(p => p.group === group);
  }

  const total = list.length;
  const completedCount = list.filter(p => p.status === 'card_ready' || p.status === 'completed').length;
  const inProgressCount = list.filter(p => p.status === 'in_progress').length;

  // Let's safe-aggregate checkboxes
  // 1. coreSkills stats
  const coreSkillsCounts: Record<string, number> = {};
  // 2. targetIncome stats
  const targetIncomeCounts: Record<string, number> = {};
  // 3. financialPriority 1순위
  const firstPriCounts: Record<string, number> = {};
  // 4. selected activities (step8)
  const activityCounts: Record<string, number> = {};

  list.forEach(p => {
    // coreSkills
    const skills = p.answers?.step1?.coreSkills;
    if (Array.isArray(skills)) {
      skills.forEach(s => {
        coreSkillsCounts[s] = (coreSkillsCounts[s] || 0) + 1;
      });
    }

    // targetIncome
    const income = p.answers?.step5?.targetIncome;
    if (income) {
      targetIncomeCounts[income] = (targetIncomeCounts[income] || 0) + 1;
    }

    // financialPriority
    const pri = p.answers?.step5?.financialPriority?.first;
    if (pri) {
      firstPriCounts[pri] = (firstPriCounts[pri] || 0) + 1;
    }

    // step8 selected
    const acts = p.answers?.step8?.selected;
    if (Array.isArray(acts)) {
      acts.forEach(a => {
        activityCounts[a] = (activityCounts[a] || 0) + 1;
      });
    }
  });

  res.json({
    total,
    completed: completedCount,
    inProgress: inProgressCount,
    coreSkills: coreSkillsCounts,
    targetIncome: targetIncomeCounts,
    financialPriority: firstPriCounts,
    activities: activityCounts
  });
});

// Export CSV
app.get('/api/admin/export-csv', (req, res) => {
  const { password, group } = req.query;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).send("Unauthorized");
  }

  let list = Object.values(participants);
  if (group && group !== 'all') {
    list = list.filter(p => p.group === group);
  }

  // Construct CSV Header
  // We need humans-readable Korean column names and flatten values of array/object fields
  const headers = [
    "참여자코드(ID)", "닉네임", "그룹/회차", "시작일시", "진행상태", "카드버전수",
    "step0.경력/직무", "step0.연령대", "step0.퇴직여부",
    "step1.핵심역량(2개)", "step1.반복해온업무", "step1.남들이자주묻는것", "step1.자랑스러운해결순간",
    "step2.노하우해결순간", "step2.초안전문가정의", "step2.최종자기정의", "step2.한줄브랜드",
    "step3.보람된순간", "step3.10년내세상에남길것", "step3.응원하고픈대상", "step3.그대상을돕고픈이유", "step3.세상에서화나는문제",
    "step4.아쉬워할사람", "step4.아쉬워하는이유", "step4.지속교류할인적자산", "step4.같이하고픈사람성향",
    "step5.에너지원천(사람vs혼자)", "step5.루틴형vs자율형", "step5.버리고픈소통방식/환경", "step5.재무우선순위_1순위", "step5.재무우선순위_2순위", "step5.희망목표소득",
    "step6.건강/체력고려사항",
    "step7.즐거웠던순간", "step7.어릴적부터좋아한것", "step7.돈안받아도재밌는활동", "step7.가장살아있던순간",
    "step7.잘하는활동(skilled)", "step7.좋아하는활동(liked)", "step7.의미있는활동(meaningful)", "step7.돈이되는활동(profitable)", "step7.지속가능활동(sustainable)", "step7.피해야할활동(toAvoid)",
    "step8.기대하는활동(2~3개)", "step8.활동군1순위", "step8.활동군2순위", "step8.활동군숨은가능성",
    "step9.생계형트랙", "step9.성장형트랙", "step9.활동형트랙", "step9.첫실험(2주내)", "step9.첫실천대상",
    "step10.오늘당장할것", "step10.7일내시도할것", "step10.30일내확인할것", "step10.90일내변화"
  ];

  const escapeCSVField = (val: any): string => {
    if (val === undefined || val === null) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = list.map(p => {
    const a = (p.answers || {}) as any;
    return [
      p.id,
      p.nickname,
      p.group,
      p.createdAt,
      p.status,
      p.cardVersions?.length || 0,
      
      // Step 0
      a.step0?.career || "",
      a.step0?.ageGroup || "",
      a.step0?.retirementStatus || "",

      // Step 1
      Array.isArray(a.step1?.coreSkills) ? a.step1.coreSkills.join(", ") : "",
      a.step1?.repeatedTask || "",
      a.step1?.askedByOthers || "",
      a.step1?.proudAchievement || "",

      // Step 2
      a.step2?.rawMoment || "",
      a.step2?.draftDefinition || "",
      a.step2?.finalDefinition || "",
      a.step2?.oneLineBrand || "",

      // Step 3
      a.step3?.proudestMoment || "",
      a.step3?.legacy || "",
      a.step3?.personToHelp || "",
      a.step3?.whyHelp || "",
      a.step3?.angryProblem || "",

      // Step 4
      a.step4?.whoWillMiss || "",
      a.step4?.whyMiss || "",
      a.step4?.networkAsset || "",
      a.step4?.peopleToJoinWith || "",

      // Step 5
      a.step5?.energySource || "",
      a.step5?.timePreference || "",
      a.step5?.environmentToAvoid || "",
      a.step5?.financialPriority?.first || "",
      a.step5?.financialPriority?.second || "",
      a.step5?.targetIncome || "",

      // Step 6
      a.step6?.healthConsideration || "",

      // Step 7
      a.step7?.happyMoment || "",
      a.step7?.longLikedThing || "",
      a.step7?.freeActivity || "",
      a.step7?.aliveLookingMoment || "",
      a.step7?.summary?.skilled || "",
      a.step7?.summary?.liked || "",
      a.step7?.summary?.meaningful || "",
      a.step7?.summary?.profitable || "",
      a.step7?.summary?.sustainable || "",
      a.step7?.summary?.toAvoid || "",

      // Step 8
      Array.isArray(a.step8?.selected) ? a.step8.selected.join(", ") : "",
      a.step8?.firstChoice || "",
      a.step8?.secondChoice || "",
      a.step8?.hiddenPotential || "",

      // Step 9
      a.step9?.livelihoodTrack || "",
      a.step9?.growthTrack || "",
      a.step9?.activityTrack || "",
      a.step9?.firstExperiment || "",
      a.step9?.firstPracticeTarget || "",

      // Step 10
      a.step10?.today || "",
      a.step10?.in7days || "",
      a.step10?.in30days || "",
      a.step10?.in90days || ""
    ].map(escapeCSVField);
  });

  // Construct full text with UTF-8 BOM
  const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
  const bom = Buffer.from([0xEF, 0xBB, 0xBF]); // UTF-8 BOM to prevent excel broken characters
  const buffer = Buffer.concat([bom, Buffer.from(csvContent, 'utf-8')]);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=participants_${group || 'all'}_${Date.now()}.csv`);
  res.send(buffer);
});


// Suggest initial self-definition and brand name (STEP 2-A)
app.post('/api/suggest-draft', async (req, res) => {
  const { answers } = req.body;
  try {
    const client = getAiClient(req);
    const systemPrompt = `당신은 중장년층 퇴직예정자의 커리어를 매력적인 자기정의 초안으로 작성해주는 카운셀러입니다.
입력받은 커리어 자산과 결정적 자랑 성과를 바탕으로 다음 두 가지를 제공해주십시오:
1. " 나는 [   ] 문제를 해결해 온 전문가이다. " 형식의 자기정의 초안 (반드시 대괄호 안을 어울리는 멋진 해결 가치로 채워 만족시키십시오. 예: "나는 제조 현장의 리스크 폭탄을 제거하고 설비 안정화를 이끌어 온 전문가이다.")
2. 그에 어울리는 매력적이고 세련된 '한 줄 브랜드' 타이틀

응답 JSON 형식:
{
  "draftDefinition": "나는 [  ] 문제를 해결해 온 전문가이다.",
  "oneLineBrand": "한 줄 브랜드명"
}`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: 'user', parts: [{ text: JSON.stringify(answers) }] }],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            draftDefinition: { type: Type.STRING },
            oneLineBrand: { type: Type.STRING }
          },
          required: ["draftDefinition", "oneLineBrand"]
        }
      }
    });

    const output = response.text;
    res.json(JSON.parse(output.trim()));
  } catch (err: any) {
    console.error("Suggest draft error:", err);
    res.json({
      draftDefinition: "나는 [현장의 크고 작은 돌발적 트러블] 문제를 해결해 온 전문가이다.",
      oneLineBrand: "현장 관리의 마스터"
    });
  }
});

// Generate Step 7 6-Aspect Summary based on four answers (STEP 2-B)
app.post('/api/generate-summary', async (req, res) => {
  const { answersStep7 } = req.body;
  try {
    const client = getAiClient(req);
    const systemPrompt = `입력받은 4가지 질문 답변(최근 신나는 일, 어릴적 좋아했던 일, 무보수 재밌는 활동, 가장 살아있는 순간)을 기반으로, 인생 2막의 6가지 활동 키워드로 집약/정리하여 JSON으로 내보내십시오.
1. skilled: 과거 경력과 일속에서 스스로 '잘하는 활동/강점'
2. liked: 순수하게 흥미를 느끼고 몰입하는 '좋아하는 활동'
3. meaningful: 세상이나 타인에게 기여하고픈 '의미 있는 활동'
4. profitable: 재능 기부나 긱 워크, 튜터링 등 '돈이 될 수 있는 활동'
5. sustainable: 체력 조건과 가치에 부합하는 '지속 가능한 활동'
6. toAvoid: 성향상 반드시 '피해야 할 활동'

각 항목은 간결하고 실제적인 단어/구 형태로 10~25자 내외로 채우십시오.
응답 JSON 형식:
{
  "skilled": "...",
  "liked": "...",
  "meaningful": "...",
  "profitable": "...",
  "sustainable": "...",
  "toAvoid": "..."
}`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: 'user', parts: [{ text: JSON.stringify(answersStep7) }] }],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skilled: { type: Type.STRING },
            liked: { type: Type.STRING },
            meaningful: { type: Type.STRING },
            profitable: { type: Type.STRING },
            sustainable: { type: Type.STRING },
            toAvoid: { type: Type.STRING }
          },
          required: ["skilled", "liked", "meaningful", "profitable", "sustainable", "toAvoid"]
        }
      }
    });

    const output = response.text;
    res.json(JSON.parse(output.trim()));
  } catch (err: any) {
    console.error("Generate summary error:", err);
    res.json({
      skilled: "현장의 제조 공정 돌발 대처와 조립 조율",
      liked: "후배 지원 및 코칭 노하우 전달",
      meaningful: "지역 사회 문제 해결 및 재능 교습",
      profitable: "생계 수단 연계 직무 재취업 및 기술 컨설턴트",
      sustainable: "조용한 환경에서의 연구 및 매뉴얼 집필",
      toAvoid: "지나치게 과중하고 경쟁 유도를 강요하는 수직적 조직 영업"
    });
  }
});

// Analyze Step 8 choice analysis (STEP 2-B)
app.post('/api/analyze-step8', async (req, res) => {
  const { selectedActivities, answers } = req.body;
  try {
    const client = getAiClient(req);
    const systemPrompt = `참여자가 설계한 인생 2막 기대 활동군 선택사항들(selected)과 여태까지의 답변 전체를 매칭하여 다음 세 가지 활동군 분석을 내보내주십시오:
1. firstChoice(1순위): 선택한 활동 중 주력이 될 구체적인 2막 실천 활동군 형태 및 이유 (예: '강사형 (숙련 노하우 전수)')
2. secondChoice(2순위): 병행하며 삶을 가꿀 조력 활동군 형태 및 이유 (예: '멘토형 (후배 정서 지원)')
3. hiddenPotential(숨은 가능성): 사용자의 커리어 혹은 성향에서 우러나왔으나 본인은 미처 깊이 알아차리지 못했던 '숨은 유망 가능성'

각 항목은 짧고 명료하게 50자 이내로 채우십시오.
응답 JSON 형식:
{
  "firstChoice": "...",
  "secondChoice": "...",
  "hiddenPotential": "..."
}`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: 'user', parts: [{ text: JSON.stringify({ selectedActivities, answers }) }] }],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            firstChoice: { type: Type.STRING },
            secondChoice: { type: Type.STRING },
            hiddenPotential: { type: Type.STRING }
          },
          required: ["firstChoice", "secondChoice", "hiddenPotential"]
        }
      }
    });

    res.json(JSON.parse(response.text.trim()));
  } catch (err: any) {
    console.error("Analyze step8 error:", err);
    res.json({
      firstChoice: "강사형 / 현장 생산 및 공정 관리 실무 전수 강사",
      secondChoice: "멘토형 / 주니어 엔지니어 대상 트러블슈팅 및 정서 케어 멘토링",
      hiddenPotential: "전문자문형 / 중소기업 제조공정 진단 및 컨설턴트 위원"
    });
  }
});


// Generate result card via server-side Gemini API
app.post('/api/generate-card/:id', async (req, res) => {
  const { id } = req.params;
  const participant = participants[id];
  if (!participant) {
    return res.status(404).json({ error: "참여자를 찾을 수 없습니다." });
  }

  try {
    const client = getAiClient(req);
    const answers = participant.answers;

    // We build a detailed prompt mapping answers to structured results
    const systemPrompt = `당신은 퇴직 예정자들의 30년 현직 전문성을 매력적인 평생현역 비즈니스 등대(브랜드)로 번역해주는 인명 설계사, [인생 2막 평생현역 어드벤처 가이드]입니다.
사용자가 입력한 대답 세트를 철저히 분석하여, 깊이 있고 시적이고 전문적이며 실제 실행 가능한 내용으로 압축하여 '인생 2막 평생현역 실행 설계도' 카드 콘텐츠인 JSON데이터 구조를 만들어주세요.

## 핵심 가이드라인:
- 사용자가 성의껏 쓴 답변들을 1~2문장의 정수적 감동과 전문성을 담아 명확히 압축해주되, 절대 허례허식이 가득한 로봇체나 남발어(AI가 낸 티가 나는 지나치게 화려한 미사여구)는 지양합니다.
- '인생 2막 키워드 5개'는 사용자의 정체성을 담는 단어/짧은 명사구 형태로 각 키워드는 10자 이내로 5개 배열을 만듭니다.
- '자기 정의'의 경우 "나는 [ ] 문제를 해결해 온 전문가이다." 양식에 반드시 꼭 들어맞게 생성해주세요.
- 3트랙(생계형/성장형/활동형)은 사용자의 핵심 역량(step1)과 희망 목표 소수 수입(step5), 활동군 자산(step8)을 연계하여 만듭니다. 특정 기업명은 절대 명시하지 말며 사업종류, 전문직 역량 분야, 고문/컨설팅 형식으로 명료히 제시합니다.
- 첫 실험(2주 내 가볍게 실행)과 첫 실천 대상을 제시하십시오.
- JSON 결과가 완벽한 포맷으로 리턴되도록 스키마를 철저히 지켜 응답하십시오.
`;

    const userPrompt = `아래는 참여자 닉네임 [${participant.nickname}]의 답변 데이터 전체입니다. 이를 기반으로 설계도 내용을 채워주십시오:
${JSON.stringify(answers, null, 2)}
`;

    console.log(`Calling Gemini API for generating card matching ${participant.id}...`);

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { role: 'user', parts: [{ text: userPrompt }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            identity: {
              type: Type.OBJECT,
              properties: {
                selfDefinition: { type: Type.STRING, description: "나는 [ ] 문제를 해결해 온 전문가이다. 형식으로 완성된 자기 정의" },
                oneLineBrand: { type: Type.STRING, description: "경력과 가치를 담은 매력적이고 멋진 차세대 한 줄 브랜드 네임" },
                keywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "핵심 요약 키워드 5개 (각 10자 내외)"
                },
                mission: { type: Type.STRING, description: "이 인생 2막을 펼쳐가야 하는 궁극적 사명(Why)" }
              },
              required: ["selfDefinition", "oneLineBrand", "keywords", "mission"]
            },
            lifeAreas: {
              type: Type.OBJECT,
              properties: {
                meaning: { type: Type.STRING, description: "남기고 싶은 유산/돕고 싶은 사람" },
                workActivity: { type: Type.STRING, description: "동반 강점 및 활동 정체성" },
                finance: { type: Type.STRING, description: "재무 우선순위 및 목표 소액 범위 요약" },
                health: { type: Type.STRING, description: "체력관리 및 활동 한도 한 줄 조언" },
                relation: { type: Type.STRING, description: "지속 교류할 관계 자산과 인맥 방향" },
                leisure: { type: Type.STRING, description: "의미/자아 소소한 즐거움을 누릴 활동" },
                environment: { type: Type.STRING, description: "피해야 할 소통/직장환경 경고" }
              },
              required: ["meaning", "workActivity", "finance", "health", "relation", "leisure", "environment"]
            },
            fourAssets: {
              type: Type.OBJECT,
              properties: {
                careerAsset: { type: Type.STRING, description: "보유 직무 반복성과 해결 노하우" },
                hiddenPotential: { type: Type.STRING, description: "시장에서 바로 통하게 범용 역량으로 친환 번역한 가치" },
                relationAsset: { type: Type.STRING, description: "자원 및 핵심 인력망 정리" },
                healthAsset: { type: Type.STRING, description: "건강 조건 한 줄 성찰" },
                meaningAsset: { type: Type.STRING, description: "사회적 유구 가치 및 사명" },
                possibilityGroups: {
                  type: Type.OBJECT,
                  properties: {
                    first: { type: Type.STRING },
                    second: { type: Type.STRING },
                    hidden: { type: Type.STRING }
                  },
                  required: ["first", "second", "hidden"]
                }
              },
              required: ["careerAsset", "hiddenPotential", "relationAsset", "healthAsset", "meaningAsset", "possibilityGroups"]
            },
            threeTracks: {
              type: Type.OBJECT,
              properties: {
                livelihoodTrack: { type: Type.STRING, description: "재취업, 계약직, 긱 근로 등 생계형 트랙" },
                growthTrack: { type: Type.STRING, description: "강사, 전문가 고문, 컨설턴트 등 성장형 트랙" },
                activityTrack: { type: Type.STRING, description: "사회공헌, 커뮤니티 조성 등 활동형 트랙" },
                firstExperiment: { type: Type.STRING, description: "2주 내 실행할 작은 한 걸음" },
                firstPracticeTarget: { type: Type.STRING, description: "첫 실험을 실천할 구체적 구원 대상" }
              },
              required: ["livelihoodTrack", "growthTrack", "activityTrack", "firstExperiment", "firstPracticeTarget"]
            }
          },
          required: ["identity", "lifeAreas", "fourAssets", "threeTracks"]
        }
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error("No output was generated by Gemini model.");
    }

    const cardData = JSON.parse(outputText.trim());

    // Merge in user roadmap from Answers step 10
    const cardContent: CardContent = {
      identity: cardData.identity,
      lifeAreas: cardData.lifeAreas,
      fourAssets: cardData.fourAssets,
      threeTracks: cardData.threeTracks,
      roadmap: {
        today: answers.step10?.today || "미작성",
        in7days: answers.step10?.in7days || "미작성",
        in30days: answers.step10?.in30days || "미작성",
        in90days: answers.step10?.in90days || "미작성"
      }
    };

    const nextVerIndex = (participant.cardVersions?.length || 0) + 1;
    const newVersion: CardVersion = {
      version: `v${nextVerIndex}`,
      createdAt: new Date().toISOString(),
      snapshotAnswers: JSON.parse(JSON.stringify(answers)),
      cardContent
    };

    if (!participant.cardVersions) {
      participant.cardVersions = [];
    }
    participant.cardVersions.push(newVersion);
    participant.status = 'card_ready';

    saveParticipants();
    res.json(participant);

  } catch (error: any) {
    console.error("Gemini Card Generation Error:", error);
    res.status(500).json({ error: `설계도 생성 실패: ${error.message || error}` });
  }
});


// Conversational Assistant Chat on Result Card Screen
app.post('/api/chat-message/:id', async (req, res) => {
  const { id } = req.params;
  const participant = participants[id];
  if (!participant) {
    return res.status(404).json({ error: "참여자를 찾을 수 없습니다." });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "메시지 내용을 입력하세요." });
  }

  try {
    const client = getAiClient(req);
    const latestCardVersion = participant.cardVersions[participant.cardVersions.length - 1];
    const latestAnswers = participant.answers;

    // Build user turn + system context mapping
    const systemPrompt = `당신은 대화를 통해 참여자의 생애 설계 데이터나 결과를 미세 조율해내는 노련하고 따뜻한 파트너 [인생 2막 평생현역 어드벤처 가이드]입니다.
현재 사용자는 모든 질문에 답해 설계도가 이미 발급된 후이며, 발급된 설계도 카드에 포함된 사명, 인물, 관계 조건, 트랙 구성을 조율하거나 그와 관련된 대화를 하고 있습니다.

## 핵심 임무:
1. 사용자가 단순 질문이나 조언을 구할 때는 존대어로 상세하고 다정한 답변을 리턴합니다.
2. 만약 사용자의 답변이 기존 설계도(answers)의 데이터를 수정하거나 보완하라는 의도로 보인다면(예: "재무 우선순위를 1순위를 안정적소득에서 다른걸로 바꿀래요" 혹은 "사실 재취업이 아니고 자문형이 더 좋아요"),
   바꾸고자 하는 해당 Answers 필드를 구체적으로 특정해 JSON의 updateAnswers에 실어주세요.
   그리고, 사용자의 메시지가 그렇게 가치를 변경하고자 한 상태이거나 바꾸는 것에 동의하는 대화 맥락이 될 경우, "이 내용을 반영해서 설계도를 다시 만들어드릴까요?"라고 자연스러운 대화를 나누며 제안하십시오.
   만약 사용자가 이미 "다시 만들어줘", "설계도 수정해줘" 처럼 명시적으로 갱신을 부탁했거나 수정을 동의했다면, JSON 필드인 "shouldRegenerate"를 true로 전송하십시오.

## 응답 JSON 형식:
반드시 다음 객체 형태를 준수해서 출력하세요.
{
  "reply": "사용자에게 전달할 한국어 멘트 (따뜻한 조언체)",
  "updateAnswers": {
    "stepN": { ... } // 수정되어야 할 질문의 answers 객체 하위 필드들만 담으십시오. 없거나 필요 시 빈칸.
  },
  "shouldRegenerate": true/false // 카드를 v2, v3로 다시 갱신 생성할 필요가 감지/동의됐을 때 true
}

## 현재 설계도 카드 데이터:
${JSON.stringify(latestCardVersion?.cardContent, null, 2)}

## 현재 저장되어 있는 세부 답변(answers):
${JSON.stringify(latestAnswers, null, 2)}
`;

    // Construct prompt history sequentially (limit last 8 messages)
    const recentHistory = participant.chatHistory || [];
    const chatParts = recentHistory.slice(-8).map(ch => ({
      role: ch.role,
      parts: [{ text: ch.content }]
    }));

    // Append current userInput
    const currentPart = { role: 'user', parts: [{ text: message }] };

    console.log(`Calling Gemini API for sidechat of ${participant.id}...`);

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [...chatParts, currentPart],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING, description: "참여자에게 보낼 따뜻하고 프로페셔널한 한국어 격려 멘트" },
            updateAnswers: {
              type: Type.OBJECT,
              description: "사용자가 수정한 값이 있는 경우에만 해당 stepN의 변경된 Object를 삽입 (없으면 생략 가능)"
            },
            shouldRegenerate: { type: Type.BOOLEAN, description: "사용자가 정보 수정을 명시적으로 요구했거나, 제안(설계도 재생성)에 찬성/수락했을 경우 true" }
          },
          required: ["reply", "shouldRegenerate"]
        }
      }
    });

    const replyText = response.text;
    if (!replyText) {
      throw new Error("No output was generated by Gemini model for chat.");
    }

    const chatResponse = JSON.parse(replyText.trim());

    // Record history
    if (!participant.chatHistory) participant.chatHistory = [];
    participant.chatHistory.push({
      role: 'user',
      content: message,
      createdAt: new Date().toISOString()
    });

    participant.chatHistory.push({
      role: 'assistant',
      content: chatResponse.reply,
      createdAt: new Date().toISOString()
    });

    // If AI recommended updates to answers
    if (chatResponse.updateAnswers) {
      const keys = Object.keys(chatResponse.updateAnswers);
      keys.forEach(key => {
        // e.g. "step5"
        if (typeof chatResponse.updateAnswers[key] === 'object') {
          // deep merge safe-merge
          participant.answers[key] = {
            ...participant.answers[key],
            ...chatResponse.updateAnswers[key]
          };
        }
      });
    }

    let regenerated = false;
    let newCardVersion: CardVersion | null = null;
    const previousAnswersSnapshot = JSON.parse(JSON.stringify(participant.answers));

    // Automatically regenerate card if flagged
    if (chatResponse.shouldRegenerate) {
      // Re-trigger the generation logic right inside the server to avoid multiple endpoints roundtrips
      console.log(`Auto regeneration triggered for ${participant.id} during sidechat...`);
      const regenResponse = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          { role: 'user', parts: [{ text: `사용자와의 채팅을 반영하여 answers가 수정되었습니다. 새로운 설계도용 카드 데이터를 만들어주세요. answers:\n${JSON.stringify(participant.answers)}` }] }
        ],
        config: {
          systemInstruction: `당신은 인생 2막 설계도 제작 전문가입니다. 사용자의 변경 사항과 기존 answers에 기반하여 최신식 설계도 카드 데이터인 JSON을 완성해주세요. 앞선 가이드라인을 엄격히 준수하십시오.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              identity: {
                type: Type.OBJECT,
                properties: {
                  selfDefinition: { type: Type.STRING },
                  oneLineBrand: { type: Type.STRING },
                  keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                  mission: { type: Type.STRING }
                },
                required: ["selfDefinition", "oneLineBrand", "keywords", "mission"]
              },
              lifeAreas: {
                type: Type.OBJECT,
                properties: {
                  meaning: { type: Type.STRING },
                  workActivity: { type: Type.STRING },
                  finance: { type: Type.STRING },
                  health: { type: Type.STRING },
                  relation: { type: Type.STRING },
                  leisure: { type: Type.STRING },
                  environment: { type: Type.STRING }
                },
                required: ["meaning", "workActivity", "finance", "health", "relation", "leisure", "environment"]
              },
              fourAssets: {
                type: Type.OBJECT,
                properties: {
                  careerAsset: { type: Type.STRING },
                  hiddenPotential: { type: Type.STRING },
                  relationAsset: { type: Type.STRING },
                  healthAsset: { type: Type.STRING },
                  meaningAsset: { type: Type.STRING },
                  possibilityGroups: {
                    type: Type.OBJECT,
                    properties: { first: { type: Type.STRING }, second: { type: Type.STRING }, hidden: { type: Type.STRING } },
                    required: ["first", "second", "hidden"]
                  }
                },
                required: ["careerAsset", "hiddenPotential", "relationAsset", "healthAsset", "meaningAsset", "possibilityGroups"]
              },
              threeTracks: {
                type: Type.OBJECT,
                properties: {
                  livelihoodTrack: { type: Type.STRING },
                  growthTrack: { type: Type.STRING },
                  activityTrack: { type: Type.STRING },
                  firstExperiment: { type: Type.STRING },
                  firstPracticeTarget: { type: Type.STRING }
                },
                required: ["livelihoodTrack", "growthTrack", "activityTrack", "firstExperiment", "firstPracticeTarget"]
              }
            },
            required: ["identity", "lifeAreas", "fourAssets", "threeTracks"]
          }
        }
      });

      const regenOutput = regenResponse.text;
      if (regenOutput) {
        const cardData = JSON.parse(regenOutput.trim());
        const cardContent: CardContent = {
          identity: cardData.identity,
          lifeAreas: cardData.lifeAreas,
          fourAssets: cardData.fourAssets,
          threeTracks: cardData.threeTracks,
          roadmap: {
            today: participant.answers.step10?.today || "미작성",
            in7days: participant.answers.step10?.in7days || "미작성",
            in30days: participant.answers.step10?.in30days || "미작성",
            in90days: participant.answers.step10?.in90days || "미작성"
          }
        };

        const nextVerIndex = (participant.cardVersions?.length || 0) + 1;
        newCardVersion = {
          version: `v${nextVerIndex}`,
          createdAt: new Date().toISOString(),
          snapshotAnswers: previousAnswersSnapshot,
          cardContent
        };
        participant.cardVersions.push(newCardVersion);
        regenerated = true;
      }
    }

    saveParticipants();

    res.json({
      reply: chatResponse.reply,
      participant,
      regenerated,
      newVersion: newCardVersion?.version || null
    });

  } catch (error: any) {
    console.error("Gemini Chat Message Error:", error);
    res.status(500).json({ error: `대화 실패: ${error.message || error}` });
  }
});


// Serve React build in production OR register Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
