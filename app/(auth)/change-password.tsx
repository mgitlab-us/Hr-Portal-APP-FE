import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions, Animated, KeyboardAvoidingView,
  Platform, StatusBar,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ChangePasswordInput } from '@/types';
import { authApi } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

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
  inputBg: 'rgba(255,255,255,0.08)',
  inputBorder: 'rgba(255,255,255,0.18)',
  placeholder: 'rgba(255,255,255,0.45)',
  textDim: 'rgba(255,255,255,0.65)',
  errorRed: '#FF6B6B',
};

// ── Floating label input ───────────────────────────────────────────────────────
interface InputProps {
  label: string;
  icon: string;
  value: string;
  onChangeText: (t: string) => void;
  onBlur: () => void;
  secureTextEntry?: boolean;
  error?: string;
}

function FloatInput({
  label, icon, value, onChangeText, onBlur,
  secureTextEntry = false, error,
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
    if (!value) {
      Animated.timing(labelAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
    }
    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const labelTop = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [17, 2] });
  const labelSize = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 11] });
  const labelColor = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [C.placeholder, C.accentBright] });
  const borderColor = borderAnim.interpolate({ inputRange: [0, 1], outputRange: [C.inputBorder, C.accentBright] });

  return (
    <View style={styles.inputWrap}>
      <Animated.View style={[styles.inputBox, { borderColor }, error ? { borderColor: C.errorRed } : {}]}>
        <Ionicons name={icon as any} size={18} color={focused ? C.accentBright : C.placeholder} style={styles.inputIcon} />
        <View style={styles.inputInner}>
          <Animated.Text style={[styles.floatLabel, { top: labelTop, fontSize: labelSize, color: labelColor }]}>
            {label}
          </Animated.Text>
          <TextInput
            style={styles.inputText}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            secureTextEntry={secureTextEntry && !visible}
            autoCapitalize="none"
            placeholderTextColor="transparent"
          />
        </View>
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setVisible(v => !v)} style={styles.eyeBtn}>
            <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.placeholder} />
          </TouchableOpacity>
        )}
      </Animated.View>
      {error && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={12} color={C.errorRed} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ChangePasswordScreen() {
  const [apiError, setApiError] = useState<string | null>(null);
  const { employee, accessToken, refreshToken, setAuth } = useAuthStore();

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 700, delay: 100, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 600, delay: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<ChangePasswordInput>({
    defaultValues: { oldPassword: '', newPassword: '' },
  });

  const onSubmit = async (data: ChangePasswordInput) => {
    try {
      setApiError(null);
      await authApi.changePassword(data);
      if (employee) {
        setAuth({ ...employee, mustChangePassword: false }, accessToken!, refreshToken!);
        router.replace(employee.role === 'EMPLOYEE' ? '/(employee)/' : '/(admin)/');
      }
    } catch (e: any) {
      setApiError(e.response?.data?.message || 'Failed to update password');
    }
  };

  const isForceReset = employee?.mustChangePassword;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[C.navy, C.navyMid, C.navyLight]}
        style={styles.header}
      >
        <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}>
          <View style={styles.brandRow}>
            <View style={styles.logoBox}>
              <Ionicons name="lock-closed-outline" size={20} color={C.white} />
            </View>
            <Text style={styles.brandName}>Security</Text>
          </View>
          <Text style={styles.headerTitle}>Update Credentials</Text>
          <Text style={styles.headerSub}>Ensure your account stays protected</Text>
        </Animated.View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.cardOuter}
      >
        <Animated.View style={[styles.card, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
          <Text style={styles.cardTitle}>Set New Password</Text>
          <Text style={styles.cardSubtitle}>
            {isForceReset
              ? "You must change your initial password to continue."
              : "Update your password below."}
          </Text>

          {apiError && (
            <View style={styles.apiErrorBox}>
              <Ionicons name="warning-outline" size={14} color={C.errorRed} />
              <Text style={styles.apiErrorText}>{apiError}</Text>
            </View>
          )}

          {!isForceReset && (
            <Controller
              control={control}
              name="oldPassword"
              rules={{ required: 'Current password is required' }}
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <FloatInput
                  label="Current Password"
                  icon="key-outline"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                  error={error?.message}
                />
              )}
            />
          )}

          <Controller
            control={control}
            name="newPassword"
            rules={{
              required: 'New password is required',
              minLength: { value: 8, message: 'Must be at least 8 characters' }
            }}
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <FloatInput
                label="New Password"
                icon="shield-checkmark-outline"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                error={error?.message}
              />
            )}
          />

          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[C.accentBright, C.teal]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitBtnGradient}
            >
              {isSubmitting ? (
                <ActivityIndicator color={C.white} />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Update Password</Text>
                  <Ionicons name="checkmark-done" size={18} color={C.white} style={{ marginLeft: 6 }} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const CARD_RADIUS = 28;
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.offWhite },
  header: { paddingTop: 60, paddingHorizontal: 28, paddingBottom: 60 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  logoBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  brandName: { fontSize: 16, fontWeight: '700', color: C.white, letterSpacing: 0.5 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: C.white, letterSpacing: -0.5 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  cardOuter: { flex: 1, marginTop: -CARD_RADIUS },
  card: { flex: 1, backgroundColor: C.offWhite, borderTopLeftRadius: CARD_RADIUS, borderTopRightRadius: CARD_RADIUS, paddingHorizontal: 28, paddingTop: 32 },
  cardTitle: { fontSize: 22, fontWeight: '800', color: C.navy },
  cardSubtitle: { fontSize: 14, color: '#8A9BB5', marginTop: 4, marginBottom: 28 },
  apiErrorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0F0', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 20, gap: 8, borderLeftWidth: 3, borderLeftColor: C.errorRed },
  apiErrorText: { fontSize: 13, color: C.errorRed, flex: 1 },
  inputWrap: { marginBottom: 16 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, minHeight: 58, shadowColor: '#0F1D3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  inputIcon: { marginRight: 10, marginTop: 8 },
  inputInner: { flex: 1, paddingTop: 16 },
  floatLabel: { position: 'absolute', left: 0, color: '#A0AEC0' },
  inputText: { fontSize: 15, color: C.navy, paddingVertical: 4, fontWeight: '500' },
  eyeBtn: { padding: 6, marginTop: 8 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5, marginLeft: 2 },
  errorText: { fontSize: 12, color: C.errorRed },
  submitBtn: { marginTop: 8, borderRadius: 14, overflow: 'hidden' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: C.white },
});