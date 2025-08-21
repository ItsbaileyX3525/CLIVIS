# CLIvis

CLIvis is a web-based CLI designed to. Built with Vite + TypeScript for the frontend (with Tailwindcss), and Node.js with Express for the backend!

## Overview

CLIvis allows users to interact with various APIs and perform basic command-line operations from any device with a web browser.

## Features

- **API Integration:** Connect and interact with both personal and external APIs directly from the CLI interface.
- **Basic CLI Commands:** Execute common shell-like commands for navigation and utility.
- **Modern Web Stack:** Built with Vite, TypeScript, and Tailwind CSS for a fast and responsive UI.
- **Node.js Backend:** Uses Express to handle command execution and API requests securely.
- **Graphics:**
Display images and videos (maybe) inside the CLI!

## Roadmap

The following features are planned or under consideration:

- **API Requests**
    - Personal APIs
        - [x] Rustful
        - [ ] Flikhost (potentially)
    - External APIs
        - [ ] Cowsay
        - [ ] Kanye.rest
        - [ ] Generic joke API
        - [ ] Translations
        - [ ] Additional APIs
- **Directory Management**
    - [ ] Base directory support
    - [ ] Directory exploration
    - [ ] Path handling
- **Command History**
    - [ ] Persistent and searchable command history
- **Graphical Support**
    - [ ] Visual enhancements and graphical output for supported commands
- **Games**
    - [ ] Terminal-based games (under consideration)

## Building locally

1. Clone the repo and extract it to your desired path
2. cd into the repo and run `npm install` to install the required deps.
3. run `npm run server` to start the node server, or `npm run dev` to start a development server
4. Open http://localhost:3001 (for the server) or http://localhost:5173 (for vite dev)

## Want to contribute

Then please do! I would love if you added your own features to the repo and I will happily review all sugestions! 