"use client";

import { AlertTriangle, RefreshCw, Home, Lock } from "lucide-react";
import Link from "next/link";

export function CourseNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8 max-w-md">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Course Not Found
        </h1>
        <p className="text-muted-foreground mb-6">
          The course you are looking for does not exist or has been removed.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
        >
          <Home className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}

export function FetchError({ error, onRetry }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8 max-w-md">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {error || "Failed to load course data. Please try again."}
        </p>
        <div className="flex space-x-3 justify-center">
          <button
            onClick={onRetry}
            className="flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/dashboard"
            className="flex items-center space-x-2 px-6 py-3 border border-border text-foreground rounded-xl font-bold hover:bg-secondary transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ProUpgradeRequired() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8 max-w-md">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Pro Feature
        </h1>
        <p className="text-muted-foreground mb-6">
          This course requires a Pro subscription. Upgrade to unlock unlimited access.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
        >
          <span>Upgrade to Pro</span>
        </Link>
      </div>
    </div>
  );
}
