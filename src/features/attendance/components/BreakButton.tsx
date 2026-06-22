import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { attendanceApi } from '../api';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ActiveBreak {
  id: string;
  startTime: string; // ISO string
}

export interface BreakButtonProps {
  activeBreak: ActiveBreak | null;
  attendanceStatus: string;         // 'PENDING' = checked in; anything else = disabled
  breakAllocatedMinutes?: number;   // default 60
  previouslyConsumedSeconds?: number;
  onRefresh: () => void;
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  navy: '#0F1D3A',
  offWhite: '#F7F9FC',
  amber: '#F6A623',
  amberLight: '#FFF8EC',
  amberDim: 'rgba(246,166,35,0.15)',
  teal: '#1DB8A0',
  tealDim: 'rgba(29,184,160,0.12)',
  purple: '#7C5CBF',
  purpleDim: 'rgba(124,92,191,0.12)',
  errorRed: '#E53E3E',
  white: '#FFFFFF',
  subtle: '#8A9BB5',
  border: '#E2E8F0',
  cardBg: '#FFFFFF',
  textPrimary: '#1A202C',
};

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = Math.min(SCREEN_W - 48, 360);

// ── Arc progress SVG ──────────────────────────────────────────────────────────
// progress: 0 → 1.  Over 1 means overtime — shown in red.
const ARC_SIZE = 120;
const STROKE = 8;
const RADIUS = (ARC_SIZE - STROKE) / 2;
const CIRCUMF = 2 * Math.PI * RADIUS;

function ArcProgress({ progress }: { progress: number }) {
  const isOver = progress > 1;
  const clamped = Math.min(progress, 1);
  const dashOffset = CIRCUMF * (1 - clamped);
  const arcColor = isOver ? '#F59E0B' : C.amber; // keep it warm/amber, not red

  return (
    <Svg width={ARC_SIZE} height={ARC_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
      {/* track */}
      <Circle
        cx={ARC_SIZE / 2} cy={ARC_SIZE / 2} r={RADIUS}
        stroke={C.border} strokeWidth={STROKE} fill="none"
      />
      {/* fill */}
      <Circle
        cx={ARC_SIZE / 2} cy={ARC_SIZE / 2} r={RADIUS}
        stroke={arcColor} strokeWidth={STROKE} fill="none"
        strokeDasharray={`${CIRCUMF} ${CIRCUMF}`}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ── Elapsed timer hook ────────────────────────────────────────────────────────
function useElapsed(startIso: string | null) {
  const [elapsed, setElapsed] = useState(0); // seconds

  useEffect(() => {
    if (!startIso) { setElapsed(0); return; }
    const tick = () => {
      const diff = Math.floor((Date.now() - new Date(startIso).getTime()) / 1000);
      setElapsed(Math.max(0, diff));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startIso]);

  return elapsed;
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Pulse dot for "on break" indicator ───────────────────────────────────────
function PulseDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const opac = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.6, duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 700, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opac, { toValue: 0, duration: 700, useNativeDriver: true }),
          Animated.timing(opac, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={pd.wrap}>
      <Animated.View style={[pd.ring, { transform: [{ scale }], opacity: opac }]} />
      <View style={pd.dot} />
    </View>
  );
}

const pd = StyleSheet.create({
  wrap: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute', width: 14, height: 14, borderRadius: 7,
    backgroundColor: C.amber, opacity: 0.4,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.amber },
});

// ── Fade/slide in animation ───────────────────────────────────────────────────
function useMountAnim() {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, []);

  return { opacity, translateY };
}

// ════════════════════════════════════════════════════════════════════════════
//  IDLE STATE — "Start Break" pill button
// ════════════════════════════════════════════════════════════════════════════
function IdleBreak({ onPress, disabled, loading, allocatedMinutes, previouslyConsumedSeconds = 0 }: {
  onPress: () => void; disabled: boolean; loading: boolean;
  allocatedMinutes: number; previouslyConsumedSeconds: number;
}) {
  const { opacity, translateY } = useMountAnim();
  const pressScale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(pressScale, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  const onPressOut = () => Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  const remainingMinutes = Math.max(0, allocatedMinutes - Math.floor(previouslyConsumedSeconds / 60));
  const isOver = allocatedMinutes - Math.floor(previouslyConsumedSeconds / 60) < 0;

  const subText = disabled ? 'Check in first' : (
    previouslyConsumedSeconds > 0 
      ? (isOver ? 'No allocated time left' : `${remainingMinutes} min remaining`)
      : `${allocatedMinutes} min allocated`
  );

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Animated.View style={{ transform: [{ scale: pressScale }] }}>
        <TouchableOpacity
          activeOpacity={1}
          disabled={disabled}
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
        >
          <LinearGradient
            colors={disabled ? ['#C8D0DC', '#B0BACB'] : [C.purple, '#9B79D8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.idleBtn}
          >
            {loading ? (
              <ActivityIndicator color={C.white} size="small" />
            ) : (
              <>
                <View style={s.idleBtnIcon}>
                  <Ionicons name="cafe-outline" size={20} color={C.white} />
                </View>
                <View>
                  <Text style={s.idleBtnLabel}>Start Break</Text>
                  <Text style={s.idleBtnSub}>
                    {subText}
                  </Text>
                </View>
                {!disabled && (
                  <Ionicons name="arrow-forward-circle-outline" size={22} color="rgba(255,255,255,0.7)" style={s.idleArrow} />
                )}
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  ACTIVE STATE — timer card with arc
// ════════════════════════════════════════════════════════════════════════════
function ActiveBreakCard({ activeBreak, allocatedMinutes, previouslyConsumedSeconds, onPress, loading }: {
  activeBreak: ActiveBreak;
  allocatedMinutes: number;
  previouslyConsumedSeconds: number;
  onPress: () => void;
  loading: boolean;
}) {
  const { opacity, translateY } = useMountAnim();
  const sessionElapsed = useElapsed(activeBreak.startTime);
  const elapsed = sessionElapsed + previouslyConsumedSeconds;
  const allocSecs = allocatedMinutes * 60;
  const progress = elapsed / allocSecs;
  const isOver = elapsed > allocSecs;
  const remaining = allocSecs - elapsed;

  const pressScale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(pressScale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const onPressOut = () => Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  const [hasNotified, setHasNotified] = useState(false);

  useEffect(() => {
    if (isOver && !hasNotified) {
      setHasNotified(true);
    }
  }, [isOver, hasNotified]);

  return (
    <Animated.View style={[s.activeCard, { opacity, transform: [{ translateY }] }]}>

      {/* ── Header row ── */}
      <View style={s.activeHeader}>
        <View style={s.activeHeaderLeft}>
          {isOver ? (
            <Ionicons name="checkmark-circle" size={18} color={C.teal} />
          ) : (
            <PulseDot />
          )}
          <Text style={[s.activeTitle, isOver && { color: C.teal }]}>
            {isOver ? 'Break Finished' : 'On Break'}
          </Text>
        </View>
        <View style={[s.overBadge, { backgroundColor: isOver ? C.tealDim : C.amberLight }]}>
          <Text style={[s.overBadgeText, { color: isOver ? C.teal : C.amber }]}>
            {isOver
              ? 'Return to Work'
              : `${formatTime(Math.max(0, remaining))} left`}
          </Text>
        </View>
      </View>

      {/* ── Arc + elapsed time ── */}
      <View style={s.arcRow}>
        <View style={s.arcWrap}>
          <ArcProgress progress={progress} />
          {/* centered text inside arc */}
          <View style={s.arcCenter} pointerEvents="none">
            <Text style={[s.arcTime, isOver && { color: C.teal }]}>
              {formatTime(isOver ? allocSecs : elapsed)}
            </Text>
            <Text style={s.arcSub}>{isOver ? 'completed' : 'elapsed'}</Text>
          </View>
        </View>

        {/* ── Right side stats ── */}
        <View style={s.arcStats}>
          <View style={s.arcStatRow}>
            <View style={[s.arcStatDot, { backgroundColor: C.amberDim }]}>
              <Ionicons name="alarm-outline" size={13} color={C.amber} />
            </View>
            <View>
              <Text style={s.arcStatVal}>{formatTime(allocSecs)}</Text>
              <Text style={s.arcStatLbl}>Allocated</Text>
            </View>
          </View>
          <View style={s.arcStatRow}>
            <View style={[s.arcStatDot, { backgroundColor: isOver ? C.tealDim : C.purpleDim }]}>
              <Ionicons name={isOver ? "checkmark-done" : "time-outline"} size={13} color={isOver ? C.teal : C.purple} />
            </View>
            <View>
              <Text style={[s.arcStatVal, isOver && { color: C.teal }]}>
                {isOver ? 'Time Up!' : formatTime(Math.max(0, remaining))}
              </Text>
              <Text style={s.arcStatLbl}>{isOver ? 'Enjoy your rest' : 'Remaining'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Progress bar ── */}
      <View style={s.barTrack}>
        <Animated.View style={[
          s.barFill,
          {
            width: `${Math.min(progress * 100, 100)}%`,
            backgroundColor: isOver ? C.teal : C.amber,
          },
        ]} />
      </View>
      <View style={s.barLabels}>
        <Text style={s.barLblText}>0 min</Text>
        <Text style={s.barLblText}>{allocatedMinutes} min</Text>
      </View>

      {/* ── End break button ── */}
      <Animated.View style={{ transform: [{ scale: pressScale }], marginTop: 16 }}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={loading}
        >
          <LinearGradient
            colors={isOver ? [C.teal, '#16A085'] : [C.amber, '#FBBF24']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.endBtn}
          >
            {loading ? (
              <ActivityIndicator color={C.white} size="small" />
            ) : (
              <>
                <Ionicons name={isOver ? "log-in-outline" : "stop-circle-outline"} size={20} color={C.white} />
                <Text style={s.endBtnText}>{isOver ? 'Resume Work' : 'End Break'}</Text>
                {isOver && (
                  <View style={[s.endBtnBadge, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                    <Text style={s.endBtnBadgeText}>Done!</Text>
                  </View>
                )}
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

    </Animated.View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════════
export function BreakButton({
  activeBreak,
  attendanceStatus,
  breakAllocatedMinutes = 60,
  previouslyConsumedSeconds = 0,
  onRefresh,
}: BreakButtonProps) {
  const [loading, setLoading] = useState(false);
  const isDisabled = attendanceStatus !== 'PENDING';

  const handlePress = useCallback(async () => {
    setLoading(true);
    try {
      if (activeBreak) {
        await attendanceApi.endBreak();
      } else {
        await attendanceApi.startBreak();
      }
      onRefresh();
    } catch (_) {
      // parent handles errors
    } finally {
      setLoading(false);
    }
  }, [activeBreak, onRefresh]);

  if (activeBreak) {
    return (
      <ActiveBreakCard
        activeBreak={activeBreak}
        allocatedMinutes={breakAllocatedMinutes}
        previouslyConsumedSeconds={previouslyConsumedSeconds}
        onPress={handlePress}
        loading={loading}
      />
    );
  }

  return (
    <IdleBreak
      onPress={handlePress}
      disabled={isDisabled}
      loading={loading}
      allocatedMinutes={breakAllocatedMinutes}
      previouslyConsumedSeconds={previouslyConsumedSeconds}
    />
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // ── Idle button ──────────────────────────────────────────────────────────
  idleBtn: {
    width: CARD_W,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 14,
    shadowColor: C.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  idleBtnIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  idleBtnLabel: { color: C.white, fontSize: 16, fontWeight: '700' },
  idleBtnSub: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 1 },
  idleArrow: { marginLeft: 'auto' },

  // ── Active card ──────────────────────────────────────────────────────────
  activeCard: {
    width: CARD_W,
    backgroundColor: C.cardBg,
    borderRadius: 24,
    padding: 20,
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  activeHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activeTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary },
  overBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  overBadgeText: { fontSize: 12, fontWeight: '600' },

  // arc row
  arcRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 16 },
  arcWrap: { width: ARC_SIZE, height: ARC_SIZE, position: 'relative' },
  arcCenter: {
    position: 'absolute', top: 0, left: 0,
    width: ARC_SIZE, height: ARC_SIZE,
    alignItems: 'center', justifyContent: 'center',
  },
  arcTime: { fontSize: 20, fontWeight: '800', color: C.textPrimary, letterSpacing: -0.5 },
  arcSub: { fontSize: 10, color: C.subtle, marginTop: 1 },

  // arc stats
  arcStats: { flex: 1, gap: 14 },
  arcStatRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  arcStatDot: {
    width: 30, height: 30, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  arcStatVal: { fontSize: 13, fontWeight: '700', color: C.textPrimary },
  arcStatLbl: { fontSize: 10, color: C.subtle, marginTop: 1 },

  // progress bar
  barTrack: {
    height: 6, borderRadius: 3,
    backgroundColor: C.border,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  barLblText: { fontSize: 10, color: C.subtle },

  // end button
  endBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    shadowColor: C.amber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  endBtnText: { color: C.white, fontSize: 15, fontWeight: '700' },
  endBtnBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
  },
  endBtnBadgeText: { color: C.white, fontSize: 11, fontWeight: '600' },
});