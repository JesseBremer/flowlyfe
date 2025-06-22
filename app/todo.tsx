import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, Alert, Modal } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useData } from '@/context/DataContext';
import { TodoTask } from '@/types/shared';

export default function ToDoScreen() {
  const { tasks, addTask, updateTask, deleteTask } = useData();

  const [newTaskText, setNewTaskText] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Add task fields
  const [addTaskDate, setAddTaskDate] = useState('');
  const [addTaskTime, setAddTaskTime] = useState('');
  const [addTaskLocation, setAddTaskLocation] = useState('');

  const handleAddTask = () => {
    if (!newTaskText.trim()) {
      Alert.alert('Error', 'Please enter a task');
      return;
    }

    addTask({
      text: newTaskText.trim(),
      completed: false,
      dueDate: addTaskDate || undefined,
      dueTime: addTaskTime || undefined,
      location: addTaskLocation || undefined,
    });
    
    // Reset form
    setNewTaskText('');
    setAddTaskDate('');
    setAddTaskTime('');
    setAddTaskLocation('');
    setShowAddModal(false);
  };

  const toggleTaskComplete = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      updateTask(taskId, { completed: !task.completed });
    }
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
  };

  const toggleTaskSelection = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      updateTask(taskId, { selected: !task.selected });
    }
  };

  const selectAllTasks = () => {
    const allSelected = tasks.every(task => task.selected);
    tasks.forEach(task => {
      updateTask(task.id, { selected: !allSelected });
    });
  };

  const completeSelectedTasks = () => {
    tasks.forEach(task => {
      if (task.selected) {
        updateTask(task.id, { completed: true, selected: false });
      }
    });
    setIsSelectionMode(false);
  };

  const deleteSelectedTasks = () => {
    Alert.alert(
      'Delete Tasks',
      'Are you sure you want to delete the selected tasks?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            tasks.forEach(task => {
              if (task.selected) {
                deleteTask(task.id);
              }
            });
            setIsSelectionMode(false);
          }
        }
      ]
    );
  };

  const selectedCount = tasks.filter(task => task.selected).length;
  const completedCount = tasks.filter(task => task.completed).length;

  const formatTaskDate = (task: TodoTask) => {
    if (!task.dueDate) return '';
    const date = new Date(task.dueDate + 'T00:00:00');
    const dateString = date.toLocaleDateString();
    return task.dueTime ? `${dateString} at ${task.dueTime}` : dateString;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>To Do List</Text>
        <Text style={styles.subtitle}>
          {completedCount}/{tasks.length} completed
        </Text>
      </View>

      <View style={styles.actionBar}>
        <Pressable 
          style={styles.addButton} 
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Task</Text>
        </Pressable>

        <Pressable 
          style={[styles.selectButton, isSelectionMode && styles.selectButtonActive]}
          onPress={() => setIsSelectionMode(!isSelectionMode)}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          <Text style={styles.selectButtonText}>Select</Text>
        </Pressable>
      </View>

      {isSelectionMode && (
        <View style={styles.bulkActions}>
          <Pressable style={styles.bulkActionButton} onPress={selectAllTasks}>
            <Text style={styles.bulkActionText}>
              {tasks.every(task => task.selected) ? 'Deselect All' : 'Select All'}
            </Text>
          </Pressable>

          {selectedCount > 0 && (
            <>
              <Pressable style={styles.bulkActionButton} onPress={completeSelectedTasks}>
                <Text style={styles.bulkActionText}>Complete ({selectedCount})</Text>
              </Pressable>
              
              <Pressable style={[styles.bulkActionButton, styles.deleteAction]} onPress={deleteSelectedTasks}>
                <Text style={styles.bulkActionText}>Delete ({selectedCount})</Text>
              </Pressable>
            </>
          )}
        </View>
      )}

      <ScrollView style={styles.tasksList}>
        {tasks.map(task => (
          <View key={task.id} style={styles.taskRow}>
            {isSelectionMode && (
              <Pressable 
                style={styles.selectionCheckbox}
                onPress={() => toggleTaskSelection(task.id)}
              >
                <Ionicons
                  name={task.selected ? "checkbox" : "square-outline"}
                  size={24}
                  color={task.selected ? "#4CAF50" : "#ccc"}
                />
              </Pressable>
            )}

            <Pressable 
              style={styles.taskContent}
              onPress={() => toggleTaskComplete(task.id)}
            >
              <View style={styles.taskMain}>
                <Ionicons
                  name={task.completed ? "checkbox" : "square-outline"}
                  size={24}
                  color={task.completed ? "#4CAF50" : "#fff"}
                />
                <View style={styles.taskInfo}>
                  <Text style={[
                    styles.taskText,
                    task.completed && styles.completedTaskText
                  ]}>
                    {task.text}
                  </Text>
                  
                  {(task.dueDate || task.location) && (
                    <View style={styles.taskMeta}>
                      {task.dueDate && (
                        <View style={styles.metaItem}>
                          <Ionicons name="time-outline" size={14} color="#ccc" />
                          <Text style={styles.metaText}>{formatTaskDate(task)}</Text>
                        </View>
                      )}
                      {task.location && (
                        <View style={styles.metaItem}>
                          <Ionicons name="location-outline" size={14} color="#ccc" />
                          <Text style={styles.metaText}>{task.location}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            </Pressable>

            <Pressable 
              style={styles.deleteButton}
              onPress={() => handleDeleteTask(task.id)}
            >
              <Ionicons name="trash-outline" size={20} color="#ff4444" />
            </Pressable>
          </View>
        ))}
      </ScrollView>

      {/* Add Task Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Task</Text>
            <Pressable onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <TextInput
              style={styles.textInput}
              placeholder="Task description..."
              placeholderTextColor="#999"
              value={newTaskText}
              onChangeText={setNewTaskText}
              multiline
            />

            <TextInput
              style={styles.textInput}
              placeholder="Due date (YYYY-MM-DD)"
              placeholderTextColor="#999"
              value={addTaskDate}
              onChangeText={setAddTaskDate}
            />

            <TextInput
              style={styles.textInput}
              placeholder="Due time (HH:MM)"
              placeholderTextColor="#999"
              value={addTaskTime}
              onChangeText={setAddTaskTime}
            />

            <TextInput
              style={styles.textInput}
              placeholder="Location (optional)"
              placeholderTextColor="#999"
              value={addTaskLocation}
              onChangeText={setAddTaskLocation}
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
                onPress={handleAddTask}
              >
                <Text style={styles.saveButtonText}>Add Task</Text>
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
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  selectButton: {
    backgroundColor: '#666',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  selectButtonActive: {
    backgroundColor: '#4CAF50',
  },
  selectButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bulkActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  bulkActionButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteAction: {
    backgroundColor: '#ff4444',
  },
  bulkActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tasksList: {
    flex: 1,
    padding: 20,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 15,
  },
  selectionCheckbox: {
    marginRight: 15,
  },
  taskContent: {
    flex: 1,
  },
  taskMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskInfo: {
    flex: 1,
    marginLeft: 12,
  },
  taskText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  taskMeta: {
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    color: '#ccc',
    fontSize: 14,
    marginLeft: 6,
  },
  deleteButton: {
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
  textInput: {
    backgroundColor: '#444',
    color: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    minHeight: 50,
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