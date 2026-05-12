export type GrowthResponse = {
  criticalIssues: string[];
  growthStrategy: string[];
  viralHooks: string[];
  seoOpportunities: string[];
  conversionFixes: string[];
  distributionPlan: string[];
  redditOpportunities: string[];
  unfairAdvantage: string[];
};

export type CriticAgentVerdict = {
  confidence: number;
  flags: string[];
  hallucinations: string[];
  approved: boolean;
};

export type CriticResult = {
  strategist: CriticAgentVerdict;
  copywriter: CriticAgentVerdict;
  seo: CriticAgentVerdict;
  conversion: CriticAgentVerdict;
  distribution: CriticAgentVerdict;
  reddit: CriticAgentVerdict;
  overall_quality_score: number;
  summary: string;
};

export type PaymentRecord = {
  userId: string;
  walletAddress: string;
  amount: string;
  txHash: string;
  timestamp: string;
  analysisUrl: string;
};

export type ArcJobRecord = {
  agentName: string;
  jobId: string | null;
  cost: string;
  txHash: string | null;
  status: "settled" | "failed" | "skipped";
  timestamp: number;
};

export type ArcReceipt = {
  totalCost: string;
  jobCount: number;
  settledCount: number;
  jobs: ArcJobRecord[];
  arcScanLinks: string[];
};

export type CompareScores = {
  messagingClarity: { site1: number; site2: number };
  seoStrength: { site1: number; site2: number };
  conversionOptimization: { site1: number; site2: number };
  distributionStrategy: { site1: number; site2: number };
  communityPresence: { site1: number; site2: number };
  overallGrowthPotential: { site1: number; site2: number };
};

export type CompareRequest = {
  url1: string;
  url2: string;
};

export type CompareSuccessResponse = {
  url1: string;
  url2: string;
  productName1: string;
  productName2: string;
  winner: "site1" | "site2" | "tie";
  scores: CompareScores;
  markdown: string;
  critic1Summary: string;
  critic2Summary: string;
};

export type GrowthSection =
  | "criticalIssues"
  | "growthStrategy"
  | "viralHooks"
  | "seoOpportunities"
  | "conversionFixes"
  | "distributionPlan"
  | "redditOpportunities"
  | "unfairAdvantage";

export type ActionType =
  | "tweet_thread"
  | "ad_copy"
  | "blog_post"
  | "content_plan";

export type ExecuteAction =
  | "generateTweetThread"
  | "generateAdCopy"
  | "generateBlogPost"
  | "generateContentPlan";

export type AnalyzeRequest = {
  url: string;
  userId?: string | null;
  selectedAgents?: string[];
};

export type AnalyzeSuccessResponse = {
  analysisId: string;
  url: string;
  markdown: string;
  analysis: GrowthResponse;
  agents: {
    strategist: string;
    copywriter: string;
    seo: string;
    conversion: string;
    distribution: string;
    reddit: string;
  };
  extracted: {
    title: string;
    metaDescription: string;
    visibleText: string;
  };
  arcReceipt?: ArcReceipt;
};

export type AnalyzeErrorResponse = {
  error: string;
};

export type FeedbackValue = "positive" | "negative";

export type FeedbackRequest = {
  analysisId: string;
  feedback: FeedbackValue;
  userId?: string | null;
};

export type FeedbackResponse = {
  ok: true;
  analysisId: string;
  feedback: FeedbackValue;
};

export type ActionRequest = {
  analysisId: string;
  section: GrowthSection;
  sourceText: string;
  actionType: ActionType;
  userId?: string | null;
};

export type ActionResponse = {
  ok: true;
  analysisId: string;
  section: GrowthSection;
  sourceText: string;
  actionType: ActionType;
  output: string;
};

export type ExecuteRequest = {
  action: ExecuteAction;
  context: string;
  userId?: string | null;
};

export type ExecuteResponse = {
  ok: true;
  action: ExecuteAction;
  output: string;
};

export type GeneratedAssetMap = Record<string, string>;

export type StoredAnalysis = {
  id: string;
  userId: string;
  encryptedOutput: string;
  timestamp: string;
};

export type StoredAnalysisPayload = {
  websiteUrl: string;
  hostname: string;
  extractedContent: {
    title: string;
    metaDescription: string;
    visibleText: string;
  };
  aiOutput: {
    markdown: string;
    analysis: GrowthResponse;
    agents: {
      strategist: string;
      copywriter: string;
      seo: string;
      conversion: string;
      distribution: string;
      reddit: string;
    };
  };
  feedback: FeedbackValue | null;
};

export type StoredAnalysisForExecution = {
  id: string;
  userId: string;
  websiteUrl: string;
  extractedContent: {
    title: string;
    metaDescription: string;
    visibleText: string;
  };
  aiOutput: {
    markdown: string;
    analysis: GrowthResponse;
    agents: {
      strategist: string;
      copywriter: string;
      seo: string;
      conversion: string;
      distribution: string;
      reddit: string;
    };
  };
  feedback: FeedbackValue | null;
  timestamp: string;
};

export type MemoryContext = {
  similarAnalyses: Array<{
    websiteUrl: string;
    timestamp: string;
    feedback: FeedbackValue | null;
    markdown: string;
  }>;
  positivePatterns: string[];
  negativePatterns: string[];
  stats: {
    totalAnalyses: number;
    positiveFeedback: number;
    negativeFeedback: number;
  };
};

export type Message =
  | {
      id: string;
      role: "user";
      url: string;
    }
  | {
      id: string;
      role: "assistant";
      type?: "analysis" | "audit";
      analysisId: string;
      url?: string;
      content: GrowthResponse;
      feedback: FeedbackValue | null;
      feedbackPending?: boolean;
      generatedAssets?: GeneratedAssetMap;
      actionPendingKeys?: string[];
      auditData?: {
        url?: string;
        productName: string;
        tagline: string;
        category: string;
        date: string;
        marketSnapshot: {
          addressableMarket: string;
          marketLeader: string;
          marketLeaderShare: string;
          competitorCount: string;
          competitorCountLabel: string;
        };
        competitors: Array<{
          name: string;
          positioning: string;
          focus: string;
          monetisation: string;
          ux: string;
          transparency: string;
          highlight: string;
          highlightType: "good" | "bad" | "neutral";
        }>;
        differentiatorRadar: Array<{
          label: string;
          score: number;
          max: number;
        }>;
        swot: {
          strengths: string[];
          weaknesses: string[];
          opportunities: string[];
          threats: string[];
        };
        growthOpportunities: Array<{
          rank: number;
          tag: string;
          tagType: "Revenue" | "Acquisition" | "Product" | "Retention" | "Trust";
          title: string;
          description: string;
        }>;
        verdict: {
          summary: string;
          coreOpportunity: string;
          criticalGap: string;
          technicalIssues: string[];
          monetisationPath: string;
        };
        founderScore: {
          overall: number;
          product: number;
          distribution: number;
          monetisation: number;
          defensibility: number;
          interpretation: string;
        };
        icp: {
          title: string;
          description: string;
          age: string;
          role: string;
          painPoint: string;
          whereTheyHangOut: string[];
          budgetRange: string;
          decisionTrigger: string;
        };
        messagingAngle: {
          oneLiner: string;
          tagline: string;
          heroHeadline: string;
          subheadline: string;
          reasoning: string;
        };
        pricingIntelligence: {
          competitors: Array<{
            name: string;
            price: string;
            model: string;
          }>;
          recommendedPrice: string;
          recommendedModel: string;
          pricingGap: string;
        };
        seoGaps: Array<{
          keyword: string;
          difficulty: "low" | "medium" | "high";
          volume: string;
          currentRanker: string;
          blogTitleIdea: string;
        }>;
        quickWins: Array<{
          task: string;
          deadline: string;
          impact: "high" | "medium" | "low";
          effort: "high" | "medium" | "low";
          howTo: string;
        }>;
        moatScore: {
          score: number;
          type: string;
          defensibility: string;
          risks: string[];
          suggestions: string[];
        };
        riskRadar: Array<{
          risk: string;
          severity: "critical" | "high" | "medium";
          timeline: string;
          mitigation: string;
        }>;
        geoScore: {
          score: number;
          grade: "A" | "B" | "C" | "D" | "F";
          passed: number;
          total: number;
          checks: Array<{
            name: string;
            passed: boolean;
            importance: "critical" | "high" | "medium";
            fix: string;
          }>;
          topFixes: string[];
        };
        battleCard: {
          competitors: Array<{
            name: string;
            whenMentioned: string;
            ourResponse: string;
            keyDifferentiator: string;
          }>;
        };
      };
    };
