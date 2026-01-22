import {
  Sparkles,
  BookOpen,
  Users,
  Target,
  Clock,
  Award,
  MessageCircle,
  TrendingUp,
  Search,
  FileText,
  Zap,
  Brain,
  Rocket,
  Star,
  CheckCircle,
  ArrowRight,
  Play,
} from "lucide-react";
import { data } from "../lib/landingData";
import { motion } from "framer-motion";

const iconMap = {
  Sparkles: Sparkles,
  BookOpen: BookOpen,
  Users: Users,
  Target: Target,
  Clock: Clock,
  Award: Award,
  MessageCircle: MessageCircle,
  TrendingUp: TrendingUp,
  Search: Search,
  FileText: FileText,
  Zap: Zap,
  Brain: Brain,
  Rocket: Rocket,
};

export default function Features() {
  const { features } = data;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1, 
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <section id="features" className="py-24 bg-gradient-to-b from-white to-blue-50/20 dark:from-gray-900 dark:to-blue-950/10 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-200/30 to-transparent rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-200/30 to-transparent rounded-full blur-3xl -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Professional Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold mb-8 border border-blue-200/50 dark:border-blue-800/50">
            <Sparkles className="w-4 h-4 mr-2" />
            Why Choose Actinova AI Tutor?
          </div>

          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Revolutionize Your{" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Learning Experience
            </span>
          </h2>

          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Experience the future of education with our AI-powered platform that
            adapts to your needs, tracks your progress, and connects you with a
            global community of learners.
          </p>
        </motion.div>

        {/* Clean Feature Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
        >
          {features.map((feature, index) => {
            const Icon = iconMap[feature.icon];
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="group relative bg-gradient-to-br from-white/80 to-blue-50/40 dark:from-gray-800/60 dark:to-gray-900/40 p-6 rounded-2xl border border-white/50 dark:border-gray-700/50 hover:border-blue-300/60 dark:hover:border-blue-600/60 backdrop-blur-sm shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 h-full flex flex-col"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 rounded-2xl transition-all duration-300 -z-10"></div>

                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all flex-shrink-0">
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex-grow">
                  {feature.title}
                </h3>

                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Enhanced Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-white/80 to-blue-50/60 dark:from-gray-800/60 dark:to-gray-900/40 rounded-3xl p-12 border border-white/50 dark:border-gray-700/50 backdrop-blur-sm shadow-lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="group">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-2 group-hover:from-blue-700 group-hover:to-blue-800 transition-all">
                10K+
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-semibold">
                Active Learners
              </div>
            </div>

            <div className="group border-l border-r border-gray-200 dark:border-gray-700">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-2 group-hover:from-purple-700 group-hover:to-purple-800 transition-all">
                500+
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-semibold">
                AI Courses
              </div>
            </div>

            <div className="group">
              <div className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-pink-700 bg-clip-text text-transparent mb-2 group-hover:from-pink-700 group-hover:to-pink-800 transition-all">
                98%
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-semibold">
                Satisfaction Rate
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
