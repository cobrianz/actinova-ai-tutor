"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  Heart,
  Share2,
  ThumbsUp,
  Tag,
  Eye,
  User,
  MessageCircle,
  Send,
  Trash2,
  Edit2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "@/components/AuthProvider";
import HeroNavbar from "@/components/heroNavbar";

export default function BlogPost() {
  const params = useParams();
  const slug = params.slug;
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/blog/${slug}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load article");
        const data = await res.json();
        setPost(data.post);
        setLikesCount(data.post.likesCount || 0);

        // Fetch comments
        try {
          const cRes = await fetch(`/api/blog/${slug}/comments`, {
            credentials: "include",
          });
          if (cRes.ok) {
            const cData = await cRes.json();
            setComments(cData.comments || []);
          }
        } catch (e) {
          console.error("Failed to load comments:", e);
        }
      } catch (e) {
        toast.error(e.message || "Unable to load article");
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchPost();
  }, [slug]);

  const handleLike = async () => {
    if (!user) {
      toast.error("Please log in to like posts");
      return;
    }

    try {
      const res = await fetch(`/api/blog/${slug}/like`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to toggle like");
      }

      setIsLiked(data.liked);
      setLikesCount(data.likesCount);
      toast.success(data.liked ? "Post liked!" : "Like removed");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt || post.summary,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to comment");
      return;
    }
    if (!comment.trim()) return;

    try {
      const res = await fetch(`/api/blog/${slug}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: comment }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add comment");
      }

      setComments([data.comment, ...comments]);
      setComment("");
      toast.success("Comment posted!");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleReply = async (parentId) => {
    if (!user) {
      toast.error("Please log in to reply");
      return;
    }
    if (!replyText.trim()) return;

    try {
      const res = await fetch(`/api/blog/${slug}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyText, parentId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add reply");
      }

      // Add reply to the parent comment
      setComments(comments.map(c => {
        if (c._id === parentId) {
          return {
            ...c,
            replies: [...(c.replies || []), data.comment],
            repliesCount: (c.repliesCount || 0) + 1,
          };
        }
        return c;
      }));

      setReplyText("");
      setReplyingTo(null);
      toast.success("Reply posted!");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!user) {
      toast.error("Please log in to like comments");
      return;
    }

    try {
      const res = await fetch(`/api/blog/${slug}/comments/${commentId}/like`, {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to like comment");
      }

      // Update comment likes in state
      const updateCommentLikes = (comments) => {
        return comments.map(c => {
          if (c._id === commentId) {
            return { ...c, likesCount: data.likesCount };
          }
          if (c.replies) {
            return { ...c, replies: updateCommentLikes(c.replies) };
          }
          return c;
        });
      };

      setComments(updateCommentLikes(comments));
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const res = await fetch(`/api/blog/${slug}/comments/${commentId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete comment");
      }

      // Remove comment from state
      setComments(comments.filter(c => c._id !== commentId));
      toast.success("Comment deleted");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editText.trim()) return;

    try {
      const res = await fetch(`/api/blog/${slug}/comments/${commentId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: editText }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to edit comment");
      }

      // Update comment in state
      setComments(comments.map(c => {
        if (c._id === commentId) {
          return { ...c, body: editText };
        }
        return c;
      }));

      setEditingComment(null);
      setEditText("");
      toast.success("Comment updated");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const CommentItem = ({ comment, isReply = false }) => {
    const isOwner = user && comment.author?.name === user.name;
    const [localReplyText, setLocalReplyText] = useState("");
    const [isReplying, setIsReplying] = useState(false);

    const handleLocalReply = async () => {
      if (!localReplyText.trim()) return;

      try {
        const res = await fetch(`/api/blog/${slug}/comments`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: localReplyText, parentId: comment._id }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to add reply");
        }

        // Add reply to the parent comment
        setComments(comments.map(c => {
          if (c._id === comment._id) {
            return {
              ...c,
              replies: [...(c.replies || []), data.comment],
              repliesCount: (c.repliesCount || 0) + 1,
            };
          }
          return c;
        }));

        setLocalReplyText("");
        setIsReplying(false);
        toast.success("Reply posted!");
      } catch (e) {
        toast.error(e.message);
      }
    };

    return (
      <div className={`flex space-x-3 ${isReply ? "ml-12" : ""}`}>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {comment.author?.name || "User"}
              </h4>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {comment.timeAgo}
                </span>
                {isOwner && !editingComment && (
                  <>
                    <button
                      onClick={() => {
                        setEditingComment(comment._id);
                        setEditText(comment.body);
                      }}
                      className="text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      className="text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {editingComment === comment._id ? (
              <div className="space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditComment(comment._id)}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingComment(null);
                      setEditText("");
                    }}
                    className="px-4 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 dark:text-gray-300">{comment.body}</p>
            )}
          </div>

          <div className="flex items-center space-x-4 mt-2">
            <button
              onClick={() => handleLikeComment(comment._id)}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{comment.likesCount || 0}</span>
            </button>
            {!isReply && (
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
              >
                Reply {comment.repliesCount > 0 && `(${comment.repliesCount})`}
              </button>
            )}
          </div>

          {/* Reply form */}
          {isReplying && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={localReplyText}
                  onChange={(e) => setLocalReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleLocalReply();
                    }
                  }}
                />
                <button
                  onClick={handleLocalReply}
                  disabled={!localReplyText.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem key={reply._id} comment={reply} isReply={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <HeroNavbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <HeroNavbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Post not found
            </h2>
            <Link
              href="/blog"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              ← Back to Blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <HeroNavbar />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.header
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4">
            <Link
              href="/blog"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
            >
              ← Back to Blog
            </Link>
          </div>

          <div className="mb-4">
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
              {post.category || "General"}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {post.author?.name || "Actinova AI"}
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(post.publishedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{post.readTime || "5 min read"}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{post.viewsCount || 0} views</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <motion.button
                onClick={handleLike}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${isLiked
                  ? "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                <span>{likesCount}</span>
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

        <motion.div
          className="prose prose-lg dark:prose-invert max-w-none mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1({ children }) {
                return (
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 mt-8">
                    {children}
                  </h1>
                );
              },
              h2({ children }) {
                return (
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-6">
                    {children}
                  </h2>
                );
              },
              h3({ children }) {
                return (
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 mt-5">
                    {children}
                  </h3>
                );
              },
              h4({ children }) {
                return (
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2 mt-4">
                    {children}
                  </h4>
                );
              },
              p({ children }) {
                return (
                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    {children}
                  </p>
                );
              },
              ul({ children }) {
                return (
                  <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-300">
                    {children}
                  </ul>
                );
              },
              ol({ children }) {
                return (
                  <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-300">
                    {children}
                  </ol>
                );
              },
              strong({ children }) {
                return (
                  <strong className="font-bold text-gray-900 dark:text-white">
                    {children}
                  </strong>
                );
              },
              em({ children }) {
                return <em className="italic">{children}</em>;
              },
              blockquote({ children }) {
                return (
                  <blockquote className="border-l-4 border-blue-500 pl-4 italic my-4 text-gray-600 dark:text-gray-400">
                    {children}
                  </blockquote>
                );
              },
              code({ inline, className, children, ...props }) {
                if (inline) {
                  return (
                    <code
                      className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-sm font-mono text-blue-600 dark:text-blue-400"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }
                return (
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-6">
                    <code className="text-sm font-mono text-gray-800 dark:text-gray-200" {...props}>
                      {children}
                    </code>
                  </pre>
                );
              },
            }}
          >
            {post.content || ""}
          </ReactMarkdown>
        </motion.div>

        {post.tags && post.tags.length > 0 && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm flex items-center space-x-1"
                >
                  <Tag className="w-3 h-3" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          className="border-t border-gray-200 dark:border-gray-700 pt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
            <MessageCircle className="w-6 h-6" />
            <span>Comments ({comments.length})</span>
          </h3>

          {user ? (
            <form onSubmit={handleComment} className="mb-8">
              <div className="flex space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
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
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Post Comment</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Please log in to comment
              </p>
              <Link
                href="/auth/login"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Log In
              </Link>
            </div>
          )}

          <div className="space-y-6">
            <AnimatePresence>
              {comments.map((comment) => (
                <motion.div
                  key={comment._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <CommentItem comment={comment} />
                </motion.div>
              ))}
            </AnimatePresence>

            {comments.length === 0 && (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No comments yet. Be the first to share your thoughts!
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </article>
    </div>
  );
}
