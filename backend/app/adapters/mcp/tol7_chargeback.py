"""TOL7: Chargeback Document Port.

Generates chargeback/credit-request evidence metadata.
"""
from typing import NamedTuple, Protocol


class ChargebackDocumentResult(NamedTuple):
    """Result of chargeback document generation."""
    success: bool
    document_id: str | None
    document_type: str
    message: str


class ChargebackDocumentPort(Protocol):
    """Port interface for TOL7: Chargeback document generation."""

    def generate(
        self,
        case_id: str,
        document_type: str,
        reason_code: str,
        evidence_bundle: list[str]
    ) -> ChargebackDocumentResult:
        """Generate chargeback or credit request document.

        Args:
            case_id: Exception case identifier
            document_type: CHARGEBACK or CREDIT_REQUEST
            reason_code: Approved reason code
            evidence_bundle: List of evidence reference identifiers

        Returns:
            ChargebackDocumentResult with document metadata
        """
        ...


class LocalChargebackDocumentAdapter:
    """Local implementation of ChargebackDocumentPort."""

    def __init__(self, session):
        """Initialize with database session.

        Args:
            session: SQLAlchemy session
        """
        self.session = session

    def generate(
        self,
        case_id: str,
        document_type: str,
        reason_code: str,
        evidence_bundle: list[str]
    ) -> ChargebackDocumentResult:
        """Generate chargeback document metadata.

        In production, this would generate actual PDF or email content
        and send to vendor. For MVP, stores metadata only.

        Args:
            case_id: Exception case identifier
            document_type: CHARGEBACK or CREDIT_REQUEST
            reason_code: Approved reason code
            evidence_bundle: List of evidence reference identifiers

        Returns:
            ChargebackDocumentResult with document metadata
        """
        import json
        import uuid
        from datetime import datetime

        from ...db.models import ChargebackDocument

        document_id = str(uuid.uuid4())

        document = ChargebackDocument(
            id=document_id,
            case_id=case_id,
            document_type=document_type,
            reason_code=reason_code,
            evidence_bundle_json=json.dumps(evidence_bundle),
            generated_at=datetime.utcnow().isoformat()
        )

        self.session.add(document)
        self.session.commit()

        return ChargebackDocumentResult(
            success=True,
            document_id=document_id,
            document_type=document_type,
            message=f"{document_type} document generated: {document_id}"
        )
