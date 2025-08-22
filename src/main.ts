import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { ImageAddon } from '@xterm/addon-image';
interface PyodideInterface {
  runPython: (code: string) => any;
}

const Colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
} as const;

function success(text: string): string {
  return `${Colors.brightGreen}${text}${Colors.reset}`;
}

function error(text: string): string {
  return `${Colors.brightRed}${text}${Colors.reset}`;
}

function warning(text: string): string {
  return `${Colors.brightYellow}${text}${Colors.reset}`;
}

function info(text: string): string {
  return `${Colors.brightCyan}${text}${Colors.reset}`;
}

function highlight(text: string): string {
  return `${Colors.bright}${Colors.cyan}${text}${Colors.reset}`;
}

function getPrompt(): string {
  const pathColor = Colors.brightBlue;
  const promptColor = Colors.brightGreen;
  return `${pathColor}${currentPath}${Colors.reset} ${promptColor}$${Colors.reset} `;
}

const protol: string = "http://"
const hostname: string = "localhost"
const port: string = ":3001"

let term: Terminal
let fitAddon: FitAddon
let imageAddon: ImageAddon
let commandBuffer = '';

let pyodide: PyodideInterface
let pythonInitialised: boolean = false;

type NodeType = 'dir' | 'file' | 'image' | 'game';

interface FileNode {
  name: string;
  type: NodeType;
  children?: FileNode[];
  content?: string;
}

//Lets create some gui apps.. Good lord
/*
I gonna plan it out just to make it a bit easier IG

I think the easiest method for doing the gui apps is to either use
a iframe or just fixed/absolute divs?

I'll try by implementing an iframe first as that works as a
browser within a browser I think...
*/

async function initPython() {
	pyodide = await (window as any).loadPyodide();
  pythonInitialised = true
}

async function runPython(code: string): Promise<string> {
  try {
    let result = pyodide.runPython(code)
    return String(result)    
  } catch (err) {
    return String(err)
  }

}

let fileSystem: FileNode = {
  name: '/',
  type: 'dir',
  children: [
    { name: 'home', type: 'dir', children: [
      { name: 'baile', type: 'dir', children: [
        { name: 'Downloads', type: 'dir', children: [
          { name: 'readme.md', type: 'file', content: "Hello, if you can read this then awesome!"},
          { name: 'elot.png', type: 'image', content: "/images/Elot.png"},
          { name: 'fun.py', type: 'file', content: `
output = ""
for e in range(10):
    output += str(e) + "\\n"
output`},
        ] },
        { name: 'Pictures', type: 'dir', children: [] },
        { name: 'Documents', type: 'dir', children: [] },
      ]}
    ] },
    { name: 'etc', type: 'dir', children: [] },
    { name: 'games', type: 'dir', children: [
      { name: 'susClicker.AppImage', type: 'game', content: 'susclicker'},
      { name: 'platformer.AppImage', type: 'game', content: "platformer" },
    ] },
  ]
}

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

function getCompletions(input: string): string[] {
  const parts = input.trim().split(' ');
  const command = parts[0];
  const currentArg = parts[parts.length - 1];
  
  if (parts.length === 1) {
    return commands.filter(cmd => cmd.startsWith(currentArg));
  }
  
  if (command === 'cd' || command === 'ls' || command === 'rmdir') {
    // Directory completions
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
        .filter(name => name.startsWith(input));
    }
  }
  
  if (commandOptions[command] && parts.length === 2) {
    return commandOptions[command].filter((option: string) => option.startsWith(currentArg));
  }
  
  return [];
}

function handleAutocomplete(): void {
  const completions = getCompletions(commandBuffer);
  
  if (completions.length === 0) {
    return;
  }
  
  if (completions.length === 1) {
    const parts = commandBuffer.trim().split(' ');
    const completion = completions[0];
    
    parts[parts.length - 1] = completion;
    const newBuffer = parts.join(' ') + ' ';
    
    term.write('\x1b[2K\x1b[G' + getPrompt() + newBuffer);
    commandBuffer = newBuffer;
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
      commandBuffer = newBuffer;
    } else {
      term.write(getPrompt() + commandBuffer);
    }
  }
}

function findCommonPrefix(strings: string[]): string {
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

let currentPath = '/';

//What the fuck does this even actually do?

function findDir(path: string, fs: FileNode = fileSystem): FileNode | null {
  const parts = path.split('/').filter(Boolean);
  let current: FileNode = fs;

  for (const part of parts) {
    if (!current.children) return null;
    const next = current.children.find(node => node.name === part && node.type === 'dir');
    if (!next) return null;
    current = next;
  }

  return current
}

function addDir(path: string, dirName: string): boolean {
  const parent = findDir(path);
  if (!parent || !parent.children) return false;

  if (parent.children.some(node => node.name === dirName)) return false;

  parent.children.push({ name: dirName, type: 'dir', children: [] })
  return true;
}

function deleteDir(path: string): boolean {
  const parts = path.split('/').filter(Boolean);
  const dirName = parts.pop();
  if (!dirName) return false;

  const parent = findDir('/' + parts.join('/'));
  if (!parent || !parent.children) return false;

  parent.children = parent.children.filter(node => node.name !== dirName);
  return true;  
}

function addFile(path: string, fileName: string): boolean {
  const parent = findDir(path);
  if (!parent || !parent.children) return false;

  if (parent.children.some(node => node.name === fileName)) return false;

  parent.children.push({ name: fileName, type: 'file', content: "" })
  return true;
}

function findNode(path: string, fs: FileNode = fileSystem): FileNode | null {
	const parts = path.split('/').filter(Boolean);
	let current: FileNode = fs;

	for (const part of parts) {
		if (!current.children) return null;
		const next = current.children.find(node => node.name === part);
		if (!next) return null;
		current = next;
	}

	return current;
}

let controller: AbortController;

function interruptSleep() {
  controller.abort();
}

export async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => resolve(), ms);

    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(console.log("Sleep called externally"));
      }, { once: true });
    }
  });
}

async function loadGame(game: string): Promise<void> {
  const iframe = document.createElement('iframe') as HTMLIFrameElement;
  
  controller = new AbortController();

  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.position = "absolute";
  iframe.style.zIndex = "999";
  iframe.style.left = "0";
  iframe.style.top = "0";
  switch (game) {
    case 'platformer':
      iframe.src = '/games/platformer/index.html';
      break;
    case 'susclicker':
      iframe.src = '/games/susClicker/index.html';
      break;
    case '':
      break;
    default:
      break;

  }
  document.body.appendChild(iframe)

  await sleep(999999999, controller.signal).catch(console.error);

  iframe.remove()

}

//COMPLETE: Add command history... Idk even where to start tho
// Apprently really easy..

let currentCommand: number = 0
let commandHistory: string[] = []

async function loadImage(url: string) {
  const resp = await fetch(url);

  if (!resp || !resp.ok) {
    return
  }

  const blob = await resp.blob();

  const arrayBuffer = await blob.arrayBuffer();
	let binary = '';
	const bytes = new Uint8Array(arrayBuffer);
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}

  const base64Data = btoa(binary)

  const size = blob.size;

  const iip = `\x1b]1337;File=inline=1;size=${size}:${base64Data}\x07`;

  term.writeln(iip);
}

async function sendCommandToServer(cmd: string, ...args: string[]) {
  try {
    const response = await fetch(protol+hostname+port+"/command", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json '},
      body: JSON.stringify({ command: cmd, args: args }),
    });

    if (!response.ok) {
      return `Server error: ${response.status} ${response.statusText}`;
    }

    const data = await response.json();
    
    return data.output;
  } catch (err) {
    return "Cannot reach server :<"
  }
}

async function processCommand(cmd: string) {
  function parseArgs(input: string): string[] {
    currentCommand = 0;
    const tokens: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < input.length; i++) {
      const ch = input[i];

      if (ch === '\\' && i + 1 < input.length) {
        current += input[++i];
        continue;
      }

      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (ch === ' ' && !inQuotes) {
        if (current !== '') {
          tokens.push(current);
          current = '';
        }
        continue;
      }

      current += ch;
    }

    if (current !== '') tokens.push(current);
    return tokens;
  }

  const [command, ...args] = parseArgs(cmd.trim());

  term.writeln("")

  let commandTmp: string = command
  for (let e of args) {
    commandTmp += " " + e
  }
  commandHistory.push(commandTmp);

  //Js doesnt support the statswith in switch
  //I can always change the switch to true but nah

  if (command.startsWith("./")) {
    let game = command.split("./")[1]
    const filePath = currentPath + game;
    const file = findNode(filePath);

    if (file) {
      if (file.type == 'game') {
        term.writeln(info(`Starting game: ${highlight(game)}`));
        term.writeln(`${Colors.gray}Press Ctrl+C to exit the game${Colors.reset}`);
        await loadGame(file.content || '')
        term.writeln(success('Game session ended'));
        return;
      } else {
        term.writeln(error(`${game} is not an executable file`));
        return;
      }
    } else {
      term.writeln(error(`File not found: ${game}`));
      return;
    }
  }

  switch (command) {
    case 'help':
      term.writeln(`${Colors.bright}${Colors.cyan}Available Commands:${Colors.reset}`);
      term.writeln(`${Colors.green}  help${Colors.reset}        - Show this help message`);
      term.writeln(`${Colors.green}  clear${Colors.reset}       - Clear the terminal`);
      term.writeln(`${Colors.green}  ls${Colors.reset}          - List files and directories`);
      term.writeln(`${Colors.green}  cd${Colors.reset}          - Change directory`);
      term.writeln(`${Colors.green}  mkdir${Colors.reset}       - Create directory`);
      term.writeln(`${Colors.green}  rmdir${Colors.reset}       - Remove directory`);
      term.writeln(`${Colors.green}  touch${Colors.reset}       - Create file`);
      term.writeln(`${Colors.green}  cat${Colors.reset}         - Display file contents`);
      term.writeln(`${Colors.green}  echo${Colors.reset}        - Print text or write to file`);
      term.writeln(`${Colors.green}  python${Colors.reset}      - Run Python code or scripts`);
      term.writeln(`${Colors.green}  w3m${Colors.reset}         - Display images in terminal`);
      term.writeln(`${Colors.yellow}  gpt${Colors.reset}         - Ask AI a question`);
      term.writeln(`${Colors.yellow}  ping${Colors.reset}        - Test server connection`);
      term.writeln(`${Colors.yellow}  quote${Colors.reset}       - Random quotes (try -h for options)`);
      term.writeln(`${Colors.yellow}  paste${Colors.reset}       - Pastebin service (try -h for options)`);
      term.writeln(`${Colors.yellow}  cowsay${Colors.reset}      - Make a cow say something`);
      term.writeln(`${Colors.yellow}  kanye${Colors.reset}       - Get Kanye wisdom`);
      term.writeln(`${Colors.yellow}  joke${Colors.reset}        - Get a random joke`);
      term.writeln(`${Colors.yellow}  elot${Colors.reset}        - Display Elot image`);
      term.writeln(`${Colors.magenta}  ./game${Colors.reset}      - Run executable games`);
      term.writeln(`\n${info('Try ping to test if the server is working!')}`);
      break;
    
    case 'clear':
      term.clear()
      break;

    case 'ping':
      const data = await sendCommandToServer(command);
      if (data.includes('pong') || data.includes('success')) {
        term.writeln(success(data));
      } else {
        term.writeln(error(data));
      }
      break;

    case 'gpt':
      if (args[0]) {
        term.writeln(info('Thinking...'));
        const data = await sendCommandToServer(command, args[0] + " No emojis");
        if (data.startsWith('success')) {
          const response = data.slice(7);
          term.writeln(`${Colors.bright}${Colors.cyan}AI Response:${Colors.reset}`);
          term.writeln(`${Colors.white}${response}${Colors.reset}`);
        } else {
          term.writeln(error(data));
        }  
      } else {
        term.writeln(warning('Usage: gpt <your question>'));
      }

      break;

    case 'echo':
      if (args[args.length - 2] == ">>") {
        if (args[0] == ">>") {
          term.writeln(warning('Please add some text to echo'))
          return;
        }
        const fileName = args[args.length - 1];
        const filePath = currentPath + fileName;
        const file = findNode(filePath);
        if (file && file.type === 'file') {
          file.content += args[0]
          term.writeln(`${Colors.gray}${args[0]}${Colors.reset}`);
        } else {
          term.writeln(error(`File not found: ${fileName}`))
        }
      } else if (args[args.length - 2] == ">") {
        if (args[0] == ">") {
          term.writeln(warning('Please add some text to echo'))
          return;
        }
        const fileName = args[args.length - 1];
        const filePath = currentPath + fileName;
        const file = findNode(filePath);
        if (file && file.type === 'file') {
          file.content = args[0]
          term.writeln(`${Colors.gray}${args[0]}${Colors.reset}`);
        } else {
          term.writeln(error(`File not found: ${fileName}`))
        }
      } else {
        if (args[0] && args[0].length > 0){
          term.writeln(`${Colors.white}${args.join(' ')}${Colors.reset}`);
        } else {
          term.writeln(warning("Please add some text to echo"));
        }        
      }

      break;
    
    case 'quote':
      if (args[0] === '-r' || args[0] === '--random') {
        const data = await sendCommandToServer('randomQuote');
        if (data.includes('Quote:')) {
          const lines = data.split('\r\n');
          const quote = lines[0].replace('Quote: ', '');
          const speaker = lines[1].replace('Speaker: ', '');
          term.writeln(`${Colors.bright}${Colors.yellow}"${quote}"${Colors.reset}`);
          term.writeln(`${Colors.gray}— ${Colors.cyan}${speaker}${Colors.reset}`);
        } else {
          term.writeln(error(data));
        }
      }
      else if (args[0] === "-u" || args[0] === '--upload'){
        if (args[1] && args[2]) {
          const data = await sendCommandToServer('uploadQuote', args[1], args[2]);
          if (data.includes('successfully')) {
            const id = data.match(/quote id: (\d+)/)?.[1];
            term.writeln(success(`Quote uploaded! ID: ${highlight(id || 'unknown')}`));
          } else {
            term.writeln(error(data));
          }
        } else {
          term.writeln(warning('Usage: quote -u "quote text" "speaker name"'));
        }
      }
      else if (args[0] === '-i') {
        if (args[1]) {
          const data = await sendCommandToServer('idQuote', args[1]);
          if (data.includes('Quote:')) {
            const lines = data.split('\r\n');
            const quote = lines[0].replace('Quote: ', '');
            const speaker = lines[1].replace('Speaker: ', '');
            term.writeln(`${Colors.bright}${Colors.yellow}"${quote}"${Colors.reset}`);
            term.writeln(`${Colors.gray}— ${Colors.cyan}${speaker}${Colors.reset}`);
          } else {
            term.writeln(error(data));
          }
        } else {
          term.writeln(warning('Usage: quote -i <id>'));
        }
      }
      else if (args[0] === '-h' || args[0] === '--help') {
        term.writeln(`${Colors.bright}${Colors.cyan}Quote Commands:${Colors.reset}`);
        term.writeln(`${Colors.green}  -r, --random${Colors.reset}      Get a random quote`);
        term.writeln(`${Colors.green}  -u, --upload${Colors.reset}      Upload your own quote`);
        term.writeln(`${Colors.green}  -i <id>${Colors.reset}           Retrieve a quote by ID`);
        term.writeln(`${Colors.yellow}Example:${Colors.reset} quote -u "Hello world" "Anonymous"`);
      }
      else {
        term.writeln(error("Invalid argument, use quote -h or --help for options"));
      }
      break;

    case 'paste':
      if (args[0] === '-r' || args[0] === '--retrieve') {
        if (args[1] && args[1].trim()) {
          const data = await sendCommandToServer("pasteRetrieve", args[1]);
          if (data === '404 - Not Found') {
            term.writeln(error(`Paste not found: ${args[1]}`));
          } else if (data.includes('Error') || data.includes('failed')) {
            term.writeln(error(data));
          } else {
            term.writeln(`${Colors.bright}${Colors.cyan}Paste Content:${Colors.reset}`);
            term.writeln(`${Colors.gray}${data}${Colors.reset}`);
          }
        } else {
          term.writeln(warning('Usage: paste -r <paste_id>'));
        }
      } 
      else if (args[0] === '-u' || args[0] === '--upload') {
        if (args[1] && args[1].trim()) {
          const data = await sendCommandToServer("pasteUpload", args[1]);
          if (data.includes('successfully')) {
            const code = data.match(/paste code: (\w+)/)?.[1];
            term.writeln(success(`Paste uploaded! Code: ${highlight(code || 'unknown')}`));
          } else {
            term.writeln(error(data));
          }
        } else {
          term.writeln(warning('Usage: paste -u "text to upload"'));
        }
      }
      else if (args[0] === '-d' || args[0] === '--delete') {
        if (args[1]) {
          const data = await sendCommandToServer("pasteDelete", args[1]);
          if (data.includes('successfully')) {
            term.writeln(success(`Paste ${highlight(args[1])} deleted successfully`));
          } else {
            term.writeln(error(data));
          }
        } else {
          term.writeln(warning('Usage: paste -d <paste_id>'));
        }
      }
      else if (args[0] === '-h' || args[0] === '--help'){
        term.writeln(`${Colors.bright}${Colors.cyan}Paste Commands:${Colors.reset}`);
        term.writeln(`${Colors.green}  -u, --upload${Colors.reset}      Upload your paste`);
        term.writeln(`${Colors.green}  -r, --retrieve${Colors.reset}    Retrieve your paste`);
        term.writeln(`${Colors.green}  -d, --delete${Colors.reset}      Delete your paste`);
      } 
      else {
        term.writeln(error("Invalid argument, use paste -h or --help for options"));
      }
      break;
    
    case 'mkdir':
      if (args[0]) {
        const dirName = args[0]
        if (addDir(currentPath, dirName)) {
          term.writeln(success(`Directory created: ${highlight(dirName)}`));
        } else {
          term.writeln(error(`Failed to create directory (already exists or invalid name)`));
        }
      } else {
        term.writeln(warning('Usage: mkdir <directory_name>'));
      }

      break;
  
    case 'rmdir':
      if (args[0]) {
        const dirName = args[0] 
        if (deleteDir(`${currentPath}${dirName}`)) {
          term.writeln(success(`Directory deleted: ${highlight(dirName)}`));
        } else {
          term.writeln(error(`Failed to delete directory (not found or not empty)`));
        }
      } else {
        term.writeln(warning('Usage: rmdir <directory_name>'));
      }

      break;

    case 'ls':
      const currentDir = findDir(currentPath);
      if (currentDir && currentDir.children) {
        if (currentDir.children.length === 0) {
          term.writeln(`${Colors.gray}(empty directory)${Colors.reset}`);
        } else {
          term.writeln('');
          currentDir.children.forEach(item => {
            let coloredName = '';
            switch (item.type) {
              case 'dir':
                coloredName = `${Colors.brightBlue}${item.name}/${Colors.reset}`;
                break;
              case 'file':
                coloredName = `${Colors.white}${item.name}${Colors.reset}`;
                break;
              case 'image':
                coloredName = `${Colors.magenta}${item.name}${Colors.reset}`;
                break;
              case 'game':
                coloredName = `${Colors.brightGreen}${item.name}*${Colors.reset}`;
                break;
              default:
                coloredName = item.name;
            }
            term.write(`${coloredName}  `);
          });
          term.writeln(' ');
        }
      } else {
        term.writeln(error('Cannot access directory'));
      }

      break;

    case 'cd':
      if (args[0]) {
        const target = args[0];
        const newDir = target === '..'
          ? currentPath.split('/').slice(0, -2).join('/') + '/'
          : target.startsWith('/') ? target : currentPath + target + '/';

        if (findDir(newDir)) {
          currentPath = newDir;
          term.writeln(success(`Changed directory to ${highlight(currentPath)}`));
        } else {
          term.writeln(error(`Directory not found: ${target}`));
        }
      } else {
        term.writeln(info(`Current directory: ${highlight(currentPath)}`));
      }

      break;

    case 'cat':
      if (args[0]) {
        const fileName = args[0];
        const filePath = currentPath + fileName;
        const file = findNode(filePath);

        if (file && file.type === 'file') {
          if (file.content) {
            term.writeln(`${Colors.gray}${file.content}${Colors.reset}`);
          } else {
            term.writeln(`${Colors.dim}(empty file)${Colors.reset}`);
          }
        } else {
          term.writeln(error(`File not found: ${fileName}`));
        }
      } else {
        term.writeln(warning('Usage: cat <filename>'));
      }

      break;

    case 'touch':
      if (args[0]) {
        const fileName = args[0]
        if (addFile(currentPath, fileName)) {
          term.writeln(success(`File created: ${highlight(fileName)}`));
        } else {
          term.writeln(error(`Failed to create file (already exists or invalid name)`));
        }
      } else {
        term.writeln(warning('Usage: touch <filename>'));
      }

      break;

    case 'python':
      if (!pythonInitialised) {
        term.writeln(info('Initializing Python interpreter...'));
        await initPython();
        term.writeln(success('Python ready!'));
      }
      if (args[0] == "-c") {
        if (args[1]) {
          const output = await runPython(args[1]);
          if (output && output != "undefined") {
            if (output.includes('Error') || output.includes('Exception')) {
              term.writeln(error(`Python Error: ${output}`));
            } else {
              term.writeln(`${Colors.cyan}${output}${Colors.reset}`);
            }
          } else {
            term.writeln(success("Code executed successfully (no output)"));
          }
        } else {
          term.writeln(warning('Usage: python -c "code"'));
        }
        break;
      }
      if (args[0]) {
        const fileName = args[0];
        const filePath = currentPath + fileName;
        const file = findNode(filePath);

        if (file && file.type === 'file') {
          const output = await runPython(file.content || `print("Empty file")`);
          if (output.includes('Error') || output.includes('Exception')) {
            term.writeln(error(`Python Error: ${output}`));
          } else {
            term.writeln(`${Colors.cyan}${output}${Colors.reset}`);
          }
        } else {
          term.writeln(error(`File not found: ${fileName}`));
        }
      } else {
        term.writeln(warning('Usage: python <filename> or python -c "code"'));
      }

      break; 
    case 'w3m':
      if (args[0]) {
        const fileName = args[0];
        const filePath = currentPath + fileName;
        const file = findNode(filePath);

        if (file && file.type === 'image') {
          term.writeln(info(`Loading image: ${fileName}`));
          await loadImage(file.content || '/images/scared_heidi.png')
        } else {
          term.writeln(error(`Image file not found: ${fileName}`));
        }
      } else {
        term.writeln(warning('Usage: w3m <image_filename>'));
      }

      break;

    case 'cowsay':
      if (args[0]) {
        const data = await sendCommandToServer('cowsay', args[0]);
        
        if (data.includes('failed') || data.includes('Error')) {
          term.writeln(error(data));
        } else {
          const lines = data.split("\n");
          const width = Math.max(...lines.map((l: string) => l.length));

          let output = " " + "_".repeat(width + 2) + "\n";

          for (const line of lines) {
            output += `< ${line.padEnd(width, " ")} >\n`;
          }  

          output += " " + "-".repeat(width + 2) + "\n";

          term.writeln(output);
        }
      } else {
        term.writeln(warning('Usage: cowsay <message>'));
      }
      break;

    case 'kanye': 
      const kanyeData = await sendCommandToServer('kanye');
      if (kanyeData.includes('Failed') || kanyeData.includes('failed')) {
        term.writeln(error(kanyeData));
      } else {
        term.writeln(`${Colors.bright}${Colors.magenta}Kanye says:${Colors.reset}`);
        term.writeln(`${Colors.yellow}"${kanyeData}"${Colors.reset}`);
        term.writeln(`${Colors.gray}— Kanye West${Colors.reset}`);
      }

      break;

    case 'elot':
      await loadImage('/images/Elot.png');
      break;

    case 'joke':
      const jokeData = await sendCommandToServer('joke');
      if (jokeData.includes('Failed') || jokeData.includes('failed')) {
        term.writeln(error(jokeData));
      } else {
        const lines = jokeData.split('\n');
        if (lines.length >= 2) {
          term.writeln(`${Colors.bright}${Colors.cyan}${lines[0]}${Colors.reset}`);
          term.writeln(`${Colors.brightGreen}${lines[1]}${Colors.reset}`);
        } else {
          term.writeln(`${Colors.brightCyan}${jokeData}${Colors.reset}`);
        }
      }

      break;

    case '':
      break;
    
    default:
      commandHistory.pop();
      term.writeln(error(`Command not found: ${command}`));
      term.writeln(`${Colors.gray}Type ${Colors.cyan}help${Colors.gray} to see available commands${Colors.reset}`);
  }
}

async function setupTerminal() {
  const termContainer = document.getElementById('terminal') as HTMLElement || null;
  term.loadAddon(fitAddon); 
  term.loadAddon(imageAddon);
  term.open(termContainer);
  fitAddon.fit(); 
  
  const welcomeBox = `
\x1b[36m╔═══════════════════════════════════════════════════════════════════════════╗\x1b[0m
\x1b[36m║\x1b[0m                    \x1b[1m\x1b[32mWelcome to CLIvis Terminal v1.0\x1b[0m                        \x1b[36m║\x1b[0m
\x1b[36m╠═══════════════════════════════════════════════════════════════════════════╣\x1b[0m
\x1b[36m║\x1b[0m \x1b[1m\x1b[35mEssential Commands:\x1b[0m                                                       \x1b[36m║\x1b[0m
\x1b[36m║\x1b[0m   \x1b[32mhelp\x1b[0m        - See what this thing can do                                \x1b[36m║\x1b[0m
\x1b[36m║\x1b[0m   \x1b[32mls\x1b[0m          - Check what's lying around                                 \x1b[36m║\x1b[0m
\x1b[36m║\x1b[0m   \x1b[32mcd\x1b[0m          - Move around the filesystem                                \x1b[36m║\x1b[0m
\x1b[36m║\x1b[0m   \x1b[32mpython -c\x1b[0m   - Run Python code on the fly                                \x1b[36m║\x1b[0m
\x1b[36m║\x1b[0m   \x1b[32mw3m\x1b[0m         - View images right in your terminal                        \x1b[36m║\x1b[0m
\x1b[36m║\x1b[0m                                                                           \x1b[36m║\x1b[0m
\x1b[36m║\x1b[0m \x1b[1m\x1b[31m Yes, you can actually play games here!\x1b[0m                                   \x1b[36m║\x1b[0m
\x1b[36m║\x1b[0m   Just \x1b[33mcd /games\x1b[0m and run \x1b[33m./platformer.AppImage\x1b[0m                            \x1b[36m║\x1b[0m
\x1b[36m║\x1b[0m   Games go fullscreen - hit Ctrl+C when you're done                       \x1b[36m║\x1b[0m
\x1b[36m║\x1b[0m                                                                           \x1b[36m║\x1b[0m
\x1b[36m║\x1b[0m \x1b[1m\x1b[34mStuff that might be useful:\x1b[0m                                               \x1b[36m║\x1b[0m
\x1b[36m║\x1b[0m   Arrow keys work for command history (because I'm not a monster)         \x1b[36m║\x1b[0m
\x1b[36m║\x1b[0m   Try \x1b[37mquote -r\x1b[0m or \x1b[37mjoke\x1b[0m when you're bored                                  \x1b[36m║\x1b[0m
\x1b[36m║\x1b[0m   Python works with the fake filesystem I built                           \x1b[36m║\x1b[0m
\x1b[36m╚═══════════════════════════════════════════════════════════════════════════╝\x1b[0m

\x1b[1m\x1b[36mType \x1b[32mhelp\x1b[36m for the full command list!\x1b[0m
`;

  term.writeln(welcomeBox);
  term.write(getPrompt());
}

function setupKeyHandle() {
  term.onKey(async ({ key, domEvent }) => {
    const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

    if (domEvent.key === 'Tab') {
      domEvent.preventDefault();
      handleAutocomplete();
      
    } else if (domEvent.key === 'ArrowUp') {
      if (commandHistory.length === 0) return;

      if (currentCommand < commandHistory.length) {
        currentCommand++;
      }

      commandBuffer = commandHistory[commandHistory.length - currentCommand] || '';
      term.write('\x1b[2K\x1b[G' + getPrompt() + commandBuffer);

    } else if (domEvent.key === 'ArrowDown') {
      if (commandHistory.length === 0) return;

      if (currentCommand > 0) {
        currentCommand--;
        commandBuffer = currentCommand === 0 ? '' : commandHistory[commandHistory.length - currentCommand];
      }

      term.write('\x1b[2K\x1b[G' + getPrompt() + commandBuffer);

    } else if (domEvent.key === 'Enter') {
      if (commandBuffer.trim() !== '') {
        await processCommand(commandBuffer);
      }
      commandBuffer = '';
      currentCommand = 0;
      term.write('\r\n' + getPrompt());

    } else if (domEvent.key === 'Backspace') {
      if (commandBuffer.length > 0) {
        commandBuffer = commandBuffer.slice(0, -1);
        term.write('\b \b');
      }

    } else if (printable && key.length === 1) {
      commandBuffer += key;
      term.write(key);
    }
  });

}

(window as any).interruptSleep = interruptSleep

document.addEventListener('DOMContentLoaded', async () => {
  term = new Terminal({
    convertEol: true,
    cursorBlink: true,
    fontFamily: "fira-code",
    //lineHeight: 1.2, //Idk it kinda just fixed itself?
    //letterSpacing: 0,
  });
  fitAddon = new FitAddon();
  imageAddon = new ImageAddon();
  
  setupTerminal();
  setupKeyHandle();
  
})