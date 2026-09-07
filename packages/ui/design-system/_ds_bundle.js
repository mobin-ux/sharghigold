/* @ds-bundle: {"format":4,"namespace":"ZarnamaGoldDesignSystem_e4dd01","components":[{"name":"ProductCard","sourcePath":"components/commerce/ProductCard.jsx"},{"name":"QuantityStepper","sourcePath":"components/commerce/QuantityStepper.jsx"},{"name":"Avatar","sourcePath":"components/data/Avatar.jsx"},{"name":"OrderStepper","sourcePath":"components/data/OrderStepper.jsx"},{"name":"StatTile","sourcePath":"components/data/StatTile.jsx"},{"name":"Tag","sourcePath":"components/data/Tag.jsx"},{"name":"WalletCard","sourcePath":"components/data/WalletCard.jsx"},{"name":"Alert","sourcePath":"components/feedback/Alert.jsx"},{"name":"Badge","sourcePath":"components/feedback/Badge.jsx"},{"name":"Modal","sourcePath":"components/feedback/Modal.jsx"},{"name":"Skeleton","sourcePath":"components/feedback/Skeleton.jsx"},{"name":"Spinner","sourcePath":"components/feedback/Spinner.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"ToastViewport","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"IconButton","sourcePath":"components/forms/IconButton.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"OtpInput","sourcePath":"components/forms/OtpInput.jsx"},{"name":"PriceInput","sourcePath":"components/forms/PriceInput.jsx"},{"name":"RadioGroup","sourcePath":"components/forms/RadioGroup.jsx"},{"name":"SearchField","sourcePath":"components/forms/SearchField.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Breadcrumb","sourcePath":"components/navigation/Breadcrumb.jsx"},{"name":"Pagination","sourcePath":"components/navigation/Pagination.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"TopBar","sourcePath":"components/navigation/TopBar.jsx"},{"name":"PriceChange","sourcePath":"components/pricing/PriceChange.jsx"},{"name":"PriceLockCountdown","sourcePath":"components/pricing/PriceLockCountdown.jsx"},{"name":"PriceTable","sourcePath":"components/pricing/PriceTable.jsx"},{"name":"PriceTicker","sourcePath":"components/pricing/PriceTicker.jsx"}],"sourceHashes":{"components/commerce/ProductCard.jsx":"2a1d80844632","components/commerce/QuantityStepper.jsx":"8a3049f7c6ab","components/data/Avatar.jsx":"495049dce061","components/data/OrderStepper.jsx":"53607c4c82b7","components/data/StatTile.jsx":"624cccdb3728","components/data/Tag.jsx":"d7164a9edc5c","components/data/WalletCard.jsx":"4b0fa50b0e08","components/feedback/Alert.jsx":"fe9e345f2c89","components/feedback/Badge.jsx":"0f034c67a1d1","components/feedback/Modal.jsx":"ce0aff1e7dbf","components/feedback/Skeleton.jsx":"35d50722d208","components/feedback/Spinner.jsx":"2b7f9301ecde","components/feedback/Toast.jsx":"13d9281d9bb7","components/feedback/Tooltip.jsx":"4662c4dda9d6","components/forms/Button.jsx":"dee4c940d762","components/forms/Checkbox.jsx":"24e9b7ad1a98","components/forms/IconButton.jsx":"ef07c619415d","components/forms/Input.jsx":"3ab51eab8345","components/forms/OtpInput.jsx":"80d5838cbb8f","components/forms/PriceInput.jsx":"3d11892d6a7c","components/forms/RadioGroup.jsx":"e98d3e262c31","components/forms/SearchField.jsx":"8a8eda585be1","components/forms/Select.jsx":"00fb163e16de","components/forms/Switch.jsx":"451540da5eec","components/navigation/Breadcrumb.jsx":"cc7797504184","components/navigation/Pagination.jsx":"27ea7dd0d7fa","components/navigation/Tabs.jsx":"c0f33ac0efd6","components/navigation/TopBar.jsx":"33e7216a0d82","components/pricing/PriceChange.jsx":"0bf25086438c","components/pricing/PriceLockCountdown.jsx":"e078cd5b59b6","components/pricing/PriceTable.jsx":"2b30d5a0bd56","components/pricing/PriceTicker.jsx":"a8cb12ba2bbe","components/utils/intl.js":"eead17cbc91b","ui_kits/marketplace/App.jsx":"bdf2a3e0cc1f","ui_kits/marketplace/data.js":"aa7277ad77dc"},"inlinedExternals":[],"unexposedExports":[{"name":"groupFa","sourcePath":"components/utils/intl.js"},{"name":"injectFieldCSS","sourcePath":"components/forms/Input.jsx"},{"name":"toFa","sourcePath":"components/utils/intl.js"},{"name":"toman","sourcePath":"components/utils/intl.js"}]} */

(() => {

const __ds_ns = (window.ZarnamaGoldDesignSystem_e4dd01 = window.ZarnamaGoldDesignSystem_e4dd01 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/data/Avatar.jsx
try { (() => {
const CSS = `
.zn-avatar{display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:var(--color-primary-subtle);color:var(--color-primary);font-family:var(--font-body);font-weight:var(--fw-semibold);overflow:hidden;flex:0 0 auto;user-select:none}
.zn-avatar img{width:100%;height:100%;object-fit:cover}
.zn-avatar--gold{background:var(--color-accent-subtle);color:var(--color-accent-active)}
`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-avatar-css")) {
    const s = document.createElement("style");
    s.id = "zn-avatar-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
const SIZES = {
  sm: 32,
  md: 40,
  lg: 56
};
function Avatar({
  name = "",
  src,
  size = "md",
  variant = "default"
}) {
  inject();
  const px = SIZES[size] || size;
  const initials = name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("");
  return /*#__PURE__*/React.createElement("span", {
    className: ["zn-avatar", variant === "gold" && "zn-avatar--gold"].filter(Boolean).join(" "),
    style: {
      width: px,
      height: px,
      fontSize: px * 0.4
    },
    "aria-label": name || undefined,
    role: "img"
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name
  }) : /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, initials));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/data/OrderStepper.jsx
try { (() => {
const CSS = `
.zn-steps{display:flex;align-items:flex-start;width:100%;font-family:var(--font-body)}
.zn-step{flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;position:relative;text-align:center}
.zn-step__dot{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--color-surface);border:var(--border-2) solid var(--color-border-strong);color:var(--color-text-muted);font-family:var(--font-price);font-weight:var(--fw-bold);z-index:1;transition:all var(--transition-base)}
.zn-step__dot svg{width:18px;height:18px}
.zn-step__label{font-size:var(--fs-caption);color:var(--color-text-muted);max-width:96px;line-height:1.4}
.zn-step__line{position:absolute;inset-block-start:17px;height:2.5px;background:var(--color-border);z-index:0;inset-inline-start:50%;width:100%}
.zn-step:last-child .zn-step__line{display:none}
.zn-step--done .zn-step__dot{background:var(--color-success);border-color:var(--color-success);color:#fff}
.zn-step--done .zn-step__line{background:var(--color-success)}
.zn-step--current .zn-step__dot{background:var(--color-accent);border-color:var(--color-accent);color:var(--color-text-on-accent);box-shadow:0 0 0 4px var(--color-accent-subtle)}
.zn-step--current .zn-step__label{color:var(--color-text-primary);font-weight:var(--fw-semibold)}
`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-steps-css")) {
    const s = document.createElement("style");
    s.id = "zn-steps-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
const Check = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "3",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M20 6 9 17l-5-5"
}));
const FA = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const fa = v => String(v).replace(/[0-9]/g, d => FA[+d]);
function OrderStepper({
  steps = [],
  current = 0
}) {
  inject();
  return /*#__PURE__*/React.createElement("ol", {
    className: "zn-steps",
    "aria-label": "\u0645\u0631\u0627\u062D\u0644 \u0633\u0641\u0627\u0631\u0634"
  }, steps.map((s, i) => {
    const state = i < current ? "done" : i === current ? "current" : "todo";
    return /*#__PURE__*/React.createElement("li", {
      key: i,
      className: ["zn-step", state !== "todo" && `zn-step--${state}`].filter(Boolean).join(" "),
      "aria-current": state === "current" ? "step" : undefined
    }, /*#__PURE__*/React.createElement("span", {
      className: "zn-step__line",
      "aria-hidden": "true"
    }), /*#__PURE__*/React.createElement("span", {
      className: "zn-step__dot"
    }, i < current ? /*#__PURE__*/React.createElement(Check, null) : fa(i + 1)), /*#__PURE__*/React.createElement("span", {
      className: "zn-step__label"
    }, typeof s === "object" ? s.label : s));
  }));
}
Object.assign(__ds_scope, { OrderStepper });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/OrderStepper.jsx", error: String((e && e.message) || e) }); }

// components/data/Tag.jsx
try { (() => {
const CSS = `
.zn-tag{display:inline-flex;align-items:center;gap:6px;font-family:var(--font-body);font-size:var(--fs-body-sm);font-weight:var(--fw-medium);color:var(--color-text-secondary);background:var(--color-surface-sunken);border:var(--border-1) solid var(--color-border);border-radius:var(--radius-pill);padding:5px 12px}
.zn-tag--selected{background:var(--color-primary-subtle);border-color:var(--color-primary-border);color:var(--color-primary)}
.zn-tag__x{display:flex;background:none;border:none;color:inherit;cursor:pointer;opacity:.7;padding:0;margin-inline-start:-2px}
.zn-tag__x:hover{opacity:1}
.zn-tag__x svg{width:14px;height:14px}
.zn-tag--interactive{cursor:pointer;transition:all var(--transition-base)}
.zn-tag--interactive:hover{border-color:var(--color-accent-border)}
`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-tag-css")) {
    const s = document.createElement("style");
    s.id = "zn-tag-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
const X = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M18 6 6 18M6 6l12 12"
}));
function Tag({
  children,
  selected = false,
  onRemove,
  onClick
}) {
  inject();
  const interactive = !!onClick;
  return /*#__PURE__*/React.createElement("span", {
    className: ["zn-tag", selected && "zn-tag--selected", interactive && "zn-tag--interactive"].filter(Boolean).join(" "),
    onClick: onClick,
    role: interactive ? "button" : undefined,
    tabIndex: interactive ? 0 : undefined
  }, children, onRemove && /*#__PURE__*/React.createElement("button", {
    className: "zn-tag__x",
    "aria-label": "\u062D\u0630\u0641 \u0641\u06CC\u0644\u062A\u0631",
    onClick: e => {
      e.stopPropagation();
      onRemove();
    }
  }, /*#__PURE__*/React.createElement(X, null)));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Alert.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.zn-alert{display:flex;gap:var(--space-3);padding:var(--space-4);border-radius:var(--radius-md);font-family:var(--font-body);font-size:var(--fs-body-sm);line-height:var(--lh-normal);border:var(--border-1) solid transparent}
.zn-alert__icon{flex:0 0 auto;margin-top:1px}
.zn-alert__icon svg{width:20px;height:20px}
.zn-alert__body{flex:1;min-width:0}
.zn-alert__title{font-weight:var(--fw-bold);margin-bottom:2px;color:var(--color-text-primary)}
.zn-alert__msg{color:var(--color-text-secondary)}
.zn-alert--info{background:var(--color-info-subtle);border-color:var(--color-info)}
.zn-alert--info .zn-alert__icon{color:var(--color-info-hover)}
.zn-alert--success{background:var(--color-success-subtle);border-color:var(--color-success)}
.zn-alert--success .zn-alert__icon{color:var(--color-success-hover)}
.zn-alert--warning{background:var(--color-warning-subtle);border-color:var(--color-warning)}
.zn-alert--warning .zn-alert__icon{color:var(--color-warning-hover)}
.zn-alert--danger{background:var(--color-danger-subtle);border-color:var(--color-danger)}
.zn-alert--danger .zn-alert__icon{color:var(--color-danger-hover)}
`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-alert-css")) {
    const s = document.createElement("style");
    s.id = "zn-alert-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
const ICONS = {
  info: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 16v-4M12 8h.01"
  })),
  success: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M21.8 10A10 10 0 1 1 17 3.34"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m9 11 3 3L22 4"
  })),
  warning: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 9v4M12 17h.01"
  })),
  danger: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m15 9-6 6M9 9l6 6"
  }))
};
function Alert({
  variant = "info",
  title,
  children,
  icon,
  ...rest
}) {
  inject();
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `zn-alert zn-alert--${variant}`,
    role: variant === "danger" ? "alert" : "status"
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "zn-alert__icon",
    "aria-hidden": "true"
  }, icon || ICONS[variant]), /*#__PURE__*/React.createElement("div", {
    className: "zn-alert__body"
  }, title && /*#__PURE__*/React.createElement("div", {
    className: "zn-alert__title"
  }, title), /*#__PURE__*/React.createElement("div", {
    className: "zn-alert__msg"
  }, children)));
}
Object.assign(__ds_scope, { Alert });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Alert.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.zn-badge{display:inline-flex;align-items:center;gap:6px;font-family:var(--font-body);font-size:var(--fs-caption);font-weight:var(--fw-semibold);line-height:1;padding:5px 10px;border-radius:var(--radius-pill);white-space:nowrap}
.zn-badge svg{width:13px;height:13px}
.zn-badge--neutral{background:var(--color-surface-sunken);color:var(--color-text-secondary)}
.zn-badge--primary{background:var(--color-primary-subtle);color:var(--color-primary)}
.zn-badge--gold{background:var(--color-accent-subtle);color:var(--color-accent-active)}
.zn-badge--success{background:var(--color-success-subtle);color:var(--color-success-hover)}
.zn-badge--danger{background:var(--color-danger-subtle);color:var(--color-danger-hover)}
.zn-badge--warning{background:var(--color-warning-subtle);color:var(--color-warning-hover)}
.zn-badge--info{background:var(--color-info-subtle);color:var(--color-info-hover)}
.zn-badge--solid-danger{background:var(--color-danger);color:#fff}
.zn-badge--solid-gold{background:var(--color-accent);color:var(--color-text-on-accent)}
.zn-badge--dot::before{content:"";width:7px;height:7px;border-radius:50%;background:currentColor}
`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-badge-css")) {
    const s = document.createElement("style");
    s.id = "zn-badge-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function Badge({
  children,
  variant = "neutral",
  dot = false,
  icon,
  ...rest
}) {
  inject();
  return /*#__PURE__*/React.createElement("span", _extends({
    className: ["zn-badge", `zn-badge--${variant}`, dot && "zn-badge--dot"].filter(Boolean).join(" ")
  }, rest), icon && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, icon), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Badge.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Skeleton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.zn-skel{display:block;background:linear-gradient(90deg,var(--color-surface-sunken) 25%,var(--color-border) 37%,var(--color-surface-sunken) 63%);background-size:400% 100%;animation:zn-shimmer 1.4s ease infinite;border-radius:var(--radius-sm)}
@keyframes zn-shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}
`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-skel-css")) {
    const s = document.createElement("style");
    s.id = "zn-skel-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function Skeleton({
  width = "100%",
  height = 16,
  radius,
  circle = false,
  style,
  ...rest
}) {
  inject();
  return /*#__PURE__*/React.createElement("span", _extends({
    className: "zn-skel",
    "aria-hidden": "true",
    style: {
      width,
      height: circle ? width : height,
      borderRadius: circle ? "50%" : radius || "var(--radius-sm)",
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Skeleton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Skeleton.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Spinner.jsx
try { (() => {
const CSS = `
.zn-spinner{display:inline-block;border-radius:50%;border-style:solid;border-color:var(--color-border);border-top-color:var(--color-accent);animation:zn-spin .7s linear infinite}
@keyframes zn-spin{to{transform:rotate(360deg)}}
`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-spinner-css")) {
    const s = document.createElement("style");
    s.id = "zn-spinner-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
const SIZES = {
  sm: 18,
  md: 28,
  lg: 40
};
function Spinner({
  size = "md",
  label = "در حال بارگذاری"
}) {
  inject();
  const px = SIZES[size] || size;
  return /*#__PURE__*/React.createElement("span", {
    className: "zn-spinner",
    role: "status",
    "aria-label": label,
    style: {
      width: px,
      height: px,
      borderWidth: Math.max(2, Math.round(px / 10))
    }
  });
}
Object.assign(__ds_scope, { Spinner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Spinner.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.zn-toastwrap{position:fixed;inset-block-end:var(--space-5);inset-inline-start:var(--space-5);display:flex;flex-direction:column;gap:var(--space-3);z-index:var(--z-toast)}
.zn-toast{display:flex;align-items:center;gap:var(--space-3);min-width:280px;max-width:400px;padding:var(--space-3) var(--space-4);border-radius:var(--radius-md);
  background:var(--color-surface-inverse);color:var(--color-text-inverse);box-shadow:var(--shadow-lg);font-family:var(--font-body);font-size:var(--fs-body-sm);
  animation:zn-toast-in var(--duration-base) var(--ease-emphasized)}
.zn-toast__icon{flex:0 0 auto;display:flex}.zn-toast__icon svg{width:20px;height:20px}
.zn-toast__msg{flex:1}
.zn-toast--success .zn-toast__icon{color:var(--color-success)}
.zn-toast--danger .zn-toast__icon{color:var(--color-danger)}
.zn-toast--info .zn-toast__icon{color:var(--color-accent)}
.zn-toast__close{background:none;border:none;color:inherit;opacity:.7;cursor:pointer;display:flex}
.zn-toast__close:hover{opacity:1}
@keyframes zn-toast-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-toast-css")) {
    const s = document.createElement("style");
    s.id = "zn-toast-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
const ICONS = {
  success: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M20 6 9 17l-5-5"
  })),
  danger: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m15 9-6 6M9 9l6 6"
  })),
  info: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 16v-4M12 8h.01"
  }))
};
const X = () => /*#__PURE__*/React.createElement("svg", {
  width: "16",
  height: "16",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.75",
  strokeLinecap: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M18 6 6 18M6 6l12 12"
}));
function Toast({
  variant = "info",
  children,
  onClose,
  ...rest
}) {
  inject();
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `zn-toast zn-toast--${variant}`,
    role: "status"
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "zn-toast__icon",
    "aria-hidden": "true"
  }, ICONS[variant]), /*#__PURE__*/React.createElement("span", {
    className: "zn-toast__msg"
  }, children), onClose && /*#__PURE__*/React.createElement("button", {
    className: "zn-toast__close",
    "aria-label": "\u0628\u0633\u062A\u0646",
    onClick: onClose
  }, /*#__PURE__*/React.createElement(X, null)));
}
function ToastViewport({
  children
}) {
  inject();
  return /*#__PURE__*/React.createElement("div", {
    className: "zn-toastwrap"
  }, children);
}
Object.assign(__ds_scope, { Toast, ToastViewport });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
const CSS = `
.zn-tt{position:relative;display:inline-flex}
.zn-tt__bubble{position:absolute;inset-block-end:calc(100% + 8px);inset-inline-start:50%;transform:translateX(50%) translateY(4px);
  background:var(--color-surface-inverse);color:var(--color-text-inverse);font-family:var(--font-body);font-size:var(--fs-caption);line-height:1.5;
  padding:6px 10px;border-radius:var(--radius-sm);white-space:nowrap;box-shadow:var(--shadow-md);opacity:0;pointer-events:none;
  transition:opacity var(--duration-fast) var(--ease-standard),transform var(--duration-fast) var(--ease-standard);z-index:var(--z-tooltip)}
.zn-tt:hover .zn-tt__bubble,.zn-tt:focus-within .zn-tt__bubble{opacity:1;transform:translateX(50%) translateY(0)}
.zn-tt__bubble::after{content:"";position:absolute;inset-block-start:100%;inset-inline-start:50%;transform:translateX(50%);border:5px solid transparent;border-top-color:var(--color-surface-inverse)}
`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-tt-css")) {
    const s = document.createElement("style");
    s.id = "zn-tt-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
let _n = 0;
function Tooltip({
  label,
  children
}) {
  inject();
  const id = React.useRef(`zn-tt-${++_n}`).current;
  return /*#__PURE__*/React.createElement("span", {
    className: "zn-tt"
  }, React.cloneElement(React.Children.only(children), {
    "aria-describedby": id
  }), /*#__PURE__*/React.createElement("span", {
    className: "zn-tt__bubble",
    role: "tooltip",
    id: id
  }, label));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.zn-btn{--_bg:var(--color-primary);--_bgh:var(--color-primary-hover);--_bga:var(--color-primary-active);--_fg:var(--color-text-on-primary);--_bd:transparent;
  display:inline-flex;align-items:center;justify-content:center;gap:var(--space-2);
  font-family:var(--font-body);font-weight:var(--fw-semibold);line-height:1;white-space:nowrap;
  border:var(--border-1) solid var(--_bd);border-radius:var(--radius-button);
  background:var(--_bg);color:var(--_fg);cursor:pointer;user-select:none;
  transition:background var(--transition-base),transform var(--duration-fast) var(--ease-standard),box-shadow var(--transition-base),color var(--transition-base);
  -webkit-tap-highlight-color:transparent}
.zn-btn:hover:not(:disabled){background:var(--_bgh)}
.zn-btn:active:not(:disabled){background:var(--_bga);transform:translateY(1px)}
.zn-btn:focus-visible{outline:none;box-shadow:var(--shadow-focus)}
.zn-btn:disabled{opacity:var(--opacity-disabled);cursor:not-allowed}
.zn-btn--gold{--_bg:var(--color-accent);--_bgh:var(--color-accent-hover);--_bga:var(--color-accent-active);--_fg:var(--color-text-on-accent)}
.zn-btn--secondary{--_bg:transparent;--_bgh:var(--color-primary-subtle);--_bga:var(--color-primary-subtle);--_fg:var(--color-primary);--_bd:var(--color-border-strong)}
.zn-btn--ghost{--_bg:transparent;--_bgh:var(--color-surface-sunken);--_bga:var(--color-surface-sunken);--_fg:var(--color-text-primary);--_bd:transparent}
.zn-btn--destructive{--_bg:var(--color-danger);--_bgh:var(--color-danger-hover);--_bga:var(--color-danger-hover);--_fg:#fff}
.zn-btn--sm{height:36px;padding:0 var(--space-4);font-size:var(--fs-body-sm)}
.zn-btn--md{height:44px;padding:0 var(--space-5);font-size:var(--fs-body)}
.zn-btn--lg{height:52px;padding:0 var(--space-6);font-size:var(--fs-body-lg)}
.zn-btn--block{width:100%}
.zn-btn__spin{width:1em;height:1em;border-radius:50%;border:2px solid currentColor;border-top-color:transparent;animation:zn-spin .7s linear infinite}
.zn-btn--loading{color:transparent!important;position:relative}
.zn-btn--loading .zn-btn__spin{position:absolute;color:var(--_fg)}
@keyframes zn-spin{to{transform:rotate(360deg)}}
`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-btn-css")) {
    const s = document.createElement("style");
    s.id = "zn-btn-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function Button({
  variant = "primary",
  size = "md",
  block = false,
  loading = false,
  disabled = false,
  startIcon,
  endIcon,
  children,
  type = "button",
  ...rest
}) {
  inject();
  const cls = ["zn-btn", `zn-btn--${variant}`, `zn-btn--${size}`, block && "zn-btn--block", loading && "zn-btn--loading"].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    className: cls,
    disabled: disabled || loading,
    "aria-busy": loading || undefined
  }, rest), loading && /*#__PURE__*/React.createElement("span", {
    className: "zn-btn__spin",
    "aria-hidden": "true"
  }), startIcon && /*#__PURE__*/React.createElement("span", {
    className: "zn-btn__icon",
    "aria-hidden": "true"
  }, startIcon), children && /*#__PURE__*/React.createElement("span", null, children), endIcon && /*#__PURE__*/React.createElement("span", {
    className: "zn-btn__icon",
    "aria-hidden": "true"
  }, endIcon));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Button.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.zn-check{display:inline-flex;align-items:flex-start;gap:var(--space-3);font-family:var(--font-body);font-size:var(--fs-body);color:var(--color-text-primary);cursor:pointer;line-height:1.4}
.zn-check--disabled{opacity:var(--opacity-disabled);cursor:not-allowed}
.zn-check input{position:absolute;opacity:0;width:0;height:0}
.zn-check__box{flex:0 0 auto;width:22px;height:22px;margin-top:2px;border-radius:var(--radius-xs);border:var(--border-2) solid var(--color-border-strong);
  background:var(--color-surface);display:flex;align-items:center;justify-content:center;color:transparent;
  transition:background var(--transition-base),border-color var(--transition-base),color var(--transition-base)}
.zn-check input:checked+.zn-check__box{background:var(--color-primary);border-color:var(--color-primary);color:#fff}
.zn-check input:indeterminate+.zn-check__box{background:var(--color-primary);border-color:var(--color-primary);color:#fff}
.zn-check input:focus-visible+.zn-check__box{box-shadow:var(--shadow-focus)}
.zn-check:hover input:not(:disabled):not(:checked)+.zn-check__box{border-color:var(--color-text-muted)}
.zn-check__box svg{width:15px;height:15px}
.zn-check__label small{display:block;color:var(--color-text-muted);font-size:var(--fs-caption);margin-top:2px}
`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-check-css")) {
    const s = document.createElement("style");
    s.id = "zn-check-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
const Tick = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "3",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M20 6 9 17l-5-5"
}));
const Dash = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "3",
  strokeLinecap: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M5 12h14"
}));
function Checkbox({
  label,
  description,
  checked,
  indeterminate = false,
  disabled = false,
  onChange,
  id,
  ...rest
}) {
  inject();
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return /*#__PURE__*/React.createElement("label", {
    className: ["zn-check", disabled && "zn-check--disabled"].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement("input", _extends({
    ref: ref,
    type: "checkbox",
    checked: checked,
    disabled: disabled,
    onChange: onChange,
    id: id
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "zn-check__box",
    "aria-hidden": "true"
  }, indeterminate ? /*#__PURE__*/React.createElement(Dash, null) : /*#__PURE__*/React.createElement(Tick, null)), label && /*#__PURE__*/React.createElement("span", {
    className: "zn-check__label"
  }, label, description && /*#__PURE__*/React.createElement("small", null, description)));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.zn-iconbtn{display:inline-flex;align-items:center;justify-content:center;border-radius:var(--radius-pill);
  background:transparent;color:var(--color-text-secondary);border:var(--border-1) solid transparent;cursor:pointer;
  transition:background var(--transition-base),color var(--transition-base),box-shadow var(--transition-base);-webkit-tap-highlight-color:transparent}
.zn-iconbtn:hover:not(:disabled){background:var(--color-surface-sunken);color:var(--color-text-primary)}
.zn-iconbtn:active:not(:disabled){transform:translateY(1px)}
.zn-iconbtn:focus-visible{outline:none;box-shadow:var(--shadow-focus)}
.zn-iconbtn:disabled{opacity:var(--opacity-disabled);cursor:not-allowed}
.zn-iconbtn--sm{width:36px;height:36px}
.zn-iconbtn--md{width:44px;height:44px}
.zn-iconbtn--lg{width:52px;height:52px}
.zn-iconbtn--solid{background:var(--color-primary);color:var(--color-text-on-primary)}
.zn-iconbtn--solid:hover:not(:disabled){background:var(--color-primary-hover);color:var(--color-text-on-primary)}
.zn-iconbtn--outline{border-color:var(--color-border-strong)}
`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-iconbtn-css")) {
    const s = document.createElement("style");
    s.id = "zn-iconbtn-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function IconButton({
  icon,
  label,
  variant = "ghost",
  size = "md",
  disabled = false,
  ...rest
}) {
  inject();
  const cls = ["zn-iconbtn", `zn-iconbtn--${size}`, variant !== "ghost" && `zn-iconbtn--${variant}`].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: cls,
    "aria-label": label,
    title: label,
    disabled: disabled
  }, rest), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      display: "inline-flex",
      width: "var(--icon-md)",
      height: "var(--icon-md)"
    }
  }, icon));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Modal.jsx
try { (() => {
const CSS = `
.zn-modal__scrim{position:fixed;inset:0;background:var(--color-overlay);display:flex;align-items:center;justify-content:center;padding:var(--space-4);z-index:var(--z-modal);animation:zn-fade var(--duration-base) var(--ease-standard)}
.zn-modal{background:var(--color-surface);border-radius:var(--radius-lg);box-shadow:var(--shadow-lg);width:100%;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;animation:zn-pop var(--duration-base) var(--ease-emphasized)}
.zn-modal--sm{max-width:420px}.zn-modal--md{max-width:560px}.zn-modal--lg{max-width:760px}
.zn-modal__head{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--space-4);padding:var(--space-5) var(--space-5) var(--space-3)}
.zn-modal__title{font-family:var(--font-display);font-size:var(--fs-h4);font-weight:var(--fw-bold);color:var(--color-text-primary)}
.zn-modal__body{padding:0 var(--space-5) var(--space-5);overflow:auto;color:var(--color-text-secondary);line-height:var(--lh-body)}
.zn-modal__foot{display:flex;gap:var(--space-3);justify-content:flex-start;padding:var(--space-4) var(--space-5);border-top:var(--border-1) solid var(--color-divider);background:var(--color-surface)}
@keyframes zn-fade{from{opacity:0}to{opacity:1}}
@keyframes zn-pop{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}
`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-modal-css")) {
    const s = document.createElement("style");
    s.id = "zn-modal-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
const Close = () => /*#__PURE__*/React.createElement("svg", {
  width: "20",
  height: "20",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.75",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M18 6 6 18M6 6l12 12"
}));
function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md"
}) {
  inject();
  React.useEffect(() => {
    if (!open) return;
    const h = e => e.key === "Escape" && onClose && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "zn-modal__scrim",
    onMouseDown: e => {
      if (e.target === e.currentTarget) onClose && onClose();
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: `zn-modal zn-modal--${size}`,
    role: "dialog",
    "aria-modal": "true",
    "aria-label": title
  }, /*#__PURE__*/React.createElement("div", {
    className: "zn-modal__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "zn-modal__title"
  }, title), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: /*#__PURE__*/React.createElement(Close, null),
    label: "\u0628\u0633\u062A\u0646",
    onClick: onClose,
    size: "sm"
  })), /*#__PURE__*/React.createElement("div", {
    className: "zn-modal__body"
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    className: "zn-modal__foot"
  }, footer)));
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Modal.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const FIELD_CSS = `
.zn-field{display:flex;flex-direction:column;gap:var(--space-2);font-family:var(--font-body)}
.zn-field__label{font-size:var(--fs-label);font-weight:var(--fw-semibold);color:var(--color-text-primary)}
.zn-field__req{color:var(--color-danger);margin-inline-start:2px}
.zn-field__opt{color:var(--color-text-muted);font-weight:var(--fw-regular);margin-inline-start:6px}
.zn-inputwrap{position:relative;display:flex;align-items:center}
.zn-input{width:100%;height:44px;padding:0 var(--space-4);font-family:var(--font-body);font-size:var(--fs-body);color:var(--color-text-primary);
  background:var(--color-surface);border:var(--border-1) solid var(--color-border-strong);border-radius:var(--radius-control);
  transition:border-color var(--transition-base),box-shadow var(--transition-base);outline:none}
.zn-input::placeholder{color:var(--color-text-muted)}
.zn-input:hover:not(:disabled):not([aria-invalid="true"]){border-color:var(--color-text-muted)}
.zn-input:focus{border-color:var(--color-accent);box-shadow:var(--shadow-focus)}
.zn-input:disabled{background:var(--color-surface-sunken);opacity:var(--opacity-disabled);cursor:not-allowed}
.zn-input[aria-invalid="true"]{border-color:var(--color-danger)}
.zn-input[aria-invalid="true"]:focus{box-shadow:0 0 0 3px var(--color-danger-subtle)}
.zn-input--sm{height:36px;font-size:var(--fs-body-sm)}
.zn-input--lg{height:52px;font-size:var(--fs-body-lg)}
.zn-input--hasstart{padding-inline-start:44px}
.zn-input--hasend{padding-inline-end:44px}
.zn-field__adorn{position:absolute;display:flex;align-items:center;justify-content:center;color:var(--color-text-muted);pointer-events:none;width:44px;height:100%}
.zn-field__adorn--start{inset-inline-start:0}
.zn-field__adorn--end{inset-inline-end:0}
.zn-field__msg{font-size:var(--fs-caption);line-height:var(--lh-normal);display:flex;align-items:center;gap:6px}
.zn-field__msg--help{color:var(--color-text-muted)}
.zn-field__msg--error{color:var(--color-danger)}
`;
function injectFieldCSS() {
  if (typeof document !== "undefined" && !document.getElementById("zn-field-css")) {
    const s = document.createElement("style");
    s.id = "zn-field-css";
    s.textContent = FIELD_CSS;
    document.head.appendChild(s);
  }
}
let _id = 0;
const uid = () => `zn-f${++_id}`;
function Input({
  label,
  optional = false,
  required = false,
  size = "md",
  helperText,
  error,
  startAdornment,
  endAdornment,
  id,
  className = "",
  ...rest
}) {
  injectFieldCSS();
  const fid = id || uid();
  const invalid = !!error;
  const cls = ["zn-input", size !== "md" && `zn-input--${size}`, startAdornment && "zn-input--hasstart", endAdornment && "zn-input--hasend", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("div", {
    className: "zn-field"
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "zn-field__label",
    htmlFor: fid
  }, label, required && /*#__PURE__*/React.createElement("span", {
    className: "zn-field__req"
  }, "*"), optional && /*#__PURE__*/React.createElement("span", {
    className: "zn-field__opt"
  }, "(\u0627\u062E\u062A\u06CC\u0627\u0631\u06CC)")), /*#__PURE__*/React.createElement("div", {
    className: "zn-inputwrap"
  }, startAdornment && /*#__PURE__*/React.createElement("span", {
    className: "zn-field__adorn zn-field__adorn--start"
  }, startAdornment), /*#__PURE__*/React.createElement("input", _extends({
    id: fid,
    className: cls,
    "aria-invalid": invalid || undefined,
    "aria-describedby": helperText || error ? `${fid}-msg` : undefined
  }, rest)), endAdornment && /*#__PURE__*/React.createElement("span", {
    className: "zn-field__adorn zn-field__adorn--end"
  }, endAdornment)), error ? /*#__PURE__*/React.createElement("span", {
    id: `${fid}-msg`,
    className: "zn-field__msg zn-field__msg--error",
    role: "alert"
  }, error) : helperText ? /*#__PURE__*/React.createElement("span", {
    id: `${fid}-msg`,
    className: "zn-field__msg zn-field__msg--help"
  }, helperText) : null);
}
Object.assign(__ds_scope, { injectFieldCSS, Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/RadioGroup.jsx
try { (() => {
const CSS = `
.zn-radiogroup{display:flex;flex-direction:column;gap:var(--space-3)}
.zn-radio{display:inline-flex;align-items:flex-start;gap:var(--space-3);font-family:var(--font-body);font-size:var(--fs-body);color:var(--color-text-primary);cursor:pointer;line-height:1.4}
.zn-radio--disabled{opacity:var(--opacity-disabled);cursor:not-allowed}
.zn-radio input{position:absolute;opacity:0;width:0;height:0}
.zn-radio__dot{flex:0 0 auto;width:22px;height:22px;margin-top:2px;border-radius:50%;border:var(--border-2) solid var(--color-border-strong);
  background:var(--color-surface);display:flex;align-items:center;justify-content:center;transition:border-color var(--transition-base)}
.zn-radio__dot::after{content:"";width:10px;height:10px;border-radius:50%;background:var(--color-primary);transform:scale(0);transition:transform var(--duration-fast) var(--ease-standard)}
.zn-radio input:checked+.zn-radio__dot{border-color:var(--color-primary)}
.zn-radio input:checked+.zn-radio__dot::after{transform:scale(1)}
.zn-radio input:focus-visible+.zn-radio__dot{box-shadow:var(--shadow-focus)}
.zn-radio:hover input:not(:disabled):not(:checked)+.zn-radio__dot{border-color:var(--color-text-muted)}
.zn-radio__label small{display:block;color:var(--color-text-muted);font-size:var(--fs-caption);margin-top:2px}
.zn-radio--card{border:var(--border-1) solid var(--color-border);border-radius:var(--radius-md);padding:var(--space-4);width:100%}
.zn-radio--card:has(input:checked){border-color:var(--color-accent);background:var(--color-accent-subtle)}
`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-radio-css")) {
    const s = document.createElement("style");
    s.id = "zn-radio-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function RadioGroup({
  name,
  value,
  onChange,
  options = [],
  variant = "default",
  disabled = false
}) {
  inject();
  return /*#__PURE__*/React.createElement("div", {
    className: "zn-radiogroup",
    role: "radiogroup"
  }, options.map(o => {
    const v = typeof o === "object" ? o.value : o;
    const l = typeof o === "object" ? o.label : o;
    const d = typeof o === "object" ? o.description : null;
    const dis = disabled || typeof o === "object" && o.disabled;
    return /*#__PURE__*/React.createElement("label", {
      key: v,
      className: ["zn-radio", variant === "card" && "zn-radio--card", dis && "zn-radio--disabled"].filter(Boolean).join(" ")
    }, /*#__PURE__*/React.createElement("input", {
      type: "radio",
      name: name,
      value: v,
      checked: value === v,
      disabled: dis,
      onChange: () => onChange && onChange(v)
    }), /*#__PURE__*/React.createElement("span", {
      className: "zn-radio__dot",
      "aria-hidden": "true"
    }), /*#__PURE__*/React.createElement("span", {
      className: "zn-radio__label"
    }, l, d && /*#__PURE__*/React.createElement("small", null, d)));
  }));
}
Object.assign(__ds_scope, { RadioGroup });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/RadioGroup.jsx", error: String((e && e.message) || e) }); }

// components/forms/SearchField.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const Search = () => /*#__PURE__*/React.createElement("svg", {
  width: "20",
  height: "20",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.75",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("circle", {
  cx: "11",
  cy: "11",
  r: "8"
}), /*#__PURE__*/React.createElement("path", {
  d: "m21 21-4.3-4.3"
}));
const Clear = () => /*#__PURE__*/React.createElement("svg", {
  width: "18",
  height: "18",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.75",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M18 6 6 18M6 6l12 12"
}));
const CSS = `.zn-search__clear{position:absolute;inset-inline-end:0;width:44px;height:100%;display:flex;align-items:center;justify-content:center;background:none;border:none;color:var(--color-text-muted);cursor:pointer;border-radius:var(--radius-control)}
.zn-search__clear:hover{color:var(--color-text-primary)}
.zn-search__clear:focus-visible{outline:none;box-shadow:var(--shadow-focus)}`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-search-css")) {
    const s = document.createElement("style");
    s.id = "zn-search-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function SearchField({
  value,
  onChange,
  onClear,
  placeholder = "جستجوی سکه، آبشده، شمش…",
  size = "md",
  ...rest
}) {
  __ds_scope.injectFieldCSS();
  inject();
  const hasVal = value !== undefined && value !== "";
  return /*#__PURE__*/React.createElement("div", {
    className: "zn-field"
  }, /*#__PURE__*/React.createElement("div", {
    className: "zn-inputwrap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "zn-field__adorn zn-field__adorn--start",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement(Search, null)), /*#__PURE__*/React.createElement("input", _extends({
    type: "search",
    role: "searchbox",
    className: ["zn-input", "zn-input--hasstart", hasVal && "zn-input--hasend", size !== "md" && "zn-input--" + size].filter(Boolean).join(" "),
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    "aria-label": placeholder
  }, rest)), hasVal && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "zn-search__clear",
    "aria-label": "\u067E\u0627\u06A9 \u06A9\u0631\u062F\u0646",
    onClick: onClear
  }, /*#__PURE__*/React.createElement(Clear, null))));
}
Object.assign(__ds_scope, { SearchField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SearchField.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.zn-select-wrap{position:relative;display:flex;align-items:center}
.zn-select{width:100%;height:44px;padding:0 var(--space-4);padding-inline-end:44px;font-family:var(--font-body);font-size:var(--fs-body);
  color:var(--color-text-primary);background:var(--color-surface);border:var(--border-1) solid var(--color-border-strong);border-radius:var(--radius-control);
  appearance:none;cursor:pointer;transition:border-color var(--transition-base),box-shadow var(--transition-base);outline:none}
.zn-select:hover:not(:disabled){border-color:var(--color-text-muted)}
.zn-select:focus{border-color:var(--color-accent);box-shadow:var(--shadow-focus)}
.zn-select:disabled{background:var(--color-surface-sunken);opacity:var(--opacity-disabled);cursor:not-allowed}
.zn-select[data-placeholder="true"]{color:var(--color-text-muted)}
.zn-select[aria-invalid="true"]{border-color:var(--color-danger)}
.zn-select__chev{position:absolute;inset-inline-end:var(--space-4);pointer-events:none;color:var(--color-text-muted);display:flex}
`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-select-css")) {
    const s = document.createElement("style");
    s.id = "zn-select-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
const Chevron = () => /*#__PURE__*/React.createElement("svg", {
  width: "18",
  height: "18",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.75",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "m6 9 6 6 6-6"
}));
function Select({
  label,
  options = [],
  value,
  onChange,
  placeholder = "انتخاب کنید",
  error,
  helperText,
  disabled = false,
  id,
  ...rest
}) {
  __ds_scope.injectFieldCSS();
  inject();
  const fid = id || "zn-select";
  return /*#__PURE__*/React.createElement("div", {
    className: "zn-field"
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "zn-field__label",
    htmlFor: fid
  }, label), /*#__PURE__*/React.createElement("div", {
    className: "zn-select-wrap"
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: fid,
    className: "zn-select",
    value: value ?? "",
    onChange: onChange,
    disabled: disabled,
    "data-placeholder": value === undefined || value === "" ? "true" : "false",
    "aria-invalid": !!error || undefined
  }, rest), placeholder && /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, placeholder), options.map(o => {
    const v = typeof o === "object" ? o.value : o;
    const l = typeof o === "object" ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })), /*#__PURE__*/React.createElement("span", {
    className: "zn-select__chev",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement(Chevron, null))), error ? /*#__PURE__*/React.createElement("span", {
    className: "zn-field__msg zn-field__msg--error",
    role: "alert"
  }, error) : helperText ? /*#__PURE__*/React.createElement("span", {
    className: "zn-field__msg zn-field__msg--help"
  }, helperText) : null);
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.zn-switch{display:inline-flex;align-items:center;gap:var(--space-3);font-family:var(--font-body);font-size:var(--fs-body);color:var(--color-text-primary);cursor:pointer}
.zn-switch--disabled{opacity:var(--opacity-disabled);cursor:not-allowed}
.zn-switch input{position:absolute;opacity:0;width:0;height:0}
.zn-switch__track{flex:0 0 auto;width:48px;height:28px;border-radius:var(--radius-pill);background:var(--color-border-strong);position:relative;transition:background var(--transition-base)}
.zn-switch__thumb{position:absolute;top:3px;inset-inline-start:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:var(--shadow-sm);transition:transform var(--transition-base)}
.zn-switch input:checked+.zn-switch__track{background:var(--color-success)}
.zn-switch input:checked+.zn-switch__track .zn-switch__thumb{transform:translateX(-20px)}
.zn-switch input:focus-visible+.zn-switch__track{box-shadow:var(--shadow-focus)}
`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-switch-css")) {
    const s = document.createElement("style");
    s.id = "zn-switch-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function Switch({
  label,
  checked,
  disabled = false,
  onChange,
  id,
  ...rest
}) {
  inject();
  return /*#__PURE__*/React.createElement("label", {
    className: ["zn-switch", disabled && "zn-switch--disabled"].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    role: "switch",
    checked: checked,
    disabled: disabled,
    onChange: onChange,
    id: id
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "zn-switch__track",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("span", {
    className: "zn-switch__thumb"
  })), label && /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Breadcrumb.jsx
try { (() => {
const CSS = `
.zn-crumb{display:flex;align-items:center;flex-wrap:wrap;gap:6px;font-family:var(--font-body);font-size:var(--fs-body-sm)}
.zn-crumb a{color:var(--color-text-muted);text-decoration:none;transition:color var(--transition-base)}
.zn-crumb a:hover{color:var(--color-accent-active)}
.zn-crumb__sep{color:var(--color-text-muted);display:flex;opacity:.6}
.zn-crumb__sep svg{width:15px;height:15px}
.zn-crumb__current{color:var(--color-text-primary);font-weight:var(--fw-semibold)}
`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-crumb-css")) {
    const s = document.createElement("style");
    s.id = "zn-crumb-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
/* RTL: chevron points left (toward the next/deeper crumb) */
const Sep = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.75",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "m15 18-6-6 6-6"
}));
function Breadcrumb({
  items = []
}) {
  inject();
  return /*#__PURE__*/React.createElement("nav", {
    className: "zn-crumb",
    "aria-label": "\u0645\u0633\u06CC\u0631"
  }, items.map((it, i) => {
    const last = i === items.length - 1;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: i
    }, last ? /*#__PURE__*/React.createElement("span", {
      className: "zn-crumb__current",
      "aria-current": "page"
    }, it.label) : /*#__PURE__*/React.createElement("a", {
      href: it.href || "#"
    }, it.label), !last && /*#__PURE__*/React.createElement("span", {
      className: "zn-crumb__sep",
      "aria-hidden": "true"
    }, /*#__PURE__*/React.createElement(Sep, null)));
  }));
}
Object.assign(__ds_scope, { Breadcrumb });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Breadcrumb.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
const CSS = `
.zn-tabs{display:flex;gap:var(--space-5);border-bottom:var(--border-1) solid var(--color-divider)}
.zn-tab{position:relative;background:none;border:none;font-family:var(--font-body);font-size:var(--fs-body);font-weight:var(--fw-medium);color:var(--color-text-secondary);padding:var(--space-3) 2px var(--space-4);cursor:pointer;transition:color var(--transition-base)}
.zn-tab:hover{color:var(--color-text-primary)}
.zn-tab--active{color:var(--color-text-primary);font-weight:var(--fw-semibold)}
.zn-tab--active::after{content:"";position:absolute;inset-inline:0;inset-block-end:-1px;height:2.5px;background:var(--color-accent);border-radius:2px}
.zn-tab:focus-visible{outline:none;box-shadow:var(--shadow-focus);border-radius:var(--radius-sm)}
.zn-tab__badge{margin-inline-start:6px;font-family:var(--font-price);font-size:var(--fs-caption);color:var(--color-text-muted)}
`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-tabs-css")) {
    const s = document.createElement("style");
    s.id = "zn-tabs-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function Tabs({
  items = [],
  value,
  onChange
}) {
  inject();
  return /*#__PURE__*/React.createElement("div", {
    className: "zn-tabs",
    role: "tablist"
  }, items.map(it => {
    const k = it.key || it.label;
    return /*#__PURE__*/React.createElement("button", {
      key: k,
      role: "tab",
      "aria-selected": value === k,
      className: ["zn-tab", value === k && "zn-tab--active"].filter(Boolean).join(" "),
      onClick: () => onChange && onChange(k)
    }, it.label, it.count !== undefined && /*#__PURE__*/React.createElement("span", {
      className: "zn-tab__badge"
    }, it.count));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TopBar.jsx
try { (() => {
const CSS = `
.zn-topbar{background:var(--color-surface-inverse);color:var(--color-text-inverse)}
.zn-topbar__inner{max-width:var(--container-max);margin:0 auto;display:flex;align-items:center;gap:var(--space-5);padding:var(--space-4) var(--container-pad)}
.zn-topbar__brand{font-family:var(--font-display);font-weight:var(--fw-black);font-size:var(--fs-h4);color:var(--color-accent);white-space:nowrap;letter-spacing:0;text-decoration:none}
.zn-topbar__brand span{color:var(--color-text-inverse)}
.zn-topbar__nav{display:flex;gap:var(--space-5);align-items:center}
.zn-topbar__link{font-family:var(--font-body);font-size:var(--fs-body);font-weight:var(--fw-medium);color:rgba(255,255,255,.82);text-decoration:none;padding:6px 2px;position:relative;transition:color var(--transition-base)}
.zn-topbar__link:hover{color:#fff}
.zn-topbar__link--active{color:var(--color-accent)}
.zn-topbar__link--active::after{content:"";position:absolute;inset-inline:0;inset-block-end:-6px;height:2px;background:var(--color-accent);border-radius:2px}
.zn-topbar__search{flex:1;max-width:420px}
.zn-topbar__search .zn-input{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.16);color:#fff}
.zn-topbar__search .zn-input::placeholder{color:rgba(255,255,255,.55)}
.zn-topbar__search .zn-field__adorn{color:rgba(255,255,255,.6)}
.zn-topbar__actions{display:flex;align-items:center;gap:var(--space-2);margin-inline-start:auto}
.zn-topbar__actions .zn-iconbtn{color:rgba(255,255,255,.85)}
.zn-topbar__actions .zn-iconbtn:hover{background:rgba(255,255,255,.1);color:#fff}
.zn-topbar__cart{position:relative}
.zn-topbar__cart-count{position:absolute;inset-block-start:2px;inset-inline-start:2px;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:var(--color-accent);color:var(--color-text-on-accent);font-family:var(--font-price);font-size:10px;font-weight:var(--fw-bold);display:flex;align-items:center;justify-content:center}
`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-topbar-css")) {
    const s = document.createElement("style");
    s.id = "zn-topbar-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
const Cart = () => /*#__PURE__*/React.createElement("svg", {
  width: "22",
  height: "22",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.6",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("circle", {
  cx: "8",
  cy: "21",
  r: "1"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "19",
  cy: "21",
  r: "1"
}), /*#__PURE__*/React.createElement("path", {
  d: "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 2-1.58l1.65-7.42H5.12"
}));
const User = () => /*#__PURE__*/React.createElement("svg", {
  width: "22",
  height: "22",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.6",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "7",
  r: "4"
}));
const FA = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const fa = v => String(v).replace(/[0-9]/g, d => FA[+d]);
function TopBar({
  brand = "زرنما",
  brandLatin,
  nav = [],
  active,
  cartCount = 0,
  onSearch,
  searchValue,
  loggedIn = false
}) {
  inject();
  return /*#__PURE__*/React.createElement("header", {
    className: "zn-topbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "zn-topbar__inner"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    className: "zn-topbar__brand"
  }, brand, brandLatin && /*#__PURE__*/React.createElement("span", null, " ", brandLatin)), /*#__PURE__*/React.createElement("nav", {
    className: "zn-topbar__nav"
  }, nav.map(n => /*#__PURE__*/React.createElement("a", {
    key: n.key || n.label,
    href: n.href || "#",
    className: ["zn-topbar__link", active === (n.key || n.label) && "zn-topbar__link--active"].filter(Boolean).join(" ")
  }, n.label))), /*#__PURE__*/React.createElement("div", {
    className: "zn-topbar__search"
  }, /*#__PURE__*/React.createElement(__ds_scope.SearchField, {
    value: searchValue,
    onChange: onSearch,
    onClear: () => onSearch && onSearch({
      target: {
        value: ""
      }
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "zn-topbar__actions"
  }, /*#__PURE__*/React.createElement("span", {
    className: "zn-topbar__cart"
  }, /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: /*#__PURE__*/React.createElement(Cart, null),
    label: "\u0633\u0628\u062F \u062E\u0631\u06CC\u062F"
  }), cartCount > 0 && /*#__PURE__*/React.createElement("span", {
    className: "zn-topbar__cart-count"
  }, fa(cartCount))), loggedIn ? /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: /*#__PURE__*/React.createElement(User, null),
    label: "\u062D\u0633\u0627\u0628 \u06A9\u0627\u0631\u0628\u0631\u06CC"
  }) : /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "gold",
    size: "sm"
  }, "\u0648\u0631\u0648\u062F | \u062B\u0628\u062A\u200C\u0646\u0627\u0645"))));
}
Object.assign(__ds_scope, { TopBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TopBar.jsx", error: String((e && e.message) || e) }); }

// components/utils/intl.js
try { (() => {
// Shared i18n/number helpers (Persian numerals, Toman formatting).
// Not a component (no .d.ts) — bundled as a dependency of the components that import it.
const FA = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** Convert Latin digits in a string/number to Persian (Eastern Arabic) numerals. */
function toFa(v) {
  return String(v).replace(/[0-9]/g, d => FA[+d]);
}

/** Group thousands with the Persian thousands separator (٬). */
function groupFa(v) {
  const n = String(v).replace(/[^\d]/g, "");
  return toFa(n.replace(/\B(?=(\d{3})+(?!\d))/g, "٬"));
}

/** Format a number as a Toman price string: "۱٬۲۵۰٬۰۰۰ تومان". */
function toman(v, {
  suffix = "تومان",
  withSuffix = true
} = {}) {
  const g = groupFa(v);
  return withSuffix ? `${g} ${suffix}` : g;
}
Object.assign(__ds_scope, { toFa, groupFa, toman });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/utils/intl.js", error: String((e && e.message) || e) }); }

// components/commerce/ProductCard.jsx
try { (() => {
const CSS = `
.zn-pcard{display:flex;flex-direction:column;background:var(--color-surface);border:var(--border-1) solid var(--color-border);border-radius:var(--radius-card);overflow:hidden;box-shadow:var(--shadow-sm);transition:box-shadow var(--transition-base),transform var(--transition-base)}
.zn-pcard:hover{box-shadow:var(--shadow-md);transform:translateY(-2px)}
.zn-pcard__media{position:relative;aspect-ratio:1/1;background:radial-gradient(120% 120% at 30% 20%,var(--gold-100),var(--warm-100))}
.zn-pcard__media img{width:100%;height:100%;object-fit:cover;filter:blur(12px);transition:filter var(--duration-slow) var(--ease-out)}
.zn-pcard__media img.zn-loaded{filter:none}
.zn-pcard__badges{position:absolute;inset-block-start:var(--space-3);inset-inline-start:var(--space-3);display:flex;flex-direction:column;gap:6px;align-items:flex-start}
.zn-pcard__fav{position:absolute;inset-block-start:var(--space-2);inset-inline-end:var(--space-2)}
.zn-pcard__fav button{background:var(--color-surface);box-shadow:var(--shadow-sm)}
.zn-pcard__body{display:flex;flex-direction:column;gap:var(--space-3);padding:var(--space-4)}
.zn-pcard__title{font-family:var(--font-body);font-weight:var(--fw-semibold);font-size:var(--fs-body);color:var(--color-text-primary);line-height:var(--lh-snug);margin:0;text-wrap:pretty}
.zn-pcard__specs{display:flex;flex-wrap:wrap;gap:6px}
.zn-pcard__spec{font-size:var(--fs-caption);color:var(--color-text-muted);background:var(--color-surface-sunken);border-radius:var(--radius-sm);padding:3px 8px}
.zn-pcard__price{display:flex;flex-direction:column;gap:2px;margin-top:auto}
.zn-pcard__now{font-family:var(--font-price);font-variant-numeric:tabular-nums lining-nums;font-weight:var(--fw-bold);font-size:var(--fs-h4);color:var(--color-accent-active)}
.zn-pcard__now small{font-family:var(--font-body);font-size:var(--fs-caption);color:var(--color-text-muted);font-weight:var(--fw-medium)}
.zn-pcard__was{font-family:var(--font-price);font-variant-numeric:tabular-nums;font-size:var(--fs-body-sm);color:var(--color-text-muted);text-decoration:line-through}
.zn-pcard__foot{display:flex;gap:var(--space-2);align-items:center}
.zn-pcard__foot .zn-btn{flex:1}
`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-pcard-css")) {
    const s = document.createElement("style");
    s.id = "zn-pcard-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
const Cart = () => /*#__PURE__*/React.createElement("svg", {
  width: "18",
  height: "18",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.75",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("circle", {
  cx: "8",
  cy: "21",
  r: "1"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "19",
  cy: "21",
  r: "1"
}), /*#__PURE__*/React.createElement("path", {
  d: "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 2-1.58l1.65-7.42H5.12"
}));
const Heart = ({
  filled
}) => /*#__PURE__*/React.createElement("svg", {
  width: "20",
  height: "20",
  viewBox: "0 0 24 24",
  fill: filled ? "currentColor" : "none",
  stroke: "currentColor",
  strokeWidth: "1.75",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
}));
function ProductCard({
  title,
  image,
  specs = [],
  price,
  wasPrice,
  discountPct,
  installment = false,
  favorite = false,
  onFavorite,
  onAdd,
  inStock = true
}) {
  inject();
  const [loaded, setLoaded] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    className: "zn-pcard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "zn-pcard__media"
  }, image && /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: "",
    className: loaded ? "zn-loaded" : "",
    loading: "lazy",
    onLoad: () => setLoaded(true)
  }), /*#__PURE__*/React.createElement("div", {
    className: "zn-pcard__badges"
  }, discountPct ? /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    variant: "solid-danger"
  }, __ds_scope.toFa(discountPct), "\u066A \u062A\u062E\u0641\u06CC\u0641") : null, installment && /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    variant: "gold"
  }, "\u062E\u0631\u06CC\u062F \u0627\u0642\u0633\u0627\u0637\u06CC"), !inStock && /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    variant: "neutral",
    dot: true
  }, "\u0646\u0627\u0645\u0648\u062C\u0648\u062F")), /*#__PURE__*/React.createElement("span", {
    className: "zn-pcard__fav"
  }, /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    size: "sm",
    icon: /*#__PURE__*/React.createElement(Heart, {
      filled: favorite
    }),
    label: "\u0639\u0644\u0627\u0642\u0647\u200C\u0645\u0646\u062F\u06CC",
    onClick: onFavorite,
    style: favorite ? {
      color: "var(--color-sell)"
    } : undefined
  }))), /*#__PURE__*/React.createElement("div", {
    className: "zn-pcard__body"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "zn-pcard__title"
  }, title), specs.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "zn-pcard__specs"
  }, specs.map((s, i) => /*#__PURE__*/React.createElement("span", {
    className: "zn-pcard__spec",
    key: i
  }, s))), /*#__PURE__*/React.createElement("div", {
    className: "zn-pcard__price"
  }, wasPrice && /*#__PURE__*/React.createElement("span", {
    className: "zn-pcard__was"
  }, __ds_scope.toman(wasPrice, {
    withSuffix: false
  })), /*#__PURE__*/React.createElement("span", {
    className: "zn-pcard__now"
  }, __ds_scope.toman(price, {
    withSuffix: false
  }), " ", /*#__PURE__*/React.createElement("small", null, "\u062A\u0648\u0645\u0627\u0646"))), /*#__PURE__*/React.createElement("div", {
    className: "zn-pcard__foot"
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "gold",
    size: "md",
    startIcon: /*#__PURE__*/React.createElement(Cart, null),
    onClick: onAdd,
    disabled: !inStock
  }, inStock ? "افزودن به سبد" : "ناموجود"))));
}
Object.assign(__ds_scope, { ProductCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/commerce/ProductCard.jsx", error: String((e && e.message) || e) }); }

// components/commerce/QuantityStepper.jsx
try { (() => {
const CSS = `
.zn-qty{display:inline-flex;align-items:center;border:var(--border-1) solid var(--color-border-strong);border-radius:var(--radius-pill);background:var(--color-surface);overflow:hidden}
.zn-qty__btn{width:40px;height:40px;display:flex;align-items:center;justify-content:center;background:none;border:none;color:var(--color-primary);cursor:pointer;transition:background var(--transition-base)}
.zn-qty__btn:hover:not(:disabled){background:var(--color-primary-subtle)}
.zn-qty__btn:disabled{color:var(--color-text-muted);opacity:var(--opacity-disabled);cursor:not-allowed}
.zn-qty__btn:focus-visible{outline:none;box-shadow:var(--shadow-focus)}
.zn-qty__btn svg{width:18px;height:18px}
.zn-qty__val{min-width:44px;text-align:center;font-family:var(--font-price);font-variant-numeric:tabular-nums;font-weight:var(--fw-semibold);font-size:var(--fs-body);color:var(--color-text-primary)}
.zn-qty--sm .zn-qty__btn{width:32px;height:32px}.zn-qty--sm .zn-qty__val{min-width:36px;font-size:var(--fs-body-sm)}
`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-qty-css")) {
    const s = document.createElement("style");
    s.id = "zn-qty-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
const Plus = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M12 5v14M5 12h14"
}));
const Minus = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M5 12h14"
}));
function QuantityStepper({
  value = 1,
  min = 1,
  max = 99,
  step = 1,
  onChange,
  size = "md",
  unit
}) {
  inject();
  const set = v => {
    const n = Math.max(min, Math.min(max, v));
    onChange && onChange(n);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: ["zn-qty", size === "sm" && "zn-qty--sm"].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "zn-qty__btn",
    "aria-label": "\u0627\u0641\u0632\u0627\u06CC\u0634",
    onClick: () => set(value + step),
    disabled: value >= max
  }, /*#__PURE__*/React.createElement(Plus, null)), /*#__PURE__*/React.createElement("span", {
    className: "zn-qty__val",
    role: "status",
    "aria-live": "polite"
  }, __ds_scope.toFa(value), unit ? ` ${unit}` : ""), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "zn-qty__btn",
    "aria-label": "\u06A9\u0627\u0647\u0634",
    onClick: () => set(value - step),
    disabled: value <= min
  }, /*#__PURE__*/React.createElement(Minus, null)));
}
Object.assign(__ds_scope, { QuantityStepper });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/commerce/QuantityStepper.jsx", error: String((e && e.message) || e) }); }

// components/data/WalletCard.jsx
try { (() => {
const CSS = `
.zn-wallet{background:var(--color-surface-inverse);color:var(--color-text-inverse);border-radius:var(--radius-lg);padding:var(--space-5);box-shadow:var(--shadow-md);position:relative;overflow:hidden}
.zn-wallet::after{content:"";position:absolute;inset-block-start:-40px;inset-inline-start:-40px;width:160px;height:160px;border-radius:50%;background:var(--color-accent);opacity:.10}
.zn-wallet__label{display:flex;align-items:center;gap:8px;font-family:var(--font-body);font-size:var(--fs-body-sm);color:rgba(255,255,255,.72);position:relative}
.zn-wallet__label svg{width:18px;height:18px;color:var(--color-accent)}
.zn-wallet__balance{font-family:var(--font-price);font-variant-numeric:tabular-nums lining-nums;font-weight:var(--fw-bold);font-size:var(--fs-h1);margin:var(--space-3) 0;position:relative}
.zn-wallet__balance small{font-family:var(--font-body);font-size:var(--fs-body);color:var(--color-accent);font-weight:var(--fw-medium)}
.zn-wallet__gold{font-family:var(--font-body);font-size:var(--fs-body-sm);color:rgba(255,255,255,.66);position:relative;margin-bottom:var(--space-4)}
.zn-wallet__gold b{color:#fff;font-weight:var(--fw-semibold)}
.zn-wallet__actions{display:flex;gap:var(--space-2);position:relative}
.zn-wallet__actions .zn-btn{flex:1}
`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-wallet-css")) {
    const s = document.createElement("style");
    s.id = "zn-wallet-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
const Wallet = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.75",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"
}), /*#__PURE__*/React.createElement("path", {
  d: "M18 12h.01"
}));
function WalletCard({
  balance,
  goldGrams,
  onTopUp,
  onWithdraw
}) {
  inject();
  return /*#__PURE__*/React.createElement("div", {
    className: "zn-wallet"
  }, /*#__PURE__*/React.createElement("div", {
    className: "zn-wallet__label"
  }, /*#__PURE__*/React.createElement(Wallet, null), " \u0645\u0648\u062C\u0648\u062F\u06CC \u06A9\u06CC\u0641 \u067E\u0648\u0644"), /*#__PURE__*/React.createElement("div", {
    className: "zn-wallet__balance"
  }, __ds_scope.toman(balance, {
    withSuffix: false
  }), " ", /*#__PURE__*/React.createElement("small", null, "\u062A\u0648\u0645\u0627\u0646")), goldGrams !== undefined && /*#__PURE__*/React.createElement("div", {
    className: "zn-wallet__gold"
  }, "\u0637\u0644\u0627\u06CC \u0622\u0628\u0634\u062F\u0647 \u0634\u0645\u0627: ", /*#__PURE__*/React.createElement("b", null, goldGrams, " \u06AF\u0631\u0645")), /*#__PURE__*/React.createElement("div", {
    className: "zn-wallet__actions"
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "gold",
    size: "md",
    onClick: onTopUp
  }, "\u0627\u0641\u0632\u0627\u06CC\u0634 \u0645\u0648\u062C\u0648\u062F\u06CC"), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "secondary",
    size: "md",
    onClick: onWithdraw,
    style: {
      color: "#fff",
      borderColor: "rgba(255,255,255,.28)"
    }
  }, "\u0628\u0631\u062F\u0627\u0634\u062A")));
}
Object.assign(__ds_scope, { WalletCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/WalletCard.jsx", error: String((e && e.message) || e) }); }

// components/forms/OtpInput.jsx
try { (() => {
const CSS = `
.zn-otp{display:flex;flex-direction:column;gap:var(--space-3);direction:ltr;align-items:center}
.zn-otp__row{display:flex;gap:var(--space-3);justify-content:center}
.zn-otp__cell{width:56px;height:64px;text-align:center;font-family:var(--font-price);font-variant-numeric:tabular-nums;font-size:var(--fs-h2);font-weight:var(--fw-bold);
  color:var(--color-text-primary);background:var(--color-surface);border:var(--border-2) solid var(--color-border-strong);border-radius:var(--radius-md);
  transition:border-color var(--transition-base),box-shadow var(--transition-base);outline:none}
.zn-otp__cell:focus{border-color:var(--color-accent);box-shadow:var(--shadow-focus)}
.zn-otp__cell[data-filled="true"]{border-color:var(--color-primary)}
.zn-otp--error .zn-otp__cell{border-color:var(--color-danger)}
`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-otp-css")) {
    const s = document.createElement("style");
    s.id = "zn-otp-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function OtpInput({
  length = 5,
  value = "",
  onChange,
  error = false,
  autoFocus = true
}) {
  inject();
  const refs = React.useRef([]);
  const chars = Array.from({
    length
  }, (_, i) => value[i] || "");
  const set = (i, c) => {
    const next = chars.slice();
    next[i] = c;
    onChange && onChange(next.join(""));
  };
  const onKey = (i, e) => {
    if (e.key === "Backspace" && !chars[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i < length - 1) refs.current[i + 1]?.focus();
    if (e.key === "ArrowRight" && i > 0) refs.current[i - 1]?.focus();
  };
  const onInput = (i, e) => {
    const d = e.target.value.replace(/[^\d]/g, "").slice(-1);
    set(i, d);
    if (d && i < length - 1) refs.current[i + 1]?.focus();
  };
  return /*#__PURE__*/React.createElement("div", {
    className: ["zn-otp", error && "zn-otp--error"].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement("div", {
    className: "zn-otp__row",
    dir: "ltr"
  }, chars.map((c, i) => /*#__PURE__*/React.createElement("input", {
    key: i,
    ref: el => refs.current[i] = el,
    className: "zn-otp__cell",
    inputMode: "numeric",
    maxLength: 1,
    "aria-label": `رقم ${__ds_scope.toFa(i + 1)}`,
    "data-filled": c ? "true" : "false",
    value: c ? __ds_scope.toFa(c) : "",
    autoFocus: autoFocus && i === 0,
    onChange: e => onInput(i, e),
    onKeyDown: e => onKey(i, e)
  }))));
}
Object.assign(__ds_scope, { OtpInput });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/OtpInput.jsx", error: String((e && e.message) || e) }); }

// components/forms/PriceInput.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.zn-price-input .zn-input{font-family:var(--font-price);font-variant-numeric:tabular-nums lining-nums;font-size:var(--fs-h4);font-weight:var(--fw-semibold);text-align:start}
.zn-price-input__unit{font-family:var(--font-body);font-size:var(--fs-body-sm);color:var(--color-text-muted);font-weight:var(--fw-medium)}
`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-price-input-css")) {
    const s = document.createElement("style");
    s.id = "zn-price-input-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function PriceInput({
  label,
  unit = "تومان",
  value,
  onValueChange,
  error,
  helperText,
  size = "lg",
  id,
  ...rest
}) {
  __ds_scope.injectFieldCSS();
  inject();
  const fid = id || "zn-price";
  const display = value === undefined || value === "" ? "" : __ds_scope.groupFa(value);
  const handle = e => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    onValueChange && onValueChange(raw);
  };
  const invalid = !!error;
  return /*#__PURE__*/React.createElement("div", {
    className: "zn-field zn-price-input"
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "zn-field__label",
    htmlFor: fid
  }, label), /*#__PURE__*/React.createElement("div", {
    className: "zn-inputwrap"
  }, /*#__PURE__*/React.createElement("input", _extends({
    id: fid,
    inputMode: "numeric",
    dir: "ltr",
    style: {
      textAlign: "start"
    },
    className: ["zn-input", "zn-input--" + size, "zn-input--hasend"].join(" "),
    value: display,
    onChange: handle,
    "aria-invalid": invalid || undefined
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "zn-field__adorn zn-field__adorn--end zn-price-input__unit",
    style: {
      width: "auto",
      paddingInline: "var(--space-4)"
    }
  }, unit)), error ? /*#__PURE__*/React.createElement("span", {
    className: "zn-field__msg zn-field__msg--error",
    role: "alert"
  }, error) : helperText ? /*#__PURE__*/React.createElement("span", {
    className: "zn-field__msg zn-field__msg--help"
  }, helperText) : null);
}
Object.assign(__ds_scope, { PriceInput });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/PriceInput.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Pagination.jsx
try { (() => {
const CSS = `
.zn-pag{display:flex;align-items:center;gap:6px;font-family:var(--font-price)}
.zn-pag__btn{min-width:40px;height:40px;padding:0 8px;display:flex;align-items:center;justify-content:center;border-radius:var(--radius-sm);border:var(--border-1) solid var(--color-border);background:var(--color-surface);color:var(--color-text-secondary);font-variant-numeric:tabular-nums;font-size:var(--fs-body-sm);font-weight:var(--fw-semibold);cursor:pointer;transition:all var(--transition-base)}
.zn-pag__btn:hover:not(:disabled){border-color:var(--color-accent-border);color:var(--color-text-primary)}
.zn-pag__btn:focus-visible{outline:none;box-shadow:var(--shadow-focus)}
.zn-pag__btn:disabled{opacity:var(--opacity-disabled);cursor:not-allowed}
.zn-pag__btn--active{background:var(--color-primary);border-color:var(--color-primary);color:var(--color-text-on-primary)}
.zn-pag__btn svg{width:18px;height:18px}
.zn-pag__gap{color:var(--color-text-muted);padding:0 4px}
`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-pag-css")) {
    const s = document.createElement("style");
    s.id = "zn-pag-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
const Prev = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.75",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "m9 18 6-6-6-6"
}));
const Next = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.75",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "m15 18-6-6 6-6"
}));
function pages(cur, total) {
  const d = [];
  const push = p => d.push(p);
  if (total <= 7) {
    for (let i = 1; i <= total; i++) push(i);
    return d;
  }
  push(1);
  if (cur > 3) push("…");
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) push(i);
  if (cur < total - 2) push("…");
  push(total);
  return d;
}
function Pagination({
  page = 1,
  total = 1,
  onChange
}) {
  inject();
  const go = p => {
    if (p >= 1 && p <= total && p !== page) onChange && onChange(p);
  };
  return /*#__PURE__*/React.createElement("nav", {
    className: "zn-pag",
    "aria-label": "\u0635\u0641\u062D\u0647\u200C\u0628\u0646\u062F\u06CC"
  }, /*#__PURE__*/React.createElement("button", {
    className: "zn-pag__btn",
    "aria-label": "\u0642\u0628\u0644\u06CC",
    disabled: page <= 1,
    onClick: () => go(page - 1)
  }, /*#__PURE__*/React.createElement(Next, null)), pages(page, total).map((p, i) => p === "…" ? /*#__PURE__*/React.createElement("span", {
    className: "zn-pag__gap",
    key: "g" + i
  }, "\u2026") : /*#__PURE__*/React.createElement("button", {
    key: p,
    className: ["zn-pag__btn", p === page && "zn-pag__btn--active"].filter(Boolean).join(" "),
    "aria-current": p === page ? "page" : undefined,
    onClick: () => go(p)
  }, __ds_scope.toFa(p))), /*#__PURE__*/React.createElement("button", {
    className: "zn-pag__btn",
    "aria-label": "\u0628\u0639\u062F\u06CC",
    disabled: page >= total,
    onClick: () => go(page + 1)
  }, /*#__PURE__*/React.createElement(Prev, null)));
}
Object.assign(__ds_scope, { Pagination });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Pagination.jsx", error: String((e && e.message) || e) }); }

// components/pricing/PriceChange.jsx
try { (() => {
const CSS = `
.zn-pchg{display:inline-flex;align-items:center;gap:4px;font-family:var(--font-price);font-variant-numeric:tabular-nums;font-weight:var(--fw-semibold);font-size:var(--fs-body-sm);border-radius:var(--radius-sm);padding:2px 7px}
.zn-pchg svg{width:14px;height:14px}
.zn-pchg--up{color:var(--color-buy);background:var(--color-buy-subtle)}
.zn-pchg--down{color:var(--color-sell);background:var(--color-sell-subtle)}
.zn-pchg--flat{color:var(--color-text-muted);background:var(--color-surface-sunken)}
.zn-pchg--bare{background:transparent;padding:0}
`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-pchg-css")) {
    const s = document.createElement("style");
    s.id = "zn-pchg-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
const Up = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2.5",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "m6 15 6-6 6 6"
}));
const Down = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2.5",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "m6 9 6 6 6-6"
}));
function PriceChange({
  value = 0,
  suffix = "٪",
  bare = false
}) {
  inject();
  const dir = value > 0 ? "up" : value < 0 ? "down" : "flat";
  const label = dir === "up" ? "افزایش" : dir === "down" ? "کاهش" : "بدون تغییر";
  return /*#__PURE__*/React.createElement("span", {
    className: ["zn-pchg", `zn-pchg--${dir}`, bare && "zn-pchg--bare"].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement("span", {
    className: "sr-only"
  }, label), dir !== "flat" && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, dir === "up" ? /*#__PURE__*/React.createElement(Up, null) : /*#__PURE__*/React.createElement(Down, null)), __ds_scope.toFa(Math.abs(value)), suffix);
}
Object.assign(__ds_scope, { PriceChange });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/pricing/PriceChange.jsx", error: String((e && e.message) || e) }); }

// components/data/StatTile.jsx
try { (() => {
const CSS = `
.zn-stat{background:var(--color-surface);border:var(--border-1) solid var(--color-border);border-radius:var(--radius-lg);padding:var(--space-5);box-shadow:var(--shadow-sm);display:flex;flex-direction:column;gap:var(--space-3)}
.zn-stat__top{display:flex;align-items:center;justify-content:space-between;gap:var(--space-3)}
.zn-stat__label{font-family:var(--font-body);font-size:var(--fs-body-sm);color:var(--color-text-muted)}
.zn-stat__icon{width:40px;height:40px;border-radius:var(--radius-md);background:var(--color-accent-subtle);color:var(--color-accent-active);display:flex;align-items:center;justify-content:center}
.zn-stat__icon svg{width:20px;height:20px}
.zn-stat__value{font-family:var(--font-price);font-variant-numeric:tabular-nums lining-nums;font-weight:var(--fw-bold);font-size:var(--fs-h2);color:var(--color-text-primary);line-height:1}
.zn-stat__value small{font-family:var(--font-body);font-size:var(--fs-body-sm);color:var(--color-text-muted);font-weight:var(--fw-medium)}
.zn-stat__foot{display:flex;align-items:center;gap:8px;font-size:var(--fs-caption);color:var(--color-text-muted)}
`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-stat-css")) {
    const s = document.createElement("style");
    s.id = "zn-stat-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function StatTile({
  label,
  value,
  unit,
  icon,
  change,
  caption
}) {
  inject();
  return /*#__PURE__*/React.createElement("div", {
    className: "zn-stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "zn-stat__top"
  }, /*#__PURE__*/React.createElement("span", {
    className: "zn-stat__label"
  }, label), icon && /*#__PURE__*/React.createElement("span", {
    className: "zn-stat__icon",
    "aria-hidden": "true"
  }, icon)), /*#__PURE__*/React.createElement("div", {
    className: "zn-stat__value"
  }, value, unit && /*#__PURE__*/React.createElement("small", null, " ", unit)), (change !== undefined || caption) && /*#__PURE__*/React.createElement("div", {
    className: "zn-stat__foot"
  }, change !== undefined && /*#__PURE__*/React.createElement(__ds_scope.PriceChange, {
    value: change
  }), caption && /*#__PURE__*/React.createElement("span", null, caption)));
}
Object.assign(__ds_scope, { StatTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StatTile.jsx", error: String((e && e.message) || e) }); }

// components/pricing/PriceLockCountdown.jsx
try { (() => {
const CSS = `
.zn-lock{display:inline-flex;align-items:center;gap:var(--space-3);background:var(--color-accent-subtle);border:var(--border-1) solid var(--color-accent-border);border-radius:var(--radius-pill);padding:8px 16px;font-family:var(--font-body)}
.zn-lock__icon{display:flex;color:var(--color-accent-active)}.zn-lock__icon svg{width:18px;height:18px}
.zn-lock__text{font-size:var(--fs-body-sm);color:var(--color-text-secondary)}
.zn-lock__time{font-family:var(--font-price);font-variant-numeric:tabular-nums;font-weight:var(--fw-bold);font-size:var(--fs-body);color:var(--color-accent-active);min-width:52px;text-align:center}
.zn-lock--expired{background:var(--color-danger-subtle);border-color:var(--color-danger)}
.zn-lock--expired .zn-lock__icon,.zn-lock--expired .zn-lock__time{color:var(--color-danger-hover)}
`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-lock-css")) {
    const s = document.createElement("style");
    s.id = "zn-lock-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
const Clock = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.75",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "10"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 6v6l4 2"
}));
function PriceLockCountdown({
  seconds = 300,
  onExpire,
  label = "قیمت قفل شده تا"
}) {
  inject();
  const [left, setLeft] = React.useState(seconds);
  React.useEffect(() => {
    setLeft(seconds);
  }, [seconds]);
  React.useEffect(() => {
    if (left <= 0) {
      onExpire && onExpire();
      return;
    }
    const t = setTimeout(() => setLeft(l => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  const m = Math.floor(Math.max(left, 0) / 60),
    s = Math.max(left, 0) % 60;
  const expired = left <= 0;
  return /*#__PURE__*/React.createElement("span", {
    className: ["zn-lock", expired && "zn-lock--expired"].filter(Boolean).join(" "),
    role: "timer",
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement("span", {
    className: "zn-lock__icon",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement(Clock, null)), /*#__PURE__*/React.createElement("span", {
    className: "zn-lock__text"
  }, expired ? "مهلت قیمت به پایان رسید" : label), !expired && /*#__PURE__*/React.createElement("span", {
    className: "zn-lock__time"
  }, __ds_scope.toFa(m), ":", __ds_scope.toFa(String(s).padStart(2, "0"))));
}
Object.assign(__ds_scope, { PriceLockCountdown });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/pricing/PriceLockCountdown.jsx", error: String((e && e.message) || e) }); }

// components/pricing/PriceTable.jsx
try { (() => {
const CSS = `
.zn-ptable{width:100%;background:var(--color-surface);border:var(--border-1) solid var(--color-border);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);overflow:hidden;font-family:var(--font-body)}
.zn-ptable__head{display:flex;align-items:center;justify-content:space-between;padding:var(--space-4) var(--space-5);border-bottom:var(--border-1) solid var(--color-divider)}
.zn-ptable__title{font-family:var(--font-display);font-weight:var(--fw-bold);font-size:var(--fs-body-lg);color:var(--color-text-primary)}
.zn-live{display:inline-flex;align-items:center;gap:6px;font-size:var(--fs-caption);color:var(--color-text-muted)}
.zn-live__dot{width:8px;height:8px;border-radius:50%;background:var(--color-buy);position:relative}
.zn-live__dot::after{content:"";position:absolute;inset:0;border-radius:50%;background:var(--color-buy);animation:zn-ping 1.8s var(--ease-out) infinite}
@keyframes zn-ping{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.6);opacity:0}}
.zn-ptable__cols{display:grid;grid-template-columns:1.6fr 1fr 1fr;padding:var(--space-3) var(--space-5);font-size:var(--fs-caption);color:var(--color-text-muted);font-weight:var(--fw-semibold);background:var(--color-surface-sunken)}
.zn-ptable__cols span:not(:first-child),.zn-prow>span:not(:first-child){text-align:start}
.zn-prow{display:grid;grid-template-columns:1.6fr 1fr 1fr;align-items:center;padding:var(--space-4) var(--space-5);border-top:var(--border-1) solid var(--color-divider)}
.zn-prow__name{font-weight:var(--fw-semibold);color:var(--color-text-primary);display:flex;flex-direction:column;gap:2px}
.zn-prow__name small{font-weight:var(--fw-regular);font-size:var(--fs-caption);color:var(--color-text-muted)}
.zn-price-cell{font-family:var(--font-price);font-variant-numeric:tabular-nums lining-nums;font-weight:var(--fw-semibold);font-size:var(--fs-body);display:flex;flex-direction:column;gap:3px;align-items:flex-start}
.zn-price-cell--buy{color:var(--color-buy)}
.zn-price-cell--sell{color:var(--color-sell)}
.zn-price-cell small{font-family:var(--font-body);font-size:10px;color:var(--color-text-muted);font-weight:var(--fw-medium)}
`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-ptable-css")) {
    const s = document.createElement("style");
    s.id = "zn-ptable-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function PriceTable({
  title = "قیمت لحظه‌ای بازار",
  rows = [],
  updateNote = "زنده · هر ۲ دقیقه"
}) {
  inject();
  return /*#__PURE__*/React.createElement("div", {
    className: "zn-ptable"
  }, /*#__PURE__*/React.createElement("div", {
    className: "zn-ptable__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "zn-ptable__title"
  }, title), /*#__PURE__*/React.createElement("span", {
    className: "zn-live"
  }, /*#__PURE__*/React.createElement("span", {
    className: "zn-live__dot",
    "aria-hidden": "true"
  }), updateNote)), /*#__PURE__*/React.createElement("div", {
    className: "zn-ptable__cols"
  }, /*#__PURE__*/React.createElement("span", null, "\u0646\u0648\u0639"), /*#__PURE__*/React.createElement("span", null, "\u062E\u0631\u06CC\u062F \u0645\u0627"), /*#__PURE__*/React.createElement("span", null, "\u0641\u0631\u0648\u0634 \u0645\u0627")), rows.map((r, i) => /*#__PURE__*/React.createElement("div", {
    className: "zn-prow",
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: "zn-prow__name"
  }, r.name, r.spec && /*#__PURE__*/React.createElement("small", null, r.spec)), /*#__PURE__*/React.createElement("span", {
    className: "zn-price-cell zn-price-cell--buy"
  }, /*#__PURE__*/React.createElement("span", null, __ds_scope.toman(r.buy, {
    withSuffix: false
  })), r.buyChange !== undefined && /*#__PURE__*/React.createElement(__ds_scope.PriceChange, {
    value: r.buyChange
  })), /*#__PURE__*/React.createElement("span", {
    className: "zn-price-cell zn-price-cell--sell"
  }, /*#__PURE__*/React.createElement("span", null, __ds_scope.toman(r.sell, {
    withSuffix: false
  })), /*#__PURE__*/React.createElement("small", null, "\u062A\u0648\u0645\u0627\u0646")))));
}
Object.assign(__ds_scope, { PriceTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/pricing/PriceTable.jsx", error: String((e && e.message) || e) }); }

// components/pricing/PriceTicker.jsx
try { (() => {
const CSS = `
.zn-ticker{display:flex;align-items:stretch;background:var(--color-surface-inverse);color:var(--color-text-inverse);font-family:var(--font-body);overflow:hidden}
.zn-ticker__label{display:flex;align-items:center;gap:6px;padding:0 var(--space-4);background:rgba(0,0,0,.18);font-size:var(--fs-caption);font-weight:var(--fw-semibold);white-space:nowrap;flex:0 0 auto}
.zn-ticker__dot{width:7px;height:7px;border-radius:50%;background:var(--color-buy)}
.zn-ticker__view{flex:1;overflow:hidden;position:relative}
.zn-ticker__track{display:flex;gap:var(--space-6);align-items:center;padding:var(--space-3) var(--space-5);width:max-content;animation:zn-marquee 40s linear infinite}
.zn-ticker:hover .zn-ticker__track{animation-play-state:paused}
.zn-ticker__item{display:inline-flex;align-items:center;gap:8px;white-space:nowrap}
.zn-ticker__name{font-size:var(--fs-body-sm);color:rgba(255,255,255,.72)}
.zn-ticker__val{font-family:var(--font-price);font-variant-numeric:tabular-nums;font-weight:var(--fw-semibold);font-size:var(--fs-body-sm)}
@keyframes zn-marquee{from{transform:translateX(-50%)}to{transform:translateX(0)}}
`;
function inject() {
  if (typeof document !== "undefined" && !document.getElementById("zn-ticker-css")) {
    const s = document.createElement("style");
    s.id = "zn-ticker-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function PriceTicker({
  items = [],
  label = "بازار زنده"
}) {
  inject();
  const loop = [...items, ...items];
  return /*#__PURE__*/React.createElement("div", {
    className: "zn-ticker",
    role: "marquee",
    "aria-label": label
  }, /*#__PURE__*/React.createElement("span", {
    className: "zn-ticker__label"
  }, /*#__PURE__*/React.createElement("span", {
    className: "zn-ticker__dot",
    "aria-hidden": "true"
  }), label), /*#__PURE__*/React.createElement("div", {
    className: "zn-ticker__view"
  }, /*#__PURE__*/React.createElement("div", {
    className: "zn-ticker__track"
  }, loop.map((it, i) => /*#__PURE__*/React.createElement("span", {
    className: "zn-ticker__item",
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: "zn-ticker__name"
  }, it.name), /*#__PURE__*/React.createElement("span", {
    className: "zn-ticker__val"
  }, __ds_scope.toman(it.price, {
    withSuffix: false
  })), it.change !== undefined && /*#__PURE__*/React.createElement(__ds_scope.PriceChange, {
    value: it.change,
    bare: true
  }))))));
}
Object.assign(__ds_scope, { PriceTicker });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/pricing/PriceTicker.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketplace/App.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const NS = window.ZarnamaGoldDesignSystem_e4dd01;
const {
  TopBar,
  PriceTicker,
  PriceTable,
  PriceChange,
  PriceLockCountdown,
  ProductCard,
  QuantityStepper,
  Breadcrumb,
  Tabs,
  Pagination,
  Tag,
  Button,
  IconButton,
  Input,
  OtpInput,
  RadioGroup,
  Badge,
  Alert,
  StatTile,
  WalletCard,
  OrderStepper,
  Toast,
  ToastViewport
} = NS;
const D = window.ZK_DATA;
const FA = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const fa = v => String(v).replace(/[0-9]/g, d => FA[+d]);
const toman = v => fa(String(v).replace(/\B(?=(\d{3})+(?!\d))/g, "٬")) + " تومان";

/* ---------- shared bits ---------- */
const Shield = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.6",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
}), /*#__PURE__*/React.createElement("path", {
  d: "m9 12 2 2 4-4"
}));
const Receipt = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.6",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"
}), /*#__PURE__*/React.createElement("path", {
  d: "M16 8h-6M16 12h-6"
}));
const Clock = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.6",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "10"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 6v6l4 2"
}));
const Truck = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.6",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"
}), /*#__PURE__*/React.createElement("path", {
  d: "M15 18H9M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "17",
  cy: "18",
  r: "2"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "7",
  cy: "18",
  r: "2"
}));
const TRUST_ICONS = [/*#__PURE__*/React.createElement(Shield, null), /*#__PURE__*/React.createElement(Receipt, null), /*#__PURE__*/React.createElement(Clock, null), /*#__PURE__*/React.createElement(Truck, null)];
function TrustRow() {
  return /*#__PURE__*/React.createElement("div", {
    className: "zk-trust",
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 16
    }
  }, D.trust.map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      gap: 12,
      alignItems: "center",
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      padding: "var(--space-4)",
      boxShadow: "var(--shadow-sm)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      flex: "0 0 auto",
      borderRadius: "var(--radius-md)",
      background: "var(--color-accent-subtle)",
      color: "var(--color-accent-active)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 22,
      height: 22
    },
    "aria-hidden": "true"
  }, TRUST_ICONS[i])), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      fontSize: 14,
      color: "var(--color-text-primary)"
    }
  }, t.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-muted)"
    }
  }, t.d)))));
}
const CONTAINER = {
  maxWidth: "var(--container-max)",
  margin: "0 auto",
  padding: "0 var(--container-pad)"
};
function Section({
  title,
  action,
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      ...CONTAINER,
      marginBlock: "var(--space-7)",
      ...style
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "var(--space-5)"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: "var(--fs-h3)",
      fontWeight: 700,
      color: "var(--color-text-primary)"
    }
  }, title), action), children);
}
function Footer() {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: "var(--teal-800)",
      color: "rgba(255,255,255,.7)",
      marginTop: "var(--space-8)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "zk-foot",
    style: {
      ...CONTAINER,
      paddingBlock: "var(--space-7)",
      display: "grid",
      gridTemplateColumns: "1.4fr 1fr 1fr",
      gap: "var(--space-6)"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 900,
      fontSize: 26,
      color: "var(--gold-500)"
    }
  }, "\u0632\u0631\u0646\u0645\u0627"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      lineHeight: 1.9,
      marginTop: 8,
      maxWidth: 320
    }
  }, "\u062E\u0631\u06CC\u062F \u0645\u0637\u0645\u0626\u0646 \u0637\u0644\u0627\u060C \u0633\u06A9\u0647 \u0648 \u0634\u0645\u0634 \u0628\u0627 \u0642\u06CC\u0645\u062A \u0644\u062D\u0638\u0647\u200C\u0627\u06CC\u060C \u062E\u0631\u06CC\u062F \u0627\u0642\u0633\u0627\u0637\u06CC \u0648 \u0636\u0645\u0627\u0646\u062A \u0627\u0635\u0627\u0644\u062A. \u0646\u06CC\u0645\u200C\u0642\u0631\u0646 \u0627\u0639\u062A\u0628\u0627\u0631.")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h5", {
    style: {
      color: "#fff",
      fontSize: 14,
      marginBottom: 12
    }
  }, "\u062F\u0633\u062A\u0631\u0633\u06CC \u0633\u0631\u06CC\u0639"), ["فروشگاه", "قیمت لحظه‌ای", "خرید اقساطی", "مجله"].map(x => /*#__PURE__*/React.createElement("div", {
    key: x,
    style: {
      fontSize: 13,
      paddingBlock: 5
    }
  }, x))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h5", {
    style: {
      color: "#fff",
      fontSize: 14,
      marginBottom: 12
    }
  }, "\u067E\u0634\u062A\u06CC\u0628\u0627\u0646\u06CC"), ["تماس با ما", "سوالات متداول", "ضمانت اصالت", "حریم خصوصی"].map(x => /*#__PURE__*/React.createElement("div", {
    key: x,
    style: {
      fontSize: 13,
      paddingBlock: 5
    }
  }, x)))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "1px solid rgba(255,255,255,.1)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "zk-footbottom",
    style: {
      ...CONTAINER,
      paddingBlock: "var(--space-4)",
      fontSize: 12,
      display: "flex",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 \u06F1\u06F4\u06F0\u06F3 \u0632\u0631\u0646\u0645\u0627 \u2014 \u0647\u0645\u0647 \u062D\u0642\u0648\u0642 \u0645\u062D\u0641\u0648\u0638 \u0627\u0633\u062A."), /*#__PURE__*/React.createElement("span", null, "\u062F\u0627\u0631\u0627\u06CC \u067E\u0631\u0648\u0627\u0646\u0647 \u06A9\u0633\u0628 \u0627\u062A\u062D\u0627\u062F\u06CC\u0647 \u0637\u0644\u0627 \u0648 \u062C\u0648\u0627\u0647\u0631"))));
}

/* ---------- category glyphs ---------- */
const CAT_ICONS = {
  coin: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "8",
    cy: "8",
    r: "6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M18.09 10.37A6 6 0 1 1 10.34 18M7 6h1v4"
  })),
  melt: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 2.69 17 8a5 5 0 1 1-10 0z"
  })),
  bullion: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 8h12l2 5H4l2-5Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 13h16v5H4z"
  })),
  silver: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "4"
  })),
  jewelry: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 3h12l4 6-10 12L2 9Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M11 3 8 9l4 12 4-12-3-6M2 9h20"
  })),
  install: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "5",
    width: "20",
    height: "14",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2 10h20"
  }))
};

/* ---------- Home / live pricing (Dolaram-style, light-first) ---------- */
function Home({
  go,
  addToCart,
  onOpen
}) {
  const cats = [{
    t: "سکه",
    i: "coin"
  }, {
    t: "آبشده",
    i: "melt"
  }, {
    t: "شمش طلا",
    i: "bullion"
  }, {
    t: "نقره",
    i: "silver"
  }, {
    t: "زیورآلات",
    i: "jewelry"
  }, {
    t: "خرید اقساطی",
    i: "install"
  }];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...CONTAINER,
      marginTop: "var(--space-6)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "zk-hero",
    style: {
      display: "grid",
      gridTemplateColumns: "1.05fr .95fr",
      borderRadius: "var(--radius-xl)",
      overflow: "hidden",
      border: "1px solid var(--color-border)",
      boxShadow: "var(--shadow-md)",
      background: "linear-gradient(135deg, var(--gold-50) 0%, var(--color-surface) 60%)",
      minHeight: 400
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-8) var(--space-7)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      alignSelf: "flex-start",
      fontSize: 13,
      fontWeight: 600,
      color: "var(--color-accent-active)",
      background: "var(--color-accent-subtle)",
      border: "1px solid var(--color-accent-border)",
      borderRadius: "var(--radius-pill)",
      padding: "6px 14px",
      marginBottom: 20
    }
  }, "\u0646\u06CC\u0645\u200C\u0642\u0631\u0646 \u062A\u062C\u0631\u0628\u0647 \u062F\u0631 \u0628\u0627\u0632\u0627\u0631 \u0637\u0644\u0627"), /*#__PURE__*/React.createElement("h1", {
    className: "zk-hero-h1",
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 48,
      fontWeight: 900,
      lineHeight: 1.25,
      margin: 0,
      color: "var(--color-text-primary)"
    }
  }, "\u0637\u0644\u0627 \u0631\u0627 \u0633\u0627\u062F\u0647\u060C \u0634\u0641\u0627\u0641", /*#__PURE__*/React.createElement("br", null), "\u0648 \u0645\u0637\u0645\u0626\u0646 \u0628\u062E\u0631\u06CC\u062F"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 17,
      lineHeight: 1.85,
      color: "var(--color-text-secondary)",
      margin: "18px 0 28px",
      maxWidth: 440
    }
  }, "\u062E\u0631\u06CC\u062F \u0622\u0628\u200C\u0634\u062F\u0647\u060C \u0633\u06A9\u0647 \u0648 \u0634\u0645\u0634 \u0628\u0627 \u0642\u06CC\u0645\u062A\u200C\u06AF\u0630\u0627\u0631\u06CC \u0644\u062D\u0638\u0647\u200C\u0627\u06CC\u060C \u0627\u0645\u06A9\u0627\u0646 \u062E\u0631\u06CC\u062F \u0627\u0642\u0633\u0627\u0637\u06CC \u0648 \u062A\u062D\u0648\u06CC\u0644 \u0628\u06CC\u0645\u0647\u200C\u0634\u062F\u0647 \u062F\u0631\u0628 \u0645\u0646\u0632\u0644."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "gold",
    size: "lg",
    onClick: () => go("listing")
  }, "\u0648\u0631\u0648\u062F \u0628\u0647 \u0641\u0631\u0648\u0634\u06AF\u0627\u0647"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "lg",
    onClick: () => go("login")
  }, "\u0648\u0631\u0648\u062F | \u062B\u0628\u062A\u200C\u0646\u0627\u0645"))), /*#__PURE__*/React.createElement("div", {
    className: "zk-hero-img",
    style: {
      position: "relative",
      background: "radial-gradient(130% 130% at 70% 25%, var(--gold-200), var(--gold-100) 45%, var(--warm-100))",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--color-accent-active)",
      fontSize: 14,
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: .7
    }
  }, "\u062A\u0635\u0648\u06CC\u0631 \u0634\u0627\u062E\u0635 \u2014 \u0637\u0644\u0627 \u0648 \u0633\u06A9\u0647")))), /*#__PURE__*/React.createElement(Section, {
    title: "\u062E\u0631\u06CC\u062F \u0628\u0631 \u0627\u0633\u0627\u0633 \u062F\u0633\u062A\u0647",
    style: {
      marginTop: "var(--space-7)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "zk-cats",
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(6,1fr)",
      gap: 14
    }
  }, cats.map(c => /*#__PURE__*/React.createElement("button", {
    key: c.t,
    onClick: () => go("listing"),
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      padding: "var(--space-5) var(--space-3)",
      boxShadow: "var(--shadow-sm)",
      cursor: "pointer",
      fontFamily: "var(--font-body)",
      transition: "box-shadow var(--transition-base),transform var(--transition-base)"
    },
    onMouseEnter: e => {
      e.currentTarget.style.boxShadow = "var(--shadow-md)";
      e.currentTarget.style.transform = "translateY(-2px)";
    },
    onMouseLeave: e => {
      e.currentTarget.style.boxShadow = "var(--shadow-sm)";
      e.currentTarget.style.transform = "none";
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 60,
      height: 60,
      borderRadius: "50%",
      background: "var(--color-accent-subtle)",
      color: "var(--color-accent-active)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 26,
      height: 26
    },
    "aria-hidden": "true"
  }, CAT_ICONS[c.i])), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: "var(--color-text-primary)"
    }
  }, c.t))))), /*#__PURE__*/React.createElement(Section, {
    title: "\u0642\u06CC\u0645\u062A \u0644\u062D\u0638\u0647\u200C\u0627\u06CC \u0628\u0627\u0632\u0627\u0631",
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      onClick: () => go("listing")
    }, "\u0645\u0634\u0627\u0647\u062F\u0647 \u0641\u0631\u0648\u0634\u06AF\u0627\u0647")
  }, /*#__PURE__*/React.createElement("div", {
    className: "zk-live",
    style: {
      display: "grid",
      gridTemplateColumns: "1.5fr 1fr",
      gap: "var(--space-5)",
      alignItems: "stretch"
    }
  }, /*#__PURE__*/React.createElement(PriceTable, {
    rows: D.market.slice(0, 5)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "linear-gradient(160deg, var(--teal-700), var(--teal-900))",
      color: "#fff",
      borderRadius: "var(--radius-lg)",
      padding: "var(--space-6)",
      boxShadow: "var(--shadow-md)",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      insetBlockStart: -40,
      insetInlineStart: -40,
      width: 160,
      height: 160,
      borderRadius: "50%",
      background: "var(--gold-500)",
      opacity: .12
    },
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--gold-400)",
      fontWeight: 600,
      position: "relative"
    }
  }, "\u0637\u0644\u0627\u06CC \u062F\u06CC\u062C\u06CC\u062A\u0627\u0644"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 24,
      fontWeight: 700,
      margin: "8px 0 10px",
      position: "relative"
    }
  }, "\u06AF\u0631\u0645 \u0628\u0647 \u06AF\u0631\u0645 \u0637\u0644\u0627 \u062C\u0645\u0639 \u06A9\u0646\u06CC\u062F"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      lineHeight: 1.85,
      color: "rgba(255,255,255,.78)",
      position: "relative",
      marginBottom: 18
    }
  }, "\u0627\u0632 \u06F1\u06F0\u06F0 \u0647\u0632\u0627\u0631 \u062A\u0648\u0645\u0627\u0646 \u0634\u0631\u0648\u0639 \u06A9\u0646\u06CC\u062F\u061B \u0642\u06CC\u0645\u062A \u0647\u0646\u06AF\u0627\u0645 \u062E\u0631\u06CC\u062F \u06F5 \u062F\u0642\u06CC\u0642\u0647 \u0628\u0631\u0627\u06CC\u062A\u0627\u0646 \u0642\u0641\u0644 \u0645\u06CC\u200C\u0634\u0648\u062F."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 18,
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement(PriceLockCountdown, {
    seconds: 300
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "gold",
    size: "lg",
    block: true,
    onClick: () => go("listing")
  }, "\u062E\u0631\u06CC\u062F \u0637\u0644\u0627\u06CC \u0622\u0628\u200C\u0634\u062F\u0647"))))), /*#__PURE__*/React.createElement(Section, {
    style: {
      marginTop: "var(--space-6)"
    }
  }, /*#__PURE__*/React.createElement(TrustRow, null)), /*#__PURE__*/React.createElement(Section, {
    title: "\u067E\u0631\u0641\u0631\u0648\u0634\u200C\u062A\u0631\u06CC\u0646\u200C\u0647\u0627",
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      onClick: () => go("listing")
    }, "\u0645\u0634\u0627\u0647\u062F\u0647 \u0647\u0645\u0647")
  }, /*#__PURE__*/React.createElement("div", {
    className: "zk-products",
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 20
    }
  }, D.products.slice(0, 4).map(p => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    style: {
      cursor: "pointer"
    },
    onClick: () => onOpen(p)
  }, /*#__PURE__*/React.createElement(ProductCard, _extends({}, p, {
    onAdd: e => {
      e.stopPropagation();
      addToCart(p);
    },
    onFavorite: e => e.stopPropagation()
  })))))), /*#__PURE__*/React.createElement(Section, {
    style: {
      marginTop: "var(--space-2)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "zk-promo",
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "var(--space-5)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "linear-gradient(140deg, var(--teal-800), var(--teal-600))",
      color: "#fff",
      borderRadius: "var(--radius-lg)",
      padding: "var(--space-6) var(--space-7)",
      boxShadow: "var(--shadow-md)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      minHeight: 160
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--gold-400)",
      fontWeight: 600
    }
  }, "\u0648\u06CC\u0698\u0647 \u0627\u0639\u0636\u0627"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 22,
      fontWeight: 700,
      margin: "8px 0 6px"
    }
  }, "\u062E\u0631\u06CC\u062F \u0627\u0642\u0633\u0627\u0637\u06CC \u0633\u06A9\u0647 \u0648 \u0637\u0644\u0627"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: "rgba(255,255,255,.8)",
      marginBottom: 16,
      maxWidth: 320
    }
  }, "\u0628\u0627 \u062A\u0623\u06CC\u06CC\u062F \u0647\u0648\u06CC\u062A\u060C \u062A\u0627 \u06F1\u06F2 \u0642\u0633\u0637 \u0628\u062F\u0648\u0646 \u067E\u06CC\u0634\u200C\u067E\u0631\u062F\u0627\u062E\u062A."), /*#__PURE__*/React.createElement(Button, {
    variant: "gold",
    onClick: () => go("listing"),
    style: {
      alignSelf: "flex-start"
    }
  }, "\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0628\u06CC\u0634\u062A\u0631")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "linear-gradient(140deg, var(--gold-100), var(--color-surface))",
      color: "var(--color-text-primary)",
      borderRadius: "var(--radius-lg)",
      padding: "var(--space-6) var(--space-7)",
      boxShadow: "var(--shadow-sm)",
      border: "1px solid var(--color-border)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      minHeight: 160
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--color-accent-active)",
      fontWeight: 600
    }
  }, "\u0636\u0645\u0627\u0646\u062A \u0627\u0635\u0627\u0644\u062A"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 22,
      fontWeight: 700,
      margin: "8px 0 6px"
    }
  }, "\u0641\u0627\u06A9\u062A\u0648\u0631 \u0631\u0633\u0645\u06CC \u0648 \u0628\u0627\u0632\u062E\u0631\u06CC\u062F \u062A\u0636\u0645\u06CC\u0646\u06CC"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: "var(--color-text-secondary)",
      marginBottom: 16,
      maxWidth: 320
    }
  }, "\u0647\u0631 \u062E\u0631\u06CC\u062F \u0628\u0627 \u06A9\u0627\u0631\u0634\u0646\u0627\u0633\u06CC \u0639\u06CC\u0627\u0631 \u0648 \u0622\u0628\u062F\u0647\u06CC \u062A\u0636\u0645\u06CC\u0646\u200C\u0634\u062F\u0647 \u0647\u0645\u0631\u0627\u0647 \u0627\u0633\u062A."), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: () => go("listing"),
    style: {
      alignSelf: "flex-start"
    }
  }, "\u0645\u0634\u0627\u0647\u062F\u0647 \u0636\u0645\u0627\u0646\u062A\u200C\u0647\u0627")))), /*#__PURE__*/React.createElement(Section, {
    title: "\u062C\u062F\u06CC\u062F\u062A\u0631\u06CC\u0646\u200C\u0647\u0627",
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      onClick: () => go("listing")
    }, "\u0645\u0634\u0627\u0647\u062F\u0647 \u0647\u0645\u0647")
  }, /*#__PURE__*/React.createElement("div", {
    className: "zk-products",
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 20
    }
  }, D.products.slice(4, 8).map(p => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    style: {
      cursor: "pointer"
    },
    onClick: () => onOpen(p)
  }, /*#__PURE__*/React.createElement(ProductCard, _extends({}, p, {
    onAdd: e => {
      e.stopPropagation();
      addToCart(p);
    },
    onFavorite: e => e.stopPropagation()
  })))))), /*#__PURE__*/React.createElement(Footer, null));
}

/* ---------- Listing ---------- */
function Listing({
  go,
  addToCart,
  onOpen
}) {
  const [f, setF] = React.useState("همه");
  const [sort, setSort] = React.useState("");
  const [page, setPage] = React.useState(1);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...CONTAINER,
      paddingTop: "var(--space-5)"
    }
  }, /*#__PURE__*/React.createElement(Breadcrumb, {
    items: [{
      label: "خانه",
      href: "#"
    }, {
      label: "فروشگاه"
    }]
  })), /*#__PURE__*/React.createElement(Section, {
    title: "\u0641\u0631\u0648\u0634\u06AF\u0627\u0647 \u0637\u0644\u0627 \u0648 \u0633\u06A9\u0647",
    style: {
      marginTop: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      flexWrap: "wrap",
      marginBottom: 24,
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      padding: "var(--space-4)",
      boxShadow: "var(--shadow-sm)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, D.filters.map(x => /*#__PURE__*/React.createElement(Tag, {
    key: x,
    selected: f === x,
    onClick: () => setF(x)
  }, x))), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 200
    }
  }, /*#__PURE__*/React.createElement(NS.Select, {
    options: ["مرتب‌سازی: پیش‌فرض", "ارزان‌ترین", "گران‌ترین", "جدیدترین"],
    value: sort,
    placeholder: "\u0645\u0631\u062A\u0628\u200C\u0633\u0627\u0632\u06CC",
    onChange: e => setSort(e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    className: "zk-products",
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 20
    }
  }, D.products.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    style: {
      cursor: "pointer"
    },
    onClick: () => onOpen(p)
  }, /*#__PURE__*/React.createElement(ProductCard, _extends({}, p, {
    onAdd: e => {
      e.stopPropagation();
      addToCart(p);
    },
    onFavorite: e => e.stopPropagation()
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      marginTop: 32
    }
  }, /*#__PURE__*/React.createElement(Pagination, {
    page: page,
    total: 6,
    onChange: setPage
  }))), /*#__PURE__*/React.createElement(Footer, null));
}

/* ---------- Detail ---------- */
function Detail({
  product,
  go,
  addToCart
}) {
  const p = product || D.products[0];
  const [tab, setTab] = React.useState("specs");
  const [qty, setQty] = React.useState(1);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...CONTAINER,
      paddingTop: "var(--space-5)"
    }
  }, /*#__PURE__*/React.createElement(Breadcrumb, {
    items: [{
      label: "خانه",
      href: "#"
    }, {
      label: "فروشگاه",
      href: "#"
    }, {
      label: p.title
    }]
  })), /*#__PURE__*/React.createElement(Section, {
    style: {
      marginTop: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "zk-detail",
    style: {
      display: "grid",
      gridTemplateColumns: ".9fr 1.1fr",
      gap: "var(--space-7)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: "1/1",
      borderRadius: "var(--radius-xl)",
      background: "radial-gradient(120% 120% at 30% 20%, var(--gold-100), var(--warm-100))",
      border: "1px solid var(--color-border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--color-text-muted)",
      fontSize: 14
    }
  }, "\u062A\u0635\u0648\u06CC\u0631 \u0645\u062D\u0635\u0648\u0644"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 12
    }
  }, p.discountPct ? /*#__PURE__*/React.createElement(Badge, {
    variant: "solid-danger"
  }, fa(p.discountPct), "\u066A \u062A\u062E\u0641\u06CC\u0641") : null, p.installment && /*#__PURE__*/React.createElement(Badge, {
    variant: "gold"
  }, "\u062E\u0631\u06CC\u062F \u0627\u0642\u0633\u0627\u0637\u06CC"), /*#__PURE__*/React.createElement(Badge, {
    variant: "success",
    dot: true
  }, "\u0645\u0648\u062C\u0648\u062F")), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 30,
      fontWeight: 700,
      color: "var(--color-text-primary)",
      lineHeight: 1.4,
      margin: "0 0 12px"
    }
  }, p.title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 20
    }
  }, p.specs.map(s => /*#__PURE__*/React.createElement("span", {
    key: s,
    style: {
      fontSize: 13,
      color: "var(--color-text-secondary)",
      background: "var(--color-surface-sunken)",
      borderRadius: "var(--radius-sm)",
      padding: "5px 12px"
    }
  }, s))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 12,
      marginBottom: 6
    }
  }, p.wasPrice && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-price)",
      fontSize: 16,
      color: "var(--color-text-muted)",
      textDecoration: "line-through"
    }
  }, fa(String(p.wasPrice).replace(/\B(?=(\d{3})+(?!\d))/g, "٬"))), /*#__PURE__*/React.createElement(PriceChange, {
    value: p.discountPct ? -p.discountPct : 0.7
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-price)",
      fontVariantNumeric: "tabular-nums",
      fontWeight: 700,
      fontSize: 40,
      color: "var(--color-accent-active)"
    }
  }, toman(p.price)), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "16px 0"
    }
  }, /*#__PURE__*/React.createElement(PriceLockCountdown, {
    seconds: 296
  })), /*#__PURE__*/React.createElement("div", {
    className: "zk-detailbuy",
    style: {
      display: "flex",
      gap: 12,
      alignItems: "center",
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement(QuantityStepper, {
    value: qty,
    min: 1,
    max: 10,
    onChange: setQty
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "gold",
    size: "lg",
    block: true,
    onClick: () => addToCart(p, qty)
  }, "\u0627\u0641\u0632\u0648\u062F\u0646 \u0628\u0647 \u0633\u0628\u062F \u062E\u0631\u06CC\u062F")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement(Alert, {
    variant: "info"
  }, "\u0642\u06CC\u0645\u062A \u0644\u062D\u0638\u0647\u200C\u0627\u06CC \u0627\u0633\u062A \u0648 \u0647\u0631 \u06F2 \u062F\u0642\u06CC\u0642\u0647 \u0628\u0647\u200C\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u0645\u06CC\u200C\u0634\u0648\u062F\u061B \u0628\u0627 \u062B\u0628\u062A \u0633\u0641\u0627\u0631\u0634\u060C \u0642\u06CC\u0645\u062A \u062A\u0627 \u06F5 \u062F\u0642\u06CC\u0642\u0647 \u0628\u0631\u0627\u06CC \u0634\u0645\u0627 \u0642\u0641\u0644 \u0645\u06CC\u200C\u06AF\u0631\u062F\u062F.")))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "var(--space-7)"
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: setTab,
    items: [{
      key: "specs",
      label: "مشخصات"
    }, {
      key: "reviews",
      label: "دیدگاه‌ها",
      count: "۲۴"
    }, {
      key: "faq",
      label: "پرسش‌ها"
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 20,
      color: "var(--color-text-secondary)",
      lineHeight: 1.9,
      maxWidth: 700
    }
  }, tab === "specs" && /*#__PURE__*/React.createElement("p", null, "\u0627\u06CC\u0646 \u0645\u062D\u0635\u0648\u0644 \u0628\u0627 \u06A9\u0627\u0631\u0634\u0646\u0627\u0633\u06CC \u062F\u0642\u06CC\u0642 \u0639\u06CC\u0627\u0631 \u0648 \u0648\u0632\u0646\u060C \u0647\u0645\u0631\u0627\u0647 \u0628\u0627 \u0641\u0627\u06A9\u062A\u0648\u0631 \u0631\u0633\u0645\u06CC \u0648 \u0636\u0645\u0627\u0646\u062A \u0627\u0635\u0627\u0644\u062A \u0639\u0631\u0636\u0647 \u0645\u06CC\u200C\u0634\u0648\u062F. \u0622\u0628\u062F\u0647\u06CC \u0648 \u0628\u0627\u0632\u062E\u0631\u06CC\u062F \u062A\u0636\u0645\u06CC\u0646\u200C\u0634\u062F\u0647 \u0627\u0633\u062A."), tab === "reviews" && /*#__PURE__*/React.createElement("p", null, "\u06F2\u06F4 \u062F\u06CC\u062F\u06AF\u0627\u0647 \u062B\u0628\u062A\u200C\u0634\u062F\u0647 \u2014 \u0645\u06CC\u0627\u0646\u06AF\u06CC\u0646 \u0627\u0645\u062A\u06CC\u0627\u0632 \u06F4\u066B\u06F8 \u0627\u0632 \u06F5. \u062E\u0631\u06CC\u062F\u0627\u0631\u0627\u0646 \u0627\u0632 \u0628\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC \u0627\u0645\u0646 \u0648 \u062A\u062D\u0648\u06CC\u0644 \u0628\u0647\u200C\u0645\u0648\u0642\u0639 \u0631\u0636\u0627\u06CC\u062A \u062F\u0627\u0634\u062A\u0647\u200C\u0627\u0646\u062F."), tab === "faq" && /*#__PURE__*/React.createElement("p", null, "\u0622\u06CC\u0627 \u0627\u0645\u06A9\u0627\u0646 \u0628\u0627\u0632\u062E\u0631\u06CC\u062F \u0648\u062C\u0648\u062F \u062F\u0627\u0631\u062F\u061F \u0628\u0644\u0647\u060C \u0628\u0627\u0632\u062E\u0631\u06CC\u062F \u0628\u0631 \u0627\u0633\u0627\u0633 \u0642\u06CC\u0645\u062A \u0644\u062D\u0638\u0647\u200C\u0627\u06CC \u0628\u0627\u0632\u0627\u0631 \u0648 \u0628\u0627 \u0627\u0631\u0627\u0626\u0647 \u0641\u0627\u06A9\u062A\u0648\u0631 \u0627\u0646\u062C\u0627\u0645 \u0645\u06CC\u200C\u0634\u0648\u062F.")))), /*#__PURE__*/React.createElement(Footer, null));
}

/* ---------- Cart / checkout ---------- */
function Cart({
  cart,
  setQty,
  remove,
  go
}) {
  const [pay, setPay] = React.useState("wallet");
  const total = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const empty = cart.length === 0;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Section, {
    title: "\u0633\u0628\u062F \u062E\u0631\u06CC\u062F",
    style: {
      marginTop: "var(--space-5)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement(OrderStepper, {
    current: 0,
    steps: ["سبد خرید", "پرداخت", "آماده‌سازی", "ارسال", "تحویل"]
  })), empty ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "var(--space-8)",
      background: "var(--color-surface)",
      borderRadius: "var(--radius-lg)",
      border: "1px solid var(--color-border)"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      color: "var(--color-text-muted)",
      marginBottom: 16
    }
  }, "\u0633\u0628\u062F \u062E\u0631\u06CC\u062F \u0634\u0645\u0627 \u062E\u0627\u0644\u06CC \u0627\u0633\u062A."), /*#__PURE__*/React.createElement(Button, {
    variant: "gold",
    onClick: () => go("listing")
  }, "\u0631\u0641\u062A\u0646 \u0628\u0647 \u0641\u0631\u0648\u0634\u06AF\u0627\u0647")) : /*#__PURE__*/React.createElement("div", {
    className: "zk-cart",
    style: {
      display: "grid",
      gridTemplateColumns: "1.6fr .9fr",
      gap: "var(--space-6)",
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, cart.map(l => /*#__PURE__*/React.createElement("div", {
    key: l.id,
    className: "zk-cartline",
    style: {
      display: "flex",
      gap: 16,
      alignItems: "center",
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      padding: "var(--space-4)",
      boxShadow: "var(--shadow-sm)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 72,
      height: 72,
      borderRadius: "var(--radius-md)",
      background: "radial-gradient(120% 120% at 30% 20%, var(--gold-100), var(--warm-100))",
      flex: "0 0 auto"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      color: "var(--color-text-primary)"
    }
  }, l.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-muted)",
      marginTop: 4
    }
  }, l.specs.join(" · "))), /*#__PURE__*/React.createElement(QuantityStepper, {
    size: "sm",
    value: l.qty,
    min: 1,
    max: 10,
    onChange: q => setQty(l.id, q)
  }), /*#__PURE__*/React.createElement("div", {
    className: "zk-cartline-price",
    style: {
      fontFamily: "var(--font-price)",
      fontVariantNumeric: "tabular-nums",
      fontWeight: 700,
      color: "var(--color-accent-active)",
      minWidth: 130,
      textAlign: "start"
    }
  }, toman(l.price * l.qty)), /*#__PURE__*/React.createElement(IconButton, {
    size: "sm",
    label: "\u062D\u0630\u0641",
    onClick: () => remove(l.id),
    icon: /*#__PURE__*/React.createElement("svg", {
      width: "18",
      height: "18",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
    }))
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      padding: "var(--space-5)",
      boxShadow: "var(--shadow-sm)",
      position: "sticky",
      top: 16
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 18,
      fontWeight: 700,
      marginBottom: 16
    }
  }, "\u062E\u0644\u0627\u0635\u0647 \u0633\u0641\u0627\u0631\u0634"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      marginBottom: 16
    }
  }, "\u0631\u0648\u0634 \u067E\u0631\u062F\u0627\u062E\u062A"), /*#__PURE__*/React.createElement(RadioGroup, {
    name: "pay",
    value: pay,
    onChange: setPay,
    variant: "card",
    options: [{
      value: "wallet",
      label: "کیف پول",
      description: "موجودی: ۴٬۲۰۰٬۰۰۰ تومان"
    }, {
      value: "gateway",
      label: "درگاه بانکی"
    }, {
      value: "install",
      label: "خرید اقساطی",
      description: "با تأیید هویت"
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "1px solid var(--color-divider)",
      margin: "18px 0",
      paddingTop: 14,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-text-secondary)"
    }
  }, "\u0645\u0628\u0644\u063A \u0642\u0627\u0628\u0644 \u067E\u0631\u062F\u0627\u062E\u062A"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-price)",
      fontVariantNumeric: "tabular-nums",
      fontWeight: 700,
      fontSize: 22,
      color: "var(--color-accent-active)"
    }
  }, toman(total))), /*#__PURE__*/React.createElement(Button, {
    variant: "gold",
    size: "lg",
    block: true,
    onClick: () => go("done")
  }, "\u062A\u0623\u06CC\u06CC\u062F \u0648 \u067E\u0631\u062F\u0627\u062E\u062A")))), /*#__PURE__*/React.createElement(Footer, null));
}

/* ---------- OTP login ---------- */
function Login({
  go
}) {
  const [step, setStep] = React.useState("phone");
  const [phone, setPhone] = React.useState("");
  const [code, setCode] = React.useState("");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...CONTAINER,
      display: "flex",
      justifyContent: "center",
      paddingBlock: "var(--space-8)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 420,
      maxWidth: "100%",
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-xl)",
      padding: "var(--space-7)",
      boxShadow: "var(--shadow-md)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 900,
      fontSize: 30,
      color: "var(--gold-600)",
      textAlign: "center",
      marginBottom: 6
    }
  }, "\u0632\u0631\u0646\u0645\u0627"), step === "phone" ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 20,
      fontWeight: 700,
      textAlign: "center",
      marginBottom: 8
    }
  }, "\u0648\u0631\u0648\u062F | \u062B\u0628\u062A\u200C\u0646\u0627\u0645"), /*#__PURE__*/React.createElement("p", {
    style: {
      textAlign: "center",
      color: "var(--color-text-muted)",
      fontSize: 14,
      marginBottom: 24
    }
  }, "\u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06CC\u0644 \u062E\u0648\u062F \u0631\u0627 \u0648\u0627\u0631\u062F \u06A9\u0646\u06CC\u062F\u061B \u06A9\u062F \u062A\u0623\u06CC\u06CC\u062F \u067E\u06CC\u0627\u0645\u06A9 \u0645\u06CC\u200C\u0634\u0648\u062F."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "\u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06CC\u0644",
    placeholder: "\u06F0\u06F9\u06F1\u06F2 \u06F3\u06F4\u06F5 \u06F6\u06F7\u06F8\u06F9",
    inputMode: "numeric",
    value: phone,
    onChange: e => setPhone(e.target.value)
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "gold",
    size: "lg",
    block: true,
    onClick: () => setStep("code")
  }, "\u062F\u0631\u06CC\u0627\u0641\u062A \u06A9\u062F \u062A\u0623\u06CC\u06CC\u062F")) : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 20,
      fontWeight: 700,
      textAlign: "center",
      marginBottom: 8
    }
  }, "\u06A9\u062F \u062A\u0623\u06CC\u06CC\u062F \u0631\u0627 \u0648\u0627\u0631\u062F \u06A9\u0646\u06CC\u062F"), /*#__PURE__*/React.createElement("p", {
    style: {
      textAlign: "center",
      color: "var(--color-text-muted)",
      fontSize: 14,
      marginBottom: 24
    }
  }, "\u06A9\u062F \u06F5 \u0631\u0642\u0645\u06CC \u0628\u0647 \u0634\u0645\u0627\u0631\u0647 ", phone || "۰۹۱۲۳۴۵۶۷۸۹", " \u067E\u06CC\u0627\u0645\u06A9 \u0634\u062F."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(OtpInput, {
    length: 5,
    value: code,
    onChange: setCode
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "gold",
    size: "lg",
    block: true,
    disabled: code.length < 5,
    onClick: () => go("home")
  }, "\u0648\u0631\u0648\u062F \u0628\u0647 \u062D\u0633\u0627\u0628"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    onClick: () => setStep("phone")
  }, "\u0648\u06CC\u0631\u0627\u06CC\u0634 \u0634\u0645\u0627\u0631\u0647")))));
}

/* ---------- App shell ---------- */
function App() {
  const [route, setRoute] = React.useState("home");
  const [product, setProduct] = React.useState(null);
  const [cart, setCart] = React.useState([]);
  const [toast, setToast] = React.useState(null);
  const go = r => {
    setRoute(r);
    window.scrollTo(0, 0);
  };
  const openDetail = p => {
    setProduct(p);
    go("detail");
  };
  const addToCart = (p, qty = 1) => {
    setCart(c => {
      const ex = c.find(l => l.id === p.id);
      if (ex) return c.map(l => l.id === p.id ? {
        ...l,
        qty: l.qty + qty
      } : l);
      return [...c, {
        ...p,
        qty
      }];
    });
    setToast("«" + p.title + "» به سبد اضافه شد");
    setTimeout(() => setToast(null), 3000);
  };
  const setQty = (id, q) => setCart(c => c.map(l => l.id === id ? {
    ...l,
    qty: q
  } : l));
  const remove = id => setCart(c => c.filter(l => l.id !== id));
  const cartCount = cart.reduce((s, l) => s + l.qty, 0);
  const NAV = [{
    key: "home",
    label: "خانه"
  }, {
    key: "listing",
    label: "فروشگاه"
  }, {
    key: "blog",
    label: "مجله"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "var(--color-bg)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 1100
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    brand: "\u0632\u0631\u0646\u0645\u0627",
    active: route,
    cartCount: cartCount,
    loggedIn: true,
    nav: NAV.map(n => ({
      ...n,
      href: "#"
    })),
    onSearch: () => {}
  }), /*#__PURE__*/React.createElement(PriceTicker, {
    items: D.ticker
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--color-surface)",
      borderBottom: "1px solid var(--color-border)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "zk-navrow",
    style: {
      ...CONTAINER,
      display: "flex",
      gap: 6,
      paddingBlock: 8
    }
  }, NAV.map(n => /*#__PURE__*/React.createElement("button", {
    key: n.key,
    onClick: () => go(n.key === "blog" ? "home" : n.key),
    style: {
      background: route === n.key ? "var(--color-primary-subtle)" : "none",
      color: route === n.key ? "var(--color-primary)" : "var(--color-text-secondary)",
      border: "none",
      borderRadius: "var(--radius-pill)",
      padding: "6px 16px",
      fontFamily: "var(--font-body)",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer"
    }
  }, n.label)), /*#__PURE__*/React.createElement("button", {
    onClick: () => go("cart"),
    style: {
      background: route === "cart" ? "var(--color-primary-subtle)" : "none",
      color: route === "cart" ? "var(--color-primary)" : "var(--color-text-secondary)",
      border: "none",
      borderRadius: "var(--radius-pill)",
      padding: "6px 16px",
      fontFamily: "var(--font-body)",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      marginInlineStart: "auto"
    }
  }, "\u0633\u0628\u062F \u062E\u0631\u06CC\u062F (", fa(cartCount), ")")))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, route === "home" && /*#__PURE__*/React.createElement(Home, {
    go: go,
    addToCart: addToCart,
    onOpen: openDetail
  }), route === "listing" && /*#__PURE__*/React.createElement(Listing, {
    go: go,
    addToCart: addToCart,
    onOpen: openDetail
  }), route === "detail" && /*#__PURE__*/React.createElement(Detail, {
    product: product,
    go: go,
    addToCart: addToCart
  }), route === "cart" && /*#__PURE__*/React.createElement(Cart, {
    cart: cart,
    setQty: setQty,
    remove: remove,
    go: go
  }), route === "done" && /*#__PURE__*/React.createElement(DoneScreen, {
    go: go
  }), route === "login" && /*#__PURE__*/React.createElement(Login, {
    go: go
  })), toast && /*#__PURE__*/React.createElement(ToastViewport, null, /*#__PURE__*/React.createElement(Toast, {
    variant: "success",
    onClose: () => setToast(null)
  }, toast)));
}
function DoneScreen({
  go
}) {
  return /*#__PURE__*/React.createElement(Section, {
    style: {
      marginTop: "var(--space-7)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 560,
      margin: "0 auto",
      textAlign: "center",
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-xl)",
      padding: "var(--space-8)",
      boxShadow: "var(--shadow-md)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 72,
      height: 72,
      borderRadius: "50%",
      background: "var(--color-success-subtle)",
      color: "var(--color-success-hover)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 20px"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "36",
    height: "36",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M20 6 9 17l-5-5"
  }))), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 26,
      fontWeight: 700,
      marginBottom: 10
    }
  }, "\u0633\u0641\u0627\u0631\u0634 \u0634\u0645\u0627 \u062B\u0628\u062A \u0634\u062F"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: "var(--color-text-secondary)",
      lineHeight: 1.9,
      marginBottom: 24
    }
  }, "\u0641\u0627\u06A9\u062A\u0648\u0631 \u0631\u0633\u0645\u06CC \u0635\u0627\u062F\u0631 \u0648 \u0628\u0631\u0627\u06CC \u0634\u0645\u0627 \u067E\u06CC\u0627\u0645\u06A9 \u0634\u062F. \u0633\u0641\u0627\u0631\u0634 \u067E\u0633 \u0627\u0632 \u062A\u0623\u06CC\u06CC\u062F \u067E\u0631\u062F\u0627\u062E\u062A \u0622\u0645\u0627\u062F\u0647\u200C\u0633\u0627\u0632\u06CC \u0645\u06CC\u200C\u0634\u0648\u062F."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(OrderStepper, {
    current: 2,
    steps: ["ثبت سفارش", "پرداخت", "آماده‌سازی", "ارسال", "تحویل"]
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "gold",
    onClick: () => go("home")
  }, "\u0628\u0627\u0632\u06AF\u0634\u062A \u0628\u0647 \u062E\u0627\u0646\u0647")));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketplace/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketplace/data.js
try { (() => {
// Sample marketplace data for the Zarnama UI kit (fake, illustrative).
window.ZK_DATA = {
  ticker: [{
    name: "سکه امامی",
    price: 41250000,
    change: 1.2
  }, {
    name: "نیم سکه",
    price: 23100000,
    change: 0.6
  }, {
    name: "ربع سکه",
    price: 14200000,
    change: -0.3
  }, {
    name: "آبشده (گرم)",
    price: 3820000,
    change: 0.7
  }, {
    name: "طلای ۱۸ (گرم)",
    price: 3510000,
    change: 0.4
  }, {
    name: "دلار",
    price: 582000,
    change: 0.3
  }],
  market: [{
    name: "سکه تمام امامی",
    spec: "طرح جدید",
    buy: 41250000,
    sell: 41800000,
    buyChange: 1.2
  }, {
    name: "سکه بهار آزادی",
    spec: "طرح قدیم",
    buy: 40900000,
    sell: 41450000,
    buyChange: 0.9
  }, {
    name: "نیم سکه بهار آزادی",
    spec: "",
    buy: 23100000,
    sell: 23500000,
    buyChange: 0.6
  }, {
    name: "ربع سکه",
    spec: "",
    buy: 14200000,
    sell: 14550000,
    buyChange: -0.3
  }, {
    name: "طلای آبشده",
    spec: "هر گرم · ۱۸ عیار",
    buy: 3820000,
    sell: 3865000,
    buyChange: 0.7
  }, {
    name: "شمش طلا",
    spec: "۱۰ گرمی · ۹۹۵",
    buy: 38300000,
    sell: 38750000,
    buyChange: 0.5
  }],
  products: [{
    id: "p1",
    title: "سکه تمام بهار آزادی طرح جدید",
    specs: ["۸٫۱۳ گرم", "۹۰۰ عیار"],
    price: 41250000,
    wasPrice: 42000000,
    discountPct: 2,
    installment: true,
    cat: "coin"
  }, {
    id: "p2",
    title: "نیم سکه بهار آزادی",
    specs: ["۴٫۰۶ گرم", "۹۰۰ عیار"],
    price: 23100000,
    installment: true,
    cat: "coin"
  }, {
    id: "p3",
    title: "طلای آبشده تحویلی — هر گرم",
    specs: ["۱۸ عیار", "تحویل فوری"],
    price: 3820000,
    installment: false,
    cat: "melt"
  }, {
    id: "p4",
    title: "شمش طلا ۱۰ گرمی",
    specs: ["۱۰ گرم", "۹۹۵ عیار"],
    price: 38300000,
    installment: true,
    cat: "bullion"
  }, {
    id: "p5",
    title: "ربع سکه بهار آزادی",
    specs: ["۲٫۰۳ گرم", "۹۰۰ عیار"],
    price: 14200000,
    wasPrice: 14500000,
    discountPct: 2,
    installment: false,
    cat: "coin"
  }, {
    id: "p6",
    title: "شمش نقره ۱ کیلوگرمی",
    specs: ["۱۰۰۰ گرم", "۹۹۹ عیار"],
    price: 62500000,
    installment: false,
    cat: "silver"
  }, {
    id: "p7",
    title: "سکه ربع گرمی طلا",
    specs: ["۰٫۲۵ گرم", "۹۰۰ عیار"],
    price: 1650000,
    installment: false,
    cat: "coin"
  }, {
    id: "p8",
    title: "دستبند طلا دست‌ساز",
    specs: ["۱۲٫۴ گرم", "۱۸ عیار"],
    price: 58900000,
    installment: true,
    cat: "jewelry"
  }],
  filters: ["همه", "سکه", "آبشده", "شمش", "نقره", "زیورآلات"],
  trust: [{
    t: "ضمانت اصالت",
    d: "کارشناسی و آبدهی تضمین‌شده"
  }, {
    t: "فاکتور رسمی",
    d: "با مهر و امضای فروشگاه"
  }, {
    t: "نیم‌قرن تجربه",
    d: "اعتبار از سال ۱۳۵۲"
  }, {
    t: "بیمه ارسال",
    d: "تحویل امن درب منزل"
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketplace/data.js", error: String((e && e.message) || e) }); }

__ds_ns.ProductCard = __ds_scope.ProductCard;

__ds_ns.QuantityStepper = __ds_scope.QuantityStepper;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.OrderStepper = __ds_scope.OrderStepper;

__ds_ns.StatTile = __ds_scope.StatTile;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.WalletCard = __ds_scope.WalletCard;

__ds_ns.Alert = __ds_scope.Alert;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.Skeleton = __ds_scope.Skeleton;

__ds_ns.Spinner = __ds_scope.Spinner;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.ToastViewport = __ds_scope.ToastViewport;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.OtpInput = __ds_scope.OtpInput;

__ds_ns.PriceInput = __ds_scope.PriceInput;

__ds_ns.RadioGroup = __ds_scope.RadioGroup;

__ds_ns.SearchField = __ds_scope.SearchField;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Breadcrumb = __ds_scope.Breadcrumb;

__ds_ns.Pagination = __ds_scope.Pagination;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.TopBar = __ds_scope.TopBar;

__ds_ns.PriceChange = __ds_scope.PriceChange;

__ds_ns.PriceLockCountdown = __ds_scope.PriceLockCountdown;

__ds_ns.PriceTable = __ds_scope.PriceTable;

__ds_ns.PriceTicker = __ds_scope.PriceTicker;

})();
