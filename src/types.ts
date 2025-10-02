export interface FileInfo {
  path: string;
  content: string;
  language: string;
  size: number;
  importance: number;
  astMetrics?: {
    exportCount: number;
    importCount: number;
    functionCount: number;
    classCount: number;
    complexity: number;
    centrality: number;
  };
}

export interface ParsedProject {
  files: FileInfo[];
  structure: ProjectStructure;
  summary: string;
}

export interface ProjectStructure {
  name: string;
  type: 'file' | 'directory';
  children?: ProjectStructure[];
  path: string;
}

export interface StylingOptions {
  headerStyle?: {
    mainTitle?: number; // Header level for main title (default: 1)
    sectionTitle?: number; // Header level for sections (default: 2)
    fileTitle?: number; // Header level for file titles (default: 3)
  };
  listStyle?: {
    tocBullet?: string; // Bullet style for TOC (default: '-')
    structureBullet?: string; // Bullet style for structure tree (default: '├──')
  };
  codeStyle?: {
    useInlineCode?: boolean; // Use inline code instead of code blocks for small snippets (default: false)
    maxInlineLength?: number; // Max length for inline code (default: 50)
    showLineNumbers?: boolean; // Add line numbers to code blocks (default: false)
  };
}

export interface ConversionOptions {
  includeHidden?: boolean;
  maxFileSize?: number;
  excludePatterns?: string[];
  includePatterns?: string[];
  outputFormat?: 'markdown' | 'json';
  prioritizeFiles?: string[];
  includeMetadata?: boolean;
  useASTAnalysis?: boolean;
  maxTokens?: number;
  styling?: StylingOptions;
}