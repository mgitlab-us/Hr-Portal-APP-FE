import { useState, useEffect, useCallback } from 'react';
import { attendanceApi } from '../features/attendance/api';
import { reportsApi } from '../features/reports/api';
import { useSocket } from './useSocket';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

export const useAdminReports = () => {
  const [stats, setStats] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [trendMeta, setTrendMeta] = useState({ latestOnTimeRate: 0, onTimeDelta: 0 });
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [excelUri, setExcelUri] = useState<string | null>(null);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, trendRes] = await Promise.all([
        attendanceApi.getCompanyStats(),
        attendanceApi.getCompanyTrend(7),
      ]);
      
      const total = statsRes.total || 0;
      const present = statsRes.present || 0;
      const late = statsRes.late || 0;
      const absent = total - present;
      
      setStats({
        ...statsRes,
        onTimeRate: present > 0 ? Math.round(((present - late) / total) * 100) : 0,
        lateRate: total > 0 ? Math.round((late / total) * 100) : 0,
        absentRate: total > 0 ? Math.round((absent / total) * 100) : 0,
      });

      setTrend(trendRes.trend || []);
      setTrendMeta({
        latestOnTimeRate: trendRes.latestOnTimeRate || 0,
        onTimeDelta: trendRes.onTimeDelta || 0,
      });
    } catch (e) {
      console.error('Report fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Real-time synchronization
  useSocket('stats:update', () => {
    fetchDashboard();
  });

  const ensureShareableFileUri = async (uri: string, extension: '.xlsx' | '.pdf') => {
    if (uri.startsWith('file://')) return uri;
    const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    if (!baseDir) throw new Error('No writable directory available');
    const targetUri = `${baseDir}shared-${Date.now()}${extension}`;
    await FileSystem.copyAsync({ from: uri, to: targetUri });
    return targetUri;
  };

  const handleDownloadExcel = async () => {
    setDownloading(true);
    try {
      const uri = await reportsApi.downloadMonthlyReport(selectedYear, selectedMonth);
      setExcelUri(uri);
      setStatusMsg('Excel ready!');
    } catch (e) {
      setStatusMsg('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const uri = await reportsApi.downloadMonthlyPDF(selectedYear, selectedMonth);
      setPdfUri(uri);
      setStatusMsg('PDF ready!');
    } catch (e) {
      setStatusMsg('Download failed');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleShare = async (uri: string | null, type: '.xlsx' | '.pdf') => {
    if (!uri || sharing) return;
    setSharing(true);
    try {
      const shareableUri = await ensureShareableFileUri(uri, type);
      await Sharing.shareAsync(shareableUri);
    } catch (e) {
      console.error('Share error:', e);
    } finally {
      setSharing(false);
    }
  };

  return {
    stats,
    trend,
    trendMeta,
    loading,
    downloading,
    downloadingPdf,
    excelUri,
    pdfUri,
    statusMsg,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    handleDownloadExcel,
    handleDownloadPdf,
    handleShare,
    onRefresh: fetchDashboard
  };
};
