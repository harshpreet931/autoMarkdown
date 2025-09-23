# AutoMarkdown

> **Intelligently convert codebases into markdown for LLMs to process and provide optimal insights**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/harshpreet931/autoMarkdown?style=social)](https://github.com/harshpreet931/autoMarkdown)

AutoMarkdown is a powerful NPX tool that converts entire codebases into well-structured markdown documents, making it easy for Large Language Models (LLMs) to understand and analyze your code. Perfect for getting comprehensive insights, code reviews, documentation generation, and architectural analysis from AI assistants.

## Key Features

### AI-Optimized Output
- **Token Count Analysis** - Shows estimated tokens and LLM compatibility (GPT-5, Claude, Gemini, Grok, etc.)
- **Smart Exclusions** - Automatically filters out binary files, lock files, and generated content
- **LLM Recommendations** - Suggests optimal usage for different AI models

### Auto-Organization
- **Automatic Folder Creation** - Creates `automarkdown/automarkdown.md` by default
- **Intelligent File Prioritization** - Ranks files by importance (README, configs, entry points first)
- **Project Structure Visualization** - Creates clear tree view of your codebase

### Smart Processing
- **Language Detection** - Supports 25+ programming languages with syntax highlighting
- **Advanced Exclusions** - Filters lock files, images, videos, documents, fonts, and executables
- **Gitignore Aware** - Respects your .gitignore files automatically
- **Configurable Limits** - Custom file size limits and inclusion/exclusion patterns

### Rich Output
- **Multiple Formats** - Markdown or JSON output options
- **Metadata Rich** - File statistics, language info, and importance scores
- **Token Estimates** - Real-time compatibility checking with popular LLMs

## Quick Start

### Simple Usage (Auto-creates `automarkdown/automarkdown.md`)

```bash
# Convert current directory - creates automarkdown/automarkdown.md automatically
npx automarkdown .

# Convert specific project
npx automarkdown /path/to/project

# Get help and see all options
npx automarkdown --help
```

### Advanced Usage

```bash
# Save to custom file
npx automarkdown . -o my-project-docs.md

# JSON output for programmatic use
npx automarkdown . -f json -o project-data.json

# Include hidden files
npx automarkdown . --include-hidden

# Custom exclusions (beyond smart defaults)
npx automarkdown . --exclude "*.test.js,coverage/**"
```

### NEW: Token Analysis Output

```
Token Analysis:
   Estimated tokens: 11,782

Compatible LLMs (11):
   • Gemini 2.5 Pro (Google) - 1% of limit
   • GPT-5 (OpenAI) - 3% of limit
   • Claude Opus 4.1 (Anthropic) - 6% of limit
   • Claude Sonnet 4 (Anthropic) - 6% of limit
   • Grok-4 (xAI) - 6% of limit
   • ...and 6 more

Recommendations:
   Good compatibility with most popular LLMs!
   Small codebase - optimal for all LLMs
```

## Installation

### NPX (Recommended - No Installation Required)
```bash
# Use directly without installation
npx automarkdown --help

# Or install globally for faster subsequent runs
npm install -g automarkdown
```

**Requirements:** Node.js 18+ (most systems have this already)

## Usage Examples

### Basic Usage

```bash
# Analyze current project
automarkdown .

# Analyze specific directory
automarkdown /Users/john/my-awesome-project

# Save output to file
automarkdown . --output project-analysis.md
```

### Advanced Configuration

```bash
# Include hidden files
automarkdown . --include-hidden

# Custom file size limit (2MB)
automarkdown . --max-size 2097152

# Custom exclude patterns
automarkdown . --exclude "*.test.js,coverage/**,docs/**"

# Custom include patterns
automarkdown . --include "src/**,lib/**,*.md"

# JSON output for programmatic use
automarkdown . --format json --output project.json
```

### Configuration File

Create `automarkdown.config.json`:

```json
{
  \"include_hidden\": false,
  \"max_file_size\": 1048576,
  \"exclude_patterns\": [
    \"node_modules/**\",
    \".git/**\",
    \"dist/**\",
    \"build/**\",
    \"*.log\",
    \"coverage/**\"
  ],
  \"include_patterns\": [\"**/*\"],
  \"output_format\": \"markdown\",
  \"prioritize_files\": [
    \"README.md\",
    \"package.json\",
    \"requirements.txt\",
    \"main.py\",
    \"index.js\"
  ],
  \"include_metadata\": true
}
```

## What Makes AutoMarkdown Special

### AI-First Design
AutoMarkdown is built specifically for LLM consumption with token-aware output, smart filtering, and compatibility analysis across all major AI models.

### Zero Configuration
Works out of the box with intelligent defaults. Just run `npx automarkdown .` and get perfectly formatted markdown in seconds.

### Production Ready
Handles codebases of any size with automatic file filtering, importance ranking, and clean organizational structure.

## CLI Options

```
automarkdown <path> [options]

Options:
  -o, --output <file>     Output file path (default: auto-creates automarkdown/automarkdown.md)
  -f, --format <format>   Output format: markdown or json (default: markdown)
  --include-hidden        Include hidden files and directories
  --max-size <size>       Maximum file size in bytes (default: 1048576)
  --exclude <patterns>    Comma-separated exclude patterns (beyond smart defaults)
  --include <patterns>    Comma-separated include patterns
  --no-metadata          Exclude file metadata from output

Smart Defaults Excluded:
  Lock files: package-lock.json, yarn.lock, Cargo.lock, etc.
  Binary files: images, videos, fonts, executables, archives
  Generated: node_modules, dist, build, .git, automarkdown folders

Commands:
  init                    Create configuration file
  examples               Show usage examples
```


## Example Output

```markdown
# MyProject - Codebase Documentation

> Generated by autoMarkdown - Intelligent codebase to markdown converter

## Table of Contents
- [Project Summary](#project-summary)
- [Project Structure](#project-structure)
- [File Contents](#file-contents)
  - [package.json](#file-1-package-json)
  - [src/index.js](#file-2-src-index-js)
  - [README.md](#file-3-readme-md)

## Project Summary
Project contains 15 files in 3 different languages (javascript, markdown, json). 
Total size: 45.67 KB.

### Key Statistics
- **Total Files**: 15
- **Languages**: javascript, markdown, json
- **Total Size**: 45.67 KB
- **Most Important Files**: package.json, src/index.js, README.md

## Project Structure
```
├── MyProject
│   ├── package.json
│   ├── README.md
│   └── src
│       ├── index.js
│       └── utils.js
```

## File Contents

### File 1: `package.json`
**Language**: json | **Size**: 456 bytes | **Importance**: 8.5/10

```json
{
  \"name\": \"my-project\",
  \"version\": \"1.0.0\"
}
```
```

## Supported Languages

AutoMarkdown intelligently detects and highlights 25+ programming languages:

- **Web**: JavaScript, TypeScript, HTML, CSS, SCSS, Vue, Svelte
- **Backend**: Python, Java, C/C++, C#, Go, Rust, PHP, Ruby
- **Mobile**: Swift, Kotlin, Scala
- **Shell**: Bash, Zsh, Fish, PowerShell
- **Data**: SQL, JSON, YAML, TOML, XML
- **Docs**: Markdown, Text
- **Config**: Dockerfile, INI files

## Use Cases

### AI Code Reviews
```bash
automarkdown . -o codebase.md
# Share codebase.md with Claude, GPT-4, or other LLMs for comprehensive code review
```

### Documentation Generation
```bash
automarkdown . --exclude \"**/*.test.*,docs/**\" -o architecture-overview.md
# Generate clean architectural documentation
```

### Legacy Code Analysis
```bash
automarkdown /path/to/legacy-project --include-hidden -o legacy-analysis.md
# Get AI insights on complex legacy codebases
```

### Project Insights
```bash
automarkdown . -f json -o project-data.json
# Programmatic analysis of codebase structure and metrics
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to all contributors who help make AutoMarkdown better
- Inspired by the need for better AI-codebase interaction
- Built with love for the developer community

## Links

- [GitHub Repository](https://github.com/harshpreet931/autoMarkdown)
- [NPM Package](https://www.npmjs.com/package/automarkdown)
- [Issue Tracker](https://github.com/harshpreet931/autoMarkdown/issues)

---

**Made by [harshpreet931](https://github.com/harshpreet931)**

*AutoMarkdown - Making codebases AI-friendly, one conversion at a time.*