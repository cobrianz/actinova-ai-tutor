"use client"

import { motion } from "framer-motion"
import { Sparkles, Target, Users, Heart, Globe, ArrowRight } from "lucide-react"
import Link from "next/link"
import HeroNavbar from "../components/heroNavbar"

export default function AboutPage() {
  const values = [
    {
      icon: Target,
      title: "Excellence",
      description: "We strive for excellence in everything we do, from our AI technology to our user experience.",
    },
    {
      icon: Users,
      title: "Community",
      description: "We believe in the power of community and collaborative learning to achieve greater success.",
    },
    {
      icon: Heart,
      title: "Empathy",
      description: "We understand that every learner is unique and design our platform with empathy and care.",
    },
    {
      icon: Globe,
      title: "Accessibility",
      description:
        "We're committed to making quality education accessible to learners worldwide, regardless of background.",
    },
  ]

  const team = [
    {
      name: "Sarah Johnson",
      role: "CEO & Co-Founder",
      bio: "Former VP of Engineering at Google, passionate about democratizing education through AI.",
      avatar: "/placeholder.svg?height=120&width=120",
    },
    {
      name: "Michael Chen",
      role: "CTO & Co-Founder",
      bio: "AI researcher with 10+ years experience in machine learning and educational technology.",
      avatar: "/placeholder.svg?height=120&width=120",
    },
    {
      name: "Emily Rodriguez",
      role: "Head of Product",
      bio: "Former product lead at Coursera, dedicated to creating intuitive learning experiences.",
      avatar: "/placeholder.svg?height=120&width=120",
    },
    {
      name: "David Kim",
      role: "Head of AI",
      bio: "PhD in Computer Science, specializing in natural language processing and personalized learning.",
      avatar: "/placeholder.svg?height=120&width=120",
    },
  ]

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
        {/* Hero Section */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Our Mission: Democratizing Education Through AI
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
            At Actinova AI Tutor, we believe that everyone deserves access to personalized, high-quality education. Our
            mission is to harness the power of artificial intelligence to create learning experiences that adapt to each
            individual's unique needs, pace, and goals.
          </p>
        </motion.div>

        {/* Story Section */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p>
                  Founded in 2022 by a team of educators, engineers, and AI researchers, Actinova AI Tutor was born from
                  a simple observation: traditional one-size-fits-all education doesn't work for everyone.
                </p>
                <p>
                  We witnessed countless talented individuals struggle with conventional learning methods, not because
                  they lacked ability, but because the teaching approach didn't match their learning style. This
                  inspired us to create a platform that adapts to the learner, not the other way around.
                </p>
                <p>
                  Today, we're proud to serve over 100,000 learners worldwide, helping them achieve their goals through
                  personalized AI-powered education that evolves with their progress.
                </p>
              </div>
            </div>
            <motion.div
              className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-2 gap-6 text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">100K+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active Learners</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">2.5K+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Courses</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">96%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">150+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Countries</div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Values Section */}
        <motion.div className="mb-20" variants={containerVariants} initial="hidden" animate="visible">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Our Values</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">The principles that guide everything we do</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <motion.div key={index} className="text-center" variants={itemVariants} whileHover={{ y: -5 }}>
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{value.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{value.description}</p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Team Section */}
        <motion.div className="mb-20" variants={containerVariants} initial="hidden" animate="visible">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Meet Our Team</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              The passionate individuals behind Actinova AI Tutor
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div key={index} className="text-center" variants={itemVariants} whileHover={{ y: -5 }}>
                <motion.img
                  src={member.avatar || "/placeholder.svg"}
                  alt={member.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{member.name}</h3>
                <p className="text-blue-600 dark:text-blue-400 font-medium mb-3">{member.role}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Mission & Vision Section */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-stretch">
            <motion.div 
              className="p-8 rounded-3xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 backdrop-blur-sm"
              whileHover={{ scale: 1.02 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <Target className="w-8 h-8 text-blue-500" />
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                To empower every individual on the planet with a personalized AI tutor that understands their unique learning style, accelerates their growth, and unlocks their full potential through the power of adaptive technology.
              </p>
            </motion.div>

            <motion.div 
              className="p-8 rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 backdrop-blur-sm"
              whileHover={{ scale: 1.02 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-purple-500" />
                Our Vision
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                A world where high-quality, personalized education is a universal right, not a privilege—where geographical and economic barriers to learning are dismantled by intelligent, accessible, and empathetic AI companions.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold mb-4">Join Our Mission</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Be part of the education revolution. Start your personalized learning journey today and help us democratize
            access to quality education worldwide.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/signup"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all inline-flex items-center space-x-2"
            >
              <Sparkles className="w-5 h-5" />
              <span>Start Learning</span>
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all inline-flex items-center space-x-2"
            >
              <span>Join Our Team</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
