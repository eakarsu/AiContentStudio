const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const UPLOADS_DIR = path.join(__dirname, '../../public/uploads');

// Generate audio using OpenAI TTS
async function generateTTS(text, options = {}) {
  const {
    voice = 'alloy',
    model = 'tts-1',
    filename = `audio_${Date.now()}.mp3`
  } = options;

  // Truncate text to 4096 chars (OpenAI TTS limit)
  const truncatedText = text.slice(0, 4096);

  const audioDir = path.join(UPLOADS_DIR, 'audio');
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  const filePath = path.join(audioDir, filename);

  const mp3 = await openai.audio.speech.create({
    model,
    voice,
    input: truncatedText
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  // Estimate duration (rough: ~150 words per minute, avg 5 chars per word)
  const estimatedDuration = Math.ceil((truncatedText.length / 5) / 150 * 60);

  return {
    url: `/uploads/audio/${filename}`,
    duration: estimatedDuration,
    filePath
  };
}

// Generate image using DALL-E
async function generateImage(prompt, options = {}) {
  const {
    size = '1024x1024',
    quality = 'standard',
    model = 'dall-e-3',
    filename = `image_${Date.now()}.png`
  } = options;

  const imageDir = path.join(UPLOADS_DIR, 'images');
  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
  }

  const response = await openai.images.generate({
    model,
    prompt: prompt.slice(0, 4000),
    n: 1,
    size,
    quality
  });

  const imageUrl = response.data[0].url;

  // Download the image
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
  const filePath = path.join(imageDir, filename);
  fs.writeFileSync(filePath, imageBuffer);

  return {
    url: `/uploads/images/${filename}`,
    revisedPrompt: response.data[0].revised_prompt,
    filePath
  };
}

// Map voice names to OpenAI TTS voices
function mapVoice(voiceName) {
  const voiceMap = {
    'neutral': 'alloy',
    'female': 'nova',
    'male': 'onyx',
    'professional': 'onyx',
    'friendly': 'shimmer',
    'warm': 'shimmer',
    'calm': 'echo',
    'dramatic': 'fable',
    'energetic': 'nova',
    'authoritative': 'onyx',
    'educational': 'alloy',
    'clear': 'alloy',
    'narrative': 'fable',
    'announcer': 'onyx',
    'fantasy': 'fable',
    'news': 'onyx',
    'motivational': 'nova'
  };
  return voiceMap[voiceName?.toLowerCase()] || 'alloy';
}

module.exports = {
  generateTTS,
  generateImage,
  mapVoice
};
