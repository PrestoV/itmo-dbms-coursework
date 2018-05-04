import {makeExecutableSchema, addMockFunctionsToSchema} from 'graphql-tools';
import resolvers from './resolvers';

const typeDefs = `
type Query {
  cashier(id: ID!): Cashier
  cashiers: [Cashier]
  
  cashbox(id: ID!): Cashbox
  cashboxes: [Cashbox]
  
  shift(id: ID!): Shift
  shifts: [Shift]
  
  dish(id: ID!): Dish
  dishes: [Dish]
  
  order(id: ID!): Order
  orders: [Order]
  
  getFortuneCookie: String # we'll use this later
  composition(id: Int!): Composition
  row(id: Int!): Row
  shelfDish(id: Int!): [ShelfDish]
  allCompositions: [Composition]
  allRows: [Row]
  allShelfDishes: [ShelfDish]
}

type Mutation {
  createComposition: Composition,
  deleteComposition(id: ID!): ID,
  createRow(composition: ID!): Row,
  deleteRow(id: ID!): ID,
  attachRows(composition: ID!, rows: [ID!]): [Row],
  createShelfDish(input: ShelfDishInput): ShelfDish,
  deleteShelfDish(id: ID!): ID
}

type Cashier {
  id: ID!
  full_name: String
  birthdate: String
  salary: Int
}

type Cashbox {
  id: ID!
}

type Shift {
  id: ID!
  type: Int
  date: String
  cashiers: [ShiftCashier]
}
type ShiftCashier {
  cashier: ShiftCashierInfo
  cashbox: ID!
  isComplete: Boolean
}
type ShiftCashierInfo {
  cashierId: ID!
  full_name: String
}

type Dish {
  id: ID!
  name: String
  price: Float
}

type Order {
  id: ID!
  price: Float
  date: String
  dishes: [OrderDish]
}
type OrderDish {
  dish: OrderDishInfo
  amount: Int
}
type OrderDishInfo {
  dishId: ID!
  name: String
  price: Float
}

type Composition {
  id: ID
  rows: [Row]
}

type Row {
  id: ID
  shelfDishes: [ShelfDish]
}

type ShelfDish {
  id: ID
  dish_id: ID
  shelf_life: String
  previous: ShelfDish
  next: ShelfDish
}

input ShelfDishInput {
  dish_id: ID
  shelf_life: String
}
`;

const schema = makeExecutableSchema({typeDefs, resolvers});

export default schema;
