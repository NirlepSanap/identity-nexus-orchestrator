
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Database, Server, GitBranch, Package, Cloud } from 'lucide-react';

interface Contact {
  id: number;
  email?: string;
  phoneNumber?: string;
  linkedId?: number;
  linkPrecedence: 'primary' | 'secondary';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

interface IdentifyResponse {
  primaryContactId: number;
  emails: string[];
  phoneNumbers: string[];
  secondaryContactIds: number[];
}

const IdentityReconciliation = () => {
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [response, setResponse] = useState<IdentifyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mock database for demonstration
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: 1,
      email: 'john@example.com',
      phoneNumber: '1234567890',
      linkPrecedence: 'primary',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      email: 'john.doe@example.com',
      linkedId: 1,
      linkPrecedence: 'secondary',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z'
    }
  ]);

  const handleIdentify = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Simulate API call with mock logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Identity reconciliation logic
      const matchingContacts = contacts.filter(contact => 
        (email && contact.email === email) || 
        (phoneNumber && contact.phoneNumber === phoneNumber)
      );

      if (matchingContacts.length === 0) {
        // Create new primary contact
        const newContact: Contact = {
          id: contacts.length + 1,
          email: email || undefined,
          phoneNumber: phoneNumber || undefined,
          linkPrecedence: 'primary',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setContacts([...contacts, newContact]);
        
        setResponse({
          primaryContactId: newContact.id,
          emails: email ? [email] : [],
          phoneNumbers: phoneNumber ? [phoneNumber] : [],
          secondaryContactIds: []
        });
      } else {
        // Find primary contact
        let primaryContact = matchingContacts.find(c => c.linkPrecedence === 'primary');
        if (!primaryContact) {
          // Find the primary through linkedId
          const linkedContact = contacts.find(c => c.id === matchingContacts[0].linkedId);
          primaryContact = linkedContact || matchingContacts[0];
        }

        // Get all related contacts
        const allRelatedContacts = contacts.filter(c => 
          c.id === primaryContact!.id || 
          c.linkedId === primaryContact!.id ||
          (c.linkPrecedence === 'secondary' && matchingContacts.some(mc => mc.id === c.id))
        );

        const emails = Array.from(new Set(allRelatedContacts.map(c => c.email).filter(Boolean) as string[]));
        const phoneNumbers = Array.from(new Set(allRelatedContacts.map(c => c.phoneNumber).filter(Boolean) as string[]));
        const secondaryContactIds = allRelatedContacts.filter(c => c.linkPrecedence === 'secondary').map(c => c.id);

        // Add new information if not exists
        if ((email && !emails.includes(email)) || (phoneNumber && !phoneNumbers.includes(phoneNumber))) {
          const newSecondaryContact: Contact = {
            id: contacts.length + 1,
            email: email && !emails.includes(email) ? email : undefined,
            phoneNumber: phoneNumber && !phoneNumbers.includes(phoneNumber) ? phoneNumber : undefined,
            linkedId: primaryContact!.id,
            linkPrecedence: 'secondary',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          setContacts([...contacts, newSecondaryContact]);
          secondaryContactIds.push(newSecondaryContact.id);
          
          if (email && !emails.includes(email)) emails.push(email);
          if (phoneNumber && !phoneNumbers.includes(phoneNumber)) phoneNumbers.push(phoneNumber);
        }

        setResponse({
          primaryContactId: primaryContact!.id,
          emails,
          phoneNumbers,
          secondaryContactIds
        });
      }
    } catch (err) {
      setError('Failed to process identity reconciliation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <Database className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Identity Nexus Orchestrator
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Advanced identity reconciliation system with scalable microservice architecture, 
            containerization, and Kubernetes deployment
          </p>
        </div>

        <Tabs defaultValue="api" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="api" className="flex items-center space-x-2">
              <Server className="h-4 w-4" />
              <span>API Testing</span>
            </TabsTrigger>
            <TabsTrigger value="architecture" className="flex items-center space-x-2">
              <GitBranch className="h-4 w-4" />
              <span>Architecture</span>
            </TabsTrigger>
            <TabsTrigger value="docker" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Docker</span>
            </TabsTrigger>
            <TabsTrigger value="kubernetes" className="flex items-center space-x-2">
              <Cloud className="h-4 w-4" />
              <span>Kubernetes</span>
            </TabsTrigger>
            <TabsTrigger value="cicd" className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>CI/CD</span>
            </TabsTrigger>
          </TabsList>

          {/* API Testing Tab */}
          <TabsContent value="api" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Server className="h-5 w-5 text-blue-600" />
                    <span>Identity Reconciliation API</span>
                  </CardTitle>
                  <CardDescription>
                    Test the /identify endpoint with email and phone number
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="1234567890"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  <Button 
                    onClick={handleIdentify} 
                    disabled={loading || (!email && !phoneNumber)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {loading ? 'Processing...' : 'Identify Contact'}
                  </Button>
                  
                  {error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>API Response</CardTitle>
                  <CardDescription>
                    Identity reconciliation result
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {response ? (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Primary Contact ID:</span>
                            <Badge variant="default">{response.primaryContactId}</Badge>
                          </div>
                          
                          <Separator />
                          
                          <div>
                            <span className="font-medium block mb-2">Emails:</span>
                            <div className="flex flex-wrap gap-2">
                              {response.emails.map((email, index) => (
                                <Badge key={index} variant="secondary">{email}</Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <span className="font-medium block mb-2">Phone Numbers:</span>
                            <div className="flex flex-wrap gap-2">
                              {response.phoneNumbers.map((phone, index) => (
                                <Badge key={index} variant="secondary">{phone}</Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <span className="font-medium block mb-2">Secondary Contact IDs:</span>
                            <div className="flex flex-wrap gap-2">
                              {response.secondaryContactIds.map((id, index) => (
                                <Badge key={index} variant="outline">{id}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Submit a request to see the API response
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Current Contacts Display */}
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Database State (Mock)</CardTitle>
                <CardDescription>Current contacts in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Badge variant={contact.linkPrecedence === 'primary' ? 'default' : 'secondary'}>
                          {contact.linkPrecedence}
                        </Badge>
                        <div className="text-sm">
                          <div className="font-medium">ID: {contact.id}</div>
                          {contact.email && <div>Email: {contact.email}</div>}
                          {contact.phoneNumber && <div>Phone: {contact.phoneNumber}</div>}
                          {contact.linkedId && <div>Linked to: {contact.linkedId}</div>}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(contact.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Architecture Tab */}
          <TabsContent value="architecture" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>System Architecture</CardTitle>
                  <CardDescription>High-level overview of the system components</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <Server className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium">Identity API Service</div>
                        <div className="text-sm text-gray-600">Node.js + Express + PostgreSQL</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <Database className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium">Contact Database</div>
                        <div className="text-sm text-gray-600">PostgreSQL with optimized queries</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                      <Package className="h-5 w-5 text-purple-600" />
                      <div>
                        <div className="font-medium">Containerization</div>
                        <div className="text-sm text-gray-600">Docker with multi-stage builds</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                      <Cloud className="h-5 w-5 text-orange-600" />
                      <div>
                        <div className="font-medium">Orchestration</div>
                        <div className="text-sm text-gray-600">Kubernetes with HPA & RBAC</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>API Versions</CardTitle>
                  <CardDescription>Semantic versioning with feature evolution</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg">
                      <div className="font-medium text-blue-800">v1.0.0</div>
                      <div className="text-sm text-blue-600">
                        • /health endpoint<br/>
                        • /products basic CRUD
                      </div>
                    </div>
                    
                    <div className="p-3 border-l-4 border-green-500 bg-green-50 rounded-r-lg">
                      <div className="font-medium text-green-800">v1.1.0</div>
                      <div className="text-sm text-green-600">
                        • Added /products/search<br/>
                        • Basic search functionality
                      </div>
                    </div>
                    
                    <div className="p-3 border-l-4 border-purple-500 bg-purple-50 rounded-r-lg">
                      <div className="font-medium text-purple-800">v2.0.0</div>
                      <div className="text-sm text-purple-600">
                        • Enhanced /products/search<br/>
                        • Query parameters & error handling<br/>
                        • Performance optimizations
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Docker Tab */}
          <TabsContent value="docker" className="space-y-6">
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Docker Configuration</CardTitle>
                <CardDescription>Production-ready containerization setup</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <div className="space-y-2">
                    <div># Multi-stage Dockerfile</div>
                    <div>FROM node:18-alpine AS builder</div>
                    <div>WORKDIR /app</div>
                    <div>COPY package*.json ./</div>
                    <div>RUN npm ci --only=production</div>
                    <div></div>
                    <div>FROM node:18-alpine AS runtime</div>
                    <div>RUN addgroup -g 1001 -S nodejs</div>
                    <div>RUN adduser -S nextjs -u 1001</div>
                    <div>COPY --from=builder /app/node_modules ./node_modules</div>
                    <div>COPY . .</div>
                    <div>USER nextjs</div>
                    <div>HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \\</div>
                    <div>  CMD curl -f http://localhost:3000/health || exit 1</div>
                    <div>EXPOSE 3000</div>
                    <div>CMD ["npm", "start"]</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="font-medium text-blue-800">Security</div>
                    <div className="text-sm text-blue-600 mt-1">
                      • Non-root user<br/>
                      • Slim base image<br/>
                      • Vulnerability scanning
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="font-medium text-green-800">Optimization</div>
                    <div className="text-sm text-green-600 mt-1">
                      • Multi-stage build<br/>
                      • Layer caching<br/>
                      • Minimal image size
                    </div>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="font-medium text-purple-800">Monitoring</div>
                    <div className="text-sm text-purple-600 mt-1">
                      • Health checks<br/>
                      • Logging configuration<br/>
                      • Metrics collection
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Kubernetes Tab */}
          <TabsContent value="kubernetes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>Kubernetes Deployment</CardTitle>
                  <CardDescription>Production-grade K8s configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <div className="space-y-1">
                      <div>apiVersion: apps/v1</div>
                      <div>kind: Deployment</div>
                      <div>metadata:</div>
                      <div>  name: identity-api</div>
                      <div>  namespace: identity-v1</div>
                      <div>spec:</div>
                      <div>  replicas: 3</div>
                      <div>  selector:</div>
                      <div>    matchLabels:</div>
                      <div>      app: identity-api</div>
                      <div>  template:</div>
                      <div>    spec:</div>
                      <div>      containers:</div>
                      <div>      - name: api</div>
                      <div>        image: identity-api:v1.0.0</div>
                      <div>        resources:</div>
                      <div>          limits:</div>
                      <div>            cpu: 500m</div>
                      <div>            memory: 512Mi</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>HPA & Ingress</CardTitle>
                  <CardDescription>Auto-scaling and routing configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <div className="space-y-1">
                      <div>apiVersion: autoscaling/v2</div>
                      <div>kind: HorizontalPodAutoscaler</div>
                      <div>metadata:</div>
                      <div>  name: identity-api-hpa</div>
                      <div>spec:</div>
                      <div>  scaleTargetRef:</div>
                      <div>    apiVersion: apps/v1</div>
                      <div>    kind: Deployment</div>
                      <div>    name: identity-api</div>
                      <div>  minReplicas: 2</div>
                      <div>  maxReplicas: 10</div>
                      <div>  metrics:</div>
                      <div>  - type: Resource</div>
                      <div>    resource:</div>
                      <div>      name: cpu</div>
                      <div>      target:</div>
                      <div>        type: Utilization</div>
                      <div>        averageUtilization: 70</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Namespace Strategy</CardTitle>
                <CardDescription>Multi-version deployment isolation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
                    <div className="font-medium text-blue-800">identity-v1</div>
                    <div className="text-sm text-blue-600 mt-2">
                      • Version 1.0.0<br/>
                      • Route: /v1/*<br/>
                      • Basic functionality
                    </div>
                  </div>
                  
                  <div className="p-4 border-2 border-green-200 bg-green-50 rounded-lg">
                    <div className="font-medium text-green-800">identity-v1-1</div>
                    <div className="text-sm text-green-600 mt-2">
                      • Version 1.1.0<br/>
                      • Route: /v1.1/*<br/>
                      • Enhanced search
                    </div>
                  </div>
                  
                  <div className="p-4 border-2 border-purple-200 bg-purple-50 rounded-lg">
                    <div className="font-medium text-purple-800">identity-v2</div>
                    <div className="text-sm text-purple-600 mt-2">
                      • Version 2.0.0<br/>
                      • Route: /v2/*<br/>
                      • Full feature set
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CI/CD Tab */}
          <TabsContent value="cicd" className="space-y-6">
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
              <CardHeader>
                <CardTitle>GitHub Actions Pipeline</CardTitle>
                <CardDescription>Automated build, test, and deployment workflow</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <div className="space-y-1">
                    <div>name: CI/CD Pipeline</div>
                    <div>on:</div>
                    <div>  push:</div>
                    <div>    branches: [main, develop]</div>
                    <div>  pull_request:</div>
                    <div>    branches: [main]</div>
                    <div></div>
                    <div>jobs:</div>
                    <div>  test:</div>
                    <div>    runs-on: ubuntu-latest</div>
                    <div>    steps:</div>
                    <div>    - uses: actions/checkout@v3</div>
                    <div>    - name: Setup Node.js</div>
                    <div>      uses: actions/setup-node@v3</div>
                    <div>    - name: Install dependencies</div>
                    <div>      run: npm ci</div>
                    <div>    - name: Run tests</div>
                    <div>      run: npm test</div>
                    <div>    - name: Security scan</div>
                    <div>      run: npm audit</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium text-blue-800">Build Stage</div>
                      <div className="text-sm text-blue-600 mt-1">
                        • Docker image build<br/>
                        • Multi-arch support<br/>
                        • Image optimization
                      </div>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="font-medium text-green-800">Test Stage</div>
                      <div className="text-sm text-green-600 mt-1">
                        • Unit tests<br/>
                        • Integration tests<br/>
                        • Security scanning
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="font-medium text-purple-800">Deploy Stage</div>
                      <div className="text-sm text-purple-600 mt-1">
                        • K8s deployment<br/>
                        • Rolling updates<br/>
                        • Health checks
                      </div>
                    </div>
                    
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="font-medium text-orange-800">Post-Deploy</div>
                      <div className="text-sm text-orange-600 mt-1">
                        • Smoke tests<br/>
                        • Performance tests<br/>
                        • Monitoring setup
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default IdentityReconciliation;
