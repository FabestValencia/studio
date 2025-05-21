
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false); // Initialize to false (server-consistent)

  React.useEffect(() => {
    // This effect runs only on the client, after the initial render and hydration.
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(mql.matches);
    };

    // Set the correct mobile state once the component has mounted on the client.
    onChange(); // Call it once to set initial client-side state.
    
    mql.addEventListener("change", onChange);
    
    return () => mql.removeEventListener("change", onChange);
  }, []); // Empty dependency array ensures this runs once on mount.

  return isMobile; // Returns `false` during SSR and initial client render.
}
