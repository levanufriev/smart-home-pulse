import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';
import { RetryLink } from '@apollo/client/link/retry';

const GRAPHQL_ENDPOINT = import.meta.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:5000/graphql';

function envMs(value: string | undefined, fallback: number): number {
  if (value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function envDelayMaxMs(value: string | undefined): number {
  if (value === undefined || value === '') return Infinity;
  const n = Number(value);
  return Number.isFinite(n) ? n : Infinity;
}

const httpLink = new HttpLink({
  uri: GRAPHQL_ENDPOINT,
});

const retryLink = new RetryLink({
  delay: {
    initial: envMs(import.meta.env.VITE_APOLLO_RETRY_DELAY_INITIAL_MS, 300),
    max: envDelayMaxMs(import.meta.env.VITE_APOLLO_RETRY_DELAY_MAX_MS),
    jitter: import.meta.env.VITE_APOLLO_RETRY_DELAY_JITTER !== 'false',
  },
  attempts: {
    max: envMs(import.meta.env.VITE_APOLLO_RETRY_ATTEMPTS_MAX, 2),
    retryIf: (error) => {
      return !!error;
    },
  },
});

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([retryLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Room: {
        keyFields: ['id'],
      },
      TelemetryRecord: {
        keyFields: ['id'],
      },
      HourlyAggregate: {
        keyFields: ['id'],
      },
      DailyRoomSummary: {
        keyFields: ['roomId', 'date'],
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});