import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Database, Brain, ChartBar, Code, Lock, BarChart3, Play, Pause } from 'lucide-react';

export default function SyntheticDataInfoPage() {
  const [activeSection, setActiveSection] = useState('intro');
  const [isAnimating, setIsAnimating] = useState(true);
  const [dataCount, setDataCount] = useState(10);
  
  // Animation for data generation
  useEffect(() => {
    let interval;
    
    if (isAnimating) {
      interval = setInterval(() => {
        setDataCount(prev => prev < 50 ? prev + 1 : 10);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isAnimating]);

  // Example synthetic data for chart
  const generateChartData = () => {
    return Array.from({ length: dataCount }, (_, i) => ({
      name: `Point ${i + 1}`,
      real: Math.round(Math.sin(i * 0.5) * 50 + 50),
      synthetic: Math.round(Math.sin(i * 0.5 + 0.5) * 40 + 60)
    }));
  };

  // Use cases with icons
  const useCases = [
    { 
      title: "Privacy Protection", 
      icon: <Lock size={24} className="text-orange-500" />, 
      description: "Protect sensitive information while maintaining data utility for analysis and development." 
    },
    { 
      title: "Data Augmentation", 
      icon: <Database size={24} className="text-orange-500" />, 
      description: "Enhance limited datasets by generating additional similar examples to improve model training." 
    },
    { 
      title: "Testing Environments", 
      icon: <Code size={24} className="text-orange-500" />, 
      description: "Create realistic test data that mirrors production data without using actual customer information." 
    },
    { 
      title: "Algorithm Development", 
      icon: <Brain size={24} className="text-orange-500" />, 
      description: "Build and refine ML algorithms with controlled, diverse datasets that cover edge cases." 
    },
  ];

  // Studies data for animation
  const studies = [
    { id: 1, title: "Healthcare Imaging", percent: 76, color: "bg-orange-600" },
    { id: 2, title: "Financial Fraud Detection", percent: 84, color: "bg-orange-500" },
    { id: 3, title: "Autonomous Vehicles", percent: 92, color: "bg-orange-400" },
    { id: 4, title: "Retail Recommendation", percent: 68, color: "bg-orange-300" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-600 to-orange-400 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto ml-20">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold flex items-center">
              <Database className="mr-3" />
              Synthetic_Data
            </h1>
            <nav>
              <ul className="flex space-x-6 ml-140">
                {['intro', 'usecases', 'studies', 'comparison'].map((section) => (
                  <li key={section}>
                    <button 
                      onClick={() => setActiveSection(section)}
                      className={`px-3 py-1 rounded-[8px] transition-all ml-10 ${activeSection === section ? 'bg-white text-orange-600 font-medium' : 'text-white hover:bg-white/20'}`}
                    >
                      {section.charAt(0).toUpperCase() + section.slice(1)}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-4xl mx-auto p-6">
        {/* Introduction Section */}
        {activeSection === 'intro' && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-orange-600 mb-4">What is Synthetic Data?</h2>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                <div className="md:w-1/2">
                  <p className="mb-4">
                    <span className="text-orange-500 font-bold">Synthetic data</span> is artificially generated information that mimics real-world data without containing any actual original records. It preserves statistical properties and relationships while eliminating privacy concerns.
                  </p>
                  <p>
                    Generated through various techniques including generative adversarial networks (GANs), agent-based modeling, and statistical methods, synthetic data has become a critical resource for modern data science and AI development.
                  </p>
                </div>
                
                <div className="md:w-1/2 flex justify-center">
                  <div className="relative h-48 w-48">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-orange-100 h-40 w-40 rounded-full flex items-center justify-center animate-pulse">
                        <Brain className="h-16 w-16 text-orange-500" />
                      </div>
                    </div>
                    <div className="absolute inset-0">
                      <svg className="h-full w-full" viewBox="0 0 100 100">
                        {Array.from({ length: 8 }).map((_, i) => {
                          const angle = (i * 45) * Math.PI / 180;
                          const delay = i * 0.1;
                          return isAnimating ? (
                            <circle
                              key={i}
                              cx={50 + 35 * Math.cos(angle)}
                              cy={50 + 35 * Math.sin(angle)}
                              r={3}
                              className="fill-orange-500"
                              style={{
                                animation: `bounce 1s ease-in-out ${delay}s infinite alternate`
                              }}
                            />
                          ) : (
                            <circle
                              key={i}
                              cx={50 + 35 * Math.cos(angle)}
                              cy={50 + 35 * Math.sin(angle)}
                              r={3}
                              className="fill-orange-300"
                            />
                          );
                        })}
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-lg font-semibold text-orange-600 mb-2">Key Benefits:</h3>
                <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <li className="bg-orange-50 p-3 rounded-lg">
                    <div className="font-medium">Privacy Preservation</div>
                    <div className="text-sm text-gray-600">No real personal data exposed</div>
                  </li>
                  <li className="bg-orange-50 p-3 rounded-lg">
                    <div className="font-medium">Unlimited Scale</div>
                    <div className="text-sm text-gray-600">Generate as much data as needed</div>
                  </li>
                  <li className="bg-orange-50 p-3 rounded-lg">
                    <div className="font-medium">Edge Case Generation</div>
                    <div className="text-sm text-gray-600">Create rare scenarios for testing</div>
                  </li>
                </ul>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={() => setIsAnimating(!isAnimating)}
                  className="flex items-center text-orange-600 hover:text-orange-700"
                >
                  {isAnimating ? (
                    <>
                      <Pause size={16} className="mr-1" /> Pause Animation
                    </>
                  ) : (
                    <>
                      <Play size={16} className="mr-1" /> Resume Animation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Use Cases Section */}
        {activeSection === 'usecases' && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-orange-600 mb-4">Industry Applications</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {useCases.map((useCase, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center mb-3">
                    {useCase.icon}
                    <h3 className="text-xl font-semibold ml-2">{useCase.title}</h3>
                  </div>
                  <p className="text-gray-600">{useCase.description}</p>
                  
                  <div className="mt-4 bg-orange-50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium text-orange-600">Example Application</h4>
                    <p className="text-sm">
                      {index === 0 && "Healthcare companies generating synthetic patient records for algorithm training."}
                      {index === 1 && "Balancing datasets by creating additional minority class examples."}
                      {index === 2 && "Software companies using synthetic data to test systems without real user information."}
                      {index === 3 && "Research teams creating diverse data to build more robust models."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md mt-6">
              <h3 className="text-xl font-semibold text-orange-600 mb-3">Implementation Approaches</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-orange-50">
                    <tr>
                      <th className="p-3 text-left">Method</th>
                      <th className="p-3 text-left">Complexity</th>
                      <th className="p-3 text-left">Data Quality</th>
                      <th className="p-3 text-left">Best For</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="p-3 font-medium">GANs</td>
                      <td className="p-3">High</td>
                      <td className="p-3">Very High</td>
                      <td className="p-3">Images, Complex Distributions</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">VAEs</td>
                      <td className="p-3">Medium</td>
                      <td className="p-3">High</td>
                      <td className="p-3">Tabular Data, Features</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Agent-Based Models</td>
                      <td className="p-3">Medium</td>
                      <td className="p-3">Medium</td>
                      <td className="p-3">Behavioral Data, Systems</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Statistical Methods</td>
                      <td className="p-3">Low</td>
                      <td className="p-3">Medium</td>
                      <td className="p-3">Simple Distributions</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {/* Studies Section */}
        {activeSection === 'studies' && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-orange-600 mb-4">Research Studies</h2>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Effectiveness in Real-World Applications</h3>
              
              <div className="space-y-6">
                {studies.map((study) => (
                  <div key={study.id} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{study.title}</span>
                      <span className="font-medium">{study.percent}% Accuracy</span>
                    </div>
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${study.color} ${isAnimating ? 'animate-progressBar' : ''}`} 
                        style={{width: `${isAnimating ? study.percent : 0}%`, transition: 'width 1.5s ease-in-out'}}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {study.id === 1 && "Synthetic medical images used for diagnostic training achieved 76% accuracy compared to 79% with real data."}
                      {study.id === 2 && "Fraud detection models trained on synthetic financial transactions reached 84% detection rate."}
                      {study.id === 3 && "Autonomous vehicle training using synthetic edge case scenarios improved safety metrics by 92%."}
                      {study.id === 4 && "Recommendation systems using synthetic user behavior data achieved 68% relevance scores."}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="text-lg font-semibold text-orange-600 mb-3">Key Research Findings</h3>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="mt-1 mr-2 h-2 w-2 bg-orange-500 rounded-full"></div>
                      <p>Synthetic data achieves 85-95% of the performance of real data in most machine learning applications.</p>
                    </li>
                    <li className="flex items-start">
                      <div className="mt-1 mr-2 h-2 w-2 bg-orange-500 rounded-full"></div>
                      <p>Adding just 20% synthetic data to small real datasets can improve model performance by up to 30%.</p>
                    </li>
                    <li className="flex items-start">
                      <div className="mt-1 mr-2 h-2 w-2 bg-orange-500 rounded-full"></div>
                      <p>Balancing imbalanced datasets with synthetic examples reduces bias in machine learning models.</p>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={() => setIsAnimating(!isAnimating)}
                  className="flex items-center text-orange-600 hover:text-orange-700"
                >
                  {isAnimating ? (
                    <>
                      <Pause size={16} className="mr-1" /> Pause Animation
                    </>
                  ) : (
                    <>
                      <Play size={16} className="mr-1" /> Resume Animation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Comparison Section */}
        {activeSection === 'comparison' && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-orange-600 mb-4">Real vs. Synthetic Data</h2>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Performance Comparison</h3>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={generateChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="name" style={{ fontSize: '0.8rem' }} />
                    <YAxis style={{ fontSize: '0.8rem' }} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="real" 
                      stroke="#2563eb" 
                      strokeWidth={2} 
                      name="Real Data Performance" 
                      dot={{ r: 3 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="synthetic" 
                      stroke="#f97316" 
                      strokeWidth={2} 
                      name="Synthetic Data Performance" 
                      dot={{ r: 3 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-blue-600 mb-2">Real Data</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="mt-1 mr-2 h-2 w-2 bg-blue-500 rounded-full"></div>
                      <p className="text-sm">Contains actual observations from real-world events</p>
                    </li>
                    <li className="flex items-start">
                      <div className="mt-1 mr-2 h-2 w-2 bg-blue-500 rounded-full"></div>
                      <p className="text-sm">Often subject to privacy and regulatory constraints</p>
                    </li>
                    <li className="flex items-start">
                      <div className="mt-1 mr-2 h-2 w-2 bg-blue-500 rounded-full"></div>
                      <p className="text-sm">May contain biases and gaps from collection methods</p>
                    </li>
                    <li className="flex items-start">
                      <div className="mt-1 mr-2 h-2 w-2 bg-blue-500 rounded-full"></div>
                      <p className="text-sm">Limited to available observations (rare events underrepresented)</p>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-orange-600 mb-2">Synthetic Data</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="mt-1 mr-2 h-2 w-2 bg-orange-500 rounded-full"></div>
                      <p className="text-sm">Generated artificially to mimic properties of real data</p>
                    </li>
                    <li className="flex items-start">
                      <div className="mt-1 mr-2 h-2 w-2 bg-orange-500 rounded-full"></div>
                      <p className="text-sm">Free from privacy concerns and regulatory restrictions</p>
                    </li>
                    <li className="flex items-start">
                      <div className="mt-1 mr-2 h-2 w-2 bg-orange-500 rounded-full"></div>
                      <p className="text-sm">Can be engineered to remove or represent specific biases</p>
                    </li>
                    <li className="flex items-start">
                      <div className="mt-1 mr-2 h-2 w-2 bg-orange-500 rounded-full"></div>
                      <p className="text-sm">Can generate unlimited examples including rare scenarios</p>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="text-lg font-semibold text-orange-600 mb-3">When to Use Synthetic Data</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="font-medium">Data Scarcity</div>
                    <div className="text-sm text-gray-600">When real data is limited or hard to collect</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="font-medium">Privacy Requirements</div>
                    <div className="text-sm text-gray-600">When working with sensitive information</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="font-medium">Edge Case Testing</div>
                    <div className="text-sm text-gray-600">When rare scenarios need to be represented</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={() => setIsAnimating(!isAnimating)}
                  className="flex items-center text-orange-600 hover:text-orange-700"
                >
                  {isAnimating ? (
                    <>
                      <Pause size={16} className="mr-1" /> Pause Animation
                    </>
                  ) : (
                    <>
                      <Play size={16} className="mr-1" /> Resume Animation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold flex items-center mb-2">
                <Database className="mr-2" /> Synthetic Data Hub
              </h3>
              <p className="text-gray-300 text-sm">
                Your resource for synthetic data information and best practices
              </p>
            </div>
            
            <div className="flex space-x-4">
              <a href="#" className="hover:text-orange-400 transition-colors">
                <div className="bg-gray-700 p-2 rounded-full">
                  <BarChart3 size={20} />
                </div>
              </a>
              <a href="#" className="hover:text-orange-400 transition-colors">
                <div className="bg-gray-700 p-2 rounded-full">
                  <Code size={20} />
                </div>
              </a>
              <a href="#" className="hover:text-orange-400 transition-colors">
                <div className="bg-gray-700 p-2 rounded-full">
                  <Brain size={20} />
                </div>
              </a>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-700 text-center text-sm text-gray-400">
            © 2025 Synthetic Data Information Hub. All information is for educational purposes.
          </div>
        </div>
      </footer>
      
      <style jsx>{`
        @keyframes bounce {
          0% { transform: translateY(0); }
          100% { transform: translateY(-10px); }
        }
        
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        @keyframes progressBar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out;
        }
        
        .animate-progressBar {
          animation: progressBar 1.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}