-- Payment intents table
CREATE TABLE IF NOT EXISTS public.payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchant_accounts(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  customer_email TEXT,
  customer_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled')),
  payment_method TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refunds table
CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_intent_id UUID NOT NULL REFERENCES public.payment_intents(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook events table for tracking
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchant_accounts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed')),
  attempts INTEGER DEFAULT 0,
  next_retry TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API rate limiting table
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  requests_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(api_key, endpoint, window_start)
);

-- Enable RLS
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_intents (merchant access only)
CREATE POLICY "payment_intents_merchant_access" ON public.payment_intents FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.merchant_accounts 
    WHERE merchant_accounts.id = payment_intents.merchant_id 
    AND merchant_accounts.user_id = auth.uid()
  )
);

-- RLS Policies for refunds (merchant access only)
CREATE POLICY "refunds_merchant_access" ON public.refunds FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.payment_intents pi
    JOIN public.merchant_accounts ma ON pi.merchant_id = ma.id
    WHERE pi.id = refunds.payment_intent_id 
    AND ma.user_id = auth.uid()
  )
);

-- RLS Policies for webhook_events (merchant access only)
CREATE POLICY "webhook_events_merchant_access" ON public.webhook_events FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.merchant_accounts 
    WHERE merchant_accounts.id = webhook_events.merchant_id 
    AND merchant_accounts.user_id = auth.uid()
  )
);

-- RLS Policies for api_rate_limits (system access only)
CREATE POLICY "api_rate_limits_system_access" ON public.api_rate_limits FOR ALL USING (FALSE);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_intents_merchant_id ON public.payment_intents(merchant_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON public.payment_intents(status);
CREATE INDEX IF NOT EXISTS idx_payment_intents_created_at ON public.payment_intents(created_at);
CREATE INDEX IF NOT EXISTS idx_refunds_payment_intent_id ON public.refunds(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_merchant_id ON public.webhook_events(merchant_id);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_api_key ON public.api_rate_limits(api_key);

-- Add update triggers
CREATE TRIGGER update_payment_intents_updated_at BEFORE UPDATE ON public.payment_intents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_refunds_updated_at BEFORE UPDATE ON public.refunds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_webhook_events_updated_at BEFORE UPDATE ON public.webhook_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
