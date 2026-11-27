# 望江吃啥子 · 今天吃什mo

> 让仔仔和璇璇帮你拿主意的像素风干饭决策器 🍜
> 四川大学望江校区专属，内置40家人气食堂&校外美食，支持自己加菜。

**在线体验：https://zexuanlei678-dotcom.github.io/wangjiang-what-to-eat/**

这是一个**完全独立、零依赖、零构建**的静态网页：clone下来直接双击`index.html`就能玩，也可以一键部署到GitHub Pages。
最初版本在灵光（闪应用）里搭建，本项目把它重写为不依赖任何平台运行时的开源版本。

## ✨ 功能

- **随机推荐**：按食堂/校外、菜系、价位筛选后一键随机，最近5次结果不重复
- **转盘抽选**：最多选8个候选，转到哪个吃哪个
- **美食清单**：搜索、多维筛选、左滑编辑/删除、多选批量删除、自定义菜系（增删改）
- **添加美食**：名称、类型、菜系、位置、人均、推荐理由
- **像素小人**：仔仔和璇璇有11套动作（待机/挥手/跳舞/转圈/干饭/饿了/弹跳/跳跃/害羞/惊讶/欢呼），会随机眨眼、发梢摆动，点击有小惊喜
- **8-bit音效**：原生WebAudio合成，可关闭
- **数据备份**：所有改动保存在浏览器本地，清单页支持导出/导入JSON，换设备不丢

## 🚀 本地运行

```bash
git clone https://github.com/zexuanlei678-dotcom/wangjiang-what-to-eat.git
cd wangjiang-what-to-eat
```

- **最简单**：直接双击`index.html`
- **推荐**（避免个别浏览器对本地文件的限制）：

```bash
# 任选其一
python -m http.server 8080        # 然后打开 http://localhost:8080
npx serve .
```

## 🍴 Fork成你自己的版本

点右上角**Fork**，然后把`data/foods.js`里的菜品换成你学校/公司附近的，再按下面步骤开启Pages，就是属于你的干饭决策器。

## 🌐 部署到GitHub Pages

仓库已自带`.github/workflows/pages.yml`，推送到`main`分支后自动发布。

第一次使用需要在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**，之后每次push都会自动更新。

## 🎨 改像素小人

打开`dev/sprites.html`可以放大预览所有动作，支持参数：

```
dev/sprites.html?scale=12                 # 放大12倍
dev/sprites.html?action=wave&freeze=1     # 只看挥手动作的第2帧
```

造型代码在`assets/js/pixel.js`：

- `PAL`：调色板（发色、肤色、衣服……直接改色值）
- `drawGirl` / `drawBoy`：用`R(x, y, w, h, 颜色)`逐块绘制，坐标以左上角为原点，画布24×32
- `ACTIONS`：动作表，每个动作返回若干帧的姿态参数（`armL/armR`手臂、`eyes`眼睛、`mouth`嘴巴、`dy`上下位移、`sway`发梢摆动……）

## 🍲 贡献菜品

编辑`data/foods.js`，在`foods`数组里按格式加一条，提PR即可：

```js
{ "id": "n41", "name": "你的美食", "type": "outside", "cuisine": "🍜特色美食",
  "location": "望江校区小北门", "avgPrice": 18, "description": "一句话推荐理由", "isCanteen": false }
```

`type`取`canteen`（食堂）或`outside`（校外），`cuisine`建议从`cuisines`列表里选。

## 📁 目录结构

```
├── index.html              入口
├── data/foods.js           内置菜品数据
├── assets/
│   ├── css/style.css       全部样式
│   └── js/
│       ├── pixel.js        像素小人引擎（造型+动作）
│       ├── audio.js        WebAudio音效
│       ├── icons.js        内联SVG图标
│       └── app.js          页面逻辑与状态
├── dev/sprites.html        像素小人预览调试页
└── .github/workflows/pages.yml
```

## 📄 许可证

MIT License，随便玩，随便改。
