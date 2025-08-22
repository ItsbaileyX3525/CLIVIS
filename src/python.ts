interface PyodideInterface {
  runPython: (code: string) => any;
}

let pyodide: PyodideInterface;
let pythonInitialised: boolean = false;

export async function initPython(): Promise<void> {
  pyodide = await (window as any).loadPyodide();
  pythonInitialised = true;
}

export async function runPython(code: string): Promise<string> {
  try {
    let result = pyodide.runPython(code);
    return String(result);
  } catch (err) {
    return String(err);
  }
}

export function isPythonInitialised(): boolean {
  return pythonInitialised;
}
