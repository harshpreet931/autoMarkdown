"""
AutoMarkdown - Intelligently convert codebases into markdown for LLMs
"""

from .parser import CodebaseParser
from .converter import MarkdownConverter
from .automarkdown import AutoMarkdown

__version__ = "1.0.2"
__author__ = "harshpreet931"
__email__ = ""

__all__ = ["CodebaseParser", "MarkdownConverter", "AutoMarkdown"]