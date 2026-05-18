import { useState, useEffect } from "react";

const C = {
  bg:      "#ffffff",
  panel:   "#f9f9f9",
  border:  "#e4e4e4",
  border2: "#c8c8c8",
  text:    "#0a0a0a",
  sub:     "#6b6b6b",
  ghost:   "#b0b0b0",
  black:   "#000000",
};

async function groq(apiKey, system, user, maxTokens = 900) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user",   content: user },
      ],
    }),
  });
  const d = await res.json();
  if (d.error) throw new Error(d.error.message);
  return d.choices[0].message.content;
}

const wc = (t) => (t.trim() ? t.trim().split(/\s+/).length : 0);

const TABS = [
  { id: "write",   label: "Write" },
  { id: "proof",   label: "Proofread" },
  { id: "publish", label: "Publish" },
  { id: "promote", label: "Promote" },
];

const PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "twitter",   label: "X / Twitter" },
  { id: "linkedin",  label: "LinkedIn" },
  { id: "facebook",  label: "Facebook" },
  { id: "tiktok",    label: "TikTok" },
];

const PUBLISH_PLATFORMS = [
  { name: "Amazon KDP Print",  desc: "Free setup. Print-on-demand. Direct access to Amazon's marketplace.",        url: "https://kdp.amazon.com" },
  { name: "IngramSpark",       desc: "40,000+ retailers and libraries. Industry-standard for wide distribution.",   url: "https://ingramspark.com" },
  { name: "Blurb",             desc: "Premium print quality. Best for photo books, art, and cookbooks.",            url: "https://blurb.com" },
  { name: "Lulu Press",        desc: "No upfront cost. Strong for academic and niche audiences.",                   url: "https://lulu.com" },
  { name: "BookBaby",          desc: "End-to-end: editing, design, print, and distribution in one place.",          url: "https://bookbaby.com" },
];

const CHECKLIST = [
  { item: "ISBN",                note: "Get your own from Bowker (myidentifiers.com). Free ISBNs from KDP limit your rights." },
  { item: "Copyright",           note: "Register at copyright.gov (~$65). Establishes legal ownership before going to print." },
  { item: "Library of Congress", note: "Free LCCN via loc.gov/publish/pcn. Required for library cataloging." },
  { item: "Interior Layout",     note: "Use Vellum, Atticus, or InDesign. Match your printer's trim size and margin specs exactly." },
  { item: "Cover Design",        note: "Hire a professional. Budget $200–$800. Your cover is your single most important marketing asset." },
];

const PROMO_TIPS = [
  { label: "BookTok",     note: "Film your physical copy unboxing. Read your opening line. Atmosphere beats production value." },
  { label: "Bookstagram", note: "Flat-lay your book with props. Use #bookstagram + genre tags + 3–5 niche community hashtags." },
  { label: "ARCs",        note: "Send advance copies 6–8 weeks before launch to bloggers and reviewers via NetGalley or BookSirens." },
  { label: "Newsletter",  note: "Email outperforms every social channel. Offer a free chapter as a lead magnet." },
  { label: "Signing",     note: "Host an event at a local independent bookstore. Small events create lasting word-of-mouth." },
];

const GENRES = ["Fiction","Literary Fiction","Mystery","Thriller","Romance","Sci-Fi",
  "Fantasy","Horror","Non-Fiction","Biography","Memoir","Self-Help","Business","History","YA"];

// ── Shared atoms ───────────────────────────────────────────────────────────────
const inputBase = {
  width: "100%", boxSizing: "border-box",
  background: "#fff", color: C.text,
  border: `1px solid ${C.border}`, borderRadius: "3px",
  padding: "9px 12px", fontSize: "13px",
  fontFamily: "var(--font-sans)", outline: "none",
};

function Btn({ label, onClick, variant = "ghost", loading, disabled, small, style: sx = {} }) {
  const v = {
    ghost:   { bg: "#fff",    color: C.sub,  border: C.border },
    primary: { bg: C.black,   color: "#fff", border: C.black },
    outline: { bg: "#fff",    color: C.text, border: C.border2 },
  }[variant] || { bg: "#fff", color: C.sub, border: C.border };
  return (
    <button onClick={onClick} disabled={loading || disabled}
      style={{
        padding: small ? "5px 10px" : "8px 16px",
        fontSize: small ? "11px" : "12px", fontWeight: "500", letterSpacing: "0.04em",
        background: v.bg, color: loading ? C.ghost : v.color,
        border: `1px solid ${v.border}`, borderRadius: "3px",
        cursor: loading || disabled ? "default" : "pointer",
        opacity: disabled ? 0.45 : 1, whiteSpace: "nowrap",
        fontFamily: "var(--font-sans)", transition: "opacity 0.1s", ...sx,
      }}>
      {loading ? "—" : label}
    </button>
  );
}

function Label({ children }) {
  return (
    <div style={{ fontSize: "10px", fontWeight: "600", color: C.ghost,
      textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "6px" }}>
      {children}
    </div>
  );
}

function Rule() { return <div style={{ borderTop: `1px solid ${C.border}` }} />; }

function ResultBox({ text, onCopy }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "3px",
      padding: "14px 16px", fontSize: "13px", lineHeight: "1.8", color: C.text,
      whiteSpace: "pre-wrap", maxHeight: "320px", overflowY: "auto" }}>
      {text}
      {onCopy && (
        <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: `1px solid ${C.border}` }}>
          <Btn label="Copy" onClick={onCopy} small />
        </div>
      )}
    </div>
  );
}

function Empty({ text }) {
  return (
    <div style={{ padding: "60px 24px", textAlign: "center", color: C.ghost, fontSize: "13px" }}>
      {text}
    </div>
  );
}

function Thinking({ text }) {
  return (
    <div style={{ padding: "36px", textAlign: "center", color: C.sub, fontSize: "13px" }}>
      <div style={{ fontSize: "18px", letterSpacing: "0.3em", marginBottom: "8px" }}>···</div>
      {text}
    </div>
  );
}

function SectionHead({ title }) {
  return (
    <div style={{ fontSize: "10px", fontWeight: "700", color: C.ghost,
      textTransform: "uppercase", letterSpacing: "0.14em", padding: "14px 20px 10px" }}>
      {title}
    </div>
  );
}

function InfoRow({ label: l, note, url }) {
  return (
    <div style={{ padding: "13px 20px", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "13px", fontWeight: "500", color: C.text }}>{l}</span>
        {url && <a href={url} style={{ fontSize: "11px", color: C.sub, textDecoration: "none" }}>Visit →</a>}
      </div>
      <div style={{ fontSize: "12px", color: C.sub, lineHeight: "1.6" }}>{note}</div>
    </div>
  );
}

function Box({ children, style: sx = {} }) {
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: "3px", marginBottom: "14px", ...sx }}>
      {children}
    </div>
  );
}

// ── No-Key screen ─────────────────────────────────────────────────────────────
function NoKey() {
  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: C.bg, fontFamily: "var(--font-sans)" }}>
      <div style={{ width: "340px", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: "28px", color: C.text,
          letterSpacing: "-0.02em", marginBottom: "10px" }}>Manuscript</div>
        <div style={{ fontSize: "13px", color: C.sub, lineHeight: "1.7" }}>
          <code style={{ background: C.panel, padding: "2px 6px", borderRadius: "3px",
            fontSize: "12px", border: `1px solid ${C.border}` }}>GROQ_API_KEY</code>
          {" "}is not set.<br />
          Add it to your Cloudflare Pages environment variables and redeploy.
        </div>
      </div>
    </div>
  );
}

// ── Write Tab ─────────────────────────────────────────────────────────────────
function WriteTab({ apiKey, chapters, setChapters, activeId, setActiveId }) {
  const [prompt, setPrompt] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  const ch = chapters.find(c => c.id === activeId) || chapters[0];
  const total = chapters.reduce((s, c) => s + wc(c.content), 0);

  const setContent = v => setChapters(cs => cs.map(c => c.id === ch.id ? { ...c, content: v } : c));

  const addCh = () => {
    const id = Date.now();
    setChapters(cs => [...cs, { id, title: `Chapter ${cs.length + 1}`, content: "" }]);
    setActiveId(id);
  };

  const delCh = (id) => {
    if (chapters.length === 1) return;
    const rest = chapters.filter(c => c.id !== id);
    setChapters(rest);
    if (activeId === id) setActiveId(rest[0].id);
  };

  const renameCh = (id, val) => {
    setChapters(cs => cs.map(c => c.id === id ? { ...c, title: val || c.title } : c));
    setEditId(null);
  };

  const assist = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setSuggestion("");
    try {
      const r = await groq(apiKey,
        "You are a skilled creative writing assistant. Match the author's tone. Give content, not commentary.",
        `Current chapter:\n${ch.content || "(empty)"}\n\nRequest: ${prompt}`
      );
      setSuggestion(r);
    } catch (e) { setSuggestion("Error: " + e.message); }
    finally { setLoading(false); }
  };

  const insert = () => {
    setContent((ch.content || "") + (ch.content ? "\n\n" : "") + suggestion);
    setSuggestion(""); setPrompt("");
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Chapter sidebar */}
      <div style={{ width: "190px", flexShrink: 0, borderRight: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column", background: C.panel }}>
        <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between",
          alignItems: "center", borderBottom: `1px solid ${C.border}` }}>
          <Label>Chapters</Label>
          <button onClick={addCh} style={{ background: "none", border: "none", color: C.sub,
            cursor: "pointer", fontSize: "20px", lineHeight: 1, padding: 0 }}>+</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {chapters.map(c => (
            <div key={c.id} onClick={() => setActiveId(c.id)}
              style={{ padding: "10px 16px", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "space-between", gap: "6px",
                background: c.id === activeId ? "#fff" : "transparent",
                borderBottom: `1px solid ${C.border}` }}>
              {editId === c.id ? (
                <input autoFocus defaultValue={c.title}
                  style={{ background: "transparent", border: "none", color: C.text,
                    fontSize: "12px", width: "100%", outline: "none", fontFamily: "var(--font-sans)" }}
                  onBlur={e => renameCh(c.id, e.target.value)}
                  onKeyDown={e => e.key === "Enter" && renameCh(c.id, e.target.value)}
                  onClick={e => e.stopPropagation()} />
              ) : (
                <span style={{ fontSize: "12px", color: c.id === activeId ? C.text : C.sub,
                  flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  fontWeight: c.id === activeId ? "500" : "400" }}
                  onDoubleClick={e => { e.stopPropagation(); setEditId(c.id); }}>
                  {c.title}
                </span>
              )}
              <div style={{ display: "flex", gap: "4px", alignItems: "center", flexShrink: 0 }}>
                <span style={{ fontSize: "10px", color: C.ghost }}>{wc(c.content)}</span>
                {chapters.length > 1 &&
                  <button onClick={e => { e.stopPropagation(); delCh(c.id); }}
                    style={{ background: "none", border: "none", color: C.ghost,
                      cursor: "pointer", fontSize: "13px", lineHeight: 1, padding: "0 1px" }}>×</button>}
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "11px 16px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: "11px", color: C.sub }}>
            {total.toLocaleString()} words total
          </div>
        </div>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "12px 32px", borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontFamily: "var(--font-serif)", fontSize: "16px",
            color: C.text, flex: 1, fontWeight: "400" }}>{ch?.title}</span>
          <span style={{ fontSize: "11px", color: C.ghost }}>
            {wc(ch?.content || "").toLocaleString()} words
          </span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "44px 96px 24px", background: C.bg }}>
          <textarea
            value={ch?.content || ""}
            onChange={e => setContent(e.target.value)}
            placeholder="Start writing…"
            style={{ width: "100%", minHeight: "56vh", background: "transparent", color: C.text,
              border: "none", outline: "none", resize: "none", fontSize: "18px", lineHeight: "2.1",
              fontFamily: "var(--font-serif)", boxSizing: "border-box", caretColor: C.black }} />
        </div>
        {/* AI bar */}
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 20px",
          background: C.panel, display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <input value={prompt} onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === "Enter" && assist()}
              placeholder="Ask AI — 'write a scene where…' or 'continue from here'"
              style={{ ...inputBase, flex: 1 }} />
            <Btn label="Generate" onClick={assist} loading={loading} variant="primary" />
          </div>
          {loading && <Thinking text="Writing…" />}
          {suggestion && !loading && (
            <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: "3px", padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "10px", fontWeight: "600", color: C.ghost,
                  textTransform: "uppercase", letterSpacing: "0.12em" }}>Suggestion</span>
                <div style={{ display: "flex", gap: "6px" }}>
                  <Btn label="Insert" onClick={insert} small variant="primary" />
                  <Btn label="Copy" onClick={() => navigator.clipboard.writeText(suggestion)} small />
                  <Btn label="Discard" onClick={() => setSuggestion("")} small />
                </div>
              </div>
              <div style={{ fontSize: "13px", color: C.text, lineHeight: "1.8",
                whiteSpace: "pre-wrap", maxHeight: "160px", overflowY: "auto" }}>
                {suggestion}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Proofread Tab ─────────────────────────────────────────────────────────────
function ProofreadTab({ apiKey, chapters, activeId }) {
  const [loading, setLoading] = useState("");
  const [result, setResult] = useState(null);
  const ch = chapters.find(c => c.id === activeId) || chapters[0];

  const run = async (type) => {
    if (!ch?.content?.trim()) return;
    const p = {
      grammar: "Grammar, spelling, and punctuation check. List every specific error and its correction, organized by type.",
      style:   "Style analysis: passive voice, weak words, repetition, pacing issues, show-vs-tell. Give concrete examples.",
      full:    "Full editorial review: 1) Grammar & Mechanics  2) Style & Voice  3) Pacing & Structure  4) Strengths  5) Priority Fixes.",
    }[type];
    setLoading(type); setResult(null);
    try {
      const r = await groq(apiKey,
        "You are a senior editor at a top literary agency. Be precise, constructive, and specific.",
        `${p}\n\nText:\n${ch.content}`
      );
      setResult(r);
    } catch (e) { setResult("Error: " + e.message); }
    finally { setLoading(""); }
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: `1px solid ${C.border}` }}>
        <div style={{ padding: "11px 22px", borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "13px", fontWeight: "500", color: C.text, marginRight: "4px" }}>
            {ch?.title}
          </span>
          <Btn label="Grammar" onClick={() => run("grammar")} loading={loading === "grammar"} />
          <Btn label="Style" onClick={() => run("style")} loading={loading === "style"} />
          <Btn label="Full Review" onClick={() => run("full")} loading={loading === "full"} variant="primary" />
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "36px 64px" }}>
          {ch?.content
            ? <div style={{ fontFamily: "var(--font-serif)", fontSize: "15px",
                lineHeight: "2.1", color: C.text, whiteSpace: "pre-wrap" }}>{ch.content}</div>
            : <Empty text="No content yet. Write something first." />}
        </div>
      </div>
      <div style={{ width: "360px", flexShrink: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "11px 20px", borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontSize: "12px", fontWeight: "600", color: C.text }}>Editor Notes</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {loading
            ? <Thinking text="Reading your manuscript…" />
            : result
              ? <>
                  <div style={{ fontSize: "13px", lineHeight: "1.8", color: C.text, whiteSpace: "pre-wrap" }}>{result}</div>
                  <div style={{ marginTop: "14px" }}>
                    <Btn label="Copy" onClick={() => navigator.clipboard.writeText(result)} small />
                  </div>
                </>
              : <Empty text="Choose a review type to get feedback." />}
        </div>
      </div>
    </div>
  );
}

// ── Publish Tab ───────────────────────────────────────────────────────────────
function PublishTab({ apiKey, chapters }) {
  const [meta, setMeta] = useState({ title: "", author: "", genre: "Fiction" });
  const [loading, setLoading] = useState("");
  const [result, setResult] = useState(null);
  const [resLabel, setResLabel] = useState("");
  const allText = chapters.map(c => c.content).join("\n\n");

  const gen = async (type) => {
    const cfg = {
      blurb:    { label: "Back Cover Blurb", prompt: "Write a compelling 150–200 word back-cover blurb." },
      query:    { label: "Query Letter",      prompt: "Write a professional query letter to literary agents (300–400 words)." },
      synopsis: { label: "Synopsis",          prompt: "Write a 2-page synopsis (600–800 words) for literary agents." },
    }[type];
    setLoading(type); setResult(null); setResLabel(cfg.label);
    try {
      const r = await groq(apiKey,
        "You are a literary agent and publishing consultant. Write with precision and commercial awareness.",
        `${cfg.prompt}\n\nTitle: "${meta.title || "Untitled"}"\nAuthor: ${meta.author || "the author"}\nGenre: ${meta.genre}\n\nSample:\n${allText.substring(0, 2500) || "(no content)"}`
      );
      setResult(r);
    } catch (e) { setResult("Error: " + e.message); }
    finally { setLoading(""); }
  };

  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "28px 32px" }}>
        <Box>
          <SectionHead title="Book Details" />
          <Rule />
          <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <Label>Title</Label>
                <input value={meta.title} onChange={e => setMeta(m => ({...m, title: e.target.value}))}
                  placeholder="Your book title" style={inputBase} />
              </div>
              <div>
                <Label>Author</Label>
                <input value={meta.author} onChange={e => setMeta(m => ({...m, author: e.target.value}))}
                  placeholder="Your name" style={inputBase} />
              </div>
            </div>
            <Label>Genre</Label>
            <select value={meta.genre} onChange={e => setMeta(m => ({...m, genre: e.target.value}))} style={inputBase}>
              {GENRES.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
        </Box>

        <Box>
          <SectionHead title="Generate Documents" />
          <Rule />
          <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
              <Btn label="Back Cover Blurb" onClick={() => gen("blurb")} loading={loading === "blurb"} variant="primary" />
              <Btn label="Query Letter" onClick={() => gen("query")} loading={loading === "query"} />
              <Btn label="Synopsis" onClick={() => gen("synopsis")} loading={loading === "synopsis"} />
            </div>
            {loading ? <Thinking text="Drafting your document…" /> : result && (
              <>
                <Label>{resLabel}</Label>
                <ResultBox text={result} onCopy={() => navigator.clipboard.writeText(result)} />
              </>
            )}
          </div>
        </Box>

        <Box>
          <SectionHead title="Physical Publishing Platforms" />
          <Rule />
          {PUBLISH_PLATFORMS.map(p => <InfoRow key={p.name} label={p.name} note={p.desc} url={p.url} />)}
        </Box>

        <Box>
          <SectionHead title="Pre-Print Checklist" />
          <Rule />
          {CHECKLIST.map(i => <InfoRow key={i.item} label={i.item} note={i.note} />)}
        </Box>
      </div>
    </div>
  );
}

// ── Promote Tab ───────────────────────────────────────────────────────────────
function PromoteTab({ apiKey, chapters }) {
  const [selected, setSelected] = useState(["instagram", "twitter", "linkedin"]);
  const [desc, setDesc] = useState("");
  const [posts, setPosts] = useState({});
  const [loading, setLoading] = useState(false);
  const allText = chapters.map(c => c.content).join("\n\n");

  const toggle = id => setSelected(s => s.includes(id) ? s.filter(p => p !== id) : [...s, id]);

  const generate = async () => {
    if (!selected.length) return;
    setLoading(true); setPosts({});
    try {
      const r = await groq(apiKey,
        "You are a book marketing expert. Return ONLY valid JSON, no markdown or explanation.",
        `Generate social media posts for a newly published physical book.

About: ${desc || allText.substring(0, 500) || "A compelling book."}
Platforms: ${selected.join(", ")}

Platform rules:
- instagram: 150–250 chars + 5 hashtags. Visual, emotional.
- twitter: Max 230 chars. One sharp hook.
- linkedin: 200–350 chars. Focus on the author's journey. Professional.
- facebook: 100–180 chars. Warm and conversational.
- tiktok: Energetic caption. Hook first. 100–180 chars.

Return ONLY a JSON object with platform names as keys.`,
        800
      );
      try {
        const clean = r.replace(/```json|```/g, "").trim();
        setPosts(JSON.parse(clean));
      } catch { setPosts({ _raw: r }); }
    } catch (e) { setPosts({ _error: e.message }); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "28px 32px" }}>
        <Box>
          <SectionHead title="Configure" />
          <Rule />
          <div style={{ padding: "16px 20px" }}>
            <div style={{ marginBottom: "14px" }}>
              <Label>Book Description (optional)</Label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3}
                placeholder="Describe your book… (leave blank to use your manuscript)"
                style={{ ...inputBase, resize: "vertical", lineHeight: "1.65" }} />
            </div>
            <Label>Platforms</Label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
              {PLATFORMS.map(p => (
                <button key={p.id} onClick={() => toggle(p.id)}
                  style={{ padding: "6px 14px", borderRadius: "2px", cursor: "pointer",
                    border: `1px solid ${selected.includes(p.id) ? C.border2 : C.border}`,
                    background: selected.includes(p.id) ? C.black : "#fff",
                    color: selected.includes(p.id) ? "#fff" : C.sub,
                    fontSize: "12px", fontFamily: "var(--font-sans)" }}>
                  {p.label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Btn label="Generate Posts" onClick={generate} loading={loading}
                variant="primary" disabled={!selected.length} />
            </div>
          </div>
        </Box>

        {loading && <Thinking text="Crafting your posts…" />}

        {posts._error && (
          <Box><div style={{ padding: "14px 20px", fontSize: "13px", color: C.sub }}>{posts._error}</div></Box>
        )}

        {posts._raw && (
          <Box><div style={{ padding: "16px 20px" }}>
            <ResultBox text={posts._raw} onCopy={() => navigator.clipboard.writeText(posts._raw)} />
          </div></Box>
        )}

        {!posts._raw && !posts._error &&
          PLATFORMS.filter(p => selected.includes(p.id) && posts[p.id]).map(p => (
            <Box key={p.id}>
              <div style={{ padding: "11px 20px", borderBottom: `1px solid ${C.border}`,
                display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: "600", color: C.text }}>{p.label}</span>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", color: C.ghost }}>{posts[p.id]?.length} chars</span>
                  <Btn label="Copy" onClick={() => navigator.clipboard.writeText(posts[p.id])} small />
                </div>
              </div>
              <div style={{ padding: "14px 20px", fontSize: "13px", color: C.text,
                lineHeight: "1.8", whiteSpace: "pre-wrap" }}>
                {posts[p.id]}
              </div>
            </Box>
          ))
        }

        <Box>
          <SectionHead title="Launch Playbook" />
          <Rule />
          {PROMO_TIPS.map(t => <InfoRow key={t.label} label={t.label} note={t.note} />)}
        </Box>
      </div>
    </div>
  );
}

// ── Save helper ───────────────────────────────────────────────────────────────
function saveManuscript(chapters) {
  const lines = chapters.flatMap(c => [
    `${"═".repeat(60)}`,
    `  ${c.title.toUpperCase()}`,
    `${"═".repeat(60)}`,
    "",
    c.content.trim() || "(empty)",
    "",
  ]);
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "manuscript.txt";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || "";
  const [tab, setTab] = useState("write");
  const [chapters, setChapters] = useState([{ id: 1, title: "Chapter 1", content: "" }]);
  const [activeId, setActiveId] = useState(1);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const handleSave = () => {
    saveManuscript(chapters);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!apiKey) return <NoKey />;

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg,
      color: C.text, fontFamily: "var(--font-sans)", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "44px", zIndex: 10,
        borderBottom: `1px solid ${C.border}`, background: C.bg,
        display: "flex", alignItems: "center" }}>

        {/* Logo + wordmark */}
        <div style={{ padding: "0 16px 0 14px", height: "100%", display: "flex",
          alignItems: "center", gap: "10px", borderRight: `1px solid ${C.border}`,
          minWidth: "190px", flexShrink: 0 }}>
          <img src="/logo.png" alt="Manuscript" width={24} height={24}
            style={{ borderRadius: "5px", flexShrink: 0 }} />
          <span style={{ fontFamily: "var(--font-serif)", fontSize: "15px", color: C.text }}>
            Manuscript
          </span>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", height: "100%" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: "0 22px", height: "100%", background: "none", border: "none",
                borderRight: `1px solid ${C.border}`,
                borderBottom: tab === t.id ? `2px solid ${C.black}` : "2px solid transparent",
                color: tab === t.id ? C.text : C.sub, cursor: "pointer",
                fontSize: "12px", fontWeight: tab === t.id ? "600" : "400",
                fontFamily: "var(--font-sans)", letterSpacing: "0.02em" }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Save button */}
        <button onClick={handleSave}
          style={{ padding: "0 18px", height: "100%", background: "none", border: "none",
            borderLeft: `1px solid ${C.border}`,
            color: saved ? C.sub : C.text, cursor: "pointer",
            fontSize: "12px", fontWeight: "500", fontFamily: "var(--font-sans)",
            display: "flex", alignItems: "center", gap: "6px", transition: "color 0.2s" }}>
          {/* floppy-disk icon */}
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/>
            <rect x="4" y="1" width="6" height="5" rx="0.5" fill="currentColor"/>
            <rect x="3" y="8" width="10" height="6" rx="0.5" fill="currentColor"/>
            <rect x="5" y="9.5" width="2" height="3" rx="0.3" fill={C.bg}/>
          </svg>
          {saved ? "Saved!" : "Save"}
        </button>

        {/* Install button — only shown when PWA prompt is available */}
        {installPrompt && (
          <button onClick={handleInstall}
            style={{ padding: "0 18px", height: "100%", background: C.black, border: "none",
              borderLeft: `1px solid ${C.border}`,
              color: "#fff", cursor: "pointer",
              fontSize: "12px", fontWeight: "500", fontFamily: "var(--font-sans)",
              display: "flex", alignItems: "center", gap: "6px" }}>
            {/* download icon */}
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path d="M8 1v9M4.5 7l3.5 3.5L11.5 7" stroke="currentColor"
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Install
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, marginTop: "44px", overflow: "hidden", display: "flex" }}>
        {tab === "write"   && <WriteTab   apiKey={apiKey} chapters={chapters} setChapters={setChapters} activeId={activeId} setActiveId={setActiveId} />}
        {tab === "proof"   && <ProofreadTab apiKey={apiKey} chapters={chapters} activeId={activeId} />}
        {tab === "publish" && <PublishTab  apiKey={apiKey} chapters={chapters} />}
        {tab === "promote" && <PromoteTab  apiKey={apiKey} chapters={chapters} />}
      </div>
    </div>
  );
}
