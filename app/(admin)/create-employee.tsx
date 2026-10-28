import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  StatusBar, TextInput, Modal, Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { employeeApi } from '@/features/employees/api';
import { ShiftProfile } from '@/features/shifts/api';
import { useShifts } from '@/hooks/useShifts';
import { useAuthStore } from '@/features/auth/store';
import { formatDateDMY, parseDMY } from '@/lib/datetime';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const C = {
  navy: '#0F1D3A',
  accent: '#5BA3F5',
  white: '#FFFFFF',
  subtle: '#8A9BB5',
  muted: '#94A3B8',
  label: '#64748B',
  bg: '#F2F4F8',
  card: '#FFFFFF',
  border: '#E8ECF4',
};

// ── Styled Input 
function StyledInput({ label, icon, value, onChangeText, placeholder, error, ...props }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={f.group}>
      <Text style={f.label}>{label}</Text>
      <View style={[f.box, focused && f.boxFocused, error && f.boxError]}>
        <Ionicons name={icon} size={16} color={focused ? C.accent : C.muted} style={f.icon} />
        <TextInput
          style={f.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor="#B8C4D0"
          {...props}
        />
      </View>
      {error && <Text style={f.error}>{error}</Text>}
    </View>
  );
}

const f = StyleSheet.create({
  group: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: C.label, marginBottom: 6, marginLeft: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  boxFocused: { borderColor: C.accent, backgroundColor: C.white, borderWidth: 1.5 },
  boxError: { borderColor: '#FECACA', borderWidth: 1.5 },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14, color: C.navy, fontWeight: '500' },
  error: { color: '#EF4444', fontSize: 11, marginTop: 4, marginLeft: 2, fontWeight: '600' },
  hint: { color: '#94A3B8', fontSize: 10.5, marginTop: 4, marginLeft: 2, fontStyle: 'italic' },
});

// ── Main Screen
export default function CreateEmployeeScreen() {
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [createdCreds, setCreatedCreds] = useState<{
    name: string;
    email: string;
    password: string;
    employeeCode: string;
  } | null>(null);
  const { shifts, loading: shiftsLoading } = useShifts();
  const { employee } = useAuthStore();
  const isSuperAdmin = employee?.role === 'SUPER_ADMIN';
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [managers, setManagers] = useState<{ id: string; name: string; designation?: string }[]>([]);
  const insets = useSafeAreaInsets();
  const bottomPad = 114 + insets.bottom + 16;

  const { control, handleSubmit, formState: { errors }, watch, setValue, setError, reset } = useForm({
    defaultValues: {
      name: '', email: '', phone: '', employeeCode: '',
      designation: '', departmentId: '', managerId: '',
      joiningDate: formatDateDMY(new Date()), role: 'EMPLOYEE', shiftProfileId: '',
    },
  });

  const watchedDepartmentId = watch('departmentId');
  const watchedDesignation = watch('designation');
  const selectedDepartment = departments.find((dept) => dept.id === watchedDepartmentId);

  useEffect(() => {
    let mounted = true;
    employeeApi
      .listDepartments()
      .then((result) => {
        if (!mounted) return;
        setDepartments(result);
      })
      .catch(() => {
        if (mounted) setApiError('Could not load departments for your account.');
      })
      .finally(() => {
        if (mounted) setDepartmentsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    employeeApi
      .list()
      .then((result) => {
        if (!mounted || !Array.isArray(result)) return;
        setManagers(
          result
            .filter((item: any) => item.isActive)
            .map((item: any) => ({
              id: item.id,
              name: item.name,
              designation: item.profile?.designation,
            }))
        );
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(async () => {
      try {
        const { employeeCode } = await employeeApi.suggestCode(
          selectedDepartment?.name,
          watchedDesignation
        );
        if (mounted) setValue('employeeCode', employeeCode);
      } catch { }
    }, 300);
    return () => { mounted = false; clearTimeout(timer); };
  }, [selectedDepartment?.name, watchedDesignation, setValue]);

  const generateTempPassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghjkmnpqrstuvwxyz';
    const digits = '23456789';
    const special = '@#!$';
    const all = upper + lower + digits + special;
    const rand = (s: string) => s[Math.floor(Math.random() * s.length)];
    const base = rand(upper) + rand(lower) + rand(digits) + rand(special);
    const rest = Array.from({ length: 6 }, () => rand(all)).join('');
    return (base + rest).split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleShare = async () => {
    if (!createdCreds) return;
    try {
      await Share.share({
        message: `Welcome to TapIn HR Portal!\n\nHere are your login credentials:\n👤 Name: ${createdCreds.name}\n🆔 Employee ID: ${createdCreds.employeeCode}\n📧 Email: ${createdCreds.email}\n🔑 Temporary Password: ${createdCreds.password}\n\nPlease sign in and update your password on your first login.`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const onSubmit = async (data: any) => {
    setLoadingSubmit(true);
    setApiError(null);
    const tempPassword = generateTempPassword();
    try {
      const joiningDate = data.joiningDate ? parseDMY(data.joiningDate) : null;
      const payload = {
        ...data,
        password: tempPassword,
        mustChangePassword: true,
        departmentId: data.departmentId || undefined,
        managerId: data.managerId || undefined,
        joiningDate: joiningDate
          ? new Date(
              Date.UTC(
                joiningDate.getFullYear(),
                joiningDate.getMonth(),
                joiningDate.getDate()
              )
            ).toISOString()
          : undefined,
      };
      const res = await employeeApi.create(payload);
      setCreatedCreds({
        name: res?.name || data.name,
        email: res?.email || data.email,
        password: tempPassword,
        employeeCode: res?.profile?.employeeCode || data.employeeCode || '—',
      });
    } catch (e: any) {
      const msg = e.response?.data?.message || '';
      if (e.response?.status === 409 && msg.toLowerCase().includes('email')) {
        setError('email', { type: 'manual', message: 'This email is already in use' });
      } else if (e.response?.status === 409 && msg.toLowerCase().includes('code')) {
        setError('employeeCode', {
          type: 'manual',
          message: 'This ID is already taken in your org. Edit the ID below to continue.',
        });
      } else {
        setApiError(msg || 'Failed to create employee');
      }
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={20} color={C.navy} />
          </TouchableOpacity>
          <View>
            <Text style={s.title}>Add New Member</Text>
            <Text style={s.subtitle}>Onboard a new teammate</Text>
          </View>
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.scrollContent, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Error banner */}
          {apiError && (
            <View style={s.errorBanner}>
              <Ionicons name="alert-circle" size={14} color="#EF4444" />
              <Text style={s.errorBannerText}>{apiError}</Text>
            </View>
          )}

          {/* ── Form card ── */}
          <View style={s.card}>
            <Text style={s.cardSection}>Basic Info</Text>

            <Controller control={control} name="name"
              rules={{ required: 'Full name is required' }}
              render={({ field: { onChange, value } }) => (
                <StyledInput label="Full Name" icon="person-outline" value={value}
                  onChangeText={onChange} placeholder="e.g. John Doe"
                  error={errors.name?.message} />
              )}
            />
            <Controller control={control} name="email"
              rules={{ required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } }}
              render={({ field: { onChange, value } }) => (
                <StyledInput label="Email Address" icon="mail-outline" value={value}
                  onChangeText={onChange} placeholder="e.g. john@company.com"
                  error={errors.email?.message} keyboardType="email-address" />
              )}
            />
            <Controller control={control} name="phone"
              rules={{ required: 'Mobile number is required', minLength: { value: 7, message: 'At least 7 digits' } }}
              render={({ field: { onChange, value } }) => (
                <StyledInput label="Mobile Number" icon="call-outline" value={value}
                  onChangeText={onChange} placeholder="e.g. +1 555-0199"
                  error={errors.phone?.message} keyboardType="phone-pad" />
              )}
            />

            <View style={s.divider} />
            <Text style={s.cardSection}>Work Profile</Text>

            <Controller control={control} name="designation"
              render={({ field: { onChange, value } }) => (
                <StyledInput label="Designation" icon="briefcase-outline" value={value}
                  onChangeText={onChange} placeholder="e.g. Software Engineer" />
              )}
            />
            <View style={f.group}>
              <View style={s.labelRow}>
                <Text style={f.label}>Department</Text>
                {departmentsLoading && <ActivityIndicator size="small" color={C.accent} />}
              </View>
              <Controller control={control} name="departmentId"
                rules={{ required: 'Select the employee department' }}
                render={({ field: { onChange, value } }) => (
                  <>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={s.shiftRow}
                    >
                      {departments.map((dept) => {
                        const active = value === dept.id;
                        return (
                          <TouchableOpacity
                            key={dept.id}
                            style={[s.shiftCard, active && s.shiftCardActive]}
                            onPress={() => onChange(dept.id)}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name="business-outline"
                              size={16}
                              color={active ? C.accent : C.muted}
                            />
                            <Text style={[s.shiftName, active && s.shiftNameActive]}>
                              {dept.name}
                            </Text>
                            <Text style={s.shiftMeta}>
                              {active ? 'Selected department' : 'Assign to this team'}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                    {departments.length === 0 && !departmentsLoading && (
                      <Text style={f.hint}>
                        No departments are available for your account. Ask the Super Admin to
                        assign you a department first.
                      </Text>
                    )}
                    {errors.departmentId && (
                      <Text style={f.error}>{String(errors.departmentId.message)}</Text>
                    )}
                  </>
                )}
              />
            </View>
            <View style={f.group}>
              <Text style={f.label}>Reports To (optional)</Text>
              <Controller control={control} name="managerId"
                render={({ field: { onChange, value } }) => (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.shiftRow}
                  >
                    <TouchableOpacity
                      style={[s.shiftCard, !value && s.shiftCardActive]}
                      onPress={() => onChange('')}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="people-outline"
                        size={16}
                        color={!value ? C.accent : C.muted}
                      />
                      <Text style={[s.shiftName, !value && s.shiftNameActive]}>No manager</Text>
                      <Text style={s.shiftMeta}>HR approves first</Text>
                    </TouchableOpacity>
                    {managers.map((manager) => {
                      const active = value === manager.id;
                      return (
                        <TouchableOpacity
                          key={manager.id}
                          style={[s.shiftCard, active && s.shiftCardActive]}
                          onPress={() => onChange(manager.id)}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name="person-outline"
                            size={16}
                            color={active ? C.accent : C.muted}
                          />
                          <Text style={[s.shiftName, active && s.shiftNameActive]}>
                            {manager.name}
                          </Text>
                          <Text style={s.shiftMeta}>
                            {manager.designation || 'Direct manager'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              />
              <Text style={f.hint}>
                Requests are approved by this manager first, then by HR.
              </Text>
            </View>
            <Controller control={control} name="employeeCode"
              rules={{
                pattern: {
                  value: /^[A-Z0-9]{2,5}-[A-Z0-9]{2,5}-\d{3}$/,
                  message: 'Format must be: DES-DEP-001 (uppercase, 3-digit number)',
                },
              }}
              render={({ field: { onChange, value } }) => (
                <View style={f.group}>
                  <Text style={f.label}>Employee ID</Text>
                  <View style={[f.box, errors.employeeCode && f.boxError]}>
                    <Ionicons name="finger-print-outline" size={16} color={errors.employeeCode ? '#EF4444' : C.muted} style={f.icon} />
                    <TextInput
                      style={f.input}
                      value={value}
                      onChangeText={(text) => onChange(text.toUpperCase())}
                      placeholder="e.g. ASE-SOF-001"
                      placeholderTextColor="#B8C4D0"
                      autoCapitalize="characters"
                    />
                  </View>
                  {errors.employeeCode ? (
                    <Text style={f.error}>{String(errors.employeeCode.message)}</Text>
                  ) : (
                    <Text style={f.hint}>Auto-generated · Format: DES-DEP-001 · You can edit this</Text>
                  )}
                </View>
              )}
            />
            <Controller control={control} name="joiningDate"
              rules={{
                validate: (v) =>
                  !v || /^\d{2}-\d{2}-\d{4}$/.test(v) || 'Use format DD-MM-YYYY',
              }}
              render={({ field: { onChange, value } }) => (
                <StyledInput label="Joining Date" icon="calendar-outline" value={value}
                  onChangeText={onChange} placeholder="DD-MM-YYYY"
                  error={errors.joiningDate?.message} />
              )}
            />

            <View style={s.divider} />
            <Text style={s.cardSection}>Permissions</Text>

            {/* Role picker */}
            <View style={f.group}>
              <Text style={f.label}>Account Level</Text>
              <Controller control={control} name="role"
                render={({ field: { onChange, value } }) => (
                  <View style={s.rolePicker}>
                    {(isSuperAdmin ? ['EMPLOYEE', 'ADMIN', 'SUPER_ADMIN'] : ['EMPLOYEE']).map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[s.rolePill, value === r && s.rolePillActive]}
                        onPress={() => onChange(r)}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.roleText, value === r && s.roleTextActive]}>
                          {r.replace('_', ' ')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
            </View>

            <View style={s.divider} />

            {/* Shift picker — company templates are Super Admin only */}
            <View style={f.group}>
              <View style={s.labelRow}>
                <Text style={f.label}>Work Schedule</Text>
                {isSuperAdmin && shiftsLoading && (
                  <ActivityIndicator size="small" color={C.accent} />
                )}
              </View>

              {!isSuperAdmin ? (
                <View style={s.inheritNote}>
                  <Ionicons name="git-branch-outline" size={16} color={C.accent} />
                  <Text style={s.inheritNoteText}>
                    The selected department&apos;s shift rule is applied automatically. No
                    employee-by-employee setup is needed.
                  </Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.shiftRow}>
                  <TouchableOpacity
                    style={[s.shiftCard, !watch('shiftProfileId') && s.shiftCardActive]}
                    onPress={() => setValue('shiftProfileId', '')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="business" size={16}
                      color={!watch('shiftProfileId') ? C.accent : C.muted} />
                    <Text style={[s.shiftName, !watch('shiftProfileId') && s.shiftNameActive]}>
                      Default
                    </Text>
                    <Text style={s.shiftMeta}>Base policy</Text>
                  </TouchableOpacity>

                  {shifts.map((shift: ShiftProfile) => {
                    const hour12 = shift.expectedCheckinHour % 12 || 12;
                    const period = shift.expectedCheckinHour >= 12 ? 'PM' : 'AM';
                    const checkin = `${hour12}:${String(shift.expectedCheckinMinute).padStart(2, '0')} ${period}`;
                    const durationH = Math.floor(shift.workMinutesPerDay / 60);
                    const durationM = shift.workMinutesPerDay % 60;
                    const active = watch('shiftProfileId') === shift.id;
                    return (
                      <TouchableOpacity
                        key={shift.id}
                        style={[s.shiftCard, active && s.shiftCardActive]}
                        onPress={() => setValue('shiftProfileId', shift.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="time" size={16} color={active ? C.accent : C.muted} />
                        <Text style={[s.shiftName, active && s.shiftNameActive]}>{shift.name}</Text>
                        <Text style={s.shiftMeta}>{checkin}  ·  {durationH}h{durationM > 0 ? ` ${durationM}m` : ''}</Text>
                      </TouchableOpacity>
                    );
                  })}

                  {shifts.length === 0 && !shiftsLoading && (
                    <View style={s.emptyShift}>
                      <Text style={s.emptyShiftText}>No custom shifts</Text>
                    </View>
                  )}
                </ScrollView>
              )}
            </View>
          </View>

          {/* ── Submit ── */}
          <TouchableOpacity
            style={s.submitBtn}
            onPress={handleSubmit(onSubmit)}
            disabled={loadingSubmit}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[C.accent, '#3B82F6']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.submitGradient}
            >
              {loadingSubmit
                ? <ActivityIndicator color={C.white} />
                : <>
                  <Text style={s.submitText}>Complete Onboarding</Text>
                  <Ionicons name="chevron-forward" size={16} color={C.white} />
                </>
              }
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Credentials Share Modal ── */}
      {createdCreds && (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={credStyles.overlay}>
            <View style={credStyles.card}>
              <View style={credStyles.iconCircle}>
                <Ionicons name="checkmark-circle" size={44} color="#10B981" />
              </View>
              <Text style={credStyles.title}>Employee Created!</Text>
              <Text style={credStyles.subtitle}>Temporary credentials generated</Text>

              <View style={credStyles.detailsBox}>
                <View style={credStyles.row}>
                  <Text style={credStyles.detailLabel}>Name</Text>
                  <Text style={credStyles.detailValue}>{createdCreds.name}</Text>
                </View>
                <View style={credStyles.row}>
                  <Text style={credStyles.detailLabel}>Email</Text>
                  <Text style={credStyles.detailValue}>{createdCreds.email}</Text>
                </View>
                <View style={credStyles.row}>
                  <Text style={credStyles.detailLabel}>Employee ID</Text>
                  <Text style={credStyles.detailValue}>{createdCreds.employeeCode}</Text>
                </View>
                <View style={[credStyles.row, { borderBottomWidth: 0 }]}>
                  <Text style={credStyles.detailLabel}>Temp Password</Text>
                  <Text style={[credStyles.detailValue, credStyles.passwordText]}>
                    {createdCreds.password}
                  </Text>
                </View>
              </View>

              <TouchableOpacity onPress={handleShare} style={credStyles.shareBtn}>
                <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
                <Text style={credStyles.shareBtnText}>Share Credentials</Text>
              </TouchableOpacity>

              <View style={credStyles.actionRow}>
                <TouchableOpacity
                  onPress={() => {
                    setCreatedCreds(null);
                    reset();
                  }}
                  style={credStyles.secondaryBtn}
                >
                  <Text style={credStyles.secondaryBtnText}>Add Another</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setCreatedCreds(null);
                    router.back();
                  }}
                  style={credStyles.primaryBtn}
                >
                  <Text style={credStyles.primaryBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: C.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  title: { fontSize: 20, fontWeight: '800', color: C.navy, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: C.muted, marginTop: 1 },

  // ── Scroll 
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },

  // ── Card 
  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 14,
  },
  cardSection: {
    fontSize: 11,
    fontWeight: '700',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.border,
    marginVertical: 16,
  },

  // ── Role picker 
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  rolePicker: {
    flexDirection: 'row',
    backgroundColor: C.bg,
    borderRadius: 12,
    padding: 4,
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  rolePill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  rolePillActive: {
    backgroundColor: C.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  roleText: { fontSize: 10, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.3 },
  roleTextActive: { color: C.accent },

  // ── Shift cards
  shiftRow: { gap: 10, paddingBottom: 2 },
  shiftCard: {
    width: 130,
    backgroundColor: C.bg,
    borderRadius: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    gap: 4,
  },
  shiftCardActive: {
    backgroundColor: C.white,
    borderColor: C.accent,
    borderWidth: 1.5,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  shiftName: { fontSize: 12, fontWeight: '700', color: C.label },
  shiftNameActive: { color: C.navy },
  shiftMeta: { fontSize: 11, color: C.muted },
  emptyShift: { padding: 16, backgroundColor: C.bg, borderRadius: 12, minWidth: 160, alignItems: 'center', justifyContent: 'center' },
  emptyShiftText: { color: C.muted, fontSize: 12 },
  inheritNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#BFDBFE',
  },
  inheritNoteText: { flex: 1, fontSize: 11.5, lineHeight: 17, color: '#1D4ED8', fontWeight: '500' },

  // ── Submit button
  submitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  submitText: { color: C.white, fontSize: 15, fontWeight: '800' },

  // ── Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FECACA',
  },
  errorBannerText: { color: '#EF4444', fontSize: 12, fontWeight: '600', flex: 1 },
});

const credStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 29, 58, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F1D3A',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 18,
  },
  detailsBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F1D3A',
  },
  passwordText: {
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  shareBtn: {
    width: '100%',
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 10,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  actionRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0F1D3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});