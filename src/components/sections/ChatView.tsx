"use client";

import React, { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import "katex/dist/katex.min.css";
import {
  Copy,
  RotateCw,
  ChevronDown,
  Lightbulb,
  ChevronRight,
  Paintbrush,
  Download,
  Check,
  Type,
  Code2
} from "lucide-react";
import ChatInput from "./ChatInput";
import ArtifactPanel from "./ArtifactPanel";
import { Message } from "@/lib/ai-service";
import { cn } from "@/lib/utils";

const getExtensionFromLanguage = (lang: string): string => {
  const map: Record<string, string> = {
    python: 'py', py: 'py',
    javascript: 'js', js: 'js',
    typescript: 'ts', ts: 'ts',
    tsx: 'tsx', jsx: 'jsx',
    html: 'html', htm: 'html',
    css: 'css', scss: 'scss', sass: 'sass', less: 'less',
    json: 'json', yaml: 'yaml', yml: 'yml',
    markdown: 'md', md: 'md',
    bash: 'sh', sh: 'sh', shell: 'sh', zsh: 'sh',
    sql: 'sql',
    java: 'java', kotlin: 'kt', kt: 'kt',
    cpp: 'cpp', 'c++': 'cpp', c: 'c', h: 'h',
    csharp: 'cs', cs: 'cs',
    go: 'go', rust: 'rs', rs: 'rs',
    ruby: 'rb', rb: 'rb',
    php: 'php',
    swift: 'swift',
    xml: 'xml', svg: 'svg',
    toml: 'toml', ini: 'ini', conf: 'conf',
    dockerfile: 'dockerfile',
    makefile: 'makefile',
    graphql: 'graphql', gql: 'graphql',
  };
  const normalized = lang.toLowerCase().trim();
  return map[normalized] || 'txt';
};

interface ChatViewProps {
  messages: Message[];
  onSendMessage: (message: string, model?: string, files?: any[], options?: { ratio?: string; painting?: boolean }) => void;
  onRegenerate?: (userMessage: string, messageIndex: number) => void;
  isLoading?: boolean;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  chatTitle?: string;
  artifact: {
    isOpen: boolean;
    title: string;
    content: string;
  };
  setArtifact: React.Dispatch<React.SetStateAction<{
    isOpen: boolean;
    title: string;
    content: string;
  }>>;
}

const ChatView = ({
  messages,
  onSendMessage,
  onRegenerate,
  isLoading,
  isSidebarOpen,
  chatTitle: propChatTitle,
  artifact,
  setArtifact,
  selectedModel
}: ChatViewProps & { selectedModel?: string }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [expandedThinking, setExpandedThinking] = useState<Set<number>>(new Set());
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [markdownEnabled, setMarkdownEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fuser_markdown_enabled');
      return saved !== 'false';
    }
    return true;
  });

  const toggleMarkdown = () => {
    setMarkdownEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem('fuser_markdown_enabled', String(newValue));
      return newValue;
    });
  };

  const preprocessMath = (text: string) => {
    if (typeof text !== 'string' || !text) return text;
    return text
      .replace(/\\\[/g, '$$$$')
      .replace(/\\\]/g, '$$$$')
      .replace(/\\\(/g, '$$')
      .replace(/\\\)/g, '$$');
  };

  const isPainting = isLoading && messages.length > 0 && (() => {

    const lastUserMsgIndex = messages.findLastIndex(msg => msg.role === 'user');
    if (lastUserMsgIndex === -1) return false;

    const responsesAfterUser = messages.slice(lastUserMsgIndex + 1);
    const hasGenimgInProgress = responsesAfterUser.some(msg => {
      if (msg.role !== 'assistant') return false;
      const content = typeof msg.content === 'string'
        ? msg.content
        : msg.content.map(p => p.type === 'text' ? p.text : '').join('');
      return content.startsWith('genimg');
    });

    return hasGenimgInProgress;
  })();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const extractCodeBlocks = (content: string) => {
    const blocks: { lang: string; code: string; title: string }[] = [];
    const regex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const lang = match[1] || 'code';
      const code = match[2].trim();
      const ext = getExtensionFromLanguage(lang);
      blocks.push({
        lang,
        code,
        title: `${lang}.${ext}`
      });
    }
    return blocks;
  };

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && !isLoading) {
        const contentString = typeof lastMessage.content === 'string'
          ? lastMessage.content
          : lastMessage.content.map(p => p.type === 'text' ? p.text : '').join('');

        const codeBlocks = extractCodeBlocks(contentString);
        if (codeBlocks.length > 0) {
          // Show the last code block by default
          const lastBlock = codeBlocks[codeBlocks.length - 1];
          if (!artifact.isOpen || artifact.content !== lastBlock.code) {
            setArtifact({
              isOpen: true,
              title: lastBlock.title,
              content: lastBlock.code
            });
          }
        }
      }
    }
  }, [messages, isLoading, setArtifact]);

  const chatTitle = propChatTitle || (messages.length > 0 && typeof messages[0].content === 'string'
    ? messages[0].content
    : "New Chat");

  return (
    <div className="flex h-screen w-full bg-background relative overflow-hidden">
      <div className={cn(
        "flex flex-col h-full bg-background relative transition-all duration-300 ease-in-out",
        artifact.isOpen ? "flex-1 border-r border-border" : "w-full"
      )}>
        <header className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-md border-b border-border px-3 sm:px-6 h-[48px] sm:h-[56px] flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            {isSidebarOpen !== false && (
              <div className="flex items-center gap-1 cursor-pointer hover:bg-secondary px-2 py-1 transition-colors">
                <span className="text-[11px] sm:text-[12px] font-mono uppercase tracking-widest text-foreground truncate max-w-[150px] sm:max-w-[200px]">
                  {chatTitle}
                </span>
                <ChevronDown size={14} className="text-muted-foreground hidden sm:block" />
              </div>
            )}
          </div>

          <button
            onClick={toggleMarkdown}
            className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            title={markdownEnabled ? "Markdown ON - Click to disable" : "Markdown OFF - Click to enable"}
          >
            {markdownEnabled ? <Type size={14} /> : <Code2 size={14} />}
            <span className="text-[10px] font-mono uppercase tracking-wider hidden sm:inline">
              {markdownEnabled ? 'MD' : 'RAW'}
            </span>
          </button>
        </header>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-0 py-4 sm:py-8 scroll-smooth"
        >
          <div className={cn(
            "mx-auto space-y-4 sm:space-y-8 pb-[160px] sm:pb-[180px] transition-all duration-300",
            artifact.isOpen ? "max-w-[700px] px-2 sm:px-4" : "max-w-[850px]"
          )}>
            <style jsx global>{`
              @keyframes eye-blink {
                0%, 88%, 92%, 100% { transform: scaleY(1); }
                90% { transform: scaleY(0.1); }
              }
              @keyframes eye-move-complex {
                0%, 10%, 100% { transform: translate(0, 0) scale(1); }
                15%, 25% { transform: translate(0, -1px) scale(1.2); }
                30%, 40% { transform: translate(1.5px, 0) scale(1); }
                45%, 55% { transform: translate(-1.5px, 0) scale(1); }
                60%, 70% { transform: translate(0, -2px) scale(1.5); }
                75%, 85% { transform: translate(0, 0) scale(1.3); }
                90%, 95% { transform: translate(0, 1px) scale(0.9); }
              }
                @keyframes bulb-ray-out {
                  0% { opacity: 0; transform: scale(0) rotate(var(--rotation)); }
                  50% { opacity: 0.8; transform: scale(1) translate(0, -2px) rotate(var(--rotation)); }
                  100% { opacity: 0; transform: scale(0.5) translate(0, -5px) rotate(var(--rotation)); }
                }
                .eye-container {
                  display: flex;
                  gap: 6px;
                  transition: all 0.3s ease;
                }
                .eye-ball {
                  width: 5px;
                  height: 5px;
                  background: white;
                  border-radius: 50%;
                  animation: eye-blink 3s infinite linear, eye-move-complex 5s infinite ease-in-out;
                  box-shadow: 0 0 4px rgba(255,255,255,0.8);
                }
                .bulb-container {
                  position: relative;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  width: 20px;
                  height: 20px;
                }
                .bulb-ray {
                  position: absolute;
                  background: #ff8844;
                  width: 1.5px;
                  height: 6px;
                  border-radius: 4px;
                  transform-origin: bottom center;
                  opacity: 0;
                  filter: blur(0.5px);
                  box-shadow: 0 0 4px #ff8844;
                }
                .ray-1 { --rotation: 0deg; animation: bulb-ray-out 1.5s infinite 0s; top: -4px; left: 50%; margin-left: -0.75px; }
                .ray-2 { --rotation: 45deg; animation: bulb-ray-out 1.5s infinite 0.3s; top: -1px; right: 2px; }
                .ray-3 { --rotation: -45deg; animation: bulb-ray-out 1.5s infinite 0.6s; top: -1px; left: 2px; }
                .thinking-bulb {
                  position: relative;
                  z-index: 1;
                  color: #ff8844 !important;
                  filter: drop-shadow(0 0 2px #ff8844/30);
                }

            `}</style>

            {messages.map((msg, idx) => {
              let contentString = typeof msg.content === 'string'
                ? msg.content
                : msg.content.map(p => p.type === 'text' ? p.text : '').join('');

              // Extract all code blocks for this message
              const codeBlocks = extractCodeBlocks(contentString);
              const hasArtifact = msg.role === 'assistant' && codeBlocks.length > 0;

              let displayContent = msg.content;
              if (hasArtifact) {
                if (typeof displayContent === 'string') {
                  displayContent = displayContent.replace(/```[\s\S]*?```/g, '').trim();
                } else {
                  displayContent = displayContent.map(part => {
                    if (part.type === 'text' && part.text) {
                      return { ...part, text: part.text.replace(/```[\s\S]*?```/g, '').trim() };
                    }
                    return part;
                  });
                }
              }

              const isGenImgCommand = msg.role === 'assistant' && contentString.startsWith('genimg');
              if (isGenImgCommand) {
                if (typeof displayContent === 'string') displayContent = "";
                else displayContent = displayContent.filter(p => p.type !== 'text' || !p.text?.startsWith('genimg'));
              }

              return (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`flex gap-4 w-full ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row items-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 bg-accent flex items-center justify-center shrink-0 mt-1 overflow-hidden">
                        <div className="eye-container">
                          <div className="eye-ball"></div>
                          <div className="eye-ball"></div>
                        </div>
                      </div>
                    )}

                    <div className={cn("flex flex-col gap-2", msg.role === 'user' ? "max-w-[85%]" : "flex-1")}>
                      {msg.role === 'assistant' && msg.model && (
                        <span className="text-[11px] font-mono font-medium text-accent uppercase tracking-widest mb-1">
                          {msg.model}
                        </span>
                      )}
                      {msg.role === 'assistant' && !isGenImgCommand && (msg.reasoning_content || (isLoading && idx === messages.length - 1 && !contentString)) && (
                        <div className="mb-4">
                          <div
                            onClick={() => {
                              setExpandedThinking(prev => {
                                const next = new Set(prev);
                                if (next.has(idx)) {
                                  next.delete(idx);
                                } else {
                                  next.add(idx);
                                }
                                return next;
                              });
                            }}
                            className="flex items-center justify-between px-4 py-2.5 bg-card border border-border w-full max-w-full cursor-pointer hover:bg-secondary transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              {isLoading && idx === messages.length - 1 && !contentString ? (
                                <>
                                  <div className="bulb-container">
                                    {[1, 2, 3].map(n => <div key={n} className={`bulb-ray ray-${n}`}></div>)}
                                    <Lightbulb size={18} className="text-accent thinking-bulb" strokeWidth={1.5} />
                                  </div>
                                  <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-accent font-bold">Thinking...</span>
                                </>
                              ) : (
                                <>
                                  <Lightbulb size={18} className="text-accent" strokeWidth={1.5} />
                                  <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Thinking complete</span>
                                </>
                              )}
                            </div>
                            {(msg.reasoning_content) && (
                              <ChevronDown
                                size={16}
                                className={cn(
                                  "text-border transition-transform duration-200",
                                  expandedThinking.has(idx) && "rotate-180"
                                )}
                                strokeWidth={1.5}
                              />
                            )}
                          </div>
                          {expandedThinking.has(idx) && msg.reasoning_content && (
                            <div className="border border-t-0 border-border bg-secondary/30 px-4 py-3 animate-in slide-in-from-top-2 duration-200">
                              <div className="text-[12px] font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto custom-scrollbar">
                                {msg.reasoning_content}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {isGenImgCommand && isLoading && idx === messages.length - 1 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-3 px-4 py-2.5 bg-card border border-border w-full max-w-full">
                            <Paintbrush size={18} className="text-accent animate-pulse" strokeWidth={1.5} />
                            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-accent font-bold">Painting...</span>
                          </div>
                        </div>
                      )}

                      {hasArtifact && codeBlocks.map((block, blockIdx) => (
                        <div
                          key={`artifact-${idx}-${blockIdx}`}
                          onClick={() => {
                            setArtifact({ isOpen: true, title: block.title, content: block.code });
                          }}
                          className="flex items-center justify-between px-4 py-3 bg-card border border-border w-full cursor-pointer hover:border-accent/60 transition-all group mb-2"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-secondary flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                              <RotateCw className="w-5 h-5 text-muted-foreground group-hover:text-accent" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[12px] font-mono uppercase tracking-widest text-foreground">Creating {block.title}</span>
                              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Click to open in editor</span>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-border group-hover:text-accent" />
                        </div>
                      ))}

                      <div className={cn("w-full flex flex-col gap-3", msg.role === 'user' ? "items-end" : "items-start")}>
                        {typeof displayContent === 'string' ? (
                          <div className={cn(
                            "px-5 py-2.5 text-[15px] leading-[1.6] font-sans max-w-full",
                            msg.role === 'user' ? "bg-card text-foreground border border-border" : "text-foreground bg-transparent border-none p-0",
                            markdownEnabled && "prose prose-invert prose-sm"
                          )}>
                            {markdownEnabled ? (
                              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]} components={{
                                code({ inline, className, children, ...props }: any) {
                                  const match = /language-(\w+)/.exec(className || "");
                                  return !inline && match ? (
                                    <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" className="my-4" {...props}>
                                      {String(children).replace(/\n$/, "")}
                                    </SyntaxHighlighter>
                                  ) : <code className={className} {...props}>{children}</code>;
                                },
                              }}>
                                {preprocessMath(displayContent)}
                              </ReactMarkdown>
                            ) : (
                              <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed overflow-x-auto">{displayContent}</pre>
                            )}
                          </div>
                        ) : (
                          <div className={cn("flex flex-col gap-4 w-full", msg.role === 'user' ? "items-end" : "items-start")}>
                            {displayContent.filter(p => p.type === 'image_url').map((part, pIdx) => (
                              <div
                                key={`img-${pIdx}`}
                                className="relative w-full max-w-[500px] sm:max-w-[600px] border border-border bg-card p-1.5 mb-2 self-start group"
                              >
                                <img
                                  src={part.image_url?.url}
                                  alt="Generated image"
                                  className="w-full max-h-[400px] sm:max-h-[500px] object-contain block cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => setFullscreenImage(part.image_url?.url || null)}
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const url = part.image_url?.url;
                                    if (url) {
                                      const link = document.createElement('a');
                                      link.href = url;
                                      link.download = `generated_image_${Date.now()}.png`;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    }
                                  }}
                                  className="absolute bottom-3 right-3 p-2 bg-accent text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent/80"
                                  title="Download image"
                                >
                                  <Download size={16} />
                                </button>
                              </div>
                            ))}
                            {displayContent.filter(p => p.type === 'text').map((part, pIdx) => (
                              <div key={`txt-${pIdx}`} className={cn(
                                "px-3 sm:px-5 py-2 sm:py-2.5 text-[14px] sm:text-[15px] leading-[1.6] font-sans max-w-full",
                                msg.role === 'user' ? "bg-card text-foreground border border-border" : "text-foreground bg-transparent border-none p-0",
                                markdownEnabled && "prose prose-invert prose-sm"
                              )}>
                                {markdownEnabled ? (
                                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]} components={{
                                    code({ inline, className, children, ...props }: any) {
                                      const match = /language-(\w+)/.exec(className || "");
                                      return !inline && match ? (
                                        <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" className="my-4" {...props}>
                                          {String(children).replace(/\n$/, "")}
                                        </SyntaxHighlighter>
                                      ) : <code className={className} {...props}>{children}</code>;
                                    },
                                  }}>
                                    {preprocessMath(part.text || "")}
                                  </ReactMarkdown>
                                ) : (
                                  <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed overflow-x-auto">{part.text || ""}</pre>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {msg.role === 'assistant' && contentString && (
                        <div className="flex items-center gap-0.5 mt-1 -ml-1">
                          <button
                            onClick={() => {
                              const text = typeof msg.content === 'string'
                                ? msg.content
                                : msg.content.filter(p => p.type === 'text').map(p => p.text).join('\n');
                              navigator.clipboard.writeText(text);
                              setCopiedIdx(idx);
                              setTimeout(() => setCopiedIdx(null), 2000);
                            }}
                            className="p-1.5 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                            title="Copy text"
                          >
                            {copiedIdx === idx ? <Check size={15} strokeWidth={1.5} className="text-green-500" /> : <Copy size={15} strokeWidth={1.5} />}
                          </button>
                          <button
                            onClick={() => {
                              // Find the last user message before this assistant message
                              for (let i = idx - 1; i >= 0; i--) {
                                if (messages[i].role === 'user') {
                                  const userContent = messages[i].content;
                                  const text = typeof userContent === 'string'
                                    ? userContent
                                    : userContent.filter(p => p.type === 'text').map(p => p.text).join(' ');
                                  if (onRegenerate && text) {
                                    onRegenerate(text, idx);
                                  }
                                  break;
                                }
                              }
                            }}
                            className="p-1.5 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                            title="Regenerate"
                          >
                            <RotateCw size={15} strokeWidth={1.5} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (messages.length === 0 || messages[messages.length - 1].role !== 'assistant') && (
              <div className="flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 w-full">
                <div className="w-8 h-8 bg-accent flex items-center justify-center shrink-0 mt-1 overflow-hidden">
                  <div className="eye-container">
                    <div className="eye-ball"></div>
                    <div className="eye-ball"></div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-card border border-border w-full max-w-full mb-4">
                    {isPainting ? (
                      <>
                        <Paintbrush size={18} className="text-accent animate-pulse" strokeWidth={1.5} />
                        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-accent font-bold">Painting...</span>
                      </>
                    ) : (
                      <>
                        <div className="bulb-container">
                          {[1, 2, 3].map(n => <div key={n} className={`bulb-ray ray-${n}`}></div>)}
                          <Lightbulb size={18} className="text-accent thinking-bulb" strokeWidth={1.5} />
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-accent font-bold">Thinking...</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 sm:absolute sm:left-0 sm:right-auto w-full bg-gradient-to-t from-background via-background/80 to-transparent pt-8 sm:pt-12 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6 px-2 sm:px-4 flex justify-center z-20" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <ChatInput
            onSendMessage={onSendMessage}
            className={cn("transition-all duration-300 w-full", artifact.isOpen ? "max-w-[600px]" : "max-w-[850px]")}
            dropdownDirection="up"
            selectedModel={selectedModel}
          />
        </div>
      </div>

      <ArtifactPanel
        isOpen={artifact.isOpen}
        onClose={() => setArtifact(prev => ({ ...prev, isOpen: false }))}
        title={artifact.title}
        content={artifact.content}
        onUpdateContent={(content) => setArtifact(prev => ({ ...prev, content }))}
        isLoading={isLoading}
      />

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center cursor-pointer animate-in fade-in duration-200 p-4 sm:p-8"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            className="absolute top-3 right-3 sm:top-4 sm:right-4 w-10 h-10 sm:w-auto sm:h-auto flex items-center justify-center text-white/70 hover:text-white text-3xl sm:text-4xl font-light transition-colors bg-white/10 sm:bg-transparent rounded-full sm:rounded-none"
            onClick={() => setFullscreenImage(null)}
          >
            ×
          </button>
          <img
            src={fullscreenImage}
            alt="Fullscreen view"
            className="max-w-full max-h-[85vh] sm:max-w-[90vw] sm:max-h-[90vh] object-contain animate-in zoom-in-95 duration-200 rounded-sm"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default ChatView;
