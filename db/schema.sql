CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE CHECK (username ~ '^[a-z0-9._-]{3,64}$'),
  email text,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admins ADD COLUMN IF NOT EXISTS email text;

CREATE UNIQUE INDEX IF NOT EXISTS admins_email_idx ON admins (lower(email));

CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES admins (id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_sessions_expires_at_idx ON admin_sessions (expires_at);

CREATE TABLE IF NOT EXISTS login_attempts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username text NOT NULL,
  success boolean NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS login_attempts_lookup_idx ON login_attempts (username, attempted_at);

CREATE TABLE IF NOT EXISTS uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES admins (id),
  district text NOT NULL,
  original_name text NOT NULL,
  stored_name text NOT NULL UNIQUE,
  mime text NOT NULL,
  byte_size bigint NOT NULL CHECK (byte_size > 0),
  kind text NOT NULL CHECK (kind IN ('image', 'video', 'document')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS uploads_created_at_idx ON uploads (created_at DESC);

CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile text NOT NULL UNIQUE CHECK (mobile ~ '^[6-9][0-9]{9}$'),
  name text,
  email text,
  district text,
  constituency text,
  role text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS member_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  fcm_token text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS member_sessions_expires_at_idx ON member_sessions (expires_at);

CREATE TABLE IF NOT EXISTS member_otp_challenges (
  mobile text PRIMARY KEY REFERENCES members (mobile) ON DELETE CASCADE,
  req_id text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS member_otp_send_limits (
  mobile text PRIMARY KEY REFERENCES members (mobile) ON DELETE CASCADE,
  sends integer NOT NULL,
  window_start timestamptz NOT NULL,
  last_sent_at timestamptz NOT NULL
);
