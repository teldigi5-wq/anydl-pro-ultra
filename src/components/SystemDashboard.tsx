import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, HardDrive, Wifi, Thermometer, Activity } from 'lucide-react';
import { SystemStats } from '../types';

interface SystemDashboardProps {
  stats: SystemStats;
}

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  percent: number;
  color: string;
  delay: number;
}> = ({ icon, label, value, subValue, percent, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="relative rounded-2xl bg-slate-900/70 border border-slate-800/80 p-4 overflow-hidden group hover:border-slate-700 transition-all"
  >
    <div className={`absolute bottom-0 left-0 h-0.5 ${color}`} style={{ width: `${percent}%`, transition: 'width 1s ease' }} />
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-bold">{label}</p>
        <p className="text-xl font-black text-white font-mono">{value}</p>
        {subValue && <p className="text-[10px] text-slate-400 font-mono">{subValue}</p>}
      </div>
      <div className={`p-2.5 rounded-xl ${color.replace('bg-', 'bg-opacity-20 bg-')} border border-slate-800`}>
        {icon}
      </div>
    </div>
    <div className="mt-3 w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />
    </div>
  </motion.div>
);

export const SystemDashboard: React.FC<SystemDashboardProps> = ({ stats }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8"
    >
      <StatCard
        icon={<Cpu className="w-4 h-4 text-cyan-400" />}
        label="CPU Load"
        value={`${stats.cpuUsage}%`}
        subValue={`${stats.activeConnections} active threads`}
        percent={stats.cpuUsage}
        color="bg-cyan-500"
        delay={0}
      />
      <StatCard
        icon={<HardDrive className="w-4 h-4 text-purple-400" />}
        label="RAM Usage"
        value={`${stats.ramUsage}%`}
        subValue={stats.ramUsedGB && stats.ramTotalGB ? `${stats.ramUsedGB} GB / ${stats.ramTotalGB} GB` : '—'}
        percent={stats.ramUsage}
        color="bg-purple-500"
        delay={0.1}
      />
      <StatCard
        icon={<Wifi className="w-4 h-4 text-emerald-400" />}
        label="Network Speed"
        value={`${stats.networkSpeed} MB/s`}
        subValue={`Peak: ${(stats.networkSpeed * 1.4).toFixed(1)} MB/s`}
        percent={Math.min(100, stats.networkSpeed * 2)}
        color="bg-emerald-500"
        delay={0.2}
      />
      <StatCard
        icon={<Activity className="w-4 h-4 text-blue-400" />}
        label="Active Connections"
        value={`${stats.activeConnections}`}
        subValue="Concurrent fragment downloads"
        percent={Math.min(100, stats.activeConnections * 10)}
        color="bg-blue-500"
        delay={0.3}
      />
      <StatCard
        icon={<Thermometer className="w-4 h-4 text-orange-400" />}
        label="System Temp"
        value={`${stats.temperature}°C`}
        subValue={`${stats.diskSpaceGB} GB disk free`}
        percent={Math.min(100, stats.temperature * 2)}
        color="bg-orange-500"
        delay={0.4}
      />
    </motion.div>
  );
};
