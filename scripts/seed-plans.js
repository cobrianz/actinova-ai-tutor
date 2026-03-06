const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

const plans = [
    {
        id: "basic",
        name: "Basic",
        price: 0,
        originalPrice: 0,
        discountDescription: null,
        billing: "monthly",
        status: "active",
        color: "gray",
        features: [
            "2 course generations per month",
            "2 quiz generations per month",
            "5 flashcard sets per month",
            "3 comprehensive reports & essays",
            "20 AI chat messages per month",
            "Beginner difficulty only",
            "Community support"
        ],
        limits: {
            courses: 2,
            quizzes: 2,
            flashcards: 5,
            reports: 3,
            chat: 20,
            difficulties: ["beginner"]
        },
        popular: false
    },
    {
        id: "premium",
        name: "Premium",
        price: 45,
        originalPrice: 59,
        discountDescription: "Premium Launch Offer",
        billing: "monthly",
        status: "active",
        color: "blue",
        features: [
            "20 course generations per month",
            "30 quiz generations per month",
            "30 flashcard sets per month",
            "50 high-quality reports & essays",
            "1,000 AI chat messages per month",
            "All difficulty levels",
            "Priority email support",
            "Advanced career tools access"
        ],
        limits: {
            courses: 20,
            quizzes: 30,
            flashcards: 30,
            reports: 50,
            chat: 1000,
            difficulties: ["beginner", "intermediate", "advanced"]
        },
        popular: true
    },
    {
        id: "enterprise",
        name: "Enterprise",
        price: 200,
        originalPrice: 250,
        discountDescription: "Enterprise Professional Tier",
        billing: "monthly",
        status: "active",
        color: "purple",
        features: [
            "✨ Unlimited everything",
            "✨ Unlimited courses & modules",
            "✨ Unlimited quizzes & flashcards",
            "✨ Unlimited reports & essays",
            "✨ Unlimited AI chat & context",
            "✨ Dedicated account manager",
            "✨ Priority 24/7 support",
            "✨ Custom career path mapping"
        ],
        limits: {
            courses: -1,
            quizzes: -1,
            flashcards: -1,
            reports: -1,
            chat: -1,
            difficulties: ["beginner", "intermediate", "advanced"]
        },
        popular: false
    }
];

async function seed() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db();
        const plansCollection = db.collection('plans');

        console.log('Seeding plans with upsert...');

        for (const plan of plans) {
            await plansCollection.updateOne(
                { id: plan.id },
                {
                    $set: {
                        ...plan,
                        updatedAt: new Date()
                    },
                    $setOnInsert: {
                        createdAt: new Date()
                    }
                },
                { upsert: true }
            );
            console.log(`Plan ${plan.id} updated/inserted`);
        }

        console.log('Successfully seeded plans');

    } catch (err) {
        console.error('Error seeding plans:', err);
    } finally {
        await client.close();
        process.exit(0);
    }
}

seed();
