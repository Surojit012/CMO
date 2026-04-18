"use client";

import type {
  ActionType,
  FeedbackValue,
  GeneratedAssetMap,
  GrowthResponse,
  GrowthSection,
  Message
} from "@/lib/types";
import { ExecuteButtons } from "./ExecuteButtons";
import { MarketAuditReport } from "./MarketAuditReport";

type MessageBubbleProps = {
  message: Message;
  userId: string;
  onFeedback?: (analysisId: string, feedback: FeedbackValue) => void;
  onAction?: (
    analysisId: string,
    section: GrowthSection,
    sourceText: string,
    actionType: ActionType
  ) => void;
  onViewOutreach?: (message: Message) => void;
};

type ActionConfig = {
  label: string;
  actionType: ActionType;
  mode: "Generate" | "Execute";
};

type SectionConfig = {
  title: string;
  key: GrowthSection;
  items: string[];
  actions: ActionConfig[];
};

function buildAssetKey(section: GrowthSection, sourceText: string, actionType: ActionType) {
  return `${section}::${actionType}::${sourceText}`;
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function copyToClipboard(content: string) {
  await navigator.clipboard.writeText(content);
}

function GeneratedAssetCard({
  assetKey,
  assets
}: {
  assetKey: string;
  assets: GeneratedAssetMap | undefined;
}) {
  const output = assets?.[assetKey];

  if (!output) {
    return null;
  }

  return (
    <div className="mt-3 rounded-xl bg-zinc-50 px-3 py-3 ring-1 ring-black/5 sm:rounded-2xl sm:px-4 sm:py-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Execution Output
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => copyToClipboard(output)}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 ring-1 ring-black/5 transition hover:bg-zinc-100"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={() => downloadTextFile("growth-asset.txt", output)}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 ring-1 ring-black/5 transition hover:bg-zinc-100"
          >
            Download
          </button>
        </div>
      </div>
      <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-700 sm:text-[14px]">
        {parseHighlights(output)}
      </div>
    </div>
  );
}

function parseHighlights(text: string) {
  if (typeof text !== "string") return text;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const content = part.slice(2, -2);
      return (
        <strong
          key={i}
          className="font-semibold text-zinc-950"
        >
          {content}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function ResponseSection({
  title,
  sectionKey,
  items,
  actions,
  analysisId,
  generatedAssets,
  actionPendingKeys,
  onAction
}: {
  title: string;
  sectionKey: GrowthSection;
  items: string[];
  actions: ActionConfig[];
  analysisId: string;
  generatedAssets?: GeneratedAssetMap;
  actionPendingKeys?: string[];
  onAction?: (
    analysisId: string,
    section: GrowthSection,
    sourceText: string,
    actionType: ActionType
  ) => void;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold tracking-[-0.02em] text-zinc-950">{title}</h3>
      <ul className="space-y-4 text-sm leading-6 text-zinc-700">
        {items.map((item, index) => {
          const isReddit = sectionKey === "redditOpportunities";
          const isSubreddit = isReddit && (item.trim().startsWith("r/") || item.toLowerCase().includes("subreddit"));
          const isComment = isReddit && (item.trim().startsWith("\"") || item.trim().startsWith("Comment:"));
          
          return (
            <li key={`${title}-${index}`} className="rounded-xl bg-white/70 px-3 py-3 ring-1 ring-black/5 sm:rounded-2xl sm:px-4 sm:py-4">
              <div className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-900" />
                <div className="min-w-0 flex-1">
                  {isSubreddit ? (
                    <a 
                      href={`https://reddit.com/${item.trim().match(/r\/[a-zA-Z0-9_]+/)?.[0] || ""}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600 ring-1 ring-orange-200 transition hover:bg-orange-100"
                    >
                      {item}
                    </a>
                  ) : isComment ? (
                    <div className="space-y-2">
                       <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Sample Comment</p>
                       <div className="relative group">
                         <pre className="whitespace-pre-wrap rounded-xl bg-zinc-50 p-3 text-xs font-mono text-zinc-800 ring-1 ring-black/5">
                           {parseHighlights(item.replace(/^["']|["']$/g, '').replace(/^Comment:\s*/i, ''))}
                         </pre>
                         <button 
                           onClick={() => copyToClipboard(item.replace(/^["']|["']$/g, '').replace(/^Comment:\s*/i, ''))}
                           className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-2 py-1 rounded-md text-[10px] font-bold text-zinc-500 shadow-sm border border-zinc-200"
                         >
                           Copy
                         </button>
                       </div>
                    </div>
                  ) : (
                    <p className="leading-relaxed">{parseHighlights(item)}</p>
                  )}
                  
                  {!isSubreddit && !isComment && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {actions.map((action) => {
                        const assetKey = buildAssetKey(sectionKey, item, action.actionType);
                        const pending = actionPendingKeys?.includes(assetKey);

                        return (
                          <button
                            key={assetKey}
                            type="button"
                            disabled={pending}
                            onClick={() => onAction?.(analysisId, sectionKey, item, action.actionType)}
                            className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {pending ? `${action.mode}...` : action.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <GeneratedAssetCard assetKey={buildAssetKey(sectionKey, item, "tweet_thread")} assets={generatedAssets} />
                  <GeneratedAssetCard assetKey={buildAssetKey(sectionKey, item, "ad_copy")} assets={generatedAssets} />
                  <GeneratedAssetCard assetKey={buildAssetKey(sectionKey, item, "blog_post")} assets={generatedAssets} />
                  <GeneratedAssetCard assetKey={buildAssetKey(sectionKey, item, "content_plan")} assets={generatedAssets} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function AssistantResponse({
  message,
  onAction,
  userId,
  onViewOutreach
}: {
  message: Extract<Message, { role: "assistant" }>;
  userId: string;
  onAction?: (
    analysisId: string,
    section: GrowthSection,
    sourceText: string,
    actionType: ActionType
  ) => void;
  onViewOutreach?: (message: Message) => void;
}) {
  const sections: SectionConfig[] = [
    {
      title: "🚨 Critical Issues",
      key: "criticalIssues",
      items: message.content.criticalIssues,
      actions: []
    },
    {
      title: "Growth Strategy",
      key: "growthStrategy",
      items: message.content.growthStrategy,
      actions: [{ label: "Generate Ad Copy", actionType: "ad_copy", mode: "Generate" }]
    },
    {
      title: "Viral Hooks",
      key: "viralHooks",
      items: message.content.viralHooks,
      actions: [
        { label: "Generate Tweet Thread", actionType: "tweet_thread", mode: "Generate" },
        { label: "Create Ad Copy", actionType: "ad_copy", mode: "Execute" }
      ]
    },
    {
      title: "SEO Opportunities",
      key: "seoOpportunities",
      items: message.content.seoOpportunities,
      actions: [{ label: "Generate Blog Post", actionType: "blog_post", mode: "Generate" }]
    },
    {
      title: "Conversion Fixes",
      key: "conversionFixes",
      items: message.content.conversionFixes,
      actions: [{ label: "Create Ad Copy", actionType: "ad_copy", mode: "Execute" }]
    },
    {
      title: "Distribution Plan",
      key: "distributionPlan",
      items: message.content.distributionPlan,
      actions: [{ label: "Generate 7-day Content Plan", actionType: "content_plan", mode: "Generate" }]
    },
    {
      title: "Reddit Opportunities",
      key: "redditOpportunities",
      items: message.content.redditOpportunities,
      actions: []
    },
    {
      title: "💡 Unfair Advantage",
      key: "unfairAdvantage",
      items: message.content.unfairAdvantage,
      actions: []
    }
  ];

  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <ResponseSection
          key={section.key}
          title={section.title}
          sectionKey={section.key}
          items={section.items}
          actions={section.actions}
          analysisId={message.analysisId}
          generatedAssets={message.generatedAssets}
          actionPendingKeys={message.actionPendingKeys}
          onAction={onAction}
        />
      ))}
      <ExecuteButtons
        userId={userId}
        strategyContext={[
          "Critical Issues",
          ...message.content.criticalIssues.map((item) => `- ${item}`),
          "",
          "Growth Strategy",
          ...message.content.growthStrategy.map((item) => `- ${item}`),
          "",
          "Viral Hooks",
          ...message.content.viralHooks.map((item) => `- ${item}`),
          "",
          "SEO Opportunities",
          ...message.content.seoOpportunities.map((item) => `- ${item}`),
          "",
          "Conversion Fixes",
          ...message.content.conversionFixes.map((item) => `- ${item}`),
          "",
          "Distribution Plan",
          ...message.content.distributionPlan.map((item) => `- ${item}`),
          "",
          "Reddit Opportunities",
          ...message.content.redditOpportunities.map((item) => `- ${item}`),
          "",
          "Unfair Advantage",
          ...message.content.unfairAdvantage.map((item) => `- ${item}`)
        ].join("\n")}
      />
      
      <div className="mt-8 rounded-2xl bg-zinc-50 p-5 ring-1 ring-black/5 shadow-sm sm:p-6 sm:mt-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-zinc-900 mb-1">Take the next step</h4>
            <p className="text-xs text-zinc-500">Generate a complete, 8-week community outreach plan based on this analysis.</p>
          </div>
          <button 
            onClick={() => onViewOutreach?.(message)}
            className="shrink-0 rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 shadow-sm"
          >
            Generate Outreach Plan →
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-zinc-50 p-5 ring-1 ring-black/5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4">
          <div>
            <h4 className="text-sm font-bold text-zinc-900 mb-1">Show off your CMO Score</h4>
            <p className="text-xs text-zinc-500">Embed this script tag on your website to display a live CMO Growth Score badge and build trust with your visitors.</p>
          </div>
          <div className="relative group">
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-zinc-950 p-4 text-[11px] leading-relaxed font-mono text-zinc-300 ring-1 ring-black/5">
              {`<script src="https://trycmo.com/api/widget?url=${encodeURIComponent(message.url || 'your-domain.com')}" async></script>`}
            </pre>
            <button 
              type="button"
              onClick={() => copyToClipboard(`<script src="https://trycmo.com/api/widget?url=${encodeURIComponent(message.url || 'your-domain.com')}" async></script>`)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md text-[10px] font-bold text-white shadow-sm ring-1 ring-white/10 cursor-pointer"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MessageBubble({ message, userId, onFeedback, onAction, onViewOutreach }: MessageBubbleProps) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[90%] break-all rounded-[20px] bg-zinc-950 px-4 py-3 text-sm leading-6 text-white shadow-[0_12px_40px_rgba(0,0,0,0.12)] sm:max-w-[85%] sm:rounded-[28px] sm:px-5 sm:py-4">
          {message.url}
        </div>
      </div>
    );
  }

  if (message.type === "audit" && message.auditData) {
    return (
      <div className="w-full">
        {/* Pass an empty string for URL if we don't have it on the assistant message, or adjust accordingly */}
        <MarketAuditReport data={message.auditData} url={""} />
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="w-full rounded-[22px] bg-white/85 px-4 py-4 shadow-[0_10px_50px_rgba(0,0,0,0.06)] ring-1 ring-black/5 backdrop-blur-sm sm:rounded-[30px] sm:px-6 sm:py-6 md:px-7 md:py-7">
        <div className="space-y-6">
          <AssistantResponse message={message} onAction={onAction} userId={userId} onViewOutreach={onViewOutreach} />
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 sm:text-sm">
            <span className="mr-1">Was this helpful?</span>
            <button
              type="button"
              disabled={Boolean(message.feedback) || message.feedbackPending}
              onClick={() => onFeedback?.(message.analysisId, "positive")}
              className={[
                "rounded-full px-3 py-1.5 transition",
                message.feedback === "positive"
                  ? "bg-zinc-950 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200",
                message.feedbackPending ? "cursor-not-allowed opacity-60" : ""
              ].join(" ")}
            >
              👍 Helpful
            </button>
            <button
              type="button"
              disabled={Boolean(message.feedback) || message.feedbackPending}
              onClick={() => onFeedback?.(message.analysisId, "negative")}
              className={[
                "rounded-full px-3 py-1.5 transition",
                message.feedback === "negative"
                  ? "bg-zinc-950 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200",
                message.feedbackPending ? "cursor-not-allowed opacity-60" : ""
              ].join(" ")}
            >
              👎 Not useful
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
