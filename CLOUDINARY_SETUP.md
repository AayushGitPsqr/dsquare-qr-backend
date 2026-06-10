# Cloudinary Integration Setup Guide

This backend now uses Cloudinary for image storage and management instead of local disk storage.

## Prerequisites

1. Create a Cloudinary account at https://cloudinary.com/users/register/free
2. Get your Cloudinary credentials from the Dashboard

## Configuration

### 1. Environment Variables

Add the following to your `.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=business-cards

# Image Enhancement Settings
IMAGE_ENHANCEMENT_ENABLED=true
IMAGE_ENHANCEMENT_QUALITY=90
IMAGE_ENHANCEMENT_BRIGHTNESS=10
IMAGE_ENHANCEMENT_CONTRAST=20
IMAGE_ENHANCEMENT_SHARPEN=true
```

### 2. Get Your Credentials

From your Cloudinary Dashboard:
- **Cloud Name**: Found in the top-left corner of your dashboard
- **API Key**: Found in Settings > API Keys
- **API Secret**: Found in Settings > API Keys (keep this secret!)

## How It Works

### Image Upload Flow

1. **Client sends image** to `/api/cards/scan` endpoint
2. **Multer with Cloudinary Storage** uploads directly to Cloudinary
3. **Image enhancement middleware** applies Cloudinary transformations for OCR optimization
4. **OCR service** processes the image (handles both local paths and Cloudinary URLs)
5. **Response includes**:
   - Extracted business card data
   - Secure Cloudinary URL (`cardImage`)
   - Public ID for future reference (`cloudinaryPublicId`)

### Key Benefits

- **No Local Storage**: Images are stored in Cloudinary's CDN
- **Automatic Optimization**: Cloudinary handles image optimization and serving
- **Scalability**: No disk space limitations
- **Performance**: CDN-backed delivery for faster image loading
- **Security**: API credentials are never exposed

## API Response

When you scan a business card, the response includes:

```json
{
  "status": "success",
  "message": "Card scanned successfully",
  "data": {
    "name": "John Doe",
    "designation": "Senior Developer",
    "company": "Acme Corp",
    "email": "john@acme.com",
    "phone": "+1234567890",
    "website": "https://acme.com",
    "address": "123 Main St",
    "cardImage": "https://res.cloudinary.com/.../image.jpg",
    "cloudinaryPublicId": "business-cards/1234567890-card",
    "rawText": "...",
    "provider": "openai"
  }
}
```

## OCR Service Compatibility

The OCR service now supports:
- **Cloudinary URLs**: Used directly for better performance
- **Local file paths**: Automatically detected and processed
- **All OCR providers**: Tesseract, OpenAI, Mistral, Google Vision, Azure Vision

## Troubleshooting

### Missing Cloudinary Credentials
If you see: `Cloudinary credentials are not properly configured`
- Verify all three credentials are set in `.env`
- Ensure no typos in credential names

### Image Upload Fails
- Check your Cloudinary account has available upload quota
- Verify the image file is a valid JPG, JPEG, or PNG
- Check API credentials are correct

### OCR Service Issues
- For local files: Ensure the file path is accessible
- For URLs: Verify the URL is publicly accessible (Cloudinary URLs are public by default)

## File Changes

### Removed
- ❌ Local disk storage configuration in `upload.ts`
- ❌ `UPLOAD_DIR` environment variable

### Added
- ✅ Cloudinary service (`src/services/cloudinaryService.ts`)
- ✅ Cloudinary configuration in `env.ts`
- ✅ `multer-storage-cloudinary` package

### Modified
- 📝 `upload.ts`: Now uses Cloudinary storage
- 📝 `imageEnhancement.ts`: Uses Cloudinary transformations
- 📝 `businessCardController.ts`: Returns Cloudinary URLs
- 📝 `ocrService.ts`: Handles both URLs and local paths
- 📝 `openAiCardExtractor.ts`: Supports URLs directly
