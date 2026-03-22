
const { MongoClient } = require('mongodb');

async function inspectLesson() {
    const client = new MongoClient('mongodb://localhost:27017'); // Fallback to localhost if not in env
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    
    const dbClient = new MongoClient(uri);
    
    try {
        await dbClient.connect();
        const db = dbClient.db();
        
        console.log("Connected to DB");
        
        const course = await db.collection('library').findOne({ 
            "modules.lessons.title": "History and Evolution of Behavioral Economics" 
        });
        
        if (!course) {
            console.log("Course not found in 'library'. Trying 'courses'...");
            const course2 = await db.collection('courses').findOne({ 
                "modules.lessons.title": "History and Evolution of Behavioral Economics" 
            });
            if (!course2) {
                console.log("Course not found anywhere.");
                return;
            }
            inspectCourse(course2);
        } else {
            inspectCourse(course);
        }
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await dbClient.close();
    }
}

function inspectCourse(course) {
    console.log("Course ID:", course._id);
    console.log("Course Title:", course.title);
    
    for (const module of course.modules) {
        for (const lesson of module.lessons) {
            if (lesson.title === "History and Evolution of Behavioral Economics") {
                console.log("\n--- LESSON CONTENT START ---");
                console.log(lesson.content.substring(0, 200));
                console.log("...");
                console.log(lesson.content.substring(lesson.content.length - 200));
                console.log("--- LESSON CONTENT END ---\n");
                
                if (lesson.content.startsWith('```')) {
                    console.log("IDENTIFIED ISSUE: Content starts with triple backticks!");
                }
            }
        }
    }
}

inspectLesson();
