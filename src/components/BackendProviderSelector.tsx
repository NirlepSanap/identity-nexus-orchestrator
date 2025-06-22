
import React from 'react';
import { useBackendProvider } from '@/contexts/BackendProviderContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const BackendProviderSelector = () => {
  const { provider, setProvider } = useBackendProvider();

  return (
    <Card className="w-full max-w-md mx-auto mb-6">
      <CardHeader>
        <CardTitle>Backend Provider</CardTitle>
        <CardDescription>
          Choose your preferred backend service
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={provider === 'supabase' ? 'default' : 'outline'}
            onClick={() => setProvider('supabase')}
            className="flex-1"
          >
            Supabase
            {provider === 'supabase' && <Badge className="ml-2">Active</Badge>}
          </Button>
          <Button
            variant={provider === 'firebase' ? 'default' : 'outline'}
            onClick={() => setProvider('firebase')}
            className="flex-1"
          >
            Firebase
            {provider === 'firebase' && <Badge className="ml-2">Active</Badge>}
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p><strong>Supabase:</strong> PostgreSQL, RLS, Edge Functions</p>
          <p><strong>Firebase:</strong> Firestore, Cloud Functions, Real-time</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BackendProviderSelector;
