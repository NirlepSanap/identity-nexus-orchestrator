
import React, { useState, useEffect } from 'react';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogOut, User } from 'lucide-react';
import { FirebaseProfileService } from '@/integrations/firebase/profileService';
import { FirebaseProfile } from '@/integrations/firebase/models';

const FirebaseUserProfile = () => {
  const { user, signOut } = useFirebaseAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<FirebaseProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await FirebaseProfileService.getProfile(user.uid);

      if (error) {
        console.error('Error fetching Firebase profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive"
        });
      } else if (data) {
        setProfile(data);
        setFullName(data.fullName || '');
      } else {
        // Create default profile
        await FirebaseProfileService.createOrUpdateProfile(user.uid, {
          fullName: user.displayName || '',
          avatarUrl: user.photoURL || '',
          role: 'user'
        });
        fetchProfile();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!user) return;
    
    setUpdating(true);
    try {
      const { error } = await FirebaseProfileService.createOrUpdateProfile(user.uid, {
        fullName: fullName
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Profile updated successfully"
        });
        fetchProfile();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user?.photoURL || profile?.avatarUrl || ''} />
            <AvatarFallback>
              <User className="h-10 w-10" />
            </AvatarFallback>
          </Avatar>
        </div>
        <CardTitle>Firebase Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={user?.email || ''}
            disabled
            className="bg-muted"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            type="text"
            value={profile?.role || 'user'}
            disabled
            className="bg-muted"
          />
        </div>

        <Button
          onClick={updateProfile}
          disabled={updating}
          className="w-full"
        >
          {updating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Update Profile
        </Button>

        <Button
          variant="outline"
          onClick={handleSignOut}
          className="w-full"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </CardContent>
    </Card>
  );
};

export default FirebaseUserProfile;
