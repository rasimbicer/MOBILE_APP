import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Surface, Searchbar, Chip, FAB, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { Medication, MedicationGroup } from '@/types/database.types';
import supabase from '@/lib/supabase';
import { colors } from '@/constants/theme';
import { Pill, Clock, Trash2, CreditCard as Edit, Search } from 'lucide-react-native';
import { router } from 'expo-router';

export default function MedicationsScreen() {
  const { user, profile } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [groups, setGroups] = useState<MedicationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [todayFilter, setTodayFilter] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMedications();
      fetchGroups();
    }
  }, [user]);

  const fetchMedications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMedications(data || []);
    } catch (error) {
      console.error('Error fetching medications:', error);
      Alert.alert('Hata', 'İlaçlar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const deleteMedication = async (id: string) => {
    try {
      const { error } = await supabase
        .from('medications')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setMedications(prev => prev.filter(med => med.id !== id));
      Alert.alert('Başarılı', 'İlaç başarıyla silindi.');
    } catch (error) {
      console.error('Error deleting medication:', error);
      Alert.alert('Hata', 'İlaç silinirken bir hata oluştu.');
    }
  };

  const confirmDelete = (medication: Medication) => {
    Alert.alert(
      'İlaç Sil',
      `${medication.name} adlı ilacı silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: () => deleteMedication(medication.id)
        },
      ]
    );
  };

  const getNextDoseTime = (medication: Medication) => {
    if (medication.schedule.mode === 'times' && medication.schedule.times) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      for (const timeStr of medication.schedule.times) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const scheduleTime = hours * 60 + minutes;
        
        if (scheduleTime > currentTime) {
          return timeStr;
        }
      }
      // If no time found for today, return first time for tomorrow
      return medication.schedule.times[0] + ' (yarın)';
    }
    
    return 'Belirsiz';
  };

  const filteredMedications = medications.filter(med => {
    if (selectedGroup && med.group_id !== selectedGroup) return false;
    if (searchQuery && !med.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (todayFilter) {
      // Filter for today's medications - this would need more complex logic
      // For now, just return all medications
      return true;
    }
    return true;
  });

  const canAddMedication = profile?.premium_active || medications.length < 3;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>İlaçlar yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>İlaçlarım</Text>
          <TouchableOpacity
            onPress={() => setShowSearch(!showSearch)}
            style={styles.searchToggle}
          >
            <Search size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        {!profile?.premium_active && (
          <Surface style={styles.premiumBanner} elevation={1}>
            <Text style={styles.premiumText}>
              {medications.length}/3 ilaç
            </Text>
            <TouchableOpacity style={styles.premiumButton}>
              <Text style={styles.premiumButtonText}>Premium'a Geç</Text>
            </TouchableOpacity>
          </Surface>
        )}

        {showSearch && (
          <Searchbar
            placeholder="İlaç ara..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
          />
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          <Chip
            selected={!selectedGroup && !todayFilter}
            onPress={() => {
              setSelectedGroup(null);
              setTodayFilter(false);
            }}
            style={styles.filterChip}
          >
            Tümü
          </Chip>
          <Chip
            selected={todayFilter}
            onPress={() => {
              setSelectedGroup(null);
              setTodayFilter(true);
            }}
            style={styles.filterChip}
          >
            Bugün Alınacaklar
          </Chip>
          {groups.map(group => (
            <Chip
              key={group.id}
              selected={selectedGroup === group.id}
              onPress={() => {
                setSelectedGroup(selectedGroup === group.id ? null : group.id);
                setTodayFilter(false);
              }}
              style={styles.filterChip}
            >
              {group.name}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.medicationsList} contentContainerStyle={styles.medicationsContent}>
        {filteredMedications.length === 0 ? (
          <Surface style={styles.emptyState} elevation={1}>
            <Pill size={48} color={colors.onSurfaceVariant} />
            <Text style={styles.emptyTitle}>Henüz ilaç eklenmemiş</Text>
            <Text style={styles.emptySubtitle}>
              İlk ilacınızı eklemek için aşağıdaki butonu kullanın
            </Text>
          </Surface>
        ) : (
          filteredMedications.map(medication => (
            <Surface key={medication.id} style={styles.medicationCard} elevation={2}>
              <View style={styles.cardHeader}>
                <View style={styles.medicationInfo}>
                  <Text style={styles.medicationName}>{medication.name}</Text>
                  <Text style={styles.medicationDose}>
                    {medication.dose_value} {medication.dose_unit} - {medication.form}
                  </Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push(`/medication/${medication.id}`)}
                  >
                    <Edit size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => confirmDelete(medication)}
                  >
                    <Trash2 size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.scheduleInfo}>
                <Clock size={16} color={colors.onSurfaceVariant} />
                <Text style={styles.nextDose}>
                  Sonraki doz: {getNextDoseTime(medication)}
                </Text>
              </View>

              {medication.notes && (
                <Text style={styles.medicationNotes} numberOfLines={2}>
                  {medication.notes}
                </Text>
              )}
            </Surface>
          ))
        )}
      </ScrollView>

      <FAB
        icon={() => <Plus size={24} color="#FFFFFF" />}
        style={[
          styles.fab,
          { backgroundColor: canAddMedication ? colors.primary : colors.onSurfaceVariant }
        ]}
        onPress={() => {
          if (canAddMedication) {
            router.push('/(tabs)/add');
          } else {
            Alert.alert(
              'Limit Aşıldı',
              'Ücretsiz hesabınızla en fazla 3 ilaç ekleyebilirsiniz. Premium üyelik için ayarlara gidin.',
              [
                { text: 'Tamam' },
                { text: 'Premium\'a Geç', onPress: () => router.push('/(tabs)/settings') }
              ]
            );
          }
        }}
        disabled={!canAddMedication}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.onSurfaceVariant,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    elevation: 2,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.onSurface,
  },
  searchToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    marginBottom: 16,
  },
  premiumText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  premiumButton: {
    backgroundColor: colors.warning,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  premiumButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchBar: {
    marginBottom: 16,
    backgroundColor: colors.surfaceVariant,
  },
  searchInput: {
    fontSize: 16,
  },
  filterContainer: {
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: colors.surfaceVariant,
  },
  medicationsList: {
    flex: 1,
  },
  medicationsContent: {
    padding: 24,
    paddingTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.onSurface,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
  medicationCard: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 4,
  },
  medicationDose: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nextDose: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginLeft: 8,
  },
  medicationNotes: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    borderRadius: 28,
  },
});