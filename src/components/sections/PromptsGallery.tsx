"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";

interface TabItem {
  id: string;
  label: string;
  icon: string;
}

interface CaseItem {
  id: number;
  title: string;
  imageUrl: string;
  link: string;
  tag?: {
    label: string;
    icon: string;
  };
}

const TABS: TabItem[] = [
  {
    id: "inspiration",
    label: "Inspiration",
    icon: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/dffea3a4-7980-439b-898d-7def93812952-kimi-com/assets/svgs/CollectLight-1.svg",
  },
  {
    id: "web-app",
    label: "Web App",
    icon: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/dffea3a4-7980-439b-898d-7def93812952-kimi-com/assets/svgs/KoderLight-2.svg",
  },
  {
    id: "data-visualization",
    label: "Data visualization",
    icon: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/dffea3a4-7980-439b-898d-7def93812952-kimi-com/assets/svgs/HistogramLight-4.svg",
  },
  {
    id: "creativity",
    label: "Creativity",
    icon: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/dffea3a4-7980-439b-898d-7def93812952-kimi-com/assets/svgs/MagicLight-5.svg",
  },
];

const CASES: CaseItem[] = [
  {
    id: 1,
    title: "AI-Powered Research Agent",
    imageUrl:
      "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/dffea3a4-7980-439b-898d-7def93812952-kimi-com/assets/images/images_2.png",
    link: "#",
  },
  {
    id: 2,
    title: "Dynamic Data Visualizer",
    imageUrl:
      "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/dffea3a4-7980-439b-898d-7def93812952-kimi-com/assets/images/images_3.png",
    link: "#",
  },
  {
    id: 3,
    title: "Smart Image Generation",
    imageUrl:
      "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/dffea3a4-7980-439b-898d-7def93812952-kimi-com/assets/images/images_4.png",
    link: "#",
    tag: {
      label: "Creativity",
      icon: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/dffea3a4-7980-439b-898d-7def93812952-kimi-com/assets/svgs/MagicLight-5.svg",
    },
  },
];

export default function PromptsGallery() {
  const [activeTab, setActiveTab] = useState("inspiration");

  return (
    <section className="mt-[40px] mb-[60px] w-full max-w-[800px] mx-auto px-4 overflow-hidden">
      <div className="ok-computer-prompt-container">
        <div className="ok-computer-prompt">
          {}
          <div className="tab-line flex items-center justify-center gap-2 mb-[24px] flex-wrap">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-pill flex items-center gap-1.5 transition-all duration-200 cursor-pointer outline-none
                  ${
                    activeTab === tab.id
                      ? "bg-[#f0f0f0] text-[#000000]"
                      : "bg-transparent text-[#666666] hover:bg-[#f7f7f7]"
                  }`}
              >
                <span className="tab-icon w-4 h-4 flex items-center justify-center">
                  <Image
                    src={tab.icon}
                    alt={tab.label}
                    width={16}
                    height={16}
                    className="opacity-80"
                  />
                </span>
                <span className="tab-label whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>

          {}
          <div className="show-case-container">
            <div className="show-case grid grid-cols-1 md:grid-cols-3 gap-[16px]">
              {CASES.map((item) => (
                <a
                  key={item.id}
                  href={item.link}
                  className="show-case-card group block relative bg-white border border-[#e5e5e5] rounded-[12px] overflow-hidden transition-all duration-200 hover:shadow-md"
                >
                  {}
                  {item.tag && (
                    <span className="absolute top-[12px] right-[12px] z-10 inline-flex items-center gap-1 px-2 py-1 rounded-[16px] bg-[rgba(0,0,0,0.5)] text-white text-[11px] font-medium backdrop-blur-sm">
                      <Image
                        src={item.tag.icon}
                        alt=""
                        width={12}
                        height={12}
                        className="invert brightness-0"
                      />
                      {item.tag.label}
                    </span>
                  )}

                  {}
                  <span className="image-wrapper block relative aspect-[4/3] bg-[#f7f7f7] overflow-hidden">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="image-main object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 260px"
                    />
                  </span>

                  {}
                  <div className="show-case-card-title p-[12px]">
                    <p className="text-[14px] text-[#000000] font-medium line-clamp-2 leading-[1.4]">
                      {item.title}
                    </p>
                  </div>
                </a>
              ))}
            </div>

            {}
            <div className="home-gallery-trigger mt-[32px] flex items-center justify-center gap-1.5 text-[14px] text-[#666666] font-medium cursor-pointer hover:text-[#000000] transition-colors duration-200">
              More cases
              <ChevronDown className="w-4 h-4 mt-0.5" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}