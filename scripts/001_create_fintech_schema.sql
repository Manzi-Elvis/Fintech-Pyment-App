-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  date_of_birth DATE,
  address JSONB,
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
  kyc_documents JSONB,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'USD',
  balance DECIMAL(15,2) DEFAULT 0.00,
  available_balance DECIMAL(15,2) DEFAULT 0.00,
  pending_balance DECIMAL(15,2) DEFAULT 0.00,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, currency)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id),
  receiver_id UUID REFERENCES auth.users(id),
  sender_wallet_id UUID REFERENCES public.wallets(id),
  receiver_wallet_id UUID REFERENCES public.wallets(id),
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  fee DECIMAL(15,2) DEFAULT 0.00,
  net_amount DECIMAL(15,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('send', 'receive', 'deposit', 'withdrawal', 'refund')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
  description TEXT,
  reference_id TEXT UNIQUE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bank_account', 'credit_card', 'debit_card')),
  provider TEXT,
  last_four TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_primary BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Merchant accounts table
CREATE TABLE IF NOT EXISTS public.merchant_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_type TEXT,
  website TEXT,
  api_key TEXT UNIQUE,
  webhook_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disputes table
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- RLS Policies for wallets
CREATE POLICY "wallets_select_own" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wallets_insert_own" ON public.wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wallets_update_own" ON public.wallets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "wallets_delete_own" ON public.wallets FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for transactions (users can see transactions they're involved in)
CREATE POLICY "transactions_select_involved" ON public.transactions FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "transactions_insert_sender" ON public.transactions FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

-- RLS Policies for payment methods
CREATE POLICY "payment_methods_select_own" ON public.payment_methods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "payment_methods_insert_own" ON public.payment_methods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "payment_methods_update_own" ON public.payment_methods FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "payment_methods_delete_own" ON public.payment_methods FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for merchant accounts
CREATE POLICY "merchant_accounts_select_own" ON public.merchant_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "merchant_accounts_insert_own" ON public.merchant_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "merchant_accounts_update_own" ON public.merchant_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "merchant_accounts_delete_own" ON public.merchant_accounts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for disputes
CREATE POLICY "disputes_select_own" ON public.disputes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "disputes_insert_own" ON public.disputes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "disputes_update_own" ON public.disputes FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for audit logs (users can only see their own logs)
CREATE POLICY "audit_logs_select_own" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
