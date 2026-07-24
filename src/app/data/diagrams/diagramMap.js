const diagramMap = {
  // Biology
  "human-brain-sagittal": { path: "/diagrams/biology/human-brain-sagittal.svg", title: "Human Brain — Sagittal View", source: "Wikimedia Commons" },
  "human-heart-diagram": { path: "/diagrams/biology/human-heart-diagram.svg", title: "Human Heart — Cross Section", source: "Wikimedia Commons" },
  "human-heart-labeled": { path: "/diagrams/biology/human-heart-labeled.svg", title: "Human Heart — Labeled", source: "Wikimedia Commons" },
  "animal-cell-structure": { path: "/diagrams/biology/animal-cell-structure.svg", title: "Animal Cell — Structure", source: "Wikimedia Commons" },
  "animal-cell-simple": { path: "/diagrams/biology/animal-cell-simple.svg", title: "Animal Cell — Simple", source: "Wikimedia Commons" },
  "animal-cell-detailed": { path: "/diagrams/biology/animal-cell-detailed.svg", title: "Animal Cell — Detailed", source: "Wikimedia Commons" },
  "respiratory-system": { path: "/diagrams/biology/respiratory-system.svg", title: "Human Respiratory System", source: "Wikimedia Commons" },
  "digestive-system": { path: "/diagrams/biology/digestive-system.svg", title: "Human Digestive System", source: "Wikimedia Commons" },
  "skeletal-system": { path: "/diagrams/biology/skeletal-system.svg", title: "Human Skeletal System", source: "Wikimedia Commons" },
  "nervous-system": { path: "/diagrams/biology/nervous-system.svg", title: "Human Nervous System", source: "Wikimedia Commons" },
  "muscular-system": { path: "/diagrams/biology/muscular-system.svg", title: "Human Muscular System", source: "Wikimedia Commons" },
  "plant-cell": { path: "/diagrams/biology/plant-cell.svg", title: "Plant Cell — Structure", source: "Wikimedia Commons" },
  "cell-mitosis": { path: "/diagrams/biology/cell-mitosis.svg", title: "Cell Mitosis — Stages", source: "Wikimedia Commons" },
  // Physics
  "battery-resistor-circuit": { path: "/diagrams/physics/battery-resistor-circuit.svg", title: "Battery-Resistor Circuit", source: "Wikimedia Commons" },
  "em-spectrum": { path: "/diagrams/physics/em-spectrum.svg", title: "Electromagnetic Spectrum", source: "Wikimedia Commons" },
  "electromagnetic-wave": { path: "/diagrams/physics/electromagnetic-wave.svg", title: "Electromagnetic Wave", source: "Wikimedia Commons" },
  "light-refraction": { path: "/diagrams/physics/light-refraction.svg", title: "Light Refraction & Reflection", source: "Wikimedia Commons" },
  "newtons-cradle": { path: "/diagrams/physics/newtons-cradle.svg", title: "Newton's Cradle — Momentum Transfer", source: "Wikimedia Commons" },
  "projectile-motion": { path: "/diagrams/physics/projectile-motion.svg", title: "Projectile Motion Trajectory", source: "Wikimedia Commons" },
  // Chemistry
  "periodic-table": { path: "/diagrams/chemistry/periodic-table.svg", title: "Periodic Table of Elements", source: "Wikimedia Commons" },
  "atom-bohr-model": { path: "/diagrams/chemistry/atom-bohr-model.svg", title: "Atom — Bohr Model", source: "Wikimedia Commons" },
  "ionic-bonding": { path: "/diagrams/chemistry/ionic-bonding.svg", title: "Ionic Bonding", source: "Wikimedia Commons" },
  "ph-scale": { path: "/diagrams/chemistry/ph-scale.svg", title: "pH Scale", source: "Wikimedia Commons" },
  "dna-helix": { path: "/diagrams/chemistry/dna-helix.svg", title: "DNA Double Helix", source: "Wikimedia Commons" },
  // Math
  "pythagorean-theorem": { path: "/diagrams/math/pythagorean-theorem.svg", title: "Pythagorean Theorem", source: "Wikimedia Commons" },
  "inscribed-angle": { path: "/diagrams/math/inscribed-angle.svg", title: "Inscribed Angle Theorem", source: "Wikimedia Commons" },
  "coordinate-plane": { path: "/diagrams/math/coordinate-plane.svg", title: "Cartesian Coordinate Plane", source: "Wikimedia Commons" },
  "rectangle": { path: "/diagrams/math/rectangle.svg", title: "Rectangle — Dimensions", source: "Educational" },
  "square": { path: "/diagrams/math/square.svg", title: "Square — Equal Sides", source: "Educational" },
  "circle": { path: "/diagrams/math/circle.svg", title: "Circle — Radius & Diameter", source: "Educational" },
  "triangle": { path: "/diagrams/math/triangle.svg", title: "Triangle — Sides & Vertices", source: "Educational" },
  "right-triangle": { path: "/diagrams/math/right-triangle.svg", title: "Right Triangle — Pythagorean Theorem", source: "Educational" },
  "parallelogram": { path: "/diagrams/math/parallelogram.svg", title: "Parallelogram — Base & Height", source: "Educational" },
  "trapezoid": { path: "/diagrams/math/trapezoid.svg", title: "Trapezoid — Bases & Height", source: "Educational" },
  "cylinder": { path: "/diagrams/math/cylinder.svg", title: "Cylinder — Radius & Height", source: "Educational" },
  "cone": { path: "/diagrams/math/cone.svg", title: "Cone — Radius, Height & Slant", source: "Educational" },
};

export function getDiagram(id) {
  return diagramMap[id] || null;
}

export function getDiagramIds() {
  return Object.keys(diagramMap);
}

export default diagramMap;
