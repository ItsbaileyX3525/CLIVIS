// Command line editing functionality for the terminal
let commandBuffer: string = '';
let cursorIndex: number = 0;

export interface CommandLineState {
  commandBuffer: string;
  cursorIndex: number;
}

export function getCommandLineState(): CommandLineState {
  return { commandBuffer, cursorIndex };
}

export function setCommandBuffer(buffer: string): void {
  commandBuffer = buffer;
  cursorIndex = buffer.length;
}

export function clearCommandBuffer(): void {
  commandBuffer = '';
  cursorIndex = 0;
}

function getPromptDisplayLength(currentPath: string): number {
  const promptWithoutAnsi = currentPath + ' $ ';
  return promptWithoutAnsi.length;
}

export function redrawCommandLine(term: any, getPrompt: () => string): void {
  term.write('\x1b[2K\x1b[G' + getPrompt() + commandBuffer);
  
  const promptLength = getPrompt().replace(/\x1b\[[0-9;]*m/g, '').length;
  const targetPosition = promptLength + cursorIndex;
  term.write(`\x1b[${targetPosition + 1}G`);
}

export function insertChar(char: string, term: any, getPrompt: () => string): void {
  const before = commandBuffer.slice(0, cursorIndex);
  const after = commandBuffer.slice(cursorIndex);
  commandBuffer = before + char + after;
  cursorIndex++;
  redrawCommandLine(term, getPrompt);
}

export function deleteChar(term: any, getPrompt: () => string): void {
  if (cursorIndex > 0) {
    const before = commandBuffer.slice(0, cursorIndex - 1);
    const after = commandBuffer.slice(cursorIndex);
    commandBuffer = before + after;
    cursorIndex--;
    redrawCommandLine(term, getPrompt);
  }
}

export function deleteCharForward(term: any, getPrompt: () => string): void {
  if (cursorIndex < commandBuffer.length) {
    const before = commandBuffer.slice(0, cursorIndex);
    const after = commandBuffer.slice(cursorIndex + 1);
    commandBuffer = before + after;
    redrawCommandLine(term, getPrompt);
  }
}

export function moveCursorLeft(term: any): void {
  if (cursorIndex > 0) {
    cursorIndex--;
    term.write('\x1b[D');
  }
}

export function moveCursorRight(term: any): void {
  if (cursorIndex < commandBuffer.length) {
    cursorIndex++;
    term.write('\x1b[C');
  }
}

export function moveCursorToStart(term: any, currentPath: string): void {
  cursorIndex = 0;
  const promptLength = getPromptDisplayLength(currentPath);
  term.write(`\x1b[${promptLength + 1}G`);
}

export function moveCursorToEnd(term: any, currentPath: string): void {
  cursorIndex = commandBuffer.length;
  const promptLength = getPromptDisplayLength(currentPath);
  term.write(`\x1b[${promptLength + cursorIndex + 1}G`);
}
