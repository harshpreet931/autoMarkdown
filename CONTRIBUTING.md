# Contributing to AutoMarkdown

Thanks for your interest in contributing to AutoMarkdown! We welcome all contributions that help make this tool better for developers working with AI assistants.

## Hacktoberfest

This repository participates in Hacktoberfest! Look for issues labeled `hacktoberfest`, `good first issue`, or `help wanted` to get started.

## Quick Start

1. **Fork and clone the repository**
   ```bash
   git clone git@github.com:your-username/autoMarkdown.git
   cd autoMarkdown
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   ```

5. **Test the CLI locally**
   ```bash
   node dist/cli.js . --help
   ```

## Contributing Guidelines

### Before You Start
- Look for issues labeled `hacktoberfest`, `good first issue`, or `help wanted`
- Comment on the issue to let others know you're working on it
- For new features, please open an issue first to discuss the approach

### Pull Request Process
1. **Work on a single issue per PR** - keep changes focused and reviewable
2. **Use descriptive branch names**: `fix/parser-bug` or `feat/output-styling`
3. **Write clear commit messages** that explain what and why
4. **Link the issue in your PR description**: `Fixes #123` or `Closes #456`
5. **Ensure all tests pass** and the build succeeds:
   - Run `npm run format:check` to verify code formatting
   - Run `npm run lint` to check for code quality issues
   - Run `npm test` to run the test suite
   - Verify that GitHub Actions CI passes
6. **Update documentation** if you're adding new features

### Code Style & Development
- Follow existing TypeScript/JavaScript conventions
- Use meaningful variable and function names
- Add JSDoc comments for new public methods
- Ensure TypeScript compilation passes with no errors
- Run `npm run format` before committing to ensure consistent style
- Run `npm run lint` to check for potential issues
- Use the `--verbose` flag when testing locally for detailed logging
- Test changes with the full CI pipeline locally
- Create or update `.automarkdownignore` file as needed for new file types

### Types of Contributions We Welcome

**Bug Fixes**
- Parser improvements for different file types
- CLI option handling
- Output formatting issues

**Features**
- New language support for AST analysis
- Output customization options
- Performance optimizations
- Integration improvements

**Documentation**
- README improvements
- Code examples
- Usage guides
- JSDoc comments

**Testing**
- Unit tests for core functionality
- Integration tests for CLI
- Performance benchmarks

**Examples & Demos**
- Sample projects showing different use cases
- Integration examples with popular frameworks

## Issue Labels

- `hacktoberfest` - Ready for Hacktoberfest contributors
- `good first issue` - Perfect for newcomers
- `help wanted` - We'd love community help on this
- `bug` - Something isn't working
- `enhancement` - New feature or improvement
- `documentation` - Improvements to docs
- `performance` - Speed or efficiency improvements

## Recognition

All contributors will be:
- Added to the contributors list
- Mentioned in release notes for their contributions
- Eligible for Hacktoberfest completion (during October)

## Review Process

Maintainers accept PRs by:
- Merging them
- Adding the `hacktoberfest-accepted` label
- Giving an approving review

We aim to review PRs within 48 hours during Hacktoberfest.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

## Need Help?

- Check existing issues and discussions
- Join our community discussions
- Tag maintainers in your issue for guidance

## Thank You

Every contribution makes AutoMarkdown better for developers worldwide. Whether you fix a typo or add a major feature, your help is valued and appreciated!

---

Happy coding!