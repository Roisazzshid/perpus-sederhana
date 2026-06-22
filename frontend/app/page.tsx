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
            <td colSpan={columns.length + 1} style={{ textAlign: "center", color: "#777" }}>
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
        return (res as any) ?? [];
      },

      upsertBook: async (
        payload: Partial<Book> & { title: string; author: string },
        id?: number | null
      ) => {
        if (id) {
          await supaUpdate("books", id, payload as any);
          return;
        }
        await supaInsert("books", payload as any);
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
        return (res as any) ?? [];
      },

      upsertMember: async (
        payload: Partial<Member> & { name: string },
        id?: number | null
      ) => {
        if (id) {
          await supaUpdate("members", id, payload as any);
          return;
        }
        await supaInsert("members", payload as any);
      },

      deleteMember: async (id: number) => {
        await supaDelete("members", id);
      },

      // -------- Loans --------
      listLoans: async () => {
        const loansRes = (await supaSelect<LoanRow>("loans", {
          select: "*",
          orderBy: { column: "id", ascending: false },
        })) as any;

        const loansRows: LoanRow[] = (loansRes as any) ?? [];
        if (!loansRows.length) return [];

        const bookIds = Array.from(new Set(loansRows.map((l) => l.book_id)));
        const memberIds = Array.from(new Set(loansRows.map((l) => l.member_id)));

        const [booksAllRes, membersAllRes] = await Promise.all([
          supaSelect<Book>("books", { select: "*", orderBy: { column: "id", ascending: true } }),
          supaSelect<Member>("members", { select: "*", orderBy: { column: "id", ascending: true } }),
        ]);

        const booksAll: Book[] = (booksAllRes as any) ?? [];
        const membersAll: Member[] = (membersAllRes as any) ?? [];

        const booksById = new Map<number, Book>(
          booksAll.filter((b) => bookIds.includes(b.id)).map((b) => [b.id, b])
        );
        const membersById = new Map<number, Member>(
          membersAll.filter((m) => memberIds.includes(m.id)).map((m) => [m.id, m])
        );

        return loansRows.map((l) => ({
          ...l,
          book_title: booksById.get(l.book_id)?.title ?? "-",
          member_name: membersById.get(l.member_id)?.name ?? "-",
        }));
      },

      createLoan: async (payload: { book_id: number; member_id: number; notes: string | null }) => {
        const res = await supaRpc<any>("create_loan_and_decrease_stock", {
          p_book_id: payload.book_id,
          p_member_id: payload.member_id,
          p_notes: payload.notes,
        });

        const rows = (res as any[]) ?? [];
        if (Array.isArray(rows) && rows.length) return rows[0];
        return res;
      },

      returnLoan: async (loanId: number) => {
        const res = await supaRpc<any>("return_loan_and_increase_stock", {
          p_loan_id: loanId,
        });

        const rows = (res as any[]) ?? [];
        if (Array.isArray(rows) && rows.length) return rows[0];
        return res;
      },
    };
  }, []);

  const refreshAll = async () => {
    if (tab === "buku") setBooks(await api.listBooks());
    if (tab === "anggota") setMembers(await api.listMembers());
    if (tab === "peminjaman") {
      const [b, l, m] = await Promise.all([api.listBooks(), api.listLoans(), api.listMembers()]);
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
    await api.upsertBook(payload as any, editingBookId);
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
    await api.upsertMember(payload as any, editingMemberId);
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
        <TabButton active={tab === "buku"} onClick={() => setTab("buku")}>Buku</TabButton>
        <TabButton active={tab === "anggota"} onClick={() => setTab("anggota")}>Anggota</TabButton>
        <TabButton active={tab === "peminjaman"} onClick={() => setTab("peminjaman")}>Peminjaman</TabButton>
      </div>

      {tab === "buku" && (
        <div className="grid">
          <div className="card">
            <h2>{editingBookId ? "Edit Buku" : "Tambah Buku"}</h2>
            <form onSubmit={handleBookSubmit} className="form">
              <label>
                Judul
                <input value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} />
              </label>
              <label>
                Penulis
                <input value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} />
              </label>
              <label>
                ISBN
                <input value={bookForm.isbn} onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })} />
              </label>
              <label>
                Stok
                <input type="number" value={bookForm.stock} onChange={(e) => setBookForm({ ...bookForm, stock: Number(e.target.value) })} />
              </label>
              <button className="btn primary" type="submit">Simpan</button>
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
              onEdit={(r) => {
                setEditingBookId(r.id);
                setBookForm({ title: r.title, author: r.author, isbn: r.isbn || "", stock: r.stock });
              }}
              onDelete={async (id) => {
                if (!confirm("Hapus buku ini?")) return;
                await api.deleteBook(id);
                setBooks(await api.listBooks());
              }}
            />
          </div>
        </div>
      )}

      {tab === "anggota" && (
        <div className="grid">
          <div className="card">
            <h2>{editingMemberId ? "Edit Anggota" : "Tambah Anggota"}</h2>
            <form onSubmit={handleMemberSubmit} className="form">
              <label>
                Nama
                <input value={memberForm.name} onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })} />
              </label>
              <label>
                Email
                <input value={memberForm.email} onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })} />
              </label>
              <label>
                Telepon
                <input value={memberForm.phone} onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })} />
              </label>
              <button className="btn primary" type="submit">Simpan</button>
              {editingMemberId && (
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    setEditingMemberId(null);
                    setMemberForm({ name: "", email: "", phone: "" });
                  }}
                >
                  Batal
                </button>
              )}
            </form>
          </div>

          <div className="card">
            <h2>Daftar Anggota</h2>
            <CrudTable
              columns={[
                { key: "name", label: "Nama" },
                { key: "email", label: "Email", render: (r: Member) => r.email || "-" },
                { key: "phone", label: "Telepon", render: (r: Member) => r.phone || "-" },
              ]}
              rows={members}
              onEdit={(r) => {
                setEditingMemberId(r.id);
                setMemberForm({ name: r.name, email: r.email || "", phone: r.phone || "" });
              }}
              onDelete={async (id) => {
                if (!confirm("Hapus anggota ini?")) return;
                await api.deleteMember(id);
                setMembers(await api.listMembers());
              }}
            />
          </div>
      )}

      {tab === "peminjaman" && (
        <div className="grid">
          <div className="card">
            <h2>Buat Peminjaman</h2>
            <form onSubmit={handleCreateLoan} className="form">
              <label>
                Buku
                <select value={loanForm.book_id} onChange={(e) => setLoanForm({ ...loanForm, book_id: e.target.value })}>
                  <option value="">-- pilih buku --</option>
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} (stok: {b.stock})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Anggota
                <select value={loanForm.member_id} onChange={(e) => setLoanForm({ ...loanForm, member_id: e.target.value })}>
                  <option value="">-- pilih anggota --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Catatan
                <input value={loanForm.notes} onChange={(e) => setLoanForm({ ...loanForm, notes: e.target.value })} />
              </label>

              <button className="btn primary" type="submit">Pinjam</button>
            </form>
          </div>

          <div className="card">
            <h2>Daftar Peminjaman</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Buku</th>
                  <th>Anggota</th>
                  <th>Status</th>
                  <th>Dipinjam</th>
                  <th>Pengembalian</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((l) => (
                  <tr key={l.id}>
                    <td>{l.id}</td>
                    <td>{l.book_title}</td>
                    <td>{l.member_name}</td>
                    <td>{l.status}</td>
                    <td>{new Date(l.borrowed_at).toLocaleString()}</td>
                    <td>{l.returned_at ? new Date(l.returned_at).toLocaleString() : "-"}</td>
                    <td>
                      {l.status === "borrowed" ? (
                        <button className="btn" onClick={() => handleReturn(l.id)}>Return</button>
                      ) : (
                        <span style={{ color: "#777" }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}

                {!loans.length && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", color: "#777" }}>
                      Tidak ada peminjaman
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      )}
    </div>
  );
}
