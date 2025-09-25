#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import AutoMarkdown from './index';
import { TokenCounter } from './tokenizer';
import { Banner } from './banner';
import { SocialFeatures, type ProjectStats, type CodePersonality } from './social';

const program = new Command();

program
  .name('automarkdown')
  .description('Intelligently convert codebases into markdown for LLMs')
  .version('2.0.2');

program
  .argument('<path>', 'Path to the codebase to convert')
  .option('-o, --output <file>', 'Output file path (default: stdout)')
  .option('-f, --format <format>', 'Output format: markdown or json', 'markdown')
  .option('--include-hidden', 'Include hidden files and directories')
  .option('--max-size <size>', 'Maximum file size in bytes', '1048576')
  .option('--exclude <patterns>', 'Comma-separated exclude patterns', 'node_modules/**,.git/**,dist/**,build/**')
  .option('--include <patterns>', 'Comma-separated include patterns', '**/*')
  .option('--no-metadata', 'Exclude file metadata from output')
  .option('--no-social', 'Disable social features and personality analysis')
  .option('--share', 'Generate shareable social media content')
  .action(async (projectPath: string, options) => {
    const startTime = Date.now();
    
    try {
      // Show welcome banner
      if (!options.noSocial) {
        console.log(Banner.generateWelcomeBanner());
      }

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

      // Get project name
      const projectName = path.basename(path.resolve(projectPath));
      
      if (!options.noSocial) {
        console.log(chalk.blue('🔍 Analyzing codebase...'));
      } else {
        console.log(chalk.blue('Analyzing codebase...'));
      }

      // Parse options
      const maxFileSize = parseInt(options.maxSize);
      if (isNaN(maxFileSize) || maxFileSize <= 0) {
        console.error(chalk.red(`Error: Invalid max-size "${options.maxSize}". Must be a positive number.`));
        process.exit(1);
      }

      const conversionOptions = {
        includeHidden: options.includeHidden,
        maxFileSize,
        excludePatterns: options.exclude.split(',').map((p: string) => p.trim()),
        includePatterns: options.include.split(',').map((p: string) => p.trim()),
        outputFormat: options.format as 'markdown' | 'json',
        includeMetadata: options.metadata !== false
      };

      const autoMarkdown = new AutoMarkdown(conversionOptions);

      // Get project stats for social features
      let projectStats: ProjectStats | null = null;
      let personality: CodePersonality | null = null;
      
      if (!options.noSocial) {
        // This is a bit of a hack - we'll need to parse the project first to get stats
        try {
          const tempProject = await autoMarkdown.parseProject(projectPath);
          projectStats = {
            files: tempProject.files.length,
            languages: [...new Set(tempProject.files.map(f => f.language))],
            size: tempProject.files.reduce((sum, f) => sum + f.size, 0),
            tokens: TokenCounter.estimateTokens(JSON.stringify(tempProject))
          };
          
          // Show project card
          console.log(Banner.generateProjectCard(projectName, projectStats));
          console.log();
          
          // Analyze personality
          personality = SocialFeatures.analyzeCodePersonality(tempProject.files, projectStats);
          console.log(SocialFeatures.generatePersonalityReport(personality));
          console.log();
          
          // Show achievements
          const achievements = SocialFeatures.generateAchievements(projectStats, personality);
          if (achievements.length > 0) {
            console.log(chalk.yellow.bold('🏆 ACHIEVEMENTS UNLOCKED:'));
            achievements.forEach(achievement => {
              console.log(`   ${achievement}`);
            });
            console.log();
          }
        } catch (error) {
          // If social features fail, continue with normal processing
          console.log(chalk.yellow('⚠️  Social features unavailable, continuing with conversion...'));
        }
      }

      console.log(chalk.blue('🔄 Converting to markdown...'));

      let output: string;
      if (options.format === 'json') {
        output = await autoMarkdown.convertToJson(projectPath);
      } else {
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
        
        // Save badges and social content if social features are enabled
        if (!options.noSocial && projectStats) {
          const badgeContent = SocialFeatures.generateProjectBadge(projectStats);
          const badgeFile = path.join(autoOutputDir, 'badges.md');
          await fs.promises.writeFile(badgeFile, badgeContent, 'utf-8');
          console.log(chalk.cyan(`📛 Badges saved to: ${badgeFile}`));
        }
      }

      // Stats and Token Analysis
      const lines = output.split('\n').length;
      const size = Buffer.byteLength(output, 'utf-8');
      const processingTime = (Date.now() - startTime) / 1000;
      
      // Show completion banner
      if (!options.noSocial) {
        console.log(Banner.generateCompletionBanner({
          lines,
          sizeKb: size / 1024,
          processingTime
        }));
      } else {
        console.log(chalk.blue(`\nGenerated ${lines} lines (${(size / 1024).toFixed(2)} KB)`));
      }
      
      // Token analysis
      const tokenAnalysis = TokenCounter.analyzeTokenUsage(output);
      console.log(chalk.cyan(TokenCounter.formatTokenAnalysis(tokenAnalysis)));
      
      // Social sharing content
      if ((options.share || !options.noSocial) && projectStats) {
        console.log(Banner.generateSocialShareText(projectName, projectStats));
      }
      
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

// New viral features commands
program
  .command('stats <path>')
  .description('Analyze project and show detailed statistics')
  .action(async (projectPath: string) => {
    try {
      console.log(Banner.generateWelcomeBanner());
      
      if (!fs.existsSync(projectPath)) {
        console.error(chalk.red(`Error: Path "${projectPath}" does not exist`));
        process.exit(1);
      }

      const autoMarkdown = new AutoMarkdown();
      const projectName = path.basename(path.resolve(projectPath));
      
      console.log(chalk.blue('📊 Analyzing project statistics...\n'));
      
      const project = await autoMarkdown.parseProject(projectPath);
      const projectStats: ProjectStats = {
        files: project.files.length,
        languages: [...new Set(project.files.map(f => f.language))],
        size: project.files.reduce((sum, f) => sum + f.size, 0),
        tokens: TokenCounter.estimateTokens(JSON.stringify(project))
      };

      // Show project card
      console.log(Banner.generateProjectCard(projectName, projectStats));
      console.log();
      
      // Show personality analysis
      const personality = SocialFeatures.analyzeCodePersonality(project.files, projectStats);
      console.log(SocialFeatures.generatePersonalityReport(personality));
      console.log();
      
      // Show achievements
      const achievements = SocialFeatures.generateAchievements(projectStats, personality);
      if (achievements.length > 0) {
        console.log(chalk.yellow.bold('🏆 ACHIEVEMENTS UNLOCKED:'));
        achievements.forEach(achievement => {
          console.log(`   ${achievement}`);
        });
        console.log();
      }

      // Git stats
      const gitStats = await SocialFeatures.detectGitStats(projectPath);
      if (gitStats.isGitRepo) {
        console.log(chalk.green.bold('📱 Git Repository Detected'));
        if (gitStats.remoteUrl) {
          console.log(`   🔗 Remote: ${chalk.cyan(gitStats.remoteUrl)}`);
        }
        console.log();
      }

      // Generate sharing content
      console.log(Banner.generateSocialShareText(projectName, projectStats));
      
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program  
  .command('viral <path>')
  .description('Generate viral social content for your project')
  .action(async (projectPath: string) => {
    try {
      if (!fs.existsSync(projectPath)) {
        console.error(chalk.red(`Error: Path "${projectPath}" does not exist`));
        process.exit(1);
      }

      const autoMarkdown = new AutoMarkdown();
      const projectName = path.basename(path.resolve(projectPath));
      
      console.log(chalk.magenta.bold('🚀 GENERATING VIRAL CONTENT 🚀\n'));
      
      const project = await autoMarkdown.parseProject(projectPath);
      const projectStats: ProjectStats = {
        files: project.files.length,
        languages: [...new Set(project.files.map(f => f.language))],
        size: project.files.reduce((sum, f) => sum + f.size, 0),
        tokens: TokenCounter.estimateTokens(JSON.stringify(project))
      };

      // Generate and save all viral content
      const outputDir = path.join(projectPath, 'viral-content');
      if (!fs.existsSync(outputDir)) {
        await fs.promises.mkdir(outputDir, { recursive: true });
      }

      // Project card
      const cardContent = Banner.generatePlainProjectCard(projectName, projectStats);
      await fs.promises.writeFile(path.join(outputDir, 'project-card.txt'), cardContent, 'utf-8');
      
      // Social share text
      const shareContent = Banner.generatePlainSocialShareText(projectName, projectStats);
      await fs.promises.writeFile(path.join(outputDir, 'social-share.txt'), shareContent, 'utf-8');
      
      // Badges
      const badgeContent = SocialFeatures.generateProjectBadge(projectStats);
      await fs.promises.writeFile(path.join(outputDir, 'badges.md'), badgeContent, 'utf-8');
      
      // Personality report
      const personality = SocialFeatures.analyzeCodePersonality(project.files, projectStats);
      const personalityContent = SocialFeatures.generatePlainPersonalityReport(personality);
      await fs.promises.writeFile(path.join(outputDir, 'personality.txt'), personalityContent, 'utf-8');

      console.log(chalk.green.bold('✅ Viral content generated!'));
      console.log(chalk.cyan(`📁 Files saved to: ${outputDir}`));
      console.log();
      console.log(chalk.yellow('🎯 Ready to share:'));
      console.log(`   • Project card: ${chalk.gray('project-card.txt')}`);
      console.log(`   • Social media: ${chalk.gray('social-share.txt')}`); 
      console.log(`   • README badges: ${chalk.gray('badges.md')}`);
      console.log(`   • Personality: ${chalk.gray('personality.txt')}`);
      console.log();
      
      // Show preview
      console.log(shareContent);

    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

if (process.argv.length === 2) {
  program.help();
}

program.parse();