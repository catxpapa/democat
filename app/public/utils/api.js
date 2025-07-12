// API调用工具函数
class API {
    constructor() {
        this.baseURL = '/api';
    }

    // 通用请求方法
    async request(url, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${url}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    }

    // 获取所有标签
    async getTags() {
        return this.request('/tags');
    }

    // 获取片段列表
    async getSnippets(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/snippets?${queryString}`);
    }

    // 获取推荐片段
    async getRecommendedSnippets() {
        return this.request('/snippets/recommended');
    }

    // 搜索片段
    async searchSnippets(query, tagIds = []) {
        const params = {
            search: query,
            tag_ids: tagIds.join(',')
        };
        return this.getSnippets(params);
    }
}

// 全局API实例
window.api = new API();