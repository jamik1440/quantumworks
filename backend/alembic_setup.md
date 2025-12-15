# Alembic Setup Guide

## Quick Start

```bash
# 1. Install Alembic (already in requirements.txt)
pip install alembic

# 2. Initialize Alembic
cd backend
alembic init alembic

# 3. Configure alembic.ini
# Edit alembic.ini and set:
# sqlalchemy.url = ${DATABASE_URL}

# 4. Update alembic/env.py (see DATABASE_SCALABILITY.md)

# 5. Create first migration
alembic revision --autogenerate -m "Initial schema"

# 6. Review and edit migration file
# Edit alembic/versions/xxxx_initial_schema.py

# 7. Run migration
alembic upgrade head

# 8. Check status
alembic current
alembic history
```

## Common Commands

```bash
# Create new migration
alembic revision -m "description"

# Auto-generate migration from models
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Rollback to specific revision
alembic downgrade <revision_id>

# Show current revision
alembic current

# Show migration history
alembic history

# Show SQL for migration (without applying)
alembic upgrade head --sql
```

## Migration Workflow

1. **Update models** in `models_postgresql.py`
2. **Generate migration**: `alembic revision --autogenerate -m "description"`
3. **Review migration file** in `alembic/versions/`
4. **Test migration**: `alembic upgrade head --sql` (dry run)
5. **Apply migration**: `alembic upgrade head`
6. **Verify**: Check database schema

