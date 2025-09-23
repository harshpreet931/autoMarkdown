#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import AutoMarkdown from './index';

const program = new Command();

program
  .name('automarkdown')
  .description('Intelligently convert codebases into markdown for LLMs')
  .version('1.0.2');

program
  .argument('<path>', 'Path to the codebase to convert')
  .option('-o, --output <file>', 'Output file path (default: stdout)')
  .option('-f, --format <format>', 'Output format: markdown or json', 'markdown')
  .option('--include-hidden', 'Include hidden files and directories')
  .option('--max-size <size>', 'Maximum file size in bytes', '1048576')
  .option('--exclude <patterns>', 'Comma-separated exclude patterns', 'node_modules/**,.git/**,dist/**,build/**')
  .option('--include <patterns>', 'Comma-separated include patterns', '**/*')
  .option('--no-metadata', 'Exclude file metadata from output')
  .action(async (projectPath: string, options) => {
    try {
      // Validate input path
      if (!fs.existsSync(projectPath)) {
        console.error(chalk.red(`Error: Path "${projectPath}" does not exist`));
        process.exit(1);
      }

      const stat = await fs.promises.stat(projectPath);
      if (!stat.isDirectory()) {
        console.error(chalk.red(`Error: Path "${projectPath}" is not a directory`));
        process.exit(1);
      }

      console.log(chalk.blue('Analyzing codebase...'));

      // Parse options
      const conversionOptions = {
        includeHidden: options.includeHidden,
        maxFileSize: parseInt(options.maxSize),
        excludePatterns: options.exclude.split(',').map((p: string) => p.trim()),
        includePatterns: options.include.split(',').map((p: string) => p.trim()),
        outputFormat: options.format as 'markdown' | 'json',
        includeMetadata: options.metadata !== false
      };

      const autoMarkdown = new AutoMarkdown(conversionOptions);

      console.log(chalk.blue('Converting to markdown...'));

      let output: string;
      if (options.format === 'json') {
        output = await autoMarkdown.convertToJson(projectPath);
      } else {
        output = await autoMarkdown.convertProject(projectPath);
      }

      // Output handling
      if (options.output) {
        await fs.promises.writeFile(options.output, output, 'utf-8');
        console.log(chalk.green(`Output saved to: ${options.output}`));
      } else {
        console.log('\n' + chalk.gray('--- OUTPUT ---') + '\n');
        console.log(output);
      }

      // Stats
      const lines = output.split('\n').length;
      const size = Buffer.byteLength(output, 'utf-8');
      console.log(chalk.blue(`\nGenerated ${lines} lines (${(size / 1024).toFixed(2)} KB)`));
      
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
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
      excludePatterns: [
        "node_modules/**",
        ".git/**",
        "dist/**",
        "build/**",
        "*.log"
      ],
      includePatterns: ["**/*"],
      outputFormat: "markdown",
      prioritizeFiles: [
        "README.md",
        "package.json",
        "requirements.txt",
        "main.py",
        "index.js"
      ],
      includeMetadata: true
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
        command: 'automarkdown ./my-project'
      },
      {
        title: 'Save to file',
        command: 'automarkdown ./my-project -o project-docs.md'
      },
      {
        title: 'JSON output',
        command: 'automarkdown ./my-project -f json -o project.json'
      },
      {
        title: 'Include hidden files',
        command: 'automarkdown ./my-project --include-hidden'
      },
      {
        title: 'Custom exclusions',
        command: 'automarkdown ./my-project --exclude "*.test.js,coverage/**"'
      },
      {
        title: 'Larger file limit',
        command: 'automarkdown ./my-project --max-size 2097152'
      }
    ];

    examples.forEach(example => {
      console.log(chalk.yellow(`${example.title}:`));
      console.log(chalk.gray(`  ${example.command}\n`));
    });
  });

if (process.argv.length === 2) {
  program.help();
}

program.parse();