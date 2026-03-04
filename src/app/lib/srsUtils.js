/**
 * SRS Utilities - SuperMemo 2 (SM-2) Algorithm
 */

/**
 * Calculate the next SRS state based on the current state and review quality.
 * @param {Object} currentSrs - { interval, repetitions, ease, dueDate }
 * @param {Number} quality - Review quality 0-5 (0 = blackout, 5 = perfect response)
 * @returns {Object} - Updated SRS state
 */
export function calculateNextReview(currentSrs, quality) {
    let { interval, repetitions, ease } = currentSrs || {
        interval: 0,
        repetitions: 0,
        ease: 2.5
    };

    // SM-2 Algorithm
    if (quality >= 3) {
        // Success
        if (repetitions === 0) {
            interval = 1;
        } else if (repetitions === 1) {
            interval = 6;
        } else {
            interval = Math.round(interval * ease);
        }
        repetitions += 1;
    } else {
        // Failure
        repetitions = 0;
        interval = 1;
    }

    // Update Ease Factor
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (ease < 1.3) ease = 1.3;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + interval);

    return {
        interval,
        repetitions,
        ease,
        dueDate
    };
}

/**
 * Helper to convert percentage score (0-100) to SRS quality (0-5)
 * @param {Number} percentage 
 * @returns {Number}
 */
export function scoreToQuality(percentage) {
    if (percentage >= 95) return 5;
    if (percentage >= 85) return 4;
    if (percentage >= 70) return 3;
    if (percentage >= 50) return 2;
    if (percentage >= 30) return 1;
    return 0;
}
