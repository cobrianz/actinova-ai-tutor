"use client"

import { motion } from "framer-motion"
import { Target, Users, Heart, Globe, Brain, Zap, Shield, Rocket } from "lucide-react"
import HeroNavbar from "../components/heroNavbar"
import Footer from "../components/Footer"

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

  return (
    <div className="min-h-screen bg-[#FAFAF7] overflow-x-hidden flex flex-col">
      <HeroNavbar />
      <div className="flex-1">

      {/* Hero Section */}
      <section className="relative pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span
              className="inline-block px-3 py-1 mb-4 text-xs font-medium tracking-wide text-green-700 uppercase bg-green-100 rounded-full"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Transforming Education
            </span>
            <h1
              className="text-3xl md:text-5xl font-bold text-[#0f172a] mb-4 tracking-tight leading-[1.1]"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Democratizing <span className="text-green-500">Education</span> Through AI
            </h1>
            <p
              className="text-sm md:text-base text-[#0f172a]/75 max-w-2xl mx-auto leading-relaxed"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Actirova AI Tutor is building the future of learning. We combine cutting-edge artificial intelligence with proven pedagogical methods to unlock human potential everywhere.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Image Showcase Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -top-4 -left-4 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop"
              alt="Students learning"
              className="rounded-3xl shadow-lg relative z-10 w-full object-cover aspect-[4/3]"
            />
            <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-2xl shadow-lg z-20 border border-white hidden sm:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Zap className="text-green-600 w-5 h-5" />
                </div>
                <div>
                  <div className="text-base font-bold text-[#0f172a]" style={{ fontFamily: "var(--font-fraunces)" }}>96%</div>
                  <div className="text-xs text-[#0f172a]/60" style={{ fontFamily: "var(--font-fraunces)" }}>Success Rate</div>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h2
              className="text-xl md:text-2xl font-bold text-[#0f172a] leading-tight"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Our Story: Born from a Need for <span className="text-green-500">Personalization</span>
            </h2>
            <div className="space-y-3 text-sm text-[#0f172a]/65" style={{ fontFamily: "var(--font-fraunces)" }}>
              <p>
                Founded in 2022 by a team of educators and engineers, Actirova AI Tutor was born from a simple observation: traditional one-size-fits-all education doesn't work for everyone.
              </p>
              <p>
                We witnessed countless talented individuals struggle with conventional learning methods, not because they lacked ability, but because the teaching approach didn't match their learning style.
              </p>
              <p>
                Today, we're proud to serve learners worldwide, helping them achieve their goals through personalized AI-powered education that evolves with their progress.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-16 bg-[#F2F1EC] px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-xl md:text-2xl font-bold text-[#0f172a] mb-3"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Powered by Advanced AI
            </h2>
            <p
              className="text-sm text-[#0f172a]/60 max-w-xl mx-auto"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Our proprietary technology combines large language models with educational psychology.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Adaptive Engine", desc: "Our AI adjusts complexity in real-time based on your responses.", icon: Brain },
              { title: "Instant Feedback", desc: "Get detailed explanations and corrections within seconds.", icon: Zap },
              { title: "Secure Learning", desc: "Your data is protected with enterprise-grade security.", icon: Shield }
            ].map((tech, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="bg-white p-6 rounded-2xl border border-white shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-4">
                  <tech.icon className="w-5 h-5 text-green-600" />
                </div>
                <h3
                  className="text-base font-bold text-[#0f172a] mb-2"
                  style={{ fontFamily: "var(--font-fraunces)" }}
                >
                  {tech.title}
                </h3>
                <p
                  className="text-sm text-[#0f172a]/60"
                  style={{ fontFamily: "var(--font-fraunces)" }}
                >
                  {tech.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Ecosystem Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 space-y-6">
            <h2
              className="text-xl md:text-2xl font-bold text-[#0f172a]"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              A Complete Learning <span className="text-green-500">Ecosystem</span>
            </h2>
            <p
              className="text-sm text-[#0f172a]/60"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              We've built more than just a chatbot. Actirova is a comprehensive environment designed to support every stage of your educational journey.
            </p>
            <div className="space-y-4">
              {[
                { title: "Multi-Format Study Generation", desc: "Create courses, flashcards, quizzes, and reports from a single idea.", icon: Rocket },
                { title: "Library and Progress Tracking", desc: "Save, pin, share, revisit, and measure progress across your learning workspace.", icon: Globe },
                { title: "Career Acceleration Tools", desc: "Use resume building, interview prep, networking AI, and skill-gap analysis in the same platform.", icon: Zap }
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                    <item.icon className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <div>
                    <h4
                      className="text-sm font-bold text-[#0f172a]"
                      style={{ fontFamily: "var(--font-fraunces)" }}
                    >
                      {item.title}
                    </h4>
                    <p
                      className="text-xs text-[#0f172a]/60"
                      style={{ fontFamily: "var(--font-fraunces)" }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="order-1 lg:order-2 grid grid-cols-2 gap-3">
            <div className="space-y-3 pt-8">
              <img
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop"
                alt="Learning 1"
                className="rounded-2xl shadow-sm aspect-[3/4] object-cover"
              />
              <img
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=600&auto=format&fit=crop"
                alt="Learning 2"
                className="rounded-2xl shadow-sm aspect-square object-cover"
              />
            </div>
            <div className="space-y-3">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop"
                alt="Learning 3"
                className="rounded-2xl shadow-sm aspect-square object-cover"
              />
              <img
                src="https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=600&auto=format&fit=crop"
                alt="Learning 4"
                className="rounded-2xl shadow-sm aspect-[3/4] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Global Reach Section */}
      <section className="py-16 bg-[#0f172a] text-white overflow-hidden relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2
            className="text-xl md:text-2xl font-bold mb-10"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Impacting Lives Globally
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Active Learners", value: "840+" },
              { label: "Countries Reached", value: "32" },
              { label: "Courses Created", value: "120+" },
              { label: "Quizzes Taken", value: "4,600+" }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <div
                  className="text-2xl md:text-3xl font-bold mb-1 text-white"
                  style={{ fontFamily: "var(--font-fraunces)" }}
                >
                  {stat.value}
                </div>
                <div
                  className="text-xs text-white/50 uppercase tracking-widest font-medium"
                  style={{ fontFamily: "var(--font-fraunces)" }}
                >
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values with Images */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2
            className="text-xl md:text-2xl font-bold text-[#0f172a] mb-3"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Our Core Values
          </h2>
          <p
            className="text-sm text-[#0f172a]/60"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            The principles that guide our journey
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {values.map((value, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-2xl h-52 shadow-sm"
            >
              <img src={value.image} alt={value.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
              <div className="absolute bottom-0 p-6 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <value.icon className="w-4 h-4 text-green-400" />
                  <h3
                    className="text-lg font-bold"
                    style={{ fontFamily: "var(--font-fraunces)" }}
                  >
                    {value.title}
                  </h3>
                </div>
                <p
                  className="text-gray-200 text-xs line-clamp-2"
                  style={{ fontFamily: "var(--font-fraunces)" }}
                >
                  {value.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2
            className="text-xl md:text-2xl font-bold text-[#0f172a] mb-3"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Meet Our Team
          </h2>
          <p
            className="text-sm text-[#0f172a]/60"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            The passionate experts behind the platform
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="relative mb-4 inline-block">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-sm"
                />
              </div>
              <h3
                className="text-sm font-bold text-[#0f172a] mb-0.5"
                style={{ fontFamily: "var(--font-fraunces)" }}
              >
                {member.name}
              </h3>
              <p
                className="text-green-600 font-medium text-xs mb-2"
                style={{ fontFamily: "var(--font-fraunces)" }}
              >
                {member.role}
              </p>
              <p
                className="text-[#0f172a]/60 text-xs max-w-[220px] mx-auto"
                style={{ fontFamily: "var(--font-fraunces)" }}
              >
                {member.bio}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      </div>
      <Footer />
    </div>
  )
}
