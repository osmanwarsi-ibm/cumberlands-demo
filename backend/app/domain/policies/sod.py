"""Segregation of Duties (SoD) policy implementing VR-011.

Enforces that prepared_by_user_id ≠ approving_reviewer_user_id.
"""
from typing import NamedTuple


class SoDViolation(NamedTuple):
    """SoD violation details."""
    violated: bool
    reason: str
    approver_user_id: str | None = None
    preparer_user_id: str | None = None


class SoDPolicy:
    """Implements segregation of duties policy VR-011 from LLD Section 5.2.

    Rule: prepared_by_user_id ≠ approving_reviewer_user_id for the same case.
    """

    @classmethod
    def check_settlement_preparation(
        cls,
        prepared_by_user_id: str,
        approving_reviewer_user_id: str | None
    ) -> SoDViolation:
        """Check SoD policy for settlement preparation.

        Args:
            prepared_by_user_id: User attempting to prepare settlement (AP Specialist)
            approving_reviewer_user_id: User who approved the case (if any)

        Returns:
            SoDViolation with violation flag and details
        """
        if approving_reviewer_user_id is None:
            # No reviewer yet (e.g., full match case with no review needed)
            return SoDViolation(
                violated=False,
                reason="No reviewer assigned; SoD not applicable",
                approver_user_id=None,
                preparer_user_id=prepared_by_user_id
            )

        if prepared_by_user_id == approving_reviewer_user_id:
            return SoDViolation(
                violated=True,
                reason="Same user cannot approve and prepare settlement for the same case",
                approver_user_id=approving_reviewer_user_id,
                preparer_user_id=prepared_by_user_id
            )

        return SoDViolation(
            violated=False,
            reason="SoD check passed: different users for approval and preparation",
            approver_user_id=approving_reviewer_user_id,
            preparer_user_id=prepared_by_user_id
        )

    @classmethod
    def check_review_decision(
        cls,
        reviewer_user_id: str,
        ingested_by_user_id: str | None
    ) -> SoDViolation:
        """Check SoD policy for review decision.

        Optional check: reviewer should not be the same as ingestion user.
        This is a softer constraint than settlement preparation.

        Args:
            reviewer_user_id: User attempting to review case
            ingested_by_user_id: User who ingested the batch (if tracked)

        Returns:
            SoDViolation with violation flag and details
        """
        if ingested_by_user_id is None:
            return SoDViolation(
                violated=False,
                reason="No ingestion user tracked; SoD not applicable",
                approver_user_id=reviewer_user_id,
                preparer_user_id=None
            )

        if reviewer_user_id == ingested_by_user_id:
            return SoDViolation(
                violated=True,
                reason="Same user cannot ingest and approve the same batch",
                approver_user_id=reviewer_user_id,
                preparer_user_id=ingested_by_user_id
            )

        return SoDViolation(
            violated=False,
            reason="SoD check passed: different users for ingestion and review",
            approver_user_id=reviewer_user_id,
            preparer_user_id=ingested_by_user_id
        )
