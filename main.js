const { MarkdownRenderer, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } = require("obsidian");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

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

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif", "svg", "avif", "bmp"]);
const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "m4v", "webm", "ogv", "avi", "mkv"]);
const AUDIO_EXTENSIONS = new Set(["mp3", "m4a", "aac", "wav", "ogg", "opus", "flac"]);
const DOCUMENT_EXTENSIONS = new Set(["pdf"]);
const CONVERTIBLE_EXTENSIONS = new Set(["ppt", "pptx", "pps", "ppsx", "pot", "potx", "key", "odp"]);
const MARKDOWN_EXTENSIONS = new Set(["md", "markdown", "deck"]);
const SUPPORTED_FILE_EXTENSIONS = new Set([
  ...IMAGE_EXTENSIONS,
  ...VIDEO_EXTENSIONS,
  ...AUDIO_EXTENSIONS,
  ...DOCUMENT_EXTENSIONS,
  ...CONVERTIBLE_EXTENSIONS,
  ...MARKDOWN_EXTENSIONS,
]);
const PRELOAD_ALL_LIMIT = 48;
const PRELOAD_RADIUS = 4;

module.exports = class CanvasPlaybackPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
    this.pdfRenderer = new PdfBitmapRenderer(this.app, this.manifest);
    this.pdfRenderer.prepare();
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
  }

  onunload() {
    this.pdfRenderer?.destroy();
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

    const analysis = await analyzeCanvas(this.app, canvas);
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
      new Notice(`Canvas Playback: ${analysis.warnings.length} item(s) will be skipped.`, 5000);
    }

    new CanvasPlayerModal(this.app, analysis.playable, this.pdfRenderer, this.settings).open();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    if (!DESIGN_SYSTEM_BY_ID.has(this.settings.designSystem)) {
      this.settings.designSystem = DEFAULT_SETTINGS.designSystem;
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
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
  }
}

async function analyzeCanvas(app, canvas) {
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
    const starts = nodes.filter((node) => incoming.get(node.id) === 0 && adjacency.get(node.id).length > 0);
    if (starts.length === 0) {
      fatal.push("Could not find a start node. Add a node with no incoming edge and at least one outgoing edge.");
    } else if (starts.length > 1) {
      fatal.push(`Multiple start nodes found: ${starts.map(getNodeTitle).join(", ")}.`);
    } else {
      orderedNodes = walkSingleChain(starts[0], adjacency, nodeById, fatal, warnings);
      const linkedIds = new Set();
      for (const edge of validEdges) {
        linkedIds.add(edge.fromNode);
        linkedIds.add(edge.toNode);
      }
      const visitedIds = new Set(orderedNodes.map((node) => node.id));
      const missingFromChain = [...linkedIds].filter((id) => !visitedIds.has(id));
      if (missingFromChain.length > 0) {
        fatal.push(`Disconnected chain segment found: ${missingFromChain.map((id) => getNodeTitle(nodeById.get(id))).join(", ")}.`);
      }
    }
  }

  const playable = [];
  for (const node of orderedNodes) {
    const item = await normalizePlayableNode(app, node);
    if (item.error) {
      warnings.push(item.error);
      continue;
    }
    playable.push(...expandPlayableItem(item));
  }

  if (nodes.length > 0 && playable.length === 0 && fatal.length === 0) {
    fatal.push("No playable nodes were found.");
  }

  return { fatal, warnings, playable };
}

function expandPlayableItem(item) {
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

async function normalizePlayableNode(app, node) {
  if (hasDirective(node, "SKIP") || hasDirective(node, "BACKUP")) {
    return { error: `${getNodeTitle(node)} is marked ${hasDirective(node, "SKIP") ? "SKIP" : "BACKUP"} and will be skipped.` };
  }

  if (node.type === "text") {
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

  if (CONVERTIBLE_EXTENSIONS.has(extension)) {
    const converted = await findConvertedPdf(app, file);
    if (!converted) {
      return { error: `${node.file} needs a PDF export before it can be played in this local prototype.` };
    }
    return {
      type: "pdf",
      title: getNodeTitle(node),
      node,
      file: converted,
      sourceFile: file,
      converted: true,
      pages: await countPdfPages(app, converted),
    };
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
    return { type: "pdf", title: getNodeTitle(node), node, file, pages: await countPdfPages(app, file) };
  }

  if (MARKDOWN_EXTENSIONS.has(extension)) {
    return { type: "markdown", title: getNodeTitle(node), node, file };
  }

  return { error: `${node.file} could not be normalized.` };
}

async function countPdfPages(app, file) {
  try {
    const buffer = await app.vault.readBinary(file);
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

function getExtension(path) {
  const match = String(path).toLowerCase().match(/\.([^.]+)$/);
  return match ? match[1] : "";
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
  }

  prepare() {
    this.getPdfJs().catch(() => {
      this.pdfjsPromise = null;
    });
  }

  async renderPage(item, slideEl, stageEl) {
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

  async getDocument(file) {
    if (!this.documentCache.has(file.path)) {
      this.documentCache.set(file.path, this.loadDocument(file));
    }
    return this.documentCache.get(file.path);
  }

  async loadDocument(file) {
    const pdfjs = await this.getPdfJs();
    const data = new Uint8Array(await this.app.vault.readBinary(file));
    return pdfjs.getDocument({
      data,
      useSystemFonts: true,
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
}

class CanvasPlayerModal extends Modal {
  constructor(app, items, pdfRenderer, settings) {
    super(app);
    this.items = items;
    this.outlineEntries = buildOutlineEntries(items);
    this.pdfRenderer = pdfRenderer;
    this.settings = settings;
    this.index = 0;
    this.slideCache = new Map();
    this.activeSlideEl = null;
    this.transitionToken = 0;
    this.outlineOpen = false;
    this.lastFullscreenExitAt = 0;
    this.keyHandler = (event) => this.handleKey(event);
    this.pointerMoveHandler = (event) => this.handlePointerMove(event);
    this.pointerLeaveHandler = () => this.setOutlineOpen(false);
    this.fullscreenChangeHandler = () => this.handleFullscreenChange();
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

    applyDesignSystem(this.stageEl, this.settings.designSystem);
    this.contentHostEl = this.stageEl.createDiv({ cls: "canvas-player-content" });
    this.createOutline();
    window.addEventListener("keydown", this.keyHandler, true);
    window.addEventListener("mousemove", this.pointerMoveHandler, { passive: true });
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
    document.removeEventListener("fullscreenchange", this.fullscreenChangeHandler);
    this.stageEl?.removeEventListener("mouseleave", this.pointerLeaveHandler);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    exitFullscreenIfActive();
    this.slideCache.clear();
    this.stageEl?.remove();
    this.contentEl.empty();
  }

  async showIndex(index) {
    if (index < 0 || index >= this.items.length) return;

    const token = ++this.transitionToken;
    this.index = index;
    this.updateOutline();

    const targetSlideEl = await this.ensureSlide(index);
    if (token !== this.transitionToken) return;

    const previousSlideEl = this.activeSlideEl;
    this.activeSlideEl = targetSlideEl;
    targetSlideEl.addClass("is-active");

    if (previousSlideEl && previousSlideEl !== targetSlideEl) {
      previousSlideEl.removeClass("is-active");
    }

    this.trimCache(index);
    this.deferPreloadAround(index);
  }

  createOutline() {
    this.outlineEl = this.stageEl.createDiv({ cls: "canvas-player-outline" });
    this.outlineEl.createDiv({ cls: "canvas-player-outline-rail" });
    const panel = this.outlineEl.createDiv({ cls: "canvas-player-outline-panel" });
    panel.createDiv({ cls: "canvas-player-outline-title", text: "Slides" });
    this.outlineProgressEl = panel.createDiv({ cls: "canvas-player-outline-progress" });
    const list = panel.createDiv({ cls: "canvas-player-outline-list" });
    this.outlineButtons = this.outlineEntries.map((entry) => {
      const button = list.createEl("button", {
        cls: "canvas-player-outline-item",
        attr: { type: "button" },
      });
      button.createSpan({ cls: "canvas-player-outline-item-name", text: entry.title });
      if (entry.detail) {
        button.createSpan({ cls: "canvas-player-outline-item-detail", text: entry.detail });
      }
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.jumpToOutlineEntry(entry);
      });
      return button;
    });
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

  updateOutline() {
    const item = this.items[this.index];
    const pageText = item.type === "pdf-page" && item.pageCount > 1 ? ` · page ${item.page}/${item.pageCount}` : "";
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

  async ensureSlide(index) {
    const cached = this.slideCache.get(index);
    if (cached) {
      await cached.ready;
      return cached.el;
    }

    const item = this.items[index];
    const slideEl = this.contentHostEl.createDiv({ cls: "canvas-player-slide" });
    slideEl.dataset.slideIndex = String(index);
    const ready = this.renderSlide(slideEl, item).then(() => {
      slideEl.addClass("is-ready");
      return slideEl;
    }).catch((error) => {
      renderSlideError(slideEl, `Could not render ${item.title || "slide"}.`, error);
      slideEl.addClass("is-ready");
      return slideEl;
    });
    this.slideCache.set(index, { el: slideEl, ready });
    await ready;
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
      const iframe = slideEl.createEl("iframe", { attr: { title: item.title, sandbox: "allow-same-origin allow-scripts allow-forms allow-popups" } });
      const loaded = waitForMediaLoad(iframe);
      iframe.setAttr("src", item.url);
      await loaded;
      return;
    }

    if (item.type === "markdown") {
      const host = slideEl.createDiv({ cls: "canvas-player-markdown markdown-preview-view" });
      const markdown = await this.app.vault.read(item.file);
      await MarkdownRenderer.render(this.app, markdown, host, item.file.path, this);
      return;
    }

    const host = slideEl.createDiv({ cls: "canvas-player-text markdown-preview-view" });
    await MarkdownRenderer.render(this.app, item.text || "", host, "", this);
  }

  async renderVideoSlide(slideEl, item) {
    const video = slideEl.createEl("video", {
      cls: "canvas-player-video",
      attr: {
        src: this.app.vault.getResourcePath(item.file),
        controls: "true",
        playsinline: "true",
        preload: "metadata",
      },
    });
    video.setAttribute("disablepictureinpicture", "true");
    await waitForMediaLoad(video);
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

  preloadAround(index) {
    const start = Math.max(0, index - PRELOAD_RADIUS);
    const end = Math.min(this.items.length - 1, index + PRELOAD_RADIUS);
    for (let i = start; i <= end; i += 1) {
      this.ensureSlide(i).catch(() => {});
    }

    const activeEntryIndex = findActiveOutlineEntry(this.outlineEntries, index);
    const activeEntry = this.outlineEntries[activeEntryIndex];
    const previousEntry = this.outlineEntries[activeEntryIndex - 1];
    const nextEntry = this.outlineEntries[activeEntryIndex + 1];
    [previousEntry, activeEntry, nextEntry].forEach((entry) => {
      if (!entry) return;
      const entryWarmEnd = Math.min(entry.endIndex, entry.startIndex + 2);
      for (let i = entry.startIndex; i <= entryWarmEnd; i += 1) {
        this.ensureSlide(i).catch(() => {});
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
    const currentEntryIndex = findActiveOutlineEntry(this.outlineEntries, this.index);
    const currentEntry = this.outlineEntries[currentEntryIndex];
    if (currentEntry?.key === entry.key && this.index >= entry.startIndex && this.index <= entry.endIndex) {
      return;
    }
    this.showIndex(entry.startIndex);
  }

  scheduleDeckWarmup() {
    if (this.items.length > PRELOAD_ALL_LIMIT) return;

    const warm = () => {
      for (let i = 0; i < this.items.length; i += 1) {
        this.ensureSlide(i).catch(() => {});
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
      this.showIndex(this.index + 1);
    }
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

  enterFullscreen() {
    if (isElectronFullscreen()) return;
    const win = getElectronWindow();
    if (win) {
      win.setFullScreen(true);
      return;
    }
    const target = document.documentElement;
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
  return String(title || "Untitled").replace(/^komorebi · media\//, "").replace(/^#+\s*/, "");
}

function getOutlineDetail(item) {
  if (item.type === "pdf-page" && item.pageCount > 1) return `${item.pageCount}p`;
  if (item.type === "pdf-page") return "PDF";
  if (item.type === "image") return "Image";
  if (item.type === "video") return "Video";
  if (item.type === "audio") return "Audio";
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
