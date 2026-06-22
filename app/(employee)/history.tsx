import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StatusBar, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { attendanceApi } from '@/features/attendance/api';
import { reportsApi } from '@/features/reports/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { format, parseISO } from 'date-fns';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

export default function HistoryScreen() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [reportUri, setReportUri] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ISSUES'>('ALL');
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const ensureShareableFileUri = async (uri: string) => {
    if (uri.startsWith('file://')) return uri;
    if (uri.startsWith('content://')) {
      const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
      if (!baseDir) throw new Error('No writable directory available for sharing.');
      const targetUri = `${baseDir}my-report-${currentYear}-${currentMonth}-${Date.now()}.pdf`;
      await FileSystem.copyAsync({ from: uri, to: targetUri });
      return targetUri;
    }
    throw new Error(`Unsupported URI scheme for sharing: ${uri}`);
  };

  const loadData = useCallback(async () => {
    try {
      const data = await attendanceApi.getHistory();
      setHistory(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDownloadReport = async () => {
    setDownloadingReport(true);
    setReportUri(null);
    try {
      const uri = await reportsApi.downloadMyMonthlyPDF(currentYear, currentMonth);
      setReportUri(uri);
    } catch (e) {
      console.error(e);
      Alert.alert('Download failed', 'Could not download your monthly PDF right now.');
    } finally {
      setDownloadingReport(false);
    }
  };

  const handleOpenReport = async () => {
    if (!reportUri) return;
    try {
      const shareableUri = await ensureShareableFileUri(reportUri);
      await Sharing.shareAsync(shareableUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'My Monthly Attendance PDF',
        UTI: 'com.adobe.pdf',
      });
    } catch (e) {
      console.error(e);
      Alert.alert('Open failed', 'Could not open the downloaded PDF.');
    }
  };

  const issueCount = useMemo(
    () => history.filter((item) => !item.checkoutTime || (item.dailySummary?.lateMinutes ?? 0) > 0).length,
    [history]
  );

  const visibleHistory = useMemo(() => {
    if (activeFilter === 'ISSUES') {
      return history.filter((item) => !item.checkoutTime || (item.dailySummary?.lateMinutes ?? 0) > 0);
    }
    return history;
  }, [activeFilter, history]);

  const renderItem = ({ item }: { item: any }) => {
    const hasIssue = !item.checkoutTime || item.dailySummary?.lateMinutes > 0;
    const isComplete = item.status === 'COMPLETE';

    return (
      <View
        className="bg-white rounded-2xl border border-[#E5E9F2] p-3.5 mb-2.5"
      >
        {/* Card header */}
        <View className="flex-row justify-between items-center mb-3.5">
          <Text className="text-[13px] font-semibold text-[#1C2840]">
            {format(parseISO(item.date), 'EEEE, MMM dd')}
          </Text>
          <View className={`px-2 py-0.5 rounded-md ${isComplete ? 'bg-[#E0F7F1]' : 'bg-[#FEF6E4]'}`}>
            <Text className={`text-[10px] font-semibold uppercase tracking-wide ${isComplete ? 'text-[#0D9E7A]' : 'text-[#D97706]'}`}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* Time row */}
        <View className="flex-row items-center justify-between bg-[#F3F4F8] rounded-xl border border-[#E5E9F2] py-3 px-4 mb-3">
          <View className="items-center">
            <Text className="text-[9px] font-semibold text-[#B0BCCF] uppercase tracking-wide mb-1">CHECK-IN</Text>
            <Text className="text-[15px] font-semibold text-[#1C2840] -tracking-wide">
              {format(parseISO(item.checkinTime), 'hh:mm a')}
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color="#E5E9F2" />
          <View className="items-center">
            <Text className="text-[9px] font-semibold text-[#B0BCCF] uppercase tracking-wide mb-1">CHECK-OUT</Text>
            <Text className="text-[15px] font-semibold text-[#1C2840] -tracking-wide">
              {item.checkoutTime ? format(parseISO(item.checkoutTime), 'hh:mm a') : 'Missed'}
            </Text>
          </View>
        </View>

        {/* Footer */}
        {item.dailySummary && (
          <View className="flex-row items-center pt-2.5 border-t border-[#F0F3FA]">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="time-outline" size={14} color="#96A0B5" />
              <Text className="text-xs font-medium text-[#96A0B5]">
                {Math.floor(item.dailySummary.totalWorkMinutes / 60)}h {item.dailySummary.totalWorkMinutes % 60}m worked
              </Text>
            </View>
            {item.dailySummary.lateMinutes > 0 && (
              <View className="flex-row items-center gap-1.5 ml-auto">
                <Ionicons name="alert-circle" size={14} color="#E8405A" />
                <Text className="text-xs font-medium text-[#E8405A]">
                  {item.dailySummary.lateMinutes >= 60
                    ? `${Math.floor(item.dailySummary.lateMinutes / 60)}h ${item.dailySummary.lateMinutes % 60}m late`
                    : `${item.dailySummary.lateMinutes}m late`}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Correction action */}
        {hasIssue && (
          <TouchableOpacity
            className="flex-row justify-between items-center mt-2.5 bg-[#F3F4F8] py-2 px-3 rounded-lg border border-[#E5E9F2]"
            activeOpacity={0.7}
            onPress={() => router.push({
              pathname: '/(employee)/request-correction',
              params: {
                recordId: item.id,
                date: item.date,
                checkinTime: item.checkinTime,
                checkoutTime: item.checkoutTime ?? '',
              }
            })}
          >
            <Text className="text-xs font-medium text-[#96A0B5]">Something wrong?</Text>
            <Text className="text-xs font-semibold text-[#5B6EF5]">Request Correction →</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F3F4F8]">
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View className="px-[18px] pt-2 pb-5">
        <Text className="text-[10px] text-black/30 uppercase tracking-widest mb-0.5">Employee</Text>
        <Text className="text-[22px] font-semibold text-[#050505] -tracking-wide">Attendance History</Text>
        <Text className="text-[11px] text-black/30 mt-0.5">Review logs and request corrections</Text>
      </View>

      {/* STATS */}
      <View className="flex-row gap-2 mx-4 mt-4 mb-2.5">
        <View className="flex-1 bg-white rounded-xl border border-[#E5E9F2] py-3 px-3.5">
          <Text className="text-[9px] font-semibold text-[#96A0B5] uppercase tracking-wide mb-1">Total Logs</Text>
          <Text className="text-2xl font-semibold text-[#1C2840] -tracking-wide">{history.length}</Text>
        </View>
        <View className="flex-1 bg-white rounded-xl border border-[#E5E9F2] py-3 px-3.5">
          <Text className="text-[9px] font-semibold text-[#96A0B5] uppercase tracking-wide mb-1">Needs Review</Text>
          <Text className={`text-2xl font-semibold -tracking-wide ${issueCount > 0 ? 'text-[#D97706]' : 'text-[#1C2840]'}`}>
            {issueCount}
          </Text>
        </View>
      </View>

      {/* REPORT CARD */}
      <View className="mx-4 mb-2.5 bg-white rounded-xl border border-[#E5E9F2] py-[11px] px-[13px] flex-row items-center justify-between gap-2.5">
        <View className="flex-row items-center gap-2.5 flex-1">
          <View className="w-[30px] h-[30px] rounded-lg bg-[#ECEFFE] items-center justify-center">
            <Ionicons name="document-text-outline" size={15} color="#5B6EF5" />
          </View>
          <Text className="text-xs font-medium text-[#1C2840]">
            Monthly PDF · {format(new Date(currentYear, currentMonth - 1, 1), 'MMM yyyy')}
          </Text>
        </View>
        <TouchableOpacity
          className="bg-[#0B0F17] rounded-lg px-3 py-2 flex-row items-center gap-1.5"
          onPress={reportUri ? handleOpenReport : handleDownloadReport}
          disabled={downloadingReport}
          activeOpacity={0.7}
        >
          {downloadingReport ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name={reportUri ? 'open-outline' : 'download-outline'} size={14} color="#fff" />
              <Text className="text-white text-xs font-medium">{reportUri ? 'Open PDF' : 'Download'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* FILTERS */}
      <View className="flex-row gap-1.5 mx-4 mb-3">
        <TouchableOpacity
          className={`px-[13px] py-2 rounded-lg border ${activeFilter === 'ALL' ? 'bg-[#0B0F17] border-[#0B0F17]' : 'bg-white border-[#E5E9F2]'}`}
          onPress={() => setActiveFilter('ALL')}
          activeOpacity={0.7}
        >
          <Text className={`text-xs font-medium ${activeFilter === 'ALL' ? 'text-white' : 'text-[#96A0B5]'}`}>
            All Records
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`px-[13px] py-2 rounded-lg border ${activeFilter === 'ISSUES' ? 'bg-[#0B0F17] border-[#0B0F17]' : 'bg-white border-[#E5E9F2]'}`}
          onPress={() => setActiveFilter('ISSUES')}
          activeOpacity={0.7}
        >
          <Text className={`text-xs font-medium ${activeFilter === 'ISSUES' ? 'text-white' : 'text-[#96A0B5]'}`}>
            Needs Review
          </Text>
        </TouchableOpacity>
      </View>

      {/* LIST */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#3D52D5" size="large" />
        </View>
      ) : (
        <FlatList
          data={visibleHistory}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3D52D5" />
          }
          ListEmptyComponent={
            <View className="items-center mt-20 gap-2">
              <Ionicons name="calendar-outline" size={36} color="#E5E9F2" />
              <Text className="text-[13px] font-medium text-[#96A0B5] text-center">
                {activeFilter === 'ISSUES' ? 'No records need review.' : 'No logs found yet.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}