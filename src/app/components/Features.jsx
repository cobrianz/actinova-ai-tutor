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
    <section id="features" className="py-24 bg-white dark:bg-gray-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Professional Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4 mr-2" />
            Why Choose Actinova AI Tutor?
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Revolutionize Your{" "}
            <span className="text-blue-600 dark:text-blue-400">
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
        >
          {features.map((feature, index) => {
            const Icon = iconMap[feature.icon];
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="group bg-gray-50 dark:bg-gray-800 p-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {feature.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Professional Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                10K+
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">
                Active Learners
              </div>
            </div>

            <div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                500+
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">
                AI Courses
              </div>
            </div>

            <div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                98%
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">
                Satisfaction
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
