// Validation from LauraBeatris/laurabeatris.com/lib/contact.ts; see email-composer/SOURCE.md.
export const MAX_EMAIL_LENGTH = 254;
export const MAX_SUBJECT_LENGTH = 150;
export const MAX_MESSAGE_LENGTH = 5000;

// One @, a dot after it, and none of the characters that separate addresses or
// wrap names in a mail header. Whether it's a real inbox, only a reply can tell.
const ADDRESS_PART = String.raw`[^\s@<>()[\]\\,;:"\p{C}]+`;
const EMAIL_ADDRESS = new RegExp(
  `^${ADDRESS_PART}@${ADDRESS_PART}\\.${ADDRESS_PART}$`,
  "u",
);

export function isEmailAddress(value: string) {
  return value.length <= MAX_EMAIL_LENGTH && EMAIL_ADDRESS.test(value);
}

/** True when there's something to read, not only spaces or invisible characters. */
export function hasText(value: string) {
  return /[^\s\p{Z}\p{C}]/u.test(value);
}

export function hasEmailDraft(from: string, subject: string, message: string) {
  return hasText(from) || hasText(subject) || hasText(message);
}

type Box = { left: number; top: number; width: number; height: number };
export type EmailPoint = { x: number; y: number };

export function emailPaperPose(paper: Box, button: Box) {
  const width = Math.min(button.width, paper.width);
  const left = Math.max(0, Math.min(paper.width - width, button.left - paper.left));
  return {
    left, right: paper.width - left - width,
    top: Math.max(0, paper.height - button.height),
    travel: button.top + button.height - paper.top - paper.height,
  };
}

export function emailReturnFrames(from: EmailPoint, to: EmailPoint, compact: boolean) {
  const control = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - (compact ? 32 : 76) };
  return Array.from({ length: 17 }, (_, index) => {
    const t = index / 16, rest = 1 - t;
    const x = rest * rest * from.x + 2 * rest * t * control.x + t * t * to.x;
    const y = rest * rest * from.y + 2 * rest * t * control.y + t * t * to.y;
    const dx = 2 * rest * (control.x - from.x) + 2 * t * (to.x - control.x);
    const dy = 2 * rest * (control.y - from.y) + 2 * t * (to.y - control.y);
    const turn = (Math.atan2(dy, dx) * 180 / Math.PI + 45) * Math.min(1, t * 5);
    return { offset: t, transform: `translate3d(${x}px,${y}px,0) rotate(${turn}deg) scale(${1 - t * t * .65})`, opacity: Math.min(1, (1 - t) * 10) };
  });
}
