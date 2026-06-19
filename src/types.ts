export interface Participant {
  id: string; // Nickname + auto-generated random code (e.g. "철수-A3F9")
  nickname: string;
  group: string; // Meeting/group name
  createdAt: string;
  status: 'in_progress' | 'card_ready' | 'completed';
  currentStep: number; // 0 to 10
  subStep: number; // 0-based index of sub-questions inside step
  answers: Answers;
  cardVersions: CardVersion[];
  chatHistory: ChatMessage[];
}

export interface Answers {
  step0: {
    career?: string;
    ageGroup?: string;
    retirementStatus?: string;
  };
  step1: {
    coreSkills?: string[];
    repeatedTask?: string;
    askedByOthers?: string;
    proudAchievement?: string;
  };
  step2: {
    rawMoment?: string;
    draftDefinition?: string;
    finalDefinition?: string;
    oneLineBrand?: string;
  };
  step3: {
    proudestMoment?: string;
    legacy?: string;
    personToHelp?: string;
    whyHelp?: string;
    angryProblem?: string;
  };
  step4: {
    whoWillMiss?: string;
    whyMiss?: string;
    networkAsset?: string;
    peopleToJoinWith?: string;
  };
  step5: {
    energySource?: string;
    timePreference?: string;
    environmentToAvoid?: string;
    financialPriority?: {
      first: string;
      second: string;
    };
    targetIncome?: string;
  };
  step6: {
    healthConsideration?: string;
  };
  step7: {
    happyMoment?: string;
    longLikedThing?: string;
    freeActivity?: string;
    aliveLookingMoment?: string;
    summary?: {
      skilled?: string;
      liked?: string;
      meaningful?: string;
      profitable?: string;
      sustainable?: string;
      toAvoid?: string;
    };
  };
  step8: {
    selected?: string[];
    firstChoice?: string;
    secondChoice?: string;
    hiddenPotential?: string;
  };
  step9: {
    livelihoodTrack?: string;
    growthTrack?: string;
    activityTrack?: string;
    firstExperiment?: string;
    firstPracticeTarget?: string;
  };
  step10: {
    today?: string;
    in7days?: string;
    in30days?: string;
    in90days?: string;
  };
}

export interface CardContent {
  // 1. 핵심 아이덴티티
  identity: {
    selfDefinition: string; // "나는 [ ] 문제를 해결해 온 전문가이다."
    oneLineBrand: string;
    keywords: string[]; // 5 keywords (10 chars each)
    mission: string; // 사명(Why)
  };
  // 2. 생애설계 7영역 현황
  lifeAreas: {
    meaning: string;
    workActivity: string;
    finance: string;
    health: string;
    relation: string;
    leisure: string;
    environment: string;
  };
  // 3. 4대 자산
  fourAssets: {
    careerAsset: string;
    hiddenPotential: string;
    relationAsset: string;
    healthAsset: string;
    meaningAsset: string;
    possibilityGroups: {
      first: string;
      second: string;
      hidden: string;
    };
  };
  // 4. 평생현역 3트랙
  threeTracks: {
    livelihoodTrack: string;
    growthTrack: string;
    activityTrack: string;
    firstExperiment: string;
    firstPracticeTarget: string;
  };
  // 5. 90일 실행 로드맵
  roadmap: {
    today: string;
    in7days: string;
    in30days: string;
    in90days: string;
  };
}

export interface CardVersion {
  version: string; // e.g. "v1", "v2"
  createdAt: string;
  snapshotAnswers: Answers;
  cardContent: CardContent;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}
