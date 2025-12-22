"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar,
    Clock,
    ArrowRight,
    Search,
    Tag,
    TrendingUp,
    User,
} from "lucide-react";
import Link from "next/link";
import HeroNavbar from "../components/heroNavbar";
import { toast } from "sonner";

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
                const res = await fetch("/api/blog", { credentials: "include" });
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
        <div className="min-h-screen bg-white dark:bg-gray-900">
            <HeroNavbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Learning Insights & Tips
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                        Discover the latest trends in education, learning strategies, and
                        insights from our community of educators and learners.
                    </p>
                </motion.div>

                {/* Search and Categories */}
                <motion.div
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search articles..."
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Categories */}
                    <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                            <motion.button
                                key={category.value}
                                onClick={() => setSelectedCategory(category.value)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === category.value
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }`}
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
                            className="mb-16"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
                                <div className="flex items-center space-x-2 mb-4">
                                    <TrendingUp className="w-5 h-5" />
                                    <span className="text-sm font-medium">Featured Article</span>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                                    <div>
                                        <h2 className="text-3xl font-bold mb-4">
                                            {featuredPost.title}
                                        </h2>
                                        <p className="text-blue-100 mb-6">{featuredPost.excerpt}</p>

                                        <div className="flex items-center space-x-6 mb-6 text-sm">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                    <User className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                                                </div>
                                                <span>{featuredPost.author?.name || "Admin"}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Calendar className="w-4 h-4" />
                                                <span>{featuredPost.date}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Clock className="w-4 h-4" />
                                                <span>{featuredPost.readTime}</span>
                                            </div>
                                        </div>

                                        <Link
                                            href={`/blog/${featuredPost.slug || featuredPost._id}`}
                                            className="inline-flex items-center space-x-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                                        >
                                            <span>Read Article</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>

                                    <div className="relative">
                                        <div className="w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-2xl flex items-center justify-center">
                                            <div className="text-gray-400 dark:text-gray-500 text-lg">
                                                No Image
                                            </div>
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
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            {Array.from({ length: 6 }).map((_, index) => (
                                <motion.div
                                    key={`skeleton-${index}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                                >
                                    {/* Image skeleton */}
                                    <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 animate-pulse" />

                                    <div className="p-6">
                                        {/* Title skeleton */}
                                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-3 animate-pulse" />
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse w-3/4" />

                                        {/* Excerpt skeleton */}
                                        <div className="space-y-2 mb-4">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6" />
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/6" />
                                        </div>

                                        {/* Tags skeleton */}
                                        <div className="flex gap-2 mb-4">
                                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 animate-pulse w-16" />
                                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 animate-pulse w-20" />
                                        </div>

                                        {/* Author and read link skeleton */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                                                <div>
                                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1 animate-pulse w-20" />
                                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24" />
                                                </div>
                                            </div>
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-12" />
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
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            {filteredPosts
                                .filter((post) => !post.featured)
                                .map((post) => (
                                    <motion.article
                                        key={post.slug || post._id}
                                        variants={itemVariants}
                                        whileHover={{ y: -5 }}
                                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                                    >
                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium">
                                                    {post.category}
                                                </span>
                                                {post.trending && (
                                                    <div className="flex items-center space-x-1 text-orange-500 text-xs font-medium">
                                                        <TrendingUp className="w-3 h-3" />
                                                        <span>Trending</span>
                                                    </div>
                                                )}
                                            </div>

                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2">
                                                {post.title}
                                            </h3>

                                            <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                                                {post.excerpt}
                                            </p>

                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {(post.tags || []).slice(0, 3).map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs flex items-center space-x-1"
                                                    >
                                                        <Tag className="w-3 h-3" />
                                                        <span>{tag}</span>
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                        <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {post.author?.name || "Admin"}
                                                        </p>
                                                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                                            <span>{post.date}</span>
                                                            <span>•</span>
                                                            <span>{post.readTime}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Link
                                                    href={`/blog/${post.slug || post._id}`}
                                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm flex items-center space-x-1"
                                                >
                                                    <span>Read</span>
                                                    <ArrowRight className="w-4 h-4" />
                                                </Link>
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
                        className="text-center py-16"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No articles found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {searchQuery
                                ? `No articles match "${searchQuery}" in the selected category.`
                                : "No articles found in the selected category."}
                        </p>
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setSelectedCategory("all");
                            }}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Clear Filters
                        </button>
                    </motion.div>
                )}

                {/* Newsletter Signup */}
                <motion.div
                    className="mt-20 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                >
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Stay Updated with Learning Insights
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
                        Get the latest articles, learning tips, and educational insights
                        delivered to your inbox weekly.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                            Subscribe
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
