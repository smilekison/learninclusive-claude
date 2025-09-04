import React, { useEffect } from 'react';
import { Play, Star, Users, BookOpen, Accessibility, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EnhancedVideoLibrary } from '@/components/video/EnhancedVideoLibrary';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { TTSButton } from '@/components/accessibility/TTSButton';

export const VideoHomepage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Set SEO meta tags for publishing
  useEffect(() => {
    document.title = "learninclusive - Accessible Educational Video Platform | Inclusive Learning for All";
    
    // Meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', 'Revolutionary accessible educational platform with screen reader support, closed captions, audio descriptions, and cognitive accommodations. WCAG 2.1 AA compliant inclusive learning for students with disabilities.');

    // Keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', 'accessible education, inclusive learning, disability support, screen reader, closed captions, educational videos, LMS, accessibility compliance, WCAG, special needs');
  }, []);

  const features = [
    {
      icon: Accessibility,
      title: 'Fully Accessible',
      description: 'Keyboard navigation, screen reader support, captions, and transcripts for every video.'
    },
    {
      icon: BookOpen,
      title: 'Educational Content',
      description: 'Curriculum-aligned videos covering mathematics, science, language arts, and more.'
    },
    {
      icon: Users,
      title: 'Inclusive Learning',
      description: 'Designed for learners with diverse abilities and learning preferences.'
    },
    {
      icon: Star,
      title: 'Quality Assured',
      description: 'All content reviewed by education professionals and accessibility experts.'
    }
  ];

  const handleGetStarted = () => {
    if (user) {
      // Navigate to dashboard if logged in
      navigate('/dashboard');
    } else {
      // Navigate to auth page
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">ILS</span>
              </div>
              <span className="text-xl font-bold text-foreground">learninclusive</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-muted-foreground">
                    Welcome, {user.firstName}
                  </span>
                  <Button onClick={() => navigate('/dashboard')} variant="default">
                    Go to Dashboard
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Button onClick={() => navigate('/auth')} variant="outline">
                    Sign In
                  </Button>
                  <Button onClick={() => navigate('/auth')} variant="default">
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-background via-muted/30 to-accent/10">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <Badge variant="secondary" className="inline-flex items-center gap-2 px-4 py-2">
              <Accessibility className="h-4 w-4" />
              WCAG 2.1 AA Compliant
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
              {t('videoHomepage.title')}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                {t('landing.everyone')}
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t('videoHomepage.description')}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button size="lg" onClick={handleGetStarted} className="min-w-[200px]">
                <Play className="h-5 w-5 mr-2" />
                Start Learning
              </Button>
              <Button size="lg" variant="outline" onClick={() => {
                const featuresSection = document.getElementById('features-section');
                featuresSection?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Learn More
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features-section" className="py-20 px-4 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Built for Accessibility
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every feature is designed with accessibility in mind, ensuring that all learners 
              can access and engage with educational content effectively.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-4">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Videos Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Featured Educational Videos
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {user 
                ? "Explore our full library of accessible educational content"
                : "Get a preview of our accessible educational content. Sign up to access the full library!"
              }
            </p>
          </div>
          
          {/* Demo YouTube Videos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[
              {
                id: '1',
                title: 'Introduction to Inclusive Learning',
                description: 'Learn about the fundamentals of inclusive education and accessibility in digital learning environments.',
                category: 'Introduction',
                duration: '5:32',
                tags: ['accessibility', 'inclusion', 'education'],
                youtubeId: 'bOUdaURhCkw',
              },
              {
                id: '2',
                title: 'Understanding Screen Readers',
                description: 'A comprehensive guide to screen reader technology and how it helps visually impaired learners.',
                category: 'Accessibility',
                duration: '8:15',
                tags: ['screen-reader', 'visual-impairment', 'assistive-tech'],
                youtubeId: 'dEbl5jvLKGQ',
              },
              {
                id: '3',
                title: 'Cognitive Accessibility Best Practices',
                description: 'Strategies for creating content that is accessible to learners with cognitive disabilities.',
                category: 'Accessibility',
                duration: '6:45',
                tags: ['cognitive', 'design', 'best-practices'],
                youtubeId: 'BEFgnYktC7U',
              },
              {
                id: '4',
                title: 'Creating Inclusive Classrooms',
                description: 'Practical tips for educators to create learning environments that work for all students.',
                category: 'Education',
                duration: '12:20',
                tags: ['classroom', 'teaching', 'inclusion'],
                youtubeId: 'hC4R9gYbtPs',
              },
              {
                id: '5',
                title: 'Assistive Technology Overview',
                description: 'An overview of various assistive technologies and their applications in education.',
                category: 'Technology',
                duration: '9:48',
                tags: ['assistive-tech', 'tools', 'overview'],
                youtubeId: '0E1exfVNNnE',
              },
            ].map((video) => (
              <Card key={video.id} className="card-elevated overflow-hidden">
                <div className="aspect-video bg-muted relative">
                  <iframe
                    src={`https://www.youtube.com/embed/${video.youtubeId}?enablejsapi=1&rel=0`}
                    title={video.title}
                    className="absolute inset-0 w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary" className="mb-2">
                      {video.category}
                    </Badge>
                    <Badge variant="outline">
                      {video.duration}
                    </Badge>
                  </div>
                  <h3 className="font-semibold mb-2 line-clamp-2">{video.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{video.description}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {video.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        const iframe = document.querySelector(`iframe[title="${video.title}"]`) as HTMLIFrameElement;
                        if (iframe) {
                          iframe.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                        }
                      }}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Play Video
                    </Button>
                    <TTSButton text={`Video: ${video.title}. ${video.description}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Accessibility Showcase */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Accessibility Features in Action
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our video player includes comprehensive accessibility features to support all learners.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-foreground">Keyboard Navigation</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="bg-primary text-white px-2 py-1 rounded text-xs font-mono">Space</span>
                    <span>Play/Pause video</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-primary text-white px-2 py-1 rounded text-xs font-mono">← →</span>
                    <span>Seek backward/forward 10 seconds</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-primary text-white px-2 py-1 rounded text-xs font-mono">↑ ↓</span>
                    <span>Adjust volume</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-primary text-white px-2 py-1 rounded text-xs font-mono">M</span>
                    <span>Toggle mute</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-primary text-white px-2 py-1 rounded text-xs font-mono">C</span>
                    <span>Toggle captions/transcript</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-primary text-white px-2 py-1 rounded text-xs font-mono">F</span>
                    <span>Toggle fullscreen</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-foreground">Additional Features</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Screen reader announcements for all actions</li>
                  <li>• High contrast video controls</li>
                  <li>• Customizable playback speeds (0.5x to 2x)</li>
                  <li>• Full transcripts for every video</li>
                  <li>• Progress tracking and bookmarks</li>
                  <li>• Mobile-friendly touch targets (44px minimum)</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg p-8 text-center">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-6">
                <Play className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Try Our Accessible Video Player
              </h3>
              <p className="text-muted-foreground mb-6">
                Experience the difference our accessibility features make. All controls are keyboard accessible 
                and screen reader friendly.
              </p>
              <Button onClick={handleGetStarted} size="lg">
                {user ? 'Go to Videos' : 'Sign Up to Try'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      {!user && (
        <section id="auth-section" className="py-20 px-4 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Ready to Start Your Accessible Learning Journey?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of learners who are already benefiting from our inclusive educational platform. 
              Sign up today and experience learning without barriers.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={() => navigate('/auth')} className="min-w-[200px]">
                Sign Up Free
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">ILS</span>
              </div>
              <span className="text-xl font-bold text-foreground">learninclusive</span>
            </div>
            <p className="text-muted-foreground">
              Accessible education for everyone • WCAG 2.1 AA Compliant • Privacy Focused
            </p>
            <div className="flex justify-center space-x-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors">Accessibility Statement</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};