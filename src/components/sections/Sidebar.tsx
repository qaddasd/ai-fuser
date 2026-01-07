"use client";

import React from "react";
import {
  Plus,
  Clock,
  ChevronRight,
  PanelLeft,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Chat {
  id: string;
  title: string;
  messages: any[];
}

interface SidebarProps {
  chats: Chat[];
  activeChatId?: string;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  systemPrompt: string;
  onSystemPromptChange: (val: string) => void;
  isSystemPromptOpen: boolean;
  onSystemPromptOpenChange: (val: boolean) => void;
  onAppBuilderClick?: () => void;
  isAppBuilderActive?: boolean;
}

const Sidebar = ({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  isOpen,
  onToggle,
  systemPrompt,
  onSystemPromptChange,
  isSystemPromptOpen,
  onSystemPromptOpenChange,
  onAppBuilderClick,
  isAppBuilderActive
}: SidebarProps) => {
  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen w-[260px] bg-sidebar border-r border-border flex flex-col z-50 transition-transform duration-300 ease-in-out",
      !isOpen && "-translate-x-full"
    )}>
      <div className="flex items-center justify-between px-4 h-[60px] border-b border-border">
        <div className="flex items-center gap-2">
          <span className="font-display text-2xl tracking-tight text-[#FF6B00] uppercase drop-shadow-[0_0_8px_rgba(255,107,0,0.3)]">fuser</span>
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 hover:bg-secondary transition-colors text-muted-foreground cursor-pointer"
        >
          <PanelLeft className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        <button
          onClick={onNewChat}
          className="flex items-center justify-between w-full px-4 h-[44px] bg-transparent text-[#FF6B00] border border-[#FF6B00] hover:bg-[#FF6B00]/10 transition-all mb-6 group cursor-pointer"
        >
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] font-bold">
            <Plus className="w-4 h-4" strokeWidth={2} />
            New Chat
          </div>
          <div className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity">
            <span className="px-1.5 py-0.5 bg-secondary border border-border rounded-md">Ctrl K</span>
          </div>
        </button>

        <div className="mt-8">
          <div className="px-3 py-2 flex items-center gap-2 text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-[0.3em]">
            <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
            Chat History
          </div>
          <div className="space-y-0.5 mt-2">
            {chats.length > 0 ? (
              chats.map((chat) => (
                <div key={chat.id} className="group relative">
                  <button
                    onClick={() => onSelectChat(chat.id)}
                    className={cn(
                      "w-full flex items-center px-3 h-[40px] text-left text-[12px] font-mono transition-all truncate pr-10 uppercase tracking-wider",
                      chat.id === activeChatId
                        ? "bg-accent text-accent-foreground font-bold"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <span className="truncate">{chat.title}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-[10px] font-mono text-muted-foreground text-center uppercase tracking-widest opacity-40">
                Empty History
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-3 py-4 border-t border-border bg-sidebar/50 space-y-2">
        <button
          onClick={onAppBuilderClick}
          className={cn(
            "w-full flex items-center justify-between px-3 h-[48px] border border-border/50 hover:border-accent/30 transition-all group bg-card/30 cursor-pointer",
            isAppBuilderActive && "bg-accent/10 border-accent/50"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-6 h-6 flex items-center justify-center text-[10px] font-mono font-bold transition-transform group-hover:scale-110",
              isAppBuilderActive ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"
            )}>
              AB
            </div>
            <span className={cn(
              "text-[11px] font-mono uppercase tracking-[0.2em]",
              isAppBuilderActive ? "text-accent" : "text-foreground"
            )}>App Builder</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          onClick={() => onSystemPromptOpenChange(true)}
          className="w-full flex items-center justify-between px-3 h-[48px] border border-border/50 hover:border-accent/30 transition-all bg-card/30 group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-accent flex items-center justify-center text-[10px] font-mono text-accent-foreground font-bold group-hover:scale-110 transition-transform">
              F
            </div>
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-foreground">Fuser</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      { }
      {isSystemPromptOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-card border border-border shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent animate-pulse" />
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] font-bold">System Prompt Configuration</span>
              </div>
              <button
                onClick={() => onSystemPromptOpenChange(false)}
                className="p-1 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-4 leading-relaxed">
                Define the core behavior and identity of your AI assistant. This prompt will be injected into every conversation.
              </p>
              <textarea
                value={systemPrompt}
                onChange={(e) => onSystemPromptChange(e.target.value)}
                placeholder="Enter system prompt instructions..."
                className="w-full h-64 bg-secondary/30 border border-border p-4 font-mono text-[12px] text-foreground focus:outline-none focus:border-accent/50 transition-colors resize-none custom-scrollbar"
                spellCheck={false}
              />
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => onSystemPromptOpenChange(false)}
                  className="px-6 h-[40px] bg-accent text-accent-foreground text-[11px] font-mono uppercase tracking-[0.2em] font-bold hover:opacity-90 transition-opacity"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>

  );
};

export default Sidebar;
