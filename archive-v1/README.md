# Arman.fit

A React Native application for managing workout splits, built with Expo, Tamagui, and Bun.

## Setup Instructions

### Prerequisites
- [Bun](https://bun.sh/) installed (`curl -fsSL https://bun.sh/install | bash`)
- [Expo Go](https://expo.dev/client) app on your mobile device (or iOS/Android simulator)

### Installation

1. Clone this repository
```bash
git clone https://github.com/yourusername/fitness-splits-app.git
cd fitness-splits-app
```

2. Install dependencies
```bash
bun install
```

3. Start the development server
```bash
bun start
```

4. Use the Expo Go app on your mobile device to scan the QR code or run the app in a simulator/emulator.

## Project Structure

- `App.tsx` - The main TypeScript application component using Tamagui
- `tamagui.config.ts` - TypeScript configuration for Tamagui
- `babel.config.js` - Babel configuration for the project
- `package.json` - Project dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `bunfig.toml` - Bun configuration
- `expo-env.d.ts` - Type declarations for Bun and Expo

## Features

- Workout split management
- Support for 1-a-day and 2-a-day splits
- Exercise categorization by muscle groups
- Progress tracking
- Clean, responsive UI with Tamagui

## Technology Stack

- **Expo**: Framework for React Native development
- **React Native**: Mobile app development framework
- **Tamagui**: UI component library and styling solution
- **TypeScript**: Static typing for improved developer experience
- **Bun**: Fast JavaScript runtime and package manager

## Development

When making changes:

- Run the app with `bun start`
- Test on both iOS and Android to ensure cross-platform compatibility
- Make sure to follow the TypeScript types for type safety

## License

MIT