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
import HeroNavbar from "@/(marketing)/components/heroNavbar";
import Footer from "@/(marketing)/components/Footer";
import { apiClient } from "@/lib/csrfClient";

export default function BlogPost() {
  const params = useParams();
  const slug = params.slug;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/api/blog/${slug}`);
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
      <div className="min-h-screen bg-[#FAFAF7]">
        <HeroNavbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#FAFAF7]">
        <HeroNavbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <h2
              className="text-lg font-bold text-[#0f172a] mb-3"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Post not found
            </h2>
            <Link
              href="/blog"
              className="text-green-600 hover:text-green-700 text-sm font-medium"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              ← Back to Blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] flex flex-col">
      <HeroNavbar />
      <div className="flex-1">

      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-32">
        <motion.header
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-3">
            <Link
              href="/blog"
              className="inline-flex items-center text-green-600 hover:text-green-700 text-xs font-medium"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              ← Back to Blog
            </Link>
          </div>

          <div className="mb-3">
            <span
              className="bg-green-500/10 text-green-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-green-500/20 uppercase tracking-wide"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              {post.category || "General"}
            </span>
          </div>

          <h1
            className="text-2xl md:text-3xl font-bold text-[#0f172a] mb-4 leading-tight"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            {post.title}
          </h1>

          {post.excerpt && (
            <p
              className="text-sm text-[#0f172a]/60 mb-4"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                <User className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p
                  className="text-xs font-bold text-[#0f172a]"
                  style={{ fontFamily: "var(--font-fraunces)" }}
                >
                  {post.author?.name || "Actirova AI"}
                </p>
                <div className="flex items-center gap-3 text-[10px] text-[#0f172a]/50">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span style={{ fontFamily: "var(--font-fraunces)" }}>
                      {new Date(post.publishedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span style={{ fontFamily: "var(--font-fraunces)" }}>{post.readTime || "5 min read"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span style={{ fontFamily: "var(--font-fraunces)" }}>{post.viewsCount || 0} views</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                onClick={handleShare}
                className="p-2 bg-white border border-black/10 text-[#0f172a]/60 rounded-lg hover:bg-green-50 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Share2 className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </div>
        </motion.header>

        <motion.div
          className="prose prose-sm max-w-none mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1({ children }) {
                return (
                  <h1
                    className="text-xl font-bold text-[#0f172a] mb-4 mt-6"
                    style={{ fontFamily: "var(--font-fraunces)" }}
                  >
                    {children}
                  </h1>
                );
              },
              h2({ children }) {
                return (
                  <h2
                    className="text-lg font-bold text-[#0f172a] mb-3 mt-5"
                    style={{ fontFamily: "var(--font-fraunces)" }}
                  >
                    {children}
                  </h2>
                );
              },
              h3({ children }) {
                return (
                  <h3
                    className="text-base font-bold text-[#0f172a] mb-2 mt-4"
                    style={{ fontFamily: "var(--font-fraunces)" }}
                  >
                    {children}
                  </h3>
                );
              },
              h4({ children }) {
                return (
                  <h4
                    className="text-sm font-bold text-[#0f172a] mb-2 mt-3"
                    style={{ fontFamily: "var(--font-fraunces)" }}
                  >
                    {children}
                  </h4>
                );
              },
              p({ children }) {
                return (
                  <p
                    className="text-sm text-[#0f172a]/70 mb-3 leading-relaxed"
                    style={{ fontFamily: "var(--font-fraunces)" }}
                  >
                    {children}
                  </p>
                );
              },
              ul({ children }) {
                return (
                  <ul
                    className="list-disc list-inside mb-3 space-y-1 text-sm text-[#0f172a]/70"
                    style={{ fontFamily: "var(--font-fraunces)" }}
                  >
                    {children}
                  </ul>
                );
              },
              ol({ children }) {
                return (
                  <ol
                    className="list-decimal list-inside mb-3 space-y-1 text-sm text-[#0f172a]/70"
                    style={{ fontFamily: "var(--font-fraunces)" }}
                  >
                    {children}
                  </ol>
                );
              },
              strong({ children }) {
                return (
                  <strong
                    className="font-bold text-[#0f172a]"
                    style={{ fontFamily: "var(--font-fraunces)" }}
                  >
                    {children}
                  </strong>
                );
              },
              em({ children }) {
                return <em className="italic">{children}</em>;
              },
              blockquote({ children }) {
                return (
                  <blockquote
                    className="border-l-4 border-green-500 pl-3 italic my-3 text-sm text-[#0f172a]/50"
                    style={{ fontFamily: "var(--font-fraunces)" }}
                  >
                    {children}
                  </blockquote>
                );
              },
              code({ inline, className, children, ...props }) {
                if (inline) {
                  return (
                    <code
                      className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-green-600"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }
                return (
                  <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto mb-4">
                    <code className="text-xs font-mono text-[#0f172a]/80" {...props}>
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
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-[#0f172a]/60 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1"
                  style={{ fontFamily: "var(--font-fraunces)" }}
                >
                  <Tag className="w-2.5 h-2.5" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </article>
      </div>

      <Footer />
    </div>
  );
}
