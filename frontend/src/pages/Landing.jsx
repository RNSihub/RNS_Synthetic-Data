import React from 'react';
import { Database, FileType2, Settings, ClipboardCheck, FileOutput, LogIn } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Database className="text-orange-600" size={28} />
            <span className="text-2xl font-bold text-gray-800">SynthGenie</span>
          </div>
          <div className="hidden md:flex space-x-6">
            <a href="#features" className="text-gray-700 hover:text-orange-600">Features</a>
            <a href="/howitworks" className="text-gray-700 hover:text-orange-600">How it Works</a>
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

      {/* Hero Section */}
      <section id="home" className="py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Generate Realistic Synthetic Data</h1>
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            SynthGenie leverages AI to create high-quality synthetic datasets for development,
            testing, and machine learning — without compromising real data.
          </p>
          <div className="flex justify-center space-x-4">
          <a href="/home"><button className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-8 rounded-lg text-lg">
              Try It Now
            </button></a>
            <a href="/info"><button className="bg-white border-2 border-orange-600 text-orange-600 hover:bg-orange-50 font-medium py-3 px-8 rounded-lg text-lg">
              Learn More
            </button></a>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section id="features" className="bg-gray-50 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16 text-gray-800">Powerful Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-orange-100 p-3 rounded-lg inline-block mb-4">
                <Database className="text-orange-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">AI-Powered Data Generation</h3>
              <p className="text-gray-600">
                Generate unique, realistic synthetic data with zero duplication using Google Gemini API.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-orange-100 p-3 rounded-lg inline-block mb-4">
                <FileType2 className="text-orange-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Smart Data Filling</h3>
              <p className="text-gray-600">
                Advanced algorithms automatically fill missing values with statistically sound data.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-orange-100 p-3 rounded-lg inline-block mb-4">
                <ClipboardCheck className="text-orange-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Data Validation</h3>
              <p className="text-gray-600">
                Verify data quality with built-in validation tools and manual correction options.
              </p>
            </div>

            {/* Feature Card 4 */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-orange-100 p-3 rounded-lg inline-block mb-4">
                <FileOutput className="text-orange-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Flexible Export Options</h3>
              <p className="text-gray-600">
                Export your synthetic data in multiple formats including CSV and JSON.
              </p>
            </div>

            {/* Feature Card 5 */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-orange-100 p-3 rounded-lg inline-block mb-4">
                <Settings className="text-orange-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Custom Configurations</h3>
              <p className="text-gray-600">
                Customize data types, volume, and distributions to meet your specific needs.
              </p>
            </div>

            {/* Feature Card 6 */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-orange-100 p-3 rounded-lg inline-block mb-4">
                <LogIn className="text-orange-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Developer API</h3>
              <p className="text-gray-600">
                Access SynthGenie's capabilities programmatically through our developer API.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="howitworks" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">How It Works</h2>
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            Learn how SynthGenie leverages AI to create high-quality synthetic datasets for your needs.
          </p>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-orange-600 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Generate Perfect Synthetic Data?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of developers and data scientists using SynthGenie to create high-quality datasets.
          </p>
          <a href='/home'><button className="bg-white text-orange-600 font-bold py-3 px-8 rounded-lg text-lg hover:bg-gray-100">
            Start Free Trial
          </button></a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center space-x-2 mb-4">
                <Database className="text-orange-500" size={24} />
                <span className="text-xl font-bold text-white">SynthGenie</span>
              </div>
              <p className="text-gray-400 max-w-xs">
                The intelligent synthetic data generator for developers and data scientists.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-white font-semibold mb-3">Product</h3>
                <ul className="space-y-2">
                  <li><a href="#features" className="hover:text-orange-400">Features</a></li>
                  <li><a href="#pricing" className="hover:text-orange-400">Pricing</a></li>
                  <li><a href="#" className="hover:text-orange-400">API</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-3">Resources</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-orange-400">Documentation</a></li>
                  <li><a href="#" className="hover:text-orange-400">Tutorials</a></li>
                  <li><a href="#" className="hover:text-orange-400">Blog</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-3">Company</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-orange-400">About</a></li>
                  <li><a href="#" className="hover:text-orange-400">Contact</a></li>
                  <li><a href="#" className="hover:text-orange-400">Privacy</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-10 pt-6 text-center text-gray-400">
            &copy; {new Date().getFullYear()} SynthGenie. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
