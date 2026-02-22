import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
})

export const analyzeFrame = async (imageUrl: string): Promise<string> => {
  const imagePart = {
    inlineData: {
      data: await urlToBase64(imageUrl),
      mimeType: 'image/jpeg',
    },
  }

  const prompt = `Analyze this screenshot from a how-to video. 
Describe what action is being performed on screen.
Be specific about:
- What tool/interface is shown
- What action is being taken
- What the expected result would be
- Any buttons, menus, or UI elements involved

Format as a single instruction step, starting with an action verb.`

  const result = await model.generateContent([prompt, imagePart])
  const response = await result.response
  return response.text()
}

export const generateDocumentTitle = async (frames: string[]): Promise<string> => {
  const prompt = `Based on these video frame descriptions, infer what task this how-to video is teaching:
${frames.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Return a short, clear title (3-7 words) that describes what this video teaches someone to do.`

  const result = await model.generateContent(prompt)
  const response = await result.response
  return response.text().trim()
}

async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url)
  const buffer = await response.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  return base64
}

export { model }
