"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  Trash2,
  Eye,
  Plus,
  Loader,
  Clock,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "./AuthProvider";
import ConfirmModal from "./ConfirmModal";

export default function PresentationsLibrary({ setActiveContent }) {
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedPresentation, setSelectedPresentation] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchPresentations();
  }, [page]);

  useEffect(() => {
    const handlePresentationUpdate = () => {
      fetchPresentations();
    };
    window.addEventListener("usageUpdated", handlePresentationUpdate);
    return () =>
      window.removeEventListener("usageUpdated", handlePresentationUpdate);
  }, []);

  const fetchPresentations = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/presentations?page=${page}&limit=10`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch presentations");
      }

      const data = await response.json();
      setPresentations(data.presentations || []);
      setTotalPages(data.pagination.pages || 1);
    } catch (error) {
      console.error("Failed to fetch presentations:", error);
      toast.error("Failed to load presentations");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (presentationId, title) => {
    try {
      setDownloadingId(presentationId);
      const response = await fetch(
        `/api/presentations/${presentationId}?download=true`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download presentation");
      }

      // Create blob from response
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${title.replace(/\s+/g, "_")}_${new Date().getTime()}.pptx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast.success("Presentation downloaded successfully!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download presentation");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteClick = (presentation) => {
    setSelectedPresentation(presentation);
    setShowConfirmDelete(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPresentation) return;

    try {
      setDeletingId(selectedPresentation._id);
      const response = await fetch(
        `/api/presentations/${selectedPresentation._id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete presentation");
      }

      setPresentations((prev) =>
        prev.filter((p) => p._id !== selectedPresentation._id)
      );
      toast.success("Presentation deleted");
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete presentation");
    } finally {
      setDeletingId(null);
      setShowConfirmDelete(false);
      setSelectedPresentation(null);
    }
  };

  const handleViewPresentation = async (presentationId) => {
    try {
      const response = await fetch(`/api/presentations/${presentationId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch presentation details");
      }

      const data = await response.json();
      setSelectedPresentation(data.presentation);
    } catch (error) {
      console.error("Failed to view presentation:", error);
      toast.error("Failed to view presentation");
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Unknown date";
    }
  };

  if (selectedPresentation && !showConfirmDelete) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedPresentation(null)}
          className="text-primary hover:text-primary/80 font-medium flex items-center"
        >
          ← Back to Library
        </button>

        <div className="bg-card border border-border rounded-xl p-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {selectedPresentation.title}
          </h1>
          <p className="text-muted-foreground mb-4">
            {selectedPresentation.description}
          </p>

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <Layers className="w-4 h-4 text-primary" />
              <span>{selectedPresentation.totalSlides} slides</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="capitalize px-2 py-1 bg-primary/10 text-primary rounded">
                {selectedPresentation.difficulty}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{formatDate(selectedPresentation.createdAt)}</span>
            </div>
          </div>

          <div className="flex gap-4 mb-8">
            <button
              onClick={() =>
                handleDownload(selectedPresentation._id, selectedPresentation.title)
              }
              disabled={downloadingId === selectedPresentation._id}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 font-medium"
            >
              {downloadingId === selectedPresentation._id ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download as PPTX
            </button>
            <button
              onClick={() => handleDeleteClick(selectedPresentation)}
              className="flex items-center gap-2 bg-destructive/10 text-destructive px-6 py-2 rounded-lg hover:bg-destructive/20 font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>

          {/* Slides Preview */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              Slide Preview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
              {selectedPresentation.slides.map((slide, index) => (
                <div
                  key={index}
                  className="bg-muted p-4 rounded-lg border border-border hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-foreground mb-2">
                    Slide {index + 1}: {slide.title}
                  </h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {Array.isArray(slide.content) ? (
                      slide.content.slice(0, 3).map((point, idx) => (
                        <p key={idx} className="line-clamp-1">
                          • {point}
                        </p>
                      ))
                    ) : (
                      <p className="line-clamp-1">• {slide.content}</p>
                    )}
                    {Array.isArray(slide.content) &&
                      slide.content.length > 3 && (
                        <p className="text-xs">
                          +{slide.content.length - 3} more points
                        </p>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-foreground">
            Your Presentations
          </h1>
          <p className="text-muted-foreground mt-2">
            View, download, and manage your generated presentations
          </p>
        </div>
        <button
          onClick={() => setActiveContent("presentations")}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 font-medium"
        >
          <Plus className="w-4 h-4" />
          New Presentation
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : presentations.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Eye className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            No presentations yet
          </h2>
          <p className="text-muted-foreground mb-6">
            Create your first presentation to get started
          </p>
          <button
            onClick={() => setActiveContent("presentations")}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:opacity-90 font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Presentation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {presentations.map((presentation) => (
            <div
              key={presentation._id}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                {presentation.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {presentation.description}
              </p>

              <div className="flex gap-2 mb-4 text-xs">
                <span className="px-2 py-1 bg-primary/10 text-primary rounded">
                  {presentation.totalSlides} slides
                </span>
                <span className="px-2 py-1 bg-secondary/10 text-secondary rounded capitalize">
                  {presentation.difficulty}
                </span>
              </div>

              <p className="text-xs text-muted-foreground mb-4">
                {formatDate(presentation.createdAt)}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => handleViewPresentation(presentation._id)}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary/10 text-primary px-3 py-2 rounded hover:bg-primary/20 font-medium text-sm"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button
                  onClick={() =>
                    handleDownload(presentation._id, presentation.title)
                  }
                  disabled={downloadingId === presentation._id}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded hover:opacity-90 disabled:opacity-50 font-medium text-sm"
                >
                  {downloadingId === presentation._id ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Download
                </button>
                <button
                  onClick={() => handleDeleteClick(presentation)}
                  disabled={deletingId === presentation._id}
                  className="flex items-center justify-center gap-2 bg-destructive/10 text-destructive px-3 py-2 rounded hover:bg-destructive/20 disabled:opacity-50 font-medium text-sm"
                >
                  {deletingId === presentation._id ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 rounded border border-border hover:bg-accent disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 rounded border border-border hover:bg-accent disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={showConfirmDelete}
        title="Delete Presentation"
        message={`Are you sure you want to delete "${selectedPresentation?.title}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowConfirmDelete(false);
          setSelectedPresentation(null);
        }}
        confirmText="Delete"
        confirmVariant="destructive"
      />
    </div>
  );
}
