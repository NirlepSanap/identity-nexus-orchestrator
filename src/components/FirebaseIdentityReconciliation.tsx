
import React, { useState } from 'react';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { FirebaseContactService } from '@/integrations/firebase/contactService';

const FirebaseIdentityReconciliation = () => {
  const { user } = useFirebaseAuth();
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

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "Please sign in to continue",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Find existing contacts
      const { data: existingContacts, error: fetchError } = await FirebaseContactService.findRelatedContacts(
        formData.email || undefined,
        formData.phoneNumber || undefined,
        user.uid
      );

      if (fetchError) {
        throw fetchError;
      }

      let contactResult;
      if (existingContacts && existingContacts.length > 0) {
        // Update existing contact
        const existingContact = existingContacts[0];
        const { error } = await FirebaseContactService.updateContact(existingContact.id, {
          email: formData.email || existingContact.email,
          phoneNumber: formData.phoneNumber || existingContact.phoneNumber
        });
        
        if (error) throw error;
        contactResult = { id: existingContact.id };
      } else {
        // Create new contact
        const { data, error } = await FirebaseContactService.createContact({
          email: formData.email || undefined,
          phoneNumber: formData.phoneNumber || undefined,
          linkPrecedence: 'primary',
          userId: user.uid
        });
        
        if (error) throw error;
        contactResult = data;
      }

      // Get all contacts for this user
      const { data: allContacts, error: allContactsError } = await FirebaseContactService.getContactsByUser(user.uid);

      if (allContactsError) throw allContactsError;

      // Prepare result
      const primaryContact = allContacts?.find(c => c.linkPrecedence === 'primary') || allContacts?.[0];
      const secondaryContacts = allContacts?.filter(c => c.linkPrecedence === 'secondary') || [];
      
      const emails = [...new Set(allContacts?.map(c => c.email).filter(Boolean) || [])];
      const phoneNumbers = [...new Set(allContacts?.map(c => c.phoneNumber).filter(Boolean) || [])];

      setResult({
        primaryContactId: primaryContact?.id,
        emails,
        phoneNumbers,
        secondaryContactIds: secondaryContacts.map(c => c.id)
      });

      toast({
        title: "Success",
        description: "Contact information processed successfully with Firebase"
      });

    } catch (error: any) {
      console.error('Firebase Error:', error);
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
    <Card>
      <CardHeader>
        <CardTitle>Firebase Identity Reconciliation</CardTitle>
        <CardDescription>
          Enter email or phone number to reconcile contact information using Firebase
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
            Identify Contact (Firebase)
          </Button>
        </form>

        {result && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">Firebase Result:</h3>
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
  );
};

export default FirebaseIdentityReconciliation;
