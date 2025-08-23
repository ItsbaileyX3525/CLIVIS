# CLIvis

CLIvis is a web-based CLI designed to. Built with Vite + TypeScript for the frontend (with Tailwindcss), and Node.js with Express for the backend!

## Overview

CLIvis allows users to interact with various APIs and perform basic command-line operations from any device with a web browser.

## testing out some features

### GUI Games!

CLIvis offers many features for you to test out, some cool ones include game exeuction, by going to /games (use cd) and running "./susClicker.AppImage" you can run GUI games! Once finished you can press "Control + C" to return to the shell!

### APIs

CLIvis has many commands built-in for interacting with APIs from across the web, for example 'gpt' uses the ai.hackclub.com API to make a request to an LLM, more API commands include; joke, quote, paste, cowsay, kanye and more!

### Other cool terminal features

CLIvis supports using TAB autocomplete so that you dont have to write out the entire command that you want to write, you can also scroll through your command history by using the up and down arrow and if you want to edit the line your own you can use the left and right arrows to navigate!

Finally for cool terminal features there is a fuuncitonal filesystem where you can remove directories, create new ones, explore them and create files! With touch, using cat to read and use echo commands to append or overwrite text to the files.

### Python 

As python has recently moved over to using cython that means the interpreter can be built to WASM which allows a python env inside the browser itself which means you can run python code here too!

You can create your own python code using echo or by appending "-c" after python to run code on the go OR if you just wanna test the feature if you navigate to /home/baile/Downloads/ there is a file called fun.py which runs a simple python range loop 10 times, outputting each increment! (Use cat to see the code in fun.py)

## Features

- **API Integration:** Connect and interact with both personal and external APIs directly from the CLI interface.
- **Basic CLI Commands:** Execute common shell-like commands for navigation and utility.
- **Modern Web Stack:** Built with Vite, TypeScript, and Tailwind CSS for a fast and responsive UI.
- **Node.js Backend:** Uses Express to handle command execution and API requests securely.
- **Graphics:**
Display images and videos (maybe) inside the CLI!

## Roadmap

The following features are planned or under consideration:

### Ship 2

- **Utilities**
    - [x] Youtube video downloader
    - [ ] Weather API integration
    - [ ] QR code generator
    - [ ] ASCII art generator
- **Terminal Enhancements**
    - [x] Add Control + V support

More to be added!

### Ship 1

- **API Requests**
    - [x] Personal APIs
        - [x] Rustful
        - [x] Flikhost (potentially)
    - [x] External APIs
        - [x] Cowsay
        - [x] Kanye.rest
        - [x] Generic joke API
        ~~- [ ] Translations~~ (Google bein a beotch)
        - [ ] Additional APIs
- **Directory Management**
    - [x] Base directory support
    - [x] Directory exploration
    - [x] Path handling
    - [x] Add autocomplete
- **Command History**
    - [x] Persistent and searchable command history
    - [x] Navigate current input with left and right arrow keys
- **Graphical Support**
    - [x] Visual enhancements and graphical output for supported commands
    - [x] Make the terminal amazing with colours
- **Games**
    - [ ] Terminal-based games (future addition)
    - [x] GUI-based games (maybe)

## Building locally

1. Clone the repo and extract it to your desired path
2. cd into the repo and run `npm install` to install the required deps.
3. run `npm run server` to start the node server, or `npm run dev` to start a development server
4. Open http://localhost:3001 (for the server) or http://localhost:5173 (for vite dev)

## Want to contribute

Then please do! I would love if you added your own features to the repo and I will happily review all sugestions! 