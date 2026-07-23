/**
 * Outline-Aware Structural Validator Service
 * 
 * Validates academic reports and essays against their generated outlines.
 */

export const validateStructure = (report) => {
    const { type, outline, sections, abstract, fullContent } = report;
    const isResearch = type?.toLowerCase().includes('research') || type?.toLowerCase().includes('report');

    const results = {
        documentType: isResearch ? 'research' : 'essay',
        structureScore: 100,
        missingSections: [],
        emptySections: [],
        subsectionIssues: [],
        distributionWarnings: [],
        abstract: {
            exists: !!abstract,
            wordCount: abstract ? countWords(abstract) : 0,
            validLength: false
        },
        structuralDrift: []
    };

    // 1. Abstract Validation
    if (results.abstract.exists) {
        results.abstract.validLength = results.abstract.wordCount >= 150 && results.abstract.wordCount <= 250;
        if (!results.abstract.validLength) {
            results.structureScore -= 5;
        }
    } else if (isResearch) {
        // Abstract is usually mandatory for research
        results.structureScore -= 10;
    }

    // 2. Section Completeness & Content Validation
    const requiredResearchSections = ['abstract', 'introduction', 'literature review', 'methodology', 'results', 'discussion', 'conclusion', 'references'];
    const foundRequired = new Set();

    const totalWords = countWords(fullContent || '');
    const sectionWordCounts = {};

    outline.forEach(node => {
        const title = node.title.toLowerCase();
        const sectionContent = sections?.[node.id] || [];
        // Handle both array of paragraphs and raw string (if user manually edited)
        const contentString = Array.isArray(sectionContent) ? sectionContent.join(' ') : (sectionContent || '');
        const wordCount = countWords(contentString);

        sectionWordCounts[node.id] = wordCount;

        // Check required sections (Research)
        if (isResearch) {
            requiredResearchSections.forEach(req => {
                // Better matching: eg 'methods' matches 'methodology'
                if (title.includes(req) || req.includes(title)) foundRequired.add(req);
            });
        }

        // Check if empty
        if (wordCount === 0 && !node.isCover) {
            results.emptySections.push(node.title);
            results.structureScore -= 10;
        } else if (wordCount > 0 && wordCount < 100) {
            const isAbstract = title.includes('abstract');
            const isCover = node.isCover || title.includes('cover');
            const isRef = title.includes('reference');

            if (!isAbstract && !isCover && !isRef) {
                results.distributionWarnings.push(`${node.title} appears very short (${wordCount} words).`);
                results.structureScore -= 5;
            }
        }

        // Structural Drift Detection
        // Since we render headings from content, we check if the heading in fullContent matches node.title
        // This is a bit tricky with HTML. We'll check for simple drift if possible.
        // For now, let's look for the title in the full text if available.
        if (fullContent && !fullContent.toLowerCase().includes(node.title.toLowerCase())) {
            results.structuralDrift.push({
                outlineTitle: node.title,
                type: 'MISSING_OR_RENAMED'
            });
        }
    });

    if (isResearch) {
        requiredResearchSections.forEach(req => {
            if (!foundRequired.has(req)) {
                results.missingSections.push(req.charAt(0).toUpperCase() + req.slice(1));
                results.structureScore -= 10;
            }
        });
    }

    // 3. Essay Specific Validation
    if (!isResearch) {
        const intro = outline.find(n => n.title.toLowerCase().includes('introduction'));
        const conclusion = outline.find(n => n.title.toLowerCase().includes('conclusion'));
        const bodySections = outline.filter(n => !n.title.toLowerCase().includes('introduction') && !n.title.toLowerCase().includes('conclusion') && !n.isCover);

        if (!intro) {
            results.missingSections.push("Introduction");
            results.structureScore -= 20;
        } else {
            const introWords = sectionWordCounts[intro.id] || 0;
            if (introWords < 80) {
                results.distributionWarnings.push("Introduction is too short for a thesis statement.");
            }
        }

        if (!conclusion) {
            results.missingSections.push("Conclusion");
            results.structureScore -= 20;
        }

        if (bodySections.length < 2) {
            results.distributionWarnings.push("Essay should have at least 2 body sections.");
            results.structureScore -= 10;
        }
    }

    // 4. Distribution Balance
    if (totalWords > 0) {
        const litReview = outline.find(n => n.title.toLowerCase().includes('literature review'));
        if (litReview) {
            const litWords = sectionWordCounts[litReview.id] || 0;
            const percentage = (litWords / totalWords) * 100;
            if (percentage < 20) {
                results.distributionWarnings.push("Literature Review is less than 20% of the document—it may be underdeveloped.");
                results.structureScore -= 5;
            }
        }
    }

    // Ensure score doesn't go below 0
    results.structureScore = Math.max(0, results.structureScore);

    return results;
};

function countWords(str) {
    if (!str) return 0;
    // Remove HTML tags if string contains them
    const text = str.replace(/<[^>]*>/g, ' ');
    return text.trim().split(/\s+/).filter(Boolean).length;
}
