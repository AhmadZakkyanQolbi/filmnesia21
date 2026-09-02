# cine·scope

Minimal movie & TV streaming site built with React + Vite.

## Stack
- **React 18** + **Vite**
- **TMDB API** — movie/show metadata, posters, ratings
- **CodeSpecters Embed API** — streaming player

## Setup

```bash
npm install
npm run dev
```

## Configuration

Edit `src/lib/api.js` to swap in your own keys:

```js
export const TMDB_KEY = 'your_tmdb_api_key'
export const EMBED_API_KEY = 'your_nextstream_key'
```

Get a free TMDB key at https://www.themoviedb.org/settings/api

## Project Structure

```
src/
├── lib/
│   └── api.js          # TMDB + embed URL helpers
├── components/
│   ├── MediaCard.jsx   # Single movie/show card
│   ├── MediaCard.module.css
│   ├── MediaGrid.jsx   # Responsive card grid with skeleton loading
│   ├── MediaGrid.module.css
│   ├── Player.jsx      # Embed iframe + now-playing info
│   └── Player.module.css
├── pages/
│   ├── Movies.jsx      # Search + trending movies
│   ├── Movies.module.css
│   ├── TV.jsx          # Search + season/episode picker
│   └── TV.module.css
├── App.jsx             # Header + tab routing
├── App.module.css
├── main.jsx
└── index.css           # CSS variables + global reset
```

## Features
- Trending movies & TV shows on load
- Live search via TMDB
- Click to play any title in the embed player
- TV: select a show, pick season & episode, hit Play
- Skeleton loading states
- Fully responsive
