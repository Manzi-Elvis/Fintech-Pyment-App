-- Added database performance optimizations
-- Create database functions for better performance

-- Batch wallet update function
CREATE OR REPLACE FUNCTION batch_update_wallets(updates JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    update_record JSONB;
BEGIN
    FOR update_record IN SELECT * FROM jsonb_array_elements(updates)
    LOOP
        UPDATE wallets 
        SET 
            balance = CASE 
                WHEN (update_record->>'type')::text = 'credit' 
                THEN balance + (update_record->>'amount')::decimal
                ELSE balance - (update_record->>'amount')::decimal
            END,
            available_balance = CASE 
                WHEN (update_record->>'type')::text = 'credit' 
                THEN available_balance + (update_record->>'amount')::decimal
                ELSE available_balance - (update_record->>'amount')::decimal
            END,
            updated_at = NOW()
        WHERE id = (update_record->>'walletId')::uuid;
    END LOOP;
END;
$$;

-- User balance summary function
CREATE OR REPLACE FUNCTION get_user_balance_summary(user_id UUID)
RETURNS TABLE(
    total_balance DECIMAL(15,2),
    available_balance DECIMAL(15,2),
    pending_balance DECIMAL(15,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(w.balance), 0) as total_balance,
        COALESCE(SUM(w.available_balance), 0) as available_balance,
        COALESCE(SUM(w.pending_balance), 0) as pending_balance
    FROM wallets w
    WHERE w.user_id = get_user_balance_summary.user_id;
END;
$$;

-- Transaction analytics function
CREATE OR REPLACE FUNCTION get_transaction_analytics(
    user_id UUID,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE(
    total_sent DECIMAL(15,2),
    total_received DECIMAL(15,2),
    transaction_count INTEGER,
    avg_transaction_amount DECIMAL(15,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN t.sender_id = get_transaction_analytics.user_id THEN t.amount ELSE 0 END), 0) as total_sent,
        COALESCE(SUM(CASE WHEN t.receiver_id = get_transaction_analytics.user_id THEN t.net_amount ELSE 0 END), 0) as total_received,
        COUNT(*)::INTEGER as transaction_count,
        COALESCE(AVG(t.amount), 0) as avg_transaction_amount
    FROM transactions t
    WHERE (t.sender_id = get_transaction_analytics.user_id OR t.receiver_id = get_transaction_analytics.user_id)
    AND t.created_at BETWEEN get_transaction_analytics.start_date AND get_transaction_analytics.end_date
    AND t.status = 'completed';
END;
$$;

-- Create additional indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_created_at 
ON transactions(sender_id, created_at DESC) WHERE sender_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_receiver_created_at 
ON transactions(receiver_id, created_at DESC) WHERE receiver_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_status_created_at 
ON transactions(status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wallets_user_currency 
ON wallets(user_id, currency);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_intents_merchant_status 
ON payment_intents(merchant_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_action_created 
ON audit_logs(user_id, action, created_at DESC);

-- Partitioning for large tables (audit_logs)
-- This would be implemented based on data volume requirements

-- Create materialized view for dashboard analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_analytics AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as transaction_count,
    SUM(amount) as total_volume,
    AVG(amount) as avg_amount,
    COUNT(DISTINCT sender_id) as unique_senders,
    COUNT(DISTINCT receiver_id) as unique_receivers
FROM transactions 
WHERE status = 'completed'
AND created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_analytics_date ON dashboard_analytics(date);

-- Refresh materialized view function
CREATE OR REPLACE FUNCTION refresh_dashboard_analytics()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_analytics;
END;
$$;
