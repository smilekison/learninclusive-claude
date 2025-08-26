import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [contactForm, setContactForm] = React.useState({
    name: '',
    email: '',
    message: ''
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle contact form submission
    console.log('Contact form submitted:', contactForm);
    // Reset form
    setContactForm({ name: '', email: '', message: '' });
  };

  const features = [
    {
      icon: Accessibility,
      title: 'WCAG 2.1 AA Compliant',
      description: 'Full accessibility compliance ensuring education is available to everyone, regardless of abilities.'
    },
    {
      icon: Eye,
      title: 'Visual Accessibility',
      description: 'High contrast mode, customizable fonts, color-blind friendly interface, and screen reader optimization.'
    },
    {
      icon: Ear,
      title: 'Audio Support',
      description: 'Text-to-speech, audio descriptions, captions, and visual alerts for comprehensive audio accessibility.'
    },
    {
      icon: Hand,
      title: 'Motor Accessibility',
      description: 'Large click targets, keyboard navigation, voice input, and motor disability adaptations.'
    },
    {
      icon: Brain,
      title: 'Cognitive Support',
      description: 'Simplified interfaces, reading assistance, focus help, and cognitive accessibility features.'
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
              <a href="#home" className="text-foreground hover:text-primary transition-colors">Home</a>
              <a href="#about" className="text-foreground hover:text-primary transition-colors">About</a>
              <a href="#services" className="text-foreground hover:text-primary transition-colors">Services</a>
              <a href="#contact" className="text-foreground hover:text-primary transition-colors">Contact</a>
              
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
                Get Started
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
                <a href="#home" className="text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Home</a>
                <a href="#about" className="text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>About</a>
                <a href="#services" className="text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Services</a>
                <a href="#contact" className="text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Contact</a>
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
                  Get Started
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
              WCAG 2.1 AA Compliant • Finnish Accessibility Certified
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-in">
              Education for{' '}
              <span className="text-primary">Everyone</span>,{' '}
              <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                Accessible by Design
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-fade-in">
              The world's first fully inclusive learning management system. Built with accessibility at its core, 
              ensuring every student can learn, participate, and succeed regardless of their abilities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
              <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8 py-4 h-auto">
                Start Learning Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/videos')} className="text-lg px-8 py-4 h-auto">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
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
              Accessibility-First Features
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

      {/* Services Section */}
      <section id="services" className="py-20 bg-muted/30">
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
                    <div className="text-muted-foreground">hello@learninclusive.com</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">Phone</div>
                    <div className="text-muted-foreground">+358 (0) 123 456 789</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">Address</div>
                    <div className="text-muted-foreground">
                      Accessibility Center<br />
                      Helsinki, Finland
                    </div>
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
                  <Button type="submit" className="w-full">
                    Send Message
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
              className="text-lg px-8 py-4 h-auto border-white text-white hover:bg-white/10"
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