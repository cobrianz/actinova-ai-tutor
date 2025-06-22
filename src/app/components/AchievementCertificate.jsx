"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Award, Share2, X, Calendar, CheckCircle, FileText } from "lucide-react"
import { toast } from "sonner"

export default function AchievementCertificate({ achievement, isOpen, onClose }) {
  const [isDownloading, setIsDownloading] = useState(false)

  const generatePDFCertificate = async () => {
    setIsDownloading(true)

    try {
      // Simulate PDF generation process
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Create certificate content for PDF
      const certificateHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Certificate of Achievement</title>
          <style>
            body {
              font-family: 'Georgia', serif;
              margin: 0;
              padding: 40px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .certificate {
              background: white;
              padding: 60px;
              border-radius: 20px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 800px;
              width: 100%;
              border: 8px solid #f8f9fa;
            }
            .header {
              border-bottom: 3px solid #667eea;
              padding-bottom: 30px;
              margin-bottom: 40px;
            }
            .title {
              font-size: 48px;
              color: #667eea;
              margin-bottom: 10px;
              font-weight: bold;
            }
            .subtitle {
              font-size: 18px;
              color: #6c757d;
              margin-bottom: 30px;
            }
            .recipient {
              font-size: 36px;
              color: #343a40;
              margin: 30px 0;
              font-weight: bold;
            }
            .course-title {
              font-size: 24px;
              color: #667eea;
              margin: 20px 0;
              font-style: italic;
            }
            .details {
              display: flex;
              justify-content: space-around;
              margin: 40px 0;
              padding: 20px;
              background: #f8f9fa;
              border-radius: 10px;
            }
            .detail-item {
              text-align: center;
            }
            .detail-label {
              font-size: 14px;
              color: #6c757d;
              margin-bottom: 5px;
            }
            .detail-value {
              font-size: 18px;
              color: #343a40;
              font-weight: bold;
            }
            .skills {
              margin: 30px 0;
            }
            .skill-tag {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 8px 16px;
              margin: 5px;
              border-radius: 20px;
              font-size: 14px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 30px;
              border-top: 2px solid #e9ecef;
              color: #6c757d;
              font-size: 14px;
            }
            .logo {
              width: 60px;
              height: 60px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 50%;
              margin: 0 auto 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 24px;
            }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="header">
              <div class="logo">🏆</div>
              <div class="title">Certificate of Achievement</div>
              <div class="subtitle">Actinova AI Tutor - Personalized Learning Platform</div>
            </div>
            
            <div style="margin: 40px 0;">
              <p style="font-size: 18px; color: #6c757d; margin-bottom: 20px;">This certifies that</p>
              <div class="recipient">${achievement?.recipient || "Student Name"}</div>
              <p style="font-size: 18px; color: #6c757d; margin: 20px 0;">has successfully completed</p>
              <div class="course-title">${achievement?.title || "Course Title"}</div>
            </div>
            
            <div class="details">
              <div class="detail-item">
                <div class="detail-label">Completion Date</div>
                <div class="detail-value">${achievement?.date || new Date().toLocaleDateString()}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Achievement Level</div>
                <div class="detail-value">${achievement?.level || "Beginner"}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Final Score</div>
                <div class="detail-value">${achievement?.score || "95%"}</div>
              </div>
            </div>
            
            ${
              achievement?.skills
                ? `
              <div class="skills">
                <p style="font-size: 16px; color: #6c757d; margin-bottom: 15px;">Skills Demonstrated:</p>
                ${achievement.skills.map((skill) => `<span class="skill-tag">${skill}</span>`).join("")}
              </div>
            `
                : ""
            }
            
            <div class="footer">
              <p>This certificate validates the successful completion of the course requirements and demonstrates proficiency in the subject matter.</p>
              <p style="margin-top: 20px;"><strong>Actinova AI Tutor</strong> | Certificate ID: ${achievement?.id || Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
            </div>
          </div>
        </body>
        </html>
      `

      // Create blob and download
      const blob = new Blob([certificateHTML], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `certificate-${achievement?.title?.replace(/\s+/g, "-").toLowerCase() || "achievement"}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success("Certificate downloaded successfully!")
    } catch (error) {
      toast.error("Failed to download certificate")
    } finally {
      setIsDownloading(false)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Achievement Certificate - ${achievement?.title}`,
        text: `I just earned a certificate for completing ${achievement?.title}!`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(
        `I just earned a certificate for completing ${achievement?.title}! Check it out at ${window.location.href}`,
      )
      toast.success("Achievement link copied to clipboard!")
    }
  }

  if (!achievement) return null

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
            {/* Certificate Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-t-2xl">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <motion.div
                  className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Award className="w-10 h-10" />
                </motion.div>
                <h1 className="text-3xl font-bold mb-2">Certificate of Achievement</h1>
                <p className="text-blue-100">Congratulations on your learning milestone!</p>
              </div>
            </div>

            {/* Certificate Body */}
            <div className="p-8">
              <div className="text-center mb-8">
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">This certifies that</p>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {achievement.recipient || "Student Name"}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">has successfully completed</p>
                <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-6">{achievement.title}</h3>
              </div>

              {/* Achievement Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completion Date</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {achievement.date || new Date().toLocaleDateString()}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Achievement Level</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{achievement.level || "Beginner"}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Award className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Score</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{achievement.score || "95%"}</p>
                </div>
              </div>

              {/* Skills Earned */}
              {achievement.skills && (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Skills Demonstrated</h4>
                  <div className="flex flex-wrap gap-2">
                    {achievement.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  onClick={generatePDFCertificate}
                  disabled={isDownloading}
                  className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FileText className="w-5 h-5" />
                  <span>{isDownloading ? "Generating PDF..." : "Download PDF Certificate"}</span>
                </motion.button>
                <motion.button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center space-x-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share Achievement</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
