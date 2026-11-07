import systems from "./systems.html?raw";
import themes from "./themes.html?raw";
import icons from "./icons.html?raw";
import colors from "./colors.html?raw";
import states from "./states.html?raw";
import effects from "./effects.html?raw";
import languages from "./languages.html?raw";

type Artwork = { rotation: number } & ({ html: string } | { src: string });
export type ArtworkId = "systems" | "themes" | "icons" | "colors" | "states" | "effects" | "languages" | "claude" | "chatgpt" | "grok";

// Original Graphical artwork; provenance is recorded in public/intro/NOTICE.txt.
export const artwork: Record<ArtworkId, Artwork> = {
  systems: { html: systems, rotation: 4 },
  themes: { html: themes, rotation: -9 },
  icons: { html: icons, rotation: -7 },
  colors: { html: colors, rotation: -8 },
  states: { html: states, rotation: -11 },
  effects: { html: effects, rotation: 11 },
  languages: { html: languages, rotation: 12 },
  claude: { src: "/intro/claude-color.svg", rotation: 0 },
  chatgpt: { src: "/intro/chatgpt-sticker.svg", rotation: -12 },
  grok: { src: "/intro/grok.svg", rotation: 0 },
};
