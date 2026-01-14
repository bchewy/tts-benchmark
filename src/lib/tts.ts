import { db, ensureSchema } from "@/lib/db";

const DEFAULTS = {
  openai: {
    model: "gpt-4o-mini-tts",
    voice: "alloy",
  },
  elevenlabs: {
    model: "eleven_multilingual_v2",
    voiceId: "21m00Tcm4TlvDq8ikWAM",
    stability: 0.4,
    similarityBoost: 0.75,
  },
  gemini: {
    model: "gemini-2.5-flash-preview-tts",
    voice: "Kore",
    sampleRate: 24000,
  },
  inworld: {
    model: "inworld-tts-1",
    voice: "Dennis",
    encoding: "MP3",
  },
};

type CachedAudio = {
  audio: Buffer;
  format: string;
  cached: boolean;
  model: string;
  voice: string;
};

type GenerateArgs = {
  providerId: string;
  promptId: string;
  promptText: string;
};

const parseNumber = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const parseOptionalNumber = (value: string | undefined) => {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const parseOptionalInt = (value: string | undefined) => {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const resolveInworldFormat = (encoding: string) => {
  const normalized = encoding.toUpperCase();
  if (normalized === "LINEAR16") {
    return "wav";
  }
  if (normalized === "OGG_OPUS") {
    return "ogg";
  }
  if (normalized === "FLAC") {
    return "flac";
  }
  if (normalized === "ALAW") {
    return "alaw";
  }
  if (normalized === "MULAW") {
    return "mulaw";
  }
  return "mp3";
};

type InworldConfig = {
  model: string;
  voice: string;
  encoding: string;
  format: string;
  audioConfig: Record<string, number | string>;
  temperature?: number;
  cacheKey: string;
};

const getInworldConfig = (): InworldConfig => {
  const model = process.env.INWORLD_TTS_MODEL ?? DEFAULTS.inworld.model;
  const voice = process.env.INWORLD_TTS_VOICE ?? DEFAULTS.inworld.voice;
  const encoding = (process.env.INWORLD_TTS_ENCODING ?? DEFAULTS.inworld.encoding).toUpperCase();
  const speakingRate = parseOptionalNumber(process.env.INWORLD_TTS_SPEAKING_RATE);
  const sampleRateHertz = parseOptionalInt(process.env.INWORLD_TTS_SAMPLE_RATE);
  const bitRate = parseOptionalInt(process.env.INWORLD_TTS_BIT_RATE);
  const temperature = parseOptionalNumber(process.env.INWORLD_TTS_TEMPERATURE);

  const audioConfig: Record<string, number | string> = {
    audioEncoding: encoding,
  };

  if (speakingRate !== undefined) {
    audioConfig.speakingRate = speakingRate;
  }
  if (sampleRateHertz !== undefined) {
    audioConfig.sampleRateHertz = sampleRateHertz;
  }
  if (bitRate !== undefined) {
    audioConfig.bitRate = bitRate;
  }

  const cacheKey = [
    model,
    encoding,
    speakingRate ?? "default",
    sampleRateHertz ?? "default",
    bitRate ?? "default",
    temperature ?? "default",
  ].join("|");

  return {
    model,
    voice,
    encoding,
    format: resolveInworldFormat(encoding),
    audioConfig,
    temperature,
    cacheKey,
  };
};

const pcmToWav = (
  pcm: Buffer,
  sampleRate: number,
  channels = 1,
  bitsPerSample = 16
) => {
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const dataSize = pcm.length;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  pcm.copy(buffer, 44);

  return buffer;
};

const loadFromCache = async (
  providerId: string,
  promptId: string,
  model: string,
  voice: string
) => {
  const result = await db.execute({
    sql: "SELECT audio_base64, format FROM tts_audio WHERE provider_id = ? AND prompt_id = ? AND model = ? AND voice = ? LIMIT 1;",
    args: [providerId, promptId, model, voice],
  });

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    base64: String(row.audio_base64),
    format: String(row.format),
  };
};

const saveToCache = async (
  providerId: string,
  promptId: string,
  model: string,
  voice: string,
  format: string,
  base64: string
) => {
  await db.execute({
    sql: "INSERT OR IGNORE INTO tts_audio (provider_id, prompt_id, model, voice, format, audio_base64) VALUES (?, ?, ?, ?, ?, ?);",
    args: [providerId, promptId, model, voice, format, base64],
  });
};

const generateOpenAI = async (promptText: string) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const model = process.env.OPENAI_TTS_MODEL ?? DEFAULTS.openai.model;
  const voice = process.env.OPENAI_TTS_VOICE ?? DEFAULTS.openai.voice;

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      voice,
      input: promptText,
      response_format: "mp3",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI TTS failed: ${errorText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    audio: buffer,
    model,
    voice,
  };
};

const generateElevenLabs = async (promptText: string) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ELEVENLABS_API_KEY");
  }

  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? DEFAULTS.elevenlabs.voiceId;
  const model = process.env.ELEVENLABS_MODEL_ID ?? DEFAULTS.elevenlabs.model;
  const stability = parseNumber(
    process.env.ELEVENLABS_VOICE_STABILITY,
    DEFAULTS.elevenlabs.stability
  );
  const similarityBoost = parseNumber(
    process.env.ELEVENLABS_VOICE_SIMILARITY,
    DEFAULTS.elevenlabs.similarityBoost
  );

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: promptText,
        model_id: model,
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs TTS failed: ${errorText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    audio: buffer,
    model,
    voice: voiceId,
  };
};

const generateGeminiTTS = async (promptText: string) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const model = process.env.GEMINI_TTS_MODEL ?? DEFAULTS.gemini.model;
  const voice = process.env.GEMINI_TTS_VOICE ?? DEFAULTS.gemini.voice;
  const sampleRate = parseNumber(
    process.env.GEMINI_TTS_SAMPLE_RATE,
    DEFAULTS.gemini.sampleRate
  );

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: promptText }],
          },
        ],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
        model,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini TTS failed: ${errorText}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ inlineData?: { data?: string } }> };
    }>;
  };
  const audioBase64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioBase64) {
    throw new Error("Gemini TTS missing audio data");
  }

  const pcm = Buffer.from(audioBase64, "base64");
  const wav = pcmToWav(pcm, sampleRate);

  return {
    audio: wav,
    model,
    voice,
  };
};

const generateInworldTTS = async (
  promptText: string,
  config: InworldConfig
) => {
  const rawAuth = process.env.INWORLD_BASIC_AUTH;
  if (!rawAuth) {
    throw new Error("Missing INWORLD_BASIC_AUTH");
  }

  const authHeader = rawAuth.startsWith("Basic ") ? rawAuth : `Basic ${rawAuth}`;

  const response = await fetch("https://api.inworld.ai/tts/v1/voice", {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: promptText,
      voiceId: config.voice,
      modelId: config.model,
      audioConfig: config.audioConfig,
      ...(config.temperature !== undefined ? { temperature: config.temperature } : {}),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Inworld TTS failed: ${errorText}`);
  }

  const data = (await response.json()) as { audioContent?: string };
  if (!data.audioContent) {
    throw new Error("Inworld TTS missing audioContent");
  }

  return Buffer.from(data.audioContent, "base64");
};

export async function getOrCreateAudio({
  providerId,
  promptId,
  promptText,
}: GenerateArgs): Promise<CachedAudio> {
  await ensureSchema();

  if (providerId === "openai") {
    const model = process.env.OPENAI_TTS_MODEL ?? DEFAULTS.openai.model;
    const voice = process.env.OPENAI_TTS_VOICE ?? DEFAULTS.openai.voice;
    const cached = await loadFromCache(providerId, promptId, model, voice);

    if (cached) {
      return {
        audio: Buffer.from(cached.base64, "base64"),
        format: cached.format,
        cached: true,
        model,
        voice,
      };
    }

    const result = await generateOpenAI(promptText);
    const base64 = result.audio.toString("base64");

    await saveToCache(providerId, promptId, result.model, result.voice, "mp3", base64);

    return {
      audio: result.audio,
      format: "mp3",
      cached: false,
      model: result.model,
      voice: result.voice,
    };
  }

  if (providerId === "elevenlabs") {
    const model = process.env.ELEVENLABS_MODEL_ID ?? DEFAULTS.elevenlabs.model;
    const voice = process.env.ELEVENLABS_VOICE_ID ?? DEFAULTS.elevenlabs.voiceId;
    const cached = await loadFromCache(providerId, promptId, model, voice);

    if (cached) {
      return {
        audio: Buffer.from(cached.base64, "base64"),
        format: cached.format,
        cached: true,
        model,
        voice,
      };
    }

    const result = await generateElevenLabs(promptText);
    const base64 = result.audio.toString("base64");

    await saveToCache(providerId, promptId, result.model, result.voice, "mp3", base64);

    return {
      audio: result.audio,
      format: "mp3",
      cached: false,
      model: result.model,
      voice: result.voice,
    };
  }

  if (providerId === "gemini") {
    const model = process.env.GEMINI_TTS_MODEL ?? DEFAULTS.gemini.model;
    const voice = process.env.GEMINI_TTS_VOICE ?? DEFAULTS.gemini.voice;
    const cached = await loadFromCache(providerId, promptId, model, voice);

    if (cached) {
      return {
        audio: Buffer.from(cached.base64, "base64"),
        format: cached.format,
        cached: true,
        model,
        voice,
      };
    }

    const result = await generateGeminiTTS(promptText);
    const base64 = result.audio.toString("base64");

    await saveToCache(providerId, promptId, result.model, result.voice, "wav", base64);

    return {
      audio: result.audio,
      format: "wav",
      cached: false,
      model: result.model,
      voice: result.voice,
    };
  }

  if (providerId === "inworld") {
    const config = getInworldConfig();
    const cached = await loadFromCache(
      providerId,
      promptId,
      config.cacheKey,
      config.voice
    );

    if (cached) {
      return {
        audio: Buffer.from(cached.base64, "base64"),
        format: cached.format,
        cached: true,
        model: config.model,
        voice: config.voice,
      };
    }

    const audio = await generateInworldTTS(promptText, config);
    const base64 = audio.toString("base64");

    await saveToCache(
      providerId,
      promptId,
      config.cacheKey,
      config.voice,
      config.format,
      base64
    );

    return {
      audio,
      format: config.format,
      cached: false,
      model: config.model,
      voice: config.voice,
    };
  }

  throw new Error(`Unsupported provider: ${providerId}`);
}
