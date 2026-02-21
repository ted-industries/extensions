'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { getAllExtensions, getAllTags } from '@/lib/registry';
import type { RegistryExtension } from '@/lib/registry';

// ─── Dither Canvas ───────────────────────────────────────────────────────────
function DitherCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const PIXEL = 3;
        const BAYER = [
            [0, 8, 2, 10],
            [12, 4, 14, 6],
            [3, 11, 1, 9],
            [15, 7, 13, 5],
        ];

        function hash(x: number, y: number): number {
            let h = ((x * 1619 + y * 31337) ^ (x * 31337)) & 0xffffffff;
            h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
            h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
            return (h ^ (h >>> 16)) / 0xffffffff + 0.5;
        }

        function fade(t: number): number {
            return t * t * t * (t * (t * 6 - 15) + 10);
        }

        function lerp(a: number, b: number, t: number): number {
            return a + t * (b - a);
        }

        function noise(x: number, y: number): number {
            const xi = Math.floor(x);
            const yi = Math.floor(y);
            const xf = x - xi;
            const yf = y - yi;
            const u = fade(xf);
            const v = fade(yf);
            return lerp(
                lerp(hash(xi, yi), hash(xi + 1, yi), u),
                lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), u),
                v
            );
        }

        function fbm(x: number, y: number): number {
            let val = 0;
            let amp = 0.5;
            let freq = 1;
            for (let i = 0; i < 3; i++) {
                val += noise(x * freq, y * freq) * amp;
                amp *= 0.5;
                freq *= 2;
            }
            return val;
        }

        function resize() {
            canvas!.width = window.innerWidth;
            canvas!.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        function draw(t: number) {
            const W = canvas!.width;
            const H = canvas!.height;
            const cols = Math.ceil(W / PIXEL);
            const rows = Math.ceil(H / PIXEL);
            const image = ctx!.createImageData(W, H);
            const data = image.data;

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const nx = (col / cols) * 3;
                    const ny = (row / rows) * 3;
                    const value = fbm(nx + t * 0.0004, ny + t * 0.0003);
                    const threshold = (BAYER[row % 4][col % 4] + 0.5) / 16;
                    const on = value > threshold;

                    for (let dy = 0; dy < PIXEL; dy++) {
                        for (let dx = 0; dx < PIXEL; dx++) {
                            const px = col * PIXEL + dx;
                            const py = row * PIXEL + dy;
                            if (px >= W || py >= H) continue;
                            const i = (py * W + px) * 4;
                            data[i] = 255;
                            data[i + 1] = 255;
                            data[i + 2] = 255;
                            data[i + 3] = on ? 20 : 0;
                        }
                    }
                }
            }

            ctx!.putImageData(image, 0, 0);
            rafRef.current = requestAnimationFrame(draw);
        }

        rafRef.current = requestAnimationFrame(draw);
        return () => {
            cancelAnimationFrame(rafRef.current);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none"
            style={{ imageRendering: 'pixelated', zIndex: 0 }}
        />
    );
}

// ─── Extension Card ───────────────────────────────────────────────────────────
function ExtCard({ ext }: { ext: RegistryExtension }) {
    return (
        <Link
            href={`/extensions/${ext.name}`}
            className="group flex flex-col border border-neutral-900 bg-black/50 backdrop-blur-sm p-4 transition-colors hover:border-neutral-700 h-full"
        >
            {/* Header: icon + name + description */}
            <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                    <span className="text-sm font-mono font-bold text-neutral-400 uppercase">
                        {ext.displayName[0]}
                    </span>
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-sm font-mono font-bold text-white truncate">{ext.displayName}</div>
                    <div className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{ext.description}</div>
                </div>
            </div>

            {/* Tags row */}
            <div className="flex gap-1 flex-wrap mb-3">
                {ext.tags?.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[10px] font-mono uppercase tracking-widest text-neutral-600 border border-neutral-800 px-1.5 py-0.5">
                        {tag}
                    </span>
                ))}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Footer: version + installs + arrow */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-900">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-neutral-700">v{ext.version}</span>
                    <span className="text-[10px] font-mono text-neutral-700">{ext.downloads ?? 0} installs</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-700 group-hover:text-neutral-400 group-hover:translate-x-0.5 inline-block transition-all">→</span>
            </div>
        </Link>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MarketplacePage({
    allExtensions,
    allTags,
}: {
    allExtensions: RegistryExtension[];
    allTags: string[];
}) {
    const [query, setQuery] = useState('');
    const [activeTag, setActiveTag] = useState<string | null>(null);

    const filtered = allExtensions.filter((ext) => {
        const q = query.toLowerCase();
        const matchesQuery =
            !q ||
            ext.name.toLowerCase().includes(q) ||
            ext.displayName.toLowerCase().includes(q) ||
            ext.description.toLowerCase().includes(q) ||
            ext.tags?.some((t) => t.includes(q));

        const matchesTag = !activeTag || ext.tags?.includes(activeTag);
        return matchesQuery && matchesTag;
    });

    return (
        <main data-marketplace className="relative min-h-screen bg-black text-white overflow-hidden">
            <DitherCanvas />

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-20">
                {/* Hero */}
                <div className="mb-16">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-600 mb-4">
                        ted · extensions
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-3">
                        ted extensions
                    </h1>
                    <p className="text-neutral-500 text-sm max-w-md">
                        Browse and install extensions for the{' '}
                        <a
                            href="https://github.com/ted-industries/ted"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-neutral-400 hover:text-white transition-colors underline underline-offset-2"
                        >
                            ted
                        </a>{' '}
                        code editor.
                    </p>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="search extensions..."
                        className="w-full bg-black border border-neutral-900 hover:border-neutral-700 focus:border-neutral-600 px-4 py-3 text-sm font-mono text-white placeholder-neutral-700 outline-none transition-colors"
                    />
                </div>

                {/* Tag pills */}
                <div className="flex flex-wrap gap-2 mb-10">
                    <button
                        onClick={() => setActiveTag(null)}
                        className={`text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 border transition-colors ${activeTag === null
                            ? 'border-neutral-600 text-neutral-300'
                            : 'border-neutral-900 text-neutral-600 hover:text-neutral-300 hover:border-neutral-700'
                            }`}
                    >
                        all
                    </button>
                    {allTags.map((tag) => (
                        <button
                            key={tag}
                            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                            className={`text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 border transition-colors ${activeTag === tag
                                ? 'border-neutral-600 text-neutral-300'
                                : 'border-neutral-900 text-neutral-600 hover:text-neutral-300 hover:border-neutral-700'
                                }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>

                {/* Count */}
                <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-700 mb-4">
                    {filtered.length} extension{filtered.length !== 1 ? 's' : ''}
                </div>

                {/* Grid */}
                {filtered.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {filtered.map((ext) => (
                            <ExtCard key={ext.name} ext={ext} />
                        ))}
                    </div>
                ) : (
                    <div className="border border-neutral-900 px-6 py-16 text-center">
                        <div className="text-neutral-700 font-mono text-sm">no extensions found</div>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-20 pt-8 border-t border-neutral-900 flex items-center justify-between">
                    <div className="text-[10px] font-mono text-neutral-700">
                        ted-extensions registry
                    </div>
                    <div className="flex gap-6">
                        <Link href="/docs" className="text-[10px] font-mono uppercase tracking-widest text-neutral-600 hover:text-white transition-colors">
                            docs →
                        </Link>
                        <a
                            href="https://github.com/ted-industries/extensions"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-mono uppercase tracking-widest text-neutral-600 hover:text-white transition-colors"
                        >
                            github →
                        </a>
                    </div>
                </div>
            </div>
        </main>
    );
}
