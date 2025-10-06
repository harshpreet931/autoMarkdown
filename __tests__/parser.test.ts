import { Parser } from '../src/parser';
import { createTempFile, cleanupTempFiles } from './utils/test-helpers';

describe('Parser', () => {
  afterEach(() => {
    cleanupTempFiles();
  });

  it('should parse TypeScript files correctly', async () => {
    const content = `
      import { Something } from './something';
      
      export interface Config {
        name: string;
        options: string[];
      }
      
      export function process(config: Config): void {
        console.log(config.name);
      }
    `;
    
    const filePath = createTempFile(content);
    const parser = new Parser();
    const result = await parser.parseFile(filePath);
    
    expect(result).toBeDefined();
    expect(result.metrics).toBeDefined();
    expect(result.metrics.exportCount).toBe(2);
    expect(result.metrics.importCount).toBe(1);
  });

  it('should handle non-TypeScript files gracefully', async () => {
    const content = `
      # Python-like code
      def main():
          print("Hello")
          
      if __name__ == "__main__":
          main()
    `;
    
    const filePath = createTempFile(content, '.py');
    const parser = new Parser();
    const result = await parser.parseFile(filePath);
    
    expect(result).toBeDefined();
    expect(result.metrics).toBeDefined();
    // Should provide basic metrics for non-TS files
    expect(result.metrics.functionCount).toBeGreaterThanOrEqual(0);
  });
});