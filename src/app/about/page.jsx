"use client"

import { motion } from "framer-motion"
import { Sparkles, Target, Users, Heart, Globe, ArrowRight, Award, Zap, Shield, Rocket } from "lucide-react"
import Link from "next/link"
import HeroNavbar from "../components/heroNavbar"

export default function AboutPage() {
  const values = [
    {
      icon: Target,
      title: "Excellence",
      description: "We strive for excellence in everything we do, from our AI technology to our user experience.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Users,
      title: "Community",
      description: "We believe in the power of community and collaborative learning to achieve greater success.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Heart,
      title: "Empathy",
      description: "We understand that every learner is unique and design our platform with empathy and care.",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: Globe,
      title: "Accessibility",
      description: "We're committed to making quality education accessible to learners worldwide, regardless of background.",
      color: "from-green-500 to-emerald-500",
    },
  ]

  const team = [
    {
      name: "Sarah Johnson",
      role: "CEO & Co-Founder",
      bio: "Former VP of Engineering at Google, passionate about democratizing education through AI.",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&h=256&auto=format&fit=crop",
    },
    {
      name: "Michael Chen",
      role: "CTO & Co-Founder",
      bio: "AI researcher with 10+ years experience in machine learning and educational technology.",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256&h=256&auto=format&fit=crop",
    },
    {
      name: "Emily Rodriguez",
      role: "Head of Product",
      bio: "Former product lead at Coursera, dedicated to creating intuitive learning experiences.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=256&h=256&auto=format&fit=crop",
    },
    {
      name: "David Kim",
      role: "Head of AI",
      bio: "PhD in Computer Science, specializing in natural language processing and personalized learning.",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&h=256&auto=format&fit=crop",
    },
  ]

  const milestones = [
    { year: "2022", event: "Company founded with a vision to revolutionize online learning", icon: Rocket },
    { year: "2023", event: "Launched beta version with 1,000 early adopters", icon: Zap },
    { year: "2023", event: "Raised $5M Series A funding", icon: Award },
    { year: "2024", event: "Reached 100,000+ active learners worldwide", icon: Users },
    { year: "2024", event: "Launched AI-powered personalized learning paths", icon: Sparkles },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#030712] text-gray-900 dark:text-gray-100 selection:bg-blue-500/30">
      <HeroNavbar />
      
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[120px] animate-blob [animation-delay:2s]" />
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-20 pb-32 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full text-blue-600 dark:text-blue-400 text-sm font-medium mb-8 border border-blue-100 dark:border-blue-800"
            >
              <Sparkles className="w-4 h-4" />
              <span>Redefining the future of learning</span>
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-7xl font-bold mb-8 tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Our Mission: <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Democratizing Education</span> Through AI
            </motion.h1>
            
            <motion.p 
              className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              At Actinova AI Tutor, we believe that everyone deserves access to personalized, high-quality education. 
              We're building the infrastructure for the next generation of learners.
            </motion.p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-gray-50/50 dark:bg-gray-900/50 border-y border-gray-100 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: "Active Learners", value: "100K+", color: "text-blue-600" },
                { label: "AI Courses", value: "2.5K+", color: "text-purple-600" },
                { label: "Success Rate", value: "96%", color: "text-emerald-600" },
                { label: "Countries", value: "150+", color: "text-orange-600" },
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className={`text-4xl md:text-5xl font-bold mb-2 ${stat.color}`}>{stat.value}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-32 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-8">The Actinova Story</h2>
                <div className="space-y-6 text-lg text-gray-600 dark:text-gray-400">
                  <p>
                    Founded in 2022 by a team of educators and AI researchers, Actinova AI Tutor was born from
                    a simple observation: traditional one-size-fits-all education is fundamentally broken.
                  </p>
                  <p>
                    We witnessed talented individuals struggle with conventional learning methods match their learning style. 
                    This inspired us to create a platform that adapts to the learner, not the other way around.
                  </p>
                  <p>
                    Today, we're proud to serve a global community, helping them achieve their goals through
                    personalized AI-powered education that evolves with their progress.
                  </p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-3xl blur-2xl opacity-20 animate-pulse-slow" />
                <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                  <img 
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop" 
                    alt="Our team working" 
                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                    <p className="text-white font-medium italic">"Building the tools we wished we had as students."</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-32 px-4 bg-gray-50 dark:bg-gray-900/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Core Values</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                These principles guide every decision we make and every line of code we write.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => {
                const Icon = value.icon
                return (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -10 }}
                    className="p-8 bg-white dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all group"
                  >
                    <div className={`w-14 h-14 bg-gradient-to-r ${value.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{value.description}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-32 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet Our Leaders</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                A diverse team of experts dedicated to building the future of education.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {team.map((member, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group text-center"
                >
                  <div className="relative w-48 h-48 mx-auto mb-6">
                    <div className="absolute inset-0 bg-blue-600 rounded-full scale-0 group-hover:scale-105 transition-transform duration-500 opacity-20" />
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-full h-full rounded-full object-cover shadow-lg border-4 border-white dark:border-gray-800 relative z-10"
                    />
                  </div>
                  <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                  <p className="text-blue-600 dark:text-blue-400 font-semibold text-sm uppercase tracking-widest mb-4">{member.role}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">{member.bio}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="py-32 px-4 bg-gray-50 dark:bg-gray-900/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Journey So Far</h2>
              <p className="text-gray-500 dark:text-gray-400">Tracing our path from a small idea to a global platform.</p>
            </div>

            <div className="relative space-y-12 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 dark:before:via-gray-700 before:to-transparent">
              {milestones.map((milestone, index) => {
                const Icon = milestone.icon
                return (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white dark:border-gray-800 bg-blue-600 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-transform duration-300 group-hover:scale-125 z-10">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-1">
                        <time className="font-bold text-blue-600">{milestone.year}</time>
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">{milestone.event}</div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 rounded-[3rem] p-12 md:p-20 text-white text-center relative overflow-hidden shadow-2xl"
            >
              {/* Background Glow */}
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
              
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to shape the future?</h2>
                <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
                  Join 100,000+ learners and start your personalized AI journey today. 
                  Experience education that actually understands you.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <Link
                    href="/auth/signup"
                    className="w-full sm:w-auto bg-white text-blue-600 px-10 py-4 rounded-2xl font-bold hover:shadow-xl hover:-translate-y-1 transition-all inline-flex items-center justify-center space-x-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>Get Started Free</span>
                  </Link>
                  <Link
                    href="/contact"
                    className="w-full sm:w-auto border-2 border-white/30 backdrop-blur-sm text-white px-10 py-4 rounded-2xl font-bold hover:bg-white/10 transition-all inline-flex items-center justify-center space-x-2"
                  >
                    <span>Talk to Us</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer info removed as it's likely in a layout or separate component */}
      </div>
    </div>
  )
}
