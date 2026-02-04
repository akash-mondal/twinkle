"use client";
import React from 'react';
import { FileText, ArrowRight } from 'lucide-react';

export default function DocsAI() {
  return (
    <div>
      <h1 className="text-4xl font-serif italic mb-6 flex items-center gap-3 text-black">
        <FileText className="w-8 h-8 text-[#E78B1F]" />
        For AI Agents
      </h1>
      
      <p className="text-lg text-zinc-600 mb-12">
        We provide a standardized context file for LLMs to autonomously learn the Twinkle Protocol.
      </p>

      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-8 max-w-2xl">
         <h3 className="text-xl font-bold text-black mb-4">llms.txt</h3>
         <p className="text-zinc-600 mb-6 leading-relaxed">
           This file contains the complete Technical Specification, Type Definitions, and Implementation Patterns in a format optimized for RAG and Context Windows.
         </p>
         
         <a 
           href="/llms.txt" 
           target="_blank"
           className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-zinc-800 transition-colors"
         >
           Open llms.txt
           <ArrowRight className="w-4 h-4" />
         </a>
      </div>
    </div>
  );
}
