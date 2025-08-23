import express from 'express';
import cors from 'cors';
import path from 'path';
import https from 'https';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import YTDlpWrap from 'yt-dlp-wrap';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ytDlpWrap = new YTDlpWrap.default();

ytDlpWrap.setBinaryPath(path.join(__dirname, 'yt-dlp_linux'));

const app = express();
app.use(cors());
app.use(express.json());
const port = 3001;

const downloadedVideos = new Map();

app.use(express.static(path.join(__dirname, '../dist')));

function generateRandomFilename(extension = '.mp4') {
  return crypto.randomBytes(16).toString('hex') + extension;
}

function cleanupVideo(filename) {
  const videoInfo = downloadedVideos.get(filename);
  if (videoInfo) {
    try {
      if (fs.existsSync(videoInfo.filePath)) {
        fs.unlinkSync(videoInfo.filePath);
        console.log(`Deleted video: ${filename}`);
      }
    } catch (error) {
      console.error(`Error deleting video ${filename}:`, error);
    }
    
    if (videoInfo.deleteTimer) {
      clearTimeout(videoInfo.deleteTimer);
    }
    
    downloadedVideos.delete(filename);
  }
}

app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const videoInfo = downloadedVideos.get(filename);
  
  if (!videoInfo || !fs.existsSync(videoInfo.filePath)) {
    return res.status(404).json({ error: 'Video not found' });
  }
  
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  
  const fileStream = fs.createReadStream(videoInfo.filePath);
  fileStream.pipe(res);
  
  fileStream.on('end', () => {
    console.log(`Video ${filename} downloaded, scheduling cleanup...`);
    setTimeout(() => cleanupVideo(filename), 5000); // 5 second delay to ensure download completes
  });
  
  fileStream.on('error', (error) => {
    console.error(`Error streaming video ${filename}:`, error);
    res.status(500).json({ error: 'Error downloading video' });
  });
});

app.get('/videos', (req, res) => {
  const videos = Array.from(downloadedVideos.entries()).map(([filename, info]) => ({
    filename,
    downloadedAt: info.downloadedAt,
    fileExists: fs.existsSync(info.filePath)
  }));
  
  res.json({ videos });
});

app.delete('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  
  if (!downloadedVideos.has(filename)) {
    return res.status(404).json({ error: 'Video not found' });
  }
  
  cleanupVideo(filename);
  res.json({ message: `Video ${filename} deleted successfully` });
});

async function sendRequestRustful(url, method = "GET", ...args) {
  method = method.toUpperCase();
  try {
    const options = {
      method,
      headers: {
        'accept': 'application/json'
      }
    };

    if (method === 'POST') {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify({
        text: args[0],
        speaker: args[1]
      });
    }

    const response = await fetch(url, options);

    if (!response || !response.ok) {
      if (response.status === 404) {
        return [false, "404 - Not Found"]
      }
      console.log("Response not ok:", response);
      return [false, "Something failed with the API."];
    }

    if (method == "DELETE") {
      return [true]
    }

    const data = await response.json();

    return [true, data];
  } catch (err) {
    console.log("Fetch failed:",err);
    return [false, "Error fetching paste, API connection failed :<"];
  }
}

app.post('/command', async (req, res) => {
  const command = req.body?.command ?? req.query?.command;
  if (command === undefined) {
    return res.status(400).json({ error: "Yo who are you?" });
  }
  if (!command) return res.status(400).json({ error: 'Not a valid command !!!' });
  
  const args = req.body?.args ?? req.query?.args;
  let data
  let response
  let output = '';
  let resp
  let rustful = "https://rustful.baileygamesand.codes"
  switch (command.trim()) {
    case 'ping':
      output = 'No pong for you. (ping worked)';
      break;
    
    case 'pasteRetrieve':
      resp = await sendRequestRustful(`${rustful}/paste/${args[0]}`);
      if (resp[0]) {
        output = resp[1].text;
      } else {
        output = resp[1];
      }
      
      break;

    case 'pasteUpload':
      resp = await sendRequestRustful(`${rustful}/paste`, "POST", args[0])
      if (resp[0]) {
        output = `Paste uploaded successfully, paste code: ${resp[1].code}`
      } else {
        output = resp[1];
      }
      break;
    
    case 'pasteDelete':
      resp = await sendRequestRustful(`${rustful}/paste/${args[0]}`, "DELETE")
      if (resp[0]) {
        output = "paste successfully deleted!"
      } else {
        output = `Failed to delete paste.\r\n${resp[1]}\r\nIf the error is 404 that means the paste doesn't exist or already deleted!`
      }
      break;

    case 'randomQuote':
      resp = await sendRequestRustful(`${rustful}/quote`)
      if (resp[0]) {
        output = `Quote: ${resp[1].text}\r\nSpeaker: ${resp[1].speaker}`
      } else {
        output = resp[1]
      }
      break;
    
    case 'uploadQuote':
      resp = await sendRequestRustful(`${rustful}/quotes`, "POST", args[0], args[1])
      if (resp[0]) {
        output = `Quote uploaded successfully, quote id: ${resp[1].id}`
      } else {
        output = resp[1]
      }
      
      break;

    case 'idQuote':
      resp = await sendRequestRustful(`${rustful}/quotes/${args[0]}`);
      if (resp[0]) {
        output = `Quote: ${resp[1].text}\r\nSpeaker: ${resp[1].speaker}`
      } else {
        output = resp[1];
      }
      break;
    case 'cowsay':
      response = await fetch(`https://cowsay.morecode.org/say?message=${encodeURI(args[0])}&format=json`)
      
      if (!response || !response.ok) {
        output = "Something failed fetching cowsay :<";
        break;
      }

      data = await response.json();

      output = data.cow;
      break;

    case 'kanye':
      response = await fetch("https://api.kanye.rest");

      if (!response || !response.ok) {
        output = "Failed fetching kanye.rest API >:(";
        break;
      }

      data = await response.json();

      output = data.quote;

      break;

    case 'joke':
      response = await fetch("https://api.flik.host/joke")

      if (!response || !response.ok) {
        output = "Flikhost Failed! Angry face!";
        break;
      }

      data = await response.json()

      output = `${data.Question}\n${data.Answer}`
      break;

    case 'gpt':
      response = await fetch('https://ai.hackclub.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept' : "*/*"
        },
        body: JSON.stringify({
          messages: [{
            content: args[0],
            role: 'user'
          }]
        })
      })      
      if (!response || !response.ok) {
        output = "Hackclub API failed, heidi back at it >:("
        break;
      }

      data = await response.json()
      data = data.choices[0].message.content
      output = "success"+data.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      break;

    case 'passwdGen':
      console.log(args[0])
      response = await fetch(args[0]);

      if (!response || !response.ok) {
        console.log(response)
        output = "failure";
        break;
      }

      data = await response.json()

      output = "success"+data.password;

      break;

    case 'youtube':
      try {
        let url = args[0];
        if (!url.startsWith('https://')) {
          url = "https://youtube.com/watch?v=" + url;
        }

        let videoTitle = generateRandomFilename().replace('.mp4', '');


        const randomSuffix = crypto.randomBytes(4).toString('hex');
        const filename = `${videoTitle}_${randomSuffix}.mp4`;
        const filePath = path.join(__dirname, "videos", filename);

        await new Promise((resolve, reject) => {
          const child = ytDlpWrap.exec([
            url,
            '-f',
            'best',
            '-o',
            filePath,
          ]);

          child.on('error', (error) => {
            console.error('Download error:', error);
            output = `Error downloading video: ${error.message}`;
            reject(error);
          });

          child.on('close', (code) => {
            if (code === 0) {
              resolve();
            } else {
              console.log('Download failed with code:', code);
              reject(new Error(`yt-dlp exited with code ${code}`));
            }
          });
        });

        const deleteTimer = setTimeout(() => {
          cleanupVideo(filename);
        }, 15 * 60 * 1000);

        downloadedVideos.set(filename, {
          filePath,
          downloadedAt: new Date(),
          deleteTimer
        });
        
        output = [`successDownload finished! File download should start instantly! If not you can download from: https://clivis.baileygamesand.codes/download/${filename} Auto-deletion in 15 minutes or after download.`, filename];
      } catch (error) {
        console.error('YouTube download error:', error);
        output = `Error processing YouTube request: ${error.message}`;
      }
      break;
    default:
      output = `Unknown command: ${command} :<`;
  }

  res.json({ output });
});

// Check for SSL certificates
const sslPath = path.join(__dirname, '../ssl');
const keyPath = path.join(sslPath, 'key.pem');
const certPath = path.join(sslPath, 'cert.pem');

let useHttps = false;
let httpsOptions = {};

try {
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
    useHttps = true;
    console.log('SSL certificates found, starting HTTPS server...');
  } else {
    console.log('SSL certificates not found, starting HTTP server...');
  }
} catch (error) {
  console.log('Error reading SSL certificates, starting HTTP server...', error.message);
}

if (useHttps) {
  https.createServer(httpsOptions, app).listen(443, '0.0.0.0', () => {
    console.log('HTTPS Server running on https://0.0.0.0');
  });
} else {
  app.listen(port, 'localhost', () => console.log(`HTTP Server running on http://localhost:${port}`));
}