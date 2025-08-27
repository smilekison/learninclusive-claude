import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  FileText, 
  Download, 
  Eye, 
  Paperclip, 
  Image, 
  FileAudio, 
  FileVideo, 
  Archive,
  File,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw
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
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

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

  const handlePreviewFile = async (file: UploadedFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('assignment-submissions')
        .createSignedUrl(file.path, 3600); // 1 hour expiry

      if (error) {
        throw error;
      }

      // Enhanced preview with advanced viewer
      setPreviewFile(file);
      setPreviewUrl(data.signedUrl);
      setZoom(1);
      setRotation(0);
    } catch (error) {
      console.error('Preview failed:', error);
      toast({
        title: "Preview failed",
        description: `Failed to preview ${file.name}`,
        variant: "destructive"
      });
    }
  };

  const closePreview = () => {
    setPreviewFile(null);
    setPreviewUrl('');
    setZoom(1);
    setRotation(0);
  };

  const isPreviewableImage = (fileType: string) => {
    return fileType.startsWith('image/') && 
           ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'].includes(fileType);
  };

  const isPreviewablePDF = (fileType: string) => {
    return fileType === 'application/pdf';
  };

  const isPreviewableText = (fileType: string) => {
    return fileType.startsWith('text/') || 
           ['application/json', 'application/xml', 'text/plain', 'text/html', 'text/css', 'text/javascript'].includes(fileType);
  };

  const isPreviewableVideo = (fileType: string) => {
    return fileType.startsWith('video/') && 
           ['video/mp4', 'video/webm', 'video/ogg'].includes(fileType);
  };

  const isPreviewableAudio = (fileType: string) => {
    return fileType.startsWith('audio/') && 
           ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg'].includes(fileType);
  };

  const renderPreviewContent = () => {
    if (!previewFile || !previewUrl) return null;

    const { type } = previewFile;

    if (isPreviewableImage(type)) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-muted/30 rounded-lg overflow-hidden">
          <div className="flex gap-2 mb-4 z-10">
            <Button size="sm" variant="outline" onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setZoom(Math.min(3, zoom + 0.25))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setRotation((rotation + 90) % 360)}>
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>
          <img 
            src={previewUrl} 
            alt={previewFile.name}
            style={{ 
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease',
              maxWidth: '100%',
              maxHeight: '70vh'
            }}
            className="object-contain"
          />
        </div>
      );
    }

    if (isPreviewablePDF(type)) {
      return (
        <div className="w-full h-[70vh] bg-muted/30 rounded-lg overflow-hidden">
          <iframe 
            src={previewUrl} 
            className="w-full h-full border-0"
            title={`PDF Preview: ${previewFile.name}`}
          />
        </div>
      );
    }

    if (isPreviewableVideo(type)) {
      return (
        <div className="w-full max-w-4xl mx-auto bg-muted/30 rounded-lg overflow-hidden">
          <video 
            src={previewUrl} 
            controls 
            className="w-full h-auto max-h-[70vh]"
            style={{ maxWidth: '100%' }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (isPreviewableAudio(type)) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] bg-muted/30 rounded-lg p-8">
          <FileAudio className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-4">{previewFile.name}</h3>
          <audio 
            src={previewUrl} 
            controls 
            className="w-full max-w-md"
          >
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    }

    // For text files, we'd need to fetch content separately
    if (isPreviewableText(type)) {
      return (
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5" />
            <span className="font-medium">Text File Preview</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Click download to view the full content of this text file.
          </p>
        </div>
      );
    }

    // Default fallback for non-previewable files
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] bg-muted/30 rounded-lg p-8">
        {getFileIcon(type)}
        <h3 className="text-lg font-medium mt-4 mb-2">{previewFile.name}</h3>
        <p className="text-sm text-muted-foreground text-center mb-4">
          This file type cannot be previewed in the browser.
        </p>
        <Button onClick={() => downloadFile(previewFile)} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Download to View
        </Button>
      </div>
    );
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreviewFile(file)}
                  className="flex items-center gap-1"
                  title={`Preview ${file.name}`}
                >
                  <Eye className="w-3 h-3" />
                  Preview
                </Button>
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
      
      {/* Advanced File Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => closePreview()}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden" aria-describedby="file-preview-description">
          <div id="file-preview-description" className="sr-only">
            Advanced file preview dialog showing {previewFile?.name} with zoom, rotation and download controls
          </div>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                {previewFile && getFileIcon(previewFile.type)}
                Advanced File Preview: {previewFile?.name}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {previewFile?.type.split('/')[1]?.toUpperCase() || 'FILE'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {previewFile && formatFileSize(previewFile.size)}
                </Badge>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => previewFile && downloadFile(previewFile)}
                  className="flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Download
                </Button>
                <Button size="sm" variant="ghost" onClick={closePreview}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="overflow-auto max-h-[80vh]">
            {renderPreviewContent()}
          </div>
          
          {previewFile && (
            <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
              <span>File: {previewFile.name}</span>
              <span>Type: {previewFile.type}</span>
              <span>Size: {formatFileSize(previewFile.size)}</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};