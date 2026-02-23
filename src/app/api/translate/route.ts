import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { translateText, translateDocument } from '@/lib/lingod'

export async function POST(request: NextRequest) {
  // Allow public translation for shared documents
  // const { userId } = await auth()
  // if (!userId) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // }

  const body = await request.json()
  const { content, sourceLocale, targetLocale } = body

  if (!content || !targetLocale) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const translated = await translateDocument(content, sourceLocale || 'en', targetLocale)
    return NextResponse.json({ translated })
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 })
  }
}
