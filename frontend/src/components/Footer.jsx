import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-[#0f172a] border-t border-slate-800 py-12 px-4 transition-all duration-300">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        
        {/* Brand & Logo */}
        <div className="flex flex-col items-center md:items-start gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-glow">
              S
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Suvidha<span className="text-blue-500">AI</span>
            </span>
          </div>
          <p className="text-slate-400 text-sm max-w-xs text-center md:text-left">
            Trusted hyperlocal services at your doorstep. Powered by AI, managed by experts.
          </p>
        </div>

        {/* Links Group */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
          <div className="flex flex-col gap-2">
            <h4 className="text-white font-semibold mb-1">Marketplace</h4>
            <a href="/services" className="text-slate-400 hover:text-blue-400 transition-colors">Find Services</a>
            <a href="/register" className="text-slate-400 hover:text-blue-400 transition-colors">Become a Provider</a>
            <a href="/" className="text-slate-400 hover:text-blue-400 transition-colors">Recommendations</a>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-white font-semibold mb-1">Platform</h4>
            <a href="/" className="text-slate-400 hover:text-blue-400 transition-colors">How it Works</a>
            <a href="/" className="text-slate-400 hover:text-blue-400 transition-colors">Safety</a>
            <a href="/" className="text-slate-400 hover:text-blue-400 transition-colors">Support</a>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-white font-semibold mb-1">Company</h4>
            <a href="/" className="text-slate-400 hover:text-blue-400 transition-colors">About Us</a>
            <a href="/" className="text-slate-400 hover:text-blue-400 transition-colors">Privacy Policy</a>
            <a href="/" className="text-slate-400 hover:text-blue-400 transition-colors">Terms of Service</a>
          </div>
        </div>

        {/* Provided Logo/Link */}
        <div className="flex flex-col items-center md:items-end gap-3">
          <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Powered By</p>
          <a
            href="https://suvidha-ai-git-main-hardik-1226s-projects.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-300 hover:text-white transition-opacity opacity-80 hover:opacity-100"
          >
            <svg
              width="68"
              height="13"
              viewBox="0 0 68 13"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              className="w-20 h-auto"
            >
              <path
                d="M37.015 12.7658V5.24959H38.5727V6.19652C38.8237 5.81301 39.5362 5.09334 40.8832 5.09334C42.9499 5.09334 44.0388 6.37643 44.0388 8.20164V12.7658H42.4882V8.5307C42.4882 7.28549 41.8065 6.56582 40.6394 6.56582C39.496 6.56582 38.5656 7.28549 38.5656 8.5307V12.7658H37.015Z"
              />
              <path
                d="M49.0906 5.09334C50.3666 5.09334 51.2117 5.56207 51.768 6.27464V1.74121H53.3186V12.7658H51.768V11.7408C51.2117 12.4534 50.3666 12.9221 49.0906 12.9221C46.953 12.9221 45.3172 11.2768 45.3172 8.96866C45.3172 6.65815 46.953 5.09334 49.0906 5.09334ZM46.8654 8.96866C46.8654 10.3535 47.8289 11.5277 49.2776 11.5277C50.7264 11.5277 51.7586 10.3535 51.7586 8.96866C51.7586 7.58377 50.717 6.4877 49.2776 6.4877C47.8289 6.48533 46.8654 7.5814 46.8654 8.96866Z"
              />
              <path
                d="M58.5148 5.09334C60.707 5.09334 62.1321 6.72206 62.1321 8.73429C62.1321 8.96866 62.1155 9.21249 62.0705 9.45396H56.2375C56.3085 10.5808 57.272 11.4662 58.5717 11.4662C59.5115 11.4662 60.2619 11.0661 60.8253 10.1831L61.9687 11.014C61.2727 12.2663 59.9021 12.9245 58.5717 12.9245C56.3014 12.9245 54.6325 11.2484 54.6325 9.01837C54.6301 6.77651 56.2351 5.09334 58.5148 5.09334ZM60.5578 8.29397C60.4631 7.23814 59.5801 6.49243 58.4983 6.49243C57.3478 6.49243 56.4695 7.23577 56.2754 8.29397H60.5578Z"
              />
              <path
                d="M63.6306 12.7658V5.24959H65.1883V6.27464C65.612 5.45318 66.3246 5.09334 67.146 5.09334C67.7331 5.09334 68.1805 5.28036 68.1805 5.28036L68.0172 6.70549C67.9319 6.67472 67.5934 6.53268 67.101 6.53268C66.2701 6.53268 65.1906 6.97063 65.1906 8.67037V12.7658H63.6306Z"
              />
              <path
                d="M9.72722 0.0036066C8.06065 -0.0745152 6.65921 1.12572 6.42011 2.70709C6.41064 2.78048 6.39644 2.8515 6.3846 2.92252C6.01293 4.89213 4.28244 6.38355 2.20395 6.38355C1.46299 6.38355 0.767004 6.19416 0.160976 5.86274C0.0875901 5.82249 0 5.87457 0 5.95743V6.38118V12.7659H6.38223V7.97913C6.38223 7.09848 7.09716 6.38355 7.97779 6.38355H9.57335C11.3796 6.38355 12.8331 4.88503 12.7621 3.06219C12.6982 1.42163 11.3678 0.0817284 9.72722 0.0036066Z"
              />
            </svg>
          </a>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-500 text-xs text-center sm:text-left">
        <p>© 2026 SuvidhaAI Hyperlocal Marketplace. All rights reserved.</p>
        <p>Made with ❤️ by Hardik Varshney.</p>
      </div>
    </footer>
  );
};

export default Footer;
