from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="automarkdown",
    version="1.0.2",
    author="harshpreet931",
    author_email="",
    description="Intelligently convert codebases into markdown for LLMs to process and provide optimal insights",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/harshpreet931/autoMarkdown",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Topic :: Software Development :: Documentation",
        "Topic :: Text Processing :: Markup",
        "Topic :: Utilities",
    ],
    python_requires=">=3.7",
    install_requires=[
        "click>=8.0.0",
        "gitignore-parser>=0.1.0",
        "colorama>=0.4.0",
    ],
    entry_points={
        "console_scripts": [
            "automarkdown=automarkdown.cli:main",
        ],
    },
    keywords="markdown codebase llm converter documentation automation",
    project_urls={
        "Bug Reports": "https://github.com/harshpreet931/autoMarkdown/issues",
        "Source": "https://github.com/harshpreet931/autoMarkdown",
        "Documentation": "https://github.com/harshpreet931/autoMarkdown#readme",
    },
)