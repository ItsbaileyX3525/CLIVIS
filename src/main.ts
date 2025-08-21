import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

const protol: string = "http://"
const hostname: string = "localhost"
const port: string = ":3001"

let term: Terminal
let fitAddon: FitAddon
let commandBuffer = '';

//TODO: Add command history... Idk even where to start tho

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

  switch (command) {
    case 'help':
      term.writeln('Available commands: help, echo, paste, ping\r\nI recommnd using ping to test if the server is working!');
      break;
    
    case 'ping':
      const data = await sendCommandToServer(command);
      term.writeln(data);
      break;

    case 'echo':
      if (args.join(' ').trim().length > 0){
        term.writeln(args.join(' '));
      } else {
        term.writeln("Echo with arguments");
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
    
    case '':
      break;
    
    default:
      term.writeln(`Command not found: ${command}`)
  }
}

function setupTerminal() {
  const termContainer = document.getElementById('terminal') as HTMLElement || null;
  term.loadAddon(fitAddon); 
  term.open(termContainer);
  fitAddon.fit();
  term.writeln('Welcome to xterm clivis V0.1!');

  term.write('$ ');
}

function setupKeyHandle() {
  term.onKey(async ({ key, domEvent }) => {
    const printable  = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

    if (domEvent.key === 'Enter') {
      await processCommand(commandBuffer);
      console.log("Processed command")
      commandBuffer = '';
      term.write('\r\n$ ');
    } else if (domEvent.key === 'Backspace') {
      if (commandBuffer.length > 0) {
        commandBuffer = commandBuffer.slice(0, -1);
        term.write('\b \b');
      }
    } else if (printable && key.length === 1) {
      commandBuffer += key;
      term.write(key)
    }
  })
}

document.addEventListener('DOMContentLoaded', () => {
  term = new Terminal({
    cursorBlink: true,
    fontFamily: "fira-code",
    //lineHeight: 1.2, //Idk it kinda just fixed itself?
    //letterSpacing: 0,
  });
  fitAddon = new FitAddon();
  setupTerminal();
  setupKeyHandle();
})