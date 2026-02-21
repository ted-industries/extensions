import { readFileSync } from 'fs';
import { join } from 'path';

export interface RegistryExtension {
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

// Read the registry at build time (relative to the docs/ directory)
function loadRegistry(): RegistryExtension[] {
    try {
        const registryPath = join(process.cwd(), '..', 'registry', 'extensions.json');
        const raw = readFileSync(registryPath, 'utf-8');
        return JSON.parse(raw) as RegistryExtension[];
    } catch {
        return [];
    }
}

const registry = loadRegistry();

export function getAllExtensions(): RegistryExtension[] {
    return registry;
}

export function getExtension(slug: string): RegistryExtension | undefined {
    return registry.find((ext) => ext.name === slug);
}

export function getAllTags(): string[] {
    const tags = new Set<string>();
    for (const ext of registry) {
        for (const tag of ext.tags ?? []) {
            tags.add(tag);
        }
    }
    return Array.from(tags).sort();
}

export function getReadme(slug: string): string {
    try {
        const readmePath = join(
            process.cwd(),
            '..',
            'registry',
            'extensions',
            slug,
            'README.md'
        );
        return readFileSync(readmePath, 'utf-8');
    } catch {
        return '';
    }
}
