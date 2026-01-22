import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get("image") as File
    const userQuestion = formData.get("question") as string | null
    const conversationHistory = formData.get("history") as string | null

    console.log("API Request received:", { 
      hasFile: !!imageFile, 
      fileType: imageFile?.type,
      hasQuestion: !!userQuestion,
      hasHistory: !!conversationHistory 
    })

    if (!imageFile) {
      console.error("No file provided in request")
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      )
    }

    const geminiKey = process.env.GEMINI_API_KEY
    if (!geminiKey) {
      console.error("Gemini API key not configured in environment variables")
      return NextResponse.json(
        { error: "Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file." },
        { status: 500 }
      )
    }

    console.log("Converting file to base64...")
    const fileBytes = await imageFile.arrayBuffer()
    const imgBuffer = Buffer.from(fileBytes)
    const base64Img = imgBuffer.toString("base64")
    console.log("File converted successfully, size:", imgBuffer.length, "bytes")

    console.log("Initializing Gemini AI...")
    const genAI = new GoogleGenerativeAI(geminiKey)
    const aiModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" })

    let promptText: string

    if (userQuestion && conversationHistory) {
      const history = JSON.parse(conversationHistory)
      const conversationCtx = history
        .map((msg: { role: string; content: string }) => 
          `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
        )
        .join("\n\n")

      promptText = `You are an expert data analyst helping visually impaired users understand charts and graphs. 

Previous conversation:
${conversationCtx}

User's new question: ${userQuestion}

Based on the chart image and the conversation history, provide a clear, concise answer to the user's question. Format your response in markdown for easy reading and text-to-speech compatibility. Be helpful and specific.`
    } else {
      promptText = `You are an expert data analyst helping visually impaired users understand charts and graphs. 

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
    const apiResult = await aiModel.generateContent([
      promptText,
      {
        inlineData: {
          mimeType: imageFile.type,
          data: base64Img,
        },
      },
    ])

    console.log("Received response from Gemini AI")
    const aiResponse = await apiResult.response
    const analysisText = aiResponse.text()
    
    console.log("Analysis complete, insights length:", analysisText.length)

    return NextResponse.json({ insights: analysisText })
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
