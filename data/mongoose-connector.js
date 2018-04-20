import Mongoose from 'mongoose';

Mongoose.Promise = global.Promise;

const mongo = Mongoose.connect('mongodb://35.196.136.38:27017/admin');

const CashierSchema = Mongoose.Schema({
    _id: Mongoose.Schema.Types.ObjectId,
    full_name: String,
    birthdate: Date,
    salary: Number
});

const Cashier = Mongoose.model('cashier', CashierSchema);

export { Cashier };