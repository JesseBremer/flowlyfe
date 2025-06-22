export interface TodoTask {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
  dueTime?: string;
  location?: string;
  selected?: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  isFromTodo?: boolean;
  todoId?: string;
}

export interface MarkedDate {
  marked: boolean;
  dotColor: string;
  selected?: boolean;
  selectedColor?: string;
}

export type MarkedDates = {
  [date: string]: MarkedDate;
};