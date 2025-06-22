# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm start` or `npx expo start` - Start the Expo development server with options for Android, iOS, web, or Expo Go
- `npm run android` - Launch on Android emulator
- `npm run ios` - Launch on iOS simulator  
- `npm run web` - Launch in web browser
- `npm run lint` - Run ESLint to check code quality
- `npm run reset-project` - Reset to blank project (moves current code to app-example/)

### Package Management
- `npm install` - Install dependencies

## Architecture Overview

This is a React Native app built with Expo and Expo Router for file-based routing.

### Project Structure
- **app/** - Main application code using file-based routing
  - **(tabs)/** - Tab navigation screens (Home, About)
  - **_layout.tsx** - Root layout with Stack navigation
  - **Individual screens** - calender.tsx, expenses.tsx, groceries.tsx, todo.tsx
- **components/** - Reusable UI components
  - **Button.tsx** - Custom navigation button component
- **assets/** - Static assets (images, fonts)

### Key Technologies
- **Expo Router** - File-based routing system with Stack and Tab navigation
- **TypeScript** - Strict type checking enabled
- **React Navigation** - Bottom tabs and stack navigation
- **Ionicons** - Icon library from @expo/vector-icons

### Routing Architecture
- Root Stack navigator wraps tab navigation and modal screens
- Tab navigation includes Home (index) and About screens
- Individual feature screens (todo, expenses, etc.) are stack screens accessible from Home
- Custom Button component handles navigation between screens using Expo Router's useRouter hook

### Styling Approach
- StyleSheet API for component styling
- Dark theme with consistent color scheme (#25292e background, white text)
- Custom styling for tabs and headers to match app theme

### Path Aliases
- `@/` maps to project root for cleaner imports (e.g., `@/components/Button`)

## App Vision & Core Concepts

Flowlyfe is an "app for your life in lists" - an interconnected productivity app focused on helping users track and manage important life details through organized lists and reminders.

### Core Features
- **To-Do & Task Management** - Daily tasks, bills, groceries with checkbox functionality
- **Bills & Budgeting** - Expense tracking with paycheck integration for spendable income overview
- **Calendar Integration** - Potential sync between calendar events and to-do items
- **Memo/Journal** - Voice and text note support
- **Contact Management** - Contact backup and detail management

### Planned Architecture Changes
- **Centralized Lists Hub** - Single "Lists" button leading to `app/list-categories.tsx` for all list types
- **Enhanced Grocery Lists** - Category-based organization by store aisles
- **Bills Management** - Editable bills with due dates and payment tracking

### Key Data Structures

#### Grocery Items (Planned)
```typescript
interface GroceryItem {
  id: string;
  name: string;
  quantity?: string;
  isCompleted: boolean;
}

interface GroceryCategory {
  id: string;
  name: string; // e.g., "Fruits", "Vegetables", "Frozen"
  items: GroceryItem[];
}
```

#### Bills (Planned)
```typescript
interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
}
````