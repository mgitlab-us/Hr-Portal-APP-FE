import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Animated, Pressable,
  Platform, StatusBar, ScrollView,
} from 'react-native';
import { SafeKeyboardAvoidingView } from '../../src/components/ui/SafeKeyboardAvoidingView';
import { useForm, Controller } from 'react-hook-form';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { LoginInput } from '@/types';
import { formatDateDMY } from '@/lib/datetime';
import { authApi } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';
import { secureStorage } from '@/lib/secureStorage';
import { syncPushTokenToServer } from '@/lib/notificationService';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── Design tokens (blue theme — matches web) ─────────────────────────────────
const C = {
  // header
  navy: '#0B1736',
  navyMid: '#0F2152',
  navyLight: '#16348A',
  // brand blues
  blue: '#2F66E8',
  blueBright: '#4C8DF7',
  link: '#2563EB',
  cyan: '#4FB4F2',
  // text
  ink: '#0B1B45',
  muted: '#6E84AE',
  placeholder: '#7C90B7',
  // surfaces
  white: '#FFFFFF',
  cardTop: '#F7F9FE',
  cardMid: '#F3F6FD',
  cardBottom: '#E9F0FC',
  border: '#E2E9F6',
  line: '#D5DEEF',
  tile: '#EAF1FD',
  tileActive: '#DCE9FD',
  iconIdle: '#7F97C6',
  avatarBg: '#CFE5FC',
  errorRed: '#E5484D',
};

const BUTTON_GRADIENT: [string, string] = ['#4A8CF7', '#3A5FD9'];
const HEAVY_FONT = Platform.OS === 'android' ? 'sans-serif-black' : undefined;

// ── Live clock ────────────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const tick = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const hh = String(time.getHours() % 12 || 12).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');
  const ss = String(time.getSeconds()).padStart(2, '0');
  const ampm = time.getHours() >= 12 ? 'PM' : 'AM';
  const dateStr = formatDateDMY(time, 'EEEE, dd MMMM yyyy');

  return (
    <View style={s.clockWrap}>
      <View style={s.clockRow}>
        <Text style={s.clockHM}>{hh}:{mm}</Text>
        <View style={s.clockRight}>
          <Text style={s.clockSS}>{ss}</Text>
          <Text style={s.clockAMPM}>{ampm}</Text>
        </View>
      </View>
      <Text style={s.clockDate}>{dateStr}</Text>
    </View>
  );
}

// ── Float input ──────────────────────────────────────────────────────────────
interface InputProps {
  label: string;
  icon: string;
  value: string;
  onChangeText: (t: string) => void;
  onBlur: () => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  error?: string;
}

function FloatInput({
  label, icon, value, onChangeText, onBlur,
  secureTextEntry = false, keyboardType, autoCapitalize, error,
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;

  // Keep the label in sync when the value is set from outside (autofill, reset)
  useEffect(() => {
    if (value) labelAnim.setValue(1);
    else if (!focused) labelAnim.setValue(0);
  }, [value]);

  const handleFocus = () => {
    setFocused(true);
    Animated.parallel([
      Animated.timing(labelAnim, { toValue: 1, duration: 180, useNativeDriver: false }),
      Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
    ]).start();
  };

  const handleBlur = () => {
    setFocused(false);
    onBlur();
    if (!value) Animated.timing(labelAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const labelTop = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 9] });
  const labelSize = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 11] });
  const labelColor = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [C.placeholder, C.blueBright] });
  const borderColor = error
    ? C.errorRed
    : borderAnim.interpolate({ inputRange: [0, 1], outputRange: [C.border, C.blueBright] });

  return (
    <View style={s.inputWrap}>
      <Pressable onPress={() => inputRef.current?.focus()}>
        {/* Shadow wrapper is separate from the clipped box so Android doesn't cut the elevation */}
        <View style={s.inputShadow}>
          <Animated.View style={[s.inputBox, { borderColor }]}>
            <View style={[s.iconTile, focused && s.iconTileActive]}>
              <Ionicons name={icon as any} size={20} color={focused ? C.link : C.iconIdle} />
            </View>
            <View style={s.inputInner}>
              <TextInput
                ref={inputRef}
                style={s.inputText}
                value={value}
                onChangeText={onChangeText}
                onFocus={handleFocus}
                onBlur={handleBlur}
                secureTextEntry={secureTextEntry && !visible}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize ?? 'none'}
                placeholderTextColor="transparent"
                underlineColorAndroid="transparent"
                selectionColor={C.blueBright}
              />
              <Animated.Text
                pointerEvents="none"
                style={[s.floatLabel, { top: labelTop, fontSize: labelSize, color: labelColor }]}
              >
                {label}
              </Animated.Text>
            </View>
            {secureTextEntry && (
              <TouchableOpacity onPress={() => setVisible(v => !v)} style={s.eyeBtn} hitSlop={8}>
                <Ionicons
                  name={visible ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={focused ? C.link : C.placeholder}
                />
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </Pressable>
      {error && (
        <View style={s.errorRow}>
          <Ionicons name="alert-circle-outline" size={13} color={C.errorRed} />
          <Text style={s.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const [apiError, setApiError] = useState<string | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const insets = useSafeAreaInsets();

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 600, delay: 100, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 500, delay: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<LoginInput>({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setApiError(null);
      const res = await authApi.login(data);
      await secureStorage.setTokens(res.accessToken, res.refreshToken);
      setAuth(res.employee, res.accessToken, res.refreshToken);
      syncPushTokenToServer().catch(() => {});
      if (res.employee.mustChangePassword) {
        router.replace('/(auth)/change-password');
      } else {
        router.replace(res.employee.role === 'EMPLOYEE' ? '/(employee)/' : '/(admin)/');
      }
    } catch (e: any) {
      console.log('[Login Error]', {
        status: e.response?.status,
        data: e.response?.data,
        message: e.message,
        url: e.config?.url,
        baseURL: e.config?.baseURL,
      });
      const serverMsg = typeof e.response?.data?.message === 'string'
        ? e.response.data.message
        : null;
      if (serverMsg) {
        setApiError(serverMsg);
      } else if (e.response?.status === 503) {
        setApiError('Server unavailable (503). Still trying to reach Render instead of local server.');
      } else if (e.response?.status >= 500) {
        setApiError(`Server error (${e.response.status}). Check server.`);
      } else if (!e.response) {
        setApiError('Unable to connect to server. Check your connection or API URL.');
      } else {
        setApiError('Incorrect email or password');
      }
    }
  };

  return (
    <SafeKeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      {/* translucent + transparent lets the gradient run behind the Android status bar */}
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Gradient header ── */}
      <LinearGradient
        colors={[C.navy, C.navyMid, C.navyLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + 24 }]}
      >
        <View style={s.orbCircle} />
        <View style={s.orbSweep} />

        <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}>
          <View style={s.brandRow}>
            <View style={s.logoBoxWrap}>
              <LinearGradient
                colors={[C.blueBright, C.blue]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.logoBox}
              >
                <Ionicons name="business-outline" size={20} color={C.white} />
              </LinearGradient>
            </View>
            <Text style={s.brandName}>TapIn</Text>
          </View>

          <LiveClock />

          <View style={s.pillRow}>
            <View style={s.pill}>
              <Ionicons name="people-outline" size={15} color={C.blueBright} />
              <Text style={s.pillText}>HR Portal</Text>
            </View>
            <View style={s.pill}>
              <Ionicons name="shield-checkmark-outline" size={15} color={C.cyan} />
              <Text style={s.pillText}>Secure Login</Text>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* ── Scrollable card body ── */}
      <ScrollView
        style={s.cardOuter}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        bounces={false}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        <Animated.View
          style={[
            s.card,
            { paddingBottom: insets.bottom + 40, opacity: fadeIn, transform: [{ translateY: slideUp }] },
          ]}
        >
          <LinearGradient
            colors={[C.cardTop, C.cardMid, C.cardBottom]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          {/* Smooth, clipped vector waves anchored to the bottom of the card. */}
          <View style={s.waves} pointerEvents="none">
            <Svg
              width="100%"
              height="100%"
              viewBox="0 0 400 180"
              preserveAspectRatio="none"
            >
              <Path
                d="M0 58 C58 48 118 30 184 30 C244 30 264 78 310 80 C346 81 375 49 400 42 L400 180 L0 180 Z"
                fill="#DCE9FC"
                opacity={0.88}
              />
              <Path
                d="M0 92 C70 104 132 124 205 143 C278 162 338 126 400 105 L400 180 L0 180 Z"
                fill="#C9DDFB"
                opacity={0.48}
              />
              <Path
                d="M0 132 C72 112 126 121 190 145 C262 172 329 167 400 143 L400 180 L0 180 Z"
                fill="#EAF2FF"
                opacity={0.72}
              />
            </Svg>
          </View>

          <View style={s.handle} />

          <View style={s.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Welcome back</Text>
              <Text style={s.cardSubtitle}>Sign in to continue to your workspace</Text>
            </View>
            <View style={s.avatarWrap}>
              <View style={s.avatarCircle}>
                <Ionicons name="person-outline" size={22} color={C.link} />
              </View>
              <View style={s.avatarDot} />
            </View>
          </View>

          {apiError && (
            <View style={s.apiErrorBox}>
              <Ionicons name="warning-outline" size={14} color={C.errorRed} />
              <Text style={s.apiErrorText}>{apiError}</Text>
            </View>
          )}

          <Controller
            control={control}
            name="email"
            rules={{ required: 'Email is required' }}
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <FloatInput
                label="Email address" icon="mail-outline"
                value={value ?? ''} onChangeText={onChange} onBlur={onBlur}
                keyboardType="email-address" error={error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            rules={{ required: 'Password is required' }}
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <FloatInput
                label="Password" icon="lock-closed-outline"
                value={value ?? ''} onChangeText={onChange} onBlur={onBlur}
                secureTextEntry error={error?.message}
              />
            )}
          />

          <View style={{ alignItems: 'flex-end', marginTop: 6, marginBottom: 14 }}>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ color: C.link, fontSize: 13, fontWeight: '600' }}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.btn, isSubmitting && s.btnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            <View style={s.btnClip}>
              <LinearGradient
                colors={BUTTON_GRADIENT}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.btnGradient}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={C.white} />
                ) : (
                  <View style={s.btnInner}>
                    <Text style={s.btnText}>Sign In</Text>
                    <View style={s.btnArrow}>
                      <Ionicons name="arrow-forward" size={16} color={C.blue} />
                    </View>
                  </View>
                )}
              </LinearGradient>
            </View>
          </TouchableOpacity>

          <View style={s.footerRow}>
            <Ionicons name="information-circle-outline" size={14} color={C.muted} />
            <Text style={s.footerNote}>Contact your HR admin if you need account access.</Text>
          </View>

          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or</Text>
            <View style={s.dividerLine} />
          </View>

          <View style={s.registerRow}>
            <Text style={s.registerText}>New organization? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')} activeOpacity={0.7}>
              <Text style={s.registerLink}>Create one now →</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeKeyboardAvoidingView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const CARD_R = 32;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cardMid },

  // Header
  header: { paddingHorizontal: 24, paddingBottom: 48, overflow: 'hidden' },
  orbCircle: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(76,141,247,0.10)', top: -120, right: -90,
  },
  orbSweep: {
    position: 'absolute', width: 620, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(60,110,230,0.14)', top: 70, right: -300,
    transform: [{ rotate: '-28deg' }],
  },

  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  logoBoxWrap: { width: 36, height: 36, borderRadius: 11, overflow: 'hidden', marginRight: 12 },
  logoBox: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 18, fontWeight: '600', color: C.white, letterSpacing: 0.2 },

  clockWrap: { marginBottom: 14 },
  clockRow: { flexDirection: 'row', alignItems: 'flex-start' },
  clockHM: {
    fontSize: 44, fontWeight: '800', color: C.white, letterSpacing: -1, lineHeight: 50,
    fontFamily: HEAVY_FONT,
  },
  clockRight: { marginLeft: 8, marginTop: 6 },
  clockSS: { fontSize: 19, fontWeight: '700', color: 'rgba(150,175,230,0.8)', lineHeight: 22 },
  clockAMPM: { fontSize: 14, fontWeight: '800', color: C.blueBright, lineHeight: 17 },
  clockDate: { fontSize: 14, color: 'rgba(160,182,230,0.75)', marginTop: 6, letterSpacing: 0.1 },

  pillRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    height: 28, paddingHorizontal: 11, borderRadius: 10,
    backgroundColor: 'rgba(90,140,240,0.16)',
  },
  pillText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.88)' },

  // Card
  cardOuter: { flex: 1, marginTop: -CARD_R },
  scrollContent: { flexGrow: 1 },
  card: {
    backgroundColor: C.cardMid,
    borderTopLeftRadius: CARD_R,
    borderTopRightRadius: CARD_R,
    paddingHorizontal: 24,
    minHeight: '100%',
    overflow: 'hidden',
  },
  // SVG keeps the wave curves smooth at every screen width.
  waves: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 170,
    overflow: 'hidden',
  },
  handle: {
    width: 43, height: 4, borderRadius: 2, backgroundColor: '#C8D2E6',
    alignSelf: 'center', marginTop: 14, marginBottom: 22,
  },

  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 26 },
  cardTitle: { fontSize: 28, fontWeight: '800', color: C.ink, letterSpacing: -0.6, lineHeight: 34, fontFamily: HEAVY_FONT },
  cardSubtitle: { fontSize: 14, color: C.muted, marginTop: 4, lineHeight: 20 },

  avatarWrap: { width: 46, height: 46, marginLeft: 12 },
  avatarCircle: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: C.avatarBg,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarDot: { position: 'absolute', top: 3, right: 3, width: 9, height: 9, borderRadius: 5, backgroundColor: '#4C9BF8' },

  apiErrorBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0F0', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 12, marginBottom: 14, gap: 8,
    borderLeftWidth: 3, borderLeftColor: C.errorRed,
  },
  apiErrorText: { fontSize: 12.5, color: C.errorRed, flex: 1 },

  // Inputs — one card per field
  inputWrap: { marginBottom: 13 },
  inputShadow: {
    borderRadius: 18, backgroundColor: C.white,
    shadowColor: '#1E3A8A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12,
    elevation: 2,
  },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', height: 62,
    backgroundColor: C.white, borderWidth: 1, borderRadius: 18, overflow: 'hidden',
    paddingLeft: 11, paddingRight: 6,
  },
  iconTile: {
    width: 40, height: 40, borderRadius: 11, backgroundColor: C.tile,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  iconTileActive: { backgroundColor: C.tileActive },
  inputInner: { flex: 1, height: 60 },
  floatLabel: { position: 'absolute', left: 0 },
  inputText: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    paddingTop: 18, paddingBottom: 0, paddingHorizontal: 0,
    fontSize: 15, fontWeight: '500', color: C.ink,
    includeFontPadding: false,
  },
  eyeBtn: { width: 40, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, marginLeft: 4 },
  errorText: { fontSize: 12, color: C.errorRed },

  // Button
  btn: { borderRadius: 18, marginTop: 9 },
  btnDisabled: { opacity: 0.6 },
  btnClip: { borderRadius: 18, overflow: 'hidden' },
  btnGradient: { height: 54, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
  btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 17, fontWeight: '700', color: C.white, letterSpacing: 0.2 },
  btnArrow: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: C.white,
    alignItems: 'center', justifyContent: 'center', marginLeft: 10,
  },

  // Footer
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 20 },
  footerNote: { fontSize: 12.5, color: C.muted, textAlign: 'center' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 22, gap: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.line },
  dividerText: { fontSize: 14, color: C.placeholder, fontWeight: '500' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  registerText: { fontSize: 14, color: C.muted },
  registerLink: { fontSize: 14, fontWeight: '700', color: C.link },
});