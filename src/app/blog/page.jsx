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
    Share2,
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
        <div className="min-h-screen bg-background">
            <HeroNavbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
                {/* Header */}
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                        Learning Insights & Tips
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
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
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search articles..."
                            className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
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
                            className="mb-20 relative group"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        >
                            <div className="relative overflow-hidden rounded-[2.5rem] border border-border bg-card/50 backdrop-blur-xl shadow-2xl shadow-primary/5">
                                {/* Decorative elements */}
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-background/40 to-purple-600/10 opacity-50 dark:opacity-30" />
                                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

                                {/* Grid Pattern */}
                                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07]" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, var(--foreground) 1px, transparent 0)`, backgroundSize: '40px 40px' }} />

                                {/* Content */}
                                <div className="relative p-8 md:p-12 lg:p-16 flex flex-col lg:flex-row gap-12 items-center">
                                    <div className="flex-1 order-2 lg:order-1">
                                        <motion.div
                                            className="inline-flex items-center space-x-2 mb-8 px-4 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-full"
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            <TrendingUp className="w-4 h-4" />
                                            <span className="text-[10px] sm:text-xs font-black  tracking-[0.2em]">Featured Article</span>
                                        </motion.div>

                                        <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-foreground mb-6 leading-[1.1] tracking-tight">
                                            {featuredPost.title}
                                        </h2>

                                        <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl line-clamp-3 font-medium">
                                            {featuredPost.excerpt}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-8 mb-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 p-[2px]">
                                                    <div className="w-full h-full rounded-[14px] bg-card flex items-center justify-center overflow-hidden">
                                                        {featuredPost.author?.avatar ? (
                                                            <img src={featuredPost.author.avatar} alt={featuredPost.author.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User className="w-6 h-6 text-primary" />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-sm">
                                                    <p className="text-muted-foreground font-bold  tracking-wider text-[10px]">Author</p>
                                                    <p className="font-black text-foreground text-base">{featuredPost.author?.name || "Admin"}</p>
                                                </div>
                                            </div>

                                            <div className="h-10 w-px bg-border hidden sm:block" />

                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-2 text-sm font-bold bg-secondary/50 dark:bg-secondary/20 px-4 py-2 rounded-xl border border-border">
                                                    <Calendar className="w-4 h-4 text-primary" />
                                                    <span className="text-muted-foreground">{featuredPost.date}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm font-bold bg-secondary/50 dark:bg-secondary/20 px-4 py-2 rounded-xl border border-border">
                                                    <Clock className="w-4 h-4 text-accent" />
                                                    <span className="text-muted-foreground">{featuredPost.readTime}</span>
                                                </div>
                                            </div>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <Link
                                                href={`/blog/${featuredPost.slug || featuredPost._id}`}
                                                className="group/btn inline-flex items-center space-x-3 bg-foreground text-background px-10 py-5 rounded-[1.5rem] font-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-foreground/10 dark:shadow-none"
                                            >
                                                <span>Start Reading</span>
                                                <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-1 transition-transform" />
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
                                                className="p-5 bg-card  hover:bg-secondary text-foreground rounded-[1.5rem] transition-all"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                <Share2 className="w-6 h-6 text-muted-foreground group-hover:text-foreground" />
                                            </motion.button>
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
                                    className="bg-card border border-border rounded-lg overflow-hidden skeleton-block"
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
                                        className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                                    >
                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                                                    {post.category}
                                                </span>
                                                {post.trending && (
                                                    <div className="flex items-center space-x-1 text-orange-500 text-xs font-medium">
                                                        <TrendingUp className="w-3 h-3" />
                                                        <span>Trending</span>
                                                    </div>
                                                )}
                                            </div>

                                            <h3 className="text-xl font-semibold text-foreground mb-3 line-clamp-2">
                                                {post.title}
                                            </h3>

                                            <p className="text-muted-foreground mb-4 line-clamp-3">
                                                {post.excerpt}
                                            </p>

                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {(post.tags || []).slice(0, 3).map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="bg-secondary text-muted-foreground px-2 py-1 rounded text-xs flex items-center space-x-1"
                                                    >
                                                        <Tag className="w-3 h-3" />
                                                        <span>{tag}</span>
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                                                        <User className="w-4 h-4 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-foreground">
                                                            {post.author?.name || "Admin"}
                                                        </p>
                                                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                                            <span>{post.date}</span>
                                                            <span>•</span>
                                                            <span>{post.readTime}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
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
                                                        className="p-2 hover:bg-secondary rounded transition-colors text-muted-foreground hover:text-primary"
                                                        title="Share article"
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        <Share2 className="w-4 h-4" />
                                                    </motion.button>

                                                    <Link
                                                        href={`/blog/${post.slug || post._id}`}
                                                        className="text-primary hover:text-primary/80 font-medium text-sm flex items-center space-x-1"
                                                    >
                                                        <span>Read</span>
                                                        <ArrowRight className="w-4 h-4" />
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
                        className="text-center py-16"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                            No articles found
                        </h3>
                        <p className="text-muted-foreground mb-6">
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
                    className="mt-20 bg-secondary rounded-2xl p-8 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                >
                    <h2 className="text-2xl font-bold text-foreground mb-4">
                        Stay Updated with Learning Insights
                    </h2>
                    <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                        Get the latest articles, learning tips, and educational insights
                        delivered to your inbox weekly.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 px-4 py-3 border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium">
                            Subscribe
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
