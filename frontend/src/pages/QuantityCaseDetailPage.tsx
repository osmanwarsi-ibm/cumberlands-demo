/**
 * QuantityCaseDetailPage - Quantity exception case detail
 * Matches wireframe_quantity_case_detail_from_quantity_review_queue.html design exactly
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth';
import { casesAPI } from '../api/client';
import { Chip } from '../components/Chip';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';
import type { CaseDetail } from '../types/api';

export function QuantityCaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [decisionType, setDecisionType] = useState<'APPROVE' | 'OVERRIDE' | 'ESCALATE'>('OVERRIDE');
  const [reasonCode, setReasonCode] = useState('');
  const [rationaleNote, setRationaleNote] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    reasonCode?: string;
    rationaleNote?: string;
  }>({});

  useEffect(() => {
    if (caseId) {
      loadCase();
    }
  }, [caseId]);

  const loadCase = async () => {
    if (!caseId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await casesAPI.getCaseDetail(caseId);
      setCaseData(data);
      
      // Pre-fill form from wireframe defaults
      setReasonCode('QC-03 Short shipment confirmed by receipt (pilot code)');
      setRationaleNote('Store receipt shows 64 cases received against 80 billed. Settle on 64 and raise short-ship credit of $33.60 with the vendor.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load case');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const errors: typeof validationErrors = {};
    if (!reasonCode) {
      errors.reasonCode = 'Choose a reason code before saving.';
    }
    if (!rationaleNote.trim()) {
      errors.rationaleNote = 'Add a rationale note before saving.';
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setValidationErrors({});
    
    try {
      setSubmitting(true);
      await casesAPI.submitReviewDecision(caseId!, {
        decision_type: decisionType,
        reviewer_user_id: user!.id,
        reason_code: reasonCode,
        rationale_note: rationaleNote,
      });
      // Reload case to show updated state
      await loadCase();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit decision');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px 32px' }}>
        <p>Loading case detail...</p>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div style={{ padding: '24px 32px' }}>
        <Banner color="red">
          <strong>Error:</strong> {error || 'Case not found'}
        </Banner>
        <Button onClick={() => navigate('/quantity-queue')}>Back to queue</Button>
      </div>
    );
  }

  const isManualReview = !caseData.triage?.confidence_band || caseData.triage.confidence_band === 'NONE';
  const missingContextCount = caseData.triage?.penalty_reasons?.length || 3;

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
          <span>{user?.username} · <b>{user?.role.replace('_', ' ')}</b></span>
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              signOut();
              navigate('/login');
            }}
            style={{ color: '#fff' }}
          >
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
        Pilot environment: fixture data only. Settlement cannot be prepared until a human decision is recorded.
      </div>

      {/* Main content */}
      <main id="main" style={{ width: '100%', padding: '24px 32px 48px' }}>
        <p style={{ fontSize: '13px', color: 'var(--ink2)', margin: '0 0 8px' }}>
          <a href="/quantity-queue" style={{ color: 'var(--bl)' }}>Quantity review queue</a> / Case CASE-Q-{caseData.case_id} · route /cases/CASE-Q-{caseData.case_id}
        </p>
        
        {/* Case header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--fh)', fontSize: '30px', margin: '0 0 6px' }}>
              Case CASE-Q-{caseData.case_id} · Quantity exception
            </h1>
            <p style={{ color: 'var(--ink2)', margin: 0, fontSize: '16px' }}>
              {caseData.vendor_id} · {caseData.item_id} · delivery {caseData.delivery_ref} · store {caseData.store_id}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Chip color="red">QUANTITY EXCEPTION</Chip>
            <br />
            <Chip color="red" style={{ marginTop: '4px' }}>MANUAL REVIEW REQUIRED</Chip>
            <br />
            <Chip color="gray" style={{ marginTop: '4px' }}>SETTLEMENT: NOT ELIGIBLE</Chip>
          </div>
        </div>

        {/* Manual review alert banner */}
        <Banner color="red" style={{ alignItems: 'flex-start' }}>
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
            <b>No automated recommendation. Manual review required.</b> {missingContextCount} required context elements are missing (limit is two), so the triage step stopped without a recommendation. The variance is {(caseData.match_basis.quantity_variance_pct || 0).toFixed(1)}% of invoice quantity, which is never auto-resolved.
          </div>
        </Banner>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          {/* Left column */}
          <div style={{ flex: '1.25 1 0', minWidth: 0 }}>
            {/* Deterministic match evidence */}
            <section
              style={{
                background: 'var(--sf)',
                border: '1px solid var(--line)',
                borderRadius: '6px',
                padding: '20px',
                marginBottom: '20px',
              }}
              aria-labelledby="ev"
            >
              <h2 style={{ fontFamily: 'var(--fh)', fontSize: '19px', margin: '0 0 12px' }} id="ev">
                Deterministic match evidence
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr>
                    <th scope="col" style={{ textAlign: 'left', background: 'var(--sf2)', padding: '9px 12px', borderBottom: '2px solid var(--line)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Measure</th>
                    <th scope="col" style={{ textAlign: 'right', background: 'var(--sf2)', padding: '9px 12px', borderBottom: '2px solid var(--line)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statement</th>
                    <th scope="col" style={{ textAlign: 'right', background: 'var(--sf2)', padding: '9px 12px', borderBottom: '2px solid var(--line)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Store receipt</th>
                    <th scope="col" style={{ textAlign: 'right', background: 'var(--sf2)', padding: '9px 12px', borderBottom: '2px solid var(--line)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Variance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row" style={{ textAlign: 'left', padding: '9px 12px', borderBottom: '1px solid var(--line)' }}>Quantity</th>
                    <td style={{ textAlign: 'right', padding: '9px 12px', borderBottom: '1px solid var(--line)', fontVariantNumeric: 'tabular-nums' }}>{caseData.match_basis.statement_qty}</td>
                    <td style={{ textAlign: 'right', padding: '9px 12px', borderBottom: '1px solid var(--line)', fontVariantNumeric: 'tabular-nums' }}>{caseData.match_basis.received_qty || caseData.match_basis.statement_qty}</td>
                    <td style={{ textAlign: 'right', padding: '9px 12px', borderBottom: '1px solid var(--line)', fontVariantNumeric: 'tabular-nums' }}>
                      <b>{Math.abs(caseData.match_basis.quantity_variance || 0)} units</b> ({(caseData.match_basis.quantity_variance_pct || 0).toFixed(1)}%)
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" style={{ textAlign: 'left', padding: '9px 12px', borderBottom: '1px solid var(--line)' }}>Unit cost</th>
                    <td style={{ textAlign: 'right', padding: '9px 12px', borderBottom: '1px solid var(--line)', fontVariantNumeric: 'tabular-nums' }}>${(caseData.match_basis.statement_unit_cost ?? 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: '9px 12px', borderBottom: '1px solid var(--line)', fontVariantNumeric: 'tabular-nums' }}>${(caseData.match_basis.statement_unit_cost ?? 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: '9px 12px', borderBottom: '1px solid var(--line)', fontVariantNumeric: 'tabular-nums' }}>
                      ${(caseData.match_basis.cost_variance ?? 0).toFixed(4)}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" style={{ textAlign: 'left', padding: '9px 12px', borderBottom: '1px solid var(--line)' }}>Dollar variance</th>
                    <td style={{ textAlign: 'right', padding: '9px 12px', borderBottom: '1px solid var(--line)', fontVariantNumeric: 'tabular-nums' }}>
                      ${((caseData.match_basis.statement_unit_cost ?? 0) * (caseData.match_basis.statement_qty ?? 0)).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right', padding: '9px 12px', borderBottom: '1px solid var(--line)', fontVariantNumeric: 'tabular-nums' }}>
                      ${((caseData.match_basis.statement_unit_cost ?? 0) * (caseData.match_basis.received_qty ?? caseData.match_basis.statement_qty ?? 0)).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right', padding: '9px 12px', borderBottom: '1px solid var(--line)', fontVariantNumeric: 'tabular-nums' }}>
                      ${((caseData.match_basis.statement_unit_cost ?? 0) * Math.abs(caseData.match_basis.quantity_variance ?? 0)).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <h3 style={{ fontSize: '14px', margin: '14px 0 6px' }}>Rules applied</h3>
              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                <li style={{ marginBottom: '5px' }}>
                  <span style={{ fontFamily: 'var(--fm)', fontSize: '13px' }}>BR-01a</span> quantity tolerance: {Math.abs(caseData.match_basis.quantity_variance || 0)} units is more than 2 units AND {(caseData.match_basis.quantity_variance_pct || 0).toFixed(1)}% is more than 2%, so the line is a quantity exception.
                </li>
                <li style={{ marginBottom: '5px' }}>
                  <span style={{ fontFamily: 'var(--fm)', fontSize: '13px' }}>BR-04</span> guardrail: quantity discrepancy over 20% of invoice quantity is never auto-resolved.
                </li>
                <li style={{ marginBottom: '5px' }}>
                  <span style={{ fontFamily: 'var(--fm)', fontSize: '13px' }}>BR-07</span> missing context: more than two elements missing routes to mandatory manual review.
                </li>
              </ul>
            </section>

            {/* AI triage card with red border for manual review */}
            <section
              style={{
                background: '#FFF8F7',
                border: '2px solid var(--rd)',
                borderRadius: '6px',
                padding: '20px',
                marginBottom: '20px',
              }}
              aria-labelledby="ag"
            >
              <h2 style={{ fontFamily: 'var(--fh)', fontSize: '19px', margin: '0 0 12px' }} id="ag">
                <svg
                  style={{
                    width: '18px',
                    height: '18px',
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: '2',
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    verticalAlign: '-3px',
                    marginRight: '6px',
                  }}
                  viewBox="0 0 24 24"
                >
                  <rect x="3" y="8" width="18" height="12" rx="2" />
                  <path d="M12 8V4M8 14h.01M16 14h.01" />
                </svg>
                AI triage result (agent AGN4)
              </h2>
              <dl style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '6px 14px', margin: 0 }}>
                <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Suggestion</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>None. Routed to manual review</dd>
                <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Confidence band</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>
                  <Chip color="gray">NONE</Chip> (no score produced)
                </dd>
                <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Review state</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>
                  <Chip color="red">MANUAL ROUTING</Chip>
                </dd>
              </dl>
              <h3 style={{ fontSize: '14px', margin: '14px 0 6px' }}>Missing context elements ({missingContextCount})</h3>
              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                <li style={{ marginBottom: '5px' }}>Driver delivery signature</li>
                <li style={{ marginBottom: '5px' }}>Store receiving note</li>
                <li style={{ marginBottom: '5px' }}>Prior credit memo for this vendor and item</li>
              </ul>
              <h3 style={{ fontSize: '14px', margin: '14px 0 6px' }}>Confidence penalty events</h3>
              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                <li style={{ marginBottom: '5px' }}>&minus;15 points: delivery signature missing</li>
                <li style={{ marginBottom: '5px' }}>&minus;15 points: store receiving note missing</li>
                <li style={{ marginBottom: '5px' }}>&minus;10 points: prior credit history unavailable</li>
              </ul>
              <h3 style={{ fontSize: '14px', margin: '14px 0 6px' }}>Why this is shown</h3>
              <p style={{ margin: 0 }}>
                With this little supporting context, a recommendation would not be traceable to evidence. The case is passed to you with the facts above. Recording a decision is the only way forward.
              </p>
            </section>

            {/* Audit excerpt */}
            <section
              style={{
                background: 'var(--sf)',
                border: '1px solid var(--line)',
                borderRadius: '6px',
                padding: '20px',
                marginBottom: '20px',
              }}
              aria-labelledby="au"
            >
              <h2 style={{ fontFamily: 'var(--fh)', fontSize: '19px', margin: '0 0 12px' }} id="au">
                Audit excerpt (latest 5 events)
              </h2>
              <ol style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: '13px' }}>
                <li style={{ padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                  <span style={{ fontFamily: 'var(--fm)', fontSize: '13px' }}>14:04:37Z</span> · AGN2 (system) · Matched line as QUANTITY EXCEPTION, variance {Math.abs(caseData.match_basis.quantity_variance || 0)} units ({(caseData.match_basis.quantity_variance_pct || 0).toFixed(1)}%)
                </li>
                <li style={{ padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                  <span style={{ fontFamily: 'var(--fm)', fontSize: '13px' }}>14:04:38Z</span> · AGN4 (system) · Manual-routing event: {missingContextCount} context elements missing, no recommendation
                </li>
                <li style={{ padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                  <span style={{ fontFamily: 'var(--fm)', fontSize: '13px' }}>14:04:38Z</span> · System · Routed to quantity_review; settlement preparation blocked
                </li>
                <li style={{ padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                  <span style={{ fontFamily: 'var(--fm)', fontSize: '13px' }}>{new Date().toISOString().split('T')[1].split('.')[0]}Z</span> · {user?.username} · Opened case
                </li>
                <li style={{ padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                  <span style={{ fontFamily: 'var(--fm)', fontSize: '13px' }}>{new Date().toISOString().split('T')[1].split('.')[0]}Z</span> · System · Settlement still not eligible
                </li>
              </ol>
              <p style={{ margin: '10px 0 0' }}>
                <a href={`/audit`} style={{ color: 'var(--bl)' }}>View full audit trace for this case</a>
              </p>
            </section>
          </div>

          {/* Right column */}
          <div style={{ flex: '0.8 1 0', minWidth: 0 }}>
            {/* Decision form */}
            <section
              style={{
                background: 'var(--sf)',
                border: '2px solid var(--pr)',
                borderRadius: '6px',
                padding: '20px',
                marginBottom: '20px',
              }}
              aria-labelledby="dc"
            >
              <h2 style={{ fontFamily: 'var(--fh)', fontSize: '19px', margin: '0 0 12px' }} id="dc">
                Record your decision
              </h2>
              <form onSubmit={handleSubmit}>
                <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                  <legend style={{ fontWeight: 700, marginBottom: '4px' }}>Decision</legend>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '8px 0 14px' }}>
                    <label
                      style={{
                        border: `2px solid ${decisionType === 'APPROVE' ? 'var(--pr)' : 'var(--line)'}`,
                        borderRadius: '6px',
                        padding: '10px 12px',
                        background: decisionType === 'APPROVE' ? '#E6F1EF' : '#fff',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'flex-start',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="decision"
                        checked={decisionType === 'APPROVE'}
                        onChange={() => setDecisionType('APPROVE')}
                        style={{ marginTop: '3px', width: '17px', height: '17px' }}
                      />
                      <span>
                        <b>Approve</b>
                        <small style={{ display: 'block', color: 'var(--ink2)' }}>Accept the statement quantity. Use only when evidence supports it.</small>
                      </span>
                    </label>
                    <label
                      style={{
                        border: `2px solid ${decisionType === 'OVERRIDE' ? 'var(--pr)' : 'var(--line)'}`,
                        borderRadius: '6px',
                        padding: '10px 12px',
                        background: decisionType === 'OVERRIDE' ? '#E6F1EF' : '#fff',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'flex-start',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="decision"
                        checked={decisionType === 'OVERRIDE'}
                        onChange={() => setDecisionType('OVERRIDE')}
                        style={{ marginTop: '3px', width: '17px', height: '17px' }}
                      />
                      <span>
                        <b>Override</b>
                        <small style={{ display: 'block', color: 'var(--ink2)' }}>Settle on the received quantity of {caseData.match_basis.received_qty || caseData.match_basis.statement_qty} and request a short-ship credit.</small>
                      </span>
                    </label>
                    <label
                      style={{
                        border: `2px solid ${decisionType === 'ESCALATE' ? 'var(--pr)' : 'var(--line)'}`,
                        borderRadius: '6px',
                        padding: '10px 12px',
                        background: decisionType === 'ESCALATE' ? '#E6F1EF' : '#fff',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'flex-start',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="decision"
                        checked={decisionType === 'ESCALATE'}
                        onChange={() => setDecisionType('ESCALATE')}
                        style={{ marginTop: '3px', width: '17px', height: '17px' }}
                      />
                      <span>
                        <b>Escalate to Inventory Control Manager</b>
                        <small style={{ display: 'block', color: 'var(--ink2)' }}>Required where dollar variance is over $5,000. Optional otherwise.</small>
                      </span>
                    </label>
                  </div>
                </fieldset>
                
                <label htmlFor="rc" style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                  Reason code (required)
                </label>
                <select
                  id="rc"
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #7A8580',
                    borderRadius: '4px',
                    font: '15px var(--fb)',
                    background: '#fff',
                    color: 'var(--ink)',
                  }}
                >
                  <option value="">Select a reason code</option>
                  <option value="QC-03 Short shipment confirmed by receipt (pilot code)">QC-03 Short shipment confirmed by receipt (pilot code)</option>
                  <option value="QC-06 Receipt error at store (pilot code)">QC-06 Receipt error at store (pilot code)</option>
                  <option value="QC-08 Evidence insufficient, hold for vendor (pilot code)">QC-08 Evidence insufficient, hold for vendor (pilot code)</option>
                </select>
                {validationErrors.reasonCode && (
                  <p style={{ color: 'var(--rd)', fontSize: '13px', fontWeight: 600, margin: '4px 0 12px' }}>
                    {validationErrors.reasonCode}
                  </p>
                )}
                
                <label htmlFor="nt" style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '4px', marginTop: '12px' }}>
                  Rationale note (required)
                </label>
                <textarea
                  id="nt"
                  value={rationaleNote}
                  onChange={(e) => setRationaleNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #7A8580',
                    borderRadius: '4px',
                    font: '15px var(--fb)',
                    background: '#fff',
                    color: 'var(--ink)',
                    minHeight: '90px',
                  }}
                />
                {validationErrors.rationaleNote && (
                  <p style={{ color: 'var(--rd)', fontSize: '13px', fontWeight: 600, margin: '4px 0 12px' }}>
                    {validationErrors.rationaleNote}
                  </p>
                )}
                
                <div style={{ display: 'flex', gap: '10px', margin: '12px 0 0' }}>
                  <Button type="submit" disabled={submitting}>
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
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                    {submitting ? 'Saving...' : 'Save decision'}
                  </Button>
                  <Button variant="secondary" type="button" onClick={() => navigate('/quantity-queue')}>
                    Cancel
                  </Button>
                </div>
              </form>
            </section>

            {/* SoD banner */}
            <Banner color="blue" style={{ alignItems: 'flex-start' }}>
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
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <div>
                <b>Segregation of duties.</b> Another user must prepare settlement after your decision. Your own attempt to do so would be blocked and recorded.
              </div>
            </Banner>

            {/* Settlement status */}
            <section
              style={{
                background: 'var(--sf)',
                border: '1px solid var(--line)',
                borderRadius: '6px',
                padding: '20px',
                marginBottom: '20px',
              }}
              aria-labelledby="st"
            >
              <h2 style={{ fontFamily: 'var(--fh)', fontSize: '19px', margin: '0 0 12px' }} id="st">
                Settlement status
              </h2>
              <dl style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '6px 14px', margin: 0 }}>
                <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Settlement eligibility</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>
                  <Chip color="red">NOT ELIGIBLE</Chip>
                </dd>
                <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Reason</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>Mandatory manual review; no human decision recorded</dd>
                <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Escalation targets</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>Inventory Control Manager (dollar variance over $5,000; this case is ${((caseData.match_basis.statement_unit_cost ?? 0) * Math.abs(caseData.match_basis.quantity_variance ?? 0)).toFixed(2)})</dd>
                <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Review SLA</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>4 business hours, then auto-escalation to the Inventory Control Manager</dd>
              </dl>
              <p style={{ fontSize: '13px', color: 'var(--ink2)', margin: '12px 0 0' }}>
                After a decision is saved, eligibility updates here and the case is available to the AP Specialist.
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer style={{ padding: '16px 32px', borderTop: '1px solid var(--line)', fontSize: '13px', color: 'var(--ink2)' }}>
        Pilot build · fixture data only · vendor, item and user names are fictional. Reason codes are pilot fixture values.
      </footer>
    </div>
  );
}
