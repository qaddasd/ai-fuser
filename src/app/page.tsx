"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/sections/Sidebar";
import HeroSearch from "@/components/sections/HeroSearch";
import ChatView from "@/components/sections/ChatView";
import { Message, sendChatRequest, generateImage, fetchModels, isReasoningModel, isImageModel as checkImageModel, IMAGE_GEN_PROMPT } from "@/lib/ai-service";
import { cn } from "@/lib/utils";
import { PanelLeft, Plus, Clock, ChevronRight } from "lucide-react";

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

function getImagesFromMessages(messages: Message[]): string[] {
  const images: string[] = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === 'image_url' && part.image_url?.url) {
          images.push(part.image_url.url);
        }
      }
    }
    if (images.length > 0) break;
  }
  return images;
}

export default function Home() {
  const [isChatting, setIsChatting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const currentChatIdRef = useRef<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');

  useEffect(() => {
    currentChatIdRef.current = currentChatId;
  }, [currentChatId]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {

    if (window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
    }
  }, []);
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);

  const [artifact, setArtifact] = useState<{
    isOpen: boolean;
    title: string;
    content: string;
  }>({
    isOpen: false,
    title: "",
    content: ""
  });

  const [systemPrompt, setSystemPrompt] = useState("");
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);
  const [isAppBuilderActive, setIsAppBuilderActive] = useState(false);
  const [appBuilderModel, setAppBuilderModel] = useState('gemini-3-pro-preview');

  useEffect(() => {
    const savedChats = localStorage.getItem("fuser_chats");
    const savedPrompt = localStorage.getItem("fuser_system_prompt");
    if (savedPrompt) setSystemPrompt(savedPrompt);
    if (savedChats) {
      try {
        const parsed = JSON.parse(savedChats);
        setChats(parsed);
      } catch (e) {
        console.error("Failed to parse chats", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("fuser_system_prompt", systemPrompt);
  }, [systemPrompt]);

  useEffect(() => {
    const saveToStorage = setTimeout(() => {
      try {

        const chatsForStorage = chats.map(chat => ({
          ...chat,
          messages: chat.messages.map(msg => msg)
        }));
        localStorage.setItem("fuser_chats", JSON.stringify(chatsForStorage));
      } catch (e) {
        if (e instanceof DOMException && e.name === "QuotaExceededError") {
          console.error("Storage quota exceeded, removing oldest chat");
          if (chats.length > 1) {
            const newChats = chats.slice(0, -1);
            setChats(newChats);
          }
        }
      }
    }, 1000);

    return () => clearTimeout(saveToStorage);
  }, [chats]);

  const handleSendMessage = async (content: string, model?: string, files?: any[], options?: { ratio?: string; painting?: boolean }) => {
    const useModel = model || (isAppBuilderActive ? appBuilderModel : selectedModel);
    const ratio = options?.ratio || '1:1';
    if (model) {
      if (isAppBuilderActive) {
        setAppBuilderModel(model);
      } else {
        setSelectedModel(model);
      }
    }
    let chatId = currentChatId;
    let currentMessages = messages;

    if (!isChatting || !chatId) {
      setIsChatting(true);
      chatId = Date.now().toString();
      setCurrentChatId(chatId);
      currentMessages = [];
    }

    let newUserMessage: Message;

    if (files && files.length > 0) {
      const messageContent: any[] = [];

      files.forEach(file => {
        if (file.base64) {
          messageContent.push({
            type: 'image_url',
            image_url: {
              url: file.base64
            }
          });
        }
      });

      if (content) {
        messageContent.push({ type: 'text', text: content });
      }

      newUserMessage = { role: 'user', content: messageContent };
    } else {
      newUserMessage = { role: 'user', content };
    }

    const updatedMessages = [...currentMessages, newUserMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    const chatTitle = typeof content === 'string' && content.length > 0
      ? content.slice(0, 40) + (content.length > 40 ? "..." : "")
      : "New Chat";
    setChats(prev => {
      const existing = prev.find(c => c.id === chatId);
      if (existing) {
        return prev.map(c => c.id === chatId ? { ...c, messages: updatedMessages, updatedAt: Date.now() } : c);
      }
      return [{ id: chatId!, title: chatTitle, messages: updatedMessages, updatedAt: Date.now() }, ...prev];
    });

    try {
      const activeModel = isAppBuilderActive ? appBuilderModel : useModel;

      const models = await fetchModels();
      const modelInfo = models[activeModel];

      const modelIsImage = modelInfo && checkImageModel(modelInfo);

      if (modelIsImage) {
        const prompt = typeof content === 'string' ? content : 'Generate an image';

        const commandMessage: Message = { role: 'assistant', content: `genimg ${prompt}`, model: activeModel };
        const messagesWithCommand = [...updatedMessages, commandMessage];

        if (currentChatIdRef.current === chatId) {
          setMessages(messagesWithCommand);
        }

        try {
          const previousImages = getImagesFromMessages(updatedMessages);
          const imageUrl = await generateImage(prompt, activeModel, previousImages, ratio);

          const imageAssistantMessage: Message = {
            role: 'assistant',
            content: [
              { type: 'text', text: `Generated: "${prompt}"` },
              { type: 'image_url', image_url: { url: imageUrl } }
            ],
            model: activeModel,
          };

          const finalMessages = [...messagesWithCommand, imageAssistantMessage];

          if (currentChatIdRef.current === chatId) {
            setMessages(finalMessages);
          }
          setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: finalMessages, updatedAt: Date.now() } : c));
        } catch (imgError) {
          console.error("Image generation error:", imgError);
          const errorMsg: Message = { role: 'assistant', content: "Failed to generate image. Please try again.", model: activeModel };
          const finalMessages = [...messagesWithCommand, errorMsg];

          if (currentChatIdRef.current === chatId) {
            setMessages(finalMessages);
          }
          setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: finalMessages, updatedAt: Date.now() } : c));
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // For text models
      const reasoningLevel = modelInfo && isReasoningModel(modelInfo) ? 'high' : undefined;
      const activePrompt = isAppBuilderActive ? systemPrompt : IMAGE_GEN_PROMPT;
      const supportsStreaming = modelInfo?.['can-stream'] !== false;

      let assistantResponse;

      if (supportsStreaming) {
        // Initialize empty assistant message for streaming
        const initialAssistantMessage: Message = {
          role: 'assistant',
          content: '',
          model: activeModel,
        };

        setMessages(prev => [...prev, initialAssistantMessage]);

        assistantResponse = await sendChatRequest(
          activeModel,
          updatedMessages,
          activePrompt,
          reasoningLevel,
          (chunk, reasoning) => {
            setMessages(prev => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                const updatedMsg = {
                  ...lastMsg,
                  content: (lastMsg.content as string) + chunk,
                  reasoning_content: (lastMsg.reasoning_content || '') + (reasoning || '')
                };
                return [...prev.slice(0, -1), updatedMsg];
              }
              return prev;
            });
          }
        );
      } else {
        // Fallback for models that don't support streaming
        assistantResponse = await sendChatRequest(
          activeModel,
          updatedMessages,
          activePrompt,
          reasoningLevel
        );

        const assistantMsg: Message = {
          role: 'assistant',
          content: assistantResponse.content,
          reasoning_content: assistantResponse.reasoning_content,
          model: activeModel,
        };
        setMessages(prev => [...prev, assistantMsg]);
      }

      const assistantResponseStr = assistantResponse.content;

      const genImgRegex = /^\s*genimg\s+(.+)$/im;
      const genImgMatch = assistantResponseStr.match(genImgRegex);

      if (genImgMatch) {
        // If it's an image generation command, remove the last streaming message
        setMessages(prev => prev.slice(0, -1));

        let prompt = genImgMatch[1].trim();
        prompt = prompt.replace(/^["']|["']$/g, '');

        const commandMessage: Message = { role: 'assistant', content: `genimg ${prompt}`, model: activeModel };
        const messagesWithCommand = [...updatedMessages, commandMessage];
        setMessages(messagesWithCommand);

        try {
          const previousImages = getImagesFromMessages(messagesWithCommand);
          const imageUrl = await generateImage(prompt, 'flux-2-dev', previousImages, ratio);

          const userRequestedArtifact = typeof content === 'string' && (
            content.toLowerCase().includes('artifact') ||
            content.toLowerCase().includes('артефакт') ||
            content.toLowerCase().includes('артифакт')
          );

          if (artifact.isOpen || userRequestedArtifact) {
            setArtifact({
              isOpen: true,
              title: "Generated Image",
              content: `![${prompt}](${imageUrl})\n\n**Prompt:** ${prompt}`
            });

            const imageAssistantMessage: Message = {
              role: 'assistant',
              content: `Image generated and displayed in the Artifacts panel.`,
              model: activeModel,
            };
            const finalMessages = [...messagesWithCommand, imageAssistantMessage];
            setMessages(finalMessages);
            setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: finalMessages, updatedAt: Date.now() } : c));
          } else {
            const imageAssistantMessage: Message = {
              role: 'assistant',
              content: [
                { type: 'text', text: `Generated: "${prompt}"` },
                { type: 'image_url', image_url: { url: imageUrl } }
              ],
              model: activeModel,
            };

            const finalMessages = [...messagesWithCommand, imageAssistantMessage];
            setMessages(finalMessages);
            setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: finalMessages, updatedAt: Date.now() } : c));
          }
        } catch (imgError) {
          console.error("Image generation error:", imgError);
          const errorMsg: Message = { role: 'assistant', content: "Failed to generate image. Please try again.", model: activeModel };
          const finalMessages = [...messagesWithCommand, errorMsg];
          setMessages(finalMessages);
          setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: finalMessages, updatedAt: Date.now() } : c));
        }
        return;
      }

      const finalMessages = [...updatedMessages, {
        role: 'assistant',
        content: assistantResponse.content,
        reasoning_content: assistantResponse.reasoning_content,
        model: activeModel,
      } as Message];

      setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: finalMessages, updatedAt: Date.now() } : c));
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = { role: 'assistant', content: "Sorry, I encountered an error. Please try again." };
      const errorMessages = [...updatedMessages, errorMessage];

      if (currentChatIdRef.current === chatId) {
        setMessages(errorMessages);
      }
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: errorMessages, updatedAt: Date.now() } : c));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setIsChatting(false);
    setMessages([]);
    setCurrentChatId(null);
    setIsNavDropdownOpen(false);
    setIsAppBuilderActive(false);
    setSystemPrompt("");
  };

  const handleSelectChat = (id: string) => {
    const chat = chats.find(c => c.id === id);
    if (chat) {
      setCurrentChatId(chat.id);
      setMessages(chat.messages);
      setIsChatting(true);
      setIsNavDropdownOpen(false);
    }
  };

  const handleDeleteChat = (id: string) => {
    setChats(prev => prev.filter(c => c.id !== id));
    if (currentChatId === id) {
      handleNewChat();
    }
  };

  // Regenerate: replace the assistant message at given index with a new response
  const handleRegenerate = async (userMessage: string, messageIndex: number) => {
    if (!currentChatId) return;

    // Get messages up to and including the user message before the assistant response
    // messageIndex is the index of the assistant message we want to replace
    const messagesUpToUser = messages.slice(0, messageIndex);

    // Set loading and remove the old assistant response
    setIsLoading(true);
    setMessages(messagesUpToUser);

    // Update chats to reflect removed assistant message
    setChats(prev => prev.map(c =>
      c.id === currentChatId
        ? { ...c, messages: messagesUpToUser, updatedAt: Date.now() }
        : c
    ));

    const activeModel = isAppBuilderActive ? appBuilderModel : selectedModel;

    try {
      const models = await fetchModels();
      const modelInfo = models[activeModel];
      const reasoningLevel = modelInfo && isReasoningModel(modelInfo) ? 'high' : undefined;
      const activePrompt = isAppBuilderActive ? systemPrompt : IMAGE_GEN_PROMPT;
      const supportsStreaming = modelInfo?.['can-stream'] !== false;

      let assistantResponse;

      if (supportsStreaming) {
        const initialAssistantMessage: Message = {
          role: 'assistant',
          content: '',
          model: activeModel,
        };

        setMessages(prev => [...prev, initialAssistantMessage]);

        assistantResponse = await sendChatRequest(
          activeModel,
          messagesUpToUser,
          activePrompt,
          reasoningLevel,
          (chunk, reasoning) => {
            setMessages(prev => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                const updatedMsg = {
                  ...lastMsg,
                  content: (lastMsg.content as string) + chunk,
                  reasoning_content: (lastMsg.reasoning_content || '') + (reasoning || '')
                };
                return [...prev.slice(0, -1), updatedMsg];
              }
              return prev;
            });
          }
        );
      } else {
        assistantResponse = await sendChatRequest(
          activeModel,
          messagesUpToUser,
          activePrompt,
          reasoningLevel
        );

        const assistantMsg: Message = {
          role: 'assistant',
          content: assistantResponse.content,
          reasoning_content: assistantResponse.reasoning_content,
          model: activeModel,
        };
        setMessages(prev => [...prev, assistantMsg]);
      }

      const finalMessages = [...messagesUpToUser, {
        role: 'assistant',
        content: assistantResponse.content,
        reasoning_content: assistantResponse.reasoning_content,
        model: activeModel,
      } as Message];

      setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, messages: finalMessages, updatedAt: Date.now() } : c));
    } catch (error) {
      console.error("Error regenerating:", error);
      const errorMessage: Message = { role: 'assistant', content: "Sorry, I encountered an error. Please try again.", model: activeModel };
      const errorMessages = [...messagesUpToUser, errorMessage];
      setMessages(errorMessages);
      setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, messages: errorMessages, updatedAt: Date.now() } : c));
    } finally {
      setIsLoading(false);
    }
  };

  const activeChatTitle = messages.length > 0 && typeof messages[0].content === 'string'
    ? messages[0].content
    : "New Chat";

  const activeModel = isAppBuilderActive ? appBuilderModel : selectedModel;

  return (
    <div className="flex min-h-screen bg-background font-sans">

      <Sidebar
        chats={chats}
        activeChatId={currentChatId || undefined}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        systemPrompt={systemPrompt}
        onSystemPromptChange={setSystemPrompt}
        isSystemPromptOpen={isSystemPromptOpen}
        onSystemPromptOpenChange={setIsSystemPromptOpen}
        onAppBuilderClick={() => {
          const newState = !isAppBuilderActive;
          setIsAppBuilderActive(newState);
          if (newState) {
            setSystemPrompt("You are an expert web developer. You build modern, responsive websites using HTML, TailwindCSS, and JavaScript. ALWAY wrap your entire code in a single HTML file with embedded CSS and JS. Do not start with markdown code blocks immediately, give a brief introduction then the code.");
          } else {
            setSystemPrompt("");
          }
          setCurrentChatId(null);
          setMessages([]);
          setIsChatting(false);
        }}
        isAppBuilderActive={isAppBuilderActive}
      />

      <main className={cn(
        "flex-1 flex flex-col transition-all duration-300 ease-in-out overflow-hidden relative",
        isSidebarOpen ? "ml-[260px]" : "ml-0"
      )}>
        {!isSidebarOpen && (
          <div className="fixed top-4 left-4 z-[100] flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex items-center justify-center w-[40px] h-[40px] hover:bg-[#FF8533] rounded-2xl transition-all duration-300 text-white bg-[#FF6B00] border border-[#FF5500] shadow-[0_0_15px_rgba(255,107,0,0.3)] active:scale-95"
            >
              <PanelLeft className="w-[20px] h-[20px]" strokeWidth={1.5} />
            </button>
            <button
              onClick={handleNewChat}
              className="flex items-center justify-center w-[40px] h-[40px] hover:bg-[#FF8533] rounded-2xl transition-all duration-300 text-white bg-[#FF6B00] border border-[#FF5500] shadow-[0_0_15px_rgba(255,107,0,0.3)] active:scale-95"
            >
              <Plus className="w-[22px] h-[22px]" strokeWidth={1.5} />
            </button>

            <div className="relative">
              <button
                onClick={() => setIsNavDropdownOpen(!isNavDropdownOpen)}
                className="flex items-center gap-2 px-4 h-[40px] hover:bg-[#FF8533] rounded-full transition-all duration-300 text-white bg-[#FF6B00] border border-[#FF5500] shadow-[0_0_15px_rgba(255,107,0,0.3)] text-[14px] font-bold max-w-[220px] active:scale-95"
              >
                <span className="truncate uppercase tracking-wider">{activeChatTitle}</span>
                <ChevronRight className={cn("w-4 h-4 text-white transition-transform ml-0.5", isNavDropdownOpen && "rotate-90")} />
              </button>

              {isNavDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-[280px] bg-white border border-[#e5e5e5] rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-2 space-y-1">
                    <button
                      onClick={handleNewChat}
                      className="flex items-center justify-between w-full px-3 h-[44px] bg-white border border-[#e5e5e5] rounded-xl hover:bg-[#fcfcfc] transition-colors mb-2"
                    >
                      <div className="flex items-center gap-2 text-[14px] font-semibold text-[#000000]">
                        <Plus className="w-5 h-5" strokeWidth={2} />
                        New Chat
                      </div>
                    </button>

                    <div className="pt-2">
                      <div className="px-3 py-1 text-[11px] font-semibold text-[#999999] uppercase tracking-wider flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        Chat History
                      </div>
                      <div className="max-h-[300px] overflow-y-auto pt-1">
                        {chats.map(chat => (
                          <button
                            key={chat.id}
                            onClick={() => handleSelectChat(chat.id)}
                            className={cn(
                              "w-full flex items-center px-3 h-[38px] rounded-lg text-left text-[14px] transition-colors truncate",
                              chat.id === currentChatId ? "bg-[#f0f0f0] font-medium" : "text-[#666666] hover:bg-[#f5f5f5]"
                            )}
                          >
                            <span className="truncate">{chat.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!isChatting ? (
          <div className="w-full h-full flex flex-col items-center overflow-y-auto">
            <div className="w-full max-w-[800px] flex flex-col items-center">
              <HeroSearch onSendMessage={handleSendMessage} selectedModel={activeModel} />
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full">
            <ChatView
              messages={messages}
              onSendMessage={handleSendMessage}
              onRegenerate={handleRegenerate}
              selectedModel={activeModel}
              isLoading={isLoading}
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen(true)}
              chatTitle={activeChatTitle}
              artifact={artifact}
              setArtifact={setArtifact}
            />
          </div>
        )}
      </main>
    </div>
  );
}
