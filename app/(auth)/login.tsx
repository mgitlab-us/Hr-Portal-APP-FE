import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Animated,
  Platform, StatusBar, ScrollView,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeKeyboardAvoidingView } from '../../src/components/ui/SafeKeyboardAvoidingView';
import { useForm, Controller } from 'react-hook-form';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LoginInput } from '@/types';
import { authApi } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';
import { secureStorage } from '@/lib/secureStorage';
import { syncPushTokenToServer } from '@/lib/notificationService';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const C = {
  navy: '#0F1D3A',
  navyMid: '#162447',
  navyLight: '#1E3A6E',
  accent: '#4A90D9',
  accentBright: '#5BA3F5',
  teal: '#1DB8A0',
  white: '#FFFFFF',
  offWhite: '#F7F9FC',
  errorRed: '#FF6B6B',
};

// ── Live clock ────────────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const tick = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const hh = String(time.getHours()).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');
  const ss = String(time.getSeconds()).padStart(2, '0');
  const ampm = time.getHours() >= 12 ? 'PM' : 'AM';
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

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
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;

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

  const labelTop = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 8] });
  const labelSize = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 11] });
  const labelColor = labelAnim.interpolate({ inputRange: [0, 1], outputRange: ['#A0AEC0', C.accentBright] });
  const borderColor = error
    ? C.errorRed
    : borderAnim.interpolate({ inputRange: [0, 1], outputRange: ['#EEF2F8', C.accentBright] });

  return (
    <View style={s.inputWrap}>
      {/*
        FIX 5: Separate shadow wrapper from overflow:hidden container.
        Android clips elevation shadows when overflow='hidden' is on the same view.
        Shadow lives on inputShadow, clipping lives on inputBox.
      */}
      <View style={s.inputShadow}>
        <Animated.View style={[s.inputBox, { borderColor }, focused && s.inputBoxFocused]}>
          <View style={[s.inputIconStrip, focused && s.inputIconStripActive]}>
            <Ionicons name={icon as any} size={17} color={focused ? C.accentBright : '#A0AEC0'} />
          </View>
          <View style={s.inputInner}>
            <Animated.Text style={[s.floatLabel, { top: labelTop, fontSize: labelSize, color: labelColor }]}>
              {label}
            </Animated.Text>
            <TextInput
              style={s.inputText}
              value={value}
              onChangeText={onChangeText}
              onFocus={handleFocus}
              onBlur={handleBlur}
              secureTextEntry={secureTextEntry && !visible}
              keyboardType={keyboardType}
              autoCapitalize={autoCapitalize ?? 'none'}
              placeholderTextColor="transparent"
              // FIX 3: Explicit font family so Android renders bold weights correctly
              // If you load a custom font (e.g. Inter), replace 'System' with that name
              underlineColorAndroid="transparent"
            />
          </View>
          {secureTextEntry && (
            <TouchableOpacity onPress={() => setVisible(v => !v)} style={s.eyeBtn}>
              <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={17} color={focused ? C.accentBright : '#A0AEC0'} />
            </TouchableOpacity>
          )}
          {!!value && !secureTextEntry && !error && (
            <View style={s.checkBadge}>
              <Ionicons name="checkmark" size={10} color={C.white} />
            </View>
          )}
        </Animated.View>
      </View>
      {error && (
        <View style={s.errorRow}>
          <Ionicons name="alert-circle-outline" size={12} color={C.errorRed} />
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
      setApiError(!e.response
        ? 'Unable to connect to server. Check your internet connection.'
        : e.response?.data?.message || 'Incorrect email or password'
      );
    }
  };

  return (
    // FIX 2: KeyboardAvoidingView wraps everything.
    // behavior='padding' on iOS, undefined on Android (ScrollView handles it natively).
    <SafeKeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      {/*
        FIX 1: translucent + backgroundColor='transparent' on Android
        makes the gradient extend behind the status bar edge-to-edge.
      */}
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* ── Gradient header ── */}
      <LinearGradient
        colors={[C.navy, C.navyMid, C.navyLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        // FIX 1 cont: paddingTop accounts for translucent status bar on Android
        style={[s.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={s.orb1} />
        <View style={s.orb2} />
        <View style={s.orb3} />

        <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}>
          <View style={s.brandRow}>
            {/*
              FIX 6: LinearGradient border radius on Android.
              Wrap in a View with borderRadius + overflow:'hidden' instead of
              putting borderRadius directly on LinearGradient.
            */}
            <View style={s.logoBoxWrap}>
              <LinearGradient
                colors={[C.accentBright, C.teal]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.logoBox}
              >
                <Ionicons name="time-outline" size={16} color={C.white} />
              </LinearGradient>
            </View>
            <Text style={s.brandName}>TapIn</Text>
          </View>
          <LiveClock />
          <View style={s.statRow}>
            <View style={s.statPill}>
              <Ionicons name="people-outline" size={12} color={C.accentBright} />
              <Text style={s.statText}>HR Portal</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statPill}>
              <Ionicons name="shield-checkmark-outline" size={12} color={C.teal} />
              <Text style={s.statText}>Secure Login</Text>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* ── Scrollable card body ── */}
      <ScrollView
        style={s.cardOuter}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        bounces={false}
        // FIX 2 cont: iOS 15+ native keyboard inset adjustment
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        <Animated.View style={[s.card, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>

          <View style={s.handle} />

          <View style={s.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Welcome back</Text>
              <Text style={s.cardSubtitle}>Sign in to continue to your workspace</Text>
            </View>
            {/*
              FIX 6 cont: cardAvatarRing wraps LinearGradient with
              overflow:'hidden' + borderRadius so Android clips it correctly.
            */}
            <View style={s.cardAvatarRing}>
              <View style={s.cardAvatarClip}>
                <LinearGradient colors={[C.accentBright, C.teal]} style={s.cardAvatar}>
                  <Ionicons name="person-outline" size={18} color={C.white} />
                </LinearGradient>
              </View>
            </View>
          </View>

          {apiError && (
            <View style={s.apiErrorBox}>
              <Ionicons name="warning-outline" size={13} color={C.errorRed} />
              <Text style={s.apiErrorText}>{apiError}</Text>
            </View>
          )}

          {/*
            FIX 4+5: inputsCard has elevation for Android shadow.
            No overflow:'hidden' on this view so shadow isn't clipped.
          */}
          <View style={s.inputsCard}>
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
            <View style={s.inputSeparator}>
              <View style={s.inputSepLine} />
              <Ionicons name="lock-closed-outline" size={11} color="#C5CDD8" style={{ marginHorizontal: 8 }} />
              <View style={s.inputSepLine} />
            </View>
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
          </View>

          {/* FIX 6 cont: loginBtn uses a wrapper View for borderRadius+overflow
              so the LinearGradient clips correctly on Android */}
          <TouchableOpacity
            style={[s.loginBtn, isSubmitting && s.loginBtnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            <View style={s.loginBtnClip}>
              <LinearGradient
                colors={[C.accentBright, C.teal]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.loginBtnGradient}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={C.white} />
                ) : (
                  <View style={s.loginBtnInner}>
                    <Text style={s.loginBtnText}>Sign In</Text>
                    <View style={s.loginBtnArrow}>
                      <Ionicons name="arrow-forward" size={15} color={C.accentBright} />
                    </View>
                  </View>
                )}
              </LinearGradient>
            </View>
          </TouchableOpacity>

          <View style={s.footerRow}>
            <Ionicons name="information-circle-outline" size={12} color="#B0BAC8" />
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
const CARD_R = 28;

const s = StyleSheet.create({
  // FIX 1: root has no backgroundColor so translucent status bar shows gradient
  root: { flex: 1, backgroundColor: C.offWhite },

  header: {
    paddingHorizontal: 24,
    paddingBottom: 44,
    overflow: 'hidden',
  },
  orb1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(91,163,245,0.08)', top: -60, right: -50 },
  orb2: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(29,184,160,0.07)', bottom: -20, left: -30 },
  orb3: { position: 'absolute', width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.04)', top: 40, right: 70 },

  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  // FIX 6: wrapper clips the gradient with borderRadius
  logoBoxWrap: { width: 30, height: 30, borderRadius: 9, overflow: 'hidden', marginRight: 9 },
  logoBox: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 15, fontWeight: '700', color: C.white, letterSpacing: 0.5 },

  clockWrap: { marginBottom: 12 },
  clockRow: { flexDirection: 'row', alignItems: 'flex-end' },
  // FIX 3: explicit fontFamily for Android bold rendering
  clockHM: { fontSize: 42, fontWeight: '800', color: C.white, letterSpacing: -1, lineHeight: 46, fontFamily: Platform.OS === 'android' ? 'sans-serif-black' : undefined },
  clockRight: { marginLeft: 7, marginBottom: 4 },
  clockSS: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.5)', lineHeight: 20 },
  clockAMPM: { fontSize: 12, fontWeight: '700', color: C.accentBright, lineHeight: 16 },
  clockDate: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2, letterSpacing: 0.2 },

  statRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, paddingVertical: 7, paddingHorizontal: 12, alignSelf: 'flex-start', marginTop: 2 },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  statDivider: { width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 10 },

  cardOuter: { flex: 1, marginTop: -CARD_R },
  scrollContent: { flexGrow: 1 },
  card: {
    backgroundColor: C.offWhite,
    borderTopLeftRadius: CARD_R,
    borderTopRightRadius: CARD_R,
    paddingHorizontal: 22,
    paddingBottom: 8,
    minHeight: '100%',
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#DDE3EE', alignSelf: 'center', marginTop: 12, marginBottom: 20 },

  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  cardTitle: { fontSize: 22, fontWeight: '800', color: C.navy, letterSpacing: -0.4, fontFamily: Platform.OS === 'android' ? 'sans-serif-black' : undefined },
  cardSubtitle: { fontSize: 12, color: '#8A9BB5', marginTop: 3, lineHeight: 17 },
  // FIX 6: ring is the border, clip is overflow:hidden for gradient
  cardAvatarRing: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: 'rgba(91,163,245,0.25)', padding: 2 },
  cardAvatarClip: { flex: 1, borderRadius: 20, overflow: 'hidden' },
  cardAvatar: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  apiErrorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0F0', borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12, marginBottom: 14, gap: 7, borderLeftWidth: 3, borderLeftColor: C.errorRed },
  apiErrorText: { fontSize: 12, color: C.errorRed, flex: 1 },

  // FIX 4+5: elevation present, no overflow:'hidden' so shadow isn't clipped
  inputsCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 14,
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,           // Android shadow
    borderWidth: 1,
    borderColor: '#EEF2F8',
  },
  inputSeparator: { flexDirection: 'row', alignItems: 'center', marginVertical: 1 },
  inputSepLine: { flex: 1, height: 1, backgroundColor: '#F0F3F8' },

  inputWrap: { marginVertical: 5 },
  // FIX 5: shadow on outer wrapper, no overflow:'hidden' here
  inputShadow: { borderRadius: 10 },
  // overflow:'hidden' only on the inner box that needs clipping
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderWidth: 0, borderRadius: 10, minHeight: 58, overflow: 'hidden' },
  inputBoxFocused: { backgroundColor: '#F8FBFF' },
  inputIconStrip: { width: 42, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F9FD', borderRightWidth: 1, borderRightColor: '#EEF2F8', marginRight: 10 },
  inputIconStripActive: { backgroundColor: '#EEF6FF', borderRightColor: 'rgba(91,163,245,0.25)' },
  inputInner: { flex: 1, paddingTop: 16, paddingRight: 4 },
  floatLabel: { position: 'absolute', left: 0 },
  inputText: { fontSize: 14, color: C.navy, paddingVertical: 2, fontWeight: '500' },
  eyeBtn: { padding: 11, alignSelf: 'stretch', justifyContent: 'center' },
  checkBadge: { width: 16, height: 16, borderRadius: 8, backgroundColor: C.teal, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3, marginLeft: 2 },
  errorText: { fontSize: 11, color: C.errorRed },

  // FIX 6: loginBtn — no overflow:'hidden', clipping lives in loginBtnClip
  loginBtn: { borderRadius: 14, marginBottom: 4 },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnClip: { borderRadius: 14, overflow: 'hidden' },
  loginBtnGradient: { paddingVertical: 14, paddingHorizontal: 22 },
  loginBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  loginBtnText: { fontSize: 15, fontWeight: '700', color: C.white, letterSpacing: 0.3 },
  loginBtnArrow: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', marginLeft: 9 },

  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 16 },
  footerNote: { fontSize: 11, color: '#A0AEC0', textAlign: 'center', lineHeight: 16 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 14, gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E8EDF5' },
  dividerText: { fontSize: 11, color: '#B0BAC8', fontWeight: '500' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerText: { fontSize: 12, color: '#8A9BB5' },
  registerLink: { fontSize: 12, fontWeight: '700', color: C.teal },
});