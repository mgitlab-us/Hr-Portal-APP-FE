import * as Location from 'expo-location';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface LocationFix {
  lat: number;
  lng: number;
  accuracy: number;   // metres
  timestamp: number;  // epoch ms
}

export class LocationError extends Error {
  constructor(
    message: string,
    public readonly code: 'PERMISSION_DENIED' | 'SERVICES_DISABLED' | 'TIMEOUT' | 'UNAVAILABLE',
  ) {
    super(message);
    this.name = 'LocationError';
  }
}

// ── Permission (call once at app startup) ─────────────────────────────────────
let _permissionGranted = false;

/**
 * Requests foreground location permission.
 * Call this once from a top-level useEffect so the dialog
 * appears when the app opens — not when the employee taps Check-In.
 */
export async function ensurePermissions(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    _permissionGranted = status === 'granted';
    return _permissionGranted;
  } catch {
    _permissionGranted = false;
    return false;
  }
}

// ── Fresh location fetch ──────────────────────────────────────────────────────

/**
 * Gets a **fresh** GPS fix. Never returns a cached / last-known position.
 *
 * @param timeoutMs  Max time to wait for a fix (default 10 000 ms)
 * @throws {LocationError} with a typed `code` so the caller can show
 *         the right message without parsing strings.
 */
export async function fetchFreshLocation(timeoutMs = 15_000): Promise<LocationFix> {
  // 1. Permission gate
  if (!_permissionGranted) {
    // Try one more time in case ensurePermissions wasn't called yet
    const granted = await ensurePermissions();
    if (!granted) {
      throw new LocationError(
        'Location permission is required for attendance. Please allow location access in your device settings.',
        'PERMISSION_DENIED',
      );
    }
  }

  // 2. Services check
  const enabled = await Location.hasServicesEnabledAsync();
  if (!enabled) {
    throw new LocationError(
      'Location services are turned off. Please enable GPS in your device settings.',
      'SERVICES_DISABLED',
    );
  }

  // 3. Fetch with a hard JS-level timeout (guards against native bridge hangs)
  const fetchPromise = Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new LocationError(
        'Location fetch timed out. Please ensure you have a clear view of the sky or a strong Wi-Fi/cellular signal.',
        'TIMEOUT',
      )),
      timeoutMs,
    ),
  );

  const result = await Promise.race([fetchPromise, timeoutPromise]);

  if (!result?.coords) {
    throw new LocationError(
      'Could not determine your location. Please try again.',
      'UNAVAILABLE',
    );
  }

  return {
    lat: result.coords.latitude,
    lng: result.coords.longitude,
    accuracy: result.coords.accuracy ?? -1,
    timestamp: result.timestamp,
  };
}
