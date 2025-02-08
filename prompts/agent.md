# Agent Setup

You're setting up a real-time voice interaction system where users can have a conversation with an AI chatbot. Think of it like a voice call with an AI assistant.

## Key Components Explained

### Frontend (React/Next.js)
Your Configuration component is the user interface where people can:
- Select their microphone
- Enter their first and last name
- Initiate the conversation

It's like setting up before joining a video call

Right now this is the following code

`components\interviewer-ui\conversation.tsx`
`components\interviewer-ui\initiation-form.tsx`

```typescript
'use client'

import { Clock, BarChart2, Settings, LogOut } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface ConversationProps {
  firstName: string
  lastName: string
  onEnd: () => void
}

export default function Conversation({ firstName, lastName, onEnd }: ConversationProps) {
  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="flex justify-between items-center p-4 text-xs text-gray-400">
        <div>META-LLAMA/META-LLAMA-3.1-70B-INSTRUCT-TURBO</div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>9m 55s</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Waveform Visualization */}
        <div className="w-full max-w-md aspect-square bg-[#111] rounded-lg flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="h-16 w-4 bg-white rounded-full"></div>
            <div className="h-24 w-4 bg-white rounded-full"></div>
            <div className="h-12 w-4 bg-white rounded-full"></div>
            <div className="h-20 w-4 bg-white rounded-full"></div>
            <div className="h-16 w-4 bg-white rounded-full"></div>
          </div>
        </div>

        {/* Circular Button */}
        <div className="mt-8">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
            <div className="w-12 h-12 bg-gray-400 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end items-center gap-4 p-4">
        <Button variant="ghost" size="icon" className="text-gray-400">
          <Settings className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-400">
          <BarChart2 className="w-5 h-5" />
        </Button>
        <Button 
          variant="default" 
          className="bg-[#111] text-white hover:bg-[#222]"
          onClick={onEnd}
        >
          <LogOut className="w-5 h-5 mr-2" />
          End
        </Button>
      </div>
    </div>
  )
}
```

```typescript
'use client'

import { useState } from 'react'
import { Mic } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface ConfigurationProps {
  onStart: (firstName: string, lastName: string) => void
}

export default function Configuration({ onStart }: ConfigurationProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  const handleStart = async () => {
    setIsConnecting(true)
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    onStart(firstName, lastName)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <p>Works best in a quiet environment with a good internet.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="microphone">Microphone</Label>
          <Select defaultValue="default">
            <SelectTrigger id="microphone" className="w-full">
              <SelectValue placeholder="Select microphone">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  <span>Default - Microphone Array (Realtek High Definition Audio)</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">
                Default - Microphone Array (Realtek High Definition Audio)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input 
            id="firstName" 
            placeholder="Enter your first name" 
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input 
            id="lastName" 
            placeholder="Enter your last name" 
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        <Button 
          className="w-full" 
          size="lg"
          disabled={isConnecting || !firstName || !lastName}
          onClick={handleStart}
        >
          {isConnecting ? 'Connecting...' : 'Start'}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          Powered by franko.ai
        </div>
      </CardContent>
    </Card>
  )
}
```

### Connection Layer (RTVI - Real-Time Voice Interaction)

The RTVIProvider and related components handle:
- WebRTC connection (like what Zoom/Meet use)
- Audio streaming both ways
- Connection state management

Think of it as the "phone line" between user and AI

Right now that code is here:

`providers\RTVIProvider.tsx`

```typescript
import { type PropsWithChildren } from 'react';
mport { RTVIClient } from 'realtime-ai';
mport { DailyTransport } from '@daily-co/realtime-ai-daily';
mport { RTVIClientProvider } from 'realtime-ai-react';
// Create transport layer for Daily's implementation
onst transport = new DailyTransport();
// Initialize RTVI client
onst client = new RTVIClient({
 transport,
 params: {
   // Update this to your server's URL
   baseUrl: 'http://localhost:7860',
   endpoints: {
     connect: '/connect',
   },
 },
 enableMic: true,  // Enable microphone for voice input
 enableCam: false, // Disable camera as we don't need video
);
export function RTVIProvider({ children }: PropsWithChildren) {
 return <RTVIClientProvider client={client}>{children}</RTVIClientProvider>;
```

This may need to be adjusted.

### Connection Status Component

We also have a connection status component

```typescript
import { useRTVIClientTransportState } from 'realtime-ai-react';
export function StatusDisplay() {
 const transportState = useRTVIClientTransportState();
  return (
   <div className="text-sm text-muted-foreground">
     Connection Status: <span className="font-medium">{transportState}</span>
   </div>
 );
```

This component hasn't been made yet but might be relevant?

### Modifications to Configuration Component

We may need to update out Configuration component to include connection management:

```typescript
'use client'
import { useRTVIClient, useRTVIClientTransportState } from 'realtime-ai-react';
mport { Mic } from 'lucide-react';
mport { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
mport { Button } from "@/components/ui/button";
mport { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
mport { Label } from "@/components/ui/label";
mport { Input } from "@/components/ui/input";
mport { StatusDisplay } from './StatusDisplay';
mport { useState } from 'react';
export default function Configuration() {
 const client = useRTVIClient();
 const transportState = useRTVIClientTransportState();
 const isConnected = ['connected', 'ready'].includes(transportState);
 const [firstName, setFirstName] = useState('');
 const [lastName, setLastName] = useState('');
  const handleStart = async () => {
   if (!client) {
     console.error('RTVI client is not initialized');
     return;
   }
    try {
     if (!isConnected) {
       await client.connect();
     }
     // Here you can handle what happens after connection
     // For example, you might want to save the user's name or navigate to another page
     console.log('Connected with name:', firstName, lastName);
   } catch (error) {
     console.error('Connection error:', error);
   }
 };
  return (
   <Card className="w-full max-w-md mx-auto">
     <CardHeader>
       <CardTitle>Configuration</CardTitle>
     </CardHeader>
     <CardContent className="space-y-6">
       {/* Existing microphone selector */}
       <div className="space-y-2">
         <Label htmlFor="microphone">Microphone</Label>
         <Select defaultValue="default">
           {/* ... existing microphone select content ... */}
         </Select>
       </div>
        {/* Name inputs */}
       <div className="space-y-2">
         <Label htmlFor="firstName">First Name</Label>
         <Input 
           id="firstName" 
           placeholder="Enter your first name" 
           value={firstName}
           onChange={(e) => setFirstName(e.target.value)}
         />
       </div>
        <div className="space-y-2">
         <Label htmlFor="lastName">Last Name</Label>
         <Input 
           id="lastName" 
           placeholder="Enter your last name" 
           value={lastName}
           onChange={(e) => setLastName(e.target.value)}
         />
       </div>
        {/* Status display */}
       <StatusDisplay />
        {/* Start button */}
       <Button 
         className="w-full" 
         size="lg" 
         onClick={handleStart}
         disabled={!client || ['connecting', 'disconnecting'].includes(transportState)}
       >
         {isConnected ? 'Connected' : 'Start'}
       </Button>
        <div className="text-center text-sm text-muted-foreground">
         Powered by franko.ai
       </div>
     </CardContent>
   </Card>
 );
```

### App Component

Right now the app component is 

`app\initiate\page.tsx`

```typescript
'use client'

import { useState } from 'react'
import Configuration from '@/components/interviewer-ui/initiation-form'
import Conversation from '@/components/interviewer-ui/conversation'

export default function App() {
  const [screen, setScreen] = useState<'config' | 'conversation'>('config')
  const [userData, setUserData] = useState({ firstName: '', lastName: '' })

  const handleStart = (firstName: string, lastName: string) => {
    setUserData({ firstName, lastName })
    setScreen('conversation')
  }

  const handleEnd = () => {
    setScreen('config')
  }

  return (
    <div className="min-h-screen">
      {screen === 'config' ? (
        <Configuration onStart={handleStart} />
      ) : (
        <Conversation 
          firstName={userData.firstName}
          lastName={userData.lastName}
          onEnd={handleEnd}
        />
      )}
    </div>
  )
}

```

We will likely need to wrap out components.



## Server Setup

Note, the server is a seperate application. 

This is the Connection Flow Overview

graph LR
    A[User clicks Start] --> B[Frontend initiates connection]
    B --> C[Server creates Daily room]
    C --> D[Server starts Gemini bot]
    D --> E[Returns credentials]
    E --> F[Frontend establishes WebRTC connection]
    F --> G[Real-time communication begins]


I will provide the server code for reference only. This should provide you with the necessary context for what is happening on the client side and what is happening on the server side.

The following is the server code:

```python
#
# Copyright (c) 2024, Daily
#
# SPDX-License-Identifier: BSD 2-Clause License
#

"""Gemini Bot Implementation.

This module implements a chatbot using Google's Gemini Multimodal Live model.
It includes:
- Real-time audio/video interaction through Daily
- Animated robot avatar
- Speech-to-speech model

The bot runs as part of a pipeline that processes audio/video frames and manages
the conversation flow using Gemini's streaming capabilities.
"""

import asyncio
import os
import sys

import aiohttp
from dotenv import load_dotenv
from loguru import logger
from PIL import Image
from runner import configure

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.audio.vad.vad_analyzer import VADParams
from pipecat.frames.frames import (
    BotStartedSpeakingFrame,
    BotStoppedSpeakingFrame,
    EndFrame,
    Frame,
    OutputImageRawFrame,
    SpriteFrame,
)
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor
from pipecat.processors.frameworks.rtvi import (
    RTVIBotTranscriptionProcessor,
    RTVIMetricsProcessor,
    RTVISpeakingProcessor,
    RTVIUserTranscriptionProcessor,
)
from pipecat.services.elevenlabs import ElevenLabsTTSService
from pipecat.services.gemini_multimodal_live.gemini import GeminiMultimodalLiveLLMService
from pipecat.services.openai import OpenAILLMService
from pipecat.transports.services.daily import DailyParams, DailyTransport

load_dotenv(override=True)

logger.remove(0)
logger.add(sys.stderr, level="DEBUG")

sprites = []
script_dir = os.path.dirname(__file__)

for i in range(1, 26):
    # Build the full path to the image file
    full_path = os.path.join(script_dir, f"assets/robot0{i}.png")
    # Get the filename without the extension to use as the dictionary key
    # Open the image and convert it to bytes
    with Image.open(full_path) as img:
        sprites.append(OutputImageRawFrame(image=img.tobytes(), size=img.size, format=img.format))

# Create a smooth animation by adding reversed frames
flipped = sprites[::-1]
sprites.extend(flipped)

# Define static and animated states
quiet_frame = sprites[0]  # Static frame for when bot is listening
talking_frame = SpriteFrame(images=sprites)  # Animation sequence for when bot is talking


class TalkingAnimation(FrameProcessor):
    """Manages the bot's visual animation states.

    Switches between static (listening) and animated (talking) states based on
    the bot's current speaking status.
    """

    def __init__(self):
        super().__init__()
        self._is_talking = False

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        """Process incoming frames and update animation state.

        Args:
            frame: The incoming frame to process
            direction: The direction of frame flow in the pipeline
        """
        await super().process_frame(frame, direction)

        # Switch to talking animation when bot starts speaking
        if isinstance(frame, BotStartedSpeakingFrame):
            if not self._is_talking:
                await self.push_frame(talking_frame)
                self._is_talking = True
        # Return to static frame when bot stops speaking
        elif isinstance(frame, BotStoppedSpeakingFrame):
            await self.push_frame(quiet_frame)
            self._is_talking = False

        await self.push_frame(frame, direction)


async def main():
    """Main bot execution function.

    Sets up and runs the bot pipeline including:
    - Daily video transport with specific audio parameters
    - Gemini Live multimodal model integration
    - Voice activity detection
    - Animation processing
    - RTVI event handling
    """
    async with aiohttp.ClientSession() as session:
        (room_url, token) = await configure(session)

        # Set up Daily transport with specific audio/video parameters for Gemini
        transport = DailyTransport(
            room_url,
            token,
            "Chatbot",
            DailyParams(
                audio_in_sample_rate=16000,
                audio_out_sample_rate=24000,
                audio_out_enabled=True,
                camera_out_enabled=True,
                camera_out_width=1024,
                camera_out_height=576,
                vad_enabled=True,
                vad_audio_passthrough=True,
                vad_analyzer=SileroVADAnalyzer(params=VADParams(stop_secs=0.5)),
            ),
        )

        # Initialize the Gemini Multimodal Live model
        llm = GeminiMultimodalLiveLLMService(
            api_key=os.getenv("GEMINI_API_KEY"),
            voice_id="Puck",  # Aoede, Charon, Fenrir, Kore, Puck
            transcribe_user_audio=True,
            transcribe_model_audio=True,
        )

        messages = [
            {
                "role": "user",
                "content": "You are Chatbot, a friendly, helpful robot. Your goal is to demonstrate your capabilities in a succinct way. Your output will be converted to audio so don't include special characters in your answers. Respond to what the user said in a creative and helpful way, but keep your responses brief. Start by introducing yourself.",
            },
        ]

        # Set up conversation context and management
        # The context_aggregator will automatically collect conversation context
        context = OpenAILLMContext(messages)
        context_aggregator = llm.create_context_aggregator(context)

        ta = TalkingAnimation()

        #
        # RTVI events for Pipecat client UI
        #

        # This will send `user-*-speaking` and `bot-*-speaking` messages.
        rtvi_speaking = RTVISpeakingProcessor()

        # This will emit UserTranscript events.
        rtvi_user_transcription = RTVIUserTranscriptionProcessor()

        # This will emit BotTranscript events.
        rtvi_bot_transcription = RTVIBotTranscriptionProcessor()

        # This will send `metrics` messages.
        rtvi_metrics = RTVIMetricsProcessor()

        pipeline = Pipeline(
            [
                transport.input(),
                context_aggregator.user(),
                llm,
                rtvi_speaking,
                rtvi_user_transcription,
                rtvi_bot_transcription,
                ta,
                rtvi_metrics,
                transport.output(),
                context_aggregator.assistant(),
            ]
        )

        task = PipelineTask(
            pipeline,
            PipelineParams(
                allow_interruptions=True,
                enable_metrics=True,
                enable_usage_metrics=True,
            ),
        )
        await task.queue_frame(quiet_frame)

        @transport.event_handler("on_first_participant_joined")
        async def on_first_participant_joined(transport, participant):
            await transport.capture_participant_transcription(participant["id"])
            await task.queue_frames([context_aggregator.user().get_context_frame()])

        @transport.event_handler("on_participant_left")
        async def on_participant_left(transport, participant, reason):
            print(f"Participant left: {participant}")
            await task.queue_frame(EndFrame())

        runner = PipelineRunner()

        await runner.run(task)


if __name__ == "__main__":
    asyncio.run(main())
```

```python
#
# Copyright (c) 2024, Daily
#
# SPDX-License-Identifier: BSD 2-Clause License
#

import argparse
import os

import aiohttp

from pipecat.transports.services.helpers.daily_rest import DailyRESTHelper


async def configure(aiohttp_session: aiohttp.ClientSession):
    """Configure the Daily room and Daily REST helper."""
    parser = argparse.ArgumentParser(description="Daily AI SDK Bot Sample")
    parser.add_argument(
        "-u", "--url", type=str, required=False, help="URL of the Daily room to join"
    )
    parser.add_argument(
        "-k",
        "--apikey",
        type=str,
        required=False,
        help="Daily API Key (needed to create an owner token for the room)",
    )

    args, unknown = parser.parse_known_args()

    url = args.url or os.getenv("DAILY_SAMPLE_ROOM_URL")
    key = args.apikey or os.getenv("DAILY_API_KEY")

    if not url:
        raise Exception(
            "No Daily room specified. use the -u/--url option from the command line, or set DAILY_SAMPLE_ROOM_URL in your environment to specify a Daily room URL."
        )

    if not key:
        raise Exception(
            "No Daily API key specified. use the -k/--apikey option from the command line, or set DAILY_API_KEY in your environment to specify a Daily API key, available from https://dashboard.daily.co/developers."
        )

    daily_rest_helper = DailyRESTHelper(
        daily_api_key=key,
        daily_api_url=os.getenv("DAILY_API_URL", "https://api.daily.co/v1"),
        aiohttp_session=aiohttp_session,
    )

    # Create a meeting token for the given room with an expiration 1 hour in
    # the future.
    expiry_time: float = 60 * 60

    token = await daily_rest_helper.get_token(url, expiry_time)

    return (url, token)
```

```python
#
# Copyright (c) 2024, Daily
#
# SPDX-License-Identifier: BSD 2-Clause License
#

"""RTVI Bot Server Implementation.

This FastAPI server manages RTVI bot instances and provides endpoints for both
direct browser access and RTVI client connections. It handles:
- Creating Daily rooms
- Managing bot processes
- Providing connection credentials
- Monitoring bot status

Requirements:
- Daily API key (set in .env file)
- Python 3.10+
- FastAPI
- Running bot implementation
"""

import argparse
import os
import subprocess
from contextlib import asynccontextmanager
from typing import Any, Dict

import aiohttp
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse

from pipecat.transports.services.helpers.daily_rest import DailyRESTHelper, DailyRoomParams

# Load environment variables from .env file
load_dotenv(override=True)

# Maximum number of bot instances allowed per room
MAX_BOTS_PER_ROOM = 1

# Dictionary to track bot processes: {pid: (process, room_url)}
bot_procs = {}

# Store Daily API helpers
daily_helpers = {}


def cleanup():
    """Cleanup function to terminate all bot processes.

    Called during server shutdown.
    """
    for entry in bot_procs.values():
        proc = entry[0]
        proc.terminate()
        proc.wait()


def get_bot_file():
    bot_implementation = os.getenv("BOT_IMPLEMENTATION", "openai").lower().strip()
    # If blank or None, default to openai
    if not bot_implementation:
        bot_implementation = "openai"
    if bot_implementation not in ["openai", "gemini"]:
        raise ValueError(
            f"Invalid BOT_IMPLEMENTATION: {bot_implementation}. Must be 'openai' or 'gemini'"
        )
    return f"bot-{bot_implementation}"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan manager that handles startup and shutdown tasks.

    - Creates aiohttp session
    - Initializes Daily API helper
    - Cleans up resources on shutdown
    """
    aiohttp_session = aiohttp.ClientSession()
    daily_helpers["rest"] = DailyRESTHelper(
        daily_api_key=os.getenv("DAILY_API_KEY", ""),
        daily_api_url=os.getenv("DAILY_API_URL", "https://api.daily.co/v1"),
        aiohttp_session=aiohttp_session,
    )
    yield
    await aiohttp_session.close()
    cleanup()


# Initialize FastAPI app with lifespan manager
app = FastAPI(lifespan=lifespan)

# Configure CORS to allow requests from any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def create_room_and_token() -> tuple[str, str]:
    """Helper function to create a Daily room and generate an access token.

    Returns:
        tuple[str, str]: A tuple containing (room_url, token)

    Raises:
        HTTPException: If room creation or token generation fails
    """
    room = await daily_helpers["rest"].create_room(DailyRoomParams())
    if not room.url:
        raise HTTPException(status_code=500, detail="Failed to create room")

    token = await daily_helpers["rest"].get_token(room.url)
    if not token:
        raise HTTPException(status_code=500, detail=f"Failed to get token for room: {room.url}")

    return room.url, token


@app.get("/")
async def start_agent(request: Request):
    """Endpoint for direct browser access to the bot.

    Creates a room, starts a bot instance, and redirects to the Daily room URL.

    Returns:
        RedirectResponse: Redirects to the Daily room URL

    Raises:
        HTTPException: If room creation, token generation, or bot startup fails
    """
    print("Creating room")
    room_url, token = await create_room_and_token()
    print(f"Room URL: {room_url}")

    # Check if there is already an existing process running in this room
    num_bots_in_room = sum(
        1 for proc in bot_procs.values() if proc[1] == room_url and proc[0].poll() is None
    )
    if num_bots_in_room >= MAX_BOTS_PER_ROOM:
        raise HTTPException(status_code=500, detail=f"Max bot limit reached for room: {room_url}")

    # Spawn a new bot process
    try:
        bot_file = get_bot_file()
        proc = subprocess.Popen(
            [f"python3 -m {bot_file} -u {room_url} -t {token}"],
            shell=True,
            bufsize=1,
            cwd=os.path.dirname(os.path.abspath(__file__)),
        )
        bot_procs[proc.pid] = (proc, room_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start subprocess: {e}")

    return RedirectResponse(room_url)


@app.post("/connect")
async def rtvi_connect(request: Request) -> Dict[Any, Any]:
    """RTVI connect endpoint that creates a room and returns connection credentials.

    This endpoint is called by RTVI clients to establish a connection.

    Returns:
        Dict[Any, Any]: Authentication bundle containing room_url and token

    Raises:
        HTTPException: If room creation, token generation, or bot startup fails
    """
    print("Creating room for RTVI connection")
    room_url, token = await create_room_and_token()
    print(f"Room URL: {room_url}")

    # Start the bot process
    try:
        bot_file = get_bot_file()
        proc = subprocess.Popen(
            [f"python3 -m {bot_file} -u {room_url} -t {token}"],
            shell=True,
            bufsize=1,
            cwd=os.path.dirname(os.path.abspath(__file__)),
        )
        bot_procs[proc.pid] = (proc, room_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start subprocess: {e}")

    # Return the authentication bundle in format expected by DailyTransport
    return {"room_url": room_url, "token": token}


@app.get("/status/{pid}")
def get_status(pid: int):
    """Get the status of a specific bot process.

    Args:
        pid (int): Process ID of the bot

    Returns:
        JSONResponse: Status information for the bot

    Raises:
        HTTPException: If the specified bot process is not found
    """
    # Look up the subprocess
    proc = bot_procs.get(pid)

    # If the subprocess doesn't exist, return an error
    if not proc:
        raise HTTPException(status_code=404, detail=f"Bot with process id: {pid} not found")

    # Check the status of the subprocess
    status = "running" if proc[0].poll() is None else "finished"
    return JSONResponse({"bot_id": pid, "status": status})


if __name__ == "__main__":
    import uvicorn

    # Parse command line arguments for server configuration
    default_host = os.getenv("HOST", "0.0.0.0")
    default_port = int(os.getenv("FAST_API_PORT", "7860"))

    parser = argparse.ArgumentParser(description="Daily Storyteller FastAPI server")
    parser.add_argument("--host", type=str, default=default_host, help="Host address")
    parser.add_argument("--port", type=int, default=default_port, help="Port number")
    parser.add_argument("--reload", action="store_true", help="Reload code on change")

    config = parser.parse_args()

    # Start the FastAPI server
    uvicorn.run(
        "server:app",
        host=config.host,
        port=config.port,
        reload=config.reload,
    )
```

