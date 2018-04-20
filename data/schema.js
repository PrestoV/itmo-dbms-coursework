import { makeExecutableSchema } from 'graphql-tools';
import resolvers from './resolvers';

const typeDefs = `
type Query {
    cashier(id: ID): Cashier
}

type Cashier {
  id: ID
  full_name: String
  birthdate: String
  salary: Int
}
`;

const schema = makeExecutableSchema({ typeDefs, resolvers });

export default schema;
