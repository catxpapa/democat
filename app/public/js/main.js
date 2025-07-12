// 全局变量
let isLoading = false;
let connectionStatus = 'unknown';

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('🐱 玳瑁猫演示平台初始化...');
    
    // 初始化连接状态检查
    checkConnectionStatus();
    
    // 设置定时检查连接状态
    setInterval(checkConnectionStatus, 30000);
    
    console.log('✅ 初始化完成');
});

// 检查连接状态
async function checkConnectionStatus() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        if (data.success) {
            updateConnectionStatus('connected', '服务正常运行');
        } else {
            updateConnectionStatus('disconnected', '服务异常');
        }
    } catch (error) {
        updateConnectionStatus('disconnected', '连接失败');
    }
}

// 更新连接状态显示
function updateConnectionStatus(status, message) {
    const statusElement = document.getElementById('connectionStatus');
    connectionStatus = status;
    
    statusElement.className = `status-indicator ${status}`;
    statusElement.innerHTML = `<i class="fas fa-circle"></i> ${message}`;
}

// 切换功能卡片展开/收缩
function toggleCard(cardType) {
    const card = document.getElementById(`${cardType}Card`);
    const isActive = card.classList.contains('active');
    
    // 收缩所有卡片
    document.querySelectorAll('.function-card').forEach(c => {
        c.classList.remove('active');
        c.querySelector('.card-header').classList.remove('active');
    });
    
    // 如果当前卡片未激活，则激活它
    if (!isActive) {
        card.classList.add('active');
        card.querySelector('.card-header').classList.add('active');
    }
}

// 显示加载状态
function showLoading(show = true) {
    isLoading = show;
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.toggle('show', show);
}

// 通用API请求函数
async function makeRequest(url, options = {}) {
    if (isLoading) return null;
    
    showLoading(true);
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        return { data, success: response.ok };
    } catch (error) {
        console.error('请求失败:', error);
        return { 
            data: { 
                success: false, 
                message: '网络请求失败', 
                error: error.message 
            }, 
            success: false 
        };
    } finally {
        showLoading(false);
    }
}

// 显示结果卡片
function showResult(title, data, type = 'info') {
    const container = document.getElementById('resultsContainer');
    
    // 清除欢迎消息
    const welcomeMessage = container.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
    
    const resultCard = document.createElement('div');
    resultCard.className = 'result-card';
    
    const headerClass = data.success ? 'success' : 'error';
    const icon = data.success ? 'fa-check-circle' : 'fa-exclamation-circle';
    
    resultCard.innerHTML = `
        <div class="result-header ${headerClass}">
            <i class="fas ${icon}"></i>
            <span class="result-title">${title}</span>
            <span class="result-time">${new Date().toLocaleTimeString()}</span>
        </div>
        <div class="result-content" id="content-${Date.now()}">
            ${formatResultContent(data)}
        </div>
    `;
    
    container.insertBefore(resultCard, container.firstChild);
    
    // 滚动到新结果
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 格式化结果内容
function formatResultContent(data) {
    if (!data.success) {
        return `
            <div class="error-message">
                <h4><i class="fas fa-exclamation-triangle"></i> 操作失败</h4>
                <p><strong>错误信息：</strong>${data.message || '未知错误'}</p>
                ${data.error ? `<p><strong>详细错误：</strong>${data.error}</p>` : ''}
            </div>
        `;
    }
    
    // 根据数据类型格式化内容
    if (data.statistics) {
        return formatStatistics(data);
    } else if (data.data && Array.isArray(data.data)) {
        return formatDataList(data.data, data.message);
    } else if (data.connection_config || data.environment_variables) {
        return formatSystemInfo(data);
    } else {
        return formatGenericSuccess(data);
    }
}

// 格式化统计信息
function formatStatistics(data) {
    const stats = data.statistics;
    let html = `<h4><i class="fas fa-chart-bar"></i> ${data.message}</h4>`;
    
    if (stats) {
        html += '<div class="stats-grid">';
        Object.entries(stats).forEach(([key, value]) => {
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            html += `
                <div class="stat-item">
                    <div class="stat-number">${value}</div>
                    <div class="stat-label">${label}</div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    if (data.sample_data && data.sample_data.length > 0) {
        html += '<h5><i class="fas fa-eye"></i> 数据示例</h5>';
        html += formatDataList(data.sample_data.slice(0, 5));
    }
    
    return html;
}

// 格式化数据列表
function formatDataList(dataArray, title = '') {
    if (!dataArray || dataArray.length === 0) {
        return '<p><i class="fas fa-info-circle"></i> 暂无数据</p>';
    }
    
    let html = title ? `<h4><i class="fas fa-list"></i> ${title}</h4>` : '';
    html += '<div class="data-list">';
    
    dataArray.forEach(item => {
        html += `
            <div class="data-item">
                <div class="data-item-header">
                    ${item.emoji ? `<span class="data-item-emoji">${item.emoji}</span>` : ''}
                    <span class="data-item-title">${item.name || item.title || '未命名'}</span>
                </div>
                ${item.description ? `<div class="data-item-description">${item.description}</div>` : ''}
                <div class="data-item-meta">
                    ${item.cuteness_level ? `<span class="meta-tag">可爱度: ${item.cuteness_level}/10</span>` : ''}
                    ${item.habitat ? `<span class="meta-tag">栖息地: ${item.habitat}</span>` : ''}
                    ${item.snippet_count !== undefined ? `<span class="meta-tag">关联数量: ${item.snippet_count}</span>` : ''}
                    ${item.categories ? item.categories.map(cat => `<span class="meta-tag">${cat}</span>`).join('') : ''}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// 格式化系统信息
function formatSystemInfo(data) {
    let html = `<h4><i class="fas fa-info-circle"></i> ${data.message}</h4>`;
    
    if (data.connection_config) {
        html += '<h5><i class="fas fa-database"></i> 数据库配置</h5>';
        html += '<div class="data-list">';
        Object.entries(data.connection_config).forEach(([key, value]) => {
            html += `
                <div class="data-item">
                    <div class="data-item-header">
                        <span class="data-item-title">${key.toUpperCase()}</span>
                    </div>
                    <div class="data-item-description">${value}</div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    if (data.environment_variables) {
        html += '<h5><i class="fas fa-cog"></i> 环境变量</h5>';
        html += '<div class="data-list">';
        Object.entries(data.environment_variables).forEach(([key, value]) => {
            html += `
                <div class="data-item">
                    <div class="data-item-header">
                        <span class="data-item-title">${key}</span>
                    </div>
                    <div class="data-item-description">${value || '未设置'}</div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    return html;
}

// 格式化通用成功信息
function formatGenericSuccess(data) {
    return `
        <div class="success-message">
            <h4><i class="fas fa-check-circle"></i> ${data.message}</h4>
            ${data.timestamp ? `<p><strong>时间：</strong>${new Date(data.timestamp).toLocaleString()}</p>` : ''}
        </div>
    `;
}

// 清空结果
function clearResults() {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = `
        <div class="welcome-message">
            <div class="welcome-icon">
                <i class="fas fa-cat"></i>
            </div>
            <h3>结果已清空</h3>
            <p>请继续使用左侧功能面板进行操作</p>
        </div>
    `;
}

// 系统测试功能
async function testHealth() {
    const result = await makeRequest('/api/health');
    showResult('健康检查', result.data);
}

async function testEnvironment() {
    const result = await makeRequest('/api/test/env-check');
    showResult('环境变量检查', result.data);
}

async function testNetwork() {
    const result = await makeRequest('/api/test/network-test');
    showResult('网络连接测试', result.data);
}

async function testDatabase() {
    const result = await makeRequest('/api/test/db-test');
    showResult('数据库连接测试', result.data);
}

// 数据库管理功能
async function createTables() {
    const result = await makeRequest('/api/demo/create-tables', { method: 'POST' });
    showResult('创建数据表', result.data);
}

async function insertDemoData(clearExisting = false) {
    const result = await makeRequest('/api/demo/insert-data', {
        method: 'POST',
        body: JSON.stringify({ clearExisting })
    });
    showResult('插入演示数据', result.data);
}

// 数据展示功能
async function viewCategories() {
    const result = await makeRequest('/api/demo/categories');
    showResult('动物分类数据', result.data);
}

async function viewAnimals() {
    const result = await makeRequest('/api/demo/animals');
    showResult('可爱动物数据', result.data);
}

async function viewStatistics() {
    const result = await makeRequest('/api/demo/statistics');
    showResult('数据统计信息', result.data);
}

// 快速开始功能
async function quickStart() {
    showResult('快速开始', { success: true, message: '开始执行完整演示流程...' });
    
    // 依次执行各个步骤
    setTimeout(async () => {
        await testHealth();
        setTimeout(async () => {
            await testDatabase();
            setTimeout(async () => {
                await createTables();
                setTimeout(async () => {
                    await insertDemoData();
                    setTimeout(async () => {
                        await viewStatistics();
                        showResult('快速开始完成', { 
                            success: true, 
                            message: '🎉 完整演示流程执行完毕！您已体验了玳瑁猫的所有核心功能。' 
                        });
                    }, 1000);
                }, 1000);
            }, 1000);
        }, 1000);
    }, 1000);
}