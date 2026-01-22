# THIS PROJECT IS A MOCKUP OF THE CHARTSPEAK APPLICATION; A MODERN UI + AI INSIGHTS ARE IMPLEMENTED, WHILE OTHER FEATURES WILL BE DEVELOPED LATER

# ChartSpeak - Data Through Sound

ChartSpeak is an accessible web application that converts visual charts into audio representations, empowering blind and visually impaired users to independently analyze and understand data through sound.

## Overview

ChartSpeak transforms the way visually impaired individuals interact with data visualizations by converting chart images into audio frequencies. Users can explore data by touching or navigating through chart elements, hearing values represented as different pitches, and receiving AI-powered insights through text-to-speech.

## Pages

### 1. Upload Page (`/`)

The entry point where users upload chart images for analysis.

**Features:**
- Drag-and-drop file upload with keyboard support
- Supports PNG, JPG, and SVG formats
- Image preview with file details
- Information about supported chart types (bar, line, pie charts)

### 2. Audio Analysis Page (`/analyze`)

Interactive chart exploration through sound.

**Features:**
- Visual chart display with interactive data points
- Touch/click individual bars to hear their values as audio frequencies
- Keyboard navigation (left/right arrows) between data points
- Auto-play mode to sequentially hear all data points
- Volume control and mute functionality
- Audio pitch mapping: higher values produce higher pitches (200-800Hz range)

### 3. AI Insights Page (`/insights`)

AI-powered analysis with text-to-speech capabilities.

**Features:**
- Automated AI analysis of chart data
- Text-to-speech controls (play, pause, stop)
- Interactive chat for follow-up questions
- Quick question buttons for common queries
- Individual "Read aloud" buttons for each AI response

## Accessibility Features

### Screen Reader Support

- **Live Regions**: `aria-live="polite"` announcements for all state changes
- **ARIA Labels**: Descriptive labels on all interactive elements
- **Semantic Roles**: Proper use of `role="banner"`, `role="navigation"`, `role="status"`, `role="log"`, and `role="application"`
- **Screen Reader-Only Text**: Hidden descriptions using `.sr-only` class
- **Current State Indicators**: `aria-current="step"` for navigation, `aria-pressed` for toggles

### Keyboard Navigation

- Full tab navigation through all interactive elements
- Arrow keys (left/right) to navigate chart data points
- Spacebar to toggle audio playback
- Enter to submit chat messages
- Visible focus indicators on all focusable elements

### Touch Accessibility

- Minimum 44x44 pixel touch targets on all buttons
- Primary action buttons sized at 56px for easier targeting
- Large circular play/pause controls

### Visual Accessibility

- High contrast dark theme meeting WCAG AA standards
- Clear visual focus indicators using ring styling
- Consistent color coding for interactive states
- Large, readable typography

### Audio Accessibility

- **Sonification**: Data values converted to audio frequencies
- **Text-to-Speech**: Native browser speech synthesis for AI insights
- **Volume Controls**: Adjustable volume with mute option
- **Sequential Playback**: Auto-play through all data points

## Technical Implementation

### Key Technologies

- **Next.js 16** - React framework with App Router
- **Tailwind CSS v4** - Utility-first styling
- **Web Audio API** - Generates audio frequencies for sonification
- **Web Speech API** - Text-to-speech functionality
- **shadcn/ui** - Accessible component library

### Accessibility Patterns Used

```tsx
// Live announcement region
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {announcement}
</div>

// Keyboard-navigable chart element
<button
  role="button"
  aria-label={`${month}: ${value} percent`}
  tabIndex={0}
  onKeyDown={handleKeyDown}
  onClick={() => playTone(value)}
>
  ...
</button>

// Screen reader-only description
<span id="analyze-description" className="sr-only">
  This will process your chart and take you to the audio analysis page
</span>
<button aria-describedby="analyze-description">
  Analyze Chart
</button>
```

## Getting Started

### Installation

```bash
npx shadcn@latest init
```

Or download the ZIP and install dependencies:

```bash
npm install
npm run dev
```

### Environment Variables

No environment variables are required for the UI mockup. When integrating with actual AI services, you will need to configure the appropriate API keys.

## Browser Support

- Chrome/Edge: Full support including Web Audio API and Speech Synthesis
- Firefox: Full support
- Safari: Full support with some speech synthesis voice limitations

## Future Enhancements

- Real chart image analysis using computer vision
- Support for additional chart types (scatter plots, area charts)
- Customizable audio frequency ranges
- Multiple sonification modes (pitch, duration, timbre)
- Export audio descriptions as MP3
- Braille display integration
- Multi-language support for text-to-speech