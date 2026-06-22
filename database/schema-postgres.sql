-- Supabase / PostgreSQL schema for Perpus
-- Import into Supabase SQL Editor

-- =====================
-- Books
-- =====================
CREATE TABLE IF NOT EXISTS public.books (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- Members
-- =====================
CREATE TABLE IF NOT EXISTS public.members (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NULL,
  phone TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- Loans
-- status: borrowed | returned
-- =====================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loan_status') THEN
    CREATE TYPE public.loan_status AS ENUM ('borrowed','returned');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.loans (
  id BIGSERIAL PRIMARY KEY,
  book_id BIGINT NOT NULL REFERENCES public.books(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  member_id BIGINT NOT NULL REFERENCES public.members(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  borrowed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  returned_at TIMESTAMPTZ NULL,
  status public.loan_status NOT NULL DEFAULT 'borrowed',
  notes TEXT NULL,
  CONSTRAINT loans_status_check CHECK (status IN ('borrowed','returned'))
);

CREATE INDEX IF NOT EXISTS idx_loans_member ON public.loans(member_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON public.loans(status);

-- =====================
-- RPC: create loan + decrease stock (atomic)
-- =====================
CREATE OR REPLACE FUNCTION public.create_loan_and_decrease_stock(
  p_book_id BIGINT,
  p_member_id BIGINT,
  p_notes TEXT
)
RETURNS TABLE (
  id BIGINT,
  book_id BIGINT,
  member_id BIGINT,
  borrowed_at TIMESTAMPTZ,
  returned_at TIMESTAMPTZ,
  status public.loan_status,
  notes TEXT,
  book_title TEXT,
  member_name TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_stock INTEGER;
  v_loan_id BIGINT;
BEGIN
  -- Lock the book row so concurrent loans don't oversell stock
  SELECT stock INTO v_stock
  FROM public.books
  WHERE id = p_book_id
  FOR UPDATE;

  IF v_stock IS NULL THEN
    RAISE EXCEPTION 'Book not found' USING ERRCODE = 'P0001';
  END IF;

  IF v_stock <= 0 THEN
    RAISE EXCEPTION 'Stock buku habis' USING ERRCODE = 'P0001';
  END IF;

  -- Ensure member exists (lock for consistency)
  PERFORM 1 FROM public.members WHERE id = p_member_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.loans (book_id, member_id, notes)
  VALUES (p_book_id, p_member_id, p_notes)
  RETURNING id INTO v_loan_id;

  UPDATE public.books
  SET stock = stock - 1
  WHERE id = p_book_id;

  RETURN QUERY
  SELECT
    l.id,
    l.book_id,
    l.member_id,
    l.borrowed_at,
    l.returned_at,
    l.status,
    l.notes,
    b.title AS book_title,
    m.name AS member_name
  FROM public.loans l
  JOIN public.books b ON b.id = l.book_id
  JOIN public.members m ON m.id = l.member_id
  WHERE l.id = v_loan_id;
END;
$$;

-- =====================
-- RPC: return loan + increase stock (atomic)
-- =====================
CREATE OR REPLACE FUNCTION public.return_loan_and_increase_stock(
  p_loan_id BIGINT
)
RETURNS TABLE (
  id BIGINT,
  book_id BIGINT,
  member_id BIGINT,
  borrowed_at TIMESTAMPTZ,
  returned_at TIMESTAMPTZ,
  status public.loan_status,
  notes TEXT,
  book_title TEXT,
  member_name TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_status public.loan_status;
  v_book_id BIGINT;
  v_member_id BIGINT;
  v_notes TEXT;
BEGIN
  SELECT status, book_id, member_id, notes
  INTO v_status, v_book_id, v_member_id, v_notes
  FROM public.loans
  WHERE id = p_loan_id
  FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Loan not found' USING ERRCODE = 'P0001';
  END IF;

  IF v_status = 'returned' THEN
    RAISE EXCEPTION 'Loan sudah dikembalikan' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.loans
  SET status = 'returned', returned_at = NOW()
  WHERE id = p_loan_id;

  -- Lock book row for update then increase stock
  UPDATE public.books
  SET stock = stock + 1
  WHERE id = v_book_id;

  RETURN QUERY
  SELECT
    l.id,
    l.book_id,
    l.member_id,
    l.borrowed_at,
    l.returned_at,
    l.status,
    l.notes,
    b.title AS book_title,
    m.name AS member_name
  FROM public.loans l
  JOIN public.books b ON b.id = l.book_id
  JOIN public.members m ON m.id = l.member_id
  WHERE l.id = p_loan_id;
END;
$$;

-- =====================
-- (Important) RLS
-- Supabase default: RLS may be enabled. Since backend uses service role,
-- we can keep RLS off, or keep policies suitable.
-- For simplest setup during dev, disable RLS on these tables:
-- =====================
ALTER TABLE public.books DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans DISABLE ROW LEVEL SECURITY;

