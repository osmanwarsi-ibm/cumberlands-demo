/**
 * AuditTracePage - Audit trace for a case
 * Matches wireframe_audit_trace_from_ap_queue.html design exactly
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth';
import { auditAPI } from '../api/client';
import { Header } from '../components/Header';
import { Mockbar } from '../components/Mockbar';
import { Breadcrumb } from '../components/Breadcrumb';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';
import { Table } from '../components/Table';

interface AuditEvent {
  timestamp: string;
  actor: string;
  actor_hint?: string;
  event_type: string;
  event_chip_color: 'blue' | 'amber' | 'gray' | 'green' | 'red';
  details: string;
  is_sod_violation?: boolean;
}

interface CaseSummary {
  case_id: string;
  outcome_class: string;
  current_status: string;
  vendor_item: string;
  batch_id: string;
}

interface DistinctActors {
  reviewer_approver?: string;
  posting_preparer?: string;
  follow_up?: string;
  system_agents: string;
  sod_blocked_attempts?: string;
}

interface AiInferenceRecord {
  agent: string;
  recommendation: string;
  confidence: string;
  human_action: string;
  evidence_cited: string;
}

export function AuditTracePage() {
  const { caseId } = useParams<{ caseId: string }>();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState('all');

  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([
    {
      timestamp: '14:02:11',
      actor: 'AP-SYSTEM',
      actor_hint: 'AGN1 (agent)',
      event_type: 'INGESTION',
      event_chip_color: 'blue',
      details: 'Line L-021 normalized from batch BATCH-20261019-0007, source DSD-STMT-2026-W41',
    },
    {
      timestamp: '14:04:37',
      actor: 'AP-SYSTEM',
      actor_hint: 'AGN2 (agent)',
      event_type: 'MATCH',
      event_chip_color: 'blue',
      details:
        'COST EXCEPTION. Rule BR-01b: variance $0.4500 over $0.05 tolerance; statement $4.35 vs Price Book $3.90',
    },
    {
      timestamp: '14:04:39',
      actor: 'AP-SYSTEM',
      actor_hint: 'AGN4 (agent)',
      event_type: 'AI TRIAGE',
      event_chip_color: 'amber',
      details:
        'Recommendation: approve with escalation flag. Confidence 78% AMBER. Penalties: −12 (stale Price Book), −10 (notice not linked). Evidence EV-1, EV-2, EV-3',
    },
    {
      timestamp: '14:04:39',
      actor: 'AP-SYSTEM',
      event_type: 'ROUTING',
      event_chip_color: 'gray',
      details: 'Routed to cost_review; human checkpoint AMBER set; settlement preparation blocked',
    },
    {
      timestamp: '14:31:02',
      actor: 'Dana Whitfield',
      actor_hint: 'Price Book Analyst',
      event_type: 'VIEW',
      event_chip_color: 'gray',
      details: 'Opened case',
    },
    {
      timestamp: '14:36:20',
      actor: 'Dana Whitfield',
      actor_hint: 'Price Book Analyst',
      event_type: 'REVIEW DECISION',
      event_chip_color: 'green',
      details:
        'APPROVED. Reason PC-02. Note: "Vendor price notice PN-2026-0412 confirms $4.35 from 2026-10-01." Escalation flag recorded',
    },
    {
      timestamp: '14:38:44',
      actor: 'Dana Whitfield',
      actor_hint: 'Price Book Analyst',
      event_type: 'BLOCKED · SoD',
      event_chip_color: 'red',
      details:
        'Attempt to prepare settlement refused (HTTP 403): approver cannot execute posting on the same case',
      is_sod_violation: true,
    },
    {
      timestamp: '14:52:11',
      actor: 'Helen Brooks',
      actor_hint: 'Vendor Relations Manager',
      event_type: 'VIEW',
      event_chip_color: 'gray',
      details: 'Opened vendor follow-up evidence',
    },
    {
      timestamp: '14:56:30',
      actor: 'Helen Brooks',
      actor_hint: 'Vendor Relations Manager',
      event_type: 'FOLLOW-UP',
      event_chip_color: 'green',
      details: 'Disposition recorded: suitable for credit request. Nothing sent externally',
    },
    {
      timestamp: '15:03:18',
      actor: 'Priya Nair',
      actor_hint: 'AP Specialist',
      event_type: 'SETTLEMENT PREPARED',
      event_chip_color: 'green',
      details:
        'Settlement record SR-000417 created. Source case CASE-C-1042; approver Dana Whitfield; preparer Priya Nair',
    },
    {
      timestamp: '15:03:19',
      actor: 'AP-SYSTEM',
      actor_hint: 'AGN5 (agent)',
      event_type: 'AP QUEUE WRITE',
      event_chip_color: 'blue',
      details: 'Entry APQ-000123 written to mocked AP interface. Queue status QUEUED, ack PENDING',
    },
    {
      timestamp: '15:03:21',
      actor: 'AP-SYSTEM',
      event_type: 'ACK',
      event_chip_color: 'green',
      details: 'Mock acknowledgement ACCEPTED for APQ-000123',
    },
  ]);

  const [caseSummary, setCaseSummary] = useState<CaseSummary>({
    case_id: 'CASE-C-1042',
    outcome_class: 'COST EXCEPTION',
    current_status: 'SETTLEMENT PREPARED · ACK ACCEPTED',
    vendor_item: 'Coastal Dairy Co. · Heavy Cream 1 pt',
    batch_id: 'BATCH-20261019-0007',
  });

  const [distinctActors, setDistinctActors] = useState<DistinctActors>({
    reviewer_approver: 'Dana Whitfield (Price Book Analyst)',
    posting_preparer: 'Priya Nair (AP Specialist)',
    follow_up: 'Helen Brooks (Vendor Relations Manager)',
    system_agents: 'AGN1, AGN2, AGN4, AGN5',
    sod_blocked_attempts: '1 blocked attempt by the approver at 14:38:44',
  });

  const [aiInferenceRecord, setAiInferenceRecord] = useState<AiInferenceRecord>({
    agent: 'AGN4 exception triage',
    recommendation: 'Approve with flag',
    confidence: '78% · AMBER',
    human_action: 'Approved by Dana Whitfield',
    evidence_cited: 'EV-1, EV-2, EV-3',
  });

  useEffect(() => {
    setLoading(false);
  }, []);

  const filteredEvents =
    eventFilter === 'all'
      ? auditEvents
      : auditEvents.filter((e) => {
          // Simple filter logic - in real app would be more sophisticated
          return true;
        });

  if (loading) {
    return (
      <div>
        <Header />
        <Mockbar message="Pilot environment: fixture data only. This record is read-only and append-only." />
        <div style={{ padding: '24px 32px' }}>
          <p>Loading audit trace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header />
        <Mockbar message="Pilot environment: fixture data only. This record is read-only and append-only." />
        <div style={{ padding: '24px 32px' }}>
          <Banner color="red">{error}</Banner>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Header />
      <Mockbar message="Pilot environment: fixture data only. This record is read-only and append-only." />

      <main style={{ padding: '24px 32px 48px' }}>
        <Breadcrumb
          items={[
            { label: 'AP queue', path: '/ap-queue' },
            { label: 'Audit trace' },
          ]}
        />

        <h1 style={{ fontFamily: 'var(--fh)', fontSize: '30px', margin: '0 0 6px' }}>
          Audit trace &middot; Case {caseId || 'CASE-C-1042'}
        </h1>
        <p style={{ color: 'var(--ink2)', margin: '0 0 20px', fontSize: '16px' }}>
          Chronological, actor-attributed history from ingestion through posting preparation,
          including blocked attempts.
        </p>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          {/* Left Column - Timeline */}
          <div style={{ flex: '1.7 1 0', minWidth: 0 }}>
            <Card>
              <h2 style={{ fontFamily: 'var(--fh)', fontSize: '20px', margin: '0 0 12px' }}>
                Case timeline
              </h2>

              {/* Filters */}
              <form style={{ display: 'flex', gap: '16px', alignItems: 'end', marginBottom: '14px' }}>
                <div>
                  <label
                    htmlFor="ev"
                    style={{ fontWeight: 600, fontSize: '13px', display: 'block', marginBottom: '4px' }}
                  >
                    Event type
                  </label>
                  <select
                    id="ev"
                    value={eventFilter}
                    onChange={(e) => setEventFilter(e.target.value)}
                    style={{
                      padding: '8px 10px',
                      border: '2px solid #7A8580',
                      borderRadius: '4px',
                      font: '14px var(--fb)',
                      background: '#fff',
                      color: 'var(--ink)',
                    }}
                  >
                    <option value="all">All events (12)</option>
                    <option value="ingestion">Ingestion and match</option>
                    <option value="triage">AI triage</option>
                    <option value="review">Review decision</option>
                    <option value="sod">Blocked attempts (SoD)</option>
                    <option value="settlement">Settlement and AP queue</option>
                  </select>
                </div>
                <span
                  style={{
                    fontSize: '13px',
                    color: 'var(--ink2)',
                    marginLeft: 'auto',
                    paddingBottom: '8px',
                  }}
                >
                  Oldest first. Times are UTC, 2026-10-19.
                </span>
              </form>

              {/* Timeline Table */}
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px',
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: 'left',
                        background: 'var(--sf2)',
                        padding: '10px 12px',
                        borderBottom: '2px solid var(--line)',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontWeight: 600,
                      }}
                    >
                      Time
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        background: 'var(--sf2)',
                        padding: '10px 12px',
                        borderBottom: '2px solid var(--line)',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontWeight: 600,
                      }}
                    >
                      Actor
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        background: 'var(--sf2)',
                        padding: '10px 12px',
                        borderBottom: '2px solid var(--line)',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontWeight: 600,
                      }}
                    >
                      Event
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        background: 'var(--sf2)',
                        padding: '10px 12px',
                        borderBottom: '2px solid var(--line)',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontWeight: 600,
                      }}
                    >
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((item, idx) => (
                    <tr
                      key={`${item.timestamp}-${idx}`}
                      style={item.is_sod_violation ? { background: '#FDEEEC' } : {}}
                    >
                      <td
                        style={{
                          padding: '10px 12px',
                          borderBottom: '1px solid var(--line)',
                          verticalAlign: 'top',
                        }}
                      >
                        <span style={{ fontFamily: 'var(--fm)', fontSize: '13px' }}>
                          {item.timestamp}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          borderBottom: '1px solid var(--line)',
                          verticalAlign: 'top',
                        }}
                      >
                        {item.actor}
                        {item.actor_hint && (
                          <>
                            <br />
                            <span style={{ fontSize: '13px', color: 'var(--ink2)' }}>
                              {item.actor_hint}
                            </span>
                          </>
                        )}
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          borderBottom: '1px solid var(--line)',
                          verticalAlign: 'top',
                        }}
                      >
                        <Chip color={item.event_chip_color}>{item.event_type}</Chip>
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          borderBottom: '1px solid var(--line)',
                          verticalAlign: 'top',
                        }}
                      >
                        {item.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p style={{ fontSize: '13px', color: 'var(--ink2)', margin: '10px 0 0' }}>
                Records cannot be edited or deleted. Credentials and configuration values are never
                shown.
              </p>
            </Card>
          </div>

          {/* Right Column - Summary Cards */}
          <div style={{ flex: '1 1 0', minWidth: 0 }}>
            {/* Case Summary */}
            <Card>
              <h2 style={{ fontFamily: 'var(--fh)', fontSize: '20px', margin: '0 0 12px' }}>
                Case summary
              </h2>
              <dl
                style={{
                  display: 'grid',
                  gridTemplateColumns: '160px 1fr',
                  gap: '6px 14px',
                  margin: 0,
                }}
              >
                <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Case</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>
                  <span style={{ fontFamily: 'var(--fm)', fontSize: '13px' }}>
                    {caseSummary.case_id}
                  </span>
                </dd>

                <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Outcome class</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>
                  <Chip color="red">{caseSummary.outcome_class}</Chip>
                </dd>

                <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Current status</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>
                  <Chip color="green">{caseSummary.current_status}</Chip>
                </dd>

                <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Vendor / item</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>{caseSummary.vendor_item}</dd>

                <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Batch</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>
                  <span style={{ fontFamily: 'var(--fm)', fontSize: '13px' }}>
                    {caseSummary.batch_id}
                  </span>
                </dd>
              </dl>
              <div style={{ margin: '14px 0 0', display: 'flex', gap: '10px' }}>
                <Button variant="secondary" onClick={() => navigate(`/cost-case/${caseId || '1042'}`)}>
                  Return to case
                </Button>
              </div>
            </Card>

            {/* Distinct Actors */}
            <Card>
              <h2 style={{ fontFamily: 'var(--fh)', fontSize: '20px', margin: '0 0 12px' }}>
                Distinct actors (segregation of duties)
              </h2>
              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  listStyle: 'none',
                  fontSize: '14px',
                }}
              >
                {distinctActors.reviewer_approver && (
                  <li style={{ padding: '7px 0', borderBottom: '1px solid var(--line)' }}>
                    <b>Reviewer / approver:</b> {distinctActors.reviewer_approver}
                  </li>
                )}
                {distinctActors.posting_preparer && (
                  <li style={{ padding: '7px 0', borderBottom: '1px solid var(--line)' }}>
                    <b>Posting preparer:</b> {distinctActors.posting_preparer}
                  </li>
                )}
                {distinctActors.follow_up && (
                  <li style={{ padding: '7px 0', borderBottom: '1px solid var(--line)' }}>
                    <b>Follow-up:</b> {distinctActors.follow_up}
                  </li>
                )}
                <li style={{ padding: '7px 0', borderBottom: '1px solid var(--line)' }}>
                  <b>System agents:</b> {distinctActors.system_agents}
                </li>
              </ul>
              <Banner color="blue" style={{ margin: '14px 0 0' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <svg
                    style={{
                      width: '18px',
                      height: '18px',
                      fill: 'none',
                      stroke: 'currentColor',
                      strokeWidth: 2,
                      flexShrink: 0,
                    }}
                    viewBox="0 0 24 24"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <div>
                    Approver and preparer are different people. {distinctActors.sod_blocked_attempts}
                  </div>
                </div>
              </Banner>
            </Card>

            {/* AI Inference Record */}
            <Card>
              <h2 style={{ fontFamily: 'var(--fh)', fontSize: '20px', margin: '0 0 12px' }}>
                AI inference record
              </h2>
              <dl
                style={{
                  display: 'grid',
                  gridTemplateColumns: '160px 1fr',
                  gap: '6px 14px',
                  margin: 0,
                }}
              >
                <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Agent</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>{aiInferenceRecord.agent}</dd>

                <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Recommendation</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>{aiInferenceRecord.recommendation}</dd>

                <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Confidence</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>{aiInferenceRecord.confidence}</dd>

                <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Human action</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>{aiInferenceRecord.human_action}</dd>

                <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Evidence cited</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>{aiInferenceRecord.evidence_cited}</dd>
              </dl>
            </Card>
          </div>
        </div>
      </main>

      <footer
        style={{
          padding: '16px 32px',
          borderTop: '1px solid var(--line)',
          fontSize: '13px',
          color: 'var(--ink2)',
        }}
      >
        Pilot build &middot; fixture data only &middot; vendor, item and user names are fictional.
        Reason codes are pilot fixture values.
      </footer>
    </div>
  );
}
