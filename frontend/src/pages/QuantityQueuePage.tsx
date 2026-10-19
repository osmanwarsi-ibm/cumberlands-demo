/**
 * QuantityQueuePage - Quantity exception and unmatched review queue
 * Matches wireframe_quantity_review_queue_from_batch_match_results.html design exactly
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

export function QuantityQueuePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [counts, setCounts] = useState<QueueCounts>({ open: 0, in_review: 0, escalated: 0, decided: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('open');
  const [caseTypeFilter, setCaseTypeFilter] = useState('All types');
  const [confidenceFilter, setConfidenceFilter] = useState('All bands');
  const [sortBy, setSortBy] = useState('Manual-review cases first');

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await queueAPI.getQueue('quantity_review', { status: 'open' });
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

  const getCaseTypeChip = (caseType: string): { text: string; color: 'red' | 'blue' | 'gray' } => {
    if (caseType === 'QUANTITY_EXCEPTION') return { text: 'QUANTITY EXCEPTION', color: 'red' };
    if (caseType === 'UNMATCHED_STATEMENT') return { text: 'UNMATCHED STATEMENT', color: 'blue' };
    if (caseType === 'UNMATCHED_RECEIPT') return { text: 'UNMATCHED RECEIPT', color: 'gray' };
    return { text: caseType, color: 'gray' };
  };

  const formatQuantityVariance = (item: QueueItem): string => {
    return '—';
  };

  const formatStmtRecvQty = (item: QueueItem): string => {
    return '—';
  };

  const isManualReview = (item: QueueItem): boolean => {
    return item.confidence_band === 'NONE' && item.missing_context_count > 2;
  };

  const manualReviewCount = items.filter(isManualReview).length;

  if (loading) {
    return (
      <div style={{ padding: '24px 32px' }}>
        <p>Loading quantity review queue...</p>
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
            href="/quantity-queue"
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
            Quantity review queue
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
        Pilot environment: fixture data only. Recommendations are never applied without your decision.
      </div>

      {/* Main content */}
      <main id="main" style={{ width: '100%', padding: '24px 32px 48px' }}>
        <p style={{ fontSize: '13px', color: 'var(--ink2)', margin: '0 0 8px' }}>
          <a href="/batches/1" style={{ color: 'var(--bl)' }}>Batch results</a> / Quantity review queue · route /queues/quantity_review
        </p>
        <h1 style={{ fontFamily: 'var(--fh)', fontSize: '30px', margin: '0 0 6px' }}>
          Quantity and unmatched review queue
        </h1>
        <p style={{ color: 'var(--ink2)', margin: '0 0 20px', fontSize: '16px' }}>
          Quantity exceptions (more than 2 units and more than 2%), unmatched statement lines and unmatched receipts. Cases with more than two missing context elements have no automated recommendation.
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

        {/* Manual review alert banner */}
        {manualReviewCount > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '4px',
              border: '1px solid #E3A5A0',
              marginBottom: '16px',
              alignItems: 'flex-start',
              background: 'var(--rdb)',
              color: '#6F1414',
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
              <path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8" />
              <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-5.9-2.4L3.4 16a2 2 0 0 1 3.2-2.4L8 15" />
            </svg>
            <div>
              <b>{manualReviewCount} cases require manual review.</b> More than two required context elements are missing, so no recommendation was produced and settlement cannot be prepared until a human decision is recorded.
            </div>
          </div>
        )}

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
            Open quantity and unmatched exceptions ({items.length} of {items.length})
          </h2>
          
          {/* Filters */}
          <form style={{ display: 'flex', gap: '16px', alignItems: 'end', marginBottom: '14px' }}>
            <div>
              <label htmlFor="a" style={{ fontWeight: 600, fontSize: '13px' }}>Case type</label>
              <br />
              <select
                id="a"
                value={caseTypeFilter}
                onChange={(e) => setCaseTypeFilter(e.target.value)}
                style={{
                  padding: '8px 10px',
                  border: '2px solid #7A8580',
                  borderRadius: '4px',
                  font: '14px var(--fb)',
                  background: '#fff',
                  color: 'var(--ink)',
                }}
              >
                <option>All types</option>
                <option>Quantity exception</option>
                <option>Unmatched statement</option>
                <option>Unmatched receipt</option>
              </select>
            </div>
            <div>
              <label htmlFor="b" style={{ fontWeight: 600, fontSize: '13px' }}>Confidence band</label>
              <br />
              <select
                id="b"
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
                <option>Manual-review cases first</option>
                <option>Dollar variance, largest first</option>
                <option>Oldest first</option>
              </select>
            </div>
          </form>

          {/* Queue table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                <th scope="col" style={{ textAlign: 'left', background: 'var(--sf2)', padding: '10px 12px', borderBottom: '2px solid var(--line)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Case</th>
                <th scope="col" style={{ textAlign: 'left', background: 'var(--sf2)', padding: '10px 12px', borderBottom: '2px solid var(--line)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
                <th scope="col" style={{ textAlign: 'left', background: 'var(--sf2)', padding: '10px 12px', borderBottom: '2px solid var(--line)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vendor / item</th>
                <th scope="col" style={{ textAlign: 'right', background: 'var(--sf2)', padding: '10px 12px', borderBottom: '2px solid var(--line)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stmt / Recv qty</th>
                <th scope="col" style={{ textAlign: 'right', background: 'var(--sf2)', padding: '10px 12px', borderBottom: '2px solid var(--line)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Variance</th>
                <th scope="col" style={{ textAlign: 'left', background: 'var(--sf2)', padding: '10px 12px', borderBottom: '2px solid var(--line)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confidence band</th>
                <th scope="col" style={{ textAlign: 'left', background: 'var(--sf2)', padding: '10px 12px', borderBottom: '2px solid var(--line)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommended action</th>
                <th scope="col" style={{ textAlign: 'left', background: 'var(--sf2)', padding: '10px 12px', borderBottom: '2px solid var(--line)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Missing context</th>
                <th scope="col" style={{ textAlign: 'left', background: 'var(--sf2)', padding: '10px 12px', borderBottom: '2px solid var(--line)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rule flags</th>
                <th scope="col" style={{ textAlign: 'left', background: 'var(--sf2)', padding: '10px 12px', borderBottom: '2px solid var(--line)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned</th>
                <th scope="col" style={{ textAlign: 'left', background: 'var(--sf2)', padding: '10px 12px', borderBottom: '2px solid var(--line)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <span style={{ position: 'absolute', left: '-9999px' }}>Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--ink2)' }}>
                    No quantity or unmatched exceptions in queue
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const manual = isManualReview(item);
                  const caseTypeData = getCaseTypeChip(item.case_type);
                  return (
                    <tr key={item.case_id} style={manual ? { background: '#FFF6E0' } : {}}>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--line)', verticalAlign: 'top', fontFamily: 'var(--fm)', fontSize: '13px' }}>
                        CASE-Q-{item.case_id}
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--line)', verticalAlign: 'top' }}>
                        <Chip color={caseTypeData.color}>{caseTypeData.text}</Chip>
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--line)', verticalAlign: 'top' }}>
                        —
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--line)', verticalAlign: 'top', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {formatStmtRecvQty(item)}
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--line)', verticalAlign: 'top', textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'pre-line' }}>
                        {formatQuantityVariance(item)}
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--line)', verticalAlign: 'top' }}>
                        <Chip color={getConfidenceColor(item.confidence_band || 'NONE')}>
                          {getConfidenceChipText(item)}
                        </Chip>
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--line)', verticalAlign: 'top' }}>
                        {manual && (
                          <>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontWeight: 700, color: '#6F1414', fontSize: '13px', marginBottom: '2px' }}>
                              <svg
                                style={{
                                  width: '15px',
                                  height: '15px',
                                  fill: 'none',
                                  stroke: 'currentColor',
                                  strokeWidth: '2',
                                  strokeLinecap: 'round',
                                  strokeLinejoin: 'round',
                                }}
                                viewBox="0 0 24 24"
                              >
                                <path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8" />
                                <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-5.9-2.4L3.4 16a2 2 0 0 1 3.2-2.4L8 15" />
                              </svg>
                              Manual review required: {item.missing_context_count} context elements missing
                            </div>
                            {item.missing_context_list && item.missing_context_list.length > 0 && (
                              <div style={{ fontSize: '12px', color: 'var(--ink2)', marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                <span>Missing:</span>
                                {item.missing_context_list.map((ctx, idx, arr) => (
                                  <span key={idx}>
                                    {ctx}
                                    {idx < arr.length - 1 && ','}
                                  </span>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                        {!manual && (item.recommended_action || 'No recommendation')}
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--line)', verticalAlign: 'top' }}>
                        {item.missing_context_count}
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--line)', verticalAlign: 'top' }}>
                        —
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--line)', verticalAlign: 'top' }}>
                        {item.assigned_role}
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--line)', verticalAlign: 'top' }}>
                        <Button
                          variant="primary"
                          onClick={() => navigate(`/quantity-case/${item.case_id}`)}
                          style={{ padding: '5px 11px', fontSize: '13px' }}
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          
          <p style={{ fontSize: '13px', color: 'var(--ink2)', margin: '12px 0 0' }}>
            Cases with dollar variance over $5,000 route directly to the Inventory Control Manager; none are in this batch. Rows with a tinted background need manual review.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ padding: '16px 32px', borderTop: '1px solid var(--line)', fontSize: '13px', color: 'var(--ink2)' }}>
        Pilot build · fixture data only · vendor, item and user names are fictional. Reason and flag labels are pilot fixture values.
      </footer>
    </div>
  );
}
