import { a2 as sanitize_props, a3 as spread_props, s as slot, e as escape_html, a4 as attr, a5 as attr_class, a6 as stringify } from "../../chunks/index.js";
import { I as Icon, S as Shield, G as Globe, t as translations } from "../../chunks/i18n.js";
function Key($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.460.1 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    [
      "path",
      {
        "d": "m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"
      }
    ],
    ["path", { "d": "m21 2-9.6 9.6" }],
    ["circle", { "cx": "7.5", "cy": "15.5", "r": "5.5" }]
  ];
  Icon($$renderer, spread_props([
    { name: "key" },
    $$sanitized_props,
    {
      /**
       * @component @name Key
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMTUuNSA3LjUgMi4zIDIuM2ExIDEgMCAwIDAgMS40IDBsMi4xLTIuMWExIDEgMCAwIDAgMC0xLjRMMTkgNCIgLz4KICA8cGF0aCBkPSJtMjEgMi05LjYgOS42IiAvPgogIDxjaXJjbGUgY3g9IjcuNSIgY3k9IjE1LjUiIHI9IjUuNSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/key
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Lock($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.460.1 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    [
      "rect",
      {
        "width": "18",
        "height": "11",
        "x": "3",
        "y": "11",
        "rx": "2",
        "ry": "2"
      }
    ],
    ["path", { "d": "M7 11V7a5 5 0 0 1 10 0v4" }]
  ];
  Icon($$renderer, spread_props([
    { name: "lock" },
    $$sanitized_props,
    {
      /**
       * @component @name Lock
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB3aWR0aD0iMTgiIGhlaWdodD0iMTEiIHg9IjMiIHk9IjExIiByeD0iMiIgcnk9IjIiIC8+CiAgPHBhdGggZD0iTTcgMTFWN2E1IDUgMCAwIDEgMTAgMHY0IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/lock
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let t;
    let masterPassword = "";
    let language = "pt";
    t = translations[language];
    $$renderer2.push(`<div class="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6"><div class="w-full max-w-md flex flex-col gap-8"><div class="flex flex-col items-center gap-4"><div class="w-20 h-20 bg-neo-blue neo-border neo-shadow flex items-center justify-center">`);
    Shield($$renderer2, { size: 48, strokeWidth: 3, class: "text-white" });
    $$renderer2.push(`<!----></div> <h1 class="text-5xl font-black tracking-tighter text-center">FORTIVAULT</h1> <p class="font-mono text-neo-blue font-bold text-xs uppercase tracking-widest">Zero-Knowledge Secure Storage</p></div> <form class="neo-card flex flex-col gap-6 p-8"><div class="flex flex-col gap-2"><h2 class="text-2xl font-black uppercase tracking-tight">${escape_html(t.loginTitle)}</h2> <p class="text-xs font-mono opacity-50">${escape_html(t.loginSubtitle)}</p></div> <div class="flex flex-col gap-2"><label class="font-mono text-[10px] font-bold uppercase opacity-50" for="password">${escape_html(t.masterPassword)}</label> <div class="relative">`);
    Lock($$renderer2, {
      class: "absolute left-4 top-1/2 -translate-y-1/2 text-white/30",
      size: 20
    });
    $$renderer2.push(`<!----> <input id="password" type="password"${attr("value", masterPassword)}${attr_class(`w-full neo-input pl-12 ${stringify("")}`)} placeholder="••••••••••••"/></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> <button type="submit" class="neo-button bg-neo-blue text-white py-4 text-lg flex items-center justify-center gap-2">`);
    Key($$renderer2, { size: 20, strokeWidth: 3 });
    $$renderer2.push(`<!----> ${escape_html(t.unlock)}</button> <div class="flex justify-center gap-4 mt-2"><button type="button" class="text-[10px] font-mono font-bold opacity-50 hover:opacity-100 flex items-center gap-1">`);
    Globe($$renderer2, { size: 12 });
    $$renderer2.push(`<!----> ${escape_html(language.toUpperCase())}</button></div></form> <p class="text-center font-mono text-[10px] opacity-30 uppercase tracking-[0.2em]">AES-256-GCM • RSA-4096 • ARGON2ID</p></div></div>`);
  });
}
export {
  _page as default
};
