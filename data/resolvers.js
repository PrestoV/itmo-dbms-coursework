import { Cashier } from './mongoose-connector';

const resolvers = {
  Query: {
    cashier(id) {
      return Cashier.findById(id)
    }
  }
};

export default resolvers;