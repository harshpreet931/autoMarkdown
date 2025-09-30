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
}

export interface DependencyGraph {
  [filePath: string]: {
    dependencies: string[];
    dependents: string[];
    centrality: number;
  };
}

export class ASTAnalyzer {
  async analyzeFile(filePath: string, content: string, language: string): Promise<ASTMetrics> {
    const metrics: ASTMetrics = {
      exportCount: 0,
      importCount: 0,
      functionCount: 0,
      classCount: 0,
      interfaceCount: 0,
      typeCount: 0,
      complexity: 0,
      dependencies: [],
      exports: []
    };

    try {
      switch (language) {
        case 'typescript':
        case 'tsx':
          return this.analyzeTypeScript(content, metrics);
        case 'javascript':
        case 'jsx':
          return this.analyzeJavaScript(content, metrics);
        case 'python':
          return this.analyzePython(content, metrics);
        default:
          return this.analyzeGeneric(content, metrics);
      }
    } catch (error) {
      // If AST parsing fails, fall back to simple heuristics
      return this.analyzeGeneric(content, metrics);
    }
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
      // Fall back to regex analysis if parsing fails
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

    // Export score (files that provide APIs are important)
    score += metrics.exportCount * 3;
    score += metrics.exports.length * 2;

    // Complexity score (moderate complexity is good, too high is bad)
    if (metrics.complexity > 0 && metrics.complexity <= 20) {
      score += Math.min(metrics.complexity, 10) * 0.5;
    } else if (metrics.complexity > 20) {
      score -= (metrics.complexity - 20) * 0.1;
    }

    // Code structure score
    score += metrics.functionCount * 0.5;
    score += metrics.classCount * 2;
    score += metrics.interfaceCount * 3;
    score += metrics.typeCount * 2;

    // Centrality score (how connected this file is)
    score += centrality * 5;

    // Import penalty (files with too many dependencies might be less important)
    if (metrics.importCount > 10) {
      score -= (metrics.importCount - 10) * 0.2;
    }

    return Math.max(score, 0);
  }
}