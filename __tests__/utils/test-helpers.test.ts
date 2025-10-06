import * as fs from 'fs';
import { createTempFile, cleanupTempFiles, mockConsole } from './test-helpers';

describe('test-helpers', () => {
  afterEach(() => {
    cleanupTempFiles();
  });
  
  it('should create and cleanup temp files', () => {
    const content = 'test content';
    const tempFile = createTempFile(content);
    expect(fs.existsSync(tempFile)).toBe(true);
    expect(fs.readFileSync(tempFile, 'utf-8')).toBe(content);
  });

  it('should mock console methods', () => {
    const consoleMock = mockConsole();
    console.log('test');
    expect(consoleMock.mockLog).toHaveBeenCalledWith('test');
    consoleMock.restore();
  });
});