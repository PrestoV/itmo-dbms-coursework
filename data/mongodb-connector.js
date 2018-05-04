import { MongoClient } from 'mongodb';

const MONGO_URL = 'mongodb://35.231.143.48:27017/admin';

const client = MongoClient.connect(MONGO_URL);

export default { client };