# CAEM API Documentation

## Base URL
`https://staging.caem-api.example.com`

## Authentication
- All endpoints require a valid JWT token in the Authorization header
- Format: `Bearer <token>`
- Obtain token using the test API key provided

## Endpoints

### GET /api/screening/:banco_id
Returns embargo screening data for a specific bank
#### Request:
- Header: 
  - Authorization: Bearer <token>
- Path params:
  - banco_id: Bank identifier

#### Response (200):

[
  {
    "case_id": "string",
    "tipo_id_demandado": "string",
    "id_demandado": "string",
    "tipo_orden": "string",
    "fecha_recepcion": "date",
    "entidad_remitente": "string"
  }
]
