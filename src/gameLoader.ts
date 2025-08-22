// Game loading functionality for the terminal
let controller: AbortController;

export function interruptSleep(): void {
  if (controller) {
    controller.abort();
  }
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

export async function loadGame(game: string): Promise<void> {
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
    case 'solar':
      iframe.src = '/games/solar/index.html';
      break;
    case '':
      break;
    default:
      break;
  }
  
  document.body.appendChild(iframe);

  await sleep(999999999, controller.signal).catch(console.error);

  iframe.remove();
}
