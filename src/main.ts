import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { ImageAddon } from '@xterm/addon-image';
import { findDir, addDir, deleteDir, addFile, findNode } from './fileSystem.js';
import { Colors, success, error, warning, info, highlight } from './colors.js';
import { initPython, runPython, isPythonInitialised } from './python.js';
import { sendCommandToServer } from './serverApi.js';
import { getCompletions, findCommonPrefix } from './autocomplete.js';
import {
  getCommandLineState,
  setCommandBuffer,
  clearCommandBuffer,
  redrawCommandLine,
  insertChar,
  deleteChar,
  deleteCharForward,
  moveCursorLeft,
  moveCursorRight,
  moveCursorToStart,
  moveCursorToEnd
} from './commandLineEditor.js';
import { loadGame, interruptSleep, sleep } from './gameLoader.js';
function getPrompt(): string {
  const pathColor = Colors.brightBlue;
  const promptColor = Colors.brightGreen;
  return `${pathColor}${currentPath}${Colors.reset} ${promptColor}$${Colors.reset} `;
}
import { createQR } from './qrCode.js';
import {
  MaxwellFrames,
  EarthFrames,
  KnotFrames,
  DonutFrames,
  NyanFrames,
  ParrotFrames } from './util/frames.js'
import { rainbow as lolcats } from './rainbow.js';

lolcats.setSeed(Math.round(Math.random() * 1000));

let term: Terminal
let fitAddon: FitAddon
let imageAddon: ImageAddon

function handleAutocomplete(): void {
  const { commandBuffer } = getCommandLineState();
  const completions = getCompletions(commandBuffer, currentPath);

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
        if (['help', 'clear', 'ls', 'cd', 'mkdir', 'rmdir', 'touch', 'cat', 'echo', 'python', 'w3m', 'gpt', 'ping', 'quote', 'paste', 'cowsay', 'kanye', 'joke', 'elot', 'youtube', 'qr', 'base64', 'passwdGen'].includes(item)) {
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

var asciiArts: Record<string, string[]> = {
    "donut" : DonutFrames,
    "parrot" : ParrotFrames,
    "nyan" : NyanFrames,
    "knot" : KnotFrames,
    "earth" : EarthFrames,
    "maxwell" : MaxwellFrames,
}

const validAscii: string[] = ["nyan", "donut", "parrot", "knot", "earth", "maxwell"];

let commandBreak: boolean = false;

let currentPath = '/';

//COMPLETE: Add command history... Idk even where to start tho
// Apprently really easy..

let currentCommand: number = 0
let commandHistory: string[] = []

function base64ED(input: string, ED?: 'encode' | 'decode'): string {
  if (ED === 'encode') {
    return btoa(unescape(encodeURIComponent(input)));
  } else if (ED === 'decode') {
    return decodeURIComponent(escape(atob(input)));
  } else {
    return "FAILURE";
  }
}

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
      term.writeln(`${Colors.magenta}  youtube${Colors.reset}     - Download youtube videos from an url`);
      term.writeln(`${Colors.magenta}  qr${Colors.reset}          - Turn text into a qr code!`);
      term.writeln(`${Colors.magenta}  base64${Colors.reset}      - Encode/decode base64 text (use -h for help)`);
      term.writeln(`${Colors.magenta}  passwdGen${Colors.reset}   - Generate secure passwords (use -h for help)`);
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

    case 'ascii':
        if(!args[0]) {
            term.writeln(error(`Please provide an ASCII art name`));
            term.writeln(info(`Available ASCII art names: ${validAscii.join(', ')}]`));
            return;
        }

        let rainbow: boolean = false;
        let artName: string = ""

        if (args[0] === '-r' || args[0] === '--rainbow') {
          rainbow = true
          artName = args[1]
          term.writeln(warning("Rainbow can be very intensive so be careful"))
          await sleep(2400);
        } else {
          artName = args[0];
        }



        if (!validAscii.includes(artName)) {
            term.writeln(info(`Invalid ASCII art name. Available options are: ${validAscii.join(', ')}.]`));
            return;
        }

        const frames = asciiArts[artName];
        let iteration = 0;
        let frameIndex = 0;

        function showNextFrame() {
            if (commandBreak || iteration >= 1000) {
                commandBreak = false;
                return;
            }

            term.clear();
            const frame = frames[frameIndex];
            if (rainbow) {
              term.writeln(String(lolcats.rainbowOnly(frame)) + "\nUse 'Control + C' to stop the animation.");
            } else {
              term.writeln(`${frame}\nUse 'Control + C' to stop the animation.`);
            }

            frameIndex++;

            if (frameIndex >= frames.length) {
                frameIndex = 0;
                iteration++;
            }

            setTimeout(showNextFrame, 60);
        }

        term.clear();
        showNextFrame();
        break;

    case 'meme':
      if (true) {
        const data = await sendCommandToServer(command)

        if (data.startsWith('success')) {
          const response = data.slice(7);

          await loadImage(response);
        } else {
          term.writeln(error("Something went wrong, try again!"))
        }
      }

      break;

    case 'fact':
      if (true) {
        const data = await sendCommandToServer(command);

        if (data.startsWith('success')) {
          const response = data.slice(7)

          term.writeln(info(response))
        } else {
          term.writeln(error("Something went wrong, try again!"))
        }
      }

      break;
    case 'youtube':
      if (args[0]) {
        term.writeln(info("Download should've started!"))
        const data = await sendCommandToServer(command, args[0])

        if (data[0].startsWith('success')) {
          const response = data[0].slice(7);
          term.writeln(success(response))

          //Create blob thing for insta-download
          const fileResponse = await fetch(window.location.protocol+"//"+window.location.hostname+":"+window.location.port+"/download/"+data[1]);
          const blob = await fileResponse.blob();

          const objectUrl = URL.createObjectURL(blob);
          const a = document.createElement('a') as HTMLAnchorElement;
          a.href = objectUrl
          a.download = data[1]
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a)
          URL.revokeObjectURL(objectUrl);
        }
      }

      break;

    case 'passwdGen':
      if (args[0] === '-h' || args[0] === '--help') {
        term.writeln(`${Colors.bright}${Colors.cyan}Password Generator Commands:${Colors.reset}`);
        term.writeln(`${Colors.green}  --length<N>${Colors.reset}       Set password length (default: 16)`);
        term.writeln(`${Colors.green}  --noSpecial${Colors.reset}       Exclude special characters`);
        term.writeln(`${Colors.green}  --noUpper${Colors.reset}         Exclude uppercase letters`);
        term.writeln(`${Colors.green}  --noLower${Colors.reset}         Exclude lowercase letters`);
        term.writeln(`${Colors.green}  --noNumbers${Colors.reset}       Exclude numbers`);
        term.writeln(`${Colors.green}  -h, --help${Colors.reset}        Show this help message`);
        term.writeln(`${Colors.yellow}Examples:${Colors.reset}`);
        term.writeln(`  passwdGen --length24`);
        term.writeln(`  passwdGen --noSpecial --length12`);
        break;
      }

      //https://api.genratr.com/?length=16&uppercase&lowercase&special&numbers
      let url: string
      let special: string = "&special";
      let length: string = "length=16";
      let upper: string = "&uppercase";
      let lower: string = "&lowercase";
      let numbers: string = "&numbers";
      let checker: number = 0

      for (let e of args) {
        if (e === '--noSpecial') {
          special = "";
          checker ++;
        } else if (e === '--noUpper') {
          upper = "";
          checker ++;
        } else if (e === '--noLower') {
          lower = "";
          checker ++;
        } else if (e === '--noNumbers') {
          numbers = "";
          checker ++;
        } else if (e.startsWith('--length')) {
          length = `length=${e.slice(8)}`
        }
      }

      if (checker >= 4) {
        term.writeln(error("Cannot generate password: all character types excluded"));
        term.writeln(info("Use passwdGen -h for help"));
        break;
      }

      url = `https://api.genratr.com/?${length}${upper}${lower}${special}${numbers}`

      if (url) {
        term.writeln(info('Generating password...'));
        const data = await sendCommandToServer(command, url)

        if (data.startsWith('success')) {
          let response = data.slice(7)
          term.writeln(`${Colors.bright}${Colors.green}Generated Password:${Colors.reset} ${Colors.bright}${Colors.yellow}${response}${Colors.reset}`);
        } else {
          term.writeln(error("Failed to generate password"));
        }
      }

      break;

    case 'base64':
      if (args[0] === '-e' || args[0] === '--encode') {
        if (args[1]) {
          const response = base64ED(args[1], 'encode');
          term.writeln(`${Colors.bright}${Colors.green}Encoded:${Colors.reset} ${Colors.white}${response}${Colors.reset}`);
        } else {
          term.writeln(warning('Usage: base64 -e <text_to_encode>'));
        }
      } else if (args[0] === '-d' || args[0] === '--decode') {
        if (args[1]) {
          try {
            const response = base64ED(args[1], 'decode');
            term.writeln(`${Colors.bright}${Colors.green}Decoded:${Colors.reset} ${Colors.white}${response}${Colors.reset}`);
          } catch (err) {
            term.writeln(error('Invalid base64 string'));
          }
        } else {
          term.writeln(warning('Usage: base64 -d <base64_to_decode>'));
        }
      } else if (args[0] === '-h' || args[0] === '--help') {
        term.writeln(`${Colors.bright}${Colors.cyan}Base64 Commands:${Colors.reset}`);
        term.writeln(`${Colors.green}  -e, --encode${Colors.reset}      Encode text to base64`);
        term.writeln(`${Colors.green}  -d, --decode${Colors.reset}      Decode base64 to text`);
        term.writeln(`${Colors.green}  -h, --help${Colors.reset}        Show this help message`);
        term.writeln(`${Colors.yellow}Examples:${Colors.reset}`);
        term.writeln(`  base64 -e "Hello World"`);
        term.writeln(`  base64 -d "SGVsbG8gV29ybGQ="`);
      } else {
        term.writeln(warning("Please provide valid options, use base64 -h for help"));
      }
      break;

    case 'gpt':
      if (args[0]) {
        term.writeln(info('Thinking...'));
        const data = await sendCommandToServer(command, args[0] + " No emojis, if my request seems inappropriate then respond 'Not answering that one boss!'");
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

    case 'count':
      if (args[0] === '--characters') {
        if (args[1] === '--spaces') {
          if (args[2]) {
            const text = args[2];
            const letters = text.length;
            term.writeln(success("Letters: " + String(letters)));
            break;
          } else {
            term.writeln(warning('Usage: count --characters --spaces <text>'));
            break;
          }
        }

        if (args[1]) {
          const text = args[1];
          let letters = 0;
          for (let i = 0; i < text.length; i++) {
            if (text[i] !== ' ') letters++;
          }
          term.writeln(success("Letters: " + String(letters)));
          break;
        }

        term.writeln(warning('Usage: count --characters [--spaces] <text>'));
        break;
      }

      if (args[0]) {
        const count = (s: string): number => s.trim().split(/\s+/).length;
        term.writeln(success("Words: " + String(count(args[0]))));
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
      if (!isPythonInitialised()) {
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

    case 'qr':
      if (args[0]) {
        let data = await createQR(args[0])

        if (data.startsWith('success')) {
          data = data.slice(7);

          await loadImage(data);
        } else {
          term.writeln(error(data));
        }
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
\x1b[36m║\x1b[0m                    \x1b[1m\x1b[32mWelcome to CLIvis Terminal v2.0\x1b[0m                        \x1b[36m║\x1b[0m
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

    if (domEvent.ctrlKey && domEvent.key === 'v') { //Catch this overal
      let clipboard: string = await navigator.clipboard.readText();
      insertChar(clipboard, term, getPrompt)
      return;
    }

    if (domEvent.ctrlKey && domEvent.key === 'c') { //Catch this overal
      commandBreak = true;
      setTimeout(() => {
          commandBreak = false;
      }, 50);
      return;
    }

    if (domEvent.key === 'Tab') {
      domEvent.preventDefault();
      handleAutocomplete();

    } else if (domEvent.key === 'ArrowLeft') {
      moveCursorLeft(term);

    } else if (domEvent.key === 'ArrowRight') {
      moveCursorRight(term);

    } else if (domEvent.key === 'Home' || (domEvent.ctrlKey && domEvent.key === 'a')) {
      moveCursorToStart(term, currentPath);

    } else if (domEvent.key === 'End' || (domEvent.ctrlKey && domEvent.key === 'e')) {
      moveCursorToEnd(term, currentPath);

    } else if (domEvent.key === 'Delete') {
      deleteCharForward(term, getPrompt);

    } else if (domEvent.key === 'ArrowUp') {
      if (commandHistory.length === 0) return;

      if (currentCommand < commandHistory.length) {
        currentCommand++;
      }

      const newBuffer = commandHistory[commandHistory.length - currentCommand] || '';
      setCommandBuffer(newBuffer);
      redrawCommandLine(term, getPrompt);

    } else if (domEvent.key === 'ArrowDown') {
      if (commandHistory.length === 0) return;

      if (currentCommand > 0) {
        currentCommand--;
        const newBuffer = currentCommand === 0 ? '' : commandHistory[commandHistory.length - currentCommand];
        setCommandBuffer(newBuffer);
      } else {
        setCommandBuffer('');
      }

      redrawCommandLine(term, getPrompt);

    } else if (domEvent.key === 'Enter') {
      const { commandBuffer } = getCommandLineState();
      if (commandBuffer.trim() !== '') {
        await processCommand(commandBuffer);
      }
      clearCommandBuffer();
      currentCommand = 0;
      term.write('\r\n' + getPrompt());

    } else if (domEvent.key === 'Backspace') {
      deleteChar(term, getPrompt);

    } else if (printable && key.length === 1) {
      insertChar(key, term, getPrompt);
    }
  });

}

async function waitForFontLoad(fontFamily: string): Promise<boolean> {
  if (!document.fonts) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 100);
    });
  }

  try {
    await document.fonts.load(`1em ${fontFamily}`);
    return document.fonts.check(`1em ${fontFamily}`);
  } catch (error) {
    console.warn(`Font loading failed for ${fontFamily}:`, error);
    return false;
  }
}

(window as any).interruptSleep = interruptSleep

document.addEventListener('DOMContentLoaded', async () => {
  const fontLoaded = await waitForFontLoad('fira-code');

  if (!fontLoaded) {
    console.log('Fira Code failed to load, defaulting to monospace, expect some weird stuff to happen :P');
  }

  term = new Terminal({
    convertEol: true,
    cursorBlink: true,
    fontFamily: fontLoaded ? "fira-code" : "monospace",
    //lineHeight: 1.2, //Idk it kinda just fixed itself?
    //letterSpacing: 0,
  });
  fitAddon = new FitAddon();
  imageAddon = new ImageAddon();

  setupTerminal();
  setupKeyHandle();

})