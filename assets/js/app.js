/*
 * 川大望江·今天吃什么 —— 独立版主程序
 * 零依赖、零构建；数据保存在浏览器localStorage。
 */
(function () {
  const DATA = window.FOODS_DATA;
  const BASE_CUISINES = DATA.cuisines;
  const PRICE_RANGES = [
    { key: 'under10', label: '¥10以下' }, { key: '10to25', label: '¥10-25' },
    { key: '25to50', label: '¥25-50' }, { key: 'above50', label: '¥50以上' }
  ];
  const KEYS = {
    userFoods: 'wangjiang_user_foods', deleted: 'wangjiang_deleted_foods', edited: 'wangjiang_edited_foods',
    customCuisines: 'wangjiang_custom_cuisines', hiddenCuisines: 'wangjiang_hidden_cuisines'
  };
  const CHEER_WORDS = ['就是它！', '开吃！', '好吃！', '冲！'];
  const ACTIONS = ['wave', 'dance', 'spin', 'eat', 'hungry', 'boing', 'jump', 'shy', 'surprise'];
  const CHATTER = ['好饿呀～', '吃这个！', '我看看～', '冲呀！', '嘿嘿！', '开饭啦！', '饿晕了～', 'Duang～', '蹦蹦跳！', '扭一扭～', '哇！', '吧唧吧唧～', '好耶！', '猜猜我想到啥～', '嘿嘿嘿～'];
  const WHEEL_COLORS = ['#E8A0B4', '#F6C86E', '#9DB8D9', '#A8CFA8'];
  const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu;

  // ---------- 工具 ----------
  const $ = (sel, root) => (root || document).querySelector(sel);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const stripEmoji = (s) => (s || '').replace(EMOJI_RE, '').trim();
  function load(key, def) {
    try { const v = localStorage.getItem(key); return v == null ? def : JSON.parse(v); } catch (e) { return def; }
  }
  function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
  const priceRange = (p) => p <= 10 ? 'under10' : p <= 25 ? '10to25' : p <= 50 ? '25to50' : 'above50';

  function pixIcon(kind, size) {
    const S = {
      star: { p: { y: '#F6C86E', o: '#D9A33C' }, g: ['..y..', '.yyy.', 'yyyyy', '.yyy.', '.ooo.'] },
      heart: { p: { p: '#F2A3B8', d: '#D98CA0' }, g: ['.p.p.', 'ppppp', 'ppppp', '.dpd.', '..d..'] },
      coin: { p: { y: '#F6C86E', w: '#FBEBB5', o: '#D9A33C' }, g: ['.yyy.', 'yyyyy', 'yywyy', 'yyyyy', '.ooo.'] },
      chili: { p: { r: '#E96A6A', g: '#6FA87B' }, g: ['..g..', '.ggg.', 'rrrrr', 'rrrrr', '.rrr.', '..r..'] }
    }[kind];
    const h = S.g.length, w = S.g[0].length, sz = size || 16;
    const rects = S.g.flatMap((row, y) => [...row].map((ch, x) => S.p[ch] ? `<rect x="${x}" y="${y}" width="1" height="1" fill="${S.p[ch]}"/>` : '')).join('');
    return `<svg width="${sz}" height="${Math.round(sz * h / w)}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
  }

  // ---------- 状态 ----------
  const S = {
    tab: 'home', cover: true,
    userFoods: load(KEYS.userFoods, []), deleted: new Set(load(KEYS.deleted, [])), edited: load(KEYS.edited, {}),
    customCuisines: load(KEYS.customCuisines, []), hiddenCuisines: load(KEYS.hiddenCuisines, []),
    mode: 'random', filterOpen: false, fType: 'all', fCuisine: 'all', fPrice: 'all', randomResult: null, recent: [],
    candidates: [], spinning: false, wheelRot: 0, spinResult: null,
    chatter: null,
    q: '', lType: 'all', lCuisine: 'all', lPrice: 'all', multi: false, selected: new Set(), openRow: null, editing: null,
    manageOpen: false, manageInput: '', manageConfirm: null, manageRenaming: null, manageRenameVal: '', manageErr: '',
    detail: null,
    add: { name: '', type: 'outside', cuisine: '', location: '', price: '', desc: '' }, addErr: '', addOk: false,
    sound: window.Sfx ? Sfx.enabled : true
  };
  const baseIds = new Set(DATA.foods.map((f) => f.id));

  function cuisines() {
    const set = new Set(BASE_CUISINES.filter((c) => !S.hiddenCuisines.includes(c)));
    S.customCuisines.forEach((c) => set.add(c));
    set.add('其他');
    return [...set];
  }
  function normalizeCuisine(c, list) {
    const t = (c || '').trim(); if (!t) return '';
    if (list.includes(t)) return t;
    const s = stripEmoji(t);
    if (s && list.includes(s)) return s;
    return t;
  }
  function allFoods() {
    const list = cuisines();
    const base = DATA.foods.map((f) => {
      const e = S.edited[f.id]; if (!e) return f;
      return Object.assign({}, f, {
        name: e.name && e.name.trim() ? e.name.trim() : f.name,
        location: e.location && e.location.trim() ? e.location.trim() : f.location,
        avgPrice: typeof e.avgPrice === 'number' && e.avgPrice > 0 ? e.avgPrice : f.avgPrice,
        cuisine: e.cuisine && e.cuisine.trim() ? normalizeCuisine(e.cuisine, list) : f.cuisine
      });
    });
    return [...base, ...S.userFoods];
  }
  function visibleFoods() { return allFoods().filter((f) => !S.deleted.has(f.id)); }
  function applyFilters(list, type, cuisine, price, q) {
    let r = list;
    if (type === 'canteen') r = r.filter((f) => f.isCanteen);
    else if (type === 'outside') r = r.filter((f) => !f.isCanteen);
    if (cuisine !== 'all') r = r.filter((f) => f.cuisine === cuisine);
    if (price !== 'all') r = r.filter((f) => priceRange(f.avgPrice || 0) === price);
    if (q && q.trim()) { const k = q.trim().toLowerCase(); r = r.filter((f) => f.name.toLowerCase().includes(k) || (f.location || '').toLowerCase().includes(k)); }
    return r;
  }
  function findFood(id) { return allFoods().find((f) => f.id === id); }

  // ---------- 持久化 ----------
  function persist() {
    save(KEYS.userFoods, S.userFoods); save(KEYS.deleted, [...S.deleted]); save(KEYS.edited, S.edited);
    save(KEYS.customCuisines, S.customCuisines); save(KEYS.hiddenCuisines, S.hiddenCuisines);
  }

  // ---------- 渲染：骨架 ----------
  const app = $('#app');
  function render() {
    app.innerHTML = headerHTML() + `<main>${S.tab === 'home' ? homePage() : S.tab === 'list' ? listPage() : addPage()}</main>` + navHTML() + `<div id="overlays">${overlaysHTML()}</div>`;
    mountSprites(document);
    afterRender();
  }
  function renderOverlays() { $('#overlays').innerHTML = overlaysHTML(); mountSprites($('#overlays')); }
  function afterRender() {
    if (S.tab === 'list') bindRows();
    const w = $('#wheel'); if (w) { w.style.transform = `rotate(${S.wheelRot}deg)`; }
  }

  function headerHTML() {
    const n = visibleFoods().length;
    return `<header class="app-header"><h1 class="pixel-title">望江吃啥子</h1>
      <div class="header-right"><span class="count-badge pixel-font">${icon('restaurant', 16)}<span>${n} 个选择</span></span>
      <button type="button" class="icon-btn pixel-btn bg-cream" data-act="sound-toggle" aria-label="${S.sound ? '关闭声音' : '打开声音'}">${icon(S.sound ? 'volume_up' : 'volume_off', 18)}</button></div></header>`;
  }
  function navHTML() {
    const items = [{ key: 'home', icon: 'casino', label: '推荐' }, { key: 'list', icon: 'list', label: '清单' }, { key: 'add', icon: 'add_circle_outline', label: '添加' }];
    return `<nav class="app-nav">${items.map((it) => `<button type="button" data-act="nav" data-tab="${it.key}" class="${S.tab === it.key ? 'active' : ''}"><span class="nav-ico">${icon(it.icon, 22)}</span><span class="nav-label">${it.label}</span></button>`).join('')}</nav>`;
  }

  // ---------- 首页 ----------
  function homePage() {
    const list = visibleFoods();
    return `<div class="page">
      <div class="pixel-card hero-card">
        <div class="hero-deco left"><span class="sprite-float-a">${pixIcon('star', 16)}</span><span class="sprite-float-b">${pixIcon('chili', 15)}</span></div>
        <h2 class="pixel-title">今天吃什mo</h2><p class="pixel-font">让仔仔和璇璇帮你拿主意</p>
        <div class="hero-deco right"><span class="sprite-float-b">${pixIcon('heart', 15)}</span><span class="sprite-float-a">${pixIcon('coin', 16)}</span></div>
      </div>
      <div class="chefs">
        ${chefHTML('male', '仔仔')}
        <div class="chef-hint">${icon('touch_app', 14)}<span class="pixel-font">点我有惊喜</span></div>
        ${chefHTML('female', '璇璇')}
      </div>
      <div class="mode-tabs">
        <button type="button" data-act="mode" data-mode="random" class="pixel-btn ${S.mode === 'random' ? 'bg-pink' : 'bg-cream'}">${icon('casino', 17)}随机推荐</button>
        <button type="button" data-act="mode" data-mode="spinner" class="pixel-btn ${S.mode === 'spinner' ? 'bg-pink' : 'bg-cream'}">${icon('spa', 17)}转盘抽选</button>
      </div>
      ${S.mode === 'random' ? randomPanelHTML(list) : spinnerPanelHTML(list)}
    </div>`;
  }
  function chefHTML(who, name) {
    const ch = S.chatter && S.chatter.who === who ? S.chatter : null;
    const side = who === 'male' ? 'left' : 'right';
    return `<button type="button" class="chef" data-act="chef" data-who="${who}">
      <span id="bubble-${who}" class="bubble-wrap ${side}">${ch ? `<span class="bubble ${side}">${esc(ch.text)}</span>` : ''}</span>
      <span data-sprite="${who}" data-action="${ch ? ch.action : 'bob'}"></span>
      <span class="shadow"></span><span class="chef-name">${name}</span></button>`;
  }
  function chipRow(kind, current, items, act, extra) {
    return `<div class="chip-row">${items.map((it) => {
      const v = typeof it === 'string' ? it : it.key, label = typeof it === 'string' ? it : it.label;
      return `<button type="button" class="chip${extra || ''} ${current === v ? 'active' : ''}" data-act="${act}" data-v="${esc(v)}">${esc(label)}</button>`;
    }).join('')}</div>`;
  }
  function randomPanelHTML(list) {
    const filtered = applyFilters(list, S.fType, S.fCuisine, S.fPrice, '');
    return `<div>
      <div class="mb3"><button type="button" class="chip lg filter-toggle pixel-chip ${S.filterOpen ? 'bg-brown' : 'bg-cream'}" data-act="filter-toggle">${icon('tune', 14)}${S.filterOpen ? '收起筛选' : '筛选'}</button></div>
      ${S.filterOpen ? `<div class="filter-panel">
        ${chipRow('type', S.fType, ['all', 'canteen', 'outside'], 'ftype').replace('>all<', '>全部<').replace('>canteen<', '>食堂<').replace('>outside<', '>校外<')}
        ${chipRow('cuisine', S.fCuisine, ['all', ...cuisines()], 'fcuisine').replace('>all<', '>全部菜系<')}
        ${chipRow('price', S.fPrice, [{ key: 'all', label: '全部价位' }, ...PRICE_RANGES], 'fprice')}
      </div>` : ''}
      ${filtered.length === 0 ? `<div class="empty-tip pixel-card-sm">筛完后没有可选的美食啦，调整筛选或去添加新的吧</div>` : ''}
      <button type="button" class="big-btn pixel-btn bg-pink" data-act="random-btn">${icon('shuffle', 20)}随机推荐</button>
    </div>`;
  }
  function spinnerPanelHTML(list) {
    const sel = S.candidates.map((id) => findFood(id)).filter((f) => f && !S.deleted.has(f.id));
    const canteen = list.filter((f) => f.isCanteen), outside = list.filter((f) => !f.isCanteen);
    const candChips = (arr) => `<div class="chip-row">${arr.map((f) => `<button type="button" class="chip ${S.candidates.includes(f.id) ? 'active' : ''}" data-act="cand" data-id="${f.id}">${S.candidates.includes(f.id) ? icon('check', 12) : ''}${esc(f.name)}</button>`).join('') || '<span class="text-soft" style="font-size:11px">暂无</span>'}</div>`;
    const wheelCls = S.spinning ? 'spinning' : sel.length >= 2 ? 'ready' : 'idle';
    return `<div>
      <div class="spinner-head"><p class="pixel-font">已选 <strong class="text-pink">${sel.length}</strong> / 8 个候选</p>${sel.length < 2 ? '<p class="pixel-font weak">至少选 2 个才能转盘</p>' : ''}</div>
      <div class="candidate-box pixel-card-sm">
        <div class="candidate-group"><h4 class="pixel-font">${icon('storefront', 13)} 校内食堂</h4>${candChips(canteen)}</div>
        <div class="candidate-group"><h4 class="pixel-font">${icon('ramen_dining', 13)} 校外美食</h4>${candChips(outside)}</div>
      </div>
      <div class="wheel-wrap">
        <div id="wheel-area" class="wheel-box ${wheelCls}" data-act="spin">
          <div class="wheel-pointer"></div>
          <div id="wheel" class="wheel ${S.spinning ? 'seg spin' : 'seg'}">${sel.length ? sel.map((f, i) => wheelSeg(f, i, sel.length)).join('') : ''}</div>
          <div class="wheel-center"></div>
        </div>
        <button type="button" class="spin-btn pixel-btn bg-yellow" data-act="spin" ${S.spinning || sel.length < 2 ? 'disabled' : ''}>${icon('play_arrow', 16)}${S.spinning ? '转动中…' : '开始转动'}</button>
      </div>
    </div>`;
  }
  function wheelSeg(f, i, n) {
    const deg = 360 / n, color = WHEEL_COLORS[i % WHEEL_COLORS.length];
    return `<div class="seg" style="transform:rotate(${i * deg}deg);background:conic-gradient(${color} ${Math.max(0, deg - 0.8)}deg,rgba(37,37,37,.55) ${deg}deg,transparent 0)">
      <div style="position:absolute;inset:0;transform:rotate(${deg / 2}deg)"><span class="seg-label" style="transform:translateX(-50%)">${esc(f.name.length > 4 ? f.name.slice(0, 4) + '..' : f.name)}</span></div></div>`;
  }

  // ---------- 清单 ----------
  function listPage() {
    const list = visibleFoods(), cs = cuisines();
    const shown = applyFilters(list, S.lType, S.lCuisine, S.lPrice, S.q);
    return `<div class="page">
      <div class="search-box">${icon('search', 20)}<input class="input" type="text" data-model="q" value="${esc(S.q)}" placeholder="搜索美食名称或位置..."></div>
      ${chipRow('ltype', S.lType, ['all', 'canteen', 'outside'], 'ltype').replace('>all<', '>全部<').replace('>canteen<', '>食堂<').replace('>outside<', '>校外<')}
      <div class="chip-row">
        <button type="button" class="chip ${S.lCuisine === 'all' ? 'active' : ''}" data-act="lcuisine" data-v="all">全部菜系</button>
        ${cs.map((c) => `<button type="button" class="chip ${S.lCuisine === c ? 'active' : ''}" data-act="lcuisine" data-v="${esc(c)}">${esc(c)}</button>`).join('')}
        <button type="button" class="chip pink-outline" data-act="manage-open">${icon('edit', 12)}管理菜系</button>
      </div>
      ${chipRow('lprice', S.lPrice, [{ key: 'all', label: '全部价位' }, ...PRICE_RANGES], 'lprice')}
      <div class="list-tools"><p class="pixel-font">共 <span id="list-count">${shown.length}</span> 个美食${!S.multi ? '<span class="hint">左滑可编辑/移除</span>' : ''}</p>
        <div style="display:flex;gap:6px">
          <button type="button" class="chip ${S.multi ? 'active' : ''}" data-act="multi-toggle">${icon(S.multi ? 'close' : 'done_all', 13)}${S.multi ? '退出' : '多选'}</button>
          <button type="button" class="chip" data-act="backup-export" title="导出我的数据">${icon('download', 13)}</button>
          <button type="button" class="chip" data-act="backup-import" title="导入数据">${icon('upload', 13)}</button>
          <input type="file" id="import-file" accept="application/json,.json" hidden>
        </div></div>
      <div id="list-body">${listBodyHTML(shown)}</div>
    </div>`;
  }
  function listBodyHTML(shown) {
    if (!shown.length) return `<div class="empty-state">${icon('search_off', 40)}<p>没有找到，试试换个条件，或者自己添加一个？</p></div>`;
    return `<div class="rows">${shown.map(rowHTML).join('')}</div>${S.multi ? `<div class="multi-bar"><div class="multi-bar-inner">
      <span class="sel pixel-font">${icon('checklist', 18)}已选 ${S.selected.size} 项</span>
      <span class="ops"><button type="button" class="pixel-btn bg-warm" data-act="multi-all">${icon('select_all', 16)}全选</button>
      <button type="button" class="pixel-btn bg-pink" data-act="multi-delete" ${S.selected.size ? '' : 'disabled'}>${icon('delete', 16)}删除</button></span>
    </div></div>` : ''}`;
  }
  function rowHTML(f) {
    const open = S.openRow === f.id && !S.multi, sel = S.selected.has(f.id);
    return `<div class="row" data-row="${f.id}">
      <div class="row-actions"><button type="button" class="edit" data-act="row-edit" data-id="${f.id}">${icon('edit', 18)}<span>编辑</span></button><button type="button" class="del" data-act="row-del" data-id="${f.id}">${icon('delete', 18)}<span>删除</span></button></div>
      <div class="row-main ${sel ? 'selected' : ''}" data-id="${f.id}" style="transform:translateX(${open ? -112 : 0}px)">
        ${S.multi ? `<span class="row-check ${sel ? 'on' : ''}" data-act="row-check" data-id="${f.id}">${icon('check', 15)}</span>` : ''}
        <div class="row-info"><p class="name">${esc(f.name)}</p><p class="meta">${f.cuisine ? `<span class="cui">${esc(f.cuisine)}</span>` : ''}${f.cuisine ? '<span class="dot"> · </span>' : ''}${esc(f.location || '')}</p></div>
        <span class="row-price pixel-font">¥${f.avgPrice || 0}</span>
      </div></div>`;
  }

  // ---------- 添加 ----------
  function addPage() {
    const a = S.add, cs = cuisines();
    return `<div class="page"><div class="form">
      <div class="field"><label>名称 *</label><input class="input" type="text" data-model="add.name" value="${esc(a.name)}" placeholder="例如：老坛子牛肉面"></div>
      <div class="field"><label>类型 *</label><div class="seg-2">
        <button type="button" class="pixel-btn ${a.type === 'canteen' ? 'bg-pink' : 'bg-cream'}" data-act="add-type" data-v="canteen">食堂</button>
        <button type="button" class="pixel-btn ${a.type === 'outside' ? 'bg-pink' : 'bg-cream'}" data-act="add-type" data-v="outside">校外</button></div></div>
      <div class="field"><label>菜系 *</label><div class="chip-row">${cs.map((c) => `<button type="button" class="chip lg ${a.cuisine === c ? 'active' : ''}" data-act="add-cuisine" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div></div>
      <div class="field"><label>位置描述 *</label><input class="input" type="text" data-model="add.location" value="${esc(a.location)}" placeholder="例如：一环路南一段24号"></div>
      <div class="field"><label>人均消费（选填）</label><input class="input" type="number" inputmode="decimal" data-model="add.price" value="${esc(a.price)}" placeholder="例如：25"></div>
      <div class="field"><label>推荐理由（选填）</label><textarea class="input" rows="2" data-model="add.desc" placeholder="例如：招牌牛肉面">${esc(a.desc)}</textarea></div>
      ${S.addErr ? `<p class="form-msg">${esc(S.addErr)}</p>` : ''}${S.addOk ? '<p class="form-ok">添加成功！</p>' : ''}
      <button type="button" class="big-btn pixel-btn bg-pink" data-act="add-submit">${icon('add_circle_outline', 18)}添加美食</button>
    </div></div>`;
  }

  // ---------- 弹窗 ----------
  function overlaysHTML() {
    let h = '';
    if (S.detail) h += resultModalHTML(S.detail);
    if (S.editing) h += editModalHTML(S.editing);
    if (S.manageOpen) h += manageModalHTML();
    return h;
  }
  function foodCardHTML(f, variant) {
    const tags = `<div class="tags"><span class="tag pixel-chip">${f.isCanteen ? '食堂' : '校外'}</span><span class="tag pixel-chip">${esc(f.cuisine || '')}</span></div>`;
    const price = `<div class="price"><p class="num pixel-font">¥${f.avgPrice || 0}</p><p class="unit">人均</p></div>`;
    if (variant === 'result') return `<div class="food-card result pixel-card"><div class="top"><div style="flex:1;min-width:0"><p class="name">${esc(f.name)}</p>${tags}</div>${price}</div>
      ${f.description ? `<p class="desc">${esc(f.description)}</p>` : ''}<p class="loc">${icon('location_on', 14)}${esc(f.location || '')}</p></div>`;
    return `<div class="food-card pixel-card"><div class="top"><div style="flex:1;min-width:0"><p class="name">${esc(f.name)}</p>${tags}</div>${price}</div>
      ${f.description ? `<p class="desc">${esc(f.description)}</p>` : ''}<p class="loc">${icon('location_on', 13)}${esc(f.location || '')}</p></div>`;
  }
  function cheerHTML() {
    const item = (who, name, left) => `<div class="cheer-item">
      <span class="cheer-star" style="left:${left ? -14 : -12}px;top:${left ? 3 : 0}px;--sx:${left ? -8 : 8}px;--sy:-14px;animation-delay:${left ? '.15s' : '.45s'}s;color:#F6C86E">${pixIcon('star', 13)}</span>
      <span class="cheer-star" style="right:${left ? -12 : -13}px;top:${left ? -3 : 5}px;--sx:${left ? 6 : -6}px;--sy:-12px;animation-delay:${left ? '.6s' : '.8s'}s">${pixIcon('heart', 11)}</span>
      <span class="cheer-dash" style="${left ? 'left' : 'right'}:-7px;top:14px;animation-delay:${left ? '.35s' : '.55s'}s"></span>
      <span data-sprite="${who}" data-action="cheer"></span><span class="shadow" style="width:46px"></span></div>`;
    return `<div class="cheer-row">${item('male', '仔仔', true)}<div class="cheer-bubble">${pick(CHEER_WORDS)}</div>${item('female', '璇璇', false)}</div>`;
  }
  function resultModalHTML(f) {
    const pool = applyFilters(visibleFoods(), S.fType, S.fCuisine, S.fPrice, S.tab === 'list' ? S.q : '');
    const canSwap = pool.length > 1;
    return `<div class="mask" data-act="result-close" data-testid="result-mask"><div class="modal pixel-card" data-testid="result-modal" data-stop="1">
      <button type="button" class="modal-close pixel-btn bg-cream" data-act="result-close" aria-label="关闭">${icon('close', 18)}</button>
      ${cheerHTML()}<div class="result-food">${foodCardHTML(f, 'result')}</div>
      <div class="result-foot"><button type="button" class="sq-btn pixel-btn bg-yellow" data-act="result-swap" aria-label="换一换" ${canSwap ? '' : 'disabled'}>${icon('autorenew', 22)}</button></div>
    </div></div>`;
  }
  function editModalHTML(f) {
    const e = S.editing, cs = cuisines();
    return `<div class="mask" data-act="edit-close"><div class="modal pixel-card ${e.closing ? 'closing' : ''}" data-stop="1">
      <h3 class="pixel-title">编辑美食</h3><div class="form">
      <div class="field"><label>名称 *</label><input class="input" type="text" data-model="editing.name" value="${esc(e.name)}"></div>
      <div class="field"><label>类型 *</label><div class="seg-2">
        <button type="button" class="pixel-btn ${e.type === 'canteen' ? 'bg-pink' : 'bg-cream'}" data-act="edit-type" data-v="canteen">食堂</button>
        <button type="button" class="pixel-btn ${e.type === 'outside' ? 'bg-pink' : 'bg-cream'}" data-act="edit-type" data-v="outside">校外</button></div></div>
      <div class="field"><label>菜系 *</label><div class="chip-row">${cs.map((c) => `<button type="button" class="chip ${e.cuisine === c ? 'active' : ''}" data-act="edit-cuisine" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div></div>
      <div class="field"><label>位置描述 *</label><input class="input" type="text" data-model="editing.location" value="${esc(e.location)}"></div>
      <div class="field"><label>人均消费（元）*</label><input class="input" type="number" inputmode="decimal" data-model="editing.avgPrice" value="${esc(e.avgPrice)}"></div>
      </div>
      <div class="form-foot"><button type="button" class="sq-btn pixel-btn bg-warm" data-act="edit-cancel" ${e.saying ? 'disabled' : ''}>${icon('close', 22)}</button>
      <button type="button" class="sq-btn pixel-btn bg-pink" data-act="edit-confirm" ${e.saying ? 'disabled' : ''}>${icon('check', 22)}</button></div>
      ${e.saying ? `<div class="chef-pop"><span data-sprite="${e.saying.who}" data-action="boing"></span><span class="say">${esc(e.saying.text)}</span></div>` : ''}
    </div></div>`;
  }
  function manageModalHTML() {
    const cs = cuisines(), list = visibleFoods();
    const rows = cs.map((c) => {
      const n = list.filter((f) => f.cuisine === c).length;
      const confirming = S.manageConfirm === c, renaming = S.manageRenaming === c;
      return `<div class="manage-row">
        ${renaming ? `<div class="rename-row"><input class="input" data-model="manageRenameVal" value="${esc(S.manageRenameVal)}" placeholder="新菜系名称">
          <button type="button" class="sm pixel-btn bg-pink" data-act="manage-rename-save" data-c="${esc(c)}">保存</button>
          <button type="button" class="sm pixel-btn bg-warm" data-act="manage-rename-cancel">取消</button></div>`
        : `${icon('restaurant', 16)}<div class="lbl"><span class="nm">${esc(c)}</span><span class="ct pixel-font">${n} 个美食</span></div>
          ${confirming ? `<div class="ops"><button type="button" class="sm pixel-btn bg-pink" data-act="manage-confirm-del" data-c="${esc(c)}">确认删除</button><button type="button" class="sm pixel-btn bg-warm" data-act="manage-cancel-del">取消</button></div>`
          : `<div class="ops"><button type="button" class="mini-icon-btn pixel-btn bg-warm" data-act="manage-rename" data-c="${esc(c)}" aria-label="重命名${esc(c)}">${icon('edit', 15)}</button>
          <button type="button" class="mini-icon-btn pixel-btn bg-warm text-pink" data-act="manage-del" data-c="${esc(c)}" aria-label="删除${esc(c)}" ${c === '其他' ? 'disabled' : ''}>${icon('delete', 16)}</button></div>`}`}
      </div>`;
    }).join('');
    return `<div class="mask" data-act="manage-close"><div class="modal pixel-card" data-stop="1" style="display:flex;flex-direction:column;max-height:82vh">
      <h3 class="pixel-title">管理菜系</h3>
      <div class="seg-2" style="margin-bottom:12px"><input class="input" style="flex:1;min-width:0" type="text" data-model="manageInput" value="${esc(S.manageInput)}" placeholder="输入新菜系名称..." data-enter="manage-add">
      <button type="button" class="pixel-btn bg-pink" style="flex-shrink:0;padding:0 12px" data-act="manage-add">添加</button></div>
      ${S.manageErr ? `<p class="err">${esc(S.manageErr)}</p>` : ''}
      <div class="manage-list">${rows || '<p class="manage-empty pixel-font">还没有菜系，先添加一个吧</p>'}</div>
      ${S.manageConfirm ? `<p class="manage-note">删除「${esc(S.manageConfirm)}」后，该菜系下的美食将归入「其他」。</p>` : ''}
      <div class="manage-foot"><button type="button" class="sq-btn pixel-btn bg-warm" data-act="manage-close">${icon('close', 20)}</button></div>
    </div></div>`;
  }

  // ---------- 封面 ----------
  function coverHTML() {
    const parts = [];
    for (let i = 0; i < 28; i++) {
      const kind = i % 4 === 0 ? 'star' : i % 7 === 0 ? 'heart' : 'box';
      const color = pick(['#F6C86E', '#DE7A86', '#9DB8D9', '#A8CFA8', '#E8A0B4', '#D9A33C']);
      const size = kind === 'box' ? 6 + Math.random() * 6 : 11 + Math.random() * 8;
      const inner = kind === 'box' ? `<span class="box" style="width:${size}px;height:${size}px;background:${color}"></span>` : pixIcon(kind, size);
      parts.push(`<span class="particle" style="left:${(0.5 + Math.random() * 99).toFixed(2)}%;top:${(0.5 + Math.random() * 99).toFixed(2)}%;animation-delay:${(Math.random() * 2.2).toFixed(2)}s;animation-duration:${(2.4 + Math.random() * 2.2).toFixed(2)}s">${inner}</span>`);
    }
    return `<div class="cover" data-act="cover-enter">
      <div class="particles">${parts.join('')}</div>
      <div class="text"><p class="title pixel-title">今天吃什mo</p><p class="sub">望江吃啥子 · 让仔仔和璇璇帮你拿主意</p></div>
      <div class="scene pixel-card">${coverScene()}</div>
      <div class="pair">
        <div class="person"><span data-sprite="male" data-action="wave" data-scale="5"></span><span class="shadow"></span><span class="nm">仔仔</span></div>
        <div class="heart">${pixIcon('heart', 34)}</div>
        <div class="person"><span data-sprite="female" data-action="dance" data-action-delay="0.15" data-scale="5"></span><span class="shadow"></span><span class="nm">璇璇</span></div>
      </div>
      <button type="button" class="cover-enter pixel-btn bg-pink" data-act="cover-enter">${icon('restaurant', 17)}开始干饭</button>
    </div>`;
  }
  function coverScene() {
    const r = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
    return `<svg viewBox="0 0 40 30" width="230" height="173" shape-rendering="crispEdges" aria-hidden="true">
      ${r(0, 26, 40, 1, '#AED39C')}${r(0, 27, 40, 3, '#CBE5B4')}${r(2, 26, 1, 1, '#7FAF84')}${r(12, 26, 1, 1, '#7FAF84')}${r(30, 26, 1, 1, '#7FAF84')}${r(36, 26, 1, 1, '#7FAF84')}
      ${r(2, 10, 10, 3, '#A8CFA8')}${r(3, 8, 8, 2, '#A8CFA8')}${r(1, 12, 12, 3, '#7FAF84')}${r(3, 14, 9, 2, '#A8CFA8')}${r(9, 11, 3, 4, '#6F9B73')}${r(5, 17, 5, 2, '#6F452E')}${r(6, 18, 3, 9, '#8A5A3C')}
      ${r(26, 8, 4, 1, '#8A5A3C')}${r(27, 9, 2, 4, '#9B6B4A')}${r(22, 11, 4, 1, '#E8898F')}${r(20, 12, 8, 1, '#E8898F')}${r(18, 13, 12, 1, '#E8898F')}${r(17, 14, 14, 1, '#D56E7C')}
      ${r(19, 15, 10, 12, '#FFF9F4')}${r(19, 26, 10, 1, '#F2E4D8')}${r(21, 21, 3, 6, '#9B6B4A')}${r(23, 23, 1, 1, '#F6C86E')}
      <g class="scene-girl">${r(25, 17, 4, 3, '#6E5F52')}${r(26, 18, 2, 1, '#F8DBBF')}${r(26, 19, 2, 1, '#D97E96')}</g>
      ${r(34, 24, 2, 2, '#F6C86E')}${r(35, 26, 1, 1, '#6FA87B')}${r(37, 25, 2, 2, '#F2A3B8')}${r(38, 26, 1, 1, '#6FA87B')}
      <g class="scene-cloud-a">${r(27, 1, 3, 1, '#FDF6EC')}${r(26, 2, 5, 1, '#FDF6EC')}${r(25, 3, 7, 1, '#F1E2D2')}</g>
      <g class="scene-cloud-b">${r(8, 2, 2, 1, '#FDF6EC')}${r(7, 3, 4, 1, '#FDF6EC')}${r(6, 4, 6, 1, '#F1E2D2')}</g>
      <g class="scene-sun">${r(33, 2, 1, 1, '#F6C86E')}${r(37, 2, 1, 1, '#F6C86E')}${r(34, 3, 3, 3, '#F6C86E')}${r(33, 6, 1, 1, '#F6C86E')}${r(37, 6, 1, 1, '#F6C86E')}</g>
      <g class="scene-smoke">${r(27, 6, 1, 1, '#EDDCC9')}${r(27, 4, 1, 1, '#EDDCC9')}</g>
    </svg>`;
  }

  // ---------- 精灵挂载 ----------
  function mountSprites(root) {
    root.querySelectorAll('[data-sprite]').forEach((el) => {
      if (el.dataset.mounted) return;
      const who = el.dataset.sprite;
      new PixelSprite(el, who, { scale: Number(el.dataset.scale) || 3, action: el.dataset.action || 'bob', delay: Number(el.dataset.actionDelay) || 0 });
      el.dataset.mounted = '1';
    });
  }

  // ---------- 交互 ----------
  function toast(msg) {
    document.querySelectorAll('.toast').forEach((t) => t.remove());
    const el = document.createElement('div'); el.className = 'toast'; el.textContent = msg; document.body.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 260); }, 1800);
  }
  let lastSpeak = 0, chatterTimer = null;
  function say(who, opts) {
    const auto = opts && opts.auto;
    S.chatter = { who, action: pick(ACTIONS), text: pick(CHATTER), key: Date.now() };
    if (!auto) { const now = Date.now(); if (now - lastSpeak >= 600) { lastSpeak = now; Sfx.play('speak', { volume: -18 }); } }
    updateChatter();
    clearTimeout(chatterTimer); chatterTimer = setTimeout(() => { S.chatter = null; updateChatter(); }, 1600);
  }
  function updateChatter() {
    ['male', 'female'].forEach((who) => {
      const b = document.getElementById('bubble-' + who); if (!b) return;
      const ch = S.chatter && S.chatter.who === who ? S.chatter : null;
      const side = who === 'male' ? 'left' : 'right';
      b.innerHTML = ch ? `<span class="bubble ${side}">${esc(ch.text)}</span>` : '';
      const host = b.parentElement.querySelector('[data-sprite]'); const cv = host && host.querySelector('canvas');
      if (cv && cv.__sprite) cv.__sprite.setAction(ch ? ch.action : 'bob');
    });
  }
  function randomPick() {
    const pool = applyFilters(visibleFoods(), S.fType, S.fCuisine, S.fPrice, '');
    if (!pool.length) { toast('筛完后没有可选的美食啦'); say(pick(['male', 'female'])); return; }
    const fresh = pool.filter((f) => !S.recent.includes(f.id));
    const f = pick(fresh.length ? fresh : pool);
    S.recent = [...S.recent, f.id].slice(-5);
    S.detail = f; Sfx.play('success'); say(pick(['male', 'female']), { auto: true });
    renderOverlays();
  }
  function spin() {
    const sel = S.candidates.map((id) => findFood(id)).filter((f) => f && !S.deleted.has(f.id));
    if (S.spinning || sel.length < 2) return;
    S.spinning = true; S.detail = null; renderOverlays(); Sfx.play('tick');
    const k = Math.floor(Math.random() * sel.length), seg = 360 / sel.length;
    const target = S.wheelRot + 360 * 5 + ((360 - (k * seg + seg / 2)) - (S.wheelRot % 360) + 360) % 360;
    const wheel = $('#wheel'), area = $('#wheel-area'), btn = $('.spin-btn');
    if (area) area.className = 'wheel-box spinning';
    if (btn) { btn.disabled = true; btn.innerHTML = `${icon('play_arrow', 16)}转动中…`; }
    requestAnimationFrame(() => { wheel.classList.add('spin'); wheel.style.transform = `rotate(${target}deg)`; });
    S.wheelRot = target;
    setTimeout(() => {
      S.spinning = false; S.detail = sel[k]; Sfx.play('success'); say(pick(['male', 'female']), { auto: true });
      if (area) area.className = 'wheel-box ready';
      if (btn) { btn.disabled = false; btn.innerHTML = `${icon('play_arrow', 16)}开始转动`; }
      const w = $('#wheel'); if (w) { w.classList.remove('spin'); w.style.transform = `rotate(${target % 360}deg)`; S.wheelRot = target % 360; }
      renderOverlays();
    }, 2600);
  }
  function swapResult() {
    const cur = S.detail; if (!cur) return;
    const pool = applyFilters(visibleFoods(), S.fType, S.fCuisine, S.fPrice, S.tab === 'list' ? S.q : '').filter((f) => f.id !== cur.id);
    if (!pool.length) return;
    S.detail = pick(pool); Sfx.play('pop'); renderOverlays();
  }
  function deleteFood(f) {
    if (baseIds.has(f.id)) S.deleted.add(f.id); else S.userFoods = S.userFoods.filter((x) => x.id !== f.id);
    S.selected.delete(f.id); persist(); Sfx.play('boing', { soft: true });
  }
  function restoreFood(id) { S.deleted.delete(id); persist(); }
  function saveEdit(id, data) {
    const food = Object.assign({}, data, { isCanteen: data.type === 'canteen', priceRange: priceRange(data.avgPrice || 0) });
    if (baseIds.has(id)) { S.edited[id] = Object.assign({}, S.edited[id], { name: food.name, location: food.location, avgPrice: food.avgPrice, cuisine: food.cuisine }); }
    else S.userFoods = S.userFoods.map((f) => f.id === id ? Object.assign({}, f, food) : f);
    persist();
  }
  function removeCuisine(c) {
    const list = visibleFoods();
    const affected = list.filter((f) => f.cuisine === c);
    affected.forEach((f) => saveEdit(f.id, Object.assign({}, f, { cuisine: '其他' })));
    if (BASE_CUISINES.includes(c)) { if (!S.hiddenCuisines.includes(c)) S.hiddenCuisines = [...S.hiddenCuisines, c]; }
    else S.customCuisines = S.customCuisines.filter((x) => x !== c);
    if (!S.customCuisines.includes('其他') && !BASE_CUISINES.includes('其他')) S.customCuisines = [...S.customCuisines, '其他'];
    if (S.lCuisine === c) S.lCuisine = 'all'; if (S.fCuisine === c) S.fCuisine = 'all';
    persist();
  }
  function renameCuisine(oldN, newN) {
    visibleFoods().filter((f) => f.cuisine === oldN).forEach((f) => saveEdit(f.id, Object.assign({}, f, { cuisine: newN })));
    if (BASE_CUISINES.includes(oldN)) { if (!S.hiddenCuisines.includes(oldN)) S.hiddenCuisines = [...S.hiddenCuisines, oldN]; }
    else S.customCuisines = S.customCuisines.filter((x) => x !== oldN);
    if (!S.customCuisines.includes(newN) && !BASE_CUISINES.includes(newN)) S.customCuisines = [...S.customCuisines, newN];
    if (S.lCuisine === oldN) S.lCuisine = newN; if (S.fCuisine === oldN) S.fCuisine = newN;
    if (S.add.cuisine === oldN) S.add.cuisine = newN;
    persist();
  }

  // 左滑
  function bindRows() {
    document.querySelectorAll('.row-main').forEach((el) => {
      let startX = 0, base = 0, cur = 0, dragging = false, moved = false, pid = null;
      el.addEventListener('pointerdown', (e) => {
        if (S.multi) return;
        // 收起其它已展开的行
        if (S.openRow && S.openRow !== el.dataset.id) {
          S.openRow = null;
          document.querySelectorAll('.row-main').forEach((r) => { if (r !== el) r.style.transform = 'translateX(0)'; });
        }
        startX = e.clientX; base = S.openRow === el.dataset.id ? -112 : 0; cur = base; dragging = true; moved = false; pid = e.pointerId;
        el.classList.add('dragging'); try { el.setPointerCapture(pid); } catch (err) {}
      });
      el.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX; if (Math.abs(dx) > 6) moved = true;
        cur = Math.max(-112, Math.min(0, base + dx)); el.style.transform = `translateX(${cur}px)`;
      });
      const end = () => {
        if (!dragging) return; dragging = false; el.classList.remove('dragging');
        S.openRow = cur <= -44 ? el.dataset.id : null; el.style.transform = `translateX(${S.openRow === el.dataset.id ? -112 : 0}px)`;
        el.dataset.moved = moved ? '1' : '';
      };
      el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
      // 轻点：多选模式下切换勾选，否则打开详情
      el.addEventListener('click', () => {
        if (el.dataset.moved) { el.dataset.moved = ''; return; }
        const f = findFood(el.dataset.id); if (!f) return;
        if (S.multi) { if (S.selected.has(f.id)) S.selected.delete(f.id); else S.selected.add(f.id); Sfx.play('tick'); render(); return; }
        if (S.openRow === f.id) { S.openRow = null; el.style.transform = 'translateX(0)'; return; }
        S.detail = f; Sfx.play('pop'); renderOverlays();
      });
    });
  }

  // ---------- 事件委托 ----------
  document.addEventListener('pointerdown', (e) => { Sfx.unlock(); if (!e.target.closest || !e.target.closest('[data-row]')) { if (S.openRow) { S.openRow = null; document.querySelectorAll('.row-main').forEach((r) => r.style.transform = 'translateX(0)'); } } }, true);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.dataset && e.target.dataset.enter === 'manage-add') { e.preventDefault(); actions['manage-add'](); }
    if (e.key === 'Enter' && e.target.dataset && e.target.dataset.enter === 'rename') { e.preventDefault(); actions['manage-rename-save']({ dataset: { c: S.manageRenaming } }); }
  });
  document.addEventListener('input', (e) => {
    const m = e.target.dataset.model; if (!m) return;
    const v = e.target.value;
    if (m === 'q') { S.q = v; const body = $('#list-body'); if (body) body.innerHTML = listBodyHTML(applyFilters(visibleFoods(), S.lType, S.lCuisine, S.lPrice, S.q)); const c = $('#list-count'); if (c) c.textContent = applyFilters(visibleFoods(), S.lType, S.lCuisine, S.lPrice, S.q).length; return; }
    if (m === 'manageInput') { S.manageInput = v; S.manageErr = ''; return; }
    if (m === 'manageRenameVal') { S.manageRenameVal = v; return; }
    const [a, b] = m.split('.'); S[a][b] = v;
    if (a === 'add') S.addErr = '', S.addOk = false;
  });
  document.addEventListener('change', (e) => {
    if (e.target.id !== 'import-file' || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0], reader = new FileReader();
    reader.onload = () => {
      try {
        const d = JSON.parse(reader.result);
        if (!d || typeof d !== 'object') throw new Error('bad');
        const ids = new Set(allFoods().map((f) => f.id));
        let added = 0;
        (Array.isArray(d.userFoods) ? d.userFoods : []).forEach((f) => { if (f && f.name && f.location && !ids.has(f.id)) { S.userFoods.push(Object.assign({}, f, { id: f.id || uid() })); added++; } });
        (Array.isArray(d.deleted) ? d.deleted : []).forEach((id) => S.deleted.add(id));
        S.edited = Object.assign({}, S.edited, d.edited || {});
        S.customCuisines = [...new Set([...S.customCuisines, ...(Array.isArray(d.customCuisines) ? d.customCuisines : [])])];
        S.hiddenCuisines = [...new Set([...S.hiddenCuisines, ...(Array.isArray(d.hiddenCuisines) ? d.hiddenCuisines : [])])];
        persist(); render(); toast(`导入成功，新增${added}道菜`);
      } catch (err) { toast('导入失败：文件格式不对'); }
    };
    reader.readAsText(file); e.target.value = '';
  });

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    // 遮罩：只有点在遮罩本身（而非弹窗内部）才触发关闭
    if (el.classList.contains('mask') && e.target !== el) return;
    const fn = actions[el.dataset.act]; if (fn) fn(el, e);
  });

  const actions = {
    'cover-enter': () => {
      if (!S.cover) return;
      S.cover = false; Sfx.play('jingle'); render();
      // 封面层挂在body下，主页面重绘后要把它淡出并移除
      const c = document.querySelector('.cover');
      if (c) { c.style.pointerEvents = 'none'; c.style.transition = 'opacity .25s ease-in'; c.style.opacity = '0'; setTimeout(() => c.remove(), 260); }
    },
    nav: (el) => { S.tab = el.dataset.tab; S.openRow = null; S.detail = null; S.editing = null; S.manageOpen = false; Sfx.play('tick'); render(); },
    'sound-toggle': () => { S.sound = !S.sound; Sfx.enabled = S.sound; Sfx.play('pop'); render(); },
    chef: (el) => say(el.dataset.who),
    mode: (el) => { S.mode = el.dataset.mode; S.detail = null; Sfx.play('tick'); render(); },
    'filter-toggle': () => { S.filterOpen = !S.filterOpen; render(); },
    ftype: (el) => { S.fType = el.dataset.v; render(); },
    fcuisine: (el) => { S.fCuisine = el.dataset.v; render(); },
    fprice: (el) => { S.fPrice = el.dataset.v; render(); },
    'random-btn': randomPick,
    'result-close': () => { S.detail = null; renderOverlays(); },
    'result-swap': swapResult,
    cand: (el) => { const id = el.dataset.id; if (S.candidates.includes(id)) S.candidates = S.candidates.filter((x) => x !== id); else if (S.candidates.length < 8) S.candidates = [...S.candidates, id]; Sfx.play('pop'); render(); },
    spin: () => spin(),
    ltype: (el) => { S.lType = el.dataset.v; render(); },
    lcuisine: (el) => { S.lCuisine = el.dataset.v; render(); },
    lprice: (el) => { S.lPrice = el.dataset.v; render(); },
    'manage-open': () => { S.manageOpen = true; S.manageInput = ''; S.manageErr = ''; S.manageConfirm = null; S.manageRenaming = null; renderOverlays(); },
    'manage-close': () => { S.manageOpen = false; render(); },
    'manage-add': () => {
      const n = S.manageInput.trim();
      if (!n) { S.manageErr = '请输入菜系名称'; return renderOverlays(); }
      if (cuisines().includes(n)) { S.manageErr = '该菜系已存在'; return renderOverlays(); }
      S.customCuisines = [...S.customCuisines, n]; S.manageInput = ''; S.manageErr = ''; persist(); Sfx.play('pop'); renderOverlays();
    },
    'manage-del': (el) => { S.manageConfirm = el.dataset.c; S.manageRenaming = null; renderOverlays(); },
    'manage-cancel-del': () => { S.manageConfirm = null; renderOverlays(); },
    'manage-confirm-del': (el) => { removeCuisine(el.dataset.c); S.manageConfirm = null; Sfx.play('boing', { soft: true }); renderOverlays(); },
    'manage-rename': (el) => { S.manageRenaming = el.dataset.c; S.manageRenameVal = el.dataset.c; S.manageConfirm = null; S.manageErr = ''; renderOverlays(); const i = document.querySelector('[data-model="manageRenameVal"]'); if (i) { i.focus(); i.select(); i.dataset.enter = 'rename'; } },
    'manage-rename-cancel': () => { S.manageRenaming = null; S.manageErr = ''; renderOverlays(); },
    'manage-rename-save': (el) => {
      const old = S.manageRenaming, n = S.manageRenameVal.trim();
      if (!n) { S.manageErr = '请输入新名称'; return renderOverlays(); }
      if (n === old) { S.manageRenaming = null; return renderOverlays(); }
      if (cuisines().some((c) => c !== old && c === n)) { S.manageErr = '该菜系已存在'; return renderOverlays(); }
      renameCuisine(old, n); S.manageRenaming = null; S.manageErr = ''; Sfx.play('chime'); renderOverlays();
    },
    'multi-toggle': () => { S.multi = !S.multi; S.selected = new Set(); S.openRow = null; render(); },
    'multi-all': () => { const ids = applyFilters(visibleFoods(), S.lType, S.lCuisine, S.lPrice, S.q).map((f) => f.id); const all = ids.every((id) => S.selected.has(id)); S.selected = all ? new Set() : new Set(ids); render(); },
    'multi-delete': () => { [...S.selected].forEach((id) => { const f = findFood(id); if (f) deleteFood(f); }); S.selected = new Set(); S.multi = false; Sfx.play('boing'); toast('已删除，可在清单里重新添加'); render(); },
    'row-check': (el) => { const id = el.dataset.id; if (S.selected.has(id)) S.selected.delete(id); else S.selected.add(id); Sfx.play('tick'); render(); },
    'row-edit': (el) => { const f = findFood(el.dataset.id); if (!f) return; S.openRow = null; S.editing = Object.assign({}, f, { id: f.id, avgPrice: String(f.avgPrice || '') }, { saying: null }); renderOverlays(); },
    'row-del': (el) => { const f = findFood(el.dataset.id); if (!f) return; deleteFood(f); S.openRow = null; toast(`已移除「${f.name}」`); render(); },
    'edit-close': () => { S.editing = null; renderOverlays(); },
    'edit-type': (el) => { S.editing.type = el.dataset.v; renderOverlays(); },
    'edit-cuisine': (el) => { S.editing.cuisine = el.dataset.v; renderOverlays(); },
    'edit-cancel': () => { S.editing.saying = { who: 'male', text: '不改啦～' }; renderOverlays(); setTimeout(() => { S.editing = null; renderOverlays(); }, 900); },
    'edit-confirm': () => {
      const e = S.editing, name = e.name.trim(), loc = e.location.trim(), price = parseFloat(e.avgPrice);
      if (!name || !loc || isNaN(price) || price <= 0) { S.editing.saying = { who: 'male', text: '信息要填完整哦～' }; renderOverlays(); setTimeout(() => { if (S.editing) { S.editing.saying = null; renderOverlays(); } }, 1400); return; }
      if (!e.cuisine || !e.cuisine.trim()) { S.editing.saying = { who: 'male', text: '记得选一个菜系哦～' }; renderOverlays(); setTimeout(() => { if (S.editing) { S.editing.saying = null; renderOverlays(); } }, 1400); return; }
      saveEdit(e.id, { name, location: loc, avgPrice: Math.round(price * 10) / 10, cuisine: e.cuisine.trim(), type: e.type });
      S.editing.saying = { who: 'female', text: '改好啦！' }; Sfx.play('success'); renderOverlays();
      setTimeout(() => { S.editing.closing = true; renderOverlays(); }, 700); setTimeout(() => { S.editing = null; renderOverlays(); render(); }, 950);
    },
    'add-type': (el) => { S.add.type = el.dataset.v; render(); },
    'add-cuisine': (el) => { S.add.cuisine = el.dataset.v; S.addErr = ''; render(); },
    'add-submit': () => {
      const a = S.add, name = a.name.trim();
      if (!name) { S.addErr = '请输入美食名称'; return render(); }
      if (!a.location.trim()) { S.addErr = '请输入位置描述'; return render(); }
      if (!a.cuisine.trim()) { S.addErr = '请选择菜系分类'; return render(); }
      const price = a.price ? parseFloat(a.price) : 0;
      S.userFoods = [{ id: uid(), name, type: a.type, cuisine: a.cuisine.trim(), location: a.location.trim(), avgPrice: price, description: a.desc.trim(), isCanteen: a.type === 'canteen' }, ...S.userFoods];
      S.deleted.delete(S.userFoods[0].id);
      persist(); Sfx.play('success');
      S.add = { name: '', type: 'outside', cuisine: '', location: '', price: '', desc: '' }; S.addErr = ''; S.addOk = true; render();
      setTimeout(() => { S.addOk = false; const p = document.querySelector('.form-ok'); if (p) p.remove(); }, 2000);
    },
    'backup-export': () => {
      const data = { app: 'wangjiang-what-to-eat', version: 1, exportedAt: new Date().toISOString(), userFoods: S.userFoods, deleted: [...S.deleted], edited: S.edited, customCuisines: S.customCuisines, hiddenCuisines: S.hiddenCuisines };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `望江吃啥子-备份-${new Date().toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast('已导出备份文件');
    },
    'backup-import': () => { const i = $('#import-file'); if (i) i.click(); }
  };

  // 自动闲聊
  (function autoChat() {
    setTimeout(() => { if (!S.cover && S.tab === 'home' && !S.detail) say(pick(['male', 'female']), { auto: true }); autoChat(); }, 5000 + Math.random() * 4000);
  })();

  // ---------- 启动 ----------
  render();
  if (S.cover) { document.body.insertAdjacentHTML('beforeend', coverHTML()); mountSprites(document.querySelector('.cover')); }
})();
