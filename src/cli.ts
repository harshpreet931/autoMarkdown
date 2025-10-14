#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { Logger } from './logger';
import AutoMarkdown from './index';
import { TokenCounter } from './tokenizer';

const program = new Command();

program
  .name('automarkdown')
  .description('Intelligently convert codebases into markdown for LLMs')
  .version('2.0.3');

program
  .argument('<path>', 'Path to the codebase to convert')
  .option('-o, --output <file>', 'Output file path (default: stdout)')
  .option('-f, --format <format>', 'Output format: markdown or json', 'markdown')
  .option('--include-hidden', 'Include hidden files and directories')
  .option('--max-size <size>', 'Maximum file size in bytes', '1048576')
  .option('--max-tokens <tokens>', 'Maximum tokens for LLM compatibility', '1000000')
  .option(
    '--exclude <patterns>',
    'Comma-separated exclude patterns',
    'node_modules/**,.git/**,dist/**,build/**'
  )
  .option('--include <patterns>', 'Comma-separated include patterns', '**/*')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--no-metadata', 'Exclude file metadata from output')
  .option('--no-ast-analysis', 'Disable AST-based importance scoring (not recommended)')
  .action(async (projectPath: string, options) => {
    try {
      // Validate input path
      // Set verbose mode
      Logger.setVerbose(options.verbose || false);

      if (!fs.existsSync(projectPath)) {
        Logger.error(`Path "${projectPath}" does not exist`);
        process.exit(1);
      }

      const stat = await fs.promises.stat(projectPath);
      if (!stat.isDirectory()) {
        Logger.error(`Path "${projectPath}" is not a directory`);
        process.exit(1);
      }

      Logger.info('Analyzing code structure...');

      if (options.astAnalysis === false) {
        Logger.warn('AST analysis disabled - file prioritization may be less accurate');
      }

      // Parse options
      const maxFileSize = parseInt(options.maxSize);
      if (isNaN(maxFileSize) || maxFileSize <= 0) {
        console.error(
          chalk.red(`Error: Invalid max-size "${options.maxSize}". Must be a positive number.`)
        );
        process.exit(1);
      }

      const maxTokens = parseInt(options.maxTokens);
      if (isNaN(maxTokens) || maxTokens <= 0) {
        console.error(
          chalk.red(`Error: Invalid max-tokens "${options.maxTokens}". Must be a positive number.`)
        );
        process.exit(1);
      }

      const conversionOptions = {
        includeHidden: options.includeHidden,
        maxFileSize,
        maxTokens,
        excludePatterns: options.exclude.split(',').map((p: string) => p.trim()),
        includePatterns: options.include.split(',').map((p: string) => p.trim()),
        outputFormat: options.format as 'markdown' | 'json',
        includeMetadata: options.metadata !== false,
        useASTAnalysis: options.astAnalysis !== false,
      };

      const autoMarkdown = new AutoMarkdown(conversionOptions);

      Logger.info('Understanding dependencies...');

      let output: string;
      if (options.format === 'json') {
        Logger.info('Optimizing for JSON format...');
        output = await autoMarkdown.convertToJson(projectPath);
      } else {
        Logger.info('Optimizing for LLMs...');
        output = await autoMarkdown.convertProject(projectPath);
      }

      // Output handling
      if (options.output) {
        // Ensure directory exists
        const outputDir = path.dirname(options.output);
        if (!fs.existsSync(outputDir)) {
          await fs.promises.mkdir(outputDir, { recursive: true });
        }
        await fs.promises.writeFile(options.output, output, 'utf-8');
        Logger.success(`Output saved to: ${options.output}`);
      } else {
        // Auto-create automarkdown folder and file
        const autoOutputDir = path.join(projectPath, 'automarkdown');
        const autoOutputFile = path.join(autoOutputDir, 'automarkdown.md');

        if (!fs.existsSync(autoOutputDir)) {
          await fs.promises.mkdir(autoOutputDir, { recursive: true });
        }

        await fs.promises.writeFile(autoOutputFile, output, 'utf-8');
        Logger.success(`Output automatically saved to: ${autoOutputFile}`);
      }

      // Stats and Token Analysis
      const lines = output.split('\n').length;
      const size = Buffer.byteLength(output, 'utf-8');
      Logger.info(`\nGenerated ${lines} lines (${(size / 1024).toFixed(2)} KB)`);

      // Token analysis
      const tokenAnalysis = TokenCounter.analyzeTokenUsage(output);
      Logger.info(TokenCounter.formatTokenAnalysis(tokenAnalysis));
    } catch (error) {
      Logger.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Additional commands
program
  .command('init')
  .description('Create a configuration file')
  .action(() => {
    const configContent = {
      includeHidden: false,
      maxFileSize: 1048576,
      excludePatterns: ['node_modules/**', '.git/**', 'dist/**', 'build/**', '*.log'],
      includePatterns: ['**/*'],
      outputFormat: 'markdown',
      prioritizeFiles: ['README.md', 'package.json', 'requirements.txt', 'main.py', 'index.js'],
      includeMetadata: true,
    };

    fs.writeFileSync('automarkdown.config.json', JSON.stringify(configContent, null, 2));
    console.log(chalk.green('Created automarkdown.config.json'));
  });

program
  .command('examples')
  .description('Show usage examples')
  .action(() => {
    console.log(chalk.blue('AutoMarkdown Usage Examples:\n'));

    const examples = [
      {
        title: 'Basic conversion',
        command: 'automarkdown ./my-project',
      },
      {
        title: 'Save to file',
        command: 'automarkdown ./my-project -o project-docs.md',
      },
      {
        title: 'JSON output',
        command: 'automarkdown ./my-project -f json -o project.json',
      },
      {
        title: 'Include hidden files',
        command: 'automarkdown ./my-project --include-hidden',
      },
      {
        title: 'Custom exclusions',
        command: 'automarkdown ./my-project --exclude "*.test.js,coverage/**"',
      },
      {
        title: 'Larger file limit',
        command: 'automarkdown ./my-project --max-size 2097152',
      },
      {
        title: 'Custom token limit for smaller LLMs',
        command: 'automarkdown ./my-project --max-tokens 100000',
      },
      {
        title: 'Disable AST analysis (faster but less accurate)',
        command: 'automarkdown ./my-project --no-ast-analysis',
      },
    ];

    examples.forEach((example) => {
      console.log(chalk.yellow(`${example.title}:`));
      console.log(chalk.gray(`  ${example.command}\n`));
    });
  });

if (process.argv.length === 2) {
  program.help();
}

program.parse();
