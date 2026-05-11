import { ApolloProvider } from "@apollo/client/react";
import { apolloClient } from "./lib/apollo";
import { Dashboard } from "./components/Dashboard";

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <Dashboard />
    </ApolloProvider>
  );
}

export default App;
