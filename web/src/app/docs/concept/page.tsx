"use client";
import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Zap, Terminal as TerminalIcon } from 'lucide-react';

const steps = [
  {
    id: 'challenge',
    title: '1. The Challenge',
    desc: 'Client requests resource. Server forces payment.',
  },
  {
    id: 'signature',
    title: '2. The Signature',
    desc: 'SDK intercepts error & signs Permit2 intent.',
  },
  {
    id: 'settlement',
    title: '3. The Settlement',
    desc: 'Server verifies signature & releases data.',
  }
];

export default function DocsConcept() {
  const [activeStep, setActiveStep] = useState(0);
  const [lines, setLines] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalBodyRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [lines]);

  useGSAP(() => {
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 3 });
    
    // Clear & Start
    tl.call(() => {
      setLines([]);
      setActiveStep(0);
    });

    // === STEP 1: CHALLENGE ===
    // Typing the command
    tl.to({}, { duration: 0.5 });
    tl.call(() => addLine({ type: 'command', text: 'curl -X GET https://api.twinkle.com/v1/premium' }));
    
    tl.to({}, { duration: 0.8 });
    tl.call(() => addLine({ type: 'info', text: 'Establishing secure handshake...' }));
    
    tl.to({}, { duration: 0.6 });
    tl.call(() => addLine({ type: 'error', text: 'HTTP/1.1 402 PAYMENT REQUIRED' }));
    tl.call(() => addLine({ type: 'ascii', text: 'ACCESS DENIED', color: 'text-red-500' }));
    tl.call(() => addLine({ type: 'json', text: '{ error: "Insufficient Payment", price: "10 MNEE" }' }));

    tl.to({}, { duration: 2.5 });

    // === STEP 2: SIGNATURE ===
    tl.call(() => setActiveStep(1));
    tl.call(() => addLine({ type: 'system', text: '[TWINKLE_SDK] INTERCEPTING ERROR STREAM' }));
    
    tl.to({}, { duration: 0.5 });
    tl.call(() => addLine({ type: 'info', text: 'Constructing Permit2 Intent...' }));
    tl.call(() => addLine({ type: 'progress', label: 'SIGNING' })); // Triggers progress bar

    tl.to({}, { duration: 1.5 }); // Wait for progress bar
    tl.call(() => addLine({ type: 'success', text: '>> SIGNATURE DETECTED: 0x7f8...9b2d' }));

    tl.to({}, { duration: 2 });

    // === STEP 3: SETTLEMENT ===
    tl.call(() => setActiveStep(2));
    tl.call(() => addLine({ type: 'command', text: 'Replaying request with [Twinkle-Auth] header...' }));
    
    tl.to({}, { duration: 1 });
    tl.call(() => addLine({ type: 'success', text: 'HTTP/1.1 200 OK' }));
    tl.call(() => addLine({ type: 'ascii', text: 'AUTHORIZED', color: 'text-green-400' }));
    tl.call(() => addLine({ type: 'json', text: '{ data: "UNLOCKED_PREMIUM_CONTENT", status: "SETTLED" }', color: 'text-green-300' }));

    tl.to({}, { duration: 3 });

  }, { scope: containerRef });

  const addLine = (line: any) => {
    setLines(prev => [...prev, { ...line, id: Math.random() }]);
  };

  return (
    <div ref={containerRef}>
      <h1 className="text-4xl font-serif italic mb-8 flex items-center gap-3 text-black">
        <Zap className="w-8 h-8 text-[#E78B1F]" />
        The 402 Flow
      </h1>
      <p className="text-lg text-zinc-600 mb-16 max-w-2xl">
        Twinkle automates the negotiation. One continuous flow from <strong>Challenge</strong> to <strong>Settlement</strong>.
      </p>

      <div className="grid md:grid-cols-2 gap-16 items-start">
        
        {/* === LEFT: PHASE SLIDER === */}
        {/* Reverted to the "border-l-4" design requested by user */}
        <div className="space-y-12 pt-8">
           {steps.map((step, index) => (
              <div key={step.id} className={`transition-all duration-500 border-l-4 pl-6 ${index === activeStep ? 'border-[#E78B1F] opacity-100 translate-x-2' : 'border-zinc-200 opacity-40'}`}>
                   <h3 className={`text-xl font-bold mb-2 ${index === activeStep ? 'text-[#E78B1F]' : 'text-zinc-500'}`}>
                     {step.title}
                   </h3>
                   <p className="text-zinc-600 leading-relaxed text-sm">
                     {step.desc}
                   </p>
              </div>
           ))}
        </div>

        {/* === RIGHT: TERMINAL === */}
        <div className="sticky top-40">
           <div className="bg-[#050505] rounded-xl overflow-hidden shadow-2xl border border-zinc-800 ring-4 ring-black/10 font-mono text-sm h-[400px] flex flex-col relative group transform transition-transform hover:scale-[1.01]">
              
              {/* Scanline & CRT Effects */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 bg-[length:100%_4px,3px_100%] pointer-events-none opacity-40"></div>
              <div className="absolute inset-0 radial-gradient pointer-events-none z-30 opacity-30 box-shadow-[inset_0_0_5rem_rgba(0,0,0,0.75)]"></div>
              
              {/* Header */}
              <div className="bg-[#111] px-4 py-2 flex items-center justify-between border-b border-zinc-800 z-30">
                 <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                 </div>
                 <div className="text-zinc-600 text-[10px] uppercase tracking-widest flex items-center gap-2">
                   <TerminalIcon className="w-3 h-3" />
                   SECURE_SHELL_V2
                 </div>
                 <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${activeStep === 0 ? 'bg-red-500 animate-pulse' : 'bg-zinc-700'}`}></div>
                    <div className={`w-2 h-2 rounded-full ${activeStep === 1 ? 'bg-yellow-500 animate-pulse' : 'bg-zinc-700'}`}></div>
                    <div className={`w-2 h-2 rounded-full ${activeStep === 2 ? 'bg-green-500 animate-pulse' : 'bg-zinc-700'}`}></div>
                 </div>
              </div>

              {/* Terminal Content */}
              <div ref={terminalBodyRef} className="p-6 flex-grow overflow-y-auto z-10 relative scrollbar-hide text-xs sm:text-sm">
                  {lines.map((line) => (
                      <TerminalLine key={line.id} data={line} />
                  ))}
                  
                  {/* Active Prompt */}
                  <div className="flex items-center gap-2 text-[#E78B1F] mt-2 animate-pulse">
                     <span>root@agent:~$</span>
                     <span className="w-2 h-4 bg-[#E78B1F]"></span>
                  </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}

function TerminalLine({ data }: { data: any }) {
    if (data.type === 'command') return <div className="text-white font-bold mt-4 mb-2">$ {data.text}</div>;
    if (data.type === 'error') return <div className="text-red-500 font-bold bg-red-900/10 p-1 border-l-2 border-red-500 pl-2">{data.text}</div>;
    if (data.type === 'system') return <div className="text-cyan-400 mt-4 mb-1 tracking-wider border-b border-cyan-900/50 pb-1">{data.text}</div>;
    if (data.type === 'info') return <div className="text-zinc-500 italic">{data.text}</div>;
    if (data.type === 'success') return <div className="text-green-400 font-bold">{data.text}</div>;
    if (data.type === 'json') return <div className={`font-mono pl-4 opacity-80 ${data.color || 'text-zinc-400'}`}>{data.text}</div>;
    
    // ASCII ART
    if (data.type === 'ascii') return (
        <pre className={`text-[10px] leading-3 font-black my-2 tracking-tighter ${data.color}`}>
            {data.text === 'ACCESS DENIED' && `
  ▄▄▄       ▄▄▄▄▄▄▄ ▄▄▄▄▄▄▄ ▄▄▄▄▄▄▄ ▄▄▄▄▄▄ ▄▄▄▄▄▄▄
 █   █     █       █       █       █      █       █
 █   █     █   ▄   █    ▄  █    ▄  █  ▄   █  ▄▄▄▄▄█
 █   █     █  █ █  █   █▄█ █   █▄█ █ █▄█  █ █▄▄▄▄▄
 █   █▄▄▄  █  █▄█  █    ▄▄▄█    ▄▄▄█      █▄▄▄▄▄  █
 █       █ █       █   █▄▄▄█   █▄▄▄█  ▄   █▄▄▄▄▄█ █
 █▄▄▄▄▄▄▄█ █▄▄▄▄▄▄▄█▄▄▄▄▄▄▄█▄▄▄▄▄▄▄█▄▄█ ▄▄█▄▄▄▄▄▄▄█`}
            {data.text === 'AUTHORIZED' && `
  ▄▄▄▄▄▄▄ ▄▄▄   ▄ ▀▄ ▄▀ ▄▄▄▄▄▄▄ ▄▄▄▄▄▄▄ ▄▄▄▄▄▄▄ 
 █       █   █ █ █  █  █       █       █       █
 █   ▄   █   █▄█ █     █    ▄  █    ▄  █  ▄▄▄▄▄█
 █  █▄█  █      ▄█     █   █▄█ █   █▄█ █ █▄▄▄▄▄ 
 █       █     █▄█     █    ▄▄▄█    ▄▄▄█      █ 
 █   ▄   █    ▄  █     █   █   █   █   █  ▄▄▄▄▄█
 █▄▄█ █▄▄█▄▄▄█ █▄█     █▄▄▄█   █▄▄▄█   █▄▄▄▄▄▄▄█`}
        </pre>
    );

    // Progress Bar
    if (data.type === 'progress') return (
        <div className="my-2">
            <div className="text-yellow-500 text-xs mb-1 flex justify-between">
                <span>{data.label}</span>
                <span className="animate-pulse">100%</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded overflow-hidden">
                <div className="h-full bg-yellow-500 animate-[progress_1s_ease-in-out_forwards] w-full origin-left scale-x-0"></div>
            </div>
        </div>
    );

    return <div className="text-zinc-500">{data.text}</div>;
}
