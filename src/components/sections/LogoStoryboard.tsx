"use client";

import React from "react";
import { X, ArrowRight } from "lucide-react";
import Image from "next/image";

interface LogoStoryboardProps {
  onClose: () => void;
}

const LogoStoryboard = ({ onClose }: LogoStoryboardProps) => {
  const steps = [
      {
        title: "Initial Sketch",
        description: "Capturing the raw energy and movement. Focused on the dynamic curve and the essence of flight.",
        image: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/dffea3a4-7980-439b-898d-7def93812952-kimi-com/assets/images/kimi-logo-CegIMkbU-5.png",
        style: "grayscale contrast-125 opacity-40 blur-[0.5px]"
      },
      {
        title: "Geometric Refinement",
        description: "Applying golden ratio principles. Defining the sharp edges and balanced proportions.",
        image: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/dffea3a4-7980-439b-898d-7def93812952-kimi-com/assets/images/kimi-logo-CegIMkbU-5.png",
        style: "sepia contrast-150 brightness-75"
      },
      {
        title: "Final Mark",
        description: "The completed Fuser symbol. A perfect fusion of modern aesthetics and timeless design.",
        image: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/dffea3a4-7980-439b-898d-7def93812952-kimi-com/assets/images/kimi-logo-CegIMkbU-5.png",
        style: "drop-shadow-[0_0_15px_rgba(79,172,254,0.4)]"
      }

  ];

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white overflow-y-auto font-sans">
      <div className="max-w-[1200px] mx-auto px-6 py-20 relative">
        <button
          onClick={onClose}
          className="fixed top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-md border border-white/10 group"
        >
          <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
        </button>

        <div className="flex flex-col items-center mb-24">
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
            Evolution of a Mark
          </h2>
          <p className="text-[#888888] text-lg md:text-xl max-w-[600px] text-center leading-relaxed font-light">
            From the first pencil stroke to the final digital signature. A journey through form, balance, and precision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {steps.map((step, idx) => (
              <div key={idx} className="group relative">
                <div className="aspect-square w-full bg-[#111111] border border-white/5 rounded-3xl flex items-center justify-center mb-8 relative overflow-hidden group-hover:border-white/20 transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className={`relative w-40 h-40 transition-all duration-700 group-hover:scale-110 ${step.style}`}>
                    <Image
                      src={step.image}
                      alt={step.title}
                      fill
                      className="object-contain"
                    />
                  </div>

                  <div className="absolute bottom-6 left-6 flex items-center gap-2">
                    <span className="w-8 h-[1px] bg-white/20" />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Step 0{idx + 1}</span>
                  </div>
                </div>

                <h3 className="text-2xl font-semibold mb-4 group-hover:text-accent transition-colors">
                  {step.title}
                </h3>
                <p className="text-[#666666] leading-relaxed font-light group-hover:text-[#999999] transition-colors">
                  {step.description}
                </p>

                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="w-6 h-6 text-white/10" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-40 pt-20 border-t border-white/5 flex flex-col items-center">
            <div className="w-full max-w-[800px] aspect-[16/9] bg-[#050505] rounded-[40px] border border-white/5 flex items-center justify-center relative group overflow-hidden">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

               <div className="relative flex flex-col items-center gap-12">
                  <div className="w-32 h-32 relative">
                    <Image
                      src={steps[2].image}
                      alt="Final Logo"
                      fill
                      className="object-contain drop-shadow-[0_0_30px_rgba(255,136,68,0.3)]"
                    />
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <span className="text-white font-bold text-3xl tracking-tight">Fuser Assistant</span>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] uppercase tracking-widest font-bold text-white/60">Final Concept</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] uppercase tracking-widest font-bold text-white/60">2025 Release</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>

      </div>
    </div>
  );
};

export default LogoStoryboard;
