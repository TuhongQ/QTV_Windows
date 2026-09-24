# MiBox OS for Windows

Windows desktop prototype for MiBox OS. The interface is designed for a 16:9 TV screen and supports mouse, touch, and keyboard remote-control navigation.

## Features

- TV-style home screen and channel browser
- M3U/M3U8 playlists, built-in language and category lists, and the Dongyubin community playlist bundle
- HLS playback, favorites, recent channels, search, and fullscreen controls
- Stream availability checks and hiding/restoring failed links
- Open local video files, import a local playlist, or play a direct HTTP(S) video URL

## Run from source

Requirements: Node.js 20 or newer and npm.

```powershell
npm ci
npm start
```

## Build a Windows portable app

```powershell
npm ci
npm run dist
```

The portable executable is written to `dist/` and is intentionally excluded from source control.

## Project layout

- `main.js`, `preload.js`: Electron process and secure app bridge
- `index.html`, `styles.css`, `renderer.js`: user interface and player controls
- `assets/`: application artwork
- `playlists/`: bundled M3U data used for first launch and offline browsing
- `package.json` and `package-lock.json`: dependencies and build configuration

## Stream and distribution notes

The application code is marked `UNLICENSED` in `package.json`; this repository does not grant permission to redistribute the software. Obtain an explicit software license from the owner before redistributing or incorporating it into a commercial product.

Playlist files contain third-party stream links and metadata. The fact that a URL is publicly reachable does not establish rights to rebroadcast, distribute, or use the content commercially. Review each provider's terms and obtain the necessary permissions before commercial distribution. Users can import their own authorized M3U playlists.
