import { useState, useEffect } from 'react';

export default function SynthGenieLoader() {
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Simulate loading progress
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prevProgress => {
        const newProgress = prevProgress + 1;
        if (newProgress >= 100) {
          clearInterval(timer);
          setTimeout(() => setIsLoaded(true), 500);
          return 100;
        }
        return newProgress;
      });
    }, 50);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute bg-orange-500 rounded-full opacity-10"
            style={{
              width: `${20 + Math.random() * 60}px`,
              height: `${20 + Math.random() * 60}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 10}s infinite linear ${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Animated waveform */}
      <div className="absolute inset-x-0 bottom-0 h-32 opacity-20">
        <svg viewBox="0 0 1440 320" className="w-full h-full">
          <path 
            fill="#f97316" 
            fillOpacity="1" 
            d="M0,192L48,176C96,160,192,128,288,133.3C384,139,480,181,576,197.3C672,213,768,203,864,170.7C960,139,1056,85,1152,74.7C1248,64,1344,96,1392,112L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            className="animate-pulse"
          ></path>
        </svg>
      </div>

      <div className={`transition-all duration-1000 transform ${isLoaded ? 'scale-110 opacity-0' : 'scale-100 opacity-100'}`}>
        {/* Logo with pulsing effect */}
        <div className="relative mb-12 flex flex-col items-center">
          <div className="relative w-24 h-24 mb-6">
            {/* Animated rings */}
            {[...Array(3)].map((_, i) => (
              <div 
                key={i} 
                className={`absolute inset-0 rounded-full border-2 border-orange-500 opacity-${30 - i * 10}`}
                style={{
                  animation: `ping 2s cubic-bezier(0, 0, 0.2, 1) infinite ${i * 0.5}s`,
                  transformOrigin: 'center',
                }}
              ></div>
            ))}
            
            {/* Center orb */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center animate-pulse">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 4v2m0 12v2M4 12h2m12 0h2m-4.6-6.6l1.4-1.4M6.6 6.6L5.2 5.2m12.2 12.2l1.4 1.4M6.6 17.4l-1.4 1.4" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-center">
            <span className="text-orange-500">RNS-</span>
            <span className="text-white">SynthGenie</span>
          </h1>
          <p className="text-orange-300 text-sm mb-8">Synthesizing your world</p>
        </div>
        
        {/* Loading progress bar with animated gradient */}
        <div className="w-80 mb-10">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-orange-200 font-medium">Initializing System</span>
            <span className="text-sm text-orange-200 font-medium">{progress}%</span>
          </div>
          <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600 rounded-full transition-all duration-300 ease-out relative"
              style={{ 
                width: `${progress}%`,
                backgroundSize: '200% 100%',
                animation: 'gradientMove 2s linear infinite'
              }}
            >
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 opacity-30" style={{
                  backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  animation: 'shimmer 1.5s infinite',
                  backgroundSize: '50% 100%',
                }}></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Animated loading messages */}
        <LoadingMessages />
      </div>

      {/* Custom CSS animations */}
      <style jsx>{`
        @keyframes gradientMove {
          0% { background-position: 0% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes float {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
          100% { transform: translateY(0) rotate(360deg); }
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

function LoadingMessages() {
  const messages = [
    "Initializing synthesis modules...",
    "Calibrating harmonic resonance...",
    "Establishing neural pathways...",
    "Aligning frequency matrices...",
    "Optimizing signal processors...",
    "Loading sample libraries...",
    "Preparing synthesis engine..."
  ];
  
  const [currentMessage, setCurrentMessage] = useState(0);
  const [fadeState, setFadeState] = useState('in');
  
  useEffect(() => {
    const fadeTimer = setInterval(() => {
      setFadeState(prev => prev === 'in' ? 'out' : 'in');
      
      if (fadeState === 'out') {
        setCurrentMessage(prev => (prev + 1) % messages.length);
      }
    }, 1500);
    
    return () => clearInterval(fadeTimer);
  }, [fadeState]);
  
  return (
    <div className="h-16 w-80 flex items-center justify-center">
      <div 
        className={`text-sm text-orange-200 transition-opacity duration-500 text-center ${
          fadeState === 'in' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {messages[currentMessage]}
      </div>
    </div>
  );
}