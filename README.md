# ⚡ CrispCompress PRO

> **Privacy-First, 100% Client-Side Media Compression, Conversion & Resizing Engine**

CrispCompress PRO is a state-of-the-art web application built to compress, convert, and resize images and videos directly in your browser. Powered by **React 19**, **TypeScript**, **Tailwind CSS v4**, **Vite**, and **WebAssembly (FFmpeg WASM)**, CrispCompress PRO performs heavy media processing completely client-side. Your files never leave your device, guaranteeing total data privacy and ultra-fast processing without server upload bottlenecks.

---

## ✨ Key Features

### 🔒 100% Client-Side & Privacy-First
- **Zero Server Uploads**: All video transcoding and image optimization happen locally inside your browser using WebAssembly (WASM) and the HTML5 Canvas API.
- **Data Protection**: Sensitive photos and videos remain strictly confidential on your machine.

### 🎥 Powerful Video Transcoding & Compression
- **Multi-Format Support**: Process MP4, MOV, WebM, and MKV video files.
- **FFmpeg WASM Engine**: Client-side video encoding powered by `@ffmpeg/ffmpeg` with multi-threading / `SharedArrayBuffer` support.
- **Smart Presets**:
  - **Balanced Quality**: Optimal compression ratio preserving high visual fidelity.
  - **Maximum Video Shrink**: Target small file sizes ideal for Discord, email attachments, or messaging apps.
  - **Transcoding**: Seamlessly convert MOV to MP4, WebM (VP9), or MKV to universal formats.

### 🖼️ Next-Gen Image Optimization & Resizing
- **Format Conversion**: Convert legacy images to next-gen WebP, standard JPEG, or transparent PNG.
- **Quality Control**: Custom compression sliders to fine-tune quality vs file size reduction.
- **Social Media & Display Presets**:
  - **Instagram Square** (`1080 × 1080 px`)
  - **Instagram Story / Reels / Shorts** (`1080 × 1920 px`)
  - **YouTube Thumbnail** (`1280 × 720 px`)
- **Custom Scaling**: Percentage-based scale down (e.g. 50%) or custom dimension resizing with aspect ratio preservation.

### 🔍 Interactive Visual Comparison & Analytics
- **Before vs. After Split-Slider**: Compare original vs compressed media side-by-side in real time.
- **Byte Metrics & Savings**: Instant readout of file size reduction, bytes saved, and savings percentage (e.g., `-65.4%`).

### 📦 Batch Queue Management & ZIP Packaging
- **Batch Processing**: Queue multiple files and apply global presets or individual item adjustments.
- **ZIP Export**: Download all compressed media files in a single `.zip` archive via `JSZip`.

### 🚀 Developer & Demo Friendly
- **Built-in Sample Generator**: Load high-resolution 2K synthetic test media with a single click to try all features without uploading your own files.
- **Dark & Light Mode**: Seamless dark/light theme switching with glassmorphism design aesthetic.

---

## 🛠️ Technology Stack

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [React 19](https://react.dev/) | Modern UI component rendering |
| **Language** | [TypeScript 6](https://www.typescriptlang.org/) | Type-safe application logic |
| **Build System** | [Vite 8](https://vitejs.dev/) | High-performance frontend toolchain |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern utility-first CSS engine |
| **Video Engine** | [FFmpeg WASM](https://ffmpegwasm.netlify.app/) | Browser-based FFmpeg compilation via WebAssembly |
| **Packaging** | [JSZip](https://stuk.github.io/jszip/) | In-memory ZIP archive generation |
| **Icons & FX** | [Lucide React](https://lucide.dev/) / [Canvas Confetti](https://github.com/catdad/canvas-confetti) | UI icons and celebratory micro-interactions |
| **Linting** | [Oxlint](https://oxc.rs/) | High-speed JavaScript/TypeScript linter |
| **Containerization** | [Docker](https://www.docker.com/) / [Nginx](https://nginx.org/) | Multi-stage build container with COOP/COEP header support |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v20.0.0 or higher recommended)
- `npm` (v10.0.0 or higher)

### Installation & Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/compressor.git
   cd compressor
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:8999`.

> ⚠️ **Important Note on SharedArrayBuffer & Security Headers**:
> FFmpeg WASM relies on multi-threading via `SharedArrayBuffer`. Browsers require Cross-Origin Isolation headers for security.
> The Vite dev server is pre-configured in [`vite.config.ts`](file:///d:/antigravity%20projects/compressor/vite.config.ts) with:
> - `Cross-Origin-Opener-Policy: same-origin`
> - `Cross-Origin-Embedder-Policy: credentialless`

---

## 📜 Available Scripts

In the project directory, you can run:

| Command | Action |
| :--- | :--- |
| `npm run dev` | Launches Vite local dev server with HMR at `http://localhost:8999` |
| `npm run build` | Compiles TypeScript and builds production artifacts to `/dist` |
| `npm run lint` | Runs `oxlint` for fast static code analysis |
| `npm run preview` | Previews the production build locally |

---

## 🐳 Docker Deployment

CrispCompress PRO includes a multi-stage `Dockerfile` and `docker-compose.yml` pre-configured with Nginx to deliver production assets alongside required Cross-Origin Isolation headers.

### Using Docker Compose (Recommended)

Run the containerized application on port `8099`:

```bash
docker-compose up -d --build
```

Access the application in your browser at `http://localhost:8099`.

### Using Docker Directly

```bash
# Build Docker image
docker build -t crispcompress-pro .

# Run container
docker run -d -p 8998:8998 crispcompress-pro
```

Access the application at `http://localhost:8998`.

---

## 📁 Directory Structure

```text
compressor/
├── .dockerignore
├── .gitignore
├── .oxlintrc.json          # Oxlint configuration
├── Dockerfile              # Multi-stage Node build & Nginx deployment
├── docker-compose.yml      # Docker compose configuration
├── index.html              # HTML entry point
├── nginx.conf              # Nginx server config with COOP/COEP headers
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts          # Vite configuration with headers & FFmpeg optimizeDeps
├── public/                 # Static assets & logos
└── src/
    ├── App.tsx             # Root state management & layout
    ├── App.css
    ├── index.css           # Tailwind CSS directives
    ├── main.tsx            # Application entry point
    ├── components/         # Modular UI Components
    │   ├── BatchToolbar.tsx         # Global batch queue actions & stats
    │   ├── ComparisonModal.tsx      # Split-screen image/video visual comparison
    │   ├── Header.tsx               # Brand header, theme switcher & nav
    │   ├── MediaCard.tsx            # Individual item control card & metrics
    │   ├── ToastNotification.tsx   # Floating system alert toasts
    │   ├── ToolWorkspaceHeader.tsx # Active tool title & switch back button
    │   ├── ToolsHub.tsx             # Filterable grid of all media tool presets
    │   └── UploadZone.tsx           # Drag & drop upload area with format badges
    ├── types/
    │   └── media.ts                 # TypeScript interfaces for media items & settings
    └── utils/
        ├── formatHelpers.ts         # Byte formatting & extension parsers
        ├── imageProcessor.ts        # HTML5 Canvas image compression & resizing
        ├── sampleMedia.ts           # Synthetic 2K test image generator
        ├── videoProcessor.ts        # FFmpeg WASM initialization & transcoding
        └── zipPackager.ts           # JSZip batch download archive generator
```

---

## 📄 License & Copyright

Copyright © 2026 **UG_SIDHARTH**. All rights reserved.

Distributed under the MIT License. See [`LICENSE`](file:///d:/antigravity%20projects/compressor/LICENSE) for more information.

