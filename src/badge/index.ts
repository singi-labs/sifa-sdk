/**
 * `<sifa-badge>` — a framework-free custom element that renders a person's
 * professional headline (name, current role and employer, top skills) from
 * their Sifa profile. Drop it into any page:
 *
 * ```html
 * <script type="module" src="https://esm.sh/@singi-labs/sifa-sdk/badge"></script>
 * <sifa-badge handle="gui.do"></sifa-badge>
 * ```
 *
 * Or, in a bundler: `import '@singi-labs/sifa-sdk/badge'` (importing registers
 * the element). Attributes: `handle` or `did` (required), `api` (AppView base,
 * default `https://api.sifa.id`), `max-skills` (default 5).
 *
 * Reads the public `id.sifa.getProfileView` query, so it needs no auth or key.
 * Cross-origin browser use depends on that endpoint's open CORS.
 */

import type { ProfileSummary } from '../logic/profile-summary.js';
import { fetchProfileSummary } from '../query/fetchers/profile-summary.js';

const TAG = 'sifa-badge';
const DEFAULT_API_BASE = 'https://api.sifa.id';
const PROFILE_BASE = 'https://sifa.id/p/';

// Reference HTMLElement through a guarded base so importing this module never
// throws in a non-DOM (SSR / Node) context. The real element is only ever
// registered and instantiated in a browser, where defineSifaBadge runs.
const BaseElement: typeof HTMLElement =
  typeof HTMLElement !== 'undefined' ? HTMLElement : (class {} as unknown as typeof HTMLElement);

const STYLES = `
  :host { display: inline-block; max-width: 22rem; }
  a.card {
    display: flex; gap: 0.75rem; align-items: center;
    padding: 0.75rem 0.9rem; text-decoration: none; color: inherit;
    border: 1px solid rgba(0,0,0,0.12); border-radius: 0.75rem;
    background: canvas; font: 400 0.9rem/1.4 system-ui, sans-serif;
  }
  a.card:hover { border-color: rgba(0,0,0,0.28); }
  a.card:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
  .avatar { width: 2.75rem; height: 2.75rem; border-radius: 50%; object-fit: cover; flex: none; }
  .body { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
  .name { font-weight: 600; }
  .role { color: color-mix(in srgb, canvastext 65%, canvas); }
  .skills { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.25rem; }
  .chip {
    font-size: 0.72rem; padding: 0.1rem 0.45rem; border-radius: 999px;
    background: color-mix(in srgb, canvastext 8%, canvas);
  }
  .msg { margin: 0; padding: 0.5rem 0.6rem; color: color-mix(in srgb, canvastext 60%, canvas);
    font: 400 0.85rem/1.4 system-ui, sans-serif; }
`;

export class SifaBadgeElement extends BaseElement {
  static readonly observedAttributes = ['handle', 'did', 'api', 'max-skills'];

  private readonly shadow: ShadowRoot;
  private renderToken = 0;
  private scheduled = false;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.schedule();
  }

  attributeChangedCallback(): void {
    this.schedule();
  }

  /** Coalesce a burst of synchronous attribute writes (and the initial connect) into one load. */
  private schedule(): void {
    if (this.scheduled) return;
    this.scheduled = true;
    queueMicrotask(() => {
      this.scheduled = false;
      if (this.isConnected) void this.load();
    });
  }

  private async load(): Promise<void> {
    const token = ++this.renderToken;
    const actor = this.getAttribute('did') || this.getAttribute('handle');
    if (!actor) {
      this.paint(this.message('Set a handle or did attribute on <sifa-badge>.'));
      return;
    }

    const baseUrl = this.getAttribute('api') || DEFAULT_API_BASE;
    const rawMax = this.getAttribute('max-skills');
    const maxSkills = rawMax != null ? Number(rawMax) : undefined;
    const options = maxSkills != null && Number.isFinite(maxSkills) ? { maxSkills } : {};

    this.paint(this.message('Loading…'));

    let summary: ProfileSummary | null;
    try {
      summary = await fetchProfileSummary({ baseUrl }, actor, options);
    } catch {
      if (token === this.renderToken) this.paint(this.message('Could not load this profile.'));
      return;
    }

    if (token !== this.renderToken) return; // a newer load superseded this one
    this.paint(summary ? this.card(summary) : this.message(`No Sifa profile for ${actor}.`));
  }

  private paint(body: Node): void {
    const style = document.createElement('style');
    style.textContent = STYLES;
    this.shadow.replaceChildren(style, body);
  }

  private message(text: string): HTMLElement {
    const p = document.createElement('p');
    p.className = 'msg';
    p.textContent = text;
    return p;
  }

  private card(summary: ProfileSummary): HTMLElement {
    const name = summary.displayName || summary.handle;
    const link = document.createElement('a');
    link.className = 'card';
    link.href = PROFILE_BASE + encodeURIComponent(summary.handle);
    link.target = '_blank';
    link.rel = 'noopener';
    link.setAttribute('aria-label', `${name} on Sifa`);

    if (summary.avatar) {
      const img = document.createElement('img');
      img.className = 'avatar';
      img.src = summary.avatar;
      img.alt = '';
      img.loading = 'lazy';
      link.append(img);
    }

    const body = document.createElement('span');
    body.className = 'body';

    const nameEl = document.createElement('span');
    nameEl.className = 'name';
    nameEl.textContent = name;
    body.append(nameEl);

    const role =
      [summary.currentTitle, summary.currentCompany].filter(Boolean).join(' · ') ||
      summary.headline;
    if (role) {
      const roleEl = document.createElement('span');
      roleEl.className = 'role';
      roleEl.textContent = role;
      body.append(roleEl);
    }

    if (summary.topSkills.length > 0) {
      const skills = document.createElement('span');
      skills.className = 'skills';
      for (const skill of summary.topSkills) {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = skill;
        skills.append(chip);
      }
      body.append(skills);
    }

    link.append(body);
    return link;
  }
}

/** Register the element (idempotent). Called automatically when this module is imported. */
export function defineSifaBadge(tag: string = TAG): void {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) {
    customElements.define(tag, SifaBadgeElement);
  }
}

defineSifaBadge();
