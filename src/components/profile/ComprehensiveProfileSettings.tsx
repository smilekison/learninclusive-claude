import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Heart, 
  Shield, 
  Brain, 
  Eye, 
  Ear,
  Accessibility,
  AlertTriangle,
  FileText,
  Calendar,
  GraduationCap,
  Users,
  Activity,
  Target,
  Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  phoneNumber: z.string().optional(),
  gradeLevel: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  guardianName: z.string().optional(),
  guardianEmail: z.string().email().optional().or(z.literal('')),
  guardianPhone: z.string().optional(),
  emergencyContacts: z.array(z.object({
    name: z.string(),
    relationship: z.string(),
    phone: z.string(),
    email: z.string().email().optional().or(z.literal('')),
  })).optional(),
  disabilities: z.array(z.string()).optional(),
  disabilityDetails: z.object({
    primaryDisability: z.string().optional(),
    diagnosisDate: z.string().optional(),
    severity: z.string().optional(),
    description: z.string().optional(),
  }).optional(),
  medicalInformation: z.object({
    allergies: z.string().optional(),
    medications: z.string().optional(),
    medicalConditions: z.string().optional(),
    emergencyMedicalInfo: z.string().optional(),
  }).optional(),
  accommodationsNeeded: z.array(z.string()).optional(),
  assistiveTechnology: z.array(z.string()).optional(),
  supportServices: z.array(z.string()).optional(),
  learningPreferences: z.object({
    learningStyle: z.string().optional(),
    communicationMethod: z.string().optional(),
    attentionSpan: z.string().optional(),
    processingSpeed: z.string().optional(),
  }).optional(),
  accessibilityPreferences: z.object({
    fontSize: z.string().optional(),
    highContrast: z.boolean().optional(),
    screenReader: z.boolean().optional(),
    voiceCommands: z.boolean().optional(),
    subtitles: z.boolean().optional(),
  }).optional(),
  communicationPreferences: z.object({
    preferredLanguage: z.string().optional(),
    communicationMethod: z.string().optional(),
    parentalCommunication: z.string().optional(),
  }).optional(),
  iepStatus: z.boolean().optional(),
  iepDocumentPath: z.string().optional(),
  notes: z.string().optional(),
  schoolName: z.string().optional(),
  parentEmail: z.string().email().optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const disabilityTypes = [
  { value: 'visual_impairment', label: 'Visual Impairment', icon: Eye },
  { value: 'hearing_impairment', label: 'Hearing Impairment', icon: Ear },
  { value: 'physical_disability', label: 'Physical Disability', icon: Accessibility },
  { value: 'cognitive_disability', label: 'Cognitive Disability', icon: Brain },
  { value: 'learning_disability', label: 'Learning Disability', icon: GraduationCap },
  { value: 'autism_spectrum', label: 'Autism Spectrum Disorder', icon: Activity },
  { value: 'adhd', label: 'ADHD', icon: Target },
  { value: 'speech_language_disorder', label: 'Speech/Language Disorder', icon: Users },
  { value: 'emotional_behavioral_disorder', label: 'Emotional/Behavioral Disorder', icon: Heart },
  { value: 'multiple_disabilities', label: 'Multiple Disabilities', icon: Shield },
  { value: 'traumatic_brain_injury', label: 'Traumatic Brain Injury', icon: AlertTriangle },
  { value: 'other', label: 'Other', icon: FileText },
];

const accommodationTypes = [
  'extended_time', 'reduced_distractions', 'large_print', 'screen_reader',
  'sign_language_interpreter', 'note_taker', 'alternative_format',
  'assistive_technology', 'frequent_breaks', 'preferential_seating',
  'modified_assignments', 'oral_testing', 'calculator_allowed', 'spell_check_allowed'
];

const supportServiceTypes = [
  'speech_therapy', 'occupational_therapy', 'physical_therapy', 'counseling',
  'tutoring', 'behavioral_support', 'mobility_assistance', 'communication_assistance',
  'academic_coaching', 'social_skills_training', 'transition_services'
];

export const ComprehensiveProfileSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basic');
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      phoneNumber: '',
      gradeLevel: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      guardianName: '',
      guardianEmail: '',
      guardianPhone: '',
      emergencyContacts: [{ name: '', relationship: '', phone: '', email: '' }],
      disabilities: [],
      disabilityDetails: {
        primaryDisability: '',
        diagnosisDate: '',
        severity: '',
        description: ''
      },
      medicalInformation: {
        allergies: '',
        medications: '',
        medicalConditions: '',
        emergencyMedicalInfo: ''
      },
      accommodationsNeeded: [],
      assistiveTechnology: [],
      supportServices: [],
      learningPreferences: {
        learningStyle: '',
        communicationMethod: '',
        attentionSpan: '',
        processingSpeed: ''
      },
      accessibilityPreferences: {
        fontSize: 'medium',
        highContrast: false,
        screenReader: false,
        voiceCommands: false,
        subtitles: false
      },
      communicationPreferences: {
        preferredLanguage: 'english',
        communicationMethod: 'verbal',
        parentalCommunication: 'email'
      },
      iepStatus: false,
      iepDocumentPath: '',
      notes: '',
      schoolName: '',
      parentEmail: '',
    },
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (profile) {
          form.reset({
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            dateOfBirth: profile.date_of_birth || '',
            gender: profile.gender || '',
            phoneNumber: profile.phone_number || '',
            gradeLevel: profile.grade_level || '',
            address: (profile.address as any) || {},
            guardianName: profile.guardian_name || '',
            guardianEmail: profile.guardian_email || '',
            guardianPhone: profile.guardian_phone || '',
            emergencyContacts: (profile.emergency_contacts as any) || [{ name: '', relationship: '', phone: '', email: '' }],
            disabilities: (profile.disabilities as string[]) || [],
            disabilityDetails: (profile.disability_details as any) || {},
            medicalInformation: (profile.medical_information as any) || {},
            accommodationsNeeded: (profile.accommodations_needed as string[]) || [],
            assistiveTechnology: (profile.assistive_technology as string[]) || [],
            supportServices: (profile.support_services as string[]) || [],
            learningPreferences: (profile.learning_preferences as any) || {},
            accessibilityPreferences: (profile.accessibility_preferences as any) || {},
            communicationPreferences: (profile.communication_preferences as any) || {},
            iepStatus: profile.iep_status || false,
            iepDocumentPath: profile.iep_document_path || '',
            notes: profile.notes || '',
            schoolName: profile.school_name || '',
            parentEmail: profile.parent_email || '',
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user, form, toast]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    try {
      const updateData = {
        first_name: data.firstName,
        last_name: data.lastName,
        date_of_birth: data.dateOfBirth || null,
        gender: data.gender || null,
        phone_number: data.phoneNumber || null,
        grade_level: data.gradeLevel || null,
        address: data.address || {},
        guardian_name: data.guardianName || null,
        guardian_email: data.guardianEmail || null,
        guardian_phone: data.guardianPhone || null,
        emergency_contacts: data.emergencyContacts || [],
        disabilities: data.disabilities || [],
        disability_details: data.disabilityDetails || {},
        medical_information: data.medicalInformation || {},
        accommodations_needed: data.accommodationsNeeded || [],
        assistive_technology: data.assistiveTechnology || [],
        support_services: data.supportServices || [],
        learning_preferences: data.learningPreferences || {},
        accessibility_preferences: data.accessibilityPreferences || {},
        communication_preferences: data.communicationPreferences || {},
        iep_status: data.iepStatus || false,
        iep_document_path: data.iepDocumentPath || null,
        notes: data.notes || null,
        school_name: data.schoolName || null,
        parent_email: data.parentEmail || null,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error: any) {
      console.error('Profile update failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    }
  };

  const toggleDisability = (disability: string, checked: boolean) => {
    const currentDisabilities = form.watch('disabilities') || [];
    const newDisabilities = checked 
      ? [...currentDisabilities, disability]
      : currentDisabilities.filter(d => d !== disability);
    
    form.setValue('disabilities', newDisabilities);
  };

  const toggleAccommodation = (accommodation: string, checked: boolean) => {
    const currentAccommodations = form.watch('accommodationsNeeded') || [];
    const newAccommodations = checked
      ? [...currentAccommodations, accommodation]
      : currentAccommodations.filter(a => a !== accommodation);
    
    form.setValue('accommodationsNeeded', newAccommodations);
  };

  const toggleSupportService = (service: string, checked: boolean) => {
    const currentServices = form.watch('supportServices') || [];
    const newServices = checked
      ? [...currentServices, service]
      : currentServices.filter(s => s !== service);
    
    form.setValue('supportServices', newServices);
  };

  const addEmergencyContact = () => {
    const currentContacts = form.watch('emergencyContacts') || [];
    form.setValue('emergencyContacts', [...currentContacts, { name: '', relationship: '', phone: '', email: '' }]);
  };

  const removeEmergencyContact = (index: number) => {
    const currentContacts = form.watch('emergencyContacts') || [];
    form.setValue('emergencyContacts', currentContacts.filter((_, i) => i !== index));
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'principal': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'teacher': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'student': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'parent': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (!user || isLoading) return null;

  const emergencyContacts = form.watch('emergencyContacts') || [];
  const disabilities = form.watch('disabilities') || [];
  const accommodationsNeeded = form.watch('accommodationsNeeded') || [];
  const supportServices = form.watch('supportServices') || [];

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Settings className="h-6 w-6" />
          Comprehensive Profile Settings
          <Badge className={getRoleBadgeColor(user.role)}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </Badge>
        </CardTitle>
        <CardDescription>
          Manage your complete profile information and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="disability">Disability</TabsTrigger>
            <TabsTrigger value="medical">Medical</TabsTrigger>
            <TabsTrigger value="accommodations">Accommodations</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[70vh] w-full">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
              
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
                        {...form.register('firstName')}
                        className="w-full"
                      />
                      {form.formState.errors.firstName && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        {...form.register('lastName')}
                        className="w-full"
                      />
                      {form.formState.errors.lastName && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.lastName.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full bg-muted"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Email cannot be changed. Contact administrator if needed.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        {...form.register('dateOfBirth')}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={form.watch('gender')} onValueChange={(value) => form.setValue('gender', value)}>
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
                        {...form.register('phoneNumber')}
                        className="w-full"
                      />
                    </div>
                    {user.role === 'student' && (
                      <div>
                        <Label htmlFor="gradeLevel">Grade Level</Label>
                        <Select value={form.watch('gradeLevel')} onValueChange={(value) => form.setValue('gradeLevel', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => (
                              <SelectItem key={i + 1} value={`${i + 1}`}>Grade {i + 1}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {user.role === 'principal' && (
                      <div>
                        <Label htmlFor="schoolName">School Name</Label>
                        <Input
                          id="schoolName"
                          {...form.register('schoolName')}
                          placeholder="Enter school name"
                          className="w-full"
                        />
                      </div>
                    )}
                    {user.role === 'student' && (
                      <div>
                        <Label htmlFor="parentEmail">Parent Email</Label>
                        <Input
                          id="parentEmail"
                          type="email"
                          {...form.register('parentEmail')}
                          placeholder="parent@example.com"
                          className="w-full"
                        />
                      </div>
                    )}
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
                        {...form.register('address.street')}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        {...form.register('address.city')}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        {...form.register('address.state')}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                      <Input
                        id="zipCode"
                        {...form.register('address.zipCode')}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        {...form.register('address.country')}
                        className="w-full"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Guardian Information (for students) */}
                {user.role === 'student' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Guardian Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="guardianName">Guardian Name</Label>
                        <Input
                          id="guardianName"
                          {...form.register('guardianName')}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Label htmlFor="guardianEmail">Guardian Email</Label>
                        <Input
                          id="guardianEmail"
                          type="email"
                          {...form.register('guardianEmail')}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Label htmlFor="guardianPhone">Guardian Phone</Label>
                        <Input
                          id="guardianPhone"
                          {...form.register('guardianPhone')}
                          className="w-full"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Emergency Contacts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Emergency Contacts
                    </CardTitle>
                    <CardDescription>
                      Add contacts who can be reached in case of emergency
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {emergencyContacts.map((contact, index) => (
                      <div key={index} className="grid grid-cols-4 gap-4 mb-4 p-4 border rounded-lg">
                        <div>
                          <Label>Name</Label>
                          <Input
                            value={contact.name}
                            onChange={(e) => {
                              const newContacts = [...emergencyContacts];
                              newContacts[index].name = e.target.value;
                              form.setValue('emergencyContacts', newContacts);
                            }}
                          />
                        </div>
                        <div>
                          <Label>Relationship</Label>
                          <Input
                            value={contact.relationship}
                            onChange={(e) => {
                              const newContacts = [...emergencyContacts];
                              newContacts[index].relationship = e.target.value;
                              form.setValue('emergencyContacts', newContacts);
                            }}
                          />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input
                            value={contact.phone}
                            onChange={(e) => {
                              const newContacts = [...emergencyContacts];
                              newContacts[index].phone = e.target.value;
                              form.setValue('emergencyContacts', newContacts);
                            }}
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <Label>Email</Label>
                            <Input
                              value={contact.email}
                              onChange={(e) => {
                                const newContacts = [...emergencyContacts];
                                newContacts[index].email = e.target.value;
                                form.setValue('emergencyContacts', newContacts);
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

              {/* Disability Information Tab */}
              <TabsContent value="disability" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Accessibility className="h-5 w-5" />
                      Disability Information
                    </CardTitle>
                    <CardDescription>
                      Select all disabilities that apply and provide additional details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {disabilityTypes.map((disability) => {
                        const IconComponent = disability.icon;
                        return (
                          <div
                            key={disability.value}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              disabilities.includes(disability.value)
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:bg-muted/50'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                checked={disabilities.includes(disability.value)}
                                onCheckedChange={(checked) => toggleDisability(disability.value, !!checked)}
                              />
                              <IconComponent className="h-5 w-5" />
                              <span className="font-medium">{disability.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <Separator className="my-6" />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="primaryDisability">Primary Disability</Label>
                        <Select
                          value={form.watch('disabilityDetails.primaryDisability')}
                          onValueChange={(value) => form.setValue('disabilityDetails.primaryDisability', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select primary disability" />
                          </SelectTrigger>
                          <SelectContent>
                            {disabilityTypes.map((disability) => (
                              <SelectItem key={disability.value} value={disability.value}>
                                {disability.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="severity">Severity Level</Label>
                        <Select
                          value={form.watch('disabilityDetails.severity')}
                          onValueChange={(value) => form.setValue('disabilityDetails.severity', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select severity" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mild">Mild</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="severe">Severe</SelectItem>
                            <SelectItem value="profound">Profound</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="diagnosisDate">Diagnosis Date</Label>
                        <Input
                          id="diagnosisDate"
                          type="date"
                          {...form.register('disabilityDetails.diagnosisDate')}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="disabilityDescription">Description</Label>
                        <Textarea
                          id="disabilityDescription"
                          {...form.register('disabilityDetails.description')}
                          placeholder="Provide additional details about the disability"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Medical Information Tab */}
              <TabsContent value="medical" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      Medical Information
                    </CardTitle>
                    <CardDescription>
                      Important medical information for care and safety
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="allergies">Allergies</Label>
                      <Textarea
                        id="allergies"
                        {...form.register('medicalInformation.allergies')}
                        placeholder="List any known allergies"
                      />
                    </div>
                    <div>
                      <Label htmlFor="medications">Current Medications</Label>
                      <Textarea
                        id="medications"
                        {...form.register('medicalInformation.medications')}
                        placeholder="List current medications and dosages"
                      />
                    </div>
                    <div>
                      <Label htmlFor="medicalConditions">Medical Conditions</Label>
                      <Textarea
                        id="medicalConditions"
                        {...form.register('medicalInformation.medicalConditions')}
                        placeholder="List any medical conditions"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergencyMedicalInfo">Emergency Medical Information</Label>
                      <Textarea
                        id="emergencyMedicalInfo"
                        {...form.register('medicalInformation.emergencyMedicalInfo')}
                        placeholder="Critical medical information for emergencies"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      IEP Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox
                        checked={form.watch('iepStatus')}
                        onCheckedChange={(checked) => form.setValue('iepStatus', Boolean(checked))}
                      />
                      <Label>Student has an IEP (Individualized Education Program)</Label>
                    </div>

                    {form.watch('iepStatus') && (
                      <div>
                        <Label htmlFor="iepDocumentPath">IEP Document Path/Reference</Label>
                        <Input
                          id="iepDocumentPath"
                          {...form.register('iepDocumentPath')}
                          placeholder="Path or reference to IEP document"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Accommodations Tab */}
              <TabsContent value="accommodations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Accommodations Needed
                    </CardTitle>
                    <CardDescription>
                      Select accommodations that help with learning and participation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {accommodationTypes.map((accommodation) => (
                        <div key={accommodation} className="flex items-center space-x-2">
                          <Checkbox
                            checked={accommodationsNeeded.includes(accommodation)}
                            onCheckedChange={(checked) => toggleAccommodation(accommodation, !!checked)}
                          />
                          <Label className="text-sm capitalize">
                            {accommodation.replace(/_/g, ' ')}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Assistive Technology</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      {...form.register('assistiveTechnology.0')}
                      placeholder="List any assistive technology devices or software used"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Support Services Tab */}
              <TabsContent value="support" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Support Services
                    </CardTitle>
                    <CardDescription>
                      Select support services that are being received or needed
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {supportServiceTypes.map((service) => (
                        <div key={service} className="flex items-center space-x-2">
                          <Checkbox
                            checked={supportServices.includes(service)}
                            onCheckedChange={(checked) => toggleSupportService(service, !!checked)}
                          />
                          <Label className="text-sm capitalize">
                            {service.replace(/_/g, ' ')}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Preferences Tab */}
              <TabsContent value="preferences" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      Learning Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="learningStyle">Learning Style</Label>
                      <Select
                        value={form.watch('learningPreferences.learningStyle')}
                        onValueChange={(value) => form.setValue('learningPreferences.learningStyle', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select learning style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="visual">Visual</SelectItem>
                          <SelectItem value="auditory">Auditory</SelectItem>
                          <SelectItem value="kinesthetic">Kinesthetic</SelectItem>
                          <SelectItem value="mixed">Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="communicationMethod">Communication Method</Label>
                      <Select
                        value={form.watch('learningPreferences.communicationMethod')}
                        onValueChange={(value) => form.setValue('learningPreferences.communicationMethod', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="verbal">Verbal</SelectItem>
                          <SelectItem value="written">Written</SelectItem>
                          <SelectItem value="sign_language">Sign Language</SelectItem>
                          <SelectItem value="technology_assisted">Technology Assisted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Accessibility Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={form.watch('accessibilityPreferences.highContrast')}
                          onCheckedChange={(checked) => form.setValue('accessibilityPreferences.highContrast', Boolean(checked))}
                        />
                        <Label>High Contrast Mode</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={form.watch('accessibilityPreferences.screenReader')}
                          onCheckedChange={(checked) => form.setValue('accessibilityPreferences.screenReader', Boolean(checked))}
                        />
                        <Label>Screen Reader Compatible</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={form.watch('accessibilityPreferences.voiceCommands')}
                          onCheckedChange={(checked) => form.setValue('accessibilityPreferences.voiceCommands', Boolean(checked))}
                        />
                        <Label>Voice Commands</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={form.watch('accessibilityPreferences.subtitles')}
                          onCheckedChange={(checked) => form.setValue('accessibilityPreferences.subtitles', Boolean(checked))}
                        />
                        <Label>Subtitles/Captions</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Additional Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      {...form.register('notes')}
                      placeholder="Any additional information or special considerations"
                      rows={4}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <div className="flex justify-end pt-6 border-t">
                <Button 
                  type="submit" 
                  disabled={form.formState.isSubmitting}
                  className="min-w-32"
                >
                  {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
};