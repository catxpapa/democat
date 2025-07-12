const express = require('express');
const router = express.Router();
const db = require('../utils/db');

/**
 * 创建演示数据表
 */
router.post('/create-tables', async (req, res) => {
  try {
    console.log('开始创建演示数据表...');

    // 创建分类表
    await db.query(`
      CREATE TABLE IF NOT EXISTS animal_categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE,
        description VARCHAR(255),
        emoji VARCHAR(10),
        color VARCHAR(20) DEFAULT '#667eea',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 创建动物表
    await db.query(`
      CREATE TABLE IF NOT EXISTS cute_animals (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        emoji VARCHAR(10),
        habitat VARCHAR(100),
        fun_fact TEXT,
        cuteness_level INT DEFAULT 5,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 创建关联表
    await db.query(`
      CREATE TABLE IF NOT EXISTS animal_category_relations (
        animal_id INT NOT NULL,
        category_id INT NOT NULL,
        PRIMARY KEY (animal_id, category_id),
        FOREIGN KEY (animal_id) REFERENCES cute_animals(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES animal_categories(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    res.json({
      success: true,
      message: '演示数据表创建成功！🎉',
      tables: ['animal_categories', 'cute_animals', 'animal_category_relations'],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('创建演示数据表失败:', error);
    res.status(500).json({
      success: false,
      message: '创建演示数据表失败',
      error: error.message
    });
  }
});

/**
 * 插入可爱动物演示数据
 */
router.post('/insert-data', async (req, res) => {
  try {
    console.log('开始插入可爱动物演示数据...');

    // 清空现有数据（可选）
    if (req.body.clearExisting !== false) {
      await db.query('DELETE FROM animal_category_relations');
      await db.query('DELETE FROM cute_animals');
      await db.query('DELETE FROM animal_categories');
      console.log('已清空现有数据');
    }

    // 插入动物分类数据
    const categoriesData = [
      { name: '陆地萌宠', description: '生活在陆地上的可爱动物们', emoji: '🐾', color: '#ff6b6b' },
      { name: '海洋精灵', description: '生活在海洋中的神奇生物', emoji: '🌊', color: '#4ecdc4' },
      { name: '天空舞者', description: '翱翔在天空中的飞行动物', emoji: '🕊️', color: '#45b7d1' },
      { name: '农场伙伴', description: '农场里的友好伙伴们', emoji: '🚜', color: '#96ceb4' },
      { name: '森林居民', description: '森林深处的野生动物', emoji: '🌲', color: '#6c5ce7' },
      { name: '极地勇士', description: '生活在寒冷地区的动物', emoji: '❄️', color: '#74b9ff' },
      { name: '热带明星', description: '热带雨林的奇异动物', emoji: '🌴', color: '#fd79a8' },
      { name: '家庭成员', description: '人类最好的朋友们', emoji: '🏠', color: '#fdcb6e' }
    ];

    const categoryIds = {};
    for (const category of categoriesData) {
      const result = await db.query(
        'INSERT INTO animal_categories (name, description, emoji, color) VALUES (?, ?, ?, ?)',
        [category.name, category.description, category.emoji, category.color]
      );
      categoryIds[category.name] = result.insertId;
    }

    // 插入可爱动物数据
    const animalsData = [
      {
        name: '小熊猫',
        description: '圆滚滚的黑白相间小可爱，最爱吃竹子啦！',
        emoji: '🐼',
        habitat: '中国竹林',
        fun_fact: '熊猫一天要睡14个小时，真是个小懒虫！',
        cuteness_level: 10,
        categories: ['陆地萌宠', '森林居民']
      },
      {
        name: '小海豚',
        description: '聪明友好的海洋精灵，会跳跃和转圈圈',
        emoji: '🐬',
        habitat: '温带海洋',
        fun_fact: '海豚有自己的名字，会用独特的声音互相称呼',
        cuteness_level: 9,
        categories: ['海洋精灵']
      },
      {
        name: '小企鹅',
        description: '穿着燕尾服的南极绅士，走路摇摇摆摆超可爱',
        emoji: '🐧',
        habitat: '南极冰原',
        fun_fact: '企鹅爸爸会用脚掌孵蛋，是超级好爸爸！',
        cuteness_level: 10,
        categories: ['极地勇士']
      },
      {
        name: '小兔子',
        description: '蹦蹦跳跳的毛茸茸小球，耳朵长长的',
        emoji: '🐰',
        habitat: '草原和花园',
        fun_fact: '兔子的牙齿一生都在长，所以要不停地磨牙',
        cuteness_level: 9,
        categories: ['陆地萌宠', '家庭成员']
      },
      {
        name: '小猫咪',
        description: '优雅独立的小公主，会发出呼噜呼噜的声音',
        emoji: '🐱',
        habitat: '人类家庭',
        fun_fact: '猫咪只对人类喵喵叫，对其他猫不会这样',
        cuteness_level: 10,
        categories: ['家庭成员']
      },
      {
        name: '小狗狗',
        description: '忠诚友好的人类好朋友，尾巴摇个不停',
        emoji: '🐶',
        habitat: '人类家庭',
        fun_fact: '狗狗的鼻纹就像人类的指纹一样独特',
        cuteness_level: 10,
        categories: ['家庭成员']
      },
      {
        name: '小猴子',
        description: '调皮捣蛋的树上居民，最爱荡秋千',
        emoji: '🐵',
        habitat: '热带雨林',
        fun_fact: '猴子会用工具，比如用石头敲开坚果',
        cuteness_level: 8,
        categories: ['热带明星', '森林居民']
      },
      {
        name: '小鸭子',
        description: '黄色毛茸茸的游泳健将，嘎嘎嘎叫个不停',
        emoji: '🐤',
        habitat: '池塘和农场',
        fun_fact: '小鸭子出生后会把第一个看到的移动物体当作妈妈',
        cuteness_level: 9,
        categories: ['农场伙伴']
      },
      {
        name: '小蝴蝶',
        description: '花丛中翩翩起舞的彩色精灵',
        emoji: '🦋',
        habitat: '花园和草地',
        fun_fact: '蝴蝶用脚来品尝食物的味道',
        cuteness_level: 8,
        categories: ['天空舞者']
      },
      {
        name: '小海龟',
        description: '慢慢游泳的长寿海洋居民，背着重重的壳',
        emoji: '🐢',
        habitat: '热带海洋',
        fun_fact: '海龟可以活100多岁，是真正的长寿明星',
        cuteness_level: 8,
        categories: ['海洋精灵']
      },
      {
        name: '小松鼠',
        description: '毛茸茸的尾巴像小刷子，最爱收集坚果',
        emoji: '🐿️',
        habitat: '森林和公园',
        fun_fact: '松鼠会假装埋坚果来迷惑其他动物',
        cuteness_level: 9,
        categories: ['森林居民']
      },
      {
        name: '小考拉',
        description: '抱着树枝睡觉的澳洲小懒虫',
        emoji: '🐨',
        habitat: '澳洲桉树林',
        fun_fact: '考拉一天要睡20个小时，比熊猫还懒！',
        cuteness_level: 10,
        categories: ['森林居民']
      }
    ];

    const animalResults = [];
    for (const animal of animalsData) {
      try {
        // 插入动物数据
        const result = await db.query(
          'INSERT INTO cute_animals (name, description, emoji, habitat, fun_fact, cuteness_level) VALUES (?, ?, ?, ?, ?, ?)',
          [animal.name, animal.description, animal.emoji, animal.habitat, animal.fun_fact, animal.cuteness_level]
        );
        const animalId = result.insertId;

        // 关联分类
        for (const categoryName of animal.categories) {
          if (categoryIds[categoryName]) {
            await db.query(
              'INSERT INTO animal_category_relations (animal_id, category_id) VALUES (?, ?)',
              [animalId, categoryIds[categoryName]]
            );
          }
        }

        animalResults.push({
          id: animalId,
          name: animal.name,
          emoji: animal.emoji,
          cuteness_level: animal.cuteness_level,
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

    const successCount = animalResults.filter(r => r.status === 'success').length;

    res.json({
      success: true,
      message: `可爱动物演示数据插入完成！🎉 成功插入 ${successCount} 只小动物`,
      statistics: {
        categories_inserted: Object.keys(categoryIds).length,
        animals_success: successCount,
        total_animals: animalsData.length,
        average_cuteness: Math.round(
          animalResults
            .filter(r => r.status === 'success')
            .reduce((sum, r) => sum + r.cuteness_level, 0) / successCount
        )
      },
      sample_animals: animalResults.slice(0, 6),
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
 * 查看演示数据
 */
router.get('/view-data', async (req, res) => {
  try {
    // 获取分类统计
    const categoryStats = await db.query(`
      SELECT c.id, c.name, c.description, c.emoji, c.color,
             COUNT(r.animal_id) as animal_count
      FROM animal_categories c
      LEFT JOIN animal_category_relations r ON c.id = r.category_id
      GROUP BY c.id, c.name, c.description, c.emoji, c.color
      ORDER BY c.name
    `);

    // 获取动物统计
    const animalStats = await db.query(`
      SELECT COUNT(*) as total_animals,
             AVG(cuteness_level) as avg_cuteness,
             MAX(cuteness_level) as max_cuteness
      FROM cute_animals
    `);

    // 获取部分动物示例
    const animalExamples = await db.query(`
      SELECT a.id, a.name, a.description, a.emoji, a.habitat, 
             a.fun_fact, a.cuteness_level,
             GROUP_CONCAT(c.name) as categories
      FROM cute_animals a
      LEFT JOIN animal_category_relations r ON a.id = r.animal_id
      LEFT JOIN animal_categories c ON r.category_id = c.id
      GROUP BY a.id, a.name, a.description, a.emoji, a.habitat, a.fun_fact, a.cuteness_level
      ORDER BY a.cuteness_level DESC, a.id
      LIMIT 8
    `);

    res.json({
      success: true,
      message: '可爱动物数据查询成功！🐾',
      statistics: {
        total_categories: categoryStats.length,
        total_animals: animalStats[0].total_animals,
        average_cuteness: Math.round(animalStats[0].avg_cuteness * 10) / 10,
        max_cuteness: animalStats[0].max_cuteness
      },
      categories: categoryStats,
      animal_examples: animalExamples.map(a => ({
        ...a,
        categories: a.categories ? a.categories.split(',') : []
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('查询演示数据失败:', error);
    res.status(500).json({
      success: false,
      message: '查询演示数据失败',
      error: error.message
    });
  }
});





/**
 * 获取动物分类数据
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await db.query(`
      SELECT ac.id, ac.name, ac.description, ac.emoji, ac.color,
             COUNT(acr.animal_id) as animal_count
      FROM animal_categories ac
      LEFT JOIN animal_category_relations acr ON ac.id = acr.category_id
      GROUP BY ac.id, ac.name, ac.description, ac.emoji, ac.color
      ORDER BY ac.name
    `);

    res.json({
      success: true,
      message: '动物分类数据获取成功',
      data: categories,
      total: categories.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取分类数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取分类数据失败',
      error: error.message
    });
  }
});

/**
 * 获取动物数据
 */
router.get('/animals', async (req, res) => {
  try {
    const animals = await db.query(`
      SELECT ca.id, ca.name, ca.description, ca.emoji, ca.habitat, 
             ca.fun_fact, ca.cuteness_level,
             GROUP_CONCAT(ac.name) as categories
      FROM cute_animals ca
      LEFT JOIN animal_category_relations acr ON ca.id = acr.animal_id
      LEFT JOIN animal_categories ac ON acr.category_id = ac.id
      GROUP BY ca.id, ca.name, ca.description, ca.emoji, ca.habitat, ca.fun_fact, ca.cuteness_level
      ORDER BY ca.cuteness_level DESC, ca.name
    `);

    const processedAnimals = animals.map(animal => ({
      ...animal,
      categories: animal.categories ? animal.categories.split(',') : []
    }));

    res.json({
      success: true,
      message: '可爱动物数据获取成功',
      data: processedAnimals,
      total: processedAnimals.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取动物数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取动物数据失败',
      error: error.message
    });
  }
});

/**
 * 获取数据统计信息
 */
router.get('/statistics', async (req, res) => {
  try {
    const [categoryCount] = await db.query('SELECT COUNT(*) as count FROM animal_categories');
    const [animalCount] = await db.query('SELECT COUNT(*) as count FROM cute_animals');
    const [avgCuteness] = await db.query('SELECT AVG(cuteness_level) as avg FROM cute_animals');
    const [maxCuteness] = await db.query('SELECT MAX(cuteness_level) as max FROM cute_animals');

    const topAnimals = await db.query(`
      SELECT name, emoji, cuteness_level 
      FROM cute_animals 
      ORDER BY cuteness_level DESC 
      LIMIT 3
    `);

    res.json({
      success: true,
      message: '数据统计信息',
      statistics: {
        total_categories: categoryCount.count,
        total_animals: animalCount.count,
        average_cuteness: Math.round(avgCuteness.avg * 10) / 10,
        max_cuteness: maxCuteness.max
      },
      data: topAnimals,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取统计信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败',
      error: error.message
    });
  }
});


module.exports = router;