import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export interface ProjectStats {
  files: number;
  languages: string[];
  size: number;
  tokens: number;
  commits?: number;
  contributors?: number;
  lastUpdated?: string;
}

export interface CodePersonality {
  style: 'Minimalist' | 'Verbose' | 'Balanced' | 'Experimental';
  complexity: 'Simple' | 'Moderate' | 'Complex' | 'Enterprise';
  diversity: 'Focused' | 'Polyglot' | 'Multilingual' | 'Everything';
  organization: 'Clean' | 'Structured' | 'Creative' | 'Chaotic';
  score: number;
}

export class SocialFeatures {
  static async detectGitStats(projectPath: string): Promise<{
    isGitRepo: boolean;
    commits?: number;
    contributors?: number;
    remoteUrl?: string;
    lastCommit?: Date;
  }> {
    try {
      const gitPath = path.join(projectPath, '.git');
      if (!fs.existsSync(gitPath)) {
        return { isGitRepo: false };
      }

      // Try to read git info
      let remoteUrl = '';
      let commits = 0;
      let contributors = 0;
      let lastCommit: Date | undefined;

      try {
        const configPath = path.join(gitPath, 'config');
        if (fs.existsSync(configPath)) {
          const configContent = fs.readFileSync(configPath, 'utf-8');
          const urlMatch = configContent.match(/url = (.+)/);
          if (urlMatch) {
            remoteUrl = urlMatch[1];
          }
        }
      } catch (e) {
        // Silent fail for git parsing
      }

      return {
        isGitRepo: true,
        commits,
        contributors,
        remoteUrl,
        lastCommit
      };
    } catch (error) {
      return { isGitRepo: false };
    }
  }

  static analyzeCodePersonality(files: any[], projectStats: ProjectStats): CodePersonality {
    const avgFileSize = projectStats.size / projectStats.files;
    const languageCount = projectStats.languages.length;
    const totalFiles = projectStats.files;

    // Determine style based on average file size
    let style: CodePersonality['style'];
    if (avgFileSize < 1000) style = 'Minimalist';
    else if (avgFileSize < 3000) style = 'Balanced';
    else if (avgFileSize < 8000) style = 'Verbose';
    else style = 'Experimental';

    // Determine complexity based on file count and size
    let complexity: CodePersonality['complexity'];
    if (totalFiles < 10 && projectStats.size < 50000) complexity = 'Simple';
    else if (totalFiles < 50 && projectStats.size < 500000) complexity = 'Moderate';
    else if (totalFiles < 200 && projectStats.size < 2000000) complexity = 'Complex';
    else complexity = 'Enterprise';

    // Determine diversity based on language count
    let diversity: CodePersonality['diversity'];
    if (languageCount === 1) diversity = 'Focused';
    else if (languageCount <= 3) diversity = 'Polyglot';
    else if (languageCount <= 6) diversity = 'Multilingual';
    else diversity = 'Everything';

    // Determine organization (placeholder - could be enhanced with actual file structure analysis)
    const organization: CodePersonality['organization'] = 'Structured';

    // Calculate a fun score
    const score = Math.min(100, Math.round(
      (languageCount * 10) + 
      (totalFiles * 0.5) + 
      (projectStats.size / 10000) + 
      50
    ));

    return { style, complexity, diversity, organization, score };
  }

  static generatePersonalityReport(personality: CodePersonality): string {
    const emoji = {
      style: {
        'Minimalist': '🎯',
        'Verbose': '📚',
        'Balanced': '⚖️',
        'Experimental': '🧪'
      },
      complexity: {
        'Simple': '🌱',
        'Moderate': '🌿',
        'Complex': '🌳',
        'Enterprise': '🏢'
      },
      diversity: {
        'Focused': '🎯',
        'Polyglot': '🌐',
        'Multilingual': '🗣️',
        'Everything': '🌈'
      },
      organization: {
        'Clean': '✨',
        'Structured': '📁',
        'Creative': '🎨',
        'Chaotic': '🌪️'
      }
    };

    return `
╭─────────────────────────────────────────────────╮
│ ${chalk.magenta('🎭 CODE PERSONALITY ANALYSIS 🎭')}      │
├─────────────────────────────────────────────────┤
│ ${emoji.style[personality.style]} Style:        ${chalk.cyan.bold(personality.style)}          │
│ ${emoji.complexity[personality.complexity]} Complexity:  ${chalk.yellow.bold(personality.complexity)}       │
│ ${emoji.diversity[personality.diversity]} Diversity:   ${chalk.green.bold(personality.diversity)}        │
│ ${emoji.organization[personality.organization]} Organization: ${chalk.blue.bold(personality.organization)}    │
│                                                 │
│ 🏆 Personality Score: ${chalk.magenta.bold(`${personality.score}/100`)}              │
╰─────────────────────────────────────────────────╯
    `.trim();
  }

  static generatePlainPersonalityReport(personality: CodePersonality): string {
    const emoji = {
      style: {
        'Minimalist': '🎯',
        'Verbose': '📚',
        'Balanced': '⚖️',
        'Experimental': '🧪'
      },
      complexity: {
        'Simple': '🌱',
        'Moderate': '🌿',
        'Complex': '🌳',
        'Enterprise': '🏢'
      },
      diversity: {
        'Focused': '🎯',
        'Polyglot': '🌐',
        'Multilingual': '🗣️',
        'Everything': '🌈'
      },
      organization: {
        'Clean': '✨',
        'Structured': '📁',
        'Creative': '🎨',
        'Chaotic': '🌪️'
      }
    };

    return `╭─────────────────────────────────────────────────╮
│ 🎭 CODE PERSONALITY ANALYSIS 🎭      │
├─────────────────────────────────────────────────┤
│ ${emoji.style[personality.style]} Style:        ${personality.style}          │
│ ${emoji.complexity[personality.complexity]} Complexity:  ${personality.complexity}       │
│ ${emoji.diversity[personality.diversity]} Diversity:   ${personality.diversity}        │
│ ${emoji.organization[personality.organization]} Organization: ${personality.organization}    │
│                                                 │
│ 🏆 Personality Score: ${personality.score}/100              │
╰─────────────────────────────────────────────────╯`;
  }

  static generateAchievements(stats: ProjectStats, personality: CodePersonality): string[] {
    const achievements: string[] = [];

    // File-based achievements
    if (stats.files >= 100) achievements.push('🏗️ Architect: 100+ files managed');
    if (stats.files >= 10) achievements.push('👨‍💻 Builder: Growing codebase');
    if (stats.files < 10) achievements.push('🌱 Minimalist: Keeping it simple');

    // Language-based achievements  
    if (stats.languages.length >= 5) achievements.push('🌐 Polyglot: 5+ languages mastered');
    if (stats.languages.length === 1) achievements.push('🎯 Specialist: Focused expertise');
    if (stats.languages.includes('TypeScript')) achievements.push('💎 Type Safety Champion');
    if (stats.languages.includes('Rust')) achievements.push('🦀 Memory Safety Warrior');
    if (stats.languages.includes('Python')) achievements.push('🐍 Pythonic Zen Master');

    // Size-based achievements
    if (stats.size > 1000000) achievements.push('📚 Epic Codebase: 1MB+ of code');
    if (stats.tokens > 50000) achievements.push('🤖 LLM Challenger: 50K+ tokens');
    if (stats.tokens < 10000) achievements.push('⚡ Bite-sized: Perfect for any LLM');

    // Personality-based achievements
    if (personality.score >= 90) achievements.push('🌟 Coding Superstar');
    if (personality.style === 'Minimalist') achievements.push('✨ Less is More');
    if (personality.complexity === 'Enterprise') achievements.push('🏢 Enterprise Grade');

    return achievements.slice(0, 6); // Limit to 6 achievements
  }

  static generateProjectBadge(stats: ProjectStats): string {
    const languages = stats.languages.slice(0, 3).join('|');
    const size = `${(stats.size / 1024).toFixed(1)}KB`;
    const tokens = `~${(stats.tokens / 1000).toFixed(1)}K`;
    
    return `
![AutoMarkdown](https://img.shields.io/badge/AutoMarkdown-analyzed-brightgreen)
![Files](https://img.shields.io/badge/Files-${stats.files}-blue)
![Languages](https://img.shields.io/badge/Languages-${languages}-orange)  
![Size](https://img.shields.io/badge/Size-${size}-yellow)
![Tokens](https://img.shields.io/badge/Tokens-${tokens}-purple)
    `.trim();
  }
}