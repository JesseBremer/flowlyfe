import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TodoTask, CalendarEvent } from '@/types/shared';

interface DataContextType {
  tasks: TodoTask[];
  events: CalendarEvent[];
  addTask: (task: Omit<TodoTask, 'id'>) => void;
  updateTask: (taskId: string, updates: Partial<TodoTask>) => void;
  deleteTask: (taskId: string) => void;
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (eventId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [tasks, setTasks] = useState<TodoTask[]>([
    { id: '1', text: 'Buy groceries', completed: false, dueDate: '2025-06-23', dueTime: '10:00', location: 'Whole Foods' },
    { id: '2', text: 'Call dentist', completed: true, dueDate: '2025-06-22' },
    { id: '3', text: 'Finish project report', completed: false, location: 'Office' },
  ]);

  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const addTask = (taskData: Omit<TodoTask, 'id'>) => {
    const newTask: TodoTask = {
      ...taskData,
      id: Date.now().toString(),
      completed: false,
    };
    
    setTasks(prev => [...prev, newTask]);

    // If task has a date, create corresponding calendar event
    if (newTask.dueDate) {
      const newEvent: CalendarEvent = {
        id: `task-${newTask.id}`,
        title: newTask.text,
        date: newTask.dueDate,
        time: newTask.dueTime,
        location: newTask.location,
        isFromTodo: true,
        todoId: newTask.id,
      };
      setEvents(prev => [...prev, newEvent]);
    }
  };

  const updateTask = (taskId: string, updates: Partial<TodoTask>) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const updatedTask = { ...task, ...updates };
        
        // Update corresponding calendar event
        if (updatedTask.dueDate) {
          const eventId = `task-${taskId}`;
          setEvents(prevEvents => {
            const existingEventIndex = prevEvents.findIndex(e => e.id === eventId);
            const updatedEvent: CalendarEvent = {
              id: eventId,
              title: updatedTask.text,
              date: updatedTask.dueDate!,
              time: updatedTask.dueTime,
              location: updatedTask.location,
              isFromTodo: true,
              todoId: taskId,
            };

            if (existingEventIndex >= 0) {
              const newEvents = [...prevEvents];
              newEvents[existingEventIndex] = updatedEvent;
              return newEvents;
            } else {
              return [...prevEvents, updatedEvent];
            }
          });
        } else {
          // Remove calendar event if date was removed
          setEvents(prev => prev.filter(e => e.id !== `task-${taskId}`));
        }
        
        return updatedTask;
      }
      return task;
    }));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    // Remove corresponding calendar event
    setEvents(prev => prev.filter(event => event.id !== `task-${taskId}`));
  };

  const addEvent = (eventData: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: Date.now().toString(),
    };
    
    setEvents(prev => [...prev, newEvent]);

    // If event is not from todo, create corresponding todo task
    if (!newEvent.isFromTodo) {
      const newTask: TodoTask = {
        id: `event-${newEvent.id}`,
        text: newEvent.title,
        completed: false,
        dueDate: newEvent.date,
        dueTime: newEvent.time,
        location: newEvent.location,
      };
      setTasks(prev => [...prev, newTask]);
    }
  };

  const updateEvent = (eventId: string, updates: Partial<CalendarEvent>) => {
    setEvents(prev => prev.map(event => {
      if (event.id === eventId) {
        const updatedEvent = { ...event, ...updates };
        
        // Update corresponding todo if it exists
        if (updatedEvent.todoId) {
          setTasks(prevTasks => prevTasks.map(task => {
            if (task.id === updatedEvent.todoId) {
              return {
                ...task,
                text: updatedEvent.title,
                dueDate: updatedEvent.date,
                dueTime: updatedEvent.time,
                location: updatedEvent.location,
              };
            }
            return task;
          }));
        }
        
        return updatedEvent;
      }
      return event;
    }));
  };

  const deleteEvent = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    setEvents(prev => prev.filter(e => e.id !== eventId));
    
    // Delete corresponding todo if it was created from this event
    if (event && !event.isFromTodo) {
      setTasks(prev => prev.filter(task => task.id !== `event-${eventId}`));
    }
  };

  const value: DataContextType = {
    tasks,
    events,
    addTask,
    updateTask,
    deleteTask,
    addEvent,
    updateEvent,
    deleteEvent,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};