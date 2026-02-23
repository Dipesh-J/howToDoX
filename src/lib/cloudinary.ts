import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const uploadVideo = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: 'video',
          folder: 'howtodo',
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      .end(buffer)
  })
}

export const uploadImage = async (imageUrl: string, publicId: string) => {
  return cloudinary.uploader.upload(imageUrl, {
    public_id: publicId,
    folder: 'howtodo/frames',
    resource_type: 'image',
  })
}

export const extractFrames = async (videoPublicId: string, count: number = 10) => {
  const frames = []
  const duration = await getVideoDuration(videoPublicId)
  const interval = duration / count

  for (let i = 0; i < count; i++) {
    const timestamp = Math.round(i * interval)
    const frameUrl = cloudinary.url(videoPublicId, {
      resource_type: 'video',
      format: 'jpg',
      transformation: [
        {
          start_offset: timestamp,
          width: 640,
          height: 360,
          crop: 'fill',
        },
      ],
    })
    frames.push({
      timestamp,
      imageUrl: frameUrl,
    })
  }

  return frames
}

const getVideoDuration = async (publicId: string): Promise<number> => {
  const result = await cloudinary.api.resource(publicId, {
    resource_type: 'video',
  })
  return result.duration || 60
}

export const deleteVideo = async (publicId: string) => {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: 'video',
  })
}

export { cloudinary }
