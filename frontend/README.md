# Smart Home Pulse - Frontend Dashboard

A modern React TypeScript dashboard for Smart Home telemetry data visualization using Apollo Client, Recharts, and Tailwind CSS.

## Features

- **Real-time Dashboard**: Interactive telemetry dashboard with room-based filtering
- **Chart Widgets**: Three distinct chart types for Energy, Air Quality, and Motion data
- **Time Frame Controls**: Switch between Last Hour, Last Week, and Last Month views
- **Network Resilience**: Apollo Client with RetryLink for handling network instability
- **Loading States**: Skeleton screens to prevent layout shifts
- **Error Handling**: Localized error states with retry functionality
- **State Management**: Zustand for room selection state
- **Responsive Design**: Modern UI built with Tailwind CSS

## Architecture

### Data Fetching Strategy
- **Raw Data**: Used for "Last Hour" timeframe to show high-frequency data points
- **Aggregated Data**: Used for "Last Week" and "Last Month" for better performance
- **Server State vs Local State**: Apollo Client manages server state, Zustand handles local UI state

### Chart Components
1. **Energy Chart**: Bar chart showing power consumption over time
2. **Air Quality Chart**: Multi-line chart displaying CO2, PM2.5, and humidity
3. **Motion Chart**: Line chart showing movement activity peaks

## Tech Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **Apollo Client** with InMemoryCache and RetryLink (up to 5 retries)
- **Recharts** for data visualization
- **Zustand** for local state management
- **Tailwind CSS** for styling

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Copy `.env.example` to `.env` and configure:
   ```bash
   VITE_GRAPHQL_ENDPOINT=http://localhost:5000/graphql
   ```

3. **Development Server**:
   ```bash
   npm run dev
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

## GraphQL Queries

The application uses several optimized GraphQL queries:

- `GET_ROOMS`: Fetches available rooms
- `GET_DAILY_SUMMARY`: Gets daily aggregated metrics
- `GET_ENERGY_DATA`: Energy consumption data with conditional aggregation
- `GET_AIR_QUALITY_DATA`: Air quality metrics with multi-sensor support
- `GET_MOTION_DATA`: Motion detection events and counts

## Component Structure

```
src/
├── components/
│   ├── charts/
│   │   ├── EnergyChart.tsx
│   │   ├── AirQualityChart.tsx
│   │   └── MotionChart.tsx
│   ├── ui/
│   │   ├── Skeleton.tsx
│   │   └── ErrorState.tsx
│   ├── Dashboard.tsx
│   ├── DailySummary.tsx
│   └── RoomSelector.tsx
├── graphql/
│   └── queries.ts
├── lib/
│   └── apollo.ts
├── store/
│   └── roomStore.ts
├── types/
│   └── index.ts
└── utils/
    └── dateUtils.ts
```

## Performance Features

- **Apollo Client Caching**: InMemoryCache with proper type policies
- **Conditional Queries**: Skip queries when no room is selected
- **Optimized Re-renders**: Zustand prevents unnecessary component updates
- **Skeleton Loading**: Prevents layout shifts during data loading
- **Error Boundaries**: Isolated error states per widget