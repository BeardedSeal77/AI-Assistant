# n8n Implementation Guide - AI Assistant

## Overview
This guide covers setting up n8n workflows for the AI Assistant project, starting with the calendar module and designing for future extensibility.

## Architecture Philosophy
- **Modular workflows** - Each capability (calendar, email, etc.) is a separate workflow
- **Generic webhook entry points** - Standardized input format for all modules
- **User context awareness** - Each request includes user information and auth tokens
- **Error handling** - Consistent error responses and logging

## Required n8n Nodes
Make sure these nodes are available in your n8n instance:
- Webhook (Trigger)
- HTTP Request
- Set
- IF
- Switch
- Google Calendar
- Code (for data transformation)
- Respond to Webhook

## Workflow 1: Main Router (Entry Point)

### Purpose
Routes incoming requests to appropriate module workflows based on intent.

### Workflow Structure
```
Webhook Trigger (POST /webhook/assistant)
    ↓
Code Node (Parse & Validate Input)
    ↓
Switch Node (Route by Intent)
    ├─ calendar → HTTP Request to Calendar Workflow
    ├─ email → HTTP Request to Email Workflow (future)
    ├─ tasks → HTTP Request to Tasks Workflow (future)
    └─ default → Respond with "Unknown intent"
```

### Webhook Configuration
- **URL**: `/webhook/assistant`
- **Method**: POST
- **Response Mode**: Respond When Last Node Finishes
- **Expected Input Format**:
```json
{
  "user_id": "google-user-id",
  "user_email": "user@gmail.com",
  "access_token": "google-oauth-token",
  "intent": "calendar",
  "message": "Schedule dentist appointment Friday at 2 PM",
  "extracted_data": {
    "title": "Dentist appointment",
    "date": "2025-08-08",
    "time": "14:00",
    "duration": 60
  }
}
```

### Code Node - Input Validation
```javascript
// Validate required fields
const requiredFields = ['user_id', 'user_email', 'access_token', 'intent'];
const missingFields = requiredFields.filter(field => !$json[field]);

if (missingFields.length > 0) {
  return [{
    error: true,
    message: `Missing required fields: ${missingFields.join(', ')}`,
    status: 400
  }];
}

// Pass through valid data
return [{
  ...items[0].json,
  timestamp: new Date().toISOString(),
  workflow_id: 'main-router'
}];
```

### Switch Node Configuration
- **Mode**: Expression
- **Expression**: `{{ $json.intent }}`
- **Routes**:
  - `calendar` → Route 0
  - `email` → Route 1 (future)
  - `tasks` → Route 2 (future)
  - Default → Route 3

## Workflow 2: Calendar Module

### Purpose
Handles all calendar-related operations (create events, list events, etc.)

### Workflow Structure
```
Webhook Trigger (POST /webhook/calendar)
    ↓
Code Node (Validate Calendar Data)
    ↓
IF Node (Check if event data exists)
    ├─ TRUE → Google Calendar Node (Create Event)
    └─ FALSE → Set Node (Error Response)
    ↓
Code Node (Format Response)
    ↓
Respond to Webhook
```

### Webhook Configuration
- **URL**: `/webhook/calendar`
- **Method**: POST
- **Response Mode**: Respond When Last Node Finishes

### Code Node - Calendar Data Validation
```javascript
const calendarData = $json.extracted_data;

// Validate calendar-specific fields
if (!calendarData || !calendarData.title || !calendarData.date) {
  return [{
    error: true,
    message: "Missing required calendar fields: title and date",
    status: 400,
    user_id: $json.user_id
  }];
}

// Format datetime for Google Calendar
const startDateTime = `${calendarData.date}T${calendarData.time || '12:00'}:00`;
const duration = calendarData.duration || 60;
const endDateTime = new Date(new Date(startDateTime).getTime() + duration * 60000).toISOString();

return [{
  user_id: $json.user_id,
  user_email: $json.user_email,
  access_token: $json.access_token,
  event: {
    summary: calendarData.title,
    start: {
      dateTime: startDateTime,
      timeZone: 'Africa/Johannesburg'
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'Africa/Johannesburg'
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 },      // 1 hour before
        { method: 'popup', minutes: 1440 }     // 1 day before
      ]
    }
  }
}];
```

### Google Calendar Node Configuration
- **Resource**: Event
- **Operation**: Create
- **Authentication**: 
  - Use "Generic Credential Type" 
  - Set "Access Token" to `{{ $json.access_token }}`
- **Calendar ID**: `primary` (user's main calendar)
- **Event Object**: `{{ $json.event }}`

### Response Formatting Code Node
```javascript
// Check if Google Calendar operation was successful
if ($json.error) {
  return [{
    success: false,
    message: "Failed to create calendar event",
    error: $json.error,
    user_id: items[0].json.user_id
  }];
}

// Success response
return [{
  success: true,
  message: `Calendar event "${$json.summary}" created successfully for ${$json.start.dateTime}`,
  event_id: $json.id,
  event_link: $json.htmlLink,
  user_id: items[0].json.user_id,
  module: 'calendar'
}];
```

## Workflow 3: Error Handler (Global)

### Purpose
Centralized error handling and logging for all workflows.

### Workflow Structure
```
Webhook Trigger (POST /webhook/error)
    ↓
Code Node (Log Error)
    ↓
Set Node (Standard Error Response)
    ↓
Respond to Webhook
```

### Error Logging Code Node
```javascript
const errorData = {
  timestamp: new Date().toISOString(),
  user_id: $json.user_id || 'unknown',
  workflow: $json.workflow_id || 'unknown',
  error_message: $json.error || 'Unknown error',
  stack_trace: $json.stack || null,
  input_data: $json.original_input || null
};

console.log('AI Assistant Error:', JSON.stringify(errorData, null, 2));

return [errorData];
```

## Workflow Settings & Configuration

### Global Settings
1. **Timezone**: Set to "Africa/Johannesburg"
2. **Error Workflow**: Link all workflows to the Error Handler workflow
3. **Execution Order**: Sequential (important for data consistency)

### Security Considerations
1. **Webhook Authentication**: Consider adding API key validation
2. **Token Validation**: Verify Google tokens before use
3. **Rate Limiting**: Implement request throttling
4. **Logging**: Log all requests (without sensitive data)

## Testing Your Workflows

### Test Data for Calendar Module
```json
{
  "user_id": "test-user-123",
  "user_email": "test@gmail.com",
  "access_token": "your-test-token",
  "intent": "calendar",
  "message": "Test appointment tomorrow at 3 PM",
  "extracted_data": {
    "title": "Test Appointment",
    "date": "2025-08-06",
    "time": "15:00",
    "duration": 60
  }
}
```

### Using n8n's Manual Execution
1. Use "Execute Workflow" button in n8n interface
2. Paste test JSON data
3. Verify each node processes data correctly
4. Check Google Calendar for created events

## Future Workflow Extensions

### Email Module Structure
```
Webhook → Validate → Gmail API → Response
```

### Task Management Module Structure
```
Webhook → Validate → Database/API → Response
```

### Smart Home Module Structure
```
Webhook → Validate → Home Assistant API → Response
```

## Monitoring & Maintenance

### Key Metrics to Track
- Request success/failure rates
- Response times per module
- Token refresh frequency
- Error types and frequencies

### Regular Maintenance Tasks
1. Review error logs weekly
2. Update Google API credentials as needed
3. Test all workflows monthly
4. Clean up old execution data

## Deployment Checklist

### Before Going Live
- [ ] Test all webhook URLs
- [ ] Verify Google Calendar permissions
- [ ] Set up error notifications
- [ ] Configure backup workflows
- [ ] Test token refresh mechanism
- [ ] Validate timezone settings
- [ ] Test with multiple user accounts

### Production Configuration
- Enable workflow execution logging
- Set up webhook URL monitoring
- Configure automatic workflow restarts
- Set resource limits for long-running executions

## Troubleshooting Common Issues

### Google Calendar Authentication Errors
- Check if access token is expired
- Verify calendar API is enabled in Google Console
- Ensure user has granted calendar permissions

### Webhook Connection Issues
- Verify n8n is accessible from web app
- Check firewall settings
- Test webhook URLs with curl/Postman

### Data Format Issues
- Validate JSON structure matches expected format
- Check timezone format consistency
- Verify date/time parsing in different locales