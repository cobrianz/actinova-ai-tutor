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

const onboardingSteps = [
  {
    id: "interests",
    title: "What are you interested in learning?",
    description:
      "Select all topics that interest you. We'll personalize your learning experience.",
    icon: Heart,
    fields: [
      {
        id: "programming",
        label: "Programming & Development",
        icon: Code,
        category: "Technology",
      },
      {
        id: "design",
        label: "Design & Creative Arts",
        icon: Palette,
        category: "Design",
      },
      {
        id: "business",
        label: "Business & Entrepreneurship",
        icon: Briefcase,
        category: "Business",
      },
      {
        id: "data-science",
        label: "Data Science & Analytics",
        icon: TrendingUp,
        category: "Data Science",
      },
      {
        id: "ai-ml",
        label: "AI & Machine Learning",
        icon: Brain,
        category: "AI & ML",
      },
      {
        id: "music",
        label: "Music & Audio",
        icon: Music,
        category: "Creative",
      },
      {
        id: "photography",
        label: "Photography & Videography",
        icon: Camera,
        category: "Creative",
      },
      {
        id: "gaming",
        label: "Game Development",
        icon: Gamepad2,
        category: "Technology",
      },
      {
        id: "writing",
        label: "Writing & Literature",
        icon: BookOpen,
        category: "Humanities",
      },
      {
        id: "languages",
        label: "Foreign Languages",
        icon: MessageSquare,
        category: "Languages",
      },
      {
        id: "science",
        label: "Natural Sciences",
        icon: FlaskRound,
        category: "Science",
      },
      {
        id: "math",
        label: "Mathematics",
        icon: Calculator,
        category: "Mathematics",
      },
      {
        id: "history",
        label: "History & Social Studies",
        icon: Clock,
        category: "Humanities",
      },
      {
        id: "health",
        label: "Health & Wellness",
        icon: Heart,
        category: "Health",
      },
      {
        id: "finance",
        label: "Finance & Investing",
        icon: DollarSign,
        category: "Business",
      },
      {
        id: "cooking",
        label: "Cooking & Culinary Arts",
        icon: ChefHat,
        category: "Lifestyle",
      },
      {
        id: "fitness",
        label: "Fitness & Exercise",
        icon: Heart,
        category: "Health",
      },
      {
        id: "meditation",
        label: "Meditation & Mindfulness",
        icon: Brain,
        category: "Health",
      },
      {
        id: "gardening",
        label: "Gardening & Horticulture",
        icon: BookOpen,
        category: "Lifestyle",
      },
      {
        id: "crafts",
        label: "Arts & Crafts",
        icon: Palette,
        category: "Creative",
      },
      {
        id: "psychology",
        label: "Psychology & Mental Health",
        icon: Brain,
        category: "Health",
      },
      {
        id: "philosophy",
        label: "Philosophy & Ethics",
        icon: BookOpen,
        category: "Humanities",
      },
      {
        id: "economics",
        label: "Economics & Finance",
        icon: DollarSign,
        category: "Business",
      },
      {
        id: "marketing",
        label: "Marketing & Advertising",
        icon: TrendingUp,
        category: "Business",
      },
      {
        id: "project-management",
        label: "Project Management",
        icon: Briefcase,
        category: "Business",
      },
      {
        id: "leadership",
        label: "Leadership & Management",
        icon: User,
        category: "Business",
      },
      {
        id: "public-speaking",
        label: "Public Speaking & Communication",
        icon: MessageSquare,
        category: "Business",
      },
      {
        id: "entrepreneurship",
        label: "Entrepreneurship & Startups",
        icon: Briefcase,
        category: "Business",
      },
      {
        id: "real-estate",
        label: "Real Estate & Property",
        icon: DollarSign,
        category: "Business",
      },
      {
        id: "investing",
        label: "Investing & Trading",
        icon: DollarSign,
        category: "Business",
      },
      {
        id: "accounting",
        label: "Accounting & Bookkeeping",
        icon: Calculator,
        category: "Business",
      },
      {
        id: "law",
        label: "Law & Legal Studies",
        icon: BookOpen,
        category: "Humanities",
      },
      {
        id: "politics",
        label: "Politics & Government",
        icon: BookOpen,
        category: "Humanities",
      },
      {
        id: "sociology",
        label: "Sociology & Anthropology",
        icon: Users,
        category: "Humanities",
      },
      {
        id: "geography",
        label: "Geography & Travel",
        icon: BookOpen,
        category: "Humanities",
      },
      {
        id: "religion",
        label: "Religion & Theology",
        icon: BookOpen,
        category: "Humanities",
      },
      {
        id: "art-history",
        label: "Art History & Appreciation",
        icon: Palette,
        category: "Creative",
      },
      {
        id: "dance",
        label: "Dance & Movement",
        icon: Music,
        category: "Creative",
      },
      {
        id: "theater",
        label: "Theater & Acting",
        icon: Users,
        category: "Creative",
      },
      {
        id: "fashion",
        label: "Fashion & Style",
        icon: Palette,
        category: "Creative",
      },
      {
        id: "interior-design",
        label: "Interior Design",
        icon: Palette,
        category: "Design",
      },
      {
        id: "architecture",
        label: "Architecture",
        icon: Briefcase,
        category: "Design",
      },
      {
        id: "engineering",
        label: "Engineering",
        icon: FlaskRound,
        category: "Science",
      },
      {
        id: "medicine",
        label: "Medicine & Healthcare",
        icon: Heart,
        category: "Health",
      },
      {
        id: "nursing",
        label: "Nursing & Caregiving",
        icon: Heart,
        category: "Health",
      },
      {
        id: "nutrition",
        label: "Nutrition & Dietetics",
        icon: Heart,
        category: "Health",
      },
      {
        id: "veterinary",
        label: "Veterinary Science",
        icon: Heart,
        category: "Health",
      },
      {
        id: "astronomy",
        label: "Astronomy & Space",
        icon: FlaskRound,
        category: "Science",
      },
      {
        id: "geology",
        label: "Geology & Earth Sciences",
        icon: FlaskRound,
        category: "Science",
      },
      {
        id: "environmental",
        label: "Environmental Science",
        icon: FlaskRound,
        category: "Science",
      },
      {
        id: "agriculture",
        label: "Agriculture & Farming",
        icon: BookOpen,
        category: "Science",
      },
      {
        id: "aviation",
        label: "Aviation & Piloting",
        icon: TrendingUp,
        category: "Technology",
      },
      {
        id: "automotive",
        label: "Automotive & Mechanics",
        icon: Briefcase,
        category: "Technology",
      },
      {
        id: "construction",
        label: "Construction & Trades",
        icon: Briefcase,
        category: "Technology",
      },
      {
        id: "electrician",
        label: "Electrical Work",
        icon: Briefcase,
        category: "Technology",
      },
      {
        id: "plumbing",
        label: "Plumbing & HVAC",
        icon: Briefcase,
        category: "Technology",
      },
      {
        id: "welding",
        label: "Welding & Metalwork",
        icon: Briefcase,
        category: "Technology",
      },
      {
        id: "woodworking",
        label: "Woodworking & Carpentry",
        icon: Briefcase,
        category: "Technology",
      },
    ],
  },
  {
    id: "age-group",
    title: "What's your age group?",
    description:
      "This helps us tailor content appropriate for your age and experience level.",
    icon: User,
    fields: [
      {
        id: "under-18",
        label: "Under 18",
        description: "Student or young learner",
      },
      {
        id: "18-24",
        label: "18-24",
        description: "Young adult, college student",
      },
      { id: "25-34", label: "25-34", description: "Early career professional" },
      { id: "35-44", label: "35-44", description: "Mid-career professional" },
      { id: "45-54", label: "45-54", description: "Experienced professional" },
      { id: "55+", label: "55+", description: "Senior learner" },
    ],
  },
  {
    id: "education-level",
    title: "What's your current education level?",
    description:
      "Help us recommend courses that match your background knowledge.",
    icon: GraduationCap,
    fields: [
      {
        id: "high-school",
        label: "High School",
        description: "Currently in high school or equivalent",
      },
      {
        id: "some-college",
        label: "Some College",
        description: "Started college but didn't complete",
      },
      {
        id: "associates",
        label: "Associate's Degree",
        description: "2-year degree completed",
      },
      {
        id: "bachelors",
        label: "Bachelor's Degree",
        description: "4-year degree completed",
      },
      {
        id: "masters",
        label: "Master's Degree",
        description: "Graduate degree completed",
      },
      {
        id: "phd",
        label: "PhD or Higher",
        description: "Doctorate or advanced degree",
      },
      {
        id: "self-taught",
        label: "Self-Taught",
        description: "Learned through personal projects",
      },
    ],
  },
  {
    id: "skill-level",
    title: "What's your current skill level?",
    description: "Help us recommend courses at the right difficulty for you.",
    icon: TrendingUp,
    fields: [
      { id: "beginner", label: "Beginner", description: "Just starting out" },
      {
        id: "intermediate",
        label: "Intermediate",
        description: "Some experience",
      },
      {
        id: "advanced",
        label: "Advanced",
        description: "Looking to master skills",
      },
    ],
  },
  {
    id: "goals",
    title: "What are your learning goals?",
    description: "Select what you want to achieve (you can choose multiple).",
    icon: BookOpen,
    fields: [
      {
        id: "career-change",
        label: "Career Change",
        description: "Switch to a new field",
      },
      {
        id: "skill-upgrade",
        label: "Skill Upgrade",
        description: "Advance in current role",
      },
      {
        id: "personal-project",
        label: "Personal Project",
        description: "Build something new",
      },
      {
        id: "certification",
        label: "Get Certified",
        description: "Earn credentials",
      },
      { id: "hobby", label: "Hobby & Fun", description: "Learn for enjoyment" },
      {
        id: "startup",
        label: "Start a Business",
        description: "Entrepreneurship goals",
      },
      {
        id: "teaching",
        label: "Teach Others",
        description: "Share knowledge with others",
      },
      {
        id: "research",
        label: "Academic Research",
        description: "Conduct research or studies",
      },
    ],
  },
  {
    id: "time-commitment",
    title: "How much time can you commit?",
    description: "This helps us suggest courses that fit your schedule.",
    icon: Clock,
    fields: [
      { id: "1-3", label: "1-3 hours/week", description: "Light learning" },
      { id: "4-7", label: "4-7 hours/week", description: "Moderate pace" },
      {
        id: "8-15",
        label: "8-15 hours/week",
        description: "Intensive learning",
      },
      {
        id: "15+",
        label: "15+ hours/week",
        description: "Full-time commitment",
      },
    ],
  },
];

export default function Onboarding({ onComplete }) {
  const router = useRouter();
  const { setUserData } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState("");
  const [selectedEducationLevel, setSelectedEducationLevel] = useState("");
  const [selectedSkillLevel, setSelectedSkillLevel] = useState("");
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [selectedTimeCommitment, setSelectedTimeCommitment] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const currentStepData = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;
  const canProceed = () => {
    switch (currentStepData.id) {
      case "interests":
        return selectedInterests.length > 0;
      case "age-group":
        return selectedAgeGroup !== "";
      case "education-level":
        return selectedEducationLevel !== "";
      case "skill-level":
        return selectedSkillLevel !== "";
      case "goals":
        return selectedGoals.length > 0;
      case "time-commitment":
        return selectedTimeCommitment !== "";
      default:
        return false;
    }
  };

  const handleFieldToggle = (fieldId) => {
    switch (currentStepData.id) {
      case "interests":
        setSelectedInterests((prev) =>
          prev.includes(fieldId)
            ? prev.filter((id) => id !== fieldId)
            : [...prev, fieldId]
        );
        break;
      case "goals":
        setSelectedGoals((prev) =>
          prev.includes(fieldId)
            ? prev.filter((id) => id !== fieldId)
            : [...prev, fieldId]
        );
        break;
      default:
        break;
    }
  };

  const handleFieldSelect = (fieldId) => {
    switch (currentStepData.id) {
      case "age-group":
        setSelectedAgeGroup(fieldId);
        break;
      case "education-level":
        setSelectedEducationLevel(fieldId);
        break;
      case "skill-level":
        setSelectedSkillLevel(fieldId);
        break;
      case "time-commitment":
        setSelectedTimeCommitment(fieldId);
        break;
      default:
        break;
    }
  };

  const handleNext = () => {
    if (!canProceed()) {
      toast.error("Please make a selection to continue");
      return;
    }
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Helper to get cookie value
  const getCookie = (name) => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      // Get CSRF token from cookie
      const csrfToken = getCookie("csrfToken");

      const headers = {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken || "",
      };

      // Get interest categories from the interests step
      const interestsStep = onboardingSteps.find(
        (step) => step.id === "interests"
      );
      const interestCategories = selectedInterests
        .map((id) => {
          const interest = interestsStep?.fields.find((f) => f.id === id);
          return interest?.category;
        })
        .filter(Boolean);

      const profileData = {
        interests: selectedInterests,
        interestCategories: [...new Set(interestCategories)],
        ageGroup: selectedAgeGroup,
        educationLevel: selectedEducationLevel,
        skillLevel: selectedSkillLevel,
        goals: selectedGoals,
        timeCommitment: selectedTimeCommitment,
        onboardingCompleted: true,
      };



      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(profileData),
      });



      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[Onboarding] Error response:", errorData);
        throw new Error(errorData.error || "Failed to save profile");
      }

      const data = await response.json();


      // Update the user state in AuthProvider
      setUserData(data.user);

      toast.success("Profile saved! Let's start learning!");
      if (onComplete) {
        onComplete();
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("[Onboarding] Error saving profile:", error);
      toast.error(error.message || "Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const IconComponent = currentStepData.icon;

  return (
    <div className="relative flex flex-col min-h-screen overflow-hidden bg-background text-foreground">
      {/* Decorative dots - Subtle background elements */}
      <div className="absolute top-10 left-10 w-16 h-16 bg-primary/5 rounded-full blur-xl"></div>
      <div className="absolute top-32 right-20 w-20 h-20 bg-primary/5 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 left-32 w-24 h-24 bg-primary/5 rounded-full blur-xl"></div>
      <div className="absolute bottom-32 right-16 w-16 h-16 bg-primary/5 rounded-full blur-xl"></div>

      {/* Main content */}
      <motion.div
        className="relative z-10 flex flex-col flex-1 w-full max-w-6xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="p-8 pb-4 text-center">
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 transition-transform hover:scale-110 shadow-sm border border-primary/20">
              <IconComponent className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl font-heading mb-2">
                {currentStepData.title}
              </h2>
              <p className="text-base font-medium text-muted-foreground">
                Step {currentStep + 1} of {onboardingSteps.length}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-secondary rounded-full h-1.5 max-w-xs mx-auto overflow-hidden">
            <motion.div
              className="bg-primary h-full rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"
              initial={{ width: 0 }}
              animate={{
                width: `${((currentStep + 1) / onboardingSteps.length) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 pt-2 overflow-y-auto hide-scrollbar">
          <p className="max-w-3xl mx-auto mb-10 text-lg leading-relaxed text-center text-muted-foreground">
            {currentStepData.description}
          </p>

          <div className="flex flex-wrap gap-3 justify-center items-center">
            {currentStepData.fields.map((field, index) => {
              const isSelected =
                currentStepData.id === "interests"
                  ? selectedInterests.includes(field.id)
                  : currentStepData.id === "goals"
                    ? selectedGoals.includes(field.id)
                    : currentStepData.id === "age-group"
                      ? selectedAgeGroup === field.id
                      : currentStepData.id === "education-level"
                        ? selectedEducationLevel === field.id
                        : currentStepData.id === "skill-level"
                          ? selectedSkillLevel === field.id
                          : selectedTimeCommitment === field.id;

              const FieldIcon = field.icon;

              return (
                <motion.button
                  key={field.id}
                  onClick={() => {
                    if (
                      currentStepData.id === "interests" ||
                      currentStepData.id === "goals"
                    ) {
                      handleFieldToggle(field.id);
                    } else {
                      handleFieldSelect(field.id);
                    }
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-full border-2 transition-all text-center ${isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/50"
                    }`}
                >
                  <div className="flex items-center justify-center space-x-3">
                    {FieldIcon && (
                      <div
                        className={`p-2 rounded-full ${isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                          }`}
                      >
                        <FieldIcon className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <h3
                          className={`font-semibold ${isSelected
                            ? "text-primary"
                            : "text-foreground"
                            }`}
                        >
                          {field.label}
                        </h3>
                        {isSelected && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      {field.description && (
                        <p className="text-xs text-muted-foreground mt-1 text-center">
                          {field.description}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-8 border-t border-border/50">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="px-6 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!canProceed() || isSaving}
            className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all active:scale-95 shadow-lg shadow-primary/20"
          >
            <span className="text-sm tracking-wide uppercase">
              {isLastStep ? (isSaving ? "Saving..." : "Finish Profile") : "Continue"}
            </span>
            {!isLastStep && <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
