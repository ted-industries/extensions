#!/usr/bin/env bun
/**
 * scripts/build-index.ts
 * Reads all registry/extensions/package.json files and rebuilds
 * registry/extensions.json(the master index).
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";

const REGISTRY_DIR = resolve(import.meta.dir, "../registry/extensions");
const OUTPUT_FILE = resolve(import.meta.dir, "../registry/extensions.json");

interface ExtensionEntry {
    name: string;
    displayName: string;
    description: string;
    version: string;
    author?: string;
    repository?: string;
    main: string;
    icon?: string;
    tags?: string[];
    downloads?: number;
}

const extensions: ExtensionEntry[] = [];

const entries = readdirSync(REGISTRY_DIR).filter((entry) => {
    return statSync(join(REGISTRY_DIR, entry)).isDirectory();
});

console.log(`\n📦 Building index from ${entries.length} extension(s)...\n`);

for (const extDir of entries) {
    const extPath = join(REGISTRY_DIR, extDir);
    const manifestPath = join(extPath, "package.json");

    if (!existsSync(manifestPath)) {
        console.warn(`  ⚠  Skipping ${extDir}: no package.json`);
        continue;
    }

    let manifest: Record<string, unknown>;
    try {
        manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    } catch (e) {
        console.error(`  ✗ Skipping ${extDir}: invalid JSON — ${(e as Error).message}`);
        continue;
    }

    // Resolve icon path relative to registry root
    const iconRelative = existsSync(join(extPath, "icon.png"))
        ? `extensions/${extDir}/icon.png`
        : undefined;

    const entry: ExtensionEntry = {
        name: (manifest.name as string) || extDir,
        displayName: (manifest.displayName as string) || extDir,
        description: (manifest.description as string) || "",
        version: (manifest.version as string) || "0.0.1",
        main: (manifest.main as string) || "index.js",
        ...(manifest.author ? { author: manifest.author as string } : {}),
        ...(manifest.repository ? { repository: manifest.repository as string } : {}),
        ...(iconRelative ? { icon: iconRelative } : {}),
        tags: (manifest.tags as string[]) || [],
        downloads: 0,
    };

    extensions.push(entry);
    console.log(`  ✓ ${entry.name}@${entry.version}`);
}

// Sort alphabetically by name
extensions.sort((a, b) => a.name.localeCompare(b.name));

// Write output
writeFileSync(OUTPUT_FILE, JSON.stringify(extensions, null, 2) + "\n");

console.log(`\n✅ Wrote ${extensions.length} extension(s) to registry/extensions.json\n`);
