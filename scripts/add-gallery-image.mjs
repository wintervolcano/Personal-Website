#!/usr/bin/env node
/**
 * Gallery Image Upload Script
 *
 * Usage:
 *   node scripts/add-gallery-image.mjs <image-path> --title "Title" [options]
 *
 * Options:
 *   --title, -t       Image title (required)
 *   --description, -d Image description
 *   --date            Date in YYYY-MM-DD format (defaults to today)
 *   --tags            Comma-separated tags (e.g., "conference,MPIfR")
 *   --location, -l    Location string
 *   --id              Custom ID (defaults to g-{nextId})
 *
 * Example:
 *   node scripts/add-gallery-image.mjs ./photo.jpg --title "My Photo" --tags "personal,travel" --location "Berlin, Germany"
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const GALLERY_JSON_PATH = path.join(ROOT_DIR, "src/data/gallery.json");
const GALLERY_PUBLIC_DIR = path.join(ROOT_DIR, "public/gallery");

function parseArgs(args) {
  const result = { imagePath: null, options: {} };
  let i = 0;

  while (i < args.length) {
    const arg = args[i];

    if (arg.startsWith("--") || arg.startsWith("-")) {
      const key = arg.replace(/^-+/, "");
      const value = args[i + 1];

      switch (key) {
        case "title":
        case "t":
          result.options.title = value;
          i += 2;
          break;
        case "description":
        case "d":
          result.options.description = value;
          i += 2;
          break;
        case "date":
          result.options.date = value;
          i += 2;
          break;
        case "tags":
          result.options.tags = value.split(",").map((t) => t.trim());
          i += 2;
          break;
        case "location":
        case "l":
          result.options.location = value;
          i += 2;
          break;
        case "id":
          result.options.id = value;
          i += 2;
          break;
        case "help":
        case "h":
          printHelp();
          process.exit(0);
        default:
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
      }
    } else {
      result.imagePath = arg;
      i++;
    }
  }

  return result;
}

function printHelp() {
  console.log(`
Gallery Image Upload Script

Usage:
  node scripts/add-gallery-image.mjs <image-path> --title "Title" [options]

Options:
  --title, -t       Image title (required)
  --description, -d Image description
  --date            Date in YYYY-MM-DD format (defaults to today)
  --tags            Comma-separated tags (e.g., "conference,MPIfR")
  --location, -l    Location string
  --id              Custom ID (defaults to g-{nextId})
  --help, -h        Show this help message

Example:
  node scripts/add-gallery-image.mjs ./photo.jpg --title "My Photo" --tags "personal,travel"
`);
}

function getNextId(items) {
  const ids = items
    .map((item) => {
      const match = item.id.match(/^g-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => !isNaN(n));

  const maxId = ids.length > 0 ? Math.max(...ids) : 0;
  return `g-${maxId + 1}`;
}

function getTodayDate() {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

async function convertToWebP(inputPath, outputPath) {
  // Try to use sharp if available, otherwise just copy the file
  try {
    const sharp = await import("sharp");
    await sharp
      .default(inputPath)
      .webp({ quality: 90 })
      .toFile(outputPath);
    return true;
  } catch (err) {
    // sharp not installed, fall back to copying the original file
    console.warn(
      "Warning: sharp not installed. Copying original file without WebP conversion."
    );
    console.warn("Install sharp for automatic WebP conversion: npm install -D sharp");

    // If the input is already webp, just copy it
    const ext = path.extname(inputPath).toLowerCase();
    if (ext === ".webp") {
      fs.copyFileSync(inputPath, outputPath);
      return true;
    }

    // For non-webp files, copy with original extension
    const originalOutputPath = outputPath.replace(/\.webp$/, ext);
    fs.copyFileSync(inputPath, originalOutputPath);
    console.log(`Copied as: ${path.basename(originalOutputPath)}`);
    return originalOutputPath;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printHelp();
    process.exit(1);
  }

  const { imagePath, options } = parseArgs(args);

  if (!imagePath) {
    console.error("Error: Image path is required");
    process.exit(1);
  }

  if (!options.title) {
    console.error("Error: --title is required");
    process.exit(1);
  }

  // Check if image exists
  if (!fs.existsSync(imagePath)) {
    console.error(`Error: Image not found: ${imagePath}`);
    process.exit(1);
  }

  // Load existing gallery data
  let galleryData;
  try {
    const content = fs.readFileSync(GALLERY_JSON_PATH, "utf-8");
    galleryData = JSON.parse(content);
  } catch (err) {
    console.error(`Error reading gallery.json: ${err.message}`);
    process.exit(1);
  }

  // Generate ID and filename
  const id = options.id || getNextId(galleryData.items);
  const inputExt = path.extname(imagePath).toLowerCase();
  const baseName = path
    .basename(imagePath, inputExt)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const filename = `${baseName}.webp`;
  const outputPath = path.join(GALLERY_PUBLIC_DIR, filename);

  // Check if file already exists
  if (fs.existsSync(outputPath)) {
    console.error(`Error: File already exists: ${filename}`);
    console.error("Use a different image name or remove the existing file.");
    process.exit(1);
  }

  // Convert to WebP
  console.log(`Converting image to WebP...`);
  const result = await convertToWebP(imagePath, outputPath);

  const actualFilename =
    typeof result === "string" ? path.basename(result) : filename;

  // Create new gallery item
  const newItem = {
    id,
    filename: actualFilename,
    title: options.title,
    description: options.description || null,
    date: options.date || getTodayDate(),
    tags: options.tags || [],
    location: options.location || null,
  };

  // Add to gallery data
  galleryData.items.push(newItem);

  // Save updated gallery.json
  fs.writeFileSync(GALLERY_JSON_PATH, JSON.stringify(galleryData, null, 2) + "\n");

  console.log(`
Gallery image added successfully!

  ID:          ${newItem.id}
  Filename:    ${newItem.filename}
  Title:       ${newItem.title}
  Description: ${newItem.description || "(none)"}
  Date:        ${newItem.date}
  Tags:        ${newItem.tags.length > 0 ? newItem.tags.join(", ") : "(none)"}
  Location:    ${newItem.location || "(none)"}

Files updated:
  - ${GALLERY_JSON_PATH}
  - ${path.join(GALLERY_PUBLIC_DIR, actualFilename)}
`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
