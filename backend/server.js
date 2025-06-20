const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'identity_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database initialization
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255),
        phone_number VARCHAR(20),
        linked_id INTEGER REFERENCES contacts(id),
        link_precedence VARCHAR(20) CHECK (link_precedence IN ('primary', 'secondary')) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email) WHERE deleted_at IS NULL;
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone_number) WHERE deleted_at IS NULL;
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_contacts_linked_id ON contacts(linked_id) WHERE deleted_at IS NULL;
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// Identity reconciliation logic
async function findRelatedContacts(email, phoneNumber) {
  const query = `
    SELECT * FROM contacts 
    WHERE (email = $1 OR phone_number = $2) 
    AND deleted_at IS NULL
    ORDER BY created_at ASC
  `;
  
  const result = await pool.query(query, [email, phoneNumber]);
  return result.rows;
}

async function findContactFamily(contactId) {
  // Find all contacts linked to the same primary contact
  const query = `
    WITH RECURSIVE contact_family AS (
      -- Base case: start with the given contact
      SELECT id, email, phone_number, linked_id, link_precedence, created_at, updated_at
      FROM contacts 
      WHERE id = $1 AND deleted_at IS NULL
      
      UNION
      
      -- Find all contacts linked to this contact (if it's primary)
      SELECT c.id, c.email, c.phone_number, c.linked_id, c.link_precedence, c.created_at, c.updated_at
      FROM contacts c
      INNER JOIN contact_family cf ON c.linked_id = cf.id
      WHERE c.deleted_at IS NULL
      
      UNION
      
      -- Find the primary contact if current contact is secondary
      SELECT c.id, c.email, c.phone_number, c.linked_id, c.link_precedence, c.created_at, c.updated_at
      FROM contacts c
      INNER JOIN contact_family cf ON c.id = cf.linked_id
      WHERE c.deleted_at IS NULL
    )
    SELECT DISTINCT * FROM contact_family
    ORDER BY link_precedence DESC, created_at ASC
  `;
  
  const result = await pool.query(query, [contactId]);
  return result.rows;
}

// Main identify endpoint
app.post('/identify', async (req, res) => {
  const { email, phoneNumber } = req.body;
  
  // Validation
  if (!email && !phoneNumber) {
    return res.status(400).json({
      error: 'At least one of email or phoneNumber must be provided'
    });
  }

  try {
    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Find existing contacts with matching email or phone
      const existingContacts = await findRelatedContacts(email, phoneNumber);
      
      if (existingContacts.length === 0) {
        // No existing contact - create new primary contact
        const insertQuery = `
          INSERT INTO contacts (email, phone_number, link_precedence)
          VALUES ($1, $2, 'primary')
          RETURNING *
        `;
        
        const result = await client.query(insertQuery, [email, phoneNumber]);
        const newContact = result.rows[0];
        
        await client.query('COMMIT');
        
        return res.json({
          primaryContactId: newContact.id,
          emails: email ? [email] : [],
          phoneNumbers: phoneNumber ? [phoneNumber] : [],
          secondaryContactIds: []
        });
      }
      
      // Find the primary contact among existing matches
      let primaryContact = existingContacts.find(c => c.link_precedence === 'primary');
      
      if (!primaryContact) {
        // If no primary found, the first one becomes primary
        primaryContact = existingContacts[0];
        
        // Update it to be primary if it's not already
        if (primaryContact.link_precedence !== 'primary') {
          await client.query(
            'UPDATE contacts SET link_precedence = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['primary', primaryContact.id]
          );
          primaryContact.link_precedence = 'primary';
        }
      }
      
      // Get all contacts in the family
      const familyContacts = await findContactFamily(primaryContact.id);
      
      // Check if we need to create a new secondary contact
      const existingEmails = familyContacts.map(c => c.email).filter(Boolean);
      const existingPhones = familyContacts.map(c => c.phone_number).filter(Boolean);
      
      const needNewContact = (email && !existingEmails.includes(email)) || 
                            (phoneNumber && !existingPhones.includes(phoneNumber));
      
      if (needNewContact) {
        // Create new secondary contact
        const insertQuery = `
          INSERT INTO contacts (email, phone_number, linked_id, link_precedence)
          VALUES ($1, $2, $3, 'secondary')
          RETURNING *
        `;
        
        const newSecondary = await client.query(insertQuery, [
          email && !existingEmails.includes(email) ? email : null,
          phoneNumber && !existingPhones.includes(phoneNumber) ? phoneNumber : null,
          primaryContact.id
        ]);
        
        familyContacts.push(newSecondary.rows[0]);
      }
      
      // Handle contact consolidation if we found multiple primaries
      const multiplePrimaries = existingContacts.filter(c => c.link_precedence === 'primary');
      if (multiplePrimaries.length > 1) {
        // Keep the oldest as primary, convert others to secondary
        const oldestPrimary = multiplePrimaries.reduce((oldest, current) => 
          new Date(current.created_at) < new Date(oldest.created_at) ? current : oldest
        );
        
        for (const contact of multiplePrimaries) {
          if (contact.id !== oldestPrimary.id) {
            await client.query(
              'UPDATE contacts SET link_precedence = $1, linked_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
              ['secondary', oldestPrimary.id, contact.id]
            );
          }
        }
        
        primaryContact = oldestPrimary;
      }
      
      await client.query('COMMIT');
      
      // Prepare response
      const allEmails = [...new Set(familyContacts.map(c => c.email).filter(Boolean))];
      const allPhones = [...new Set(familyContacts.map(c => c.phone_number).filter(Boolean))];
      const secondaryIds = familyContacts
        .filter(c => c.link_precedence === 'secondary')
        .map(c => c.id);
      
      res.json({
        primaryContactId: primaryContact.id,
        emails: allEmails,
        phoneNumbers: allPhones,
        secondaryContactIds: secondaryIds
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Identity reconciliation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Products endpoints for versioning demo
app.get('/products', (req, res) => {
  res.json({
    version: '1.0.0',
    products: [
      { id: 1, name: 'Sample Product 1', price: 29.99 },
      { id: 2, name: 'Sample Product 2', price: 39.99 }
    ]
  });
});

// v1.1 - Added search functionality
app.get('/products/search', (req, res) => {
  const { q } = req.query;
  res.json({
    version: '1.1.0',
    query: q,
    results: [
      { id: 1, name: 'Sample Product 1', price: 29.99, relevance: 0.9 }
    ]
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

// Start server
async function startServer() {
  await initializeDatabase();
  
  app.listen(port, () => {
    console.log(`Identity Reconciliation API running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
  });
}

startServer().catch(console.error);

module.exports = app;
