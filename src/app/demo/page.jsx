"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  BookOpen,
  Users,
  Award,
  TrendingUp,
  Brain,
  Target,
  Clock,
  ArrowRight,
  Monitor,
  Smartphone,
  Tablet,
  Volume2,
  VolumeX,
  Maximize,
  Share2,
} from "lucide-react"
import Link from "next/link"
import HeroNavbar from "../components/heroNavbar"

export default function DemoPage() {
  const [currentDemo, setCurrentDemo] = useState("overview")
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false)

  const demoSections = [
    {
      id: "overview",
      title: "Platform Overview",
      description: "Get a complete tour of the Actinova AI Tutor platform",
      duration: "3:45",
      thumbnail: "/placeholder.svg?height=300&width=500",
      steps: [
        "Welcome to Actinova AI Tutor",
        "Dashboard and navigation overview",
        "AI-powered learning paths",
        "Progress tracking features",
        "Community and collaboration tools",
      ],
    },
    {
      id: "ai-tutor",
      title: "AI Tutor in Action",
      description: "See how our AI creates personalized learning experiences",
      duration: "4:20",
      thumbnail: "/placeholder.svg?height=300&width=500",
      steps: [
        "Input your learning goals",
        "AI analyzes your preferences",
        "Custom roadmap generation",
        "Adaptive content delivery",
        "Real-time progress adjustments",
      ],
    },
    {
      id: "learning-path",
      title: "Learning Path Creation",
      description: "Watch as AI builds a custom curriculum just for you",
      duration: "2:30",
      thumbnail: "/placeholder.svg?height=300&width=500",
      steps: [
        "Select your topic of interest",
        "Choose difficulty level",
        "AI generates structured path",
        "Interactive lesson preview",
        "Start learning immediately",
      ],
    },
    {
      id: "progress-tracking",
      title: "Progress Analytics",
      description: "Advanced analytics to track your learning journey",
      duration: "3:15",
      thumbnail: "/placeholder.svg?height=300&width=500",
      steps: [
        "Real-time progress dashboard",
        "Skill development tracking",
        "Achievement milestones",
        "Performance insights",
        "Goal completion metrics",
      ],
    },
    {
      id: "community",
      title: "Community Features",
      description: "Connect and learn with fellow students worldwide",
      duration: "2:45",
      thumbnail: "/placeholder.svg?height=300&width=500",
      steps: [
        "Join study groups",
        "Participate in discussions",
        "Share achievements",
        "Get peer support",
        "Collaborate on projects",
      ],
    },
    {
      id: "certificates",
      title: "Certificates & Achievements",
      description: "Earn industry-recognized certificates",
      duration: "1:50",
      thumbnail: "/placeholder.svg?height=300&width=500",
      steps: [
        "Complete course requirements",
        "Automatic certificate generation",
        "Download PDF certificates",
        "Share on social media",
        "Add to professional profile",
      ],
    },
  ]

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Learning",
      description: "Personalized curriculum that adapts to your learning style and pace",
      demo: "ai-tutor",
    },
    {
      icon: Target,
      title: "Goal-Oriented Progress",
      description: "Set clear objectives and track your progress with detailed analytics",
      demo: "progress-tracking",
    },
    {
      icon: Users,
      title: "Community Learning",
      description: "Connect with fellow learners and get support from our community",
      demo: "community",
    },
    {
      icon: Award,
      title: "Industry Certificates",
      description: "Earn recognized certificates to boost your professional profile",
      demo: "certificates",
    },
  ]

  const stats = [
    { label: "Active Learners", value: "100K+", icon: Users },
    { label: "Courses Available", value: "2,500+", icon: BookOpen },
    { label: "Success Rate", value: "96%", icon: TrendingUp },
    { label: "Certificates Issued", value: "50K+", icon: Award },
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Developer",
      company: "Google",
      content: "The AI tutor understood exactly what I needed to learn. Got my dream job in 6 months!",
      avatar: "/placeholder.svg?height=60&width=60",
    },
    {
      name: "Marcus Rodriguez",
      role: "Data Scientist",
      company: "Microsoft",
      content: "The personalized learning paths are incredible. I've never been more engaged with online learning.",
      avatar: "/placeholder.svg?height=60&width=60",
    },
    {
      name: "Elena Kim",
      role: "UX Designer",
      company: "Airbnb",
      content: "The community aspect is amazing. I made connections that helped me land my current role.",
      avatar: "/placeholder.svg?height=60&width=60",
    },
  ]

  useEffect(() => {
    let interval
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          const maxSteps = demoSections.find((demo) => demo.id === currentDemo)?.steps.length || 0
          return prev >= maxSteps - 1 ? 0 : prev + 1
        })
      }, 3000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, currentDemo])

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleRestart = () => {
    setCurrentStep(0)
    setIsPlaying(true)
  }

  const currentDemoData = demoSections.find((demo) => demo.id === currentDemo)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <HeroNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Play className="w-4 h-4" />
            <span>Interactive Demo</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            See Actinova AI Tutor
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}
              in Action
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Experience the future of personalized learning with our interactive demo. See how AI creates custom learning
            paths, tracks your progress, and connects you with a global community.
          </p>
        </motion.div>

        {/* Demo Player */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden mb-16"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Demo Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-wrap gap-2">
              {demoSections.map((demo) => (
                <motion.button
                  key={demo.id}
                  onClick={() => {
                    setCurrentDemo(demo.id)
                    setCurrentStep(0)
                    setIsPlaying(false)
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentDemo === demo.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {demo.title}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Video Player Area */}
          <div className="relative bg-gray-900 aspect-video">
            <img
              src={currentDemoData?.thumbnail || "/placeholder.svg"}
              alt={currentDemoData?.title}
              className="w-full h-full object-cover"
            />

            {/* Play Overlay */}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <motion.div
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.button
                  onClick={handlePlayPause}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors mb-4"
                >
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </motion.button>
                <h3 className="text-xl font-semibold text-white mb-2">{currentDemoData?.title}</h3>
                <p className="text-gray-300">{currentDemoData?.description}</p>
              </motion.div>
            </div>

            {/* Progress Steps Overlay */}
            <AnimatePresence>
              {isPlaying && (
                <motion.div
                  className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm font-medium">
                      Step {currentStep + 1} of {currentDemoData?.steps.length}
                    </span>
                    <span className="text-gray-300 text-sm">{currentDemoData?.duration}</span>
                  </div>
                  <p className="text-white mb-3">{currentDemoData?.steps[currentStep]}</p>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <motion.div
                      className="bg-blue-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${((currentStep + 1) / (currentDemoData?.steps.length || 1)) * 100}%`,
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controls */}
            <div className="absolute top-4 right-4 flex items-center space-x-2">
              <motion.button
                onClick={() => setIsMuted(!isMuted)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </motion.button>
              <motion.button
                onClick={() => setShowFullscreen(!showFullscreen)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <Maximize className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Player Controls */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <motion.button
                  onClick={handlePlayPause}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlaying ? "Pause" : "Play"} Demo</span>
                </motion.button>
                <motion.button
                  onClick={handleRestart}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restart</span>
                </motion.button>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{currentDemoData?.duration}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div className="mb-16" variants={containerVariants} initial="hidden" animate="visible">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Key Features Demonstrated</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Click on any feature to see it in action in our demo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  onClick={() => {
                    setCurrentDemo(feature.demo)
                    setCurrentStep(0)
                    setIsPlaying(false)
                  }}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.description}</p>
                  <div className="flex items-center space-x-1 mt-4 text-blue-600 dark:text-blue-400 text-sm font-medium">
                    <span>Watch Demo</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div key={index} variants={itemVariants} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Device Compatibility */}
        <motion.div
          className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Learn Anywhere, Anytime</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Access your personalized learning experience across all your devices
            </p>
          </div>

          <div className="flex justify-center items-center space-x-8">
            <motion.div className="text-center" whileHover={{ scale: 1.05 }}>
              <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-center mb-3">
                <Monitor className="w-8 h-8 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Desktop</span>
            </motion.div>

            <motion.div className="text-center" whileHover={{ scale: 1.05 }}>
              <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-center mb-3">
                <Tablet className="w-8 h-8 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tablet</span>
            </motion.div>

            <motion.div className="text-center" whileHover={{ scale: 1.05 }}>
              <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-center mb-3">
                <Smartphone className="w-8 h-8 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mobile</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">What Our Users Say</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Real feedback from learners who transformed their careers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-shadow"
                whileHover={{ y: -5 }}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <img
                    src={testimonial.avatar || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.role} at {testimonial.company}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 italic">"{testimonial.content}"</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Learning Journey?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of learners who are already transforming their careers with AI-powered education.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/signup"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all inline-flex items-center space-x-2 shadow-lg"
            >
              <Sparkles className="w-5 h-5" />
              <span>Start Free Trial</span>
            </Link>
            <Link
              href="/pricing"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all"
            >
              View Pricing
            </Link>
          </div>
          <p className="text-blue-200 text-sm mt-4">No credit card required • 14-day free trial</p>
        </motion.div>
      </div>
    </div>
  )
}
