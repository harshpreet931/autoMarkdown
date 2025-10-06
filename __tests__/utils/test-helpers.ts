import * as fs from 'fs';
import * as path from 'path';

export const createTempFile = (content: string, extension = '.ts'): string => {
  const tempDir = path.join(__dirname, '../../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const tempFile = path.join(tempDir, `test-${Date.now()}${extension}`);
  fs.writeFileSync(tempFile, content);
  return tempFile;
};

export const cleanupTempFiles = (): void => {
  const tempDir = path.join(__dirname, '../../temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
};

export const readFixture = (fixtureName: string): string => {
  const fixturePath = path.join(__dirname, '../fixtures', fixtureName);
  return fs.readFileSync(fixturePath, 'utf-8');
};

export const mockConsole = () => {
  const mockLog = jest.spyOn(console, 'log').mockImplementation();
  const mockError = jest.spyOn(console, 'error').mockImplementation();
  const mockWarn = jest.spyOn(console, 'warn').mockImplementation();
  const mockInfo = jest.spyOn(console, 'info').mockImplementation();

  return {
    mockLog,
    mockError,
    mockWarn,
    mockInfo,
    restore: () => {
      mockLog.mockRestore();
      mockError.mockRestore();
      mockWarn.mockRestore();
      mockInfo.mockRestore();
    }
  };
};