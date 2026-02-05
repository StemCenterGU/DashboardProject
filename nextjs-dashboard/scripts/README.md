# Scripts

This directory contains Python scripts for data synchronization and management.

## Directory Structure

```
scripts/
├── sync/                    # Core WCOnline sync scripts
│   ├── sync-wconline.py     # Main sync script for booked appointments
│   ├── sync-avail-slots.py  # Sync available slots from WCOnline
│   └── README-AVAIL-SYNC.md # Sync documentation
│
├── data/                    # Data population scripts
│   ├── populate-available-slots.py  # Generate available slots from tutor availability
│   └── ...
│
├── maintenance/             # Database maintenance scripts
│   ├── merge_duplicates.py           # Merge duplicate tutor entries
│   ├── cleanup_availability_duplicates.py  # Clean up availability duplicates
│   ├── check_availability_duplicates.py    # Check for duplicates
│   ├── fix_avish.py                        # Data fix script
│   └── smart_update_availability.py        # Smart availability updates
│
├── utils/                   # Shared utility modules
│   └── helpers.py           # Common helper functions
│
├── archive/                 # Archived scripts (debug/test)
│   ├── debug/               # Debug scripts for troubleshooting
│   └── tests/               # Test scripts for verification
│
├── extract_tutor_avail.py   # Extract tutor availability from data
└── update_tutor_availability.py  # Update tutor availability table
```

## Common Commands

### Sync Booked Appointments
```bash
python scripts/sync/sync-wconline.py 2026-02-05 2026-02-10
```

### Sync Available Slots
```bash
python scripts/sync/sync-avail-slots.py 2026-02-05 2026-02-10
```

### Populate Available Slots
```bash
python scripts/data/populate-available-slots.py 2026-02-05 2026-02-10
```

### Merge Duplicate Tutors
```bash
python scripts/maintenance/merge_duplicates.py
```

## Notes

- All scripts use environment variables from `.env.local`
- Rate limiting is implemented in sync scripts (300 requests/hour for WCOnline)
- Archive scripts are kept for reference but are not actively used
