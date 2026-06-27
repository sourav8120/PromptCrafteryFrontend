import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner bg-white ">
        <div className="footer-brand">
          <div className="footer-logo">⚡ Prompt<span>Vault</span></div>
          <p>Discover thousands of expert AI prompts crafted for every need — from study and code to health and creativity.</p>
        </div>
        <div className="footer-links">
          <div>
            <h4>Browse</h4>
            <Link to="/prompts">All Prompts</Link>
            <Link to="/prompts?featured=true">Featured</Link>
            <Link to="/category/study-learning">Study</Link>
            <Link to="/category/software-development">Development</Link>
          </div>
          <div>
            <h4>Categories</h4>
            <Link to="/category/physical-fitness">Fitness</Link>
            <Link to="/category/health-wellness">Health</Link>
            <Link to="/category/business-marketing">Business</Link>
            <Link to="/category/creative-writing">Writing</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <p>© {new Date().getFullYear()} PromptVault. Built with ❤️</p>
        </div>
      </div>
    </footer>
  );
}
