import Button from '@/components/Button';
import { StyleSheet, View, Text } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Welcome to Flowlyfe</Text>
      <Text style={styles.subText}>Keep your life organized with lists</Text>
      <View style={styles.buttonContainer}>
        <Button label="My Lists" destination="/list-categories" />
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
  welcomeText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subText: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
  },
});
