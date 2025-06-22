import Button from '@/components/Button';
import { StyleSheet, View, Text } from "react-native";

export default function ListCategories() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Lists</Text>
      <View style={styles.buttonContainer}>
        <Button label="To Do List" destination="/todo" />
        <Button label="Grocery List" destination="/groceries" />
        <Button label="Bills & Expenses" destination="/expenses" />
        <Button label="Calendar" destination="/calender" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  buttonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});