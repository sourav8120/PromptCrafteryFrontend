import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchCategories, fetchPrompts } from '../services/api';
import PromptCard from '../components/PromptCard';
import './CategoryPage.css';

export default function CategoryPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('-createdAt');

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const category = categories.find(c => c.slug === slug);

  const { data, isLoading } = useQuery({
    queryKey: ['prompts', 'category', slug, page, sort],
    queryFn: () => fetchPrompts({ category: slug, page, limit: 12, sort }),
    enabled: !!slug
  });

  const prompts = data?.prompts || [];
  const pagination = data?.pagination || {};

  if (!category && !isLoading) return (
    <div className="cat-error">
      <h2>Category not found</h2>
      <Link to="/prompts" className="btn btn-primary">Browse All Prompts</Link>
    </div>
  );

  return (
    <div className="category-page" style={{ '--cat-color': category?.color || '#7c3aed' }}>
      <div className="cat-hero">
        <div className="cat-hero-bg" />
        <div className="container">
          <Link to="/prompts" className="back-link">← Back to All Prompts</Link>
          <div className="cat-hero-content">
            <div className="cat-hero-icon">{category?.icon || '📁'}</div>
            <div>
              <h1>{category?.name || slug}</h1>
              <p>{category?.description}</p>
              <div className="cat-hero-meta">
                <span>{pagination.total || 0} prompts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container cat-body">
        <div className="cat-toolbar">
          <p className="results-count">{pagination.total || 0} prompts in this category</p>
          <select className="input-field sort-select" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="-createdAt">Newest</option>
            <option value="-views">Most Viewed</option>
            <option value="-copies">Most Copied</option>
            <option value="-likes">Most Liked</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex-center" style={{ padding: '80px 0' }}><div className="loading-spinner" /></div>
        ) : (
          <div className="prompts-grid-cat">
            {prompts.map(p => <PromptCard key={p._id} prompt={p} />)}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="pagination">
            <button className="btn btn-outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Page {page} of {pagination.pages}</span>
            <button className="btn btn-outline" disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}

        {/* Other categories */}
        <div className="other-cats">
          <h3>Other Categories</h3>
          <div className="other-cats-grid">
            {categories.filter(c => c.slug !== slug).slice(0, 6).map(cat => (
              <Link key={cat._id} to={`/category/${cat.slug}`} className="other-cat-chip">
                {cat.icon} {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
