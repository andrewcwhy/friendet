import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleConversation, neo4jService } from './web/openaiapi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Serve the HTML UI
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-ui.html'));
});

// Health check endpoint
app.post('/api/health-check', async (req, res) => {
    try {
        const isConnected = await neo4jService.testConnection();
        if (isConnected) {
            res.json({ status: 'ok', neo4j: 'connected' });
        } else {
            res.status(500).json({ status: 'error', message: 'Neo4j connection failed' });
        }
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Get all people from database
app.get('/api/get-people', async (req, res) => {
    try {
        const people = await neo4jService.getAllPeople();
        res.json({ people });
    } catch (error) {
        console.error('Error getting people:', error);
        res.status(500).json({ error: 'Failed to retrieve people from database' });
    }
});

// Chat with AI endpoint
app.post('/api/ai-chat', async (req, res) => {
    try {
        const { message, conversationHistory = [] } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        console.log(`\n💬 User: ${message}`);
        
        const response = await handleConversation(message, conversationHistory);
        
        if (response.error) {
            console.log(`❌ Error: ${response.error}`);
            res.status(500).json({ error: response.error, details: response.details });
        } else {
            console.log(`🤖 AI: ${response.message}`);
            res.json({
                message: response.message,
                conversationHistory: response.conversationHistory
            });
        }
    } catch (error) {
        console.error('Chat API error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Search people endpoint
app.post('/api/search-people', async (req, res) => {
    try {
        const { query } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        
        const results = await neo4jService.searchPeople(query);
        res.json({ results });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Failed to search database' });
    }
});

// Add person endpoint
app.post('/api/add-person', async (req, res) => {
    try {
        const personData = req.body;
        
        if (!personData.name) {
            return res.status(400).json({ error: 'Person name is required' });
        }
        
        const success = await neo4jService.addPerson(personData);
        
        if (success) {
            res.json({ message: 'Person added successfully', person: personData });
        } else {
            res.status(500).json({ error: 'Failed to add person to database' });
        }
    } catch (error) {
        console.error('Add person error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 AI + Neo4j Test Server Starting...\n');
    console.log(`📱 Open your browser to: http://localhost:${PORT}`);
    console.log(`🤖 AI Assistant ready for testing`);
    console.log(`🗄️  Neo4j database integration active`);
    console.log(`\n💡 Quick test commands:`);
    console.log(`   • "Show me all people in my database"`);
    console.log(`   • "I met Alex, he's 25 and works as a designer"`);
    console.log(`   • "Find all the engineers"`);
    console.log(`   • "Who likes hiking?"`);
    console.log(`\n⚡ Server running on port ${PORT}...\n`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await neo4jService.close();
    process.exit(0);
}); 