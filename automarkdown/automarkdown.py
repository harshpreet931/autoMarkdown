from .parser import CodebaseParser
from .converter import MarkdownConverter
from .types import ConversionOptions

class AutoMarkdown:
    """Main AutoMarkdown class for converting codebases to markdown"""
    
    def __init__(self, options: ConversionOptions = None):
        """Initialize AutoMarkdown with options"""
        self.options = options or ConversionOptions()
        self.parser = CodebaseParser(self.options)
        self.converter = MarkdownConverter(self.options)
    
    def convert_project(self, project_path: str) -> str:
        """Convert project to markdown"""
        project = self.parser.parse_project(project_path)
        return self.converter.convert_to_markdown(project)
    
    def convert_to_json(self, project_path: str) -> str:
        """Convert project to JSON"""
        project = self.parser.parse_project(project_path)
        return self.converter.convert_to_json(project)