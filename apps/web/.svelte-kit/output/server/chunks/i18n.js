import { a2 as sanitize_props, a9 as rest_props, aa as fallback, ab as attributes, ac as clsx, a7 as ensure_array_like, ad as element, s as slot, ae as bind_props, a3 as spread_props } from "./index.js";
/**
 * @license lucide-svelte v0.460.1 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
};
function Icon($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const $$restProps = rest_props($$sanitized_props, [
    "name",
    "color",
    "size",
    "strokeWidth",
    "absoluteStrokeWidth",
    "iconNode"
  ]);
  $$renderer.component(($$renderer2) => {
    let name = fallback($$props["name"], void 0);
    let color = fallback($$props["color"], "currentColor");
    let size = fallback($$props["size"], 24);
    let strokeWidth = fallback($$props["strokeWidth"], 2);
    let absoluteStrokeWidth = fallback($$props["absoluteStrokeWidth"], false);
    let iconNode = fallback($$props["iconNode"], () => [], true);
    const mergeClasses = (...classes) => classes.filter((className, index, array) => {
      return Boolean(className) && array.indexOf(className) === index;
    }).join(" ");
    $$renderer2.push(`<svg${attributes(
      {
        ...defaultAttributes,
        ...$$restProps,
        width: size,
        height: size,
        stroke: color,
        "stroke-width": absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
        class: clsx(mergeClasses("lucide-icon", "lucide", name ? `lucide-${name}` : "", $$sanitized_props.class))
      },
      void 0,
      void 0,
      void 0,
      3
    )}><!--[-->`);
    const each_array = ensure_array_like(iconNode);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let [tag, attrs] = each_array[$$index];
      element($$renderer2, tag, () => {
        $$renderer2.push(`${attributes({ ...attrs }, void 0, void 0, void 0, 3)}`);
      });
    }
    $$renderer2.push(`<!--]--><!--[-->`);
    slot($$renderer2, $$props, "default", {});
    $$renderer2.push(`<!--]--></svg>`);
    bind_props($$props, {
      name,
      color,
      size,
      strokeWidth,
      absoluteStrokeWidth,
      iconNode
    });
  });
}
function Globe($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.460.1 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["circle", { "cx": "12", "cy": "12", "r": "10" }],
    [
      "path",
      { "d": "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" }
    ],
    ["path", { "d": "M2 12h20" }]
  ];
  Icon($$renderer, spread_props([
    { name: "globe" },
    $$sanitized_props,
    {
      /**
       * @component @name Globe
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgLz4KICA8cGF0aCBkPSJNMTIgMmExNC41IDE0LjUgMCAwIDAgMCAyMCAxNC41IDE0LjUgMCAwIDAgMC0yMCIgLz4KICA8cGF0aCBkPSJNMiAxMmgyMCIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/globe
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
function Shield($$renderer, $$props) {
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
        "d": "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
      }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "shield" },
    $$sanitized_props,
    {
      /**
       * @component @name Shield
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjAgMTNjMCA1LTMuNSA3LjUtNy42NiA4Ljk1YTEgMSAwIDAgMS0uNjctLjAxQzcuNSAyMC41IDQgMTggNCAxM1Y2YTEgMSAwIDAgMSAxLTFjMiAwIDQuNS0xLjIgNi4yNC0yLjcyYTEuMTcgMS4xNyAwIDAgMSAxLjUyIDBDMTQuNTEgMy44MSAxNyA1IDE5IDVhMSAxIDAgMCAxIDEgMXoiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/shield
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
const translations = {
  en: {
    title: "FORTIVAULT",
    newSecret: "NEW SECRET",
    vaults: "VAULTS",
    filters: "FILTERS",
    searchPlaceholder: "SEARCH SECRET (EX: AWS, GITHUB...)",
    emptyState: "NO SECRET DETECTED IN THIS VAULT",
    reveal: "REVEAL ON DESKTOP",
    revealing: "EXPIRING...",
    edit: "EDIT",
    save: "SAVE",
    cancel: "CANCEL",
    delete: "DELETE",
    status: "STATUS",
    connected: "DESKTOP_CONNECTED",
    offline: "OFFLINE",
    tags: "TAGS",
    username: "USERNAME",
    url: "URL",
    notes: "NOTES",
    totp: "TOTP CODE",
    metadata: "METADATA",
    details: "SECRET DETAILS",
    autoLockMsg: "Auto-locking in",
    seconds: "s",
    darkMode: "DARK MODE",
    language: "LANGUAGE",
    personal: "Personal",
    department: "Department",
    shared: "Shared",
    allTags: "ALL TAGS",
    admin: "ADMINISTRATION",
    users: "USERS",
    auditTrail: "AUDIT TRAIL",
    inviteUser: "INVITE USER",
    active: "ACTIVE",
    pending: "PENDING_KEY_EXCHANGE",
    deactivated: "DEACTIVATED",
    groups: "GROUPS",
    lastActive: "LAST ACTIVE",
    publicKey: "PUBLIC KEY",
    vaultView: "VIEW VAULT",
    login: "LOGIN",
    password: "PASSWORD",
    masterPassword: "MASTER PASSWORD",
    unlock: "UNLOCK VAULT",
    loginTitle: "SECURE ACCESS",
    loginSubtitle: "ENTER YOUR MASTER PASSWORD TO DECRYPT THE VAULT",
    errorLogin: "INVALID MASTER PASSWORD"
  },
  es: {
    title: "FORTIVAULT",
    newSecret: "NUEVO SECRETO",
    vaults: "BOVEDAS",
    filters: "FILTROS",
    searchPlaceholder: "BUSCAR SECRETO (EJ: AWS, GITHUB...)",
    emptyState: "NO SE DETECTÓ NINGÚN SECRETO EN ESTA BÓVEDA",
    reveal: "REVELAR EN ESCRITORIO",
    revealing: "EXPIRANDO...",
    edit: "EDITAR",
    save: "GUARDAR",
    cancel: "CANCELAR",
    delete: "ELIMINAR",
    status: "ESTADO",
    connected: "ESCRITORIO_CONECTADO",
    offline: "DESCONECTADO",
    tags: "ETIQUETAS",
    username: "USUARIO",
    url: "URL",
    notes: "NOTAS",
    totp: "CÓDIGO TOTP",
    metadata: "METADATOS",
    details: "DETALLES DEL SECRETO",
    autoLockMsg: "Bloqueo automático en",
    seconds: "s",
    darkMode: "MODO OSCURO",
    language: "IDIOMA",
    personal: "Personal",
    department: "Departamento",
    shared: "Compartido",
    allTags: "TODAS LAS ETIQUETAS",
    admin: "ADMINISTRACIÓN",
    users: "USUARIOS",
    auditTrail: "TRAZA DE AUDITORÍA",
    inviteUser: "INVITAR USUARIO",
    active: "ACTIVO",
    pending: "PENDIENTE_KEY_EXCHANGE",
    deactivated: "DESACTIVADO",
    groups: "GRUPOS",
    lastActive: "ÚLTIMA ACTIVIDAD",
    publicKey: "LLAVE PÚBLICA",
    vaultView: "VER BÓVEDA",
    login: "INICIAR SESIÓN",
    password: "CONTRASEÑA",
    masterPassword: "CONTRASEÑA MAESTRA",
    unlock: "DESBLOQUEAR BÓVEDA",
    loginTitle: "ACCESO SEGURO",
    loginSubtitle: "INGRESE SU CONTRASEÑA MAESTRA PARA DESCRIPTOGRAFAR LA BÓVEDA",
    errorLogin: "CONTRASEÑA MAESTRA INVÁLIDA"
  },
  pt: {
    title: "FORTIVAULT",
    newSecret: "NOVO SEGREDO",
    vaults: "COFRES",
    filters: "FILTROS",
    searchPlaceholder: "BUSCAR SEGREDO (EX: AWS, GITHUB...)",
    emptyState: "NENHUM SEGREDO DETECTADO NESTE COFRE",
    reveal: "REVELAR NO DESKTOP",
    revealing: "EXPIRANDO...",
    edit: "EDITAR",
    save: "SALVAR",
    cancel: "CANCELAR",
    delete: "EXCLUIR",
    status: "STATUS",
    connected: "DESKTOP_CONECTADO",
    offline: "OFFLINE",
    tags: "TAGS",
    username: "USUÁRIO",
    url: "URL",
    notes: "NOTAS",
    totp: "CÓDIGO TOTP",
    metadata: "METADADOS",
    details: "DETALHES DO SEGREDO",
    autoLockMsg: "Auto-bloqueio em",
    seconds: "s",
    darkMode: "MODO ESCURO",
    language: "IDIOMA",
    personal: "Pessoal",
    department: "Departamento",
    shared: "Compartilhado",
    allTags: "TODAS AS TAGS",
    admin: "ADMINISTRAÇÃO",
    users: "USUÁRIOS",
    auditTrail: "TRILHA DE AUDITORIA",
    inviteUser: "CONVIDAR USUÁRIO",
    active: "ATIVO",
    pending: "PENDENTE_KEY_EXCHANGE",
    deactivated: "DESATIVADO",
    groups: "GRUPOS",
    lastActive: "ÚLTIMA ATIVIDADE",
    publicKey: "CHAVE PÚBLICA",
    vaultView: "VER COFRE",
    login: "ENTRAR",
    password: "SENHA",
    masterPassword: "SENHA MESTRA",
    unlock: "DESBLOQUEAR COFRE",
    loginTitle: "ACESSO SEGURO",
    loginSubtitle: "DIGITE SUA SENHA MESTRA PARA DESCRIPTOGRAFAR O COFRE",
    errorLogin: "SENHA MESTRA INVÁLIDA"
  }
};
export {
  Globe as G,
  Icon as I,
  Shield as S,
  translations as t
};
