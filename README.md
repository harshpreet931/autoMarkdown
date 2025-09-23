# AutoMarkdown

> **Intelligently convert codebases into markdown for LLMs to process and provide optimal insights**

[![npm version](https://badge.fury.io/js/automarkdown.svg)](https://badge.fury.io/js/automarkdown)
[![PyPI version](https://badge.fury.io/py/automarkdown.svg)](https://badge.fury.io/py/automarkdown)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/harshpreet931/autoMarkdown?style=social)](https://github.com/harshpreet931/autoMarkdown)

AutoMarkdown is a powerful tool that converts entire codebases into well-structured markdown documents, making it easy for Large Language Models (LLMs) to understand and analyze your code. Perfect for getting comprehensive insights, code reviews, documentation generation, and architectural analysis from AI assistants.

## Features

- **Intelligent File Prioritization** - Automatically ranks files by importance (README, configs, entry points first)
- **Project Structure Visualization** - Creates a clear tree view of your codebase
- **Language Detection** - Supports 25+ programming languages with syntax highlighting
- **Highly Configurable** - Customize inclusion/exclusion patterns, file size limits, and more
- **Dual Platform Support** - Available as both NPX (Node.js) and pip (Python) packages
- **Metadata Rich** - Includes file statistics, language info, and importance scores
- **Gitignore Aware** - Respects your .gitignore files automatically
- **Multiple Output Formats** - Markdown or JSON output options

## Quick Start

### NPX (Node.js)

```bash
# Convert current directory
npx automarkdown .

# Convert specific project
npx automarkdown /path/to/project

# Save to file
npx automarkdown . -o my-project-docs.md

# JSON output
npx automarkdown . -f json -o project-data.json
```

### pip (Python)

```bash
# Install
pip install automarkdown

# Convert current directory
automarkdown convert .

# Convert specific project
automarkdown convert /path/to/project

# Save to file
automarkdown convert . -o my-project-docs.md

# JSON output
automarkdown convert . -f json -o project-data.json
```

## Installation

### Node.js/NPX
```bash
# No installation needed - use directly with npx
npx automarkdown --help

# Or install globally
npm install -g automarkdown
```

### Python/pip
```bash
pip install automarkdown
```

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

## Perfect for LLMs

AutoMarkdown creates markdown that's optimized for Large Language Models:

### Structured Output
- Clear section headers and navigation
- Table of contents with file links
- Hierarchical project structure
- Metadata for each file

### Intelligence Built-in
- Files ordered by importance
- Smart language detection
- Automatic gitignore respect
- Configurable exclusion patterns

### Rich Context
- Project statistics and summary
- File importance scores
- Language distribution
- Size and complexity metrics

## CLI Options

### NPX Version
```
automarkdown <path> [options]

Options:
  -o, --output <file>     Output file path (default: stdout)
  -f, --format <format>   Output format: markdown or json (default: markdown)
  --include-hidden        Include hidden files and directories
  --max-size <size>       Maximum file size in bytes (default: 1048576)
  --exclude <patterns>    Comma-separated exclude patterns
  --include <patterns>    Comma-separated include patterns
  --no-metadata          Exclude file metadata from output

Commands:
  init                    Create configuration file
  examples               Show usage examples
```

### Python Version
```
automarkdown convert <path> [options]

Options:
  -o, --output PATH       Output file path (default: stdout)
  -f, --format [markdown|json]  Output format (default: markdown)
  --include-hidden        Include hidden files and directories
  --max-size INTEGER      Maximum file size in bytes (default: 1048576)
  --exclude TEXT          Comma-separated exclude patterns
  --include TEXT          Comma-separated include patterns
  --no-metadata          Exclude file metadata from output

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
- [PyPI Package](https://pypi.org/project/automarkdown/)
- [Issue Tracker](https://github.com/harshpreet931/autoMarkdown/issues)

---

**Made by [harshpreet931](https://github.com/harshpreet931)**

*AutoMarkdown - Making codebases AI-friendly, one conversion at a time.*