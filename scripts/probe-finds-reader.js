(async () => {
  const root = document.querySelector('[data-finds-ready="true"]');
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  assert(root, "The card cabinet must be hydrated.");
  const initial = { drawer: root.dataset.drawer, selected: root.dataset.selected };
  const until = async condition => {
    const end = performance.now() + 4000;
    while (!condition()) { assert(performance.now() < end, "Reading did not reach the expected state."); await new Promise(requestAnimationFrame); }
  };
  const click = selector => { const element = root.querySelector(selector); assert(element, selector); element.click(); };
  if (root.dataset.reading === "true") { click('.finds-reader-back'); await until(() => !root.querySelector('[data-finds-reader]')); }
  click('[data-find-drawer="all"]'); await until(() => root.dataset.drawer === "all");
  const cards = [...root.querySelectorAll('[data-find-card]')].map(card => ({
    id: card.dataset.findCard, mock: card.dataset.findMock === "true",
    number: card.querySelector('.finds-paper-number').firstChild.textContent,
    title: card.querySelector('.finds-paper-heading').textContent,
    source: card.querySelector('.finds-paper-source').textContent,
  }));
  const read = async id => {
    if (root.dataset.selected !== id) { click(`[data-find-card="${id}"]`); await until(() => root.dataset.selected === id); }
    click('.finds-read-tab'); await until(() => root.dataset.reading === "true");
    await until(() => [...root.querySelectorAll('[data-find-card]')].every(card => Number(getComputedStyle(card).opacity) <= .01));
    return root.querySelector(`[data-finds-article="${id}"]`);
  };
  for (const card of cards.filter(card => !card.mock || card.id === "sample-connections")) {
    const article = await read(card.id);
    assert(article.querySelector('h2').textContent === card.title, "Keep the card's editorial title.");
    assert(root.querySelector('.finds-reader-address').textContent.includes(card.number), "Keep a stable card address.");
    assert(!article.querySelector('.finds-take'), "Do not invent a personal take when none was supplied.");
    assert(article.querySelector('.finds-note-meta .finds-note-category'), "Use the same heading metadata layout.");
    if (card.mock) {
      assert(article.querySelector('.finds-note-meta .finds-sample-label'), "Keep samples labeled within metadata.");
      assert(!article.querySelector('.finds-source-head, .finds-source-link, time, blockquote'), "Samples must not acquire fake provenance.");
      assert(article.querySelector('.finds-note-body').textContent.startsWith('Two notes can share a topic'), "Keep the sample content.");
    } else {
      assert(article.querySelector('.finds-source-head a span').textContent === card.source, "Keep the real source author.");
      assert(article.querySelector('.finds-source-link').href.includes(card.id), "Keep the canonical original URL.");
      assert(article.querySelectorAll('time').length === 2, "Keep publication and saved dates distinct.");
      assert(!article.querySelector('.finds-sample-label'), "Real sources must not be labeled as samples.");
      if (card.number === "004") assert(!article.querySelector('blockquote') && article.querySelector('.finds-source-text').textContent.includes('contains media'), "Do not invent media content.");
      else assert(article.querySelector('blockquote[cite] p'), "Saved source text must be an attributed quotation.");
      if (card.number === "001") assert(article.querySelectorAll('blockquote p').length === 3, "Preserve the excerpt's three paragraphs.");
    }
    for (const link of article.querySelectorAll('[data-find-follow]')) {
      const target = cards.find(card => card.id === link.dataset.findFollow);
      assert(link.querySelector('.finds-related-number').textContent === target.number, "Connections display the destination's fixed address.");
      assert(link.querySelector('.finds-related-title').textContent === target.title && link.querySelector('small').textContent.trim(), "Keep the connection's title and reason.");
    }
    click('.finds-reader-back'); await until(() => root.dataset.reading === "false");
    const leaving = root.querySelector('[data-finds-reader]');
    assert(!leaving || (leaving.inert && leaving.querySelector('.finds-reader-back').dataset.storing === "true"), "The put-back icon stays stored while the paper closes, with outgoing controls inert.");
    await until(() => !root.querySelector('[data-finds-reader]'));
    assert([...root.querySelectorAll('[data-find-card]')].every(card => Number(getComputedStyle(card).opacity) >= .99), "Putting a note back must restore every card in the fan.");
    const returned = root.querySelector(`[data-find-card="${card.id}"]`);
    returned.focus({ preventScroll: true });
    assert(getComputedStyle(returned).outlineStyle === "none", "Returning focus must not draw a frame around the paper.");
    if (returned.matches(':focus-visible')) assert(getComputedStyle(returned.querySelector('.finds-paper-heading')).textDecorationLine.includes('underline'), "Keyboard focus keeps a visible text cue.");
  }
  await read(cards.find(card => card.number === "001").id);
  click('[data-find-follow="2088302050706686198"]'); await until(() => root.dataset.selected === "2088302050706686198");
  const path = root.querySelector('.finds-trail');
  assert([...path.querySelectorAll('button')].map(button => button.textContent).join('/') === "001/003", "Reading paths use compact addresses.");
  assert(path.querySelector('[aria-current="step"]').getAttribute('aria-label').includes('A map of AI engineering'), "A compact path must retain accessible titles.");
  root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await until(() => !root.querySelector('[data-finds-reader]'));
  click(`[data-find-drawer="${initial.drawer}"]`); await until(() => root.dataset.drawer === initial.drawer);
  if (root.dataset.selected !== initial.selected) { click(`[data-find-card="${initial.selected}"]`); await until(() => root.dataset.selected === initial.selected); }
  return { passed: true, sampleAndSourceFormats: true, sourceParagraphs: true, provenance: true, optionalSections: true, connectionAddresses: true, readingPath: true };
})();
