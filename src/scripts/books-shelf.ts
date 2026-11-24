import {
  bookDistance, bookInkRadius, bookPose, bookTextTiming, bookX, closedBookClip,
  closeBookTiming, inkPoints, modulo, nearestBook, openBookClip, openBookTiming, stepBook,
} from "./books-motion";

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
  const widestBook = Math.max(...books.map((book) => book.aspect));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const shelfTitle = document.title;
  let current = count;
  let target = current;
  let active = -1;
  let frame = 0;
  let lastFrame = 0;
  let settleTimer = 0;
  let hovered = -1;
  let tiltX = 0, tiltY = 0;
  let pointerInside = false, onCover = false;
  let pointerX = 0, pointerY = 0, pointerTargetX = 0, pointerTargetY = 0;
  let drag: { id: number; x: number; start: number; moved: boolean } | null = null;
  let suppressClick = false;
  let shown = "";
  let closing = false;
  let dialogMotion: Animation | undefined;
  let inkFrame = 0;
  let returnFocus: HTMLElement | null = null;

  const bookAt = (id: string) => books.findIndex((book) => book.id === id);
  const normalize = () => {
    if (Math.abs(current) <= 4 * copies.length) return;
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
    current = stepBook(current, target, dt, !!drag?.moved, immediate);
    normalize();

    const height = copies[0].face.offsetHeight;
    const spine = .15 * height;
    const gap = .03 * height;
    const rounded = Math.round(current);
    const fraction = current - Math.floor(current);
    const first = books[modulo(Math.floor(current), count)];
    const next = books[modulo(Math.floor(current) + 1, count)];
    const frontWidth = height * first.aspect * (1 - fraction) + height * next.aspect * fraction;
    const bounds = viewport.getBoundingClientRect();
    const dx = pointerTargetX - bounds.left - bounds.width / 2;
    const dy = pointerTargetY - bounds.top - bounds.height / 2;
    onCover = pointerInside && !dialog.open && Math.abs(dx) < .55 * frontWidth &&
      Math.abs(dy) < .55 * height && .3 > Math.abs(target - current);
    const wantTiltY = onCover ? dx / (.55 * frontWidth) * 9 : pointerInside ? dx / bounds.width * 5 : 0;
    const wantTiltX = onCover ? -dy / (height / 2) * 6 : 0;
    const tiltEase = immediate ? 1 : 1 - Math.exp(-7 * dt);
    tiltX += (wantTiltX - tiltX) * tiltEase;
    tiltY += (wantTiltY - tiltY) * tiltEase;
    const halfViewport = bounds.width / 2;
    const edge = halfViewport + 1.5 * height * widestBook;
    const liftEase = immediate ? 1 : 1 - Math.exp(-12 * dt);
    let moving = current !== target || Math.abs(wantTiltX - tiltX) + Math.abs(wantTiltY - tiltY) > .001;

    updateSelection(modulo(rounded, count));
    if (pointerInside && !dialog.open) {
      pointer.dataset.pointer = onCover ? "cover" : hovered >= 0 && Math.abs(bookDistance(hovered, current, copies.length)) > .5 ? "spine" : "shelf";
      const follow = immediate ? 1 : 1 - Math.exp(-16 * dt);
      pointerX += (pointerTargetX - pointerX) * follow;
      pointerY += (pointerTargetY - pointerY) * follow;
      moving ||= Math.abs(pointerTargetX - pointerX) + Math.abs(pointerTargetY - pointerY) > .025;
      pointer.style.transform = `translate3d(${pointerX}px,${pointerY}px,0)`;
    }
    copies.forEach((copy, slot) => {
      const offset = bookDistance(slot, current, copies.length);
      const x = bookX(offset, spine, gap, frontWidth);
      const lift = hovered === slot && Math.abs(offset) > .5 ? 1 : 0;
      copy.lift += (lift - copy.lift) * liftEase;
      moving ||= Math.abs(copy.lift - lift) > .001;
      copy.element.style.visibility = Math.abs(x) > edge ? "hidden" : "";
      if (Math.abs(x) > edge) return;

      const pose = bookPose(x, offset, height, tiltX, tiltY, copy.lift);
      const front = pose.turn;
      const coverNearViewport = Math.abs(x) <= halfViewport + spine;
      if ((front > .1 || coverNearViewport) && copy.jacket && !copy.imageRequested) {
        copy.imageRequested = true;
        const image = new Image();
        image.alt = "";
        image.draggable = false;
        image.decoding = "async";
        image.fetchPriority = front > .1 ? "auto" : "low";
        image.dataset.bookImage = "";
        image.src = copy.jacket.dataset.jacketImage!;
        copy.jacket.append(image);
      }
      copy.element.style.setProperty("--book-pose", pose.transform);
      copy.element.style.setProperty("--spine-shade", pose.spineShade);
      copy.element.style.setProperty("--cover-shade", pose.coverShade);
      copy.element.dataset.side = front >= .5 ? "cover" : "spine";
      copy.element.toggleAttribute("data-spine-edge", Math.abs(x) > halfViewport - spine / 2 - 5);
      copy.element.style.zIndex = String(pose.z);
    });
    if (moving && !snap) frame = requestAnimationFrame(paint);
  }

  const moveTo = (index: number) => {
    target = nearestBook(current, index, count);
    queuePaint();
  };
  const slotOf = (node: EventTarget | null) => node instanceof Element
    ? node.closest<HTMLElement>("[data-books-slot]")
    : null;

  const clearInk = () => {
    cancelAnimationFrame(inkFrame);
    detail.querySelector("[data-ink]")?.removeAttribute("data-ink");
  };

  const revealCover = () => {
    const cover = detail.querySelector<HTMLElement>(".book-detail-art")!;
    inkCircles.forEach((circle) => circle.setAttribute("r", "0"));
    cover.setAttribute("data-ink", "");
    const start = performance.now();
    const reveal = (now: number) => {
      inkCircles.forEach((circle, index) => {
        circle.setAttribute("r", String(bookInkRadius(now - start, inkPoints[index].delay)));
      });
      if (now - start < 2400) inkFrame = requestAnimationFrame(reveal);
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

    const visibleBook = selectedCopy();
    const visibleCover = visibleBook.id === id ? visibleBook.face.getBoundingClientRect() : null;
    window.clearTimeout(settleTimer);
    pointer.removeAttribute("data-pointer");
    viewport.removeAttribute("data-pointer");
    pointerInside = false;
    target = nearestBook(current, index, count);
    cancelAnimationFrame(frame);
    lastFrame = performance.now();
    paint(lastFrame, true);
    const source = visibleCover ?? selectedCopy().face.getBoundingClientRect();

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
      { clipPath: closedBookClip(source), transform: "rotate(-4.5deg)" },
      { clipPath: openBookClip, transform: "rotate(0deg)" },
    ], openBookTiming);

    const rise = (parts: NodeListOf<HTMLElement>, start: number, stagger: number) => {
      parts.forEach((part, index) => {
        part.animate([{ transform: "translateY(110%)" }, { transform: "translateY(0)" }], {
          ...bookTextTiming, delay: start + index * stagger,
        });
      });
    };
    const heads = detail.querySelectorAll<HTMLElement>('[data-rise="head"] > *');
    const rows = detail.querySelectorAll<HTMLElement>('[data-rise="row"] > *');
    const foot = detail.querySelectorAll<HTMLElement>('[data-rise="tail"] > *');
    rise(heads, 620, 75);
    rise(rows, 620 + 75 * heads.length, 30);
    rise(foot, 620 + 75 * heads.length + 30 * rows.length + 40, 60);
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
    const from = { clipPath: style.clipPath === "none" ? openBookClip : style.clipPath, transform: style.transform };
    dialogMotion?.cancel();
    if (reduced.matches) {
      finishClose();
      return;
    }
    const source = selectedCopy().face.getBoundingClientRect();
    dialogMotion = dialog.animate([
      { ...from, opacity: 1 },
      { opacity: 1, offset: .6 },
      { clipPath: closedBookClip(source), transform: "rotate(-4.5deg)", opacity: 0 },
    ], closeBookTiming);
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

  root.addEventListener("pointerdown", () => {
    root.setAttribute("data-books-pointer-input", "");
  }, { capture: true, passive: true });

  window.addEventListener("keydown", (event) => {
    root.removeAttribute("data-books-pointer-input");
    if (dialog.open || event.ctrlKey || event.metaKey || event.altKey) return;
    const focused = document.activeElement;
    if (focused && focused !== document.body && !root.contains(focused)) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      target = Math.round(target) + (event.key === "ArrowLeft" ? -1 : 1);
      queuePaint();
    } else if (event.key === "Enter" && (event.target === viewport || event.target === document.body)) {
      event.preventDefault();
      show(selectedCopy().id);
    }
  });

  viewport.addEventListener("wheel", (event) => {
    if (dialog.open || event.ctrlKey) return;
    event.preventDefault();
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    target += delta / (copies[0].face.offsetHeight * .18) * .5;
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
  viewport.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "mouse") return;
    pointerInside = true;
    pointerX = pointerTargetX = event.clientX;
    pointerY = pointerTargetY = event.clientY;
    viewport.dataset.pointer = "";
    queuePaint();
  });
  viewport.addEventListener("pointerover", (event) => {
    hovered = Number(slotOf(event.target)?.dataset.booksSlot ?? -1);
    queuePaint();
  });
  viewport.addEventListener("pointerleave", () => {
    hovered = -1;
    pointerInside = false;
    pointer.removeAttribute("data-pointer");
    viewport.removeAttribute("data-pointer");
    queuePaint();
  });
  window.addEventListener("pointermove", (event) => {
    pointerTargetX = event.clientX;
    pointerTargetY = event.clientY;
    if (pointerInside) queuePaint();
    if (drag?.id !== event.pointerId) return;
    const offset = event.clientX - drag.x;
    if (!drag.moved && Math.abs(offset) <= 5) return;
    if (!drag.moved) {
      drag.moved = true;
      viewport.dataset.dragging = "";
    }
    target = drag.start - offset / (copies[0].face.offsetHeight * .18);
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
    const offset = bookDistance(Number(slot.dataset.booksSlot), current, copies.length);
    if (Math.abs(offset) < .5) show(slot.dataset.bookId!);
    else {
      target = Math.round(target + offset);
      queuePaint();
    }
  });

  new ResizeObserver(queuePaint).observe(viewport);
  new ResizeObserver(positionCategory).observe(categories);
  reduced.addEventListener("change", queuePaint);
  lastFrame = performance.now();
  paint(lastFrame, true);
}
