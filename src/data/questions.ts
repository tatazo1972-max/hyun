export interface QuestionConfig {
  step: number;
  subStep: number;
  aiMessage: string;
  userPromptLabel: string;
  type: 'text' | 'checkbox' | 'radio' | 'priority_picker' | 'draft_review';
  field: string;
  options?: string[];
  placeholder?: string;
  limit?: number; // For checkboxes
}

export const QUESTIONS: QuestionConfig[] = [
  // STEP 0
  {
    step: 0,
    subStep: 0,
    aiMessage: "안녕하세요! 지난 30년간 현업에서 갈고닦으신 내공을 인생 2막의 강력한 무기로 바꿔드릴 파트너입니다. 본격적인 어드벤처를 시작하기 전에, 어떤 업계에서 주로 어떤 역할을 해오셨는지 간략히 들려주시겠어요?",
    userPromptLabel: "기존 경력 및 핵심 직무 입력",
    type: "text",
    field: "career",
    placeholder: "예: 제조업에서 25년간 생산 설비 관리 및 공정 효율화 업무 담당"
  },
  {
    step: 0,
    subStep: 1,
    aiMessage: "여정을 설계하는 데 큰 도움이 됩니다. 혹시 실례가 안 된다면 현재 해당하시는 연령대를 선택해 주시겠어요?",
    userPromptLabel: "연령대 선택",
    type: "radio",
    field: "ageGroup",
    options: ["50대 초반", "50대 중반", "50대 후반", "60대 초반", "60대 중반 이상"]
  },
  {
    step: 0,
    subStep: 2,
    aiMessage: "감사합니다. 현재 퇴직 상태나 예정 시점은 어떻게 되시나요?",
    userPromptLabel: "퇴직 여부 선택",
    type: "radio",
    field: "retirementStatus",
    options: ["현직 (퇴직 예정)", "1년 이내 퇴직 완료", "1년 초과 퇴직 완료"]
  },

  // STEP 1: 경력 자산 발굴
  {
    step: 1,
    subStep: 0,
    aiMessage: "본격적인 자산 분석을 시작하겠습니다. 다음 중 스스로 가장 오래 해오셨고 강점이 있다고 느끼는 핵심 직무 영역을 딱 '2가지'만 골라주세요.",
    userPromptLabel: "핵심 직무 능력 자산 (2개 선택)",
    type: "checkbox",
    field: "coreSkills",
    options: [
      "현장·기술: 설비 운영, 생산 공정, 현장 시공",
      "사람·고객: 상담, 협상, 민원 대응, 갈등 조정",
      "운영·관리: 일정 관리, 조직 운영, 자원 배분",
      "분석·검토: 데이터 분석, 리스크 평가, 품질 심사",
      "교육·전달: 코칭, 후배 양성, 강의, 매뉴얼 제작",
      "문제 해결: 긴급 대응, 트러블슈팅, 비표준 상황 처리",
      "숫자·금융: 예산 집행, 원가 절감, 자산 관리"
    ],
    limit: 2
  },
  {
    step: 1,
    subStep: 1,
    aiMessage: "선택하신 두 핵심 역량은 인생 2막에서 멘토링, 전문 자문, 맞춤 코칭 등으로 폭넓게 활용될 수 있는 훌륭한 시장성 자산입니다. 혹시 회사 생활 동안 매일 반복해서 기계적으로 하셨던 구체적인 실제 루틴 업무는 무엇인가요?",
    userPromptLabel: "가장 오랜 시간 반복 수행했던 루틴 업무",
    type: "text",
    field: "repeatedTask",
    placeholder: "예: 생산관리 대장 작성 및 매일 오전 팀 회의 주재, 납기 조율"
  },
  {
    step: 1,
    subStep: 2,
    aiMessage: "그 반복된 일이야말로 가장 두터운 숙련도의 정수군요. 동료나 후배들이 본인 컴퓨터 자리로 유독 자주 찾아와 도움이나 구체적 노하우를 청했던 주제는 주로 무엇이었나요?",
    userPromptLabel: "주변 사람들이 내게 가장 빈번히 도움을 구했던 일",
    type: "text",
    field: "askedByOthers",
    placeholder: "예: 예상치 못한 라인 오류 원인 찾기, 발주처 불만 해결"
  },
  {
    step: 1,
    subStep: 3,
    aiMessage: "남들의 문제 해결 요청을 주도했다면 탁월한 해결 자산을 가지신 겁니다. 직장 생활을 통틀어 본인이 가장 자랑스럽게 완수했거나, 남들이 해결하지 못한 난제를 극적으로 극복했던 짜릿한 순간은 언제였나요?",
    userPromptLabel: "경력 중 가장 자랑스럽거나 해결 성과가 컸던 순간",
    type: "text",
    field: "proudAchievement",
    placeholder: "예: 납기가 긴박한 상황에서 협력사들을 중재해 제시간에 생산라인을 가동시켰던 일"
  },

  // STEP 2: 자기 정의
  {
    step: 2,
    subStep: 0,
    aiMessage: "그 결정적인 극복의 순간이 바로 당신의 비즈니스 가치 그 자체입니다. 노하우로 가장 짜릿했거나 보람을 느껴 '남들이 오직 본인만' 찾았던 그 한 장면은 구체적으로 어떤 내용이었는지 한 번만 깊이 있게 자랑해 주세요.",
    userPromptLabel: "당신만이 문제를 지혜롭게 돌파해 낸 결정적 한 장면",
    type: "text",
    field: "rawMoment",
    placeholder: "예: 신공장 런칭 때 수십 명의 현장 베테랑들이 모두 실패한 원인을 저만 보유한 체크리스트로 6시간 만에 추적해 냈을 때의 희열"
  },
  {
    step: 2,
    subStep: 1,
    aiMessage: "훌륭한 무기와 과거의 영광을 한데 엮어 당신을 세상에 각인시킬 멋진 '네이밍' 초안을 제작했습니다. 아래 상자 안에서 확인하시고, 보완하거나 맘에 들게 마음껏 다듬어 완성해 보세요.",
    userPromptLabel: "전문가 브랜드 및 자기 정의 문장 확정",
    type: "draft_review",
    field: "finalDefinition"
  },

  // STEP 3: 의미 자산 발견
  {
    step: 3,
    subStep: 0,
    aiMessage: "이제 가슴 뛰는 인생 2막의 '방향성(의미)'을 세워봅시다. 지난 커리어 속에서 개인적으로 가장 가슴 깊숙이 뿌듯했거나 '내가 직장 선택을 참 잘했구나' 싶었던 순간은 언제였나요?",
    userPromptLabel: "직장생활 통틀어 개인적으로 가장 순수했던 보람",
    type: "text",
    field: "proudestMoment",
    placeholder: "예: 성과도 기뻤지만, 제가 코칭해 준 후배가 시련을 딛고 우수 사원으로 성장해 감사 메일을 보냈을 때"
  },
  {
    step: 3,
    subStep: 1,
    aiMessage: "관계와 성장의 가치를 참 따뜻하게 품고 계시는군요. 앞으로 10년 동안 본인이 속한 공동체, 사회 또는 세상에 어떤 보이지 않는 가치나 무형의 영적 유산(Legacy)을 남기고 싶으신가요?",
    userPromptLabel: "은퇴 후 세상에 꼭 남겨주고 싶은 소중한 유산",
    type: "text",
    field: "legacy",
    placeholder: "예: 신뢰라는 가치, 혹은 지혜로운 후임 양성 매뉴얼, 청년들의 정직 교육"
  },
  {
    step: 3,
    subStep: 2,
    aiMessage: "인생 2막을 펼쳐갈 새로운 에너지입니다. 만약 당신이 가진 노하우나 재능을 나누어 준다면, 누구를 가장 돕고 싶거나 진심으로 응원해 주고 싶으신가요?",
    userPromptLabel: "2막의 주된 실천 도움 대상 수혜자",
    type: "text",
    field: "personToHelp",
    placeholder: "예: 이제 막 산업 전선에 뛰어든 청년 기술자들, 또는 정년 후 소외된 독거 어르신들"
  },
  {
    step: 3,
    subStep: 3,
    aiMessage: "그 대상을 특별히 이 여정에서 도우며 따뜻하게 지켜보아 주고 싶은 간결한 이유나 사연이 있나요?",
    userPromptLabel: "해당 대상을 응원하고 싶은 특별한 이유",
    type: "text",
    field: "whyHelp",
    placeholder: "예: 저 역시 현장에서 맨땅에 헤딩할 때 홀로 느꼈던 외로움과 공포를 그들은 겪지 않게 해주고 싶어서"
  },
  {
    step: 3,
    subStep: 4,
    aiMessage: "사연 속에 깊은 동질감과 품위가 있습니다. 사회나 세상을 들여다보면서 '이건 진짜 꼭 고쳐져야 한다'고 강하게 화가 나거나 깊은 아쉬움을 느끼는 고질적 문제는 무엇인가요?",
    userPromptLabel: "나를 은근히 분노하게 만들거나 바로잡고 싶은 사회적 결핍",
    type: "text",
    field: "angryProblem",
    placeholder: "예: 평생 일하신 훌륭한 숙련자들이 정년 퇴직하자 소진된 일회용품 취급을 받으며 일자리를 잃는 현실"
  },

  // STEP 4: 관계 자산 발견
  {
    step: 4,
    subStep: 0,
    aiMessage: "그 결핍을 바로잡는 분투가 2막의 거창한 사명이 될 것입니다. 이번에는 사람과의 인연(관계 자산)을 돌아보지요. 만약 내일 당장 완전히 퇴직을 발표하신다면, 현직 동료나 후배 중 본인을 가장 아쉬워하고 그리워할 인물은 누구일까요?",
    userPromptLabel: "퇴직 시 나를 가장 애석하게 여겨 줄 구체적 인물",
    type: "text",
    field: "whoWillMiss",
    placeholder: "예: 지난 3년간 격무를 같이 버틴 옆 반의 김 과장이나 제가 도운 박 주임"
  },
  {
    step: 4,
    subStep: 1,
    aiMessage: "그분들이 그렇게 눈시울을 찌푸리며 크게 아쉬워하는 핵심적인 이유는 무엇일까요? 평소 자신이 그들에게 보낸 덕이나 무언가 결정적인 인품이 있었을 것입니다.",
    userPromptLabel: "동료들이 나를 아쉬워하는 감추어 둔 이유",
    type: "text",
    field: "whyMiss",
    placeholder: "예: 실수가 생겨 팀이 흔들릴 때 부하 탓하지 않고 늘 온건하게 먼저 어깨를 겯고 밤을 새워주었기 때문"
  },
  {
    step: 4,
    subStep: 2,
    aiMessage: "참 든든한 맏형이자 동반자이셨군요. 퇴직 후 명함이 완전히 가벼워져도, 계속 교류하며 점심 한 끼 편하게 먹거나 언제든 목소리를 나누며 도움을 청할 수 있는 사람들은 주로 어떤 이들인가요?",
    userPromptLabel: "퇴직 후에도 온전히 이어질 실제 사적 네트워크",
    type: "text",
    field: "networkAsset",
    placeholder: "예: 오랫동안 다녀온 등산 동호회 멤버들, 고향 친구, 퇴사 후 현업에 나간 친한 선배"
  },
  {
    step: 4,
    subStep: 3,
    aiMessage: "알짜배기 황금 인맥 자산이십니다. 2막에서 새로운 경제 활동이나 사회 공헌을 일구어나갈 때, 어떤 결이나 비슷한 관심 분야를 가진 좋은 동료들과 한데 합심하고 싶으신가요?",
    userPromptLabel: "2막에서 협업하고 동행하고 싶은 이상적 동료상",
    type: "text",
    field: "peopleToJoinWith",
    placeholder: "예: 눈앞의 돈만 쫓지 않고, 서로 다듬은 기술을 귀하게 모아 시너지를 낼 수 있는 따뜻한 중장년 동료들"
  },

  // STEP 5: 성향 및 환경 진단
  {
    step: 5,
    subStep: 0,
    aiMessage: "이제 당신의 신체외 성향에 최적인 환경(성향)을 검진합니다. 수많은 사람과 활발히 부대끼고 교제할 때 활력이 차오르나요, 아니면 소수의 지인과 있거나 홀로 진득이 연구/공정할 때 더 평온을 느낍니까?",
    userPromptLabel: "나의 근원적인 에너지 충전 원천",
    type: "text",
    field: "energySource",
    placeholder: "예: 여러 사람들과 모여서 회의하는 것보단, 혼자 조용히 서류를 쓰고 점검에 몰입할 때 영감이 나옵니다"
  },
  {
    step: 5,
    subStep: 1,
    aiMessage: "정말 소중한 자가 분석이십니다. 2막 인생에선 주 5일 아침 일찍 출근 카드 찍는 '루틴하고 예측 가능한 시스템'을 원하시나요, 아니면 주 2~3일 자율 조절하고 자신의 재배치가 용이한 '자율적인 소호형 라이프'를 원하시나요?",
    userPromptLabel: "생활 리스크 통제 선호도",
    type: "text",
    field: "timePreference",
    placeholder: "예: 아무래도 여유로운 게 좋으니 주 3일 자율 근무나 파트타임 자문을 하며 시간을 지배하고 싶습니다"
  },
  {
    step: 5,
    subStep: 2,
    aiMessage: "선택에 따라 일하는 모델이 선명해지고 있습니다. 2막에서 '이러한 소통 방식이나 불합리한 환경'만큼은 온 힘을 다해 완전히 던져버리고 피하겠다 하는 것이 있다면 무엇입니까?",
    userPromptLabel: "2막에서 무조건 거절하고 피하고 싶은 활동/환경 기피대상",
    type: "text",
    field: "environmentToAvoid",
    placeholder: "예: 아랫사람들을 쥐어짜 오직 매출 실적 압박만 부르짖는 수직적인 전사적 군대식 미팅"
  },
  {
    step: 5,
    subStep: 3,
    aiMessage: "매우 중대한 경고 원칙입니다. 현실적인 재무 질문입니다. 아래 재무 조율 중 2막 인생에서 주관적 1순위 목표와 2순위 목표를 골라 주십시오.",
    userPromptLabel: "재무적 목표 우선순위 (1, 2순위 선택)",
    type: "priority_picker",
    field: "financialPriority",
    options: ["안정적 소득 확보", "적당한 소득과 여유로운 시간", "소득보다 의미 있는 활동", "소득보다 새로운 도전"]
  },
  {
    step: 5,
    subStep: 4,
    aiMessage: "이해했습니다. 노고의 보상으로 안정적 재무 토대가 될 한도 수급이 정해지겠군요. 심리적으로 흔들리지 않고 꿋꿋이 가치 활동을 지속할 수 있는 최소한의 목표 월 수입 범위는 어떻게 되시나요?",
    userPromptLabel: "최소 희망 월 수입 안전 보급선",
    type: "radio",
    field: "targetIncome",
    options: ["월 100만 원 미만도 괜찮다", "월 100~200만 원 정도면 충분하다", "월 200~300만 원은 필요하다", "월 300만 원 이상이어야 한다"]
  },

  // STEP 6: 건강 자산 점검
  {
    step: 6,
    subStep: 0,
    aiMessage: "활동을 가꾸는 단 하나의 엔진, 바로 생리적 '건강'입니다. 2막 평생 현역 활동을 무리 없이 10년 이상 존속하기 위해 건강이나 육체 체력 면에서 특별히 주의해야 할 한도나 신체적 피해야 할 환경 조건이 있으신가요?",
    userPromptLabel: "건강 상태 및 신체적 제약 행동 한도",
    type: "text",
    field: "healthConsideration",
    placeholder: "예: 최근 허리 디스크 수술을 해서 무거운 장비를 들거나 4시간 이상 부동 자세로 서 있는 일은 곤란합니다."
  },

  // STEP 7: 활동 발견
  {
    step: 7,
    subStep: 0,
    aiMessage: "마지막 고지를 앞두고 기쁨을 탐지해 봅니다. 최근 1년 동안 '아, 인생 정말 살만하구나!' 하며 심장 뛰게 즐거웠던 소소한 에피소드나 순간은 언제였나요?",
    userPromptLabel: "최근 1년 중 참 행복하고 즐거웠던 기억 한 장면",
    type: "text",
    field: "happyMoment",
    placeholder: "예: 휴가 때 자녀들과 함께 산정 호수에 누워 해 질 녘 바람을 쐬고 음악을 들었을 때"
  },
  {
    step: 7,
    subStep: 1,
    aiMessage: "바람과 음악, 참 보배로운 찰나입니다. 조금 멀리 가봅시다. 어릴 적 학창 시절이나 유년기에 특별히 보상 없이도 매일 붙잡고 좋아했던 활동이나 놀이는 주로 무엇이었나요? (예: 만들기, 수다 떨기, 가르치기 등)",
    userPromptLabel: "유년기부터 반복되어 온 원초적 관심 활동",
    type: "text",
    field: "longLikedThing",
    placeholder: "예: 고장 난 소형 라디오나 자전거 기어를 분해하고 구조를 이해하여 혼자 개조하며 놀던 일"
  },
  {
    step: 7,
    subStep: 2,
    aiMessage: "손재주와 집중력의 원형이 아주 어릴 적 이미 굳건하셨군요. 만약 지금 세상이 그 어떤 월급을 단 돈 1원도 주지 않는다고 해도, 본인 스스로 즐겁고 뿌듯하게 무보수로 꾸준히 해낼 기꺼운 열정적 활동이 마음에 있나요?",
    userPromptLabel: "보수가 없어도 흥분되어 해나가고픈 무상의 헌신",
    type: "text",
    field: "freeActivity",
    placeholder: "예: 시골의 청년 농부들을 방문해 기계 오작동이나 수리법 등을 하루 정도 출장 무료 점검해 주기"
  },
  {
    step: 7,
    subStep: 3,
    aiMessage: "그 무형의 헌신이야말로 진정한 거장의 무기겠지요. 주변 사람들이 당신을 바라보고 '야, 당신은 꼭 이런 종류의 일을 이야기하거나 다룰 때 얼굴빛이 최고로 살아 보이더라!' 하며 지목했던 지점이 있었는지 떠올려주세요.",
    userPromptLabel: "남들이 말하는 내 눈빛이 반짝이던 살아있는 순간",
    type: "text",
    field: "aliveLookingMoment",
    placeholder: "예: 장비 매장이나 자선 모금처에서 꼬인 트러블 요소를 원포인트 솔루션으로 척척 풀어서 다같이 웃음 지을 때"
  },

  // STEP 8: 활동군
  {
    step: 8,
    subStep: 0,
    aiMessage: "거의 모든 보물이 모였습니다! 위 6가지 강점 분류를 마친 뒤, 자문/실험을 앞두기 위해서 앞으로 2막을 맞이하고 출발하며 본인 삶에 도킹하고픈 '가장 기대하는 미래 활동군 영역'을 2~3가지만 선정해주십시오.",
    userPromptLabel: "가장 기대되는 미래 2~3개 활동 형태",
    type: "checkbox",
    field: "selected",
    options: [
      "재취업형(조직에서 다시 일하기)",
      "강사형(경험을 가르치기)",
      "멘토형(후배를 돕기)",
      "전문가 자문형(기업 문제 해결 돕기)",
      "사회공헌형(의미 있는 활동하기)",
      "배움형(자격, 연구, 탐구)",
      "1인 활동형(프리랜서·소규모 창업)"
    ],
    limit: 3 // Min 2, max 3 but let's allow 2-3 in checks
  },

  // STEP 9: AI generate summary slide - user only reviews. (handled logically as reading / transitioning slide)

  // STEP 10: 90일 로드맵
  {
    step: 10,
    subStep: 0,
    aiMessage: "탁월합니다. 이제 대장정의 마지막 매듭입니다. 설계된 3트랙 실행을 위해, 당장 '[오늘] 내가 가볍고 간단히 바로 실천하고 다짐해볼 수 있는 첫 일과행동'은 구체적으로 무엇인가요? (이 다짐들이 최종 설계도에 평생현역 첫 약속으로 각인됩니다.)",
    userPromptLabel: "[오늘] 내가 당장 손쉽게 할 일 작성",
    type: "text",
    field: "today",
    placeholder: "예: 김 과장에게 그간 고마웠다고 안부 문자하며 점심 약속 청하기"
  },
  {
    step: 10,
    subStep: 1,
    aiMessage: "훌륭한 출발입니다. 그렇다면 '[7일 내로] 내가 주변 커뮤니티나 채널에서 실제 연락 및 탐구 등 노정해 보며 가볍게 시도 시도해 볼 활동'은 무엇일까요?",
    userPromptLabel: "[7일] 이내에 시도해볼 실행 행동 작성",
    type: "text",
    field: "in7days",
    placeholder: "예: 중장년내일센터 누리집 가입 후 개설된 강사 멘토 채널 과정 훑기"
  },
  {
    step: 10,
    subStep: 2,
    aiMessage: "작은 보폭이 결국 거대한 거리에 도달합니다. 앞으로 '[30일 내로] 내가 실제로 수합되어 작동하고 있는지 가시적으로 확인을 꼭 거치고 마칠 이정표'는 무엇인가요?",
    userPromptLabel: "[30일] 이내에 내가 점검마칠 마일스톤 작성",
    type: "text",
    field: "in30days",
    placeholder: "예: 탤런트뱅크 전문가 프로필 등록 후, 멘토 실적 1건 응모 신청하기"
  },
  {
    step: 10,
    subStep: 3,
    aiMessage: "아주 구체적인 계획입니다. 장장 대화의 마지막으로 '[90일 내로] 이 여정을 이끌며 세상과 나의 습관 속에 만들어낼 귀한 작은 변화'를 한 문장으로 엄숙히 남겨주세요.",
    userPromptLabel: "[90일] 내에 정착시킬 궁극적 작은 습관/변화",
    type: "text",
    field: "in90days",
    placeholder: "예: 주 2회 퇴직예정자 및 기술 청년을 위한 노하우 기고 글쓰기 및 수입 50만원 개척"
  }
];
