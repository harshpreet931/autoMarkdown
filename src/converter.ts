import { ParsedProject, ConversionOptions } from './types';
import * as fs from 'fs';
import * as path from 'path';
import { minimatch } from 'minimatch';

export class MarkdownConverter {
  private options: ConversionOptions;
  private ignorePatterns: string[] = [];

  constructor(options: ConversionOptions = {}) {
    this.options = options;
  }

  async convertFile(filePath: string): Promise<string> {
    if (this.shouldIgnoreFile(filePath)) {
      return '';
    }

    const content = await fs.promises.readFile(filePath, 'utf-8');
    const project: ParsedProject = {
      files: [
        {
          path: filePath,
          content,
          language: this.detectLanguage(filePath),
          size: content.length,
          importance: 1,
        },
      ],
      structure: {
        name: path.basename(filePath),
        type: 'file',
        path: filePath,
      },
      summary: `Single file conversion of ${filePath}`,
    };

    return this.convertToMarkdown(project);
  }

  async convertDirectory(dirPath: string): Promise<string> {
    const files = await this.getFiles(dirPath);
    const project: ParsedProject = {
      files: await Promise.all(
        files.map(async (file) => ({
          path: file,
          content: await fs.promises.readFile(file, 'utf-8'),
          language: this.detectLanguage(file),
          size: (await fs.promises.stat(file)).size,
          importance: 1,
        }))
      ),
      structure: {
        name: path.basename(dirPath),
        type: 'directory',
        path: dirPath,
        children: files.map((file) => ({
          name: path.basename(file),
          type: 'file',
          path: file,
        })),
      },
      summary: `Directory conversion of ${dirPath}`,
    };

    return this.convertToMarkdown(project);
  }

  addIgnorePattern(pattern: string): void {
    this.ignorePatterns.push(pattern);
  }

  convertToMarkdown(project: ParsedProject): string {
    const sections: string[] = [];

    project.files.forEach((file) => {
      const matches = file.content.match(/export\s+class\s+(\w+)([^{]*){([^}]*)}/g);
      if (matches) {
        matches.forEach((classMatch) => {
          const className = classMatch.match(/export\s+class\s+(\w+)/)?.[1] || '';
          sections.push(`# ${className}\n`);

          const methodMatches = classMatch.match(/\/\*\*[\s\S]*?\*\/\s*public\s+\w+\s*\([^)]*\)/g);
          if (methodMatches && methodMatches.length > 0) {
            sections.push('## Methods\n');
            methodMatches.forEach((methodMatch) => {
              const methodName = methodMatch.match(/public\s+(\w+)/)?.[1];
              if (methodName) {
                sections.push(`### ${methodName}\n`);
                const comment = methodMatch
                  .match(/\/\*\*([^*][\s\S]*?)\*\//)?.[1]
                  ?.replace(/\s*\*/g, '')
                  .trim();
                if (comment) {
                  sections.push(`${comment}\n`);
                }
              }
            });
          }
        });
      }
    });

    return sections.join('\n');
  }

  convertToJson(project: ParsedProject): string {
    return JSON.stringify(project, null, 2);
  }

  private shouldIgnoreFile(filePath: string): boolean {
    return this.ignorePatterns.some((pattern) => minimatch(filePath, pattern, { dot: true }));
  }

  private async getFiles(dirPath: string): Promise<string[]> {
    const files = await fs.promises.readdir(dirPath);
    return files
      .map((file) => path.join(dirPath, file))
      .filter((file) => !this.shouldIgnoreFile(file));
  }

  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: { [key: string]: string } = {
      '.js': 'javascript',
      '.jsx': 'jsx',
      '.ts': 'typescript',
      '.tsx': 'tsx',
      '.md': 'markdown',
      '.txt': 'text',
    };
    return languageMap[ext] || 'text';
  }
}
