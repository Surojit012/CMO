"use client";

import { useEffect, useMemo, useState } from "react";

type LoadingStateProps = {
  currentStep: string;
  steps: string[];
};

export function LoadingState({ currentStep, steps }: LoadingStateProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [contextIndex, setContextIndex] = useState(0);
  const [contextVisible, setContextVisible] = useState(true);
  const [cardVisible, setCardVisible] = useState(false);

  const contextLines = useMemo(
    () => [
      "Processing website content",
      "Cross-referencing market data",
      "Identifying growth vectors",
      "Mapping competitive landscape",
      "Synthesising recommendations",
    ],
    []
  );

  const currentStepIndex = steps.findIndex((step) => step === currentStep);
  const hasKnownCurrentStep = currentStepIndex >= 0;
  const visibleSteps = hasKnownCurrentStep ? steps.slice(0, currentStepIndex + 1) : [currentStep];

  const completedCount = hasKnownCurrentStep ? currentStepIndex : 0;
  const progressPercent = steps.length > 1 ? (completedCount / (steps.length - 1)) * 100 : 0;

  const cleanStepLabel = (step: string) => step.replace(/\.\.\.$/, "").trim();

  useEffect(() => {
    setElapsedSeconds(0);
    const intervalId = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setContextVisible(false);
      window.setTimeout(() => {
        setContextIndex((value) => (value + 1) % contextLines.length);
        setContextVisible(true);
      }, 180);
    }, 2500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [contextLines.length]);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      setCardVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(id);
    };
  }, []);

  const mm = Math.floor(elapsedSeconds / 60)
    .toString()
    .padStart(1, "0");
  const ss = (elapsedSeconds % 60).toString().padStart(2, "0");

  return (
    <div className="flex justify-center">
      <div
        className={[
          "w-full max-w-[480px] rounded-[20px] border border-zinc-200 bg-white px-8 py-7 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-300 ease-out",
          cardVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        ].join(" ")}
      >
        <div className="space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-400">Analyzing</p>
            <p className="mt-1 text-[15px] font-medium text-zinc-900">{cleanStepLabel(currentStep)}</p>
          </div>

          <div className="my-4 h-px w-full bg-zinc-100">
            <div
              className="h-px bg-zinc-900 transition-[width] duration-[600ms] ease-out"
              style={{ width: `${Math.max(0, Math.min(progressPercent, 100))}%` }}
            />
          </div>

          <div className="space-y-3">
            {visibleSteps.map((step) => {
              const isActive = step === currentStep;
              return (
                <div
                  key={`${step}-${isActive ? "active" : "completed"}`}
                  className={["flex items-center gap-3 text-[13px]", isActive ? "step-active-enter" : ""].join(" ")}
                >
                  <span
                    className={[
                      "shrink-0 rounded-none transition-all",
                      isActive ? "h-4 w-0.5 bg-zinc-900" : "h-3.5 w-px bg-zinc-200",
                    ].join(" ")}
                  />
                  <span className={isActive ? "font-medium text-zinc-900" : "text-zinc-300"}>
                    {cleanStepLabel(step)}
                  </span>
                  {isActive ? (
                    <span className="ellipsis-pulse text-zinc-900" aria-hidden="true">
                      ...
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>

          <p
            className={[
              "pt-1 text-[11px] text-zinc-400 transition-opacity duration-300",
              contextVisible ? "opacity-100" : "opacity-0",
            ].join(" ")}
          >
            {contextLines[contextIndex]}
          </p>

          <div className="pt-1 text-right font-mono text-[12px] text-zinc-400">
            {mm}:{ss}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes ellipsisPulse {
          0% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes stepFadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .ellipsis-pulse {
          animation: ellipsisPulse 1.5s ease-in-out infinite;
        }

        .step-active-enter {
          animation: stepFadeIn 240ms ease-out;
        }
      `}</style>
    </div>
  );
}
