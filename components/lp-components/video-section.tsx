export default function VideoSection() {
  return (
    <div>
      <div className="max-w-4xl mx-auto">
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-black bg-black">
          <iframe 
            className="absolute top-0 left-0 w-full h-full"
            src="https://player.vimeo.com/video/1037674200?badge=0&autopause=0&byline=0&title=0&transparent=1&dnt=1&portrait=0&pip=0&autoplay=0&speed=0&quality=1080p"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  )
} 