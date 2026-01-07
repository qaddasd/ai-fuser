"use client";

import React from "react";
import Image from "next/image";
import ChatInput from "./ChatInput";
import {
  Sparkles,
  Globe,
  Smartphone,
  BarChart2,
  PenTool,
  ChevronDown,
  Music,
  Zap
} from "lucide-react";

interface HeroSearchProps {
  onSendMessage: (message: string, model?: string) => void;
  selectedModel?: string;
}

const HeroSearch = ({ onSendMessage, selectedModel }: HeroSearchProps) => {
  return (
    <section className="flex flex-col items-center justify-center w-full min-h-screen px-4 relative overflow-hidden bg-background">
      <div className="w-full max-w-[800px] flex flex-col items-center z-10">
        <div className="mb-12 text-center">
          <h1 className="text-[clamp(4rem,15vw,10rem)] font-display text-[#FF6B00] leading-[0.8] tracking-tight mb-4 uppercase drop-shadow-[0_0_20px_rgba(255,107,0,0.2)]">
            fuser
          </h1>
        </div>

        <div className="w-full max-w-[760px]">
          <ChatInput onSendMessage={onSendMessage} selectedModel={selectedModel} />
        </div>
      </div>
    </section>
  );

};

export default HeroSearch;
