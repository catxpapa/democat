/**
 * 数据库配置文件
 * 使用懒猫微服固定的MySQL环境变量
 */
module.exports = {
  host: process.env.DB_HOST || 'mysql.cloud.lazycat.app.democatdb.lzcapp',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'LAZYCAT',
  password: process.env.DB_PASSWORD || 'LAZYCAT',
  database: process.env.DB_DATABASE || 'LAZYCAT',
  // 连接池配置
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  // 字符集配置
  charset: 'utf8mb4'
};