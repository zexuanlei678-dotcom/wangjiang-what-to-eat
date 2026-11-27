/* 内联像素风线性图标集（替代外链字体图标，离线可用） */
(function () {
  const P = {
    search: '<circle cx="11" cy="11" r="6"/><path d="M15.5 15.5L20 20"/>',
    tune: '<path d="M4 7h16M4 12h16M4 17h16"/><circle cx="9" cy="7" r="2" fill="currentColor"/><circle cx="15" cy="12" r="2" fill="currentColor"/><circle cx="8" cy="17" r="2" fill="currentColor"/>',
    shuffle: '<path d="M4 7h4l8 10h4M16 5l4 2-4 2M16 15l4 2-4 2"/>',
    casino: '<rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="9" cy="9" r="1.3" fill="currentColor"/><circle cx="15" cy="15" r="1.3" fill="currentColor"/><circle cx="15" cy="9" r="1.3" fill="currentColor"/><circle cx="9" cy="15" r="1.3" fill="currentColor"/>',
    spa: '<circle cx="12" cy="12" r="8"/><path d="M12 12L12 4M12 12L18.5 16M12 12L5.5 16"/>',
    play_arrow: '<path d="M8 5l11 7-11 7z" fill="currentColor" stroke="none"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    autorenew: '<path d="M19 12a7 7 0 0 1-12 5M5 12a7 7 0 0 1 12-5M17 3v4h-4M7 21v-4h4"/>',
    edit: '<path d="M4 20l4-1L19 8l-3-3L5 16l-1 4zM14 7l3 3"/>',
    delete: '<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 10v7M14 10v7"/>',
    check: '<path d="M5 12l5 5L20 7"/>',
    select_all: '<rect x="7" y="7" width="12" height="12" rx="1"/><path d="M4 5V4h1M9 4h2M15 4h2M4 9v2M4 15v2M20 9v2M20 15v2M4 19v1h1M9 20h2M15 20h2"/>',
    checklist: '<path d="M4 6l2 2 3-3M4 12l2 2 3-3M4 18l2 2 3-3M12 7h8M12 13h8M12 19h8"/>',
    restaurant: '<path d="M7 3v8M5 3v4a2 2 0 0 0 4 0V3M7 11v10M16 3c-2 0-3 3-3 6s1 4 3 4v8M16 3v18"/>',
    storefront: '<path d="M4 9l1-5h14l1 5M4 9v11h16V9M4 9c0 2 4 2 4 0 0 2 4 2 4 0 0 2 4 2 4 0 0 2 4 2 4 0M9 20v-6h6v6"/>',
    ramen_dining: '<path d="M3 11h18a9 9 0 0 1-18 0zM7 7c0-1 1-1 1-2M12 7c0-1 1-1 1-2M17 7c0-1 1-1 1-2M6 20h12"/>',
    location_on: '<path d="M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>',
    volume_up: '<path d="M4 10v4h3l4 3V7l-4 3H4zM15 9a4 4 0 0 1 0 6M17.5 6.5a8 8 0 0 1 0 11"/>',
    volume_off: '<path d="M4 10v4h3l4 3V7l-4 3H4zM15 9l5 6M20 9l-5 6"/>',
    add_circle_outline: '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    touch_app: '<circle cx="12" cy="12" r="3"/><path d="M12 3a9 9 0 0 1 9 9M12 3a9 9 0 0 0-9 9"/>',
    star: '<path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.4 9.4l6-.8z" fill="currentColor" stroke="none"/>',
    done_all: '<path d="M2 12l4 4 8-9M9 15l2 2 9-10"/>',
    search_off: '<circle cx="11" cy="11" r="6"/><path d="M15.5 15.5L20 20M4 4l16 16"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M4 19h16"/>',
    upload: '<path d="M12 19V8M7 13l5-5 5 5M4 4h16"/>',
    utensils: '<path d="M5 3v6a2 2 0 0 0 4 0V3M7 3v18M16 3c-2 0-3 2-3 5s1 4 3 4v9M16 3v18"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'
  };
  window.icon = function (name, size) {
    const p = P[name] || P.info;
    const s = size || 18;
    return '<svg class="ico" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  };
})();
