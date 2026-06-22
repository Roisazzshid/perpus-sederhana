"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  supaDelete,
  supaInsert,
  supaRpc,
  supaSelect,
  supaUpdate,
} from "../src/supabaseClient";

type Book = {
  id: number;
  title: string;
  author: string;
  isbn: string | null;
  stock: number;
};

type Member = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
};

type LoanRow = {
  id: number;
  book_id: number;
  member_id: number;
  status: string;
  borrowed_at: string;
  returned_at: string | null;
  notes: string | null;
};

type Loan = LoanRow & {
  book_title: string;
  member_name: string;
};

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 12px",
        borderRadius: 8,
        border: active ? "2px solid #111" : "1px solid #ccc",
        background: active ? "#eee" : "#fff",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function CrudTable<T extends { id: number }>({
  columns,
  rows,
  onEdit,
  onDelete,
}: {
  columns: Array<{
    key: string;
    label: string;
    render?: (row: T) => React.ReactNode;
  }>;
  rows: T[];
  onEdit: (row: T) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <table className="table">
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key}>{c.label}</th>
          ))}
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            {columns.map((c) => (
              <td key={c.key}>
                {c.render ? c.render(r) : (r as any)[c.key]}
              </td>
            ))}
            <td>
              <button className="btn" onClick={() => onEdit(r)}>
                Edit
              </button>
              <button className="btn danger" onClick={() => onDelete(r.id)}>
                Del
              </button>
            </td>
          </tr>
        ))}
        {!rows.length && (
          <tr>
            <td
              colSpan={columns.length + 1}
              style={{ textAlign: "center", color: "#777" }}
            >
              Tidak ada data
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

export default function Page() {
  const [tab, setTab] = useState<"buku" | "anggota" | "peminjaman">("buku");

  // Books
  const [books, setBooks] = useState<Book[]>([]);
  const [bookForm, setBookForm] = useState({
    title: "",
    author: "",
    isbn: "",
    stock: 0,
  });
  const [editingBookId, setEditingBookId] = useState<number | null>(null);

  // Members
  const [members, setMembers] = useState<Member[]>([]);
  const [memberForm, setMemberForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);

  // Loans
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanForm, setLoanForm] = useState({
    book_id: "",
    member_id: "",
    notes: "",
  });

  const api = useMemo(() => {
    return {
      // -------- Books --------
      listBooks: async () => {
        const res = await supaSelect<Book>("books", {
          select: "*",
          orderBy: { column: "id", ascending: false },
        });
        // supaSelect returns raw data from fetch; type is any
        return res as any;
      },

      upsertBook: async (
        payload: Partial<Book> & { title?: string; author?: string },
        id?: number | null
      ) => {
        if (id) {
          await supaUpdate("books", id, payload);
          return;
        }
        const insertRes = await supaInsert("books", payload);
        return insertRes;
      },

      deleteBook: async (id: number) => {
        await supaDelete("books", id);
      },

      // -------- Members --------
      listMembers: async () => {
        const res = await supaSelect<Member>("members", {
          select: "*",
          orderBy: { column: "id", ascending: false },
        });
        return res as any;
      },

      upsertMember: async (
        payload: Partial<Member> & { name?: string },
        id?: number | null
      ) => {
        if (id) {
          await supaUpdate("members", id, payload);
          return;
        }
        const insertRes = await supaInsert("members", payload);
        return insertRes;
      },

      deleteMember: async (id: number) => {
        await supaDelete("members", id);
      },

      // -------- Loans --------
      listLoans: async () => {
        // Step 1: load loans
        const loansRes = (await supaSelect<LoanRow>("loans", {
          select: "*",
          orderBy: { column: "id", ascending: false },
        })) as any as LoanRow[];

        const loansRows = loansRes || [];
        if (!loansRows.length) return [];

        // Step 2: load referenced books/members in parallel
        const bookIds = Array.from(new Set(loansRows.map((l) => l.book_id)));
        const memberIds = Array.from(
          new Set(loansRows.map((l) => l.member_id))
        );

        // fetch by ids using PostgREST in supaSelect supports only simple select/order;
        // simplest: use multiple selects (acceptable for small dataset).
        const [booksPart, membersPart] = await Promise.all([
          Promise.all(
            bookIds.map(async (bid) => {
              const r = (await supaSelect<Book>("books", {
                select: "*",
                orderBy: { column: "id", ascending: true },
              })) as any as Book[];
              // fallback if RLS/policies restrict; we filter client-side anyway
              return r.find((b) => b.id === bid) || null;
            })
          ),
          Promise.all(
            memberIds.map(async (mid) => {
              const r = (await supaSelect<Member>("members", {
                select: "*",
                orderBy: { column: "id", ascending: true },
              })) as any as Member[];
              return r.find((m) => m.id === mid) || null;
            })
          ),
        ]);

        const booksById = new Map<number, Book>(
          (booksPart.filter(Boolean) as Book[]).map((b) => [b.id, b])
        );
        const membersById = new Map<number, Member>(
          (membersPart.filter(Boolean) as Member[]).map((m) => [m.id, m])
        );

        // Step 3: map join fields
        const joined: Loan[] = loansRows.map((l) => {
          const b = booksById.get(l.book_id);
          const m = membersById.get(l.member_id);
          return {
            ...l,
            book_title: b?.title ?? "-",
            member_name: m?.name ?? "-",
          };
        });

        return joined;
      },

      createLoan: async (payload: {
        book_id: number;
        member_id: number;
        notes: string | null;
      }) => {
        // RPC params names defined in schema-postgres.sql:
        // create_loan_and_decrease_stock(p_book_id, p_member_id, p_notes)
        const res = await supaRpc<any>(
          "create_loan_and_decrease_stock",
          {
            p_book_id: payload.book_id,
            p_member_id: payload.member_id,
            p_notes: payload.notes,
          }
        );

        // RPC returns a row (table function). In client helper we return res.data from supaFetch,
        // which likely is an array. Normalize:
        const rows = (res as any[]) || [];
        if (Array.isArray(rows) && rows.length) {
          return rows[0];
        }
        return res;
      },

      returnLoan: async (loanId: number) => {
        const res = await supaRpc<any>("return_loan_and_increase_stock", {
          p_loan_id: loanId,
        });

        const rows = (res as any[]) || [];
        if (Array.isArray(rows) && rows.length) {
          return rows[0];
        }
        return res;
      },
    };
  }, []);

  const refreshAll = async () => {
    if (tab === "buku") setBooks(await api.listBooks());
    if (tab === "anggota") setMembers(await api.listMembers());
    if (tab === "peminjaman") {
      const [b, l, m] = await Promise.all([
        api.listBooks(),
        api.listLoans(),
        api.listMembers(),
      ]);
      setBooks(b);
      setLoans(l);
      setMembers(m);
    }
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: bookForm.title,
      author: bookForm.author,
      isbn: bookForm.isbn || null,
      stock: Number(bookForm.stock) || 0,
    };

    await api.upsertBook(payload, editingBookId);
    setEditingBookId(null);
    setBookForm({ title: "", author: "", isbn: "", stock: 0 });
    setBooks(await api.listBooks());
  };

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: memberForm.name,
      email: memberForm.email || null,
      phone: memberForm.phone || null,
    };

    await api.upsertMember(payload, editingMemberId);
    setEditingMemberId(null);
    setMemberForm({ name: "", email: "", phone: "" });
    setMembers(await api.listMembers());
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();

    await api.createLoan({
      book_id: Number(loanForm.book_id),
      member_id: Number(loanForm.member_id),
      notes: loanForm.notes || null,
    });

    setLoanForm({ book_id: "", member_id: "", notes: "" });
    await refreshAll();
  };

  const handleReturn = async (loanId: number) => {
    await api.returnLoan(loanId);
    await refreshAll();
  };

  return (
    <div className="container">
      <h1>Perpus - Sederhana</h1>

      <div className="tabs">
        <TabButton active={tab === "buku"} onClick={() => setTab("buku")}>
          Buku
        </TabButton>
        <TabButton active={tab === "anggota"} onClick={() => setTab("anggota")}>
          Anggota
        </TabButton>
        <TabButton active={tab === "peminjaman"} onClick={() => setTab("peminjaman")}>
          Peminjaman
        </TabButton>
      </div>

      {tab === "buku" && (
        <div className="grid">
          <div className="card">
            <h2>{editingBookId ? "Edit Buku" : "Tambah Buku"}</h2>
            <form onSubmit={handleBookSubmit} className="form">
              <label>
                Judul
                <input
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                />
              </label>
              <label>
                Penulis
                <input
                  value={bookForm.author}
                  onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                />
              </label>
              <label>
                ISBN
                <input
                  value={bookForm.isbn}
                  onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                />
              </label>
              <label>
                Stok
                <input
                  type="number"
                  value={bookForm.stock}
                  onChange={(e) => setBookForm({ ...bookForm, stock: Number(e.target.value) })}
                />
              </label>
              <button className="btn primary" type="submit">
                Simpan
              </button>

              {editingBookId && (
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    setEditingBookId(null);
                    setBookForm({ title: "", author: "", isbn: "", stock: 0 });
                  }}
                >
                  Batal
                </button>
              )}
            </form>
          </div>

          <div className="card">
            <h2>Daftar Buku</h2>
            <CrudTable
              columns={[
                { key: "title", label: "Judul" },
                { key: "author", label: "Penulis" },
                { key: "stock", label: "Stok" },
              ]}
              rows={books}
