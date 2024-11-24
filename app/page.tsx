"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-right mb-8">
        <button
          onClick={() => router.push('/login')}
          className="text-blue-500 hover:text-blue-700"
        >
          Login
        </button>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Customer Research</h1>
        <p className="text-xl mb-8">Conduct AI-powered customer interviews</p>
        <button
          onClick={() => router.push('/sign-up')}
          className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}