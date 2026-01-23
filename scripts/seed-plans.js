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
            "1 quiz generation per month",
            "8 flashcard sets per month",
            "Beginner difficulty only",
            "3 modules per course",
            "3 lessons per module",
            "Community support"
        ],
        limits: {
            courses: 2,
            quizzes: 1,
            flashcards: 8,
            modules: 3,
            lessonsPerModule: 3,
            totalLessons: 9,
            difficulties: ["beginner"],
            aiResponses: 3
        },
        popular: false
    },
    {
        id: "premium",
        name: "Premium",
        price: 9.99,
        originalPrice: 14.99,
        discountDescription: "Special Launch Offer - Save 33%",
        billing: "monthly",
        status: "active",
        color: "blue",
        features: [
            "15 course generations per month",
            "20 quiz generations per month",
            "40 flashcard sets per month",
            "All difficulty levels",
            "20 modules per course",
            "5 lessons per module",
            "Priority email support",
            "Advanced analytics",
            "Custom branding"
        ],
        limits: {
            courses: 15,
            quizzes: 20,
            flashcards: 40,
            modules: 20,
            lessonsPerModule: 5,
            totalLessons: 100,
            difficulties: ["beginner", "intermediate", "advanced"],
            aiResponses: -1
        },
        popular: true
    },
    {
        id: "enterprise",
        name: "Enterprise",
        price: 29.99,
        originalPrice: 49.99,
        discountDescription: "Enterprise Trial Discount - Save 40%",
        billing: "monthly",
        status: "active",
        color: "purple",
        features: [
            "✨ Unlimited course generations",
            "✨ Unlimited quiz generations",
            "✨ Unlimited flashcard sets",
            "✨ All difficulty levels",
            "✨ Unlimited modules per course",
            "✨ Unlimited lessons per module",
            "✨ Dedicated account manager",
            "✨ Priority support (24/7)",
            "✨ Custom integrations",
            "✨ API access",
            "✨ White-label options",
            "✨ Advanced analytics & reporting"
        ],
        limits: {
            courses: -1,
            quizzes: -1,
            flashcards: -1,
            modules: -1,
            lessonsPerModule: -1,
            totalLessons: -1,
            difficulties: ["beginner", "intermediate", "advanced"],
            aiResponses: -1
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
