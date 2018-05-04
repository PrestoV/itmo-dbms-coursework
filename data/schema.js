import { makeExecutableSchema } from 'graphql-tools';
import { makeExecutableSchema, addMockFunctionsToSchema } from 'graphql-tools';
import resolvers from './resolvers';

const typeDefs = `
type Query {
  cashier(id: ID): Cashier
  author(firstName: String, lastName: String): Author
  allAuthors: [Author]
  getFortuneCookie: String # we'll use this later
  composition(id: Int!): Composition
  row(id: Int!): Row
  shelfDish(id: Int!): [ShelfDish]
  allShelfDishes: [ShelfDish]
}

type Author {
  id: Int
  firstName: String
  lastName: String
  posts: [Post]
}

type Cashier {
  id: ID
  full_name: String
  birthdate: String
  salary: Int
}

type Composition {
  id: Int
}

type Row {
  id: Int
  dishes: [ShelfDish]
}

type ShelfDish {
  id: Int
  shelf_life: String
}
`;

const schema = makeExecutableSchema({ typeDefs, resolvers });

export default schema;
