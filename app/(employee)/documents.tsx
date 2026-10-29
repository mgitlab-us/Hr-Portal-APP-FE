import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import {
  DocumentCategory,
  documentsApi,
  EmployeeDocument,
} from '@/features/documents/api';
import { formatDateDMY } from '@/lib/datetime';

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  CONTRACT: 'Contract',
  ID_PROOF: 'ID Proof',
  RESUME: 'Resume',
  TAX_FORM: 'Tax Form',
  CERTIFICATE: 'Certificate',
  OTHER: 'Other',
};

const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  CONTRACT: '#2563EB',
  ID_PROOF: '#0D9E7A',
  RESUME: '#7C5CBF',
  TAX_FORM: '#D97706',
  CERTIFICATE: '#0891B2',
  OTHER: '#64748B',
};

const CATEGORY_ICONS: Record<DocumentCategory, keyof typeof Ionicons.glyphMap> = {
  CONTRACT: 'document-text-outline',
  ID_PROOF: 'id-card-outline',
  RESUME: 'person-outline',
  TAX_FORM: 'receipt-outline',
  CERTIFICATE: 'ribbon-outline',
  OTHER: 'folder-open-outline',
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setDocuments(await documentsApi.listMine());
    } catch (error) {
      console.error(error);
      Alert.alert('Documents unavailable', 'Could not load your documents right now.');
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

  const download = async (document: EmployeeDocument) => {
    setDownloadingId(document.id);
    try {
      const uri = await documentsApi.download(document);
      await Sharing.shareAsync(uri, {
        mimeType: document.mimeType,
        dialogTitle: document.title,
        UTI: document.mimeType === 'application/pdf' ? 'com.adobe.pdf' : undefined,
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Download failed', 'Could not open this document. Please try again.');
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
                  Document Vault
                </Text>
                <Text className="text-2xl font-bold text-white">My Documents</Text>
                <Text className="mt-1 text-xs text-white/50">
                  Contracts, ID proofs and tax forms shared by HR.
                </Text>
              </View>
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                <Ionicons name="folder-open-outline" size={22} color="#93C5FD" />
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
        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#2563EB" />
            <Text className="mt-3 text-xs text-slate-400">Loading documents…</Text>
          </View>
        ) : documents.length === 0 ? (
          <View className="items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14">
            <View className="mb-3 h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <Ionicons name="folder-open-outline" size={24} color="#94A3B8" />
            </View>
            <Text className="text-sm font-semibold text-slate-700">No documents yet</Text>
            <Text className="mt-1 text-center text-xs text-slate-400">
              Documents uploaded by HR for your profile will appear here.
            </Text>
          </View>
        ) : (
          documents.map((document) => {
            const color = CATEGORY_COLORS[document.category] || CATEGORY_COLORS.OTHER;
            const isDownloading = downloadingId === document.id;

            return (
              <View
                key={document.id}
                className="mb-3 flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <View
                  className="h-11 w-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${color}12` }}
                >
                  <Ionicons
                    name={CATEGORY_ICONS[document.category] || CATEGORY_ICONS.OTHER}
                    size={21}
                    color={color}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-800" numberOfLines={1}>
                    {document.title}
                  </Text>
                  <View className="mt-1 flex-row items-center gap-2">
                    <View className="rounded-full bg-slate-100 px-2 py-0.5">
                      <Text className="text-[9px] font-bold uppercase text-slate-500">
                        {CATEGORY_LABELS[document.category] || document.category}
                      </Text>
                    </View>
                    <Text className="text-[11px] text-slate-400">
                      {formatFileSize(document.size)}
                    </Text>
                  </View>
                  <Text className="mt-1 text-[11px] text-slate-400" numberOfLines={1}>
                    {document.fileName} • {formatDateDMY(document.createdAt)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => download(document)}
                  disabled={isDownloading}
                  className="h-10 w-10 items-center justify-center rounded-xl bg-blue-50"
                  accessibilityLabel={`Download ${document.title}`}
                >
                  {isDownloading ? (
                    <ActivityIndicator size="small" color="#2563EB" />
                  ) : (
                    <Ionicons name="download-outline" size={20} color="#2563EB" />
                  )}
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
