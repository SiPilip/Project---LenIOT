# Kontrak API

Base URL: `http://localhost:8080/api/v1`

Lihat model data, envelope respons, dan status code di [AGENTS.md](../AGENTS.md).

## Endpoints

| Method | Path | Deskripsi | Status Code |
|---|---|---|---|
| GET | `/health` | Health check service | 200 |
| GET | `/api/v1/entities` | Mendapatkan daftar seluruh entitas | 200 |
| POST | `/api/v1/entities` | Membuat entitas baru | 201, 400, 422 |
| GET | `/api/v1/entities/:id` | Mendapatkan detail entitas berdasarkan ID | 200, 400, 404 |
| PUT | `/api/v1/entities/:id` | Memperbarui data entitas | 200, 400, 404, 422 |
| DELETE | `/api/v1/entities/:id` | Menghapus entitas | 204, 400, 404 |

---

## Format Data

### Data Contract

| Field | Type | Rules | Keterangan |
|---|---|---|---|
| `id` | string (UUID) | Server-generated | Format UUID v4 |
| `name` | string | required, trimmed, 1-100 chars | Nama entitas |
| `type` | string | enum: `vehicle`, `iot_device`, `facility`, `other` | Jenis entitas |
| `status` | string | enum: `active`, `inactive`, `maintenance` | Status operasional |
| `description` | string | optional, max 500 chars | Deskripsi tambahan |
| `latitude` | number | required, -90..90 | Derajat lintang |
| `longitude` | number | required, -180..180 | Derajat bujur |
| `created_at` | string | RFC3339, server-generated | Waktu pembuatan (UTC) |
| `updated_at` | string | RFC3339, server-generated | Waktu pembaruan (UTC) |

---

## Envelope Respons

### Response Sukses

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Fleet Truck 01",
    "type": "vehicle",
    "status": "active",
    "description": "Logistics delivery vehicle in Palembang area",
    "latitude": -2.976074,
    "longitude": 104.775431,
    "created_at": "2026-09-19T10:00:00Z",
    "updated_at": "2026-09-19T10:00:00Z"
  }
}
```

Untuk list (`GET /api/v1/entities`):

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Fleet Truck 01",
      "type": "vehicle",
      "status": "active",
      "description": "Logistics delivery vehicle",
      "latitude": -2.976074,
      "longitude": 104.775431,
      "created_at": "2026-09-19T10:00:00Z",
      "updated_at": "2026-09-19T10:00:00Z"
    }
  ]
}
```

### Response Error

Format standar error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      {
        "field": "latitude",
        "message": "must be between -90 and 90"
      },
      {
        "field": "name",
        "message": "is required and must be between 1 and 100 characters"
      }
    ]
  }
}
```

Kode Error Standar:
- `BAD_REQUEST` (400): JSON payload rusak atau format ID bukan UUID yang valid.
- `NOT_FOUND` (404): Entitas tidak ditemukan.
- `VALIDATION_ERROR` (422): Input melanggar aturan validasi.
- `INTERNAL_SERVER_ERROR` (500): Kesalahan internal sistem.
