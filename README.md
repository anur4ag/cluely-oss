# CluelyOSS - Intelligent Overlay Assistant

An intelligent overlay navigation bar for macOS that provides AI-powered assistance with screen capture and LLM integration. Stay productive with instant access to AI insights about your current screen content.

## ✨ Features

- **🔥 Always-on-top overlay** - Floating navigation bar that stays visible over all applications
- **🖼️ Screen capture integration** - Automatically captures what you're seeing for AI analysis
- **🤖 LLM-powered responses** - Get intelligent answers about your screen content
- **⌨️ Global keyboard shortcuts** - Control from anywhere on your system
- **🎨 Modern, translucent UI** - Beautiful native macOS design with blur effects
- **🚀 TypeScript & Electron** - Built with modern, type-safe technologies
- **🛡️ Privacy Mode** - Overlay excluded from screen sharing/recording (invisible to others)
- **🔒 Screen Capture Exclusion** - Native macOS integration to hide from Google Meet, Zoom, etc.

## 🎯 Use Cases

- **Code Review**: Get AI insights about code on your screen
- **Document Analysis**: Ask questions about PDFs, websites, or documents
- **Learning**: Get explanations about complex content you're viewing
- **Productivity**: Quick AI assistance without leaving your current app

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **macOS** (required for overlay functionality)
- **OpenAI API Key** (optional - app works with mock responses without it)

### Installation

```bash
# Clone or download this project
cd cluelyoss

# Install dependencies
npm install

# Build the application
npm run build

# Run the overlay app
npm run electron
```

### First Time Setup

1. **Copy environment file**:

   ```bash
   cp env.example .env
   ```

2. **Add your OpenAI API key** (optional):

   ```bash
   # Edit .env file
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Grant screen recording permissions**:
   - macOS will prompt for screen recording permissions
   - Go to System Preferences > Security & Privacy > Privacy > Screen Recording
   - Enable permissions for CluelyOSS Overlay

## ⌨️ Keyboard Shortcuts

| Shortcut    | Action                                      |
| ----------- | ------------------------------------------- |
| `⌘ + Space` | Toggle overlay visibility                   |
| `⌘ + Enter` | Capture screen and initiate AI chat         |
| `Enter`     | Send message to AI (without screen capture) |
| `Escape`    | Hide overlay                                |

## 🎮 How to Use

1. **Activate overlay**: Press `⌘ + Space` to show the floating overlay
2. **Ask questions**: Type any question and press `Enter`
3. **Screen analysis**: Press `⌘ + Enter` to capture your screen and ask AI about it
4. **View responses**: AI responses appear in the chat section below
5. **Hide overlay**: Press `Escape` or click away to hide

## 📁 Project Structure

```
├── src/
│   ├── main.ts           # Electron main process
│   ├── preload.ts        # Secure IPC bridge
│   ├── llm-service.ts    # AI/LLM integration
│   └── index.ts          # Original TypeScript entry
├── renderer/
│   ├── index.html        # Overlay UI
│   └── renderer.js       # Frontend logic
├── dist/                 # Compiled output
├── package.json          # Project configuration
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## 🔧 Development Scripts

| Command                     | Description                                  |
| --------------------------- | -------------------------------------------- |
| **Building**                |                                              |
| `npm run build`             | Compile TypeScript to JavaScript             |
| `npm run build:native`      | Build native modules for enhanced privacy    |
| `npm run build:all`         | Build everything (TypeScript + native)       |
| `npm run clean`             | Remove all build artifacts                   |
| `npm run type-check`        | Type check without building                  |
| **Running**                 |                                              |
| `npm run electron`          | Build and run the Electron app (basic)       |
| `npm run electron:enhanced` | Build and run with enhanced privacy features |
| `npm run electron:dev`      | Run in development mode                      |
| `npm run dev`               | Run the original TypeScript project          |
| `npm run dev:watch`         | Run with file watching                       |
| **Code Quality**            |                                              |
| `npm run lint`              | Fix linting issues automatically             |
| `npm run lint:check`        | Check for linting issues without fixing      |
| `npm run format`            | Format all files with Prettier               |
| `npm run format:check`      | Check code formatting without fixing         |
| `npm run pre-commit`        | Run all pre-commit checks manually           |

## 🤖 LLM Integration

The app supports OpenAI's GPT-4 Vision model for analyzing screen content:

### Supported Features

- **Text analysis** - Understand code, documents, and text content
- **Visual analysis** - Analyze images, charts, and UI elements
- **Context awareness** - Provide relevant insights based on what's visible
- **Smart responses** - Concise, actionable answers

### Configuration

```bash
# In your .env file
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4-vision-preview  # or gpt-4o
```

### Without API Key

The app works without an OpenAI API key and will provide mock responses to demonstrate functionality.

## 🔒 Privacy & Security

- **Screen capture** - Only captured when you explicitly request it (`⌘ + Enter`)
- **Data handling** - Screen data is sent directly to OpenAI API (not stored locally)
- **Secure IPC** - Context isolation and secure communication between processes
- **No tracking** - No analytics or user tracking
- **🛡️ Screen Sharing Privacy** - Overlay is excluded from screen capture applications
  - **Google Meet/Zoom safe** - Won't appear in video calls when sharing screen
  - **Recording protection** - Invisible to OBS, QuickTime, and other recording software
  - **Native macOS integration** - Uses NSWindowSharingNone for complete exclusion
  - **Cross-platform support** - Enhanced privacy on macOS, basic protection elsewhere

## 🏗️ Building for Distribution

```bash
# Build for current platform
npm run pack

# Build distributable
npm run dist
```

## 🐛 Troubleshooting

### Common Issues

**App won't start**:

- Check Node.js version (`node --version` should be v16+)
- Run `npm run build` first

**Screen capture not working**:

- Grant screen recording permissions in macOS System Preferences
- Restart the app after granting permissions

**AI responses not working**:

- Check your OpenAI API key in `.env` file
- Verify internet connection
- Check console for error messages

### Development Mode

Run with DevTools for debugging:

```bash
NODE_ENV=development npm run electron
```

## 🔧 Code Quality & Development Workflow

This project uses modern development tools to ensure code quality and consistency:

### 🛠️ Automated Quality Checks

- **ESLint** - Static code analysis and bug detection
- **Prettier** - Consistent code formatting
- **Husky** - Git hooks for pre-commit validation
- **TypeScript** - Strict type checking

### 🚀 Pre-commit Process

Every commit automatically runs:

1. **Linting & Formatting** (staged files only)
2. **TypeScript Type Checking**
3. **Build Validation** (including native modules)
4. **Commit Message Validation** (conventional commits)

### 📝 Development Commands

```bash
# Code Quality
npm run lint              # Fix linting issues
npm run format            # Format code
npm run type-check        # Check TypeScript types

# Manual pre-commit check
npm run pre-commit        # Run all quality checks
```

### 📋 Commit Message Format

Use conventional commits for better maintainability:

```bash
feat: add new feature
fix: resolve bug
docs: update documentation
style: format code
refactor: improve code structure
```

### 🎯 IDE Setup (Recommended)

**VS Code Extensions:**

- ESLint (`ms-vscode.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)

**VS Code Settings** (add to `.vscode/settings.json`):

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## 🤝 Contributing

This project follows strict TypeScript and code quality practices:

### Development Standards

- **No type assertions** (`as` keyword)
- **No `as unknown as` patterns**
- **Comprehensive error handling**
- **Modern ES2022 features**

### Contributing Process

1. **Fork** the repository
2. **Create feature branch**: `git checkout -b feat/your-feature`
3. **Make changes** (pre-commit hooks will validate automatically)
4. **Commit** using conventional format: `git commit -m "feat: your feature"`
5. **Push** and create a pull request

### 🐛 Common Issues & Solutions

**Pre-commit hook errors:**

```bash
# Fix linting issues
npm run lint

# Fix formatting issues
npm run format

# Emergency bypass (use sparingly)
git commit --no-verify -m "emergency fix"
```

**ESLint/Prettier conflicts:**

```bash
# Clean rebuild
npm run clean && npm run build:all

# Reinstall husky hooks
npx husky install && chmod +x .husky/pre-commit .husky/commit-msg
```

### Quality Assurance

- All code is automatically linted and formatted on commit
- Build validation ensures no compilation errors
- TypeScript strict mode enforces type safety
- Conventional commits enable automated changelog generation

### 📁 Configuration Files

```
├── .eslintrc.json        # Linting rules
├── .prettierrc           # Code formatting settings
├── .husky/pre-commit     # Git pre-commit hook
└── .lintstagedrc.json    # Staged files processing
```

## 📄 License

ISC License - Feel free to use and modify for your needs.

---

**Tip**: The overlay works best when you have specific questions about your screen content. Try asking "What is this code doing?" or "Summarize this document" while viewing relevant content.

Happy coding! 🚀
