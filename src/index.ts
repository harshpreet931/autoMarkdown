import { CodebaseParser } from './parser';
import { MarkdownConverter } from './converter';
import { ConversionOptions } from './types';

export { CodebaseParser, MarkdownConverter, ConversionOptions };
export * from './types';

export class AutoMarkdown {
  private parser: CodebaseParser;
  private converter: MarkdownConverter;

  constructor(options: ConversionOptions = {}) {
    this.parser = new CodebaseParser(options);
    this.converter = new MarkdownConverter(options);
  }

  async convertProject(projectPath: string): Promise<string> {
    const project = await this.parser.parseProject(projectPath);
    return this.converter.convertToMarkdown(project);
  }

  async convertToJson(projectPath: string): Promise<string> {
    const project = await this.parser.parseProject(projectPath);
    return this.converter.convertToJson(project);
  }
}

export default AutoMarkdown;