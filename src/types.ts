export interface FileNode {
  type: 'file';
  content: string;
}

export interface DirNode {
  type: 'dir';
  contents: Record<string, FileSystemNode>;
}

export type FileSystemNode = FileNode | DirNode;

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
}

export interface Session {
  id: string;
  name: string;
  lines: TerminalLine[];
  history: string[];
  currentPath: string;
}

export interface SettingsConfig {
  fontSize: number;
  fontFamily: string;
  theme: 'dark' | 'hacker';
}
