// Re-export everything from the original settings context
export * from "./settings-context"

// Override useSettings with our embed-specific version
export { useEmbedSettings as useSettings } from "../components/embed/embed-settings-provider" 