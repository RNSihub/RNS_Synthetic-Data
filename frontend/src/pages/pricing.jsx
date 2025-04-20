import React, { useState } from 'react';
import { Check, X, HelpCircle, Zap, Database, Users, Server, CloudLightning, LogIn } from 'lucide-react';


export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [showTooltip, setShowTooltip] = useState(null);

  const plans = [
    {
      name: "Free",
      description: "Perfect for testing and small projects",
      priceMonthly: 0,
      priceYearly: 0,
      features: [
        { name: "1,000 records per month", included: true },
        { name: "Basic data types", included: true },
        { name: "CSV export", included: true },
        { name: "Community support", included: true },
        { name: "Single user", included: true },
        { name: "Standard privacy options", included: false },
        { name: "API access", included: false },
        { name: "Custom data relationships", included: false },
      ],
      highlight: false,
      ctaText: "Get Started",
      icon: <Database size={24} />,
    },
    {
      name: "Standard",
      description: "Ideal for growing teams and projects",
      priceMonthly: 1499,
      priceYearly: 14990,
      features: [
        { name: "25,000 records per month", included: true },
        { name: "Advanced data types", included: true },
        { name: "Multiple export formats", included: true },
        { name: "Priority email support", included: true },
        { name: "5 team members", included: true },
        { name: "Enhanced privacy controls", included: true },
        { name: "Basic API access", included: true },
        { name: "Custom data relationships", included: false },
      ],
      highlight: false,
      ctaText: "Start Free Trial",
      icon: <Users size={24} />,
    },
    {
      name: "Professional",
      description: "For professional teams with advanced needs",
      priceMonthly: 3999,
      priceYearly: 39990,
      features: [
        { name: "100,000 records per month", included: true },
        { name: "All data types", included: true },
        { name: "All export formats", included: true },
        { name: "24/7 priority support", included: true },
        { name: "Unlimited team members", included: true },
        { name: "Advanced privacy controls", included: true },
        { name: "Full API access", included: true },
        { name: "Complex data relationships", included: true },
      ],
      highlight: true,
      ctaText: "Start Free Trial",
      icon: <CloudLightning size={24} />,
    },
    {
      name: "Enterprise",
      description: "Custom solutions for large organizations",
      priceMonthly: null,
      priceYearly: null,
      customPrice: "Custom",
      features: [
        { name: "Unlimited records", included: true },
        { name: "Custom data types", included: true },
        { name: "Custom export formats", included: true },
        { name: "Dedicated support manager", included: true },
        { name: "SSO & advanced security", included: true },
        { name: "Custom privacy framework", included: true },
        { name: "Enterprise API with SLA", included: true },
        { name: "On-premises deployment option", included: true },
      ],
      highlight: false,
      ctaText: "Contact Sales",
      icon: <Server size={24} />,
    }
  ];

  const tooltips = {
    "1,000 records per month": "Generate up to 1,000 rows of synthetic data each month",
    "Basic data types": "Includes text, numbers, dates, and basic categorical data",
    "Advanced data types": "Includes geospatial, hierarchical, and time-series data",
    "Enhanced privacy controls": "Differential privacy and advanced anonymization techniques",
    "API access": "Programmatic access to generate data via REST API",
    "Custom data relationships": "Define complex relationships between data entities",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Database className="text-orange-600" size={28} />
            <span className="text-2xl font-bold text-gray-800">RNS-SynthGenie</span>
          </div>
          <div className="hidden md:flex space-x-6">
            <a href="/" className="text-gray-700 hover:text-orange-600">Home</a>
            <a href="/howitworks" className="text-gray-700 hover:text-orange-600">How it Works</a>
            <a href="/price" className="text-orange-600">Pricing</a>
          </div>
          <div>
            <button className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg flex items-center">
              <LogIn size={18} className="mr-2" />
              <a href="/home" className="text-white">Get Started</a>
            </button>
          </div>
        </div>
      </nav>
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">Simple, Transparent Pricing</h1>
          <p className="text-xl text-center max-w-3xl mx-auto mb-8">Choose the plan that fits your needs. All plans include our core synthetic data generation engine.</p>

          {/* Billing Toggle */}
          <div className="flex justify-center items-center space-x-4 mb-8">
            <span className={`text-lg ${!isYearly ? 'font-bold' : 'opacity-75'}`}>Monthly</span>
            <div
              className="w-16 h-8 bg-orange-400 rounded-full p-1 cursor-pointer"
              onClick={() => setIsYearly(!isYearly)}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full transform transition-transform duration-300 ${isYearly ? 'translate-x-8' : 'translate-x-0'
                  }`}
              ></div>
            </div>
            <span className={`text-lg ${isYearly ? 'font-bold' : 'opacity-75'}`}>
              Yearly <span className="bg-orange-700 text-xs py-1 px-2 rounded-full ml-1">Save 17%</span>
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 py-16 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`bg-white rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:-translate-y-2 ${plan.highlight ? 'border-2 border-orange-500 transform scale-105 md:scale-110 z-10 shadow-xl' : ''
                }`}
            >
              {plan.highlight && (
                <div className="bg-orange-500 text-white text-center py-2 font-medium">
                  Most Popular
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-100 text-orange-500 mx-auto mb-4">
                  {plan.icon}
                </div>
                <h3 className="text-2xl font-bold text-center mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-center mb-6">{plan.description}</p>

                <div className="text-center mb-6">
                  {plan.customPrice ? (
                    <div className="text-3xl font-bold">{plan.customPrice}</div>
                  ) : (
                    <>
                      <div className="text-4xl font-bold">
                        ₹{isYearly ? (plan.priceYearly / 12).toLocaleString('en-IN') : plan.priceMonthly.toLocaleString('en-IN')}
                        <span className="text-base font-normal text-gray-600">/month</span>
                      </div>
                      {isYearly && plan.priceYearly > 0 && (
                        <div className="text-sm text-gray-600 mt-1">
                          billed annually (₹{plan.priceYearly.toLocaleString('en-IN')})
                        </div>
                      )}
                    </>
                  )}
                </div>

                <button className={`w-full py-3 px-4 rounded-md font-medium transition-colors duration-300 ${plan.highlight
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                  }`}>
                  {plan.ctaText}
                </button>
              </div>

              <div className="border-t border-gray-200 p-6">
                <ul className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      {feature.included ? (
                        <Check size={20} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      ) : (
                        <X size={20} className="text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={feature.included ? 'text-gray-800' : 'text-gray-400'}>
                        {feature.name}
                      </span>
                      {tooltips[feature.name] && (
                        <div className="relative ml-1">
                          <HelpCircle
                            size={16}
                            className="text-gray-400 cursor-pointer"
                            onMouseEnter={() => setShowTooltip(feature.name)}
                            onMouseLeave={() => setShowTooltip(null)}
                          />
                          {showTooltip === feature.name && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                              {tooltips[feature.name]}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold mb-3">Can I upgrade or downgrade anytime?</h3>
              <p className="text-gray-600">Yes, you can change your plan at any time. When upgrading, we'll prorate the remaining days in your billing cycle.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold mb-3">What payment methods do you accept?</h3>
              <p className="text-gray-600">We accept all major credit cards, UPI, NetBanking, and wire transfers for Enterprise plans.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold mb-3">Do you offer academic discounts?</h3>
              <p className="text-gray-600">Yes, we offer special pricing for educational institutions. Contact our sales team for details.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold mb-3">What happens if I exceed my monthly limit?</h3>
              <p className="text-gray-600">You'll receive notifications when approaching your limit. You can purchase additional capacity or upgrade your plan.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-orange-500 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Not sure which plan is right for you?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">Our team can help you choose the perfect solution for your needs.</p>

          <div className="flex justify-center space-x-4 flex-wrap">
            <button className="bg-white text-orange-600 py-3 px-8 rounded-md font-medium hover:bg-orange-100 transition-colors duration-300 mb-4 md:mb-0">
              Schedule a Demo
            </button>
            <button className="bg-orange-600 text-white py-3 px-8 rounded-md font-medium border border-white hover:bg-orange-700 transition-colors duration-300">
              Contact Sales
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p>© 2025 Synthetic Data Generator. All rights reserved.</p>
          <p className="text-sm text-gray-400 mt-2">All prices are exclusive of applicable taxes.</p>
        </div>
      </div>
    </div>
  );
}