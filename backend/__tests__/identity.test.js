
const request = require('supertest');
const app = require('../server');

describe('Identity Reconciliation API', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('POST /identify', () => {
    it('should reject requests without email or phone', async () => {
      const response = await request(app)
        .post('/identify')
        .send({})
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });

    it('should create new primary contact for new identity', async () => {
      const response = await request(app)
        .post('/identify')
        .send({
          email: 'test@example.com',
          phoneNumber: '1234567890'
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('primaryContactId');
      expect(response.body).toHaveProperty('emails');
      expect(response.body).toHaveProperty('phoneNumbers');
      expect(response.body).toHaveProperty('secondaryContactIds');
    });

    it('should handle email-only requests', async () => {
      const response = await request(app)
        .post('/identify')
        .send({
          email: 'email-only@example.com'
        })
        .expect(200);
      
      expect(response.body.emails).toContain('email-only@example.com');
    });

    it('should handle phone-only requests', async () => {
      const response = await request(app)
        .post('/identify')
        .send({
          phoneNumber: '9876543210'
        })
        .expect(200);
      
      expect(response.body.phoneNumbers).toContain('9876543210');
    });
  });

  describe('GET /products', () => {
    it('should return products list', async () => {
      const response = await request(app)
        .get('/products')
        .expect(200);
      
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('products');
      expect(Array.isArray(response.body.products)).toBe(true);
    });
  });

  describe('GET /products/search', () => {
    it('should return search results', async () => {
      const response = await request(app)
        .get('/products/search?q=sample')
        .expect(200);
      
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('query');
      expect(response.body).toHaveProperty('results');
    });
  });
});
