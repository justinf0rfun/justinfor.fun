(async () => {
  const root = document.querySelector('[data-sticker-deck]');
  const assert = (condition, message) => { if (!condition) throw Error(message); };
  const wait = async condition => {
    const deadline = performance.now() + 12000;
    while (!condition()) {
      if (performance.now() > deadline) throw Error('sticker stack did not reach the requested state');
      await new Promise(resolve => setTimeout(resolve, 30));
    }
  };
  assert(root?.dataset.ready === 'true', 'sticker stack is not hydrated');
  root.scrollIntoView({ block: 'center', behavior: 'instant' });
  await wait(() => root.querySelector('.belief-stage').dataset.open === 'true' && root.dataset.phase === 'idle');
  const initialCard = root.dataset.active;
  await new Promise(resolve => setTimeout(resolve, 5500));
  assert(root.dataset.phase === 'idle' && root.dataset.active === initialCard, 'the scroll reveal must leave the card selection idle');
  assert(!root.querySelector('.belief-deck-footer button'), 'footer controls should be removed');
  for (const face of root.querySelectorAll('.belief-face[data-cutout="true"]')) {
    const style = getComputedStyle(face);
    assert(style.backgroundColor === 'rgba(0, 0, 0, 0)' && style.boxShadow === 'none', 'transparent artwork has a visible rectangular backing');
  }
  const count = root.querySelectorAll('[data-sticker-card]').length;
  root.querySelector('[data-sticker-card="0"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await wait(() => root.dataset.phase === 'open' && root.dataset.viewing === '0');
  for (let i = 1; i <= 3; i++) {
    const card = root.querySelector(`[data-sticker-card="${i % count}"]`);
    card.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse', button: 0, isPrimary: true }));
    card.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'mouse', button: 0, isPrimary: true }));
  }
  const destination = String(3 % count);
  await wait(() => root.dataset.phase === 'open' && root.dataset.viewing === destination);
  assert(root.querySelectorAll('canvas').length <= 1, 'more than one peel canvas is mounted');
  root.querySelector('[aria-label="Put sticker back"]').click();
  await wait(() => root.dataset.phase === 'idle');
  assert(root.querySelector('[data-front="true"]').dataset.stickerCard === destination, 'inspected card did not return to the top');
  assert(document.documentElement.scrollWidth <= innerWidth, 'stack causes horizontal overflow');
  return { passed: true, cards: count, latestSelection: destination, promoted: true, height: root.getBoundingClientRect().height };
})()
