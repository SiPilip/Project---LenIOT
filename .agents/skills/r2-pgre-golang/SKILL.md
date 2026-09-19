---
name: r2-go-postgres-storage
description: Disciplined, production-grade pattern for combining Cloudflare R2 (S3-compatible object storage) with a Go backend and PostgreSQL as the metadata store. Use this whenever building or reviewing file/media upload features, presigned URL generation, object storage buckets, avatar/attachment/document uploads, or any workflow that touches Cloudflare R2 (or other S3-compatible storage) from a Go service — even if the user only says "file upload", "storage", "R2", "S3", "presigned URL", "attachment", "media library", or describes orphaned files / inconsistent upload state, in a Go + Postgres project. Also use when auditing or hardening an existing upload flow for consistency, security, or cleanup gaps.
---

# R2 + Go + PostgreSQL: Disciplined Storage Integration

Cloudflare R2 speaks the S3 API, so it is used through the standard AWS SDK for Go v2
pointed at a custom endpoint. The hard part of this stack is never the SDK call — it's
keeping R2 (the bytes) and Postgres (the metadata) from silently drifting apart. This
skill exists to enforce that discipline every time, not just when it's convenient.

## Core principles (non-negotiable)

1. **R2 is the source of truth for bytes. Postgres is the source of truth for state.**
   Never let a client or handler write to R2 without a corresponding tracked row in Postgres.
2. **Every object write starts as a `pending` row in Postgres**, created _before_ any R2
   call. Nothing goes to R2 "on the side."
3. **The API server almost never proxies raw file bytes.** Uploads and downloads go
   through presigned URLs generated server-side; the server issues URLs, it doesn't
   shovel bytes through its own memory unless there's a hard reason to (e.g. server-side
   image processing).
4. **Object keys are generated server-side and namespaced.** Never trust a client-supplied
   filename or path as the R2 key.
5. **Deletes are soft in Postgres first, hard in R2 second — asynchronously**, reconciled
   by a background sweeper. Immediate hard-delete on a single user request is a data-loss
   trap.
6. **Credentials are scoped per environment with least privilege**, loaded from env/secrets,
   never hardcoded, never logged.
7. **Every "pending" or "deleted" row has an expiry.** Orphaned pending rows (abandoned
   uploads) and orphaned R2 objects (crashed confirms) are cleaned up by a scheduled job,
   not left to accumulate.

If a proposed implementation violates one of these without a stated reason, flag it before writing code.

---

## 1. Golang R2 client setup

R2 requires `region: "auto"`, a custom endpoint built from the Cloudflare account ID, and
path-style addressing.

```go
package storage

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func NewR2Client(ctx context.Context, accountID, accessKeyID, secretAccessKey string) (*s3.Client, error) {
	endpoint := fmt.Sprintf("https://%s.r2.cloudflarestorage.com", accountID)

	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithRegion("auto"),
		config.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(accessKeyID, secretAccessKey, ""),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("load aws config: %w", err)
	}

	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.UsePathStyle = true // R2 requires path-style, not virtual-hosted-style
	})

	return client, nil
}
```

Required env vars: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`.
Load these the same way the rest of the service loads config — don't introduce a second
config pattern just for storage.

---

## 2. PostgreSQL schema for object metadata

One table is enough for most apps. Extend with a join table if objects attach to many
different entity types.

```sql
CREATE TYPE storage_object_status AS ENUM ('pending', 'confirmed', 'deleted');

CREATE TABLE storage_objects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket          TEXT NOT NULL,
    object_key      TEXT NOT NULL UNIQUE,
    owner_id        UUID NOT NULL REFERENCES users(id),
    content_type    TEXT NOT NULL,
    size_bytes      BIGINT,
    checksum_sha256 TEXT,
    status          storage_object_status NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at    TIMESTAMPTZ,
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_storage_objects_owner        ON storage_objects(owner_id);
CREATE INDEX idx_storage_objects_status       ON storage_objects(status);
CREATE INDEX idx_storage_objects_pending_age  ON storage_objects(created_at) WHERE status = 'pending';
CREATE INDEX idx_storage_objects_deleted_age  ON storage_objects(deleted_at) WHERE status = 'deleted';
```

Never store raw bytes, base64 blobs, or duplicate the object key as free text elsewhere —
this table is the single join point between the app and R2.

---

## 3. Upload flow (the disciplined transaction pattern)

R2 calls and Postgres commits cannot share a transaction — network calls must never sit
inside a DB transaction. The flow below avoids both orphaned files and orphaned rows
without needing distributed transactions:

1. Authenticated request hits `POST /uploads/init` (Gin handler, existing httpOnly
   session-cookie auth applies as normal).
2. Server validates content type / declared size against an allowlist.
3. Server generates a UUID-based object key — never derived from the client's filename.
4. Server inserts a `pending` row in Postgres.
5. Server generates a presigned `PutObject` URL scoped to that exact key and content type,
   short expiry (5–15 min).
6. Server returns `{ upload_url, object_id }` to the client.
7. Client `PUT`s the file bytes directly to R2 — the server's process is never in the
   data path.
8. Client calls `POST /uploads/:id/confirm`.
9. Server does a `HeadObject` call against R2 to verify the object actually landed, reads
   back the real size (and checksum if you set one), and only then flips the row to
   `confirmed`.

If step 9 never happens (client crashed, tab closed), the row stays `pending` forever —
that's fine, the reconciliation job in §6 cleans it up.

```go
func (h *StorageHandler) InitUpload(c *gin.Context) {
	session := auth.MustGetSession(c) // existing httpOnly session-cookie auth

	var req InitUploadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	if !isAllowedContentType(req.ContentType) {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "content type not allowed"})
		return
	}

	key := BuildObjectKey(session.TenantID, session.UserID, req.Filename)

	obj := StorageObject{
		ID:          uuid.New(),
		Bucket:      h.bucket,
		ObjectKey:   key,
		OwnerID:     session.UserID,
		ContentType: req.ContentType,
		Status:      "pending",
	}
	if err := h.db.Create(&obj).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create record"})
		return
	}

	url, err := PresignPutURL(c.Request.Context(), h.s3, h.bucket, key, req.ContentType, 10*time.Minute)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to presign"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"upload_url": url,
		"object_id":  obj.ID,
		"expires_in": 600,
	})
}

func BuildObjectKey(tenantID, ownerID uuid.UUID, originalFilename string) string {
	ext := filepath.Ext(originalFilename) // sanitize: allowlist a small set of extensions
	return fmt.Sprintf("%s/%s/%s%s", tenantID, ownerID, uuid.NewString(), ext)
}

func PresignPutURL(ctx context.Context, client *s3.Client, bucket, key, contentType string, expires time.Duration) (string, error) {
	presignClient := s3.NewPresignClient(client)
	req, err := presignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(bucket),
		Key:         aws.String(key),
		ContentType: aws.String(contentType),
	}, s3.WithPresignExpires(expires))
	if err != nil {
		return "", err
	}
	return req.URL, nil
}
```

```go
func (h *StorageHandler) ConfirmUpload(c *gin.Context) {
	var obj StorageObject
	if err := h.db.First(&obj, "id = ?", c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	head, err := h.s3.HeadObject(c.Request.Context(), &s3.HeadObjectInput{
		Bucket: aws.String(obj.Bucket),
		Key:    aws.String(obj.ObjectKey),
	})
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "object not found in storage"})
		return
	}

	now := time.Now()
	obj.SizeBytes = *head.ContentLength
	obj.Status = "confirmed"
	obj.ConfirmedAt = &now
	h.db.Save(&obj)

	c.JSON(http.StatusOK, obj)
}
```

---

## 4. Download flow

Two valid patterns — pick one per bucket, don't mix ad hoc:

- **Private + presigned GET** (default for anything user-specific: documents, avatars
  behind auth, invoices). Server checks Postgres for ownership/permission _first_, then
  issues a short-expiry presigned GET URL.
- **Public bucket + custom domain** (for genuinely public assets: public marketing
  images, published content). No presigning needed, but still authorize _which_ keys are
  exposed at the application layer — don't rely on key obscurity.

```go
func PresignGetURL(ctx context.Context, client *s3.Client, bucket, key string, expires time.Duration) (string, error) {
	presignClient := s3.NewPresignClient(client)
	req, err := presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	}, s3.WithPresignExpires(expires))
	if err != nil {
		return "", err
	}
	return req.URL, nil
}
```

Always re-check ownership against Postgres on every download request — never cache a
presigned URL beyond its expiry to skip the auth check.

---

## 5. Delete flow

```go
func (h *StorageHandler) DeleteObject(c *gin.Context) {
	session := auth.MustGetSession(c)
	var obj StorageObject
	if err := h.db.First(&obj, "id = ? AND owner_id = ?", c.Param("id"), session.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	now := time.Now()
	obj.Status = "deleted"
	obj.DeletedAt = &now
	h.db.Save(&obj) // soft delete only — no R2 call here

	c.Status(http.StatusNoContent)
}
```

The row disappearing from the app immediately (via the `status != 'deleted'` filter on
every query) is enough for the user-facing experience. The actual R2 `DeleteObject` call
happens in the reconciliation job below, after a grace period — this gives you an undo
window and decouples a user-facing request from an external network call.

---

## 6. Reconciliation & orphan cleanup (don't skip this)

Run on a schedule (cron, `robfig/cron`, or a periodic worker) — this is what actually
keeps R2 and Postgres honest over time:

- **Stale pending rows**: `status = 'pending' AND created_at < now() - interval '1 hour'`
  → the upload was abandoned; delete the row. No R2 call needed since nothing may have
  landed there.
- **Soft-deleted rows past grace period**: `status = 'deleted' AND deleted_at < now() - interval '7 days'`
  → issue the real `DeleteObject` call to R2, then delete (or archive) the row.
- **Orphaned R2 objects** (objects in the bucket with no `confirmed` row): expensive to
  detect (requires `ListObjectsV2` + diffing against Postgres), so run this rarely — e.g.
  nightly on the previous day's key prefix only — and log before deleting, don't
  auto-delete blind.

```go
func SweepStalePending(ctx context.Context, db *gorm.DB) error {
	return db.WithContext(ctx).
		Where("status = 'pending' AND created_at < ?", time.Now().Add(-1*time.Hour)).
		Delete(&StorageObject{}).Error
}

func SweepSoftDeleted(ctx context.Context, db *gorm.DB, s3c *s3.Client) error {
	var rows []StorageObject
	if err := db.WithContext(ctx).
		Where("status = 'deleted' AND deleted_at < ?", time.Now().Add(-7*24*time.Hour)).
		Find(&rows).Error; err != nil {
		return err
	}
	for _, obj := range rows {
		_, err := s3c.DeleteObject(ctx, &s3.DeleteObjectInput{
			Bucket: aws.String(obj.Bucket),
			Key:    aws.String(obj.ObjectKey),
		})
		if err != nil {
			continue // log and retry next run; don't delete the row until R2 confirms
		}
		db.WithContext(ctx).Delete(&obj)
	}
	return nil
}
```

---

## 7. Multipart uploads (files over ~100MB)

Same `pending` → `confirmed` pattern, but track the `upload_id` on the row while pending
so an abandoned multipart upload can be aborted (not just left as unbilled incomplete
parts):

- Add `multipart_upload_id TEXT` to `storage_objects`.
- `CreateMultipartUpload` → store `upload_id` on the pending row → presign each part with
  `UploadPart` → client uploads parts directly → `CompleteMultipartUpload` on confirm.
- The stale-pending sweeper (§6) must call `AbortMultipartUpload` for any row with a
  non-null `multipart_upload_id` before deleting the row, or R2 will keep billing for the
  orphaned parts.

---

## 8. Security checklist

- R2 API token scoped to a single bucket with **Object Read & Write only** — never an
  account-level admin token in the app server.
- Credentials from env vars / secrets manager only; confirm they're excluded from logs,
  error messages, and crash reports.
- Presigned PUT expiry stays short (5–15 min); presigned GET expiry matches the
  sensitivity of the content (minutes for private documents, longer only for genuinely
  low-sensitivity assets).
- Enforce content-type allowlist server-side before presigning — don't trust the client's
  declared type at confirm time either; `HeadObject`'s returned `ContentType` is the
  actual check.
- Rate-limit `POST /uploads/init` per session — presigned URL generation is cheap to
  abuse.
- CORS on the bucket restricted to your actual frontend origin(s), not `*`, if browsers
  upload directly.
- Object keys are namespaced by tenant/owner and use generated UUIDs — never accept a
  client-supplied key or path.

---

## 9. Local development

Keep a dedicated dev bucket (`R2_BUCKET=myapp-dev`) with its own scoped token — don't
point local dev at the production bucket with a prefix. If working fully offline, MinIO
is API-compatible enough for basic PUT/GET/presign testing, but always verify real
behavior against an actual R2 dev bucket before shipping, since R2 has its own quirks
(e.g. no `ContentLength` header requirement mismatches with some SDK defaults).

---

## 10. Testing checklist

- Init creates a `pending` row and a valid presigned URL scoped to the exact key.
- Confirm fails (422) if the object isn't actually present in R2 — don't let a client
  fake a confirmation.
- Delete never issues an R2 call inline — verify via a mocked S3 client that
  `DeleteObject` is only called from the sweeper.
- Stale pending rows older than the threshold are removed by the sweeper; multipart
  pending rows trigger `AbortMultipartUpload` first.
- Object key generation rejects/strips disallowed extensions and never round-trips the
  raw client filename into the key.
- Download handler re-checks ownership in Postgres on every request, not just at
  presign-cache time.

---

## Self-check before calling a storage feature "done"

- [ ] Every R2 write has a corresponding Postgres row created _before_ the R2 call.
- [ ] No handler proxies raw bytes through the Go process unless there's a stated reason.
- [ ] Object keys are server-generated, never client-supplied.
- [ ] Deletes are soft-first; a sweeper handles the hard delete.
- [ ] A scheduled job exists (or is explicitly deferred with a TODO and owner) for stale
      `pending` rows and grace-period `deleted` rows.
- [ ] R2 credentials are scoped, env-based, and excluded from logs.
- [ ] Presigned URL expiries are as short as the UX allows.

If any box is unchecked in a reviewed implementation, say so explicitly rather than
approving it silently.
