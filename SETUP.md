# ChartSpeak - Gemini AI Integration

This application now uses Google's Gemini AI to analyze charts and provide insights for visually impaired users.

## Setup Instructions

### 1. Install Dependencies

First, install the required package:

```bash
pnpm add @google/generative-ai
```

### 2. Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 3. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and add your API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

### 4. Run the Application

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## How It Works

### Upload Flow
1. User uploads a chart image on the home page
2. The image is sent to `/api/analyze-chart` endpoint
3. Gemini AI analyzes the chart and returns detailed insights
4. Insights are stored in sessionStorage and displayed on the insights page

### Chat Flow
1. User can ask follow-up questions about the chart
2. Questions are sent to the same API with conversation history
3. Gemini provides contextual answers based on the chart and conversation
4. Text-to-speech can read insights aloud

## API Endpoint

**POST** `/api/analyze-chart`

**Body (FormData):**
- `image`: The chart image file (required)
- `question`: Follow-up question (optional)
- `history`: JSON string of conversation history (optional)

**Response:**
```json
{
  "insights": "AI-generated analysis of the chart..."
}
```

## Features

✅ Real-time chart analysis using Gemini AI
✅ Conversational follow-up questions
✅ Text-to-speech for accessibility
✅ Session-based data persistence
✅ Support for various chart types (bar, line, pie, etc.)

## Error Handling

- If no API key is configured, the API returns a 500 error
- If no chart is uploaded, redirects to home page
- Network errors show user-friendly messages
- Console logs provide debugging information

## Accessibility

The application is designed with accessibility in mind:
- Screen reader announcements for all actions
- Keyboard navigation support
- ARIA labels and roles
- Text-to-speech integration
- High contrast UI elements

## Notes

- The API key should never be committed to version control
- `.env.local` is gitignored by default in Next.js
- Gemini API has rate limits - check [pricing](https://ai.google.dev/pricing) for details
- Images are converted to base64 for API transmission
