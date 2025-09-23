import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { FileInfo, ParsedProject, ProjectStructure, ConversionOptions } from './types';

export class CodebaseParser {
  private options: ConversionOptions;

  constructor(options: ConversionOptions = {}) {
    // Default exclude patterns
    const defaultExcludePatterns = [
      'node_modules/**',
      '.git/**',
      'dist/**',
      'build/**',
      'automarkdown/**',
      '*.log',
      // Lock files (huge and not useful for LLM analysis)
      'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb',
      'Pipfile.lock', 'poetry.lock', 'Cargo.lock', 'composer.lock',
      'Gemfile.lock', 'go.sum', 'mix.lock',
      // Images and media
      '*.png', '*.jpg', '*.jpeg', '*.gif', '*.bmp', '*.tiff', '*.webp', '*.svg',
      '*.mp4', '*.avi', '*.mov', '*.wmv', '*.flv', '*.webm',
      '*.mp3', '*.wav', '*.ogg', '*.flac', '*.aac',
      // Documents and archives
      '*.pdf', '*.doc', '*.docx', '*.xls', '*.xlsx', '*.ppt', '*.pptx',
      '*.zip', '*.tar', '*.gz', '*.rar', '*.7z',
      // Executables and fonts
      '*.exe', '*.dmg', '*.app', '*.deb', '*.rpm',
      '*.ico', '*.ttf', '*.woff', '*.woff2', '*.eot'
    ];

    this.options = {
      includeHidden: false,
      maxFileSize: 1024 * 1024, // 1MB
      includePatterns: ['**/*'],
      outputFormat: 'markdown',
      prioritizeFiles: ['README.md', 'package.json', 'requirements.txt', 'main.py', 'index.js'],
      includeMetadata: true,
      ...options,
      // Ensure exclude patterns are not overridden by spread - always merge with defaults
      excludePatterns: [
        ...defaultExcludePatterns,
        ...(options.excludePatterns || [])
      ]
    };
  }

  async parseProject(projectPath: string): Promise<ParsedProject> {
    const files = await this.getProjectFiles(projectPath);
    const structure = await this.buildProjectStructure(projectPath);
    const summary = this.generateProjectSummary(files, structure);

    return {
      files: files.sort((a, b) => b.importance - a.importance),
      structure,
      summary
    };
  }

  private async getProjectFiles(projectPath: string): Promise<FileInfo[]> {
    const files: FileInfo[] = [];
    
    for (const pattern of this.options.includePatterns!) {
      const matches = await glob(pattern, {
        cwd: projectPath,
        ignore: this.options.excludePatterns,
        dot: this.options.includeHidden
      });

      for (const match of matches) {
        const fullPath = path.join(projectPath, match);
        const stat = await fs.promises.stat(fullPath);

        if (stat.isFile() && stat.size <= this.options.maxFileSize!) {
          // Additional check: skip binary files by extension
          if (this.isBinaryFile(match)) {
            continue;
          }

          try {
            const content = await fs.promises.readFile(fullPath, 'utf-8');

            // Additional check: skip files with binary content
            if (this.containsBinaryContent(content)) {
              continue;
            }

            const fileInfo: FileInfo = {
              path: match,
              content,
              language: this.detectLanguage(match),
              size: stat.size,
              importance: this.calculateImportance(match, content)
            };
            files.push(fileInfo);
          } catch (error) {
            // Skip files that can't be read as UTF-8
            continue;
          }
        }
      }
    }

    return files;
  }

  private async buildProjectStructure(projectPath: string): Promise<ProjectStructure> {
    const name = path.basename(projectPath);
    
    const buildStructure = async (currentPath: string, relativePath: string = ''): Promise<ProjectStructure> => {
      const stat = await fs.promises.stat(currentPath);
      const itemName = path.basename(currentPath);
      
      if (stat.isFile()) {
        return {
          name: itemName,
          type: 'file',
          path: relativePath
        };
      } else {
        const children: ProjectStructure[] = [];
        try {
          const items = await fs.promises.readdir(currentPath);
          
          for (const item of items) {
            const itemRelativePath = path.join(relativePath, item);
            if (this.shouldIncludeInStructure(item, itemRelativePath)) {
              const itemPath = path.join(currentPath, item);
              const child = await buildStructure(itemPath, itemRelativePath);
              children.push(child);
            }
          }
        } catch (error) {
          // Skip directories we can't read
        }
        
        return {
          name: itemName,
          type: 'directory',
          children: children.sort((a, b) => {
            if (a.type !== b.type) {
              return a.type === 'directory' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
          }),
          path: relativePath
        };
      }
    };

    return buildStructure(projectPath);
  }

  private isBinaryFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    const binaryExtensions = [
      // Images
      '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp', '.svg', '.ico',
      // Videos
      '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv',
      // Audio
      '.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a',
      // Archives
      '.zip', '.tar', '.gz', '.rar', '.7z', '.bz2', '.xz',
      // Documents
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      // Executables
      '.exe', '.dmg', '.app', '.deb', '.rpm', '.msi',
      // Fonts
      '.ttf', '.woff', '.woff2', '.eot', '.otf',
      // Other binary formats
      '.bin', '.dat', '.db', '.sqlite', '.sqlite3'
    ];
    return binaryExtensions.includes(ext);
  }

  private containsBinaryContent(content: string): boolean {
    // Check for null bytes (common in binary files)
    if (content.includes('\0')) {
      return true;
    }

    // Check for high ratio of non-printable characters
    const nonPrintableCount = (content.match(/[\x00-\x08\x0E-\x1F\x7F-\xFF]/g) || []).length;
    const ratio = nonPrintableCount / content.length;

    // If more than 30% of characters are non-printable, consider it binary
    return ratio > 0.3;
  }

  private shouldIncludeInStructure(itemName: string, itemRelativePath: string): boolean {
    // Use the same exclusion patterns as file content filtering
    const excluded = this.options.excludePatterns!.some(pattern => {
      // Handle different pattern types
      if (pattern.includes('**')) {
        // Handle directory patterns like node_modules/** or dist/**
        const basePattern = pattern.replace('/**', '');
        return itemRelativePath.startsWith(basePattern + '/') || itemName === basePattern;
      } else if (pattern.startsWith('*.')) {
        // Handle file extension patterns like *.png
        const extension = pattern.slice(1); // Remove the *
        return itemName.endsWith(extension);
      } else if (pattern.includes('*')) {
        // Handle simple wildcard patterns
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(itemName);
      } else {
        // Exact match for specific files
        return itemName === pattern || itemName === path.basename(pattern);
      }
    });

    // Also exclude hidden files (starting with .) unless explicitly included
    return !excluded && (!itemName.startsWith('.') || (this.options.includeHidden || false));
  }

  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: { [key: string]: string } = {
      '.js': 'javascript',
      '.jsx': 'jsx',
      '.ts': 'typescript',
      '.tsx': 'tsx',
      '.py': 'python',
      '.java': 'java',
      '.c': 'c',
      '.cpp': 'cpp',
      '.cc': 'cpp',
      '.cxx': 'cpp',
      '.h': 'c',
      '.hpp': 'cpp',
      '.cs': 'csharp',
      '.php': 'php',
      '.rb': 'ruby',
      '.go': 'go',
      '.rs': 'rust',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.scala': 'scala',
      '.sh': 'bash',
      '.bash': 'bash',
      '.zsh': 'zsh',
      '.fish': 'fish',
      '.ps1': 'powershell',
      '.sql': 'sql',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.sass': 'sass',
      '.less': 'less',
      '.xml': 'xml',
      '.json': 'json',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.toml': 'toml',
      '.ini': 'ini',
      '.cfg': 'ini',
      '.conf': 'ini',
      '.md': 'markdown',
      '.markdown': 'markdown',
      '.txt': 'text',
      '.dockerfile': 'dockerfile',
      '.vue': 'vue',
      '.svelte': 'svelte'
    };

    return languageMap[ext] || 'text';
  }

  private calculateImportance(filePath: string, content: string): number {
    let importance = 1;
    
    // Prioritize certain files
    const fileName = path.basename(filePath).toLowerCase();
    if (this.options.prioritizeFiles!.some(pf => fileName.includes(pf.toLowerCase()))) {
      importance += 10;
    }

    // Configuration files
    if (['package.json', 'requirements.txt', 'cargo.toml', 'pom.xml', 'build.gradle'].includes(fileName)) {
      importance += 8;
    }

    // Entry points
    if (['main.py', 'index.js', 'app.py', 'server.js', 'main.js'].includes(fileName)) {
      importance += 7;
    }

    // Documentation
    if (fileName.includes('readme') || fileName.includes('doc')) {
      importance += 6;
    }

    // Test files (lower importance)
    if (filePath.includes('test') || filePath.includes('spec')) {
      importance -= 2;
    }

    // File size factor (smaller files are often more important)
    if (content.length < 1000) {
      importance += 2;
    } else if (content.length > 10000) {
      importance -= 1;
    }

    // Code complexity indicators
    const complexityKeywords = ['class', 'function', 'def', 'interface', 'type', 'export', 'import'];
    const keywordCount = complexityKeywords.reduce((count, keyword) => {
      return count + (content.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
    }, 0);
    
    importance += Math.min(keywordCount / 10, 3);

    return Math.max(importance, 0);
  }

  private generateProjectSummary(files: FileInfo[], structure: ProjectStructure): string {
    const totalFiles = files.length;
    const languages = [...new Set(files.map(f => f.language))];
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    
    return `Project contains ${totalFiles} files in ${languages.length} different languages (${languages.join(', ')}). Total size: ${(totalSize / 1024).toFixed(2)} KB.`;
  }
}