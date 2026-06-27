import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { incrementCopy, likePrompt } from '../services/api';
import './PromptCard.css';

const DIFFICULTY_COLORS = {
  beginner: '#10b981',
  intermediate: '#f59e0b',
  advanced: '#ef4444'
};

export default function PromptCard({ prompt }) {
  const [likes, setLikes] = useState(prompt.likes || 0);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      await incrementCopy(prompt._id);
      toast.success('Prompt copied!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const data = await likePrompt(prompt._id);
      setLikes(data.likes);
    } catch {}
  };

  const categoryColor = prompt.category?.color || '#7c3aed';

  return (
    <Link to={`/prompts/${prompt.slug}`} className="prompt-card">
      <div className="prompt-card-header">
        {prompt.category && (
          <span className="prompt-cat-badge" style={{ background: `${categoryColor}20`, color: categoryColor, borderColor: `${categoryColor}40` }}>
            {prompt.category.icon} {prompt.category.name}
          </span>
        )}
        {prompt.isFeatured && <span className="featured-badge">★ Featured</span>}
      </div>

      <h3 className="prompt-card-title">{prompt.title}</h3>

      {prompt.description && (
        <p className="prompt-card-desc">{prompt.description}</p>
      )}

      <div className="prompt-card-preview">
        {prompt.content.substring(0, 120)}...
      </div>

      <div className="prompt-card-tags">
        {prompt.tags?.slice(0, 3).map(tag => (
          <span key={tag} className="tag">#{tag}</span>
        ))}
      </div>

      <div className="prompt-card-footer">
        <div className="prompt-card-meta">
          <span className="difficulty-dot" style={{ color: DIFFICULTY_COLORS[prompt.difficulty] }}>
            ● {prompt.difficulty}
          </span>
          <span className="meta-item">👁 {prompt.views}</span>
          <span className="meta-item">📋 {prompt.copies}</span>
        </div>
        <div className="prompt-card-actions">
          <button className="action-btn like-btn" onClick={handleLike} title="Like">
            ♥ {likes}
          </button>
          <button className={`action-btn copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
            {copied ? '✓ Copied' : '⧉ Copy'}
          </button>
        </div>
      </div>
    </Link>
  );
}
