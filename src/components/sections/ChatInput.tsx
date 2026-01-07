"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Paperclip,
  ArrowUp,
  Check,
  Search as SearchIcon,
  X,
  FileText,
  ChevronLeft,
  Sparkles,
  Zap,
  Brain,
  RectangleHorizontal,
  Palette
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchModels, AIModel } from "@/lib/ai-service";

interface AttachedFile {
  id: string;
  file: File;
  preview?: string;
  base64?: string;
}

const RATIO_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: '16:9', label: '16:9' },
  { value: '3:2', label: '3:2' },
  { value: '4:3', label: '4:3' },
  { value: '1:1', label: '1:1' },
  { value: '3:4', label: '3:4' },
  { value: '2:3', label: '2:3' },
  { value: '9:16', label: '9:16' },
];

interface ChatInputProps {
  onSendMessage: (message: string, model?: string, files?: AttachedFile[], options?: { ratio?: string; painting?: boolean }) => void;
  placeholder?: string;
  className?: string;
  initialModel?: string;
  dropdownDirection?: 'up' | 'down';
}

const ChatInput = ({
  onSendMessage,
  placeholder = "Ask Anything...",
  className,
  initialModel = 'gemini-2.5-flash',
  dropdownDirection = 'down',
  selectedModel: selectedModelProp
}: ChatInputProps & { selectedModel?: string }) => {
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState(initialModel);

  useEffect(() => {
    if (selectedModelProp) {
      setSelectedModel(selectedModelProp);
    }
  }, [selectedModelProp]);

  const [models, setModels] = useState<Record<string, AIModel>>({});
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState<Set<string>>(new Set());
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);

  // Image generation options
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [showRatioDropdown, setShowRatioDropdown] = useState(false);
  const ratioDropdownRef = useRef<HTMLDivElement>(null);

  const isImageModelSelected = models[selectedModel]?.modality === 'image';

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const fetchedModels = await fetchModels();
        setModels(fetchedModels);
      } catch (error) {
        console.error("Failed to fetch models:", error);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
        setSelectedOwner(null);
        setHoveredModel(null);
      }
      if (ratioDropdownRef.current && !ratioDropdownRef.current.contains(event.target as Node)) {
        setShowRatioDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSend = () => {
    if (inputValue.trim() || attachedFiles.length > 0) {
      onSendMessage(inputValue, selectedModel, attachedFiles, { ratio: selectedRatio });
      setInputValue("");
      setAttachedFiles([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const newFilesPromises = Array.from(files).map(async (file) => {
      const id = Math.random().toString(36).substring(7);
      const isImage = file.type.startsWith('image/');

      if (isImage) {
        setLoadingFiles(prev => new Set(prev).add(id));
      }

      let base64: string | undefined;

      if (isImage) {
        try {
          const { fileToBase64 } = await import('@/lib/ai-service');
          base64 = await fileToBase64(file);
        } catch (error) {
          console.error("Error converting file to base64:", error);
        } finally {
          setLoadingFiles(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }
      }

      return {
        id,
        file,
        preview: isImage ? URL.createObjectURL(file) : undefined,
        base64
      };
    });

    const newFiles = await Promise.all(newFilesPromises);
    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (id: string) => {
    setAttachedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files.length > 0) {
      handleFileSelect(e.clipboardData.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  const allModels = Object.entries(models).map(([id, model]) => ({ id, ...model }));

  // Group models by owner
  const groupedModels = allModels.reduce((acc, model) => {
    const owner = model.owner || 'Other';
    if (!acc[owner]) acc[owner] = [];
    acc[owner].push(model);
    return acc;
  }, {} as Record<string, typeof allModels>);

  // Sort owners alphabetically
  const sortedOwners = Object.keys(groupedModels).sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return a.localeCompare(b);
  });

  // Filter models by search
  const filteredModels = searchQuery
    ? allModels.filter((model) =>
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (model.owner || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
    : selectedOwner
      ? groupedModels[selectedOwner] || []
      : [];

  const getModelShortName = (id: string) => {
    if (models[id]?.name) {
      const name = models[id].name;
      if (name.includes('GPT-4o')) return 'GPT-4o';
      if (name.includes('GPT-4')) return 'GPT-4';
      if (name.includes('Gemini')) {
        if (name.includes('Flash')) return 'Flash';
        if (name.includes('Pro')) return 'Pro';
        return 'Gemini';
      }
      if (name.includes('Claude')) return 'Claude';
      return name.split(' ')[0];
    }
    if (id.includes('gpt-4o')) return 'GPT-4o';
    if (id.includes('flash')) return 'Flash';
    if (id.includes('claude')) return 'Claude';
    return id.split('-')[0].toUpperCase();
  };

  const previewModel = hoveredModel ? allModels.find(m => m.id === hoveredModel) : null;

  return (
    <div className={cn("w-full max-w-[760px]", className)}>
      <div
        className={cn(
          "relative flex flex-col p-4 bg-card border transition-all rounded-2xl",
          isDragging ? "border-accent bg-accent/5" : "border-border hover:border-accent/40 shadow-sm"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
        />

        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-4">
            <style jsx>{`
              @keyframes spin-loader {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              .loader-circle-small {
                width: 16px;
                height: 16px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-top: 1px solid var(--accent);
                animation: spin-loader 0.8s linear infinite;
              }
              .loader-circle {
                width: 24px;
                height: 24px;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-top: 1px solid var(--accent);
                animation: spin-loader 0.8s linear infinite;
              }
            `}</style>
            {attachedFiles.map((file) => (
              <div key={file.id} className="relative group w-16 h-16 border border-border bg-secondary overflow-visible transition-all hover:border-accent/40">
                {file.preview ? (
                  <div className="relative w-full h-full overflow-hidden">
                    <img src={file.preview} alt="preview" className={cn("w-full h-full object-cover transition-opacity duration-300", loadingFiles.has(file.id) ? "opacity-40" : "opacity-100")} />
                    {loadingFiles.has(file.id) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                        <div className="loader-circle" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground overflow-hidden">
                    <FileText size={20} />
                  </div>
                )}
                <button
                  onClick={() => handleRemoveFile(file.id)}
                  className="absolute -top-1.5 -right-1.5 bg-accent text-accent-foreground w-[18px] h-[18px] flex items-center justify-center transition-all z-20 border border-background"
                >
                  <X size={10} strokeWidth={4} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative flex-grow flex flex-col">
          <textarea
            ref={textareaRef}
            className="w-full bg-transparent border-none focus:ring-0 resize-none text-[15px] leading-[1.6] text-foreground min-h-[44px] pb-2 outline-none placeholder:text-muted-foreground/60 font-sans"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            rows={1}
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            {/* Ratio Selector - Only for Image Models */}
            {isImageModelSelected && (
              <div className="relative" ref={ratioDropdownRef}>
                <button
                  onClick={() => setShowRatioDropdown(!showRatioDropdown)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1.5 transition-all group h-8 rounded-md",
                    selectedRatio !== '1:1' ? "bg-accent/10 text-accent font-bold" : "hover:bg-secondary text-muted-foreground"
                  )}
                >
                  <div className={cn(
                    "border border-current opacity-80 flex items-center justify-center transition-all",
                    selectedRatio === '16:9' ? "w-3.5 h-2" :
                      selectedRatio === '3:2' ? "w-3 h-2" :
                        selectedRatio === '4:3' ? "w-2.5 h-2" :
                          selectedRatio === '1:1' ? "w-2.5 h-2.5" :
                            selectedRatio === '3:4' ? "w-2 h-2.5" :
                              selectedRatio === '2:3' ? "w-2 h-3" :
                                selectedRatio === '9:16' ? "w-1.5 h-3" : "w-2.5 h-2.5"
                  )}>
                    {selectedRatio === 'auto' && <Sparkles size={10} />}
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.1em]">
                    {selectedRatio}
                  </span>
                  <ChevronDown size={12} strokeWidth={1.5} className={cn("transition-transform duration-200", showRatioDropdown && "rotate-180")} />
                </button>

                {showRatioDropdown && (
                  <div className={cn(
                    "absolute left-0 bg-card border border-border z-[100] shadow-2xl animate-in fade-in zoom-in-95 duration-200 min-w-[140px] rounded-lg overflow-hidden",
                    dropdownDirection === 'up' ? "bottom-full mb-2" : "top-full mt-2"
                  )}>
                    <div className="py-1">
                      {RATIO_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSelectedRatio(option.value);
                            setShowRatioDropdown(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 text-left transition-all text-[11px] font-mono",
                            selectedRatio === option.value
                              ? "bg-accent/10 text-accent font-bold"
                              : "hover:bg-secondary text-foreground"
                          )}
                        >
                          <div className={cn(
                            "border border-current opacity-70 flex items-center justify-center flex-shrink-0",
                            option.value === '16:9' ? "w-3.5 h-2" :
                              option.value === '3:2' ? "w-3 h-2" :
                                option.value === '4:3' ? "w-2.5 h-2" :
                                  option.value === '1:1' ? "w-2.5 h-2.5" :
                                    option.value === '3:4' ? "w-2 h-2.5" :
                                      option.value === '2:3' ? "w-2 h-3" :
                                        option.value === '9:16' ? "w-1.5 h-3" : "w-2.5 h-2.5"
                          )}>
                            {option.value === 'auto' && <Sparkles size={10} />}
                          </div>
                          <span className="flex-grow">{option.label}</span>
                          {selectedRatio === option.value && <Check size={12} />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => {
                  setShowModelDropdown(!showModelDropdown);
                  setSelectedOwner(null);
                  setHoveredModel(null);
                }}
                className="flex items-center gap-1 px-2 py-1.5 hover:bg-secondary transition-all group h-8"
              >
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground group-hover:text-foreground">
                  {getModelShortName(selectedModel)}
                </span>
                <ChevronDown size={14} className="text-muted-foreground group-hover:text-foreground" strokeWidth={1.5} />
              </button>

              {showModelDropdown && (
                <div className={cn(
                  "absolute right-0 bg-card border border-border z-[100] flex flex-row-reverse shadow-2xl animate-in fade-in zoom-in-95 duration-200",
                  dropdownDirection === 'up' ? "bottom-full mb-3" : "top-full mt-3"
                )}>
                  <div className="w-[160px] flex flex-col">
                    <div className="p-2 border-b border-border bg-card">
                      <div className="relative">
                        <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search..."
                          className="w-full pl-7 pr-2 py-1.5 bg-secondary text-[10px] font-mono outline-none border-none"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (e.target.value) {
                              setSelectedOwner(null);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    {searchQuery ? (
                      <div className="overflow-y-auto py-1 custom-scrollbar max-h-[180px]">
                        <div className="px-2 py-1 text-[8px] font-mono text-muted-foreground uppercase tracking-widest">
                          Results ({filteredModels.length})
                        </div>
                        {filteredModels.map((model) => (
                          <button
                            key={model.id}
                            onClick={() => {
                              setSelectedModel(model.id);
                              setShowModelDropdown(false);
                              setSearchQuery("");
                            }}
                            className="w-full flex flex-col px-2 py-2 hover:bg-secondary transition-all text-left"
                          >
                            <span className="text-[10px] font-mono font-bold text-foreground truncate">{model.name}</span>
                            <span className="text-[8px] font-mono text-muted-foreground truncate">{model.owner}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="overflow-y-auto py-1 custom-scrollbar max-h-[180px]">
                        {sortedOwners.map((owner) => (
                          <button
                            key={owner}
                            onClick={() => setSelectedOwner(owner)}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2.5 text-left transition-all",
                              selectedOwner === owner
                                ? "bg-accent text-accent-foreground"
                                : "hover:bg-secondary text-foreground"
                            )}
                          >
                            <span className="text-[11px] font-mono font-medium">{owner}</span>
                            <span className={cn(
                              "text-[9px] font-mono",
                              selectedOwner === owner ? "text-accent-foreground/70" : "text-muted-foreground"
                            )}>
                              {groupedModels[owner].length}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedOwner && (
                    <div className="w-[220px] flex flex-col border-r border-border animate-in fade-in slide-in-from-right-2 duration-150">
                      <div className="px-3 py-2 border-b border-border bg-secondary/30 flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-foreground uppercase tracking-wider">
                          {selectedOwner}
                        </span>
                        <span className="text-[9px] font-mono text-muted-foreground ml-auto">
                          {groupedModels[selectedOwner]?.length || 0}
                        </span>
                      </div>
                      <div className="overflow-y-auto custom-scrollbar max-h-[180px]">
                        {(groupedModels[selectedOwner] || []).map((model) => (
                          <button
                            key={model.id}
                            onClick={() => {
                              setSelectedModel(model.id);
                              setShowModelDropdown(false);
                              setSelectedOwner(null);
                            }}
                            onMouseEnter={() => setHoveredModel(model.id)}
                            onMouseLeave={() => setHoveredModel(null)}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2.5 transition-all text-left border-b border-border/30 last:border-0",
                              selectedModel === model.id ? "bg-accent/10" : "hover:bg-secondary"
                            )}
                          >
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-[11px] font-mono font-bold text-foreground truncate">{model.name}</span>
                            </div>
                            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                              {model.modality === 'image' && (
                                <span className="px-1 py-0.5 bg-purple-500/20 text-purple-400 text-[7px] font-mono uppercase">IMG</span>
                              )}
                              {model['can-think'] && (
                                <span className="px-1 py-0.5 bg-accent/20 text-accent text-[7px] font-mono uppercase">R</span>
                              )}
                              {selectedModel === model.id && <Check className="w-3 h-3 text-accent" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Details Panel - appears to the LEFT of models */}
                  {previewModel && (
                    <div className="w-[180px] bg-secondary/20 p-3 border-r border-border animate-in fade-in slide-in-from-right-2 duration-150">
                      <div className="flex flex-col gap-2">
                        <span className="text-[12px] font-mono font-bold text-foreground">{previewModel.name}</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={cn(
                            "px-1.5 py-0.5 text-[8px] font-mono uppercase",
                            previewModel.modality === 'image'
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-blue-500/20 text-blue-400"
                          )}>
                            {previewModel.modality}
                          </span>
                        </div>
                        {previewModel.description && (
                          <p className="text-[9px] font-mono text-muted-foreground leading-relaxed mt-1">
                            {previewModel.description}
                          </p>
                        )}
                        <div className="mt-2 space-y-1.5 border-t border-border pt-2">
                          {previewModel['can-stream'] && (
                            <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground">
                              <Zap size={10} className="text-green-400" />
                              <span>Streaming</span>
                            </div>
                          )}
                          {previewModel['can-think'] && (
                            <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground">
                              <Brain size={10} className="text-accent" />
                              <span>Reasoning</span>
                            </div>
                          )}
                          {previewModel['can-tools'] && (
                            <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground">
                              <Sparkles size={10} className="text-yellow-400" />
                              <span>Tools</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center w-8 h-8 hover:bg-secondary text-muted-foreground transition-all"
            >
              <Paperclip size={18} strokeWidth={1.5} />
            </button>

            <div className="w-[1px] h-4 bg-border mx-1" />

            <button
              onClick={handleSend}
              disabled={!inputValue.trim() && attachedFiles.length === 0 || loadingFiles.size > 0}
              className={cn(
                "flex items-center justify-center w-9 h-9 transition-all ml-1 rounded-xl shadow-sm",
                (inputValue.trim() || attachedFiles.length > 0) && loadingFiles.size === 0
                  ? "bg-[#FF6B00] text-white cursor-pointer hover:bg-[#FF8533] active:scale-90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              {loadingFiles.size > 0 ? (
                <div className="loader-circle-small" />
              ) : (
                <ArrowUp size={18} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
