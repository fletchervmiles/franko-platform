declare global {
  interface Window {
    FrankoUser?: {
      user_id: string
      user_hash?: string
      user_metadata?: Record<string, any>
    }
    FrankoModal?: {
      open: () => void
      close: () => void
      getState: () => 'open' | 'closed'
    }
  }
}

export {} 