import { LingoDotDevEngine } from 'lingo.dev/sdk'

let engine: LingoDotDevEngine | null = null

const getEngine = async () => {
  if (!engine) {
    engine = new LingoDotDevEngine({
      apiKey: process.env.LINGODOTDEV_API_KEY || '',
    })
  }
  return engine
}

export const translateText = async (
  text: string,
  sourceLocale: string = 'en',
  targetLocale: string
): Promise<string> => {
  const eng = await getEngine()
  const result = await eng.localizeText(text, {
    sourceLocale,
    targetLocale,
  })
  return result
}

export const translateDocument = async (
  content: string,
  sourceLocale: string = 'en',
  targetLocale: string
): Promise<string> => {
  const eng = await getEngine()
  const result = await eng.localizeText(content, {
    sourceLocale,
    targetLocale,
  })
  return result
}

export const getSupportedLanguages = () => {
  return [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ru', name: 'Russian' },
  ]
}
