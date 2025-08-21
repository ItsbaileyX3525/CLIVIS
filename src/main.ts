import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

const protol: string = "http://"
const hostname: string = "localhost"
const port: string = ":3001"

const term = new Terminal({
  cursorBlink: true,
  fontFamily: "fira-code",
  //lineHeight: 1.2, //Idk it kinda just fixed itself?
  //letterSpacing: 0,
});
const fitAddon = new FitAddon()
let commandBuffer = '';

//TODO: Add command history... Idk even where to start tho

async function sendCommandToServer(cmd: string, ...args: string[]) {
  try {
    const response = await fetch(protol+hostname+port+"/command", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json '},
      body: JSON.stringify({ command: cmd, arg: args[0] }),
    });

    const data = await response.json();
    
    return data.output;
  } catch (err) {
    return "Error reaching server :<"
  }
}

async function processCommand(cmd: string) {
  const [command, ...args] = cmd.trim().split(' ') //Did not know that ...args was a thing prior

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
        term.writeln("Echo with arguments")
      }
      break;
    
    case 'paste':
      if (args[0] === '-r') {
        if (args[1].trim()) {
          const data = await sendCommandToServer("pasteRetrieve", args[1])

          term.writeln(data);
        } 
        else {
          term.writeln("please add an ID")
        }
      } 
      else if (args[0] === '-p') {
        if (args[1].trim()) {
          const data = await sendCommandToServer("pasteUpload",args[1])

          term.writeln(data)
        }
        else {
          term.writeln("Add some text to upload!")
        }
      } 
      else if (args[0] === '-h'){
        term.writeln('-p "args"  Upload your paste\r\n-r "id"   Retrieve your paste')
      } 
      else {
        term.writeln("Invalid argument, use paste -h to see available options")
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
  setupTerminal();
  setupKeyHandle();
})