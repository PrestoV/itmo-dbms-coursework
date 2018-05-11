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
  
  composition(id: ID!): Composition
  compositions: [Composition]
  
  shelf(id: ID!): Shelf
  shelfs: [Shelf]
  
  shelfDish(id: Int!): [ShelfDish]
  shelfDishes: [ShelfDish]
}

type Mutation {
  addCashier(input: CashierInput): Cashier
  deleteCashier(id: ID!): Cashier

  addComposition: Composition
  deleteComposition(id: ID!): ID
  
  addShelf(composition: ID!): Shelf
  deleteShelf(id: ID!): ID
   
  addShelfDish(input: ShelfDishInput): ShelfDish
  deleteShelfDish(id: ID!): ID
}

type Cashier {
  id: ID!
  full_name: String
  birthdate: String
  salary: Int
}
input CashierInput {
  full_name: String!
  birthdate: String!
  salary: Int!
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
  cashierInfo: ShiftCashierInfo
  cashbox: ID!
  isComplete: Boolean
}
type ShiftCashierInfo {
  cashier: Cashier
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
  dishInfo: OrderDishInfo
  amount: Int
}
type OrderDishInfo {
  dish: Dish
  name: String
  price: Float
}

type Composition {
  id: ID!
  shelfs: [Shelf]
}

type Shelf {
  id: ID!
  shelfDishes: [ShelfDish]
}

type ShelfDish {
  id: ID!
  dish_id: ID!
  shelf_life: String!
  previous: ShelfDish
  next: ShelfDish
}

input ShelfDishInput {
  dish_id: ID!
  shelf_life: String!
}
`;

const schema = makeExecutableSchema({typeDefs, resolvers});

export default schema;
