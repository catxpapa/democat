// 提示词合成工具
class PromptComposer {
    constructor() {
        this.separators = {
            default: ', ',
            midjourney: ', ',
            'stable-diffusion': ', '
        };
        
        this.modelRules = {
            midjourney: {
                separator: ', ',
                parameterPrefix: ' --',
                negativePrefix: ' --no '
            },
            'stable-diffusion': {
                separator: ', ',
                parameterPrefix: '',
                negativePrefix: 'Negative prompt: '
            }
        };
    }

    // 合成最终提示词
    compose(textBoxValues, model = 'default') {
        const rules = this.modelRules[model] || this.modelRules.default;
        const separator = rules?.separator || this.separators.default;
        
        // 过滤空值并合并
        const validValues = Object.values(textBoxValues)
            .filter(value => value && value.trim())
            .map(value => value.trim());
        
        if (validValues.length === 0) {
            return '';
        }
        
        return validValues.join(separator);
    }

    // 清理文本内容
    cleanText(text) {
        return text
            .replace(/\s+/g, ' ')  // 多个空格合并为一个
            .replace(/,+/g, ',')   // 多个逗号合并为一个
            .replace(/,\s*,/g, ',') // 去除重复逗号
            .trim();
    }

    // 统计提示词信息
    getStats(prompt) {
        if (!prompt) {
            return {
                length: 0,
                words: 0,
                characters: 0
            };
        }
        
        const cleaned = this.cleanText(prompt);
        const words = cleaned.split(/[,\s]+/).filter(word => word.length > 0);
        
        return {
            length: cleaned.length,
            words: words.length,
            characters: cleaned.replace(/\s/g, '').length
        };
    }

    // 验证提示词
    validate(prompt, maxLength = 1000) {
        const stats = this.getStats(prompt);
        const issues = [];
        
        if (stats.length > maxLength) {
            issues.push(`提示词过长 (${stats.length}/${maxLength} 字符)`);
        }
        
        if (stats.words > 100) {
            issues.push(`词汇过多 (${stats.words}/100 个词)`);
        }
        
        return {
            valid: issues.length === 0,
            issues: issues,
            stats: stats
        };
    }
}

// 全局提示词合成器实例
window.promptComposer = new PromptComposer();