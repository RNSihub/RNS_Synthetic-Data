import React, { useState, useEffect } from 'react';
import { ArrowRight, Database, ShieldCheck, Zap, BarChart, Code, Lock, Brain, LogIn } from 'lucide-react';


export default function HowItWorksPage() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 4);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const steps = [
    {
      title: "Configure Data Model",
      description: "Define your data structure, relationships, and constraints.",
      icon: <Database className="text-orange-500" size={32} />
    },
    {
      title: "Set Parameters",
      description: "Adjust privacy settings, data volume, and distribution.",
      icon: <Code className="text-orange-500" size={32} />
    },
    {
      title: "Generate Data",
      description: "Our AI instantly creates realistic synthetic datasets.",
      icon: <Zap className="text-orange-500" size={32} />
    },
    {
      title: "Export & Use",
      description: "Download in multiple formats or use our API for integration.",
      icon: <BarChart className="text-orange-500" size={32} />
    }
  ];

  const features = [
    {
      title: "Privacy Preserving",
      description: "Generate data that maintains statistical properties without exposing sensitive information.",
      icon: <ShieldCheck size={32} className="text-orange-500" />
    },
    {
      title: "Advanced AI Models",
      description: "Leverage state-of-the-art generative models for highly realistic data synthesis.",
      icon: <Brain size={32} className="text-orange-500" />
    },
    {
      title: "Secure Processing",
      description: "All data generation happens in isolated environments with end-to-end encryption.",
      icon: <Lock size={32} className="text-orange-500" />
    },
    {
      title: "Customizable Outputs",
      description: "Export to CSV, JSON, SQL, or connect directly via API integration.",
      icon: <Code size={32} className="text-orange-500" />
    },
    {
      title: "Statistical Validation",
      description: "Automatic validation ensures your synthetic data matches real-world distributions.",
      icon: <BarChart size={32} className="text-orange-500" />
    },
    {
      title: "High Performance",
      description: "Generate millions of records in minutes with our distributed processing.",
      icon: <Zap size={32} className="text-orange-500" />
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <nav className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Database className="text-orange-600" size={28} />
              <span className="text-2xl font-bold text-gray-800">RNS-SynthGenie</span>
            </div>
            <div className="hidden md:flex space-x-6">
              <a href="/" className="text-gray-700 hover:text-orange-600">Home</a>
              <a href="/howitworks" className="text-orange-600">How it Works</a>
              <a href="/price" className="text-gray-700 hover:text-orange-600">Pricing</a>
            </div>
            <div>
              <button className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg flex items-center">
                <LogIn size={18} className="mr-2" />
                <a href="/home" className="text-white">Get Started</a>
              </button>
            </div>
          </div>
        </nav>
        <div className="container mx-auto px-4 py-16 mt-15">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">How Our Synthetic Data Generator Works</h1>
          <p className="text-xl text-center max-w-3xl mx-auto mb-8">Transform your development process with privacy-preserving synthetic data that looks, acts, and tests like production data.</p>
        </div>
      </div>

      {/* Process Steps */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-16">Four Simple Steps</h2>

        <div className="grid md:grid-cols-4 gap-6 mb-16">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`bg-white p-6 rounded-lg shadow-lg transition-all duration-500 transform ${activeStep === index ? "scale-105 border-2 border-orange-500" : "scale-100"
                }`}
            >
              <div className="flex justify-center mb-4">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-center mb-3">{step.title}</h3>
              <p className="text-gray-600 text-center">{step.description}</p>

              {activeStep === index && (
                <div className="mt-4 flex justify-center">
                  <div className="w-16 h-1 bg-orange-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveStep(index)}
                className={`w-3 h-3 rounded-full ${activeStep === index ? "bg-orange-500" : "bg-gray-300"
                  }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Animation Section */}
      <div className="bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">See It In Action</h2>

          <div className="flex justify-center mb-16">
            <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-4xl">
              <div className="bg-gray-800 rounded-lg p-4 h-64 flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-block">
                    <Database size={48} className="text-orange-500 mb-4 animate-pulse mx-auto" />
                    <div className="h-2 w-32 bg-orange-500 mb-3 rounded animate-pulse"></div>
                    <div className="h-2 w-24 bg-orange-300 mb-3 rounded animate-pulse"></div>
                  </div>

                  <ArrowRight size={24} className="text-orange-500 mx-6 animate-bounce inline-block" />

                  <div className="inline-block">
                    <Brain size={48} className="text-orange-500 mb-4 mx-auto animate-spin animate-slow" />
                    <div className="h-2 w-32 bg-orange-500 mb-3 rounded animate-pulse"></div>
                    <div className="h-2 w-24 bg-orange-300 mb-3 rounded animate-pulse"></div>
                  </div>

                  <ArrowRight size={24} className="text-orange-500 mx-6 animate-bounce inline-block" />

                  <div className="inline-block">
                    <Database size={48} className="text-green-500 mb-4 animate-pulse mx-auto" />
                    <div className="h-2 w-32 bg-orange-500 mb-3 rounded animate-pulse"></div>
                    <div className="h-2 w-24 bg-orange-300 mb-3 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-center">
                <button className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-6 rounded-md font-medium transition-colors duration-300">
                  Try Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-16">Key Features</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:border-orange-500 hover:border-2 group"
            >
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-orange-100 rounded-full group-hover:bg-orange-200 transition-colors duration-300">
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-xl font-bold text-center mb-3">{feature.title}</h3>
              <p className="text-gray-600 text-center">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-orange-500 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Generate Your Own Synthetic Data?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">Get started today with our free tier and experience the power of privacy-preserving synthetic data.</p>

          <div className="flex justify-center space-x-4 flex-wrap">
            <button className="bg-white text-orange-600 py-3 px-8 rounded-md font-medium hover:bg-orange-100 transition-colors duration-300 mb-4 md:mb-0">
              Start Free Trial
            </button>
            <button className="bg-orange-600 text-white py-3 px-8 rounded-md font-medium border border-white hover:bg-orange-700 transition-colors duration-300">
              Schedule Demo
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p>© 2025 Synthetic Data Generator. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}