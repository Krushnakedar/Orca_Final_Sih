import { useCallback, useState } from 'react';

/**
 * State for the "Inspect location" feature of the Marine Map page (/map) only. The Dashboard does not
 * use it. It only holds state (inspect mode on/off, selected point, latest reading); the data fetching
 * and rendering live in <WeatherSafety /> and the map control in MapInspect.jsx.
 *
 * All returned setters are referentially stable.
 */
export function useLocationInspect() {
  const [active, setActive] = useState(false);
  const [point, setPoint] = useState(null);
  const [reading, setReading] = useState(null);

  const toggle = useCallback(() => setActive(value => !value), []);
  const exit = useCallback(() => setActive(false), []);
  const select = useCallback(next => setPoint(next), []);
  const clear = useCallback(() => { setPoint(null); setReading(null); }, []);

  return { active, toggle, exit, point, select, clear, reading, setReading };
}
