"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Heart, Share2, Eye, Calendar, ThumbsUp, Flag, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { toast } from "sonner"

export default function DiscussionPage() {
  const params = useParams()
  const [discussion, setDiscussion] = useState(null)
  const [replies, setReplies] = useState([])
  const [newReply, setNewReply] = useState("")
  const [isLiked, setIsLiked] = useState(false)

  useEffect(() => {
    // Simulate fetching discussion data
    const fetchDiscussion = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockDiscussion = {
        id: params.id,
        title: "Best practices for learning React in 2024?",
        content: `I'm starting my React journey and wondering what the current best practices are for learning React in 2024. 

I have a solid foundation in JavaScript and have built a few vanilla JS projects, but I'm ready to dive into React. Here are my specific questions:

1. **Learning Path**: Should I start with functional components and hooks right away, or learn class components first for historical context?

2. **State Management**: When should I introduce Redux or Zustand? Is Context API sufficient for most projects?

3. **Styling**: What's the current preference - CSS Modules, Styled Components, or Tailwind CSS?

4. **Testing**: Should I learn testing alongside React, or focus on building first?

5. **Project Ideas**: What are some good beginner to intermediate projects that showcase modern React patterns?

I'd love to hear from developers who have recently learned React or are teaching it. What worked best for you?

Thanks in advance for any advice!`,
        author: "Sarah Chen",
        authorAvatar: "/placeholder.svg?height=60&width=60",
        authorLevel: "Beginner",
        category: "Frontend Development",
        tags: ["React", "JavaScript", "Frontend", "Learning Path"],
        createdAt: "2024-12-15T10:30:00Z",
        views: 234,
        likes: 45,
        replies: 23,
        isHot: true,
      }

      const mockReplies = [
        {
          id: 1,
          author: "Mike Rodriguez",
          authorAvatar: "/placeholder.svg?height=40&width=40",
          authorLevel: "Expert",
          content:
            "Great questions! I'd definitely recommend starting with functional components and hooks. Class components are mostly legacy at this point. For state management, Context API is perfect for small to medium apps. Only introduce Redux when you actually need it.",
          createdAt: "2024-12-15T11:15:00Z",
          likes: 12,
          isAccepted: true,
        },
        {
          id: 2,
          author: "Emma Thompson",
          authorAvatar: "/placeholder.svg?height=40&width=40",
          authorLevel: "Intermediate",
          content:
            "For styling, I'd recommend Tailwind CSS. It has a bit of a learning curve but once you get it, you'll be much more productive. The utility-first approach really clicks with React's component model.",
          createdAt: "2024-12-15T12:00:00Z",
          likes: 8,
        },
        {
          id: 3,
          author: "Dr. James Wilson",
          authorAvatar: "/placeholder.svg?height=40&width=40",
          authorLevel: "Expert",
          content:
            "Regarding testing, I'd suggest learning it alongside React. Start with React Testing Library - it encourages good testing practices and helps you think about your components from a user's perspective. Don't wait until later to learn testing!",
          createdAt: "2024-12-15T13:30:00Z",
          likes: 15,
        },
      ]

      setDiscussion(mockDiscussion)
      setReplies(mockReplies)
    }

    fetchDiscussion()
  }, [params.id])

  const handleLike = () => {
    setIsLiked(!isLiked)
    toast.success(isLiked ? "Removed like" : "Liked discussion")
  }

  const handleReply = (e) => {
    e.preventDefault()
    if (!newReply.trim()) return

    const reply = {
      id: replies.length + 1,
      author: "Current User",
      authorAvatar: "/placeholder.svg?height=40&width=40",
      authorLevel: "Beginner",
      content: newReply,
      createdAt: new Date().toISOString(),
      likes: 0,
    }

    setReplies([...replies, reply])
    setNewReply("")
    toast.success("Reply posted successfully!")
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " at " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (!discussion) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link
          href="/community"
          className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Community</span>
        </Link>

        <div className="flex items-center space-x-2 mb-4">
          <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
            {discussion.category}
          </span>
          {discussion.isHot && (
            <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-1 rounded-full text-sm font-medium">
              🔥 Hot
            </span>
          )}
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{discussion.title}</h1>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <img
              src={discussion.authorAvatar || "/placeholder.svg"}
              alt={discussion.author}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900 dark:text-white">{discussion.author}</span>
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded text-xs">
                  {discussion.authorLevel}
                </span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(discussion.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{discussion.views} views</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <motion.button
              onClick={handleLike}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isLiked
                  ? "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
              <span>{discussion.likes + (isLiked ? 1 : 0)}</span>
            </motion.button>

            <button className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <Share2 className="w-4 h-4" />
            </button>

            <button className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Discussion Content */}
      <motion.div
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="prose prose-lg dark:prose-invert max-w-none mb-6">
          {discussion.content.split("\n\n").map((paragraph, index) => (
            <p key={index} className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {discussion.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm"
            >
              #{tag}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Replies Section */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Replies ({replies.length})</h2>

        <div className="space-y-6">
          {replies.map((reply) => (
            <div
              key={reply.id}
              className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 ${
                reply.isAccepted ? "ring-2 ring-green-500" : ""
              }`}
            >
              {reply.isAccepted && (
                <div className="flex items-center space-x-2 mb-4 text-green-600 dark:text-green-400">
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Accepted Answer</span>
                </div>
              )}

              <div className="flex items-start space-x-4">
                <img
                  src={reply.authorAvatar || "/placeholder.svg"}
                  alt={reply.author}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900 dark:text-white">{reply.author}</span>
                      <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded text-xs">
                        {reply.authorLevel}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(reply.createdAt)}</span>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">{reply.content}</p>

                  <div className="flex items-center space-x-4">
                    <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600 transition-colors">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{reply.likes}</span>
                    </button>
                    <button className="text-sm text-gray-500 hover:text-blue-600 transition-colors">Reply</button>
                    <button className="text-sm text-gray-500 hover:text-red-600 transition-colors">
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Reply Form */}
      <motion.div
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add your reply</h3>

        <form onSubmit={handleReply}>
          <div className="flex space-x-4">
            <img src="/placeholder.svg?height=40&width=40" alt="Your avatar" className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <textarea
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                placeholder="Share your thoughts and help the community..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex justify-between items-center mt-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Be respectful and constructive in your response
                </p>
                <button
                  type="submit"
                  disabled={!newReply.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Post Reply
                </button>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
