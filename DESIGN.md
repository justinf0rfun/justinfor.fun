---
name: Justin
description: A concise, evidence-led portfolio for shipped work
colors:
  canvas: "oklch(98.5% 0 0)"
  paper: "#ffffff"
  neutral-soft: "oklch(87% 0 0)"
  neutral-muted: "oklch(70.8% 0 0)"
  neutral-secondary: "oklch(55.6% 0 0)"
  neutral-body: "oklch(43.9% 0 0)"
  neutral-strong: "oklch(26.9% 0 0)"
  neutral-ink: "oklch(14.5% 0 0)"
  timeline-accent: "#dc6a4b"
  alpha-ink: "#0d6b35"
  alpha-wash: "#e6f7ec"
  live-ink: "#126a5a"
  live-wash: "#e5f4f0"
  notice-ink: "#6b4f00"
  notice-wash: "#ffe28a"
typography:
  display:
    fontFamily: "SF Compact, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "clamp(1.75rem, 3vw, 2.5rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  title:
    fontFamily: "SF Compact, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.2
  body:
    fontFamily: "SF Compact, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "SF Compact, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "0.02em"
rounded:
  compact: "0.75rem"
  card: "1.125rem"
  media: "1.25rem"
  pill: "999px"
spacing:
  xxs: "0.125rem"
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  section: "2.75rem"
components:
  close-control:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.neutral-secondary}"
    rounded: "{rounded.pill}"
    size: "2rem"
  project-media:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.media}"
    width: "100%"
  content-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.neutral-strong}"
    rounded: "{rounded.card}"
    padding: "0.875rem"
  status-alpha:
    backgroundColor: "{colors.alpha-wash}"
    textColor: "{colors.alpha-ink}"
    rounded: "{rounded.pill}"
    padding: "0.3rem 0.55rem"
  status-live:
    backgroundColor: "{colors.live-wash}"
    textColor: "{colors.live-ink}"
    rounded: "{rounded.pill}"
    padding: "0.3rem 0.55rem"
---

# Design System: Justin

## Overview

**Creative North Star: "The Quiet Worktable"**

Justin's site feels like a calm physical workspace where finished artifacts have been laid out for inspection. A near-white canvas, compact system typography, and careful soft depth keep the interface restrained while folders, cards, product captures, and small physical responses make it tactile.

The visual system is evidence-led: real interfaces and official project imagery supply most of the color and character. Chrome recedes, supporting copy stays concise, and state cues are precise enough to communicate maturity without becoming decoration. Surface-specific compositions may vary with the content; the Projects page's alternating editorial rows are one such composition, not a universal template.

**Key Characteristics:**

- Neutral, near-white working surfaces with dark-gray rather than absolute-black type.
- Soft physical depth assembled from faint edge, contact, form, and ambient shadows.
- Restrained system typography with compact labels and decisive, tightly tracked project titles.
- Official imagery carries product identity; interface chrome remains quiet.
- Small, truthful status cues and subtle press or lift feedback make state legible.
- Personal statements use a dark point followed by a softer explanation, so conviction and context remain distinct.
- Dated writing uses a quiet chronological rail; tools no longer in active use move to an explicit Archived shelf.

## Colors

The palette is an achromatic work surface with sparse semantic washes; project-specific color belongs primarily inside official imagery.

### Primary

- **Workbench Ink:** The strongest neutral anchors titles, focus treatment, and high-emphasis interactive states.

### Secondary

- **Alpha Green:** A dark green on a pale green wash identifies work that is explicitly in alpha.
- **Live Teal:** A deep teal on a pale mint wash identifies a live product.

### Tertiary

- **Notice Amber:** A warm amber pairing is reserved for compact notices and badges.
- **Timeline Terracotta:** A single muted warm marker identifies the newest writing entry.

### Neutral

- **Canvas:** The default page and full-screen stage background.
- **Paper:** Cards, image mats, and translucent controls read as white physical surfaces.
- **Soft Edge:** Quiet rules, bullets, and hairline boundaries.
- **Muted Mark:** Hints and low-priority iconography.
- **Secondary Copy:** Metadata, supporting labels, and subdued controls.
- **Body Gray:** Longer descriptive copy.
- **Strong Gray:** Default titles, navigation, and primary readable text.
- **Deep Ink:** Hover emphasis where the interaction needs a final step darker.

### Named Rules

**The Borrowed Color Rule.** Let official product imagery carry product color; keep shared site chrome neutral and use semantic hues only for precise status communication.

**The Wash, Not Badge Theater Rule.** Status colors stay pale, compact, and factual. They never become oversized promotional accents.

## Typography

**Display Font:** SF Compact (with the native system sans-serif stack)
**Body Font:** SF Compact (with the native system sans-serif stack)

**Character:** One compact system family keeps the portfolio direct and native. Hierarchy comes from weight, size, tracking, and space rather than decorative font pairing.

### Hierarchy

- **Display** (600, fluid 1.75–2.5rem, 1.05): Project names and other artifact-led titles; use tight negative tracking.
- **Title** (500, 0.875rem, 1.2): Stage names, card names, navigation, and concise structural labels.
- **Body** (400, 1rem, 1.55): Short project summaries and primary descriptive prose; keep line lengths compact.
- **Label** (500, 0.75rem, 1.25): Section labels, stage metadata, and terse navigation hints.
- **Micro status** (600, 0.625rem, 0.035em): Compact maturity or state cues only.
- **Point / explanation pair** (500 / 400, 1rem, 1.55): Dark strong-neutral viewpoint followed immediately by body-gray context.

### Named Rules

**The One Family Rule.** Build hierarchy inside the system sans stack; do not add a display face merely to make a page feel designed.

**The Small Chrome Rule.** Persistent stage chrome stays between 0.75rem and 0.875rem so the artifact remains the visual subject.

## Layout

The home surface is a narrow centered column with a two-column folder grid. Its introduction stacks short point / explanation pairs before the contribution graph and folders. Full-screen collection surfaces replace that shell with edge-pinned stage chrome and content appropriate to the collection: centered carousel objects, horizontally scrollable tool rows, chronological writing, or editorial project sections.

Use generous separation between independent content groups and tighter rhythm within a group. Stage headers sit 1.5rem from the viewport edges. Projects use a centered container capped at 72rem with three-rem total side clearance, then pair image and copy in an asymmetric 8/4 relationship. At 760px and below, each project becomes a single column with the official image above its copy. This alternating desktop composition is specific to Projects and should not be copied to unrelated surfaces.

Scrollable rows preserve a visible continuation beyond the viewport and use proximity snapping. Folder and carousel objects maintain their own aspect ratios rather than being forced into a generic card grid.

### Named Rules

**The Artifact Chooses the Layout Rule.** Reuse the neutral stage and spatial restraint, then choose a composition that fits the evidence being shown.

**The Image Leads on Mobile Rule.** On responsive project rows, place the product image before copy regardless of desktop alternation.

**The Chronology Has a Spine Rule.** Writing dates sit beside a continuous quiet rail on wide screens and collapse into an inset left rail on phones; the newest entry receives the only warm marker.

## Elevation & Depth

Depth is soft, ambient, and physical. Most of the interface remains tonally flat; folders, cards, image mats, logos, and floating close controls receive layered shadows that distinguish an edge, establish contact, and then add a broad low-opacity lift. Frosted folder flaps and stage scrims use translucency and blur as material behavior, not as ornamental glass effects.

### Shadow Vocabulary

- **Hairline edge** (`0 0 0 1px rgb(0 0 0 / 0.05)`): Separates pale controls and cards from the canvas.
- **Card rest** (`0 0 0 1px rgb(0 0 0 / 0.045), 0 2px 4px rgb(0 0 0 / 0.035), 0 10px 22px rgb(0 0 0 / 0.05)`): Seats compact content cards without a heavy drop shadow.
- **Project rest** (`0 1px 2px rgb(0 0 0 / 0.05), 0 14px 42px rgb(0 0 0 / 0.09)`): Gives large official imagery quiet editorial presence.
- **Project hover** (`0 2px 4px rgb(0 0 0 / 0.05), 0 22px 54px rgb(0 0 0 / 0.12)`): Accompanies a three-pixel lift on fine pointers.
- **Folder silhouette** (`drop-shadow(0 1px 2px rgb(0 0 0 / 0.06)) drop-shadow(0 6px 12px rgb(0 0 0 / 0.06)) drop-shadow(0 18px 32px rgb(0 0 0 / 0.07))`): Follows the folder's non-rectangular outline.

### Named Rules

**The Three-Layer Light Rule.** For major physical objects, combine faint contact, form, and ambient layers; one dark drop shadow is outside the system.

**The Quiet at Rest Rule.** Lift becomes more legible on hover or active state, while resting surfaces stay calm.

## Shapes

The form language mixes soft rectangular artifacts with fully round controls and status chips. Large product media uses gently rounded 1.25rem corners; compact cards sit near 1.125rem; smaller image wells use approximately 0.75–0.8rem. Close controls and semantic chips are circular or pill-shaped.

Folders are the signature silhouette: a continuous tab-and-body outline with a broad concave join and a translucent front flap. Card corners scale with the object at folder size, then become proportionally tighter when the same object is enlarged. Inner media radii remain concentric with their outer mat.

### Named Rules

**The Object, Not Container Rule.** A logo already has a silhouette and should not be boxed in a second arbitrary card shape.

**The Concentric Corner Rule.** When an image sits inside a padded mat, subtract the padding from the outer radius so the two curves remain optically parallel.

## Components

### Close Controls

- **Shape:** A fully round 2rem control with a centered 1rem close mark.
- **Color:** White or translucent-white surface with secondary-gray icon color and a hairline edge.
- **Hover / Focus / Active:** Darken the icon on fine-pointer hover, expose a visible strong-neutral focus treatment where the control is a link, and compress to 94% on press.

### Folders

- **Character:** The site's signature tactile object and navigation container.
- **Shape:** One continuous light-gray folder silhouette with a broad concave tab join and translucent curved flap.
- **Depth:** Use silhouette-following layered drop shadows and a subtle upper flap edge.
- **Behavior:** Contents remain real, reusable objects. Press feedback scales the folder to 98% only for real pointers; reduced-motion behavior must remain respected.

### Cards / Containers

- **Corner Style:** Soft rectangles, usually 1.125rem for compact cards and 1.25rem for large project media.
- **Background:** White with slight translucency when placed over a stage.
- **Shadow Strategy:** Use the layered rest shadow; on interactive cards, pair a two-pixel lift with a slightly broader shadow.
- **Internal Padding:** Compact cards generally use 0.75–0.875rem; do not inflate padding until the content floats without structure.

### Status Cues

- **Style:** Small semibold text in a fully rounded pale wash with tight horizontal padding.
- **Meaning:** Color communicates a verified state such as Alpha or Live; wording remains the primary carrier of meaning.
- **Constraint:** Do not invent maturity, adoption, revenue, or customer status.

### Project Links

- **Style:** A compact inline label with an external-link arrow and a soft lower rule.
- **Hover / Focus:** Darken both text and rule on hover; pair the strong-neutral focus outline with a generous offset.

### Project Media

- **Style:** Official interface imagery fills a fixed-ratio white mat without decorative overlays.
- **Hover / Focus:** Lift three pixels and deepen the ambient shadow on fine pointers; preserve a two-pixel visible focus outline.
- **Responsive:** Keep the image uncropped at its intended ratio and place it above project copy on narrow screens.

### Stage Navigation

- **Style:** A fixed or edge-pinned header pairs a small title and muted metadata with a round close control.
- **Background:** Use a near-white fade when content scrolls beneath the bar; use translucent blur only where an overlay stage requires spatial continuity.

### Local Time Footer

- **Purpose:** Close the home page, Writing index, and each article with Justin's live Beijing time, echoing the location preview in the introduction.
- **Style:** A single left-aligned tabular label in muted neutral, written naturally as `11:25pm in Beijing, China` without a container or divider.
- **Behavior:** Format in China Standard Time regardless of the visitor's location; update in place without drawing attention.

### Viewpoint Pairs

- **Point:** One concise, medium-weight sentence in strong neutral.
- **Explanation:** One immediately adjacent sentence in body gray; it adds evidence or personality without competing with the point.
- **Rhythm:** Keep each pair tight internally and use a full body-leading gap between pairs.

### Writing Timeline

- **Wide screens:** Date and year sit in a narrow right-aligned column, separated from the article by a one-pixel rail and small round marker.
- **Small screens:** The rail moves to the left edge; date, year, title, and summary stack in natural reading order.
- **State:** Only the newest article uses the warm accent marker. Older entries stay neutral.

### Archived Tools

- **Meaning:** Archived contains products Justin used previously, not recommendations for his current setup.
- **Presentation:** Reuse the compact software-card structure and official app icon, with concise past-tense-neutral descriptions and no featured state.

### Monthly Film Rolls

- **Structure:** Memory is a vertical archive ordered by month. Each month may contain several finite film rolls rather than one endless horizontal strip.
- **Desktop:** A roll fits four to six photographs into one shared row. Frames keep one visual height and derive their width from the source aspect ratio.
- **Mobile:** Each finite roll becomes a native horizontal scroller with the next frame left partially visible; months still progress vertically.
- **Shape:** Only the outside ends of a roll receive the large capsule radius. Interior frames meet at a four-to-six-pixel seam and do not become separate cards.
- **Depth:** The roll gets at most a hairline edge. Individual photographs do not receive shadows or floating-card treatment.
- **Viewing:** Selecting a photograph opens a focused dark viewing room. Native dialog focus, backdrop dismissal, and Escape return the visitor to the same place in the roll.

## Do's and Don'ts

### Do:

- **Do** keep shared chrome neutral so shipped artifacts remain the subject.
- **Do** use official product imagery and real interfaces as visual proof.
- **Do** communicate maturity with concise text plus a restrained semantic wash.
- **Do** build depth from several faint layers and pair interaction feedback with pointer capability.
- **Do** preserve visible focus, reduced-motion behavior, and image-first mobile reading order.
- **Do** choose layout per surface while retaining the same canvas, type restraint, depth, and control language.

### Don't:

- **Don't** promote the Projects page's alternating editorial composition into a universal site rule.
- **Don't** introduce loud shared brand gradients, saturated chrome, or decorative product-color accents.
- **Don't** replace official interface evidence with generic mockups or abstract illustrations.
- **Don't** use a single dark drop shadow, excessive blur, or glass effects without a physical layering purpose.
- **Don't** turn folders, logos, and project imagery into identical generic cards.
- **Don't** imply product maturity or success beyond the verified status shown in the content.
