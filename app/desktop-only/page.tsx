export default function DesktopOnlyPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="max-w-md space-y-6">
        <h1 className="text-3xl font-bold">Mobile Currently Unsupported</h1>
        
        <div className="space-y-4">
          <p>
            We&apos;re sorry for any inconvenience. Right now, the application dashboard isn&apos;t available on mobile devices—this is coming soon!
          </p>
          <p>
            Customer conversations sent through the platform fully support mobile devices.
          </p>
          <p>
            Thanks for your understanding and patience while we improve the experience.
          </p>
        </div>
      </div>
    </div>
  );
}