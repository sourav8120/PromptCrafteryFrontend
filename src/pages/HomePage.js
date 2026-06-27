import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchCategories, fetchPrompts } from '../services/api';
import PromptCard from '../components/PromptCard';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories
  });

  const { data: featuredData } = useQuery({
    queryKey: ['prompts', 'featured'],
    queryFn: () => fetchPrompts({ featured: true, limit: 6 })
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/prompts?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb orb1" />
          <div className="hero-orb orb2" />
          <div className="hero-orb orb3" />
        </div>
        <div className="container hero-content">
          <div className="hero-tag">🚀 10,000+ Expert Prompts</div>
          <h1 className="hero-title">
            Find the <span className="gradient-text">Perfect Prompt</span>
            <br />for Every Need
          </h1>
          <p className="hero-subtitle">
            Discover expertly crafted AI prompts for studying, coding, fitness,
            business, creativity and more — all in one place.
          </p>
          <form className="hero-search" onSubmit={handleSearch}>
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search prompts... e.g. 'workout plan', 'SQL query', 'essay writing'"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn">Search</button>
            </div>
          </form>
          <div className="hero-stats">
            <div className="stat"><span>{categories.length}+</span> Categories</div>
            <div className="stat-divider" />
            <div className="stat"><span>1000+</span> Prompts</div>
            <div className="stat-divider" />
            <div className="stat"><span>Free</span> Forever</div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section categories-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Browse by <span className="gradient-text">Category</span></h2>
            <p>Thousands of prompts organized by topic</p>
          </div>
          <div className="categories-grid">
            {categories.map(cat => (
              <a key={cat._id} href={`/category/${cat.slug}`} className="category-card" style={{ '--cat-color': cat.color }}>
                <div className="cat-icon">{cat.icon}</div>
                <div className="cat-info">
                  <h3>{cat.name}</h3>
                  <p>{cat.promptCount || 0} prompts</p>
                </div>
                <div className="cat-arrow">→</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Prompts */}
      {featuredData?.prompts?.length > 0 && (
        <section className="section featured-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">⭐ <span className="gradient-text">Featured</span> Prompts</h2>
              <a href="/prompts?featured=true" className="btn btn-outline">View All →</a>
            </div>
            <div className="grid-3">
              {featuredData.prompts.map(p => <PromptCard key={p._id} prompt={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-orb" />
            <h2>Ready to supercharge your AI experience?</h2>
            <p>Browse our full library of expertly crafted prompts.</p>
            <a href="/prompts" className="btn btn-primary cta-btn">Explore All Prompts →</a>
          </div>
        </div>
      </section>
    </div>
  );
}
