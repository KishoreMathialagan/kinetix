"""add phase 2 tables (billing extras, compliance, device tokens, document versions)

Revision ID: a1b2c3d4e5f6
Revises: cd7e538bd9b8
Create Date: 2026-08-02 16:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: str | Sequence[str] | None = 'cd7e538bd9b8'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('treatment_packages',
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('sessions_count', sa.Integer(), nullable=False),
    sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('gst_rate', sa.Numeric(precision=5, scale=2), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('is_deleted', sa.Boolean(), nullable=False),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_by', sa.UUID(), nullable=True),
    sa.Column('updated_by', sa.UUID(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('invoice_items',
    sa.Column('invoice_id', sa.UUID(), nullable=False),
    sa.Column('description', sa.String(length=255), nullable=False),
    sa.Column('quantity', sa.Integer(), nullable=False),
    sa.Column('unit_price', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['invoice_id'], ['billing.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('exercise_completion',
    sa.Column('patient_id', sa.UUID(), nullable=False),
    sa.Column('exercise_program_id', sa.UUID(), nullable=False),
    sa.Column('exercise_item_id', sa.UUID(), nullable=True),
    sa.Column('completed_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['exercise_item_id'], ['exercise_items.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['exercise_program_id'], ['exercise_programs.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_exercise_completion_patient_id'), 'exercise_completion', ['patient_id'], unique=False)
    op.create_index(op.f('ix_exercise_completion_exercise_program_id'), 'exercise_completion', ['exercise_program_id'], unique=False)

    op.create_table('device_tokens',
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('platform', sa.String(length=20), nullable=False),
    sa.Column('token', sa.String(length=512), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('is_deleted', sa.Boolean(), nullable=False),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('token', name='uq_device_tokens_token')
    )
    op.create_index(op.f('ix_device_tokens_user_id'), 'device_tokens', ['user_id'], unique=False)

    op.create_table('document_versions',
    sa.Column('document_id', sa.UUID(), nullable=False),
    sa.Column('version_no', sa.Integer(), nullable=False),
    sa.Column('file_name', sa.String(length=255), nullable=False),
    sa.Column('file_url', sa.Text(), nullable=False),
    sa.Column('mime_type', sa.String(length=100), nullable=True),
    sa.Column('file_size', sa.Integer(), nullable=True),
    sa.Column('note', sa.Text(), nullable=True),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('created_by', sa.UUID(), nullable=True),
    sa.Column('updated_by', sa.UUID(), nullable=True),
    sa.ForeignKeyConstraint(['document_id'], ['patient_documents.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_document_versions_document_id'), 'document_versions', ['document_id'], unique=False)

    op.add_column('billing', sa.Column('therapist_id', sa.UUID(), sa.ForeignKey('therapists.id', ondelete='SET NULL'), nullable=True))
    op.add_column('billing', sa.Column('appointment_id', sa.UUID(), sa.ForeignKey('appointments.id', ondelete='SET NULL'), nullable=True))
    op.add_column('billing', sa.Column('package_id', sa.UUID(), sa.ForeignKey('treatment_packages.id', ondelete='SET NULL'), nullable=True))
    op.add_column('billing', sa.Column('gst_rate', sa.Numeric(precision=5, scale=2), nullable=False, server_default='18.0'))
    op.add_column('billing', sa.Column('issued_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('billing', sa.Column('notes', sa.Text(), nullable=True))
    op.create_index(op.f('ix_billing_therapist_id'), 'billing', ['therapist_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_billing_therapist_id'), table_name='billing')
    op.drop_column('billing', 'notes')
    op.drop_column('billing', 'issued_at')
    op.drop_column('billing', 'gst_rate')
    op.drop_column('billing', 'package_id')
    op.drop_column('billing', 'appointment_id')
    op.drop_column('billing', 'therapist_id')
    op.drop_index(op.f('ix_document_versions_document_id'), table_name='document_versions')
    op.drop_table('document_versions')
    op.drop_index(op.f('ix_device_tokens_user_id'), table_name='device_tokens')
    op.drop_table('device_tokens')
    op.drop_index(op.f('ix_exercise_completion_exercise_program_id'), table_name='exercise_completion')
    op.drop_index(op.f('ix_exercise_completion_patient_id'), table_name='exercise_completion')
    op.drop_table('exercise_completion')
    op.drop_table('invoice_items')
    op.drop_table('treatment_packages')
