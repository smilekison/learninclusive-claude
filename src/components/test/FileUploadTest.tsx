import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const FileUploadTest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testUpload = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setResult(null);
    
    try {
      console.log('🧪 TEST UPLOAD: Starting...');
      console.log('🧪 TEST UPLOAD: User ID (Profile ID):', user.id);
      console.log('🧪 TEST UPLOAD: Auth User ID:', user.authUserId);

      // Create a test file
      const testContent = "What is ur name";
      const testFile = new File([testContent], "What.txt", { type: "text/plain" });
      
      console.log('🧪 TEST UPLOAD: Created test file:', {
        name: testFile.name,
        size: testFile.size,
        type: testFile.type
      });

      // Test assignment ID (using one from the network requests)
      const testAssignmentId = "0e5f38e6-1109-46c3-9452-9ec328beceab";
      
      // Use auth user ID for folder structure (matches RLS policies)
      const folderUserId = user.authUserId || user.id;
      console.log('🧪 TEST UPLOAD: Using folder user ID:', folderUserId);

      // Create file path: authUserId/assignmentId/timestamp-filename
      const timestamp = Date.now();
      const filePath = `${folderUserId}/${testAssignmentId}/${timestamp}-What.txt`;
      
      console.log('🧪 TEST UPLOAD: File path:', filePath);

      // Try to upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('assignment-submissions')
        .upload(filePath, testFile, {
          cacheControl: '3600',
          upsert: false
        });

      console.log('🧪 TEST UPLOAD: Supabase response:', { data, error });

      if (error) {
        console.error('💥 TEST UPLOAD: Error:', error);
        setResult({ error: error.message });
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log('✅ TEST UPLOAD: Success!');
        setResult({ success: true, data });
        toast({
          title: "Upload successful!",
          description: `File uploaded to: ${data.path}`
        });
      }
    } catch (err: any) {
      console.error('💥 TEST UPLOAD: Exception:', err);
      setResult({ error: err.message });
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    setUploading(true);
    setResult(null);
    
    try {
      console.log('📁 REAL FILE UPLOAD: Starting...');
      console.log('📁 REAL FILE UPLOAD: File:', file.name, file.size, file.type);

      const folderUserId = user.authUserId || user.id;
      console.log('📁 REAL FILE UPLOAD: Using folder user ID:', folderUserId);

      const testAssignmentId = "0e5f38e6-1109-46c3-9452-9ec328beceab";
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${folderUserId}/${testAssignmentId}/${timestamp}-${sanitizedFileName}`;
      
      console.log('📁 REAL FILE UPLOAD: File path:', filePath);

      const { data, error } = await supabase.storage
        .from('assignment-submissions')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      console.log('📁 REAL FILE UPLOAD: Supabase response:', { data, error });

      if (error) {
        setResult({ error: error.message });
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setResult({ success: true, data });
        toast({
          title: "Upload successful!",
          description: `File uploaded to: ${data.path}`
        });
      }
    } catch (err: any) {
      setResult({ error: err.message });
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <h3 className="text-lg font-semibold">File Upload Test</h3>
      
      <div className="space-y-2">
        <p><strong>User ID (Profile):</strong> {user?.id}</p>
        <p><strong>Auth User ID:</strong> {user?.authUserId}</p>
        <p><strong>Role:</strong> {user?.role}</p>
      </div>

      <div className="space-y-2">
        <Button 
          onClick={testUpload} 
          disabled={uploading || !user?.id}
        >
          {uploading ? "Uploading..." : "Test Upload (What.txt)"}
        </Button>
        
        <div>
          <Input 
            type="file" 
            onChange={handleFileUpload}
            disabled={uploading || !user?.id}
          />
        </div>
      </div>

      {result && (
        <div className="p-3 bg-muted rounded-lg">
          <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};