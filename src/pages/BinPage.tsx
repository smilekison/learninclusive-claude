import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Archive, RotateCcw, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTeacherDeletedItems, useDeletedItems, useRestoreItem, usePermanentDelete } from '@/hooks/useSupabaseQuery';
import { useAuth } from '@/contexts/AuthContext';

export const BinPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Use teacher-specific data for teachers, all-deleted-items for principals.
  // Both hooks are called unconditionally on every render — calling only one
  // of them based on user.role violates React's rules of hooks (the set of
  // hooks called must be identical across renders), which becomes a real bug
  // the moment `user` changes role or resolves from null after login.
  const teacherDeletedItems = useTeacherDeletedItems();
  const allDeletedItems = useDeletedItems();
  const { data: deletedItems = [], isLoading } = user?.role === 'teacher'
    ? teacherDeletedItems
    : allDeletedItems;
    
  const restoreItemMutation = useRestoreItem();
  const permanentDeleteMutation = usePermanentDelete();

  const [filterType, setFilterType] = useState<string>('all');

  const filteredItems = deletedItems.filter(item => 
    filterType === 'all' || item.item_type === filterType
  );

  const getTypeIcon = (type: string) => {
    const icons = {
      profiles: '👨‍🏫',
      student: '👨‍🎓',
      classes: '🏫',
      subjects: '📚',
      assignments: '📝'
    };
    return icons[type as keyof typeof icons] || '📄';
  };

  const getTypeColor = (type: string) => {
    const colors = {
      profiles: 'bg-blue-100 text-blue-800',
      student: 'bg-green-100 text-green-800',
      classes: 'bg-purple-100 text-purple-800',
      subjects: 'bg-orange-100 text-orange-800',
      assignments: 'bg-red-100 text-red-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleRestore = (itemId: string) => {
    restoreItemMutation.mutate(itemId);
  };

  const handlePermanentDelete = (itemId: string) => {
    if (confirm('Are you sure you want to permanently delete this item? This action cannot be undone.')) {
      permanentDeleteMutation.mutate(itemId);
    }
  };

  const handleEmptyBin = async () => {
    if (!confirm('Are you sure you want to empty the entire bin? This will permanently delete all items and cannot be undone.')) {
      return;
    }
    const idsToDelete = deletedItems.map(item => item.id);
    let failures = 0;
    for (const id of idsToDelete) {
      try {
        await permanentDeleteMutation.mutateAsync(id);
      } catch {
        failures++;
      }
    }
    if (failures > 0) {
      toast({
        title: "Empty Bin",
        description: `${idsToDelete.length - failures} of ${idsToDelete.length} items deleted; ${failures} failed.`,
        variant: "destructive"
      });
    }
  };

  const getItemCount = (type: string) => {
    return deletedItems.filter(item => item.item_type === type).length;
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Archive className="h-8 w-8" />
            {user?.role === 'teacher' ? 'My Recycle Bin' : 'Recycle Bin'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {user?.role === 'teacher' 
              ? 'Restore items you have deleted'
              : 'Restore or permanently delete removed items'
            }
          </p>
        </div>
        
        {deletedItems.length > 0 && (
          <Button variant="destructive" onClick={handleEmptyBin}>
            <Trash2 className="h-4 w-4 mr-2" />
            Empty Bin
          </Button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${filterType === 'all' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setFilterType('all')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">All Items</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deletedItems.length}</div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${filterType === 'profiles' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setFilterType('profiles')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <span className="text-lg">👨‍🏫</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getItemCount('profiles')}</div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${filterType === 'student' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setFilterType('student')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <span className="text-lg">👨‍🎓</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getItemCount('student')}</div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${filterType === 'classes' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setFilterType('classes')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes</CardTitle>
            <span className="text-lg">🏫</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getItemCount('classes')}</div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${filterType === 'subjects' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setFilterType('subjects')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <span className="text-lg">📚</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getItemCount('subjects')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Deleted Items List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Deleted Items ({filteredItems.length})
          </CardTitle>
          <CardDescription>
            Items can be restored within 30 days. After that, they will be permanently deleted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Archive className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {filterType === 'all' ? 'Bin is empty' : `No deleted ${filterType}`}
              </h3>
              <p className="text-muted-foreground">
                {filterType === 'all' 
                  ? 'No items in the recycle bin'
                  : `No ${filterType} have been deleted recently`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">
                      {getTypeIcon(item.item_type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{item.item_name}</h4>
                        <Badge variant="outline" className={getTypeColor(item.item_type)}>
                          {item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.item_details}
                      </p>
                      <div className="text-xs text-muted-foreground mt-1">
                        Deleted {new Date(item.deleted_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRestore(item.id)}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Restore
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handlePermanentDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-deletion Notice */}
      {deletedItems.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <Archive className="h-5 w-5" />
              <p className="text-sm">
                <strong>Note:</strong> Items in the bin will be automatically and permanently deleted after 30 days. 
                Restore important items before this deadline.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};