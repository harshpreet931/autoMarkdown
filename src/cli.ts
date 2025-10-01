#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import AutoMarkdown from './index';
import { TokenCounter } from './tokenizer';

const program = new Command();

function loadConfig(): Partial<any> {
  const configFiles = ['automarkdown.config.json', '.automarkdownrc.json', '.automarkdownrc'];
  for (const configFile of configFiles) {
    if (fs.existsSync(configFile)) {
      try {
        const configContent = fs.readFileSync(configFile, 'utf-8');
        const config = JSON.parse(configContent);
        console.log(chalk.blue(`Loaded configuration from: ${configFile}`));
        return config;
      } catch (error) {
        console.warn(chalk.yellow(`Warning: Could not parse config file ${configFile}: ${error}`));
      }
    }
  }
  return {};
}

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
  .option('--exclude <patterns>', 'Comma-separated exclude patterns', 'node_modules/**,.git/**,dist/**,build/**')
  .option('--include <patterns>', 'Comma-separated include patterns', '**/*')
  .option('--no-metadata', 'Exclude file metadata from output')
  .option('--no-ast-analysis', 'Disable AST-based importance scoring (not recommended)')
  .option('--header-level <level>', 'Header level for main title (1-6)', '1')
  .option('--section-level <level>', 'Header level for sections (1-6)', '2')
  .option('--file-level <level>', 'Header level for file titles (1-6)', '3')
  .option('--toc-bullet <bullet>', 'Bullet style for table of contents', '-')
  .option('--structure-bullet <bullet>', 'Bullet style for project structure', '├──')
  .option('--inline-code', 'Use inline code for small snippets')
  .option('--max-inline-length <length>', 'Maximum length for inline code', '50')
  .option('--line-numbers', 'Add line numbers to code blocks')
  .action(async (projectPath: string, options) => {
    try {
      // Load config file
      const config = loadConfig();

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

      console.log(chalk.blue('Analyzing code structure...'));

      if (options.astAnalysis === false) {
        console.log(chalk.yellow('AST analysis disabled - file prioritization may be less accurate'));
      }

      // Merge config with CLI options (CLI options take precedence)
      const mergedOptions = { ...config, ...options };

      // Parse options
      const maxFileSize = parseInt(mergedOptions.maxSize || mergedOptions.maxFileSize);
      if (isNaN(maxFileSize) || maxFileSize <= 0) {
        console.error(chalk.red(`Error: Invalid max-size "${mergedOptions.maxSize || mergedOptions.maxFileSize}". Must be a positive number.`));
        process.exit(1);
      }

      const maxTokens = parseInt(mergedOptions.maxTokens || mergedOptions.maxTokens);
      if (isNaN(maxTokens) || maxTokens <= 0) {
        console.error(chalk.red(`Error: Invalid max-tokens "${mergedOptions.maxTokens || mergedOptions.maxTokens}". Must be a positive number.`));
        process.exit(1);
      }

      // Parse header levels
      const headerLevel = parseInt(mergedOptions.headerLevel || mergedOptions.styling?.headerStyle?.mainTitle || '1');
      if (isNaN(headerLevel) || headerLevel < 1 || headerLevel > 6) {
        console.error(chalk.red(`Error: Invalid header-level "${mergedOptions.headerLevel || mergedOptions.styling?.headerStyle?.mainTitle}". Must be between 1 and 6.`));
        process.exit(1);
      }

      const sectionLevel = parseInt(mergedOptions.sectionLevel || mergedOptions.styling?.headerStyle?.sectionTitle || '2');
      if (isNaN(sectionLevel) || sectionLevel < 1 || sectionLevel > 6) {
        console.error(chalk.red(`Error: Invalid section-level "${mergedOptions.sectionLevel || mergedOptions.styling?.headerStyle?.sectionTitle}". Must be between 1 and 6.`));
        process.exit(1);
      }

      const fileLevel = parseInt(mergedOptions.fileLevel || mergedOptions.styling?.headerStyle?.fileTitle || '3');
      if (isNaN(fileLevel) || fileLevel < 1 || fileLevel > 6) {
        console.error(chalk.red(`Error: Invalid file-level "${mergedOptions.fileLevel || mergedOptions.styling?.headerStyle?.fileTitle}". Must be between 1 and 6.`));
        process.exit(1);
      }

      const maxInlineLength = parseInt(mergedOptions.maxInlineLength || mergedOptions.styling?.codeStyle?.maxInlineLength || '50');
      if (isNaN(maxInlineLength) || maxInlineLength <= 0) {
        console.error(chalk.red(`Error: Invalid max-inline-length "${mergedOptions.maxInlineLength || mergedOptions.styling?.codeStyle?.maxInlineLength}". Must be a positive number.`));
        process.exit(1);
      }

      const conversionOptions = {
        includeHidden: mergedOptions.includeHidden,
        maxFileSize,
        maxTokens,
        excludePatterns: (mergedOptions.exclude || mergedOptions.excludePatterns)?.split(',').map((p: string) => p.trim()),
        includePatterns: (mergedOptions.include || mergedOptions.includePatterns)?.split(',').map((p: string) => p.trim()),
        outputFormat: mergedOptions.format || mergedOptions.outputFormat as 'markdown' | 'json',
        includeMetadata: mergedOptions.metadata !== false && mergedOptions.includeMetadata !== false,
        useASTAnalysis: mergedOptions.astAnalysis !== false && mergedOptions.useASTAnalysis !== false,
        styling: {
          headerStyle: {
            mainTitle: headerLevel,
            sectionTitle: sectionLevel,
            fileTitle: fileLevel
          },
          listStyle: {
            tocBullet: mergedOptions.tocBullet || mergedOptions.styling?.listStyle?.tocBullet || '-',
            structureBullet: mergedOptions.structureBullet || mergedOptions.styling?.listStyle?.structureBullet || '├──'
          },
          codeStyle: {
            useInlineCode: mergedOptions.inlineCode || mergedOptions.styling?.codeStyle?.useInlineCode || false,
            maxInlineLength,
            showLineNumbers: mergedOptions.lineNumbers || mergedOptions.styling?.codeStyle?.showLineNumbers || false
          }
        }
      };

      const autoMarkdown = new AutoMarkdown(conversionOptions);

      console.log(chalk.blue('Understanding dependencies...'));

      let output: string;
      if (options.format === 'json') {
        console.log(chalk.blue('Optimizing for JSON format...'));
        output = await autoMarkdown.convertToJson(projectPath);
      } else {
        console.log(chalk.blue('Optimizing for LLMs...'));
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
        console.log(chalk.green(`Output saved to: ${options.output}`));
      } else {
        // Auto-create automarkdown folder and file
        const autoOutputDir = path.join(projectPath, 'automarkdown');
        const autoOutputFile = path.join(autoOutputDir, 'automarkdown.md');
        
        if (!fs.existsSync(autoOutputDir)) {
          await fs.promises.mkdir(autoOutputDir, { recursive: true });
        }
        
        await fs.promises.writeFile(autoOutputFile, output, 'utf-8');
        console.log(chalk.green(`Output automatically saved to: ${autoOutputFile}`));
      }

      // Stats and Token Analysis
      const lines = output.split('\n').length;
      const size = Buffer.byteLength(output, 'utf-8');
      console.log(chalk.blue(`\nGenerated ${lines} lines (${(size / 1024).toFixed(2)} KB)`));
      
      // Token analysis
      const tokenAnalysis = TokenCounter.analyzeTokenUsage(output);
      console.log(chalk.cyan(TokenCounter.formatTokenAnalysis(tokenAnalysis)));
      
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
      includeMetadata: true,
      useASTAnalysis: true,
      maxTokens: 1000000,
      styling: {
        headerStyle: {
          mainTitle: 1,
          sectionTitle: 2,
          fileTitle: 3
        },
        listStyle: {
          tocBullet: "-",
          structureBullet: "├──"
        },
        codeStyle: {
          useInlineCode: false,
          maxInlineLength: 50,
          showLineNumbers: false
        }
      }
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
      },
      {
        title: 'Custom token limit for smaller LLMs',
        command: 'automarkdown ./my-project --max-tokens 100000'
      },
      {
        title: 'Disable AST analysis (faster but less accurate)',
        command: 'automarkdown ./my-project --no-ast-analysis'
      },
      {
        title: 'Custom header levels',
        command: 'automarkdown ./my-project --header-level 2 --section-level 3 --file-level 4'
      },
      {
        title: 'Use numbered lists for TOC',
        command: 'automarkdown ./my-project --toc-bullet "1."'
      },
      {
        title: 'Use inline code for small snippets',
        command: 'automarkdown ./my-project --inline-code --max-inline-length 100'
      },
      {
        title: 'Add line numbers to code blocks',
        command: 'automarkdown ./my-project --line-numbers'
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