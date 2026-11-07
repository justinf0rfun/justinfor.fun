export const FOLLOW_UPS = [
  { ask: "最近在做什么？", reply: "在作业帮做 AI agents，也在做自己的小产品。" },
  { ask: "你喜欢怎样做产品？", reply: "先做出来，再做好，再做得更好。" },
  { ask: "怎么找到你？", reply: "发邮件到 hello@jiaq.ing，或者在 X 上找我。" },
];

export interface ChatState {
  open: boolean;
  mode: "text" | "voice";
  step: number;
  messages: { mine: boolean; text: string }[];
  replying: boolean;
  phase: "idle" | "listening" | "thinking" | "speaking";
  voiceTurn: number | null;
}

export interface ChatAction {
  type: "toggle" | "close" | "voice-enter" | "voice-exit" | "send" | "text-reply"
    | "voice-start" | "voice-think" | "voice-reply" | "voice-finish" | "voice-stop";
}

export const initialChatState: ChatState = {
  open: false,
  mode: "text",
  step: 0,
  messages: [{ mine: false, text: "Hi, I’m Justin 👋" }],
  replying: false,
  phase: "idle",
  voiceTurn: null,
};

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  const next = FOLLOW_UPS[state.step];
  switch (action.type) {
    case "toggle":
    case "close":
      return { ...state, open: action.type === "toggle" && !state.open, mode: "text", phase: "idle", voiceTurn: null };
    case "voice-enter":
      if (!state.open || state.replying || state.mode === "voice") return state;
      return { ...state, mode: "voice", phase: "idle", voiceTurn: null };
    case "voice-exit":
      if (state.mode !== "voice") return state;
      return { ...state, mode: "text", phase: "idle", voiceTurn: null };
    case "send":
      if (!state.open || state.mode !== "text" || state.replying || !next) return state;
      return { ...state, replying: true, messages: [...state.messages, { mine: true, text: next.ask }] };
    case "text-reply":
      if (!state.replying || !next) return state;
      return { ...state, replying: false, step: state.step + 1, messages: [...state.messages, { mine: false, text: next.reply }] };
    case "voice-start":
      if (!state.open || state.mode !== "voice" || state.phase !== "idle" || !next) return state;
      return { ...state, phase: "listening", voiceTurn: state.step };
    case "voice-think":
      if (!state.open || state.mode !== "voice" || state.phase !== "listening") return state;
      return { ...state, phase: "thinking" };
    case "voice-reply": {
      if (!state.open || state.mode !== "voice" || state.phase !== "thinking" || state.voiceTurn === null) return state;
      const turn = FOLLOW_UPS[state.voiceTurn];
      return {
        ...state, phase: "speaking", step: state.step + 1,
        messages: [...state.messages, { mine: true, text: turn.ask }, { mine: false, text: turn.reply }],
      };
    }
    case "voice-finish":
      if (!state.open || state.mode !== "voice" || state.phase !== "speaking") return state;
      return { ...state, phase: "idle" };
    case "voice-stop":
      if (state.mode !== "voice" || state.phase === "idle") return state;
      return { ...state, phase: "idle", voiceTurn: state.voiceTurn !== null && state.step > state.voiceTurn ? state.voiceTurn : null };
  }
}
