import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getAllExtensions, getExtension, getReadme } from '@/lib/registry';

export async function generateStaticParams() {
    const exts = getAllExtensions();
    return exts.map((e) => ({ slug: e.name }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const ext = getExtension(slug);
    if (!ext) return {};
    return {
        title: `${ext.displayName} — ted extensions`,
        description: ext.description,
    };
}

export default async function ExtensionPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const ext = getExtension(slug);
    if (!ext) notFound();

    const readme = getReadme(slug);

    return (
        <main className="min-h-screen bg-black text-white">
            <div className="max-w-5xl mx-auto px-6 py-16">
                {/* Back */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-neutral-600 hover:text-white transition-colors mb-10"
                >
                    ← back to marketplace
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-neutral-900">
                    {/* Left: metadata */}
                    <div className="bg-black p-6 space-y-6">
                        {/* Icon + name */}
                        <div>
                            <div className="w-14 h-14 bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4">
                                <span className="text-xl font-mono font-bold text-neutral-300 uppercase">
                                    {ext.displayName[0]}
                                </span>
                            </div>
                            <h1 className="text-lg font-bold tracking-tight text-white">{ext.displayName}</h1>
                            <p className="text-xs text-neutral-500 mt-1">{ext.description}</p>
                        </div>

                        {/* Meta */}
                        <div className="space-y-3 border-t border-neutral-900 pt-4">
                            {[
                                ['version', `v${ext.version}`],
                                ['author', ext.author ?? '—'],
                                ['installs', String(ext.downloads ?? 0)],
                            ].map(([label, value]) => (
                                <div key={label} className="flex justify-between items-center">
                                    <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-700">{label}</span>
                                    <span className="text-xs font-mono text-neutral-400">{value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Tags */}
                        {ext.tags && ext.tags.length > 0 && (
                            <div className="border-t border-neutral-900 pt-4">
                                <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-700 mb-2">tags</div>
                                <div className="flex flex-wrap gap-1">
                                    {ext.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="text-[10px] font-mono uppercase tracking-widest text-neutral-600 border border-neutral-800 px-1.5 py-0.5"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Install */}
                        <div className="border-t border-neutral-900 pt-4">
                            <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-700 mb-2">install</div>
                            <div className="border border-neutral-800 bg-neutral-950 px-3 py-2.5">
                                <code className="text-xs font-mono text-neutral-300">
                                    ted ext install {ext.name}
                                </code>
                            </div>
                            <p className="text-[10px] font-mono text-neutral-700 mt-2">
                                or copy to <code className="text-neutral-600">~/.ted/extensions/{ext.name}/</code>
                            </p>
                        </div>

                        {/* Repository */}
                        {ext.repository && (
                            <div className="border-t border-neutral-900 pt-4">
                                <a
                                    href={ext.repository}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] font-mono uppercase tracking-widest text-neutral-600 hover:text-white transition-colors group"
                                >
                                    source code{' '}
                                    <span className="group-hover:translate-x-1 inline-block transition-transform">→</span>
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Right: README */}
                    <div className="lg:col-span-2 bg-neutral-950/30 p-6">
                        <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-700 mb-6">readme</div>
                        {readme ? (
                            <div className="
                prose prose-invert prose-sm max-w-none
                prose-headings:font-mono prose-headings:tracking-tight prose-headings:text-white prose-headings:font-bold prose-headings:mb-2 prose-headings:mt-6
                prose-h1:text-base prose-h2:text-sm prose-h3:text-xs prose-h3:uppercase prose-h3:tracking-widest prose-h3:text-neutral-500
                prose-p:text-neutral-400 prose-p:text-xs prose-p:leading-relaxed
                prose-a:text-neutral-400 prose-a:hover:text-white prose-a:no-underline prose-a:underline-offset-2 prose-a:hover:underline
                prose-strong:text-white prose-strong:font-semibold
                prose-code:font-mono prose-code:text-neutral-300 prose-code:bg-neutral-900 prose-code:px-1 prose-code:py-0.5 prose-code:text-[11px] prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-neutral-950 prose-pre:border prose-pre:border-neutral-800 prose-pre:rounded-none prose-pre:p-4
                prose-pre:text-[11px] prose-pre:leading-relaxed
                prose-li:text-neutral-400 prose-li:text-xs prose-li:leading-relaxed prose-li:marker:text-neutral-700
                prose-ul:my-2 prose-ol:my-2
                prose-table:text-xs prose-table:border-collapse
                prose-th:text-neutral-300 prose-th:font-mono prose-th:text-[10px] prose-th:uppercase prose-th:tracking-widest prose-th:border prose-th:border-neutral-800 prose-th:px-3 prose-th:py-1.5 prose-th:bg-neutral-950 prose-th:font-normal
                prose-td:text-neutral-400 prose-td:border prose-td:border-neutral-800 prose-td:px-3 prose-td:py-1.5
                prose-hr:border-neutral-800 prose-hr:my-6
                prose-blockquote:border-l-2 prose-blockquote:border-neutral-700 prose-blockquote:pl-4 prose-blockquote:text-neutral-500 prose-blockquote:not-italic
              ">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {readme}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            <div className="text-neutral-700 font-mono text-sm">no readme available</div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
