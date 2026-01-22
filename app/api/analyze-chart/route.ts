import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("image") as File
    const question = formData.get("question") as string | null
    const historyJson = formData.get("history") as string | null

    console.log("API Request received:", { 
      hasFile: !!file, 
      fileType: file?.type,
      hasQuestion: !!question,
      hasHistory: !!historyJson 
    })

    if (!file) {
      console.error("No file provided in request")
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      )
    }

    // Check if API key is configured
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("Gemini API key not configured in environment variables")
      return NextResponse.json(
        { error: "Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file." },
        { status: 500 }
      )
    }

    console.log("Converting file to base64...")
    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString("base64")
    console.log("File converted successfully, size:", buffer.length, "bytes")

    // Initialize Gemini
    console.log("Initializing Gemini AI...")
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" })

    let prompt: string

    // If this is a follow-up question, use a different prompt
    if (question && historyJson) {
      const history = JSON.parse(historyJson)
      const conversationContext = history
        .map((msg: { role: string; content: string }) => 
          `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
        )
        .join("\n\n")

      prompt = `You are an expert data analyst helping visually impaired users understand charts and graphs. 

Previous conversation:
${conversationContext}

User's new question: ${question}

Based on the chart image and the conversation history, provide a clear, concise answer to the user's question. Format your response in markdown for easy reading and text-to-speech compatibility. Be helpful and specific.`
    } else {
      // Initial analysis prompt
      prompt = `You are an expert data analyst helping visually impaired users understand charts and graphs. 

Analyze this chart image and provide a comprehensive, accessible description that includes:

1. **Chart Type**: Identify what type of chart/graph this is (bar chart, line chart, pie chart, etc.)

2. **Overall Trend**: Describe the main pattern or trend shown in the data

3. **Key Data Points**: List the most important values, ranges, or measurements

4. **Notable Observations**: Point out any peaks, valleys, anomalies, or interesting patterns

5. **Context & Insights**: Provide meaningful insights about what this data suggests or implies

6. **Recommendations**: If applicable, suggest what actions or further analysis might be valuable

Format your response in clear markdown with headers and bullet points for easy reading and text-to-speech compatibility. Be thorough but concise. Focus on making the data accessible and understandable.`
    }

    console.log("Sending request to Gemini AI...")
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: file.type,
          data: base64Image,
        },
      },
    ])

    console.log("Received response from Gemini AI")
    const response = await result.response
    const insights = response.text()
    
    console.log("Analysis complete, insights length:", insights.length)

    return NextResponse.json({ insights })
  } catch (error) {
    console.error("Error analyzing chart:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        error: "Failed to analyze chart", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}
