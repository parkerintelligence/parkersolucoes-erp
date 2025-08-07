// Simple mobile detection without React hooks to avoid hook resolution issues
const MOBILE_BREAKPOINT = 768

let isMobileCache: boolean | undefined = undefined

export function useIsMobile() {
  // Simple implementation that doesn't rely on React hooks
  if (typeof window === 'undefined') {
    return false
  }
  
  if (isMobileCache === undefined) {
    isMobileCache = window.innerWidth < MOBILE_BREAKPOINT
  }
  
  return isMobileCache
}

// Update cache when window resizes
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    isMobileCache = window.innerWidth < MOBILE_BREAKPOINT
  })
}