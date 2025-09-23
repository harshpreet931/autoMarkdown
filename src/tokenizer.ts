export interface LLMInfo {
  name: string;
  maxTokens: number;
  provider: string;
}

export interface TokenAnalysis {
  estimatedTokens: number;
  compatibleLLMs: LLMInfo[];
  incompatibleLLMs: LLMInfo[];
  recommendations: string[];
}

export class TokenCounter {
  private static readonly LLM_LIMITS: LLMInfo[] = [
    { name: "GPT-5", maxTokens: 400000, provider: "OpenAI" },
    { name: "Gemini 2.5 Pro", maxTokens: 1000000, provider: "Google" },
    { name: "Claude Opus 4.1", maxTokens: 200000, provider: "Anthropic" },
    { name: "Claude Sonnet 4", maxTokens: 200000, provider: "Anthropic" },
    { name: "Grok-4", maxTokens: 200000, provider: "xAI" },
    { name: "Llama 3.1", maxTokens: 128000, provider: "Meta" },
    { name: "Mistral Large 2", maxTokens: 128000, provider: "Mistral" },
    { name: "Command R+", maxTokens: 128000, provider: "Cohere" },
    { name: "Phi-3 Medium", maxTokens: 128000, provider: "Microsoft" },
    { name: "GPT-4o", maxTokens: 128000, provider: "OpenAI" },
    { name: "Claude Haiku", maxTokens: 200000, provider: "Anthropic" }
  ];

  static estimateTokens(text: string): number {
    // More accurate token estimation
    // Remove excessive whitespace and normalize
    const normalized = text.replace(/\s+/g, ' ').trim();
    
    // Rough estimation: 1 token ≈ 4 characters for English text
    // Code tends to have more tokens per character due to symbols
    const baseEstimate = Math.ceil(normalized.length / 3.5);
    
    // Adjust for markdown formatting (links, code blocks, etc.)
    const markdownMultiplier = text.includes('```') ? 1.1 : 1.0;
    
    return Math.ceil(baseEstimate * markdownMultiplier);
  }

  static analyzeTokenUsage(text: string): TokenAnalysis {
    const estimatedTokens = this.estimateTokens(text);
    
    const compatible: LLMInfo[] = [];
    const incompatible: LLMInfo[] = [];
    
    this.LLM_LIMITS.forEach(llm => {
      if (estimatedTokens <= llm.maxTokens) {
        compatible.push(llm);
      } else {
        incompatible.push(llm);
      }
    });

    // Sort by token limit (highest first)
    compatible.sort((a, b) => b.maxTokens - a.maxTokens);
    incompatible.sort((a, b) => b.maxTokens - a.maxTokens);

    const recommendations = this.generateRecommendations(estimatedTokens, compatible, incompatible);

    return {
      estimatedTokens,
      compatibleLLMs: compatible,
      incompatibleLLMs: incompatible,
      recommendations
    };
  }

  private static generateRecommendations(tokens: number, compatible: LLMInfo[], incompatible: LLMInfo[]): string[] {
    const recommendations: string[] = [];

    if (compatible.length === 0) {
      recommendations.push("⚠️  Output too large for all popular LLMs! Consider using filters to reduce size.");
      recommendations.push("💡 Try: --exclude '**/*.test.*,**/*.spec.*,coverage/**'");
      recommendations.push("💡 Or set smaller file size limit: --max-size 51200 (50KB)");
    } else if (compatible.length <= 3) {
      recommendations.push("⚠️  Limited LLM compatibility. Consider reducing output size for broader support.");
      if (incompatible.length > 0) {
        const smallestIncompatible = incompatible[incompatible.length - 1];
        const reduction = Math.ceil(((tokens - smallestIncompatible.maxTokens) / tokens) * 100);
        recommendations.push(`💡 Reduce by ~${reduction}% to support ${smallestIncompatible.name}`);
      }
    } else {
      recommendations.push("✅ Good compatibility with most popular LLMs!");
      if (tokens > 50000) {
        recommendations.push("💡 For faster processing, consider splitting into smaller chunks");
      }
    }

    // Token usage categories
    if (tokens > 500000) {
      recommendations.push("📊 Ultra-large codebase - consider using project filtering");
    } else if (tokens > 200000) {
      recommendations.push("📊 Large codebase - perfect for advanced LLMs");
    } else if (tokens > 50000) {
      recommendations.push("📊 Medium codebase - fits most LLMs comfortably");
    } else {
      recommendations.push("📊 Small codebase - optimal for all LLMs");
    }

    return recommendations;
  }

  static formatTokenAnalysis(analysis: TokenAnalysis): string {
    const { estimatedTokens, compatibleLLMs, incompatibleLLMs, recommendations } = analysis;
    
    let output = `\n🧮 Token Analysis:\n`;
    output += `   Estimated tokens: ${estimatedTokens.toLocaleString()}\n\n`;

    if (compatibleLLMs.length > 0) {
      output += `✅ Compatible LLMs (${compatibleLLMs.length}):\n`;
      compatibleLLMs.slice(0, 5).forEach(llm => {
        const percentage = Math.round((estimatedTokens / llm.maxTokens) * 100);
        output += `   • ${llm.name} (${llm.provider}) - ${percentage}% of limit\n`;
      });
      if (compatibleLLMs.length > 5) {
        output += `   • ...and ${compatibleLLMs.length - 5} more\n`;
      }
      output += '\n';
    }

    if (incompatibleLLMs.length > 0) {
      output += `❌ Too large for (${incompatibleLLMs.length}):\n`;
      incompatibleLLMs.slice(0, 3).forEach(llm => {
        const overflow = estimatedTokens - llm.maxTokens;
        output += `   • ${llm.name} (${llm.provider}) - exceeds by ${overflow.toLocaleString()} tokens\n`;
      });
      if (incompatibleLLMs.length > 3) {
        output += `   • ...and ${incompatibleLLMs.length - 3} more\n`;
      }
      output += '\n';
    }

    if (recommendations.length > 0) {
      output += 'Recommendations:\n';
      recommendations.forEach(rec => {
        output += `   ${rec}\n`;
      });
    }

    return output;
  }
}