-- ═══════════════════════════════════════════════════════════
--  KAYAN — Debt & Invitation System Migration
--  Run this entire file in your Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════

-- ── 1. Add outstanding_debt to profiles ──────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS outstanding_debt NUMERIC DEFAULT 0;

-- ── 2. Add inviter_id to sessions ────────────────────────────
--  When NOT NULL, the session uses a "free stay" invitation pass.
--  The bearer pays orders only; stay cost = 0.
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS inviter_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- ── 3. Debt log table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS debt_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id  UUID        REFERENCES sessions(id),
  amount      NUMERIC     NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'pending', -- 'pending' | 'paid'
  admin_id    UUID        REFERENCES profiles(id),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at     TIMESTAMPTZ
);

-- RLS for debt_logs
ALTER TABLE debt_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins can manage debts" ON debt_logs;
CREATE POLICY "admins can manage debts" ON debt_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin','staff','owner')
    )
  );


-- ── 4. register_debt() — close session + log debt ─────────────
--
--  Called instead of checkout_session() when customer can't pay.
--  • Closes the session (seat freed) via checkout_session()
--  • Adds the bill amount to profiles.outstanding_debt
--  • Inserts a debt_logs row
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION register_debt(
  p_session_id  UUID,
  p_admin_id    UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id   UUID;
  v_total     NUMERIC;
BEGIN
  -- Get session owner
  SELECT user_id INTO v_user_id FROM sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  -- Get live bill via existing function
  SELECT total_cost INTO v_total
  FROM calculate_session_cost(p_session_id)
  LIMIT 1;

  v_total := COALESCE(v_total, 0);

  -- Close the session (same flow as normal checkout)
  PERFORM checkout_session(p_session_id, p_admin_id);

  -- Add debt to customer profile
  UPDATE profiles
  SET outstanding_debt = COALESCE(outstanding_debt, 0) + v_total
  WHERE id = v_user_id;

  -- Log the debt
  INSERT INTO debt_logs (user_id, session_id, amount, admin_id)
  VALUES (v_user_id, p_session_id, v_total, p_admin_id);

  RETURN jsonb_build_object(
    'ok',     true,
    'amount', v_total
  );
END;
$$;


-- ── 5. pay_debt() — clear a customer's debt ───────────────────
CREATE OR REPLACE FUNCTION pay_debt(
  p_user_id   UUID,
  p_admin_id  UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_amount NUMERIC;
BEGIN
  SELECT outstanding_debt INTO v_amount FROM profiles WHERE id = p_user_id;
  v_amount := COALESCE(v_amount, 0);

  UPDATE profiles
  SET outstanding_debt = 0
  WHERE id = p_user_id;

  UPDATE debt_logs
  SET status = 'paid', paid_at = now()
  WHERE user_id = p_user_id AND status = 'pending';

  RETURN jsonb_build_object(
    'ok',   true,
    'paid', v_amount
  );
END;
$$;


-- ── 6. use_invitation() — decrement inviter's count ──────────
--
--  Called when opening an invitation session.
--  Decrements invitations_remaining on the ACTIVE subscription.
--  Returns ok=false if no invitations remain.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION use_invitation(
  p_inviter_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_remaining INT;
  v_sub_id    UUID;
BEGIN
  -- Find active sub with remaining invitations
  SELECT id, invitations_remaining
  INTO   v_sub_id, v_remaining
  FROM   user_subscriptions
  WHERE  user_id = p_inviter_id
    AND  status  = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_sub_id IS NULL THEN
    -- Try with expired subs too (subscriber can use invitations after expiry)
    SELECT id, invitations_remaining
    INTO   v_sub_id, v_remaining
    FROM   user_subscriptions
    WHERE  user_id = p_inviter_id
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  IF v_sub_id IS NULL OR COALESCE(v_remaining, 0) <= 0 THEN
    RETURN jsonb_build_object(
      'ok',     false,
      'reason', 'No invitations remaining'
    );
  END IF;

  UPDATE user_subscriptions
  SET invitations_remaining = invitations_remaining - 1
  WHERE id = v_sub_id;

  RETURN jsonb_build_object(
    'ok',       true,
    'remaining', v_remaining - 1
  );
END;
$$;


-- ── 7. Update open_session() to accept optional inviter ───────
--
--  IMPORTANT: Replace YOUR_EXISTING_OPEN_SESSION_BODY with your
--  current function body. Only the signature + inviter_id logic
--  needs to be added. The key addition is the last INSERT step.
--
--  If you already have open_session(), use CREATE OR REPLACE and
--  add the p_inviter_id parameter + the last line below.
--
--  Minimal patch — add after your existing INSERT INTO sessions:
--
--    IF p_inviter_id IS NOT NULL THEN
--      UPDATE sessions SET inviter_id = p_inviter_id WHERE id = <new_session_id>;
--    END IF;
--
-- ─────────────────────────────────────────────────────────────
-- (No auto-replace here — your open_session body is custom)


-- ── 8. Update calculate_session_cost() for invitation sessions ─
--
--  If the session has inviter_id IS NOT NULL, stay_cost = 0.
--
--  Add this check near the top of your calculate_session_cost():
--
--    DECLARE
--      v_is_invitation BOOLEAN := FALSE;
--    ...
--    SELECT (inviter_id IS NOT NULL) INTO v_is_invitation
--    FROM sessions WHERE id = p_session_id;
--
--    IF v_is_invitation THEN
--      v_stay_cost := 0;  -- Bearer pays orders only
--    END IF;
--
-- ─────────────────────────────────────────────────────────────


-- ── 9. Update fetchCustomers to include outstanding_debt ──────
--  The existing fetchCustomers query needs outstanding_debt.
--  In supabase.js — change the select to:
--    .select('id, full_name, phone, role, created_at, outstanding_debt, username')
-- ─────────────────────────────────────────────────────────────


-- ── 10. Grant execute on new functions ───────────────────────
GRANT EXECUTE ON FUNCTION register_debt(UUID, UUID)    TO authenticated;
GRANT EXECUTE ON FUNCTION pay_debt(UUID, UUID)         TO authenticated;
GRANT EXECUTE ON FUNCTION use_invitation(UUID)         TO authenticated;
