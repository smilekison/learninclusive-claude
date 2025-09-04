import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FeaturedVideosSection } from '@/components/video/FeaturedVideosSection';
import {
  GraduationCap,
  Users,
  BookOpen,
  Award,
  Globe,
  Shield,
  Heart,
  Star,
  CheckCircle,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Play,
  Accessibility,
  Eye,
  Ear,
  Hand,
  Brain,
  Home,
  Menu,
  X
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [contactForm, setContactForm] = React.useState({
    name: '',
    email: '',
    message: ''
  });

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: contactForm.name,
          email: contactForm.email,
          message: contactForm.message
        }
      });

      if (error) throw error;

      toast({
        title: "Message Sent!",
        description: "Thank you for contacting us. We'll get back to you soon.",
      });

      // Reset form
      setContactForm({ name: '', email: '', message: '' });
    } catch (error: any) {
      console.error('Contact form error:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: Accessibility,
      title: t('landing.features.wcag.title'),
      description: t('landing.features.wcag.description')
    },
    {
      icon: Eye,
      title: t('landing.features.visual.title'),
      description: t('landing.features.visual.description')
    },
    {
      icon: Ear,
      title: t('landing.features.audio.title'),
      description: t('landing.features.audio.description')
    },
    {
      icon: Hand,
      title: t('landing.features.motor.title'),
      description: t('landing.features.motor.description')
    },
    {
      icon: Brain,
      title: t('landing.features.cognitive.title'),
      description: t('landing.features.cognitive.description')
    },
    {
      icon: Globe,
      title: 'Multilingual',
      description: 'Support for multiple languages including English and Finnish, with easy language switching.'
    }
  ];

  const services = [
    {
      title: 'Comprehensive LMS',
      description: 'Complete learning management system with assignments, grading, and progress tracking.',
      benefits: ['Assignment Management', 'Real-time Grading', 'Progress Analytics', 'Student Portfolios']
    },
    {
      title: 'Accessibility First',
      description: 'Built from the ground up with accessibility as a core principle, not an afterthought.',
      benefits: ['WCAG 2.1 AA Compliant', 'Screen Reader Support', 'Keyboard Navigation', 'Multiple Input Methods']
    },
    {
      title: 'Video Learning',
      description: 'Interactive video platform with accessibility features like sign language interpretation.',
      benefits: ['Accessible Video Player', 'Automatic Captions', 'Sign Language Support', 'Audio Descriptions']
    },
    {
      title: 'Analytics & Insights',
      description: 'Powerful analytics to help educators understand student progress and engagement.',
      benefits: ['Learning Analytics', 'Engagement Metrics', 'Performance Tracking', 'Custom Reports']
    }
  ];

  const testimonials = [
    {
      name: 'Dr. Maria Korhonen',
      role: 'Special Education Director',
      content: 'Learninclusive has revolutionized how we deliver education to students with diverse needs. The accessibility features are unmatched.',
      rating: 5
    },
    {
      name: 'James Wilson',
      role: 'High School Principal',
      content: 'Finally, an LMS that truly works for all students. The inclusive design has improved engagement across our entire school.',
      rating: 5
    },
    {
      name: 'Sarah Chen',
      role: 'Special Needs Coordinator',
      content: 'The sign language support and cognitive accessibility features have been game-changers for our students.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-primary">learninclusive</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-foreground hover:text-primary transition-colors">{t('landing.nav.home')}</a>
              <a href="#about" className="text-foreground hover:text-primary transition-colors">{t('landing.nav.about')}</a>
              <a href="#services" className="text-foreground hover:text-primary transition-colors">{t('landing.nav.services')}</a>
              <a href="#contact" className="text-foreground hover:text-primary transition-colors">{t('landing.nav.contact')}</a>
              <Button onClick={() => navigate('/videos')} variant="ghost" size="sm" className="text-foreground hover:text-primary">
                {t('landing.nav.browseVideos')}
              </Button>
              
              {/* Language Switcher */}
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant={language === 'en' ? 'default' : 'outline'} 
                  onClick={() => setLanguage('en')}
                  className="h-8 px-3"
                >
                  EN
                </Button>
                <Button 
                  size="sm" 
                  variant={language === 'fi' ? 'default' : 'outline'} 
                  onClick={() => setLanguage('fi')}
                  className="h-8 px-3"
                >
                  FI
                </Button>
              </div>

              <Button onClick={() => navigate('/auth')} size="sm">
                {t('landing.nav.getStarted')}
              </Button>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <div className="flex flex-col space-y-4">
                <a href="#home" className="text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>{t('landing.nav.home')}</a>
                <a href="#about" className="text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>{t('landing.nav.about')}</a>
                <a href="#services" className="text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>{t('landing.nav.services')}</a>
                <a href="#contact" className="text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>{t('landing.nav.contact')}</a>
                <Button 
                  onClick={() => { navigate('/videos'); setMobileMenuOpen(false); }} 
                  variant="ghost" 
                  size="sm" 
                  className="text-left justify-start text-foreground hover:text-primary"
                >
                  {t('landing.nav.browseVideos')}
                </Button>
                <div className="flex items-center gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant={language === 'en' ? 'default' : 'outline'} 
                    onClick={() => setLanguage('en')}
                  >
                    EN
                  </Button>
                  <Button 
                    size="sm" 
                    variant={language === 'fi' ? 'default' : 'outline'} 
                    onClick={() => setLanguage('fi')}
                  >
                    FI
                  </Button>
                </div>
                <Button onClick={() => navigate('/auth')} className="w-full">
                  {t('landing.nav.getStarted')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="outline" className="mb-6 px-4 py-2 text-sm font-medium">
              {t('landing.hero.badge')}
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-in">
              {t('landing.hero.title')}
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-fade-in">
              {t('landing.hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
              <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8 py-4 h-auto">
                {t('landing.hero.startLearning')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/videos')} className="text-lg px-8 py-4 h-auto">
                <Play className="mr-2 h-5 w-5" />
                {t('landing.hero.watchDemo')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {t('landing.features.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Every feature is designed with inclusivity in mind, ensuring all students can access and benefit from education.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
                About Learninclusive
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Born from the belief that education should be accessible to everyone, Learninclusive is the first 
                learning management system built with accessibility as its foundation, not as an afterthought.
              </p>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                We comply with WCAG 2.1 AA standards and Finnish accessibility legislation, ensuring that students 
                with visual, auditory, motor, and cognitive disabilities can fully participate in their education.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">100%</div>
                  <div className="text-sm text-muted-foreground">WCAG Compliant</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">50k+</div>
                  <div className="text-sm text-muted-foreground">Students Served</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="w-full h-96 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Accessibility className="h-24 w-24 text-primary mx-auto mb-4" />
                  <p className="text-lg font-semibold text-foreground">Inclusive by Design</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {t('landing.mission.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('landing.mission.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {/* Mission */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-6 mx-auto">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-center mb-6">Our Mission</h3>
                <p className="text-muted-foreground leading-relaxed text-center">
                  To break down barriers in education by creating the world's most accessible learning platform. 
                  We believe every student, regardless of their abilities or disabilities, deserves equal access 
                  to quality education. Our mission is to empower educators with tools that make learning truly 
                  inclusive, ensuring no student is left behind in their educational journey.
                </p>
              </CardContent>
            </Card>

            {/* Vision */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-accent/10 rounded-lg flex items-center justify-center mb-6 mx-auto">
                  <Globe className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-2xl font-bold text-center mb-6">Our Vision</h3>
                <p className="text-muted-foreground leading-relaxed text-center">
                  A world where accessibility in education is not an afterthought, but the foundation upon which 
                  all learning experiences are built. We envision a future where every educational institution 
                  has the tools and knowledge to create truly inclusive environments, where diversity in learning 
                  needs is celebrated and supported through cutting-edge, accessible technology.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Year-on-Year Mission Timeline */}
          <div className="text-center mb-16">
            <h3 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
              🎯 Year-on-Year Mission
            </h3>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our strategic roadmap to revolutionize accessible education across Europe through proven validation, 
              strategic expansion, cutting-edge innovation, and market leadership.
            </p>
          </div>

          <div className="relative">
            {/* Timeline Connector */}
            <div className="absolute left-1/2 transform -translate-x-0.5 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-accent to-purple-500 hidden lg:block"></div>
            
            <div className="space-y-16">
              {/* Year 1 */}
              <div className="relative">
                <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
                  <div className="lg:text-right lg:pr-12">
                    <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-2xl transition-all duration-500 hover:scale-105">
                      <CardContent className="p-8">
                        <div className="flex items-center gap-4 mb-6 lg:justify-end">
                          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            1
                          </div>
                          <div>
                            <h4 className="text-2xl font-bold text-foreground">Validation & Foundation</h4>
                            <Badge className="mt-2 bg-primary/20 text-primary border-primary/30">2025–2026</Badge>
                          </div>
                        </div>
                        <p className="text-lg font-semibold text-primary mb-4">
                          {t('landing.mission.year1.mission')}
                        </p>
                        <div className="space-y-3 text-muted-foreground">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <span>{t('landing.mission.year1.point1')}</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <span>{t('landing.mission.year1.point2')}</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <span>{t('landing.mission.year1.point3')}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="hidden lg:block"></div>
                </div>
                {/* Timeline Dot */}
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-primary rounded-full shadow-lg border-4 border-background hidden lg:block"></div>
              </div>

              {/* Year 2 */}
              <div className="relative">
                <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
                  <div className="hidden lg:block"></div>
                  <div className="lg:pl-12">
                    <Card className="border-0 shadow-xl bg-gradient-to-br from-accent/5 to-accent/10 hover:shadow-2xl transition-all duration-500 hover:scale-105">
                      <CardContent className="p-8">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-16 h-16 bg-gradient-to-br from-accent to-accent/80 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            2
                          </div>
                          <div>
                            <h4 className="text-2xl font-bold text-foreground">Expansion & Early Revenue</h4>
                            <Badge className="mt-2 bg-accent/20 text-accent border-accent/30">2026–2027</Badge>
                          </div>
                        </div>
                        <p className="text-lg font-semibold text-accent mb-4">
                          {t('landing.mission.year2.mission')}
                        </p>
                        <div className="space-y-3 text-muted-foreground">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                            <span>{t('landing.mission.year2.point1')}</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                            <span>{t('landing.mission.year2.point2')}</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                            <span>{t('landing.mission.year2.point3')}</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                            <span>{t('landing.mission.year2.point4')}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                {/* Timeline Dot */}
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-accent rounded-full shadow-lg border-4 border-background hidden lg:block"></div>
              </div>

              {/* Year 3 */}
              <div className="relative">
                <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
                  <div className="lg:text-right lg:pr-12">
                    <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500/5 to-green-500/10 hover:shadow-2xl transition-all duration-500 hover:scale-105">
                      <CardContent className="p-8">
                        <div className="flex items-center gap-4 mb-6 lg:justify-end">
                          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            3
                          </div>
                          <div>
                            <h4 className="text-2xl font-bold text-foreground">Innovation & Nordic Scale</h4>
                            <Badge className="mt-2 bg-green-500/20 text-green-700 border-green-500/30">2027–2028</Badge>
                          </div>
                        </div>
                        <p className="text-lg font-semibold text-green-700 mb-4">
                          {t('landing.mission.year3.mission')}
                        </p>
                        <div className="space-y-3 text-muted-foreground">
                          <div className="flex items-start gap-3 lg:justify-end lg:text-right">
                            <span>{t('landing.mission.year3.point1')}</span>
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          </div>
                          <div className="flex items-start gap-3 lg:justify-end lg:text-right">
                            <span>{t('landing.mission.year3.point2')}</span>
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          </div>
                          <div className="flex items-start gap-3 lg:justify-end lg:text-right">
                            <span>{t('landing.mission.year3.point3')}</span>
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="hidden lg:block"></div>
                </div>
                {/* Timeline Dot */}
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-green-500 rounded-full shadow-lg border-4 border-background hidden lg:block"></div>
              </div>

              {/* Year 4 */}
              <div className="relative">
                <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
                  <div className="hidden lg:block"></div>
                  <div className="lg:pl-12">
                    <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500/5 to-purple-500/10 hover:shadow-2xl transition-all duration-500 hover:scale-105">
                      <CardContent className="p-8">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            4
                          </div>
                          <div>
                            <h4 className="text-2xl font-bold text-foreground">System-Wide Adoption</h4>
                            <Badge className="mt-2 bg-purple-500/20 text-purple-700 border-purple-500/30">2028–2029</Badge>
                          </div>
                        </div>
                        <p className="text-lg font-semibold text-purple-700 mb-4">
                          {t('landing.mission.year4.mission')}
                        </p>
                        <div className="space-y-3 text-muted-foreground">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                            <span>{t('landing.mission.year4.point1')}</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                            <span>{t('landing.mission.year4.point2')}</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                            <span>{t('landing.mission.year4.point3')}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                {/* Timeline Dot */}
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-purple-500 rounded-full shadow-lg border-4 border-background hidden lg:block"></div>
              </div>
            </div>
          </div>

          {/* Investment Value Proposition */}
          <div className="mt-20">
            <Card className="border-0 shadow-2xl bg-gradient-to-r from-primary/10 via-accent/5 to-purple-500/10 overflow-hidden">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-primary via-accent to-purple-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                  <Award className="h-10 w-10 text-white" />
                </div>
                <h4 className="text-3xl font-bold text-foreground mb-6">
                  Investment Progression Framework
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="p-6 bg-background/50 rounded-lg border">
                    <div className="text-2xl font-bold text-primary mb-2">Validation</div>
                    <div className="text-sm text-muted-foreground">Pilot & NGO partnerships</div>
                  </div>
                  <div className="p-6 bg-background/50 rounded-lg border">
                    <div className="text-2xl font-bold text-accent mb-2">Expansion</div>
                    <div className="text-sm text-muted-foreground">Cross-border growth</div>
                  </div>
                  <div className="p-6 bg-background/50 rounded-lg border">
                    <div className="text-2xl font-bold text-green-600 mb-2">Innovation</div>
                    <div className="text-sm text-muted-foreground">Technology leadership</div>
                  </div>
                  <div className="p-6 bg-background/50 rounded-lg border">
                    <div className="text-2xl font-bold text-purple-600 mb-2">Dominance</div>
                    <div className="text-sm text-muted-foreground">Market leadership</div>
                  </div>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-4xl mx-auto">
                  {t('landing.mission.framework')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>


      {/* Services Section */}
      <section id="services" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Why Choose Learninclusive?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We don't just add accessibility features – we build them into the foundation of everything we do.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-semibold mb-4">{service.title}</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{service.description}</p>
                  <div className="space-y-3">
                    {service.benefits.map((benefit, benefitIndex) => (
                      <div key={benefitIndex} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        <span className="text-foreground">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              What Educators Say
            </h2>
            <p className="text-xl text-muted-foreground">
              Hear from the educators who've transformed their classrooms with Learninclusive.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 leading-relaxed italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Get in Touch
            </h2>
            <p className="text-xl text-muted-foreground">
              Ready to make education accessible for all? Let's start the conversation.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Info */}
            <div>
              <h3 className="text-2xl font-semibold mb-8">Contact Information</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">Email</div>
                    <div className="text-muted-foreground">contact@learninclusive.com</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">Phone</div>
                    <div className="text-muted-foreground">+447464242039</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold mb-6">Send us a Message</h3>
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">Name</label>
                    <Input
                      id="name"
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                    <Input
                      id="email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2">Message</label>
                    <Textarea
                      id="message"
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Transform Education?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of educators who are making learning accessible for everyone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary" 
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-4 h-auto bg-white text-primary hover:bg-white/90"
            >
              Get Started Free
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-4 h-auto border-white text-white hover:bg-white hover:text-primary bg-transparent"
            >
              Request Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-background border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Logo and Description */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-primary">learninclusive</span>
              </div>
              <p className="text-muted-foreground mb-4 max-w-md">
                Making education accessible for everyone through innovative, inclusive technology 
                that complies with international accessibility standards.
              </p>
              <Badge variant="outline" className="mb-4">
                WCAG 2.1 AA Compliant
              </Badge>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="space-y-3">
                <div><a href="#about" className="text-muted-foreground hover:text-primary transition-colors">About</a></div>
                <div><a href="#services" className="text-muted-foreground hover:text-primary transition-colors">Services</a></div>
                <div><Link to="/accessibility-statement" className="text-muted-foreground hover:text-primary transition-colors">Accessibility</Link></div>
                <div><a href="#contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</a></div>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <div className="space-y-3">
                <div><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a></div>
                <div><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</a></div>
                <div><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Cookie Policy</a></div>
              </div>
            </div>
          </div>

          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © 2024 Learninclusive. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-sm text-muted-foreground">Made with accessibility in mind</span>
              <Heart className="h-4 w-4 text-red-500" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;