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

import { ComparisonReport } from "./ComparisonReport";
import { HistorySidebar, SavedReport, type HistorySession } from "./HistorySidebar";
import { AgentWarRoom } from "./AgentWarRoom";

import { EmptyState } from "./workspace/EmptyState";
import { ReportGrid } from "./workspace/ReportGrid";
import { ExecuteBar } from "./workspace/ExecuteBar";
import { ArcReceipt as ArcReceiptPanel } from "./workspace/ArcReceipt";
import { MarketAuditView } from "./workspace/MarketAuditView";
import { OutreachView } from "./workspace/OutreachView";
import { ProgressTracker, type AgentRow } from "./workspace/ProgressTracker";
import { getAllAgentKeys, getAgentPrice } from "./workspace/AgentSelector";

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
  activeTab: "analysis" | "audit" | "outreach";
  onTabChange: (tab: "analysis" | "audit" | "outreach") => void;
  isHistoryOpen: boolean;
  onHistoryClose: () => void;
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

export function ChatContainer({ userId, externalReport, onReportLoaded, activeTab, onTabChange, isHistoryOpen, onHistoryClose }: ChatContainerProps) {
  const { user, authenticated } = usePrivy();
  const { getAccessToken } = useToken();
  const { wallets } = useWallets();
  const { createWallet } = useCreateWallet();
  
  const setActiveTab = onTabChange;
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
  const [sessionId, setSessionId] = useState<string>("");
  const [onboardingStep, setOnboardingStep] = useState<"input" | "waiting" | "done" | null>(null);
  const [arcReceipt, setArcReceipt] = useState<ArcReceipt | null>(null);
  const [receiptExpanded, setReceiptExpanded] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<string[]>(getAllAgentKeys());
  const [autonomousEnabled, setAutonomousEnabled] = useState(false);
  const [autonomousLoading, setAutonomousLoading] = useState(false);
  const [warRoomElapsed, setWarRoomElapsed] = useState(0);
  const [activePlan, setActivePlan] = useState<string>("payperuse");

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

  useEffect(() => {
    const fetchPlan = () => {
      try {
        const rawData = localStorage.getItem("cmo_onboarding_data");
        if (rawData) {
          const parsed = JSON.parse(rawData);
          if (parsed.plan) {
            setActivePlan(parsed.plan);
            if (parsed.plan === "weekly") {
              setSelectedAgents(["strategist", "copywriter", "seo"]);
            }
          }
        }
      } catch(e) {}
    };

    fetchPlan();
    window.addEventListener("refresh-wallet-stats", fetchPlan);
    return () => window.removeEventListener("refresh-wallet-stats", fetchPlan);
  }, []);

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
      if (activeTab === "audit") {
        try {
          const auditData = JSON.parse(externalReport);
          setAuditMessages([
            {
              id: crypto.randomUUID(),
              role: "assistant",
              type: "audit",
              auditData: auditData
            } as any
          ]);
        } catch (e) {
          console.error("Failed to parse audit history", e);
        }
      } else if (activeTab === "outreach") {
        try {
          const planData = JSON.parse(externalReport);
          // For outreach history, we set the context to a mock AnalyzeSuccessResponse 
          // containing the plan, or we can just pass the plan down.
          // The easiest way is to pass the plan through outreachContext but cast it appropriately.
          // Since outreachContext expects AnalyzeSuccessResponse, we can pass it as a special flag.
          setOutreachContext(planData as any);
        } catch (e) {
          console.error("Failed to parse outreach history", e);
        }
      } else {
        try {
          // In history, analysis data is saved as an AnalyzeSuccessResponse object
          const data = JSON.parse(externalReport);
          
          // If it's a legacy saved report it might be just markdown, handle both
          if (data && typeof data === 'object' && 'analysis' in data) {
            setAnalysisMessages([
              {
                id: crypto.randomUUID(),
                role: "assistant",
                analysisId: data.analysisId || `history-${Date.now()}`,
                content: data.analysis,
                rawAgents: data.agents,
                selectedAgents: data.selectedAgents,
                feedback: null
              }
            ]);
          } else {
            // Fallback for old markdown-only history
            const growthResponse = parseGrowthMarkdown(externalReport);
            setAnalysisMessages([
              {
                id: crypto.randomUUID(),
                role: "assistant",
                analysisId: `history-${Date.now()}`,
                content: growthResponse,
                feedback: null
              }
            ]);
          }
        } catch (e) {
          // If it fails to parse as JSON, assume it's a raw markdown string
          const growthResponse = parseGrowthMarkdown(externalReport);
          setAnalysisMessages([
            {
              id: crypto.randomUUID(),
              role: "assistant",
              analysisId: `history-${Date.now()}`,
              content: growthResponse,
              feedback: null
            }
          ]);
        }
      }
      onReportLoaded?.();
    }
  }, [externalReport, activeTab, onReportLoaded]);

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
      if (balance < getAgentPrice(selectedAgents)) {
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
          url: normalizedUrl,
          selectedAgents
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

    // CHARGE USER WALLET — nanopayment: 1.35 USDC direct transfer to server wallet
    let paymentTxHash: string | undefined;
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
          paymentTxHash = res.txHash;
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
        rawAgents: data.agents,
        selectedAgents: data.selectedAgents,
        feedback: null
      }
    ]);
    setInputValue("");

    // Store Arc nanopayment receipt — merge client-side payment txHash
    if (data.arcReceipt) {
      const receipt = { ...data.arcReceipt };

      // Inject the client-side USDC transfer hash as the verified payment proof
      if (paymentTxHash) {
        receipt.arcScanLinks = [`https://testnet.arcscan.app/tx/${paymentTxHash}`];
        receipt.jobs = receipt.jobs.map((job) => ({
          ...job,
          txHash: paymentTxHash,
          status: "settled" as const,
        }));
        receipt.settledCount = receipt.jobs.length;
      }

      setArcReceipt(receipt);
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

  // War room elapsed timer
  useEffect(() => {
    if (!isWarRoomActive) { setWarRoomElapsed(0); return; }
    setWarRoomElapsed(0);
    const id = window.setInterval(() => setWarRoomElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [isWarRoomActive]);

  // Autonomous mode handler
  async function handleAutonomousToggle() {
    if (!authenticated || !user?.id) return;
    const nextEnabled = !autonomousEnabled;
    setAutonomousLoading(true);
    try {
      const token = await getAccessToken();
      const autoUrl = inputValue || messages.find(m => m.role === 'user')?.url || "";
      await fetch("/api/autonomous", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ websiteUrl: autoUrl, enabled: nextEnabled }),
      });
      setAutonomousEnabled(nextEnabled);
    } catch { /* silent */ }
    finally { setAutonomousLoading(false); }
  }

  // Check autonomous status on mount
  useEffect(() => {
    if (!authenticated || !user?.id) return;
    (async () => {
      try {
        const token = await getAccessToken();
        const res = await fetch("/api/autonomous", { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        const data = await res.json();
        if (typeof data.enabled === "boolean") setAutonomousEnabled(data.enabled);
      } catch { /* silent */ }
    })();
  }, [authenticated, user?.id]);

  const isNeedsPayment = activeTab === "analysis" ? freeRemaining === 0 : true;
  const showPaymentUpsell = isNeedsPayment;
  const dynamicAgentPrice = getAgentPrice(selectedAgents);
  const comparePrice = dynamicAgentPrice * 2;
  const singlePrice = activeTab === "analysis" ? dynamicAgentPrice : 15;
  const requiredBalance = compareMode ? comparePrice : singlePrice;
  const hasSufficientBalance = parseFloat(usdcBalance) >= requiredBalance;

  let buttonLabel = "";
  if (activeTab === "analysis" && compareMode) {
    if (showPaymentUpsell) {
      if (isFundingSetup) buttonLabel = "Preparing Wallet...";
      else if (hasSufficientBalance) buttonLabel = `Pay $${comparePrice.toFixed(2)} & Compare`;
      else buttonLabel = "Fund to Compare";
    } else {
      buttonLabel = "Compare Both Sites →";
    }
  } else if (activeTab === "analysis") {
    if (showPaymentUpsell) {
      if (isFundingSetup) buttonLabel = "Preparing Wallet...";
      else if (hasSufficientBalance) buttonLabel = `Pay $${singlePrice.toFixed(2)} & Analyze`;
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

  // Build strategy context string for execute bar
  const lastAnalysisMsg = [...messages].reverse().find(
    (m): m is Extract<Message, { role: "assistant" }> => m.role === "assistant" && "content" in m && !!m.content
  );
  const strategyContext = lastAnalysisMsg
    ? [
        "Growth Strategy", ...(lastAnalysisMsg.content.growthStrategy || []).map((i: string) => `- ${i}`), "",
        "Viral Hooks", ...(lastAnalysisMsg.content.viralHooks || []).map((i: string) => `- ${i}`), "",
        "SEO", ...(lastAnalysisMsg.content.seoOpportunities || []).map((i: string) => `- ${i}`), "",
        "Conversion", ...(lastAnalysisMsg.content.conversionFixes || []).map((i: string) => `- ${i}`), "",
        "Distribution", ...(lastAnalysisMsg.content.distributionPlan || []).map((i: string) => `- ${i}`),
      ].join("\n")
    : "";

  const hasMessages = messages.length > 0 || Boolean(currentStep) || isWarRoomActive;

  // Build ProgressTracker agent rows from war room — only show selected agents
  const allAgentRows: (AgentRow & { key: string })[] = [
    { key: "strategist", name: "Strategist", status: warRoomElapsed > 9 ? "complete" : warRoomElapsed > 4 ? "running" : "pending", cost: "0.20" },
    { key: "copywriter", name: "Copywriter", status: warRoomElapsed > 16 ? "complete" : warRoomElapsed > 9 ? "running" : "pending", cost: "0.20" },
    { key: "seo", name: "SEO Agent", status: warRoomElapsed > 17 ? "complete" : warRoomElapsed > 10 ? "running" : "pending", cost: "0.20" },
    { key: "conversion", name: "Conversion", status: warRoomElapsed > 18 ? "complete" : warRoomElapsed > 10 ? "running" : "pending", cost: "0.20" },
    { key: "distribution", name: "Distribution", status: warRoomElapsed > 19 ? "complete" : warRoomElapsed > 11 ? "running" : "pending", cost: "0.20" },
    { key: "reddit", name: "Reddit Intel", status: warRoomElapsed > 20 ? "complete" : warRoomElapsed > 11 ? "running" : "pending", cost: "0.15" },
    { key: "critic", name: "Critic", status: warRoomElapsed > 26 ? "complete" : warRoomElapsed > 21 ? "running" : "pending", cost: "0.10" },
    { key: "aggregator", name: "Aggregator", status: warRoomElapsed > 35 ? "complete" : warRoomElapsed > 27 ? "running" : "pending", cost: "0.10" },
  ];
  const progressAgents: AgentRow[] = isWarRoomActive
    ? allAgentRows.filter(row => selectedAgents.includes(row.key))
    : [];

  const analysisUrl = messages.find(m => m.role === "user")?.url || inputValue || "";
  const hasAnalysisResult = lastAnalysisMsg !== undefined;

  return (
    <div className="flex w-full min-h-[calc(100vh-52px)]">
      {/* Workspace content */}
      <div className="flex-1 overflow-y-auto scroll-smooth" ref={viewportRef}>
        <div className="mx-auto max-w-[820px] px-4 py-8 sm:px-6 sm:py-12 space-y-6">

          {/* Error display */}
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 animate-fade-in">
              {error}
            </div>
          )}

          {/* === ANALYSIS TAB === */}
          {activeTab === "analysis" && (
            <>
              {/* Empty state: no messages, not loading */}
              {!hasMessages && !comparisonResult && (
                <EmptyState
                  activeTab="analysis"
                  compareMode={compareMode}
                  onCompareModeChange={(mode) => { setCompareMode(mode); setComparisonResult(null); }}
                  inputValue={inputValue}
                  onInputChange={setInputValue}
                  compareUrl={compareUrl}
                  onCompareUrlChange={setCompareUrl}
                  onSubmit={handleSubmit}
                  onCompareSubmit={() => void handleCompareSubmit()}
                  onButtonClick={onButtonClickHandler}
                  buttonLabel={buttonLabel}
                  disabled={loadingIntervalRef.current !== null || isFundingSetup || isWarRoomActive}
                  buttonLoading={isFundingSetup}
                  showPaymentUpsell={showPaymentUpsell}
                  hasSufficientBalance={hasSufficientBalance}
                  usdcBalance={usdcBalance}
                  walletAddress={walletAddress}
                  onFundWallet={() => void handleFundWalletClick()}
                  isFundingSetup={isFundingSetup}
                  freeRemaining={freeRemaining}
                  selectedAgents={selectedAgents}
                  onAgentSelectionChange={setSelectedAgents}
                  activePlan={activePlan}
                />
              )}

              {/* Comparison result */}
              {comparisonResult && <div className="dark-override"><ComparisonReport data={comparisonResult} /></div>}

              {/* Progress tracker during war room */}
              {isWarRoomActive && (
                <ProgressTracker url={analysisUrl} agents={progressAgents} elapsedSeconds={warRoomElapsed} />
              )}

              {/* Loading state (non-war-room, e.g. payment processing) */}
              {currentStep && !isWarRoomActive && (
                <div className="flex justify-center animate-fade-in">
                  <div className="w-full max-w-[480px] rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-6 text-center">
                    <span className="relative flex h-2 w-2 mx-auto mb-4">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                    </span>
                    <p className="text-sm text-zinc-300">{currentStep}</p>
                  </div>
                </div>
              )}

              {/* Report grid when analysis is done */}
              {hasAnalysisResult && !isWarRoomActive && !currentStep && lastAnalysisMsg?.content && (
                <>
                  <ReportGrid
                    content={lastAnalysisMsg.content}
                    rawAgents={lastAnalysisMsg.rawAgents}
                    selectedAgents={lastAnalysisMsg.selectedAgents}
                    url={analysisUrl}
                    analysisId={lastAnalysisMsg.analysisId}
                    onViewOutreach={() => {
                      handleViewOutreach(lastAnalysisMsg);
                    }}
                  />

                  {/* Execute bar */}
                  <ExecuteBar strategyContext={strategyContext} />

                  {/* Arc Receipt */}
                  {arcReceipt && <ArcReceiptPanel receipt={arcReceipt} />}
                </>
              )}
            </>
          )}

          {/* === AUDIT TAB === */}
          {activeTab === "audit" && (
            <>
              {/* Empty state for audit */}
              {!hasMessages && !currentStep && (
                <EmptyState
                  activeTab="audit"
                  compareMode={false}
                  onCompareModeChange={() => {}}
                  inputValue={inputValue}
                  onInputChange={setInputValue}
                  compareUrl=""
                  onCompareUrlChange={() => {}}
                  onSubmit={handleSubmit}
                  onCompareSubmit={() => {}}
                  onButtonClick={onButtonClickHandler}
                  buttonLabel={buttonLabel}
                  disabled={loadingIntervalRef.current !== null || isFundingSetup}
                  buttonLoading={isFundingSetup}
                  showPaymentUpsell={showPaymentUpsell}
                  hasSufficientBalance={hasSufficientBalance}
                  usdcBalance={usdcBalance}
                  walletAddress={walletAddress}
                  onFundWallet={() => void handleFundWalletClick()}
                  isFundingSetup={isFundingSetup}
                  freeRemaining={freeRemaining}
                  selectedAgents={selectedAgents}
                  onAgentSelectionChange={setSelectedAgents}
                  activePlan={activePlan}
                />
              )}

              {/* Loading state for audit */}
              {currentStep && (
                <div className="flex justify-center animate-fade-in">
                  <div className="w-full max-w-[480px] rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-6 text-center">
                    <span className="relative flex h-2 w-2 mx-auto mb-4">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                    </span>
                    <p className="text-sm text-zinc-300">{currentStep}</p>
                  </div>
                </div>
              )}

              {/* Audit result */}
              <MarketAuditView messages={messages} currentStep={currentStep} />
            </>
          )}

          {/* === OUTREACH TAB === */}
          {activeTab === "outreach" && (
            <OutreachView
              context={outreachContext}
              sessionId={sessionId}
              onSwitchToAnalysis={() => setActiveTab("analysis")}
            />
          )}

        </div>
      </div>
    </div>
  );
}

