// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SifaBadgeElement, defineSifaBadge } from './index.js';

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

async function waitFor(assertion: () => void, timeout = 1000): Promise<void> {
  const start = Date.now();
  for (;;) {
    try {
      assertion();
      return;
    } catch (err) {
      if (Date.now() - start > timeout) throw err;
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
  }
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('<sifa-badge>', () => {
  it('registers the custom element on import', () => {
    expect(customElements.get('sifa-badge')).toBe(SifaBadgeElement);
  });

  it('renders name, current role, skills, and a profile link', async () => {
    globalThis.fetch = jsonFetch({
      did: 'did:plc:abc',
      handle: 'gui.do',
      displayName: 'Guido Jansen',
      positions: [{ rkey: '1', title: 'Founder', company: 'Singi Labs', startedAt: '2025-11' }],
      skills: [
        { rkey: 's', name: 'Product' },
        { rkey: 's2', name: 'AT Protocol' },
      ],
      claimed: true,
    });

    const el = document.createElement('sifa-badge');
    el.setAttribute('handle', 'gui.do');
    document.body.append(el);

    await waitFor(() => {
      expect(el.shadowRoot?.querySelector('.name')?.textContent).toBe('Guido Jansen');
    });

    const root = el.shadowRoot as ShadowRoot;
    expect(root.querySelector('.role')?.textContent).toBe('Founder · Singi Labs');
    expect([...root.querySelectorAll('.chip')].map((c) => c.textContent)).toEqual([
      'Product',
      'AT Protocol',
    ]);
    const link = root.querySelector('a.card') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('https://sifa.id/p/gui.do');
    expect(link.getAttribute('aria-label')).toBe('Guido Jansen on Sifa');
  });

  it('prompts when neither handle nor did is set', async () => {
    const el = document.createElement('sifa-badge');
    document.body.append(el);

    await waitFor(() => {
      expect(el.shadowRoot?.querySelector('.msg')?.textContent).toContain('handle or did');
    });
  });

  it('shows a not-found message when the profile does not exist', async () => {
    globalThis.fetch = jsonFetch({ error: 'ProfileNotFound' }, 400);

    const el = document.createElement('sifa-badge');
    el.setAttribute('handle', 'nobody.invalid');
    document.body.append(el);

    await waitFor(() => {
      expect(el.shadowRoot?.querySelector('.msg')?.textContent).toContain('No Sifa profile');
    });
  });

  it('is idempotent to define twice', () => {
    expect(() => {
      defineSifaBadge();
      defineSifaBadge();
    }).not.toThrow();
  });
});
