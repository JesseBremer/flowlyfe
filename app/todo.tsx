import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

export default function ToDoScreen() {
const [tasks, setTasks] = useState<{ id: string; text: string; completed: boolean }[]>([]);
const [task, setTask] = useState("");

const addTask = () => {
  if (task) {
    const newTask = { id: Date.now().toString(), text: task, completed: false };
    console.log("Adding task:", newTask);
    setTasks([...tasks, newTask]);
    setTask("");
  }
};


  const toggleCompleteTask = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  };

 const renderTask = ({ item }) => {
  return (
    <Swipeable
      renderLeftActions={() => (
        <TouchableOpacity style={styles.completeButton} onPress={() => toggleCompleteTask(item.id)}>
          <Ionicons name="checkmark" size={24} color="white" />
        </TouchableOpacity>
      )}
      renderRightActions={() => (
        <TouchableOpacity style={styles.deleteButton} onPress={() => deleteTask(item.id)}>
          <Ionicons name="trash" size={24} color="white" />
        </TouchableOpacity>
      )}
    >
      <View style={styles.taskContainer}>
        <Text style={[styles.task, item.completed && styles.completed]}>{item.text}</Text>
      </View>
    </Swipeable>
  );
};

<FlatList 
  data={tasks}
  keyExtractor={(item) => item.id}
  renderItem={renderTask}
/>

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 20,
  },
  input: {
    width: "80%",
    padding: 10,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  taskContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
 task: {
  color: "#fff",
  fontSize: 18,
  alignItems: "flex-start",
  flexShrink: 1,
},

  completed: {
    textDecorationLine: "line-through",
    color: "#aaa",
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 8,
    marginLeft: 10,
  },
  buttonText: {
    color: "#fff",
  },
   completeButton: {
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
  },
  deleteButton: {
    backgroundColor: "#D32F2F",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
  },

});