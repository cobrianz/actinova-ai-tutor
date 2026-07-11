"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "./AuthProvider";
import { toast } from "sonner";
import Flashcards from "./Flashcards";
import { PRODUCTS } from "@/lib/planLimits";
import {
  Trash2,
  Plus,
  BookOpen,
  Sparkles,
  Bookmark,
  ArrowLeft,
  Eye,
  Brain,
  Layers,
  FolderOpen,
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
            <p className="text-xl font-bold text-foreground">{stats.totalSets}</p>
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
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <FolderOpen size={18} className="text-blue-500" />
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
    beginner: { label: "Beginner", color: "text-green-500", bg: "bg-green-500/10" },
    intermediate: { label: "Intermediate", color: "text-amber-500", bg: "bg-amber-500/10" },
    advanced: { label: "Advanced", color: "text-red-500", bg: "bg-red-500/10" },
  };
  const d = diffConfig[diff] || diffConfig.beginner;
  const total = card.totalCards ?? (Array.isArray(card.cards) ? card.cards.length : 0);

  return (
    <div className="group rounded-2xl border border-border bg-card overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/30">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground line-clamp-2 text-balance">
                {card.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {card.topic || "Interactive flashcards"}
              </p>
            </div>
          </div>
          <span className={`shrink-0 inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full ${d.bg} ${d.color}`}>
            {d.label}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <Sparkles size={12} />
          <span>{total} cards</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onStudy(card)}
            className="flex-1 py-2 px-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <BookOpen size={14} />
            Study
          </button>
          <button
            onClick={() => onBookmark(card._id)}
            className={`p-2 rounded-xl border transition-colors ${
              isBookmarked
                ? "text-amber-500 border-amber-500/30 bg-amber-500/10"
                : "text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            <Bookmark size={16} className={isBookmarked ? "fill-current" : ""} />
          </button>
          <button
            onClick={() => onDelete(card)}
            className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-colors"
          >
            <Trash2 size={16} />
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
  const { user, refreshToken, hasPurchased } = useAuth();

  useEffect(() => {
    fetchFlashcards();
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
          <h1 className="text-2xl font-bold text-foreground">My Flashcards</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Study and memorize key concepts with flashcards
          </p>
        </div>
        <button
          onClick={() => setActiveContent("generate")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          Create New
        </button>
      </div>

      {flashcards.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No flashcards yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Create your first flashcard set to start learning with spaced repetition
          </p>
          <button
            onClick={() => setActiveContent("generate")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
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
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setFlashcardToDelete(null); }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground bg-muted rounded-xl hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
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
