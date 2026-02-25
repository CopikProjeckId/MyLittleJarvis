import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const CONFIG_PATH = path.join(process.cwd(), 'subscript-config.json')

export async function GET() {
  try {
    const data = await fs.readFile(CONFIG_PATH, 'utf-8')
    const config = JSON.parse(data)
    return NextResponse.json(config)
  } catch (error) {
    console.error('Error reading config:', error)
    return NextResponse.json(
      { error: 'Failed to read config file' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN
  const authHeader = request.headers.get('authorization')
  if (!authHeader || authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const config = await request.json()
    
    // Validate JSON structure
    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        { error: 'Invalid config format' },
        { status: 400 }
      )
    }
    
    // Write to file with pretty formatting
    await fs.writeFile(
      CONFIG_PATH,
      JSON.stringify(config, null, 2),
      'utf-8'
    )
    
    return NextResponse.json({ success: true, message: 'Config saved' })
  } catch (error) {
    console.error('Error saving config:', error)
    return NextResponse.json(
      { error: 'Failed to save config file' },
      { status: 500 }
    )
  }
}
