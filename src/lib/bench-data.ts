export type Provider = {
  id: string;
  name: string;
  logo?: string;
  logoAlt?: string;
  logoWidth?: number;
  logoHeight?: number;
  tagline: string;
  price: string;
  latency: string;
  streaming: string;
  url: string;
  accent: string;
  enabled: boolean;
};

export type Prompt = {
  id: string;
  label: string;
  text: string;
};

export const getLogoSize = (
  provider: Provider,
  height: number,
  fallbackWidth = 120
) => {
  if (provider.logoWidth && provider.logoHeight) {
    return {
      width: Math.round((provider.logoWidth / provider.logoHeight) * height),
      height,
    };
  }

  return { width: fallbackWidth, height };
};

export const providers: Provider[] = [
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    logo: "/logos/elevenlabs.svg",
    logoAlt: "ElevenLabs",
    logoWidth: 694,
    logoHeight: 90,
    tagline: "Cinematic, expressive voices",
    price: "$0.30 to $0.99 / 1k chars",
    latency: "TBD",
    streaming: "Yes",
    url: "https://elevenlabs.io",
    accent: "#ff5f2e",
    enabled: true,
  },
  {
    id: "openai",
    name: "OpenAI",
    logo: "/logos/openai.svg",
    logoAlt: "OpenAI",
    logoWidth: 1180,
    logoHeight: 320,
    tagline: "Clean, balanced delivery",
    price: "$0.015 / 1k chars",
    latency: "TBD",
    streaming: "Yes",
    url: "https://platform.openai.com",
    accent: "#f59e0b",
    enabled: true,
  },
  /*
  {
    id: "gemini",
    name: "Gemini",
    logo: "/logos/gemini.svg",
    logoAlt: "Gemini",
    tagline: "Gemini TTS (preview)",
    price: "TBD",
    latency: "TBD",
    streaming: "Yes",
    url: "https://ai.google.dev/gemini-api/docs/speech-generation",
    accent: "#4285f4",
    enabled: true,
  },
  */
  {
    id: "inworld",
    name: "Inworld",
    logo: "/logos/inworld.svg",
    logoAlt: "Inworld",
    logoWidth: 94,
    logoHeight: 18,
    tagline: "Character-focused voices",
    price: "TBD",
    latency: "TBD",
    streaming: "Yes",
    url: "https://platform.inworld.ai",
    accent: "#0f766e",
    enabled: true,
  },
  {
    id: "cartesia",
    name: "Cartesia",
    tagline: "Real-time, low latency",
    price: "TBD",
    latency: "TBD",
    streaming: "Yes",
    url: "https://cartesia.ai",
    accent: "#1b9e8a",
    enabled: false,
  },
];

export const prompts: Prompt[] = [
  {
    id: "short",
    label: "Short",
    text: "Clear speech is a craft. Every syllable matters.",
  },
  {
    id: "emotion",
    label: "Emotion",
    text: "I waited all week for this call, and now I finally get to say thank you.",
  },
  {
    id: "numbers",
    label: "Numbers",
    text: "Order 4821 ships on 02/15/2026 at 7:45 PM. ETA: 3 days.",
  },
];

export const audioSrc = (providerId: string, promptId: string) =>
  `/api/audio?provider=${providerId}&prompt=${promptId}`;
