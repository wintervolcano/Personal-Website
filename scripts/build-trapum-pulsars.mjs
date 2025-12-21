#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import fg from "fast-glob";
import YAML from "yaml";

function parseArgs(argv) {
    const out = {};
    for (let i = 2; i < argv.length; i++) {
        const a = argv[i];
        if (!a.startsWith("--")) continue;
        const k = a.slice(2);
        const v = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
        out[k] = v;
    }
    return out;
}

async function existsDir(p) {
    try {
        const st = await fs.stat(p);
        return st.isDirectory();
    } catch {
        return false;
    }
}

async function existsFile(p) {
    try {
        const st = await fs.stat(p);
        return st.isFile();
    } catch {
        return false;
    }
}

/**
 * User may pass:
 * - repo root
 * - apps/
 * - apps/discoveries/
 * etc.
 * We search a few levels around the hint for "apps/discoveries/pulsars".
 */
async function findYamlDir(trapumHintAbs) {
    const candidates = [];

    // search upward a bit (hint, parent, grandparent)
    let cur = trapumHintAbs;
    for (let up = 0; up < 4; up++) {
        candidates.push(path.join(cur, "apps/discoveries/pulsars"));
        candidates.push(path.join(cur, "discoveries/pulsars"));
        candidates.push(path.join(cur, "pulsars"));
        cur = path.dirname(cur);
    }

    // and a couple of downward-ish options
    candidates.push(path.join(trapumHintAbs, "apps", "discoveries", "pulsars"));

    for (const c of candidates) {
        if (await existsDir(c)) return c;
    }

    // last resort: fast-glob search (bounded depth)
    const hits = await fg(["**/apps/discoveries/pulsars"], {
        cwd: trapumHintAbs,
        onlyDirectories: true,
        deep: 6,
        absolute: true,
        dot: false,
    });
    if (hits.length) return hits[0];

    return null;
}

function safeBasename(p) {
    return String(p || "").split("/").pop() || "";
}

function toISODate(s) {
    if (!s) return "";
    // keep as-is if already "YYYY-MM-DD"
    return String(s).trim();
}

async function mkdirp(p) {
    await fs.mkdir(p, { recursive: true });
}

async function copyFileIfNeeded(src, dst) {
    if (!(await existsFile(src))) throw new Error(`Missing source image: ${src}`);
    if (await existsFile(dst)) return; // already copied
    await mkdirp(path.dirname(dst));
    await fs.copyFile(src, dst);
}

function slugFromYamlFilename(filePath) {
    return path.basename(filePath).replace(/\.ya?ml$/i, "");
}

async function main() {
    const args = parseArgs(process.argv);

    const trapumArg = args.trapum || args.t;
    const outJson = args.out || args.o;
    const outImages = args.outImages || args.outimages || args.images;

    if (!trapumArg || !outJson || !outImages) {
        console.error(
            [
                "Usage:",
                "  node scripts/build-trapum-pulsars.mjs --trapum <path-to-trapum.org> --out <json> --outImages <dir>",
                "",
                "Example:",
                "  node scripts/build-trapum-pulsars.mjs --trapum ../trapum.org --out ./src/data/trapum_pulsars.json --outImages ./public/trapum/discoveries",
            ].join("\n")
        );
        process.exit(1);
    }

    const trapumHintAbs = path.resolve(process.cwd(), trapumArg);
    const yamlDir = await findYamlDir(trapumHintAbs);

    if (!yamlDir) {
        throw new Error(
            `Cannot find YAML dir near: ${trapumHintAbs}\n` +
            `Expected something like: <trapumRoot>/apps/discoveries/pulsars\n` +
            `Tip: pass --trapum as the absolute path to the trapum.org repo root.`
        );
    }

    // The repo "root" is 3 levels up from .../apps/discoveries/pulsars
    const trapumRoot = path.resolve(yamlDir, "../../..");

    // Index all discovery plot PNGs once (anywhere in the repo)
    const pngs = await fg(["**/*_discovery_plot.png"], {
        cwd: trapumRoot,
        onlyFiles: true,
        absolute: true,
        dot: false,
    });

    const pngIndex = new Map(); // basename -> absolute path
    for (const p of pngs) {
        pngIndex.set(path.basename(p), p);
    }

    const yamlFiles = await fg(["*.yml", "*.yaml"], {
        cwd: yamlDir,
        onlyFiles: true,
        absolute: true,
        dot: false,
    });

    const outImagesAbs = path.resolve(process.cwd(), outImages);
    await mkdirp(outImagesAbs);

    const docs = [];
    const missingPlots = [];

    for (const yf of yamlFiles) {
        const raw = await fs.readFile(yf, "utf8");
        const data = YAML.parse(raw) || {};

        const slug = slugFromYamlFilename(yf);

        const assoc = Array.isArray(data.associations) ? data.associations : [];
        const disc = data.discovery_parameters || {};
        const psr = data.pulsar_parameters || {};

        const plotRel = disc.discovery_plot || "";
        const plotBase = safeBasename(plotRel);

        let plotUrl = "";
        if (plotBase && pngIndex.has(plotBase)) {
            const srcPng = pngIndex.get(plotBase);
            const dstPng = path.join(outImagesAbs, plotBase);

            await copyFileIfNeeded(srcPng, dstPng);

            // This assumes outImages is inside Vite "public/"
            // If you keep using: ./public/trapum/discoveries
            // then the URL becomes: /trapum/discoveries/<file>
            const relFromPublic = outImagesAbs.split(path.sep + "public" + path.sep)[1];
            plotUrl = relFromPublic ? `/${relFromPublic.replaceAll(path.sep, "/")}/${plotBase}` : `/${plotBase}`;
        } else if (plotBase) {
            missingPlots.push({ slug, plotBase, plotRel });
        }

        docs.push({
            slug,
            name: psr.name || slug,
            dm: psr.dm ?? null,
            period_ms: psr.period ?? null, // note: TRAPUM YAML looks like ms already
            binary: !!psr.binary,

            associations: assoc.map((a) => ({ name: a?.name || "", type: a?.type || "" })).filter((a) => a.name),

            discovery: {
                discovery_date: toISODate(disc.discovery_date),
                observation_date: toISODate(disc.observation_date),
                backend: disc.backend || "",
                discovery_band: disc.discovery_band || "",
                pipeline: disc.pipeline || "",
                project: disc.project || "",
                discovery_snr: disc.discovery_snr ?? null,
                discovery_plot: plotRel || "",
                discovery_plot_url: plotUrl || "",
            },
        });
    }

    // Sort newest first if dates exist
    docs.sort((a, b) => (a.discovery.discovery_date < b.discovery.discovery_date ? 1 : a.discovery.discovery_date > b.discovery.discovery_date ? -1 : 0));

    await mkdirp(path.dirname(path.resolve(process.cwd(), outJson)));
    await fs.writeFile(path.resolve(process.cwd(), outJson), JSON.stringify({ generatedAt: new Date().toISOString(), count: docs.length, docs, missingPlots }, null, 2), "utf8");

    console.log(`✅ Wrote ${docs.length} pulsars → ${outJson}`);
    console.log(`✅ Copied plots → ${outImages}`);
    if (missingPlots.length) {
        console.warn(`⚠️ Missing ${missingPlots.length} plots (see JSON.missingPlots)`);
    }
}

main().catch((err) => {
    console.error("\n❌ build-trapum-pulsars failed:\n", err?.stack || err?.message || err);
    process.exit(1);
});