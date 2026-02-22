'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
    content: string
    className?: string
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
    return (
        <div className={`prose-custom ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }) => (
                        <h1 className="font-display font-bold uppercase tracking-tight text-3xl text-white mt-0 mb-6 pb-3 border-b border-border">
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="font-display font-bold uppercase tracking-tight text-xl text-white mt-8 mb-4 flex items-center gap-3 after:content-[''] after:flex-1 after:h-px after:bg-border">
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="font-sans font-bold uppercase tracking-widest text-sm text-accent mb-2 mt-6">
                            {children}
                        </h3>
                    ),
                    p: ({ children }) => (
                        <p className="font-sans text-zinc-300 leading-relaxed mb-4 text-base">
                            {children}
                        </p>
                    ),
                    strong: ({ children }) => (
                        <strong className="font-bold text-white">{children}</strong>
                    ),
                    em: ({ children }) => (
                        <em className="italic text-zinc-400">{children}</em>
                    ),
                    ul: ({ children }) => (
                        <ul className="font-sans text-zinc-300 space-y-2 mb-4 pl-0">
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="font-sans text-zinc-300 space-y-2 mb-4 pl-0 list-none counter-reset-steps">
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => (
                        <li className="flex items-start gap-3 leading-relaxed">
                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                            <span>{children}</span>
                        </li>
                    ),
                    hr: () => (
                        <hr className="border-none border-t border-border my-8" />
                    ),
                    img: ({ src, alt }) => (
                        <div className="my-4 border border-border overflow-hidden shadow-[4px_4px_0px_#2F2F2F]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt={alt || ''} className="w-full object-cover" />
                            {alt && (
                                <p className="font-sans text-xs text-zinc-500 uppercase tracking-widest font-bold px-3 py-2 border-t border-border bg-[#0A0A0A]">
                                    {alt}
                                </p>
                            )}
                        </div>
                    ),
                    code: ({ children }) => (
                        <code className="font-mono text-accent bg-accent/10 px-1.5 py-0.5 text-sm border border-accent/20">
                            {children}
                        </code>
                    ),
                    pre: ({ children }) => (
                        <pre className="bg-[#0A0A0A] border border-border p-4 overflow-x-auto font-mono text-sm text-zinc-300 my-4 shadow-[4px_4px_0px_#2F2F2F]">
                            {children}
                        </pre>
                    ),
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-accent pl-4 my-4 text-zinc-400 italic">
                            {children}
                        </blockquote>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}
