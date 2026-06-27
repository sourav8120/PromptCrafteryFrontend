import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchPrompts, fetchCategories } from '../services/api';
import PromptCard from '../components/PromptCard';
import './PromptsPage.css';

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const AI_MODELS = ['Any', 'ChatGPT', 'Claude', 'Gemini', 'GPT-4', 'Llama'];

export default function PromptsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [inputVal, setInputVal] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [difficulty, setDifficulty] = useState('');
  const [aiModel, setAiModel] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('-createdAt');
  const featured = searchParams.get('featured');

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });

  const queryParams = { page, limit: 12, sort };
  if (search) queryParams.search = search;
  if (category) queryParams.category = category;
  if (difficulty) queryParams.difficulty = difficulty;
  if (aiModel) queryParams.aiModel = aiModel;
  if (featured) queryParams.featured = featured;

  const { data, isLoading } = useQuery({
    queryKey: ['prompts', queryParams],
    queryFn: () => fetchPrompts(queryParams),
    keepPreviousData: true
  });

  const prompts = data?.prompts || [];
  const pagination = data?.pagination || {};

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(inputVal);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch(''); setInputVal(''); setCategory('');
    setDifficulty(''); setAiModel(''); setPage(1);
    setSearchParams({});
  };

  const hasFilters = search || category || difficulty || aiModel || featured;

  return (
    <div className="prompts-page">
      <div className="prompts-hero">
        <div className="container">
          <h1 className="section-title">{featured ? '⭐ Featured Prompts' : 'Browse All Prompts'}</h1>
          <p>{featured ? 'Hand-picked prompts from our team' : 'Search and filter from thousands of expert AI prompts'}</p>
          <form className="prompts-search-bar" onSubmit={handleSearch}>
            <input
              type="text"
              className="input-field"
              placeholder="Search prompts by title, keyword, or topic..."
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">Search</button>
            {hasFilters && <button type="button" className="btn btn-outline" onClick={clearFilters}>Clear</button>}
          </form>
        </div>
      </div>

      <div className="container prompts-layout">
        {/* Sidebar Filters */}
        <aside className="filters-sidebar">
          <div className="filter-section">
            <h3>Category</h3>
            <div className="filter-list">
              <button className={`filter-item ${!category ? 'active' : ''}`} onClick={() => { setCategory(''); setPage(1); }}>
                All Categories
              </button>
              {categories.map(cat => (
                <button
                  key={cat._id}
                  className={`filter-item ${category === cat.slug ? 'active' : ''}`}
                  onClick={() => { setCategory(cat.slug); setPage(1); }}
                >
                  <span>{cat.icon}</span> {cat.name}
                  <span className="filter-count">{cat.promptCount || 0}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h3>Difficulty</h3>
            <div className="filter-list">
              <button className={`filter-item ${!difficulty ? 'active' : ''}`} onClick={() => setDifficulty('')}>All</button>
              {DIFFICULTIES.map(d => (
                <button key={d} className={`filter-item ${difficulty === d ? 'active' : ''}`} onClick={() => { setDifficulty(d); setPage(1); }}>
                  <span className={`diff-dot diff-${d}`}>●</span> {d}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h3>AI Model</h3>
            <div className="filter-list">
              {AI_MODELS.map(m => (
                <button key={m} className={`filter-item ${aiModel === m ? 'active' : ''}`} onClick={() => { setAiModel(aiModel === m ? '' : m); setPage(1); }}>
                  {m}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="prompts-main">
          <div className="prompts-toolbar">
            <p className="results-count">
              {isLoading ? 'Loading...' : `${pagination.total || 0} prompts found`}
            </p>
            <select className="input-field sort-select" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="-createdAt">Newest First</option>
              <option value="-views">Most Viewed</option>
              <option value="-copies">Most Copied</option>
              <option value="-likes">Most Liked</option>
              <option value="title">A-Z</option>
            </select>
          </div>

          {isLoading ? (
            <div className="flex-center" style={{ padding: '80px 0' }}>
              <div className="loading-spinner" />
            </div>
          ) : prompts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No prompts found</h3>
              <p>Try adjusting your search or filters</p>
              <button className="btn btn-outline" onClick={clearFilters}>Clear Filters</button>
            </div>
          ) : (
            <div className="prompts-grid">
              {prompts.map(p => <PromptCard key={p._id} prompt={p} />)}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button className="btn btn-outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <div className="page-nums">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button key={p} className={`page-num ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                  );
                })}
                {pagination.pages > 5 && <span>...</span>}
              </div>
              <button className="btn btn-outline" disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
