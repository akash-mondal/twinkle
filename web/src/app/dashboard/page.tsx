"use client";
import { Navbar } from "@/components/Navbar";
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Activity, DollarSign, ExternalLink, ShieldCheck } from 'lucide-react';

const stats = [
  { label: 'Total Revenue', value: '1,242.50 MNEE', change: '+12.4%', icon: DollarSign },
  { label: 'Active Agents', value: '42', change: '+5', icon: Activity },
  { label: 'Conversion Rate', value: '94.2%', change: '+2.1%', icon: TrendingUp },
];

const txs = [
  { id: '0x3e8...a9b7', agent: 'Agent_042', amount: '50.00 MNEE', fee: '2.50 MNEE', status: 'Settled' },
  { id: '0x7b2...f1e4', agent: 'TradingBot_X', amount: '120.00 MNEE', fee: '6.00 MNEE', status: 'Relaying' },
  { id: '0x9a1...c0d2', agent: 'Agent_042', amount: '15.00 MNEE', fee: '0.75 MNEE', status: 'Settled' },
];

export default function Dashboard() {
  return (
    <main className="min-h-screen pt-24 bg-[#0A0A0A]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-8 py-12">
        <header className="flex justify-between items-end mb-12">
          <div>
            <div className="badge mb-4">Developer Dashboard</div>
            <h1 className="text-5xl font-normal text-white serif italic italic">Growth Metrics.</h1>
          </div>
          <div className="flex space-x-3">
            <button className="btn-secondary text-[10px] tracking-widest uppercase py-2.5">Download Reports</button>
            <button className="btn-primary text-[10px] tracking-widest uppercase py-2.5">Withdraw Fees</button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass p-8 rounded-2xl"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="bg-white/5 p-2 rounded-lg text-zinc-400">
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded tracking-tight">
                  {stat.change}
                </span>
              </div>
              <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2 font-bold">{stat.label}</div>
              <div className="text-3xl font-bold tracking-tighter text-white">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Transactions Table */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="p-8 border-b border-white/5 flex justify-between items-center">
            <h3 className="font-medium text-white tracking-tight">Recent Relays</h3>
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Live Feed</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold border-b border-white/5">
                  <th className="px-8 py-6">Transaction ID</th>
                  <th className="px-8 py-6">Origin Agent</th>
                  <th className="px-8 py-6">Settlement</th>
                  <th className="px-8 py-6 text-amber-500">Your Fee (5%)</th>
                  <th className="px-8 py-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {txs.map((tx, idx) => (
                  <tr key={idx} className="group hover:bg-white/[0.01] transition-colors">
                    <td className="px-8 py-6 font-mono text-xs text-zinc-400 flex items-center space-x-2">
                       <span>{tx.id}</span>
                       <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </td>
                    <td className="px-8 py-6 text-sm text-white font-medium">{tx.agent}</td>
                    <td className="px-8 py-6 text-sm text-zinc-400">{tx.amount}</td>
                    <td className="px-8 py-6 text-sm font-bold text-amber-500">{tx.fee}</td>
                    <td className="px-8 py-6">
                       <span className="inline-flex items-center space-x-1.5 text-[10px] uppercase font-bold text-green-500 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                          <ShieldCheck className="w-3 h-3" />
                          <span>{tx.status}</span>
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Glow Accent */}
        <div className="fixed -bottom-40 -left-40 w-[600px] h-[600px] bg-amber-500/5 blur-[120px] -z-10 rounded-full" />
      </div>
    </main>
  );
}
