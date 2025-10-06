import { Converter } from '../src/converter';
import { createTempFile, cleanupTempFiles, mockConsole } from './utils/test-helpers';
import * as fs from 'fs';
import * as path from 'path';

describe('Converter', () => {
  let converter: Converter;
  const consoleMock = mockConsole();

  beforeEach(() => {
    converter = new Converter();
  });

  afterEach(() => {
    cleanupTempFiles();
    consoleMock.restore();
  });

  it('should convert TypeScript files to markdown', async () => {
    const content = `
      /**
       * Main component description
       */
      export class MainComponent {
        private count: number = 0;
        
        /**
         * Increments the counter
         */
        public increment(): void {
          this.count++;
        }
      }
    `;
    
    const filePath = createTempFile(content);
    const result = await converter.convertFile(filePath);
    
    expect(result).toContain('# MainComponent');
    expect(result).toContain('## Methods');
    expect(result).toContain('### increment');
  });

  it('should handle multiple files in a directory', async () => {
    const files = [
      { name: 'component1.ts', content: 'export class Component1 {}' },
      { name: 'component2.ts', content: 'export class Component2 {}' },
    ];
    
    const tempDir = path.join(__dirname, '../temp/multi');
    fs.mkdirSync(tempDir, { recursive: true });
    
    files.forEach(file => {
      fs.writeFileSync(path.join(tempDir, file.name), file.content);
    });
    
    const result = await converter.convertDirectory(tempDir);
    
    expect(result).toContain('Component1');
    expect(result).toContain('Component2');
  });

  it('should respect ignore patterns', async () => {
    const content = 'export class TestComponent {}';
    const filePath = createTempFile(content);
    
    converter.addIgnorePattern('**/temp/**');
    const result = await converter.convertFile(filePath);
    
    expect(result).toBe(''); // Should be ignored
  });
});