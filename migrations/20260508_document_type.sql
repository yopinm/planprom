-- V15: add document_type column to templates for Planner/Checklist/Form/Report tagging
ALTER TABLE templates ADD COLUMN IF NOT EXISTS document_type TEXT NOT NULL DEFAULT 'checklist';
