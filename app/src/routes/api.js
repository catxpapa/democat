const express = require('express');
const router = express.Router();
const db = require('../utils/db');

/**
 * 获取所有标签
 */
router.get('/tags', async (req, res) => {
  try {
    const tags = await db.query(`
      SELECT t.id, t.name, t.description, COUNT(st.snippet_id) as snippet_count
      FROM tags t
      LEFT JOIN snippet_tags st ON t.id = st.tag_id
      GROUP BY t.id, t.name, t.description
      ORDER BY t.name
    `);

    res.json({
      success: true,
      data: tags,
      total: tags.length
    });
  } catch (error) {
    console.error('获取标签失败:', error);
    res.status(500).json({
      success: false,
      message: '获取标签失败',
      error: error.message
    });
  }
});

/**
 * 根据标签获取片段
 */
router.get('/snippets', async (req, res) => {
  try {
    const { tag_ids, search, limit = 50, offset = 0 } = req.query;
    
    let sql = `
      SELECT DISTINCT s.id, s.title, s.content, s.image_url,
             GROUP_CONCAT(t.name) as tags
      FROM snippets s
      LEFT JOIN snippet_tags st ON s.id = st.snippet_id
      LEFT JOIN tags t ON st.tag_id = t.id
    `;
    
    const params = [];
    const conditions = [];
    
    // 按标签筛选
    if (tag_ids) {
      const tagIdArray = tag_ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      if (tagIdArray.length > 0) {
        conditions.push(`st.tag_id IN (${tagIdArray.map(() => '?').join(',')})`);
        params.push(...tagIdArray);
      }
    }
    
    // 搜索功能
    if (search) {
      conditions.push(`(s.title LIKE ? OR s.content LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    sql += `
      GROUP BY s.id, s.title, s.content, s.image_url
      ORDER BY s.id
      LIMIT ? OFFSET ?
    `;
    
    params.push(parseInt(limit), parseInt(offset));
    
    const snippets = await db.query(sql, params);
    
    // 处理标签数据
    const processedSnippets = snippets.map(snippet => ({
      ...snippet,
      tags: snippet.tags ? snippet.tags.split(',') : []
    }));

    res.json({
      success: true,
      data: processedSnippets,
      total: processedSnippets.length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('获取片段失败:', error);
    res.status(500).json({
      success: false,
      message: '获取片段失败',
      error: error.message
    });
  }
});

/**
 * 获取推荐片段（最近使用、热门等）
 */
router.get('/snippets/recommended', async (req, res) => {
  try {
    // 获取每个标签的热门片段
    const recommended = await db.query(`
      SELECT s.id, s.title, s.content, t.name as tag_name
      FROM snippets s
      JOIN snippet_tags st ON s.id = st.snippet_id
      JOIN tags t ON st.tag_id = t.id
      WHERE t.name IN ('主题', '风格', '环境', '光影')
      ORDER BY RAND()
      LIMIT 20
    `);

    res.json({
      success: true,
      data: recommended
    });
  } catch (error) {
    console.error('获取推荐片段失败:', error);
    res.status(500).json({
      success: false,
      message: '获取推荐片段失败',
      error: error.message
    });
  }
});

module.exports = router;