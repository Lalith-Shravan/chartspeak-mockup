"use client"

import React from "react"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileImage, X, ArrowRight, BarChart3, LineChart, PieChart } from "lucide-react"
import { cn } from "@/lib/utils"

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const announceRef = useRef<HTMLDivElement>(null)

  const announce = (message: string) => {
    if (announceRef.current) {
      announceRef.current.textContent = message
    }
  }

  const handleFile = useCallback((selectedFile: File) => {
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
      announce(`File selected: ${selectedFile.name}. Press the Analyze Chart button to continue.`)
    } else {
      announce("Invalid file type. Please select an image file.")
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) {
        handleFile(droppedFile)
      }
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) {
        handleFile(selectedFile)
      }
    },
    [handleFile]
  )

  const removeFile = () => {
    setFile(null)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    announce("File removed. Upload area ready for new file.")
  }

  const handleAnalyze = async () => {
    if (file) {
      setIsUploading(true)
      announce("Processing chart. Please wait.")
      
      try {
        // Create form data and send to API
        const formData = new FormData()
        formData.append("image", file)

        const response = await fetch("/api/analyze-chart", {
          method: "POST",
          body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
          console.error("API Error:", data)
          throw new Error(data.error || data.details || "Failed to analyze chart")
        }

        if (!data.insights) {
          throw new Error("No insights returned from API")
        }
        
        // Store insights in sessionStorage to pass to insights page
        sessionStorage.setItem("chartInsights", data.insights)
        if (preview) {
          sessionStorage.setItem("chartImage", preview)
        }
        
        announce("Analysis complete. Redirecting to insights.")
        router.push("/insights")
      } catch (error) {
        console.error("Error analyzing chart:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to analyze chart. Please try again."
        announce(errorMessage)
        alert(errorMessage) // Show alert for visibility
        setIsUploading(false)
      }
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

      <main id="main-content" className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Upload Your Chart
          </h2>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Upload a chart image and ChartSpeak will convert it into an interactive audio experience. 
            Supported formats: PNG, JPG, GIF, WebP.
          </p>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" aria-hidden="true" />
              Chart Image
            </CardTitle>
            <CardDescription>
              Drag and drop your chart image, or click to browse your files
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!file ? (
              <div
                className={cn(
                  "relative rounded-xl border-2 border-dashed p-8 text-center transition-colors min-h-[300px] flex flex-col items-center justify-center",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label="Upload chart image"
                  id="chart-upload"
                />
                <div className="flex flex-col items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-4">
                    <Upload className="h-8 w-8 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-foreground">
                      Drop your chart here
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      or{" "}
                      <label
                        htmlFor="chart-upload"
                        className="cursor-pointer font-medium text-primary underline underline-offset-4 hover:text-primary/80 focus:outline-none"
                      >
                        browse files
                      </label>
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Maximum file size: 10MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-xl border border-border">
                  {preview && (
                    <img
                      src={preview}
                      alt={`Preview of uploaded chart: ${file.name}`}
                      className="mx-auto max-h-[400px] object-contain"
                    />
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2 min-h-[44px] min-w-[44px]"
                    onClick={removeFile}
                    aria-label={`Remove file: ${file.name}`}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                  <div className="flex items-center gap-3">
                    <FileImage className="h-5 w-5 text-primary" aria-hidden="true" />
                    <div>
                      <p className="font-medium text-foreground">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    Ready
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {file && (
          <div className="mt-6 flex justify-center">
            <Button
              size="lg"
              onClick={handleAnalyze}
              disabled={isUploading}
              className="min-h-[56px] px-8 text-lg font-semibold"
              aria-describedby="analyze-description"
            >
              {isUploading ? (
                <>
                  <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                  Processing...
                </>
              ) : (
                <>
                  Analyze Chart
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </>
              )}
            </Button>
          </div>
        )}
        <p id="analyze-description" className="sr-only">
          This will process your chart and take you to the audio analysis page
        </p>

        {/* Supported chart types */}
        <section className="mt-12" aria-labelledby="supported-charts-heading">
          <h3 id="supported-charts-heading" className="mb-6 text-center text-xl font-semibold text-foreground">
            Supported Chart Types
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: BarChart3, title: "Bar Charts", description: "Horizontal and vertical bar charts" },
              { icon: LineChart, title: "Line Charts", description: "Trend lines and time series data" },
              { icon: PieChart, title: "Pie Charts", description: "Circular charts showing proportions" },
            ].map((chartType) => (
              <Card key={chartType.title} className="text-center">
                <CardContent className="pt-6">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <chartType.icon className="h-7 w-7 text-primary" aria-hidden="true" />
                  </div>
                  <h4 className="font-semibold text-foreground">{chartType.title}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">{chartType.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
