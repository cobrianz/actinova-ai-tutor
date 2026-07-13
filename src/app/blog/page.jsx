"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar,
    Clock,
    ArrowRight,
    Search,
    TrendingUp,
    User,
    Share2,
} from "lucide-react";
import Link from "next/link";
import HeroNavbar from "../components/heroNavbar";
import Footer from "../components/Footer";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";

export default function BlogPage() {
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [featuredPost, setFeaturedPost] = useState(null);
    const [blogPosts, setBlogPosts] = useState([]);
    const [categories, setCategories] = useState([
        { name: "All", value: "all", count: 0 },
    ]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                const res = await apiClient.get("/api/blog");
                if (!res.ok) throw new Error("Failed to load blog posts");
                const data = await res.json();
                const posts = data.posts || [];
                const featured = data.featured || null;
                setFeaturedPost(featured);
                setBlogPosts(posts);
                const cats = new Map();
                posts.concat(featured ? [featured] : []).forEach((p) => {
                    const key =
                        p.category?.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "") ||
                        "uncategorized";
                    cats.set(key, (cats.get(key) || 0) + 1);
                });
                const catArr = [
                    {
                        name: "All",
                        value: "all",
                        count: posts.length + (featured ? 1 : 0),
                    },
                ];
                for (const [value, count] of cats.entries()) {
                    const name = value
                        .split("-")
                        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                        .join(" ");
                    catArr.push({ name, value, count });
                }
                setCategories(catArr);
            } catch (e) {
                toast.error(e.message || "Unable to load blog");
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    const allPosts = [...(featuredPost ? [featuredPost] : []), ...blogPosts];
    const filteredPosts = allPosts.filter((post) => {
        const matchesSearch =
            post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
            selectedCategory === "all" ||
            post.category?.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "") ===
            selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <div className="min-h-screen bg-[#FAFAF7] flex flex-col">
            <HeroNavbar />
            <div className="flex-1">

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
                {/* Header */}
                <motion.div
                    className="text-center mb-10"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1
                        className="text-2xl md:text-3xl font-bold text-[#0f172a] mb-3 tracking-tight"
                        style={{ fontFamily: "var(--font-fraunces)" }}
                    >
                        Learning Insights & Tips
                    </h1>
                    <p
                        className="text-sm md:text-base text-[#0f172a]/65 max-w-xl mx-auto"
                        style={{ fontFamily: "var(--font-fraunces)" }}
                    >
                        Discover the latest trends in education, learning strategies, and
                        insights from our community of educators and learners.
                    </p>
                </motion.div>

                {/* Search and Categories */}
                <motion.div
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search articles..."
                            className="w-full pl-9 pr-3 py-2 border border-black/10 rounded-lg bg-white text-sm text-[#0f172a] placeholder-[#0f172a]/40 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                            style={{ fontFamily: "var(--font-fraunces)" }}
                        />
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        {categories.map((category) => (
                            <motion.button
                                key={category.value}
                                onClick={() => setSelectedCategory(category.value)}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedCategory === category.value
                                    ? "bg-green-500 text-white"
                                    : "bg-white text-[#0f172a]/60 hover:bg-white/80 border border-black/10"
                                }`}
                                style={{ fontFamily: "var(--font-fraunces)" }}
                            >
                                {category.name} ({category.count})
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                {/* Featured Post */}
                {featuredPost &&
                    filteredPosts.some((p) => p.slug === featuredPost.slug) && (
                        <motion.div
                            className="mb-12"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        >
                            <div className="relative overflow-hidden rounded-2xl border border-white bg-white/80 backdrop-blur-xl shadow-sm">
                                <div className="relative p-6 md:p-10 flex flex-col lg:flex-row gap-8 items-center">
                                    <div className="flex-1">
                                        <motion.div
                                            className="inline-flex items-center gap-1.5 mb-4 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-600 rounded-full"
                                            whileHover={{ scale: 1.03 }}
                                        >
                                            <TrendingUp className="w-3 h-3" />
                                            <span
                                                className="text-[10px] font-bold tracking-wider uppercase"
                                                style={{ fontFamily: "var(--font-fraunces)" }}
                                            >
                                                Featured Article
                                            </span>
                                        </motion.div>

                                        <h2
                                            className="text-xl md:text-2xl lg:text-3xl font-bold text-[#0f172a] mb-3 leading-tight"
                                            style={{ fontFamily: "var(--font-fraunces)" }}
                                        >
                                            {featuredPost.title}
                                        </h2>

                                        <p
                                            className="text-sm text-[#0f172a]/60 mb-6 leading-relaxed max-w-xl line-clamp-3"
                                            style={{ fontFamily: "var(--font-fraunces)" }}
                                        >
                                            {featuredPost.excerpt}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-4 mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                                    {featuredPost.author?.avatar ? (
                                                        <img src={featuredPost.author.avatar} alt={featuredPost.author.name} className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        <User className="w-4 h-4 text-green-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p
                                                        className="text-xs font-bold text-[#0f172a]"
                                                        style={{ fontFamily: "var(--font-fraunces)" }}
                                                    >
                                                        {featuredPost.author?.name || "Admin"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1 text-xs text-[#0f172a]/50">
                                                    <Calendar className="w-3 h-3" />
                                                    <span style={{ fontFamily: "var(--font-fraunces)" }}>{featuredPost.date}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-[#0f172a]/50">
                                                    <Clock className="w-3 h-3" />
                                                    <span style={{ fontFamily: "var(--font-fraunces)" }}>{featuredPost.readTime}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Link
                                                href={`/blog/${featuredPost.slug || featuredPost._id}`}
                                                className="inline-flex items-center gap-2 bg-green-500 text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-green-600 transition-all shadow-sm"
                                                style={{ fontFamily: "var(--font-fraunces)" }}
                                            >
                                                <span>Start Reading</span>
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </Link>

                                            <motion.button
                                                onClick={() => {
                                                    if (navigator.share) {
                                                        navigator.share({
                                                            title: featuredPost.title,
                                                            text: featuredPost.excerpt,
                                                            url: `${window.location.origin}/blog/${featuredPost.slug}`,
                                                        });
                                                    } else {
                                                        navigator.clipboard.writeText(`${window.location.origin}/blog/${featuredPost.slug}`);
                                                        toast.success("Link copied to clipboard!");
                                                    }
                                                }}
                                                className="p-2.5 bg-white hover:bg-green-50 text-[#0f172a]/60 rounded-full transition-all border border-black/10"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                <Share2 className="w-3.5 h-3.5" />
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                {/* Blog Posts Grid */}
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                        >
                            {Array.from({ length: 6 }).map((_, index) => (
                                <motion.div
                                    key={`skeleton-${index}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    className="bg-[#F8F8F5] rounded-2xl overflow-hidden border border-black/[0.04]"
                                >
                                    <div className="h-1 bg-gray-200 animate-pulse" />
                                    <div className="p-5">
                                        <div className="h-3 bg-gray-100 rounded-full mb-3 animate-pulse w-16" />
                                        <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse" />
                                        <div className="h-4 bg-gray-200 rounded mb-3 animate-pulse w-3/4" />
                                        <div className="space-y-1.5 mb-4">
                                            <div className="h-3 bg-gray-100 rounded animate-pulse" />
                                            <div className="h-3 bg-gray-100 rounded animate-pulse w-5/6" />
                                        </div>
                                        <div className="flex items-center gap-2 pt-3 border-t border-black/5">
                                            <div className="w-6 h-6 bg-gray-100 rounded-full animate-pulse" />
                                            <div className="h-3 bg-gray-100 rounded animate-pulse w-20" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key={selectedCategory + searchQuery}
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                        >
                            {filteredPosts
                                .filter((post) => !post.featured)
                                .map((post) => (
                                    <motion.article
                                        key={post.slug || post._id}
                                        variants={itemVariants}
                                        whileHover={{ y: -4 }}
                                        className="group bg-[#F8F8F5] rounded-2xl overflow-hidden border border-black/[0.04] hover:border-green-500/25 hover:shadow-lg hover:shadow-green-500/5 transition-all duration-300"
                                    >
                                        {/* Top accent bar */}
                                        <div className="h-0.5 bg-gradient-to-r from-green-400 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                        {/* Thumbnail */}
                                        {post.thumbnailUrl && (
                                            <div className="relative h-40 overflow-hidden">
                                                <img
                                                    src={post.thumbnailUrl}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                            </div>
                                        )}

                                        <div className="p-5">
                                            {/* Category + trending */}
                                            <div className="flex items-center gap-2 mb-3">
                                                <span
                                                    className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-600 border border-green-500/15 uppercase tracking-wider"
                                                    style={{ fontFamily: "var(--font-fraunces)" }}
                                                >
                                                    {post.category}
                                                </span>
                                                {post.trending && (
                                                    <span
                                                        className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-600 border border-orange-500/15 flex items-center gap-1"
                                                        style={{ fontFamily: "var(--font-fraunces)" }}
                                                    >
                                                        <TrendingUp className="w-2.5 h-2.5" />
                                                        Trending
                                                    </span>
                                                )}
                                            </div>

                                            {/* Title */}
                                            <h3
                                                className="text-base font-bold text-[#0f172a] mb-2 line-clamp-2 leading-snug group-hover:text-green-600 transition-colors"
                                                style={{ fontFamily: "var(--font-fraunces)" }}
                                            >
                                                {post.title}
                                            </h3>

                                            {/* Excerpt */}
                                            <p
                                                className="text-xs text-[#0f172a]/50 mb-4 line-clamp-2 leading-relaxed"
                                                style={{ fontFamily: "var(--font-fraunces)" }}
                                            >
                                                {post.excerpt}
                                            </p>

                                            {/* Tags */}
                                            {(post.tags || []).length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mb-4">
                                                    {(post.tags || []).slice(0, 3).map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="px-2 py-0.5 rounded-full text-[10px] bg-black/[0.04] text-[#0f172a]/40 font-medium"
                                                            style={{ fontFamily: "var(--font-fraunces)" }}
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Footer */}
                                            <div className="flex items-center justify-between pt-3 border-t border-black/[0.04]">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="w-6 h-6 rounded-full bg-green-500/10 border border-green-500/15 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                        {post.author?.avatar ? (
                                                            <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User className="w-3 h-3 text-green-600" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span
                                                            className="text-[11px] font-bold text-[#0f172a] leading-tight block truncate"
                                                            style={{ fontFamily: "var(--font-fraunces)" }}
                                                        >
                                                            {post.author?.name || "Admin"}
                                                        </span>
                                                        <span
                                                            className="text-[10px] text-[#0f172a]/35 leading-tight block"
                                                            style={{ fontFamily: "var(--font-fraunces)" }}
                                                        >
                                                            {post.date}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <span
                                                        className="text-[10px] text-[#0f172a]/30 hidden sm:inline"
                                                        style={{ fontFamily: "var(--font-fraunces)" }}
                                                    >
                                                        {post.readTime}
                                                    </span>
                                                    <motion.button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            if (navigator.share) {
                                                                navigator.share({
                                                                    title: post.title,
                                                                    text: post.excerpt,
                                                                    url: `${window.location.origin}/blog/${post.slug}`,
                                                                }).catch(() => { });
                                                            } else {
                                                                navigator.clipboard.writeText(`${window.location.origin}/blog/${post.slug}`);
                                                                toast.success("Link copied!");
                                                            }
                                                        }}
                                                        className="p-1.5 hover:bg-green-50 rounded-lg transition-colors text-[#0f172a]/25 hover:text-green-600"
                                                        title="Share article"
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        <Share2 className="w-3 h-3" />
                                                    </motion.button>
                                                    <Link
                                                        href={`/blog/${post.slug || post._id}`}
                                                        className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors shadow-sm"
                                                    >
                                                        <ArrowRight className="w-3 h-3" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.article>
                                ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Empty State */}
                {!loading && filteredPosts.length === 0 && (
                    <motion.div
                        className="text-center py-12"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Search className="w-12 h-12 text-[#0f172a]/20 mx-auto mb-3" />
                        <h3
                            className="text-base font-bold text-[#0f172a] mb-1"
                            style={{ fontFamily: "var(--font-fraunces)" }}
                        >
                            No articles found
                        </h3>
                        <p
                            className="text-xs text-[#0f172a]/50 mb-4"
                            style={{ fontFamily: "var(--font-fraunces)" }}
                        >
                            {searchQuery
                                ? `No articles match "${searchQuery}" in the selected category.`
                                : "No articles found in the selected category."}
                        </p>
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setSelectedCategory("all");
                            }}
                            className="bg-green-500 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-green-600 transition-colors"
                            style={{ fontFamily: "var(--font-fraunces)" }}
                        >
                            Clear Filters
                        </button>
                    </motion.div>
                )}

                {/* Newsletter Signup */}
                <motion.div
                    className="mt-16 bg-[#F2F1EC] rounded-2xl p-6 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                >
                    <h2
                        className="text-lg font-bold text-[#0f172a] mb-2"
                        style={{ fontFamily: "var(--font-fraunces)" }}
                    >
                        Stay Updated with Learning Insights
                    </h2>
                    <p
                        className="text-xs text-[#0f172a]/55 mb-4 max-w-md mx-auto"
                        style={{ fontFamily: "var(--font-fraunces)" }}
                    >
                        Get the latest articles, learning tips, and educational insights
                        delivered to your inbox weekly.
                    </p>
                    <NewsletterForm />
                </motion.div>
            </div>
            </div>

            <Footer />
        </div>
    );
}

function NewsletterForm() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState("idle");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;
        setStatus("loading");
        try {
            const res = await apiClient.post("/api/newsletter", { email });
            if (res.ok) {
                setStatus("success");
                setEmail("");
                setTimeout(() => setStatus("idle"), 3000);
            } else {
                setStatus("error");
            }
        } catch {
            setStatus("error");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
            {status === "success" ? (
                <div
                    className="w-full p-2 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 text-xs font-medium"
                    style={{ fontFamily: "var(--font-fraunces)" }}
                >
                    Subscribed successfully!
                </div>
            ) : (
                <>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="flex-1 px-3 py-2 border border-black/10 rounded-lg bg-white text-xs text-[#0f172a] placeholder-[#0f172a]/40 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                        style={{ fontFamily: "var(--font-fraunces)" }}
                        disabled={status === "loading"}
                    />
                    <button
                        disabled={status === "loading"}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-xs font-bold disabled:opacity-50"
                        style={{ fontFamily: "var(--font-fraunces)" }}
                    >
                        {status === "loading" ? "..." : "Subscribe"}
                    </button>
                </>
            )}
        </form>
    );
}
