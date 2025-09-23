#!/usr/bin/env python3

import click
import os
import json
from pathlib import Path
from colorama import init, Fore, Style

from .automarkdown import AutoMarkdown
from .types import ConversionOptions

# Initialize colorama for cross-platform colored output
init()

@click.group()
@click.version_option(version="1.0.2")
def cli():
    """AutoMarkdown - Intelligently convert codebases into markdown for LLMs"""
    pass

@cli.command()
@click.argument('path', type=click.Path(exists=True, file_okay=False, dir_okay=True))
@click.option('-o', '--output', type=click.Path(), help='Output file path (default: stdout)')
@click.option('-f', '--format', type=click.Choice(['markdown', 'json']), default='markdown', 
              help='Output format')
@click.option('--include-hidden', is_flag=True, help='Include hidden files and directories')
@click.option('--max-size', type=int, default=1048576, help='Maximum file size in bytes')
@click.option('--exclude', default='node_modules/**,.git/**,dist/**,build/**', 
              help='Comma-separated exclude patterns')
@click.option('--include', default='**/*', help='Comma-separated include patterns')
@click.option('--no-metadata', is_flag=True, help='Exclude file metadata from output')
def convert(path, output, format, include_hidden, max_size, exclude, include, no_metadata):
    """Convert a codebase to markdown or JSON"""
    try:
        print(f"{Fore.BLUE}Analyzing codebase...{Style.RESET_ALL}")
        
        # Parse options
        options = ConversionOptions(
            include_hidden=include_hidden,
            max_file_size=max_size,
            exclude_patterns=[p.strip() for p in exclude.split(',')],
            include_patterns=[p.strip() for p in include.split(',')],
            output_format=format,
            include_metadata=not no_metadata
        )
        
        automarkdown = AutoMarkdown(options)
        
        print(f"{Fore.BLUE}Converting to {format}...{Style.RESET_ALL}")
        
        if format == 'json':
            result = automarkdown.convert_to_json(path)
        else:
            result = automarkdown.convert_project(path)
        
        # Output handling
        if output:
            with open(output, 'w', encoding='utf-8') as f:
                f.write(result)
            print(f"{Fore.GREEN}Output saved to: {output}{Style.RESET_ALL}")
        else:
            print(f"\n{Fore.CYAN}--- OUTPUT ---{Style.RESET_ALL}\n")
            print(result)
        
        # Stats
        lines = result.count('\n') + 1
        size = len(result.encode('utf-8'))
        print(f"\n{Fore.BLUE}Generated {lines} lines ({size / 1024:.2f} KB){Style.RESET_ALL}")
        
    except Exception as e:
        print(f"{Fore.RED}Error: {str(e)}{Style.RESET_ALL}")
        raise click.Abort()

@cli.command()
def init():
    """Create a configuration file"""
    config_content = {
        "include_hidden": False,
        "max_file_size": 1048576,
        "exclude_patterns": [
            "node_modules/**",
            ".git/**",
            "dist/**",
            "build/**",
            "*.log"
        ],
        "include_patterns": ["**/*"],
        "output_format": "markdown",
        "prioritize_files": [
            "README.md",
            "package.json",
            "requirements.txt",
            "main.py",
            "index.js"
        ],
        "include_metadata": True
    }
    
    with open('automarkdown.config.json', 'w') as f:
        json.dump(config_content, f, indent=2)
    
    print(f"{Fore.GREEN}Created automarkdown.config.json{Style.RESET_ALL}")

@cli.command()
def examples():
    """Show usage examples"""
    print(f"{Fore.BLUE}AutoMarkdown Usage Examples:\n{Style.RESET_ALL}")
    
    examples = [
        ("Basic conversion", "automarkdown convert ./my-project"),
        ("Save to file", "automarkdown convert ./my-project -o project-docs.md"),
        ("JSON output", "automarkdown convert ./my-project -f json -o project.json"),
        ("Include hidden files", "automarkdown convert ./my-project --include-hidden"),
        ("Custom exclusions", "automarkdown convert ./my-project --exclude '*.test.py,coverage/**'"),
        ("Larger file limit", "automarkdown convert ./my-project --max-size 2097152"),
    ]
    
    for title, command in examples:
        print(f"{Fore.YELLOW}{title}:{Style.RESET_ALL}")
        print(f"  {Fore.CYAN}{command}{Style.RESET_ALL}\n")

def main():
    """Main entry point"""
    cli()

if __name__ == '__main__':
    main()