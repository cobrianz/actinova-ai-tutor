export const RESUME_TEMPLATES = [
  {
    id: "classic",
    name: "Classic",
    description: "Traditional centered layout with serif fonts",
    category: "traditional",
    accent: "#166534",
    preview: "Centered header, horizontal rules, pill section titles",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Clean sans-serif with colored accent bar",
    category: "modern",
    accent: "#059669",
    preview: "Left-aligned header, accent bar, clean typography",
  },
  {
    id: "executive",
    name: "Executive",
    description: "Bold dark header with professional styling",
    category: "traditional",
    accent: "#1e293b",
    preview: "Dark header band, strong hierarchy, refined spacing",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-clean with generous whitespace",
    category: "modern",
    accent: "#64748b",
    preview: "Minimal accents, thin rules, elegant typography",
  },
  {
    id: "creative",
    name: "Creative",
    description: "Colorful sidebar layout for creative roles",
    category: "creative",
    accent: "#7c3aed",
    preview: "Sidebar with contact/skills, bold color accents",
  },
  {
    id: "technical",
    name: "Technical",
    description: "Skills-focused with clean grid layout",
    category: "modern",
    accent: "#0891b2",
    preview: "Skills grid, monospace accents, project-focused",
  },
  {
    id: "elegant",
    name: "Elegant",
    description: "Sophisticated typography with subtle borders",
    category: "traditional",
    accent: "#92400e",
    preview: "Refined borders, warm tones, classic elegance",
  },
  {
    id: "bold",
    name: "Bold",
    description: "Strong headings with high contrast",
    category: "modern",
    accent: "#dc2626",
    preview: "Bold section headers, strong visual hierarchy",
  },
  {
    id: "compact",
    name: "Compact",
    description: "Dense layout fitting more content",
    category: "modern",
    accent: "#475569",
    preview: "Tight spacing, efficient use of space, clean",
  },
  {
    id: "professional",
    name: "Professional",
    description: "Two-column with sidebar for contact and skills",
    category: "traditional",
    accent: "#1d4ed8",
    preview: "Two-column layout, sidebar contact, structured",
  },
];

export const getTemplateById = (id) =>
  RESUME_TEMPLATES.find((t) => t.id === id) || RESUME_TEMPLATES[0];

export const getTemplatesByCategory = (category) =>
  RESUME_TEMPLATES.filter((t) => t.category === category);
