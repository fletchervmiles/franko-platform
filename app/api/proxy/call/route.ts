import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const response = await fetch('https://franko-06.onrender.com/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error proxying call request:', error)
    return NextResponse.json(
      { error: 'Failed to initiate call' }, 
      { status: 500 }
    )
  }
}