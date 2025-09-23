# Contributing to AutoMarkdown

Thank you for your interest in contributing to AutoMarkdown! We welcome contributions from everyone.

## Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/autoMarkdown.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes
6. Commit and push: `git commit -m "Add your feature" && git push origin feature/your-feature-name`
7. Create a pull request

## Development Setup

### Node.js Development
```bash
npm install
npm run build
npm run dev  # Watch mode
npm test
npm run lint
```

### Python Development
```bash
pip install -e .
pip install pytest flake8 black
pytest
flake8 automarkdown
black automarkdown
```

## Pull Request Guidelines

- Keep changes focused and atomic
- Add tests for new features
- Update documentation as needed
- Follow existing code style
- Write clear commit messages

## Bug Reports

When filing bug reports, please include:

- Operating system and version
- Node.js/Python version
- AutoMarkdown version
- Steps to reproduce
- Expected vs actual behavior
- Sample code/files if applicable

## Feature Requests

We love feature requests! Please include:

- Clear description of the feature
- Use case/motivation
- Example usage
- Any implementation ideas

## Code Style

### TypeScript/JavaScript
- Use TypeScript for type safety
- Follow existing ESLint configuration
- Use meaningful variable names
- Add JSDoc comments for public APIs

### Python
- Follow PEP 8
- Use type hints where possible
- Use descriptive variable names
- Add docstrings for public functions

## Testing

- Write tests for new features
- Ensure all tests pass before submitting
- Test on multiple platforms if possible
- Include edge cases in tests

## License

By contributing, you agree that your contributions will be licensed under the MIT License.