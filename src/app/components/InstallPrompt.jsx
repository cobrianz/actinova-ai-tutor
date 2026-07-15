'use client';

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Don't show if user already dismissed
    if (localStorage.getItem('install-prompt-dismissed') === 'true') return;

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('install-prompt-dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-72">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Download className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Install Actirova AI Tutor
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Get the full experience with our app installed on your device.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 ml-4 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 flex space-x-3">
          <button
            onClick={handleInstallClick}
            className="flex-1 bg-green-300 text-gray-900 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-green-400 transition-colors"
          >
            Install App
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}