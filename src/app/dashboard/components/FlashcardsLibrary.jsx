"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import Flashcards from "@/components/Flashcards";
import SRSReview from "@/dashboard/learn/components/SRSReview";
import { PRODUCTS } from "@/lib/planLimits";
import {
  Trash2,
  Plus,
  Sparkles,
  Bookmark,
  ArrowLeft,
  ArrowRight,
  Eye,
  Brain,
  Layers,
  FolderOpen,
  Bell,
  RefreshCw,
} from "lucide-react";
import { apiClient } from "@/lib/csrfClient";

function StatsBar({ flashcards, bookmarkedCount }) {
  const stats = useMemo(() => {
    const totalSets = flashcards.length;
    const totalCards = flashcards.reduce((acc, c) => acc + (c.totalCards || 0), 0);
    return { totalSets, totalCards };
  }, [flashcards]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="rounded-xl bg-card border border-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Layers size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-base font-bold text-foreground">{stats.totalSets}</p>
            <p className="text-xs text-muted-foreground">Total Sets</p>
          </div>
        </div>
      </div>
      <div className="rounded-xl bg-card border border-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Brain size={18} className="text-green-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">{stats.totalCards}</p>
            <p className="text-xs text-muted-foreground">Total Cards</p>
          </div>
        </div>
      </div>
      <div className="rounded-xl bg-card border border-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Bookmark size={18} className="text-amber-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">{bookmarkedCount}</p>
            <p className="text-xs text-muted-foreground">Bookmarked</p>
          </div>
        </div>
      </div>
      <div className="rounded-xl bg-card border border-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <FolderOpen size={18} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">
              {new Set(flashcards.map(c => c.topic || c.title)).size}
            </p>
            <p className="text-xs text-muted-foreground">Topics</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlashcardSetCard({ card, isBookmarked, onBookmark, onStudy, onDelete }) {
  const diff = (card.difficulty || card.level || "beginner").toLowerCase();
  const diffConfig = {
    beginner: { label: "Beginner", color: "text-green-500", bg: "bg-green-500/10", dot: "bg-green-500" },
    intermediate: { label: "Intermediate", color: "text-amber-500", bg: "bg-amber-500/10", dot: "bg-amber-500" },
    advanced: { label: "Advanced", color: "text-red-500", bg: "bg-red-500/10", dot: "bg-red-500" },
  };
  const d = diffConfig[diff] || diffConfig.beginner;
  const total = card.totalCards ?? (Array.isArray(card.cards) ? card.cards.length : 0);

  return (
    <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-green-300 dark:hover:border-green-600 transition-all duration-200 flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${d.bg}`}>
          <Brain size={16} className={d.color} />
        </div>
        <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 line-clamp-1 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors min-w-0 flex-1">
          {card.title}
        </h3>
        <button
          onClick={() => onDelete(card)}
          className="shrink-0 p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mb-3">
        {card.topic || "Interactive flashcards"}
      </p>

      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${d.dot}`} />
          <span className="font-medium">{d.label}</span>
          <span>·</span>
          <span>{total} cards</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onBookmark(card._id)}
            className={`transition-colors ${isBookmarked ? "text-amber-500" : "text-slate-400 hover:text-amber-400"}`}
          >
            <Bookmark size={12} className={isBookmarked ? "fill-current" : ""} />
          </button>
          <button
            onClick={() => onStudy(card)}
            className="font-bold text-green-600 dark:text-green-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
          >
            Study <ArrowRight size={10} className="-rotate-45" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FlashcardsLibrary({ setActiveContent }) {
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlashcard, setSelectedFlashcard] = useState(null);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [bookmarkedFlashcards, setBookmarkedFlashcards] = useState(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [flashcardToDelete, setFlashcardToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [dueCount, setDueCount] = useState(0);
  const { user, refreshToken, hasPurchased } = useAuth();

  const fetchDueCount = async () => {
    try {
      const res = await apiClient.get("/api/srs/due");
      if (res.ok) {
        const data = await res.json();
        setDueCount(data.dueCount ?? data.cards?.length ?? 0);
      }
    } catch {}
  };

  useEffect(() => {
    fetchFlashcards();
    fetchDueCount();
    try {
      const saved = localStorage.getItem("bookmarked_flashcards");
      if (saved) setBookmarkedFlashcards(new Set(JSON.parse(saved)));
    } catch {}
  }, []);

  const fetchFlashcards = async (retry = true) => {
    try {
      const response = await apiClient.get("/api/flashcards");
      if (response.status === 401 && retry) {
        const ok = await refreshToken();
        if (ok) return fetchFlashcards(false);
        toast.error("Session expired. Please log in again.");
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setFlashcards(data.cards || []);
      }
    } catch (error) {
      console.error("Error fetching flashcards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (id) => {
    const isBookmarked = bookmarkedFlashcards.has(id);
    const newSet = new Set(bookmarkedFlashcards);
    isBookmarked ? newSet.delete(id) : newSet.add(id);
    setBookmarkedFlashcards(newSet);
    try { localStorage.setItem("bookmarked_flashcards", JSON.stringify([...newSet])); } catch {}

    try {
      await apiClient.post("/api/library", { action: "bookmark", itemId: `cards_${id}` });
      toast.success(isBookmarked ? "Removed from bookmarks" : "Added to bookmarks");
    } catch {
      setBookmarkedFlashcards(bookmarkedFlashcards);
      toast.error("Failed to update bookmark");
    }
  };

  const handleDeleteClick = (card) => {
    setFlashcardToDelete(card);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!flashcardToDelete) return;
    setDeleteLoading(true);
    try {
      const response = await apiClient.delete(`/api/flashcards/${flashcardToDelete._id}`);
      if (response.ok) {
        setFlashcards((prev) => prev.filter((c) => c._id !== flashcardToDelete._id));
        toast.success("Flashcard set deleted");
        setShowDeleteModal(false);
        setFlashcardToDelete(null);
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Failed to delete flashcard set");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStudy = (card) => {
    setSelectedFlashcard(card);
    setShowFlashcards(true);
    };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-7 bg-muted rounded-lg w-48 animate-pulse" />
          <div className="h-4 bg-muted rounded-lg w-64 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-52 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (showReview) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 border-b border-border">
          <button
            onClick={() => { setShowReview(false); fetchDueCount(); }}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Library
          </button>
        </div>
        <SRSReview onComplete={() => { setShowReview(false); fetchDueCount(); }} />
      </div>
    );
  }

  if (showFlashcards && selectedFlashcard) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 border-b border-border">
          <button
            onClick={() => { setShowFlashcards(false); setSelectedFlashcard(null); }}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Library
          </button>
        </div>
        <Flashcards cardData={selectedFlashcard} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">My Flashcards</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Study and memorize key concepts with flashcards
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dueCount > 0 && (
            <button
              onClick={() => setShowReview(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors"
            >
              <Bell size={13} />
              Due for Review
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {dueCount}
              </span>
            </button>
          )}
          <button
            onClick={() => setActiveContent("generate")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={13} />
            Create New
          </button>
        </div>
      </div>

      {flashcards.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-2">No flashcards yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Create your first flashcard set to start learning with spaced repetition
          </p>
          <button
            onClick={() => setActiveContent("generate")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={13} />
            Create Flashcards
          </button>
        </div>
      ) : (
        <>
          <StatsBar flashcards={flashcards} bookmarkedCount={bookmarkedFlashcards.size} />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {flashcards.map((card) => (
              <FlashcardSetCard
                key={card._id}
                card={card}
                isBookmarked={bookmarkedFlashcards.has(card._id)}
                onBookmark={handleBookmark}
                onStudy={handleStudy}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        </>
      )}

      {/* Delete Modal */}
      {showDeleteModal && flashcardToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-sm shadow-2xl border border-border">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Delete Flashcard Set</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to delete &quot;{flashcardToDelete.title}&quot;? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDeleteModal(false); setFlashcardToDelete(null); }}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleteLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
