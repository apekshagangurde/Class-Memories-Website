import React from 'react';
import Header from '@/components/Header';
import MemoryGrid from '@/components/MemoryGrid';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <MemoryGrid />
      </main>
      
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-2xl font-heading font-bold">BE2025 Memories</h2>
              <p className="text-gray-400 mt-1">A digital time capsule for our class</p>
            </div>
            <div className="flex flex-col md:flex-row md:space-x-8">
              <a href="#" className="text-gray-300 hover:text-white my-2 md:my-0">Privacy Policy</a>
              <a href="#" className="text-gray-300 hover:text-white my-2 md:my-0">Terms of Use</a>
              <a href="#" className="text-gray-300 hover:text-white my-2 md:my-0">Contact Us</a>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-700 text-center text-gray-400 text-sm">
            <p>© 2023 BE2025 Class. All memories belong to their respective authors.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
