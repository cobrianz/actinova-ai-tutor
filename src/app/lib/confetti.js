/**
 * Confetti celebration effects for gamification events
 */

let confettiFn = null;

async function loadConfetti() {
  if (!confettiFn) {
    const mod = await import("canvas-confetti");
    confettiFn = mod.default;
  }
  return confettiFn;
}

export async function celebrateLessonComplete() {
  const fire = await loadConfetti();
  fire({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.8 },
    colors: ["#22c55e", "#16a34a", "#15803d"],
  });
}

export async function celebrateCourseComplete() {
  const fire = await loadConfetti();
  // First burst
  fire({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#f59e0b", "#eab308", "#f97316"],
  });
  // Second burst after delay
  setTimeout(() => {
    fire({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6, x: 0.3 },
      colors: ["#3b82f6", "#6366f1", "#8b5cf6"],
    });
  }, 200);
  // Third burst
  setTimeout(() => {
    fire({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6, x: 0.7 },
      colors: ["#ec4899", "#f43f5e", "#ef4444"],
    });
  }, 400);
}

export async function celebrateQuizPerfect() {
  const fire = await loadConfetti();
  fire({
    particleCount: 80,
    spread: 80,
    origin: { y: 0.7 },
    colors: ["#8b5cf6", "#a855f7", "#d946ef"],
  });
}

export async function celebrateLevelUp() {
  const fire = await loadConfetti();
  const duration = 2000;
  const end = Date.now() + duration;

  const frame = () => {
    fire({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ["#f59e0b", "#eab308", "#fbbf24"],
    });
    fire({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ["#f59e0b", "#eab308", "#fbbf24"],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}

export async function celebrateBadgeEarned(rarity = "common") {
  const fire = await loadConfetti();
  const colors = {
    common: ["#9ca3af", "#6b7280", "#4b5563"],
    rare: ["#3b82f6", "#6366f1", "#2563eb"],
    epic: ["#a855f7", "#9333ea", "#7c3aed"],
    legendary: ["#f59e0b", "#eab308", "#f97316"],
  };

  fire({
    particleCount: rarity === "legendary" ? 150 : rarity === "epic" ? 100 : 60,
    spread: 90,
    origin: { y: 0.5 },
    colors: colors[rarity] || colors.common,
  });
}
