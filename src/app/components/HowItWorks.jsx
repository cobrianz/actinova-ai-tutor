"use client";

import { motion } from "framer-motion";
import { UserPlus, Compass, BookOpen, GraduationCap, Sparkles, Target, TrendingUp, Award, CheckCircle2, Code, Brain, Zap, Star, Trophy, Calendar, Clock } from "lucide-react";
import { data } from "../lib/landingData";

export default function HowItWorks() {
  const { steps } = data;

  const icons = [UserPlus, Compass, BookOpen, GraduationCap];

  return (
    <section id="how-it-works" className="relative py-32 overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: '3s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600/5 border border-purple-600/10 text-purple-600 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Simple & Powerful</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            How it <span className="text-gradient">Works</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Transform your learning journey in four simple steps. Our AI-powered platform makes mastering any skill effortless.
          </p>
        </motion.div>

        {/* Step 1: Profile Card UI */}
        <StepOne step={steps[0]} icon={icons[0]} />

        {/* Step 2: Course Path Tree */}
        <StepTwo step={steps[1]} icon={icons[1]} />

        {/* Step 3: Interactive Quiz */}
        <StepThree step={steps[2]} icon={icons[2]} />

        {/* Step 4: Achievement Dashboard */}
        <StepFour step={steps[3]} icon={icons[3]} />
      </div>
    </section>
  );
}

// Step 1: Profile Creation - Card-based UI
function StepOne({ step, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className="grid md:grid-cols-2 gap-12 items-center mb-32"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600/10 to-blue-600/10 flex items-center justify-center">
            <Icon className="w-8 h-8 text-purple-600" />
          </div>
          <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-bold">
            Step 1
          </div>
        </div>
        <h3 className="text-3xl md:text-4xl font-bold tracking-tight">{step.title}</h3>
        <p className="text-lg text-muted-foreground leading-relaxed">{step.description}</p>
        <div className="space-y-3 pt-2">
          {["Set learning goals", "Choose skill level", "Personalize experience"].map((text, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-purple-600" />
              <span className="font-medium">{text}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Profile Card Mockup */}
      <div className="relative">
        <div className="relative rounded-2xl overflow-hidden border border-purple-600/20 bg-gradient-to-br from-background to-purple-600/5">
          <div className="p-8 space-y-6">
            {/* Avatar & Name */}
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, type: "spring" }}
              className="flex items-center gap-4"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                JD
              </div>
              <div>
                <div className="h-4 w-32 bg-foreground/80 rounded-lg mb-2" />
                <div className="h-3 w-24 bg-muted rounded-lg" />
              </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Goals", value: "5", delay: 0.3 },
                { label: "Level", value: "Pro", delay: 0.4 },
                { label: "Hours", value: "42", delay: 0.5 }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: stat.delay }}
                  className="p-3 rounded-xl bg-gradient-to-br from-purple-600/10 to-blue-600/10 border border-purple-600/20"
                >
                  <div className="text-2xl font-bold text-purple-600">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Interests Tags */}
            <div className="flex flex-wrap gap-2">
              {["JavaScript", "Design", "AI"].map((tag, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 + i * 0.1, type: "spring" }}
                  className="px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-600 text-sm font-medium"
                >
                  {tag}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-3xl blur-2xl -z-10" />
      </div>
    </motion.div>
  );
}

// Step 2: Path Generation - Tree/Roadmap UI
function StepTwo({ step, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className="grid md:grid-cols-2 gap-12 items-center mb-32"
    >
      {/* Mockup First (Left) */}
      <div className="relative md:order-1">
        <div className="relative rounded-2xl overflow-hidden border border-blue-600/20 bg-gradient-to-br from-background to-blue-600/5 p-8">
          {/* Path Tree */}
          <div className="space-y-4">
            {[
              { title: "Foundations", progress: 100, modules: 8, color: "from-green-600 to-emerald-600" },
              { title: "Core Concepts", progress: 65, modules: 12, color: "from-blue-600 to-cyan-600" },
              { title: "Advanced Topics", progress: 30, modules: 10, color: "from-purple-600 to-pink-600" },
              { title: "Real Projects", progress: 0, modules: 6, color: "from-orange-600 to-red-600" }
            ].map((module, i) => (
              <motion.div
                key={i}
                initial={{ x: -30, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="relative"
              >
                <div className="flex items-start gap-3">
                  {/* Connection Line */}
                  {i > 0 && (
                    <div className="absolute left-3 -top-4 w-0.5 h-4 bg-gradient-to-b from-blue-600/50 to-transparent" />
                  )}

                  {/* Node */}
                  <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${module.color} flex items-center justify-center flex-shrink-0 relative z-10`}>
                    {module.progress === 100 && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-foreground">{module.title}</span>
                      <span className="text-sm text-muted-foreground">{module.modules} modules</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${module.progress}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 + i * 0.1, duration: 1 }}
                        className={`h-full bg-gradient-to-r ${module.color} rounded-full`}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-2xl -z-10" />
      </div>

      {/* Text Content (Right) */}
      <div className="space-y-6 md:order-2">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/10 to-purple-600/10 flex items-center justify-center">
            <Icon className="w-8 h-8 text-blue-600" />
          </div>
          <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold">
            Step 2
          </div>
        </div>
        <h3 className="text-3xl md:text-4xl font-bold tracking-tight">{step.title}</h3>
        <p className="text-lg text-muted-foreground leading-relaxed">{step.description}</p>
        <div className="space-y-3 pt-2">
          {["Custom curriculum", "Adaptive difficulty", "Structured roadmap"].map((text, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <span className="font-medium">{text}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Step 3: Learning - Quiz/Interactive UI
function StepThree({ step, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className="grid md:grid-cols-2 gap-12 items-center mb-32"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600/10 to-blue-600/10 flex items-center justify-center">
            <Icon className="w-8 h-8 text-purple-600" />
          </div>
          <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-bold">
            Step 3
          </div>
        </div>
        <h3 className="text-3xl md:text-4xl font-bold tracking-tight">{step.title}</h3>
        <p className="text-lg text-muted-foreground leading-relaxed">{step.description}</p>
        <div className="space-y-3 pt-2">
          {["Interactive lessons", "Instant feedback", "AI-powered hints"].map((text, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-medium">{text}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quiz Interface Mockup */}
      <div className="relative">
        <div className="relative rounded-2xl overflow-hidden border border-purple-600/20 bg-gradient-to-br from-background to-purple-600/5 p-6">
          {/* Question */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mb-6 p-4 rounded-xl bg-gradient-to-br from-purple-600/10 to-blue-600/10 border border-purple-600/20"
          >
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-bold text-purple-600">Question 3/10</span>
            </div>
            <div className="h-3 w-full bg-foreground/70 rounded mb-2" />
            <div className="h-3 w-3/4 bg-foreground/70 rounded" />
          </motion.div>

          {/* Answer Options */}
          <div className="space-y-3">
            {[
              { correct: false, delay: 0.3 },
              { correct: true, delay: 0.4 },
              { correct: false, delay: 0.5 },
              { correct: false, delay: 0.6 }
            ].map((option, i) => (
              <motion.div
                key={i}
                initial={{ x: -20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: option.delay }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${option.correct
                  ? "border-green-600 bg-green-600/10"
                  : "border-border hover:border-purple-600/30"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="h-2.5 w-2/3 bg-muted rounded" />
                  {option.correct && (
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: option.delay + 0.5, type: "spring" }}
                    >
                      <CheckCircle2 className="w-5 h-5 text-purple-600" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* AI Hint Badge */}
          <motion.div
            initial={{ scale: 0, y: 20 }}
            whileInView={{ scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8, type: "spring" }}
            className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-600/30"
          >
            <Zap className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-600">AI Hint Available</span>
          </motion.div>
        </div>
        <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-3xl blur-2xl -z-10" />
      </div>
    </motion.div>
  );
}

// Step 4: Achievement - Certificate/Stats Dashboard
function StepFour({ step, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className="grid md:grid-cols-2 gap-12 items-center"
    >
      {/* Mockup First (Left) */}
      <div className="relative md:order-1">
        <div className="relative rounded-2xl overflow-hidden border border-blue-600/20 bg-gradient-to-br from-background to-blue-600/5 p-6">
          {/* Certificate Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-center mb-6 p-6 rounded-xl bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-600/20"
          >
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              <Trophy className="w-16 h-16 text-blue-600 mx-auto mb-3" />
            </motion.div>
            <div className="h-4 w-48 bg-foreground/80 rounded mx-auto mb-2" />
            <div className="h-3 w-32 bg-muted rounded mx-auto" />
          </motion.div>

          {/* Achievement Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Star, value: "98%", label: "Score", delay: 0.4 },
              { icon: Award, value: "Gold", label: "Rank", delay: 0.5 },
              { icon: Calendar, value: "4 wks", label: "Duration", delay: 0.6 },
              { icon: Clock, value: "42h", label: "Time", delay: 0.7 }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, rotate: -5 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ delay: stat.delay, type: "spring" }}
                className="p-4 rounded-xl bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-600/20 text-center"
              >
                <stat.icon className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-xl font-bold text-blue-600">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Skills Mastered */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
            className="mt-4 p-4 rounded-xl bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-600/20"
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-bold text-purple-600">Skills Mastered</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Advanced", "Expert", "Certified"].map((badge, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.9 + i * 0.1, type: "spring" }}
                  className="px-3 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold"
                >
                  {badge}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-2xl -z-10" />
      </div>

      {/* Text Content (Right) */}
      <div className="space-y-6 md:order-2">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/10 to-purple-600/10 flex items-center justify-center">
            <Icon className="w-8 h-8 text-blue-600" />
          </div>
          <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold">
            Step 4
          </div>
        </div>
        <h3 className="text-3xl md:text-4xl font-bold tracking-tight">{step.title}</h3>
        <p className="text-lg text-muted-foreground leading-relaxed">{step.description}</p>
        <div className="space-y-3 pt-2">
          {["Earn certificates", "Track progress", "Showcase skills"].map((text, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <span className="font-medium">{text}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
