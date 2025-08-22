const PROTOCOL: string = "http://";
const HOSTNAME: string = "localhost";
const PORT: string = ":3001";

export async function sendCommandToServer(cmd: string, ...args: string[]): Promise<string> {
  try {
    const response = await fetch(PROTOCOL + HOSTNAME + PORT + "/command", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: cmd, args: args }),
    });

    if (!response.ok) {
      return `Server error: ${response.status} ${response.statusText}`;
    }

    const data = await response.json();
    
    return data.output;
  } catch (err) {
    return "Cannot reach server :<";
  }
}
