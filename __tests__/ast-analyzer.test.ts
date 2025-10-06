import { ASTAnalyzer } from '../src/ast-analyzer';
import { createTempFile, cleanupTempFiles } from './utils/test-helpers';

describe('ASTAnalyzer', () => {
  let analyzer: ASTAnalyzer;

  beforeEach(() => {
    analyzer = new ASTAnalyzer();
  });

  afterEach(() => {
    cleanupTempFiles();
  });

  describe('analyzeFile', () => {
    it('should analyze TypeScript files correctly', async () => {
      const content = `
        import { useState } from 'react';
        import { Something } from './something';
        
        export interface Props {
          name: string;
        }
        
        export class MyComponent {
          private count = 0;
          
          public increment(): void {
            this.count++;
          }
        }
      `;
      
      const filePath = createTempFile(content);
      const metrics = await analyzer.analyzeFile(filePath, content, 'typescript');
      
      expect(metrics.importCount).toBe(2);
      expect(metrics.exportCount).toBe(2);
      expect(metrics.classCount).toBe(1);
      expect(metrics.interfaceCount).toBe(1);
      expect(metrics.complexity).toBeGreaterThan(0);
    });

    it('should handle JavaScript files', async () => {
      const content = `
        const express = require('express');
        const app = express();
        
        function handleRequest(req, res) {
          if (req.method === 'POST') {
            res.json({ success: true });
          } else {
            res.status(405).send('Method not allowed');
          }
        }
        
        module.exports = { handleRequest };
      `;
      
      const filePath = createTempFile(content, '.js');
      const metrics = await analyzer.analyzeFile(filePath, content, 'javascript');
      
      expect(metrics.functionCount).toBe(1);
      expect(metrics.complexity).toBeGreaterThan(1); // Due to if-else
    });
  });

  describe('framework detection', () => {
    it('should detect React usage', async () => {
      const content = `
        import React from 'react';
        import { useState } from 'react';
        
        export function MyComponent() {
          const [state, setState] = useState(0);
          return <div>{state}</div>;
        }
      `;
      
      const filePath = createTempFile(content);
      const metrics = await analyzer.analyzeFile(filePath, content, 'typescript');
      
      expect(metrics.frameworks).toContain('react');
    });
  });
});