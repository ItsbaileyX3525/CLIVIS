import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
const port = 3001;

app.use(express.static(path.join(__dirname, '../dist')));

app.post('/command', async (req, res) => {
  const command = req.body?.command ?? req.query?.command;
  if (command === undefined) {
    return res.status(400).json({ error: "Yo who are you?" });
  }
  if (!command) return res.status(400).json({ error: 'Not a valid command !!!' });
  
  const arg = req.body?.arg ?? req.query?.arg;

  let output = '';
  switch (command.trim()) {
    case 'ping':
      output = 'No pong for you. (ping worked)';
      break;
    case 'pasteRetrieve':
      try {
        const response = await fetch(`https://rustful.baileygamesand.codes/paste/${arg}`);
        
        if (!response || !response.ok) {
          output = "Something failed with the API.";
          break;
        }

        const data = await response.json();

        output = data.text;
      } catch (err) {
        console.log(err)
        output = "Error fetching parse, API connection failed :<";
      }
      break;
    default:
      output = `Unknown command: ${command} :<`;
  }

  res.json({ output });
});

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));