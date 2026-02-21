import { DirNode, FileSystemNode } from '../types';

export const resolvePath = (currentPath: string, targetPath: string): string[] => {
  if (!targetPath) return currentPath.split('/').filter(Boolean);
  const parts = targetPath.startsWith('/') ? targetPath.split('/') : [...currentPath.split('/'), ...targetPath.split('/')];
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === '' || part === '.') continue;
    if (part === '..') {
      resolved.pop();
    } else {
      resolved.push(part);
    }
  }
  return resolved;
};

export const getNode = (fs: DirNode, path: string[]): FileSystemNode | null => {
  let current: FileSystemNode = fs;
  for (const part of path) {
    if (current.type !== 'dir') return null;
    if (!current.contents[part]) return null;
    current = current.contents[part];
  }
  return current;
};

export const cloneFS = (fs: DirNode): DirNode => {
  return JSON.parse(JSON.stringify(fs));
};

export const initialFS: DirNode = {
  type: 'dir',
  contents: {
    'home': {
      type: 'dir',
      contents: {
        'sandbox': {
          type: 'dir',
          contents: {
            'readme.txt': { type: 'file', content: 'Welcome to Sandbox OS.\nThis is a temporary isolated environment.\nType "help" to see available commands.' },
            'projects': { type: 'dir', contents: {} }
          }
        }
      }
    },
    'etc': { type: 'dir', contents: {} },
    'var': { type: 'dir', contents: {} },
    'usr': { type: 'dir', contents: {} },
    'bin': { type: 'dir', contents: {} },
  }
};
