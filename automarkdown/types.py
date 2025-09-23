from dataclasses import dataclass
from typing import List, Optional, Dict, Any, Union

@dataclass
class FileInfo:
    path: str
    content: str
    language: str
    size: int
    importance: float

@dataclass
class ProjectStructure:
    name: str
    type: str  # 'file' or 'directory'
    children: Optional[List['ProjectStructure']] = None
    path: str = ""

@dataclass
class ParsedProject:
    files: List[FileInfo]
    structure: ProjectStructure
    summary: str

@dataclass
class ConversionOptions:
    include_hidden: bool = False
    max_file_size: int = 1024 * 1024  # 1MB
    exclude_patterns: List[str] = None
    include_patterns: List[str] = None
    output_format: str = 'markdown'
    prioritize_files: List[str] = None
    include_metadata: bool = True
    
    def __post_init__(self):
        if self.exclude_patterns is None:
            self.exclude_patterns = ['node_modules/**', '.git/**', 'dist/**', 'build/**', '*.log']
        if self.include_patterns is None:
            self.include_patterns = ['**/*']
        if self.prioritize_files is None:
            self.prioritize_files = ['README.md', 'package.json', 'requirements.txt', 'main.py', 'index.js']