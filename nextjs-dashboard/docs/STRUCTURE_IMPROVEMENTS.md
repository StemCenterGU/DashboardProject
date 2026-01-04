# Project Structure Improvements

This document summarizes the project structure reorganization completed to improve maintainability and organization.

## ✅ Changes Made

### 1. **Documentation Organization** (`docs/`)
All markdown documentation files moved from root to `docs/`:
- `QUICK_START.md`
- `SUPABASE_AUTH_SETUP.md`
- `LOGIN_AND_ADMIN_GUIDE.md`
- `WCONLINE_DATA_MAPPING.md`
- `SET_ADMIN_ROLE.md`
- `supabase-setup.md`

### 2. **Database Files** (`database/`)
All SQL files moved from root to `database/`:
- `supabase-schema.sql`
- `fix-rls-policies.sql`
- `query-tutor-availability.sql`

### 3. **Scripts Organization** (`scripts/`)
Scripts organized into logical subdirectories:

**`scripts/sync/`** - Synchronization scripts
- `sync-wconline.py` - Main WCOnline sync script

**`scripts/data/`** - Data management scripts
- `import-courses-from-appointments.py`
- `import-tutor-availability.py`
- `extract-tutor-availability.py`
- `populate-available-slots.py`

**`scripts/utils/`** - Utility scripts
- `set-admin-role.js` - Admin role management

### 4. **Data Files** (`data/`)
- `tutor-availability-schedule.txt` moved from root to `data/`
- `wconline/` directory already existed

### 5. **Notebooks** (`notebooks/`)
- `api.ipynb` moved from root to `notebooks/`

## 📝 Updated References

All file references have been updated in:
- ✅ `package.json` - Updated `set-admin` script path
- ✅ `README.md` - Updated all script paths and documentation links
- ✅ `scripts/README.md` - Complete rewrite with new structure
- ✅ `scripts/data/import-tutor-availability.py` - Updated file path reference
- ✅ `scripts/utils/set-admin-role.js` - Updated usage examples
- ✅ All documentation files in `docs/` - Updated script paths

## 🎯 Benefits

1. **Better Organization**: Related files are grouped together
2. **Easier Navigation**: Clear separation of concerns
3. **Scalability**: Easy to add new scripts/docs without cluttering root
4. **Maintainability**: Logical structure makes it easier to find files
5. **Professional**: Follows industry best practices for project organization

## 📋 New Structure Summary

```
nextjs-dashboard/
├── app/                    # Next.js application
├── components/             # React components
├── lib/                    # Utilities & services
├── types/                  # TypeScript definitions
├── public/                 # Static assets
├── scripts/                # Utility scripts
│   ├── sync/              # Sync scripts
│   ├── data/              # Data management
│   └── utils/             # Utilities
├── database/              # SQL files
├── docs/                   # Documentation
├── data/                   # Data files
└── notebooks/             # Jupyter notebooks
```

## 🔄 Migration Notes

If you have existing scripts or documentation that reference old paths, update them:

**Old Paths → New Paths:**
- `scripts/sync-wconline.py` → `scripts/sync/sync-wconline.py`
- `scripts/import-courses-from-appointments.py` → `scripts/data/import-courses-from-appointments.py`
- `scripts/set-admin-role.js` → `scripts/utils/set-admin-role.js`
- `supabase-schema.sql` → `database/supabase-schema.sql`
- `tutor-availability-schedule.txt` → `data/tutor-availability-schedule.txt`

## 📚 Documentation

- See [PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md) for detailed structure documentation
- See [scripts/README.md](../scripts/README.md) for script documentation

