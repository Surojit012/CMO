export type OutreachCommunity = {
  name: string;
  platform: "Reddit" | "HackerNews" | "IndieHackers" | "Discord" | "Twitter" | "Forum";
  url: string;
  audience_size: string;
  fit_score: number;
  fit_reason: string;
  rules_note: string;
};

export type PostTemplate = {
  community: string;
  type: "feedback_ask" | "origin_story" | "value_post";
  title: string;
  body: string;
  alt_titles?: string[];
};

export type OutreachPhase = {
  phase_number: number;
  title: string;
  weeks: string;
  goal: string;
  actions: string[];
  post_template: PostTemplate;
};

export type WeeklyTasks = {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
};

export type KpiTargets = {
  site_visitors: number;
  free_uses: number;
  paid_conversions: number;
  feedback_messages: number;
  communities_active: number;
  case_studies: number;
};

export type OutreachPlan = {
  product_summary: string;
  icp: string;
  communities: OutreachCommunity[];
  phases: OutreachPhase[];
  weekly_tasks: WeeklyTasks;
  kpi_targets: KpiTargets;
  viral_angles: string[];
};
