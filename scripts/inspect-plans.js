const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

async function inspect() {
    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        const db = client.db();
        const plans = await db.collection('plans').find({}).toArray();
        console.log('Current plans in DB:');
        console.log(JSON.stringify(plans, null, 2));
    } catch (err) {
        console.error('Inspection failed:', err);
    } finally {
        await client.close();
    }
}

inspect();
