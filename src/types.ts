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
}