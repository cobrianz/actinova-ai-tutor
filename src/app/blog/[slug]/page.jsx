"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Share2,
  Tag,
  Eye,
  User,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import HeroNavbar from "@/components/heroNavbar";

export default function BlogPost() {
  const params = useParams();
  const slug = params.slug;
  const [post, setPost] = useState(null);
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
      } catch (e) {
        toast.error(e.message || "Unable to load article");
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchPost();
  }, [slug]);

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

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-32">
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
                  {post.author?.name || "Actirova AI"}
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
      </article>
    </div>
  );
}
