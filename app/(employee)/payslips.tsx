import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Payslip, salaryApi } from '@/features/salary/api';
import { formatDateDMY } from '@/lib/datetime';

const money = (value: number | null | undefined) =>
  `PKR ${Number(value ?? 0).toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const monthLabel = (month: number, year: number) =>
  formatDateDMY(new Date(year, month - 1, 1), 'MMMM yyyy');

const COMPONENTS: Array<{ key: keyof Payslip; label: string; deduction?: boolean }> = [
  { key: 'baseSalary', label: 'Basic salary' },
  { key: 'houseRentAllowance', label: 'House rent allowance' },
  { key: 'transportAllowance', label: 'Transport allowance' },
  { key: 'medicalAllowance', label: 'Medical allowance' },
  { key: 'otherAllowance', label: 'Other allowances' },
  { key: 'taxDeduction', label: 'Income tax', deduction: true },
  { key: 'otherDeduction', label: 'Other deductions', deduction: true },
];

export default function PayslipsScreen() {
  const [payments, setPayments] = useState<Payslip[]>([]);
  const [ytd, setYtd] = useState({ gross: 0, deductions: 0, net: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'error' | 'success'; message: string } | null>(
    null
  );

  const load = useCallback(async () => {
    try {
      const result = await salaryApi.listMine();
      setPayments(result.payments || []);
      setYtd(result.ytd || { gross: 0, deductions: 0, net: 0 });
    } catch (error) {
      console.error(error);
      setNotice({ tone: 'error', message: 'Could not load your payslips right now.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const download = async (payment: Payslip) => {
    setDownloadingId(payment.id);
    setNotice(null);
    try {
      const uri = await salaryApi.downloadPayslip(payment.id);
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Payslip — ${monthLabel(payment.month, payment.year)}`,
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      console.error(error);
      setNotice({
        tone: 'error',
        message: 'Could not open the payslip PDF. Please try again.',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0B0F17', '#1E293B']}>
        <SafeAreaView edges={['top']}>
          <View className="px-5 pb-7 pt-2">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mb-4 h-9 w-9 items-center justify-center rounded-full bg-white/10"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={19} color="#fff" />
            </TouchableOpacity>
            <View className="flex-row items-end justify-between">
              <View>
                <Text className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Compensation
                </Text>
                <Text className="text-2xl font-bold text-white">My Payslips</Text>
                <Text className="mt-1 text-xs text-white/50">
                  Download a copy of every credited salary.
                </Text>
              </View>
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                <Ionicons name="wallet-outline" size={22} color="#93C5FD" />
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        className="-mt-4 flex-1 rounded-t-3xl bg-slate-50"
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {notice && (
          <View
            className={`mb-4 flex-row items-start gap-2 rounded-2xl border p-3 ${
              notice.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-rose-200 bg-rose-50'
            }`}
          >
            <Ionicons
              name={notice.tone === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
              size={18}
              color={notice.tone === 'success' ? '#059669' : '#E11D48'}
            />
            <Text
              className={`flex-1 text-xs font-medium ${
                notice.tone === 'success' ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {notice.message}
            </Text>
            <TouchableOpacity onPress={() => setNotice(null)}>
              <Ionicons name="close" size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        )}

        <View className="mb-6 flex-row gap-3">
          <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-4">
            <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Gross YTD
            </Text>
            <Text className="mt-1 text-sm font-bold text-slate-800">{money(ytd.gross)}</Text>
          </View>
          <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-4">
            <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Deductions
            </Text>
            <Text className="mt-1 text-sm font-bold text-rose-600">{money(ytd.deductions)}</Text>
          </View>
          <View className="flex-1 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <Text className="text-[10px] font-bold uppercase tracking-widest text-blue-500">
              Net YTD
            </Text>
            <Text className="mt-1 text-sm font-bold text-blue-700">{money(ytd.net)}</Text>
          </View>
        </View>

        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-sm font-bold text-slate-800">Payment history</Text>
          <Text className="text-[11px] text-slate-400">
            {payments.length} payslip{payments.length === 1 ? '' : 's'}
          </Text>
        </View>

        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#2563EB" />
            <Text className="mt-3 text-xs text-slate-400">Loading payslips…</Text>
          </View>
        ) : payments.length === 0 ? (
          <View className="items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14">
            <View className="mb-3 h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <Ionicons name="document-text-outline" size={24} color="#94A3B8" />
            </View>
            <Text className="text-sm font-semibold text-slate-700">No payslips yet</Text>
            <Text className="mt-1 text-center text-xs text-slate-400">
              Your payslip will appear here as soon as HR records a salary payment.
            </Text>
          </View>
        ) : (
          payments.map((payment) => {
            const isOpen = expanded === payment.id;
            const earningTotal =
              Number(payment.baseSalary || 0) +
              Number(payment.houseRentAllowance || 0) +
              Number(payment.transportAllowance || 0) +
              Number(payment.medicalAllowance || 0) +
              Number(payment.otherAllowance || 0);
            const deductionTotal =
              Number(payment.taxDeduction || 0) + Number(payment.otherDeduction || 0);

            return (
              <View
                key={payment.id}
                className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <TouchableOpacity
                  onPress={() => setExpanded(isOpen ? null : payment.id)}
                  className="flex-row items-center gap-3 p-4"
                  activeOpacity={0.75}
                >
                  <View className="h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                    <Ionicons name="receipt-outline" size={20} color="#2563EB" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-800">
                      {monthLabel(payment.month, payment.year)}
                    </Text>
                    <View className="mt-1 flex-row items-center gap-2">
                      <View className="rounded-full bg-emerald-50 px-2 py-0.5">
                        <Text className="text-[9px] font-bold uppercase text-emerald-700">
                          Paid
                        </Text>
                      </View>
                      <Text className="text-[11px] text-slate-400">
                        {payment.paymentDate ? formatDateDMY(payment.paymentDate) : '—'}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-sm font-bold text-slate-800">
                      {money(payment.netAmount ?? payment.amount)}
                    </Text>
                    <Ionicons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color="#94A3B8"
                    />
                  </View>
                </TouchableOpacity>

                {isOpen && (
                  <View className="border-t border-slate-100 px-4 pb-4 pt-3">
                    <View className="rounded-xl bg-slate-50 p-3">
                      {COMPONENTS.map((component) => {
                        const value = Number(payment[component.key] || 0);
                        if (!component.deduction && value === 0) return null;
                        if (component.deduction && value === 0) return null;
                        return (
                          <View
                            key={component.key}
                            className="flex-row items-center justify-between py-1"
                          >
                            <Text className="text-xs text-slate-500">{component.label}</Text>
                            <Text
                              className={`text-xs font-semibold ${
                                component.deduction ? 'text-rose-600' : 'text-slate-700'
                              }`}
                            >
                              {component.deduction ? '−' : ''}
                              {money(value)}
                            </Text>
                          </View>
                        );
                      })}
                      <View className="my-2 h-px bg-slate-200" />
                      <View className="flex-row items-center justify-between py-1">
                        <Text className="text-xs font-semibold text-slate-600">
                          Gross earnings
                        </Text>
                        <Text className="text-xs font-bold text-slate-800">
                          {money(earningTotal)}
                        </Text>
                      </View>
                      <View className="flex-row items-center justify-between py-1">
                        <Text className="text-xs font-semibold text-slate-600">
                          Total deductions
                        </Text>
                        <Text className="text-xs font-bold text-rose-600">
                          −{money(deductionTotal)}
                        </Text>
                      </View>
                      <View className="mt-1 flex-row items-center justify-between rounded-lg bg-blue-50 px-2 py-1.5">
                        <Text className="text-xs font-bold text-blue-700">Net pay</Text>
                        <Text className="text-sm font-bold text-blue-700">
                          {money(payment.netAmount ?? payment.amount)}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => download(payment)}
                      disabled={downloadingId === payment.id}
                      className="mt-3 flex-row items-center justify-center gap-2 rounded-xl bg-blue-600 py-3"
                      activeOpacity={0.8}
                    >
                      {downloadingId === payment.id ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Ionicons name="download-outline" size={17} color="#fff" />
                      )}
                      <Text className="text-xs font-bold text-white">
                        {downloadingId === payment.id ? 'Preparing PDF…' : 'Download payslip PDF'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
