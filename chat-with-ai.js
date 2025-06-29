import { handleConversation, neo4jService } from './web/openaiapi.js';
import { createInterface } from 'readline';

console.log('🤖 AI Relationship Assistant - Interactive Chat');
console.log('Type your messages and press Enter. Type "exit" to quit.\n');

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

let conversationHistory = [];

async function startChat() {
  // Test Neo4j connection
  const isConnected = await neo4jService.testConnection();
  if (!isConnected) {
    console.log('❌ Cannot connect to Neo4j database. Please make sure it\'s running.');
    process.exit(1);
  }
  
  console.log('✅ Connected to Neo4j database');
  console.log('💬 You can now chat with your AI assistant!\n');
  
  rl.setPrompt('You: ');
  rl.prompt();
  
  rl.on('line', async (input) => {
    const message = input.trim();
    
    if (message.toLowerCase() === 'exit') {
      console.log('\n👋 Goodbye!');
      await neo4jService.close();
      rl.close();
      return;
    }
    
    if (!message) {
      rl.prompt();
      return;
    }
    
    try {
      console.log('\n🤖 AI is thinking...');
      const response = await handleConversation(message, conversationHistory);
      
      if (response.error) {
        console.log('❌ Error:', response.error);
      } else {
        console.log('🤖 AI:', response.message);
        conversationHistory = response.conversationHistory;
      }
      
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    
    console.log('');
    rl.prompt();
  });
  
  rl.on('close', async () => {
    await neo4jService.close();
    process.exit(0);
  });
}

startChat().catch(console.error); 