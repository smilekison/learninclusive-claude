import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Eye, 
  Paperclip, 
  Image, 
  FileAudio, 
  FileVideo, 
  Archive,
  File
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadedFile {
  name: string;
  path: string;
  size: number;
  type: string;
}

interface SubmissionFilesViewProps {
  files: UploadedFile[];
  className?: string;
}

export const SubmissionFilesView: React.FC<SubmissionFilesViewProps> = ({ 
  files, 
  className = "" 
}) => {
  const { toast } = useToast();

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (fileType.startsWith('audio/')) return <FileAudio className="w-4 h-4" />;
    if (fileType.startsWith('video/')) return <FileVideo className="w-4 h-4" />;
    if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="w-4 h-4" />;
    if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('text')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const getFileTypeColor = (fileType: string) => {
    if (fileType.startsWith('image/')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (fileType.startsWith('audio/')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    if (fileType.startsWith('video/')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (fileType.includes('pdf')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (fileType.includes('document') || fileType.includes('word')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (fileType.includes('text')) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    if (fileType.includes('zip') || fileType.includes('rar')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const downloadFile = async (file: UploadedFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('assignment-submissions')
        .download(file.path);

      if (error) {
        throw error;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: `${file.name} is being downloaded`
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download failed",
        description: `Failed to download ${file.name}`,
        variant: "destructive"
      });
    }
  };

  const previewFile = async (file: UploadedFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('assignment-submissions')
        .createSignedUrl(file.path, 3600); // 1 hour expiry

      if (error) {
        throw error;
      }

      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Preview failed:', error);
      toast({
        title: "Preview failed",
        description: `Failed to preview ${file.name}`,
        variant: "destructive"
      });
    }
  };

  if (!files || files.length === 0) {
    return (
      <div className={`text-center p-6 text-muted-foreground ${className}`}>
        <Paperclip className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No files uploaded</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Paperclip className="w-4 h-4" />
        <h4 className="font-medium">Uploaded Files ({files.length})</h4>
      </div>
      
      {files.map((file, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {getFileIcon(file.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" title={file.name}>
                    {file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={`text-xs ${getFileTypeColor(file.type)}`}>
                      {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {(file.type.startsWith('image/') || file.type.includes('pdf') || file.type.startsWith('text/')) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => previewFile(file)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Preview
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadFile(file)}
                  className="flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Download
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};