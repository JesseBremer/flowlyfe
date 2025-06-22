import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, Alert, Modal } from "react-native";
import { Calendar, CalendarProps } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '@/context/DataContext';
import { CalendarEvent, MarkedDates } from '@/types/shared';

export default function CalendarScreen() {
  const { tasks, events, addEvent, deleteEvent } = useData();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');

  // Create marked dates from tasks and events
  const markedDates = useMemo(() => {
    const marked: MarkedDates = {};
    
    // Mark dates with tasks
    tasks.forEach(task => {
      if (task.dueDate) {
        marked[task.dueDate] = {
          marked: true,
          dotColor: task.completed ? '#4CAF50' : '#FF9800',
          ...(marked[task.dueDate] || {}),
        };
      }
    });

    // Mark dates with events
    events.forEach(event => {
      if (!event.isFromTodo) {
        marked[event.date] = {
          marked: true,
          dotColor: '#2196F3',
          ...(marked[event.date] || {}),
        };
      }
    });

    // Highlight selected date
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#666',
      };
    }

    return marked;
  }, [tasks, events, selectedDate]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    
    const dateEvents: Array<CalendarEvent | { id: string; title: string; time?: string; location?: string; type: 'todo'; completed: boolean }> = [];
    
    // Add tasks for this date
    tasks.forEach(task => {
      if (task.dueDate === selectedDate) {
        dateEvents.push({
          id: task.id,
          title: task.text,
          time: task.dueTime,
          location: task.location,
          type: 'todo',
          completed: task.completed,
        });
      }
    });

    // Add events for this date
    events.forEach(event => {
      if (event.date === selectedDate && !event.isFromTodo) {
        dateEvents.push(event);
      }
    });

    return dateEvents.sort((a, b) => {
      const timeA = a.time || '23:59';
      const timeB = b.time || '23:59';
      return timeA.localeCompare(timeB);
    });
  }, [selectedDate, tasks, events]);

  const onDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
  };

  const addEventForDate = () => {
    if (!newEventTitle.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date first');
      return;
    }

    addEvent({
      title: newEventTitle.trim(),
      date: selectedDate,
      time: newEventTime || undefined,
      location: newEventLocation || undefined,
      isFromTodo: false,
    });

    // Reset form
    setNewEventTitle('');
    setNewEventTime('');
    setNewEventLocation('');
    setShowAddModal(false);
  };

  const handleDeleteEvent = (eventId: string) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteEvent(eventId)
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
        <Text style={styles.subtitle}>Tap a date to view events</Text>
      </View>

      <Calendar
        onDayPress={onDayPress}
        markedDates={markedDates}
        theme={{
          backgroundColor: '#25292e',
          calendarBackground: '#25292e',
          textSectionTitleColor: '#fff',
          dayTextColor: '#fff',
          todayTextColor: '#4CAF50',
          selectedDayTextColor: '#fff',
          monthTextColor: '#fff',
          indicatorColor: '#4CAF50',
          textDayFontWeight: '400',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '500',
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14,
          arrowColor: '#4CAF50',
        }}
        style={styles.calendar}
      />

      {selectedDate && (
        <View style={styles.selectedDateSection}>
          <View style={styles.selectedDateHeader}>
            <Text style={styles.selectedDateTitle}>{formatDate(selectedDate)}</Text>
            <Pressable 
              style={styles.addEventButton}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addEventText}>Add Event</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.eventsList}>
            {selectedDateEvents.length === 0 ? (
              <Text style={styles.noEventsText}>No events for this date</Text>
            ) : (
              selectedDateEvents.map((event) => (
                <View key={event.id} style={styles.eventCard}>
                  <View style={styles.eventContent}>
                    <View style={styles.eventHeader}>
                      <Text style={[
                        styles.eventTitle,
                        'type' in event && event.completed && styles.completedEvent
                      ]}>
                        {event.title}
                      </Text>
                      <View style={styles.eventBadge}>
                        <Text style={styles.eventBadgeText}>
                          {'type' in event ? 'TODO' : 'EVENT'}
                        </Text>
                      </View>
                    </View>
                    
                    {(event.time || event.location) && (
                      <View style={styles.eventMeta}>
                        {event.time && (
                          <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={14} color="#ccc" />
                            <Text style={styles.metaText}>{event.time}</Text>
                          </View>
                        )}
                        {event.location && (
                          <View style={styles.metaItem}>
                            <Ionicons name="location-outline" size={14} color="#ccc" />
                            <Text style={styles.metaText}>{event.location}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                  {!('type' in event) && (
                    <Pressable 
                      style={styles.deleteEventButton}
                      onPress={() => handleDeleteEvent(event.id)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#ff4444" />
                    </Pressable>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* Add Event Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Event</Text>
            <Pressable onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              {selectedDate ? formatDate(selectedDate) : 'Select a date first'}
            </Text>

            <TextInput
              style={styles.textInput}
              placeholder="Event title..."
              placeholderTextColor="#999"
              value={newEventTitle}
              onChangeText={setNewEventTitle}
            />

            <TextInput
              style={styles.textInput}
              placeholder="Time (HH:MM)"
              placeholderTextColor="#999"
              value={newEventTime}
              onChangeText={setNewEventTime}
            />

            <TextInput
              style={styles.textInput}
              placeholder="Location (optional)"
              placeholderTextColor="#999"
              value={newEventLocation}
              onChangeText={setNewEventLocation}
            />

            <View style={styles.modalActions}>
              <Pressable 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={addEventForDate}
              >
                <Text style={styles.saveButtonText}>Add Event</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    color: '#ccc',
    fontSize: 16,
  },
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  selectedDateSection: {
    flex: 1,
    backgroundColor: '#25292e',
  },
  selectedDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  selectedDateTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  addEventButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addEventText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  eventsList: {
    flex: 1,
    padding: 20,
  },
  noEventsText: {
    color: '#999',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  eventCard: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  completedEvent: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  eventBadge: {
    backgroundColor: '#666',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  eventBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  eventMeta: {
    gap: 5,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: '#ccc',
    fontSize: 14,
    marginLeft: 6,
  },
  deleteEventButton: {
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#25292e',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
  },
  modalSubtitle: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: '#444',
    color: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#666',
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    marginLeft: 10,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
