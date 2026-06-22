import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/features/auth/store';
import { secureStorage } from '@/lib/secureStorage';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePersonalStats } from '@/features/attendance/hooks';

const { width: SCREEN_W } = Dimensions.get('window');

function ProfileRow({ icon, label, value, color = '#0B0F17' }: any) {
  return (
    <View className="flex-row items-center py-3">
      <View className="w-10 h-10 rounded-xl justify-center items-center mr-4" style={{ backgroundColor: `${color}10` }}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View className="flex-1">
        <Text className="text-[11px] font-semibold text-[#96A0B5] mb-0.5">{label}</Text>
        <Text className="text-[15px] font-bold text-[#0B0F17]">{value}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { employee, clearAuth } = useAuthStore();
  const { data: stats, isLoading } = usePersonalStats();

  const handleLogout = async () => {
    await secureStorage.removeTokens();
    clearAuth();
    router.replace('/(auth)/login');
  };

  return (
    <View className="flex-1 bg-[#F3F4F8]">
      <StatusBar barStyle="light-content" />
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient colors={['#0B0F17', '#1E293B']} style={{ paddingBottom: 120, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
          <SafeAreaView>
            <View className="items-center pt-5">
              <View className="relative mb-4">
                <LinearGradient
                  colors={['#5B6EF5', '#0D9E7A']}
                  style={{ width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: 'rgba(255,255,255,0.2)' }}
                >
                  <Text className="text-[40px] font-extrabold text-white">
                    {employee?.name ? employee.name[0].toUpperCase() : 'U'}
                  </Text>
                </LinearGradient>
                <TouchableOpacity
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full justify-center items-center border-[3px] border-[#0B0F17]"
                  style={{ backgroundColor: '#5B6EF5' }}
                  onPress={() => Alert.alert('Coming Soon', 'Profile picture editing will be available in a future update.')}
                >
                  <Ionicons name="camera" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
              <Text className="text-2xl font-extrabold text-white mb-1">{employee?.name}</Text>
              <Text className="text-sm font-medium text-white/70">{employee?.role} • {employee?.department || 'Operations'}</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Content */}
        <View className="px-6 pb-28">

          {/* Stats */}
          <View className="flex-row bg-white rounded-3xl p-5 -mt-8 shadow-lg items-center" style={{ elevation: 8, shadowColor: '#0B0F17', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 }}>
            <View className="flex-1 items-center">
              <Text className="text-lg font-extrabold text-[#0B0F17]">{isLoading ? '...' : `${stats?.onTimeRate}%`}</Text>
              <Text className="text-[11px] font-semibold text-[#96A0B5] mt-1">On-Time</Text>
            </View>
            <View className="w-px h-8 bg-[#F1F5F9]" />
            <View className="flex-1 items-center">
              <Text className="text-lg font-extrabold text-[#0B0F17]">{isLoading ? '...' : stats?.leavesTaken}</Text>
              <Text className="text-[11px] font-semibold text-[#96A0B5] mt-1">Leaves</Text>
            </View>
            <View className="w-px h-8 bg-[#F1F5F9]" />
            <View className="flex-1 items-center">
              <Text className="text-lg font-extrabold text-[#0B0F17]">{isLoading ? '...' : `${stats?.avgWorkHours}h`}</Text>
              <Text className="text-[11px] font-semibold text-[#96A0B5] mt-1">Avg Work</Text>
            </View>
          </View>

          {/* Account Details */}
          <View className="mt-8">
            <Text className="text-base font-bold text-[#0B0F17] mb-3 pl-1">Account Details</Text>
            <View className="bg-white rounded-2xl p-4 border border-[#F1F5F9]">
              <ProfileRow icon="mail-outline" label="Official Email" value={employee?.email} color="#5B6EF5" />
              <View className="h-px bg-[#F3F4F8] my-1" />
              <ProfileRow icon="finger-print-outline" label="Employee ID" value={employee?.employeeCode || 'EMP-001'} color="#0D9E7A" />
              <View className="h-px bg-[#F3F4F8] my-1" />
              <ProfileRow icon="briefcase-outline" label="Designation" value={employee?.designation || 'Software Engineer'} color="#7C5CBF" />
            </View>
          </View>

          {/* Preferences */}
          <View className="mt-8">
            <Text className="text-base font-bold text-[#0B0F17] mb-3 pl-1">Preferences</Text>
            <View className="bg-white rounded-2xl p-4 border border-[#F1F5F9]">
              <TouchableOpacity
                className="flex-row items-center py-3 gap-3.5"
                onPress={() => Alert.alert('Coming Soon', 'Notification settings will be available soon.')}
              >
                <Ionicons name="notifications-outline" size={20} color="#0B0F17" />
                <Text className="text-[15px] font-semibold text-[#0B0F17]">Notifications</Text>
                <Ionicons name="chevron-forward" size={18} color="#96A0B5" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
              <View className="h-px bg-[#F3F4F8] my-1" />
              <TouchableOpacity
                className="flex-row items-center py-3 gap-3.5"
                onPress={() => Alert.alert('Coming Soon', 'Privacy controls will be available in the next version.')}
              >
                <Ionicons name="shield-checkmark-outline" size={20} color="#0B0F17" />
                <Text className="text-[15px] font-semibold text-[#0B0F17]">Privacy & Security</Text>
                <Ionicons name="chevron-forward" size={18} color="#96A0B5" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Logout */}
          <TouchableOpacity className="mt-10" onPress={handleLogout}>
            <View className="flex-row items-center justify-center p-4 rounded-[18px] gap-2.5 bg-[#FFF1F1] border border-[#FFE4E4]">
              <Ionicons name="log-out-outline" size={20} color="#E8405A" />
              <Text className="text-[#E8405A] text-base font-bold">Sign Out from TapIn</Text>
            </View>
          </TouchableOpacity>

          <Text className="text-center mt-6 text-[#CBD5E1] text-[11px] font-medium">
            TapIn v1.0.0 • Build 2026.05
          </Text>

        </View>
      </ScrollView>
    </View>
  );
}