import fetch from 'node-fetch';

async function testAIAssistant() {
  console.log('🤖 Testing AI Assistant and Neo4j Integration...\n');

  try {
    // Test 1: Simple greeting
    console.log('Test 1: Simple greeting');
    const response1 = await fetch('http://localhost:9705/api/ai-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "Hello! What can you help me with?",
        conversationHistory: []
      })
    });

    if (response1.ok) {
      const data1 = await response1.json();
      console.log('✅ Response:', data1.message);
    } else {
      console.log('❌ Error:', response1.status, response1.statusText);
      const errorText = await response1.text();
      console.log('Error details:', errorText);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Add a person
    console.log('Test 2: Adding a person to the database');
    const response2 = await fetch('http://localhost:9705/api/ai-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "I met someone new today named Sarah Johnson. She's 28 years old, works as a software engineer, and lives in San Francisco. She's really into hiking and photography.",
        conversationHistory: []
      })
    });

    if (response2.ok) {
      const data2 = await response2.json();
      console.log('✅ Response:', data2.message);
    } else {
      console.log('❌ Error:', response2.status, response2.statusText);
      const errorText = await response2.text();
      console.log('Error details:', errorText);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Query the database
    console.log('Test 3: Querying the database');
    const response3 = await fetch('http://localhost:9705/api/ai-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "Show me all the people in my database",
        conversationHistory: []
      })
    });

    if (response3.ok) {
      const data3 = await response3.json();
      console.log('✅ Response:', data3.message);
    } else {
      console.log('❌ Error:', response3.status, response3.statusText);
      const errorText = await response3.text();
      console.log('Error details:', errorText);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAIAssistant(); 