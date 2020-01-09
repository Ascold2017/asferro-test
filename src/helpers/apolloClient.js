import ApolloClient from 'apollo-boost'
import VueApollo from 'vue-apollo'

export const apolloClient = new ApolloClient({
  uri: 'https://graphqlzero.almansi.me/api'
})

export const apolloProvider = new VueApollo({
  defaultClient: apolloClient,
})
