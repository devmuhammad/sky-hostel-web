# Room Selection Integration Guide

## Overview

This guide explains how to integrate the new `RoomSelectionWizard` and `HostelRulesConsent` components into your existing registration flow.

## Current Flow (To Replace)

```
Payment → Confirm Payment → Registration Form (with basic room selection)
```

## New Flow (To Implement)

```
Room Selection → Rules Consent → Registration Form → Success Page
```

## Components to Use

### 1. RoomSelectionWizard

- **Location**: `shared/components/ui/room-selection-wizard.tsx`
- **Purpose**: 3-step room selection process
- **Features**:
  - Real database integration
  - Dynamic bedspace availability
  - Loading and error states

### 2. HostelRulesConsent

- **Location**: `shared/components/ui/hostel-rules-consent.tsx`
- **Purpose**: Complete hostel rules agreement
- **Features**:
  - All 4 sections of hostel rules
  - Signature declaration
  - Date validation

## Integration Steps

### Step 1: Replace Current Room Selection

In your registration form, replace the current room selection with:

```tsx
import {
  RoomSelectionWizard,
  HostelRulesConsent,
} from "@/shared/components/ui";

// Add state for room selection flow
const [showRoomSelection, setShowRoomSelection] = useState(false);
const [showRulesConsent, setShowRulesConsent] = useState(false);
const [selectedRoom, setSelectedRoom] = useState(null);
const [rulesConsent, setRulesConsent] = useState(null);

// Handle room selection completion
const handleRoomSelectionComplete = (selection) => {
  setSelectedRoom(selection);
  setShowRoomSelection(false);
  setShowRulesConsent(true);
};

// Handle rules consent completion
const handleRulesConsentComplete = (consent) => {
  setRulesConsent(consent);
  setShowRulesConsent(false);
  // Proceed to registration form with pre-filled room data
};
```

### Step 2: Update Registration Form

Pre-fill the room selection fields in your registration form:

```tsx
// In your registration form
const roomSelectionFields = {
  block: selectedRoom?.room?.block || "",
  room: selectedRoom?.room?.name || "",
  bedspace_label:
    `${selectedRoom?.bedspace?.bunk} ${selectedRoom?.bedspace?.position}` || "",
};
```

### Step 3: Update Database Schema

Ensure your students table has the correct fields:

- `block` - Room block
- `room` - Room name/number
- `bedspace_label` - Bedspace identifier

## Database Mapping

### Room Types

- `room-4` → `4_bed` (4-bed rooms)
- `room-6` → `6_bed` (6-bed rooms)

### Bedspace Labels

- `Bunk A Top` → `Bed 1 (Top)`
- `Bunk A Bottom` → `Bed 1 (Down)`
- `Bunk B Top` → `Bed 2 (Top)`
- `Bunk B Bottom` → `Bed 2 (Down)`

## Testing

### Demo Page

Visit `/room-selection-demo` to test the complete flow:

1. Room Type Selection
2. Room Selection
3. Bedspace Selection
4. Rules Consent
5. Registration Complete

### Integration Testing

1. Test with real database data
2. Verify bedspace availability updates
3. Check form pre-filling
4. Validate registration submission

## Benefits

### ✅ Improved UX

- Step-by-step room selection
- Visual bedspace selection
- Clear availability indicators

### ✅ Better Data Integrity

- Real-time database integration
- Accurate availability tracking
- Proper bedspace mapping

### ✅ Enhanced Compliance

- Complete rules agreement
- Digital signature
- Audit trail

## Next Steps

1. **Test the demo** at `/room-selection-demo`
2. **Integrate components** into registration form
3. **Update database** with room availability
4. **Deploy and test** in production

## Support

If you encounter issues:

1. Check the demo page for working examples
2. Verify database connectivity
3. Review console logs for errors
4. Ensure all components are properly imported
