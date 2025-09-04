import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface, Button, Chip, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { IntakeLog, Medication } from '@/types/database.types';
import supabase from '@/lib/supabase';
import { colors } from '@/constants/theme';
import { Calendar, Clock, Check, X, CircleAlert as AlertCircle } from 'lucide-react-native';
import { Calendar as CalendarPicker } from 'react-native-calendars';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<(IntakeLog & { medication: Medication })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [filter, setFilter] = useState<'all' | 'taken' | 'missed'>('all');

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user, selectedDate]);

  const fetchLogs = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const startOfDay = new Date(selectedDate);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('intake_logs')
        .select(`
          *,
          medication:medications(*)
        `)
        .eq('user_id', user.id)
        .gte('ts', startOfDay.toISOString())
        .lte('ts', endOfDay.toISOString())
        .order('ts', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken':
        return <Check size={20} color={colors.success} />;
      case 'missed':
        return <X size={20} color={colors.error} />;
      case 'snoozed':
        return <AlertCircle size={20} color={colors.warning} />;
      default:
        return <Clock size={20} color={colors.onSurfaceVariant} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'taken':
        return 'Alındı';
      case 'missed':
        return 'Kaçırıldı';
      case 'snoozed':
        return 'Ertelendi';
      default:
        return 'Bilinmiyor';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'taken':
        return colors.successContainer;
      case 'missed':
        return colors.errorContainer;
      case 'snoozed':
        return colors.warningContainer;
      default:
        return colors.surfaceVariant;
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.status === filter;
  });

  const adherenceRate = logs.length > 0 
    ? Math.round((logs.filter(log => log.status === 'taken').length / logs.length) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Geçmiş</Text>
        
        <TouchableOpacity
          style={styles.dateSelector}
          onPress={() => setShowCalendar(!showCalendar)}
        >
          <Calendar size={20} color={colors.primary} />
          <Text style={styles.dateText}>{selectedDate}</Text>
        </TouchableOpacity>

        {showCalendar && (
          <Surface style={styles.calendarContainer} elevation={3}>
            <CalendarPicker
              onDayPress={(day) => {
                setSelectedDate(day.dateString);
                setShowCalendar(false);
              }}
              maxDate={new Date().toISOString().split('T')[0]}
              markedDates={{
                [selectedDate]: {
                  selected: true,
                  selectedColor: colors.primary,
                },
              }}
              theme={{
                backgroundColor: colors.surface,
                calendarBackground: colors.surface,
                textSectionTitleColor: colors.primary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: '#ffffff',
                todayTextColor: colors.primary,
                dayTextColor: colors.onSurface,
                textDisabledColor: colors.onSurfaceVariant,
                arrowColor: colors.primary,
                disabledArrowColor: colors.onSurfaceVariant,
                monthTextColor: colors.primary,
                indicatorColor: colors.primary,
              }}
            />
            <Button
              mode="text"
              onPress={() => setShowCalendar(false)}
              style={styles.closeButton}
            >
              Kapat
            </Button>
          </Surface>
        )}

        <Surface style={styles.statsContainer} elevation={1}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{adherenceRate}%</Text>
            <Text style={styles.statLabel}>Uyum Oranı</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{logs.filter(l => l.status === 'taken').length}</Text>
            <Text style={styles.statLabel}>Alınan</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{logs.filter(l => l.status === 'missed').length}</Text>
            <Text style={styles.statLabel}>Kaçırılan</Text>
          </View>
        </Surface>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          <Chip
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
            style={styles.filterChip}
          >
            Tümü ({logs.length})
          </Chip>
          <Chip
            selected={filter === 'taken'}
            onPress={() => setFilter('taken')}
            style={styles.filterChip}
          >
            Alınan ({logs.filter(l => l.status === 'taken').length})
          </Chip>
          <Chip
            selected={filter === 'missed'}
            onPress={() => setFilter('missed')}
            style={styles.filterChip}
          >
            Kaçırılan ({logs.filter(l => l.status === 'missed').length})
          </Chip>
        </ScrollView>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Kayıtlar yükleniyor...</Text>
          </View>
        ) : filteredLogs.length === 0 ? (
          <Surface style={styles.emptyState} elevation={1}>
            <Clock size={48} color={colors.onSurfaceVariant} />
            <Text style={styles.emptyTitle}>
              {filter === 'all' 
                ? 'Bu tarih için kayıt bulunamadı'
                : `${filter === 'taken' ? 'Alınan' : 'Kaçırılan'} ilaç bulunamadı`
              }
            </Text>
            <Text style={styles.emptySubtitle}>
              Başka bir tarih seçmeyi deneyin
            </Text>
          </Surface>
        ) : (
          filteredLogs.map((log) => (
            <Surface key={log.id} style={styles.logCard} elevation={2}>
              <View style={styles.logHeader}>
                <View style={styles.logInfo}>
                  <Text style={styles.medicationName}>{log.medication.name}</Text>
                  <Text style={styles.medicationDose}>
                    {log.medication.dose_value} {log.medication.dose_unit} - {log.medication.form}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(log.status) }]}>
                  {getStatusIcon(log.status)}
                </View>
              </View>

              <View style={styles.logDetails}>
                <Text style={styles.statusText}>{getStatusText(log.status)}</Text>
                <Text style={styles.timeText}>
                  {new Date(log.ts).toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </Surface>
          ))
        )}
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
    marginBottom: 20,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
    marginLeft: 8,
  },
  calendarContainer: {
    position: 'absolute',
    top: 120,
    left: 24,
    right: 24,
    zIndex: 1000,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  closeButton: {
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  filterContainer: {
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: colors.surfaceVariant,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.onSurfaceVariant,
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
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
  logCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  logInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: 2,
  },
  medicationDose: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  statusBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
  },
  timeText: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
});