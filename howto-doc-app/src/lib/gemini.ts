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
    const prompt = `Watch this video guide carefully. Break down the tutorial into specific steps.
For each step where an action happens, provide:
1. The exact timestamp in seconds when the action occurs.
2. A description of what is happening.

Return the response as a valid JSON array of objects. Example format:
[
  { "timestamp": 12, "description": "Clicking the big red button" },
  { "timestamp": 25, "description": "Typing the email address and submitting" }
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
