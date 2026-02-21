/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Settings, RotateCcw, Plus, X, Cpu, MemoryStick, Keyboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Session, SettingsConfig, DirNode } from './types';
import { initialFS } from './utils/fs';
import { executeCommand } from './utils/commands';
import { TerminalView } from './components/TerminalView';

const generateId = () => Math.random().toString(36).substring(2, 9);

const defaultSettings: SettingsConfig = {
  fontSize: 14,
  fontFamily: '"JetBrains Mono", monospace',
  theme: 'dark',
};

const createNewSession = (id: string, name: string): Session => ({
  id,
  name,
  lines: [{ id: generateId(), type: 'system', text: 'Sandbox OS v1.0.0\nTemporary isolated environment initialized.\nType "help" for available commands.' }],
  history: [],
  currentPath: '/home/sandbox',
});

export default function App() {
  const [sessions, setSessions] = useState<Session[]>([createNewSession('1', 'bash')]);
  const [activeSessionId, setActiveSessionId] = useState('1');
  const [fileSystem, setFileSystem] = useState<DirNode>(initialFS);
  const [settings, setSettings] = useState<SettingsConfig>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  
  const [cpu, setCpu] = useState(0);
  const [ram, setRam] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpu(Math.floor(Math.random() * 15) + 1);
      setRam(Math.floor(Math.random() * 50) + 150);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  const handleCommand = (cmdStr: string) => {
    if (!cmdStr.trim()) {
      addLines([{ id: generateId(), type: 'input', text: '' }]);
      return;
    }

    const inputLine = { id: generateId(), type: 'input' as const, text: cmdStr };
    
    const result = executeCommand(cmdStr, activeSession.currentPath, fileSystem);
    
    let newLines = [...activeSession.lines, inputLine];
    
    if (result.clear) {
      newLines = [];
    } else {
      if (result.output) {
        newLines.push({ id: generateId(), type: 'output', text: result.output });
      }
      if (result.error) {
        newLines.push({ id: generateId(), type: 'error', text: result.error });
      }
    }

    if (result.newFs) {
      setFileSystem(result.newFs);
    }

    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          lines: newLines,
          history: [...s.history, cmdStr],
          currentPath: result.newPath || s.currentPath,
        };
      }
      return s;
    }));
  };

  const addLines = (lines: any[]) => {
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, lines: [...s.lines, ...lines] };
      }
      return s;
    }));
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the sandbox? All files and sessions will be lost.')) {
      setFileSystem(initialFS);
      const newId = generateId();
      setSessions([createNewSession(newId, 'bash')]);
      setActiveSessionId(newId);
    }
  };

  const handleNewSession = () => {
    const newId = generateId();
    setSessions([...sessions, createNewSession(newId, `bash-${sessions.length + 1}`)]);
    setActiveSessionId(newId);
  };

  const handleCloseSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (sessions.length === 1) return;
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (activeSessionId === id) {
      setActiveSessionId(newSessions[newSessions.length - 1].id);
    }
  };

  const handleAccessoryKey = (key: string) => {
    if (!inputRef.current) return;
    
    if (key === 'Tab') {
      inputRef.current.value += '  ';
    } else if (key === 'Ctrl+C') {
      handleCommand('^C');
    } else if (key === 'Esc') {
      inputRef.current.value = '';
    } else if (key === 'Up') {
      inputRef.current.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    } else if (key === 'Down') {
      inputRef.current.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    }
    inputRef.current.focus();
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden font-sans">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <TerminalIcon className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="font-semibold text-sm leading-tight">Sandbox VM</h1>
            <div className="flex items-center gap-3 text-[10px] text-zinc-400">
              <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> {cpu}%</span>
              <span className="flex items-center gap-1"><MemoryStick className="w-3 h-3" /> {ram}MB</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors" title="Reset Sandbox">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button onClick={() => setShowSettings(true)} className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center bg-zinc-900 border-b border-zinc-800 overflow-x-auto no-scrollbar">
        {sessions.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSessionId(s.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm border-r border-zinc-800 min-w-fit transition-colors ${
              activeSessionId === s.id ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:bg-zinc-800/50'
            }`}
          >
            <span className="truncate">{s.name}</span>
            {sessions.length > 1 && (
              <X 
                className="w-3 h-3 hover:text-red-400 rounded-full" 
                onClick={(e) => handleCloseSession(e, s.id)} 
              />
            )}
          </button>
        ))}
        <button onClick={handleNewSession} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Terminal Area */}
      <TerminalView 
        session={activeSession} 
        onCommand={handleCommand} 
        settings={settings} 
        inputRef={inputRef}
      />

      {/* Mobile Accessory Bar */}
      <div className="flex items-center bg-zinc-900 border-t border-zinc-800 p-2 gap-2 overflow-x-auto no-scrollbar">
        <Keyboard className="w-4 h-4 text-zinc-500 shrink-0 mx-1" />
        {['Tab', 'Ctrl+C', 'Esc', 'Up', 'Down'].map(key => (
          <button
            key={key}
            onClick={() => handleAccessoryKey(key)}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded text-xs font-medium text-zinc-300 shrink-0 transition-colors"
          >
            {key === 'Up' ? '↑' : key === 'Down' ? '↓' : key}
          </button>
        ))}
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Terminal Settings</h2>
                <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Font Size ({settings.fontSize}px)</label>
                  <input 
                    type="range" 
                    min="10" max="24" 
                    value={settings.fontSize}
                    onChange={e => setSettings({...settings, fontSize: parseInt(e.target.value)})}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Font Family</label>
                  <select 
                    value={settings.fontFamily}
                    onChange={e => setSettings({...settings, fontFamily: e.target.value})}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-white outline-none focus:border-emerald-500"
                  >
                    <option value='"JetBrains Mono", monospace'>JetBrains Mono</option>
                    <option value='"Fira Code", monospace'>Fira Code</option>
                    <option value='"Courier New", monospace'>Courier New</option>
                    <option value='monospace'>System Monospace</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Theme</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSettings({...settings, theme: 'dark'})}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border ${settings.theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
                    >
                      Dark
                    </button>
                    <button 
                      onClick={() => setSettings({...settings, theme: 'hacker'})}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border ${settings.theme === 'hacker' ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
                    >
                      Hacker
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
