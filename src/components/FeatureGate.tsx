import React from "react";
import { Crown, X, Zap, MessageSquare, Infinity, Clock } from "lucide-react";

interface FeatureGateProps {
  feature: string;
  onUpgrade: () => void;
  onClose: () => void;
}

const FEATURE_INFO: Record<string, { title: string; description: string; icon: React.ComponentType<any> }> = {
  cloudTranscription: {
    title: "Cloud Transcription",
    description: "Blazing-fast cloud transcription is available on Pro and Business plans. Upgrade for instant, accurate results.",
    icon: Zap,
  },
  agentMode: {
    title: "Agent Mode",
    description: "AI agent conversations are available on the Business plan. Upgrade to use voice commands with GPT, Claude, and Gemini.",
    icon: MessageSquare,
  },
  unlimitedWords: {
    title: "Unlimited Transcription",
    description: "You've reached the free tier limit of 2,000 words/week. Upgrade to Pro for unlimited transcription.",
    icon: Infinity,
  },
  unlimitedMeetings: {
    title: "Unlimited Meetings",
    description: "You've reached the free tier limit of 5 hours/month of meeting recordings. Upgrade for more.",
    icon: Clock,
  },
};

export default function FeatureGate({ feature, onUpgrade, onClose }: FeatureGateProps) {
  const info = FEATURE_INFO[feature] || {
    title: "Premium Feature",
    description: "This feature requires a paid plan. Upgrade to unlock it.",
    icon: Crown,
  };
  const Icon = info.icon;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-sm mx-4 rounded-2xl bg-background border border-border/30 shadow-2xl overflow-hidden">
        {/* Header gradient */}
        <div className="h-24 bg-gradient-to-br from-violet-600/20 via-primary/10 to-amber-500/20 flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-background/90 backdrop-blur flex items-center justify-center shadow-lg">
            <Icon size={24} className="text-primary" />
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-background transition-colors"
        >
          <X size={14} />
        </button>

        {/* Content */}
        <div className="p-5 text-center">
          <h3 className="text-lg font-semibold mb-2">{info.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            {info.description}
          </p>

          <button
            onClick={onUpgrade}
            className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Crown size={15} />
            Upgrade Now
          </button>

          <button
            onClick={onClose}
            className="w-full h-8 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
