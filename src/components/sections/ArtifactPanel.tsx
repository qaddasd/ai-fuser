"use client";

import React, { useState, useEffect } from "react";
import { X, Copy, Check, Download, Maximize2, Minimize2, FileCode, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import "katex/dist/katex.min.css";

const getLanguageFromTitle = (title: string): string => {
  const ext = title.split('.').pop()?.toLowerCase() || '';
  const langMap: Record<string, string> = {
    py: 'python',
    js: 'javascript',
    ts: 'typescript',
    tsx: 'tsx',
    jsx: 'jsx',
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    sh: 'bash',
    bash: 'bash',
    sql: 'sql',
    java: 'java',
    kt: 'kotlin',
    cpp: 'cpp',
    c: 'c',
    h: 'c',
    cs: 'csharp',
    go: 'go',
    rs: 'rust',
    rb: 'ruby',
    php: 'php',
    swift: 'swift',
    xml: 'xml',
    svg: 'xml',
    toml: 'toml',
    ini: 'ini',
    dockerfile: 'docker',
    makefile: 'makefile',
    graphql: 'graphql',
    gql: 'graphql',
    txt: 'text',
  };
  return langMap[ext] || 'text';
};

const cleanLineNumbers = (content: string): string => {
  const lines = content.split('\n');

  const hasLineNumbers = lines.every((line, idx) => {
    if (!line.trim()) return true;
    const match = line.match(/^\s*(\d+)[\s:]\s*/);
    if (!match) return false;
    const num = parseInt(match[1], 10);

    return num >= 1 && num <= lines.length;
  });

  if (hasLineNumbers && lines.length > 1) {
    return lines.map(line => {
      if (!line.trim()) return line;
      return line.replace(/^\s*\d+[\s:]\s*/, '');
    }).join('\n');
  }
  return content;
};

interface ArtifactPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  onUpdateContent: (newContent: string) => void;
  isLoading?: boolean;
}

const ArtifactPanel = ({
  isOpen,
  onClose,
  title,
  content,
  onUpdateContent,
  isLoading
}: ArtifactPanelProps) => {
  const [isCopied, setIsCopied] = React.useState(false);
  const [localContent, setLocalContent] = useState(content);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('preview');

  const preprocessMath = (text: string) => {
    if (typeof text !== 'string' || !text) return text;
    return text
      .replace(/\\\[/g, '$$$$')
      .replace(/\\\]/g, '$$$$')
      .replace(/\\\(/g, '$$')
      .replace(/\\\)/g, '$$');
  };

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const isImage = content.trim().startsWith('![') || content.trim().includes('data:image') || content.trim().startsWith('http');

  const handleCopy = () => {
    navigator.clipboard.writeText(localContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([localContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = title || "artifact.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className={cn(
      "h-full bg-background/95 backdrop-blur-xl border-l border-border flex flex-col transition-all duration-500 ease-in-out z-50 shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden",
      isExpanded ? "fixed inset-0 w-full z-[200]" : "w-[50%] min-w-[450px]"
    )}>
      { }
      <div className="flex items-center justify-between px-8 h-[70px] border-b border-border bg-card/30 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="w-10 h-10 bg-accent flex items-center justify-center flex-shrink-0 group">
            <Monitor className="w-5 h-5 text-accent-foreground group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[14px] font-display tracking-widest text-foreground uppercase font-black">Artifact</span>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-[0.2em] flex items-center gap-2">
                <span className={cn("w-1 h-1", isLoading ? "bg-accent animate-ping" : "bg-emerald-500")}></span>
                {isLoading ? "Processing Data..." : "Ready to Deploy"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={cn(
              "px-3 h-8 text-[10px] font-mono uppercase tracking-widest border transition-all",
              isEditMode ? "bg-accent text-accent-foreground border-accent" : "bg-secondary text-muted-foreground border-border hover:border-accent/40"
            )}
          >
            {isEditMode ? "View Mode" : "Edit Source"}
          </button>

          {!isEditMode && !isImage && (
            <>
              <div className="w-[1px] h-6 bg-border mx-1" />
              <div className="flex items-center bg-secondary/50 p-1 border border-border/50 rounded-sm">
                <button
                  onClick={() => setViewMode('preview')}
                  className={cn(
                    "px-3 py-1 text-[10px] font-mono uppercase tracking-widest transition-all",
                    viewMode === 'preview' ? "bg-accent text-accent-foreground font-bold shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Preview
                </button>
                <button
                  onClick={() => setViewMode('code')}
                  className={cn(
                    "px-3 py-1 text-[10px] font-mono uppercase tracking-widest transition-all",
                    viewMode === 'code' ? "bg-accent text-accent-foreground font-bold shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Code
                </button>
              </div>
            </>
          )}
          <div className="w-[1px] h-6 bg-border mx-1" />
          <div className="flex items-center bg-secondary/50 p-1 border border-border/50">
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-accent hover:text-accent-foreground transition-all text-muted-foreground"
              title="Copy Source"
            >
              {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-accent hover:text-accent-foreground transition-all text-muted-foreground"
              title="Save Locally"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          <div className="w-[1px] h-6 bg-border mx-1" />

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2.5 hover:bg-secondary border border-transparent hover:border-border transition-all text-muted-foreground hover:text-foreground"
            title={isExpanded ? "Restore" : "Expand View"}
          >
            {isExpanded ? <Minimize2 className="w-4.5 h-4.5" /> : <Maximize2 className="w-4.5 h-4.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-destructive hover:text-destructive-foreground border border-transparent hover:border-destructive/20 transition-all text-muted-foreground"
            title="Close Panel"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      { }
      <div className="flex items-center px-8 h-[50px] bg-secondary/20 border-b border-border gap-6">
        <div className="flex items-center gap-2.5 px-1 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-accent font-bold border-b-2 border-accent h-full -mb-[1px]">
          <FileCode className="w-4 h-4" />
          {title || (isImage ? "image_preview.bin" : "system_output.log")}
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[9px] font-mono text-muted-foreground uppercase tracking-widest opacity-60">
          <span>UTF-8</span>
          <div className="w-1 h-1 bg-border rounded-full" />
          <span>{localContent.split('\n').length} Lines</span>
          <div className="w-1 h-1 bg-border rounded-full" />
          <span>{(new Blob([localContent]).size / 1024).toFixed(2)} KB</span>
        </div>
      </div>

      { }
      <div className="flex-1 relative overflow-hidden bg-[#0a0a0a]">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-accent/30 to-transparent z-10" />

        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        {isEditMode ? (
          <textarea
            value={localContent}
            onChange={(e) => {
              setLocalContent(e.target.value);
              onUpdateContent(e.target.value);
            }}
            className="absolute inset-0 w-full h-full p-10 bg-transparent resize-none outline-none font-mono text-[13px] leading-[1.8] text-foreground/80 selection:bg-accent/30 custom-scrollbar"
            spellCheck={false}
            placeholder="// Artifact content will appear here..."
          />
        ) : (
          <>
            {viewMode === 'preview' ? (
              <div className="w-full h-full overflow-y-auto custom-scrollbar bg-background/50">
                {(() => {
                  const trimmed = localContent.trim().toLowerCase();
                  const isHtmlContent = trimmed.includes('<!doctype html>') ||
                    trimmed.includes('<html') ||
                    (trimmed.startsWith('<') && (
                      trimmed.includes('<div') ||
                      trimmed.includes('<body') ||
                      trimmed.includes('<head') ||
                      trimmed.includes('<style') ||
                      trimmed.includes('<script') ||
                      trimmed.includes('<canvas') ||
                      trimmed.includes('<svg')
                    ));

                  if (isHtmlContent || title.toLowerCase().endsWith('.html') || title.toLowerCase().endsWith('.htm')) {

                    let htmlContent = localContent;
                    if (!trimmed.includes('<!doctype html>') && !trimmed.includes('<html')) {
                      htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; }
  </style>
</head>
<body>
${localContent}
</body>
</html>`;
                    }

                    return (
                      <iframe
                        key={htmlContent.length}
                        srcDoc={htmlContent}
                        className="w-full h-full bg-white"
                        title="Preview"
                        sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin"
                      />
                    );
                  }

                  if (isImage) {
                    return (
                      <div className="w-full h-full flex items-center justify-center p-8">
                        <img src={localContent.trim()} alt="Artifact Preview" className="max-w-full max-h-full object-contain shadow-2xl" />
                      </div>
                    );
                  }

                  // Default: Markdown preview
                  return (
                    <div className="p-10 prose prose-invert prose-sm max-w-full font-sans leading-relaxed">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
                        components={{
                          code({ inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || "");
                            return !inline && match ? (
                              <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" className="my-4" {...props}>
                                {String(children).replace(/\n$/, "")}
                              </SyntaxHighlighter>
                            ) : <code className={className} {...props}>{children}</code>;
                          },
                        }}
                      >
                        {preprocessMath(localContent)}
                      </ReactMarkdown>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="absolute inset-0 w-full h-full p-0 overflow-y-auto custom-scrollbar bg-black/20">
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={getLanguageFromTitle(title)}
                  showLineNumbers={true}
                  wrapLines={true}
                  lineNumberStyle={{
                    minWidth: "3em",
                    paddingRight: "1em",
                    color: "rgba(255, 255, 255, 0.3)",
                    textAlign: "right",
                    fontSize: "12px",
                    fontFamily: "var(--font-mono)",
                    userSelect: "none"
                  }}
                  customStyle={{
                    margin: 0,
                    padding: '2rem',
                    background: 'transparent',
                    fontSize: '13px',
                    lineHeight: '1.7',
                    fontFamily: "var(--font-mono)",
                    textShadow: "none"
                  }}
                  codeTagProps={{
                    style: {
                      fontFamily: "inherit"
                    }
                  }}
                >
                  {cleanLineNumbers(localContent)}
                </SyntaxHighlighter>
              </div>
            )}
          </>
        )}

        {
          isLoading && (
            <div className="absolute inset-0 bg-background/20 backdrop-blur-[4px] flex items-center justify-center pointer-events-none z-20">
              <div className="relative group">
                <div className="absolute inset-0 bg-accent blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative flex flex-col items-center gap-4 px-10 py-8 bg-card border border-accent/20 shadow-2xl animate-in zoom-in-95">
                  <div className="flex gap-2">
                    <div className="w-2 h-8 bg-accent animate-[loading_1.2s_ease-in-out_infinite]" />
                    <div className="w-2 h-8 bg-accent animate-[loading_1.2s_ease-in-out_infinite_0.2s]" />
                    <div className="w-2 h-8 bg-accent animate-[loading_1.2s_ease-in-out_infinite_0.4s]" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-accent animate-pulse">Synchronizing</span>
                </div>
              </div>
            </div>
          )
        }
      </div >

      { }
      < div className="px-8 py-3 bg-card/50 border-t border-border flex items-center justify-between" >
        <div className="flex items-center gap-4 text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-accent" />
            <span>Branch: master</span>
          </div>
          <span>{isEditMode ? "Drafting Source" : "Final Visualization"}</span>
        </div>
        <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest opacity-50">
          Fuser OS v1.0
        </div>
      </div >
    </div >
  );
};

export default ArtifactPanel;
