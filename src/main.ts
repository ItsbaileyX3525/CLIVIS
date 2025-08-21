import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { ImageAddon } from '@xterm/addon-image';
interface PyodideInterface {
  runPython: (code: string) => any;
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

type NodeType = 'dir' | 'file' | 'image';

interface FileNode {
  name: string;
  type: NodeType;
  children?: FileNode[];
  content?: string;
}

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
    { name: 'etc', type: 'dir', children: [] }
  ]
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

function listDir(path: string): string {
  const dir = findDir(path);
  if (!dir || !dir.children) return '';
  return dir.children.map(c => c.name).join(' ')
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

    const data = await response.json();
    
    return data.output;
  } catch (err) {
    return "Error reaching server :<"
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

  term.writeln("\r\n")

  let commandTmp: string = command
  for (let e of args) {
    commandTmp += " " + e
  }
  commandHistory.push(commandTmp);
  switch (command) {
    case 'help':
      term.writeln('Available commands: help, echo, w3m, touch, cat, mkdir, rmdir, cd, python, paste, kanye, cowsay, elot, joke and ping\r\nI recommnd using ping to test if the server is working!');
      break;
    
    case 'clear':
      term.clear()
      break;

    case 'ping':
      const data = await sendCommandToServer(command);
      term.writeln(data);
      break;

    case 'echo':
      if (args[args.length - 2] == ">>") {
        if (args[0] == ">>") {
          term.writeln(`Please add some text to echo`)
          return;
        }
        const fileName = args[args.length - 1];
        const filePath = currentPath + fileName;
        const file = findNode(filePath);
        if (file && file.type === 'file') {
          file.content += args[0]
          term.writeln(args[0]);
        } else {
          term.writeln(`File not found: ${fileName}`)
        }
      } else if (args[args.length - 2] == ">") {
        if (args[0] == ">") {
          term.writeln(`Please add some text to echo`)
          return;
        }
        const fileName = args[args.length - 1];
        const filePath = currentPath + fileName;
        const file = findNode(filePath);
        if (file && file.type === 'file') {
          file.content = args[0]
          term.writeln(args[0]);
        } else {
          term.writeln(`File not found: ${fileName}`)
        }
      } else {
        if (args[0].length > 0){
          term.writeln(args.join(' '));
        } else {
          term.writeln("Please add some text to echo");
        }        
      }

      break;
    
    case 'quote':
      if (args[0] === '-r' || args[0] === '--random') {
        const data = await sendCommandToServer('randomQuote');

        term.writeln(data);
      }
      else if (args[0] === "-u" || args[0] === '--upload'){
        const data = await sendCommandToServer('uploadQuote', args[1], args[2]);
        
        term.writeln(data);
      }
      else if (args[0] === '-i') {
        const data = await sendCommandToServer('idQuote', args[1]);

        term.writeln(data);
      }
      else if (args[0] === '-h' || args[0] === '--help') {
        term.writeln('-r, --random    Get a random quote\r\n-u, --upload    Upload your own quote, example: quote -u "quote" "speaker"\r\n-i    Retrieve a quote by ID');
      }
      else {
        term.writeln("Invalid argument, use quote -h or --help to see available options");
      }
      break;

    case 'paste':
      if (args[0] === '-r' || args[0] === '--retrieve') {
        if (args[1].trim()) {
          const data = await sendCommandToServer("pasteRetrieve", args[1])

          term.writeln(data);
        } 
        else {
          term.writeln("please add an ID")
        }
      } 
      else if (args[0] === '-u' || args[0] === '--upload') {
        if (args[1].trim()) {
          const data = await sendCommandToServer("pasteUpload",args[1])

          term.writeln(data);
        }
        else {
          term.writeln("Add some text to upload!");
        }
      }
      else if (args[0] === '-d' || args[0] === '--delete') {
        const data = await sendCommandToServer("pasteDelete", args[1])

        term.writeln(data);
      }
      else if (args[0] === '-h' || args[0] === '--help'){
        term.writeln('-u, --upload "args"  Upload your paste\r\n-r, --retrieve "id"   Retrieve your paste\r\n-d, --delete "id"   Delete your paste');
      } 
      else {
        term.writeln("Invalid argument, use paste -h or --help to see available options");
      }
      break;
    
    case 'mkdir':
      if (true) {
        const dirName = args[0]
        if (addDir(currentPath, dirName)) term.writeln(`Directory created: ${dirName}`);
        else term.writeln(`Failed to create directory`);
      }

      break;
  
    case 'rmdir':
      if (true) {
        const dirName = args[0] 
        if (deleteDir(`${currentPath}${dirName}`)) term.writeln(`Directory deleted: ${dirName}`);
        else term.writeln(`Failed to delete directory`);
      }

      break;

    case 'ls':
      if (true) {
        term.writeln(`\r\n${listDir(currentPath)}\r\n`);
      }

      break;

    case 'cd':
      const target = args[0];
      const newDir = target === '..'
        ? currentPath.split('/').slice(0, -2).join('/') + '/'
        : target.startsWith('/') ? target : currentPath + target + '/';

      if (findDir(newDir)) {
        currentPath = newDir;
        term.writeln(`Changed directory to ${currentPath}`);
      } else {
        term.writeln(`Directory not found`);
      }

      break;

    case 'cat':
      const fileName = args[0];
      const filePath = currentPath + fileName;
      const file = findNode(filePath);

      if (file && file.type === 'file') {
        term.writeln(file.content || 'No content');
      } else {
        term.writeln(`File not found: ${fileName}`)
      }

      break;

    case 'touch':
      if (true) { //Love the hack
        const fileName = args[0]
        if (addFile(currentPath, fileName)) term.writeln(`File created: ${fileName}`);
        else term.writeln(`Failed to create file!`);
      }

      break;

    case 'python':
      if (!pythonInitialised) {
        await initPython();
      }
      if (args[0] == "-c") {
        const output = await runPython(args[1]);
        if (output && output != "undefined") {
          term.writeln(output);
        } else {
          term.writeln("No return output. Your code ran successfully tho!")
        }

        break;
      }
      if (true) {
        const fileName = args[0];
        const filePath = currentPath + fileName;
        const file = findNode(filePath);

        if (file && file.type === 'file') {
          const output = await runPython(file.content || `output="Python code failed."`);
          term.writeln(output);
        } else {
          term.writeln(`File not found: ${fileName}`)
        }

      }

      break;

    case 'w3m':
      if (true) {
        const fileName = args[0];
        const filePath = currentPath + fileName;
        const file = findNode(filePath);

        if (file && file.type === 'image') {
          await loadImage(file.content || '/images/scared_heidi.png')
        } else {
          term.writeln(`File not found: ${fileName}`)
        }
      }

      break;

    case 'cowsay':
      if (true) {
        const data = await sendCommandToServer('cowsay', args[0]);
      
        const lines = data.split("\n");
        const width = Math.max(...lines.map((l: string) => l.length));

        let output = " " + "_".repeat(width + 2) + "\n";

        for (const line of lines) {
          output += `< ${line.padEnd(width, " ")} >\n`;
        }

        output += " " + "-".repeat(width + 2) + "\n";

        term.writeln(output);
      }
      break;

    case 'kanye':
      if (true){
        const data = await sendCommandToServer('kanye');

        term.writeln(data);
      }

      break;

    case 'elot':
      await loadImage('/images/Elot.png');
      break;

    case 'joke':
      if (true){
        const data = await sendCommandToServer('joke')

        term.writeln(data);
      }

      break;

    case '':
      break;
    
    default:
      commandHistory.pop();
      term.writeln(`Command not found: ${command}`)
  }
}

async function setupTerminal() {
  const termContainer = document.getElementById('terminal') as HTMLElement || null;
  term.loadAddon(fitAddon); 
  term.loadAddon(imageAddon);
  term.open(termContainer);
  fitAddon.fit();
  term.writeln('Welcome to xterm clivis V0.1! Type "help" to get started!');
  term.write('$ ');
}

function setupKeyHandle() {
  term.onKey(async ({ key, domEvent }) => {
    const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

    if (domEvent.key === 'ArrowUp') {
      if (commandHistory.length === 0) return;

      if (currentCommand < commandHistory.length) {
        currentCommand++;
      }

      commandBuffer = commandHistory[commandHistory.length - currentCommand] || '';
      term.write('\x1b[2K\x1b[G$ ' + commandBuffer);

    } else if (domEvent.key === 'ArrowDown') {
      if (commandHistory.length === 0) return;

      if (currentCommand > 0) {
        currentCommand--;
        commandBuffer = currentCommand === 0 ? '' : commandHistory[commandHistory.length - currentCommand];
      }

      term.write('\x1b[2K\x1b[G$ ' + commandBuffer);

    } else if (domEvent.key === 'Enter') {
      if (commandBuffer.trim() !== '') {
        await processCommand(commandBuffer);
      }
      commandBuffer = '';
      currentCommand = 0;
      term.write('\r\n$ ');

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