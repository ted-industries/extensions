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

const EXTERNAL_FILE = resolve(import.meta.dir, "../registry/external.json");

console.log(`\n🔍 Validating ${entries.length} local extension(s)...\n`);

for (const extDir of entries) {
    const extPath = join(REGISTRY_DIR, extDir);
    const manifestPath = join(extPath, "package.json");

    console.log(`→ ${extDir}`);

    if (!existsSync(manifestPath)) {
        fail(extDir, "Missing package.json");
        continue;
    }

    let manifest: Record<string, any>;
    try {
        manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    } catch (e) {
        fail(extDir, `Invalid JSON: ${(e as Error).message}`);
        continue;
    }

    validateManifest(extDir, manifest, true, extPath);
}

// Validate external extensions
if (existsSync(EXTERNAL_FILE)) {
    try {
        const externalData = JSON.parse(readFileSync(EXTERNAL_FILE, "utf-8"));
        if (Array.isArray(externalData)) {
            console.log(`\n🌐 Validating ${externalData.length} external extension(s)...\n`);
            for (const ext of externalData) {
                const id = ext.name || "unknown-external";
                console.log(`→ ${id} (external)`);

                if (!ext.repository) {
                    fail(id, "Missing repository link");
                }

                validateManifest(id, ext, false);
            }
        }
    } catch (e) {
        fail("external.json", `Failed to parse: ${(e as Error).message}`);
    }
}

function validateManifest(id: string, manifest: Record<string, any>, isLocal: boolean, localPath?: string) {
    // Validate required fields
    for (const field of REQUIRED_FIELDS) {
        if (!manifest[field] || typeof manifest[field] !== "string") {
            fail(id, `Missing or invalid required field: "${field}"`);
        }
    }

    // Validate version format
    if (manifest.version && typeof manifest.version === "string") {
        if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
            fail(id, `Invalid version format: "${manifest.version}"`);
        }
    }

    // Check for duplicate names
    if (manifest.name) {
        const name = manifest.name as string;
        if (seenNames.has(name)) {
            fail(id, `Duplicate extension name: "${name}"`);
        } else {
            seenNames.add(name);
        }
    }

    // Local-only checks
    if (isLocal && localPath) {
        // Name matches directory
        if (manifest.name && manifest.name !== id) {
            fail(id, `Name "${manifest.name}" does not match directory "${id}"`);
        }

        // Main file exists
        if (manifest.main && typeof manifest.main === "string") {
            const mainPath = join(localPath, manifest.main);
            if (!existsSync(mainPath)) {
                fail(id, `main file "${manifest.main}" not found`);
            }
        }

        // README warning
        if (!existsSync(join(localPath, "README.md"))) {
            console.warn(`  ⚠  [${id}] No README.md found`);
        }
    }
}

console.log("");

if (errors > 0) {
    console.error(`❌ Validation failed with ${errors} error(s).`);
    process.exit(1);
} else {
    console.log(`✅ All extensions passed validation.`);
    process.exit(0);
}
