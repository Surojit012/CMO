"use client";

import { useEffect, useRef, useState } from "react";
import { useCreateWallet, usePrivy, useToken, useWallets } from "@privy-io/react-auth";
import {
  checkAndPayIfNeeded,
  getRemainingFreeAnalyses,
  checkAndPayForAudit,
  getWalletBalanceWithMeta
} from "@/lib/arc-payment";
import type { ArcReceipt } from "@/lib/types";

import type {
  ActionResponse,
  ActionType,
  AnalyzeErrorResponse,
  AnalyzeSuccessResponse,
  CompareSuccessResponse,
  FeedbackResponse,
  FeedbackValue,
  GrowthSection,
  Message
} from "@/lib/types";
import { normalizeUrl } from "@/lib/url";
import { parseGrowthMarkdown } from "@/lib/parsers";

import { InputBar } from "./InputBar";
import { LoadingState } from "./LoadingState";
import { MessageBubble } from "./MessageBubble";
import { AutonomousMode } from "./AutonomousMode";
import { OutreachPlanView } from "./OutreachPlanView";
import { ComparisonReport } from "./ComparisonReport";
import { HistorySidebar, SavedReport, type HistorySession } from "./HistorySidebar";
import { OnboardingGuide } from "./OnboardingGuide";
import { AgentWarRoom } from "./AgentWarRoom";
import { History, PanelLeft, Swords, ChevronDown, ExternalLink, Zap } from "lucide-react";

const loadingSteps = [
  "Strategist defining plan...",
  "Copywriter generating hooks...",
  "SEO agent finding keywords...",
  "Conversion agent improving funnel...",
  "Distribution agent mapping channels...",
  "Chief agent synthesizing growth plan..."
] as const;

const compareLoadingSteps = [
  "Scraping both websites...",
  "Running 6 agents on your site...",
  "Running 6 agents on competitor...",
  "Quality-checking all outputs...",
  "Building head-to-head battle card...",
  "Determining the winner..."
] as const;

type ChatContainerProps = {
  userId: string;
  externalReport?: string | null;
  onReportLoaded?: () => void;
};

async function buildPrivyHeaders(getAccessToken: () => Promise<string | null>, sessionId?: string) {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (sessionId) headers["x-cmo-session-id"] = sessionId;
  return headers;
}

export function ChatContainer({ userId, externalReport, onReportLoaded }: ChatContainerProps) {
  const { user } = usePrivy();
  const { getAccessToken } = useToken();
  const { wallets } = useWallets();
  const { createWallet } = useCreateWallet();
  
  const [activeTab, setActiveTab] = useState<"analysis" | "audit" | "outreach">("analysis");
  const [analysisMessages, setAnalysisMessages] = useState<Message[]>([]);
  const [auditMessages, setAuditMessages] = useState<Message[]>([]);
  const messages = activeTab === "analysis" ? analysisMessages : auditMessages;
  const [outreachContext, setOutreachContext] = useState<AnalyzeSuccessResponse | null>(null);
  const [currentStep, setCurrentStep] = useState<(typeof loadingSteps)[number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isWarRoomActive, setIsWarRoomActive] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareUrl, setCompareUrl] = useState("");
  const [comparisonResult, setComparisonResult] = useState<CompareSuccessResponse | null>(null);
  const [freeRemaining, setFreeRemaining] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState("0.00");
  const [isFundingSetup, setIsFundingSetup] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [onboardingStep, setOnboardingStep] = useState<"input" | "waiting" | "done" | null>(null);
  const [arcReceipt, setArcReceipt] = useState<ArcReceipt | null>(null);
  const [receiptExpanded, setReceiptExpanded] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const loadingIntervalRef = useRef<number | null>(null);
  const requestControllerRef = useRef<AbortController | null>(null);

  const walletAddress = wallets?.[0]?.address;

  // Derive onboarding step
  useEffect(() => {
    if (activeTab !== "analysis" && activeTab !== "audit") {
      setOnboardingStep(null);
      return;
    }
    
    if (currentStep || isWarRoomActive) {
      setOnboardingStep("waiting");
    } else if (messages.length > 0) {
      setOnboardingStep("done");
    } else {
      setOnboardingStep("input");
    }
  }, [messages.length, currentStep, activeTab]);

  async function refreshWalletState(address: string) {
    const [freeResult, balanceResult] = await Promise.allSettled([
      getRemainingFreeAnalyses(address),
      getWalletBalanceWithMeta(address)
    ]);

    if (freeResult.status === "fulfilled") {
      setFreeRemaining(freeResult.value);
    }

    if (balanceResult.status === "fulfilled") {
      setUsdcBalance(balanceResult.value.formattedBalance);
    }
  }

  async function handleFundWalletClick() {
    setError(null);
    setIsFundingSetup(true);

    try {
      let address = wallets?.[0]?.address;

      if (!address) {
        const createdWallet = await createWallet();
        address = createdWallet?.address;
      }

      if (!address) {
        throw new Error("wallet_not_ready");
      }

      await refreshWalletState(address);
      window.dispatchEvent(new Event("open-fund-modal"));
    } catch {
      setError("Couldn’t initialize wallet. Please try again.");
    } finally {
      setIsFundingSetup(false);
    }
  }

  // Session Management
  useEffect(() => {
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 mins
    const lastActivity = localStorage.getItem("cmo_last_activity");
    const storedSession = localStorage.getItem("cmo_session_id");
    const now = Date.now();
    
    if (!storedSession || (lastActivity && now - parseInt(lastActivity) > SESSION_TIMEOUT)) {
      const newSession = crypto.randomUUID();
      localStorage.setItem("cmo_session_id", newSession);
      localStorage.setItem("cmo_last_activity", now.toString());
      setSessionId(newSession);
    } else {
      localStorage.setItem("cmo_last_activity", now.toString());
      setSessionId(storedSession);
    }
  }, []);

  const pingActivity = () => {
    localStorage.setItem("cmo_last_activity", Date.now().toString());
  };

  useEffect(() => {
    const address = wallets?.[0]?.address;
    if (!address) return;

    const fetchState = async () => {
      try {
        await refreshWalletState(address);
      } catch (err) {}
    };

    fetchState();
    const interval = setInterval(fetchState, 10000);
    return () => clearInterval(interval);
  }, [wallets]);

  useEffect(() => {
    viewportRef.current?.scrollTo({
      top: viewportRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, currentStep, error]);

  useEffect(() => {
    if (externalReport) {
      const growthResponse = parseGrowthMarkdown(externalReport);
      setAnalysisMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          analysisId: `autonomous-${Date.now()}`,
          content: growthResponse,
          feedback: null
        }
      ]);
      onReportLoaded?.();
    }
  }, [externalReport, onReportLoaded]);

  useEffect(() => {
    return () => {
      if (loadingIntervalRef.current) {
        window.clearInterval(loadingIntervalRef.current);
      }

      requestControllerRef.current?.abort();
    };
  }, []);

  function handleViewOutreach(message: Message) {
    if (message.role === "assistant" && message.content) {
      const successResponse: AnalyzeSuccessResponse = {
        analysisId: message.analysisId,
        analysis: message.content,
        url: message.url || "",
        markdown: "",
        agents: {} as any,
        extracted: { title: "", metaDescription: "", visibleText: "" }
      };
      setOutreachContext(successResponse);
      setActiveTab("outreach");
    }
  }

  function handleSessionSelect(session: HistorySession, specificAnalysis?: SavedReport) {
    setSessionId(session.sessionId);
    
    let nextTab: "analysis" | "audit" | "outreach" = "analysis";
    let activeAnalysisSet = false;
    let activeAuditSet = false;
    let activeOutreachSet = false;

    // Reset current state to avoid contamination from previous session
    setAnalysisMessages([]);
    setAuditMessages([]);
    setOutreachContext(null);

    // Process all analyses in the session to hot-load the tabs natively
    session.analyses.forEach(report => {
      if (report.type === "analysis" && !activeAnalysisSet) {
        setAnalysisMessages([
          {
            id: report.id,
            role: "assistant",
            analysisId: report.id,
            content: report.data.analysis,
            feedback: null
          }
        ]);
        activeAnalysisSet = true;
      } else if (report.type === "audit" && !activeAuditSet) {
        setAuditMessages([
          {
            id: report.id,
            role: "assistant",
            type: "audit",
            analysisId: report.id,
            content: {} as any,
            auditData: report.data,
            feedback: null
          }
        ]);
        activeAuditSet = true;
      } else if (report.type === "outreach" && !activeOutreachSet) {
        const dummyId = `saved-outreach-${report.id}`;
        setOutreachContext({
          analysisId: dummyId,
          analysis: {} as any,
          url: report.url,
          markdown: "",
          agents: {} as any,
          extracted: { title: "", metaDescription: "", visibleText: "" }
        });
        activeOutreachSet = true;
      }
    });

    // Default to resolving the explicit tab clicked or highest priority tab
    if (specificAnalysis) {
      nextTab = specificAnalysis.type;
    } else {
      if (activeAnalysisSet) nextTab = "analysis";
      else if (activeAuditSet) nextTab = "audit";
      else if (activeOutreachSet) nextTab = "outreach";
    }

    setActiveTab(nextTab);
  }

  async function handleCompareSubmit() {
    const url1 = normalizeUrl(inputValue.trim());
    const url2 = normalizeUrl(compareUrl.trim());
    if (!url1 || !url2) {
      setError("Both URLs are required for comparison.");
      return;
    }
    setError(null);
    setComparisonResult(null);

    const wallet = wallets?.[0];
    if (showPaymentUpsell) {
      if (!wallet) {
        setError("Please connect your wallet first.");
        return;
      }
      const balance = parseFloat(usdcBalance);
      if (balance < 10) {
        await handleFundWalletClick();
        return;
      }
    }

    // Run comparison pipeline FIRST
    setCurrentStep(compareLoadingSteps[0] as typeof loadingSteps[number]);
    let stepIndex = 0;
    loadingIntervalRef.current = window.setInterval(() => {
      stepIndex = Math.min(stepIndex + 1, compareLoadingSteps.length - 1);
      setCurrentStep(compareLoadingSteps[stepIndex] as typeof loadingSteps[number]);
    }, 4000);

    let data: CompareSuccessResponse;
    try {
      pingActivity();
      requestControllerRef.current = new AbortController();
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: await buildPrivyHeaders(getAccessToken, sessionId),
        signal: requestControllerRef.current.signal,
        body: JSON.stringify({ url1, url2 })
      });
      const resData = await response.json();
      if (!response.ok || "error" in resData) {
        throw new Error("error" in resData ? resData.error : "Comparison failed.");
      }
      data = resData as CompareSuccessResponse;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setCurrentStep(null);
      setError(err instanceof Error ? err.message : "Comparison failed. You have not been charged.");
      if (loadingIntervalRef.current) {
        window.clearInterval(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
      return;
    } finally {
      requestControllerRef.current = null;
    }

    // GENERATION SUCCESS. NOW CHARGE.
    if (loadingIntervalRef.current) window.clearInterval(loadingIntervalRef.current);
    
    try {
      if (wallet) {
        setCurrentStep("Report drafted! Authorizing payment..." as any);
        const targetChainId = Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID || 5042002);
        if (wallet.chainId !== `eip155:${targetChainId}`) {
          try { await wallet.switchChain(targetChainId); } catch { /* ignore */ }
        }
        const provider = await wallet.getEthereumProvider();

        // First charge
        setCurrentStep(showPaymentUpsell ? "Processing payment 1 of 2..." as any : "Authorizing free usage 1 of 2..." as any);
        const res1 = await checkAndPayIfNeeded(provider, wallet.address);
        if (!res1.success) {
          if (res1.error === "insufficient_balance") throw new Error("Payment 1 failed due to insufficient funds.");
          throw new Error(`Payment 1 failed: ${res1.error}`);
        }

        // Second charge
        setCurrentStep(showPaymentUpsell ? "Processing payment 2 of 2..." as any : "Authorizing free usage 2 of 2..." as any);
        const res2 = await checkAndPayIfNeeded(provider, wallet.address);
        if (!res2.success) {
          if (res2.error === "insufficient_balance") throw new Error("Payment 2 failed due to insufficient funds.");
          throw new Error(`Payment 2 failed: ${res2.error}`);
        }
        if (res2.newBalance) setUsdcBalance(res2.newBalance);
        const newFree = await getRemainingFreeAnalyses(wallet.address);
        setFreeRemaining(newFree);
      }
    } catch (payErr: any) {
      setCurrentStep(null);
      setError(payErr.message || "Payment failed. Report not released.");
      return;
    }

    // ALL SUCCESS -> RENDER RESULT
    setCurrentStep(null);
    setComparisonResult(data);
    setInputValue("");
    setCompareUrl("");
  }

  async function handleSubmit(rawUrl: string) {
    const normalizedUrl = normalizeUrl(rawUrl);
    setError(null);
    setComparisonResult(null);
    const targetTab = activeTab;
    const updateTargetMessages = (updater: (curr: Message[]) => Message[]) => {
      if (targetTab === "analysis") setAnalysisMessages(updater);
      else setAuditMessages(updater);
    };

    if (targetTab === "audit") {
      setError(null);

      const wallet = wallets?.[0];
      if (!wallet) {
        setError("Please connect your wallet first.");
        return;
      }

      // Check balance upfront before doing expensive operations
      const balance = parseFloat(usdcBalance);
      if (balance < 15) {
        await handleFundWalletClick();
        return;
      }

      // Start Drafting Process BEFORE processing actual payment subtraction
      updateTargetMessages((curr) => [
        ...curr,
        { id: crypto.randomUUID(), role: "user", url: normalizedUrl }
      ]);
      
      const auditLoadingSteps = [
        "Scraping website...",
        "Running Tavily parallel searches...",
        "Analysing competitors & pricing...",
        "Mapping market landscape...",
        "Building audit report...",
        "Finalising verdict..."
      ];
      
      setCurrentStep(auditLoadingSteps[0] as any);
      let stepIndex = 0;
      loadingIntervalRef.current = window.setInterval(() => {
        stepIndex = Math.min(stepIndex + 1, auditLoadingSteps.length - 1);
        setCurrentStep(auditLoadingSteps[stepIndex] as any);
      }, 5000);

      try {
        pingActivity();
        requestControllerRef.current = new AbortController();
        const response = await fetch("/api/market-audit", {
          method: "POST",
          headers: await buildPrivyHeaders(getAccessToken, sessionId),
          signal: requestControllerRef.current.signal,
          body: JSON.stringify({ url: normalizedUrl })
        });
        const data = await response.json();
        
        if (!response.ok || "error" in data) {
          throw new Error("error" in data ? data.error : "Audit failed to generate.");
        }
        
        // VALIDATION CHECK: Ensure AI didn't hallucinate missing sections before charging
        const isValid = data?.marketSnapshot && data?.founderScore && data?.competitors && data?.verdict;
        if (!isValid) {
          throw new Error("The AI failed to format the report correctly. Please try again. You have NOT been charged.");
        }

        // GENERATION SUCCESS. NOW CHARGE THE USER.
        if (loadingIntervalRef.current) window.clearInterval(loadingIntervalRef.current);
        setCurrentStep("Audit drafted! Authorizing $15 USDC payment..." as any);

        const targetChainId = Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID || 5042002);
        if (wallet.chainId !== `eip155:${targetChainId}`) {
          try {
            await wallet.switchChain(targetChainId);
          } catch (e) {
             console.warn("Could not switch chain, proceeding anyway:", e);
          }
        }

        const provider = await wallet.getEthereumProvider();
        const payResult = await checkAndPayForAudit(provider, wallet.address);

        if (!payResult.success) {
          throw new Error(payResult.error === "insufficient_balance" ? "Payment failed due to insufficient funds." : `Payment failed: ${payResult.error}`);
        }

        if (payResult.newBalance) setUsdcBalance(payResult.newBalance);
        
        // EVERYTHING SUCCESSFUL. RENDER THE REPORT.
        setCurrentStep(null);
        updateTargetMessages((curr) => [
          ...curr,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            type: "audit",
            analysisId: `audit-${Date.now()}`,
            content: {} as any,
            auditData: data,
            feedback: null
          }
        ]);
        setInputValue("");
      } catch (err: any) {
        if (err.name === "AbortError") return;
        setCurrentStep(null);
        setError(err.message || "Something went wrong. You have not been charged.");
      } finally {
        requestControllerRef.current = null;
        if (loadingIntervalRef.current) {
          window.clearInterval(loadingIntervalRef.current);
          loadingIntervalRef.current = null;
        }
      }
      return;
    }

    // PRE-CHECK BALANCE
    const wallet = wallets?.[0];
    if (showPaymentUpsell && wallet) {
      const balance = parseFloat(usdcBalance);
      if (balance < 5) {
        await handleFundWalletClick();
        return;
      }
    }

    // Start Analysis BEFORE payment
    updateTargetMessages((currentMessages) => [
      ...currentMessages,
      {
        id: crypto.randomUUID(),
        role: "user",
        url: normalizedUrl
      }
    ]);

    // Activate War Room
    setIsWarRoomActive(true);

    let data: AnalyzeSuccessResponse;

    try {
      pingActivity();
      requestControllerRef.current = new AbortController();

      const analyzeHeaders = await buildPrivyHeaders(getAccessToken, sessionId);
      if (walletAddress) {
        analyzeHeaders["x-user-wallet-address"] = walletAddress;
      }
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: analyzeHeaders,
        signal: requestControllerRef.current.signal,
        body: JSON.stringify({
          url: normalizedUrl
        })
      });

      const resData = (await response.json()) as AnalyzeSuccessResponse | AnalyzeErrorResponse;

      if (!response.ok || "error" in resData) {
        throw new Error("error" in resData ? resData.error : "Analysis failed.");
      }

      data = resData as AnalyzeSuccessResponse;
    } catch (submitError) {
      if (submitError instanceof Error && submitError.name === "AbortError") {
        setIsWarRoomActive(false);
        return;
      }

      setIsWarRoomActive(false);
      setCurrentStep(null);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong while analyzing the website. You have not been charged."
      );
      // Remove optimistic user message
      updateTargetMessages(curr => curr.filter(m => m.role !== "user"));
      return;
    } finally {
      requestControllerRef.current = null;
    }

    // War room done — transition to payment phase
    setIsWarRoomActive(false);

    // CHARGE USER WALLET (same flow as before — free quota + $5 USDC)
    try {
      if (wallet) {
        setCurrentStep(showPaymentUpsell ? ("Report drafted! Processing payment..." as any) : ("Authorizing free usage..." as any));
        
        const targetChainId = Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID || 5042002);
        if (wallet.chainId !== `eip155:${targetChainId}`) {
          try {
            await wallet.switchChain(targetChainId);
          } catch (e) {
             console.warn("Could not switch chain, proceeding anyway:", e);
          }
        }

        const provider = await wallet.getEthereumProvider();
        const res = await checkAndPayIfNeeded(provider, wallet.address);
        
        if (!res.success) {
          throw new Error(res.error === "insufficient_balance" ? "Payment failed due to insufficient funds." : `Web3 Payment Failed: ${res.error}`);
        }

        if (res.success) {
          if (res.newBalance) setUsdcBalance(res.newBalance);
          setFreeRemaining(res.remaining);
        }
      }
    } catch (paymentError: any) {
      setCurrentStep(null);
      setError(paymentError.message || "Failed to execute Web3 payment transaction. Report not released.");
      // Remove optimistic user message
      updateTargetMessages(curr => curr.filter(m => m.role !== "user"));
      return;
    }

    // ALL SUCCESS -> RENDER RESULT
    setCurrentStep(null);
    updateTargetMessages((currentMessages) => [
      ...currentMessages,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        analysisId: data.analysisId,
        content: data.analysis,
        feedback: null
      }
    ]);
    setInputValue("");

    // Store Arc nanopayment receipt if present
    if (data.arcReceipt) {
      setArcReceipt(data.arcReceipt);
      setReceiptExpanded(false);
    }
  }

  async function handleFeedback(analysisId: string, feedback: FeedbackValue) {
    const pendingUpdater = (currentMessages: Message[]) =>
      currentMessages.map((message) =>
        message.role === "assistant" && message.analysisId === analysisId
          ? { ...message, feedbackPending: true }
          : message
      );
    setAnalysisMessages(pendingUpdater);
    setAuditMessages(pendingUpdater);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: await buildPrivyHeaders(getAccessToken),
        body: JSON.stringify({
          analysisId,
          feedback
        })
      });

      const data = (await response.json()) as FeedbackResponse | AnalyzeErrorResponse;

      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Unable to save feedback.");
      }

      const successUpdater = (currentMessages: Message[]) =>
        currentMessages.map((message) =>
          message.role === "assistant" && message.analysisId === analysisId
            ? { ...message, feedback: data.feedback, feedbackPending: false }
            : message
        );
      setAnalysisMessages(successUpdater);
      setAuditMessages(successUpdater);
    } catch (feedbackError) {
      const errUpdater = (currentMessages: Message[]) =>
        currentMessages.map((message) =>
          message.role === "assistant" && message.analysisId === analysisId
            ? { ...message, feedbackPending: false }
            : message
        );
      setAnalysisMessages(errUpdater);
      setAuditMessages(errUpdater);

      setError(feedbackError instanceof Error ? feedbackError.message : "Unable to save feedback.");
    }
  }

  function buildAssetKey(section: GrowthSection, sourceText: string, actionType: ActionType) {
    return `${section}::${actionType}::${sourceText}`;
  }

  async function handleAction(
    analysisId: string,
    section: GrowthSection,
    sourceText: string,
    actionType: ActionType
  ) {
    const assetKey = buildAssetKey(section, sourceText, actionType);

    const pendingUpdater = (currentMessages: Message[]) =>
      currentMessages.map((message) =>
        message.role === "assistant" && message.analysisId === analysisId
          ? {
              ...message,
              actionPendingKeys: [...new Set([...(message.actionPendingKeys ?? []), assetKey])]
            }
          : message
      );
    setAnalysisMessages(pendingUpdater);
    setAuditMessages(pendingUpdater);

    try {
      const response = await fetch("/api/actions", {
        method: "POST",
        headers: await buildPrivyHeaders(getAccessToken),
        body: JSON.stringify({
          analysisId,
          section,
          sourceText,
          actionType
        })
      });

      const data = (await response.json()) as ActionResponse | AnalyzeErrorResponse;

      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Unable to generate asset.");
      }

      const successUpdater = (currentMessages: Message[]) =>
        currentMessages.map((message) =>
          message.role === "assistant" && message.analysisId === analysisId
            ? {
                ...message,
                generatedAssets: {
                  ...(message.generatedAssets ?? {}),
                  [assetKey]: data.output
                },
                actionPendingKeys: (message.actionPendingKeys ?? []).filter((key) => key !== assetKey)
              }
            : message
        );
      setAnalysisMessages(successUpdater);
      setAuditMessages(successUpdater);
    } catch (actionError) {
      const errUpdater = (currentMessages: Message[]) =>
        currentMessages.map((message) =>
          message.role === "assistant" && message.analysisId === analysisId
            ? {
                ...message,
                actionPendingKeys: (message.actionPendingKeys ?? []).filter((key) => key !== assetKey)
              }
            : message
        );
      setAnalysisMessages(errUpdater);
      setAuditMessages(errUpdater);

      setError(actionError instanceof Error ? actionError.message : "Unable to generate asset.");
    }
  }

  const isNeedsPayment = activeTab === "analysis" ? freeRemaining === 0 : true;
  const showPaymentUpsell = isNeedsPayment;
  const comparePrice = 10;
  const singlePrice = activeTab === "analysis" ? 5 : 15;
  const requiredBalance = compareMode ? comparePrice : singlePrice;
  const hasSufficientBalance = parseFloat(usdcBalance) >= requiredBalance;

  let buttonLabel = "";
  if (activeTab === "analysis" && compareMode) {
    if (showPaymentUpsell) {
      if (isFundingSetup) buttonLabel = "Preparing Wallet...";
      else if (hasSufficientBalance) buttonLabel = "Pay $10 & Compare";
      else buttonLabel = "Fund to Compare";
    } else {
      buttonLabel = "Compare Both Sites →";
    }
  } else if (activeTab === "analysis") {
    if (showPaymentUpsell) {
      if (isFundingSetup) buttonLabel = "Preparing Wallet...";
      else if (hasSufficientBalance) buttonLabel = "Pay $5 & Analyze";
      else buttonLabel = "Fund to Analyze";
    } else {
      buttonLabel = "Analyze";
    }
  } else {
    // Audit strictly requires $15
    if (isFundingSetup) buttonLabel = "Preparing Wallet...";
    else if (hasSufficientBalance) buttonLabel = "Pay $15 & Audit";
    else buttonLabel = "Fund to Audit";
  }

  const onButtonClickHandler = showPaymentUpsell && !hasSufficientBalance 
    ? () => void handleFundWalletClick() 
    : compareMode 
      ? () => void handleCompareSubmit()
      : undefined;

  const hasMessages = messages.length > 0 || Boolean(currentStep) || isWarRoomActive;

  return (
    <div className="flex w-full relative min-h-[calc(100vh-65px)]">
      {onboardingStep && <OnboardingGuide step={onboardingStep} />}
      <HistorySidebar 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        onSessionSelect={handleSessionSelect}
        activeSessionId={sessionId}
      />
      
      <div className="flex-1 flex flex-col relative w-full h-full">
        {/* Toggle Button (Visible only when sidebar is closed) */}
        {user?.id && (
          <div className={`absolute top-2 left-2 sm:top-5 sm:left-4 z-40 transition-all duration-300 ${isHistoryOpen ? 'opacity-0 pointer-events-none translate-x-[-20px]' : 'opacity-100 pointer-events-auto translate-x-0'}`}>
            <button 
              onClick={() => setIsHistoryOpen(true)} 
              className="p-2 rounded-lg bg-zinc-50 border border-zinc-200/80 text-zinc-500 hover:bg-white hover:text-zinc-900 transition shadow-sm flex items-center justify-center opacity-80 hover:opacity-100"
              title="Open history sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        <section className="mx-auto flex w-full max-w-[700px] flex-1 flex-col px-3 pb-44 pt-6 sm:px-5 sm:pb-40 sm:pt-10 md:px-6 md:pb-44 md:pt-14 relative">
          <header className="mb-6 space-y-1.5 text-center sm:mb-10 sm:space-y-2 md:mb-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-950">CMO</p>
            <p className="text-sm text-zinc-500">Your AI Growth Team</p>
          </header>

          {/* Tab Switcher */}
          <div className="flex justify-center mb-4 sm:mb-6">

        <div className="flex items-center rounded-full bg-zinc-100/80 p-1 ring-1 ring-black/5">
          <button
            onClick={() => { setActiveTab('analysis'); setCompareMode(false); setComparisonResult(null); }}
            className={`rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 ${
              activeTab === 'analysis' 
                ? 'bg-zinc-950 text-white shadow-md' 
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Growth Analysis
          </button>
          <button
            onClick={() => { setActiveTab('audit'); setCompareMode(false); setComparisonResult(null); }}
            className={`rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 ${
              activeTab === 'audit' 
                ? 'bg-zinc-950 text-white shadow-md' 
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Market Audit
          </button>
          <button
            onClick={() => { setActiveTab('outreach'); setCompareMode(false); setComparisonResult(null); }}
            className={`rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 ${
              activeTab === 'outreach' 
                ? 'bg-zinc-950 text-white shadow-md' 
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Outreach Engine
          </button>
        </div>
      </div>

      {/* Compare Mode Toggle — only visible on analysis tab */}
      {activeTab === "analysis" && (
        <div className="flex justify-center mb-6 sm:mb-10">
          <div className="flex items-center rounded-full bg-zinc-50 p-0.5 ring-1 ring-zinc-200/80">
            <button
              onClick={() => { setCompareMode(false); setComparisonResult(null); }}
              className={`rounded-full px-4 py-1.5 text-[11px] sm:text-xs font-semibold transition-all duration-200 ${
                !compareMode
                  ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/60'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              Single Analysis
            </button>
            <button
              onClick={() => { setCompareMode(true); setComparisonResult(null); }}
              className={`rounded-full px-4 py-1.5 text-[11px] sm:text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                compareMode
                  ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/60'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <Swords className="h-3 w-3" /> Compare Mode
            </button>
          </div>
        </div>
      )}

      <div
        ref={viewportRef}
        className="min-h-0 flex-1 space-y-5 overflow-y-auto scroll-smooth"
      >
        {/* Comparison result */}
        {comparisonResult && activeTab === "analysis" && (
          <ComparisonReport data={comparisonResult} />
        )}

        {activeTab !== "outreach" && !hasMessages && !comparisonResult ? (
          <section className="flex min-h-[30vh] flex-col items-center justify-center text-center sm:min-h-[45vh] md:min-h-[52vh]">
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-2xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-3xl md:text-4xl">
                {compareMode ? "Compare two sites head-to-head." : "Drop in a URL. Get a growth strategy back."}
              </h1>
              <p className="mx-auto max-w-xl text-[13px] leading-6 text-zinc-500 sm:text-sm sm:leading-7 md:text-base">
                {activeTab === "audit" 
                  ? "Deep competitive intelligence · $15 USDC per report"
                  : compareMode
                    ? "Enter your site and a competitor's URL. Get a battle card showing who wins and why."
                    : "A minimal AI interface that audits your website like a sharp growth team, then returns structured strategy, hooks, SEO plays, conversion fixes, and distribution ideas."}
              </p>
            </div>
          </section>
        ) : null}

        {activeTab !== "outreach" && messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onFeedback={handleFeedback}
            onAction={handleAction}
            onViewOutreach={handleViewOutreach}
            userId={userId}
          />
        ))}

        {activeTab === "outreach" && (
          outreachContext ? (
            <OutreachPlanView 
              analysisData={outreachContext} 
              sessionId={sessionId}
            />
          ) : (
            <section className="flex flex-col items-center justify-center text-center py-20 px-4">
              <div className="bg-zinc-100 p-4 rounded-full mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
              <h2 className="text-xl font-bold text-zinc-900 mb-2">No active context found.</h2>
              <p className="text-sm text-zinc-500 max-w-sm mb-6">
                You need to run a Growth Analysis first to generate a customized community outreach plan.
              </p>
              <button 
                onClick={() => setActiveTab('analysis')}
                className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Go to Growth Analysis
              </button>
            </section>
          )
        )}

        {isWarRoomActive && activeTab === "analysis" ? <AgentWarRoom active={isWarRoomActive} /> : null}
        {currentStep && !isWarRoomActive ? <LoadingState currentStep={currentStep} steps={[...loadingSteps]} /> : null}

        {/* ⚡ Arc Nanopayment Receipt */}
        {arcReceipt && activeTab === "analysis" && messages.length > 0 && !currentStep && !isWarRoomActive && (
          <div className="mt-4 rounded-xl border border-white/10 bg-zinc-900 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
            <button
              onClick={() => setReceiptExpanded(!receiptExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-xs font-semibold text-zinc-300">
                  Settled {arcReceipt.totalCost} across {arcReceipt.settledCount} agent jobs on Arc Testnet
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${receiptExpanded ? 'rotate-180' : ''}`} />
            </button>

            {receiptExpanded && (
              <div className="px-4 pb-4 border-t border-white/5">
                <div className="mt-3 space-y-1.5">
                  {arcReceipt.jobs.map((job, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] font-mono">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${job.status === 'settled' ? 'bg-emerald-400' : job.status === 'failed' ? 'bg-red-400' : 'bg-zinc-600'}`} />
                        <span className="text-zinc-400">{job.agentName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-500">{job.cost} USDC</span>
                        {job.txHash && (
                          <a
                            href={`https://testnet.arcscan.app/tx/${job.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-600 hover:text-zinc-300 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500 font-medium">
                    {arcReceipt.settledCount}/{arcReceipt.jobCount} jobs settled
                  </span>
                  <span className="text-zinc-300 font-bold">
                    Total: {arcReceipt.totalCost}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 flex justify-center px-2 pb-3 sm:px-4 sm:pb-5 md:pb-7">
        <div className="pointer-events-auto w-full max-w-[740px]">
          <div className="rounded-[24px] bg-gradient-to-t from-[#f3f2ef] via-[#f3f2ef]/95 to-transparent px-1 pt-6 sm:rounded-[32px] sm:pt-10">
            
            {/* INLINE WEB3 PAYMENT UPSELL BANNER */}
            {activeTab !== "outreach" && showPaymentUpsell && !hasSufficientBalance && (
              <div className="mb-3 mx-2 rounded-2xl bg-orange-50/80 p-3 border border-orange-200/60 shadow-sm flex flex-col items-center text-center animate-in slide-in-from-bottom-2 fade-in backdrop-blur-sm sm:mb-4 sm:mx-3 sm:p-5">
                <h3 className="text-sm font-bold text-orange-900 mb-1 flex items-center gap-1.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  {activeTab === "audit" ? "Market Audits require $15 USDC" : "You've used your 3 free analyses"}
                </h3>
                <p className="text-xs text-orange-700/90 mb-4 font-medium">
                  {activeTab === "audit" 
                    ? "Fund your wallet to continue — $15 per audit." 
                    : "Fund your wallet to continue — $5 per analysis."}
                </p>
                <p className="text-[11px] text-orange-700/80 mb-4 font-medium">
                  {activeTab === "audit" ? "Deep competitive intelligence" : "3 free analyses · one time"}
                </p>
                
                <div className="flex flex-wrap items-center justify-center gap-2 bg-white/90 px-3 py-2 rounded-xl shadow-sm border border-orange-100/80 w-fit sm:gap-3 sm:px-4 sm:py-2.5">
                   <span className="font-mono text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md">
                     {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "No wallet yet"}
                   </span>
                   <span className="font-bold text-sm text-zinc-900 flex items-center gap-1.5">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500"><circle cx="12" cy="12" r="10"></circle><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 18V6"></path></svg>
                     {usdcBalance}
                   </span>
                   <button
                     onClick={handleFundWalletClick}
                     disabled={isFundingSetup}
                     className="text-[11px] bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1.5 ml-1 rounded-md font-bold transition-colors uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-60"
                   >
                      {isFundingSetup ? "Preparing..." : "Fund Wallet"}
                   </button>
                </div>
              </div>
            )}

            {error ? <p className="mb-3 px-3 text-sm font-medium text-red-600 animate-in fade-in">{error}</p> : null}
            
            {activeTab !== "outreach" && (
              <div className="space-y-2">
                <InputBar
                  disabled={loadingIntervalRef.current !== null || isFundingSetup || isWarRoomActive}
                  value={inputValue}
                  onChange={setInputValue}
                  onSubmit={compareMode ? () => void handleCompareSubmit() : handleSubmit}
                  onButtonClick={onButtonClickHandler}
                  buttonLabel={buttonLabel}
                  buttonLoading={isFundingSetup}
                  placeholder={activeTab === "audit" ? "Enter any website URL to audit..." : compareMode ? "Your site — e.g., https://trycmo.com" : "E.g., https://trycmo.com"}
                />

                {/* Compare mode: second URL input */}
                {compareMode && activeTab === "analysis" && (
                  <div className="animate-in slide-in-from-top-2 fade-in duration-300 space-y-2">
                    <div className="flex items-center justify-center gap-2 py-1">
                      <div className="h-px flex-1 bg-zinc-200" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">VS</span>
                      <div className="h-px flex-1 bg-zinc-200" />
                    </div>
                    <div className="flex flex-col gap-2 rounded-[20px] bg-white/92 p-2 shadow-[0_12px_50px_rgba(0,0,0,0.08)] ring-1 ring-black/5 backdrop-blur-md sm:rounded-[28px]">
                      <input
                        type="text"
                        inputMode="url"
                        placeholder="Competitor site — e.g., https://okara.ai"
                        aria-label="Competitor URL"
                        value={compareUrl}
                        onChange={(e) => setCompareUrl(e.target.value)}
                        disabled={loadingIntervalRef.current !== null || isFundingSetup}
                        className="h-11 flex-1 rounded-[16px] bg-transparent px-3 text-sm text-zinc-950 outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed sm:h-12 sm:rounded-[22px] sm:px-4"
                      />
                    </div>
                    <p className="text-center text-[10px] font-medium text-zinc-400">
                      Comparison uses 2 analyses ({showPaymentUpsell ? "$10 USDC" : "2 free credits"})
                    </p>
                  </div>
                )}
              </div>
            )}
              {user?.id && activeTab === 'analysis' && !compareMode && <AutonomousMode initialUrl={inputValue || messages.find(m => m.role === 'user')?.url || ""} />}
            </div>
          </div>
        </div>
        </section>
      </div>
    </div>
  );
}
