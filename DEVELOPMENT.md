# Development Guide

## Code Quality & Standards

This project uses a comprehensive code quality setup with ESLint, Prettier, and Husky to ensure consistent, high-quality code.

### 🛠️ Tools Setup

#### ESLint

- **Purpose**: Static code analysis and bug detection
- **Config**: `.eslintrc.json`
- **Rules**: TypeScript-focused with Electron environment support
- **Usage**:
  ```bash
  npm run lint        # Fix issues automatically
  npm run lint:check  # Check for issues without fixing
  ```

#### Prettier

- **Purpose**: Code formatting and style consistency
- **Config**: `.prettierrc`
- **Settings**: Single quotes, 2-space tabs, 100 character width
- **Usage**:
  ```bash
  npm run format        # Format all files
  npm run format:check  # Check formatting without fixing
  ```

#### Husky & lint-staged

- **Purpose**: Git hooks for pre-commit quality checks
- **Config**: `.husky/pre-commit` and `.lintstagedrc.json`
- **Features**: Runs only on staged files for performance

### 🚀 Pre-commit Process

When you commit code, the following automated checks run:

1. **📝 Lint & Format Staged Files**

   - ESLint fixes code issues
   - Prettier formats code style
   - Only processes files you've changed

2. **🔧 TypeScript Type Check**

   - Ensures no type errors
   - Validates against `tsconfig.json`

3. **🏗️ Build Validation**

   - Tests that code compiles successfully
   - Includes both main and native builds

4. **📝 Commit Message Validation**
   - Enforces conventional commit format
   - Examples: `feat: add new feature`, `fix: resolve bug`

### 📋 Commit Message Format

Use conventional commits for better changelog generation:

```
<type>[optional scope]: <description>

Examples:
feat: add user authentication
fix: resolve memory leak in renderer
docs: update API documentation
style: format code with prettier
refactor: reorganize component structure
perf: optimize native module performance
test: add unit tests for auth service
chore: update dependencies
build: update electron builder config
ci: add GitHub Actions workflow
```

### 🔧 Available Scripts

```bash
# Development
npm run dev                # Start development server
npm run dev:watch         # Start with file watching
npm run electron:dev      # Start Electron in development

# Building
npm run build             # Build TypeScript
npm run build:native      # Build native modules
npm run build:all         # Build everything
npm run type-check        # TypeScript type checking

# Code Quality
npm run lint              # Lint and fix issues
npm run lint:check        # Check linting without fixing
npm run format            # Format all files
npm run format:check      # Check formatting
npm run pre-commit        # Run all pre-commit checks manually

# Electron
npm run electron          # Run built app
npm run electron:enhanced # Run with native modules
npm run pack              # Package for distribution
npm run dist              # Create distributable
```

### 🚫 Bypassing Hooks (Not Recommended)

In rare emergency cases, you can skip pre-commit hooks:

```bash
git commit --no-verify -m "emergency fix"
```

**⚠️ Use sparingly!** This bypasses all quality checks.

### 🎯 IDE Integration

#### VS Code Extensions (Recommended)

- ESLint (`ms-vscode.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- TypeScript Importer (`pmneo.tsimporter`)

#### VS Code Settings

Add to your `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.organizeImports": true
}
```

### 🐛 Troubleshooting

#### Common Issues

1. **ESLint errors on commit**

   ```bash
   # Fix manually or run:
   npm run lint
   ```

2. **Prettier formatting conflicts**

   ```bash
   # Format files:
   npm run format
   ```

3. **TypeScript compilation errors**

   ```bash
   # Check types:
   npm run type-check
   ```

4. **Build failures**

   ```bash
   # Clean and rebuild:
   npm run clean
   npm run build:all
   ```

5. **Husky hooks not working**
   ```bash
   # Reinstall husky:
   npx husky install
   chmod +x .husky/pre-commit .husky/commit-msg
   ```

#### Performance Tips

- **lint-staged** only processes staged files for speed
- Use `npm run lint:check` for quick validation
- Run `npm run build` locally before pushing large changes

### 📁 File Structure

```
.
├── .eslintrc.json        # ESLint configuration
├── .prettierrc           # Prettier configuration
├── .prettierignore       # Files to ignore in formatting
├── .lintstagedrc.json    # lint-staged configuration
├── .husky/               # Git hooks
│   ├── pre-commit        # Pre-commit validation
│   └── commit-msg        # Commit message validation
├── src/                  # TypeScript source files
├── renderer/             # Electron renderer files
├── native/               # Native C++ modules
└── dist/                 # Built output
```

### 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes (hooks will validate automatically)
4. Commit using conventional format: `git commit -m "feat: your feature"`
5. Push and create a pull request

The pre-commit hooks ensure that all contributed code meets our quality standards automatically!
