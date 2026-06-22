// Production-ready timezone data with major world cities
// IANA timezone identifiers paired with human-readable city labels
// Organized by region for easy browsing

export interface TimezoneOption {
  label: string;      // "Karachi (Pakistan)" 
  city: string;       // "Karachi"
  country: string;    // "Pakistan"
  timezone: string;   // "Asia/Karachi" — the IANA value stored in DB
  offset: string;     // "UTC+5:00" — display only
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  // ── Pakistan ────────────────────────────────────────────────
  { city: 'Karachi',      country: 'Pakistan',      timezone: 'Asia/Karachi',        offset: 'UTC+5:00' },
  { city: 'Lahore',       country: 'Pakistan',      timezone: 'Asia/Karachi',        offset: 'UTC+5:00' },
  { city: 'Islamabad',    country: 'Pakistan',      timezone: 'Asia/Karachi',        offset: 'UTC+5:00' },

  // ── South Asia ──────────────────────────────────────────────
  { city: 'Mumbai',       country: 'India',         timezone: 'Asia/Kolkata',        offset: 'UTC+5:30' },
  { city: 'Delhi',        country: 'India',         timezone: 'Asia/Kolkata',        offset: 'UTC+5:30' },
  { city: 'Bangalore',    country: 'India',         timezone: 'Asia/Kolkata',        offset: 'UTC+5:30' },
  { city: 'Colombo',      country: 'Sri Lanka',     timezone: 'Asia/Colombo',        offset: 'UTC+5:30' },
  { city: 'Dhaka',        country: 'Bangladesh',    timezone: 'Asia/Dhaka',          offset: 'UTC+6:00' },
  { city: 'Kathmandu',    country: 'Nepal',         timezone: 'Asia/Kathmandu',      offset: 'UTC+5:45' },

  // ── Middle East ─────────────────────────────────────────────
  { city: 'Dubai',        country: 'UAE',           timezone: 'Asia/Dubai',          offset: 'UTC+4:00' },
  { city: 'Abu Dhabi',    country: 'UAE',           timezone: 'Asia/Dubai',          offset: 'UTC+4:00' },
  { city: 'Riyadh',       country: 'Saudi Arabia',  timezone: 'Asia/Riyadh',         offset: 'UTC+3:00' },
  { city: 'Jeddah',       country: 'Saudi Arabia',  timezone: 'Asia/Riyadh',         offset: 'UTC+3:00' },
  { city: 'Kuwait City',  country: 'Kuwait',        timezone: 'Asia/Kuwait',         offset: 'UTC+3:00' },
  { city: 'Doha',         country: 'Qatar',         timezone: 'Asia/Qatar',          offset: 'UTC+3:00' },
  { city: 'Muscat',       country: 'Oman',          timezone: 'Asia/Muscat',         offset: 'UTC+4:00' },
  { city: 'Manama',       country: 'Bahrain',       timezone: 'Asia/Bahrain',        offset: 'UTC+3:00' },
  { city: 'Amman',        country: 'Jordan',        timezone: 'Asia/Amman',          offset: 'UTC+3:00' },
  { city: 'Beirut',       country: 'Lebanon',       timezone: 'Asia/Beirut',         offset: 'UTC+3:00' },
  { city: 'Istanbul',     country: 'Turkey',        timezone: 'Europe/Istanbul',     offset: 'UTC+3:00' },
  { city: 'Tehran',       country: 'Iran',          timezone: 'Asia/Tehran',         offset: 'UTC+3:30' },
  { city: 'Baghdad',      country: 'Iraq',          timezone: 'Asia/Baghdad',        offset: 'UTC+3:00' },
  { city: 'Cairo',        country: 'Egypt',         timezone: 'Africa/Cairo',        offset: 'UTC+2:00' },

  // ── East / Southeast Asia ────────────────────────────────────
  { city: 'Singapore',    country: 'Singapore',     timezone: 'Asia/Singapore',      offset: 'UTC+8:00' },
  { city: 'Kuala Lumpur', country: 'Malaysia',      timezone: 'Asia/Kuala_Lumpur',   offset: 'UTC+8:00' },
  { city: 'Jakarta',      country: 'Indonesia',     timezone: 'Asia/Jakarta',        offset: 'UTC+7:00' },
  { city: 'Bangkok',      country: 'Thailand',      timezone: 'Asia/Bangkok',        offset: 'UTC+7:00' },
  { city: 'Ho Chi Minh',  country: 'Vietnam',       timezone: 'Asia/Ho_Chi_Minh',   offset: 'UTC+7:00' },
  { city: 'Manila',       country: 'Philippines',   timezone: 'Asia/Manila',         offset: 'UTC+8:00' },
  { city: 'Tokyo',        country: 'Japan',         timezone: 'Asia/Tokyo',          offset: 'UTC+9:00' },
  { city: 'Seoul',        country: 'South Korea',   timezone: 'Asia/Seoul',          offset: 'UTC+9:00' },
  { city: 'Shanghai',     country: 'China',         timezone: 'Asia/Shanghai',       offset: 'UTC+8:00' },
  { city: 'Beijing',      country: 'China',         timezone: 'Asia/Shanghai',       offset: 'UTC+8:00' },
  { city: 'Hong Kong',    country: 'Hong Kong',     timezone: 'Asia/Hong_Kong',      offset: 'UTC+8:00' },
  { city: 'Taipei',       country: 'Taiwan',        timezone: 'Asia/Taipei',         offset: 'UTC+8:00' },

  // ── Central Asia ─────────────────────────────────────────────
  { city: 'Tashkent',     country: 'Uzbekistan',    timezone: 'Asia/Tashkent',       offset: 'UTC+5:00' },
  { city: 'Almaty',       country: 'Kazakhstan',    timezone: 'Asia/Almaty',         offset: 'UTC+6:00' },
  { city: 'Kabul',        country: 'Afghanistan',   timezone: 'Asia/Kabul',          offset: 'UTC+4:30' },

  // ── Europe ───────────────────────────────────────────────────
  { city: 'London',       country: 'UK',            timezone: 'Europe/London',       offset: 'UTC+0:00' },
  { city: 'Dublin',       country: 'Ireland',       timezone: 'Europe/Dublin',       offset: 'UTC+0:00' },
  { city: 'Paris',        country: 'France',        timezone: 'Europe/Paris',        offset: 'UTC+1:00' },
  { city: 'Berlin',       country: 'Germany',       timezone: 'Europe/Berlin',       offset: 'UTC+1:00' },
  { city: 'Amsterdam',    country: 'Netherlands',   timezone: 'Europe/Amsterdam',    offset: 'UTC+1:00' },
  { city: 'Brussels',     country: 'Belgium',       timezone: 'Europe/Brussels',     offset: 'UTC+1:00' },
  { city: 'Madrid',       country: 'Spain',         timezone: 'Europe/Madrid',       offset: 'UTC+1:00' },
  { city: 'Rome',         country: 'Italy',         timezone: 'Europe/Rome',         offset: 'UTC+1:00' },
  { city: 'Zurich',       country: 'Switzerland',   timezone: 'Europe/Zurich',       offset: 'UTC+1:00' },
  { city: 'Stockholm',    country: 'Sweden',        timezone: 'Europe/Stockholm',    offset: 'UTC+1:00' },
  { city: 'Oslo',         country: 'Norway',        timezone: 'Europe/Oslo',         offset: 'UTC+1:00' },
  { city: 'Warsaw',       country: 'Poland',        timezone: 'Europe/Warsaw',       offset: 'UTC+1:00' },
  { city: 'Moscow',       country: 'Russia',        timezone: 'Europe/Moscow',       offset: 'UTC+3:00' },
  { city: 'Kiev',         country: 'Ukraine',       timezone: 'Europe/Kiev',         offset: 'UTC+2:00' },

  // ── Africa ───────────────────────────────────────────────────
  { city: 'Lagos',        country: 'Nigeria',       timezone: 'Africa/Lagos',        offset: 'UTC+1:00' },
  { city: 'Nairobi',      country: 'Kenya',         timezone: 'Africa/Nairobi',      offset: 'UTC+3:00' },
  { city: 'Johannesburg', country: 'South Africa',  timezone: 'Africa/Johannesburg', offset: 'UTC+2:00' },
  { city: 'Casablanca',   country: 'Morocco',       timezone: 'Africa/Casablanca',   offset: 'UTC+1:00' },
  { city: 'Accra',        country: 'Ghana',         timezone: 'Africa/Accra',        offset: 'UTC+0:00' },
  { city: 'Addis Ababa',  country: 'Ethiopia',      timezone: 'Africa/Addis_Ababa',  offset: 'UTC+3:00' },

  // ── Americas ─────────────────────────────────────────────────
  { city: 'New York',     country: 'USA',           timezone: 'America/New_York',    offset: 'UTC-5:00' },
  { city: 'Chicago',      country: 'USA',           timezone: 'America/Chicago',     offset: 'UTC-6:00' },
  { city: 'Denver',       country: 'USA',           timezone: 'America/Denver',      offset: 'UTC-7:00' },
  { city: 'Los Angeles',  country: 'USA',           timezone: 'America/Los_Angeles', offset: 'UTC-8:00' },
  { city: 'Toronto',      country: 'Canada',        timezone: 'America/Toronto',     offset: 'UTC-5:00' },
  { city: 'Vancouver',    country: 'Canada',        timezone: 'America/Vancouver',   offset: 'UTC-8:00' },
  { city: 'Mexico City',  country: 'Mexico',        timezone: 'America/Mexico_City', offset: 'UTC-6:00' },
  { city: 'São Paulo',    country: 'Brazil',        timezone: 'America/Sao_Paulo',   offset: 'UTC-3:00' },
  { city: 'Buenos Aires', country: 'Argentina',     timezone: 'America/Argentina/Buenos_Aires', offset: 'UTC-3:00' },
  { city: 'Lima',         country: 'Peru',          timezone: 'America/Lima',        offset: 'UTC-5:00' },
  { city: 'Bogotá',       country: 'Colombia',      timezone: 'America/Bogota',      offset: 'UTC-5:00' },

  // ── Oceania ──────────────────────────────────────────────────
  { city: 'Sydney',       country: 'Australia',     timezone: 'Australia/Sydney',    offset: 'UTC+10:00' },
  { city: 'Melbourne',    country: 'Australia',     timezone: 'Australia/Melbourne', offset: 'UTC+10:00' },
  { city: 'Perth',        country: 'Australia',     timezone: 'Australia/Perth',     offset: 'UTC+8:00' },
  { city: 'Auckland',     country: 'New Zealand',   timezone: 'Pacific/Auckland',    offset: 'UTC+12:00' },
].map(t => ({ ...t, label: `${t.city} (${t.country}) — ${t.offset}` }));
