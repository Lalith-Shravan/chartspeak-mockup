"use client"

import React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ArrowRight, 
  Volume2, 
  VolumeX,
  Hand,
  Info
} from "lucide-react"
import { cn } from "@/lib/utils"

// Mock chart data points for demonstration
const mockChartData = [
  { x: 0, y: 25, label: "January" },
  { x: 1, y: 42, label: "February" },
  { x: 2, y: 38, label: "March" },
  { x: 3, y: 55, label: "April" },
  { x: 4, y: 67, label: "May" },
  { x: 5, y: 78, label: "June" },
  { x: 6, y: 72, label: "July" },
  { x: 7, y: 85, label: "August" },
  { x: 8, y: 91, label: "September" },
  { x: 9, y: 88, label: "October" },
  { x: 10, y: 95, label: "November" },
  { x: 11, y: 100, label: "December" },
]

export default function AnalyzePage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(80)
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)
  const router = useRouter()
  const announceRef = useRef<HTMLDivElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const announce = (message: string) => {
    if (announceRef.current) {
      announceRef.current.textContent = message
    }
  }

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    gainNodeRef.current = audioContextRef.current.createGain()
    gainNodeRef.current.connect(audioContextRef.current.destination)
    gainNodeRef.current.gain.value = volume / 100

    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop()
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Update volume
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume / 100
    }
  }, [volume, isMuted])

  // Convert data value to frequency (200Hz - 800Hz range)
  const valueToFrequency = (value: number) => {
    const minFreq = 200
    const maxFreq = 800
    return minFreq + (value / 100) * (maxFreq - minFreq)
  }

  // Play tone for a data point
  const playTone = useCallback((dataPoint: typeof mockChartData[0]) => {
    if (!audioContextRef.current || !gainNodeRef.current) return

    // Stop previous oscillator
    if (oscillatorRef.current) {
      oscillatorRef.current.stop()
    }

    // Create new oscillator
    oscillatorRef.current = audioContextRef.current.createOscillator()
    oscillatorRef.current.type = "sine"
    oscillatorRef.current.frequency.value = valueToFrequency(dataPoint.y)
    oscillatorRef.current.connect(gainNodeRef.current)
    oscillatorRef.current.start()
    oscillatorRef.current.stop(audioContextRef.current.currentTime + 0.3)

    announce(`${dataPoint.label}: ${dataPoint.y} percent. Frequency: ${Math.round(valueToFrequency(dataPoint.y))} hertz.`)
  }, [])

  // Play/pause auto-play
  const togglePlay = () => {
    if (isPlaying) {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
      setIsPlaying(false)
      announce("Playback paused")
    } else {
      setIsPlaying(true)
      announce("Playing chart audio. Each data point will play in sequence.")
      playIntervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          const next = (prev + 1) % mockChartData.length
          playTone(mockChartData[next])
          return next
        })
      }, 800)
    }
  }

  // Reset playback
  const resetPlayback = () => {
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current)
    }
    setIsPlaying(false)
    setCurrentIndex(0)
    announce("Playback reset to beginning")
  }

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [])

  // Handle interactive touch/click on chart
  const handleChartInteraction = (index: number) => {
    setCurrentIndex(index)
    playTone(mockChartData[index])
  }

  // Keyboard navigation for chart
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      const next = Math.min(currentIndex + 1, mockChartData.length - 1)
      setCurrentIndex(next)
      playTone(mockChartData[next])
    } else if (e.key === "ArrowLeft") {
      const prev = Math.max(currentIndex - 1, 0)
      setCurrentIndex(prev)
      playTone(mockChartData[prev])
    } else if (e.key === " ") {
      e.preventDefault()
      togglePlay()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Screen reader announcements */}
      <div
        ref={announceRef}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />

      <main id="main-content" className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Audio Analysis (Example Chart)
          </h2>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Explore your chart through sound. Touch or navigate the chart to hear data values as audio frequencies.
            Higher values produce higher pitched tones.
          </p>
        </div>

        {/* Instructions card */}
        <Card className="mb-6 border-primary/50 bg-primary/5">
          <CardContent className="flex items-start gap-4 pt-6">
            <Info className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="font-medium text-foreground">How to interact:</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>• <strong>Touch/Click:</strong> Tap any bar to hear its value</li>
                <li>• <strong>Keyboard:</strong> Use left/right arrows to navigate, spacebar to play/pause</li>
                <li>• <strong>Auto-play:</strong> Press play to hear all values in sequence</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Chart */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hand className="h-5 w-5" aria-hidden="true" />
              Interactive Sound Chart
            </CardTitle>
            <CardDescription>
              Monthly performance data - touch or navigate to explore
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="relative h-[350px] rounded-lg bg-muted/50 p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onKeyDown={handleKeyDown}
              tabIndex={0}
              role="application"
              aria-label="Interactive bar chart. Use left and right arrow keys to navigate between data points. Press spacebar to toggle auto-play."
              aria-describedby="chart-description"
            >
              <p id="chart-description" className="sr-only">
                A bar chart showing monthly performance from January to December.
                Current selection: {mockChartData[currentIndex].label} at {mockChartData[currentIndex].y} percent.
              </p>

              {/* Y-axis labels */}
              <div className="absolute left-0 top-4 bottom-12 flex flex-col justify-between text-xs text-muted-foreground" aria-hidden="true">
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0%</span>
              </div>

              {/* Chart bars */}
              <div className="ml-10 flex h-full items-end gap-1 sm:gap-2 pb-8">
                {mockChartData.map((point, index) => {
                  const isActive = currentIndex === index
                  const isHovered = hoveredPoint === index
                  return (
                    <button
                      key={point.x}
                      className={cn(
                        "relative flex-1 rounded-t-md transition-all duration-150 min-w-[24px]",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        isActive
                          ? "bg-primary"
                          : isHovered
                          ? "bg-primary/70"
                          : "bg-primary/40 hover:bg-primary/60"
                      )}
                      style={{ height: `${point.y}%` }}
                      onClick={() => handleChartInteraction(index)}
                      onMouseEnter={() => setHoveredPoint(index)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      onFocus={() => handleChartInteraction(index)}
                      aria-label={`${point.label}: ${point.y} percent`}
                      aria-pressed={isActive}
                    >
                      {(isActive || isHovered) && (
                        <span
                          className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs font-medium text-background"
                          aria-hidden="true"
                        >
                          {point.y}%
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* X-axis labels */}
              <div className="absolute bottom-0 left-10 right-0 flex justify-between text-xs text-muted-foreground" aria-hidden="true">
                {mockChartData.map((point) => (
                  <span key={point.label} className="flex-1 text-center truncate">
                    {point.label.slice(0, 3)}
                  </span>
                ))}
              </div>
            </div>

            {/* Current value display */}
            <div className="mt-4 rounded-lg bg-muted p-4 text-center" role="region" aria-label="Current data point">
              <p className="text-sm text-muted-foreground">Current Selection</p>
              <p className="text-2xl font-bold text-foreground">
                {mockChartData[currentIndex].label}: {mockChartData[currentIndex].y}%
              </p>
              <p className="text-sm text-primary">
                Frequency: {Math.round(valueToFrequency(mockChartData[currentIndex].y))} Hz
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Audio Controls */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" aria-hidden="true" />
              Audio Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              {/* Playback controls */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 bg-transparent"
                  onClick={resetPlayback}
                  aria-label="Reset to beginning"
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  className="h-14 w-14 rounded-full"
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pause playback" : "Play chart audio"}
                  aria-pressed={isPlaying}
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 ml-1" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 bg-transparent"
                  onClick={() => setIsMuted(!isMuted)}
                  aria-label={isMuted ? "Unmute" : "Mute"}
                  aria-pressed={isMuted}
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
              </div>

              {/* Volume slider */}
              <div className="flex items-center gap-4 min-w-[200px]">
                <label htmlFor="volume-slider" className="text-sm font-medium text-foreground whitespace-nowrap">
                  Volume
                </label>
                <Slider
                  id="volume-slider"
                  value={[volume]}
                  onValueChange={(value) => setVolume(value[0])}
                  max={100}
                  step={5}
                  className="flex-1"
                  aria-label="Volume control"
                />
                <span className="text-sm text-muted-foreground w-10 text-right">{volume}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            onClick={() => router.push("/insights")}
            className="min-h-[56px] px-8 text-lg font-semibold"
          >
            Get AI Insights
            <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </main>
    </div>
  )
}
