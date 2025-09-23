import os
import glob
import fnmatch
from typing import List, Dict
from pathlib import Path
import gitignore_parser

from .types import FileInfo, ParsedProject, ProjectStructure, ConversionOptions

class CodebaseParser:
    def __init__(self, options: ConversionOptions = None):
        self.options = options or ConversionOptions()
        
    def parse_project(self, project_path: str) -> ParsedProject:
        """Parse a project and return structured data"""
        project_path = Path(project_path).resolve()
        
        files = self._get_project_files(project_path)
        structure = self._build_project_structure(project_path)
        summary = self._generate_project_summary(files, structure)
        
        # Sort files by importance
        files.sort(key=lambda x: x.importance, reverse=True)
        
        return ParsedProject(
            files=files,
            structure=structure,
            summary=summary
        )
    
    def _get_project_files(self, project_path: Path) -> List[FileInfo]:
        """Get all relevant files from the project"""
        files = []
        
        # Load gitignore if exists
        gitignore_path = project_path / '.gitignore'
        gitignore_matcher = None
        if gitignore_path.exists():
            gitignore_matcher = gitignore_parser.parse_gitignore(gitignore_path)
        
        for root, dirs, filenames in os.walk(project_path):
            root_path = Path(root)
            relative_root = root_path.relative_to(project_path)
            
            # Filter directories
            dirs[:] = [d for d in dirs if self._should_include_directory(d, relative_root)]
            
            for filename in filenames:
                file_path = root_path / filename
                relative_path = file_path.relative_to(project_path)
                
                if self._should_include_file(file_path, relative_path, gitignore_matcher):
                    try:
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                            
                        file_info = FileInfo(
                            path=str(relative_path),
                            content=content,
                            language=self._detect_language(file_path),
                            size=file_path.stat().st_size,
                            importance=self._calculate_importance(str(relative_path), content)
                        )
                        files.append(file_info)
                        
                    except (UnicodeDecodeError, PermissionError, OSError):
                        # Skip files that can't be read
                        continue
                        
        return files
    
    def _should_include_directory(self, dirname: str, relative_path: Path) -> bool:
        """Check if directory should be included"""
        if not self.options.include_hidden and dirname.startswith('.'):
            return False
            
        full_relative = str(relative_path / dirname)
        
        # Check exclude patterns
        for pattern in self.options.exclude_patterns:
            if fnmatch.fnmatch(full_relative, pattern) or fnmatch.fnmatch(dirname, pattern):
                return False
                
        return True
    
    def _should_include_file(self, file_path: Path, relative_path: Path, gitignore_matcher) -> bool:
        """Check if file should be included"""
        filename = file_path.name
        
        # Check hidden files
        if not self.options.include_hidden and filename.startswith('.'):
            return False
            
        # Check file size
        try:
            if file_path.stat().st_size > self.options.max_file_size:
                return False
        except OSError:
            return False
            
        # Check gitignore
        if gitignore_matcher and gitignore_matcher(str(relative_path)):
            return False
            
        # Check exclude patterns
        for pattern in self.options.exclude_patterns:
            if fnmatch.fnmatch(str(relative_path), pattern) or fnmatch.fnmatch(filename, pattern):
                return False
                
        # Check include patterns
        for pattern in self.options.include_patterns:
            if fnmatch.fnmatch(str(relative_path), pattern) or fnmatch.fnmatch(filename, pattern):
                return True
                
        return False
    
    def _build_project_structure(self, project_path: Path) -> ProjectStructure:
        """Build hierarchical project structure"""
        def build_structure(current_path: Path, relative_path: Path = Path()) -> ProjectStructure:
            name = current_path.name
            
            if current_path.is_file():
                return ProjectStructure(
                    name=name,
                    type='file',
                    path=str(relative_path)
                )
            else:
                children = []
                try:
                    for item in sorted(current_path.iterdir()):
                        if self._should_include_in_structure(item.name):
                            child_relative = relative_path / item.name
                            child = build_structure(item, child_relative)
                            children.append(child)
                except PermissionError:
                    pass
                    
                return ProjectStructure(
                    name=name,
                    type='directory',
                    children=children,
                    path=str(relative_path)
                )
        
        return build_structure(project_path)
    
    def _should_include_in_structure(self, item_name: str) -> bool:
        """Check if item should be included in structure tree"""
        excluded_items = {'.git', 'node_modules', '.DS_Store', 'dist', 'build', '__pycache__'}
        return item_name not in excluded_items and (self.options.include_hidden or not item_name.startswith('.'))
    
    def _detect_language(self, file_path: Path) -> str:
        """Detect programming language from file extension"""
        ext = file_path.suffix.lower()
        
        language_map = {
            '.js': 'javascript',
            '.jsx': 'jsx',
            '.ts': 'typescript',
            '.tsx': 'tsx',
            '.py': 'python',
            '.java': 'java',
            '.c': 'c',
            '.cpp': 'cpp', '.cc': 'cpp', '.cxx': 'cpp',
            '.h': 'c', '.hpp': 'cpp',
            '.cs': 'csharp',
            '.php': 'php',
            '.rb': 'ruby',
            '.go': 'go',
            '.rs': 'rust',
            '.swift': 'swift',
            '.kt': 'kotlin',
            '.scala': 'scala',
            '.sh': 'bash', '.bash': 'bash',
            '.zsh': 'zsh',
            '.fish': 'fish',
            '.ps1': 'powershell',
            '.sql': 'sql',
            '.html': 'html',
            '.css': 'css',
            '.scss': 'scss', '.sass': 'sass',
            '.less': 'less',
            '.xml': 'xml',
            '.json': 'json',
            '.yaml': 'yaml', '.yml': 'yaml',
            '.toml': 'toml',
            '.ini': 'ini', '.cfg': 'ini', '.conf': 'ini',
            '.md': 'markdown', '.markdown': 'markdown',
            '.txt': 'text',
            '.dockerfile': 'dockerfile',
            '.vue': 'vue',
            '.svelte': 'svelte'
        }
        
        return language_map.get(ext, 'text')
    
    def _calculate_importance(self, file_path: str, content: str) -> float:
        """Calculate file importance score"""
        importance = 1.0
        filename = Path(file_path).name.lower()
        
        # Prioritize certain files
        for priority_file in self.options.prioritize_files:
            if priority_file.lower() in filename:
                importance += 10
                break
        
        # Configuration files
        config_files = ['package.json', 'requirements.txt', 'cargo.toml', 'pom.xml', 'build.gradle']
        if any(cf in filename for cf in config_files):
            importance += 8
            
        # Entry points
        entry_files = ['main.py', 'index.js', 'app.py', 'server.js', 'main.js']
        if any(ef in filename for ef in entry_files):
            importance += 7
            
        # Documentation
        if 'readme' in filename or 'doc' in filename:
            importance += 6
            
        # Test files (lower importance)
        if 'test' in file_path or 'spec' in file_path:
            importance -= 2
            
        # File size factor
        content_length = len(content)
        if content_length < 1000:
            importance += 2
        elif content_length > 10000:
            importance -= 1
            
        # Code complexity indicators
        complexity_keywords = ['class', 'function', 'def', 'interface', 'type', 'export', 'import']
        keyword_count = sum(content.lower().count(keyword) for keyword in complexity_keywords)
        importance += min(keyword_count / 10, 3)
        
        return max(importance, 0)
    
    def _generate_project_summary(self, files: List[FileInfo], structure: ProjectStructure) -> str:
        """Generate project summary"""
        total_files = len(files)
        languages = list(set(f.language for f in files))
        total_size = sum(f.size for f in files)
        
        return (f"Project contains {total_files} files in {len(languages)} different languages "
                f"({', '.join(languages)}). Total size: {total_size / 1024:.2f} KB.")