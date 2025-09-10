import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Surface, Switch, Button, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/constants/theme';
import { User, Bell, Crown, Globe, Shield, LogOut, ChevronRight } from 'lucide-react-native';

export default function SettingsScreen() {
  const { user, profile, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Çıkış Yap', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightContent,
    isPremium = false 
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightContent?: React.ReactNode;
    isPremium?: boolean;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <View style={styles.settingInfo}>
          <View style={styles.titleContainer}>
            <Text style={styles.settingTitle}>{title}</Text>
            {isPremium && (
              <Crown size={16} color={colors.warning} style={styles.premiumIcon} />
            )}
          </View>
          {subtitle && (
            <Text style={styles.settingSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightContent || <ChevronRight size={20} color={colors.onSurfaceVariant} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ayarlar</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Profile Section */}
        <Surface style={styles.section} elevation={1}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <User size={24} color={colors.primary} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.full_name}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
          </View>
        </Surface>

        {/* Premium Section */}
        <Surface style={styles.section} elevation={1}>
          <View style={styles.premiumSection}>
            <View style={styles.premiumHeader}>
              <Crown size={24} color={colors.warning} />
              <Text style={styles.premiumTitle}>Premium'a Geçin</Text>
            </View>
            <Text style={styles.premiumSubtitle}>
              Sınırsız ilaç, aile paylaşımı ve raporlama özellikleri
            </Text>
            <Button
              mode="contained"
              style={[styles.premiumButton, { backgroundColor: colors.warning }]}
              labelStyle={styles.premiumButtonLabel}
              onPress={() => Alert.alert('Yakında', 'Premium özellikler yakında aktif olacak.')}
            >
              Premium'a Geç
            </Button>
          </View>
        </Surface>

        {/* General Settings */}
        <Surface style={styles.section} elevation={1}>
          <SettingItem
            icon={<Bell size={20} color={colors.onSurfaceVariant} />}
            title="Bildirim Ayarları"
            subtitle="Hatırlatma ve sessiz saatler"
            onPress={() => Alert.alert('Yakında', 'Bildirim ayarları yakında eklenecek.')}
          />
          <Divider style={styles.divider} />
          <SettingItem
            icon={<Globe size={20} color={colors.onSurfaceVariant} />}
            title="Dil"
            subtitle="Türkçe"
            rightContent={<Text style={styles.lockedText}>Kilitli</Text>}
          />
        </Surface>

        {/* Premium Features */}
        <Surface style={styles.section} elevation={1}>
          <Text style={styles.sectionTitle}>Premium Özellikler</Text>
          <SettingItem
            icon={<User size={20} color={colors.onSurfaceVariant} />}
            title="Aile Paylaşımı"
            subtitle="İlaçlarınızı sevdiklerinizle paylaşın"
            onPress={() => Alert.alert('Premium Gerekli', 'Bu özellik Premium üyelik gerektirir.')}
            isPremium={true}
          />
          <Divider style={styles.divider} />
          <SettingItem
            icon={<Shield size={20} color={colors.onSurfaceVariant} />}
            title="Raporlar"
            subtitle="Uyum raporları ve PDF export"
            onPress={() => Alert.alert('Premium Gerekli', 'Bu özellik Premium üyelik gerektirir.')}
            isPremium={true}
          />
        </Surface>

        {/* Account */}
        <Surface style={styles.section} elevation={1}>
          <Text style={styles.sectionTitle}>Hesap</Text>
          <SettingItem
            icon={<Shield size={20} color={colors.onSurfaceVariant} />}
            title="Gizlilik Politikası"
            onPress={() => Alert.alert('Gizlilik', 'Gizlilik politikası sayfası açılacak.')}
          />
          <Divider style={styles.divider} />
          <SettingItem
            icon={<LogOut size={20} color={colors.error} />}
            title="Çıkış Yap"
            onPress={handleSignOut}
            rightContent={null}
          />
        </Surface>

        <View style={styles.footer}>
          <Text style={styles.version}>İlaç Hatırlatıcı v1.0.0</Text>
          <Text style={styles.copyright}>© 2025 Tüm hakları saklıdır</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.onSurface,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  premiumText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  premiumSection: {
    padding: 20,
    alignItems: 'center',
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.onSurface,
    marginLeft: 8,
  },
  premiumSubtitle: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  premiumButton: {
    borderRadius: 12,
    minWidth: 160,
  },
  premiumButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onSurface,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
  },
  premiumIcon: {
    marginLeft: 8,
  },
  settingSubtitle: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  settingRight: {
    marginLeft: 16,
  },
  lockedText: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  divider: {
    marginLeft: 76,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  version: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginBottom: 4,
  },
  copyright: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    opacity: 0.7,
  },
});