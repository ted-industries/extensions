#!/usr/bin/env bun
/**
 * scripts/validate.ts
 * Validates all extension manifests in registry/extensions/.
 * Exits with code 1 if any validation errors are found (for CI).
 */

import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";

const REGISTRY_DIR = resolve(import.meta.dir, "../registry/extensions");
const REQUIRED_FIELDS = ["name", "version", "displayName", "main"] as const;

let errors = 0;
const seenNames = new Set<string>();

function fail(ext: string, msg: string) {
    console.error(`  ✗ [${ext}] ${msg}`);
    errors++;
}

function pass(msg: string) {
    console.log(`  ✓ ${msg}`);
}

// Get all extension directories
const entries = readdirSync(REGISTRY_DIR).filter((entry) => {
    const fullPath = join(REGISTRY_DIR, entry);
    return statSync(fullPath).isDirectory();
});

if (entries.length === 0) {
    console.warn("⚠  No extensions found in registry/extensions/");
    process.exit(0);
}

console.log(`\n🔍 Validating ${entries.length} extension(s)...\n`);

for (const extDir of entries) {
    const extPath = join(REGISTRY_DIR, extDir);
    const manifestPath = join(extPath, "package.json");

    console.log(`→ ${extDir}`);

    // Check manifest exists
    if (!existsSync(manifestPath)) {
        fail(extDir, "Missing package.json");
        continue;
    }

    // Parse manifest
    let manifest: Record<string, unknown>;
    try {
        const raw = readFileSync(manifestPath, "utf-8");
        manifest = JSON.parse(raw);
    } catch (e) {
        fail(extDir, `Invalid JSON in package.json: ${(e as Error).message}`);
        continue;
    }

    // Validate required fields
    for (const field of REQUIRED_FIELDS) {
        if (!manifest[field] || typeof manifest[field] !== "string") {
            fail(extDir, `Missing or invalid required field: "${field}"`);
        }
    }

    // Validate name matches directory
    if (manifest.name && manifest.name !== extDir) {
        fail(
            extDir,
            `Extension name "${manifest.name}" does not match directory "${extDir}"`
        );
    }

    // Validate version format (semver-like)
    if (manifest.version && typeof manifest.version === "string") {
        if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
            fail(extDir, `Invalid version format: "${manifest.version}" (expected semver)`);
        }
    }

    // Check for duplicate names
    if (manifest.name) {
        const name = manifest.name as string;
        if (seenNames.has(name)) {
            fail(extDir, `Duplicate extension name: "${name}"`);
        } else {
            seenNames.add(name);
        }
    }

    // Check main file exists
    if (manifest.main && typeof manifest.main === "string") {
        const mainPath = join(extPath, manifest.main as string);
        if (!existsSync(mainPath)) {
            fail(extDir, `main file "${manifest.main}" not found`);
        } else {
            pass(`main file exists: ${manifest.main}`);
        }
    }

    // Warn if README is missing (non-fatal)
    if (!existsSync(join(extPath, "README.md"))) {
        console.warn(`  ⚠  No README.md found (recommended)`);
    } else {
        pass("README.md found");
    }
}

console.log("");

if (errors > 0) {
    console.error(`❌ Validation failed with ${errors} error(s).`);
    process.exit(1);
} else {
    console.log(`✅ All ${entries.length} extension(s) passed validation.`);
    process.exit(0);
}
