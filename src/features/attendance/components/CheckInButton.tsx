import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated as RNAnimated,
  Easing,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { attendanceApi } from '../api';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { fetchFreshLocation } from '@/lib/locationService';
import { Dimensions } from 'react-native';

const SCREEN_W = Dimensions.get('window').width;
const CARD_W = SCREEN_W - 40; // px-5 = 20px each side

// ── Types ─────────────────────────────────────────────────────────────────────
export type AttendanceStatus = 'IDLE' | 'PENDING' | 'ON_BREAK' | 'COMPLETE';

export interface CheckInButtonProps {
  status: AttendanceStatus;
  checkinTime?: string | null;
  checkoutTime?: string | null;
  workingHours?: string | null;
  loading?: boolean;
  onRefresh: () => void;
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  navy: '#0F1D3A',
  accentBright: '#5BA3F5',
  teal: '#1DB8A0',
  amber: '#F6A623',
  errorRed: '#E53E3E',
  white: '#FFFFFF',
  subtle: '#8A9BB5',
  border: '#E2E8F0',
};

// ── Sizing constants — slightly reduced button ────────────────────────────────
const BTN = 148;          // reduced from 168
const HALO = BTN + 44;
const RING1 = BTN + 74;
const RING2 = BTN + 108;
const CANVAS = RING2 + 8;

// ── Per-status config ─────────────────────────────────────────────────────────
const CFG = {
  IDLE: {
    label: 'Check In', sublabel: 'Tap to start your day',
    icon: 'finger-print-outline' as const,
    ga: C.accentBright, gb: C.teal,
    halo: 'rgba(91,163,245,0.12)',
    ring: 'rgba(91,163,245,',
  },
  PENDING: {
    label: 'Check Out', sublabel: 'Tap when you leave',
    icon: 'log-out-outline' as const,
    ga: '#E53E3E', gb: '#FC8181',
    halo: 'rgba(229,62,62,0.10)',
    ring: 'rgba(229,62,62,',
  },
  ON_BREAK: {
    label: 'On Break', sublabel: 'End break to continue',
    icon: 'cafe-outline' as const,
    ga: C.amber, gb: '#FBBF24',
    halo: 'rgba(246,166,35,0.10)',
    ring: 'rgba(246,166,35,',
  },
  COMPLETE: {
    label: 'Done', sublabel: 'Great work today!',
    icon: 'checkmark-circle-outline' as const,
    ga: '#48BB78', gb: C.teal,
    halo: 'rgba(72,187,120,0.10)',
    ring: 'rgba(72,187,120,',
  },
} as const;

// ── Single ripple ring ────────────────────────────────────────────────────────
function RippleRing({
  size, delay, color, active,
}: { size: number; delay: number; color: string; active: boolean }) {
  const anim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    if (!active) { anim.setValue(0); return; }
    const loop = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.delay(delay),
        RNAnimated.timing(anim, {
          toValue: 1, duration: 2000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        RNAnimated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, delay]);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1] });
  const opacity = anim.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.55, 0] });

  const offset = (CANVAS - size) / 2;

  return (
    <RNAnimated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: offset, left: offset,
        width: size, height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: `${color}0.7)`,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
// Fixed: column layout so label sits above value — no overflow on long time strings
function StatPill({ icon, label, value, accent }: {
  icon: string; label: string; value: string; accent: string;
}) {
  return (
    <View style={s.pill}>
      <View style={[s.pillIcon, { backgroundColor: `${accent}1A` }]}>
        <Ionicons name={icon as any} size={14} color={accent} />
      </View>
      <View style={s.pillText}>
        <Text style={s.pillLbl}>{label}</Text>
        <Text style={s.pillVal} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {value}
        </Text>
      </View>
    </View>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function CheckInButton({
  status, checkinTime, checkoutTime, workingHours,
  loading = false, onRefresh,
}: CheckInButtonProps) {
  const normalized = (CFG[status as keyof typeof CFG] ? status : 'IDLE') as keyof typeof CFG;
  const cfg = CFG[normalized];

  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const isDisabled = normalized === 'ON_BREAK' || normalized === 'COMPLETE' || loading || isFetchingLocation;
  const ringsOn = !isDisabled && !loading && !isFetchingLocation;

  const handlePress = useCallback(async () => {
    if (isDisabled) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsFetchingLocation(true);

    try {
      const fix = await fetchFreshLocation(10_000);

      if (normalized === 'PENDING') {
        await attendanceApi.checkout(fix.lat, fix.lng, fix.accuracy);
      } else if (normalized === 'IDLE') {
        await attendanceApi.checkin(fix.lat, fix.lng, fix.accuracy);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onRefresh();
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      if (err?.name === 'LocationError') {
        if (err.code === 'SERVICES_DISABLED') {
          Alert.alert(
            'GPS Disabled',
            'Your device location services are turned off. Please enable GPS in your device settings to check in.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Location Required', err.message);
        }
      } else {
        const apiError = err?.response?.data?.message || err?.message || 'Attendance action failed.';
        Alert.alert('Attendance Error', apiError);
      }
    } finally {
      setIsFetchingLocation(false);
    }
  }, [normalized, isDisabled, onRefresh]);

  const btnOffset = (CANVAS - BTN) / 2;
  const haloOffset = (CANVAS - HALO) / 2;

  return (
    <View style={s.root}>

      {/* ── Canvas: rings + button ── */}
      <View style={{ width: CANVAS, height: CANVAS }}>

        {/* Soft static halo */}
        <View style={[s.halo, {
          top: haloOffset, left: haloOffset,
          width: HALO, height: HALO, borderRadius: HALO / 2,
          backgroundColor: cfg.halo,
        }]} />

        {/* Ripple rings */}
        <RippleRing size={RING1} delay={0} color={cfg.ring} active={ringsOn} />
        <RippleRing size={RING2} delay={600} color={cfg.ring} active={ringsOn} />

        {/* Button */}
        <View style={[s.btnWrap, { top: btnOffset, left: btnOffset }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={isDisabled}
            onPress={handlePress}
          >
            <Animated.View
              key={normalized}
              entering={FadeIn.duration(400)}
              exiting={FadeOut.duration(300)}
            >
              <LinearGradient
                colors={[cfg.ga, cfg.gb]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[s.circle, {
                  opacity: isDisabled && status !== 'COMPLETE' ? 0.72 : 1,
                }]}
              >
                {loading || isFetchingLocation ? (
                  <>
                    <ActivityIndicator color={C.white} size="large" />
                    <Text style={[s.btnSub, { color: C.white, opacity: 0.9, marginTop: 10 }]}>
                      {isFetchingLocation ? 'Fetching Location...' : 'Updating...'}
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name={cfg.icon} size={30} color={C.white} style={s.btnIcon} />
                    <Text style={s.btnLabel}>{cfg.label}</Text>
                    <Text style={s.btnSub}>{cfg.sublabel}</Text>
                  </>
                )}
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        </View>

      </View>

      {/* ── Stats card ── */}
      <View style={s.statsCard}>
        <StatPill icon="log-in-outline" label="Check In" value={checkinTime ?? '--:--'} accent={C.teal} />
        <View style={s.divider} />
        <StatPill icon="log-out-outline" label="Check Out" value={checkoutTime ?? '--:--'} accent={C.errorRed} />
        <View style={s.divider} />
        <StatPill icon="time-outline" label="Working" value={workingHours ?? '--:--'} accent={C.accentBright} />
      </View>

    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { alignItems: 'center' },

  halo: { position: 'absolute' },

  btnWrap: {
    position: 'absolute',
    width: BTN,
    height: BTN,
  },

  circle: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 14,
  },
  btnIcon: { marginBottom: 3 },
  btnLabel: { color: C.white, fontSize: 18, fontWeight: '800', letterSpacing: 0.2 },
  btnSub: { color: 'rgba(255,255,255,0.65)', fontSize: 10.5, marginTop: 2 },

  // Stats card
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 18,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
    width: CARD_W,
  },
  divider: { width: 1, height: 28, backgroundColor: C.border, marginHorizontal: 6 },

  // Pill: row with icon + stacked text
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    overflow: 'hidden',
  },
  pillIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pillText: {
    flex: 1,
    flexShrink: 1,
  },
  // Label on top (small), value below (bold) — reversed from before to match common pattern
  pillLbl: {
    fontSize: 9.5,
    color: C.subtle,
    marginBottom: 1,
  },
  pillVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: C.navy,
    letterSpacing: 0.1,
  },
});