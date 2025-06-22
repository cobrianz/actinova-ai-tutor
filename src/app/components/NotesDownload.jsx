"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Download, FileText, X, Calendar, BookOpen, Tag } from "lucide-react"
import { toast } from "sonner"

export default function NotesDownload({ notes, isOpen, onClose }) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState("txt")

  const formats = [
    { value: "txt", label: "Text File (.txt)", icon: FileText },
    { value: "md", label: "Markdown (.md)", icon: FileText },
    { value: "pdf", label: "PDF Document (.pdf)", icon: FileText },
  ]

  const handleDownload = async () => {
    setIsDownloading(true)

    // Simulate download process
    await new Promise((resolve) => setTimeout(resolve, 2000))

    let content = notes.content
    let filename = `notes-${notes.title?.replace(/\s+/g, "-").toLowerCase()}`
    let mimeType = "text/plain"

    switch (selectedFormat) {
      case "md":
        content = `# ${notes.title}\n\n**Date:** ${notes.date}\n**Course:** ${notes.course}\n\n---\n\n${notes.content}`
        filename += ".md"
        break
      case "pdf":
        // In a real app, you'd generate a proper PDF
        content = `Notes: ${notes.title}\nDate: ${notes.date}\nCourse: ${notes.course}\n\n${notes.content}`
        filename += ".pdf"
        mimeType = "application/pdf"
        break
      default:
        content = `Notes: ${notes.title}\nDate: ${notes.date}\nCourse: ${notes.course}\n\n${notes.content}`
        filename += ".txt"
    }

    // Create download
    const element = document.createElement("a")
    element.setAttribute("href", `data:${mimeType};charset=utf-8,` + encodeURIComponent(content))
    element.setAttribute("download", filename)
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)

    setIsDownloading(false)
    toast.success("Notes downloaded successfully!")
    onClose()
  }

  if (!notes) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Download Notes</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Notes Preview */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notes Preview</h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border">
                  <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{notes.course}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{notes.date}</span>
                    </div>
                  </div>

                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">{notes.title}</h4>

                  <div className="text-gray-700 dark:text-gray-300 text-sm max-h-40 overflow-y-auto">
                    {notes.content.split("\n").map((line, index) => (
                      <p key={index} className="mb-2">
                        {line}
                      </p>
                    ))}
                  </div>

                  {notes.tags && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {notes.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs flex items-center space-x-1"
                        >
                          <Tag className="w-3 h-3" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Format Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Choose Format</h3>
                <div className="space-y-3">
                  {formats.map((format) => {
                    const Icon = format.icon
                    return (
                      <label
                        key={format.value}
                        className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedFormat === format.value
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="format"
                          value={format.value}
                          checked={selectedFormat === format.value}
                          onChange={(e) => setSelectedFormat(e.target.value)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <span className="text-gray-900 dark:text-white font-medium">{format.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* File Info */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Download Information</h4>
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <p>• File size: ~{Math.ceil(notes.content.length / 1024)} KB</p>
                  <p>• Word count: {notes.content.split(" ").length} words</p>
                  <p>• Created: {notes.date}</p>
                  <p>• Format: {formats.find((f) => f.value === selectedFormat)?.label}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-5 h-5" />
                  <span>{isDownloading ? "Downloading..." : "Download Notes"}</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
