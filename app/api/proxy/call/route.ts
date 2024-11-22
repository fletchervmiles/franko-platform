import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const formattedPayload = {
      client_name: body.client_name,
      interviewee_name: body.interviewee_name,
      interviewee_last_name: body.interviewee_last_name,
      interviewee_email: body.interviewee_email,
      interviewee_number: body.interviewee_number,
      client_company_description: body.client_company_description,
      agent_name: body.agent_name,
      voice_id: body.voice_id,
      unique_customer_identifier: body.unique_customer_identifier,
      use_case: body.use_case
    }
    
    console.log('Sending formatted payload:', formattedPayload)

    const response = await fetch('https://franko-06.onrender.com/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error response:', response.status, errorText)
      throw new Error(`API Error: ${response.status} ${errorText}`)
    }

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