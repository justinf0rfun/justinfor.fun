const modulo = (value: number, count: number) => ((value % count) + count) % count;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function mountBooksShelf(root: HTMLElement) {
  const viewport = root.querySelector<HTMLElement>("[data-books-viewport]")!;
  const categories = root.querySelector<HTMLElement>("[data-books-categories]")!;
  const marker = categories.querySelector<HTMLElement>("[data-books-category-marker]")!;
  const announcement = root.querySelector<HTMLElement>("[data-books-announcement]")!;
  const openLink = root.querySelector<HTMLAnchorElement>("[data-books-open]")!;
  const dialog = root.querySelector<HTMLDialogElement>("[data-books-dialog]")!;
  const closeButton = dialog.querySelector<HTMLButtonElement>("[data-books-close]")!;
  const detail = dialog.querySelector<HTMLElement>("[data-books-dialog-main]")!;
  const inkCircles = [...root.querySelectorAll<SVGCircleElement>("#books-ink circle")];
  const pointer = root.querySelector<HTMLElement>("[data-books-pointer]")!;
  const categoryButtons = [...categories.querySelectorAll<HTMLButtonElement>("[data-books-group]")];
  const copies = [...viewport.querySelectorAll<HTMLElement>("[data-books-slot]")].map((element) => {
    const face = element.querySelector<HTMLElement>("[data-book-cover]")!;
    const jacket = face.querySelector<HTMLElement>("[data-jacket-image]");
    return {
      element, face, jacket,
      id: element.dataset.bookId!,
      group: Number(element.dataset.group),
      aspect: Number(element.dataset.aspect),
      imageRequested: Boolean(jacket?.querySelector("img")),
      lift: 0,
    };
  });
  const count = Number(root.dataset.booksCount);
  const books = copies.slice(0, count);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const shelfTitle = document.title;
  let current = count;
  let target = current;
  let active = -1;
  let frame = 0;
  let lastFrame = 0;
  let settleTimer = 0;
  let hovered = -1;
  let tiltX = 0, tiltY = 0, wantTiltX = 0, wantTiltY = 0;
  let pointerX = 0, pointerY = 0, pointerTargetX = 0, pointerTargetY = 0;
  let drag: { id: number; x: number; start: number; moved: boolean } | null = null;
  let suppressClick = false;
  let shown = "";
  let closing = false;
  let dialogMotion: Animation | undefined;
  let inkFrame = 0;
  let returnFocus: HTMLElement | null = null;

  const distance = (slot: number, position: number, length: number) =>
    modulo(slot - position + length / 2, length) - length / 2;
  const bookAt = (id: string) => books.findIndex((book) => book.id === id);
  const normalize = () => {
    if (Math.abs(current) < count * 12) return;
    const shift = Math.trunc(current / copies.length) * copies.length;
    current -= shift;
    target -= shift;
    if (drag) drag.start -= shift;
  };
  const queuePaint = () => {
    if (!frame) {
      lastFrame = performance.now();
      frame = requestAnimationFrame(paint);
    }
  };
  const selectedCopy = () => copies[modulo(Math.round(current), copies.length)];

  const positionCategory = () => {
    const button = categories.querySelector<HTMLButtonElement>('button[aria-pressed="true"]');
    if (!button) return;
    marker.style.setProperty("--category-width", `${button.offsetWidth}px`);
    marker.style.setProperty("--category-x", `${button.offsetLeft}px`);
    categories.dataset.ready = "";
    if (button.offsetLeft < categories.scrollLeft || button.offsetLeft + button.offsetWidth > categories.scrollLeft + categories.clientWidth) {
      categories.scrollTo({ left: button.offsetLeft - 4, behavior: reduced.matches ? "instant" : "smooth" });
    }
  };
  const updateSelection = (index: number) => {
    if (active === index) return;
    active = index;
    const book = books[index].element.dataset;
    openLink.href = `/books/${book.bookId}`;
    openLink.setAttribute("aria-label", `Open book: ${book.title}`);
    announcement.textContent = `${book.title}, ${book.author}`;
    categoryButtons.forEach((button) => button.setAttribute("aria-pressed", String(Number(button.dataset.booksGroup) === Number(book.group))));
    positionCategory();
  };

  function paint(now: number, snap = false) {
    frame = 0;
    const dt = Math.min(.05, (now - lastFrame) / 1000);
    lastFrame = now;
    const immediate = snap || reduced.matches;
    current = immediate ? target : current + (target - current) * (1 - Math.exp(-(drag?.moved ? 18 : 5.2) * dt));
    if (Math.abs(target - current) < .001) current = target;
    normalize();

    const tiltEase = immediate ? 1 : 1 - Math.exp(-7 * dt);
    tiltX += (wantTiltX - tiltX) * tiltEase;
    tiltY += (wantTiltY - tiltY) * tiltEase;
    const height = copies[0].face.offsetHeight;
    const spine = .15 * height;
    const gap = .031 * height;
    const rounded = Math.round(current);
    const fraction = current - Math.floor(current);
    const first = books[modulo(Math.floor(current), count)];
    const next = books[modulo(Math.floor(current) + 1, count)];
    const frontWidth = height * (first.aspect + (next.aspect - first.aspect) * fraction);
    const halfViewport = viewport.clientWidth / 2;
    const edge = halfViewport + 1.5 * height;
    const liftEase = immediate ? 1 : 1 - Math.exp(-12 * dt);
    let moving = current !== target || Math.abs(wantTiltX - tiltX) + Math.abs(wantTiltY - tiltY) > .025;

    updateSelection(modulo(rounded, count));
    if (pointer.hasAttribute("data-pointer")) {
      const follow = immediate ? 1 : 1 - Math.exp(-16 * dt);
      pointerX += (pointerTargetX - pointerX) * follow;
      pointerY += (pointerTargetY - pointerY) * follow;
      moving ||= Math.abs(pointerTargetX - pointerX) + Math.abs(pointerTargetY - pointerY) > .2;
      pointer.style.transform = `translate(${pointerX}px, ${pointerY}px)`;
      pointer.dataset.pointer = hovered >= 0 && Math.abs(distance(hovered, current, copies.length)) < .5 ? "cover" : "spine";
    }
    copies.forEach((copy, slot) => {
      const offset = distance(slot, current, copies.length);
      const spread = Math.abs(offset) < 1
        ? (offset + Math.sin(Math.PI * offset) / Math.PI) / 2
        : .5 * Math.sign(offset);
      const x = offset * (spine + gap) + spread * (frontWidth - spine + 1.6 * gap);
      copy.element.style.visibility = Math.abs(x) > edge ? "hidden" : "";
      if (Math.abs(x) > edge) return;

      const start = Math.max(0, 1 - Math.abs(offset));
      const front = start * start * (3 - 2 * start);
      if (front > .1 && copy.jacket && !copy.imageRequested) {
        copy.imageRequested = true;
        const image = new Image();
        image.alt = "";
        image.draggable = false;
        image.decoding = "async";
        image.dataset.bookImage = "";
        image.src = copy.jacket.dataset.jacketImage!;
        copy.jacket.append(image);
      }
      const lift = hovered === slot && Math.abs(offset) > .5 ? 1 : 0;
      copy.lift += (lift - copy.lift) * liftEase;
      moving ||= Math.abs(copy.lift - lift) > .01;
      const set = (name: string, value: number, unit = "") =>
        copy.element.style.setProperty(name, `${value.toFixed(4)}${unit}`);
      set("--book-x", x, "px");
      set("--turn", -90 * front, "deg");
      set("--roll", -4.5 * front, "deg");
      set("--book-tilt-x", tiltX * front, "deg");
      set("--book-tilt-y", tiltY * front, "deg");
      set("--lift", -.025 * front - .045 * copy.lift);
      set("--depth", .2 * front);
      set("--front-alpha", front);
      set("--spine-alpha", 1 - front);
      copy.element.dataset.side = front >= .5 ? "cover" : "spine";
      copy.element.toggleAttribute("data-spine-edge", Math.abs(x) > halfViewport - spine / 2 - 5);
      copy.element.style.zIndex = String(Math.round(100 - 4 * Math.abs(offset)));
    });
    if (moving && !snap) frame = requestAnimationFrame(paint);
  }

  const moveTo = (index: number) => {
    target = Math.round(current + distance(index, current, count));
    queuePaint();
  };
  const slotOf = (node: EventTarget | null) => node instanceof Element
    ? node.closest<HTMLElement>("[data-books-slot]")
    : null;

  const viewportClip = (box: DOMRect) => {
    const width = dialog.clientWidth || innerWidth;
    const height = dialog.clientHeight || innerHeight;
    return `inset(${clamp(box.top, 0, height)}px ${clamp(width - box.right, 0, width)}px ${clamp(height - box.bottom, 0, height)}px ${clamp(box.left, 0, width)}px round 3px)`;
  };

  const clearInk = () => {
    cancelAnimationFrame(inkFrame);
    detail.querySelector("[data-ink]")?.removeAttribute("data-ink");
  };

  const revealCover = () => {
    const cover = detail.querySelector<HTMLElement>(".book-detail-art")!;
    const delays = [0, 115, 220, 75];
    inkCircles.forEach((circle) => circle.setAttribute("r", "0"));
    cover.setAttribute("data-ink", "");
    const start = performance.now() + 520;
    const reveal = (now: number) => {
      inkCircles.forEach((circle, index) => {
        const t = clamp((now - start - delays[index]) / 1250, 0, 1);
        circle.setAttribute("r", String(1.42 * (1 - (1 - t) ** 3)));
      });
      if (now - start < 1470) inkFrame = requestAnimationFrame(reveal);
      else cover.removeAttribute("data-ink");
    };
    inkFrame = requestAnimationFrame(reveal);
  };

  const show = (id: string, push = true) => {
    const index = bookAt(id);
    if (index < 0 || (shown === id && !closing)) return;
    const book = books[index];
    const template = root.querySelector<HTMLTemplateElement>(`template[data-book-detail="${id}"]`);
    if (!template || !dialog.showModal) {
      location.assign(`/books/${id}`);
      return;
    }

    window.clearTimeout(settleTimer);
    pointer.removeAttribute("data-pointer");
    viewport.removeAttribute("data-pointer");
    target = Math.round(current + distance(index, current, count));
    cancelAnimationFrame(frame);
    lastFrame = performance.now();
    paint(lastFrame, true);
    const source = selectedCopy().face.getBoundingClientRect();

    if (!dialog.open) returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    clearInk();
    dialogMotion?.cancel();
    closing = false;
    shown = id;
    detail.replaceChildren(template.content.cloneNode(true));
    detail.querySelectorAll<HTMLImageElement>("img[data-book-image]").forEach((image) => {
      if (image.naturalWidth >= 40) image.dataset.ready = "";
    });
    if (push) history.pushState({ ...history.state, booksDetail: id }, "", `/books/${id}`);
    document.title = `${book.element.dataset.title} · Books`;
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    closeButton.focus({ preventScroll: true });

    if (reduced.matches) return;
    dialog.style.transformOrigin = `${source.left + source.width / 2}px ${source.top + source.height / 2}px`;
    dialogMotion = dialog.animate([
      { clipPath: viewportClip(source), transform: "rotate(-4.5deg)" },
      { clipPath: "inset(0px)", transform: "rotate(0deg)" },
    ], { duration: 1050, easing: "cubic-bezier(.76,0,.18,1)" });
    detail.querySelectorAll<HTMLElement>("[data-detail-reveal]").forEach((part) => {
      const order = Number(part.style.getPropertyValue("--reveal"));
      part.animate([{ translate: "0 18px", opacity: 0 }, { translate: "0 0", opacity: 1 }], {
        duration: 900, delay: 620 + order * 30, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards",
      });
    });
    revealCover();
  };

  const finishClose = () => {
    if (!closing) return;
    shown = "";
    closing = false;
    dialog.close();
    detail.replaceChildren();
    document.title = shelfTitle;
    (returnFocus?.isConnected ? returnFocus : openLink).focus({ preventScroll: true });
    returnFocus = null;
  };

  const foldBack = () => {
    if (!dialog.open || closing) return;
    closing = true;
    clearInk();
    const style = getComputedStyle(dialog);
    const from = { clipPath: style.clipPath === "none" ? "inset(0px)" : style.clipPath, transform: style.transform };
    dialogMotion?.cancel();
    if (reduced.matches) {
      finishClose();
      return;
    }
    const source = selectedCopy().face.getBoundingClientRect();
    dialogMotion = dialog.animate([
      { ...from, opacity: 1 },
      { opacity: 1, offset: .6 },
      { clipPath: viewportClip(source), transform: "rotate(-4.5deg)", opacity: 0 },
    ], { duration: 800, easing: "cubic-bezier(.22,1,.36,1)", fill: "forwards" });
    dialogMotion.onfinish = () => {
      finishClose();
      dialogMotion?.cancel();
    };
  };

  const close = () => {
    if (!dialog.open || closing) return;
    if (history.state?.booksDetail === shown) history.back();
    else history.replaceState(history.state, "", "/books");
    foldBack();
  };

  closeButton.addEventListener("click", close);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  window.addEventListener("popstate", () => {
    const id = location.pathname.match(/^\/books\/([^/]+)\/?$/)?.[1];
    if (id) show(id, false);
    else foldBack();
  });

  categories.addEventListener("click", ({ target: node }) => {
    if (!(node instanceof HTMLButtonElement)) return;
    const group = Number(node.dataset.booksGroup);
    if (!Number.isInteger(group)) return;
    const index = group < 0 ? 0 : books.findIndex((book) => book.group === group);
    if (index >= 0) moveTo(index);
  });
  root.querySelectorAll<HTMLButtonElement>("[data-books-step]").forEach((button) => {
    button.addEventListener("click", () => {
      target = Math.round(target) + Number(button.dataset.booksStep);
      queuePaint();
    });
  });
  openLink.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    show(selectedCopy().id);
  });

  root.addEventListener("keydown", (event) => {
    if (dialog.open || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      target = Math.round(target) + (event.key === "ArrowLeft" ? -1 : 1);
      queuePaint();
    } else if (event.key === "Enter" && event.target === viewport) {
      event.preventDefault();
      show(selectedCopy().id);
    }
  });

  viewport.addEventListener("wheel", (event) => {
    if (dialog.open || event.ctrlKey) return;
    event.preventDefault();
    const pixels = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1;
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    target += delta * pixels * .5 / (copies[0].face.offsetHeight * .181);
    queuePaint();
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      target = Math.round(target);
      queuePaint();
    }, 160);
  }, { passive: false });

  viewport.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || !event.isPrimary || dialog.open) return;
    window.clearTimeout(settleTimer);
    suppressClick = false;
    drag = { id: event.pointerId, x: event.clientX, start: target, moved: false };
  });
  viewport.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse" || drag?.moved) return;
    const slot = Number(slotOf(event.target)?.dataset.booksSlot ?? -1);
    hovered = slot;
    if (!pointer.hasAttribute("data-pointer")) {
      pointerX = event.clientX;
      pointerY = event.clientY;
    }
    pointerTargetX = event.clientX;
    pointerTargetY = event.clientY;
    pointer.dataset.pointer = "spine";
    viewport.dataset.pointer = "";
    if (!reduced.matches && slot >= 0 && Math.abs(distance(slot, current, copies.length)) < .5) {
      const bounds = selectedCopy().face.getBoundingClientRect();
      wantTiltY = clamp(((event.clientX - bounds.left) / bounds.width - .5) * 14, -9, 9);
      wantTiltX = clamp(-((event.clientY - bounds.top) / bounds.height - .5) * 12, -6, 6);
    } else {
      wantTiltX = wantTiltY = 0;
    }
    queuePaint();
  });
  viewport.addEventListener("pointerleave", () => {
    hovered = -1;
    pointer.removeAttribute("data-pointer");
    viewport.removeAttribute("data-pointer");
    wantTiltX = wantTiltY = 0;
    queuePaint();
  });
  window.addEventListener("pointermove", (event) => {
    if (drag?.id !== event.pointerId) return;
    const offset = event.clientX - drag.x;
    if (!drag.moved && Math.abs(offset) <= 5) return;
    if (!drag.moved) {
      viewport.setPointerCapture(event.pointerId);
      drag.moved = true;
      viewport.dataset.dragging = "";
      pointer.removeAttribute("data-pointer");
      viewport.removeAttribute("data-pointer");
      hovered = -1;
      wantTiltX = wantTiltY = 0;
    }
    target = drag.start - offset / (copies[0].face.offsetHeight * .181);
    queuePaint();
  });
  const finishDrag = (event: PointerEvent) => {
    if (drag?.id !== event.pointerId) return;
    if (drag.moved) {
      target = Math.round(target);
      suppressClick = true;
      queuePaint();
    }
    drag = null;
    delete viewport.dataset.dragging;
  };
  window.addEventListener("pointerup", finishDrag);
  window.addEventListener("pointercancel", finishDrag);
  viewport.addEventListener("click", (event) => {
    const slot = slotOf(event.target);
    if (!slot || suppressClick) return;
    const offset = distance(Number(slot.dataset.booksSlot), current, copies.length);
    if (Math.abs(offset) < .5) show(slot.dataset.bookId!);
    else moveTo(bookAt(slot.dataset.bookId!));
  });

  new ResizeObserver(queuePaint).observe(viewport);
  new ResizeObserver(positionCategory).observe(categories);
  reduced.addEventListener("change", () => {
    wantTiltX = wantTiltY = 0;
    queuePaint();
  });
  lastFrame = performance.now();
  paint(lastFrame, true);
}
