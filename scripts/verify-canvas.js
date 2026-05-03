#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const SUPPORTED_IMAGES = new Set(["png", "jpg", "jpeg", "webp", "gif", "svg", "avif", "bmp"]);
const SUPPORTED_VIDEO = new Set(["mp4", "mov", "m4v", "webm", "ogv", "avi", "mkv"]);
const SUPPORTED_AUDIO = new Set(["mp3", "m4a", "aac", "wav", "ogg", "opus", "flac"]);
const SUPPORTED_MARKDOWN = new Set(["md", "markdown", "deck"]);
const CONVERTIBLE = new Set(["ppt", "pptx", "pps", "ppsx", "pot", "potx", "key", "odp"]);

const [vaultPath, canvasPath] = process.argv.slice(2);

if (!vaultPath || !canvasPath) {
  console.error("Usage: node scripts/verify-canvas.js <vault-path> <canvas-path>");
  process.exit(2);
}

const canvas = JSON.parse(fs.readFileSync(canvasPath, "utf8"));
const nodes = Array.isArray(canvas.nodes) ? canvas.nodes : [];
const edges = Array.isArray(canvas.edges) ? canvas.edges : [];
const nodeById = new Map(nodes.map((node) => [node.id, node]));
const incoming = new Map(nodes.map((node) => [node.id, 0]));
const adjacency = new Map(nodes.map((node) => [node.id, []]));
const validEdges = [];

for (const edge of edges) {
  if (!nodeById.has(edge.fromNode) || !nodeById.has(edge.toNode)) continue;
  adjacency.get(edge.fromNode).push(edge.toNode);
  incoming.set(edge.toNode, incoming.get(edge.toNode) + 1);
  validEdges.push(edge);
}

const orderedNodes = validEdges.length === 0
  ? [...nodes].sort(compareCanvasPosition)
  : getSingleChain();

const warnings = [];
const steps = [];

for (const node of orderedNodes) {
  const normalized = normalizeNode(node);
  if (normalized.warning) {
    warnings.push(normalized.warning);
    continue;
  }
  steps.push(...expandNode(normalized));
}

if (steps.length === 0) {
  console.error("No playable steps found.");
  process.exit(1);
}

for (let i = 0; i < steps.length - 1; i += 1) {
  if (steps[i + 1].index !== steps[i].index + 1) {
    console.error(`Broken next chain at ${steps[i].label}`);
    process.exit(1);
  }
}

console.log(`nodes: ${orderedNodes.length}`);
console.log(`playable steps: ${steps.length}`);
console.log(`first: ${steps[0].label}`);
console.log(`last: ${steps[steps.length - 1].label}`);
if (warnings.length > 0) {
  console.log(`warnings: ${warnings.length}`);
  for (const warning of warnings) console.log(`- ${warning}`);
}
console.log("next-chain: ok");

function getSingleChain() {
  const starts = nodes
    .filter((node) => incoming.get(node.id) === 0 && adjacency.get(node.id).length > 0)
    .sort(compareCanvasPosition);
  if (starts.length === 0) {
    console.error("Expected at least one start node.");
    process.exit(1);
  }

  const ordered = [];
  const seen = new Set();
  let current = starts[0];
  while (current) {
    if (seen.has(current.id)) {
      console.error(`Cycle detected at ${titleOf(current)}.`);
      process.exit(1);
    }
    seen.add(current.id);
    ordered.push(current);
    const next = adjacency.get(current.id)[0];
    current = next ? nodeById.get(next) : null;
  }
  return ordered;
}

function normalizeNode(node) {
  if (hasDirective(node, "SKIP") || hasDirective(node, "BACKUP")) {
    return { warning: `${titleOf(node)} is marked ${hasDirective(node, "SKIP") ? "SKIP" : "BACKUP"} and will be skipped.` };
  }

  if (node.type === "text") {
    return { type: "text", title: titleOf(node) };
  }

  if (node.type === "link") {
    return node.url && /^https?:\/\//i.test(node.url)
      ? { type: "url", title: titleOf(node) }
      : { warning: `${titleOf(node)} has no supported URL.` };
  }

  if (node.type !== "file") {
    return { warning: `${titleOf(node)} has unsupported type ${node.type}.` };
  }

  const extension = extensionOf(node.file);
  const absolutePath = path.join(vaultPath, node.file);
  if (!fs.existsSync(absolutePath)) {
    return { warning: `${node.file} is missing.` };
  }

  if (extension === "pdf") {
    return { type: "pdf", title: titleOf(node), file: absolutePath, pages: countPdfPages(absolutePath) };
  }

  if (CONVERTIBLE.has(extension)) {
    const converted = absolutePath.replace(/\.[^.]+$/, ".pdf");
    if (!fs.existsSync(converted)) {
      return { warning: `${node.file} has no same-name PDF export.` };
    }
    return { type: "pdf", title: titleOf(node), file: converted, pages: countPdfPages(converted) };
  }

  if (SUPPORTED_IMAGES.has(extension)) {
    return { type: "image", title: titleOf(node) };
  }

  if (SUPPORTED_VIDEO.has(extension)) {
    return { type: "video", title: titleOf(node) };
  }

  if (SUPPORTED_AUDIO.has(extension)) {
    return { type: "audio", title: titleOf(node) };
  }

  if (SUPPORTED_MARKDOWN.has(extension)) {
    return { type: "markdown", title: titleOf(node) };
  }

  return { warning: `${node.file} is unsupported.` };
}

function expandNode(item) {
  if (item.type !== "pdf") {
    const index = steps.length;
    return [{ index, label: item.title }];
  }

  return Array.from({ length: item.pages }, (_value, pageIndex) => ({
    index: steps.length + pageIndex,
    label: `${item.title} page ${pageIndex + 1}/${item.pages}`,
  }));
}

function titleOf(node) {
  if (node.type === "file") return node.file;
  if (node.type === "link") return node.url || node.id;
  if (node.type === "text") return String(node.text || node.id).split("\n").find(Boolean) || node.id;
  return node.label || node.id;
}

function extensionOf(filePath) {
  const match = String(filePath || "").toLowerCase().match(/\.([^.]+)$/);
  return match ? match[1] : "";
}

function compareCanvasPosition(a, b) {
  return (numberOrZero(a.x) - numberOrZero(b.x)) || (numberOrZero(a.y) - numberOrZero(b.y));
}

function numberOrZero(value) {
  return Number.isFinite(value) ? value : 0;
}

function hasDirective(node, directive) {
  return node.type === "text" && new RegExp(`(^|\\n)\\s*${directive}\\b`, "i").test(node.text || "");
}

function countPdfPages(filePath) {
  const text = fs.readFileSync(filePath).toString("latin1");
  const matches = text.match(/\/Type\s*\/Page\b/g);
  return Math.max(1, matches ? matches.length : 1);
}
