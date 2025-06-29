import OpenAI from "openai";
import neo4j from 'neo4j-driver';

// Neo4j Service
class Neo4jService {
  constructor() {
    this.driver = neo4j.driver(
      'bolt://localhost:7687',
      neo4j.auth.basic('neo4j', 'password')
    )
    this.dbName = 'data'
  }

  async testConnection() {
    try {
      await this.driver.verifyConnectivity()
      return true
    } catch (error) {
      console.error('Neo4j connection failed:', error)
      return false
    }
  }

  getSession() {
    return this.driver.session({ database: this.dbName })
  }

  async getAllPeople() {
    const session = this.getSession()
    try {
      const result = await session.run(`
        MATCH (p:Person)
        RETURN p.name as name, p.age as age, p.location as location, 
               p.birthday as birthday, p.info as info, p.occupation as occupation
        ORDER BY p.name
      `)
      return result.records.map(record => ({
        name: record.get('name'),
        age: record.get('age'),
        location: record.get('location'),
        birthday: record.get('birthday'),
        info: record.get('info'),
        occupation: record.get('occupation')
      }))
    } finally {
      await session.close()
    }
  }

  async addPerson(personData) {
    const session = this.getSession()
    try {
      const params = {
        name: personData.name,
        age: personData.age || null,
        location: personData.location || null,
        birthday: personData.birthday || null,
        info: personData.info || null,
        occupation: personData.occupation || null
      }
      
      await session.run(`
        CREATE (p:Person {
          name: $name,
          age: $age,
          location: $location,
          birthday: $birthday,
          info: $info,
          occupation: $occupation,
          created: datetime()
        })
      `, params)
      return true
    } catch (error) {
      console.error('Error adding person:', error)
      return false
    } finally {
      await session.close()
    }
  }

  async searchPeople(query) {
    const session = this.getSession()
    try {
      const result = await session.run(`
        MATCH (p:Person)
        WHERE toLower(p.name) CONTAINS toLower($query)
           OR toLower(p.info) CONTAINS toLower($query)
           OR toLower(p.location) CONTAINS toLower($query)
           OR toLower(p.occupation) CONTAINS toLower($query)
        RETURN p.name as name, p.age as age, p.location as location,
               p.birthday as birthday, p.info as info, p.occupation as occupation
        ORDER BY p.name
      `, { query })
      
      return result.records.map(record => ({
        name: record.get('name'),
        age: record.get('age'),
        location: record.get('location'),
        birthday: record.get('birthday'),
        info: record.get('info'),
        occupation: record.get('occupation')
      }))
    } finally {
      await session.close()
    }
  }

  async addRelationship(person1, person2, relationshipType, properties = {}) {
    const session = this.getSession()
    try {
      await session.run(`
        MATCH (p1:Person {name: $person1}), (p2:Person {name: $person2})
        CREATE (p1)-[r:${relationshipType} {
          since: $since,
          description: $description,
          created: datetime()
        }]->(p2)
      `, {
        person1,
        person2,
        since: properties.since || null,
        description: properties.description || null
      })
      return true
    } catch (error) {
      console.error('Error adding relationship:', error)
      return false
    } finally {
      await session.close()
    }
  }

  async close() {
    await this.driver.close()
  }
}

// Initialize services
const neo4jService = new Neo4jService()

const prompt = `You are an AI assistant that helps manage a Neo4j graph database for personal relationships. 
You MUST use the available functions to interact with the database for ANY query about people.

IMPORTANT: For ANY question about people, information, interests, or relationships, you MUST call one of these functions:
- Use "read_graph" to get information about specific people or all people
- Use "search_graph" to search for people with specific criteria
- Use "write_graph" to add new people or relationships

Guidelines:
- ALWAYS use functions for people-related queries
- For questions about specific people (like "what is Alice's info" or "Alice's birthday"), use read_graph with the person's name
- For questions about interests or finding similar people, use read_graph to get all people
- When someone mentions a new person, use write_graph to add them
- Be conversational and helpful in your responses after getting the data`;

const client = new OpenAI({
    apiKey: "",
    baseURL: "https://us-mco-omnibus-1-ollama--provider-1--xlam.athena.u0026.net/v1/",
});

async function handleConversation(userMessage, conversationHistory = []) {
    try {
        console.log("Processing message:", userMessage);

        // Build conversation messages
        const messages = [
            { role: "system", content: prompt },
            ...conversationHistory,
            { role: "user", content: userMessage }
        ];

        const response = await client.chat.completions.create({
            model: "hf.co/Salesforce/Llama-xLAM-2-8b-fc-r-gguf:Q4_K_S",
            messages: messages,
            tools: [
                {
                    type: "function",
                    function: {
                        name: "read_graph",
                        description: "Read people from the graph database",
                        parameters: { 
                            type: "object", 
                            properties: {
                                query: {
                                    type: "string",
                                    description: "Optional search query to filter people"
                                }
                            }
                        },
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "write_graph",
                        description: "Write to the graph database",
                        parameters: {
                            type: "object",
                            properties: {
                                action: {
                                    type: "string",
                                    enum: ["add_person", "add_relationship"],
                                    description: "The action to perform on the graph database"
                                },
                                data: {
                                    type: "object",
                                    description: "The data to add to the graph database"
                                }
                            },
                            required: ["action", "data"]
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "search_graph",
                        description: "Search the graph database for specific information",
                        parameters: {
                            type: "object",
                            properties: {
                                query: {
                                    type: "string",
                                    description: "The query to search for in the graph database",
                                }
                            },
                            required: ["query"]
                        }
                    }
                }
            ],
            max_tokens: 500,
            temperature: 0.7,
        });

        const assistantMessage = response.choices[0].message;
        let finalResponse = assistantMessage.content || '';

        // Handle function calls - both proper tool_calls and text-based function calls
        let functionCalls = [];
        
        if (assistantMessage.tool_calls) {
            console.log("AI wants to call functions:", assistantMessage.tool_calls.length);
            functionCalls = assistantMessage.tool_calls.map(call => ({
                name: call.function.name,
                arguments: JSON.parse(call.function.arguments)
            }));
        } else if (finalResponse.includes('"name"') && (finalResponse.includes('"parameters"') || finalResponse.includes('"arguments"'))) {
            // Parse function calls from text response (fallback for models that don't use proper tool_calls)
            try {
                // Try to extract JSON from the response
                let jsonMatch = finalResponse.match(/\[.*\]/s) || finalResponse.match(/\{.*\}/s);
                if (jsonMatch) {
                    const parsedCalls = JSON.parse(jsonMatch[0]);
                    functionCalls = Array.isArray(parsedCalls) ? parsedCalls : [parsedCalls];
                    console.log("Parsed function calls from text:", functionCalls.length);
                }
            } catch (e) {
                console.log("Failed to parse function calls from text:", e.message);
                console.log("Raw response:", finalResponse);
            }
        }

        // Handle casual conversation without function calls
        if (functionCalls.length === 0) {
            // Check for greetings and casual conversation
            const casualGreetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'];
            const isGreeting = casualGreetings.some(greeting => 
                userMessage.toLowerCase().includes(greeting)
            );
            
            if (isGreeting) {
                finalResponse = "👋 Hello! I'm your personal relationship database assistant. I can help you:\n\n• Find information about people in your database\n• Add new people and their details\n• Search for people with similar interests\n• Analyze relationships and connections\n\nTry asking me something like:\n• \"What is Alice's info?\"\n• \"Who has similar interests?\"\n• \"Add Maria, she's 25 and loves cooking\"";
            } else if (userMessage.toLowerCase().includes('thank')) {
                finalResponse = "You're welcome! I'm here to help you manage your personal relationships database. Is there anything else you'd like to know about your contacts?";
                         } else if (finalResponse === '[]' || finalResponse.trim() === '' || finalResponse === '{}') {
                finalResponse = "I'm not sure how to help with that. I specialize in managing your personal relationship database. You can ask me to:\n\n• Find people: \"What is [name]'s info?\"\n• Add people: \"Add [name], they're [age] and work as [job]\"\n• Find interests: \"Who likes [hobby]?\"\n• Analyze relationships: \"Who has similar interests?\"";
             }
        }

        // Execute function calls
        if (functionCalls.length > 0) {
            let functionResults = [];
            
            for (const functionCall of functionCalls) {
                const functionName = functionCall.name;
                const functionArgs = functionCall.arguments || functionCall.parameters;
                
                console.log(`Calling function: ${functionName}`, functionArgs);
                
                let result;
                
                try {
                    switch (functionName) {
                        case 'read_graph':
                            if (functionArgs.query && !functionArgs.query.toLowerCase().includes('interest') && !functionArgs.query.toLowerCase().includes('similar')) {
                                // For birthday queries, extract just the person name
                                if (functionArgs.query.toLowerCase().includes('birthday') || functionArgs.query.toLowerCase().includes('birth')) {
                                    let personName = functionArgs.query.replace(/birthday|birth|born|what|is|when|'s/gi, '').trim();
                                    // Clean up common query words
                                    personName = personName.replace(/\b(the|of|for)\b/gi, '').trim();
                                    result = await neo4jService.searchPeople(personName);
                                } else {
                                    result = await neo4jService.searchPeople(functionArgs.query);
                                }
                            } else {
                                // For interest queries or general queries, get all people
                                result = await neo4jService.getAllPeople();
                            }
                            console.log(`Found ${result.length} people`);
                            break;
                            
                        case 'search_graph':
                            if (functionArgs.query && (functionArgs.query.toLowerCase().includes('interest') || functionArgs.query.toLowerCase().includes('similar'))) {
                                // For interest queries, get all people to analyze
                                result = await neo4jService.getAllPeople();
                                console.log(`Got all ${result.length} people for interest analysis`);
                            } else if (functionArgs.query && (functionArgs.query.toLowerCase().includes('birthday') || functionArgs.query.toLowerCase().includes('birth'))) {
                                // For birthday queries, extract just the person name
                                let personName = functionArgs.query.replace(/birthday|birth|born|what|is|when|'s/gi, '').trim();
                                personName = personName.replace(/\b(the|of|for)\b/gi, '').trim();
                                result = await neo4jService.searchPeople(personName);
                                console.log(`Search found ${result.length} results for birthday query`);
                            } else {
                                result = await neo4jService.searchPeople(functionArgs.query);
                                console.log(`Search found ${result.length} results`);
                            }
                            break;
                            
                        case 'write_graph':
                            if (functionArgs.action === 'add_person') {
                                result = await neo4jService.addPerson(functionArgs.data);
                                console.log(`Added person: ${result ? 'success' : 'failed'}`);
                            } else if (functionArgs.action === 'add_relationship') {
                                const { person1, person2, relationshipType, ...props } = functionArgs.data;
                                result = await neo4jService.addRelationship(person1, person2, relationshipType, props);
                                console.log(`Added relationship: ${result ? 'success' : 'failed'}`);
                            }
                            break;
                            
                        default:
                            result = { error: `Unknown function: ${functionName}` };
                    }
                } catch (error) {
                    result = { error: `Function execution failed: ${error.message}` };
                    console.error(`Function ${functionName} failed:`, error);
                }
                
                functionResults.push({ function: functionName, result });
            }

            // Generate a natural response based on function results
            let responseText = '';
            
            for (const { function: funcName, result } of functionResults) {
                if (funcName === 'read_graph' || funcName === 'search_graph') {
                    if (Array.isArray(result) && result.length > 0) {
                        // Special handling for birthday queries
                        if (userMessage.toLowerCase().includes('birthday')) {
                            responseText += `Here's the birthday information I found:\n\n`;
                            result.forEach(person => {
                                responseText += `• **${person.name}**`;
                                if (person.birthday) {
                                    // Format the birthday properly
                                    if (typeof person.birthday === 'object' && person.birthday.year) {
                                        const year = person.birthday.year.low || person.birthday.year;
                                        const month = person.birthday.month.low || person.birthday.month;
                                        const day = person.birthday.day.low || person.birthday.day;
                                        responseText += `\n  🎂 Birthday: ${month}/${day}/${year}`;
                                    } else if (typeof person.birthday === 'string') {
                                        responseText += `\n  🎂 Birthday: ${person.birthday}`;
                                    }
                                } else {
                                    responseText += `\n  ❓ Birthday not available`;
                                }
                                responseText += '\n\n';
                            });
                        } else {
                            responseText += `I found ${result.length} people in your database:\n\n`;
                            result.forEach(person => {
                                responseText += `• **${person.name}**`;
                                if (person.age) responseText += ` (age ${person.age})`;
                                if (person.occupation) responseText += ` - ${person.occupation}`;
                                if (person.location) responseText += ` in ${person.location}`;
                                if (person.info) responseText += `\n  ${person.info}`;
                                responseText += '\n\n';
                            });
                        }
                        
                        // For interest analysis
                        if (userMessage.toLowerCase().includes('interest') || userMessage.toLowerCase().includes('similar')) {
                            responseText += '\n🔗 **Common Interests Analysis:**\n';
                            const interests = {};
                            const allInterests = new Set();
                            
                            result.forEach(person => {
                                if (person.info) {
                                    const info = person.info.toLowerCase();
                                    // Expanded interest detection
                                    const interestMap = {
                                        'hiking': ['hiking', 'hike', 'outdoor'],
                                        'photography': ['photography', 'photo', 'camera'],
                                        'coffee': ['coffee', 'cafe', 'espresso'],
                                        'tech': ['tech', 'programming', 'programmer', 'developer', 'software', 'computer'],
                                        'travel': ['travel', 'traveler', 'world', 'countries'],
                                        'music': ['music', 'guitar', 'musician', 'instrument', 'song'],
                                        'art': ['paint', 'painting', 'art', 'artist', 'draw', 'creative'],
                                        'sports': ['sport', 'athlete', 'basketball', 'pickleball', 'cycling', 'cyclist'],
                                        'food': ['chef', 'cooking', 'food', 'culinary', 'recipe'],
                                        'reading': ['read', 'reader', 'book', 'sci-fi', 'literature'],
                                        'games': ['chess', 'game', 'gaming'],
                                        'science': ['scientist', 'data', 'graph theory', 'research']
                                    };
                                    
                                    Object.entries(interestMap).forEach(([category, keywords]) => {
                                        if (keywords.some(keyword => info.includes(keyword))) {
                                            interests[category] = (interests[category] || []).concat(person.name);
                                            allInterests.add(category);
                                        }
                                    });
                                }
                            });
                            
                            // Show common interests (2+ people)
                            const commonInterests = Object.entries(interests).filter(([_, people]) => people.length > 1);
                            if (commonInterests.length > 0) {
                                commonInterests.forEach(([interest, people]) => {
                                    responseText += `• **${interest.charAt(0).toUpperCase() + interest.slice(1)}**: ${people.join(', ')}\n`;
                                });
                            } else {
                                responseText += '• No common interests found among multiple people\n';
                            }
                            
                            // Show unique interests
                            responseText += '\n🎯 **Unique Interests:**\n';
                            Object.entries(interests).forEach(([interest, people]) => {
                                if (people.length === 1) {
                                    responseText += `• **${interest.charAt(0).toUpperCase() + interest.slice(1)}**: ${people[0]}\n`;
                                }
                            });
                        }
                    } else {
                        responseText += "I didn't find any matching people in your database.";
                    }
                } else if (funcName === 'write_graph') {
                    responseText += result ? 'Successfully added to database!' : 'Failed to add to database.';
                }
            }

            finalResponse = responseText || 'I processed your request but couldn\'t generate a response.';
        }

        return {
            message: finalResponse,
            conversationHistory: [
                ...conversationHistory,
                { role: 'user', content: userMessage },
                { role: 'assistant', content: finalResponse }
            ]
        };

    } catch (error) {
        console.error('AI Assistant error:', error);
        return {
            error: 'Failed to process request',
            details: error.message
        };
    }
}

// Test the system
async function runTest() {
    console.log("🤖 Testing AI Assistant with Neo4j Integration\n");
    
    // Test connection
    const isConnected = await neo4jService.testConnection();
    if (!isConnected) {
        console.log("❌ Neo4j connection failed");
        return;
    }
    console.log("✅ Neo4j connected successfully");

    // Test conversation
    const testMessage = "Hello! I met Sarah Johnson today at work. She's 28 years old, works as a software engineer, and lives in San Francisco. She's really into hiking and photography.";
    
    console.log("\n📝 User:", testMessage);
    
    const response = await handleConversation(testMessage);
    
    if (response.error) {
        console.log("❌ Error:", response.error);
    } else {
        console.log("🤖 Assistant:", response.message);
        
        // Verify the person was added
        console.log("\n🔍 Checking if Sarah was added to database...");
        const searchResults = await neo4jService.searchPeople('Sarah');
        if (searchResults.length > 0) {
            console.log("✅ Found Sarah in database:");
            searchResults.forEach(person => {
                console.log(`   • ${person.name}, age ${person.age}, ${person.occupation}, ${person.location}`);
            });
        } else {
            console.log("❌ Sarah not found in database");
        }
    }

    await neo4jService.close();
}

// Export for use as module or run as script
export { handleConversation, neo4jService };

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTest().catch(console.error);
}
