"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Calendar, Clock, Eye, Heart, Share2, Bookmark, ThumbsUp, Tag, Sparkles } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { toast } from "sonner"

export default function BlogPost() {
  const params = useParams()
  const [post, setPost] = useState(null)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [comment, setComment] = useState("")
  const [comments, setComments] = useState([])
  const [relatedPosts, setRelatedPosts] = useState([])

  useEffect(() => {
    // Simulate fetching blog post data
    const fetchPost = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockPost = {
        id: params.id,
        title: "The Future of AI-Powered Education: Trends to Watch in 2024",
        content: `
# The Future of AI-Powered Education: Trends to Watch in 2024

Artificial Intelligence is revolutionizing education in ways we never imagined. As we move through 2024, several key trends are emerging that will shape how we learn, teach, and interact with educational content.

## Personalized Learning Paths

One of the most significant developments in AI-powered education is the ability to create truly personalized learning experiences. AI algorithms can now analyze a student's learning patterns, strengths, and weaknesses to create customized curricula that adapt in real-time.

### Key Benefits:
- **Adaptive pacing**: Students can learn at their own speed
- **Targeted content**: Focus on areas that need improvement
- **Multiple learning styles**: Content adapted to visual, auditory, and kinesthetic learners

## Intelligent Tutoring Systems

AI tutors are becoming increasingly sophisticated, offering 24/7 support to learners worldwide. These systems can:

- Provide instant feedback on assignments
- Answer questions in natural language
- Offer hints and guidance without giving away answers
- Track progress and suggest next steps

## Natural Language Processing in Education

NLP is making educational content more accessible and interactive:

\`\`\`javascript
// Example: AI-powered content analysis
function analyzeReadingLevel(text) {
  const sentences = text.split('.');
  const words = text.split(' ');
  const avgWordsPerSentence = words.length / sentences.length;
  
  return {
    readingLevel: calculateLevel(avgWordsPerSentence),
    suggestions: generateSuggestions(text)
  };
}
\`\`\`

## Virtual Reality and Immersive Learning

AI is enhancing VR educational experiences by:

- Creating dynamic, responsive virtual environments
- Personalizing VR scenarios based on learning objectives
- Providing real-time feedback within immersive experiences

## Automated Assessment and Feedback

Traditional testing is being transformed through AI:

- **Instant grading**: Immediate feedback on assignments
- **Plagiarism detection**: Advanced content analysis
- **Skill assessment**: Comprehensive evaluation of competencies

## Challenges and Considerations

While AI in education offers tremendous opportunities, we must also consider:

### Privacy and Data Security
Student data protection is paramount. Educational institutions must implement robust security measures to protect sensitive information.

### Digital Divide
Not all students have equal access to AI-powered educational tools. We must work to ensure equitable access to these technologies.

### Teacher Training
Educators need proper training to effectively integrate AI tools into their teaching methods.

## Looking Ahead

The future of AI in education is bright, but it requires thoughtful implementation. As we continue to develop these technologies, we must keep the human element at the center of education while leveraging AI to enhance and personalize the learning experience.

## Conclusion

AI-powered education is not about replacing teachers—it's about empowering them with tools to provide better, more personalized education to every student. As we move forward, the key will be finding the right balance between technological innovation and human connection in learning.

*What are your thoughts on AI in education? Share your experiences and predictions in the comments below.*
        `,
        author: "Sarah Chen",
        authorAvatar: "/placeholder.svg?height=60&width=60",
        authorBio:
          "Sarah is an EdTech researcher and AI specialist with over 10 years of experience in educational technology. She holds a PhD in Computer Science from MIT.",
        date: "December 15, 2024",
        readTime: "8 min read",
        category: "AI & Technology",
        image: "/placeholder.svg?height=400&width=800",
        tags: ["AI", "Education", "Technology", "Future", "Machine Learning"],
        views: 1247,
        likes: 89,
        bookmarks: 34,
        featured: true,
      }

      const mockComments = [
        {
          id: 1,
          author: "Mike Rodriguez",
          avatar: "/placeholder.svg?height=40&width=40",
          content:
            "Great article! I've been implementing AI tutoring systems in my classroom and the results are amazing. Students are more engaged and learning outcomes have improved significantly.",
          timeAgo: "2 hours ago",
          likes: 12,
        },
        {
          id: 2,
          author: "Emma Thompson",
          avatar: "/placeholder.svg?height=40&width=40",
          content:
            "The point about the digital divide is crucial. We need to ensure that AI-powered education doesn't widen the gap between privileged and underprivileged students.",
          timeAgo: "4 hours ago",
          likes: 8,
        },
        {
          id: 3,
          author: "Dr. James Wilson",
          avatar: "/placeholder.svg?height=40&width=40",
          content:
            "As an educator for 20+ years, I'm excited about AI's potential but also concerned about maintaining the human connection in learning. Balance is key.",
          timeAgo: "6 hours ago",
          likes: 15,
        },
      ]

      const mockRelatedPosts = [
        {
          id: 2,
          title: "10 Effective Study Techniques Backed by Science",
          image: "/placeholder.svg?height=200&width=300",
          readTime: "6 min read",
          category: "Learning Tips",
        },
        {
          id: 3,
          title: "Building a Successful Remote Learning Environment",
          image: "/placeholder.svg?height=200&width=300",
          readTime: "5 min read",
          category: "Remote Learning",
        },
        {
          id: 4,
          title: "The Psychology of Motivation in Online Learning",
          image: "/placeholder.svg?height=200&width=300",
          readTime: "7 min read",
          category: "Psychology",
        },
      ]

      setPost(mockPost)
      setComments(mockComments)
      setRelatedPosts(mockRelatedPosts)
    }

    fetchPost()
  }, [params.id])

  const handleLike = () => {
    setIsLiked(!isLiked)
    toast.success(isLiked ? "Removed from likes" : "Added to likes")
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    toast.success(isBookmarked ? "Removed from bookmarks" : "Added to bookmarks")
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.title,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Link copied to clipboard!")
    }
  }

  const handleComment = (e) => {
    e.preventDefault()
    if (!comment.trim()) return

    const newComment = {
      id: comments.length + 1,
      author: "Current User",
      avatar: "/placeholder.svg?height=40&width=40",
      content: comment,
      timeAgo: "Just now",
      likes: 0,
    }

    setComments([newComment, ...comments])
    setComment("")
    toast.success("Comment added successfully!")
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <motion.div
                className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Actinova AI Tutor</span>
            </Link>

            <div className="flex items-center space-x-6">
              <Link
                href="/blog"
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Blog</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Article Header */}
        <motion.header
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4">
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
              {post.category}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <img src={post.authorAvatar || "/placeholder.svg"} alt={post.author} className="w-12 h-12 rounded-full" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{post.author}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{post.date}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{post.readTime}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{post.views} views</span>
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
                <span>{post.likes + (isLiked ? 1 : 0)}</span>
              </motion.button>

              <motion.button
                onClick={handleBookmark}
                className={`p-2 rounded-lg transition-colors ${
                  isBookmarked
                    ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
              </motion.button>

              <motion.button
                onClick={handleShare}
                className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Share2 className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.header>

        {/* Featured Image */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <img
            src={post.image || "/placeholder.svg"}
            alt={post.title}
            className="w-full h-64 md:h-96 object-cover rounded-2xl"
          />
        </motion.div>

        {/* Article Content */}
        <motion.div
          className="prose prose-lg dark:prose-invert max-w-none mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div
            dangerouslySetInnerHTML={{
              __html: post.content
                .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">$1</h1>')
                .replace(
                  /^## (.*$)/gm,
                  '<h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4 mt-8">$1</h2>',
                )
                .replace(
                  /^### (.*$)/gm,
                  '<h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6">$1</h3>',
                )
                .replace(
                  /```(\w+)?\n([\s\S]*?)```/g,
                  '<pre class="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto mb-6"><code class="text-sm">$2</code></pre>',
                )
                .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">$1</code>')
                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                .replace(/^- (.*$)/gm, '<li class="mb-2">$1</li>')
                .replace(/(<li.*<\/li>)/s, '<ul class="list-disc list-inside mb-6 space-y-2">$1</ul>')
                .replace(/\n\n/g, '</p><p class="mb-6 text-gray-700 dark:text-gray-300 leading-relaxed">')
                .replace(
                  /^(?!<[h|u|p|c])(.*$)/gm,
                  '<p class="mb-6 text-gray-700 dark:text-gray-300 leading-relaxed">$1</p>',
                ),
            }}
          />
        </motion.div>

        {/* Tags */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm flex items-center space-x-1"
              >
                <Tag className="w-3 h-3" />
                <span>{tag}</span>
              </span>
            ))}
          </div>
        </motion.div>

        {/* Author Bio */}
        <motion.div
          className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="flex items-start space-x-4">
            <img src={post.authorAvatar || "/placeholder.svg"} alt={post.author} className="w-16 h-16 rounded-full" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">About {post.author}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{post.authorBio}</p>
            </div>
          </div>
        </motion.div>

        {/* Comments Section */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Comments ({comments.length})</h3>

          {/* Comment Form */}
          <form onSubmit={handleComment} className="mb-8">
            <div className="flex space-x-4">
              <img src="/placeholder.svg?height=40&width=40" alt="Your avatar" className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="flex justify-end mt-3">
                  <button
                    type="submit"
                    disabled={!comment.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Post Comment
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-4">
                <img
                  src={comment.avatar || "/placeholder.svg"}
                  alt={comment.author}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{comment.author}</h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{comment.timeAgo}</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                  </div>
                  <div className="flex items-center space-x-4 mt-2">
                    <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600 transition-colors">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{comment.likes}</span>
                    </button>
                    <button className="text-sm text-gray-500 hover:text-blue-600 transition-colors">Reply</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Related Posts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Related Articles</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map((relatedPost) => (
              <Link key={relatedPost.id} href={`/blog/${relatedPost.id}`} className="group">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <img
                    src={relatedPost.image || "/placeholder.svg"}
                    alt={relatedPost.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="p-4">
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{relatedPost.category}</span>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mt-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {relatedPost.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{relatedPost.readTime}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </article>
    </div>
  )
}
