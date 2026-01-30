import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { usePrefersReducedMotion } from "../lib/motion";

export type TutorialStep = {
  id: string;
  title: string;
  content: string;
  action?: string; // "Next" button text
  canAutoAdvance?: boolean;
  checkProgress?: () => boolean; // Check if user completed action
};

interface TutorialOverlayProps {
  steps: TutorialStep[];
  currentStep: number;
  onNext: () => void;
  onPrevious?: () => void;
  onSkip: () => void;
  onComplete: () => void;
  show?: boolean;
}

export default function TutorialOverlay({
  steps,
  currentStep,
  onNext,
  onPrevious,
  onSkip,
  onComplete,
  show = true,
}: TutorialOverlayProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [autoAdvanceChecked, setAutoAdvanceChecked] = useState(false);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Auto-advance logic
  useEffect(() => {
    if (!step?.canAutoAdvance || !step.checkProgress) return;

    setAutoAdvanceChecked(false);
    const interval = setInterval(() => {
      if (step.checkProgress?.()) {
        setAutoAdvanceChecked(true);
        // Small delay before auto-advancing to show the checkmark
        setTimeout(() => {
          if (isLastStep) {
            onComplete();
          } else {
            onNext();
          }
        }, 800);
      }
    }, 500); // Check every 500ms

    return () => clearInterval(interval);
  }, [step, isLastStep, onNext, onComplete]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!show) return;

      if (e.key === "Enter" && !step?.canAutoAdvance) {
        e.preventDefault();
        if (isLastStep) {
          onComplete();
        } else {
          onNext();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onSkip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [show, step, isLastStep, onNext, onComplete, onSkip]);

  if (!show || !step) return null;

  return (
    <AnimatePresence mode="wait">
      {show && (
        <>
          {/* Backdrop - pointer-events-none to allow interactions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            className="fixed inset-0 bg-black/5 pointer-events-none z-[85]"
            aria-hidden="true"
          />

          {/* Tutorial Card */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.4,
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className="fixed top-24 right-4 max-w-md w-full mx-4 sm:mx-0 z-[90]"
            role="dialog"
            aria-labelledby="tutorial-title"
            aria-describedby="tutorial-content"
            aria-live="polite"
          >
            <div className="bg-black/90 backdrop-blur-xl border border-white/14 rounded-lg shadow-2xl overflow-hidden">
              {/* Progress Bar */}
              <div className="h-1 bg-white/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: "easeOut" }}
                />
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-medium">
                        Step {currentStep + 1} of {steps.length}
                      </span>
                      {autoAdvanceChecked && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-green-400 text-sm"
                        >
                          ✓
                        </motion.span>
                      )}
                    </div>
                    <h3
                      id="tutorial-title"
                      className="text-lg font-semibold text-white leading-tight"
                    >
                      {step.title}
                    </h3>
                  </div>
                  <button
                    onClick={onSkip}
                    className="ml-4 p-1 hover:bg-white/10 rounded transition-colors"
                    aria-label="Skip tutorial"
                  >
                    <X className="w-5 h-5 text-white/50" />
                  </button>
                </div>

                {/* Description */}
                <p id="tutorial-content" className="text-sm text-white/80 leading-relaxed mb-6">
                  {step.content}
                </p>

                {/* Actions */}
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={onSkip}
                    className="text-xs text-white/50 hover:text-white/80 uppercase tracking-wider transition-colors"
                  >
                    Skip Tutorial
                  </button>

                  <div className="flex gap-2">
                    {currentStep > 0 && onPrevious && (
                      <button
                        onClick={onPrevious}
                        className="px-4 py-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded uppercase tracking-wider transition-colors"
                      >
                        Back
                      </button>
                    )}

                    {!step.canAutoAdvance && (
                      <button
                        onClick={isLastStep ? onComplete : onNext}
                        className="px-6 py-2 text-xs bg-white text-black hover:bg-white/90 rounded uppercase tracking-wider font-medium transition-colors"
                      >
                        {step.action || (isLastStep ? "Finish" : "Next")}
                      </button>
                    )}

                    {step.canAutoAdvance && (
                      <div className="px-6 py-2 text-xs bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded uppercase tracking-wider font-medium">
                        {autoAdvanceChecked ? "Completing..." : "Waiting..."}
                      </div>
                    )}
                  </div>
                </div>

                {/* Hint for auto-advance steps */}
                {step.canAutoAdvance && !autoAdvanceChecked && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-3 text-xs text-white/40 italic"
                  >
                    Complete the action above to continue automatically
                  </motion.p>
                )}
              </div>
            </div>

            {/* Keyboard shortcuts hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-2 text-center text-xs text-white/30"
            >
              Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded mx-1">ESC</kbd> to skip
              {!step.canAutoAdvance && (
                <>
                  {" "}or <kbd className="px-1.5 py-0.5 bg-white/10 rounded mx-1">ENTER</kbd> to
                  continue
                </>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
