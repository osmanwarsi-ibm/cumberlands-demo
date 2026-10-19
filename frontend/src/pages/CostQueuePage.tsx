/**
 * CostQueuePage - Cost exception review queue
 * Matches wireframe_cost_review_queue_from_batch_match_results.html design exactly
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth';
import { queueAPI } from '../api/client';
import { Chip } from '../components/Chip';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';
import type { QueueItem } from '../types/api';

interface QueueCounts {
  open: number;
  in_review: number;
  escalated: number;
  decided: number;
}

export function CostQueuePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [counts, setCounts] = useState<QueueCounts>({ open: 0, in_review: 0, escalated: 0, decided: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('open');
  const [confidenceFilter, setConfidenceFilter] = useState('All bands');
  const [vendorFilter, setVendorFilter] = useState('All vendors');
  const [sortBy, setSortBy] = useState('Cost variance, largest first');
  const [expandedContexts, setExpandedContexts] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await queueAPI.getQueue('cost_review', { status: 'open' });
      setItems(response.items || []);
      
      // Calculate counts from items
      const openCount = response.items?.filter(item => item.case_status === 'OPEN').length || 0;
      const inReviewCount = response.items?.filter(item => item.case_status === 'IN_REVIEW').length || 0;
      const escalatedCount = response.items?.filter(item => item.case_status === 'ESCALATED').length || 0;
      const decidedCount = response.items?.filter(item => item.case_status === 'DECIDED').length || 0;
      
      setCounts({
        open: openCount,
        in_review: inReviewCount,
        escalated: escalatedCount,
        decided: decidedCount,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  };

  const toggleContext = (caseId: number) => {
    setExpandedContexts(prev => {
      const next = new Set(prev);
      if (next.has(caseId)) {
        next.delete(caseId);
      } else {
        next.add(caseId);
      }
      return next;
    });
  };

  const getConfidenceChipText = (item: QueueItem): string => {
    if (!item.confidence_band || item.confidence_band === 'NONE') {
      return 'NONE';
    }
    const percentage = item.confidence_score ? Math.round(item.confidence_score * 100) : 0;
    return `${item.confidence_band} · ${percentage}%`;
  };

  const getConfidenceColor = (band: string): 'green' | 'amber' | 'red' | 'gray' => {
    if (band === 'GREEN') return 'green';
    if (band === 'AMBER') return 'amber';
    if (band === 'RED') return 'red';
    return 'gray';
  };

  const formatCostVariance = (item: QueueItem): string => {
    return '—';
  };

  const formatStmtVsExpected = (item: QueueItem): string => {
    return '—';
  };

  if (loading) {
    return (
      <div style={{ padding: '24px 32px' }}>
        <p>Loading cost review queue...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px 32px' }}>
        <Banner color="red">
          <strong>Error:</strong> {error}
        </Banner>
        <Button onClick={loadQueue}>Retry</Button>
      </div>
    );
  }

  return (
    <div style={{ minWidth: '1440px', width: '100%', background: 'var(--bg)', position: 'relative' }}>
      <a
        href="#main"
        style={{
          display: 'block',
          padding: '8px 32px',
          background: 'var(--sf)',
          color: 'var(--prd)',
          fontSize: '13px',
        }}
      >
        Skip to main content
      </a>
      
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--prd)',
          color: '#fff',
          padding: '0 32px',
          height: '64px',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            fontFamily: 'var(--fh)',
            fontSize: '20px',
            fontWeight: 700,
          }}
        >
          <svg
            style={{
              width: '28px',
              height: '28px',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: '2',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }}
            viewBox="0 0 24 24"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <div>
            DSD Receiving Reconciliation
            <small
              style={{
                display: 'block',
                fontFamily: 'var(--fb)',
                fontSize: '12px',
                fontWeight: 400,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Vendor statement matching · Pilot MVP
            </small>
          </div>
        </div>
        <nav style={{ display: 'flex', gap: '4px', height: '64px' }} aria-label="Primary">
          <a
            href="/cost-queue"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 14px',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '14px',
              borderBottom: '4px solid #F2C14E',
              fontWeight: 700,
              background: 'rgba(255,255,255,.1)',
            }}
            aria-current="page"
          >
            Cost review queue
          </a>
          <a
            href="/audit"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 14px',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '14px',
              borderBottom: '4px solid transparent',
            }}
          >
            Audit trace
          </a>
        </nav>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '13px' }}>
          <span>{user?.username} · <b>{user?.role}</b></span>
          <a href="/login" onClick={(e) => { e.preventDefault(); signOut(); navigate('/login'); }} style={{ color: '#fff' }}>
            Sign out
          </a>
        </div>
      </header>

      {/* Mockbar */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          background: 'var(--amb)',
          color: 'var(--am)',
          padding: '7px 32px',
          fontSize: '13px',
          borderBottom: '1px solid #E2C48A',
          fontWeight: 600,
        }}
      >
        <svg
          style={{
            width: '18px',
            height: '18px',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: '2',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          }}
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        Pilot environment: fixture data only. Recommendations come from the pilot triage step and are never applied without your decision.
      </div>

      {/* Main content */}
      <main id="main" style={{ width: '100%', padding: '24px 32px 48px' }}>
        <p style={{ fontSize: '13px', color: 'var(--ink2)', margin: '0 0 8px' }}>
          <a href="/batches/1" style={{ color: 'var(--bl)' }}>Batch results</a> / Cost review queue · route /queues/cost_review
        </p>
        <h1 style={{ fontFamily: 'var(--fh)', fontSize: '30px', margin: '0 0 6px' }}>
          Cost review queue
        </h1>
        <p style={{ color: 'var(--ink2)', margin: '0 0 20px', fontSize: '16px' }}>
          Cost exceptions where the statement unit cost differs from the Price Book cost by more than $0.05. Open a case to review the evidence and record a decision.
        </p>

        {/* Status tabs */}
        <nav
          style={{
            display: 'flex',
            margin: '0 0 16px',
            borderBottom: '2px solid var(--line)',
          }}
          aria-label="Queue status"
        >
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveTab('open'); }}
            style={{
              padding: '10px 18px',
              color: activeTab === 'open' ? 'var(--prd)' : 'var(--ink)',
              textDecoration: 'none',
              fontWeight: 600,
              borderBottom: activeTab === 'open' ? '4px solid var(--pr)' : '4px solid transparent',
              marginBottom: '-2px',
            }}
            aria-current={activeTab === 'open' ? 'page' : undefined}
          >
            Open
            <span
              style={{
                background: 'var(--sf2)',
                borderRadius: '10px',
                padding: '1px 8px',
                marginLeft: '6px',
                fontSize: '12px',
              }}
            >
              {counts.open}
            </span>
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveTab('in_review'); }}
            style={{
              padding: '10px 18px',
              color: activeTab === 'in_review' ? 'var(--prd)' : 'var(--ink)',
              textDecoration: 'none',
              fontWeight: 600,
              borderBottom: activeTab === 'in_review' ? '4px solid var(--pr)' : '4px solid transparent',
              marginBottom: '-2px',
            }}
          >
            In review
            <span
              style={{
                background: 'var(--sf2)',
                borderRadius: '10px',
                padding: '1px 8px',
                marginLeft: '6px',
                fontSize: '12px',
              }}
            >
              {counts.in_review}
            </span>
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveTab('escalated'); }}
            style={{
              padding: '10px 18px',
              color: activeTab === 'escalated' ? 'var(--prd)' : 'var(--ink)',
              textDecoration: 'none',
              fontWeight: 600,
              borderBottom: activeTab === 'escalated' ? '4px solid var(--pr)' : '4px solid transparent',
              marginBottom: '-2px',
            }}
          >
            Escalated
            <span
              style={{
                background: 'var(--sf2)',
                borderRadius: '10px',
                padding: '1px 8px',
                marginLeft: '6px',
                fontSize: '12px',
              }}
            >
              {counts.escalated}
            </span>
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveTab('decided'); }}
            style={{
              padding: '10px 18px',
              color: activeTab === 'decided' ? 'var(--prd)' : 'var(--ink)',
              textDecoration: 'none',
              fontWeight: 600,
              borderBottom: activeTab === 'decided' ? '4px solid var(--pr)' : '4px solid transparent',
              marginBottom: '-2px',
            }}
          >
            Decided
            <span
              style={{
                background: 'var(--sf2)',
                borderRadius: '10px',
                padding: '1px 8px',
                marginLeft: '6px',
                fontSize: '12px',
              }}
            >
              {counts.decided}
            </span>
          </a>
        </nav>

        {/* Queue card */}
        <section
          style={{
            background: 'var(--sf)',
            border: '1px solid var(--line)',
            borderRadius: '6px',
            padding: '20px',
            marginBottom: '20px',
          }}
          aria-labelledby="q"
        >
          <h2 style={{ fontFamily: 'var(--fh)', fontSize: '20px', margin: '0 0 12px' }} id="q">
            Open cost exceptions ({items.length} of {items.length})
          </h2>
          
          {/* Filters */}
          <form style={{ display: 'flex', gap: '16px', alignItems: 'end', marginBottom: '14px' }}>
            <div>
              <label htmlFor="a" style={{ fontWeight: 600, fontSize: '13px' }}>Confidence band</label>
              <br />
              <select
                id="a"
                value={confidenceFilter}
                onChange={(e) => setConfidenceFilter(e.target.value)}
                style={{
                  padding: '8px 10px',
                  border: '2px solid #7A8580',
                  borderRadius: '4px',
                  font: '14px var(--fb)',
                  background: '#fff',
                  color: 'var(--ink)',
                }}
              >
                <option>All bands</option>
                <option>GREEN</option>
                <option>AMBER</option>
                <option>RED</option>
                <option>NONE</option>
              </select>
            </div>
            <div>
              <label htmlFor="b" style={{ fontWeight: 600, fontSize: '13px' }}>Vendor</label>
              <br />
              <select
                id="b"
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                style={{
                  padding: '8px 10px',
                  border: '2px solid #7A8580',
                  borderRadius: '4px',
                  font: '14px var(--fb)',
                  background: '#fff',
                  color: 'var(--ink)',
                }}
              >
                <option>All vendors</option>
                <option>Coastal Dairy Co.</option>
                <option>Atlantic Beverage Dist.</option>
                <option>Yankee Snack Brands</option>
              </select>
            </div>
            <div>
              <label htmlFor="c" style={{ fontWeight: 600, fontSize: '13px' }}>Sort by</label>
              <br />
              <select
                id="c"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '8px 10px',
                  border: '2px solid #7A8580',
                  borderRadius: '4px',
                  font: '14px var(--fb)',
                  background: '#fff',
                  color: 'var(--ink)',
                }}
              >
                <option>Cost variance, largest first</option>
                <option>Oldest first</option>
                <option>Confidence band</option>
              </select>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--ink2)', marginLeft: 'auto' }}>
              Review target: 2 minutes per standard case. Review SLA: 4 business hours.
            </span>
          </form>

          {/* Queue table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                <th scope="col" style={{ textAlign: 'left', background: 'var(--sf2)', padding: '10px 12px', borderBottom: '2px solid var(--line)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Case</th>
                <th scope="col" style={{ textAlign: 'left', background: 'var(--sf2)', padding: '10px 12px', borderBottom: '2px solid var(--line)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vendor / item</th>
                <th scope="col" style={{ textAlign: 'right', background: 'var(--sf2)', padding: '10px 12px', borderBottom: '2px solid var(--line)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stmt vs expected cost</th>
                <th scope="col" style={{ textAlign: 'right', background: 'var(--sf2)', padding: '10px 12px', borderBottom: '2px solid var(--line)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Variance</th>
                <th scope="col" style={{ textAlign: 'left', background: 'var(--sf2)', padding: '10px 12px', borderBottom: '2px solid var(--line)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confidence band</th>
                <th scope="col" style={{ textAlign: 'left', background: 'var(--sf2)', padding: '10px 12px', borderBottom: '2px solid var(--line)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommended action</th>
                <th scope="col" style={{ textAlign: 'left', background: 'var(--sf2)', padding: '10px 12px', borderBottom: '2px solid var(--line)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Missing context</th>
                <th scope="col" style={{ textAlign: 'left', background: 'var(--sf2)', padding: '10px 12px', borderBottom: '2px solid var(--line)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Flags</th>
                <th scope="col" style={{ textAlign: 'left', background: 'var(--sf2)', padding: '10px 12px', borderBottom: '2px solid var(--line)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th scope="col" style={{ textAlign: 'left', background: 'var(--sf2)', padding: '10px 12px', borderBottom: '2px solid var(--line)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <span style={{ position: 'absolute', left: '-9999px' }}>Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--ink2)' }}>
                    No cost exceptions in queue
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.case_id}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--line)', verticalAlign: 'top', fontFamily: 'var(--fm)', fontSize: '13px' }}>
                      CASE-C-{item.case_id}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--line)', verticalAlign: 'top' }}>
                      —
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--line)', verticalAlign: 'top', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {formatStmtVsExpected(item)}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--line)', verticalAlign: 'top', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCostVariance(item)}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--line)', verticalAlign: 'top' }}>
                      <Chip color={getConfidenceColor(item.confidence_band || 'NONE')}>
                        {getConfidenceChipText(item)}
                      </Chip>
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--line)', verticalAlign: 'top' }}>
                      {item.recommended_action || '—'}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--line)', verticalAlign: 'top' }}>
                      {item.missing_context_count}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--line)', verticalAlign: 'top' }}>
                      —
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--line)', verticalAlign: 'top' }}>
                      <Chip color="blue">OPEN</Chip>
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--line)', verticalAlign: 'top' }}>
                      <Button
                        variant="primary"
                        onClick={() => navigate(`/cost-case/${item.case_id}`)}
                        style={{ padding: '5px 11px', fontSize: '13px' }}
                      >
                        Review
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--ink2)' }}>
              Queue holds up to 150 items per week; this batch contributes {items.length}. Every case shows its confidence band as text.
            </span>
            <Button
              variant="secondary"
              onClick={() => navigate('/quantity-queue')}
              style={{ padding: '5px 11px', fontSize: '13px' }}
            >
              Switch to quantity queue
            </Button>
          </div>
        </section>

        {/* Info banner */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '4px',
            border: '1px solid #E2C48A',
            marginBottom: '16px',
            alignItems: 'flex-start',
            background: 'var(--amb)',
            color: '#5E3800',
          }}
          role="note"
        >
          <svg
            style={{
              width: '18px',
              height: '18px',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: '2',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              flexShrink: 0,
            }}
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <div>
            <b>AMBER means a human must approve.</b> Even where the AI step recommends approval, nothing moves toward settlement until a reviewer records a decision. Cases under 70% confidence or with more than two missing context elements carry no recommendation.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: '16px 32px', borderTop: '1px solid var(--line)', fontSize: '13px', color: 'var(--ink2)' }}>
        Pilot build · fixture data only · vendor, item and user names are fictional. Reason and flag labels are pilot fixture values.
      </footer>
    </div>
  );
}
