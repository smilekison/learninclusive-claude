import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  UserPlus, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap,
  BookOpen,
  Settings,
  Calendar,
  FileText,
  Shield
} from 'lucide-react';
import { useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validatePassword } from '@/lib/validation';

interface TeacherFormData {
  // Basic Information
  firstName: string;
  lastName: string;
  email: string;
  tempPassword: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber: string;
  
  // Address Information
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Emergency Contacts
  emergencyContacts: Array<{
    name: string;
    relationship: string;
    phone: string;
    email: string;
  }>;
  
  // Professional Information
  qualifications: string;
  experience: string;
  specializations: string[];
  certifications: string;
  subjects: string[];
  
  // Accessibility & Preferences
  accessibilityNeeds: string[];
  communicationPreferences: {
    preferredLanguage: string;
    communicationMethod: string;
    emailNotifications: boolean;
  };
  
  // Additional Information
  notes: string;
}

const subjectAreas = [
  'Mathematics', 'English Language Arts', 'Science', 'Social Studies', 'History',
  'Physics', 'Chemistry', 'Biology', 'Geography', 'Art', 'Music', 'Physical Education',
  'Computer Science', 'Foreign Language', 'Special Education', 'Psychology'
];

const specializationAreas = [
  'Special Education', 'STEM Education', 'Language Arts', 'Mathematics',
  'Early Childhood', 'Middle School', 'High School', 'ESL/EFL',
  'Gifted Education', 'Autism Spectrum Disorders', 'Learning Disabilities',
  'Behavioral Interventions', 'Assistive Technology'
];

const accessibilityOptions = [
  'mobility_assistance', 'visual_accommodations', 'hearing_accommodations',
  'cognitive_support', 'communication_assistance', 'flexible_scheduling'
];

export const AddTeacherDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const { toast } = useToast();

  const [formData, setFormData] = useState<TeacherFormData>({
    firstName: '',
    lastName: '',
    email: '',
    tempPassword: 'TempPassword123!',
    dateOfBirth: '',
    gender: '',
    phoneNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    emergencyContacts: [{ name: '', relationship: '', phone: '', email: '' }],
    qualifications: '',
    experience: '',
    specializations: [],
    certifications: '',
    subjects: [],
    accessibilityNeeds: [],
    communicationPreferences: {
      preferredLanguage: 'english',
      communicationMethod: 'email',
      emailNotifications: true
    },
    notes: ''
  });

  const createTeacherMutation = useSupabaseMutation(
    async (teacherData: TeacherFormData) => {
      // Invoke secure edge function to create auth user and profile
      const { data, error } = await supabase.functions.invoke('create-teacher', {
        body: teacherData,
      });
      if (error) throw error;
      return { data, error: null } as any;
    },
    {
      successMessage: "Teacher created successfully",
      invalidateKeys: [['profiles'], ['profiles', 'teacher']],
      onSuccess: () => {
        setOpen(false);
        resetForm();
      }
    }
  );

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      tempPassword: 'TempPassword123!',
      dateOfBirth: '',
      gender: '',
      phoneNumber: '',
      address: { street: '', city: '', state: '', zipCode: '', country: '' },
      emergencyContacts: [{ name: '', relationship: '', phone: '', email: '' }],
      qualifications: '',
      experience: '',
      specializations: [],
      certifications: '',
      subjects: [],
      accessibilityNeeds: [],
      communicationPreferences: {
        preferredLanguage: 'english',
        communicationMethod: 'email',
        emailNotifications: true
      },
      notes: ''
    });
    setActiveTab('basic');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const passwordError = validatePassword(formData.tempPassword);
    if (passwordError) {
      toast({ title: 'Invalid password', description: passwordError, variant: 'destructive' });
      return;
    }
    try {
      await createTeacherMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Error creating teacher:', error);
    }
  };

  const addEmergencyContact = () => {
    setFormData({
      ...formData,
      emergencyContacts: [...formData.emergencyContacts, { name: '', relationship: '', phone: '', email: '' }]
    });
  };

  const removeEmergencyContact = (index: number) => {
    const newContacts = formData.emergencyContacts.filter((_, i) => i !== index);
    setFormData({ ...formData, emergencyContacts: newContacts });
  };

  const toggleSpecialization = (specialization: string, checked: boolean) => {
    const newSpecializations = checked 
      ? [...formData.specializations, specialization]
      : formData.specializations.filter(s => s !== specialization);
    setFormData({ ...formData, specializations: newSpecializations });
  };

  const toggleSubject = (subject: string, checked: boolean) => {
    const newSubjects = checked 
      ? [...formData.subjects, subject]
      : formData.subjects.filter(s => s !== subject);
    setFormData({ ...formData, subjects: newSubjects });
  };

  const toggleAccessibilityNeed = (need: string, checked: boolean) => {
    const newNeeds = checked 
      ? [...formData.accessibilityNeeds, need]
      : formData.accessibilityNeeds.filter(n => n !== need);
    setFormData({ ...formData, accessibilityNeeds: newNeeds });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add Teacher
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Teacher
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="professional">Professional</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
            <TabsTrigger value="additional">Additional</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[70vh] w-full">
            <form onSubmit={handleSubmit} className="space-y-6 p-1">
              
              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="tempPassword">Temporary Password *</Label>
                      <Input
                        id="tempPassword"
                        type="password"
                        value={formData.tempPassword}
                        onChange={(e) => setFormData({ ...formData, tempPassword: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="non-binary">Non-binary</SelectItem>
                          <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Address Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Address Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="street">Street Address</Label>
                      <Input
                        id="street"
                        value={formData.address.street}
                        onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.address.city}
                        onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        value={formData.address.state}
                        onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                      <Input
                        id="zipCode"
                        value={formData.address.zipCode}
                        onChange={(e) => setFormData({ ...formData, address: { ...formData.address, zipCode: e.target.value } })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={formData.address.country}
                        onChange={(e) => setFormData({ ...formData, address: { ...formData.address, country: e.target.value } })}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Emergency Contacts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Emergency Contacts
                    </CardTitle>
                    <CardDescription>
                      Add contacts who can be reached in case of emergency
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {formData.emergencyContacts.map((contact, index) => (
                      <div key={index} className="grid grid-cols-4 gap-4 mb-4 p-4 border rounded-lg">
                        <div>
                          <Label>Name</Label>
                          <Input
                            value={contact.name}
                            onChange={(e) => {
                              const newContacts = [...formData.emergencyContacts];
                              newContacts[index].name = e.target.value;
                              setFormData({ ...formData, emergencyContacts: newContacts });
                            }}
                          />
                        </div>
                        <div>
                          <Label>Relationship</Label>
                          <Input
                            value={contact.relationship}
                            onChange={(e) => {
                              const newContacts = [...formData.emergencyContacts];
                              newContacts[index].relationship = e.target.value;
                              setFormData({ ...formData, emergencyContacts: newContacts });
                            }}
                          />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input
                            value={contact.phone}
                            onChange={(e) => {
                              const newContacts = [...formData.emergencyContacts];
                              newContacts[index].phone = e.target.value;
                              setFormData({ ...formData, emergencyContacts: newContacts });
                            }}
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <Label>Email</Label>
                            <Input
                              value={contact.email}
                              onChange={(e) => {
                                const newContacts = [...formData.emergencyContacts];
                                newContacts[index].email = e.target.value;
                                setFormData({ ...formData, emergencyContacts: newContacts });
                              }}
                            />
                          </div>
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeEmergencyContact(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addEmergencyContact}
                      className="w-full"
                    >
                      Add Emergency Contact
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Professional Information Tab */}
              <TabsContent value="professional" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Professional Qualifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="qualifications">Education & Qualifications</Label>
                      <Textarea
                        id="qualifications"
                        value={formData.qualifications}
                        onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                        placeholder="List degrees, qualifications, and educational background"
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label htmlFor="experience">Teaching Experience</Label>
                      <Textarea
                        id="experience"
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        placeholder="Describe teaching experience, previous positions, and years of experience"
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label htmlFor="certifications">Certifications & Licenses</Label>
                      <Textarea
                        id="certifications"
                        value={formData.certifications}
                        onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                        placeholder="List teaching certifications, licenses, and professional credentials"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Specializations
                    </CardTitle>
                    <CardDescription>
                      Select areas of specialization and expertise
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {specializationAreas.map((specialization) => (
                        <div key={specialization} className="flex items-center space-x-2">
                          <Checkbox
                            checked={formData.specializations.includes(specialization)}
                            onCheckedChange={(checked) => toggleSpecialization(specialization, !!checked)}
                          />
                          <Label className="text-sm">{specialization}</Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Subjects Tab */}
              <TabsContent value="subjects" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Subject Areas
                    </CardTitle>
                    <CardDescription>
                      Select subjects that the teacher can teach
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      {subjectAreas.map((subject) => (
                        <div key={subject} className="flex items-center space-x-2">
                          <Checkbox
                            checked={formData.subjects.includes(subject)}
                            onCheckedChange={(checked) => toggleSubject(subject, !!checked)}
                          />
                          <Label className="text-sm">{subject}</Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Accessibility Tab */}
              <TabsContent value="accessibility" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Accessibility Needs
                    </CardTitle>
                    <CardDescription>
                      Select any accessibility accommodations needed
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {accessibilityOptions.map((need) => (
                        <div key={need} className="flex items-center space-x-2">
                          <Checkbox
                            checked={formData.accessibilityNeeds.includes(need)}
                            onCheckedChange={(checked) => toggleAccessibilityNeed(need, !!checked)}
                          />
                          <Label className="text-sm capitalize">
                            {need.replace(/_/g, ' ')}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Communication Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="preferredLanguage">Preferred Language</Label>
                      <Select 
                        value={formData.communicationPreferences.preferredLanguage} 
                        onValueChange={(value) => setFormData({ 
                          ...formData, 
                          communicationPreferences: { ...formData.communicationPreferences, preferredLanguage: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="spanish">Spanish</SelectItem>
                          <SelectItem value="french">French</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="communicationMethod">Preferred Communication Method</Label>
                      <Select 
                        value={formData.communicationPreferences.communicationMethod} 
                        onValueChange={(value) => setFormData({ 
                          ...formData, 
                          communicationPreferences: { ...formData.communicationPreferences, communicationMethod: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="text">Text Message</SelectItem>
                          <SelectItem value="in_person">In Person</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData.communicationPreferences.emailNotifications}
                          onCheckedChange={(checked) => setFormData({ 
                            ...formData, 
                            communicationPreferences: { ...formData.communicationPreferences, emailNotifications: !!checked }
                          })}
                        />
                        <Label>Receive email notifications</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Additional Information Tab */}
              <TabsContent value="additional" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Additional Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <Label htmlFor="notes">Notes & Additional Information</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Any additional information, special considerations, or notes about the teacher"
                        rows={6}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Summary</CardTitle>
                    <CardDescription>Review the information before creating the teacher account</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
                      <p><strong>Email:</strong> {formData.email}</p>
                      <p><strong>Subjects:</strong> {formData.subjects.join(', ') || 'None selected'}</p>
                      <p><strong>Specializations:</strong> {formData.specializations.join(', ') || 'None selected'}</p>
                      <p><strong>Temporary Password:</strong> {formData.tempPassword}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <div className="flex justify-end pt-6 border-t">
                <Button 
                  type="submit" 
                  disabled={createTeacherMutation.isPending || !formData.firstName || !formData.lastName || !formData.email}
                  className="min-w-32"
                >
                  {createTeacherMutation.isPending ? 'Creating...' : 'Create Teacher'}
                </Button>
              </div>
            </form>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};