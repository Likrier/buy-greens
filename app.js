const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 数据文件路径
const DATA_FILE = path.join(__dirname, "data", "shopping.json");

// 确保 data 目录存在
if (!fs.existsSync(path.join(__dirname, "data"))) {
  fs.mkdirSync(path.join(__dirname, "data"));
}

// 获取今日日期
const getTodayDate = () => {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
};

// 读取数据
const readData = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("读取数据失败:", error);
  }
  return {}; // 返回空对象
};

// 写入数据
const writeData = (data) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("写入数据失败:", error);
    return false;
  }
};

// API 路由

// 获取今日清单
app.get("/api/list", (req, res) => {
  const today = getTodayDate();
  const allData = readData();
  const todayData = allData[today] || {
    items: [],
    updatedAt: new Date().toISOString(),
  };

  res.json({
    date: today,
    items: todayData.items,
    updatedAt: todayData.updatedAt,
  });
});

// 提交今日清单
app.post("/api/list", (req, res) => {
  const { items } = req.body;
  const today = getTodayDate();

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: "无效的数据格式" });
  }

  const allData = readData();
  allData[today] = {
    items: items,
    updatedAt: new Date().toISOString(),
  };

  if (writeData(allData)) {
    res.json({ success: true, date: today });
  } else {
    res.status(500).json({ error: "保存失败" });
  }
});

// 标记已购买
app.patch("/api/list/item/:itemName/toggle", (req, res) => {
  const { itemName } = req.params;
  const today = getTodayDate();

  const allData = readData();
  const todayData = allData[today];

  if (!todayData) {
    return res.status(404).json({ error: "今日无数据" });
  }

  const item = todayData.items.find(
    (i) => i.name === decodeURIComponent(itemName)
  );
  if (item) {
    item.bought = !item.bought;
    todayData.updatedAt = new Date().toISOString();
    allData[today] = todayData;

    if (writeData(allData)) {
      res.json({ success: true, bought: item.bought });
    } else {
      res.status(500).json({ error: "更新失败" });
    }
  } else {
    res.status(404).json({ error: "未找到该菜品" });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📋 数据文件位置: ${DATA_FILE}`);
});
