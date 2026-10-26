import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions, Animated, KeyboardAvoidingView,
  Platform, StatusBar, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { authApi } from '@/features/auth/api';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

const C = {
  navy: '#0B1736',
  navyMid: '#0F2152',
  navyLight: '#16348A',
  accent: '#2F66E8',
  accentBright: '#4C8DF7',
  blue: '#2F66E8',
  white: '#FFFFFF',
  offWhite: '#F3F6FD',
  inputBg: '#FFFFFF',
  inputBorder: '#DCE6FA',
  placeholder: '#7C90B7',
  textDim: '#6E84AE',
  errorRed: '#FF6B6B',
  successGreen: '#10B981',
};

type Step = 'EMAIL' | 'OTP' | 'PASSWORD' | 'SUCCESS';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>('EMAIL');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleSendOtp = async () => {
    if (!email.trim() || !email.includes('@')) {
      setApiError('Please enter a valid email address');
      return;
    }
    setApiError(null);
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setStep('OTP');
      setResendCooldown(60);
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.trim().length !== 6) {
      setApiError('Please enter the 6-digit code');
      return;
    }
    setApiError(null);
    setLoading(true);
    try {
      await authApi.verifyResetOtp(email.trim(), otp.trim());
      setStep('PASSWORD');
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Invalid or expired verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      setApiError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setApiError('Passwords do not match');
      return;
    }
    setApiError(null);
    setLoading(true);
    try {
      await authApi.resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      setStep('SUCCESS');
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header Gradient */}
      <LinearGradient
        colors={[C.navy, C.navyMid, C.navyLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.header}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={C.white} />
        </TouchableOpacity>

        <View style={s.headerContent}>
          <Text style={s.brandName}>TapIn HRMS</Text>
          <Text style={s.title}>
            {step === 'EMAIL' && 'Reset Password'}
            {step === 'OTP' && 'Verify Code'}
            {step === 'PASSWORD' && 'New Password'}
            {step === 'SUCCESS' && 'All Set!'}
          </Text>
          <Text style={s.subtitle}>
            {step === 'EMAIL' && 'Enter your email to receive a recovery code'}
            {step === 'OTP' && `Code sent to ${email}`}
            {step === 'PASSWORD' && 'Create a strong, secure new password'}
            {step === 'SUCCESS' && 'Your password has been reset successfully'}
          </Text>
        </View>

        <View style={s.waveWrap}>
          <Svg viewBox="0 0 400 60" width={width} height={60} preserveAspectRatio="none">
            <Path
              d="M0 20 Q100 45 200 25 T400 20 L400 60 L0 60 Z"
              fill={C.offWhite}
            />
          </Svg>
        </View>
      </LinearGradient>

      {/* Body Card */}
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        {apiError && (
          <View style={s.errorBox}>
            <Ionicons name="warning-outline" size={16} color={C.errorRed} />
            <Text style={s.errorText}>{apiError}</Text>
          </View>
        )}

        {step === 'EMAIL' && (
          <View style={s.form}>
            <Text style={s.label}>Work Email Address</Text>
            <View style={s.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={C.placeholder} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="you@company.com"
                placeholderTextColor={C.placeholder}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[s.btn, loading && s.btnDisabled]}
              onPress={handleSendOtp}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[C.accentBright, C.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.btnGradient}
              >
                {loading ? (
                  <ActivityIndicator color={C.white} />
                ) : (
                  <Text style={s.btnText}>Send Verification Code</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {step === 'OTP' && (
          <View style={s.form}>
            <Text style={s.label}>6-Digit Verification Code</Text>
            <View style={s.inputContainer}>
              <Ionicons name="key-outline" size={20} color={C.placeholder} style={s.inputIcon} />
              <TextInput
                style={[s.input, s.otpInput]}
                placeholder="123456"
                placeholderTextColor={C.placeholder}
                value={otp}
                onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
            </View>

            <View style={s.resendRow}>
              <TouchableOpacity
                onPress={() => setStep('EMAIL')}
                disabled={loading}
              >
                <Text style={s.linkText}>Change Email</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSendOtp}
                disabled={resendCooldown > 0 || loading}
              >
                <Text style={[s.linkText, resendCooldown > 0 && s.linkDisabled]}>
                  {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[s.btn, loading && s.btnDisabled]}
              onPress={handleVerifyOtp}
              disabled={loading || otp.length !== 6}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[C.accentBright, C.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.btnGradient}
              >
                {loading ? (
                  <ActivityIndicator color={C.white} />
                ) : (
                  <Text style={s.btnText}>Verify Code</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {step === 'PASSWORD' && (
          <View style={s.form}>
            <Text style={s.label}>New Password</Text>
            <View style={s.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={C.placeholder} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="At least 8 characters"
                placeholderTextColor={C.placeholder}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                autoFocus
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.placeholder} />
              </TouchableOpacity>
            </View>

            <Text style={[s.label, { marginTop: 14 }]}>Confirm Password</Text>
            <View style={s.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={C.placeholder} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="Re-enter new password"
                placeholderTextColor={C.placeholder}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
            </View>

            <TouchableOpacity
              style={[s.btn, loading && s.btnDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[C.accentBright, C.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.btnGradient}
              >
                {loading ? (
                  <ActivityIndicator color={C.white} />
                ) : (
                  <Text style={s.btnText}>Reset Password</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {step === 'SUCCESS' && (
          <View style={s.successBox}>
            <View style={s.checkCircle}>
              <Ionicons name="checkmark" size={36} color={C.white} />
            </View>
            <Text style={s.successTitle}>Password Reset Complete</Text>
            <Text style={s.successText}>
              Your account password has been updated. You can now sign in using your new credentials.
            </Text>

            <TouchableOpacity
              style={s.btn}
              onPress={() => router.replace('/(auth)/login')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[C.accentBright, C.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.btnGradient}
              >
                <Text style={s.btnText}>Proceed to Sign In</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.offWhite,
  },
  header: {
    paddingTop: 54,
    paddingHorizontal: 24,
    paddingBottom: 40,
    position: 'relative',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerContent: {
    marginBottom: 10,
  },
  brandName: {
    color: C.accentBright,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    color: C.white,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    color: C.placeholder,
    fontSize: 14,
    lineHeight: 20,
  },
  waveWrap: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
  },
  body: {
    padding: 24,
    paddingTop: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEAEA',
    borderColor: '#FFAEAE',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: C.errorRed,
    fontSize: 13,
    flex: 1,
  },
  form: {
    backgroundColor: C.white,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  label: {
    color: C.navy,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.inputBg,
    borderColor: C.inputBorder,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: C.navy,
  },
  otpInput: {
    fontSize: 22,
    letterSpacing: 6,
    fontWeight: '700',
    textAlign: 'center',
  },
  eyeBtn: {
    padding: 6,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 6,
  },
  linkText: {
    color: C.blue,
    fontSize: 13,
    fontWeight: '600',
  },
  linkDisabled: {
    color: C.placeholder,
  },
  btn: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnGradient: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: C.white,
    fontSize: 15,
    fontWeight: '700',
  },
  successBox: {
    backgroundColor: C.white,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  checkCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: C.successGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: C.successGreen,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  successTitle: {
    color: C.navy,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  successText: {
    color: C.textDim,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
});
