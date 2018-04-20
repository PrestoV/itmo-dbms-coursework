import Mongoose from 'mongoose';

Mongoose.Promise = global.Promise;

const mongo = Mongoose.connect('mongodb://35.196.136.38:27017/admin', {
    useMongoClient: true
});