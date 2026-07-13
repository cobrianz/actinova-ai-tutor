/**
 * Gamification System - XP, Levels, Badges, and Leaderboards
 */

// XP rewards for different actions
export const XP_REWARDS = {
  lesson_complete: 10,
  quiz_complete: 15,
  quiz_perfect: 25,
  flashcard_review: 2,
  streak_bonus_7: 5,
  streak_bonus_14: 10,
  streak_bonus_30: 25,
  course_complete: 50,
  first_course: 100,
  daily_login: 5,
};

// Level thresholds using exponential curve
// Level N requires floor(100 * 1.5^(N-1)) XP to reach
export function xpForLevel(level) {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

/**
 * Calculate level and progress from total XP
 * @param {number} totalXp
 * @returns {{ level: number, currentXp: number, nextLevelXp: number, progress: number }}
 */
export function calculateLevel(totalXp) {
  let level = 1;
  let remainingXp = totalXp;

  while (true) {
    const needed = xpForLevel(level + 1);
    if (needed === 0 || remainingXp < needed) break;
    remainingXp -= needed;
    level++;
  }

  const nextLevelXp = xpForLevel(level + 1);
  const progress = nextLevelXp > 0 ? Math.round((remainingXp / nextLevelXp) * 100) : 100;

  return {
    level,
    currentXp: remainingXp,
    nextLevelXp,
    progress: Math.min(100, progress),
  };
}

// Badge definitions
export const BADGES = {
  "first-lesson": {
    name: "First Steps",
    description: "Complete your first lesson",
    icon: "1",
    rarity: "common",
  },
  "streak-3": {
    name: "Getting Started",
    description: "Maintain a 3-day streak",
    icon: "2",
    rarity: "common",
  },
  "streak-7": {
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "3",
    rarity: "rare",
  },
  "streak-14": {
    name: "Fortnight Fighter",
    description: "Maintain a 14-day streak",
    icon: "4",
    rarity: "rare",
  },
  "streak-30": {
    name: "Monthly Master",
    description: "Maintain a 30-day streak",
    icon: "5",
    rarity: "epic",
  },
  "quiz-first": {
    name: "Quiz Taker",
    description: "Complete your first quiz",
    icon: "6",
    rarity: "common",
  },
  "quiz-master": {
    name: "Quiz Master",
    description: "Score 100% on 5 quizzes",
    icon: "7",
    rarity: "rare",
  },
  "quiz-perfect-10": {
    name: "Perfectionist",
    description: "Score 100% on 10 quizzes",
    icon: "8",
    rarity: "epic",
  },
  "course-complete-1": {
    name: "Course Champion",
    description: "Complete your first course",
    icon: "9",
    rarity: "rare",
  },
  "course-complete-5": {
    name: "Knowledge Seeker",
    description: "Complete 5 courses",
    icon: "10",
    rarity: "epic",
  },
  "course-complete-10": {
    name: "Scholar",
    description: "Complete 10 courses",
    icon: "11",
    rarity: "legendary",
  },
  "flashcards-50": {
    name: "Card Collector",
    description: "Review 50 flashcards",
    icon: "12",
    rarity: "common",
  },
  "flashcards-100": {
    name: "Memory Palace",
    description: "Review 100 flashcards",
    icon: "13",
    rarity: "rare",
  },
  "flashcards-500": {
    name: "Photographic Memory",
    description: "Review 500 flashcards",
    icon: "14",
    rarity: "epic",
  },
  "level-5": {
    name: "Rising Star",
    description: "Reach level 5",
    icon: "15",
    rarity: "rare",
  },
  "level-10": {
    name: "Knowledge Sage",
    description: "Reach level 10",
    icon: "16",
    rarity: "epic",
  },
  "level-25": {
    name: "Grandmaster",
    description: "Reach level 25",
    icon: "17",
    rarity: "legendary",
  },
  "xp-500": {
    name: "XP Hunter",
    description: "Earn 500 total XP",
    icon: "18",
    rarity: "common",
  },
  "xp-2000": {
    name: "XP Legend",
    description: "Earn 2000 total XP",
    icon: "19",
    rarity: "rare",
  },
  "xp-10000": {
    name: "XP Myth",
    description: "Earn 10000 total XP",
    icon: "20",
    rarity: "legendary",
  },
  "daily-grinder": {
    name: "Daily Grinder",
    description: "Earn 50+ XP in a single day",
    icon: "21",
    rarity: "common",
  },
};

/**
 * Check which new badges a user has earned
 * @param {Object} user - The user document
 * @param {Object} stats - Aggregated stats { completedLessons, perfectQuizzes, completedCourses, flashcardsReviewed }
 * @returns {Array} Array of newly earned badge objects
 */
export function checkBadges(user, stats = {}) {
  const existingBadgeIds = new Set(user.achievements?.map((a) => a.badgeId) || []);
  const newBadges = [];

  const checks = [
    {
      id: "first-lesson",
      condition: (stats.totalLessonsCompleted || 0) >= 1,
    },
    {
      id: "streak-3",
      condition: (user.streak?.longest || 0) >= 3,
    },
    {
      id: "streak-7",
      condition: (user.streak?.longest || 0) >= 7,
    },
    {
      id: "streak-14",
      condition: (user.streak?.longest || 0) >= 14,
    },
    {
      id: "streak-30",
      condition: (user.streak?.longest || 0) >= 30,
    },
    {
      id: "quiz-first",
      condition: (stats.totalQuizzesCompleted || 0) >= 1,
    },
    {
      id: "quiz-master",
      condition: (stats.perfectQuizzes || 0) >= 5,
    },
    {
      id: "quiz-perfect-10",
      condition: (stats.perfectQuizzes || 0) >= 10,
    },
    {
      id: "course-complete-1",
      condition: (stats.completedCourses || 0) >= 1,
    },
    {
      id: "course-complete-5",
      condition: (stats.completedCourses || 0) >= 5,
    },
    {
      id: "course-complete-10",
      condition: (stats.completedCourses || 0) >= 10,
    },
    {
      id: "flashcards-50",
      condition: (stats.flashcardsReviewed || 0) >= 50,
    },
    {
      id: "flashcards-100",
      condition: (stats.flashcardsReviewed || 0) >= 100,
    },
    {
      id: "flashcards-500",
      condition: (stats.flashcardsReviewed || 0) >= 500,
    },
    {
      id: "level-5",
      condition: (user.level || 1) >= 5,
    },
    {
      id: "level-10",
      condition: (user.level || 1) >= 10,
    },
    {
      id: "level-25",
      condition: (user.level || 1) >= 25,
    },
    {
      id: "xp-500",
      condition: (user.xp || 0) >= 500,
    },
    {
      id: "xp-2000",
      condition: (user.xp || 0) >= 2000,
    },
    {
      id: "xp-10000",
      condition: (user.xp || 0) >= 10000,
    },
    {
      id: "daily-grinder",
      condition: (user.dailyXp || 0) >= 50,
    },
  ];

  for (const check of checks) {
    if (!existingBadgeIds.has(check.id) && check.condition) {
      const badgeDef = BADGES[check.id];
      if (badgeDef) {
        newBadges.push({
          badgeId: check.id,
          name: badgeDef.name,
          description: badgeDef.description,
          icon: badgeDef.icon,
          rarity: badgeDef.rarity,
          earnedAt: new Date(),
        });
      }
    }
  }

  return newBadges;
}

/**
 * Get badge rarity color class
 * @param {string} rarity
 * @returns {string} Tailwind color class
 */
export function getRarityColor(rarity) {
  switch (rarity) {
    case "common":
      return "text-gray-500 border-gray-300 bg-gray-50 dark:bg-gray-900/30";
    case "rare":
      return "text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-900/30";
    case "epic":
      return "text-purple-600 border-purple-300 bg-purple-50 dark:bg-purple-900/30";
    case "legendary":
      return "text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-900/30";
    default:
      return "text-gray-500 border-gray-300 bg-gray-50";
  }
}

/**
 * Get all badges with earned status
 * @param {Object} user
 * @returns {Array} All badges with earned flag
 */
export function getAllBadgesWithStatus(user) {
  const earnedIds = new Set(user.achievements?.map((a) => a.badgeId) || []);

  return Object.entries(BADGES).map(([id, badge]) => ({
    ...badge,
    badgeId: id,
    earned: earnedIds.has(id),
    earnedAt: user.achievements?.find((a) => a.badgeId === id)?.earnedAt || null,
  }));
}
