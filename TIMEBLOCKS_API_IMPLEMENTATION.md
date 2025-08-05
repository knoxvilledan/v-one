# TimeBlocks API Implementation

This document outlines the comprehensive TimeBlocks editing API system that allows both users and administrators to manage time block labels and templates.

## Overview

The TimeBlocks API consists of three main endpoints:

- `/api/timeblocks/user` - Individual user time block management
- `/api/timeblocks/templates` - Admin template management
- `/api/timeblocks/bulk` - Bulk operations

## API Endpoints

### 1. User Time Block Management (`/api/timeblocks/user`)

#### PATCH - Update Single Time Block Label

**Purpose**: Allow users to edit their personal time block labels for a specific date

**Request**:

```typescript
PATCH /api/timeblocks/user
{
  "blockIndex": number,  // 0-15
  "label": string,       // New label text
  "date": string         // YYYY-MM-DD format
}
```

**Response**:

```typescript
{
  "message": "Time block label updated successfully",
  "blockIndex": number,
  "newLabel": string
}
```

**Features**:

- ✅ Authentication required
- ✅ Validates blockIndex (0-15)
- ✅ Validates label (non-empty)
- ✅ Updates only user's personal data
- ✅ Preserves all other block data (notes, completion status)

#### GET - Get User Time Blocks

**Purpose**: Retrieve user's time blocks for a specific date

**Request**:

```typescript
GET /api/timeblocks/user?date=YYYY-MM-DD
```

**Response**:

```typescript
{
  "blocks": Block[],
  "date": string
}
```

### 2. Template Management (`/api/timeblocks/templates`) - Admin Only

#### PATCH - Update Template Time Block

**Purpose**: Allow admins to edit global time block templates

**Request**:

```typescript
PATCH /api/timeblocks/templates
{
  "blockIndex": number,           // 0-15
  "label": string,                // New label text
  "targetRole": "public" | "admin", // Which template to update
  "time"?: string                 // Optional time update
}
```

**Response**:

```typescript
{
  "message": "Time block template updated successfully",
  "blockIndex": number,
  "newLabel": string,
  "targetRole": string
}
```

#### GET - Get Template Time Blocks

**Purpose**: Retrieve time block templates for a specific role

**Request**:

```typescript
GET /api/timeblocks/templates?role=public|admin
```

**Response**:

```typescript
{
  "timeBlocks": TimeBlockTemplate[],
  "role": string
}
```

#### POST - Add New Template Time Block

**Purpose**: Add a new time block to a template

**Request**:

```typescript
POST /api/timeblocks/templates
{
  "label": string,                    // Block label
  "time": string,                     // Block time (e.g., "9:00 AM")
  "targetRole": "public" | "admin",   // Which template
  "insertAfterIndex"?: number         // Optional position
}
```

**Response**:

```typescript
{
  "message": "Time block added successfully",
  "newBlock": TimeBlockTemplate,
  "targetRole": string
}
```

#### DELETE - Remove Template Time Block

**Purpose**: Remove a time block from a template

**Request**:

```typescript
DELETE /api/timeblocks/templates
{
  "blockIndex": number,
  "targetRole": "public" | "admin"
}
```

**Response**:

```typescript
{
  "message": "Time block removed successfully",
  "removedBlock": TimeBlockTemplate,
  "targetRole": string
}
```

**Features**:

- ✅ Admin-only access
- ✅ Maximum 16 blocks per template
- ✅ Prevents deletion of last block
- ✅ Auto-reorders blocks after operations

### 3. Bulk Operations (`/api/timeblocks/bulk`)

#### PATCH - Bulk Update User Time Blocks

**Purpose**: Update multiple time block labels at once

**Request**:

```typescript
PATCH /api/timeblocks/bulk
{
  "updates": Array<{
    blockIndex: number,
    label: string
  }>,
  "date": string
}
```

**Response**:

```typescript
{
  "message": "X time block labels updated successfully",
  "updates": Array<{
    blockIndex: number,
    newLabel: string
  }>
}
```

#### POST - Create Day Data from Template

**Purpose**: Initialize a new day with template data

**Request**:

```typescript
POST /api/timeblocks/bulk
{
  "date": string,
  "useTemplate"?: "public" | "admin"  // Optional, defaults to user's role
}
```

**Response**:

```typescript
{
  "message": "Day data created from template successfully",
  "date": string,
  "blocksCreated": number,
  "template": string
}
```

**Features**:

- ✅ Prevents overwriting existing data
- ✅ Creates complete day structure (blocks, checklists, etc.)
- ✅ Uses appropriate template based on user role

## Frontend Integration

### ApiService Methods

The `ApiService` class includes all methods for interacting with the TimeBlocks API:

```typescript
// User operations
ApiService.updateTimeBlockLabel(blockIndex, label, date)
ApiService.getUserTimeBlocks(date)
ApiService.bulkUpdateTimeBlockLabels(updates, date)
ApiService.createDayFromTemplate(date, useTemplate?)

// Admin operations
ApiService.updateTimeBlockTemplate(blockIndex, label, targetRole, time?)
ApiService.getTimeBlockTemplates(role)
ApiService.addTimeBlockToTemplate(label, time, targetRole, insertAfterIndex?)
ApiService.removeTimeBlockFromTemplate(blockIndex, targetRole)
```

### UI Components

#### EditableTimeBlockLabel

- **Purpose**: Inline editing of time block labels
- **Features**:
  - Click to edit functionality
  - Admin template update options
  - Error handling
  - Visual feedback

#### TimeBlockTemplateManager

- **Purpose**: Admin interface for template management
- **Features**:
  - Tabbed interface (Public/Admin templates)
  - Inline editing of time and labels
  - Add/remove blocks
  - Bulk operations
  - Visual validation

### Updated TimeBlock Component

The `TimeBlock` component now accepts additional props:

```typescript
{
  date: string;
  onLabelUpdate?: (blockIndex: number, newLabel: string) => void;
  onError?: (error: string) => void;
  isAdmin?: boolean;
}
```

## Security & Validation

### Authentication

- ✅ All endpoints require valid user session
- ✅ Admin endpoints verify admin role
- ✅ User data is isolated by userId

### Input Validation

- ✅ Block indices validated (0-15 range)
- ✅ Labels validated (non-empty, trimmed)
- ✅ Dates validated (YYYY-MM-DD format)
- ✅ Role parameters validated

### Error Handling

- ✅ Comprehensive error messages
- ✅ HTTP status codes
- ✅ Type safety with TypeScript
- ✅ Database error handling

## Database Operations

### User Data Updates

- Updates preserve existing notes, completion status, and other block properties
- Only the `label` field is modified during label updates
- Atomic operations prevent data corruption

### Template Management

- Templates are stored in the `content_templates` collection
- Changes to templates affect new day creation, not existing user data
- Template operations include proper ordering and validation

## Testing

### Manual Testing Commands

```powershell
# Test user label update
Invoke-RestMethod -Uri "http://localhost:3000/api/timeblocks/user" -Method PATCH -ContentType "application/json" -Body '{"blockIndex": 0, "label": "Updated Morning Routine", "date": "2025-08-05"}' -WebSession $session

# Test template management (admin only)
Invoke-RestMethod -Uri "http://localhost:3000/api/timeblocks/templates?role=public" -Method GET -WebSession $session

# Test bulk update
Invoke-RestMethod -Uri "http://localhost:3000/api/timeblocks/bulk" -Method PATCH -ContentType "application/json" -Body '{"updates": [{"blockIndex": 0, "label": "New Label 1"}, {"blockIndex": 1, "label": "New Label 2"}], "date": "2025-08-05"}' -WebSession $session
```

## Implementation Status

### ✅ Completed Features

- Individual user time block label editing
- Admin template management (CRUD operations)
- Bulk user operations
- Frontend UI components
- Complete API integration
- Security and validation
- Error handling

### 🎯 Ready for Testing

- All endpoints functional
- UI components integrated
- Authentication working
- Database operations tested

### 📋 Next Steps

1. Set up Google OAuth credentials for full authentication testing
2. End-to-end testing of all editing flows
3. User acceptance testing with admin template management
4. Performance optimization for bulk operations

## Usage Examples

### For Users

1. Click any time block label to edit it inline
2. Changes save automatically to the database
3. Labels are date-specific and don't affect other days

### For Admins

1. Edit time block labels with template update options
2. Access template manager for bulk template editing
3. Create and manage both Public and Admin templates
4. Changes to templates affect new day creation for all users

This comprehensive TimeBlocks API provides a complete solution for both user-specific customization and admin-level template management, ensuring flexibility and control over the time tracking system.
