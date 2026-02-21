import React, { useState, useRef, useEffect } from 'react';
import { TerminalLine, Session, SettingsConfig } from '../types';

interface TerminalViewProps {
  session: Session;
  onCommand: (cmd: string) => void;
  settings: SettingsConfig;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export const TerminalView: React.FC<TerminalViewProps> = ({ session, onCommand, settings, inputRef }) => {
  const [input, setInput] = useState('');
  const [historyIdx, setHistoryIdx] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [session.lines]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onCommand(input);
      setInput('');
      setHistoryIdx(-1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (session.history.length > 0) {
        const nextIdx = historyIdx + 1 < session.history.length ? historyIdx + 1 : historyIdx;
        setHistoryIdx(nextIdx);
        setInput(session.history[session.history.length - 1 - nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInput(session.history[session.history.length - 1 - nextIdx]);
      } else if (historyIdx === 0) {
        setHistoryIdx(-1);
        setInput('');
      }
    }
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const isHacker = settings.theme === 'hacker';

  return (
    <div 
      className={`flex-1 overflow-y-auto p-3 md:p-4 font-mono ${isHacker ? 'bg-black text-green-500' : 'bg-[#1e1e1e] text-zinc-300'}`}
      style={{ fontFamily: settings.fontFamily, fontSize: `${settings.fontSize}px` }}
      onClick={focusInput}
    >
      {session.lines.map((line) => (
        <div key={line.id} className="mb-1 whitespace-pre-wrap break-all leading-relaxed">
          {line.type === 'input' && (
            <span className={`${isHacker ? 'text-green-400' : 'text-emerald-400'} mr-2 font-semibold`}>
              sandbox@android:{session.currentPath}$
            </span>
          )}
          <span className={
            line.type === 'error' ? 'text-red-400' : 
            line.type === 'system' ? (isHacker ? 'text-green-700' : 'text-zinc-500') : 
            ''
          }>
            {line.text}
          </span>
        </div>
      ))}
      <div className="flex items-center mt-1">
        <span className={`${isHacker ? 'text-green-400' : 'text-emerald-400'} mr-2 font-semibold whitespace-nowrap`}>
          sandbox@android:{session.currentPath}$
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`flex-1 bg-transparent outline-none border-none min-w-0 ${isHacker ? 'text-green-500' : 'text-zinc-300'}`}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
      </div>
      <div ref={bottomRef} className="h-4" />
    </div>
  );
};
