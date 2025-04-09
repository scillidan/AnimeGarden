import type { ResolvedFilterOptions } from '@animegarden/client';

import { store, preferFansubsAtom } from '@/state';
import { hydrateNodes } from '@/lib/hydrate';

hydrateNodes('#fetch-response', (node) => {
  const filter = JSON.parse((node as HTMLElement).dataset.filter ?? '') as ResolvedFilterOptions;
  if (filter.fansubId) {
    const fansub = new Set(
      [...filter.fansubId, ...store.get(preferFansubsAtom)].filter(Boolean).map((t) => '' + t)
    );
    store.set(preferFansubsAtom, [...fansub]);
    reorderFansub(fansub);
    return;
  } else {
    reorderFansub(new Set(store.get(preferFansubsAtom)));
  }
});

export function reorderFansub(order: Set<string>) {
  const dropdown = document.querySelector('#fansub-dropdown') as HTMLElement | null;
  if (dropdown) {
    const children = Array.from(dropdown.children).filter((n) =>
      n.classList.contains('fansub-item')
    ) as HTMLElement[];
    const map = new Map<string, HTMLElement>();
    const otherItem: HTMLElement[] = [];
    for (const c of children) {
      if (c.dataset.fansubId) {
        const id = c.dataset.fansubId;
        map.set(id, c);
        if (!order.has(id)) {
          otherItem.push(c);
        }
      }
    }

    for (const id of order) {
      const c = map.get(id);
      if (c) {
        dropdown.appendChild(c);
      }
    }
    for (const c of otherItem) {
      dropdown.appendChild(c);
    }
  }
}
