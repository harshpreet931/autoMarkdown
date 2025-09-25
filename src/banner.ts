import chalk from 'chalk';

export class Banner {
  static generateWelcomeBanner(): string {
    const logo = `
    ╭─────────────────────────────────────────────╮
    │  █▀█ █   █ ▀█▀ █▀▀█ █▀█▀█ █▀█ █▀▀█ █ ▄ █   │
    │  █▄█ █   █  █  █  █ █ █ █ █▄█ █▄▄▀ █▀▄ █   │  
    │  ▀ █ ▀▄▄▄▀  ▀  ▀▀▀▀ ▀ ▀ ▀ ▀ ▀ ▀ ▀▀ ▀ ▀ ▀   │
    ╰─────────────────────────────────────────────╯
    `;

    return chalk.cyan(logo) + '\n' + 
           chalk.yellow.bold('    🚀 Making codebases LLM-ready, one repo at a time!') + '\n' +
           chalk.gray('    ────────────────────────────────────────────────────') + '\n';
  }

  static generateProjectCard(projectName: string, stats: {
    files: number;
    languages: string[];
    size: number;
    tokens: number;
  }): string {
    const card = `
╭────────────────────────────────────────────────────────────╮
│ 📁 ${chalk.cyan.bold(projectName.padEnd(48))} │
├────────────────────────────────────────────────────────────┤
│ 📊 ${chalk.green(`${stats.files} files`)} • ${chalk.blue(`${stats.languages.length} languages`)} • ${chalk.yellow(`${(stats.size/1024).toFixed(1)}KB`)} │
│ 🎯 ${chalk.magenta(`~${stats.tokens.toLocaleString()} tokens`)} estimated │
│ 💬 ${chalk.cyan(`Languages: ${stats.languages.slice(0,3).join(', ')}${stats.languages.length > 3 ? '...' : ''}`)} │
╰────────────────────────────────────────────────────────────╯
    `.trim();

    return card;
  }

  static generateCompletionBanner(stats: {
    lines: number;
    sizeKb: number;
    processingTime?: number;
  }): string {
    const celebration = ['🎉', '✨', '🚀', '💫', '⭐'][Math.floor(Math.random() * 5)];
    
    return `
${chalk.green.bold('━'.repeat(60))}
${chalk.green.bold(`${celebration} CONVERSION COMPLETE! ${celebration}`)}
${chalk.green.bold('━'.repeat(60))}

${chalk.cyan('📝')} Generated: ${chalk.yellow.bold(`${stats.lines.toLocaleString()} lines`)}
${chalk.cyan('📦')} Size: ${chalk.yellow.bold(`${stats.sizeKb.toFixed(2)} KB`)}
${stats.processingTime ? `${chalk.cyan('⚡')} Time: ${chalk.yellow.bold(`${stats.processingTime.toFixed(2)}s`)}` : ''}

${chalk.gray('Ready to feed your favorite LLM! 🤖✨')}
`;
  }

  static generateSocialShareText(projectName: string, stats: {
    files: number;
    languages: string[];
    tokens: number;
  }): string {
    const languageEmojis: { [key: string]: string } = {
      'typescript': '🔷',
      'javascript': '💛', 
      'python': '🐍',
      'java': '☕',
      'go': '🐹',
      'rust': '🦀',
      'cpp': '⚡',
      'c': '🔧',
      'csharp': '💜',
      'php': '🐘',
      'ruby': '💎',
      'swift': '🦉',
      'kotlin': '🎯'
    };

    const langWithEmojis = stats.languages.map(lang => 
      `${languageEmojis[lang.toLowerCase()] || '📄'} ${lang}`
    ).join(' ');

    const plainTextContent = `Just converted "${projectName}" to LLM-ready markdown! 🚀

📊 Stats: ${stats.files} files, ~${stats.tokens.toLocaleString()} tokens
💻 Languages: ${langWithEmojis}

Try it yourself: npx automarkdown .

#AutoMarkdown #LLM #CodeAnalysis #Developer`;

    return `
${chalk.blue.bold('🔗 Share your codebase conversion:')}

${chalk.gray('────── Copy & Paste Ready ──────')}

${plainTextContent}

${chalk.gray('────────────────────────────────')}
    `;
  }

  static generateProgressBar(current: number, total: number, label: string): string {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * 20);
    const empty = 20 - filled;
    
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    
    return `${chalk.cyan(label)}: [${chalk.green(bar)}] ${chalk.yellow(`${percentage}%`)} (${current}/${total})`;
  }

  static generatePlainProjectCard(projectName: string, stats: {
    files: number;
    languages: string[];
    size: number;
    tokens: number;
  }): string {
    return `╭────────────────────────────────────────────────────────────╮
│ 📁 ${projectName.padEnd(48)} │
├────────────────────────────────────────────────────────────┤
│ 📊 ${stats.files} files • ${stats.languages.length} languages • ${(stats.size/1024).toFixed(1)}KB │
│ 🎯 ~${stats.tokens.toLocaleString()} tokens estimated │
│ 💬 Languages: ${stats.languages.slice(0,3).join(', ')}${stats.languages.length > 3 ? '...' : ''} │
╰────────────────────────────────────────────────────────────╯`;
  }

  static generatePlainSocialShareText(projectName: string, stats: {
    files: number;
    languages: string[];
    tokens: number;
  }): string {
    const languageEmojis: { [key: string]: string } = {
      'typescript': '🔷',
      'javascript': '💛', 
      'python': '🐍',
      'java': '☕',
      'go': '🐹',
      'rust': '🦀',
      'cpp': '⚡',
      'c': '🔧',
      'csharp': '💜',
      'php': '🐘',
      'ruby': '💎',
      'swift': '🦉',
      'kotlin': '🎯'
    };

    const langWithEmojis = stats.languages.map(lang => 
      `${languageEmojis[lang.toLowerCase()] || '📄'} ${lang}`
    ).join(' ');

    return `Just converted "${projectName}" to LLM-ready markdown! 🚀

📊 Stats: ${stats.files} files, ~${stats.tokens.toLocaleString()} tokens
💻 Languages: ${langWithEmojis}

Try it yourself: npx automarkdown .

#AutoMarkdown #LLM #CodeAnalysis #Developer`;
  }
}