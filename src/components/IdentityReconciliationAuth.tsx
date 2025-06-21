
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import UserProfile from './UserProfile';

const IdentityReconciliationAuth = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: ''
  });
  const [result, setResult] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email && !formData.phoneNumber) {
      toast({
        title: "Validation Error",
        description: "Please provide at least email or phone number",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // First, create or update contact in Supabase
      const contactData: any = {
        email: formData.email || null,
        phone_number: formData.phoneNumber || null,
        link_precedence: 'primary',
        user_id: user?.id
      };

      // Check if contact already exists
      const { data: existingContacts, error: fetchError } = await supabase
        .from('contacts')
        .select('*')
        .or(`email.eq.${formData.email || 'null'},phone_number.eq.${formData.phoneNumber || 'null'}`)
        .eq('user_id', user?.id);

      if (fetchError) {
        throw fetchError;
      }

      let contactResult;
      if (existingContacts && existingContacts.length > 0) {
        // Update existing contact
        const { data, error } = await supabase
          .from('contacts')
          .update({
            ...contactData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingContacts[0].id)
          .select()
          .single();
        
        if (error) throw error;
        contactResult = data;
      } else {
        // Create new contact
        const { data, error } = await supabase
          .from('contacts')
          .insert(contactData)
          .select()
          .single();
        
        if (error) throw error;
        contactResult = data;
      }

      // Get all related contacts for this user
      const { data: allContacts, error: allContactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true });

      if (allContactsError) throw allContactsError;

      // Prepare result in the expected format
      const primaryContact = allContacts?.find(c => c.link_precedence === 'primary') || allContacts?.[0];
      const secondaryContacts = allContacts?.filter(c => c.link_precedence === 'secondary') || [];
      
      const emails = [...new Set(allContacts?.map(c => c.email).filter(Boolean) || [])];
      const phoneNumbers = [...new Set(allContacts?.map(c => c.phone_number).filter(Boolean) || [])];

      setResult({
        primaryContactId: primaryContact?.id,
        emails,
        phoneNumbers,
        secondaryContactIds: secondaryContacts.map(c => c.id)
      });

      toast({
        title: "Success",
        description: "Contact information processed successfully"
      });

    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process contact information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Identity Reconciliation System
          </h1>
          <p className="text-lg text-gray-600">
            Manage and consolidate your contact information
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Identity Reconciliation</CardTitle>
              <CardDescription>
                Enter email or phone number to reconcile contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder="Enter phone number"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Identify Contact
                </Button>
              </form>

              {result && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-2">Result:</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Primary Contact ID:</strong> {result.primaryContactId}</p>
                    <p><strong>Emails:</strong> {result.emails.join(', ') || 'None'}</p>
                    <p><strong>Phone Numbers:</strong> {result.phoneNumbers.join(', ') || 'None'}</p>
                    <p><strong>Secondary Contact IDs:</strong> {result.secondaryContactIds.join(', ') || 'None'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <UserProfile />
        </div>
      </div>
    </div>
  );
};

export default IdentityReconciliationAuth;
