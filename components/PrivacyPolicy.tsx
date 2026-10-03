import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 p-8 md:p-16 font-quicksand">
      <div className="max-w-3xl mx-auto bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-4xl font-fredoka text-white mb-6">Privacy Policy</h1>
        <p className="text-slate-400 mb-4">Last updated: April 4, 2026</p>
        
        <div className="space-y-6 text-slate-300">
          <section>
            <h2 className="text-2xl font-fredoka text-red-400 mb-3">1. Information We Collect</h2>
            <p>Wipeout Pimo is a simple web-based game. We do not collect, store, or share any personal information. All game data, including scores, unlocked characters, and settings, are stored locally on your device using your browser's local storage.</p>
          </section>

          <section>
            <h2 className="text-2xl font-fredoka text-red-400 mb-3">2. How We Use Your Information</h2>
            <p>Because we do not collect any personal data, we do not use your information for any purpose. Your local game data is used solely to save your progress within the game.</p>
          </section>

          <section>
            <h2 className="text-2xl font-fredoka text-red-400 mb-3">3. Third-Party Services</h2>
            <p>Our game may use third-party services (such as Google Play Services if downloaded from the Play Store) which may collect information used to identify you. Please refer to the privacy policies of these third-party service providers for more information.</p>
          </section>

          <section>
            <h2 className="text-2xl font-fredoka text-red-400 mb-3">4. Changes to This Privacy Policy</h2>
            <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>
          </section>

          <section>
            <h2 className="text-2xl font-fredoka text-red-400 mb-3">5. Contact Us</h2>
            <p>If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us.</p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10">
          <a href="/" className="text-red-400 hover:text-red-300 font-fredoka transition-colors">
            &larr; Back to Game
          </a>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
