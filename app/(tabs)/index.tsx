import Button from '@/components/Button';
import { StyleSheet, View } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <Button label="Calender"  destination="/calender" />
        <Button label="To Do List" destination="/todo" />
        <Button label="Grocery List" destination="/groceries" />
        <Button label="Expense Tracker" destination="/expenses" />
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
  text: {
    color: '#fff',
  },
  buttonContainer: {
    flex: 1,
    alignItems: 'center',
  },
});
