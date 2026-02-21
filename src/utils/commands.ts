import { DirNode } from '../types';
import { resolvePath, getNode, cloneFS } from './fs';

export const executeCommand = (
  cmdStr: string,
  currentPath: string,
  fs: DirNode
): { output?: string; error?: string; newPath?: string; newFs?: DirNode; clear?: boolean } => {
  const args = cmdStr.trim().split(/\s+/);
  const cmd = args[0];

  if (!cmd) return {};

  switch (cmd) {
    case 'help':
      return { output: 'Available commands:\n  help, clear, ls, cd, pwd, echo, mkdir, touch, cat, rm\n  whoami, uname, python, git, curl, apt' };
    case 'clear':
      return { clear: true };
    case 'pwd':
      return { output: currentPath === '' ? '/' : currentPath };
    case 'whoami':
      return { output: 'sandbox' };
    case 'uname':
      return { output: 'Linux sandbox 5.15.0-virtual #1 SMP x86_64 GNU/Linux' };
    case 'echo':
      return { output: args.slice(1).join(' ') };
    case 'ls': {
      const target = args[1] || '.';
      const pathArr = resolvePath(currentPath, target);
      const node = getNode(fs, pathArr);
      if (!node) return { error: `ls: cannot access '${target}': No such file or directory` };
      if (node.type === 'file') return { output: target };
      const keys = Object.keys(node.contents).sort();
      return { output: keys.join('  ') };
    }
    case 'cd': {
      const target = args[1] || '/home/sandbox';
      const pathArr = resolvePath(currentPath, target);
      const node = getNode(fs, pathArr);
      if (!node) return { error: `cd: ${target}: No such file or directory` };
      if (node.type === 'file') return { error: `cd: ${target}: Not a directory` };
      return { newPath: '/' + pathArr.join('/') };
    }
    case 'cat': {
      const target = args[1];
      if (!target) return { error: 'cat: missing operand' };
      const pathArr = resolvePath(currentPath, target);
      const node = getNode(fs, pathArr);
      if (!node) return { error: `cat: ${target}: No such file or directory` };
      if (node.type === 'dir') return { error: `cat: ${target}: Is a directory` };
      return { output: node.content };
    }
    case 'mkdir': {
      const target = args[1];
      if (!target) return { error: 'mkdir: missing operand' };
      const pathArr = resolvePath(currentPath, target);
      if (pathArr.length === 0) return { error: `mkdir: cannot create directory '${target}': File exists` };
      const parentPath = pathArr.slice(0, -1);
      const newDirName = pathArr[pathArr.length - 1];
      const parentNode = getNode(fs, parentPath);
      if (!parentNode || parentNode.type !== 'dir') return { error: `mkdir: cannot create directory '${target}': No such file or directory` };
      if (parentNode.contents[newDirName]) return { error: `mkdir: cannot create directory '${target}': File exists` };
      
      const newFs = cloneFS(fs);
      const newParentNode = getNode(newFs, parentPath) as DirNode;
      newParentNode.contents[newDirName] = { type: 'dir', contents: {} };
      return { newFs };
    }
    case 'touch': {
      const target = args[1];
      if (!target) return { error: 'touch: missing operand' };
      const pathArr = resolvePath(currentPath, target);
      if (pathArr.length === 0) return { error: `touch: cannot touch '${target}': Permission denied` };
      const parentPath = pathArr.slice(0, -1);
      const newFileName = pathArr[pathArr.length - 1];
      const parentNode = getNode(fs, parentPath);
      if (!parentNode || parentNode.type !== 'dir') return { error: `touch: cannot touch '${target}': No such file or directory` };
      
      const newFs = cloneFS(fs);
      const newParentNode = getNode(newFs, parentPath) as DirNode;
      if (!newParentNode.contents[newFileName]) {
        newParentNode.contents[newFileName] = { type: 'file', content: '' };
      }
      return { newFs };
    }
    case 'rm': {
      const target = args[1];
      if (!target) return { error: 'rm: missing operand' };
      const pathArr = resolvePath(currentPath, target);
      if (pathArr.length === 0) return { error: `rm: cannot remove '${target}': Permission denied` };
      const parentPath = pathArr.slice(0, -1);
      const targetName = pathArr[pathArr.length - 1];
      const parentNode = getNode(fs, parentPath);
      if (!parentNode || parentNode.type !== 'dir' || !parentNode.contents[targetName]) {
        return { error: `rm: cannot remove '${target}': No such file or directory` };
      }
      const newFs = cloneFS(fs);
      const newParentNode = getNode(newFs, parentPath) as DirNode;
      delete newParentNode.contents[targetName];
      return { newFs };
    }
    case 'python':
      return { output: 'Python 3.10.12 (main, Nov 20 2023, 15:14:05) [GCC 11.4.0] on linux\nType "help", "copyright", "credits" or "license" for more information.\n>>> exit()' };
    case 'git':
      return { output: 'usage: git [--version] [--help] [-C <path>] [-c <name>=<value>]\n           [--exec-path[=<path>]] [--html-path] [--man-path] [--info-path]\n           [-p | --paginate | -P | --no-pager] [--no-replace-objects] [--bare]\n           [--git-dir=<path>] [--work-tree=<path>] [--namespace=<name>]\n           [--super-prefix=<path>] [--config-env=<name>=<envvar>]\n           <command> [<args>]' };
    case 'curl':
      if (args[1]) {
        return { output: `<!doctype html>\n<html>\n<head>\n    <title>Example Domain</title>\n</head>\n<body>\n    <div>\n        <h1>Example Domain</h1>\n        <p>This domain is for use in illustrative examples in documents.</p>\n    </div>\n</body>\n</html>` };
      }
      return { output: 'curl: try \'curl --help\' or \'curl --manual\' for more information' };
    case 'apt':
      if (args[1] === 'install') {
        if (!args[2]) return { error: 'apt: missing package name' };
        return { output: `Reading package lists... Done\nBuilding dependency tree... Done\nReading state information... Done\nThe following NEW packages will be installed:\n  ${args.slice(2).join(' ')}\n0 upgraded, ${args.length - 2} newly installed, 0 to remove and 0 not upgraded.\nInst ${args[2]} (1.0.0 sandbox-repo)\nConf ${args[2]} (1.0.0 sandbox-repo)` };
      }
      return { output: 'apt 2.4.10 (amd64)\nUsage: apt [options] command' };
    default:
      return { error: `${cmd}: command not found` };
  }
};
