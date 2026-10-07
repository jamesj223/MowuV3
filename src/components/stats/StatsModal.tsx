import React, { useState } from 'react';
import { useDeckStore } from '@/store/useDeckStore';
import { useGameStore } from '@/store/useGameStore';
import { COMMANDER_BRACKETS } from '@/types/game';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  X,
  BarChart3,
  Download,
  Upload,
  Trash2,
} from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  const { matches, exportData, importData, clearHistory, deleteMatch } = useDeckStore();
  const { turnSnapshots, currentDeckName } = useGameStore();

  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'decks'>('current');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  // Compute deck benchmarks
  const deckStats: Record<
    string,
    { count: number; fastest: number; avgTurns: number; avgDamage: number }
  > = {};

  matches.forEach((m) => {
    const name = m.deckName || 'Unnamed Deck';
    if (!deckStats[name]) {
      deckStats[name] = { count: 0, fastest: Infinity, avgTurns: 0, avgDamage: 0 };
    }
    deckStats[name].count += 1;
    deckStats[name].fastest = Math.min(deckStats[name].fastest, m.turns);
    deckStats[name].avgTurns += m.turns;
    deckStats[name].avgDamage += m.damageDealt;
  });

  Object.values(deckStats).forEach((s) => {
    s.avgTurns = Math.round((s.avgTurns / s.count) * 10) / 10;
    s.avgDamage = Math.round(s.avgDamage / s.count);
    if (s.fastest === Infinity) s.fastest = 0;
  });

  const handleExport = () => {
    const dataStr = exportData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mowu-v3-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importData(content);
      setImportStatus(success ? 'Data restored successfully!' : 'Invalid backup JSON file.');
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-4xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-950/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Analytics & Performance</h2>
              <p className="text-xs text-neutral-400">Track goldfishing curves and deck benchmarks</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="flex rounded-lg bg-neutral-800 p-1 border border-neutral-700">
              <button
                onClick={() => setActiveTab('current')}
                className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'current'
                    ? 'bg-neutral-700 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Current Game
              </button>
              <button
                onClick={() => setActiveTab('decks')}
                className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'decks'
                    ? 'bg-neutral-700 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Deck Benchmarks
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'bg-neutral-700 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Match Log ({matches.length})
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'current' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-neutral-200 mb-1">
                  Opponent Life Total Progression
                </h3>
                <p className="text-xs text-neutral-500 mb-4">
                  Turn-by-turn opponent life curve ({currentDeckName || 'Current Deck'})
                </p>

                <div className="h-64 w-full bg-neutral-950/60 rounded-xl p-3 border border-neutral-800">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={turnSnapshots}>
                      <defs>
                        <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis
                        dataKey="turn"
                        stroke="#737373"
                        tickFormatter={(val) => `T${val}`}
                      />
                      <YAxis stroke="#737373" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#171717',
                          border: '1px solid #404040',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="opponentHealth"
                        name="Opponent Life"
                        stroke="#f43f5e"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#healthGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-neutral-200 mb-1">
                  Damage Burst Per Turn
                </h3>
                <div className="h-48 w-full bg-neutral-950/60 rounded-xl p-3 border border-neutral-800">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={turnSnapshots}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis
                        dataKey="turn"
                        stroke="#737373"
                        tickFormatter={(val) => `T${val}`}
                      />
                      <YAxis stroke="#737373" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#171717',
                          border: '1px solid #404040',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                      />
                      <Bar
                        dataKey="damageThisTurn"
                        name="Damage This Turn"
                        fill="#38bdf8"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'decks' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-neutral-200 mb-3">
                Deck Performance Benchmarks
              </h3>

              {Object.keys(deckStats).length === 0 ? (
                <div className="text-center py-12 text-neutral-500 text-sm">
                  No completed matches recorded yet. Finish a goldfish game to view benchmarks!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(deckStats).map(([deck, stats]) => (
                    <div
                      key={deck}
                      className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 flex flex-col justify-between"
                    >
                      <div>
                        <h4 className="font-bold text-white text-base">{deck}</h4>
                        <p className="text-xs text-neutral-500">{stats.count} games recorded</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-neutral-800 text-center">
                        <div>
                          <span className="text-[10px] text-neutral-500 uppercase font-mono">
                            Fastest Win
                          </span>
                          <p className="text-lg font-mono font-bold text-emerald-400">
                            T{stats.fastest}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-500 uppercase font-mono">
                            Avg Turns
                          </span>
                          <p className="text-lg font-mono font-bold text-amber-400">
                            {stats.avgTurns}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-500 uppercase font-mono">
                            Avg Dmg
                          </span>
                          <p className="text-lg font-mono font-bold text-sky-400">
                            {stats.avgDamage}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-200">Recent Completed Games</h3>
                {matches.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All History</span>
                  </button>
                )}
              </div>

              {matches.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 text-sm">
                  No matches in log.
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {matches.map((m) => {
                    const bracketTag = COMMANDER_BRACKETS[m.bracket]?.tag || m.bracket;
                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/60 border border-neutral-800"
                      >
                        <div>
                          <p className="font-semibold text-white text-sm">
                            {m.deckName || 'Unnamed Deck'}
                          </p>
                          <p className="text-xs text-neutral-500 flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-sky-400 font-semibold">{bracketTag}</span>
                            <span>•</span>
                            <span>{new Date(m.timestamp).toLocaleDateString()}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-mono font-bold text-emerald-400">
                              Won in {m.turns} turns
                            </p>
                            <p className="text-xs text-neutral-400">
                              {m.damageDealt} total damage dealt
                            </p>
                          </div>

                          <button
                            onClick={() => deleteMatch(m.id)}
                            className="p-1 rounded text-neutral-600 hover:text-rose-400 transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer: Backup & Import */}
        <div className="flex items-center justify-between p-4 border-t border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="text-xs px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Backup JSON</span>
            </button>

            <label className="text-xs px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>

            {importStatus && (
              <span className="text-xs text-amber-400 font-medium ml-2">
                {importStatus}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-xs px-4 py-1.5 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
