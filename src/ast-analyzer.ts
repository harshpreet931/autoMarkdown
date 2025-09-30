import { parse as parseTypeScript } from '@typescript-eslint/typescript-estree';
import { parse as parseJavaScript } from 'acorn';
import * as path from 'path';

export interface ASTMetrics {
  exportCount: number;
  importCount: number;
  functionCount: number;
  classCount: number;
  interfaceCount: number;
  typeCount: number;
  complexity: number;
  dependencies: string[];
  exports: string[];
  frameworks: string[];
  isEntryPoint: boolean;
  isTestFile: boolean;
  isConfigFile: boolean;
  publicMethods: number;
}

export interface DependencyGraph {
  [filePath: string]: {
    dependencies: string[];
    dependents: string[];
    centrality: number;
  };
}

export class ASTAnalyzer {
  private astCache = new Map<string, ASTMetrics>();

  async analyzeFile(filePath: string, content: string, language: string): Promise<ASTMetrics> {
    // Create cache key from file path and content hash
    const contentHash = this.hashContent(content);
    const cacheKey = `${filePath}:${contentHash}`;

    // Check cache first
    if (this.astCache.has(cacheKey)) {
      return this.astCache.get(cacheKey)!;
    }
    const metrics: ASTMetrics = {
      exportCount: 0,
      importCount: 0,
      functionCount: 0,
      classCount: 0,
      interfaceCount: 0,
      typeCount: 0,
      complexity: 0,
      dependencies: [],
      exports: [],
      frameworks: [],
      isEntryPoint: false,
      isTestFile: false,
      isConfigFile: false,
      publicMethods: 0
    };

    // Detect file characteristics
    this.detectFileCharacteristics(filePath, content, metrics);

    let result: ASTMetrics;

    try {
      switch (language) {
        case 'typescript':
        case 'tsx':
          result = this.analyzeTypeScript(content, metrics);
          break;
        case 'javascript':
        case 'jsx':
          result = this.analyzeJavaScript(content, metrics);
          break;
        case 'python':
          result = this.analyzePython(content, metrics);
          break;
        default:
          result = this.analyzeGeneric(content, metrics);
          break;
      }
    } catch (error) {
      // Silent fallback to heuristic analysis
      result = this.analyzeGeneric(content, metrics);
    }

    // Cache the result
    this.astCache.set(cacheKey, result);
    return result;
  }

  private analyzeTypeScript(content: string, metrics: ASTMetrics): ASTMetrics {
    try {
      const ast = parseTypeScript(content, {
        loc: true,
        range: true,
        tokens: false,
        comment: false,
        jsx: true
      });

      this.walkTypeScriptAST(ast, metrics);
    } catch (error) {
      // Silent fallback to regex analysis
      return this.analyzeGeneric(content, metrics);
    }

    return metrics;
  }

  private walkTypeScriptAST(node: any, metrics: ASTMetrics): void {
    if (!node || typeof node !== 'object') return;

    switch (node.type) {
      case 'ImportDeclaration':
        metrics.importCount++;
        if (node.source?.value) {
          metrics.dependencies.push(node.source.value);
        }
        break;

      case 'ExportNamedDeclaration':
      case 'ExportDefaultDeclaration':
      case 'ExportAllDeclaration':
        metrics.exportCount++;
        if (node.declaration) {
          this.extractExportNames(node.declaration, metrics);
        }
        break;

      case 'FunctionDeclaration':
      case 'FunctionExpression':
      case 'ArrowFunctionExpression':
        metrics.functionCount++;
        metrics.complexity += this.calculateFunctionComplexity(node);
        break;

      case 'ClassDeclaration':
      case 'ClassExpression':
        metrics.classCount++;
        if (node.id?.name) {
          metrics.exports.push(node.id.name);
        }
        break;

      case 'TSInterfaceDeclaration':
        metrics.interfaceCount++;
        if (node.id?.name) {
          metrics.exports.push(node.id.name);
        }
        break;

      case 'TSTypeAliasDeclaration':
        metrics.typeCount++;
        if (node.id?.name) {
          metrics.exports.push(node.id.name);
        }
        break;

      case 'IfStatement':
      case 'SwitchStatement':
      case 'ConditionalExpression':
      case 'LogicalExpression':
        metrics.complexity += 1;
        break;

      case 'ForStatement':
      case 'ForInStatement':
      case 'ForOfStatement':
      case 'WhileStatement':
      case 'DoWhileStatement':
        metrics.complexity += 2;
        break;

      case 'TryStatement':
        metrics.complexity += 1;
        if (node.handler) metrics.complexity += 1;
        break;
    }

    // Recursively walk all child nodes
    for (const key in node) {
      if (key === 'parent' || key === 'leadingComments' || key === 'trailingComments') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(item => this.walkTypeScriptAST(item, metrics));
      } else if (child && typeof child === 'object') {
        this.walkTypeScriptAST(child, metrics);
      }
    }
  }

  private analyzeJavaScript(content: string, metrics: ASTMetrics): ASTMetrics {
    try {
      const ast = parseJavaScript(content, {
        ecmaVersion: 2022,
        sourceType: 'module',
        allowImportExportEverywhere: true,
        allowAwaitOutsideFunction: true
      });

      this.walkJavaScriptAST(ast, metrics);
    } catch (error) {
      // Silent fallback to generic analysis
      return this.analyzeGeneric(content, metrics);
    }

    return metrics;
  }

  private walkJavaScriptAST(node: any, metrics: ASTMetrics): void {
    if (!node || typeof node !== 'object') return;

    switch (node.type) {
      case 'ImportDeclaration':
        metrics.importCount++;
        if (node.source?.value) {
          metrics.dependencies.push(node.source.value);
        }
        break;

      case 'ExportNamedDeclaration':
      case 'ExportDefaultDeclaration':
      case 'ExportAllDeclaration':
        metrics.exportCount++;
        break;

      case 'FunctionDeclaration':
      case 'FunctionExpression':
      case 'ArrowFunctionExpression':
        metrics.functionCount++;
        metrics.complexity += this.calculateFunctionComplexity(node);
        break;

      case 'ClassDeclaration':
      case 'ClassExpression':
        metrics.classCount++;
        break;

      case 'IfStatement':
      case 'SwitchStatement':
      case 'ConditionalExpression':
      case 'LogicalExpression':
        metrics.complexity += 1;
        break;

      case 'ForStatement':
      case 'ForInStatement':
      case 'ForOfStatement':
      case 'WhileStatement':
      case 'DoWhileStatement':
        metrics.complexity += 2;
        break;
    }

    // Recursively walk all child nodes
    for (const key in node) {
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(item => this.walkJavaScriptAST(item, metrics));
      } else if (child && typeof child === 'object') {
        this.walkJavaScriptAST(child, metrics);
      }
    }
  }

  private analyzePython(content: string, metrics: ASTMetrics): ASTMetrics {
    // For Python, we'll use regex patterns since we don't have a Python AST parser in Node.js
    // This could be improved by calling a Python script or using a Python AST library

    // Count imports
    const importMatches = content.match(/^(import\s+\w+|from\s+\w+\s+import)/gm) || [];
    metrics.importCount = importMatches.length;

    // Extract dependencies
    const fromImports = content.match(/^from\s+(\w+(?:\.\w+)*)\s+import/gm) || [];
    const directImports = content.match(/^import\s+(\w+(?:\.\w+)*)/gm) || [];

    fromImports.forEach(match => {
      const dep = match.match(/^from\s+(\w+(?:\.\w+)*)/)?.[1];
      if (dep) metrics.dependencies.push(dep);
    });

    directImports.forEach(match => {
      const dep = match.match(/^import\s+(\w+(?:\.\w+)*)/)?.[1];
      if (dep) metrics.dependencies.push(dep);
    });

    // Count function definitions
    const functionMatches = content.match(/^def\s+\w+\s*\(/gm) || [];
    metrics.functionCount = functionMatches.length;

    // Count class definitions
    const classMatches = content.match(/^class\s+\w+/gm) || [];
    metrics.classCount = classMatches.length;

    // Simple complexity calculation for Python
    const complexityPatterns = [
      /\bif\b/g, /\belif\b/g, /\belse\b/g,
      /\bfor\b/g, /\bwhile\b/g,
      /\btry\b/g, /\bexcept\b/g,
      /\band\b/g, /\bor\b/g
    ];

    complexityPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      metrics.complexity += matches.length;
    });

    return metrics;
  }

  private analyzeGeneric(content: string, metrics: ASTMetrics): ASTMetrics {
    // Fallback analysis using regex patterns for any language

    // Count common import/include patterns
    const importPatterns = [
      /^#include\s+/gm,        // C/C++
      /^import\s+/gm,          // Java, Python, JavaScript
      /^from\s+\w+\s+import/gm, // Python
      /^use\s+/gm,             // Rust
      /^require\s*\(/gm,       // Node.js
      /^\s*\@import/gm         // CSS
    ];

    importPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      metrics.importCount += matches.length;
    });

    // Count function definitions across languages
    const functionPatterns = [
      /\bfunction\s+\w+/g,     // JavaScript
      /\bdef\s+\w+/g,          // Python
      /\bfn\s+\w+/g,           // Rust
      /\w+\s*\([^)]*\)\s*{/g,  // C/C++/Java/Go
      /\bpublic\s+\w+\s+\w+\s*\(/g // Java methods
    ];

    functionPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      metrics.functionCount += matches.length;
    });

    // Count class definitions
    const classPatterns = [
      /\bclass\s+\w+/g,        // Most languages
      /\bstruct\s+\w+/g,       // C/C++/Rust/Go
      /\binterface\s+\w+/g,    // Java/TypeScript/Go
      /\btrait\s+\w+/g         // Rust
    ];

    classPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      metrics.classCount += matches.length;
    });

    // Basic complexity indicators
    const complexityPatterns = [
      /\bif\b/g, /\belse\b/g, /\belseif\b/g, /\belif\b/g,
      /\bfor\b/g, /\bwhile\b/g, /\bdo\b/g,
      /\bswitch\b/g, /\bmatch\b/g,
      /\btry\b/g, /\bcatch\b/g, /\bexcept\b/g,
      /\?.*:/g, // Ternary operators
      /&&|\|\|/g // Logical operators
    ];

    complexityPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      metrics.complexity += matches.length;
    });

    return metrics;
  }

  private extractExportNames(node: any, metrics: ASTMetrics): void {
    if (!node) return;

    if (node.type === 'FunctionDeclaration' && node.id?.name) {
      metrics.exports.push(node.id.name);
    } else if (node.type === 'ClassDeclaration' && node.id?.name) {
      metrics.exports.push(node.id.name);
    } else if (node.type === 'VariableDeclaration') {
      node.declarations?.forEach((decl: any) => {
        if (decl.id?.name) {
          metrics.exports.push(decl.id.name);
        }
      });
    }
  }

  private calculateFunctionComplexity(_node: any): number {
    // Simple cyclomatic complexity: start with 1, add 1 for each decision point
    let complexity = 1;

    // This would need a full AST walk to be accurate
    // For now, return a base complexity
    return complexity;
  }

  buildDependencyGraph(files: Array<{path: string, metrics: ASTMetrics}>): DependencyGraph {
    const graph: DependencyGraph = {};

    // Initialize graph nodes
    files.forEach(file => {
      graph[file.path] = {
        dependencies: [],
        dependents: [],
        centrality: 0
      };
    });

    // Build dependency relationships
    files.forEach(file => {
      file.metrics.dependencies.forEach(dep => {
        // Try to resolve dependency to actual file path
        const resolvedPath = this.resolveDependency(dep, file.path, files);
        if (resolvedPath && graph[resolvedPath]) {
          graph[file.path].dependencies.push(resolvedPath);
          graph[resolvedPath].dependents.push(file.path);
        }
      });
    });

    // Calculate centrality scores (simplified PageRank-like algorithm)
    this.calculateCentrality(graph);

    return graph;
  }

  private resolveDependency(dep: string, fromFile: string, files: Array<{path: string}>): string | null {
    // Handle relative imports
    if (dep.startsWith('./') || dep.startsWith('../')) {
      const fromDir = path.dirname(fromFile);
      const resolved = path.resolve(fromDir, dep);

      // Try different extensions
      const extensions = ['.ts', '.tsx', '.js', '.jsx', '.py', ''];
      for (const ext of extensions) {
        const candidate = resolved + ext;
        if (files.some(f => f.path === candidate)) {
          return candidate;
        }
      }

      // Try index files
      for (const ext of extensions.slice(0, -1)) {
        const candidate = path.join(resolved, 'index' + ext);
        if (files.some(f => f.path === candidate)) {
          return candidate;
        }
      }
    }

    // Handle absolute imports (would need more sophisticated resolution)
    return null;
  }

  private calculateCentrality(graph: DependencyGraph): void {
    const nodes = Object.keys(graph);
    const dampingFactor = 0.85;
    const iterations = 10;

    // Initialize centrality scores
    nodes.forEach(node => {
      graph[node].centrality = 1.0;
    });

    // Iterative calculation (simplified PageRank)
    for (let i = 0; i < iterations; i++) {
      const newScores: {[key: string]: number} = {};

      nodes.forEach(node => {
        let score = (1 - dampingFactor);

        graph[node].dependents.forEach(dependent => {
          const dependentOutLinks = graph[dependent].dependencies.length;
          if (dependentOutLinks > 0) {
            score += dampingFactor * (graph[dependent].centrality / dependentOutLinks);
          }
        });

        newScores[node] = score;
      });

      // Update scores
      nodes.forEach(node => {
        graph[node].centrality = newScores[node];
      });
    }
  }

  calculateASTImportance(metrics: ASTMetrics, centrality: number): number {
    let score = 0;

    // Core functionality (highest priority)
    if (metrics.isEntryPoint) score += 20;
    if (this.isMainLogic(metrics)) score += 15;

    // API surface area
    score += metrics.exportCount * 3;
    score += metrics.publicMethods * 2;

    // Project role
    if (this.isFrameworkCore(metrics)) score += 10;
    if (metrics.isConfigFile) score += 8;

    // Framework-specific boosts
    metrics.frameworks.forEach(framework => {
      if (['react', 'vue', 'angular'].includes(framework)) {
        score += 5; // Frontend framework files are important
      }
      if (['express', 'fastify', 'nestjs'].includes(framework)) {
        score += 6; // Backend framework files are critical
      }
    });

    // Code quality indicators
    score += Math.min(metrics.complexity / 5, 5); // Sweet spot complexity
    score += centrality * 10; // Dependency importance

    // Context-aware scoring
    if (metrics.importCount === 0 && metrics.exportCount > 0) {
      score += 5; // Likely a utility/library file
    }

    // Penalties
    if (metrics.isTestFile) score *= 0.3;
    if (this.isGeneratedFile(metrics)) score *= 0.1;

    // Import penalty (files with too many dependencies might be less important)
    if (metrics.importCount > 10) {
      score -= (metrics.importCount - 10) * 0.2;
    }

    return Math.max(score, 0);
  }

  private isMainLogic(metrics: ASTMetrics): boolean {
    // Files with good balance of exports and complexity
    return metrics.exportCount > 3 &&
           metrics.functionCount > 5 &&
           metrics.complexity > 5 &&
           metrics.complexity < 50;
  }

  private isFrameworkCore(metrics: ASTMetrics): boolean {
    // Files that likely contain core framework setup
    return metrics.frameworks.length > 0 &&
           (metrics.exportCount > 0 || metrics.functionCount > 3);
  }

  private isGeneratedFile(metrics: ASTMetrics): boolean {
    // Simple heuristic for generated files
    return metrics.functionCount === 0 &&
           metrics.classCount === 0 &&
           metrics.exportCount === 0 &&
           metrics.complexity === 0;
  }

  private hashContent(content: string): string {
    // Simple hash function for content caching
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  // Clear cache when memory usage gets high
  clearCache(): void {
    this.astCache.clear();
  }

  private detectFileCharacteristics(filePath: string, content: string, metrics: ASTMetrics): void {
    // Detect frameworks
    metrics.frameworks = this.detectFrameworks(content);

    // Detect entry points
    metrics.isEntryPoint = this.isEntryPoint(filePath, content);

    // Detect test files
    metrics.isTestFile = this.isTestFile(filePath, content);

    // Detect config files
    metrics.isConfigFile = this.isConfigFile(filePath);
  }

  private detectFrameworks(content: string): string[] {
    const frameworks: string[] = [];

    // Frontend frameworks
    if (content.includes('react') || content.includes('React') || content.includes('jsx')) {
      frameworks.push('react');
    }
    if (content.includes('vue') || content.includes('Vue')) {
      frameworks.push('vue');
    }
    if (content.includes('angular') || content.includes('Angular') || content.includes('@angular')) {
      frameworks.push('angular');
    }
    if (content.includes('svelte') || content.includes('Svelte')) {
      frameworks.push('svelte');
    }

    // Backend frameworks
    if (content.includes('express') || content.includes('Express')) {
      frameworks.push('express');
    }
    if (content.includes('fastify') || content.includes('Fastify')) {
      frameworks.push('fastify');
    }
    if (content.includes('koa') || content.includes('Koa')) {
      frameworks.push('koa');
    }
    if (content.includes('nestjs') || content.includes('@nestjs')) {
      frameworks.push('nestjs');
    }

    // Testing frameworks
    if (content.includes('jest') || content.includes('Jest')) {
      frameworks.push('jest');
    }
    if (content.includes('mocha') || content.includes('Mocha')) {
      frameworks.push('mocha');
    }
    if (content.includes('cypress') || content.includes('Cypress')) {
      frameworks.push('cypress');
    }

    // Build tools
    if (content.includes('webpack') || content.includes('Webpack')) {
      frameworks.push('webpack');
    }
    if (content.includes('vite') || content.includes('Vite')) {
      frameworks.push('vite');
    }

    // Databases/ORMs
    if (content.includes('mongoose') || content.includes('Mongoose')) {
      frameworks.push('mongoose');
    }
    if (content.includes('prisma') || content.includes('Prisma')) {
      frameworks.push('prisma');
    }
    if (content.includes('typeorm') || content.includes('TypeORM')) {
      frameworks.push('typeorm');
    }

    return frameworks;
  }

  private isEntryPoint(filePath: string, content: string): boolean {
    const fileName = path.basename(filePath).toLowerCase();

    // Common entry point patterns
    if (['main.js', 'main.ts', 'index.js', 'index.ts', 'app.js', 'app.ts', 'server.js', 'server.ts'].includes(fileName)) {
      return true;
    }

    // Check for main function or app initialization patterns
    if (content.includes('function main(') ||
        content.includes('const main =') ||
        content.includes('app.listen(') ||
        content.includes('server.listen(') ||
        content.includes('if __name__ == "__main__"')) {
      return true;
    }

    return false;
  }

  private isTestFile(filePath: string, content: string): boolean {
    const fileName = path.basename(filePath).toLowerCase();

    // File name patterns
    if (fileName.includes('test') ||
        fileName.includes('spec') ||
        fileName.includes('.test.') ||
        fileName.includes('.spec.') ||
        filePath.includes('/test/') ||
        filePath.includes('/tests/') ||
        filePath.includes('/__tests__/')) {
      return true;
    }

    // Content patterns
    if (content.includes('describe(') ||
        content.includes('it(') ||
        content.includes('test(') ||
        content.includes('expect(') ||
        content.includes('assert(') ||
        content.includes('beforeEach(') ||
        content.includes('afterEach(')) {
      return true;
    }

    return false;
  }

  private isConfigFile(filePath: string): boolean {
    const fileName = path.basename(filePath).toLowerCase();

    // Configuration file patterns
    const configPatterns = [
      /\.(config|rc)\.(js|ts|json|yml|yaml)$/,
      /^(webpack|babel|eslint|prettier|jest|tsconfig|vite|rollup|tailwind)\.config\./,
      /^\..*rc(\.|$)/,
      /^(package|composer|cargo|requirements)\.json$/,
      /^requirements\.txt$/,
      /^Dockerfile$/,
      /^docker-compose\./,
      /^\.env/
    ];

    return configPatterns.some(pattern => pattern.test(fileName)) ||
           ['webpack', 'babel', 'eslint', 'prettier', 'jest', 'tsconfig', 'vite', 'rollup'].some(tool =>
             fileName.includes(tool));
  }
}