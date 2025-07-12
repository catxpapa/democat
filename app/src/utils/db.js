const mysql = require('mysql2/promise');
const dbConfig = require('../config/database');

/**
 * 数据库连接池
 */
let pool = null;

/**
 * 获取详细的连接信息用于调试
 */
function getConnectionDebugInfo() {
  return {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    database: dbConfig.database,
    // 不显示密码，但显示是否配置
    password_configured: !!dbConfig.password,
    environment_vars: {
      DB_HOST: process.env.DB_HOST,
      DB_PORT: process.env.DB_PORT,
      DB_USER: process.env.DB_USER,
      DB_DATABASE: process.env.DB_DATABASE,
      NODE_ENV: process.env.NODE_ENV
    },
    expected_host: 'mysql.cloud.lazycat.app.democatdb.lzcapp'
  };
}

/**
 * 初始化数据库连接池
 */
function initPool() {
  if (!pool) {
    console.log('正在初始化数据库连接池...');
    console.log('连接配置:', getConnectionDebugInfo());
    
    pool = mysql.createPool({
      ...dbConfig,
      // 增加调试选项
      debug: process.env.NODE_ENV === 'development',
      // 连接超时设置
      acquireTimeout: 10000,
      timeout: 10000,
      connectTimeout: 10000
    });
    
    console.log('数据库连接池已初始化');
  }
  return pool;
}

/**
 * 获取数据库连接
 * @returns {Promise<Connection>} 数据库连接
 */
async function getConnection() {
  try {
    const pool = initPool();
    console.log('尝试获取数据库连接...');
    
    const connection = await pool.getConnection();
    console.log('数据库连接获取成功');
    return connection;
  } catch (error) {
    console.error('数据库连接失败详情:', {
      error_message: error.message,
      error_code: error.code,
      error_errno: error.errno,
      error_sqlState: error.sqlState,
      connection_config: getConnectionDebugInfo()
    });
    
    // 抛出增强的错误信息
    const enhancedError = new Error(`数据库连接失败: ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.debugInfo = getConnectionDebugInfo();
    enhancedError.errorCode = error.code;
    enhancedError.errno = error.errno;
    
    throw enhancedError;
  }
}

/**
 * 执行SQL查询
 * @param {string} sql SQL语句
 * @param {Array} params 参数数组
 * @returns {Promise<Array>} 查询结果
 */
async function query(sql, params = []) {
  let connection = null;
  try {
    connection = await getConnection();
    const [rows] = await connection.execute(sql, params);
    console.log(`SQL执行成功: ${sql.substring(0, 50)}...`);
    return rows;
  } catch (error) {
    console.error('SQL执行失败详情:', {
      sql: sql,
      params: params,
      error_message: error.message,
      error_code: error.code,
      connection_info: getConnectionDebugInfo()
    });
    
    // 如果是连接错误，包含调试信息
    if (error.debugInfo) {
      throw error;
    }
    
    // 普通SQL错误
    const enhancedError = new Error(`SQL执行失败: ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.sql = sql;
    enhancedError.params = params;
    
    throw enhancedError;
  } finally {
    if (connection) {
      connection.release();
      console.log('数据库连接已释放');
    }
  }
}

/**
 * 测试数据库连接
 * @returns {Promise<Object>} 连接测试结果
 */
async function testConnection() {
  try {
    console.log('开始测试数据库连接...');
    console.log('连接配置:', getConnectionDebugInfo());
    
    // 修正SQL语句 - 分步执行，避免复杂语法
    const basicTest = await query('SELECT 1 as test');
    const timeTest = await query('SELECT NOW() as current_time');
    const versionTest = await query('SELECT @@version as mysql_version');
    const dbTest = await query('SELECT DATABASE() as current_database');
    
    const testResult = {
      success: true,
      data: {
        test: basicTest[0].test,
        current_time: timeTest[0].current_time,
        mysql_version: versionTest[0].mysql_version,
        current_database: dbTest[0].current_database
      },
      connection_info: getConnectionDebugInfo()
    };
    
    console.log('数据库连接测试成功:', testResult);
    return testResult;
  } catch (error) {
    console.error('数据库连接测试失败:', error);
    
    return {
      success: false,
      error: {
        message: error.message,
        code: error.errorCode || error.code,
        errno: error.errno,
        original_error: error.originalError?.message,
        sql_state: error.sqlState
      },
      debug_info: error.debugInfo || getConnectionDebugInfo(),
      troubleshooting: {
        common_issues: [
          '检查MySQL服务是否已启动',
          '确认SQL语法是否正确',
          '验证数据库权限配置',
          '检查字符集设置',
          '确认MySQL版本兼容性'
        ],
        sql_debugging: [
          '尝试简单的SELECT 1查询',
          '检查MySQL错误日志',
          '验证用户权限',
          '确认数据库存在'
        ]
      }
    };
  }
}
/**
 * 简化版数据库连接测试
 * @returns {Promise<Object>} 连接测试结果
 */
async function testConnectionSimple() {
  try {
    console.log('开始简化数据库连接测试...');
    
    // 最基本的连接测试
    const result = await query('SELECT 1 as connection_test');
    
    if (result && result.length > 0) {
      console.log('数据库连接测试成功');
      return {
        success: true,
        message: '数据库连接正常',
        test_result: result[0]
      };
    } else {
      throw new Error('查询返回空结果');
    }
  } catch (error) {
    console.error('数据库连接测试失败:', error);
    return {
      success: false,
      error: error.message,
      debug_info: getConnectionDebugInfo()
    };
  }
}

/**
 * 详细数据库信息查询（连接成功后调用）
 * @returns {Promise<Object>} 数据库详细信息
 */
async function getDatabaseInfo() {
  try {
    const queries = [
      { name: 'current_time', sql: 'SELECT NOW() as value' },
      { name: 'mysql_version', sql: 'SELECT @@version as value' },
      { name: 'current_database', sql: 'SELECT DATABASE() as value' },
      { name: 'charset', sql: 'SELECT @@character_set_database as value' },
      { name: 'user', sql: 'SELECT USER() as value' }
    ];
    
    const info = {};
    
    for (const query_item of queries) {
      try {
        const result = await query(query_item.sql);
        info[query_item.name] = result[0].value;
      } catch (error) {
        info[query_item.name] = `查询失败: ${error.message}`;
      }
    }
    
    return {
      success: true,
      database_info: info
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
module.exports = {
  initPool,
  getConnection,
  query,
  testConnection,
  testConnectionSimple,  // 新增
  getDatabaseInfo,       // 新增
  getConnectionDebugInfo
};