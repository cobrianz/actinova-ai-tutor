"use client"

import { motion } from "framer-motion"
import { Sparkles, Target, Users, Heart, Globe, ArrowRight, Brain, Zap, Shield, Rocket } from "lucide-react"
import Link from "next/link"
import HeroNavbar from "../components/heroNavbar"

export default function AboutPage() {
  const values = [
    {
      icon: Target,
      title: "Excellence",
      description: "We strive for excellence in everything we do, from our AI technology to our user experience.",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop"
    },
    {
      icon: Users,
      title: "Community",
      description: "We believe in the power of community and collaborative learning to achieve greater success.",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop"
    },
    {
      icon: Heart,
      title: "Empathy",
      description: "We understand that every learner is unique and design our platform with empathy and care.",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop"
    },
    {
      icon: Globe,
      title: "Accessibility",
      description: "We're committed to making quality education accessible to learners worldwide.",
      image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=800&auto=format&fit=crop"
    },
  ]

  const team = [
    {
      name: "Sarah Johnson",
      role: "CEO & Co-Founder",
      bio: "Former VP of Engineering at Google, passionate about democratizing education through AI.",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop",
    },
    {
      name: "Michael Chen",
      role: "CTO & Co-Founder",
      bio: "AI researcher with 10+ years experience in machine learning and educational technology.",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop",
    },
    {
      name: "Emily Rodriguez",
      role: "Head of Product",
      bio: "Former product lead at Coursera, dedicated to creating intuitive learning experiences.",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400&auto=format&fit=crop",
    },
    {
      name: "David Kim",
      role: "Head of AI",
      bio: "PhD in Computer Science, specializing in natural language processing and personalized learning.",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400&auto=format&fit=crop",
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
    <div className="min-h-screen bg-white dark:bg-gray-900 overflow-x-hidden">
      <HeroNavbar />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-white dark:from-blue-900/10 dark:to-gray-900 -z-10" />
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wide text-blue-600 uppercase bg-blue-100 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
              Transforming Education
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white mb-8 tracking-tight">
              Democratizing <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Education</span> Through AI
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Actinova AI Tutor is building the future of learning. We combine cutting-edge artificial intelligence with proven pedagogical methods to unlock human potential everywhere.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Image Showcase Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -top-4 -left-4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop" 
              alt="Students learning" 
              className="rounded-3xl shadow-2xl relative z-10 w-full object-cover aspect-[4/3]"
            />
            <div className="absolute -bottom-6 -right-6 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl z-20 border border-gray-100 dark:border-gray-700 hidden sm:block">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <Zap className="text-green-600 w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold dark:text-white">96%</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Success Rate</div>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
              Our Story: Born from a Need for <span className="text-blue-600">Personalization</span>
            </h2>
            <div className="space-y-4 text-lg text-gray-600 dark:text-gray-300">
              <p>
                Founded in 2022 by a team of educators and engineers, Actinova AI Tutor was born from a simple observation: traditional one-size-fits-all education doesn't work for everyone.
              </p>
              <p>
                We witnessed countless talented individuals struggle with conventional learning methods, not because they lacked ability, but because the teaching approach didn't match their learning style.
              </p>
              <p>
                Today, we're proud to serve over 100,000 learners worldwide, helping them achieve their goals through personalized AI-powered education that evolves with their progress.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-800/50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Powered by Advanced AI</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Our proprietary technology combines large language models with educational psychology.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Adaptive Engine", desc: "Our AI adjusts complexity in real-time based on your responses.", icon: Brain, color: "blue" },
              { title: "Instant Feedback", desc: "Get detailed explanations and corrections within seconds.", icon: Zap, color: "purple" },
              { title: "Secure Learning", desc: "Your data is protected with enterprise-grade security.", icon: Shield, color: "green" }
            ].map((tech, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
              >
                <div className={`w-14 h-14 bg-${tech.color}-100 dark:bg-${tech.color}-900/30 rounded-xl flex items-center justify-center mb-6`}>
                  <tech.icon className={`w-8 h-8 text-${tech.color}-600 dark:text-${tech.color}-400`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{tech.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{tech.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values with Images */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Our Core Values</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">The principles that guide our journey</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {values.map((value, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-3xl h-64 shadow-lg"
            >
              <img src={value.image} alt={value.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
              <div className="absolute bottom-0 p-8 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <value.icon className="w-6 h-6 text-blue-400" />
                  <h3 className="text-2xl font-bold">{value.title}</h3>
                </div>
                <p className="text-gray-200 line-clamp-2">{value.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Mission & Vision Section (Refined) */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div 
            className="p-10 rounded-[3rem] bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-2xl relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
          >
            <Target className="w-16 h-16 opacity-20 absolute -top-4 -right-4" />
            <h2 className="text-4xl font-bold mb-8 flex items-center gap-4">
              <Target className="w-10 h-10" />
              Mission
            </h2>
            <p className="text-xl text-blue-50 leading-relaxed">
              To empower every individual with a personalized AI tutor that understands their unique learning style, accelerates growth, and unlocks full potential through adaptive technology.
            </p>
          </motion.div>

          <motion.div 
            className="p-10 rounded-[3rem] bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-2xl relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
          >
            <Sparkles className="w-16 h-16 opacity-20 absolute -top-4 -right-4" />
            <h2 className="text-4xl font-bold mb-8 flex items-center gap-4">
              <Sparkles className="w-10 h-10" />
              Vision
            </h2>
            <p className="text-xl text-purple-50 leading-relaxed">
              A world where high-quality education is a universal right—where barriers to learning are dismantled by intelligent, accessible, and empathetic AI companions.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Meet Our Team</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">The passionate experts behind the platform</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, index) => (
            <motion.div key={index} className="text-center group" variants={itemVariants}>
              <div className="relative mb-6 inline-block">
                <div className="absolute inset-0 bg-blue-600 rounded-full scale-0 group-hover:scale-105 transition-transform duration-300 opacity-20" />
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-48 h-48 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-xl"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{member.name}</h3>
              <p className="text-blue-600 dark:text-blue-400 font-medium mb-3">{member.role}</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm max-w-[250px] mx-auto">{member.bio}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          className="relative rounded-[3rem] overflow-hidden bg-gray-900 py-16 px-8 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2000&auto=format&fit=crop')] opacity-20 bg-cover bg-center" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Start Your Journey?</h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Join 100,000+ learners who are already accelerating their careers and skills with Actinova AI.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                href="/auth/signup"
                className="bg-blue-600 text-white px-10 py-4 rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/25 flex items-center gap-2 group"
              >
                Get Started Free
                <Rocket className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/pricing"
                className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-10 py-4 rounded-full font-bold hover:bg-white/20 transition-all"
              >
                View Plans
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer-like bottom padding */}
      <div className="h-20" />
    </div>
  )
}
