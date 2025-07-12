const express = require('express');
const router = express.Router();
const db = require('../utils/db');
/**
 * 数据库连接测试接口 - 修正版
 */
router.get('/db-test', async (req, res) => {
  try {
    console.log('=== 数据库连接测试开始 ===');
    
    // 第一步：基础连接测试
    const basicTest = await db.testConnectionSimple();
    
    if (!basicTest.success) {
      return res.status(500).json({
        success: false,
        message: '数据库基础连接失败',
        error: basicTest.error,
        debug_info: basicTest.debug_info,
        timestamp: new Date().toISOString()
      });
    }
    
    // 第二步：获取详细信息
    const detailInfo = await db.getDatabaseInfo();
    
    res.json({
      success: true,
      message: '数据库连接测试成功',
      basic_test: basicTest,
      database_details: detailInfo,
      connection_config: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USER
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('=== 数据库测试接口异常 ===', error);
    
    res.status(500).json({
      success: false,
      message: '数据库连接测试异常',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 创建测试表接口 - 优化版
 */
router.post('/create-tables', async (req, res) => {
  try {
    console.log('开始创建数据表...');

    // 先测试基础连接
    const connectionTest = await db.testConnectionSimple();
    if (!connectionTest.success) {
      return res.status(500).json({
        success: false,
        message: '数据库连接失败，无法创建表',
        error: connectionTest.error
      });
    }

    // 创建表的SQL语句
    const createTableQueries = [
      {
        name: 'tags',
        sql: `CREATE TABLE IF NOT EXISTS tags (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(100) NOT NULL UNIQUE,
          description VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      },
      {
        name: 'snippets',
        sql: `CREATE TABLE IF NOT EXISTS snippets (
          id INT PRIMARY KEY AUTO_INCREMENT,
          title VARCHAR(200) NOT NULL,
          content TEXT NOT NULL,
          image_url VARCHAR(500),
          model_types JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      },
      {
        name: 'snippet_tags',
        sql: `CREATE TABLE IF NOT EXISTS snippet_tags (
          snippet_id INT NOT NULL,
          tag_id INT NOT NULL,
          PRIMARY KEY (snippet_id, tag_id),
          FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE,
          FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      }
    ];

    const results = [];
    
    for (const table of createTableQueries) {
      try {
        await db.query(table.sql);
        results.push({
          table: table.name,
          status: 'success',
          message: '创建成功'
        });
        console.log(`表 ${table.name} 创建成功`);
      } catch (error) {
        results.push({
          table: table.name,
          status: 'error',
          message: error.message
        });
        console.error(`表 ${table.name} 创建失败:`, error.message);
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const isAllSuccess = successCount === createTableQueries.length;

    res.status(isAllSuccess ? 200 : 207).json({
      success: isAllSuccess,
      message: `数据表创建完成，成功 ${successCount}/${createTableQueries.length} 个`,
      results: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('创建表失败:', error);
    res.status(500).json({
      success: false,
      message: '数据表创建失败',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 环境信息检查接口
 */
router.get('/env-check', (req, res) => {
  res.json({
    success: true,
    message: '环境变量检查',
    environment_variables: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      DB_HOST: process.env.DB_HOST,
      DB_PORT: process.env.DB_PORT,
      DB_USER: process.env.DB_USER,
      DB_DATABASE: process.env.DB_DATABASE,
      // 不显示密码值，只显示是否设置
      DB_PASSWORD_SET: !!process.env.DB_PASSWORD
    },
    expected_values: {
      DB_HOST: 'mysql.cloud.lazycat.app.democatdb.lzcapp',
      DB_PORT: '3306',
      DB_USER: 'LAZYCAT',
      DB_DATABASE: 'LAZYCAT',
      DB_PASSWORD: 'LAZYCAT'
    },
    package_info: {
      expected_package: 'cloud.lazycat.app.democatdb',
      mysql_host_pattern: 'mysql.{package}.lzcapp'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * 网络连接测试接口
 */
router.get('/network-test', async (req, res) => {
  const net = require('net');
  const host = process.env.DB_HOST || 'mysql.cloud.lazycat.app.democatdb.lzcapp';
  const port = parseInt(process.env.DB_PORT || '3306');
  
  try {
    const socket = new net.Socket();
    
    const testPromise = new Promise((resolve, reject) => {
      socket.setTimeout(5000);
      
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('连接超时'));
      });
      
      socket.on('error', (error) => {
        socket.destroy();
        reject(error);
      });
      
      socket.connect(port, host);
    });
    
    await testPromise;
    
    res.json({
      success: true,
      message: '网络连接测试成功',
      target: `${host}:${port}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '网络连接测试失败',
      target: `${host}:${port}`,
      error: error.message,
      troubleshooting: [
        '检查MySQL服务是否启动',
        '确认主机名解析是否正确',
        '验证端口是否开放',
        '检查防火墙设置'
      ],
      timestamp: new Date().toISOString()
    });
  }
});
/**
 * 插入测试数据接口
 */
router.post('/insert-test-data', async (req, res) => {
  try {
    console.log('开始插入测试数据...');

    // 先检查表是否存在
    const tablesCheck = await db.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'LAZYCAT' 
      AND TABLE_NAME IN ('tags', 'snippets', 'snippet_tags')
    `);

    if (tablesCheck.length < 3) {
      return res.status(400).json({
        success: false,
        message: '数据表不完整，请先创建表',
        existing_tables: tablesCheck.map(t => t.TABLE_NAME)
      });
    }

    // 清空现有测试数据（可选）
    if (req.body.clearExisting) {
      await db.query('DELETE FROM snippet_tags');
      await db.query('DELETE FROM snippets');
      await db.query('DELETE FROM tags');
      console.log('已清空现有数据');
    }

    // 插入标签数据
    const tagsData = [
      { name: '主题', description: '画面主要主题和内容' },
      { name: '风格', description: '艺术风格和表现形式' },
      { name: '环境', description: '场景环境和背景' },
      { name: '光影', description: '光线和阴影效果' },
      { name: '色彩', description: '色彩搭配和色调' },
      { name: '构图', description: '画面构图和视角' },
      { name: '细节', description: '画面细节和装饰' },
      { name: '情绪', description: '画面情绪和氛围' },
      { name: 'Midjourney', description: 'Midjourney专用参数' },
      { name: 'StableDiffusion', description: 'Stable Diffusion专用参数' }
    ];

    const tagIds = {};
    for (const tag of tagsData) {
      const result = await db.query(
        'INSERT INTO tags (name, description) VALUES (?, ?) ON DUPLICATE KEY UPDATE description = VALUES(description)',
        [tag.name, tag.description]
      );
      // 获取插入或更新的ID
      const [idResult] = await db.query('SELECT id FROM tags WHERE name = ?', [tag.name]);
      tagIds[tag.name] = idResult.id;
    }

    // 插入片段数据
    const snippetsData = [
      // 主题类
      { title: '美丽女孩', content: 'beautiful girl, portrait', tags: ['主题'] },
      { title: '神秘森林', content: 'mysterious forest, ancient trees', tags: ['主题', '环境'] },
      { title: '未来城市', content: 'futuristic city, cyberpunk', tags: ['主题', '环境'] },
      { title: '可爱动物', content: 'cute animals, kawaii style', tags: ['主题'] },
      
      // 风格类
      { title: '动漫风格', content: 'anime style, manga art', tags: ['风格'] },
      { title: '写实风格', content: 'photorealistic, hyperrealistic', tags: ['风格'] },
      { title: '水彩画', content: 'watercolor painting, soft brushstrokes', tags: ['风格'] },
      { title: '油画风格', content: 'oil painting, classical art style', tags: ['风格'] },
      { title: '像素艺术', content: 'pixel art, 8-bit style', tags: ['风格'] },
      
      // 环境类
      { title: '梦幻花园', content: 'fantasy garden, blooming flowers', tags: ['环境'] },
      { title: '星空夜景', content: 'starry night sky, milky way', tags: ['环境', '光影'] },
      { title: '海边日落', content: 'beach sunset, golden hour', tags: ['环境', '光影', '色彩'] },
      { title: '雪山景色', content: 'snow mountain, winter landscape', tags: ['环境'] },
      
      // 光影类
      { title: '柔和光线', content: 'soft lighting, gentle shadows', tags: ['光影'] },
      { title: '戏剧光效', content: 'dramatic lighting, chiaroscuro', tags: ['光影'] },
      { title: '霓虹灯光', content: 'neon lights, glowing effects', tags: ['光影', '色彩'] },
      { title: '自然光', content: 'natural lighting, sunbeam', tags: ['光影'] },
      
      // 色彩类
      { title: '暖色调', content: 'warm colors, orange and red tones', tags: ['色彩'] },
      { title: '冷色调', content: 'cool colors, blue and purple tones', tags: ['色彩'] },
      { title: '单色调', content: 'monochromatic, black and white', tags: ['色彩'] },
      { title: '彩虹色彩', content: 'rainbow colors, vibrant palette', tags: ['色彩'] },
      
      // 构图类
      { title: '特写镜头', content: 'close-up shot, detailed view', tags: ['构图'] },
      { title: '全景视角', content: 'wide angle, panoramic view', tags: ['构图'] },
      { title: '鸟瞰视角', content: 'bird eye view, top down perspective', tags: ['构图'] },
      { title: '低角度', content: 'low angle shot, dramatic perspective', tags: ['构图'] },
      
      // 细节类
      { title: '精细纹理', content: 'detailed texture, intricate patterns', tags: ['细节'] },
      { title: '华丽装饰', content: 'ornate decoration, baroque details', tags: ['细节'] },
      { title: '简约线条', content: 'clean lines, minimalist design', tags: ['细节'] },
      { title: '复古元素', content: 'vintage elements, retro style', tags: ['细节'] },
      
      // 情绪类
      { title: '宁静祥和', content: 'peaceful, serene atmosphere', tags: ['情绪'] },
      { title: '神秘诡异', content: 'mysterious, eerie mood', tags: ['情绪'] },
      { title: '活力四射', content: 'energetic, dynamic feeling', tags: ['情绪'] },
      { title: '浪漫温馨', content: 'romantic, cozy ambiance', tags: ['情绪'] },
      
      // Midjourney专用
      { title: '高质量', content: '--quality 2', tags: ['Midjourney'] },
      { title: '风格化强', content: '--stylize 1000', tags: ['Midjourney'] },
      { title: '16:9比例', content: '--aspect 16:9', tags: ['Midjourney'] },
      { title: '正方形', content: '--aspect 1:1', tags: ['Midjourney'] },
      
      // Stable Diffusion专用
      { title: '高分辨率', content: 'high resolution, 4k, 8k', tags: ['StableDiffusion'] },
      { title: '最佳质量', content: 'best quality, masterpiece', tags: ['StableDiffusion'] },
      { title: '超详细', content: 'extremely detailed, ultra-detailed', tags: ['StableDiffusion'] }
    ];

    const snippetResults = [];
    for (const snippet of snippetsData) {
      try {
        // 插入片段
        const result = await db.query(
          'INSERT INTO snippets (title, content) VALUES (?, ?)',
          [snippet.title, snippet.content]
        );
        const snippetId = result.insertId;

        // 关联标签
        for (const tagName of snippet.tags) {
          if (tagIds[tagName]) {
            await db.query(
              'INSERT INTO snippet_tags (snippet_id, tag_id) VALUES (?, ?)',
              [snippetId, tagIds[tagName]]
            );
          }
        }

        snippetResults.push({
          id: snippetId,
          title: snippet.title,
          tags: snippet.tags,
          status: 'success'
        });
      } catch (error) {
        snippetResults.push({
          title: snippet.title,
          status: 'error',
          error: error.message
        });
      }
    }

    // 统计结果
    const successCount = snippetResults.filter(r => r.status === 'success').length;
    const errorCount = snippetResults.filter(r => r.status === 'error').length;

    res.json({
      success: true,
      message: `测试数据插入完成`,
      statistics: {
        tags_inserted: Object.keys(tagIds).length,
        snippets_success: successCount,
        snippets_error: errorCount,
        total_snippets: snippetsData.length
      },
      tag_ids: tagIds,
      snippet_results: snippetResults.slice(0, 10), // 只返回前10个结果避免响应过大
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('插入测试数据失败:', error);
    res.status(500).json({
      success: false,
      message: '插入测试数据失败',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});


/**
 * 插入可爱动物主题测试数据
 */
router.post('/insert-demo-data', async (req, res) => {
  try {
    console.log('开始插入演示数据...');

    // 清空现有数据
    if (req.body.clearExisting !== false) {
      await db.query('DELETE FROM item_categories');
      await db.query('DELETE FROM demo_items');
      await db.query('DELETE FROM categories');
      console.log('已清空现有数据');
    }

    // 动物分类数据
    const categoriesData = [
      { name: '陆地动物', description: '生活在陆地上的可爱动物们', icon: '🐾' },
      { name: '海洋动物', description: '生活在海洋中的神奇生物', icon: '🌊' },
      { name: '天空动物', description: '翱翔在天空中的飞行动物', icon: '🕊️' },
      { name: '农场动物', description: '农场里的友好伙伴们', icon: '🚜' },
      { name: '森林动物', description: '森林深处的野生动物', icon: '🌲' },
      { name: '极地动物', description: '生活在寒冷地区的动物', icon: '❄️' },
      { name: '热带动物', description: '热带雨林的奇异动物', icon: '🌴' },
      { name: '宠物动物', description: '人类最好的朋友们', icon: '🏠' }
    ];

    const categoryIds = {};
    for (const category of categoriesData) {
      const result = await db.query(
        'INSERT INTO categories (name, description, icon) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE description = VALUES(description)',
        [category.name, category.description, category.icon]
      );
      const [idResult] = await db.query('SELECT id FROM categories WHERE name = ?', [category.name]);
      categoryIds[category.name] = idResult.id;
    }

    // 动物数据
    const animalsData = [
      // 陆地动物
      { name: '小熊猫', description: '圆滚滚的可爱熊猫，最爱吃竹子', emoji: '🐼', categories: ['陆地动物', '森林动物'] },
      { name: '小狮子', description: '威武的草原之王，有着金色的鬃毛', emoji: '🦁', categories: ['陆地动物'] },
      { name: '小老虎', description: '橙色条纹的丛林猎手', emoji: '🐅', categories: ['陆地动物', '森林动物'] },
      { name: '小象', description: '温和的巨人，有着长长的鼻子', emoji: '🐘', categories: ['陆地动物'] },
      { name: '小长颈鹿', description: '脖子最长的动物，能吃到高处的叶子', emoji: '🦒', categories: ['陆地动物'] },
      
      // 海洋动物
      { name: '小海豚', description: '聪明友好的海洋精灵', emoji: '🐬', categories: ['海洋动物'] },
      { name: '小鲸鱼', description: '海洋中的温柔巨人', emoji: '🐋', categories: ['海洋动物'] },
      { name: '小章鱼', description: '有八条腿的海底智者', emoji: '🐙', categories: ['海洋动物'] },
      { name: '小海龟', description: '慢慢游泳的长寿海洋居民', emoji: '🐢', categories: ['海洋动物'] },
      { name: '小热带鱼', description: '色彩斑斓的珊瑚礁居民', emoji: '🐠', categories: ['海洋动物', '热带动物'] },
      
      // 天空动物
      { name: '小鹦鹉', description: '会说话的彩色飞鸟', emoji: '🦜', categories: ['天空动物', '热带动物'] },
      { name: '小猫头鹰', description: '夜晚的智慧守护者', emoji: '🦉', categories: ['天空动物', '森林动物'] },
      { name: '小蝴蝶', description: '花丛中翩翩起舞的精灵', emoji: '🦋', categories: ['天空动物'] },
      { name: '小蜜蜂', description: '勤劳的花蜜采集者', emoji: '🐝', categories: ['天空动物'] },
      { name: '小燕子', description: '春天的使者，筑巢高手', emoji: '🐦', categories: ['天空动物'] },
      
      // 农场动物
      { name: '小猪', description: '粉红色的农场快乐果', emoji: '🐷', categories: ['农场动物'] },
      { name: '小牛', description: '提供牛奶的温顺朋友', emoji: '🐄', categories: ['农场动物'] },
      { name: '小羊', description: '毛茸茸的可爱牧场居民', emoji: '🐑', categories: ['农场动物'] },
      { name: '小鸡', description: '叽叽喳喳的农场小宝贝', emoji: '🐥', categories: ['农场动物'] },
      { name: '小鸭', description: '喜欢游泳的黄色小家伙', emoji: '🐤', categories: ['农场动物'] },
      
      // 极地动物
      { name: '小企鹅', description: '穿着燕尾服的南极绅士', emoji: '🐧', categories: ['极地动物'] },
      { name: '小北极熊', description: '白色毛茸茸的北极居民', emoji: '🐻‍❄️', categories: ['极地动物'] },
      { name: '小海豹', description: '圆滚滚的冰上表演者', emoji: '🦭', categories: ['极地动物', '海洋动物'] },
      
      // 宠物动物
      { name: '小狗', description: '人类最忠实的朋友', emoji: '🐶', categories: ['宠物动物'] },
      { name: '小猫', description: '优雅独立的家庭伙伴', emoji: '🐱', categories: ['宠物动物'] },
      { name: '小兔子', description: '蹦蹦跳跳的可爱宠物', emoji: '🐰', categories: ['宠物动物'] },
      { name: '小仓鼠', description: '小巧玲珑的口袋宠物', emoji: '🐹', categories: ['宠物动物'] },
      
      // 热带动物
      { name: '小猴子', description: '调皮捣蛋的树上居民', emoji: '🐵', categories: ['热带动物', '森林动物'] },
      { name: '小树懒', description: '慢悠悠的雨林哲学家', emoji: '🦥', categories: ['热带动物', '森林动物'] },
      { name: '小火烈鸟', description: '粉红色的优雅舞者', emoji: '🦩', categories: ['热带动物'] }
    ];

    const animalResults = [];
    for (const animal of animalsData) {
      try {
        // 插入动物
        const result = await db.query(
          'INSERT INTO demo_items (name, description, emoji, item_type) VALUES (?, ?, ?, ?)',
          [animal.name, animal.description, animal.emoji, 'animal']
        );
        const animalId = result.insertId;

        // 关联分类
        for (const categoryName of animal.categories) {
          if (categoryIds[categoryName]) {
            await db.query(
              'INSERT INTO item_categories (item_id, category_id) VALUES (?, ?)',
              [animalId, categoryIds[categoryName]]
            );
          }
        }

        animalResults.push({
          id: animalId,
          name: animal.name,
          emoji: animal.emoji,
          categories: animal.categories,
          status: 'success'
        });
      } catch (error) {
        animalResults.push({
          name: animal.name,
          status: 'error',
          error: error.message
        });
      }
    }

    // 统计结果
    const successCount = animalResults.filter(r => r.status === 'success').length;

    res.json({
      success: true,
      message: `可爱动物演示数据插入完成！🎉`,
      statistics: {
        categories_inserted: Object.keys(categoryIds).length,
        animals_success: successCount,
        total_animals: animalsData.length
      },
      sample_data: animalResults.slice(0, 8),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('插入演示数据失败:', error);
    res.status(500).json({
      success: false,
      message: '插入演示数据失败',
      error: error.message
    });
  }
});



/**
 * 查询测试数据接口
 */
router.get('/view-data', async (req, res) => {
  try {
    // 获取标签统计
    const tagStats = await db.query(`
      SELECT t.id, t.name, t.description, COUNT(st.snippet_id) as snippet_count
      FROM tags t
      LEFT JOIN snippet_tags st ON t.id = st.tag_id
      GROUP BY t.id, t.name, t.description
      ORDER BY t.name
    `);

    // 获取片段统计
    const snippetStats = await db.query(`
      SELECT COUNT(*) as total_snippets FROM snippets
    `);

    // 获取部分片段示例（带标签）
    const snippetExamples = await db.query(`
      SELECT s.id, s.title, s.content, 
             GROUP_CONCAT(t.name) as tags
      FROM snippets s
      LEFT JOIN snippet_tags st ON s.id = st.snippet_id
      LEFT JOIN tags t ON st.tag_id = t.id
      GROUP BY s.id, s.title, s.content
      ORDER BY s.id
      LIMIT 10
    `);

    res.json({
      success: true,
      message: '数据查询成功',
      statistics: {
        total_tags: tagStats.length,
        total_snippets: snippetStats[0].total_snippets
      },
      tags: tagStats,
      snippet_examples: snippetExamples.map(s => ({
        ...s,
        tags: s.tags ? s.tags.split(',') : []
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('查询数据失败:', error);
    res.status(500).json({
      success: false,
      message: '查询数据失败',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
module.exports = router;