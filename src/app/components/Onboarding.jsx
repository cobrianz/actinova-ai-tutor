"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Code,
  Palette,
  Briefcase,
  TrendingUp,
  Brain,
  Music,
  Camera,
  Gamepad2,
  Heart,
  X,
  ChevronRight,
  Check,
  Clock,
  User,
  GraduationCap,
  Lightbulb,
  MessageSquare,
  FlaskRound,
  Calculator,
  DollarSign,
  ChefHat,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "./AuthProvider";
import { apiClient } from "@/lib/csrfClient";

const studentSteps = [
  {
    id: "interests",
    title: "What are you interested in learning?",
    description: "Select all topics that interest you. We'll personalize your experience.",
    icon: Heart,
    fields: [
      { id: "programming", label: "Programming & Development", icon: Code, category: "Technology" },
      { id: "design", label: "Design & Creative Arts", icon: Palette, category: "Design" },
      { id: "business", label: "Business & Entrepreneurship", icon: Briefcase, category: "Business" },
      { id: "data-science", label: "Data Science & Analytics", icon: TrendingUp, category: "Data Science" },
      { id: "ai-ml", label: "AI & Machine Learning", icon: Brain, category: "AI & ML" },
      { id: "writing", label: "Writing & Literature", icon: BookOpen, category: "Humanities" },
      { id: "languages", label: "Foreign Languages", icon: MessageSquare, category: "Languages" },
      { id: "science", label: "Natural Sciences", icon: FlaskRound, category: "Science" },
      { id: "math", label: "Mathematics", icon: Calculator, category: "Mathematics" },
      { id: "finance", label: "Finance & Investing", icon: DollarSign, category: "Business" },
      { id: "health", label: "Health & Wellness", icon: Heart, category: "Health" },
      { id: "engineering", label: "Engineering", icon: FlaskRound, category: "Science" },
    ],
  },
  {
    id: "age-group",
    title: "What's your age group?",
    description: "This helps us tailor content appropriate for you.",
    icon: User,
    fields: [
      { id: "under-18", label: "Under 18", description: "Student or young learner" },
      { id: "18-24", label: "18-24", description: "Young adult, college student" },
      { id: "25-34", label: "25-34", description: "Early career professional" },
      { id: "35-44", label: "35-44", description: "Mid-career professional" },
      { id: "45-54", label: "45-54", description: "Experienced professional" },
      { id: "55+", label: "55+", description: "Senior learner" },
    ],
  },
  {
    id: "skill-level",
    title: "What's your current skill level?",
    description: "Help us recommend courses at the right difficulty.",
    icon: TrendingUp,
    fields: [
      { id: "beginner", label: "Beginner", description: "Just starting out" },
      { id: "intermediate", label: "Intermediate", description: "Some experience" },
      { id: "advanced", label: "Advanced", description: "Looking to master" },
    ],
  },
  {
    id: "goals",
    title: "What are your learning goals?",
    description: "Select what you want to achieve.",
    icon: BookOpen,
    fields: [
      { id: "career-change", label: "Career Change", description: "Switch to a new field" },
      { id: "skill-upgrade", label: "Skill Upgrade", description: "Advance in current role" },
      { id: "certification", label: "Get Certified", description: "Earn credentials" },
      { id: "hobby", label: "Hobby & Fun", description: "Learn for enjoyment" },
      { id: "research", label: "Academic Research", description: "Conduct research" },
      { id: "teaching", label: "Teach Others", description: "Share knowledge" },
    ],
  },
  {
    id: "time-commitment",
    title: "How much time can you commit?",
    description: "This helps us suggest courses that fit your schedule.",
    icon: Clock,
    fields: [
      { id: "1-3", label: "1-3 hrs/week", description: "Light learning" },
      { id: "4-7", label: "4-7 hrs/week", description: "Moderate pace" },
      { id: "8-15", label: "8-15 hrs/week", description: "Intensive" },
      { id: "15+", label: "15+ hrs/week", description: "Full-time" },
    ],
  },
];

const instructorSteps = [
  {
    id: "teaching-subject",
    title: "What subject do you teach?",
    description: "Tell us what you'll be teaching so we can tailor your instructor tools.",
    icon: BookOpen,
    fields: [
      { id: "programming", label: "Programming & CS", icon: Code, category: "Technology" },
      { id: "design", label: "Design & Arts", icon: Palette, category: "Design" },
      { id: "business", label: "Business & Management", icon: Briefcase, category: "Business" },
      { id: "data-science", label: "Data Science", icon: TrendingUp, category: "Data Science" },
      { id: "ai-ml", label: "AI & Machine Learning", icon: Brain, category: "AI & ML" },
      { id: "science", label: "Science & Research", icon: FlaskRound, category: "Science" },
      { id: "math", label: "Mathematics", icon: Calculator, category: "Mathematics" },
      { id: "languages", label: "Languages", icon: MessageSquare, category: "Languages" },
      { id: "health", label: "Health & Medicine", icon: Heart, category: "Health" },
      { id: "other", label: "Other", icon: BookOpen, category: "Other" },
    ],
  },
  {
    id: "teaching-level",
    title: "What level do you teach?",
    description: "This helps us customize your classroom tools.",
    icon: GraduationCap,
    fields: [
      { id: "high-school", label: "High School" },
      { id: "college", label: "College / University" },
      { id: "bootcamp", label: "Bootcamp / Workshop" },
      { id: "corporate", label: "Corporate Training" },
      { id: "online", label: "Online Courses" },
      { id: "tutoring", label: "Private Tutoring" },
    ],
  },
  {
    id: "class-size",
    title: "How many students do you typically teach?",
    description: "This helps us plan your classroom capacity.",
    icon: Users,
    fields: [
      { id: "1-10", label: "1-10", description: "Small group" },
      { id: "11-30", label: "11-30", description: "Medium class" },
      { id: "31-100", label: "31-100", description: "Large class" },
      { id: "100+", label: "100+", description: "Lecture hall" },
    ],
  },
  {
    id: "goals",
    title: "What are your teaching goals?",
    description: "Select what you want to achieve with Actirova.",
    icon: Lightbulb,
    fields: [
      { id: "create-courses", label: "Create Courses", description: "Generate AI courses for students" },
      { id: "manage-classrooms", label: "Manage Classrooms", description: "Track student progress" },
      { id: "assessments", label: "Build Assessments", description: "Quizzes and assignments" },
      { id: "content", label: "Generate Content", description: "Flashcards, notes, reports" },
      { id: "collaborate", label: "Collaborate", description: "Work with other instructors" },
    ],
  },
];

export default function Onboarding({ onComplete }) {
  const router = useRouter();
  const { user, setUserData } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState("");
  const [selectedSkillLevel, setSelectedSkillLevel] = useState("");
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [selectedTimeCommitment, setSelectedTimeCommitment] = useState("");
  const [selectedTeachingSubject, setSelectedTeachingSubject] = useState("");
  const [selectedTeachingLevel, setSelectedTeachingLevel] = useState("");
  const [selectedClassSize, setSelectedClassSize] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const role = user?.role || "student";
  const onboardingSteps = role === "instructor" ? instructorSteps : studentSteps;

  const currentStepData = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;
  const canProceed = () => {
    switch (currentStepData.id) {
      case "interests": return selectedInterests.length > 0;
      case "age-group": return selectedAgeGroup !== "";
      case "skill-level": return selectedSkillLevel !== "";
      case "goals": return selectedGoals.length > 0;
      case "time-commitment": return selectedTimeCommitment !== "";
      case "teaching-subject": return selectedTeachingSubject === "other" ? customSubject.trim().length > 0 : selectedTeachingSubject !== "";
      case "teaching-level": return selectedTeachingLevel !== "";
      case "class-size": return selectedClassSize !== "";
      default: return false;
    }
  };

  const handleFieldToggle = (fieldId) => {
    switch (currentStepData.id) {
      case "interests":
        setSelectedInterests((prev) => prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId]);
        break;
      case "goals":
        setSelectedGoals((prev) => prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId]);
        break;
    }
  };

  const handleFieldSelect = (fieldId) => {
    switch (currentStepData.id) {
      case "age-group": setSelectedAgeGroup(fieldId); break;
      case "skill-level": setSelectedSkillLevel(fieldId); break;
      case "time-commitment": setSelectedTimeCommitment(fieldId); break;
      case "teaching-subject": setSelectedTeachingSubject(fieldId); break;
      case "teaching-level": setSelectedTeachingLevel(fieldId); break;
      case "class-size": setSelectedClassSize(fieldId); break;
    }
  };

  const handleNext = () => {
    if (!canProceed()) { toast.error("Please make a selection"); return; }
    if (isLastStep) { handleComplete(); } else { setCurrentStep((prev) => prev + 1); }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      const interestsStep = onboardingSteps.find((s) => s.id === "interests");
      const interestCategories = selectedInterests.map((id) => interestsStep?.fields.find((f) => f.id === id)?.category).filter(Boolean);

      const profileData = {
        role,
        interests: selectedInterests,
        interestCategories: [...new Set(interestCategories)],
        ageGroup: selectedAgeGroup,
        skillLevel: selectedSkillLevel,
        goals: selectedGoals,
        timeCommitment: selectedTimeCommitment,
        teachingSubject: selectedTeachingSubject === "other" ? customSubject.trim() : selectedTeachingSubject,
        onboardingCompleted: true,
      };

      const response = await apiClient.post("/api/profile/update", profileData);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save profile");
      }
      const data = await response.json();
      setUserData(data.user);
      toast.success(role === "instructor" ? "Instructor profile saved!" : "Profile saved! Let's start learning!");
      onComplete ? onComplete() : router.push("/dashboard");
    } catch (error) {
      toast.error(error.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const IconComponent = currentStepData.icon;

  return (
    <div className="relative flex flex-col min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute top-10 left-10 w-16 h-16 bg-green-500/5 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-16 w-20 h-20 bg-green-500/5 rounded-full blur-xl"></div>

      <motion.div
        className="relative z-10 flex flex-col items-center justify-center w-full max-w-2xl mx-auto px-4 min-h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Header */}
        <div className="pb-3 text-center w-full">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-10 bg-green-500/10 text-green-600 rounded-xl flex items-center justify-center">
              <IconComponent className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h2 className="text-xl font-bold text-foreground">{currentStepData.title}</h2>
              <p className="text-xs text-muted-foreground">Step {currentStep + 1} of {onboardingSteps.length}</p>
          </div>
          {currentStepData.id === "teaching-subject" && selectedTeachingSubject === "other" && (
            <div className="mt-3 max-w-xs mx-auto">
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="e.g. Music Theory, Culinary Arts..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-green-500 bg-card text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-green-500/20"
              />
            </div>
          )}
        </div>
          <div className="w-full bg-secondary rounded-full h-1 max-w-xs mx-auto overflow-hidden">
            <motion.div
              className="bg-green-500 h-full rounded-full"
              animate={{ width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="py-4">
          <p className="text-sm text-muted-foreground text-center mb-4">{currentStepData.description}</p>
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {currentStepData.fields.map((field) => {
              const isSelected = currentStepData.id === "interests" || currentStepData.id === "goals"
                  ? (currentStepData.id === "interests" ? selectedInterests : selectedGoals).includes(field.id)
                  : currentStepData.id === "age-group" ? selectedAgeGroup === field.id
                  : currentStepData.id === "skill-level" ? selectedSkillLevel === field.id
                  : currentStepData.id === "time-commitment" ? selectedTimeCommitment === field.id
                  : currentStepData.id === "teaching-subject" ? selectedTeachingSubject === field.id
                  : currentStepData.id === "teaching-level" ? selectedTeachingLevel === field.id
                  : selectedClassSize === field.id;

              const FieldIcon = field.icon;
              return (
                <motion.button
                  key={field.id}
                  onClick={() => {
                    if (currentStepData.id === "interests" || currentStepData.id === "goals") {
                      handleFieldToggle(field.id);
                    } else {
                      handleFieldSelect(field.id);
                    }
                  }}
                  whileTap={{ scale: 0.97 }}
                  className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all flex items-center gap-2 ${
                    isSelected
                      ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"
                      : "border-border bg-card hover:border-green-300 dark:hover:border-green-600 text-muted-foreground"
                  }`}
                >
                  {FieldIcon && <FieldIcon className="w-3.5 h-3.5" />}
                  <span>{field.label}</span>
                  {isSelected && <Check className="w-3 h-3 text-green-500" />}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between w-full pt-4 pb-2">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!canProceed() || isSaving}
            className="px-4 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-all active:scale-95"
          >
            {isLastStep ? (isSaving ? "Saving..." : "Finish") : "Continue"}
            {!isLastStep && <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
