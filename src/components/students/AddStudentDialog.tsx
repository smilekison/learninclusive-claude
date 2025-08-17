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
  Heart, 
  Shield, 
  Brain, 
  Eye, 
  Ear,
  Accessibility,
  AlertTriangle,
  FileText,
  Phone,
  Mail,
  Calendar,
  MapPin,
  GraduationCap,
  Users,
  Activity,
  Target
} from 'lucide-react';
import { useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StudentFormData {
  // Basic Information
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber: string;
  gradeLevel: string;
  enrollmentDate: string;
  
  // Address Information
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Guardian Information
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  
  // Emergency Contacts
  emergencyContacts: Array<{
    name: string;
    relationship: string;
    phone: string;
    email: string;
  }>;
  
  // Disability Information
  disabilities: string[];
  disabilityDetails: {
    primaryDisability: string;
    diagnosisDate: string;
    severity: string;
    description: string;
  };
  
  // Medical Information
  medicalInformation: {
    allergies: string;
    medications: string;
    medicalConditions: string;
    emergencyMedicalInfo: string;
  };
  
  // Accommodations
  accommodationsNeeded: string[];
  assistiveTechnology: string[];
  
  // Support Services
  supportServices: string[];
  
  // Learning Preferences
  learningPreferences: {
    learningStyle: string;
    communicationMethod: string;
    attentionSpan: string;
    processingSpeed: string;
  };
  
  // Accessibility Preferences
  accessibilityPreferences: {
    fontSize: string;
    highContrast: boolean;
    screenReader: boolean;
    voiceCommands: boolean;
    subtitles: boolean;
  };
  
  // Communication Preferences
  communicationPreferences: {
    preferredLanguage: string;
    communicationMethod: string;
    parentalCommunication: string;
  };
  
  // IEP Information
  iepStatus: boolean;
  iepDocumentPath: string;
  
  // Additional Notes
  notes: string;
}

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

export const AddStudentDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const { toast } = useToast();

  const [formData, setFormData] = useState<StudentFormData>({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    phoneNumber: '',
    gradeLevel: '',
    enrollmentDate: new Date().toISOString().split('T')[0],
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
    notes: ''
  });

  const createStudentMutation = useSupabaseMutation(
    async (studentData: StudentFormData) => {
      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: studentData.email,
        password: 'TempPassword123!', // Temporary password - should be changed on first login
        email_confirm: true,
        user_metadata: {
          first_name: studentData.firstName,
          last_name: studentData.lastName,
          role: 'student'
        }
      });

      if (authError) throw authError;

      // Create student profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          first_name: studentData.firstName,
          last_name: studentData.lastName,
          role: 'student',
          email: studentData.email,
          date_of_birth: studentData.dateOfBirth,
          gender: studentData.gender,
          phone_number: studentData.phoneNumber,
          grade_level: studentData.gradeLevel,
          enrollment_date: studentData.enrollmentDate,
          guardian_name: studentData.guardianName,
          guardian_email: studentData.guardianEmail,
          guardian_phone: studentData.guardianPhone,
          address: studentData.address,
          emergency_contacts: studentData.emergencyContacts,
          disabilities: studentData.disabilities,
          disability_details: studentData.disabilityDetails,
          medical_information: studentData.medicalInformation,
          accommodations_needed: studentData.accommodationsNeeded,
          assistive_technology: studentData.assistiveTechnology,
          support_services: studentData.supportServices,
          learning_preferences: studentData.learningPreferences,
          accessibility_preferences: studentData.accessibilityPreferences,
          communication_preferences: studentData.communicationPreferences,
          iep_status: studentData.iepStatus,
          iep_document_path: studentData.iepDocumentPath,
          notes: studentData.notes
        })
        .select()
        .single();

      if (profileError) throw profileError;

      return { data: profile, error: null };
    },
    {
      successMessage: "Student created successfully",
      invalidateKeys: [['profiles'], ['teacher-students']]
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createStudentMutation.mutateAsync(formData);
      setOpen(false);
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        dateOfBirth: '',
        gender: '',
        phoneNumber: '',
        gradeLevel: '',
        enrollmentDate: new Date().toISOString().split('T')[0],
        address: { street: '', city: '', state: '', zipCode: '', country: '' },
        guardianName: '',
        guardianEmail: '',
        guardianPhone: '',
        emergencyContacts: [{ name: '', relationship: '', phone: '', email: '' }],
        disabilities: [],
        disabilityDetails: { primaryDisability: '', diagnosisDate: '', severity: '', description: '' },
        medicalInformation: { allergies: '', medications: '', medicalConditions: '', emergencyMedicalInfo: '' },
        accommodationsNeeded: [],
        assistiveTechnology: [],
        supportServices: [],
        learningPreferences: { learningStyle: '', communicationMethod: '', attentionSpan: '', processingSpeed: '' },
        accessibilityPreferences: { fontSize: 'medium', highContrast: false, screenReader: false, voiceCommands: false, subtitles: false },
        communicationPreferences: { preferredLanguage: 'english', communicationMethod: 'verbal', parentalCommunication: 'email' },
        iepStatus: false,
        iepDocumentPath: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error creating student:', error);
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

  const toggleDisability = (disability: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      disabilities: checked 
        ? [...prev.disabilities, disability]
        : prev.disabilities.filter(d => d !== disability)
    }));
  };

  const toggleAccommodation = (accommodation: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      accommodationsNeeded: checked
        ? [...prev.accommodationsNeeded, accommodation]
        : prev.accommodationsNeeded.filter(a => a !== accommodation)
    }));
  };

  const toggleSupportService = (service: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      supportServices: checked
        ? [...prev.supportServices, service]
        : prev.supportServices.filter(s => s !== service)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Student
          </DialogTitle>
        </DialogHeader>

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
            <form onSubmit={handleSubmit} className="space-y-6 p-1">
              
              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      Basic Information
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
                    <div>
                      <Label htmlFor="gradeLevel">Grade Level</Label>
                      <Select value={formData.gradeLevel} onValueChange={(value) => setFormData({ ...formData, gradeLevel: value })}>
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
                    <div>
                      <Label htmlFor="enrollmentDate">Enrollment Date</Label>
                      <Input
                        id="enrollmentDate"
                        type="date"
                        value={formData.enrollmentDate}
                        onChange={(e) => setFormData({ ...formData, enrollmentDate: e.target.value })}
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
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, street: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.address.city}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, city: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        value={formData.address.state}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, state: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                      <Input
                        id="zipCode"
                        value={formData.address.zipCode}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, zipCode: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={formData.address.country}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, country: e.target.value }
                        })}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Guardian Information */}
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
                        value={formData.guardianName}
                        onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="guardianEmail">Guardian Email</Label>
                      <Input
                        id="guardianEmail"
                        type="email"
                        value={formData.guardianEmail}
                        onChange={(e) => setFormData({ ...formData, guardianEmail: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="guardianPhone">Guardian Phone</Label>
                      <Input
                        id="guardianPhone"
                        value={formData.guardianPhone}
                        onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
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
                    <Button type="button" variant="outline" size="sm" onClick={addEmergencyContact}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contact
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.emergencyContacts.map((contact, index) => (
                      <div key={index} className="grid grid-cols-4 gap-4 p-4 border rounded-lg">
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
                              formData.disabilities.includes(disability.value)
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:bg-muted/50'
                            }`}
                            onClick={() => toggleDisability(disability.value, !formData.disabilities.includes(disability.value))}
                          >
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                checked={formData.disabilities.includes(disability.value)}
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
                          value={formData.disabilityDetails.primaryDisability}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            disabilityDetails: { ...formData.disabilityDetails, primaryDisability: value }
                          })}
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
                          value={formData.disabilityDetails.severity}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            disabilityDetails: { ...formData.disabilityDetails, severity: value }
                          })}
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
                          value={formData.disabilityDetails.diagnosisDate}
                          onChange={(e) => setFormData({
                            ...formData,
                            disabilityDetails: { ...formData.disabilityDetails, diagnosisDate: e.target.value }
                          })}
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <Label htmlFor="disabilityDescription">Detailed Description</Label>
                      <Textarea
                        id="disabilityDescription"
                        placeholder="Provide detailed information about the student's disability, including how it affects their learning..."
                        value={formData.disabilityDetails.description}
                        onChange={(e) => setFormData({
                          ...formData,
                          disabilityDetails: { ...formData.disabilityDetails, description: e.target.value }
                        })}
                        rows={4}
                      />
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
                      Important medical information for the student's safety and care
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="allergies">Allergies</Label>
                      <Textarea
                        id="allergies"
                        placeholder="List any known allergies (food, environmental, medication, etc.)"
                        value={formData.medicalInformation.allergies}
                        onChange={(e) => setFormData({
                          ...formData,
                          medicalInformation: { ...formData.medicalInformation, allergies: e.target.value }
                        })}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="medications">Current Medications</Label>
                      <Textarea
                        id="medications"
                        placeholder="List current medications, dosages, and administration times"
                        value={formData.medicalInformation.medications}
                        onChange={(e) => setFormData({
                          ...formData,
                          medicalInformation: { ...formData.medicalInformation, medications: e.target.value }
                        })}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="medicalConditions">Medical Conditions</Label>
                      <Textarea
                        id="medicalConditions"
                        placeholder="List any medical conditions that may affect learning or require attention"
                        value={formData.medicalInformation.medicalConditions}
                        onChange={(e) => setFormData({
                          ...formData,
                          medicalInformation: { ...formData.medicalInformation, medicalConditions: e.target.value }
                        })}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergencyMedicalInfo">Emergency Medical Information</Label>
                      <Textarea
                        id="emergencyMedicalInfo"
                        placeholder="Critical medical information for emergencies"
                        value={formData.medicalInformation.emergencyMedicalInfo}
                        onChange={(e) => setFormData({
                          ...formData,
                          medicalInformation: { ...formData.medicalInformation, emergencyMedicalInfo: e.target.value }
                        })}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Accommodations Tab */}
              <TabsContent value="accommodations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Accommodations & Assistive Technology
                    </CardTitle>
                    <CardDescription>
                      Select accommodations and assistive technology needed for the student
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <Label className="text-base font-semibold">Accommodations Needed</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {accommodationTypes.map((accommodation) => (
                            <div key={accommodation} className="flex items-center space-x-2">
                              <Checkbox
                                checked={formData.accommodationsNeeded.includes(accommodation)}
                                onCheckedChange={(checked) => toggleAccommodation(accommodation, !!checked)}
                              />
                              <Label className="text-sm capitalize">
                                {accommodation.replace(/_/g, ' ')}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <Label htmlFor="assistiveTechnology" className="text-base font-semibold">Assistive Technology</Label>
                        <Textarea
                          id="assistiveTechnology"
                          placeholder="List specific assistive technology devices, software, or tools the student uses"
                          value={formData.assistiveTechnology.join('\n')}
                          onChange={(e) => setFormData({
                            ...formData,
                            assistiveTechnology: e.target.value.split('\n').filter(Boolean)
                          })}
                          rows={4}
                          className="mt-2"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData.iepStatus}
                          onCheckedChange={(checked) => setFormData({ ...formData, iepStatus: Boolean(checked) })}
                        />
                        <Label>Student has an IEP (Individualized Education Program)</Label>
                      </div>

                      {formData.iepStatus && (
                        <div>
                          <Label htmlFor="iepDocument">IEP Document Path</Label>
                          <Input
                            id="iepDocument"
                            placeholder="Path or reference to IEP document"
                            value={formData.iepDocumentPath}
                            onChange={(e) => setFormData({ ...formData, iepDocumentPath: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
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
                      Select support services the student receives or needs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {supportServiceTypes.map((service) => (
                        <div key={service} className="flex items-center space-x-2">
                          <Checkbox
                            checked={formData.supportServices.includes(service)}
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
                        value={formData.learningPreferences.learningStyle}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          learningPreferences: { ...formData.learningPreferences, learningStyle: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select learning style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="visual">Visual</SelectItem>
                          <SelectItem value="auditory">Auditory</SelectItem>
                          <SelectItem value="kinesthetic">Kinesthetic</SelectItem>
                          <SelectItem value="multimodal">Multimodal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="attentionSpan">Attention Span</Label>
                      <Select
                        value={formData.learningPreferences.attentionSpan}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          learningPreferences: { ...formData.learningPreferences, attentionSpan: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select attention span" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">Short (5-10 minutes)</SelectItem>
                          <SelectItem value="medium">Medium (10-20 minutes)</SelectItem>
                          <SelectItem value="long">Long (20+ minutes)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="processingSpeed">Processing Speed</Label>
                      <Select
                        value={formData.learningPreferences.processingSpeed}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          learningPreferences: { ...formData.learningPreferences, processingSpeed: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select processing speed" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="slow">Slow</SelectItem>
                          <SelectItem value="average">Average</SelectItem>
                          <SelectItem value="fast">Fast</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Preferences Tab */}
              <TabsContent value="preferences" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Accessibility Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fontSize">Font Size</Label>
                        <Select
                          value={formData.accessibilityPreferences.fontSize}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            accessibilityPreferences: { ...formData.accessibilityPreferences, fontSize: value }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                            <SelectItem value="extra-large">Extra Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData.accessibilityPreferences.highContrast}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            accessibilityPreferences: { ...formData.accessibilityPreferences, highContrast: Boolean(checked) }
                          })}
                        />
                        <Label>High Contrast Mode</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData.accessibilityPreferences.screenReader}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            accessibilityPreferences: { ...formData.accessibilityPreferences, screenReader: Boolean(checked) }
                          })}
                        />
                        <Label>Screen Reader Compatible</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData.accessibilityPreferences.voiceCommands}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            accessibilityPreferences: { ...formData.accessibilityPreferences, voiceCommands: Boolean(checked) }
                          })}
                        />
                        <Label>Voice Commands</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData.accessibilityPreferences.subtitles}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            accessibilityPreferences: { ...formData.accessibilityPreferences, subtitles: Boolean(checked) }
                          })}
                        />
                        <Label>Always Show Subtitles</Label>
                      </div>
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
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="spanish">Spanish</SelectItem>
                          <SelectItem value="french">French</SelectItem>
                          <SelectItem value="german">German</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="communicationMethod">Communication Method</Label>
                      <Select
                        value={formData.communicationPreferences.communicationMethod}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          communicationPreferences: { ...formData.communicationPreferences, communicationMethod: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="verbal">Verbal</SelectItem>
                          <SelectItem value="written">Written</SelectItem>
                          <SelectItem value="sign_language">Sign Language</SelectItem>
                          <SelectItem value="assistive_device">Assistive Device</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="parentalCommunication">Parental Communication Preference</Label>
                      <Select
                        value={formData.communicationPreferences.parentalCommunication}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          communicationPreferences: { ...formData.communicationPreferences, parentalCommunication: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="text">Text Message</SelectItem>
                          <SelectItem value="app">App Notifications</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Additional Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Any additional information about the student that would be helpful for teachers and staff..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={6}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <div className="flex justify-between pt-6 border-t">
                <div className="flex gap-2">
                  {activeTab !== 'basic' && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const tabs = ['basic', 'disability', 'medical', 'accommodations', 'support', 'preferences'];
                        const currentIndex = tabs.indexOf(activeTab);
                        if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1]);
                      }}
                    >
                      Previous
                    </Button>
                  )}
                  {activeTab !== 'preferences' && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const tabs = ['basic', 'disability', 'medical', 'accommodations', 'support', 'preferences'];
                        const currentIndex = tabs.indexOf(activeTab);
                        if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1]);
                      }}
                    >
                      Next
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createStudentMutation.isPending}
                    className="min-w-[120px]"
                  >
                    {createStudentMutation.isPending ? 'Creating...' : 'Create Student'}
                  </Button>
                </div>
              </div>
            </form>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};