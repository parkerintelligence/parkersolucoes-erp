// Temporarily disabled due to React hooks corruption
// import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Temporarily return static value to avoid React hooks corruption
  // const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  // React.useEffect(() => {
  //   const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  //   const onChange = () => {
  //     setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
  //   }
  //   mql.addEventListener("change", onChange)
  //   setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
  //   return () => mql.removeEventListener("change", onChange)
  // }, [])

  // Static fallback until React hooks are fixed
  return window.innerWidth < MOBILE_BREAKPOINT
}
