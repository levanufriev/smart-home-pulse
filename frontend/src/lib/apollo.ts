import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';
import { RetryLink } from '@apollo/client/link/retry';

const GRAPHQL_ENDPOINT = import.meta.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:5000/graphql';

const httpLink = new HttpLink({
  uri: GRAPHQL_ENDPOINT,
});

const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: Infinity,
    jitter: true,
  },
  attempts: {
    max: 2,
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