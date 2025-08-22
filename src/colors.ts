export const Colors = {
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

export function success(text: string): string {
  return `${Colors.brightGreen}${text}${Colors.reset}`;
}

export function error(text: string): string {
  return `${Colors.brightRed}${text}${Colors.reset}`;
}

export function warning(text: string): string {
  return `${Colors.brightYellow}${text}${Colors.reset}`;
}

export function info(text: string): string {
  return `${Colors.brightCyan}${text}${Colors.reset}`;
}

export function highlight(text: string): string {
  return `${Colors.bright}${Colors.cyan}${text}${Colors.reset}`;
}
