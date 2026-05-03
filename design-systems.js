const DEFAULT_SETTINGS = {
  designSystem: "neobrutalism",
};

const DESIGN_SYSTEMS = [
  { id: "neobrutalism", name: "Neobrutalism", surface: "#FBFBF9", ink: "#1C293C", primary: "#FDC800", secondary: "#432DD7", danger: "#DC2626", muted: "#657185", radius: "6px", border: "2px", shadow: "5px 5px 0 var(--cp-ink)" },
  { id: "paper", name: "Paper", surface: "#FFFFFF", ink: "#111827", primary: "#111111", secondary: "#8B5CF6", danger: "#DC2626", muted: "#6B7280", radius: "2px", border: "1px", shadow: "0 12px 30px rgba(17,24,39,0.12)" },
  { id: "bento", name: "Bento", surface: "#FFF5E6", ink: "#111827", primary: "#FAD4C0", secondary: "#80A1C1", danger: "#DC2626", muted: "#667085", radius: "8px", border: "1px", shadow: "0 16px 36px rgba(17,24,39,0.12)" },
  { id: "bold", name: "Bold", surface: "#111111", ink: "#F8FAFC", primary: "#0077BC", secondary: "#009866", danger: "#DC2626", muted: "#CBD5E1", radius: "0px", border: "3px", shadow: "6px 6px 0 #000000" },
  { id: "artistic", name: "Artistic", surface: "#FFFFFF", ink: "#111827", primary: "#3B82F6", secondary: "#8B5CF6", danger: "#DC2626", muted: "#6B7280", radius: "6px", border: "2px", shadow: "4px 4px 0 rgba(17,24,39,0.9)" },
  { id: "clean", name: "Clean", surface: "#FFFFFF", ink: "#111827", primary: "#3B82F6", secondary: "#8B5CF6", danger: "#DC2626", muted: "#6B7280", radius: "8px", border: "1px", shadow: "0 14px 34px rgba(15,23,42,0.12)" },
  { id: "cafe", name: "Cafe", surface: "#F9F7F5", ink: "#3E2B1E", primary: "#5D4432", secondary: "#E9E3DD", danger: "#DC2626", muted: "#806B5B", radius: "8px", border: "1px", shadow: "0 18px 40px rgba(62,43,30,0.16)" },
  { id: "dramatic", name: "Dramatic", surface: "#09090B", ink: "#FAFAFA", primary: "#8B5CF6", secondary: "#F43F5E", danger: "#DC2626", muted: "#A1A1AA", radius: "4px", border: "1px", shadow: "0 0 42px rgba(139,92,246,0.28)" },
  { id: "refined", name: "Refined", surface: "#FFFFFF", ink: "#111827", primary: "#3B82F6", secondary: "#8B5CF6", danger: "#DC2626", muted: "#6B7280", radius: "4px", border: "1px", shadow: "0 18px 44px rgba(17,24,39,0.10)" },
  { id: "energetic", name: "Energetic", surface: "#FFEDD5", ink: "#7C2D12", primary: "#EA580B", secondary: "#F59E0B", danger: "#DC2626", muted: "#9A3412", radius: "2px", border: "4px", shadow: "6px 6px 0 #7C2D12" },
  { id: "doodle", name: "Doodle", surface: "#FFFFFF", ink: "#263D5B", primary: "#49B6E5", secondary: "#263D5B", danger: "#DC2626", muted: "#64748B", radius: "7px", border: "2px", shadow: "3px 4px 0 rgba(38,61,91,0.85)" },
  { id: "luxury", name: "Luxury", surface: "#000000", ink: "#FFFFFF", primary: "#FAFAFA", secondary: "#B7B7B7", danger: "#DC2626", muted: "#A3A3A3", radius: "0px", border: "1px", shadow: "0 22px 60px rgba(250,250,250,0.12)" },
  { id: "agentic", name: "Agentic", surface: "#FFFFFF", ink: "#111827", primary: "#FF5701", secondary: "#F6F6F1", danger: "#DC2626", muted: "#6B7280", radius: "8px", border: "1px", shadow: "0 18px 42px rgba(255,87,1,0.16)" },
  { id: "brutalism", name: "Brutalism", surface: "#FFFFFF", ink: "#111827", primary: "#DD614C", secondary: "#DAA144", danger: "#DC2626", muted: "#4B5563", radius: "0px", border: "3px", shadow: "6px 6px 0 #111827" },
  { id: "claymorphism", name: "Claymorphism", surface: "#FFFFFF", ink: "#1C398E", primary: "#3B82F6", secondary: "#FFFFFF", danger: "#DC2626", muted: "#4B6BAE", radius: "14px", border: "1px", shadow: "10px 12px 28px rgba(59,130,246,0.22), inset -6px -6px 16px rgba(28,57,142,0.08)" },
  { id: "colorful", name: "Colorful", surface: "#FFFFFF", ink: "#111827", primary: "#3B82F6", secondary: "#8B5CF6", danger: "#DC2626", muted: "#6B7280", radius: "8px", border: "2px", shadow: "0 18px 44px rgba(59,130,246,0.18)" },
  { id: "contemporary", name: "Contemporary", surface: "#FFFFFF", ink: "#111827", primary: "#C800DF", secondary: "#E60076", danger: "#DC2626", muted: "#6B7280", radius: "8px", border: "1px", shadow: "0 18px 42px rgba(200,0,223,0.15)" },
  { id: "corporate", name: "Corporate", surface: "#FFFFFF", ink: "#111827", primary: "#3B82F6", secondary: "#8B5CF6", danger: "#DC2626", muted: "#667085", radius: "6px", border: "1px", shadow: "0 16px 36px rgba(15,23,42,0.12)" },
  { id: "cosmic", name: "Cosmic", surface: "#080A1A", ink: "#F8FAFC", primary: "#3B82F6", secondary: "#8B5CF6", danger: "#DC2626", muted: "#A5B4FC", radius: "8px", border: "1px", shadow: "0 0 38px rgba(59,130,246,0.28)" },
];

const DESIGN_SYSTEM_BY_ID = new Map(DESIGN_SYSTEMS.map((system) => [system.id, system]));

function applyDesignSystem(element, designSystemId) {
  const system = DESIGN_SYSTEM_BY_ID.get(designSystemId) || DESIGN_SYSTEM_BY_ID.get(DEFAULT_SETTINGS.designSystem);
  element.setAttribute("data-cp-theme", system.id);
  element.style.setProperty("--cp-surface", system.surface);
  element.style.setProperty("--cp-ink", system.ink);
  element.style.setProperty("--cp-primary", system.primary);
  element.style.setProperty("--cp-secondary", system.secondary);
  element.style.setProperty("--cp-danger", system.danger);
  element.style.setProperty("--cp-muted", system.muted);
  element.style.setProperty("--cp-radius", system.radius);
  element.style.setProperty("--cp-border", system.border);
  element.style.setProperty("--cp-shadow", system.shadow);
}

module.exports = {
  DEFAULT_SETTINGS,
  DESIGN_SYSTEMS,
  DESIGN_SYSTEM_BY_ID,
  applyDesignSystem,
};
