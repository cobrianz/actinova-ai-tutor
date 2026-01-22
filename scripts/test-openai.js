
const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
    console.log('Testing connectivity to api.openai.com...');
    try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        console.log('Initialized client. Making request...');
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: "hi" }],
            max_tokens: 5
        });
        console.log('Success! Response:', completion.choices[0].message.content);
    } catch (error) {
        console.error('Connection failed!');
        console.error('Message:', error.message);
        if (error.cause) {
            console.error('Cause:', error.cause);
        }
    }
}

testConnection();
