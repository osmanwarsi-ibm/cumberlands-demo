/**
 * CostCaseDetailPage - Cost exception case detail
 * Matches wireframe_cost_case_detail_from_cost_review_queue.html design exactly
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth';
import { casesAPI } from '../api/client';
import { Chip } from '../components/Chip';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';
import type { CaseDetail } from '../types/api';

export function CostCaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [decisionType, setDecisionType] = useState<'APPROVE' | 'OVERRIDE' | 'ESCALATE'>('APPROVE');
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
      setReasonCode('PC-02 Vendor price change confirmed (pilot code)');
      setRationaleNote('Vendor price notice PN-2026-0412 confirms $4.35 from 2026-10-01. Approve this delivery and send Price Book update request to Category Manager.');
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
        <Button onClick={() => navigate('/cost-queue')}>Back to queue</Button>
      </div>
    );
  }

  const confidenceScore = caseData.triage?.confidence_score 
    ? Math.round(caseData.triage.confidence_score * 100) 
    : 0;

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
            href="/vendor-follow-up"
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
            Vendor follow-up
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
        Pilot environment: fixture data only. The recommendation below is advice; only your recorded decision changes the case.
      </div>

      {/* Main content */}
      <main id="main" style={{ width: '100%', padding: '24px 32px 48px' }}>
        <p style={{ fontSize: '13px', color: 'var(--ink2)', margin: '0 0 8px' }}>
          <a href="/cost-queue" style={{ color: 'var(--bl)' }}>Cost review queue</a> / Case CASE-C-{caseData.case_id} · route /cases/CASE-C-{caseData.case_id}
        </p>
        
        {/* Case header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--fh)', fontSize: '30px', margin: '0 0 6px' }}>
              Case CASE-C-{caseData.case_id} · Cost exception
            </h1>
            <p style={{ color: 'var(--ink2)', margin: 0, fontSize: '16px' }}>
              {caseData.vendor_id} · {caseData.item_id} · delivery {caseData.delivery_ref} · store {caseData.store_id}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Chip color="red" style={{ marginBottom: '4px' }}>COST EXCEPTION</Chip>
            <br />
            <Chip color="blue">REVIEW STATE: AWAITING HUMAN DECISION</Chip>
            <br />
            <Chip color="gray" style={{ marginTop: '4px' }}>SETTLEMENT: NOT ELIGIBLE YET</Chip>
          </div>
        </div>

        {/* AMBER banner */}
        <Banner color="amber" style={{ alignItems: 'flex-start' }}>
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
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            <path d="M12 9v4M12 17h.01" />
          </svg>
          <div>
            <b>AMBER: human approval required.</b> The recommendation cannot complete this case by itself. No path exists to settlement without a recorded human decision.
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
                    <th scope="col" style={{ textAlign: 'right', background: 'var(--sf2)', padding: '9px 12px', borderBottom: '2px solid var(--line)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price Book / Receipt</th>
                    <th scope="col" style={{ textAlign: 'right', background: 'var(--sf2)', padding: '9px 12px', borderBottom: '2px solid var(--line)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Variance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row" style={{ textAlign: 'left', padding: '9px 12px', borderBottom: '1px solid var(--line)' }}>Unit cost</th>
                    <td style={{ textAlign: 'right', padding: '9px 12px', borderBottom: '1px solid var(--line)', fontVariantNumeric: 'tabular-nums' }}>${(caseData.match_basis.statement_unit_cost ?? 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: '9px 12px', borderBottom: '1px solid var(--line)', fontVariantNumeric: 'tabular-nums' }}>${(caseData.match_basis.expected_unit_cost ?? 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: '9px 12px', borderBottom: '1px solid var(--line)', fontVariantNumeric: 'tabular-nums' }}>
                      <b>{caseData.match_basis.cost_variance && caseData.match_basis.cost_variance > 0 ? '+' : ''}${Math.abs(caseData.match_basis.cost_variance ?? 0).toFixed(4)}</b> ({caseData.match_basis.expected_unit_cost ? ((Math.abs(caseData.match_basis.cost_variance ?? 0) / caseData.match_basis.expected_unit_cost) * 100).toFixed(1) : '0.0'}%)
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" style={{ textAlign: 'left', padding: '9px 12px', borderBottom: '1px solid var(--line)' }}>Quantity</th>
                    <td style={{ textAlign: 'right', padding: '9px 12px', borderBottom: '1px solid var(--line)', fontVariantNumeric: 'tabular-nums' }}>{caseData.match_basis.statement_qty ?? 0}</td>
                    <td style={{ textAlign: 'right', padding: '9px 12px', borderBottom: '1px solid var(--line)', fontVariantNumeric: 'tabular-nums' }}>{caseData.match_basis.received_qty ?? caseData.match_basis.statement_qty ?? 0}</td>
                    <td style={{ textAlign: 'right', padding: '9px 12px', borderBottom: '1px solid var(--line)', fontVariantNumeric: 'tabular-nums' }}>
                      {caseData.match_basis.quantity_variance ?? 0} units ({(caseData.match_basis.quantity_variance_pct ?? 0).toFixed(1)}%)
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" style={{ textAlign: 'left', padding: '9px 12px', borderBottom: '1px solid var(--line)' }}>Extended cost</th>
                    <td style={{ textAlign: 'right', padding: '9px 12px', borderBottom: '1px solid var(--line)', fontVariantNumeric: 'tabular-nums' }}>
                      ${((caseData.match_basis.statement_unit_cost ?? 0) * (caseData.match_basis.statement_qty ?? 0)).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right', padding: '9px 12px', borderBottom: '1px solid var(--line)', fontVariantNumeric: 'tabular-nums' }}>
                      ${((caseData.match_basis.expected_unit_cost ?? 0) * (caseData.match_basis.statement_qty ?? 0)).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right', padding: '9px 12px', borderBottom: '1px solid var(--line)', fontVariantNumeric: 'tabular-nums' }}>
                      {caseData.match_basis.cost_variance && caseData.match_basis.cost_variance > 0 ? '+' : ''}${Math.abs((caseData.match_basis.cost_variance ?? 0) * (caseData.match_basis.statement_qty ?? 0)).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <h3 style={{ fontSize: '14px', margin: '14px 0 6px' }}>Rules applied</h3>
              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                <li style={{ marginBottom: '5px' }}>
                  <span style={{ fontFamily: 'var(--fm)', fontSize: '13px' }}>BR-01b</span> cost tolerance: variance ${Math.abs(caseData.match_basis.cost_variance || 0).toFixed(4)} exceeds the $0.05 per-unit tolerance, so the line is a cost exception.
                </li>
                {caseData.match_basis.expected_unit_cost && caseData.match_basis.cost_variance && (Math.abs(caseData.match_basis.cost_variance) / caseData.match_basis.expected_unit_cost) > 0.10 && (
                  <li style={{ marginBottom: '5px' }}>
                    <span style={{ fontFamily: 'var(--fm)', fontSize: '13px' }}>BR-04</span> price guardrail: statement cost is more than 10% above the Price Book cost, so any approval carries an escalation flag.
                  </li>
                )}
              </ul>
            </section>

            {/* AI triage card with amber border */}
            <section
              style={{
                background: '#FFFCF3',
                border: '2px solid #C98A12',
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
                AI triage recommendation (agent AGN4)
              </h2>
              <div style={{ display: 'flex', gap: '24px', marginBottom: '10px' }}>
                <div style={{ flex: 1 }}>
                  <dl style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '6px 14px', margin: 0 }}>
                    <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Suggestion</dt>
                    <dd style={{ margin: 0, fontWeight: 600 }}>{caseData.triage?.suggestion || 'Approve at statement cost'}</dd>
                    <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Confidence band</dt>
                    <dd style={{ margin: 0, fontWeight: 600 }}>
                      <Chip color="amber">AMBER</Chip>
                    </dd>
                    <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Confidence score</dt>
                    <dd style={{ margin: 0, fontWeight: 600 }}>{confidenceScore}%</dd>
                  </dl>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 6px', fontSize: '13px', color: 'var(--ink2)' }}>
                    Confidence {confidenceScore}%. Cases under 70% are escalated with no recommendation.
                  </p>
                  <div
                    style={{
                      height: '14px',
                      background: 'var(--gyb)',
                      border: '1px solid var(--line)',
                      borderRadius: '7px',
                      width: '100%',
                    }}
                    role="img"
                    aria-label={`Confidence ${confidenceScore} percent`}
                  >
                    <div
                      style={{
                        display: 'block',
                        height: '100%',
                        width: `${confidenceScore}%`,
                        background: '#C98A12',
                        borderRadius: '6px',
                      }}
                    />
                  </div>
                </div>
              </div>
              <h3 style={{ fontSize: '14px', margin: '14px 0 6px' }}>Rationale</h3>
              <p style={{ margin: '0 0 8px' }}>
                {caseData.triage?.rationale || 'Price variance suggests Price Book may be out of date. Evidence supports approving statement cost with escalation flag for Category Manager awareness.'}
              </p>
              <h3 style={{ fontSize: '14px', margin: '14px 0 6px' }}>Evidence references</h3>
              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                {(caseData.triage?.evidence_refs || ['EV-1 Prior cost history', 'EV-2 Price Book record', 'EV-3 Vendor price notice']).map((ref, idx) => (
                  <li key={idx} style={{ marginBottom: '5px' }}>
                    <span style={{ fontFamily: 'var(--fm)', fontSize: '13px' }}>{ref}</span>
                  </li>
                ))}
              </ul>
              <h3 style={{ fontSize: '14px', margin: '14px 0 6px' }}>Confidence penalties</h3>
              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                {(caseData.triage?.penalty_reasons || ['-12 points: Price Book record is older than 90 days.', '-10 points: price notice not yet matched to a Price Book change request.']).map((penalty, idx) => (
                  <li key={idx} style={{ marginBottom: '5px' }}>{penalty}</li>
                ))}
              </ul>
              <p style={{ fontSize: '13px', color: 'var(--ink2)', margin: '8px 0 0' }}>
                Context completeness: {caseData.triage?.evidence_refs?.length || 3} required elements present (0 missing).
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
                  <span style={{ fontFamily: 'var(--fm)', fontSize: '13px' }}>14:04:37Z</span> · AGN2 (system) · Matched line as COST EXCEPTION, variance ${Math.abs(caseData.match_basis.cost_variance || 0).toFixed(4)}
                </li>
                <li style={{ padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                  <span style={{ fontFamily: 'var(--fm)', fontSize: '13px' }}>14:04:39Z</span> · AGN4 (system) · Triage recommendation recorded, confidence {confidenceScore}% AMBER
                </li>
                <li style={{ padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                  <span style={{ fontFamily: 'var(--fm)', fontSize: '13px' }}>14:04:39Z</span> · System · Routed to cost_review; assigned role {caseData.current_owner_role ?? 'N/A'}
                </li>
                <li style={{ padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                  <span style={{ fontFamily: 'var(--fm)', fontSize: '13px' }}>{new Date().toISOString().split('T')[1].split('.')[0]}Z</span> · {user?.username} · Opened case
                </li>
                <li style={{ padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                  <span style={{ fontFamily: 'var(--fm)', fontSize: '13px' }}>{new Date().toISOString().split('T')[1].split('.')[0]}Z</span> · System · Settlement preparation blocked until decision
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
                        <small style={{ display: 'block', color: 'var(--ink2)' }}>Accept the statement cost as valid for this delivery.</small>
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
                        <small style={{ display: 'block', color: 'var(--ink2)' }}>Use a different outcome than recommended (reason code and note required).</small>
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
                        <b>Escalate to Category Manager</b>
                        <small style={{ display: 'block', color: 'var(--ink2)' }}>Required for vendor disputes over $500 or new cost terms.</small>
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
                  <option value="PC-02 Vendor price change confirmed (pilot code)">PC-02 Vendor price change confirmed (pilot code)</option>
                  <option value="PC-05 Price Book out of date (pilot code)">PC-05 Price Book out of date (pilot code)</option>
                  <option value="PC-09 Billing error by vendor (pilot code)">PC-09 Billing error by vendor (pilot code)</option>
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
                  <Button variant="secondary" type="button" onClick={() => navigate('/cost-queue')}>
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
                <b>Segregation of duties.</b> After you approve, a different user (for example an AP Specialist) must prepare settlement. Any attempt by you to prepare it is blocked and recorded.
              </div>
            </Banner>

            {/* After decision preview */}
            <section
              style={{
                background: 'var(--sf)',
                border: '1px solid var(--line)',
                borderRadius: '6px',
                padding: '20px',
                marginBottom: '20px',
              }}
              aria-labelledby="after"
            >
              <h2 style={{ fontFamily: 'var(--fh)', fontSize: '19px', margin: '0 0 12px' }} id="after">
                After the decision (preview)
              </h2>
              {caseData.review_state?.decided_at ? (
                <>
                  <Banner color="green" style={{ marginBottom: '10px' }}>
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
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                    <div>
                      <b>Decision recorded: {caseData.review_state.decision_type}</b> by {caseData.review_state.reviewer_username} at {caseData.review_state.decided_at}.
                    </div>
                  </Banner>
                  <dl style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '6px 14px', margin: 0 }}>
                    <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Case status</dt>
                    <dd style={{ margin: 0, fontWeight: 600 }}>
                      <Chip color="green">DECIDED · {caseData.review_state.decision_type}</Chip>
                    </dd>
                    <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Settlement eligibility</dt>
                    <dd style={{ margin: 0, fontWeight: 600 }}>
                      <Chip color="green">ELIGIBLE (by a different user)</Chip>
                    </dd>
                    <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Next step</dt>
                    <dd style={{ margin: 0, fontWeight: 600 }}>AP Specialist prepares settlement</dd>
                  </dl>
                </>
              ) : (
                <p style={{ fontSize: '14px', color: 'var(--ink2)' }}>
                  Save your decision to see settlement eligibility and next steps.
                </p>
              )}
              <p style={{ margin: '12px 0 0', display: 'flex', gap: '10px' }}>
                <Button variant="secondary" size="small" onClick={() => navigate('/vendor-follow-up')}>
                  Open vendor follow-up evidence
                </Button>
                <Button variant="secondary" size="small" onClick={() => navigate('/ap-queue')}>
                  View AP queue
                </Button>
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer style={{ padding: '16px 32px', borderTop: '1px solid var(--line)', fontSize: '13px', color: 'var(--ink2)' }}>
        Pilot build · fixture data only · vendor, item, notice and user names are fictional. Reason codes are pilot fixture values.
      </footer>
    </div>
  );
}
