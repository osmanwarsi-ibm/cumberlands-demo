/**
 * VendorFollowUpPage - Vendor follow-up evidence and disposition
 * Matches wireframe_vendor_follow_up_from_cost_case_detail.html design exactly
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth';
import { Header } from '../components/Header';
import { Mockbar } from '../components/Mockbar';
import { Breadcrumb } from '../components/Breadcrumb';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';
import { Table } from '../components/Table';

interface FollowUpCase {
  case_id: string;
  vendor_item: string;
  delivery_ref: string;
  approved_disposition: string;
  follow_up_status: string;
}

interface WhyFollowUp {
  approved_disposition: string;
  proposed_follow_up: string;
  reason_codes: string;
  escalation_flag: string;
}

interface EvidenceRow {
  measure: string;
  statement: string;
  price_book: string;
  variance: string;
}

interface EvidenceReference {
  code: string;
  description: string;
}

interface DecisionHistoryItem {
  timestamp: string;
  actor: string;
  event: string;
}

interface SupportDocument {
  document_type: string;
  status: string;
  contents: string;
  sent_to_vendor: string;
}

export function VendorFollowUpPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [caseData, setCaseData] = useState<FollowUpCase>({
    case_id: 'CASE-C-1042',
    vendor_item: 'Coastal Dairy Co. · Heavy Cream 1 pt',
    delivery_ref: 'DLV-77391',
    approved_disposition: 'APPROVED DISPOSITION',
    follow_up_status: 'FOLLOW-UP: AWAITING YOUR DISPOSITION',
  });

  const [whyFollowUp, setWhyFollowUp] = useState<WhyFollowUp>({
    approved_disposition: 'Approved at statement cost $4.35 for this delivery (Dana Whitfield, 14:36 UTC)',
    proposed_follow_up: 'Request written confirmation of the new cost terms; flag 11.5% increase to Category Manager',
    reason_codes: 'PC-02 Vendor price change confirmed · PC-05 Price Book out of date (pilot codes)',
    escalation_flag: '>10% over Price Book',
  });

  const [evidenceRows, setEvidenceRows] = useState<EvidenceRow[]>([
    {
      measure: 'Unit cost',
      statement: '$4.35',
      price_book: '$3.90',
      variance: '+$0.4500 (11.5%)',
    },
    {
      measure: 'Quantity',
      statement: '24',
      price_book: '24 received',
      variance: '0',
    },
    {
      measure: 'Extended cost',
      statement: '$104.40',
      price_book: '$93.60',
      variance: '+$10.80',
    },
  ]);

  const [evidenceReferences, setEvidenceReferences] = useState<EvidenceReference[]>([
    { code: 'EV-1', description: 'Vendor price notice PN-2026-0412, effective 2026-10-01' },
    { code: 'EV-2', description: 'Invoice history DLV-77102 and DLV-77248 at $4.35' },
    { code: 'EV-3', description: 'Price Book record PB-40021903, last updated 2026-07-14' },
  ]);

  const [decisionHistory, setDecisionHistory] = useState<DecisionHistoryItem[]>([
    {
      timestamp: '14:04:37Z',
      actor: 'AGN2 (system)',
      event: 'Cost exception, variance $0.4500',
    },
    {
      timestamp: '14:04:39Z',
      actor: 'AGN4 (system)',
      event: 'Recommended approve with flag, confidence 78% AMBER',
    },
    {
      timestamp: '14:36:20Z',
      actor: 'Dana Whitfield (Price Book Analyst)',
      event: 'APPROVED, reason PC-02',
    },
    {
      timestamp: '14:52:11Z',
      actor: 'Helen Brooks (Vendor Relations Manager)',
      event: 'Opened follow-up evidence',
    },
  ]);

  const [supportDocument, setSupportDocument] = useState<SupportDocument>({
    document_type: 'Credit-request support (pilot template)',
    status: 'NOT YET GENERATED',
    contents: 'Case summary, variance table, reason codes and evidence references',
    sent_to_vendor: 'NO. Not sent in pilot',
  });

  // Form state
  const [suitability, setSuitability] = useState<'chargeback' | 'credit_request' | 'not_supported'>(
    'credit_request'
  );
  const [note, setNote] = useState(
    'Price notice is effective 2026-10-01 but arrived after two deliveries were invoiced. Request confirmation and credit for the first two deliveries if terms were not communicated in advance.'
  );

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleSaveDisposition = () => {
    if (!note.trim()) {
      alert('Note is required');
      return;
    }
    alert(`Disposition saved: ${suitability}\nNote: ${note}`);
    // In real app, would POST to backend
  };

  const handleCancel = () => {
    navigate(`/cost-case/${caseId || '1042'}`);
  };

  if (loading) {
    return (
      <div>
        <Header />
        <Mockbar message="Pilot environment: fixture data only. This screen records a disposition. No email, portal message or chargeback is sent to any vendor." />
        <div style={{ padding: '24px 32px' }}>
          <p>Loading vendor follow-up...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header />
        <Mockbar message="Pilot environment: fixture data only. This screen records a disposition. No email, portal message or chargeback is sent to any vendor." />
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
      <Mockbar message="Pilot environment: fixture data only. This screen records a disposition. No email, portal message or chargeback is sent to any vendor." />

      <main style={{ padding: '24px 32px 48px' }}>
        <Breadcrumb
          items={[
            { label: `Case ${caseData.case_id}`, path: `/cost-case/${caseId || '1042'}` },
            { label: 'Vendor follow-up' },
          ]}
        />

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--fh)', fontSize: '30px', margin: '0 0 0' }}>
              Vendor follow-up evidence
            </h1>
            <p style={{ color: 'var(--ink2)', margin: '0', fontSize: '16px' }}>
              Case {caseData.case_id} &middot; {caseData.vendor_item} &middot; delivery{' '}
              {caseData.delivery_ref}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Chip color="green">{caseData.approved_disposition}</Chip>
            <br />
            <Chip color="amber" style={{ marginTop: '4px' }}>
              {caseData.follow_up_status}
            </Chip>
          </div>
        </div>

        {/* Blue Banner */}
        <Banner color="blue" style={{ marginTop: '20px' }}>
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
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-10 6L2 7" />
            </svg>
            <div>
              <b>No external communication is sent in the pilot.</b> Your disposition is stored with
              the case. Chargeback and credit-request support is a document record for the AP
              Specialist.
            </div>
          </div>
        </Banner>

        {/* Main Content Row */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', marginTop: '20px' }}>
          {/* Left Column */}
          <div style={{ flex: '1.25 1 0', minWidth: 0 }}>
            {/* Why Follow-Up */}
            <Card>
              <h2 style={{ fontFamily: 'var(--fh)', fontSize: '19px', margin: '0 0 12px' }}>
                Why follow-up is proposed
              </h2>
              <dl
                style={{
                  display: 'grid',
                  gridTemplateColumns: '190px 1fr',
                  gap: '6px 14px',
                  margin: 0,
                }}
              >
                <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Approved disposition</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>{whyFollowUp.approved_disposition}</dd>

                <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Proposed follow-up</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>{whyFollowUp.proposed_follow_up}</dd>

                <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Reason codes</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>
                  {whyFollowUp.reason_codes.split('·').map((code, idx) => (
                    <span key={idx}>
                      {idx > 0 && ' · '}
                      <span style={{ fontFamily: 'var(--fm)', fontSize: '13px' }}>
                        {code.trim().split(' ')[0]}
                      </span>{' '}
                      {code.trim().substring(code.trim().indexOf(' ') + 1)}
                    </span>
                  ))}
                </dd>

                <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Escalation flag</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>
                  <Chip color="red">{whyFollowUp.escalation_flag}</Chip>
                </dd>
              </dl>
            </Card>

            {/* Supporting Evidence */}
            <Card>
              <h2 style={{ fontFamily: 'var(--fh)', fontSize: '19px', margin: '0 0 12px' }}>
                Supporting reconciliation evidence
              </h2>
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
                        padding: '9px 12px',
                        borderBottom: '2px solid var(--line)',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontWeight: 600,
                      }}
                    >
                      Measure
                    </th>
                    <th
                      style={{
                        textAlign: 'right',
                        background: 'var(--sf2)',
                        padding: '9px 12px',
                        borderBottom: '2px solid var(--line)',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontWeight: 600,
                      }}
                    >
                      Statement
                    </th>
                    <th
                      style={{
                        textAlign: 'right',
                        background: 'var(--sf2)',
                        padding: '9px 12px',
                        borderBottom: '2px solid var(--line)',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontWeight: 600,
                      }}
                    >
                      Price Book
                    </th>
                    <th
                      style={{
                        textAlign: 'right',
                        background: 'var(--sf2)',
                        padding: '9px 12px',
                        borderBottom: '2px solid var(--line)',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontWeight: 600,
                      }}
                    >
                      Variance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {evidenceRows.map((item) => (
                    <tr key={item.measure}>
                      <th
                        style={{
                          textAlign: 'left',
                          fontWeight: 600,
                          padding: '9px 12px',
                          borderBottom: '1px solid var(--line)',
                        }}
                      >
                        {item.measure}
                      </th>
                      <td
                        style={{
                          textAlign: 'right',
                          padding: '9px 12px',
                          borderBottom: '1px solid var(--line)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {item.statement}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          padding: '9px 12px',
                          borderBottom: '1px solid var(--line)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {item.price_book}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          padding: '9px 12px',
                          borderBottom: '1px solid var(--line)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {item.variance}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3 style={{ fontSize: '14px', margin: '14px 0 6px' }}>Evidence references</h3>
              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                {evidenceReferences.map((ref) => (
                  <li key={ref.code} style={{ marginBottom: '5px' }}>
                    <span style={{ fontFamily: 'var(--fm)', fontSize: '13px' }}>{ref.code}</span>{' '}
                    {ref.description}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Decision History */}
            <Card>
              <h2 style={{ fontFamily: 'var(--fh)', fontSize: '19px', margin: '0 0 12px' }}>
                Decision history summary
              </h2>
              <ol
                style={{
                  margin: 0,
                  padding: 0,
                  listStyle: 'none',
                  fontSize: '13px',
                }}
              >
                {decisionHistory.map((item, idx) => (
                  <li key={idx} style={{ padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                    <span style={{ fontFamily: 'var(--fm)', fontSize: '13px' }}>
                      {item.timestamp}
                    </span>{' '}
                    &middot; {item.actor} &middot; {item.event}
                  </li>
                ))}
              </ol>
              <p style={{ margin: '10px 0 0' }}>
                <a href={`/audit/case/${caseId || '1042'}`}>Open full audit trace</a>
              </p>
            </Card>
          </div>

          {/* Right Column */}
          <div style={{ flex: '.8 1 0', minWidth: 0 }}>
            {/* Disposition Form */}
            <Card style={{ border: '2px solid var(--pr)' }}>
              <h2 style={{ fontFamily: 'var(--fh)', fontSize: '19px', margin: '0 0 12px' }}>
                Record follow-up disposition
              </h2>
              <form>
                <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                  <legend style={{ fontWeight: 700, marginBottom: '4px' }}>Suitability</legend>
                  <div style={{ display: 'flex', gap: '10px', margin: '8px 0 14px', flexDirection: 'column' }}>
                    <label
                      style={{
                        border: `2px solid ${suitability === 'chargeback' ? 'var(--pr)' : 'var(--line)'}`,
                        borderRadius: '6px',
                        padding: '10px 12px',
                        background: suitability === 'chargeback' ? '#E6F1EF' : '#fff',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'flex-start',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="s"
                        value="chargeback"
                        checked={suitability === 'chargeback'}
                        onChange={(e) => setSuitability(e.target.value as any)}
                        style={{ marginTop: '3px', width: '17px', height: '17px' }}
                      />
                      <span>
                        <b>Suitable for chargeback</b>
                        <small style={{ display: 'block', color: 'var(--ink2)' }}>
                          Cost billed above agreed terms and not covered by a notice.
                        </small>
                      </span>
                    </label>

                    <label
                      style={{
                        border: `2px solid ${suitability === 'credit_request' ? 'var(--pr)' : 'var(--line)'}`,
                        borderRadius: '6px',
                        padding: '10px 12px',
                        background: suitability === 'credit_request' ? '#E6F1EF' : '#fff',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'flex-start',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="s"
                        value="credit_request"
                        checked={suitability === 'credit_request'}
                        onChange={(e) => setSuitability(e.target.value as any)}
                        style={{ marginTop: '3px', width: '17px', height: '17px' }}
                      />
                      <span>
                        <b>Suitable for credit request</b>
                        <small style={{ display: 'block', color: 'var(--ink2)' }}>
                          Cost change valid but terms need written confirmation or a retroactive
                          adjustment.
                        </small>
                      </span>
                    </label>

                    <label
                      style={{
                        border: `2px solid ${suitability === 'not_supported' ? 'var(--pr)' : 'var(--line)'}`,
                        borderRadius: '6px',
                        padding: '10px 12px',
                        background: suitability === 'not_supported' ? '#E6F1EF' : '#fff',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'flex-start',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="s"
                        value="not_supported"
                        checked={suitability === 'not_supported'}
                        onChange={(e) => setSuitability(e.target.value as any)}
                        style={{ marginTop: '3px', width: '17px', height: '17px' }}
                      />
                      <span>
                        <b>Not supported</b>
                        <small style={{ display: 'block', color: 'var(--ink2)' }}>
                          Evidence does not support a vendor follow-up.
                        </small>
                      </span>
                    </label>
                  </div>
                </fieldset>

                <label htmlFor="nt" style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                  Note (required)
                </label>
                <textarea
                  id="nt"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
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

                <div style={{ display: 'flex', gap: '10px', margin: '14px 0 0' }}>
                  <Button variant="primary" onClick={handleSaveDisposition}>
                    <svg
                      style={{ width: '18px', height: '18px' }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                    Save disposition
                  </Button>
                  <Button variant="secondary" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>

            {/* Support Document */}
            <Card>
              <h2 style={{ fontFamily: 'var(--fh)', fontSize: '19px', margin: '0 0 12px' }}>
                Support document record
              </h2>
              <dl
                style={{
                  display: 'grid',
                  gridTemplateColumns: '150px 1fr',
                  gap: '6px 14px',
                  margin: 0,
                }}
              >
                <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Document type</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>{supportDocument.document_type}</dd>

                <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Status</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>
                  <Chip color="gray">{supportDocument.status}</Chip>
                </dd>

                <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Contents</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>{supportDocument.contents}</dd>

                <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Sent to vendor</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>
                  <Chip color="gray">{supportDocument.sent_to_vendor}</Chip>
                </dd>
              </dl>
            </Card>

            {/* Info Banner */}
            <Banner color="amber">
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
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
                <div>
                  Recording a disposition does not change the approved review decision or its
                  settlement eligibility.
                </div>
              </div>
            </Banner>
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
        Pilot build &middot; fixture data only &middot; vendor, item, notice and user names are
        fictional. Reason codes are pilot fixture values.
      </footer>
    </div>
  );
}
