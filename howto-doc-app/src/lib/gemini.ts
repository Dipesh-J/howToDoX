'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'
import os from 'os'
import crypto from 'crypto'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')
const fileManager = new GoogleAIFileManager(process.env.GOOGLE_AI_API_KEY || '')

const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
})

export const analyzeFrame = async (imageUrl: string): Promise<string> => {
  const imagePart = {
    inlineData: {
      data: await urlToBase64(imageUrl),
      mimeType: 'image/jpeg',
    },
  }

  const prompt = `Analyze this screenshot from a how-to video.
Write a single instructional step for the READER telling them what to do, as if writing a how-to guide or tutorial blog post.
Use imperative voice (e.g. "Click the Submit button", "Open the File menu", "Scroll down to the Settings section").
Do NOT describe what 'the user' does — write directly to the reader.
Be specific about the UI element, button, or action involved.`

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


export async function analyzeVideoMultimodal(videoId: string) {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
  })
  
  if (!video) throw new Error('Video not found')

  // 1. Download video to /tmp
  const response = await fetch(video.secureUrl)
  if (!response.ok) throw new Error('Failed to download video from Cloudinary')
  
  const arrayBuffer = await response.arrayBuffer()
  const tempFilePath = path.join(os.tmpdir(), `${crypto.randomUUID()}.mp4`)
  fs.writeFileSync(tempFilePath, Buffer.from(arrayBuffer))

  let uploadResult
  try {
    // 2. Upload to Google AI File Manager
    uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType: "video/mp4",
      displayName: video.title,
    })
    
    // Wait for processing
    let fileState = uploadResult.file.state
    while (fileState === FileState.PROCESSING) {
      await new Promise((resolve) => setTimeout(resolve, 5000))
      const getResponse = await fileManager.getFile(uploadResult.file.name)
      fileState = getResponse.state
    }
    
    if (fileState === FileState.FAILED) {
      throw new Error("Video processing failed in Gemini backend")
    }

    // 3. Prompt Gemini
    const prompt = `Watch this video guide carefully. Extract each meaningful action step and write it as an instruction for the READER — like a how-to blog post or tutorial guide.

Rules:
- Write each step in imperative voice, directed at the reader (e.g. "Click the red button", "Open the dropdown menu", "Scroll down to the Examples section").
- Do NOT use phrases like "The user clicks", "The user navigates", or "The video shows" — write directly to the reader.
- SKIP the very first frame if it shows only an idle or starting screen with no meaningful action (e.g. a blank page, a recording interface, or an app just opened).
- SKIP the very last frame if it just shows the user returning to the recording application or switching back to the recording tab — that is not part of the tutorial.
- SKIP any step where no meaningful action is being taken.
- Each step must be a clear, actionable instruction.

For each step provide:
1. The exact timestamp in seconds when the action occurs.
2. A concise instructional description written for the reader.

Return the response as a valid JSON array. Example:
[
  { "timestamp": 5, "description": "Click the large red Submit button to save your changes." },
  { "timestamp": 18, "description": "Open the File menu and select New Project." }
]
Only return the raw JSON array, no markdown blocks or backticks.`

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResult.file.mimeType,
          fileUri: uploadResult.file.uri
        }
      },
      { text: prompt }
    ])
    
    const responseText = result.response.text().replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim()
    const steps = JSON.parse(responseText) as {timestamp: number, description: string}[]

    // 4. Save dynamic frames to DB using Cloudinary's dynamic offset URL syntax
    // e.g. /upload/so_15/v1234/file.jpg
    
    const framesData = steps.map(step => {
      // Cloudinary URL structure: https://res.cloudinary.com/<cloud_name>/video/upload/v<version>/<public_id>.mp4
      // We want: https://res.cloudinary.com/<cloud_name>/video/upload/so_<timestamp>/v<version>/<public_id>.jpg
      
      const parts = video.secureUrl.split('/upload/')
      const dynamicImageUrl = parts[0] + `/upload/so_${step.timestamp}/` + parts[1].replace(/\.[^/.]+$/, '.jpg')
      
      return {
        videoId: video.id,
        timestamp: step.timestamp,
        imageUrl: dynamicImageUrl,
        aiSuggestion: step.description,
      }
    })

    // Delete existing old frames if running retry
    await prisma.frame.deleteMany({ where: { videoId: video.id } })

    // Create new smart frames
    await prisma.frame.createMany({
      data: framesData
    })
    
    // Update video to transcribed
    await prisma.video.update({
      where: { id: video.id },
      data: { status: 'TRANSCRIBED' }
    })

    return framesData
  } catch (error) {
    console.error('Error analyzing video multimodally:', error)
    throw error
  } finally {
     if (fs.existsSync(tempFilePath)) {
       fs.unlinkSync(tempFilePath)
     }
     if (uploadResult?.file?.name) {
       await fileManager.deleteFile(uploadResult.file.name).catch(() => {})
     }
  }
}
