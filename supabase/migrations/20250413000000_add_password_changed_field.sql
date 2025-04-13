-- Add password_changed field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed BOOLEAN DEFAULT false;

-- Update existing users to have password_changed = true (assumindo que eles já alteraram a senha)
UPDATE users SET password_changed = true WHERE password_changed IS NULL;
