const { Component, MarkdownRenderer, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, requestUrl } = require("obsidian");
const { execFile } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { promisify } = require("util");
const zlib = require("zlib");

let parseIwa = null;
try {
  ({ parseIwa } = require("keynote-parser2/lib/parse/parse-iwa.js"));
} catch (_error) {}

const DEFAULT_SETTINGS = {
  designSystem: "neobrutalism",
  figmaAccessToken: "",
  figmaPreloadPages: 8,
  figmaRenderScale: 2,
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

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif", "svg", "avif", "bmp"]);
const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "m4v", "webm", "ogv", "avi", "mkv"]);
const AUDIO_EXTENSIONS = new Set(["mp3", "m4a", "aac", "wav", "ogg", "opus", "flac"]);
const DOCUMENT_EXTENSIONS = new Set(["pdf"]);
const CONVERTIBLE_EXTENSIONS = new Set(["odp"]);
const KEYNOTE_EXTENSIONS = new Set(["key"]);
const NATIVE_POWERPOINT_EXTENSIONS = new Set(["ppt", "pptx", "pps", "ppsx", "pot", "potx"]);
const MARKDOWN_EXTENSIONS = new Set(["md", "markdown", "deck"]);
const FIGMA_FILE_TYPES = new Set(["design", "board", "proto", "slides", "deck"]);
const PRELOAD_PRESENTATION_LIMIT = 12;
const FIGMA_EXPORT_FORMAT = "png";
const FIGMA_IMAGE_BATCH_SIZE = 40;
const FIGMA_MAX_PRELOAD_PAGES = 24;
const PRESENTATION_CONVERSION_TIMEOUT_MS = 120000;
const POWERPOINT_APP_PATH = "/Applications/Microsoft PowerPoint.app";
const PDF_EXTERNAL_RENDER_DPI = 216;
const SUPPORTED_FILE_EXTENSIONS = new Set([
  ...IMAGE_EXTENSIONS,
  ...VIDEO_EXTENSIONS,
  ...AUDIO_EXTENSIONS,
  ...DOCUMENT_EXTENSIONS,
  ...KEYNOTE_EXTENSIONS,
  ...CONVERTIBLE_EXTENSIONS,
  ...NATIVE_POWERPOINT_EXTENSIONS,
  ...MARKDOWN_EXTENSIONS,
]);
const PRELOAD_ALL_LIMIT = 48;
const PRELOAD_RADIUS = 4;
const execFileAsync = promisify(execFile);

module.exports = class CanvasPlaybackPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
    this.pdfRenderer = new PdfBitmapRenderer(this.app, this.manifest);
    this.pdfRenderer.prepare();
    this.pptxRenderer = new PptxDeckRenderer(this.app);
    this.nativePresentationController = new NativePresentationController(this.app);
    this.presentationConverter = new PresentationPdfCache(this.app, this.manifest);
    this.keynoteRenderer = new KeynoteDeckRenderer(this.app, this.manifest);
    this.figmaSlideCache = new FigmaSlideCache(this.app, this.manifest);
    this.presentationPreloader = new PresentationEmbedPreloader();
    this.addSettingTab(new CanvasPlayerSettingTab(this.app, this));
    this.addCommand({
      id: "play-current-canvas",
      name: "Play Current Canvas",
      hotkeys: [{ modifiers: ["Mod", "Alt"], key: "p" }],
      callback: () => {
        requestCommandFullscreen().catch(() => {});
        this.playCurrentCanvas();
      },
    });
    this.registerEvent(this.app.workspace.on("file-open", (file) => this.scheduleCanvasPresentationPreload(file)));
    this.registerEvent(this.app.workspace.on("active-leaf-change", () => this.scheduleCanvasPresentationPreload(this.getActiveCanvasFile())));
    window.setTimeout(() => this.scheduleCanvasPresentationPreload(this.getActiveCanvasFile()), 500);
  }

  onunload() {
    this.pdfRenderer?.destroy();
    this.pptxRenderer?.destroy();
    this.nativePresentationController?.destroy();
    this.presentationConverter?.destroy();
    this.keynoteRenderer?.destroy();
    this.figmaSlideCache?.destroy();
    this.presentationPreloader?.destroy();
    if (this.presentationPreloadTimer) {
      window.clearTimeout(this.presentationPreloadTimer);
    }
  }

  async playCurrentCanvas() {
    const file = this.getActiveCanvasFile();
    if (!file || file.extension !== "canvas") {
      new Notice("Please open a Canvas file first.");
      return;
    }

    const canvas = await this.readCanvasFile(file);
    if (!canvas) {
      exitFullscreenIfActive();
      return;
    }

    const analysis = await analyzeCanvas(this.app, canvas, this.getPlaybackContext());
    if (analysis.fatal.length > 0) {
      exitFullscreenIfActive();
    }
    this.startPlayback(analysis);
  }

  getActiveCanvasFile() {
    return this.app.workspace.getActiveFile();
  }

  async readCanvasFile(file) {
    try {
      return JSON.parse(await this.app.vault.read(file));
    } catch (error) {
      exitFullscreenIfActive();
      new Notice(`Could not parse Canvas JSON: ${error.message}`);
      return null;
    }
  }

  startPlayback(analysis) {
    if (analysis.fatal.length > 0) {
      exitFullscreenIfActive();
      new CanvasCheckModal(this.app, analysis, null).open();
      return;
    }

    if (analysis.warnings.length > 0) {
      new Notice(`Canvas Playback: ${analysis.warnings.length} warning(s). Some items may use fallback mode or be skipped.`, 5000);
    }

    new CanvasPlayerModal(this.app, analysis.playable, this.pdfRenderer, this.pptxRenderer, this.nativePresentationController, this.settings).open();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    if (!DESIGN_SYSTEM_BY_ID.has(this.settings.designSystem)) {
      this.settings.designSystem = DEFAULT_SETTINGS.designSystem;
    }
    this.settings.figmaPreloadPages = clampInteger(this.settings.figmaPreloadPages, 0, FIGMA_MAX_PRELOAD_PAGES, DEFAULT_SETTINGS.figmaPreloadPages);
    this.settings.figmaRenderScale = clampNumber(this.settings.figmaRenderScale, 1, 3, DEFAULT_SETTINGS.figmaRenderScale);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  scheduleCanvasPresentationPreload(file) {
    if (!file || file.extension !== "canvas") return;
    if (this.presentationPreloadTimer) {
      window.clearTimeout(this.presentationPreloadTimer);
    }
    this.presentationPreloadTimer = window.setTimeout(() => {
      this.preloadCanvasPresentationLinks(file).catch(() => {});
    }, 650);
  }

  async preloadCanvasPresentationLinks(file) {
    const canvas = await this.readCanvasFile(file);
    if (!canvas) return;
    const embeds = await collectPresentationEmbedsFromPlaybackChain(this.app, canvas);
    const figmaEmbeds = embeds.filter((embed) => embed.provider === "figma");
    const liveEmbeds = embeds.filter((embed) => embed.provider !== "figma");

    if (figmaEmbeds.length > 0 && this.settings.figmaAccessToken) {
      await this.figmaSlideCache?.preloadPresentations(figmaEmbeds, {
        token: this.settings.figmaAccessToken,
        maxPages: this.settings.figmaPreloadPages,
        scale: this.settings.figmaRenderScale,
      });
    }

    this.presentationPreloader?.preload(liveEmbeds.map((embed) => embed.url));
  }

  getPlaybackContext() {
    return {
      settings: this.settings,
      pdfRenderer: this.pdfRenderer,
      pptxRenderer: this.pptxRenderer,
      nativePresentationController: this.nativePresentationController,
      presentationConverter: this.presentationConverter,
      keynoteRenderer: this.keynoteRenderer,
      figmaSlideCache: this.figmaSlideCache,
    };
  }
};

function getElectronWindow() {
  try {
    const remote = require("@electron/remote");
    if (remote?.getCurrentWindow) {
      return remote.getCurrentWindow();
    }
  } catch (_e) {}

  try {
    const electron = require("electron");
    if (electron.remote?.getCurrentWindow) {
      return electron.remote.getCurrentWindow();
    }
  } catch (_e) {}
  return null;
}

function isElectronFullscreen() {
  const win = getElectronWindow();
  return win ? win.isFullScreen() : !!document.fullscreenElement;
}

function requestCommandFullscreen() {
  if (isElectronFullscreen()) {
    return Promise.resolve();
  }

  const win = getElectronWindow();
  if (win) {
    win.setFullScreen(true);
    return Promise.resolve();
  }

  const target = document.documentElement;
  return target.requestFullscreen ? target.requestFullscreen() : Promise.resolve();
}

function exitFullscreenIfActive() {
  let exited = false;
  const win = getElectronWindow();
  if (win && win.isFullScreen()) {
    win.setFullScreen(false);
    exited = true;
  }
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
    exited = true;
  }
  return exited;
}

class CanvasPlayerSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Canvas Playback" });

    new Setting(containerEl)
      .setName("Design system")
      .setDesc("Choose the visual system used by the presentation stage and slide index.")
      .addDropdown((dropdown) => {
        for (const system of DESIGN_SYSTEMS) {
          dropdown.addOption(system.id, system.name);
        }
        dropdown
          .setValue(this.plugin.settings.designSystem)
          .onChange(async (value) => {
            this.plugin.settings.designSystem = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Figma access token")
      .setDesc("Optional. Enables Canvas Playback to expand Figma Slides into individual high-resolution steps controlled by Canvas Playback shortcuts.")
      .addText((text) => {
        text.inputEl.type = "password";
        text
          .setPlaceholder("figd_...")
          .setValue(this.plugin.settings.figmaAccessToken || "")
          .onChange(async (value) => {
            this.plugin.settings.figmaAccessToken = value.trim();
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Figma pages to preload")
      .setDesc("Number of Figma slide PNGs to cache in the background when a Canvas opens.")
      .addText((text) => {
        text.inputEl.type = "number";
        text.inputEl.min = "0";
        text.inputEl.max = String(FIGMA_MAX_PRELOAD_PAGES);
        text
          .setPlaceholder(String(DEFAULT_SETTINGS.figmaPreloadPages))
          .setValue(String(this.plugin.settings.figmaPreloadPages))
          .onChange(async (value) => {
            this.plugin.settings.figmaPreloadPages = clampInteger(value, 0, FIGMA_MAX_PRELOAD_PAGES, DEFAULT_SETTINGS.figmaPreloadPages);
            await this.plugin.saveSettings();
          });
      });
  }
}

async function analyzeCanvas(app, canvas, context = DEFAULT_SETTINGS) {
  const runtime = normalizePlaybackContext(context);
  const nodes = Array.isArray(canvas.nodes) ? canvas.nodes : [];
  const edges = Array.isArray(canvas.edges) ? canvas.edges : [];
  const fatal = [];
  const warnings = [];

  if (nodes.length === 0) {
    fatal.push("Current Canvas is empty.");
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const adjacency = new Map(nodes.map((node) => [node.id, []]));
  const incoming = new Map(nodes.map((node) => [node.id, 0]));
  const validEdges = [];

  for (const edge of edges) {
    if (!nodeById.has(edge.fromNode) || !nodeById.has(edge.toNode)) {
      warnings.push(`Edge ${edge.id || "(unnamed)"} points to a missing node.`);
      continue;
    }
    adjacency.get(edge.fromNode).push(edge.toNode);
    incoming.set(edge.toNode, incoming.get(edge.toNode) + 1);
    validEdges.push(edge);
  }

  let orderedNodes = [];
  if (validEdges.length === 0) {
    orderedNodes = [...nodes].sort(compareCanvasPosition);
    warnings.push(edges.length === 0
      ? "Canvas has no connections. Nodes will play from left to right, then top to bottom."
      : "Canvas has no usable connections. Nodes will play from left to right, then top to bottom.");
  } else {
    const start = findPlaybackStart(nodes, adjacency, incoming);
    if (!start) {
      fatal.push("Could not find a start node. Add a node with no incoming edge and at least one outgoing edge.");
    } else {
      orderedNodes = walkSingleChain(start, adjacency, nodeById, fatal, warnings);
    }
  }

  const playable = [];
  for (const node of orderedNodes) {
    const item = await normalizePlayableNode(app, node, runtime);
    if (item.error) {
      warnings.push(item.error);
      continue;
    }
    if (item.warning) {
      warnings.push(item.warning);
    }
    playable.push(...expandPlayableItem(item));
  }

  if (nodes.length > 0 && playable.length === 0 && fatal.length === 0) {
    fatal.push("No playable nodes were found.");
  }

  return { fatal, warnings, playable };
}

function normalizePlaybackContext(context) {
  if (context?.settings || context?.pdfRenderer || context?.pptxRenderer || context?.nativePresentationController || context?.presentationConverter || context?.keynoteRenderer || context?.figmaSlideCache) {
    return {
      settings: Object.assign({}, DEFAULT_SETTINGS, context.settings || {}),
      pdfRenderer: context.pdfRenderer || null,
      pptxRenderer: context.pptxRenderer || null,
      nativePresentationController: context.nativePresentationController || null,
      presentationConverter: context.presentationConverter || null,
      keynoteRenderer: context.keynoteRenderer || null,
      figmaSlideCache: context.figmaSlideCache || null,
    };
  }

  return {
    settings: Object.assign({}, DEFAULT_SETTINGS, context || {}),
    pdfRenderer: null,
    pptxRenderer: null,
    nativePresentationController: null,
    presentationConverter: null,
    keynoteRenderer: null,
    figmaSlideCache: null,
  };
}

async function collectPresentationEmbedsFromPlaybackChain(app, canvas) {
  const nodes = getPlaybackOrderedNodes(canvas);
  const embeds = [];
  const seen = new Set();

  const addEmbeds = (items) => {
    for (const item of items) {
      if (!item || seen.has(item.url)) continue;
      seen.add(item.url);
      embeds.push(item);
      if (embeds.length >= PRELOAD_PRESENTATION_LIMIT) return;
    }
  };

  for (const node of nodes) {
    if (embeds.length >= PRELOAD_PRESENTATION_LIMIT) break;

    if (node.type === "link") {
      const embed = createPresentationEmbed(node.url);
      if (embed) addEmbeds([embed]);
      continue;
    }

    if (node.type === "text") {
      addEmbeds(extractPresentationEmbeds(node.text));
      continue;
    }

    if (node.type === "file" && MARKDOWN_EXTENSIONS.has(getExtension(node.file))) {
      const file = app.metadataCache.getFirstLinkpathDest(node.file, "");
      if (!file) continue;
      try {
        addEmbeds(extractPresentationEmbeds(await app.vault.read(file)));
      } catch (_error) {}
    }
  }

  return embeds;
}

function getPlaybackOrderedNodes(canvas) {
  const nodes = Array.isArray(canvas.nodes) ? canvas.nodes : [];
  const edges = Array.isArray(canvas.edges) ? canvas.edges : [];
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const adjacency = new Map(nodes.map((node) => [node.id, []]));
  const incoming = new Map(nodes.map((node) => [node.id, 0]));
  let hasValidEdges = false;

  for (const edge of edges) {
    if (!nodeById.has(edge.fromNode) || !nodeById.has(edge.toNode)) continue;
    adjacency.get(edge.fromNode).push(edge.toNode);
    incoming.set(edge.toNode, incoming.get(edge.toNode) + 1);
    hasValidEdges = true;
  }

  if (!hasValidEdges) return [...nodes].sort(compareCanvasPosition);

  const start = findPlaybackStart(nodes, adjacency, incoming);
  if (!start) return [];

  const ordered = [];
  const seen = new Set();
  let current = start;
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    ordered.push(current);
    const nextId = (adjacency.get(current.id) || [])[0];
    current = nextId ? nodeById.get(nextId) : null;
  }
  return ordered;
}

function expandPlayableItem(item) {
  if (Array.isArray(item.steps)) {
    return item.steps;
  }

  if (item.type !== "pdf") {
    return [item];
  }

  const pageCount = Math.max(1, item.pages || 1);
  return Array.from({ length: pageCount }, (_value, index) => ({
    ...item,
    type: "pdf-page",
    page: index + 1,
    pageCount,
  }));
}

function compareCanvasPosition(a, b) {
  return (numberOrZero(a.x) - numberOrZero(b.x)) || (numberOrZero(a.y) - numberOrZero(b.y));
}

function numberOrZero(value) {
  return Number.isFinite(value) ? value : 0;
}

function clampInteger(value, min, max, fallback) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function sanitizeCacheSegment(value) {
  return String(value || "untitled")
    .trim()
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96) || "untitled";
}

function createFigmaCacheFingerprint(file, scale) {
  const raw = [
    file?.version || "",
    file?.lastModified || "",
    FIGMA_EXPORT_FORMAT,
    String(scale),
  ].join("|");
  return crypto.createHash("sha1").update(raw).digest("hex").slice(0, 16);
}

function getFigmaFallbackReason(error) {
  const status = Number(error?.status || error?.response?.status || 0);
  if (status === 401 || status === 403) {
    return "The configured token has no permission for this Figma file.";
  }
  if (status === 404) {
    return "The Figma file was not found or is not accessible to this token.";
  }
  if (/file type not supported by this endpoint/i.test(error?.message || "")) {
    return "Figma REST API does not expose this Slides file structure, so Canvas Playback cannot enumerate pages.";
  }
  if (/token/i.test(error?.message || "")) {
    return error.message;
  }
  return error?.message || "Figma API export failed.";
}

function findPlaybackStart(nodes, adjacency, incoming) {
  const starts = nodes
    .filter((node) => incoming.get(node.id) === 0 && adjacency.get(node.id).length > 0)
    .sort(compareCanvasPosition);
  return starts[0] || null;
}

function walkSingleChain(start, adjacency, nodeById, fatal, warnings) {
  const ordered = [];
  const visiting = new Set();
  let current = start;

  while (current) {
    if (visiting.has(current.id)) {
      fatal.push(`Cycle detected at ${getNodeTitle(current)}.`);
      return ordered;
    }
    visiting.add(current.id);
    ordered.push(current);

    const nextIds = adjacency.get(current.id) || [];
    if (nextIds.length > 1) {
      warnings.push(`${getNodeTitle(current)} has multiple outgoing edges. The first edge in the Canvas file will be used.`);
    }
    current = nextIds.length > 0 ? nodeById.get(nextIds[0]) : null;
  }

  return ordered;
}

async function normalizePlayableNode(app, node, context = DEFAULT_SETTINGS) {
  const runtime = normalizePlaybackContext(context);
  if (hasDirective(node, "SKIP") || hasDirective(node, "BACKUP")) {
    return { error: `${getNodeTitle(node)} is marked ${hasDirective(node, "SKIP") ? "SKIP" : "BACKUP"} and will be skipped.` };
  }

  if (node.type === "text") {
    const presentation = extractFirstPresentationEmbed(node.text);
    if (presentation) {
      return await normalizePresentationItem(presentation, node, runtime) || {
        type: "presentation",
        title: presentation.title || getNodeTitle(node),
        node,
        url: presentation.url,
        sourceUrl: presentation.sourceUrl,
        provider: presentation.provider,
      };
    }
    return {
      type: "text",
      title: getNodeTitle(node),
      node,
      text: node.text || "",
    };
  }

  if (node.type === "link") {
    if (!node.url || !/^https?:\/\//i.test(node.url)) {
      return { error: `${getNodeTitle(node)} has an empty or unsupported URL.` };
    }
    const presentation = createPresentationEmbed(node.url);
    if (presentation) {
      return await normalizePresentationItem(presentation, node, runtime) || {
        type: "presentation",
        title: presentation.title || getNodeTitle(node),
        node,
        url: presentation.url,
        sourceUrl: node.url,
        provider: presentation.provider,
      };
    }
    return {
      type: "url",
      title: getNodeTitle(node),
      node,
      url: node.url,
    };
  }

  if (node.type !== "file") {
    return { error: `${getNodeTitle(node)} uses unsupported node type "${node.type}".` };
  }

  if (!node.file) {
    return { error: `${getNodeTitle(node)} has no file path.` };
  }

  const extension = getExtension(node.file);
  if (!SUPPORTED_FILE_EXTENSIONS.has(extension)) {
    return { error: `${node.file} is not a supported MVP format.` };
  }

  const file = app.metadataCache.getFirstLinkpathDest(node.file, "");
  if (!file) {
    return { error: `${node.file} could not be found in the vault.` };
  }

  if (NATIVE_POWERPOINT_EXTENSIONS.has(extension)) {
    if (!runtime?.pptxRenderer) {
      return { error: `${node.file} could not be rendered because the PPTX renderer is unavailable.` };
    }
    try {
      const slideCount = await runtime.pptxRenderer.getSlideCount(file);
      if (!slideCount) {
        return { error: `${node.file} has no renderable slides.` };
      }
      return {
        type: "group",
        title: getNodeTitle(node),
        node,
        provider: "pptx",
        steps: Array.from({ length: slideCount }, (_slide, slideIndex) => ({
          type: "pptx-page",
          title: getNodeTitle(node),
          node,
          file,
          slideIndex,
          page: slideIndex + 1,
          pageCount: slideCount,
        })),
      };
    } catch (error) {
      return { error: error?.message || `${node.file} could not be rendered as PPTX.` };
    }
  }

  if (KEYNOTE_EXTENSIONS.has(extension)) {
    if (!runtime?.keynoteRenderer) {
      return { error: `${node.file} could not be rendered because the Keynote renderer is unavailable.` };
    }
    try {
      const deck = await runtime.keynoteRenderer.getDeck(file);
      if (!deck?.slides?.length) {
        return { error: `${node.file} has no playable Keynote slides.` };
      }
      return {
        type: "group",
        title: getNodeTitle(node),
        node,
        provider: "keynote",
        steps: deck.slides.map((slide, slideIndex) => ({
          type: "keynote-image",
          title: getNodeTitle(node),
          node,
          file,
          cachePath: slide.cachePath,
          page: slideIndex + 1,
          pageCount: deck.slides.length,
        })),
      };
    } catch (error) {
      return { error: error?.message || `${node.file} could not be parsed as Keynote.` };
    }
  }

  if (CONVERTIBLE_EXTENSIONS.has(extension)) {
    let converted = null;
    try {
      converted = await resolvePresentationPdf(app, file, runtime);
    } catch (error) {
      return { error: error?.message || `${node.file} could not be auto-converted.` };
    }
    if (!converted) {
      return { error: `${node.file} could not be converted into a playable PDF.` };
    }
    return await normalizePdfItem(app, node, converted, runtime, { sourceFile: file, converted: true });
  }

  if (IMAGE_EXTENSIONS.has(extension)) {
    return { type: "image", title: getNodeTitle(node), node, file };
  }

  if (VIDEO_EXTENSIONS.has(extension)) {
    return { type: "video", title: getNodeTitle(node), node, file };
  }

  if (AUDIO_EXTENSIONS.has(extension)) {
    return { type: "audio", title: getNodeTitle(node), node, file };
  }

  if (DOCUMENT_EXTENSIONS.has(extension)) {
    return await normalizePdfItem(app, node, file, runtime);
  }

  if (MARKDOWN_EXTENSIONS.has(extension)) {
    const markdown = await app.vault.read(file);
    const presentation = extractFirstPresentationEmbed(markdown);
    if (presentation) {
      return await normalizePresentationItem(presentation, node, runtime) || {
        type: "presentation",
        title: getNodeTitle(node),
        node,
        file,
        url: presentation.url,
        sourceUrl: presentation.sourceUrl,
        provider: presentation.provider,
      };
    }
    return { type: "markdown", title: getNodeTitle(node), node, file };
  }

  return { error: `${node.file} could not be normalized.` };
}

async function normalizePdfItem(app, node, file, runtime, options = {}) {
  const title = getNodeTitle(node);
  const pages = await countPdfPages(app, file);
  if (runtime?.pdfRenderer?.createImageSteps) {
    try {
      const steps = await runtime.pdfRenderer.createImageSteps(file, title, node, pages, options);
      if (steps.length === pages) {
        return {
          type: "group",
          title,
          node,
          provider: "pdf-image",
          steps,
        };
      }
    } catch (_error) {
      // Fall back to PDF.js page rendering when local image rendering is unavailable.
    }
  }

  return {
    type: "pdf",
    title,
    node,
    file,
    sourceFile: options.sourceFile,
    converted: !!options.converted,
    pages,
  };
}

async function normalizePresentationItem(presentation, node, context) {
  if (presentation.provider !== "figma") return null;

  const runtime = normalizePlaybackContext(context);
  const result = await createFigmaSlideSteps(presentation, node, runtime);
  if (result.steps.length === 0) {
    return {
      type: "presentation",
      title: presentation.title || getNodeTitle(node),
      node,
      url: presentation.url,
      sourceUrl: presentation.sourceUrl,
      provider: "figma",
      mode: "live-embed",
      fallbackReason: result.fallbackReason || "Figma could not be exported through the API.",
      warning: `${presentation.title || getNodeTitle(node)} is using Figma Live Embed Mode: ${result.fallbackReason || "Figma could not be exported through the API."} This is not pixel-perfect playback.`,
    };
  }

  return {
    type: "group",
    title: presentation.title || getNodeTitle(node),
    node,
    provider: "figma",
    steps: result.steps,
  };
}

async function countPdfPages(app, file) {
  try {
    const buffer = await readBinaryFromSource(app, file);
    const text = new TextDecoder("latin1").decode(buffer);
    const matches = text.match(/\/Type\s*\/Page\b/g);
    return Math.max(1, matches ? matches.length : 1);
  } catch (_error) {
    return 1;
  }
}

async function findConvertedPdf(app, file) {
  const pathWithoutExtension = file.path.replace(/\.[^/.]+$/, "");
  const direct = app.vault.getAbstractFileByPath(`${pathWithoutExtension}.pdf`);
  if (direct instanceof TFile) return direct;

  const parentPath = file.parent?.path;
  const siblingPath = parentPath ? `${parentPath}/${file.basename}.pdf` : `${file.basename}.pdf`;
  const sibling = app.vault.getAbstractFileByPath(siblingPath);
  return sibling instanceof TFile ? sibling : null;
}

async function resolvePresentationPdf(app, file, runtime) {
  const converted = await findConvertedPdf(app, file);
  if (converted) return converted;

  if (!runtime?.presentationConverter) {
    return null;
  }

  try {
    return await runtime.presentationConverter.getOrCreatePdf(file);
  } catch (error) {
    const reason = error?.message ? ` ${error.message}` : "";
    throw new Error(`${file.path} could not be auto-converted.${reason}`.trim());
  }
}

function isVaultFile(file) {
  return file instanceof TFile;
}

function getSourcePath(file) {
  if (!file) return "";
  if (isVaultFile(file)) return file.path;
  if (typeof file.path === "string") return file.path;
  return String(file);
}

function createExternalFileReference(filePath) {
  return {
    external: true,
    path: filePath,
    name: path.basename(filePath),
  };
}

function getFileCacheKey(file) {
  return isVaultFile(file) ? `vault:${file.path}` : `external:${getSourcePath(file)}`;
}

async function readBinaryFromSource(app, file) {
  if (isVaultFile(file)) {
    return app.vault.readBinary(file);
  }
  return fs.promises.readFile(getSourcePath(file));
}

function getVaultBasePath(app) {
  const adapter = app.vault.adapter;
  if (!adapter.getBasePath) {
    throw new Error("A desktop vault adapter is required.");
  }
  return adapter.getBasePath();
}

function resolveVaultFileAbsolutePath(app, file) {
  return path.join(getVaultBasePath(app), file.path);
}

function resolvePluginDir(app, manifest = {}) {
  const basePath = getVaultBasePath(app);
  const configDir = app.vault.configDir || ".obsidian";
  const candidates = [];

  if (manifest.dir) {
    candidates.push(path.isAbsolute(manifest.dir) ? manifest.dir : path.join(basePath, manifest.dir));
  }
  if (manifest.id) {
    candidates.push(path.join(basePath, configDir, "plugins", manifest.id));
    candidates.push(path.join(basePath, ".obsidian", "plugins", manifest.id));
    candidates.push(path.join(basePath, manifest.id));
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  throw new Error("Plugin folder was not found.");
}

function findExecutableOnPath(commandNames) {
  const pathEntries = [
    ...String(process.env.PATH || "").split(path.delimiter).filter(Boolean),
    "/opt/homebrew/bin",
    "/usr/local/bin",
    "/usr/bin",
    "/bin",
  ];
  for (const commandName of commandNames) {
    if (path.isAbsolute(commandName) && fs.existsSync(commandName)) return commandName;
    for (const entry of pathEntries) {
      const candidate = path.join(entry, commandName);
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return "";
}

async function runOsaScriptLines(lines, args = [], options = {}) {
  const osaArgs = [];
  for (const line of lines) {
    osaArgs.push("-e", line);
  }
  osaArgs.push(...args);
  const result = await execFileAsync("/usr/bin/osascript", osaArgs, {
    timeout: options.timeout || PRESENTATION_CONVERSION_TIMEOUT_MS,
    maxBuffer: options.maxBuffer || 8 * 1024 * 1024,
  });
  return String(result.stdout || "").trim();
}

function getExtension(path) {
  const match = String(path).toLowerCase().match(/\.([^.]+)$/);
  return match ? match[1] : "";
}

function getImageMimeType(filePath) {
  const extension = getExtension(filePath);
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "webp") return "image/webp";
  if (extension === "gif") return "image/gif";
  if (extension === "svg") return "image/svg+xml";
  if (extension === "avif") return "image/avif";
  if (extension === "bmp") return "image/bmp";
  return "image/png";
}

function getNodeTitle(node) {
  if (!node) return "(missing node)";
  if (node.type === "file") return node.file || node.id;
  if (node.type === "link") return node.url || node.id;
  if (node.type === "text") {
    const firstLine = String(node.text || "").split("\n").find(Boolean);
    return firstLine ? firstLine.replace(/^#+\s*/, "").slice(0, 80) : node.id;
  }
  return node.label || node.id;
}

function hasDirective(node, directive) {
  return node.type === "text" && new RegExp(`(^|\\n)\\s*${directive}\\b`, "i").test(node.text || "");
}

class CanvasCheckModal extends Modal {
  constructor(app, analysis, onContinue) {
    super(app);
    this.analysis = analysis;
    this.onContinue = onContinue;
  }

  onOpen() {
    this.titleEl.setText("Canvas Playback Check");
    this.contentEl.empty();

    if (this.analysis.fatal.length > 0) {
      this.contentEl.createEl("p", { text: "Playback is blocked by these issues:" });
      renderIssueList(this.contentEl, this.analysis.fatal);
    } else {
      this.contentEl.createEl("p", { text: "Playback can continue, but these nodes need attention:" });
      renderIssueList(this.contentEl, this.analysis.warnings);
    }

    const actions = this.contentEl.createDiv({ cls: "modal-button-container" });
    actions.createEl("button", { text: "Close" }).addEventListener("click", () => this.close());
    if (this.onContinue) {
      const button = actions.createEl("button", { text: "Continue playback", cls: "mod-cta" });
      button.addEventListener("click", () => {
        this.close();
        this.onContinue();
      });
    }
  }
}

function renderIssueList(container, issues) {
  const list = container.createEl("ul", { cls: "canvas-player-issues" });
  for (const issue of issues) {
    list.createEl("li", { text: issue });
  }
}

function canCreateBrowserObjectUrl() {
  return typeof window !== "undefined"
    && !!window.Blob
    && !!window.URL
    && typeof window.URL.createObjectURL === "function";
}

class PdfBitmapRenderer {
  constructor(app, manifest) {
    this.app = app;
    this.manifest = manifest || {};
    this.pdfjsPromise = null;
    this.documentCache = new Map();
    this.objectUrls = [];
    this.cacheRoot = null;
    this.externalRendererPath = undefined;
  }

  prepare() {
    this.getPdfJs().catch(() => {
      this.pdfjsPromise = null;
    });
  }

  async renderPage(item, slideEl, stageEl) {
    try {
      if (await this.renderPageWithExternalRenderer(item, slideEl)) {
        return;
      }
    } catch (_error) {
      // Fall back to PDF.js below when Poppler is unavailable or rejects a PDF.
    }

    const pdf = await this.getDocument(item.file);
    const page = await pdf.getPage(item.page);
    const baseViewport = page.getViewport({ scale: 1 });
    const width = stageEl.clientWidth || window.innerWidth || 1920;
    const height = stageEl.clientHeight || window.innerHeight || 1080;
    const deviceScale = Math.min(window.devicePixelRatio || 1, 2);
    const fitScale = Math.min(width / baseViewport.width, height / baseViewport.height);
    const viewport = page.getViewport({ scale: fitScale * deviceScale });

    const canvas = slideEl.createEl("canvas", { cls: "canvas-player-pdf-canvas" });
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    canvas.style.width = `${Math.floor(viewport.width / deviceScale)}px`;
    canvas.style.height = `${Math.floor(viewport.height / deviceScale)}px`;

    const context = canvas.getContext("2d", { alpha: false });
    context.save();
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.restore();

    await page.render({
      canvasContext: context,
      viewport,
      background: "white",
    }).promise;
  }

  async createImageSteps(file, title, node, pageCount, options = {}) {
    if (!this.getExternalRendererPath()) return [];
    const cacheInfo = await this.getExternalRenderCacheInfo(file);
    const steps = [];
    for (let index = 0; index < pageCount; index += 1) {
      const page = index + 1;
      steps.push({
        type: "pdf-image",
        title,
        node,
        file,
        sourceFile: options.sourceFile,
        converted: !!options.converted,
        cachePath: this.getExternalRenderedPageTargetPath(cacheInfo, page),
        page,
        pageCount,
      });
    }
    return steps;
  }

  async ensureRenderedImagePath(item) {
    const executable = this.getExternalRendererPath();
    if (!executable) return "";
    return await this.getExternalRenderedPagePath(item, executable);
  }

  async renderPageWithExternalRenderer(item, slideEl) {
    const executable = this.getExternalRendererPath();
    if (!executable) return false;

    const imagePath = await this.getExternalRenderedPagePath(item, executable);
    const img = slideEl.createEl("img", {
      cls: "canvas-player-pdf-image",
      attr: {
        src: pathToFileURL(imagePath).href,
        alt: item.title || `PDF page ${item.page}`,
      },
    });
    img.draggable = false;
    const loaded = await waitForMediaLoad(img);
    if (!loaded) {
      img.remove();
      return false;
    }
    return true;
  }

  async getExternalRenderedPagePath(item, executable) {
    const cacheInfo = await this.getExternalRenderCacheInfo(item.file);
    const page = item.page || 1;
    const targetPath = this.getExternalRenderedPageTargetPath(cacheInfo, page);
    if (this.hasUsableFile(targetPath)) return targetPath;

    const pageLabel = String(page).padStart(3, "0");
    const tempPrefix = path.join(cacheInfo.cacheDir, `render-${pageLabel}-${Date.now()}`);
    const tempPath = `${tempPrefix}.png`;
    try {
      await execFileAsync(executable, [
        "-png",
        "-singlefile",
        "-f", String(page),
        "-l", String(page),
        "-r", String(PDF_EXTERNAL_RENDER_DPI),
        cacheInfo.sourcePath,
        tempPrefix,
      ], {
        timeout: 60000,
        maxBuffer: 8 * 1024 * 1024,
      });
      if (!this.hasUsableFile(tempPath)) {
        throw new Error("pdftoppm did not produce a page image.");
      }
      fs.renameSync(tempPath, targetPath);
      return targetPath;
    } finally {
      if (fs.existsSync(tempPath)) {
        fs.rmSync(tempPath, { force: true });
      }
    }
  }

  async getExternalRenderCacheInfo(file) {
    const sourcePath = this.getSourceAbsolutePath(file);
    const stats = await fs.promises.stat(sourcePath);
    const safeName = sanitizeCacheSegment(path.parse(sourcePath).name || "pdf");
    const fingerprint = crypto.createHash("sha1")
      .update([sourcePath, String(stats.size), String(Math.trunc(stats.mtimeMs)), String(PDF_EXTERNAL_RENDER_DPI)].join("|"))
      .digest("hex")
      .slice(0, 16);
    const cacheDir = path.join(this.getCacheRoot(), `${safeName}-${fingerprint}`);
    fs.mkdirSync(cacheDir, { recursive: true });
    return { sourcePath, cacheDir };
  }

  getExternalRenderedPageTargetPath(cacheInfo, page) {
    return path.join(cacheInfo.cacheDir, `page-${String(page || 1).padStart(3, "0")}.png`);
  }

  getSourceAbsolutePath(file) {
    if (isVaultFile(file)) return resolveVaultFileAbsolutePath(this.app, file);
    return getSourcePath(file);
  }

  getExternalRendererPath() {
    if (this.externalRendererPath !== undefined) return this.externalRendererPath;
    this.externalRendererPath = findExecutableOnPath(["pdftoppm"]);
    return this.externalRendererPath;
  }

  getCacheRoot() {
    if (this.cacheRoot) return this.cacheRoot;
    this.cacheRoot = path.join(resolvePluginDir(this.app, this.manifest), "cache", "pdf-pages");
    fs.mkdirSync(this.cacheRoot, { recursive: true });
    return this.cacheRoot;
  }

  hasUsableFile(filePath) {
    try {
      return fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
    } catch (_error) {
      return false;
    }
  }

  async getDocument(file) {
    const cacheKey = getFileCacheKey(file);
    if (!this.documentCache.has(cacheKey)) {
      this.documentCache.set(cacheKey, this.loadDocument(file));
    }
    return this.documentCache.get(cacheKey);
  }

  async loadDocument(file) {
    const pdfjs = await this.getPdfJs();
    const data = new Uint8Array(await readBinaryFromSource(this.app, file));
    const resourceUrls = this.getPdfResourceUrls();
    return pdfjs.getDocument({
      data,
      useSystemFonts: true,
      cMapUrl: resourceUrls.cMapUrl,
      cMapPacked: true,
      standardFontDataUrl: resourceUrls.standardFontDataUrl,
      disableAutoFetch: false,
      disableStream: false,
    }).promise;
  }

  async getPdfJs() {
    if (!this.pdfjsPromise) {
      this.pdfjsPromise = this.loadPdfJs().catch((error) => {
        this.pdfjsPromise = null;
        throw error;
      });
    }
    return this.pdfjsPromise;
  }

  async loadPdfJs() {
    const adapter = this.app.vault.adapter;
    if (!adapter.getBasePath) {
      throw new Error("PDF bitmap rendering needs a desktop vault adapter.");
    }

    const vendorDir = this.resolveVendorDir(adapter.getBasePath());
    const modulePath = path.join(vendorDir, "pdf.min.mjs");
    const workerPath = path.join(vendorDir, "pdf.worker.min.mjs");
    const pdfjs = await this.importPdfJsModule(modulePath);
    pdfjs.GlobalWorkerOptions.workerSrc = this.createScriptUrl(workerPath);
    return pdfjs;
  }

  async importPdfJsModule(modulePath) {
    const source = `${fs.readFileSync(modulePath, "utf8")}\n//# sourceURL=${pathToFileURL(modulePath).href}`;

    if (canCreateBrowserObjectUrl()) {
      try {
        return await import(this.createObjectUrl(source, "text/javascript"));
      } catch (_error) {
        // Some Electron shells block blob module imports. Fall through to data/file URLs.
      }
    }

    if (typeof Buffer !== "undefined") {
      try {
        return await import(`data:text/javascript;base64,${Buffer.from(source, "utf8").toString("base64")}`);
      } catch (_error) {
        // Keep the original file URL path as the final fallback.
      }
    }

    return import(pathToFileURL(modulePath).href);
  }

  createScriptUrl(filePath) {
    if (canCreateBrowserObjectUrl()) {
      return this.createObjectUrl(fs.readFileSync(filePath, "utf8"), "text/javascript");
    }

    return pathToFileURL(filePath).href;
  }

  createObjectUrl(source, type) {
    const objectUrl = window.URL.createObjectURL(new window.Blob([source], { type }));
    this.objectUrls.push(objectUrl);
    return objectUrl;
  }

  destroy() {
    for (const objectUrl of this.objectUrls) {
      window.URL.revokeObjectURL(objectUrl);
    }
    this.objectUrls = [];
    this.documentCache.clear();
    this.pdfjsPromise = null;
    this.externalRendererPath = undefined;
  }

  resolveVendorDir(basePath) {
    const configDir = this.app.vault.configDir || ".obsidian";
    const candidates = [];

    if (this.manifest.dir) {
      candidates.push(path.isAbsolute(this.manifest.dir) ? this.manifest.dir : path.join(basePath, this.manifest.dir));
    }
    if (this.manifest.id) {
      candidates.push(path.join(basePath, configDir, "plugins", this.manifest.id));
      candidates.push(path.join(basePath, ".obsidian", "plugins", this.manifest.id));
      candidates.push(path.join(basePath, this.manifest.id));
    }

    for (const candidate of candidates) {
      const vendorDir = path.join(candidate, "vendor", "pdfjs");
      if (fs.existsSync(path.join(vendorDir, "pdf.min.mjs")) && fs.existsSync(path.join(vendorDir, "pdf.worker.min.mjs"))) {
        return vendorDir;
      }
    }

    throw new Error("PDF.js vendor files were not found in the plugin folder.");
  }

  getPdfResourceUrls() {
    const vendorDir = this.resolveVendorDir(this.app.vault.adapter.getBasePath());
    const cMapDir = path.join(vendorDir, "cmaps");
    const standardFontDir = path.join(vendorDir, "standard_fonts");
    return {
      cMapUrl: fs.existsSync(cMapDir) ? `${pathToFileURL(cMapDir).href}/` : undefined,
      standardFontDataUrl: fs.existsSync(standardFontDir) ? `${pathToFileURL(standardFontDir).href}/` : undefined,
    };
  }
}

const PPTX_EMUS_PER_INCH = 914400;
const PPTX_BASE_DPI = 96;
const PPTX_REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

class PptxDeckRenderer {
  constructor(app) {
    this.app = app;
    this.deckCache = new Map();
    this.slideCountCache = new Map();
    this.rendererModulePromise = null;
    this.mediaObjectUrls = new Set();
  }

  async getDeck(file) {
    const cacheKey = `${file.path}:${file.stat?.mtime || 0}:${file.stat?.size || 0}`;
    if (!this.deckCache.has(cacheKey)) {
      this.deckCache.set(cacheKey, this.loadDeck(file, cacheKey));
    }
    return this.deckCache.get(cacheKey);
  }

  async getSlideCount(file) {
    const cacheKey = `${file.path}:${file.stat?.mtime || 0}:${file.stat?.size || 0}`;
    if (this.slideCountCache.has(cacheKey)) return this.slideCountCache.get(cacheKey);
    const buffer = Buffer.from(await this.app.vault.readBinary(file));
    const zip = new SimpleZipArchive(buffer);
    const slideNumbers = Array.from(zip.entries.keys())
      .map((entry) => entry.match(/^ppt\/slides\/slide(\d+)\.xml$/))
      .filter(Boolean)
      .map((match) => Number(match[1]))
      .filter(Number.isFinite);
    const count = slideNumbers.length ? new Set(slideNumbers).size : 0;
    this.slideCountCache.set(cacheKey, count);
    return count;
  }

  async loadDeck(file, cacheKey) {
    const { parseZip, buildPresentation, RECOMMENDED_ZIP_LIMITS } = await this.getRendererModule();
    const buffer = await this.app.vault.readBinary(file);
    const files = await parseZip(buffer, RECOMMENDED_ZIP_LIMITS);
    const presentation = buildPresentation(files);
    return {
      cacheKey,
      filePath: file.path,
      presentation,
      slides: Array.isArray(presentation?.slides) ? presentation.slides : [],
    };
  }

  async renderPage(item, slideEl, stageEl, options = {}) {
    const deck = await this.getDeck(item.file);
    const { renderSlide } = await this.getRendererModule();
    const slide = deck.slides[item.slideIndex];
    if (!slide) {
      throw new Error(`PPTX slide ${item.slideIndex + 1} could not be found.`);
    }

    const baseWidth = Number(deck.presentation?.width) || 960;
    const baseHeight = Number(deck.presentation?.height) || 540;
    const viewportWidth = stageEl.clientWidth || window.innerWidth || 1920;
    const viewportHeight = stageEl.clientHeight || window.innerHeight || 1080;
    const fitScale = Math.min(viewportWidth / baseWidth, viewportHeight / baseHeight);
    const shellWidth = Math.max(1, Math.round(baseWidth * fitScale));
    const shellHeight = Math.max(1, Math.round(baseHeight * fitScale));

    const shell = slideEl.createDiv({ cls: "canvas-player-pptx-shell" });
    const frame = shell.createDiv({ cls: "canvas-player-pptx-stage" });
    frame.style.width = `${shellWidth}px`;
    frame.style.height = `${shellHeight}px`;

    const handle = renderSlide(deck.presentation, slide, {
      onNavigate: options.onNavigate,
      mediaUrlCache: deck.mediaUrlCache || (deck.mediaUrlCache = new Map()),
    });
    handle.element.style.transform = `scale(${fitScale})`;
    handle.element.style.transformOrigin = "top left";
    frame.appendChild(handle.element);

    const mountedMedia = this.mountPptxMediaOverlay(deck.presentation, slide, handle.element);
    if (handle.ready?.catch) {
      handle.ready.catch((error) => {
        console.error("[canvas-playback] PPTX async slide resource failed", error);
      });
    }

    return () => {
      mountedMedia?.cleanup();
      handle.dispose?.();
    };
  }

  async getRendererModule() {
    if (!this.rendererModulePromise) {
      this.rendererModulePromise = Promise.resolve().then(() => require("@aiden0z/pptx-renderer"));
    }
    return this.rendererModulePromise;
  }

  mountPptxMediaOverlay(presentation, slide, slideEl) {
    const refs = this.resolvePptxSlideMedia(presentation, slide);
    if (refs.length === 0) return null;

    if (getComputedStyle(slideEl).position === "static") {
      slideEl.style.position = "relative";
    }

    const layer = slideEl.createDiv({ cls: "canvas-player-pptx-media-layer" });
    const elements = [];
    for (const ref of refs) {
      const wrap = layer.createDiv({ cls: "canvas-player-pptx-media-item" });
      wrap.style.left = `${ref.leftPct}%`;
      wrap.style.top = `${ref.topPct}%`;
      wrap.style.width = `${ref.widthPct}%`;
      wrap.style.height = `${ref.heightPct}%`;

      let mediaEl;
      if (ref.kind === "video") {
        mediaEl = wrap.createEl("video", { cls: "canvas-player-pptx-media" });
        mediaEl.src = ref.url;
        if (ref.posterUrl) mediaEl.poster = ref.posterUrl;
        mediaEl.controls = true;
        mediaEl.playsInline = true;
        mediaEl.preload = "metadata";
      } else {
        mediaEl = wrap.createEl("audio", { cls: "canvas-player-pptx-media" });
        mediaEl.src = ref.url;
        mediaEl.controls = true;
        mediaEl.preload = "metadata";
      }
      mediaEl.setAttribute("aria-label", ref.name || "PPTX media");
      elements.push(mediaEl);
    }

    return {
      cleanup: () => {
        for (const element of elements) {
          try {
            if (!element.paused) element.pause();
            element.removeAttribute("src");
            element.load();
          } catch (_error) {}
        }
        layer.remove();
      },
    };
  }

  resolvePptxSlideMedia(presentation, slide) {
    const refs = [];
    const width = Number(presentation?.width) || 1;
    const height = Number(presentation?.height) || 1;
    for (const node of slide?.nodes || []) {
      if (node?.nodeType !== "picture") continue;
      if (!node.isVideo && !node.isAudio) continue;
      if (!node.mediaRId) continue;

      const rel = slide.rels?.get?.(node.mediaRId);
      if (!rel?.target) continue;
      const url = this.getPptxMediaUrl(presentation, rel.target);
      if (!url) continue;

      let posterUrl;
      if (node.isVideo && node.blipEmbed) {
        const posterRel = slide.rels?.get?.(node.blipEmbed);
        if (posterRel?.target) posterUrl = this.getPptxMediaUrl(presentation, posterRel.target);
      }

      refs.push({
        kind: node.isVideo ? "video" : "audio",
        url,
        posterUrl,
        name: node.name || node.id || "PPTX media",
        leftPct: ((node.position?.x || 0) / width) * 100,
        topPct: ((node.position?.y || 0) / height) * 100,
        widthPct: ((node.size?.w || 0) / width) * 100,
        heightPct: ((node.size?.h || 0) / height) * 100,
      });
    }
    return refs;
  }

  getPptxMediaUrl(presentation, relTarget) {
    if (!presentation?.media || !relTarget) return "";
    const key = `ppt/media/${String(relTarget).split("/").pop() || ""}`;
    const existing = presentation.mediaObjectUrls?.get?.(key);
    if (existing) return existing;
    const bytes = presentation.media.get(key);
    if (!bytes) return "";
    const objectUrl = window.URL.createObjectURL(new window.Blob([bytes], {
      type: mimeTypeFromPath(key),
    }));
    this.mediaObjectUrls.add(objectUrl);
    if (!presentation.mediaObjectUrls) presentation.mediaObjectUrls = new Map();
    presentation.mediaObjectUrls.set(key, objectUrl);
    return objectUrl;
  }

  destroy() {
    for (const objectUrl of this.mediaObjectUrls) {
      window.URL.revokeObjectURL(objectUrl);
    }
    this.mediaObjectUrls.clear();
    this.deckCache.clear();
    this.slideCountCache.clear();
    this.rendererModulePromise = null;
  }
}

function applyPptxBoxStyle(element, box, scale) {
  element.style.position = "absolute";
  element.style.left = `${Math.round((box.xPx || 0) * scale)}px`;
  element.style.top = `${Math.round((box.yPx || 0) * scale)}px`;
  element.style.width = `${Math.max(1, Math.round((box.widthPx || 0) * scale))}px`;
  element.style.height = `${Math.max(1, Math.round((box.heightPx || 0) * scale))}px`;
  if (box.fillColor) {
    element.style.background = box.fillColor;
  }
  if (box.borderColor) {
    element.style.border = `${Math.max(1, Math.round(scale))}px solid ${box.borderColor}`;
  }
}

class SimpleZipArchive {
  constructor(buffer) {
    this.buffer = Buffer.from(buffer);
    this.entries = buildZipEntries(this.buffer);
  }

  exists(filePath) {
    return this.entries.has(filePath);
  }

  readBinary(filePath) {
    const entry = this.entries.get(filePath);
    if (!entry) {
      throw new Error(`Missing ZIP entry: ${filePath}`);
    }
    const data = this.buffer.slice(entry.dataOffset, entry.dataOffset + entry.compressedSize);
    if (entry.compressionMethod === 0) {
      return Buffer.from(data);
    }
    if (entry.compressionMethod === 8) {
      return zlib.inflateRawSync(data);
    }
    throw new Error(`Unsupported ZIP compression method ${entry.compressionMethod} for ${filePath}`);
  }

  readText(filePath) {
    return this.readBinary(filePath).toString("utf8");
  }
}

function buildZipEntries(buffer) {
  const entries = new Map();
  const eocdOffset = findZipEndOfCentralDirectory(buffer);
  const directorySize = buffer.readUInt32LE(eocdOffset + 12);
  const directoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  let cursor = directoryOffset;
  const end = directoryOffset + directorySize;

  while (cursor < end) {
    if (buffer.readUInt32LE(cursor) !== 0x02014b50) {
      throw new Error("PPTX ZIP central directory is invalid.");
    }

    const compressionMethod = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const fileNameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localHeaderOffset = buffer.readUInt32LE(cursor + 42);
    const fileName = buffer.slice(cursor + 46, cursor + 46 + fileNameLength).toString("utf8");

    if (!fileName.endsWith("/")) {
      if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
        throw new Error(`PPTX ZIP local header is invalid for ${fileName}.`);
      }
      const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
      const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
      entries.set(fileName, {
        compressionMethod,
        compressedSize,
        dataOffset,
      });
    }

    cursor += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function findZipEndOfCentralDirectory(buffer) {
  for (let offset = buffer.length - 22; offset >= Math.max(0, buffer.length - 65557); offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      return offset;
    }
  }
  throw new Error("PPTX ZIP end of central directory could not be found.");
}

function findKeynoteMessage(parsed, protoName) {
  for (const archive of Object.values(parsed || {})) {
    const match = (archive.messages || []).find((message) => message.messageProtoName === protoName);
    if (match) return match.message;
  }
  return null;
}

function findKeynoteArchiveMessage(parsed, archiveIdentifier, protoName) {
  if (archiveIdentifier == null) return null;
  const archive = parsed?.[String(archiveIdentifier)];
  if (!archive) return null;
  const match = (archive.messages || []).find((message) => message.messageProtoName === protoName);
  return match ? match.message : null;
}

function buildKeynoteDataEntryMap(zip) {
  const entryById = new Map();
  for (const entryName of zip.entries.keys()) {
    const match = entryName.match(/^Data\/.+-(\d+)\.[^.]+$/);
    if (match) {
      entryById.set(match[1], entryName);
    }
  }
  return entryById;
}

function parsePptxDeck(zip, file, cacheKey) {
  const presentationDoc = parseXmlDocument(zip.readText("ppt/presentation.xml"));
  const presentationRels = parsePackageRelationships(zip, "ppt/presentation.xml");
  const slideSizeNode = firstDescendant(presentationDoc.documentElement, "sldSz");
  const slideSize = {
    cx: parseNumber(getAttr(slideSizeNode, "cx"), 9144000),
    cy: parseNumber(getAttr(slideSizeNode, "cy"), 6858000),
  };

  const context = {
    zip,
    theme: parsePptxTheme(zip),
    layoutCache: new Map(),
    masterCache: new Map(),
  };

  const slideNodes = Array.from(presentationDoc.getElementsByTagNameNS("*", "sldId"));
  const slides = slideNodes.map((slideNode) => {
    const relId = getAttr(slideNode, "id", PPTX_REL_NS);
    const rel = presentationRels.get(relId);
    if (!rel?.target) {
      throw new Error("A PPTX slide relationship is missing.");
    }
    return parsePptxSlide(context, rel.target, slideSize);
  });

  return {
    cacheKey,
    filePath: file.path,
    slideSize,
    slides,
  };
}

function parsePptxSlide(context, slidePath, slideSize) {
  const slideDoc = parseXmlDocument(context.zip.readText(slidePath));
  const relationships = parsePackageRelationships(context.zip, slidePath);
  const layoutRel = findRelationshipByType(relationships, "slideLayout");
  const layout = layoutRel?.target ? parsePptxLayout(context, layoutRel.target) : null;
  const master = layout?.master || null;
  const background = parseSlideBackground(slideDoc.documentElement, context.theme, master?.colorMap) || layout?.background || master?.background || "#FFFFFF";

  const spTree = firstDescendant(slideDoc.documentElement, "spTree");
  const elements = [];

  for (const child of localChildren(spTree)) {
    if (child.localName === "sp") {
      const textShape = parsePptxTextShape(context, child, layout, master, slideSize);
      if (textShape) elements.push(textShape);
      continue;
    }
    if (child.localName === "pic") {
      const imageShape = parsePptxPictureShape(context, child, relationships, slideSize);
      if (imageShape) elements.push(imageShape);
    }
  }

  return { background, elements };
}

function parsePptxLayout(context, layoutPath) {
  if (context.layoutCache.has(layoutPath)) return context.layoutCache.get(layoutPath);

  const doc = parseXmlDocument(context.zip.readText(layoutPath));
  const relationships = parsePackageRelationships(context.zip, layoutPath);
  const masterRel = findRelationshipByType(relationships, "slideMaster");
  const master = masterRel?.target ? parsePptxMaster(context, masterRel.target) : null;
  const layout = {
    placeholders: parsePptxPlaceholderMap(doc.documentElement, context.theme, master?.colorMap),
    background: parseSlideBackground(doc.documentElement, context.theme, master?.colorMap),
    master,
  };
  context.layoutCache.set(layoutPath, layout);
  return layout;
}

function parsePptxMaster(context, masterPath) {
  if (context.masterCache.has(masterPath)) return context.masterCache.get(masterPath);

  const doc = parseXmlDocument(context.zip.readText(masterPath));
  const colorMapNode = firstDescendant(doc.documentElement, "clrMap");
  const colorMap = {};
  if (colorMapNode) {
    for (const attr of Array.from(colorMapNode.attributes || [])) {
      colorMap[attr.name] = attr.value;
    }
  }

  const master = {
    colorMap,
    background: parseSlideBackground(doc.documentElement, context.theme, colorMap),
    placeholders: parsePptxPlaceholderMap(doc.documentElement, context.theme, colorMap),
  };
  context.masterCache.set(masterPath, master);
  return master;
}

function parsePptxPlaceholderMap(root, theme, colorMap) {
  const map = new Map();
  const spTree = firstDescendant(root, "spTree");
  for (const child of localChildren(spTree)) {
    if (child.localName !== "sp") continue;
    const placeholder = readPlaceholderRef(child);
    if (!placeholder) continue;
    map.set(makePlaceholderKey(placeholder), buildShapePrototype(child, theme, colorMap));
  }
  return map;
}

function parsePptxTextShape(context, shapeNode, layout, master, slideSize) {
  const placeholder = readPlaceholderRef(shapeNode);
  const inherited = resolveInheritedPlaceholder(placeholder, layout, master);
  const transform = parseShapeTransform(shapeNode) || inherited?.transform;
  if (!transform) return null;

  const textBody = firstDescendant(shapeNode, "txBody") || inherited?.textBody || null;
  const text = extractTextBodyText(textBody);
  if (!text) return null;

  const style = parseTextShapeStyle(shapeNode, textBody, inherited, context.theme, master?.colorMap, placeholder);
  return {
    type: "text",
    text,
    xPx: emuToPx(transform.x),
    yPx: emuToPx(transform.y),
    widthPx: emuToPx(transform.cx),
    heightPx: emuToPx(transform.cy),
    fillColor: style.fillColor,
    borderColor: style.borderColor,
    color: style.color,
    fontFamily: style.fontFamily,
    fontSizePx: style.fontSizePx,
    bold: style.bold,
    italic: style.italic,
    align: style.align,
    verticalAlign: style.verticalAlign,
    paddingPx: style.paddingPx,
  };
}

function parsePptxPictureShape(context, picNode, relationships) {
  const transform = parsePictureTransform(picNode);
  if (!transform) return null;
  const blip = firstDescendant(picNode, "blip");
  const relId = getAttr(blip, "embed", PPTX_REL_NS);
  const rel = relationships.get(relId);
  if (!rel?.target) return null;
  const buffer = context.zip.readBinary(rel.target);
  return {
    type: "image",
    xPx: emuToPx(transform.x),
    yPx: emuToPx(transform.y),
    widthPx: emuToPx(transform.cx),
    heightPx: emuToPx(transform.cy),
    src: `data:${mimeTypeFromPath(rel.target)};base64,${buffer.toString("base64")}`,
    alt: getAttr(firstDescendant(picNode, "cNvPr"), "descr") || getAttr(firstDescendant(picNode, "cNvPr"), "name") || "",
  };
}

function buildShapePrototype(shapeNode, theme, colorMap) {
  const textBody = firstDescendant(shapeNode, "txBody");
  const style = parseTextShapeStyle(shapeNode, textBody, null, theme, colorMap, readPlaceholderRef(shapeNode));
  return {
    transform: parseShapeTransform(shapeNode),
    textBody,
    fillColor: style.fillColor,
    borderColor: style.borderColor,
    color: style.color,
    fontFamily: style.fontFamily,
    fontSizePx: style.fontSizePx,
    bold: style.bold,
    italic: style.italic,
    align: style.align,
    verticalAlign: style.verticalAlign,
    paddingPx: style.paddingPx,
  };
}

function resolveInheritedPlaceholder(placeholder, layout, master) {
  if (!placeholder) return null;
  const key = makePlaceholderKey(placeholder);
  const aliases = [key];
  if (placeholder.type === "ctrTitle") aliases.push(makePlaceholderKey({ type: "title", idx: placeholder.idx }));
  if (placeholder.type === "title") aliases.push(makePlaceholderKey({ type: "ctrTitle", idx: placeholder.idx }));
  for (const alias of aliases) {
    if (layout?.placeholders?.has(alias)) return layout.placeholders.get(alias);
    if (master?.placeholders?.has(alias)) return master.placeholders.get(alias);
  }
  return null;
}

function parseTextShapeStyle(shapeNode, textBody, inherited, theme, colorMap, placeholder) {
  const bodyPr = firstDescendant(textBody, "bodyPr");
  const firstParagraph = firstDescendant(textBody, "p");
  const paragraphProps = firstDescendant(firstParagraph, "pPr");
  const paragraphDefRun = firstDescendant(paragraphProps, "defRPr");
  const levelStyle = firstDescendant(firstDescendant(textBody, "lstStyle"), "lvl1pPr");
  const levelDefRun = firstDescendant(levelStyle, "defRPr");
  const firstRun = firstDescendant(firstParagraph, "r") || firstDescendant(firstParagraph, "fld");
  const runProps = firstDescendant(firstRun, "rPr");
  const inheritedColor = inherited?.color || (isTitlePlaceholder(placeholder) ? "#111111" : "#333333");
  const fontSize = pickFirstFinite([
    ooXmlFontSizeToPx(getAttr(runProps, "sz")),
    ooXmlFontSizeToPx(getAttr(paragraphDefRun, "sz")),
    ooXmlFontSizeToPx(getAttr(levelDefRun, "sz")),
    inherited?.fontSizePx,
    defaultFontSizeForPlaceholder(placeholder),
  ], 22);

  return {
    fillColor: parseSolidFillColor(firstDescendant(shapeNode, "spPr"), theme, colorMap) || inherited?.fillColor || "",
    borderColor: parseLineColor(firstDescendant(shapeNode, "spPr"), theme, colorMap) || inherited?.borderColor || "",
    color: parseRunColor(runProps, paragraphDefRun, theme, colorMap) || parseColorContainer(levelDefRun, theme, colorMap) || inheritedColor,
    fontFamily: parseRunFontFamily(runProps, theme) || inherited?.fontFamily || "\"Aptos\", \"Calibri\", sans-serif",
    fontSizePx: fontSize,
    bold: parseBooleanAttr(runProps, "b", parseBooleanAttr(levelDefRun, "b", inherited?.bold || isTitlePlaceholder(placeholder))),
    italic: parseBooleanAttr(runProps, "i", inherited?.italic || false),
    align: normalizeTextAlign(getAttr(paragraphProps, "algn") || getAttr(levelStyle, "algn") || inherited?.align || (isTitlePlaceholder(placeholder) ? "center" : "left")),
    verticalAlign: normalizeVerticalAlign(getAttr(bodyPr, "anchor") || inherited?.verticalAlign || (isTitlePlaceholder(placeholder) ? "center" : "flex-start")),
    paddingPx: inherited?.paddingPx || 12,
  };
}

function parseSlideBackground(root, theme, colorMap) {
  const bg = firstDescendant(root, "bg");
  if (!bg) return "";
  const bgPr = firstDescendant(bg, "bgPr");
  if (bgPr) {
    return parseColorContainer(bgPr, theme, colorMap) || "";
  }
  const bgRef = firstDescendant(bg, "bgRef");
  if (bgRef) {
    const scheme = firstDescendant(bgRef, "schemeClr");
    return resolveColorNode(scheme, theme, colorMap) || "";
  }
  return "";
}

function parseSolidFillColor(spPr, theme, colorMap) {
  if (!spPr) return "";
  if (firstDescendant(spPr, "noFill")) return "transparent";
  return parseColorContainer(spPr, theme, colorMap) || "";
}

function parseLineColor(spPr, theme, colorMap) {
  const ln = firstDescendant(spPr, "ln");
  if (!ln || firstDescendant(ln, "noFill")) return "";
  return parseColorContainer(ln, theme, colorMap) || "";
}

function parseColorContainer(node, theme, colorMap) {
  if (!node) return "";
  const solidFill = firstDescendant(node, "solidFill");
  if (!solidFill) return "";
  for (const child of localChildren(solidFill)) {
    const color = resolveColorNode(child, theme, colorMap);
    if (color) return color;
  }
  return "";
}

function parseRunColor(runProps, paragraphDefRun, theme, colorMap) {
  const direct = parseColorContainer(runProps, theme, colorMap);
  if (direct) return direct;
  return parseColorContainer(paragraphDefRun, theme, colorMap);
}

function parseRunFontFamily(runProps, theme) {
  const latin = firstDescendant(runProps, "latin");
  const typeface = getAttr(latin, "typeface");
  if (typeface) return mapThemeTypeface(typeface, theme);
  return "";
}

function resolveColorNode(node, theme, colorMap = {}) {
  if (!node) return "";
  if (node.localName === "srgbClr") {
    return `#${String(getAttr(node, "val") || "").padStart(6, "0")}`;
  }
  if (node.localName === "sysClr") {
    const value = getAttr(node, "lastClr");
    return value ? `#${value}` : "";
  }
  if (node.localName === "schemeClr") {
    const scheme = getAttr(node, "val");
    const mappedScheme = colorMap?.[scheme] || scheme;
    const base = theme.colors[mappedScheme] || theme.colors[scheme] || "";
    return applyColorTransforms(base, node);
  }
  return "";
}

function applyColorTransforms(color, node) {
  if (!color || !node) return color;
  let [r, g, b] = hexToRgb(color);
  for (const child of localChildren(node)) {
    const value = parseNumber(getAttr(child, "val"), 0);
    if (child.localName === "tint") {
      r = Math.round(r + ((255 - r) * value / 100000));
      g = Math.round(g + ((255 - g) * value / 100000));
      b = Math.round(b + ((255 - b) * value / 100000));
    } else if (child.localName === "shade") {
      r = Math.round(r * value / 100000);
      g = Math.round(g * value / 100000);
      b = Math.round(b * value / 100000);
    }
  }
  return rgbToHex(r, g, b);
}

function parsePptxTheme(zip) {
  const themePath = zip.exists("ppt/theme/theme1.xml")
    ? "ppt/theme/theme1.xml"
    : Array.from(zip.entries.keys()).find((entry) => entry.startsWith("ppt/theme/") && entry.endsWith(".xml"));
  if (!themePath) {
    return defaultPptxTheme();
  }
  const doc = parseXmlDocument(zip.readText(themePath));
  const clrScheme = firstDescendant(doc.documentElement, "clrScheme");
  const colors = {};
  for (const child of localChildren(clrScheme)) {
    const colorNode = localChildren(child)[0];
    const color = resolveColorNode(colorNode, { colors: {} }, {});
    if (color) colors[child.localName] = color;
  }
  const majorFont = firstDescendant(doc.documentElement, "majorFont");
  const minorFont = firstDescendant(doc.documentElement, "minorFont");
  return {
    colors: Object.assign(defaultPptxTheme().colors, colors),
    majorLatin: getAttr(firstDescendant(majorFont, "latin"), "typeface") || "Calibri",
    minorLatin: getAttr(firstDescendant(minorFont, "latin"), "typeface") || "Calibri",
  };
}

function defaultPptxTheme() {
  return {
    colors: {
      dk1: "#000000",
      lt1: "#FFFFFF",
      dk2: "#1F497D",
      lt2: "#EEECE1",
      accent1: "#4F81BD",
      accent2: "#C0504D",
      accent3: "#9BBB59",
      accent4: "#8064A2",
      accent5: "#4BACC6",
      accent6: "#F79646",
      bg1: "#FFFFFF",
      tx1: "#000000",
      bg2: "#EEECE1",
      tx2: "#1F497D",
    },
    majorLatin: "Calibri",
    minorLatin: "Calibri",
  };
}

function parsePackageRelationships(zip, sourcePath) {
  const map = new Map();
  const relsPath = buildRelationshipsPath(sourcePath);
  if (!zip.exists(relsPath)) return map;
  const doc = parseXmlDocument(zip.readText(relsPath));
  for (const relationship of Array.from(doc.getElementsByTagNameNS("*", "Relationship"))) {
    const id = getAttr(relationship, "Id");
    const type = getAttr(relationship, "Type") || "";
    const target = resolveZipTarget(sourcePath, getAttr(relationship, "Target") || "");
    map.set(id, { type, target });
  }
  return map;
}

function buildRelationshipsPath(sourcePath) {
  const dir = path.posix.dirname(sourcePath);
  const fileName = path.posix.basename(sourcePath);
  return path.posix.join(dir, "_rels", `${fileName}.rels`);
}

function resolveZipTarget(sourcePath, target) {
  return path.posix.normalize(path.posix.join(path.posix.dirname(sourcePath), target));
}

function findRelationshipByType(relationships, suffix) {
  for (const relationship of relationships.values()) {
    if (relationship.type.endsWith(`/${suffix}`)) return relationship;
  }
  return null;
}

function parseXmlDocument(text) {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  const parserError = doc.getElementsByTagName("parsererror")[0];
  if (parserError) {
    throw new Error(`Invalid PPTX XML: ${parserError.textContent || "parse error"}`);
  }
  return doc;
}

function localChildren(node) {
  if (!node?.childNodes) return [];
  return Array.from(node.childNodes).filter((child) => child.nodeType === 1);
}

function firstDescendant(node, localName) {
  if (!node) return null;
  return node.getElementsByTagNameNS("*", localName)[0] || null;
}

function getAttr(node, name, namespace) {
  if (!node) return "";
  if (namespace && node.getAttributeNS) {
    const namespaced = node.getAttributeNS(namespace, name);
    if (namespaced != null && namespaced !== "") return namespaced;
  }
  const direct = node.getAttribute?.(name);
  if (direct != null && direct !== "") return direct;
  for (const attr of Array.from(node.attributes || [])) {
    if (attr.localName === name || attr.name === name || attr.name.endsWith(`:${name}`)) {
      return attr.value;
    }
  }
  return "";
}

function readPlaceholderRef(shapeNode) {
  const ph = firstDescendant(firstDescendant(firstDescendant(shapeNode, "nvSpPr"), "nvPr"), "ph")
    || firstDescendant(firstDescendant(firstDescendant(shapeNode, "nvPicPr"), "nvPr"), "ph");
  if (!ph) return null;
  return {
    type: getAttr(ph, "type") || "body",
    idx: getAttr(ph, "idx") || "",
  };
}

function makePlaceholderKey(placeholder) {
  return `${placeholder?.type || "body"}:${placeholder?.idx || ""}`;
}

function parseShapeTransform(shapeNode) {
  const xfrm = firstDescendant(firstDescendant(shapeNode, "spPr"), "xfrm");
  return parseTransformNode(xfrm);
}

function parsePictureTransform(picNode) {
  const xfrm = firstDescendant(firstDescendant(picNode, "spPr"), "xfrm");
  return parseTransformNode(xfrm);
}

function parseTransformNode(xfrm) {
  if (!xfrm) return null;
  const off = firstDescendant(xfrm, "off");
  const ext = firstDescendant(xfrm, "ext");
  return {
    x: parseNumber(getAttr(off, "x"), 0),
    y: parseNumber(getAttr(off, "y"), 0),
    cx: parseNumber(getAttr(ext, "cx"), 0),
    cy: parseNumber(getAttr(ext, "cy"), 0),
  };
}

function extractTextBodyText(textBody) {
  if (!textBody) return "";
  const paragraphs = Array.from(textBody.getElementsByTagNameNS("*", "p")).map((paragraph) => {
    const parts = [];
    for (const child of localChildren(paragraph)) {
      if (child.localName === "r" || child.localName === "fld") {
        const textNode = firstDescendant(child, "t");
        if (textNode?.textContent) parts.push(textNode.textContent);
      } else if (child.localName === "br") {
        parts.push("\n");
      }
    }
    return parts.join("");
  }).filter(Boolean);
  return paragraphs.join("\n").trim();
}

function ooXmlFontSizeToPx(value) {
  const halfPoints = parseNumber(value, 0);
  if (!halfPoints) return 0;
  const points = halfPoints / 100;
  return (points / 72) * PPTX_BASE_DPI;
}

function defaultFontSizeForPlaceholder(placeholder) {
  if (!placeholder) return 22;
  if (placeholder.type === "ctrTitle" || placeholder.type === "title") return 32;
  if (placeholder.type === "subTitle") return 22;
  return 18;
}

function isTitlePlaceholder(placeholder) {
  return placeholder?.type === "title" || placeholder?.type === "ctrTitle";
}

function normalizeTextAlign(value) {
  if (value === "ctr") return "center";
  if (value === "r") return "right";
  if (value === "just") return "justify";
  return "left";
}

function normalizeVerticalAlign(value) {
  if (value === "ctr") return "center";
  if (value === "b") return "flex-end";
  return "flex-start";
}

function mapThemeTypeface(value, theme) {
  if (value === "+mn-lt") return theme.majorLatin || "Calibri";
  if (value === "+mj-lt") return theme.majorLatin || "Calibri";
  if (value === "+mn-ea" || value === "+mn-cs") return theme.majorLatin || "Calibri";
  if (value === "+mj-ea" || value === "+mj-cs") return theme.majorLatin || "Calibri";
  return value;
}

function parseBooleanAttr(node, name, fallback) {
  const value = getAttr(node, name);
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return !!fallback;
}

function emuToPx(value) {
  return (Number(value || 0) / PPTX_EMUS_PER_INCH) * PPTX_BASE_DPI;
}

function parseNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function pickFirstFinite(values, fallback) {
  for (const value of values) {
    if (Number.isFinite(value) && value > 0) return value;
  }
  return fallback;
}

function hexToRgb(hex) {
  const raw = String(hex || "").replace(/^#/, "");
  return [
    Number.parseInt(raw.slice(0, 2) || "00", 16),
    Number.parseInt(raw.slice(2, 4) || "00", 16),
    Number.parseInt(raw.slice(4, 6) || "00", 16),
  ];
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((value) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0")).join("")}`;
}

function mimeTypeFromPath(filePath) {
  const extension = getExtension(filePath);
  if (extension === "png") return "image/png";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "gif") return "image/gif";
  if (extension === "svg") return "image/svg+xml";
  if (extension === "webp") return "image/webp";
  return "application/octet-stream";
}

class NativePresentationController {
  constructor(app) {
    this.app = app;
    this.activeSession = null;
    this.onExit = null;
    this.pollTimer = null;
    this.pollInFlight = false;
    this.sessionCounter = 0;
  }

  supports(extension) {
    return !!this.getAppSpec(extension);
  }

  getAppSpec(extension) {
    const normalized = String(extension || "").toLowerCase();
    if (NATIVE_POWERPOINT_EXTENSIONS.has(normalized) && fs.existsSync(POWERPOINT_APP_PATH)) {
      return {
        kind: "powerpoint",
        appLabel: "Microsoft PowerPoint",
      };
    }
    return null;
  }

  getUnavailableMessage(extension) {
    return "Microsoft PowerPoint is not available for native PPTX playback.";
  }

  isSessionForItem(item) {
    return !!(item && this.activeSession && this.activeSession.itemPath === item.file?.path);
  }

  async start(item, options = {}) {
    const extension = String(item?.file?.extension || getExtension(item?.file?.path || "")).toLowerCase();
    const appSpec = this.getAppSpec(extension);
    if (!appSpec) throw new Error(this.getUnavailableMessage(extension));

    const sourcePath = resolveVaultFileAbsolutePath(this.app, item.file);
    if (this.activeSession && this.activeSession.itemPath === item.file.path) {
      this.onExit = options.onExit || null;
      return this.activeSession;
    }

    await this.stop();

    const session = {
      id: ++this.sessionCounter,
      itemPath: item.file.path,
      sourcePath,
      title: item.title || item.file.basename || item.file.name || "Presentation",
      extension,
      app: appSpec.kind,
      appLabel: appSpec.appLabel,
    };

    this.activeSession = session;
    this.onExit = options.onExit || null;

    const launchInfo = await this.launchShow(session);
    if (launchInfo?.documentId) {
      session.documentId = launchInfo.documentId;
    }
    if (this.activeSession?.id !== session.id) return session;

    this.startPolling(session);
    return session;
  }

  startPolling(session) {
    this.stopPolling();
    this.pollTimer = window.setInterval(async () => {
      if (this.pollInFlight || this.activeSession?.id !== session.id) return;
      this.pollInFlight = true;
      try {
        const state = await this.pollShow(session);
        if (this.activeSession?.id !== session.id) return;
        if (state === "running") return;

        this.stopPolling();
        this.activeSession = null;
        const onExit = this.onExit;
        this.onExit = null;
        onExit?.({ state, session });
      } catch (_error) {
        // Ignore transient AppleScript polling failures and keep waiting.
      } finally {
        this.pollInFlight = false;
      }
    }, 1000);
  }

  stopPolling() {
    if (!this.pollTimer) return;
    window.clearInterval(this.pollTimer);
    this.pollTimer = null;
  }

  async stop() {
    const session = this.activeSession;
    this.stopPolling();
    this.activeSession = null;
    this.onExit = null;
    if (!session) return;
    try {
      await this.stopShow(session);
    } catch (_error) {}
  }

  async launchShow(session) {
    await this.launchPowerPointShow(session.sourcePath);
    return {};
  }

  async pollShow(session) {
    return this.pollPowerPointShow(session.sourcePath);
  }

  async stopShow(session) {
    return this.stopPowerPointShow(session.sourcePath);
  }

  async launchPowerPointShow(sourcePath) {
    await runOsaScriptLines([
      "on run argv",
      "  set sourcePosix to item 1 of argv",
      "  tell application \"Microsoft PowerPoint\"",
      "    activate",
      "    open POSIX file sourcePosix",
      "    set pList to {}",
      "    repeat 100 times",
      "      set pList to every presentation whose full name = sourcePosix",
      "      if (count of pList) > 0 then exit repeat",
      "      delay 0.1",
      "    end repeat",
      "    if (count of pList) = 0 then error \"PowerPoint did not open the presentation.\"",
      "    set p to item 1 of pList",
      "    if (exists slide show window of p) then",
      "      exit slide show slideshow view of slide show window of p",
      "      delay 0.2",
      "    end if",
      "    run slide show slide show settings of p",
      "    repeat 100 times",
      "      if (exists slide show window of p) then return \"running\"",
      "      delay 0.1",
      "    end repeat",
      "    error \"PowerPoint slideshow did not start.\"",
      "  end tell",
      "end run",
    ], [sourcePath]);
  }

  async pollPowerPointShow(sourcePath) {
    return runOsaScriptLines([
      "on run argv",
      "  set sourcePosix to item 1 of argv",
      "  tell application \"System Events\"",
      "    set appRunning to exists process \"Microsoft PowerPoint\"",
      "  end tell",
      "  if appRunning is false then return \"missing\"",
      "  tell application \"Microsoft PowerPoint\"",
      "    set pList to every presentation whose full name = sourcePosix",
      "    if (count of pList) = 0 then return \"missing\"",
      "    set p to item 1 of pList",
      "    if (exists slide show window of p) then return \"running\"",
      "    close p saving no",
      "    return \"closed\"",
      "  end tell",
      "end run",
    ], [sourcePath], { timeout: 10000 });
  }

  async stopPowerPointShow(sourcePath) {
    await runOsaScriptLines([
      "on run argv",
      "  set sourcePosix to item 1 of argv",
      "  tell application \"System Events\"",
      "    set appRunning to exists process \"Microsoft PowerPoint\"",
      "  end tell",
      "  if appRunning is false then return \"missing\"",
      "  tell application \"Microsoft PowerPoint\"",
      "    set pList to every presentation whose full name = sourcePosix",
      "    if (count of pList) = 0 then return \"missing\"",
      "    set p to item 1 of pList",
      "    if (exists slide show window of p) then",
      "      exit slide show slideshow view of slide show window of p",
      "      delay 0.1",
      "    end if",
      "    close p saving no",
      "    return \"stopped\"",
      "  end tell",
      "end run",
    ], [sourcePath], { timeout: 10000 });
  }

  destroy() {
    this.stop().catch(() => {});
  }
}

class PresentationPdfCache {
  constructor(app, manifest) {
    this.app = app;
    this.manifest = manifest || {};
    this.cacheRoot = null;
    this.inflightConversions = new Map();
  }

  async getOrCreatePdf(file) {
    const sourcePath = resolveVaultFileAbsolutePath(this.app, file);
    const stats = await fs.promises.stat(sourcePath);
    const cacheInfo = this.createCacheInfo(file, stats);

    if (this.hasUsableFile(cacheInfo.pdfPath)) {
      return createExternalFileReference(cacheInfo.pdfPath);
    }

    const existing = this.inflightConversions.get(cacheInfo.pdfPath);
    if (existing) return existing;

    const promise = this.convertToPdf(file, sourcePath, cacheInfo)
      .then(() => createExternalFileReference(cacheInfo.pdfPath))
      .finally(() => {
        this.inflightConversions.delete(cacheInfo.pdfPath);
      });

    this.inflightConversions.set(cacheInfo.pdfPath, promise);
    return promise;
  }

  createCacheInfo(file, stats) {
    const root = this.getCacheRoot();
    const stableFingerprint = crypto.createHash("sha1")
      .update([file.path, String(stats.size), String(Math.trunc(stats.mtimeMs))].join("|"))
      .digest("hex")
      .slice(0, 16);
    const fileDir = path.join(root, stableFingerprint);
    const safeName = sanitizeCacheSegment(file.basename || path.parse(file.path).name || "presentation");
    return {
      fileDir,
      pdfPath: path.join(fileDir, `${safeName}.pdf`),
    };
  }

  async convertToPdf(file, sourcePath, cacheInfo) {
    this.ensureDirectory(cacheInfo.fileDir);
    const tempDir = fs.mkdtempSync(path.join(this.getCacheRoot(), "tmp-"));
    const tempPdfPath = path.join(tempDir, `${sanitizeCacheSegment(path.parse(sourcePath).name || "presentation")}.pdf`);
    const extension = String(file.extension || getExtension(file.path)).toLowerCase();
    const strategies = this.getStrategies(extension);
    let lastError = null;

    try {
      for (const strategy of strategies) {
        try {
          await strategy(sourcePath, tempPdfPath, tempDir);
          if (this.hasUsableFile(tempPdfPath)) {
            fs.renameSync(tempPdfPath, cacheInfo.pdfPath);
            return;
          }
        } catch (error) {
          lastError = error;
        }
      }
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    if (lastError) throw lastError;
    throw new Error(`No local converter is available for .${extension} files.`);
  }

  getStrategies(extension) {
    const strategies = [];
    const sofficePath = findExecutableOnPath(["soffice", "libreoffice"]);
    if (sofficePath) {
      strategies.push((sourcePath, targetPath, tempDir) => this.convertWithSoffice(sofficePath, sourcePath, targetPath, tempDir));
    }
    return strategies;
  }

  async convertWithSoffice(executable, sourcePath, targetPath, outputDir) {
    await execFileAsync(executable, [
      "--headless",
      "--convert-to",
      "pdf",
      "--outdir",
      outputDir,
      sourcePath,
    ], {
      timeout: PRESENTATION_CONVERSION_TIMEOUT_MS,
      maxBuffer: 16 * 1024 * 1024,
    });

    const producedPath = path.join(outputDir, `${path.parse(sourcePath).name}.pdf`);
    if (!this.hasUsableFile(producedPath)) {
      throw new Error("LibreOffice did not produce a PDF file.");
    }
    if (producedPath !== targetPath) {
      fs.renameSync(producedPath, targetPath);
    }
  }

  hasUsableFile(filePath) {
    try {
      return fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
    } catch (_error) {
      return false;
    }
  }

  getCacheRoot() {
    if (this.cacheRoot) return this.cacheRoot;
    this.cacheRoot = path.join(resolvePluginDir(this.app, this.manifest), "cache", "presentation-pdf");
    this.ensureDirectory(this.cacheRoot);
    return this.cacheRoot;
  }

  ensureDirectory(dir) {
    fs.mkdirSync(dir, { recursive: true });
  }

  destroy() {
    this.inflightConversions.clear();
  }
}

class KeynoteDeckRenderer {
  constructor(app, manifest) {
    this.app = app;
    this.manifest = manifest || {};
    this.cacheRoot = null;
    this.inflight = new Map();
  }

  async getDeck(file) {
    const sourcePath = resolveVaultFileAbsolutePath(this.app, file);
    const stats = await fs.promises.stat(sourcePath);
    const cacheKey = getFileCacheKey(file);
    const fingerprint = crypto.createHash("sha1")
      .update([file.path, String(stats.size), String(Math.trunc(stats.mtimeMs))].join("|"))
      .digest("hex")
      .slice(0, 16);
    const inflightKey = `${cacheKey}:${fingerprint}`;
    if (this.inflight.has(inflightKey)) return this.inflight.get(inflightKey);

    const promise = this.buildDeck(file, fingerprint).finally(() => {
      this.inflight.delete(inflightKey);
    });
    this.inflight.set(inflightKey, promise);
    return promise;
  }

  async buildDeck(file, fingerprint) {
    if (!parseIwa) {
      throw new Error("Keynote support requires the local keynote-parser2 dependency.");
    }
    const zip = new SimpleZipArchive(Buffer.from(await this.app.vault.readBinary(file)));
    const parsedDocument = parseIwa(zip.readBinary("Index/Document.iwa"));
    const show = findKeynoteMessage(parsedDocument, "KN.ShowArchive");
    if (!show?.slideTree?.slides?.length) {
      throw new Error(`${file.path} does not contain a readable Keynote slide tree.`);
    }

    const dataEntryById = buildKeynoteDataEntryMap(zip);
    const cacheDir = path.join(this.getCacheRoot(), fingerprint);
    fs.mkdirSync(cacheDir, { recursive: true });

    const slides = [];
    show.slideTree.slides.forEach((slideRef, slideIndex) => {
      const slideNode = findKeynoteArchiveMessage(parsedDocument, slideRef?.identifier, "KN.SlideNodeArchive");
      if (!slideNode || slideNode.isHidden) return;
      const thumbnailRef = Array.isArray(slideNode.thumbnails) ? slideNode.thumbnails[0] : null;
      const thumbnailId = String(thumbnailRef?.identifier || "");
      const entryName = dataEntryById.get(thumbnailId);
      if (!entryName) return;

      const extension = path.extname(entryName) || ".jpg";
      const targetPath = path.join(cacheDir, `${String(slideIndex + 1).padStart(3, "0")}-${sanitizeCacheSegment(file.basename)}${extension}`);
      if (!fs.existsSync(targetPath) || fs.statSync(targetPath).size === 0) {
        fs.writeFileSync(targetPath, zip.readBinary(entryName));
      }
      slides.push({
        cachePath: targetPath,
        width: slideNode.thumbnailSizes?.[0]?.width || 0,
        height: slideNode.thumbnailSizes?.[0]?.height || 0,
      });
    });

    return {
      width: show.size?.width || 0,
      height: show.size?.height || 0,
      slides,
    };
  }

  getCacheRoot() {
    if (this.cacheRoot) return this.cacheRoot;
    this.cacheRoot = path.join(resolvePluginDir(this.app, this.manifest), "cache", "keynote");
    fs.mkdirSync(this.cacheRoot, { recursive: true });
    return this.cacheRoot;
  }

  destroy() {
    this.inflight.clear();
  }
}

class FigmaSlideCache {
  constructor(app, manifest) {
    this.app = app;
    this.manifest = manifest || {};
    this.cacheRoot = null;
    this.inflightDownloads = new Map();
  }

  async preloadPresentations(presentations, options = {}) {
    const token = String(options.token || "").trim();
    if (!token) return;

    let remaining = clampInteger(options.maxPages, 0, FIGMA_MAX_PRELOAD_PAGES, DEFAULT_SETTINGS.figmaPreloadPages);
    if (remaining <= 0) return;

    for (const presentation of presentations) {
      if (!presentation?.fileKey || remaining <= 0) break;
      try {
        const result = await this.exportPresentation(presentation, null, {
          token,
          maxPages: remaining,
          scale: options.scale,
        });
        remaining -= result.cachedCount;
      } catch (_error) {
        // Background preloading must never interrupt opening a Canvas.
      }
    }
  }

  async createSteps(presentation, node, options = {}) {
    const token = String(options.token || "").trim();
    if (!token) {
      return {
        steps: [],
        fallbackReason: "No Figma access token is configured.",
      };
    }

    try {
      const result = await this.exportPresentation(presentation, node, {
        token,
        scale: options.scale,
      });
      return {
        steps: result.steps,
        fallbackReason: "",
      };
    } catch (error) {
      return {
        steps: [],
        fallbackReason: getFigmaFallbackReason(error),
      };
    }
  }

  async exportPresentation(presentation, node, options = {}) {
    if (!presentation?.fileKey) {
      throw new Error("Figma file key is missing.");
    }

    const token = String(options.token || "").trim();
    if (!token) {
      throw new Error("No Figma access token is configured.");
    }

    const scale = clampNumber(options.scale, 1, 3, DEFAULT_SETTINGS.figmaRenderScale);
    const file = await requestFigmaApiJson(`https://api.figma.com/v1/files/${encodeURIComponent(presentation.fileKey)}`, token);
    const slideNodes = findFigmaSlideNodes(file.document);
    if (slideNodes.length === 0) {
      throw new Error("No Figma Slides were found in this file.");
    }

    const exportNodes = Number.isFinite(options.maxPages) ? slideNodes.slice(0, Math.max(0, options.maxPages)) : slideNodes;
    if (exportNodes.length === 0) {
      return { steps: [], cachedCount: 0 };
    }

    const cacheInfo = this.createCacheInfo(presentation.fileKey, file, scale);
    this.ensureDirectory(cacheInfo.dir);
    this.deleteStaleCacheDirs(cacheInfo.fileDir, cacheInfo.dir);

    const imageUrls = await requestFigmaImageUrls(presentation.fileKey, exportNodes.map((slide) => slide.id), token, {
      format: FIGMA_EXPORT_FORMAT,
      scale,
    });

    const title = presentation.title || file.name || getNodeTitle(node);
    const steps = [];
    let cachedCount = 0;

    for (const slide of exportNodes) {
      const imageUrl = imageUrls[slide.id];
      if (!imageUrl) continue;
      const index = slideNodes.findIndex((candidate) => candidate.id === slide.id);
      const page = index + 1;
      const cachePath = this.getSlideCachePath(cacheInfo.dir, slide, page);
      await this.ensureDownloaded(imageUrl, cachePath);
      cachedCount += 1;
      steps.push({
        type: "figma-image",
        title,
        node,
        cachePath,
        sourceUrl: createFigmaNodeUrl(presentation.sourceUrl, slide.id),
        provider: "figma",
        fileKey: presentation.fileKey,
        figmaNodeId: slide.id,
        fileVersion: file.version || "",
        lastModified: file.lastModified || "",
        page,
        pageCount: slideNodes.length,
        renderScale: scale,
      });
    }

    if (steps.length !== exportNodes.length) {
      throw new Error("One or more Figma slides could not be rendered by the image export endpoint.");
    }

    this.writeCacheManifest(cacheInfo.dir, {
      fileKey: presentation.fileKey,
      sourceUrl: presentation.sourceUrl,
      name: file.name || "",
      version: file.version || "",
      lastModified: file.lastModified || "",
      renderScale: scale,
      format: FIGMA_EXPORT_FORMAT,
      cachedAt: new Date().toISOString(),
      cachedSlides: steps.map((step) => ({
        page: step.page,
        nodeId: step.figmaNodeId || "",
        path: step.cachePath,
      })),
      totalSlides: slideNodes.length,
    });

    return { steps, cachedCount };
  }

  ensureDownloaded(url, targetPath) {
    if (this.hasUsableFile(targetPath)) return Promise.resolve();
    const existing = this.inflightDownloads.get(targetPath);
    if (existing) return existing;

    const promise = this.downloadToFile(url, targetPath).finally(() => {
      this.inflightDownloads.delete(targetPath);
    });
    this.inflightDownloads.set(targetPath, promise);
    return promise;
  }

  async downloadToFile(url, targetPath) {
    this.ensureDirectory(path.dirname(targetPath));
    const response = await requestUrl({ url, method: "GET" });
    if (response.status && response.status >= 400) {
      const error = new Error(`Figma image download failed with HTTP ${response.status}.`);
      error.status = response.status;
      throw error;
    }

    const buffer = response.arrayBuffer
      ? Buffer.from(response.arrayBuffer)
      : Buffer.from(response.text || "", "binary");
    if (buffer.length === 0) {
      throw new Error("Figma image download returned an empty file.");
    }

    const tempPath = `${targetPath}.download`;
    fs.writeFileSync(tempPath, buffer);
    fs.renameSync(tempPath, targetPath);
  }

  hasUsableFile(filePath) {
    try {
      return fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
    } catch (_error) {
      return false;
    }
  }

  createCacheInfo(fileKey, file, scale) {
    const root = this.getCacheRoot();
    const safeFileKey = sanitizeCacheSegment(fileKey);
    const fileDir = path.join(root, safeFileKey);
    const fingerprint = createFigmaCacheFingerprint(file, scale);
    return {
      fileDir,
      dir: path.join(fileDir, fingerprint),
      fingerprint,
    };
  }

  getSlideCachePath(cacheDir, slide, page) {
    const safeNodeId = sanitizeCacheSegment(slide.id || `page-${page}`);
    const safeName = sanitizeCacheSegment(String(slide.name || "").slice(0, 36));
    const namePart = safeName ? `-${safeName}` : "";
    return path.join(cacheDir, `slide-${String(page).padStart(3, "0")}-${safeNodeId}${namePart}.${FIGMA_EXPORT_FORMAT}`);
  }

  writeCacheManifest(cacheDir, manifest) {
    try {
      fs.writeFileSync(path.join(cacheDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    } catch (_error) {}
  }

  deleteStaleCacheDirs(fileDir, keepDir) {
    try {
      if (!fs.existsSync(fileDir)) return;
      for (const entry of fs.readdirSync(fileDir, { withFileTypes: true })) {
        const candidate = path.join(fileDir, entry.name);
        if (!entry.isDirectory() || candidate === keepDir) continue;
        fs.rmSync(candidate, { recursive: true, force: true });
      }
    } catch (_error) {}
  }

  getCacheRoot() {
    if (this.cacheRoot) return this.cacheRoot;
    const pluginDir = this.resolvePluginDir();
    this.cacheRoot = path.join(pluginDir, "cache", "figma");
    this.ensureDirectory(this.cacheRoot);
    return this.cacheRoot;
  }

  resolvePluginDir() {
    return resolvePluginDir(this.app, this.manifest);
  }

  ensureDirectory(dir) {
    fs.mkdirSync(dir, { recursive: true });
  }

  destroy() {
    this.inflightDownloads.clear();
  }
}

class PresentationEmbedPreloader {
  constructor() {
    this.urls = new Set();
    this.iframes = new Map();
    this.container = null;
  }

  preload(urls) {
    const nextUrls = urls.filter(Boolean).slice(0, PRELOAD_PRESENTATION_LIMIT);
    if (nextUrls.length === 0) return;
    this.ensureContainer();

    for (const url of nextUrls) {
      if (this.urls.has(url)) continue;
      this.urls.add(url);
      const iframe = this.container.createEl("iframe", {
        attr: {
          src: url,
          tabindex: "-1",
          loading: "eager",
          sandbox: "allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads",
          allow: "fullscreen; clipboard-read; clipboard-write; autoplay",
        },
      });
      this.iframes.set(url, iframe);
    }

    for (const [url, iframe] of this.iframes.entries()) {
      if (nextUrls.includes(url)) continue;
      iframe.remove();
      this.iframes.delete(url);
      this.urls.delete(url);
    }
  }

  ensureContainer() {
    if (this.container) return;
    this.container = document.body.createDiv({ cls: "canvas-player-preload-host", attr: { "aria-hidden": "true" } });
  }

  destroy() {
    this.iframes.clear();
    this.urls.clear();
    this.container?.remove();
    this.container = null;
  }
}

class CanvasPlayerModal extends Modal {
  constructor(app, items, pdfRenderer, pptxRenderer, nativePresentationController, settings) {
    super(app);
    this.items = items;
    this.outlineEntries = buildOutlineEntries(items);
    this.pdfRenderer = pdfRenderer;
    this.pptxRenderer = pptxRenderer;
    this.nativePresentationController = nativePresentationController;
    this.settings = settings;
    this.index = 0;
    this.slideCache = new Map();
    this.activeSlideEl = null;
    this.transitionToken = 0;
    this.outlineOpen = false;
    this.lastFullscreenExitAt = 0;
    this.focusGuardTimer = null;
    this.nativePresentationToken = 0;
    this.pendingVideoPlayIndex = null;
    this.pendingVideoPlayToken = 0;
    this.keyHandler = (event) => this.handleKey(event);
    this.pointerMoveHandler = (event) => this.handlePointerMove(event);
    this.pointerLeaveHandler = () => this.setOutlineOpen(false);
    this.fullscreenChangeHandler = () => this.handleFullscreenChange();
    this.focusInHandler = (event) => this.handleFocusIn(event);
    this.resizeHandler = () => this.resizeActiveVideo();
  }

  onOpen() {
    this.modalEl.addClass("canvas-player-modal", "mod-canvas-player");
    this.modalEl.style.display = "none";
    this.contentEl.empty();

    this.stageEl = document.body.createDiv({ cls: "canvas-player-stage" });
    this.stageEl.tabIndex = -1;
    Object.assign(this.stageEl.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      zIndex: "99999",
    });

    this.enterFullscreen(this.stageEl);
    applyDesignSystem(this.stageEl, this.settings.designSystem);
    this.contentHostEl = this.stageEl.createDiv({ cls: "canvas-player-content" });
    this.createOutline();
    window.addEventListener("keydown", this.keyHandler, true);
    window.addEventListener("mousemove", this.pointerMoveHandler, { passive: true });
    window.addEventListener("focusin", this.focusInHandler, true);
    window.addEventListener("resize", this.resizeHandler, { passive: true });
    document.addEventListener("fullscreenchange", this.fullscreenChangeHandler);
    this.stageEl.addEventListener("mouseleave", this.pointerLeaveHandler);
    window.setTimeout(() => {
      this.stageEl.focus({ preventScroll: true });
      this.showIndex(0);
      this.scheduleDeckWarmup();
    }, 80);
  }

  onClose() {
    window.removeEventListener("keydown", this.keyHandler, true);
    window.removeEventListener("mousemove", this.pointerMoveHandler);
    window.removeEventListener("focusin", this.focusInHandler, true);
    window.removeEventListener("resize", this.resizeHandler);
    document.removeEventListener("fullscreenchange", this.fullscreenChangeHandler);
    this.stageEl?.removeEventListener("mouseleave", this.pointerLeaveHandler);
    this.stopFocusGuard();
    this.pauseSlideMedia(this.activeSlideEl);
    this.nativePresentationToken += 1;
    this.pendingVideoPlayToken += 1;
    this.pendingVideoPlayIndex = null;
    this.nativePresentationController?.stop().catch(() => {});
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    exitFullscreenIfActive();
    for (const cached of this.slideCache.values()) {
      cached.disposed = true;
      cached.cleanup?.();
    }
    this.slideCache.clear();
    this.stageEl?.remove();
    this.contentEl.empty();
  }

  showIndex(index, options = {}) {
    if (index < 0 || index >= this.items.length) return;

    const shouldAutoplayVideo = options.autoplayVideo && this.items[index]?.type === "video";
    const previousIndex = this.index;
    const previousItem = this.items[previousIndex] || null;
    ++this.transitionToken;
    this.pendingVideoPlayToken += 1;
    this.pendingVideoPlayIndex = shouldAutoplayVideo ? index : null;
    this.index = index;
    this.updateOutline();

    const targetSlideEl = this.ensureSlide(index);
    const previousSlideEl = this.activeSlideEl;
    this.activeSlideEl = targetSlideEl;
    targetSlideEl.addClass("is-active");

    if (previousSlideEl && previousSlideEl !== targetSlideEl) {
      this.pauseSlideMedia(previousSlideEl);
      previousSlideEl.removeClass("is-active");
    }

    this.trimCache(index);
    this.deferPreloadAround(index);
    this.syncFocusGuard();
    this.handleActiveItemChanged(previousIndex === index ? null : previousItem, this.items[index], index);
    if (this.items[index]?.type === "video") {
      this.resizeActiveVideo();
    }
    if (shouldAutoplayVideo) {
      this.autoplayVideoAtIndex(index);
    }
  }

  pauseSlideMedia(slideEl) {
    const mediaElements = slideEl?.querySelectorAll?.("video, audio") || [];
    mediaElements.forEach((media) => {
      try {
        media.pause();
      } catch (_error) {}
    });
  }

  createOutline() {
    this.outlineEl = this.stageEl.createDiv({ cls: "canvas-player-outline" });
    this.outlineEl.createDiv({ cls: "canvas-player-outline-rail" });
    const panel = this.outlineEl.createDiv({ cls: "canvas-player-outline-panel" });
    panel.createDiv({ cls: "canvas-player-outline-title", text: "Slides" });
    this.outlineProgressEl = panel.createDiv({ cls: "canvas-player-outline-progress" });
    const list = panel.createDiv({ cls: "canvas-player-outline-list" });
    this.outlineButtons = this.outlineEntries.map((entry, index) => {
      const button = list.createEl("button", {
        cls: "canvas-player-outline-item",
        attr: { type: "button", "data-start-index": String(entry.startIndex) },
      });
      button.dataset.entryIndex = String(index);
      button.dataset.startIndex = String(entry.startIndex);
      button.createSpan({ cls: "canvas-player-outline-item-name", text: entry.title });
      if (entry.detail) {
        button.createSpan({ cls: "canvas-player-outline-item-detail", text: entry.detail });
      }
      button.addEventListener("pointerdown", (event) => this.handleOutlineJumpEvent(event));
      button.addEventListener("mousedown", (event) => this.handleOutlineJumpEvent(event));
      button.addEventListener("click", (event) => this.handleOutlineJumpEvent(event));
      button.addEventListener("touchstart", (event) => this.handleOutlineJumpEvent(event), { passive: false });
      return button;
    });
    list.addEventListener("pointerdown", (event) => this.handleOutlineJumpEvent(event), true);
    list.addEventListener("mousedown", (event) => this.handleOutlineJumpEvent(event), true);
    list.addEventListener("click", (event) => this.handleOutlineJumpEvent(event), true);
    list.addEventListener("touchstart", (event) => this.handleOutlineJumpEvent(event), { capture: true, passive: false });
    this.outlineEl.addEventListener("mouseenter", () => this.setOutlineOpen(true));
    this.outlineEl.addEventListener("mouseleave", (event) => {
      if (event.clientX > 310) this.setOutlineOpen(false);
    });
    this.outlineEl.addEventListener("focusin", () => this.setOutlineOpen(true));
    this.outlineEl.addEventListener("focusout", () => {
      window.setTimeout(() => {
        if (!this.outlineEl?.contains(document.activeElement)) this.setOutlineOpen(false);
      }, 0);
    });
  }

  handlePointerMove(event) {
    if (!this.stageEl) return;
    if (this.items[this.index]?.type === "pptx-page") {
      this.setOutlineOpen(false);
      return;
    }

    const openZone = 54;
    const closeZone = 318;

    if (event.clientX <= openZone) {
      this.setOutlineOpen(true);
      return;
    }

    if (this.outlineOpen && event.clientX > closeZone && !this.outlineEl?.matches(":hover")) {
      this.setOutlineOpen(false);
    }
  }

  setOutlineOpen(open) {
    if (this.outlineOpen === open) return;
    this.outlineOpen = open;
    this.stageEl?.classList.toggle("is-outline-open", open);
  }

  handleFullscreenChange() {
    if (!document.fullscreenElement) {
      this.lastFullscreenExitAt = Date.now();
    }
  }

  handleFocusIn(event) {
    if (this.isCurrentItemVideo()) {
      this.focusStageSoon();
      return;
    }

    if (!this.isCurrentItemPresentation()) return;
    if (event.target?.closest?.(".canvas-player-stage")) return;
    this.focusStageSoon();
  }

  updateOutline() {
    const item = this.items[this.index];
    const pageText = item.pageCount > 1 ? ` · page ${item.page}/${item.pageCount}` : "";
    this.outlineProgressEl?.setText(`${this.index + 1} / ${this.items.length}${pageText}`);

    const activeEntryIndex = findActiveOutlineEntry(this.outlineEntries, this.index);
    this.outlineButtons?.forEach((button, index) => {
      const active = index === activeEntryIndex;
      button.classList.toggle("is-active", active);
      if (active) {
        button.setAttr("aria-current", "true");
      } else {
        button.removeAttribute("aria-current");
      }
    });
  }

  handleActiveItemChanged(previousItem, currentItem, index) {
    if (previousItem?.type === "native-presentation" && previousItem !== currentItem) {
      this.nativePresentationToken += 1;
      this.nativePresentationController?.stop().catch(() => {});
    }

    if (currentItem?.type !== "native-presentation") return;

    const slideEl = this.slideCache.get(index)?.el || this.activeSlideEl;
    this.startNativePresentation(currentItem, slideEl, index);
  }

  async startNativePresentation(item, slideEl, index) {
    const token = ++this.nativePresentationToken;
    const appLabel = "Microsoft PowerPoint";
    this.updateNativePresentationSlide(slideEl, {
      state: "launching",
      title: item.title,
      appLabel,
      detail: `Opening the original deck in ${appLabel} slideshow mode.`,
    });

    try {
      await this.nativePresentationController?.start(item, {
        onExit: () => {
          if (this.nativePresentationToken !== token) return;
          this.focusPlaybackWindow();
          if (this.index !== index) return;
          this.updateNativePresentationSlide(this.slideCache.get(index)?.el || slideEl, {
            state: "ended",
            title: item.title,
            appLabel,
            detail: `${appLabel} slideshow finished. Returning to the Canvas chain.`,
          });
          if (index < this.items.length - 1) {
            this.showIndex(index + 1);
          }
        },
      });
      if (this.nativePresentationToken !== token) return;
      this.updateNativePresentationSlide(this.slideCache.get(index)?.el || slideEl, {
        state: "running",
        title: item.title,
        appLabel,
        detail: `Playback is now running in ${appLabel}. Use ${appLabel} itself to advance slides. When the slideshow ends, Canvas Playback will resume automatically.`,
      });
    } catch (error) {
      if (this.nativePresentationToken !== token) return;
      this.updateNativePresentationSlide(this.slideCache.get(index)?.el || slideEl, {
        state: "error",
        title: item.title,
        appLabel,
        detail: error?.message || `${appLabel} could not start the slideshow.`,
      });
    }
  }

  focusPlaybackWindow() {
    const win = getElectronWindow();
    try {
      win?.show?.();
      win?.focus?.();
    } catch (_error) {}
    this.focusStageSoon();
  }

  ensureSlide(index) {
    const cached = this.slideCache.get(index);
    if (cached) {
      return cached.el;
    }

    const item = this.items[index];
    const slideEl = this.contentHostEl.createDiv({ cls: "canvas-player-slide" });
    slideEl.dataset.slideIndex = String(index);
    const cachedSlide = { el: slideEl, ready: null, cleanup: null, disposed: false };
    const ready = this.renderSlide(slideEl, item).then((cleanup) => {
      if (typeof cleanup === "function") {
        if (cachedSlide.disposed) {
          cleanup();
        } else {
          cachedSlide.cleanup = cleanup;
        }
      }
      slideEl.addClass("is-ready");
      return slideEl;
    }).catch((error) => {
      renderSlideError(slideEl, `Could not render ${item.title || "slide"}.`, error);
      slideEl.addClass("is-ready");
      return slideEl;
    });
    cachedSlide.ready = ready;
    this.slideCache.set(index, cachedSlide);
    return slideEl;
  }

  async renderSlide(slideEl, item) {
    if (item.type === "image") {
      const img = slideEl.createEl("img", { attr: { src: this.app.vault.getResourcePath(item.file), alt: item.title } });
      img.draggable = false;
      const loaded = await waitForMediaLoad(img);
      if (!loaded) {
        img.remove();
        renderSlideError(slideEl, `Could not load image: ${item.title}`);
      }
      return;
    }

    if (item.type === "remote-image") {
      await this.renderRemoteImageSlide(slideEl, item);
      return;
    }

    if (item.type === "figma-image") {
      return await this.renderLocalCachedImageSlide(slideEl, item, {
        className: "canvas-player-figma-slide-image",
        errorLabel: "cached Figma slide",
      });
    }

    if (item.type === "keynote-image") {
      return await this.renderLocalCachedImageSlide(slideEl, item, {
        className: "canvas-player-keynote-slide-image",
        errorLabel: "cached Keynote slide",
      });
    }

    if (item.type === "pdf-image") {
      let renderItem = item;
      try {
        const cachePath = await this.pdfRenderer.ensureRenderedImagePath(item);
        if (cachePath) {
          renderItem = Object.assign({}, item, { cachePath });
        }
      } catch (_error) {
        await this.pdfRenderer.renderPage(item, slideEl, this.stageEl);
        return;
      }
      return await this.renderLocalCachedImageSlide(slideEl, renderItem, {
        className: "canvas-player-pdf-image",
        errorLabel: "cached PDF page",
      });
    }

    if (item.type === "pptx-page") {
      return await this.pptxRenderer.renderPage(item, slideEl, this.stageEl, {
        onNavigate: (target) => this.handlePptxNavigate(item, target),
      });
    }

    if (item.type === "native-presentation") {
      this.renderNativePresentationSlide(slideEl, item);
      return;
    }

    if (item.type === "pdf-page") {
      await this.pdfRenderer.renderPage(item, slideEl, this.stageEl);
      return;
    }

    if (item.type === "video") {
      await this.renderVideoSlide(slideEl, item);
      return;
    }

    if (item.type === "audio") {
      await this.renderAudioSlide(slideEl, item);
      return;
    }

    if (item.type === "url") {
      await this.renderIframeSlide(slideEl, item, "canvas-player-web-frame");
      return;
    }

    if (item.type === "presentation") {
      await this.renderPresentationSlide(slideEl, item);
      return;
    }

    if (item.type === "markdown") {
      const host = slideEl.createDiv({ cls: "canvas-player-markdown markdown-preview-view" });
      const markdown = await this.app.vault.read(item.file);
      return await this.renderMarkdown(host, markdown, item.file.path);
    }

    const host = slideEl.createDiv({ cls: "canvas-player-text markdown-preview-view" });
    return await this.renderMarkdown(host, item.text || "", "");
  }

  handlePptxNavigate(sourceItem, target = {}) {
    if (Number.isInteger(target.slideIndex)) {
      const targetIndex = this.items.findIndex((item) => (
        item.type === "pptx-page"
        && item.file === sourceItem.file
        && item.slideIndex === target.slideIndex
      ));
      if (targetIndex >= 0) {
        this.showIndex(targetIndex);
        return;
      }
    }

    if (target.url) {
      window.open(target.url, "_blank", "noopener,noreferrer");
    }
  }

  async renderMarkdown(host, markdown, sourcePath) {
    const component = new Component();
    component.load();

    try {
      await MarkdownRenderer.render(this.app, markdown, host, sourcePath, component);
    } catch (error) {
      component.unload();
      throw error;
    }

    return () => component.unload();
  }

  async renderVideoSlide(slideEl, item) {
    const shell = slideEl.createDiv({ cls: "canvas-player-video-shell" });
    const index = Number(slideEl.dataset.slideIndex);
    const shouldAutoplay = this.pendingVideoPlayIndex === index && this.index === index;
    const video = shell.createEl("video", {
      cls: "canvas-player-video",
      attr: {
        src: this.app.vault.getResourcePath(item.file),
        playsinline: "true",
        preload: "auto",
        tabindex: "-1",
        ...(shouldAutoplay ? { autoplay: "true" } : {}),
      },
    });
    video.setAttribute("disablepictureinpicture", "true");
    video.controls = false;
    video.preload = "auto";
    video.playsInline = true;
    video.addEventListener("loadedmetadata", () => this.updateVideoAspectRatio(shell, video));
    video.addEventListener("play", () => this.focusStageSoon());
    video.addEventListener("keydown", this.keyHandler, true);
    const playFromUserAction = (event) => {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      this.requestVideoPlayback(index, video);
    };
    shell.addEventListener("dblclick", playFromUserAction);
    if (shouldAutoplay) {
      this.requestVideoPlayback(index, video);
    }
    await waitForMediaLoad(video);
    this.updateVideoAspectRatio(shell, video);
    if (shouldAutoplay && this.index === index && video.paused) {
      this.requestVideoPlayback(index, video);
    }
  }

  updateVideoAspectRatio(shell, video) {
    const width = Number(video.videoWidth);
    const height = Number(video.videoHeight);
    if (!width || !height) return;
    const ratio = width / height;
    const maxWidth = Math.max(1, window.innerWidth - 48);
    const maxHeight = Math.max(1, window.innerHeight - 48);
    let displayWidth = maxWidth;
    let displayHeight = displayWidth / ratio;
    if (displayHeight > maxHeight) {
      displayHeight = maxHeight;
      displayWidth = displayHeight * ratio;
    }

    shell.style.setProperty("--cp-video-ratio", String(width / height));
    shell.style.setProperty("--cp-video-aspect", `${width} / ${height}`);
    shell.style.width = `${Math.round(displayWidth)}px`;
    shell.style.height = `${Math.round(displayHeight)}px`;
  }

  resizeActiveVideo() {
    const shell = this.activeSlideEl?.querySelector?.(".canvas-player-video-shell");
    const video = shell?.querySelector?.("video.canvas-player-video");
    if (shell && video) this.updateVideoAspectRatio(shell, video);
  }

  async renderAudioSlide(slideEl, item) {
    const src = this.app.vault.getResourcePath(item.file);
    const shell = slideEl.createDiv({ cls: "canvas-player-audio" });
    const record = shell.createDiv({ cls: "canvas-player-record", attr: { "aria-hidden": "true" } });
    record.createDiv({ cls: "canvas-player-record-label" });
    const info = shell.createDiv({ cls: "canvas-player-audio-info" });
    info.createDiv({ cls: "canvas-player-audio-kicker", text: "Audio" });
    info.createDiv({ cls: "canvas-player-audio-title", text: cleanOutlineTitle(item.title) });
    const audio = info.createEl("audio", {
      attr: {
        src,
        controls: "true",
        preload: "metadata",
      },
    });
    await waitForMediaLoad(audio);
  }

  async renderPresentationSlide(slideEl, item) {
    if (item.provider === "figma" && item.mode === "live-embed") {
      slideEl.addClass("is-figma-live-embed");
      this.renderLiveEmbedModeBanner(slideEl, item);
    }

    await this.renderIframeSlide(slideEl, item, "canvas-player-presentation-frame");
  }

  renderLiveEmbedModeBanner(slideEl, item) {
    const reason = item.fallbackReason || "Native rendering is unavailable.";
    slideEl.createDiv({
      cls: "canvas-player-live-mode-banner",
      text: `Figma Live Embed Mode: ${reason} This is not pixel-perfect playback.`,
    });
  }

  async renderRemoteImageSlide(slideEl, item) {
    const img = slideEl.createEl("img", {
      cls: "canvas-player-remote-slide-image",
      attr: { src: item.url, alt: item.title },
    });
    img.draggable = false;
    const loaded = await waitForMediaLoad(img);
    if (!loaded) {
      img.remove();
      renderSlideError(slideEl, `Could not load remote slide: ${item.title}`);
    }
  }

  async renderLocalCachedImageSlide(slideEl, item, options = {}) {
    const source = this.createLocalImageSource(item.cachePath);
    const img = slideEl.createEl("img", {
      cls: options.className || "canvas-player-cached-slide-image",
      attr: {
        src: source.url,
        alt: item.title,
      },
    });
    img.draggable = false;
    const loaded = await waitForMediaLoad(img);
    if (!loaded) {
      img.remove();
      source.cleanup();
      renderSlideError(slideEl, `Could not load ${options.errorLabel || "cached slide"}: ${item.title}`);
      return;
    }
    return () => source.cleanup();
  }

  createLocalImageSource(filePath) {
    if (canCreateBrowserObjectUrl() && fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      const objectUrl = window.URL.createObjectURL(new window.Blob([buffer], {
        type: getImageMimeType(filePath),
      }));
      return {
        url: objectUrl,
        cleanup: () => window.URL.revokeObjectURL(objectUrl),
      };
    }

    return {
      url: pathToFileURL(filePath).href,
      cleanup: () => {},
    };
  }

  renderNativePresentationSlide(slideEl, item) {
    const appLabel = "Microsoft PowerPoint";
    const host = slideEl.createDiv({ cls: "canvas-player-message canvas-player-native-presentation" });
    host.createEl("h1", { text: cleanOutlineTitle(item.title) });
    host.createEl("p", {
      text: `This deck plays in ${appLabel} so Canvas Playback can use the original slideshow engine.`,
    });
    host.createEl("p", {
      cls: "canvas-player-native-status",
      text: "Preparing native slideshow...",
    });
    const actions = host.createDiv({ cls: "canvas-player-native-actions" });
    const reopenButton = actions.createEl("button", {
      text: "Reopen slideshow",
      cls: "mod-cta",
      attr: { type: "button" },
    });
    reopenButton.addEventListener("click", async (event) => {
      event.preventDefault();
      await this.nativePresentationController?.stop().catch(() => {});
      if (this.items[this.index] !== item) return;
      this.startNativePresentation(item, slideEl, this.index);
    });
    const skipButton = actions.createEl("button", {
      text: "Skip deck",
      attr: { type: "button" },
    });
    skipButton.addEventListener("click", async (event) => {
      event.preventDefault();
      await this.nativePresentationController?.stop().catch(() => {});
      if (this.index < this.items.length - 1) {
        this.showIndex(this.index + 1);
      }
    });
  }

  updateNativePresentationSlide(slideEl, info = {}) {
    const host = slideEl?.querySelector?.(".canvas-player-native-presentation");
    const statusEl = host?.querySelector?.(".canvas-player-native-status");
    if (!host || !statusEl) return;
    if (info.state) {
      host.setAttribute("data-native-state", info.state);
    }
    if (info.detail) {
      statusEl.textContent = info.detail;
    }
  }

  async renderIframeSlide(slideEl, item, className) {
    const shell = slideEl.createDiv({
      cls: `canvas-player-embed-shell ${item.type === "presentation" ? "is-presentation" : "is-web"} ${item.provider ? `is-${item.provider}` : ""}`,
    });
    const iframe = shell.createEl("iframe", {
      cls: className,
      attr: {
        title: item.title,
        tabindex: "-1",
        sandbox: "allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads",
        allow: "fullscreen; clipboard-read; clipboard-write; autoplay",
        allowfullscreen: "true",
      },
    });
    const shield = shell.createDiv({ cls: "canvas-player-embed-shield", attr: { "aria-hidden": "true" } });
    shield.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      this.stageEl?.focus({ preventScroll: true });
    });
    const loaded = waitForMediaLoad(iframe);
    iframe.setAttr("src", item.url);
    await loaded;
    this.focusStageSoon();
  }

  isCurrentItemPresentation() {
    return this.items[this.index]?.type === "presentation";
  }

  isCurrentItemVideo() {
    return this.items[this.index]?.type === "video";
  }

  isCurrentItemKeyboardGuarded() {
    return this.isCurrentItemPresentation() || this.isCurrentItemVideo();
  }

  syncFocusGuard() {
    if (this.isCurrentItemKeyboardGuarded()) {
      this.startFocusGuard();
    } else {
      this.stopFocusGuard();
    }
    this.focusStageSoon();
  }

  startFocusGuard() {
    if (this.focusGuardTimer) return;
    this.focusGuardTimer = window.setInterval(() => {
      if (!this.isCurrentItemKeyboardGuarded()) {
        this.stopFocusGuard();
        return;
      }
      if (document.activeElement !== this.stageEl) {
        this.stageEl?.focus({ preventScroll: true });
      }
    }, 180);
  }

  stopFocusGuard() {
    if (!this.focusGuardTimer) return;
    window.clearInterval(this.focusGuardTimer);
    this.focusGuardTimer = null;
  }

  focusStageSoon() {
    window.setTimeout(() => this.stageEl?.focus({ preventScroll: true }), 0);
  }

  preloadAround(index) {
    const start = Math.max(0, index - PRELOAD_RADIUS);
    const end = Math.min(this.items.length - 1, index + PRELOAD_RADIUS);
    for (let i = start; i <= end; i += 1) {
      this.ensureSlide(i);
    }

    const activeEntryIndex = findActiveOutlineEntry(this.outlineEntries, index);
    const activeEntry = this.outlineEntries[activeEntryIndex];
    const previousEntry = this.outlineEntries[activeEntryIndex - 1];
    const nextEntry = this.outlineEntries[activeEntryIndex + 1];
    [previousEntry, activeEntry, nextEntry].forEach((entry) => {
      if (!entry) return;
      const entryWarmEnd = Math.min(entry.endIndex, entry.startIndex + 2);
      for (let i = entry.startIndex; i <= entryWarmEnd; i += 1) {
        this.ensureSlide(i);
      }
    });
  }

  deferPreloadAround(index) {
    const preload = () => this.preloadAround(index);
    if (window.requestIdleCallback) {
      window.requestIdleCallback(preload, { timeout: 500 });
    } else {
      window.setTimeout(preload, 120);
    }
  }

  jumpToOutlineEntry(entry) {
    this.showIndex(entry.startIndex);
  }

  handleOutlineJumpEvent(event) {
    const button = event.target?.closest?.(".canvas-player-outline-item");
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();

    const entryIndex = Number(button.dataset.entryIndex);
    const fallbackIndex = this.outlineButtons ? this.outlineButtons.indexOf(button) : -1;
    const entry = this.outlineEntries[entryIndex] || this.outlineEntries[fallbackIndex];
    if (!entry) return;

    this.setOutlineOpen(true);
    this.showIndex(entry.startIndex);
  }

  scheduleDeckWarmup() {
    if (this.items.length > PRELOAD_ALL_LIMIT) return;

    const warm = () => {
      for (let i = 0; i < this.items.length; i += 1) {
        this.ensureSlide(i);
      }
    };

    if (window.requestIdleCallback) {
      window.requestIdleCallback(warm, { timeout: 1200 });
    } else {
      window.setTimeout(warm, 250);
    }
  }

  trimCache(index) {
    if (this.items.length <= PRELOAD_ALL_LIMIT) return;

    const min = Math.max(0, index - PRELOAD_RADIUS);
    const max = Math.min(this.items.length - 1, index + PRELOAD_RADIUS);
    for (const [cachedIndex, cached] of this.slideCache.entries()) {
      if (cachedIndex < min || cachedIndex > max) {
        cached.disposed = true;
        cached.cleanup?.();
        cached.el.remove();
        this.slideCache.delete(cachedIndex);
      }
    }
  }

  handleKey(event) {
    const target = event.target;
    const isTyping = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
    const key = event.key;

    if (key === " " && event.shiftKey) {
      if (isTyping) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      this.previous();
    } else if (key === " " || key === "ArrowRight" || key === "ArrowDown" || key === "PageDown") {
      if (isTyping) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      this.next();
    } else if (key === "ArrowLeft" || key === "ArrowUp" || key === "PageUp") {
      if (isTyping) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      this.previous();
    } else if (key === "Home") {
      if (isTyping) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      this.showIndex(0);
    } else if (key === "End") {
      if (isTyping) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      this.showIndex(this.items.length - 1);
    } else if (key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.exitFullscreenOrClose();
    } else if (key.toLowerCase() === "f") {
      if (isTyping) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      this.toggleFullscreen();
    }
  }

  next() {
    if (this.index < this.items.length - 1) {
      this.showIndex(this.index + 1, { autoplayVideo: true });
    }
  }

  autoplayVideoAtIndex(index) {
    const token = ++this.pendingVideoPlayToken;
    this.pendingVideoPlayIndex = index;
    const playReadyVideo = () => {
      if (this.pendingVideoPlayToken !== token || this.pendingVideoPlayIndex !== index || this.index !== index) return true;
      const video = this.getVideoElementForIndex(index);
      if (!video || video.error) return false;
      this.pendingVideoPlayIndex = null;
      if (video.ended) {
        try {
          video.currentTime = 0;
        } catch (_error) {}
      }
      if (video.paused) this.requestVideoPlayback(index, video);
      return true;
    };

    if (playReadyVideo()) return;

    const cached = this.slideCache.get(index);
    cached?.ready?.then(() => {
      playReadyVideo();
    }).catch(() => {
      if (this.pendingVideoPlayToken === token) this.pendingVideoPlayIndex = null;
    });
  }

  getVideoElementForIndex(index) {
    const slideEl = this.slideCache.get(index)?.el || (index === this.index ? this.activeSlideEl : null);
    return slideEl?.querySelector?.("video.canvas-player-video") || null;
  }

  requestVideoPlayback(index, video) {
    if (!video || video.error) return;
    video.autoplay = true;
    video.preload = "auto";
    video.playsInline = true;
    video.load?.();

    const isCurrent = () => this.index === index && this.items[index]?.type === "video" && video === this.getVideoElementForIndex(index);
    const attemptPlay = () => {
      if (!isCurrent() || !video.paused) return;
      if (video.ended) {
        try {
          video.currentTime = 0;
        } catch (_error) {}
      }

      const playPromise = video.play();
      if (playPromise?.catch) {
        playPromise.catch(() => {});
      }
      this.focusStageSoon();
    };

    attemptPlay();
    ["loadedmetadata", "loadeddata", "canplay"].forEach((eventName) => {
      video.addEventListener(eventName, attemptPlay, { once: true });
    });
    [60, 180, 420].forEach((delay) => {
      window.setTimeout(attemptPlay, delay);
    });
  }

  playVideo(video) {
    const playPromise = video?.play?.();
    if (playPromise?.catch) {
      playPromise.catch(() => {});
    }
    this.focusStageSoon();
  }

  previous() {
    if (this.index > 0) {
      this.showIndex(this.index - 1);
    }
  }

  toggleFullscreen() {
    if (isElectronFullscreen()) {
      exitFullscreenIfActive();
      this.lastFullscreenExitAt = Date.now();
    } else {
      this.enterFullscreen();
    }
  }

  enterFullscreen(targetEl = null) {
    if (isElectronFullscreen()) return;
    const win = getElectronWindow();
    if (win) {
      win.setFullScreen(true);
      return;
    }
    const target = targetEl || this.stageEl || document.documentElement;
    if (target.requestFullscreen) {
      target.requestFullscreen().catch(() => {});
    }
  }

  exitFullscreenOrClose() {
    if (isElectronFullscreen()) {
      exitFullscreenIfActive();
      this.lastFullscreenExitAt = Date.now();
    } else {
      this.close();
    }
  }
}

function buildOutlineEntries(items) {
  const entries = [];
  const seen = new Set();

  items.forEach((item, index) => {
    const key = getOutlineKey(item);
    if (seen.has(key)) return;
    seen.add(key);

    entries.push({
      key,
      startIndex: index,
      title: cleanOutlineTitle(item.title),
      detail: getOutlineDetail(item),
    });
  });

  entries.forEach((entry, index) => {
    const next = entries[index + 1];
    entry.endIndex = next ? next.startIndex - 1 : items.length - 1;
  });

  return entries;
}

function getOutlineKey(item) {
  if (item.node?.id) return item.node.id;
  if (item.file?.path) return item.file.path;
  return item.url || item.title;
}

function cleanOutlineTitle(title) {
  const cleaned = String(title || "Untitled").replace(/^#+\s*/, "").replace(/^komorebi · media\//, "");
  if (/^https?:\/\//i.test(cleaned)) return cleaned;
  return cleaned.split(/[\\/]/).filter(Boolean).pop() || cleaned;
}

function extractFirstPresentationEmbed(markdown) {
  return extractPresentationEmbeds(markdown)[0] || null;
}

function extractPresentationEmbeds(markdown) {
  const matches = String(markdown || "").match(/https?:\/\/[^\s<>)"']+/gi);
  if (!matches) return [];

  const embeds = [];
  const seen = new Set();
  for (const match of matches) {
    const sourceUrl = match.replace(/[.,，。!?！？]+$/, "");
    const embed = createPresentationEmbed(sourceUrl);
    if (!embed || seen.has(embed.url)) continue;
    seen.add(embed.url);
    embeds.push(embed);
  }
  return embeds;
}

function createPresentationEmbed(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch (_error) {
    return null;
  }

  if (isHost(url, "figma.com")) return createFigmaPresentationEmbed(url);
  if (isHost(url, "gamma.app")) return createGammaPresentationEmbed(url);
  if (isHost(url, "canva.com")) return createCanvaPresentationEmbed(url);
  if (url.hostname === "docs.google.com" && url.pathname.includes("/presentation/")) return createGoogleSlidesPresentationEmbed(url);
  if (isHost(url, "prezi.com")) return createPreziPresentationEmbed(url);
  if (isHost(url, "pitch.com")) return createGenericPresentationEmbed(url, "pitch", "Pitch");
  if (isHost(url, "tome.app")) return createGenericPresentationEmbed(url, "tome", "Tome");
  if (isHost(url, "beautiful.ai")) return createGenericPresentationEmbed(url, "beautiful-ai", "Beautiful.ai");
  if (isHost(url, "genially.com")) return createGenericPresentationEmbed(url, "genially", "Genially");
  return null;
}

function createFigmaPresentationEmbed(url) {
  if (!isHost(url, "figma.com")) return null;

  const parts = url.pathname.split("/").filter(Boolean);
  const fileType = parts[0];
  const fileKey = parts[1];
  if (!FIGMA_FILE_TYPES.has(fileType) || !fileKey) return null;

  const embedUrl = new URL(url.toString());
  embedUrl.hostname = "embed.figma.com";
  embedUrl.searchParams.delete("t");
  embedUrl.searchParams.set("embed-host", "canvas-playback");
  embedUrl.searchParams.set("footer", "false");
  embedUrl.searchParams.set("page-selector", "false");
  embedUrl.searchParams.set("viewport-controls", "false");

  return {
    provider: "figma",
    label: "Figma",
    title: getPresentationTitleFromUrl(url),
    sourceUrl: url.toString(),
    url: embedUrl.toString(),
    fileKey,
    nodeId: normalizeFigmaNodeId(url.searchParams.get("node-id") || ""),
  };
}

async function createFigmaSlideSteps(presentation, node, context) {
  const runtime = normalizePlaybackContext(context);
  if (!runtime.figmaSlideCache) {
    return {
      steps: [],
      fallbackReason: "Local Figma cache is not available.",
    };
  }

  return runtime.figmaSlideCache.createSteps(presentation, node, {
    token: runtime.settings.figmaAccessToken,
    scale: runtime.settings.figmaRenderScale,
  });
}

async function requestFigmaApiJson(url, token) {
  const response = await requestUrl({
    url,
    method: "GET",
    headers: {
      "X-Figma-Token": token,
    },
  });
  const data = response.json || JSON.parse(response.text);
  if (response.status && response.status >= 400) {
    const error = new Error(data?.err || `Figma API request failed with HTTP ${response.status}.`);
    error.status = data?.status || response.status;
    throw error;
  }
  if (data?.status && data.status >= 400) {
    const error = new Error(data.err || `Figma API request failed with HTTP ${data.status}.`);
    error.status = data.status;
    throw error;
  }
  if (data?.err) {
    throw new Error(data.err);
  }
  return data;
}

async function requestFigmaImageUrls(fileKey, nodeIds, token, options = {}) {
  const results = {};
  const format = options.format || FIGMA_EXPORT_FORMAT;
  const scale = clampNumber(options.scale, 1, 3, DEFAULT_SETTINGS.figmaRenderScale);

  for (let start = 0; start < nodeIds.length; start += FIGMA_IMAGE_BATCH_SIZE) {
    const batch = nodeIds.slice(start, start + FIGMA_IMAGE_BATCH_SIZE);
    const url = new URL(`https://api.figma.com/v1/images/${encodeURIComponent(fileKey)}`);
    url.searchParams.set("ids", batch.join(","));
    url.searchParams.set("format", format);
    url.searchParams.set("scale", String(scale));

    const data = await requestFigmaApiJson(url.toString(), token);
    Object.assign(results, data.images || {});
  }

  return results;
}

function findFigmaSlideNodes(documentNode) {
  const nativeSlides = [];
  collectFigmaNodesInTreeOrder(documentNode, (node) => {
    if (isFigmaNativeSlideNode(node)) nativeSlides.push(node);
  });
  if (nativeSlides.length > 0) return nativeSlides;

  const frameSlides = [];
  collectFigmaNodesInTreeOrder(documentNode, (node) => {
    if (isFigmaFrameSlideNode(node)) frameSlides.push(node);
  });
  return frameSlides;
}

function collectFigmaNodesInTreeOrder(root, visitor) {
  const visit = (node) => {
    if (!node) return;
    if (node !== root) visitor(node);
    for (const child of node.children || []) visit(child);
  };
  visit(root);
}

function isFigmaNativeSlideNode(node) {
  return node?.type === "SLIDE" && !!node.id;
}

function isFigmaFrameSlideNode(node) {
  if (node?.type !== "FRAME" || !node.id) return false;
  const box = node.absoluteBoundingBox || node.absoluteRenderBounds;
  if (!box || !Number.isFinite(box.width) || !Number.isFinite(box.height) || box.width <= 0 || box.height <= 0) {
    return false;
  }

  const aspect = box.width / box.height;
  return box.width >= 600 && box.height >= 300 && Math.abs(aspect - (16 / 9)) < 0.08;
}

function createFigmaNodeUrl(sourceUrl, nodeId) {
  try {
    const url = new URL(sourceUrl);
    url.searchParams.set("node-id", nodeId.replace(/:/g, "-"));
    return url.toString();
  } catch (_error) {
    return sourceUrl;
  }
}

function normalizeFigmaNodeId(nodeId) {
  return String(nodeId || "").replace(/-/g, ":");
}

function createGammaPresentationEmbed(url) {
  if (!isHost(url, "gamma.app")) return null;

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] === "embed" && parts[1]) {
    return createGenericPresentationEmbed(url, "gamma", "Gamma");
  }

  const gammaId = extractGammaId(parts);
  if (!gammaId) return createGenericPresentationEmbed(url, "gamma", "Gamma");

  const embedUrl = new URL(`https://gamma.app/embed/${gammaId}`);
  return {
    provider: "gamma",
    label: "Gamma",
    title: getPresentationTitleFromUrl(url),
    sourceUrl: url.toString(),
    url: embedUrl.toString(),
  };
}

function createCanvaPresentationEmbed(url) {
  if (!isHost(url, "canva.com")) return null;

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] !== "design" || !parts[1]) return null;

  const embedUrl = new URL(url.toString());
  embedUrl.hostname = "www.canva.com";
  const pathParts = embedUrl.pathname.split("/").filter(Boolean);
  const last = pathParts[pathParts.length - 1];
  if (last === "present") {
    pathParts[pathParts.length - 1] = "view";
  } else if (last !== "view" && last !== "watch") {
    pathParts.push("view");
  }
  embedUrl.pathname = `/${pathParts.join("/")}`;
  embedUrl.searchParams.set("embed", "");

  return {
    provider: "canva",
    label: "Canva",
    title: getPresentationTitleFromUrl(url),
    sourceUrl: url.toString(),
    url: embedUrl.toString(),
  };
}

function createGoogleSlidesPresentationEmbed(url) {
  const idMatch = url.pathname.match(/\/presentation\/d\/([^/]+)/);
  if (!idMatch) return null;

  const embedUrl = new URL(`https://docs.google.com/presentation/d/${idMatch[1]}/embed`);
  embedUrl.searchParams.set("start", "false");
  embedUrl.searchParams.set("loop", "false");
  embedUrl.searchParams.set("delayms", "3000");
  embedUrl.searchParams.set("rm", "minimal");

  const slideMatch = url.hash.match(/slide=([^&]+)/);
  if (slideMatch) embedUrl.searchParams.set("slide", slideMatch[1]);

  return {
    provider: "google-slides",
    label: "Google Slides",
    title: getPresentationTitleFromUrl(url),
    sourceUrl: url.toString(),
    url: embedUrl.toString(),
  };
}

function createPreziPresentationEmbed(url) {
  if (!isHost(url, "prezi.com")) return null;

  const parts = url.pathname.split("/").filter(Boolean);
  let preziId = "";
  if (parts[0] === "embed" && parts[1]) preziId = parts[1];
  if (parts[0] === "p" && parts[1] === "embed" && parts[2]) preziId = parts[2];
  if (parts[0] === "p" && parts[1]) preziId = parts[1];
  if (!preziId) return null;

  const embedUrl = new URL(`https://prezi.com/p/embed/${preziId}/`);
  return {
    provider: "prezi",
    label: "Prezi",
    title: getPresentationTitleFromUrl(url),
    sourceUrl: url.toString(),
    url: embedUrl.toString(),
  };
}

function createGenericPresentationEmbed(url, provider, label) {
  return {
    provider,
    label,
    title: getPresentationTitleFromUrl(url),
    sourceUrl: url.toString(),
    url: url.toString(),
  };
}

function extractGammaId(parts) {
  const last = decodeURIComponent(parts[parts.length - 1] || "");
  const match = last.match(/([a-z0-9]{8,})$/i);
  return match ? match[1] : "";
}

function isHost(url, domain) {
  return url.hostname === domain || url.hostname.endsWith(`.${domain}`);
}

function getPresentationTitleFromUrl(rawUrl) {
  try {
    const url = rawUrl instanceof URL ? rawUrl : new URL(rawUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    const rawTitle = [...parts].reverse().find((part) => !/^(view|present|embed|docs|design|slides|deck|proto|board|public)$/i.test(part));
    if (!rawTitle || /^[a-z0-9_-]{8,}$/i.test(rawTitle)) return "";
    return decodeURIComponent(rawTitle).replace(/[-_]+/g, " ").trim();
  } catch (_error) {
    return "";
  }
}

function getOutlineDetail(item) {
  if (item.type === "pptx-page" && item.pageCount > 1) return `${item.pageCount}p`;
  if (item.type === "pptx-page") return "PPTX";
  if (item.type === "native-presentation") return "PPTX";
  if (item.type === "pdf-image" && item.pageCount > 1) return `${item.pageCount}p`;
  if (item.type === "pdf-image") return "PDF";
  if (item.type === "pdf-page" && item.pageCount > 1) return `${item.pageCount}p`;
  if (item.type === "pdf-page") return "PDF";
  if (item.type === "figma-image" && item.pageCount > 1) return `${item.pageCount}p`;
  if (item.type === "figma-image") return "Figma";
  if (item.type === "keynote-image" && item.pageCount > 1) return `${item.pageCount}p`;
  if (item.type === "keynote-image") return "KEY";
  if (item.type === "remote-image" && item.pageCount > 1) return `${item.pageCount}p`;
  if (item.type === "remote-image") return "Image";
  if (item.type === "image") return "Image";
  if (item.type === "video") return "Video";
  if (item.type === "audio") return "Audio";
  if (item.type === "presentation") return item.provider ? item.provider.replace(/-/g, " ") : "Deck";
  if (item.type === "markdown") return "MD";
  if (item.type === "url") return "URL";
  if (item.type === "text") return "Text";
  return "";
}

function findActiveOutlineEntry(entries, index) {
  let active = 0;
  for (let i = 0; i < entries.length; i += 1) {
    if (entries[i].startIndex <= index) active = i;
    else break;
  }
  return active;
}

function waitForMediaLoad(element) {
  return new Promise((resolve) => {
    if (element instanceof HTMLImageElement && element.complete) {
      resolve(element.naturalWidth > 0 || element.naturalHeight > 0);
      return;
    }
    if (element instanceof HTMLMediaElement && element.readyState >= 1) {
      resolve(true);
      return;
    }

    let settled = false;
    const done = (loaded = true) => {
      if (settled) return;
      settled = true;
      resolve(loaded);
    };
    element.addEventListener("load", () => done(true), { once: true });
    element.addEventListener("loadedmetadata", () => done(true), { once: true });
    element.addEventListener("canplay", () => done(true), { once: true });
    element.addEventListener("error", () => done(false), { once: true });
    window.setTimeout(() => done(true), 1800);
  });
}

function renderSlideError(slideEl, message, error) {
  slideEl.empty();
  const host = slideEl.createDiv({ cls: "canvas-player-message" });
  host.createEl("h1", { text: "Slide unavailable" });
  host.createEl("p", { text: message });
  if (error?.message) {
    host.createEl("p", { text: error.message });
  }
}
