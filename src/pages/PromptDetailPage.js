import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useUser } from '../context/UserContext';
import { fetchPrompt, fetchPrompts, incrementCopy, likePrompt } from '../services/api';
import PromptCard from '../components/PromptCard';
import SubscriptionModal from '../components/SubscriptionModal';
import './PromptDetailPage.css';

const DIFFICULTY_COLORS = { beginner: '#10b981', intermediate: '#f59e0b', advanced: '#ef4444' };

export default function PromptDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, incrementPromptUsage } = useUser();
  const [copied, setCopied] = useState(false);
  const [likes, setLikes] = useState(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const { data: prompt, isLoading, isError } = useQuery({
    queryKey: ['prompt', slug],
    queryFn: () => fetchPrompt(slug)
  });

  const { data: relatedData } = useQuery({
    queryKey: ['prompts', 'related', prompt?.category?._id],
    queryFn: () => fetchPrompts({ category: prompt?.category?.slug, limit: 3 }),
    enabled: !!prompt?.category
  });

  const handleCopy = async () => {
    // Check if user is logged in
    if (!user) {
      toast.error('Please login to copy prompts');
      navigate('/login');
      return;
    }

    // Check if user has prompts remaining
    if (!user.subscription || user.subscription.plan === 'free') {
      const result = await incrementPromptUsage();
      
      if (!result.success) {
        toast.error('You\'ve used all your free prompts!');
        setShowSubscriptionModal(true);
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      await incrementCopy(prompt._id);
      toast.success('Prompt copied to clipboard!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like prompts');
      navigate('/login');
      return;
    }

    try {
      const data = await likePrompt(prompt._id);
      setLikes(data.likes);
      toast.success('Liked!');
    } catch {}
  };

  if (isLoading) return (
    <div className="detail-loading">
      <div className="loading-spinner" />
    </div>
  );

  if (isError || !prompt) return (
    <div className="detail-error">
      <h2>Prompt not found</h2>
      <Link to="/prompts" className="btn btn-primary">Browse Prompts</Link>
    </div>
  );

  const catColor = prompt.category?.color || '#7c3aed';
  const currentLikes = likes !== null ? likes : (prompt.likes || 0);

  return (
    <div className="detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span>›</span>
          <Link to="/prompts">Prompts</Link>
          {prompt.category && <>
            <span>›</span>
            <Link to={`/category/${prompt.category.slug}`}>{prompt.category.icon} {prompt.category.name}</Link>
          </>}
          <span>›</span>
          <span>{prompt.title}</span>
        </nav>

        <div className="detail-layout">
          {/* Main */}
          <div className="detail-main">
            <div className="detail-header">
              {prompt.category && (
                <Link to={`/category/${prompt.category.slug}`} className="detail-cat-badge" style={{ background: `${catColor}20`, color: catColor, borderColor: `${catColor}40` }}>
                  {prompt.category.icon} {prompt.category.name}
                </Link>
              )}
              {prompt.isFeatured && <span className="featured-badge">★ Featured</span>}
            </div>

            <h1 className="detail-title">{prompt.title}</h1>

            {prompt.description && <p className="detail-desc">{prompt.description}</p>}

            <div className="detail-meta-row">
              <span className="difficulty-badge" style={{ color: DIFFICULTY_COLORS[prompt.difficulty] }}>
                ● {prompt.difficulty}
              </span>
              <span className="meta-chip">🤖 {prompt.aiModel}</span>
              <span className="meta-chip">👁 {prompt.views} views</span>
              <span className="meta-chip">📋 {prompt.copies} copies</span>
              <span className="meta-chip">♥ {currentLikes} likes</span>
            </div>

            {/* Prompt Content */}
            <div className="prompt-content-box">
              <div className="prompt-content-header">
                <span className="content-label">📝 Prompt Template</span>
                <button className={`copy-big-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
                  {copied ? '✓ Copied!' : '⧉ Copy Prompt'}
                </button>
              </div>
              <div className="prompt-content-body">
                <pre>{prompt.content}</pre>
              </div>
              <div className="prompt-content-hint">
                💡 Replace text in <strong>[BRACKETS]</strong> with your specific details
              </div>
            </div>

            {/* Tags */}
            {prompt.tags?.length > 0 && (
              <div className="detail-tags">
                {prompt.tags.map(tag => (
                  <Link key={tag} to={`/prompts?tags=${tag}`} className="tag">#{tag}</Link>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="detail-actions">
              <button className="btn btn-primary copy-action" onClick={handleCopy}>
                {copied ? '✓ Copied!' : '⧉ Copy to Clipboard'}
              </button>
              <button className="btn btn-outline like-action" onClick={handleLike}>
                ♥ Like ({currentLikes})
              </button>
            </div>

            {/* Usage Info */}
            {user && user.subscription?.plan === 'free' && (
              <div className="usage-info">
                <div className="usage-bar">
                  <div className="usage-label">
                    <span>📊 Free Prompts Used</span>
                    <span className="usage-count">{user.promptsUsed} / 5</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${(user.promptsUsed / 5) * 100}%` }}
                    />
                  </div>
                </div>
                {user.promptsUsed >= 5 && (
                  <div className="upgrade-banner">
                    <span>🔒 Free prompts limit reached!</span>
                    <button 
                      className="upgrade-btn"
                      onClick={() => setShowSubscriptionModal(true)}
                    >
                      View Plans
                    </button>
                  </div>
                )}
                {user.promptsUsed === 4 && (
                  <div className="almost-full">
                    <span>⚠️ Only 1 free prompt remaining. Upgrade soon!</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="detail-sidebar">
            <div className="sidebar-card">
              <h3>How to Use</h3>
              <ol className="how-to-list">
                <li>Copy the prompt using the button above</li>
                <li>Open your preferred AI tool (ChatGPT, Claude, etc.)</li>
                <li>Paste the prompt</li>
                <li>Replace <strong>[BRACKETS]</strong> with your details</li>
                <li>Send and get your result!</li>
              </ol>
            </div>

            <div className="sidebar-card">
              <h3>Prompt Info</h3>
              <div className="info-list">
                <div className="info-row">
                  <span>Category</span>
                  <span>{prompt.category?.name || 'General'}</span>
                </div>
                <div className="info-row">
                  <span>Difficulty</span>
                  <span style={{ color: DIFFICULTY_COLORS[prompt.difficulty], textTransform: 'capitalize' }}>{prompt.difficulty}</span>
                </div>
                <div className="info-row">
                  <span>Best For</span>
                  <span>{prompt.aiModel}</span>
                </div>
                <div className="info-row">
                  <span>Author</span>
                  <span>{prompt.author}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Related Prompts */}
        {relatedData?.prompts?.length > 0 && (
          <div className="related-section">
            <h2 className="section-title">Related <span className="gradient-text">Prompts</span></h2>
            <div className="grid-3">
              {relatedData.prompts.filter(p => p.slug !== slug).slice(0, 3).map(p => (
                <PromptCard key={p._id} prompt={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      <SubscriptionModal 
        isOpen={showSubscriptionModal} 
        onClose={() => setShowSubscriptionModal(false)}
        promptsUsed={user?.promptsUsed || 0}
      />
    </div>
  );
}
