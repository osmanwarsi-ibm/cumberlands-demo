/**
 * LoginPage - Pilot user selection screen
 * Matches wireframe_login.html design exactly
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth';

const PILOT_USERS = [
  {
    username: 'p.nair',
    initials: 'PN',
    fullName: 'Priya Nair',
    role: 'AP Specialist',
    description: 'intake, settlement preparation, AP queue monitoring',
  },
  {
    username: 'd.whitfield',
    initials: 'DW',
    fullName: 'Dana Whitfield',
    role: 'Price Book Analyst',
    description: 'cost review queue, approve / override / escalate cost exceptions',
  },
  {
    username: 'm.ortiz',
    initials: 'MO',
    fullName: 'Marcus Ortiz',
    role: 'Inventory Control Analyst',
    description: 'quantity and unmatched exception queue',
  },
  {
    username: 'h.brooks',
    initials: 'HB',
    fullName: 'Helen Brooks',
    role: 'Vendor Relations Manager',
    description: 'chargeback and credit-request evidence review',
  },
  {
    username: 't.reyes',
    initials: 'TR',
    fullName: 'Tom Reyes',
    role: 'Internal Audit',
    description: 'read-only audit trace',
  },
];

const ROLE_PERMISSIONS = [
  {
    role: 'AP Specialist',
    canWork: 'Ingest statements, run match, prepare settlement',
    cannot: 'Approve exceptions',
  },
  {
    role: 'Price Book Analyst',
    canWork: 'Cost review decisions',
    cannot: 'Prepare settlement on a case they approved',
  },
  {
    role: 'Inventory Control Analyst',
    canWork: 'Quantity and unmatched review decisions',
    cannot: 'Prepare settlement on a case they approved',
  },
  {
    role: 'Vendor Relations Manager',
    canWork: 'Record follow-up disposition',
    cannot: 'Change review decisions',
  },
  {
    role: 'Internal Audit',
    canWork: 'View audit trace',
    cannot: 'Any write action',
  },
];

const WORKFLOW_STEPS = [
  'Statement intake and validation',
  'Three-way match: statement, receipt, invoice',
  'AI-assisted triage recommendation, held for human approval',
  'Human decision: approve, override or escalate',
  'Settlement preparation into the mocked AP queue',
];

export function LoginPage() {
  const [selectedUser, setSelectedUser] = useState('p.nair');
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(selectedUser);
      navigate('/intake');
    } catch (error) {
      console.error('Sign in failed:', error);
      alert('Sign in failed. Please try again.');
    }
  };

  const selectedUserData = PILOT_USERS.find((u) => u.username === selectedUser);

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
        <div style={{ fontSize: '13px', color: '#fff' }}>Signed out</div>
      </header>
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
        Pilot environment: fixture data only. No live BOS/PDI, Oracle AP, email or EDI connections.
      </div>
      <main id="main" style={{ width: '100%', padding: '28px 32px 48px' }}>
        <p style={{ color: 'var(--ink2)', margin: '0 0 6px', fontSize: '13px' }}>Route /login</p>
        <h1 style={{ fontFamily: 'var(--fh)', fontSize: '32px', margin: '0 0 6px' }}>Sign in to the pilot</h1>
        <p style={{ color: 'var(--ink2)', margin: '0 0 22px', fontSize: '16px' }}>
          Choose a pilot user. Your role decides which queues you can work and which actions are allowed. This is a
          role-based stub, not production sign-on.
        </p>
        <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start' }}>
          <div style={{ flex: '1.15 1 0', minWidth: 0 }}>
            <section
              style={{
                background: 'var(--sf)',
                border: '1px solid var(--line)',
                borderRadius: '6px',
                padding: '22px',
              }}
              aria-labelledby="pick"
            >
              <h2 id="pick" style={{ fontFamily: 'var(--fh)', fontSize: '20px', margin: '0 0 12px' }}>
                Select user and role
              </h2>
              <form onSubmit={handleSignIn}>
                <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
                  <legend style={{ fontWeight: 700, fontSize: '16px', padding: 0, marginBottom: '10px' }}>
                    Pilot users
                  </legend>
                  {PILOT_USERS.map((user) => (
                    <label
                      key={user.username}
                      style={{
                        display: 'flex',
                        gap: '14px',
                        alignItems: 'flex-start',
                        border: `2px solid ${selectedUser === user.username ? 'var(--pr)' : 'var(--line)'}`,
                        borderRadius: '6px',
                        padding: '12px 14px',
                        marginBottom: '10px',
                        background: selectedUser === user.username ? '#E6F1EF' : 'var(--sf)',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="u"
                        value={user.username}
                        checked={selectedUser === user.username}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        style={{ marginTop: '5px', width: '18px', height: '18px' }}
                      />
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'var(--prd)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                        aria-hidden="true"
                      >
                        {user.initials}
                      </div>
                      <span>
                        <b style={{ display: 'block', fontSize: '16px' }}>
                          {user.fullName}{' '}
                          {selectedUser === user.username && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '2px 9px',
                                borderRadius: '999px',
                                fontSize: '12px',
                                fontWeight: 700,
                                border: '1px solid var(--gn)',
                                color: 'var(--gn)',
                                background: 'var(--gnb)',
                                whiteSpace: 'nowrap',
                                marginLeft: '6px',
                              }}
                            >
                              Selected
                            </span>
                          )}
                        </b>
                        <span style={{ color: 'var(--ink2)', fontSize: '13px' }}>
                          {user.role} · {user.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </fieldset>
                <p style={{ margin: '18px 0 0', display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <button
                    type="submit"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '11px 20px',
                      borderRadius: '4px',
                      fontSize: '15px',
                      fontWeight: 600,
                      fontFamily: 'var(--fb)',
                      border: '2px solid var(--pr)',
                      background: 'var(--pr)',
                      color: '#fff',
                      cursor: 'pointer',
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
                        verticalAlign: '-3px',
                        flexShrink: 0,
                      }}
                      viewBox="0 0 24 24"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Sign in as {selectedUserData?.fullName}
                  </button>
                  <span style={{ fontSize: '13px', color: 'var(--ink2)' }}>
                    No password in the pilot. The selected role is attached to every action in the audit trace.
                  </span>
                </p>
              </form>
            </section>
          </div>
          <div style={{ flex: '1 1 0', minWidth: 0 }}>
            <section
              style={{
                background: 'var(--sf)',
                border: '1px solid var(--line)',
                borderRadius: '6px',
                padding: '22px',
                marginBottom: '20px',
              }}
              aria-labelledby="roles"
            >
              <h2 id="roles" style={{ fontFamily: 'var(--fh)', fontSize: '20px', margin: '0 0 12px' }}>
                What each role can do
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr>
                    <th
                      scope="col"
                      style={{
                        textAlign: 'left',
                        background: 'var(--sf2)',
                        padding: '10px 12px',
                        borderBottom: '2px solid var(--line)',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Role
                    </th>
                    <th
                      scope="col"
                      style={{
                        textAlign: 'left',
                        background: 'var(--sf2)',
                        padding: '10px 12px',
                        borderBottom: '2px solid var(--line)',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Can work
                    </th>
                    <th
                      scope="col"
                      style={{
                        textAlign: 'left',
                        background: 'var(--sf2)',
                        padding: '10px 12px',
                        borderBottom: '2px solid var(--line)',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Cannot do
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ROLE_PERMISSIONS.map((perm, idx) => (
                    <tr key={idx}>
                      <th
                        scope="row"
                        style={{
                          textAlign: 'left',
                          padding: '10px 12px',
                          borderBottom: '1px solid var(--line)',
                          verticalAlign: 'top',
                        }}
                      >
                        {perm.role}
                      </th>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--line)', verticalAlign: 'top' }}>
                        {perm.canWork}
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--line)', verticalAlign: 'top' }}>
                        {perm.cannot}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <div
              role="note"
              style={{
                display: 'flex',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '4px',
                border: '1px solid #9DB8DD',
                marginBottom: '16px',
                alignItems: 'flex-start',
                background: 'var(--blb)',
                color: '#14355F',
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
                  flexShrink: 0,
                }}
                viewBox="0 0 24 24"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <div>
                <b>Segregation of duties is enforced.</b> The person who approves an exception cannot prepare its
                settlement. A blocked attempt is refused and recorded.
              </div>
            </div>
            <section
              style={{
                background: 'var(--sf)',
                border: '1px solid var(--line)',
                borderRadius: '6px',
                padding: '22px',
              }}
              aria-labelledby="flow"
            >
              <h2 id="flow" style={{ fontFamily: 'var(--fh)', fontSize: '20px', margin: '0 0 12px' }}>
                Pilot workflow
              </h2>
              <ol style={{ margin: 0, paddingLeft: '20px' }}>
                {WORKFLOW_STEPS.map((step, idx) => (
                  <li key={idx} style={{ marginBottom: '8px' }}>
                    {step}
                  </li>
                ))}
              </ol>
            </section>
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
        Pilot build · fixture data only · sample users are fictional.
      </footer>
    </div>
  );
}
