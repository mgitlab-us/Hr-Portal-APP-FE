import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  navy: '#0F1D3A',
  white: '#FFFFFF',
  accent: '#5BA3F5',
  inactive: '#8A9BB5',
  barBg: '#FFFFFF',
  barBorder: '#E2E8F2',
};

// ── Geometry ──────────────────────────────────────────────────────────────────
const SCREEN_W = Dimensions.get('window').width;
const H_PAD = 10;
const BAR_W = SCREEN_W - H_PAD * 2;
const BAR_H = 66;
const BAR_R = 12;
const CIRCLE_R = 24;

const LIFT = 4;
const ARC_R = CIRCLE_R + 12;
const NOTCH_W = ARC_R * 2;

const NOTCH_MIN_X = BAR_R + ARC_R + 1;
const NOTCH_MAX_X = BAR_W - BAR_R - ARC_R - 1;

export const TAB_BAR_HEIGHT = BAR_H + 48;

// ── SVG path ──────────────────────────────────────────────────────────────────
function buildPath(cx: number): string {
  const w = BAR_W;
  const h = BAR_H;
  const r = BAR_R;
  const hw = NOTCH_W / 2;

  const safeCx = Math.max(NOTCH_MIN_X, Math.min(NOTCH_MAX_X, cx));
  const nL = safeCx - hw;
  const nR = safeCx + hw;

  return (
    `M ${r} 0 ` +
    `L ${nL} 0 ` +
    `A ${ARC_R} ${ARC_R} 0 0 0 ${nR} 0 ` +
    `L ${w - r} 0 ` +
    `Q ${w} 0 ${w} ${r} ` +
    `L ${w} ${h - r} ` +
    `Q ${w} ${h} ${w - r} ${h} ` +
    `L ${r} ${h} ` +
    `Q 0 ${h} 0 ${h - r} ` +
    `L 0 ${r} ` +
    `Q 0 0 ${r} 0 Z`
  );
}

// ── AnimatedSvgBar ────────────────────────────────────────────────────────────
function AnimatedSvgBar({ notchX }: { notchX: Animated.Value }) {
  const pathRef = useRef<any>(null);
  // Store current X in a ref so we can read it synchronously in the listener
  const currentX = useRef<number>(NOTCH_MIN_X);

  useEffect(() => {
    const id = notchX.addListener(({ value }) => {
      currentX.current = value;
      pathRef.current?.setNativeProps({ d: buildPath(value) });
    });
    return () => notchX.removeListener(id);
  }, [notchX]);

  return (
    <Svg width={BAR_W} height={BAR_H} style={StyleSheet.absoluteFill}>
      <Path
        ref={pathRef}
        d={buildPath(currentX.current)}
        fill={C.barBg}
        stroke="#D1DCF0"
        strokeWidth={1.5}
      />
    </Svg>
  );
}

// ── Floating active circle ────────────────────────────────────────────────────
function FloatingCircle({
  translateX,
  iconNode,
  opacity,
}: {
  translateX: Animated.Value;
  iconNode: React.ReactNode;
  opacity: Animated.Value;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.88, duration: 70, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 200 }),
    ]).start();
  }, [iconNode]);

  const size = CIRCLE_R * 2;
  const centrY = ARC_R - CIRCLE_R - LIFT;
  const top = centrY - CIRCLE_R;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top,
        left: -CIRCLE_R,
        width: size,
        height: size,
        borderRadius: CIRCLE_R,
        opacity,
        transform: [{ translateX }, { scale }],
      }}
    >
      <View style={{
        width: size,
        height: size,
        borderRadius: CIRCLE_R,
        backgroundColor: C.accent,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: C.accent,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.45,
        shadowRadius: 10,
        elevation: 14,
      }}>
        {iconNode}
      </View>
    </Animated.View>
  );
}

// ── Single tab item ───────────────────────────────────────────────────────────
function TabItem({
  route,
  isFocused,
  options,
  onPress,
}: {
  route: any;
  isFocused: boolean;
  options: any;
  onPress: () => void;
}) {
  const pressScale = useRef(new Animated.Value(1)).current;
  const labelOpacity = useRef(new Animated.Value(isFocused ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(labelOpacity, {
      toValue: isFocused ? 0 : 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [isFocused]);

  const onPressIn = () =>
    Animated.spring(pressScale, { toValue: 0.88, useNativeDriver: true, friction: 8 }).start();
  const onPressOut = () =>
    Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 200 }).start();

  const label =
    typeof options.tabBarLabel === 'string' ? options.tabBarLabel :
      typeof options.title === 'string' ? options.title :
        route.name;

  const iconNode = options.tabBarIcon?.({
    color: isFocused ? 'transparent' : C.inactive,
    size: 22,
    focused: isFocused,
  });

  return (
    <TouchableOpacity
      style={styles.tabTap}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
    >
      <Animated.View style={{ alignItems: 'center', transform: [{ scale: pressScale }] }}>
        <View style={[styles.iconWrap, { opacity: isFocused ? 0 : 1 }]}>
          {iconNode}
        </View>
        <Animated.Text style={[
          styles.label,
          {
            color: isFocused ? C.accent : C.inactive,
            fontWeight: isFocused ? '700' : '500',
            opacity: labelOpacity,
          },
        ]}>
          {label}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

import { useAuthStore } from '@/features/auth/store';

// ── Main CustomTabBar ─────────────────────────────────────────────────────────
export function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { employee } = useAuthStore();
  const role = employee?.role;
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isAdmin = role === 'ADMIN';

  // Filter to only primary tabs — sub-screens and hidden routes are excluded
  const HIDDEN_ROUTES = new Set([
    'leave-approvals', 'create-employee', 'request-correction', 'request-leave',
    'shift-settings'
  ]);

  const visibleRoutes = state.routes.filter((r: any) => {
    const { options } = descriptors[r.key];
    const isHiddenBySet = HIDDEN_ROUTES.has(r.name);
    
    // FAIL-SAFE ROLE FILTERING
    if (r.name === 'corrections' && isSuperAdmin) return false;
    if (r.name === 'daily-logs' && isAdmin) return false;

    return options.tabBarIcon !== undefined && (options as any).href !== null && !isHiddenBySet;
  });

  const focusedKey = state.routes[state.index]?.key;
  const focusedIdx = visibleRoutes.findIndex((r: any) => r.key === focusedKey);
  // When on a sub-screen, focusedIdx is -1. Track last valid tab for display.
  const lastValidIdx = useRef(0);
  if (focusedIdx !== -1) lastValidIdx.current = focusedIdx;
  // displayIdx is what TabItem uses — ensures only one tab looks "active" at all times
  const displayIdx = focusedIdx !== -1 ? focusedIdx : lastValidIdx.current;

  const tabCount = visibleRoutes.length;
  const tabW = tabCount > 0 ? BAR_W / tabCount : BAR_W;
  const getTabCentreX = (idx: number) => tabW * idx + tabW / 2;

  const targetX = Math.max(NOTCH_MIN_X, Math.min(NOTCH_MAX_X, getTabCentreX(lastValidIdx.current)));

  // circleX uses native driver (transform), notchX uses JS driver (SVG path)
  const circleX = useRef(new Animated.Value(targetX)).current;
  const notchX = useRef(new Animated.Value(targetX)).current;
  // Always keep opacity at 1 — circle stays on last active tab even on sub-screens
  const circleOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const cfg = { friction: 22, tension: 180 };
    Animated.parallel([
      Animated.spring(circleX, { toValue: targetX, useNativeDriver: true, ...cfg }),
      Animated.spring(notchX, { toValue: targetX, useNativeDriver: false, ...cfg }),
    ]).start();
  }, [focusedIdx, targetX]);

  // Always use lastValidIdx for the icon so circle never shows empty
  const activeDisplayIdx = lastValidIdx.current;
  const activeRoute = visibleRoutes[activeDisplayIdx] ?? null;
  const activeIconNode = activeRoute
    ? descriptors[activeRoute.key].options.tabBarIcon?.({
      color: C.white, size: 22, focused: true,
    })
    : null;

  return (
    <View style={[
      styles.outer,
      { paddingBottom: insets.bottom > 0 ? insets.bottom - 4 : 12 },
    ]}>
      <View style={{ paddingTop: Math.max(0, -(ARC_R - CIRCLE_R * 2 - LIFT)) + 4, overflow: 'visible' }}>
        <View style={[styles.barWrap, { width: BAR_W, height: BAR_H }]}>

          <View style={[styles.shadow, { borderRadius: BAR_R }]} />

          <AnimatedSvgBar notchX={notchX} />

          <View style={styles.tabsRow}>
            {visibleRoutes.map((route: any, idx: number) => {
              // Use displayIdx so the last active tab still looks focused on sub-screens
              const isFocused = displayIdx === idx;
              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress', target: route.key, canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };
              return (
                <TabItem
                  key={route.key}
                  route={route}
                  isFocused={isFocused}
                  options={descriptors[route.key].options}
                  onPress={onPress}
                />
              );
            })}
          </View>

          <FloatingCircle translateX={circleX} iconNode={activeIconNode} opacity={circleOpacity} />

        </View>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: H_PAD,
    paddingTop: 8,
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
  barWrap: {
    overflow: 'visible',
  },
  shadow: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'transparent',
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 20,
    borderTopWidth: 1,
    borderTopColor: C.barBorder,
    borderRadius: BAR_R,
  },
  tabsRow: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row',
  },
  tabTap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  iconWrap: {
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10.5,
    letterSpacing: 0.2,
    marginTop: 1,
  },
});