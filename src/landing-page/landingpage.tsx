import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';



const HeroSection = () => (
  <div className="flex flex-col items-center text-center px-4 md:px-6 py-20 md:py-32 space-y-6 max-w-5xl mx-auto">
    <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
      Design, collaborate, and innovate with <span className="text-red-500">Hail9000</span>
    </h1>
    <p className="text-xl text-gray-600 max-w-3xl">
      The intelligent platform that connects teams, streamlines workflows, and amplifies your creative potential.
    </p>
    <div className="flex flex-col sm:flex-row gap-4 mt-8">
      <Button size="lg" className="bg-red-500 hover:bg-red-500" onClick={() => window.location.href = '/dashboard'}>
        Get started free
      </Button>
      <Button size="lg" variant="outline">
        See how it works
      </Button>
    </div>
  </div>
);

const FeaturesGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4 md:px-6 py-12 max-w-6xl mx-auto">
    {[
      {
        title: "Intelligent Collaboration",
        description: "Work together seamlessly in real-time with AI-enhanced collaboration tools."
      },
      {
        title: "Powerful Automation",
        description: "Automate repetitive tasks and focus on what matters with smart workflows."
      },
      {
        title: "Advanced Analytics",
        description: "Gain insights from comprehensive analytics that help optimize your process."
      },
      {
        title: "Intuitive Interface",
        description: "Navigate effortlessly with our clean, user-friendly design system."
      },
      {
        title: "Enterprise Security",
        description: "Rest easy with bank-level security and comprehensive access controls."
      },
      {
        title: "Seamless Integration",
        description: "Connect with your favorite tools through our extensive API ecosystem."
      }
    ].map((feature, index) => (
      <Card key={index} className="border border-gray-200">
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-2">{feature.title}</h3>
          <p className="text-gray-600">{feature.description}</p>
        </CardContent>
      </Card>
    ))}
  </div>
);

const SocialProof = () => (
  <div className="bg-gray-50 px-4 md:px-6 py-16">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
        Trusted by innovators worldwide
      </h2>
      <div className="flex flex-wrap justify-center gap-12 opacity-70">
        {['Company 1', 'Company 2', 'Company 3', 'Company 4', 'Company 5', 'Company 6'].map((company, index) => (
          <div key={index} className="h-8 flex items-center">
            {company}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ProductShowcase = () => (
  <div className="px-4 md:px-6 py-20">
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row gap-12 items-center">
        <div className="md:w-1/2 space-y-6">
          <h2 className="text-3xl font-bold">Revolutionize your workflow</h2>
          <p className="text-gray-600 text-lg">
            Hail9000 brings together the best of AI and human creativity, enabling teams to achieve more than ever before.
          </p>
          <ul className="space-y-3">
            {[
              "Smart suggestions that learn from your team's patterns",
              "Collaborative spaces for real-time ideation",
              "Powerful version control and history tracking"
            ].map((item, index) => (
              <li key={index} className="flex items-start">
                <div className="mr-2 text-red-500">✓</div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:w-1/2 bg-gray-100 rounded-lg p-4 h-64 flex items-center justify-center">
          <video
            className="w-full h-full rounded-lg"
            controls
            src="/path-to-your-video.mp4"
            poster="/path-to-your-poster-image.jpg"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  </div>
);

const PricingSection = () => (
  <div className="bg-gray-50 px-4 md:px-6 py-20">
    <div className="max-w-5xl mx-auto text-center mb-10">
      <h2 className="text-3xl font-bold mb-4">Simple, transparent pricing</h2>
      <p className="text-gray-600 text-lg">
        Choose the plan that works best for you and your team
      </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {[
        {
          name: "Free",
          price: "$0",
          description: "For individuals just getting started",
          features: [
            "Basic collaboration features",
            "Up to 3 projects",
            "2GB storage",
            "Community support"
          ]
        },
        {
          name: "Pro",
          price: "$12",
          period: "per user/month",
          description: "For professionals and small teams",
          features: [
            "Advanced collaboration tools",
            "Unlimited projects",
            "20GB storage per user",
            "Priority support"
          ],
          highlighted: true
        },
        {
          name: "Enterprise",
          price: "Custom",
          description: "For organizations with advanced needs",
          features: [
            "Custom workflows and automation",
            "Unlimited everything",
            "Advanced security and compliance",
            "Dedicated success manager"
          ]
        }
      ].map((plan, index) => (
        <Card key={index} className={`${plan.highlighted ? 'border-red-600 ring-1 ring-red-600' : 'border-gray-200'} relative`}>
          {plan.highlighted && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white px-4 py-1 rounded-full text-sm font-medium">
              Most popular
            </div>
          )}
          <CardContent className="pt-6 pb-8 px-6">
            <div className="text-lg font-medium mb-2">{plan.name}</div>
            <div className="flex items-baseline mb-4">
              <span className="text-3xl font-bold">{plan.price}</span>
              {plan.period && <span className="text-gray-500 ml-2">{plan.period}</span>}
            </div>
            <p className="text-gray-600 mb-6">{plan.description}</p>
            <Button className={`w-full ${plan.highlighted ? 'bg-red-600 hover:bg-red-700' : ''}`} variant={plan.highlighted ? 'default' : 'outline'}>
              {plan.name === "Enterprise" ? "Contact sales" : "Get started"}
            </Button>
            <ul className="mt-6 space-y-3">
              {plan.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-start">
                  <div className="mr-2 text-red-600">✓</div>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const TestimonialSection = () => (
  <div className="px-4 md:px-6 py-20">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-12">What our users say</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          {
            quote: "Hail9000 has transformed how our team collaborates. The AI features are genuinely helpful and save us hours each week.",
            name: "Alex Johnson",
            title: "Design Director, TechCorp"
          },
          {
            quote: "I've tried many collaboration tools, but none come close to the power and simplicity of Hail9000. It's become essential to our workflow.",
            name: "Sam Rivera",
            title: "Product Manager, Innovate Inc."
          }
        ].map((testimonial, index) => (
          <Card key={index} className="border-gray-200">
            <CardContent className="p-6">
              <p className="text-lg mb-6 italic">"{testimonial.quote}"</p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 mr-4"></div>
                <div>
                  <div className="font-medium">{testimonial.name}</div>
                  <div className="text-gray-600 text-sm">{testimonial.title}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

const CTASection = () => (
  <div className="bg-gray-700 text-white px-4 md:px-6 py-16">
    <div className="max-w-4xl mx-auto text-center space-y-6">
      <h2 className="text-3xl font-bold">Ready to transform your workflow?</h2>
      <p className="text-xl opacity-90">
        Join thousands of teams already using Hail9000 to collaborate and innovate.
      </p>
      <Button size="lg" className="bg-white text-red-600 hover:bg-gray-100">
        Start your free trial
      </Button>
      <p className="text-sm opacity-80">No credit card required. 14-day free trial.</p>
    </div>
  </div>
);

const Footer = () => (
  <footer className="bg-gray-900 text-gray-300 px-4 md:px-6 py-12">
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-white font-medium mb-4">Product</h3>
          <ul className="space-y-2">
            {['Features', 'Pricing', 'Integrations', 'Changelog', 'Roadmap'].map((item, index) => (
              <li key={index}><a href="#" className="hover:text-white transition">{item}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-white font-medium mb-4">Resources</h3>
          <ul className="space-y-2">
            {['Documentation', 'Tutorials', 'Blog', 'Community', 'API'].map((item, index) => (
              <li key={index}><a href="#" className="hover:text-white transition">{item}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-white font-medium mb-4">Company</h3>
          <ul className="space-y-2">
            {['About', 'Careers', 'Contact', 'Partners', 'Legal'].map((item, index) => (
              <li key={index}><a href="#" className="hover:text-white transition">{item}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-white font-medium mb-4">Connect</h3>
          <ul className="space-y-2">
            {['Twitter', 'LinkedIn', 'Facebook', 'Instagram', 'YouTube'].map((item, index) => (
              <li key={index}><a href="#" className="hover:text-white transition">{item}</a></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <div className="text-xl font-bold text-white">Hail9000</div>
        </div>
        <div className="text-sm">
          © {new Date().getFullYear()} Hail9000. All rights reserved.
        </div>
      </div>
    </div>
  </footer>
);

const Hail9000LandingPage = () => {
  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 px-4 md:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="text-2xl font-bold text-red-600">Hail9000</div>
          <nav className="hidden md:flex items-center space-x-8">
            {['Features', 'Pricing', 'Resources', 'Enterprise'].map((item, index) => (
              <a key={index} href="#" className="text-gray-600 hover:text-gray-900">
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center space-x-4">
          
            <a href="/login" className="text-white hover:bg-red-600 bg-red-500 border border-red-500 px-3 py-1 rounded-sm">
              Sign in
            </a>
    
            <button className="md:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </header>
      
      <main>
        <HeroSection />
        <SocialProof />
        <FeaturesGrid />
        <ProductShowcase />
        <PricingSection />
        <TestimonialSection />
        <CTASection />
      </main>
      
      <Footer />
    </div>
  );
};

export default Hail9000LandingPage;