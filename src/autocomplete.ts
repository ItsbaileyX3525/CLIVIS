import { findDir } from './fileSystem.js';
import { Colors } from './colors.js';

const commands = [
  'help', 'clear', 'ls', 'cd', 'mkdir', 'rmdir', 'touch', 'cat', 'echo', 
  'python', 'w3m', 'gpt', 'ping', 'quote', 'paste', 'cowsay', 'kanye', 
  'joke', 'elot'
];

const commandOptions: { [key: string]: string[] } = {
  'quote': ['-r', '--random', '-u', '--upload', '-i', '-h', '--help'],
  'paste': ['-r', '--retrieve', '-u', '--upload', '-d', '--delete', '-h', '--help'],
  'python': ['-c'],
  'cd': ['..', '/'],
  'gpt': [],
  'cowsay': [],
  'kanye': [],
  'joke': [],
  'elot': []
};

export function getCompletions(input: string, currentPath: string): string[] {
  const parts = input.trim().split(' ');
  const command = parts[0];
  const currentArg = parts[parts.length - 1];
  
  if (parts.length === 1) {
    const commandMatches = commands.filter(cmd => cmd.startsWith(currentArg));
    
    const currentDir = findDir(currentPath);
    let gameMatches: string[] = [];
    if (currentDir && currentDir.children) {
      gameMatches = currentDir.children
        .filter(item => item.type === 'game')
        .map(item => './' + item.name)
        .filter(name => name.startsWith('./' + currentArg));
    }
    
    return [...commandMatches, ...gameMatches];
  }
  
  if (command === 'cd' || command === 'ls' || command === 'rmdir') {
    const currentDir = findDir(currentPath);
    if (currentDir && currentDir.children) {
      const dirs = currentDir.children
        .filter(item => item.type === 'dir')
        .map(item => item.name)
        .filter(name => name.startsWith(currentArg));
      
      if (command === 'cd') {
        return [...dirs, '..'].filter(name => name.startsWith(currentArg));
      }
      return dirs;
    }
  }
  
  if (command === 'cat' || command === 'touch' || command === 'python') {
    const currentDir = findDir(currentPath);
    if (currentDir && currentDir.children) {
      return currentDir.children
        .filter(item => item.type === 'file')
        .map(item => item.name)
        .filter(name => name.startsWith(currentArg));
    }
  }
  
  if (command === 'w3m') {
    const currentDir = findDir(currentPath);
    if (currentDir && currentDir.children) {
      return currentDir.children
        .filter(item => item.type === 'image')
        .map(item => item.name)
        .filter(name => name.startsWith(currentArg));
    }
  }
  
  if (command.startsWith('./')) {
    const currentDir = findDir(currentPath);
    if (currentDir && currentDir.children) {
      return currentDir.children
        .filter(item => item.type === 'game')
        .map(item => './' + item.name)
        .filter(name => name.startsWith(currentArg));
    }
  }
  
  if (commandOptions[command] && parts.length === 2) {
    return commandOptions[command].filter((option: string) => option.startsWith(currentArg));
  }
  
  return [];
}

export function findCommonPrefix(strings: string[]): string {
  if (strings.length === 0) return '';
  if (strings.length === 1) return strings[0];
  
  let prefix = '';
  const firstString = strings[0];
  
  for (let i = 0; i < firstString.length; i++) {
    const char = firstString[i];
    if (strings.every(str => str[i] === char)) {
      prefix += char;
    } else {
      break;
    }
  }
  
  return prefix;
}

interface AutocompleteHandlerProps {
  completions: string[];
  commandBuffer: string;
  term: any;
  getPrompt: () => string;
  setCommandBuffer: (buffer: string) => void;
}

export function renderAutocompleteOptions({ 
  completions, 
  commandBuffer, 
  term, 
  getPrompt, 
  setCommandBuffer 
}: AutocompleteHandlerProps): void {
  if (completions.length === 0) {
    return;
  }
  
  if (completions.length === 1) {
    const parts = commandBuffer.trim().split(' ');
    const completion = completions[0];
    
    parts[parts.length - 1] = completion;
    const newBuffer = parts.join(' ') + ' ';
    
    term.write('\x1b[2K\x1b[G' + getPrompt() + newBuffer);
    setCommandBuffer(newBuffer);
  } else {
    term.writeln('');
    
    const maxLength = Math.max(...completions.map(c => c.length));
    const columns = Math.floor(80 / (maxLength + 2));
    
    for (let i = 0; i < completions.length; i += columns) {
      const row = completions.slice(i, i + columns);
      const coloredRow = row.map(item => {
        if (commands.includes(item)) {
          return `${Colors.green}${item.padEnd(maxLength)}${Colors.reset}`;
        } else if (item.startsWith('-')) {
          return `${Colors.yellow}${item.padEnd(maxLength)}${Colors.reset}`;
        } else if (item.endsWith('/') || item === '..') {
          return `${Colors.brightBlue}${item.padEnd(maxLength)}${Colors.reset}`;
        } else if (item.startsWith('./')) {
          return `${Colors.brightGreen}${item.padEnd(maxLength)}${Colors.reset}`;
        } else {
          return `${Colors.white}${item.padEnd(maxLength)}${Colors.reset}`;
        }
      });
      term.writeln(coloredRow.join('  '));
    }
    
    const commonPrefix = findCommonPrefix(completions);
    const parts = commandBuffer.trim().split(' ');
    const lastPart = parts[parts.length - 1];
    
    if (commonPrefix.length > lastPart.length) {
      parts[parts.length - 1] = commonPrefix;
      const newBuffer = parts.join(' ');
      term.write(getPrompt() + newBuffer);
      setCommandBuffer(newBuffer);
    } else {
      term.write(getPrompt() + commandBuffer);
    }
  }
}
