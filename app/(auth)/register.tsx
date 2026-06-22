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
import { authApi } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';
import { secureStorage } from '@/lib/secureStorage';
import { router } from 'expo-router';
import { TimezoneSelector } from '@/components/ui/TimezoneSelector';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── Design tokens ─────────────────────────────────────────────────────────────
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

// ── Step config ───────────────────────────────────────────────────────────────
const STEPS = [
  {
    key: 'company',
    title: 'Your Organization',
    subtitle: 'Tell us about your company',
    icon: 'business-outline',
    fields: ['companyName', 'timezone'],
  },
  {
    key: 'admin',
    title: 'Admin Account',
    subtitle: 'You will manage everything from here',
    icon: 'person-circle-outline',
    fields: ['adminName', 'adminEmail', 'adminPassword'],
  },
];

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

// ── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={s.stepRow}>
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={i}>
            <View style={[
              s.stepDot,
              done && s.stepDotDone,
              active && s.stepDotActive,
            ]}>
              {done
                ? <Ionicons name="checkmark" size={10} color={C.white} />
                : <Text style={[s.stepDotText, active && { color: C.white }]}>{i + 1}</Text>
              }
            </View>
            {i < total - 1 && (
              <View style={[s.stepLine, done && s.stepLineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function RegisterScreen() {
  const [step, setStep] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const insets = useSafeAreaInsets();

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const stepAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 600, delay: 100, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 500, delay: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  const animateStep = () => {
    stepAnim.setValue(20);
    Animated.timing(stepAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
  };

  const { control, handleSubmit, trigger, formState: { isSubmitting }, setError } = useForm<any>({
    defaultValues: { companyName: '', timezone: 'Asia/Karachi', adminName: '', adminEmail: '', adminPassword: '' },
  });

  const handleNext = async () => {
    const fields = STEPS[step].fields as any[];
    const valid = await trigger(fields);
    if (valid) {
      animateStep();
      setStep(1);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      setApiError(null);
      const res = await authApi.registerCompany(data);
      await secureStorage.setTokens(res.accessToken, res.refreshToken);
      setAuth(res.employee, res.accessToken, res.refreshToken);
      router.replace('/(admin)/');
    } catch (e: any) {
      const msg = e.response?.data?.message || '';
      if (e.response?.status === 409 && msg.toLowerCase().includes('email')) {
        setError('adminEmail', { type: 'manual', message: 'This work email is already registered' });
        // Also scroll or focus? React Hook Form handle focus automatically usually
      } else {
        setApiError(!e.response
          ? 'Unable to connect to server. Check your internet connection.'
          : msg || 'Failed to register. Please try again.'
        );
      }
    }
  };

  const currentStep = STEPS[step];

  return (
    <SafeKeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
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
        style={[s.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={s.orb1} />
        <View style={s.orb2} />
        <View style={s.orb3} />

        <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}>
          <View style={s.brandRow}>
            <View style={s.logoBoxWrap}>
              <LinearGradient colors={[C.accentBright, C.teal]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.logoBox}>
                <Ionicons name="time-outline" size={16} color={C.white} />
              </LinearGradient>
            </View>
            <Text style={s.brandName}>TapIn</Text>
          </View>

          <Text style={s.heroText}>Set up your{'\n'}workspace.</Text>
          <Text style={s.tagline}>Ready in under 2 minutes.</Text>

          <View style={s.statRow}>
            <View style={s.statPill}>
              <Ionicons name={currentStep.icon as any} size={12} color={C.accentBright} />
              <Text style={s.statText}>{currentStep.subtitle}</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statPill}>
              <Ionicons name="shield-checkmark-outline" size={12} color={C.teal} />
              <Text style={s.statText}>Step {step + 1} of {STEPS.length}</Text>
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
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        <Animated.View style={[s.card, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>

          <View style={s.handle} />

          <View style={s.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{currentStep.title}</Text>
              <Text style={s.cardSubtitle}>{currentStep.subtitle}</Text>
            </View>
            <View style={s.cardAvatarRing}>
              <View style={s.cardAvatarClip}>
                <LinearGradient colors={[C.accentBright, C.teal]} style={s.cardAvatar}>
                  <Ionicons name={currentStep.icon as any} size={18} color={C.white} />
                </LinearGradient>
              </View>
            </View>
          </View>

          <StepIndicator current={step} total={STEPS.length} />

          {apiError && (
            <View style={s.apiErrorBox}>
              <Ionicons name="warning-outline" size={13} color={C.errorRed} />
              <Text style={s.apiErrorText}>{apiError}</Text>
            </View>
          )}

          <Animated.View style={[s.inputsCard, { transform: [{ translateY: stepAnim }] }]}>
            {step === 0 && (
              <>
                <Controller
                  control={control}
                  name="companyName"
                  rules={{ required: 'Company name is required' }}
                  render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                    <FloatInput label="Company Name" icon="business-outline" value={value} onChangeText={onChange} onBlur={onBlur} autoCapitalize="words" error={error?.message} />
                  )}
                />
                <View style={s.inputSeparator}>
                  <View style={s.inputSepLine} />
                  <Ionicons name="globe-outline" size={11} color="#C5CDD8" style={{ marginHorizontal: 8 }} />
                  <View style={s.inputSepLine} />
                </View>
                <Controller
                  control={control}
                  name="timezone"
                  rules={{ required: 'Timezone is required' }}
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <TimezoneSelector
                      value={value}
                      onChange={onChange}
                      error={error?.message}
                      label="Company Timezone"
                    />
                  )}
                />
              </>
            )}

            {step === 1 && (
              <>
                <Controller
                  control={control}
                  name="adminName"
                  rules={{ required: 'Your name is required' }}
                  render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                    <FloatInput label="Full Name" icon="person-outline" value={value} onChangeText={onChange} onBlur={onBlur} autoCapitalize="words" error={error?.message} />
                  )}
                />
                <View style={s.inputSeparator}>
                  <View style={s.inputSepLine} />
                  <Ionicons name="mail-outline" size={11} color="#C5CDD8" style={{ marginHorizontal: 8 }} />
                  <View style={s.inputSepLine} />
                </View>
                <Controller
                  control={control}
                  name="adminEmail"
                  rules={{
                    required: 'Email is required',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' }
                  }}
                  render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                    <FloatInput label="Work Email Address" icon="mail-outline" value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="email-address" error={error?.message} />
                  )}
                />
                <View style={s.inputSeparator}>
                  <View style={s.inputSepLine} />
                  <Ionicons name="lock-closed-outline" size={11} color="#C5CDD8" style={{ marginHorizontal: 8 }} />
                  <View style={s.inputSepLine} />
                </View>
                <Controller
                  control={control}
                  name="adminPassword"
                  rules={{
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Minimum 8 characters' },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
                      message: 'Needs 1 uppercase, 1 lowercase & 1 number'
                    }
                  }}
                  render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                    <FloatInput label="Secure Password" icon="lock-closed-outline" value={value} onChangeText={onChange} onBlur={onBlur} secureTextEntry error={error?.message} />
                  )}
                />
              </>
            )}
          </Animated.View>

          {step === 0 ? (
            <TouchableOpacity style={s.loginBtn} onPress={handleNext} activeOpacity={0.85}>
              <View style={s.loginBtnClip}>
                <LinearGradient colors={[C.accentBright, C.teal]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.loginBtnGradient}>
                  <View style={s.loginBtnInner}>
                    <Text style={s.loginBtnText}>Continue</Text>
                    <View style={s.loginBtnArrow}>
                      <Ionicons name="arrow-forward" size={15} color={C.accentBright} />
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.loginBtn, isSubmitting && s.loginBtnDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <View style={s.loginBtnClip}>
                <LinearGradient colors={[C.accentBright, C.teal]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.loginBtnGradient}>
                  {isSubmitting ? (
                    <ActivityIndicator color={C.white} />
                  ) : (
                    <View style={s.loginBtnInner}>
                      <Text style={s.loginBtnText}>Create Organization</Text>
                      <View style={s.loginBtnArrow}>
                        <Ionicons name="checkmark" size={15} color={C.accentBright} />
                      </View>
                    </View>
                  )}
                </LinearGradient>
              </View>
            </TouchableOpacity>
          )}

          {step === 1 && (
            <TouchableOpacity onPress={() => { animateStep(); setStep(0); }} style={s.backLinkRow} activeOpacity={0.7}>
              <Ionicons name="arrow-back-outline" size={12} color="#8A9BB5" />
              <Text style={s.backLinkText}>Back to company details</Text>
            </TouchableOpacity>
          )}

          <View style={s.footerRow}>
            <Ionicons name="information-circle-outline" size={12} color="#B0BAC8" />
            <Text style={s.footerNote}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={s.registerLink}>Sign in →</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </ScrollView>
    </SafeKeyboardAvoidingView>
  );
}

const CARD_R = 28;
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.offWhite },
  header: { paddingHorizontal: 24, paddingBottom: 44, overflow: 'hidden' },
  orb1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(91,163,245,0.08)', top: -60, right: -50 },
  orb2: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(29,184,160,0.07)', bottom: -20, left: -30 },
  orb3: { position: 'absolute', width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.04)', top: 40, right: 70 },
  gridLines: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.03)' },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  logoBoxWrap: { width: 30, height: 30, borderRadius: 9, overflow: 'hidden', marginRight: 9 },
  logoBox: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 15, fontWeight: '700', color: C.white, letterSpacing: 0.5 },
  heroText: { fontSize: 32, fontWeight: '800', color: C.white, letterSpacing: -0.8, lineHeight: 36, marginBottom: 4, fontFamily: Platform.OS === 'android' ? 'sans-serif-black' : undefined },
  tagline: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 16 },
  statRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, paddingVertical: 7, paddingHorizontal: 12, alignSelf: 'flex-start' },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  statDivider: { width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 10 },
  cardOuter: { flex: 1, marginTop: -CARD_R },
  scrollContent: { flexGrow: 1 },
  card: { backgroundColor: C.offWhite, borderTopLeftRadius: CARD_R, borderTopRightRadius: CARD_R, paddingHorizontal: 22, paddingBottom: 8, minHeight: '100%' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#DDE3EE', alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  cardTitle: { fontSize: 22, fontWeight: '800', color: C.navy, letterSpacing: -0.4, fontFamily: Platform.OS === 'android' ? 'sans-serif-black' : undefined },
  cardSubtitle: { fontSize: 12, color: '#8A9BB5', marginTop: 3, lineHeight: 17 },
  cardAvatarRing: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: 'rgba(91,163,245,0.25)', padding: 2 },
  cardAvatarClip: { flex: 1, borderRadius: 20, overflow: 'hidden' },
  cardAvatar: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#EEF2F8', borderWidth: 1.5, borderColor: '#D8E0EC', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: C.accentBright, borderColor: C.accentBright },
  stepDotDone: { backgroundColor: C.teal, borderColor: C.teal },
  stepDotText: { fontSize: 10, fontWeight: '700', color: '#A0AEC0' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#EEF2F8', marginHorizontal: 6 },
  stepLineDone: { backgroundColor: C.teal },
  apiErrorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0F0', borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12, marginBottom: 14, gap: 7, borderLeftWidth: 3, borderLeftColor: C.errorRed },
  apiErrorText: { fontSize: 12, color: C.errorRed, flex: 1 },
  inputsCard: { backgroundColor: C.white, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 14, shadowColor: C.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: '#EEF2F8' },
  inputSeparator: { flexDirection: 'row', alignItems: 'center', marginVertical: 1 },
  inputSepLine: { flex: 1, height: 1, backgroundColor: '#F0F3F8' },
  inputWrap: { marginVertical: 5 },
  inputShadow: { borderRadius: 10 },
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
  loginBtn: { borderRadius: 14, marginBottom: 4 },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnClip: { borderRadius: 14, overflow: 'hidden' },
  loginBtnGradient: { paddingVertical: 14, paddingHorizontal: 22 },
  loginBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  loginBtnText: { fontSize: 15, fontWeight: '700', color: C.white, letterSpacing: 0.3 },
  loginBtnArrow: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', marginLeft: 9 },
  backLinkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 12, marginBottom: 4 },
  backLinkText: { fontSize: 12, color: '#8A9BB5' },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 16 },
  footerNote: { fontSize: 11, color: '#A0AEC0' },
  registerLink: { fontSize: 12, fontWeight: '700', color: C.teal },
});