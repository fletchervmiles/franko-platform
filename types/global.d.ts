declare global {
  interface Window {
    FrankoModal: {
      open: (slug?: string) => void;
      q?: Array<[string, ...any[]]>;
    };
    FrankoUser: {
      user_id: string;
      user_metadata: {
        name?: string;
        email?: string;
      };
    };
  }
}

export {}; 