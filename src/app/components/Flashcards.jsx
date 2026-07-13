"use client";

import { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Flame,
  Brain,
  Zap,
  Plus,
  Crown,
  X,
  Sparkles,
  RotateCcw,
  Filter,
  Download,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";
import { PRODUCTS } from "@/lib/planLimits";
import UpgradeModal from "./UpgradeModal";

const categoryConfig = {
  concept: { icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30", label: "Concept" },
  tip: { icon: Lightbulb, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30", label: "Tip" },
  warning: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", label: "Warning" },
  practice: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/30", label: "Practice" },
};

const difficultyConfig = {
  beginner: { label: "Beginner", color: "text-green-500", bg: "bg-green-500/10" },
  intermediate: { label: "Intermediate", color: "text-amber-500", bg: "bg-amber-500/10" },
  advanced: { label: "Advanced", color: "text-red-500", bg: "bg-red-500/10" },
};

export default function Flashcards({ cardData }) {
  const [flipped, setFlipped] = useState({});
  const [studyCards, setStudyCards] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [speakingCardId, setSpeakingCardId] = useState(null);
  const [ttsLoading, setTtsLoading] = useState(null);
  const audioRef = useRef(null);
  const abortRef = useRef(null);
  const speakIdRef = useRef(0);
  const { user, hasPurchased } = useAuth();
  const router = useRouter();

  const speak = async (text, cardId) => {
    stopSpeaking();
    const id = ++speakIdRef.current;
    setTtsLoading(cardId);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "female" }),
        signal: controller.signal,
      });
      if (id !== speakIdRef.current) return;
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      if (id !== speakIdRef.current) return;
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onplay = () => { if (id === speakIdRef.current) setSpeakingCardId(cardId); };
      audio.onended = () => { if (id === speakIdRef.current) { setSpeakingCardId(null); setTtsLoading(null); } URL.revokeObjectURL(url); };
      audio.onerror = () => { if (id === speakIdRef.current) { setSpeakingCardId(null); setTtsLoading(null); } URL.revokeObjectURL(url); };
      await audio.play();
    } catch (e) {
      if (e.name === "AbortError") return;
      console.error("TTS error:", e);
      if (id === speakIdRef.current) {
        setSpeakingCardId(null);
        toast.error("Speech failed. Please try again.");
      }
    } finally {
      if (id === speakIdRef.current) setTtsLoading(null);
    }
  };

  const stopSpeaking = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setSpeakingCardId(null);
  };

  const speakCard = (card) => {
    if (speakingCardId === card.id) {
      stopSpeaking();
      return;
    }
    const text = `${card.question}. ... ${card.answer}`;
    speak(text, card.id);
  };

  useEffect(() => {
    if (cardData?.cards) {
      setStudyCards(cardData.cards);
    } else if (cardData?._id) {
      apiClient.get(`/api/flashcards/${cardData._id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.cards) {
            setStudyCards(data.cards);
          }
        })
        .catch(console.error);
    }
  }, [cardData]);

  const handleGenerateMore = async () => {
    const flashcardProduct = PRODUCTS.find(p => p.id === 'flashcard_generation');
    const isPremium =
      hasPurchased('flashcard_generation') ||
      !!(user?.credits >= (flashcardProduct?.creditCost || 25)) ||
      user?.isPremium ||
      (user?.subscription?.plan === "pro" && user?.subscription?.status === "active");

    if (!isPremium) {
      if (studyCards.length >= 8) {
        setShowUpgradeModal(true);
        return;
      }
    } else {
      if (studyCards.length >= 60) {
        toast.error("You've reached the maximum of 60 cards for this set");
        return;
      }
    }

    setIsGeneratingMore(true);
    try {
      const maxCards = isPremium ? 60 : 8;
      const increment = isPremium ? 15 : 8;
      const additionalCards = Math.min(increment, maxCards - studyCards.length);

      const genRes = await apiClient.post("/api/generate-flashcards", {
        topic: cardData.topic || cardData.title,
        difficulty: cardData.level || "beginner",
        existingCardSetId: cardData._id,
        additionalCards: additionalCards,
        existingCardCount: studyCards.length,
      });

      if (!genRes.ok) {
        const errorData = await genRes.json().catch(() => ({}));
        throw new Error(`Failed to generate more cards: ${errorData.error || ""}`);
      }

      const generated = await genRes.json();

      if (generated.cards && Array.isArray(generated.cards)) {
        setStudyCards((prevCards) => [...prevCards, ...generated.cards]);
        toast.success(`Generated ${generated.cards.length} more cards!`);
      } else if (generated.success) {
        try {
          const refreshRes = await apiClient.get(`/api/flashcards/${cardData._id}`);
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            setStudyCards(refreshData.cards || []);
            toast.success(`Generated ${additionalCards} more cards!`);
          }
        } catch {
          toast.success("Cards generated successfully!");
        }
      }
    } catch (e) {
      console.error("Generate more cards error:", e);
      toast.error(`Failed to generate more cards: ${e.message}`);
    } finally {
      setIsGeneratingMore(false);
    }
  };

  const filteredCards = activeFilter
    ? studyCards.filter((card) => card.category === activeFilter)
    : studyCards;

  const categoryCounts = studyCards.reduce((acc, card) => {
    const cat = card.category || "concept";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const toggleFlip = (id) => {
    setFlipped((prev) => {
      const wasFlipped = prev[id];
      const newState = { ...prev, [id]: !wasFlipped };
      if (!wasFlipped && autoSpeak) {
        const card = studyCards.find((c) => c.id === id);
        if (card) {
          const text = `${card.question}. ${card.answer}`;
          speak(text, id);
        }
      } else {
        stopSpeaking();
      }
      return newState;
    });
  };

  const resetAll = () => {
    setFlipped({});
    stopSpeaking();
  };

  const handleExportAnki = () => {
    if (studyCards.length === 0) {
      toast.error("No cards to export");
      return;
    }

    const lines = studyCards.map((card) => {
      const front = card.question.replace(/\t/g, " ").replace(/\n/g, "<br>");
      let back = card.answer.replace(/\t/g, " ").replace(/\n/g, "<br>");
      if (card.explanation) {
        back += `<br><br><b>Explanation:</b> ${card.explanation.replace(/\t/g, " ").replace(/\n/g, "<br>")}`;
      }
      return `${front}\t${back}`;
    });

    const content = lines.join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anki-cards-${(cardData.title || "flashcards").replace(/[^a-z0-9]/gi, "_").toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${studyCards.length} cards for Anki import`);
  };

  const renderFormattedText = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*|`[^`]+`)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={index} className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  if (!cardData) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-3">
          <div className="h-8 bg-muted rounded-lg w-64 animate-pulse" />
          <div className="h-4 bg-muted rounded-lg w-96 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-72 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">{cardData.title}</h2>
        <p className="text-sm text-muted-foreground">
          Click any card to reveal the answer. Use filters to focus on specific categories.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={resetAll}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors"
        >
          <RotateCcw size={14} />
          Reset
        </button>

        <button
          onClick={handleExportAnki}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors"
        >
          <Download size={14} />
          Export to Anki
        </button>

        <button
          onClick={() => {
            if (autoSpeak) stopSpeaking();
            setAutoSpeak((prev) => !prev);
          }}
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            autoSpeak
              ? "bg-primary/10 text-primary border border-primary/30"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {autoSpeak ? <Volume2 size={14} /> : <VolumeX size={14} />}
          Auto Speak
        </button>

        <div className="h-5 w-px bg-border" />

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveFilter(null)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              !activeFilter
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Filter size={12} />
            All ({studyCards.length})
          </button>
          {Object.entries(categoryCounts).map(([cat, count]) => {
            const config = categoryConfig[cat] || categoryConfig.concept;
            const Icon = config.icon;
            return (
              <button
                key={cat}
                onClick={() => setActiveFilter(activeFilter === cat ? null : cat)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  activeFilter === cat
                    ? `${config.bg} ${config.color} border ${config.border}`
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Icon size={12} />
                {config.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCards.map((card) => {
          const isFlipped = flipped[card.id];
          const cat = categoryConfig[card.category] || categoryConfig.concept;
          const diff = difficultyConfig[card.difficulty] || difficultyConfig.beginner;
          const CatIcon = cat.icon;

          return (
            <div
              key={card.id}
              onClick={() => toggleFlip(card.id)}
              className="group relative h-72 cursor-pointer perspective-[1000px]"
            >
              <div
                className="absolute inset-0 transition-transform duration-500"
                style={{
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                {/* Front */}
                <div
                  className={`absolute inset-0 rounded-2xl border border-border bg-card p-5 flex flex-col transition-shadow duration-300 group-hover:shadow-lg ${
                    isFlipped ? "invisible" : ""
                  }`}
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md ${cat.bg} ${cat.color} border ${cat.border}`}>
                      <CatIcon size={10} />
                      {cat.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-medium ${diff.color}`}>
                        {diff.label}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); speakCard(card); }}
                        disabled={ttsLoading === card.id}
                        className="p-1 rounded-md hover:bg-muted/80 transition-colors disabled:opacity-50"
                        title="Read aloud"
                      >
                        {ttsLoading === card.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
                        ) : speakingCardId === card.id ? (
                          <Volume2 size={12} className="text-primary animate-pulse" />
                        ) : (
                          <Volume2 size={12} className="text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm font-medium text-foreground text-center leading-relaxed line-clamp-6">
                      {renderFormattedText(card.question)}
                    </p>
                  </div>

                  <div className="flex items-center justify-center pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground font-medium">
                      Tap to reveal answer
                    </span>
                  </div>
                </div>

                {/* Back */}
                <div
                  className={`absolute inset-0 rounded-2xl border border-primary/30 bg-primary/5 p-5 flex flex-col ${
                    !isFlipped ? "invisible" : ""
                  }`}
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                    <div className="flex items-center gap-2 pb-2 border-t border-border">
                      <Brain size={14} className="text-primary" />
                      <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                        Answer
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); speakCard(card); }}
                        disabled={ttsLoading === card.id}
                        className="ml-auto p-1 rounded-md hover:bg-muted/80 transition-colors disabled:opacity-50"
                        title="Read aloud"
                      >
                        {ttsLoading === card.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
                        ) : speakingCardId === card.id ? (
                          <Volume2 size={12} className="text-primary animate-pulse" />
                        ) : (
                          <Volume2 size={12} className="text-muted-foreground" />
                        )}
                      </button>
                    </div>

                    <p className="text-sm text-foreground leading-relaxed">
                      {renderFormattedText(card.answer)}
                    </p>

                    {card.explanation && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Why This Matters
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {card.explanation}
                        </p>
                      </div>
                    )}

                    {card.keyPoints?.length > 0 && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Key Points
                        </p>
                        <ul className="space-y-1">
                          {card.keyPoints.map((point, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground flex gap-2">
                              <span className="text-primary">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {card.example && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Example
                        </p>
                        <p className="text-xs text-muted-foreground font-mono bg-muted rounded-md p-2">
                          {card.example}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center pt-2 mt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground font-medium">
                      Tap to see question
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Generate More */}
      <button
        onClick={handleGenerateMore}
        disabled={isGeneratingMore}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isGeneratingMore ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Generate more cards
          </>
        )}
      </button>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="flashcard"
      />

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 2px; }
      `}</style>
    </div>
  );
}
